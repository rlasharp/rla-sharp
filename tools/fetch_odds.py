#!/usr/bin/env python3
"""RLA Sharp live odds: pulls NBA + NFL player props from PropLine into data/live_odds.json.
Runs on GitHub Actions (key in the PROPLINE_API_KEY secret). Real sportsbooks only:
DFS apps and prediction markets are dropped. Main line = first book (in BOOK_PREF order)
that has BOTH over and under at the same line; best over/under = best price among books
at that same line. Keeps the first-seen ("open") line of the day for each prop so the
site can show line moves. Row index 14 = alternate lines [[line, over, overBook, under, underBook], ...]
(or null). Budget-aware for the free plan (1,000 requests/day)."""
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

NHL_MK = {"player_points": "hpts", "player_goals": "hgoals", "player_assists": "hast", "player_shots_on_goal": "hsog",
          "player_blocked_shots": "hblk", "player_total_saves": "hsaves", "player_power_play_points": "hppp",
          "player_goal_scorer_anytime": "hanyG", "player_hits": "hhit", "player_faceoffs_won": "hfow",
          "goalie_saves": "hsaves"}
NHL_CORE = ["player_points", "player_goals", "player_assists", "player_shots_on_goal", "player_blocked_shots", "goalie_saves"]
GAME_MK = ["h2h", "spreads", "totals"]
PERIOD_OK = [True]
YES_MK = {"anyTD", "hanyG"}  # one-sided Yes markets (no under, no alt ladder)
MKSAMPLE = {}
MKSEEN = {}  # market keys the feed returned, per sport (run log)

def game_lines(odds, home, away, period=None):
    """moneyline / total / puck line (spread) from the first preferred book that has each market.
    period=None -> full game; "p1" -> 1st period (rows carry a `period` field when the feed was asked for period=all)."""
    by = {}
    for bk in g(odds, "bookmakers", []) or []:
        b = str(g(bk, "key", "")).lower()
        if b in NOT_BOOKS or b not in BOOK_NAME: continue
        for m in g(bk, "markets", []) or []:
            k = g(m, "key")
            if k not in GAME_MK: continue
            if (g(m, "period") or None) != period: continue
            if str(g(m, "line_type", "main") or "main") not in ("main", ""): continue
            oc = {}
            for o in g(m, "outcomes", []) or []:
                oc[str(g(o, "name", ""))] = (g(o, "price"), g(o, "point"))
            by.setdefault(k, {}).setdefault(b, []).append(oc)
    even = lambda oc, a, b_: abs(abs(oc[a][0] or 0) - abs(oc[b_][0] or 0))
    def best(k, b, a, b_, want=None):
        L = [oc for oc in (by.get(k) or {}).get(b) or [] if a in oc and b_ in oc and oc[a][0] is not None and oc[b_][0] is not None]
        if want is not None:
            W = [oc for oc in L if oc[b_][1] is not None and abs(oc[b_][1]) == want]
            if W: L = W
        return min(L, key=lambda oc: even(oc, a, b_)) if L else None
    out = {}
    for b in BOOK_PREF:
        oc = best("h2h", b, home, away)
        if oc and "ml" not in out:
            out["ml"] = [oc[away][0], oc[home][0], BOOK_NAME[b]] + ([oc["Draw"][0]] if "Draw" in oc else [])
        oc = best("totals", b, "Over", "Under")
        if oc and "tot" not in out:
            out["tot"] = [oc["Over"][1], oc["Over"][0], oc["Under"][0], BOOK_NAME[b]]
        oc = best("spreads", b, away, home, 1.5 if period is None else None)
        if oc and "pl" not in out:
            out["pl"] = [oc[home][1], oc[away][0], oc[home][0], BOOK_NAME[b]]
    return out

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

DIAG = {}  # line_type counts, for the run log
ALT_MAX = 10  # alternate lines kept per prop (the ones closest to the main line)

