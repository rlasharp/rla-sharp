"""🏈🏀 College odds from the PropLine feed: game lines (moneyline, spread, total) and game lines for college football
(FBS) and men's college basketball. Uses the focus list written by src/tools/collegefetch.py (ranked teams first, then
power conferences) and a small share of the day's request budget: each game is refreshed at most every 6 hours (every
90 min once it is within 6 hours of tip/kickoff), a few games per run.
Output: live_odds.json -> "cfb" / "cbb": {at, ev: {espnId: {at, a, h, t, ml, sp, tot, props: [[market, player, line, over, under, book over, book under]]}}}"""
import datetime as dt, json, os
SPORTS = {"cfb": ("football_ncaaf", ["h2h", "spreads", "totals"], 5, 4),
          "cbb": ("basketball_ncaab", ["h2h", "spreads", "totals"], 2, 6)}
def g(o, k, d=None): return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)
def ts(s):
    try: return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception: return None
def run(client, prev, used, cap, BOOK_NAME, NOT_BOOKS, root="."):
    out = {}
    now = dt.datetime.now(dt.timezone.utc)
    for key, (sk, MK, days, per_run) in SPORTS.items():
        P = prev.get(key) or {}; EV = {k: v for k, v in (P.get("ev") or {}).items() if (ts(v.get("t")) or now) > now - dt.timedelta(hours=6)}
        try: focus = json.load(open(os.path.join(root, f"data/{key}_focus.json"))).get("ids") or []
        except Exception: focus = []
        if used >= cap or not focus: out[key] = {"at": P.get("at"), "ev": EV}; continue
        try: evs = client.get_events(sk); used += 1
        except Exception as e: print(f"{key} events failed:", e); out[key] = {"at": P.get("at"), "ev": EV}; continue
        by = {str(g(e, "espn_event_id")): e for e in evs or [] if g(e, "espn_event_id")}
        todo = []
        for eid in focus:
            e = by.get(str(eid))
            if not e: continue
            t = ts(g(e, "commence_time"))
            if not t or t < now or t > now + dt.timedelta(days=days): continue
            old = EV.get(str(eid)); age = (now - ts(old["at"])).total_seconds() if old and old.get("at") else 1e9
            soon = (t - now).total_seconds() < 6 * 3600
            if age < (90 * 60 if soon else 6 * 3600): continue
            todo.append((eid, e, t))
        n = 0
        for eid, e, t in todo:
            if used >= cap or n >= per_run: break
            try: od = client.get_odds(sk, event_id=g(e, "id"), markets=MK); used += 1; n += 1
            except Exception as ex: print(f"{key} odds failed:", eid, ex); used += 1; n += 1; continue
            best = {}; lines = {}
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
                        nm, desc, pt = str(g(oc, "name") or ""), str(g(oc, "description") or ""), g(oc, "point")
                        kk = (k, nm, desc, pt); cur = best.get(kk)
                        if not cur or pr > cur[0]: best[kk] = [pr, BOOK_NAME[b]]
                        lines.setdefault((k, desc or nm), {}).setdefault(pt, set()).add(b)
            A, H = g(e, "away_team"), g(e, "home_team")
            rec = {"at": now.isoformat(timespec="seconds"), "a": A, "h": H, "t": t.isoformat(timespec="minutes"), "props": []}
            def side(k, nm, pt):
                v = best.get((k, nm, "", pt)) or best.get((k, nm, nm, pt)); return v
            ml = [side("h2h", A, None), side("h2h", H, None)]
            if ml[0] or ml[1]: rec["ml"] = [x[0] if x else None for x in ml]
            # spread / total: the point most books post (the main line), best price at that point
            def main(k, who):
                L = lines.get((k, who)) or {}
                return max(L.items(), key=lambda kv: len(kv[1]))[0] if L else None
            hp = main("spreads", H)
            if hp is not None:
                a_ = best.get(("spreads", A, "", -hp)); h_ = best.get(("spreads", H, "", hp))
                rec["sp"] = [hp, a_[0] if a_ else None, h_[0] if h_ else None]
            tp = main("totals", "Over")
            if tp is not None:
                o_ = best.get(("totals", "Over", "", tp)); u_ = best.get(("totals", "Under", "", tp))
                rec["tot"] = [tp, o_[0] if o_ else None, u_[0] if u_ else None]
            # player props: main line per player/market, best over and under at it
            for (k, who), L in lines.items():
                if not k.startswith("player_"): continue
                pt = max(L.items(), key=lambda kv: len(kv[1]))[0]
                if k == "player_anytime_td":
                    y = best.get((k, "Yes", who, None)) or best.get((k, who, "", None))
                    if y: rec["props"].append([k, who, 0.5, y[0], None, y[1], None])
                    continue
                o_ = best.get((k, "Over", who, pt)); u_ = best.get((k, "Under", who, pt))
                if o_ or u_: rec["props"].append([k, who, pt, o_[0] if o_ else None, u_[0] if u_ else None, o_[1] if o_ else None, u_[1] if u_ else None])
            EV[str(eid)] = rec
        out[key] = {"at": now.isoformat(timespec="seconds") if n else P.get("at"), "ev": EV}
        print(f"{key}: {n} games refreshed, {len(EV)} with odds, {sum(len(v.get('props') or []) for v in EV.values())} props")
    return out, used
