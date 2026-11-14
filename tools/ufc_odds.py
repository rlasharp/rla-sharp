"""🥊 UFC odds from the PropLine feed: moneyline, method of victory, goes the distance, total rounds, round betting,
finish / KO / submission props, significant strikes and takedowns. Best price per outcome across licensed US books.
Refreshed at most every 2 hours (and every 30 min on fight day), fights in the next 8 days."""
import datetime as dt
MK = ["h2h", "fight_outcome", "fight_distance", "total_rounds", "round_betting", "player_finish", "player_knockout_win",
      "player_submission_win", "player_significant_strikes", "player_takedowns", "fight_time_minutes"]
def g(o, k, d=None): return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)
def run(client, prev, used, cap, BOOK_NAME, NOT_BOOKS):
    P = prev.get("ufc") or {}
    now = dt.datetime.now(dt.timezone.utc)
    last = P.get("at")
    try: age = (now - dt.datetime.fromisoformat(last)).total_seconds() if last else 1e9
    except Exception: age = 1e9
    try: evs = client.get_events("mma_ufc"); used += 1
    except Exception as e: print("ufc events failed:", e); return P, used
    soon = []
    for e in evs or []:
        t = g(e, "commence_time")
        try: tt = dt.datetime.fromisoformat(str(t).replace("Z", "+00:00"))
        except Exception: continue
        if tt < now - dt.timedelta(hours=1) or tt > now + dt.timedelta(days=8): continue
        soon.append((tt, e))
    fight_day = any((tt - now).total_seconds() < 14 * 3600 for tt, _ in soon)
    if age < (25 * 60 if fight_day else 2 * 3600): return P, used
    out = {"at": now.isoformat(timespec="seconds"), "fights": []}
    for tt, e in sorted(soon, key=lambda x: x[0]):
        if used >= cap: break
        try: od = client.get_odds("mma_ufc", event_id=g(e, "id"), markets=MK); used += 1
        except Exception as ex: print("ufc odds failed:", g(e, "id"), ex); used += 1; continue
        best = {}
        for bk in g(od, "bookmakers", []) or []:
            b = str(g(bk, "key", "")).lower()
            if b in NOT_BOOKS or b not in BOOK_NAME: continue
            for m in g(bk, "markets", []) or []:
                k = g(m, "key")
                if k not in MK or g(m, "period"): continue
                for oc in g(m, "outcomes", []) or []:
                    pr = g(oc, "price")
                    if pr is None: continue
                    try: pr = int(round(float(pr)))
                    except Exception: continue
                    key = (k, str(g(oc, "name") or ""), str(g(oc, "description") or ""), g(oc, "point"))
                    cur = best.get(key)
                    if not cur or pr > cur[0]: best[key] = [pr, BOOK_NAME[b]]
        if not best: continue
        out["fights"].append({"id": g(e, "id"), "a": g(e, "away_team"), "h": g(e, "home_team"), "t": tt.isoformat(timespec="minutes"),
                              "o": [[k, n, d, p, v[0], v[1]] for (k, n, d, p), v in sorted(best.items(), key=lambda x: (MK.index(x[0][0]), x[0][1], x[0][2], x[0][3] if x[0][3] is not None else 0))]})
    print(f"ufc: {len(out['fights'])} fights with odds ({sum(len(f['o']) for f in out['fights'])} prices)")
    return (out if out["fights"] or not P else P), used