def alts(book_rows, main_ln, milestones=None):
    """Alternate lines: every other line any real book posts for this player+market (PropLine returns
    alt lines as extra points under the same market key, so this costs no extra requests).
    -> [[line, bestOver, overBook, bestUnder, underBook], ...] sorted by line. Prices outside
    -2000..+2000 are dropped (near-certain / lottery rungs and stale relists)."""
    best = {}
    for b, lines in book_rows.items():
        for ln, s in lines.items():
            if ln == main_ln: continue
            cur = best.setdefault(ln, [None, None, None, None])
            for i, side in ((0, "Over"), (2, "Under")):
                p = s.get(side)
                if p is None or p < -2000 or p > 2000: continue
                if cur[i] is None or p > cur[i]: cur[i], cur[i + 1] = p, BOOK_NAME[b]
    for b, lines in (milestones or {}).items():
        for ln, p in lines.items():
            if ln == main_ln or p < -2000 or p > 2000: continue
            cur = best.setdefault(ln, [None, None, None, None])
            if cur[0] is None or p > cur[0]: cur[0], cur[1] = p, BOOK_NAME[b]
    rungs = [[ln] + v for ln, v in best.items() if v[0] is not None or v[2] is not None]
    rungs.sort(key=lambda r: abs(r[0] - main_ln))
    rungs = sorted(rungs[:ALT_MAX], key=lambda r: r[0])
    # a higher line can't have a shorter over price than a lower one at the same book quality — drop
    # rungs that break that order badly (stale relists)
    out = []
    for r in rungs:
        if r[1] is not None and out and out[-1][1] is not None and r[1] < out[-1][1] - 60: r[1] = r[2] = None
        if r[1] is None and r[3] is None: continue
        out.append(r)
    return out

MS_MAIN = {"hgoals", "hpts", "hast", "hppp", "hsog", "hblk", "hsaves", "hhit", "hfow"}
def pick_ms(rungs, mk):
    """main line from milestone rungs only {book: {line: overPrice}}: the "1+" rung for goals/points/assists/PPP,
    otherwise the rung priced closest to even. Over price only (books post no under for these)."""
    lines = sorted({ln for v in rungs.values() for ln in v})
    if not lines: return None
    ln = lines[0] if mk in ("hgoals", "hpts", "hast", "hppp") else min(lines, key=lambda x: min(abs(abs(v[x]) - 100) for v in rungs.values() if x in v))
    for b in BOOK_PREF:
        if ln in (rungs.get(b) or {}):
            o = rungs[b][ln]; bo, bob = o, b
            for b2, v in rungs.items():
                if ln in v and v[ln] > bo: bo, bob = v[ln], b2
            return ln, o, None, b, bo, bob, None, None
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

