#!/usr/bin/env python3
"""RLA Sharp live odds: pulls NBA + NFL player props from PropLine into data/live_odds.json.
Runs on GitHub Actions (key in the PROPLINE_API_KEY secret). Real sportsbooks only:
DFS apps and prediction markets are dropped. Main line = first book (in BOOK_PREF order)
that has BOTH over and under at the same line; best over/under = best price among books
at that same line. Keeps the first-seen ("open") line of the day for each prop so the
site can show line moves. Budget-aware for the free plan (1,000 requests/day)."""
import json, os, re, sys, time, datetime as dt
from zoneinfo import ZoneInfo
try:
    from propline import PropLine
except ImportError:
    print("pip install propline first"); sys.exit(1)

ET = ZoneInfo("America/Toronto")
OUT = "data/live_odds.json"
KEY = os.environ.get("PROPLINE_API_KEY", "").strip()
if not KEY:
    print("No PROPLINE_API_KEY secret set"); sys.exit(1)
client = PropLine(KEY)

BOOK_PREF = ["draftkings", "fanduel", "betmgm", "williamhill_us", "caesars", "fanatics", "espnbet", "betrivers",
             "hardrockbet", "unibet"]
BOOK_NAME = {"draftkings": "DraftKings", "fanduel": "FanDuel", "betmgm": "BetMGM", "williamhill_us": "Caesars",
             "caesars": "Caesars", "fanatics": "Fanatics", "espnbet": "ESPN BET", "betrivers": "BetRivers",
             "hardrockbet": "Hard Rock Bet", "unibet": "Unibet"}
NOT_BOOKS = {"prizepicks", "underdog", "pick6", "kalshi", "polymarket", "prophetx", "novig", "smarkets",
             "sleeper", "betr", "dabble", "matchbook", "betfair", "pinnacle",
             "bovada", "betonlineag", "lowvig", "mybookieag", "betus"}  # offshore books: not licensed in US states

NBA_MK = {"player_points": "pts", "player_rebounds": "reb", "player_assists": "ast", "player_threes": "3pm",
          "player_steals": "stl", "player_blocks": "blk", "player_points_rebounds": "pr",
          "player_points_assists": "pa", "player_rebounds_assists": "ra", "player_points_rebounds_assists": "pra"}
NFL_MK = {"player_pass_yds": "passYds", "player_pass_tds": "passTD", "player_rush_yds": "rushYds",
          "player_reception_yds": "recYds", "player_receptions": "rec", "player_anytime_td": "anyTD",
          "player_rush_attempts": "rushAtt", "player_rush_reception_yds": "rushRec",
          "player_pass_completions": "comp", "player_pass_interceptions": "int"}

def g(o, k, d=None):
    return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)

def et_date(iso):
    try:
        t = dt.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        return t.astimezone(ET).strftime("%Y-%m-%d"), t
    except Exception:
        return None, None

def load_prev():
    try:
        with open(OUT) as f: return json.load(f)
    except Exception: return {}

def pick(book_rows):
    """book_rows: {book: {line: {"Over": price, "Under": price}}} -> main + best."""
    for b in BOOK_PREF:
        lines = book_rows.get(b) or {}
        two = [ln for ln, s in lines.items() if "Over" in s and "Under" in s]
        if not two: continue
        # the book's main line = the one whose prices are closest to even
        ln = min(two, key=lambda x: abs(abs(lines[x]["Over"]) - abs(lines[x]["Under"])))
        o, u = lines[ln]["Over"], lines[ln]["Under"]
        bo, bob, bu, bub = o, b, u, b
        for b2, l2 in book_rows.items():
            s = l2.get(ln) or {}
            if "Over" in s and s["Over"] > bo: bo, bob = s["Over"], b2
            if "Under" in s and s["Under"] > bu: bu, bub = s["Under"], b2
        return ln, o, u, b, bo, bob, bu, bub
    return None

def pick_yes(book_rows):
    """anytime TD: Yes/Over price only."""
    for b in BOOK_PREF:
        for ln, s in (book_rows.get(b) or {}).items():
            if "Over" in s:
                best, bb = s["Over"], b
                for b2, l2 in book_rows.items():
                    p = (l2.get(ln) or {}).get("Over")
                    if p is not None and p > best: best, bb = p, b2
                return ln, s["Over"], None, b, best, bb, None, None
    return None

