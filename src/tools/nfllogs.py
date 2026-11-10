#!/usr/bin/env python3
"""NFL player game logs for the current season from nflverse (weekly refresh, after tools/nflfetch.sh) -> nfl_logs.js.
The site's game logs used to be typed in by hand (CBS / NFL.com / ESPN, up to Oct 31) and so stopped at Week 8; every
hit rate, chart, prop page and tracked pick reads them. adv.js merges these rows in: official nflverse numbers replace
the typed-in ones for the same game, and new weeks are added. Games where a player had no stats at all are not in
nflverse, so typed-in rows nflverse doesn't have are kept.
Rows: [name, team, pos, week, opp, home(1/0), passAtt, comp, passYds, passTD, int, rushAtt, rushYds, rushTD, rec, tgt, recYds, recTD]
Real data only. usage: python3 tools/nfllogs.py <nflverse dir> [season] > nfl_logs.js"""
import csv, json, os, sys
D = sys.argv[1]; YEAR = int(sys.argv[2]) if len(sys.argv) > 2 else 2026
FIX = {"LA": "LAR", "STL": "LAR", "SD": "LAC", "OAK": "LV", "WSH": "WAS", "JAC": "JAX"}; fx = lambda t: FIX.get(t, t)
def pick(*names):
    for n in names:
        if os.path.exists(os.path.join(D, n)): return os.path.join(D, n)
    return os.path.join(D, names[0])
def i(r, *ks):
    for k in ks:
        v = r.get(k)
        if v not in (None, "", "NA"):
            try: return int(round(float(v)))
            except Exception: pass
    return 0
home = {}
for g in csv.DictReader(open(pick("games.csv"))):
    if g["season"] == str(YEAR): home[g["game_id"]] = fx(g["home_team"])
POS = {"QB": "QB", "RB": "RB", "FB": "RB", "WR": "WR", "TE": "TE"}
rows = []
for r in csv.DictReader(open(pick("pstats.csv", f"stats_player_week_{YEAR}.csv"))):
    if r.get("season_type", "REG") != "REG" or str(r.get("season", YEAR)) != str(YEAR): continue
    pos = POS.get(r.get("position") or r.get("position_group") or "")
    nm = r.get("player_display_name") or r.get("player_name")
    if not pos or not nm: continue
    tm, opp = fx(r.get("team") or r.get("recent_team") or ""), fx(r.get("opponent_team") or "")
    h = 1 if home.get(r.get("game_id")) == tm else 0
    rows.append([nm, tm, pos, int(r["week"]), opp, h, i(r, "attempts"), i(r, "completions"), i(r, "passing_yards"), i(r, "passing_tds"),
                 i(r, "passing_interceptions", "interceptions"), i(r, "carries"), i(r, "rushing_yards"), i(r, "rushing_tds"),
                 i(r, "receptions"), i(r, "targets"), i(r, "receiving_yards"), i(r, "receiving_tds")])
if len(rows) < 200: sys.exit(f"nfllogs: only {len(rows)} rows — nflverse file looks wrong, keeping the old file")
wk = max(r[3] for r in rows)
print(f"/* NFL player game logs — tools/nfllogs.py (nflverse player stats), through Week {wk} {YEAR} */")
print("var NFLV_LOGS=" + json.dumps({"asof": f"through Week {wk}", "week": wk, "rows": rows}, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"nfllogs: {len(rows)} player-games, through Week {wk}", file=sys.stderr)