def fetch_sport(sport, mk_map, window_h, prev_open, used, with_game=False, core=None):
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
        mks = list(mk_map) + (GAME_MK if with_game else [])
        try:
            if with_game and PERIOD_OK[0]:
                try: odds = client.get_odds(sport, event_id=eid, markets=mks, period="all")   # full game + 1st/2nd/3rd period lines, same request
                except TypeError as te: PERIOD_OK[0] = False; print("period= not supported by this SDK:", te); odds = client.get_odds(sport, event_id=eid, markets=mks)
            else:
                odds = client.get_odds(sport, event_id=eid, markets=mks)
        except Exception as e:
            used += 1
            if not core: print(f"{sport} {eid}: odds failed: {e}"); continue
            print(f"{sport} {eid}: odds failed with {len(mks)} markets ({e}) — retrying with the core list")
            try: odds = client.get_odds(sport, event_id=eid, markets=core)
            except Exception as e2: print(f"{sport} {eid}: odds failed: {e2}"); continue
        used += 1
        if with_game:
            try:
                gl = game_lines(odds, evs[-1]["home"], evs[-1]["away"]); evs[-1].update(gl)
                p1 = game_lines(odds, evs[-1]["home"], evs[-1]["away"], "p1")
                if p1: evs[-1]["p1"] = p1
                ok_ = f"{eid}|game"; op_ = prev_open.get(ok_) or {}
                for k_ in ("ml", "tot", "pl"):
                    if k_ in gl and k_ not in op_: op_[k_] = gl[k_]
                prev_open[ok_] = op_; evs[-1]["open"] = op_   # first lines seen today -> line movement
            except Exception as e: print(f"{sport} {eid}: game lines failed: {e}")
        props = {}  # (player, mk) -> {book: {line: {Over/Under: price}}}
        ms = {}     # (player, mk) -> {book: {line: overPrice}}  milestone ("N+") rungs
        for bk in g(odds, "bookmakers", []) or []:
            b = str(g(bk, "key", "")).lower()
            if b in NOT_BOOKS or b not in BOOK_NAME: continue
            for m in g(bk, "markets", []) or []:
                MKSEEN.setdefault(sport, {}); MKSEEN[sport][g(m, "key")] = MKSEEN[sport].get(g(m, "key"), 0) + 1
                if g(m, "period"): MKSEEN[sport]["@" + str(g(m, "period")) + ":" + str(g(m, "key"))] = MKSEEN[sport].get("@" + str(g(m, "period")) + ":" + str(g(m, "key")), 0) + 1
                if sport == "icehockey_nhl" and g(m, "key") not in MKSAMPLE:
                    MKSAMPLE[g(m, "key")] = [b, str(g(m, "line_type", "")), [{k_: g(o, k_) for k_ in ("name", "description", "point", "price", "payout_multiplier")} for o in (g(m, "outcomes", []) or [])[:2]]]
                mk = mk_map.get(g(m, "key"))
                if not mk: continue
                if g(m, "period"): continue   # period player props: full game only
                lt = str(g(m, "line_type", "") or "")
                DIAG[lt] = DIAG.get(lt, 0) + 1
                for oc in g(m, "outcomes", []) or []:
                    if g(oc, "payout_multiplier") not in (None, 1, 1.0): continue
                    name = str(g(oc, "name", "")); player = g(oc, "description")
                    side = "Over" if name.lower() in ("over", "yes") else "Under" if name.lower() in ("under", "no") else None
                    price, point = g(oc, "price"), g(oc, "point")
                    if player: player = re.sub(r"\s*\([A-Z]{2,4}\)\s*$", "", str(player)).strip()
                    mm = re.match(r"^\s*(\d+(?:\.\d+)?)\s*\+", name)
                    if mm and side is None and mk not in YES_MK and player and price is not None:
                        # milestone rung "25+ Points" = Over 24.5 (one-sided); kept apart so it never touches the main line
                        try: ms.setdefault((player, mk), {}).setdefault(b, {})[float(mm.group(1)) - 0.5] = int(round(float(price)))
                        except Exception: pass
                        continue
                    if not player or not side or price is None: continue
                    if point is None: point = 0.5
                    try: price = int(round(float(price))); point = float(point)
                    except Exception: continue
                    props.setdefault((player, mk), {}).setdefault(b, {}).setdefault(point, {})[side] = price
        for (player, mk) in list(props) + [k for k in ms if k not in props]:
            br = props.get((player, mk)) or {}
            r = (pick_yes(br) if mk in YES_MK else pick(br)) if br else None
            if not r and mk in MS_MAIN:
                # only one-sided prices posted (e.g. NHL goals / points: "N+" rungs or Over/Yes with no Under)
                rungs = {b: dict(v) for b, v in (ms.get((player, mk)) or {}).items()}
                for b, lines in br.items():
                    for ln, sd in lines.items():
                        if "Over" in sd and "Under" not in sd: rungs.setdefault(b, {}).setdefault(ln, sd["Over"])
                if rungs: r = pick_ms(rungs, mk)
            if not r: continue
            ln, o, u, b, bo, bob, bu, bub = r
            key = f"{eid}|{player}|{mk}"
            op = prev_open.get(key) or [ln, o, u]
            rows.append([player, mk, ln, o, u, BOOK_NAME[b],
                         bo if bob != b else None, BOOK_NAME.get(bob) if bob != b else None,
                         bu if (bub and bub != b) else None, BOOK_NAME.get(bub) if (bub and bub != b) else None,
                         op[0], op[1], op[2], eid] + ([] if mk in YES_MK else [alts(br, ln, ms.get((player, mk))) or None]))
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
           "nba": prev.get("nba") or {}, "nfl": prev.get("nfl") or {}, "nhl": prev.get("nhl") or {}}
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
    # NHL: at most every 2 hours (games in the next 30 hours), props + moneyline / total / puck line
    last_nhl = (prev.get("nhl") or {}).get("at"); stale = True
    if last_nhl:
        try: stale = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(last_nhl)).total_seconds() > 2 * 3600 - 300
        except Exception: stale = True
    if "nhl" in os.environ.get("FORCE", ""): stale = True
    if stale and used < 850:
        evs, rows, used = fetch_sport("icehockey_nhl", NHL_MK, 30, opens, used, with_game=True, core=NHL_CORE)
        if evs or rows: out["nhl"] = {"at": out["updated"], "events": evs, "props": rows}
        try: save_close("nhl", evs, rows, out["updated"])
        except Exception as e: print("close (nhl) failed:", e)
    keep = {e["id"] for s in ("nba", "nfl", "nhl") for e in (out[s].get("events") or [])}
    out["open"] = {k: v for k, v in opens.items() if k.split("|")[0] in {str(x) for x in keep}}
    out["budget"] = {"day": today, "used": used}
    os.makedirs("data", exist_ok=True)
    with open(OUT, "w") as f: json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print(f"NBA {len(out['nba'].get('props') or [])} props / {len(out['nba'].get('events') or [])} games; "
          f"NFL {len(out['nfl'].get('props') or [])} props / {len(out['nfl'].get('events') or [])} games; "
          f"NHL {len(out['nhl'].get('props') or [])} props / {len(out['nhl'].get('events') or [])} games; requests today {used}")
    print("markets seen:", json.dumps(MKSEEN))
    for k_, v_ in MKSAMPLE.items(): print("  NHL sample", k_, json.dumps(v_, default=str))
    print("line_type counts:", DIAG)

if __name__ == "__main__":
    main()