def fetch_sport(sport, mk_map, window_h, prev_open, used):
    try:
        events = client.get_events(sport)
    except Exception as e:
        print(f"{sport}: events failed: {e}"); return [], [], used
    used += 1
    now = dt.datetime.now(dt.timezone.utc)
    rows, evs = [], []
    for ev in events or []:
        start = g(ev, "commence_time")
        d, t = et_date(start)
        if not t or t < now or (t - now).total_seconds() > window_h * 3600:
            continue  # started already, or too far out
        eid = g(ev, "id")
        evs.append({"id": eid, "home": g(ev, "home_team"), "away": g(ev, "away_team"), "start": start, "date": d})
        try:
            odds = client.get_odds(sport, event_id=eid, markets=list(mk_map))
        except Exception as e:
            print(f"{sport} {eid}: odds failed: {e}"); continue
        used += 1
        props = {}  # (player, mk) -> {book: {line: {Over/Under: price}}}
        for bk in g(odds, "bookmakers", []) or []:
            b = str(g(bk, "key", "")).lower()
            if b in NOT_BOOKS or b not in BOOK_NAME: continue
            for m in g(bk, "markets", []) or []:
                mk = mk_map.get(g(m, "key"))
                if not mk: continue
                for oc in g(m, "outcomes", []) or []:
                    if g(oc, "payout_multiplier") not in (None, 1, 1.0): continue
                    name = str(g(oc, "name", "")); player = g(oc, "description")
                    side = "Over" if name.lower() in ("over", "yes") else "Under" if name.lower() in ("under", "no") else None
                    price, point = g(oc, "price"), g(oc, "point")
                    if player: player = re.sub(r"\s*\([A-Z]{2,4}\)\s*$", "", str(player)).strip()
                    if not player or not side or price is None: continue
                    if point is None: point = 0.5
                    try: price = int(round(float(price))); point = float(point)
                    except Exception: continue
                    props.setdefault((player, mk), {}).setdefault(b, {}).setdefault(point, {})[side] = price
        for (player, mk), br in props.items():
            r = pick_yes(br) if mk == "anyTD" else pick(br)
            if not r: continue
            ln, o, u, b, bo, bob, bu, bub = r
            key = f"{eid}|{player}|{mk}"
            op = prev_open.get(key) or [ln, o, u]
            rows.append([player, mk, ln, o, u, BOOK_NAME[b],
                         bo if bob != b else None, BOOK_NAME.get(bob) if bob != b else None,
                         bu if (bub and bub != b) else None, BOOK_NAME.get(bub) if (bub and bub != b) else None,
                         op[0], op[1], op[2], eid])
            prev_open[key] = op
    return evs, rows, used

def save_close(sport_key, evs, rows, stamp):
    """Closing lines: every run overwrites the latest PRE-GAME line per prop (rows only hold games that
    haven't started), so the last write before tip-off is the close. One small file per ET game date."""
    by_ev = {str(e["id"]): e.get("date") for e in evs}
    per = {}
    for r in rows:
        d = by_ev.get(str(r[13]))
        if d: per.setdefault(d, {})[f"{sport_key}|{r[0]}|{r[1]}"] = [r[2], r[3], r[4], r[5], stamp]
    os.makedirs("data/close", exist_ok=True)
    for d, m in per.items():
        f = f"data/close/{d}.json"
        try:
            with open(f) as fh: cur = json.load(fh)
        except Exception: cur = {}
        cur.update(m)
        with open(f, "w") as fh: json.dump(cur, fh, separators=(",", ":"), ensure_ascii=False)
    # keep ~60 days
    cutoff = (dt.datetime.now(ET) - dt.timedelta(days=60)).strftime("%Y-%m-%d")
    for fn in os.listdir("data/close"):
        if fn.endswith(".json") and fn[:10] < cutoff: os.remove(os.path.join("data/close", fn))

def main():
    prev = load_prev()
    today = dt.datetime.now(ET).strftime("%Y-%m-%d")
    budget = prev.get("budget") or {}
    if budget.get("day") != today: budget = {"day": today, "used": 0}
    opens = prev.get("open") or {}
    out = {"updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "source": "PropLine",
           "nba": prev.get("nba") or {}, "nfl": prev.get("nfl") or {}}
    used = budget["used"]
    # NBA: every run (games in the next 30 hours). NFL: at most every 3 hours (games in the next 8 days).
    if used < 900:
        evs, rows, used = fetch_sport("basketball_nba", NBA_MK, 30, opens, used)
        if evs or rows: out["nba"] = {"at": out["updated"], "events": evs, "props": rows}
        try: save_close("nba", evs, rows, out["updated"])
        except Exception as e: print("close (nba) failed:", e)
    last_nfl = (prev.get("nfl") or {}).get("at")
    stale = True
    if last_nfl:
        try: stale = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(last_nfl)).total_seconds() > 3 * 3600
        except Exception: stale = True
    if stale and used < 900:
        evs, rows, used = fetch_sport("football_nfl", NFL_MK, 8 * 24, opens, used)
        if evs or rows: out["nfl"] = {"at": out["updated"], "events": evs, "props": rows}
        try: save_close("nfl", evs, rows, out["updated"])
        except Exception as e: print("close (nfl) failed:", e)
    keep = {e["id"] for s in ("nba", "nfl") for e in (out[s].get("events") or [])}
    out["open"] = {k: v for k, v in opens.items() if k.split("|")[0] in {str(x) for x in keep}}
    out["budget"] = {"day": today, "used": used}
    os.makedirs("data", exist_ok=True)
    with open(OUT, "w") as f: json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print(f"NBA {len(out['nba'].get('props') or [])} props / {len(out['nba'].get('events') or [])} games; "
          f"NFL {len(out['nfl'].get('props') or [])} props / {len(out['nfl'].get('events') or [])} games; "
          f"requests today {used}")

if __name__ == "__main__":
    main()
