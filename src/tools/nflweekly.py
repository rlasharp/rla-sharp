#!/usr/bin/env python3
"""Weekly NFL tables from nflverse (run in the Tuesday refresh, after tools/nflfetch.sh) -> nfl_weekly.js (var NFLW).
Replaces data that used to be updated by hand (and so stopped at Week 8):
  dvp   what each defense allows per game to QB / RB / WR / TE        (same columns as DVP_RAW in real.js)
  pfr   the same as season totals                                      (same columns as PFR_DVP in pfr.js)
  posv  the last players at each position vs each defense              (same shape as POSV in posv.js)
  qb1   each team's starting QB and the weeks he missed / left early   (same shape as QB1_STATUS in qb1.js)
  h2h   past meetings for every scheduled matchup, by "AWAY|HOME"      (same rows as H2H_RAW in h2h_notes.js)
Real data only. usage: python3 tools/nflweekly.py <nflverse dir> [season] > nfl_weekly.js"""
import csv, json, os, sys, collections
D = sys.argv[1]; YEAR = int(sys.argv[2]) if len(sys.argv) > 2 else 2026
FIX = {"LA": "LAR", "STL": "LAR", "SD": "LAC", "OAK": "LV", "WSH": "WAS", "JAC": "JAX"}; fx = lambda t: FIX.get(t, t)
def pick(*names):
    for n in names:
        if os.path.exists(os.path.join(D, n)): return os.path.join(D, n)
    return os.path.join(D, names[0])
def f(r, *ks):
    for k in ks:
        v = r.get(k)
        if v not in (None, "", "NA"):
            try: return float(v)
            except Exception: pass
    return 0.0
games = list(csv.DictReader(open(pick("games.csv"))))
ST = [r for r in csv.DictReader(open(pick("pstats.csv", f"stats_player_week_{YEAR}.csv"))) if r.get("season_type", "REG") == "REG" and str(r.get("season", YEAR)) == str(YEAR)]
maxw = max(int(r["week"]) for r in ST)
gp = collections.Counter()   # games played per team this season
for g in games:
    if g["season"] == str(YEAR) and g["game_type"] == "REG" and g["home_score"] != "":
        gp[fx(g["home_team"])] += 1; gp[fx(g["away_team"])] += 1
POS = {"QB": "QB", "RB": "RB", "FB": "RB", "WR": "WR", "TE": "TE"}
tot = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))   # pos -> defense -> stat
posv = collections.defaultdict(lambda: collections.defaultdict(list))
qb_att = collections.defaultdict(lambda: collections.defaultdict(float)); qb_name = {}
for r in ST:
    pos = POS.get(r.get("position") or r.get("position_group") or "")
    tm, opp, w, nm = fx(r.get("team") or r.get("recent_team") or ""), fx(r.get("opponent_team") or ""), int(r["week"]), r.get("player_display_name") or r.get("player_name")
    if not pos or not opp: continue
    s = {"att": f(r, "attempts"), "comp": f(r, "completions"), "passYds": f(r, "passing_yards"), "passTD": f(r, "passing_tds"), "int": f(r, "passing_interceptions", "interceptions"),
         "2pp": f(r, "passing_2pt_conversions"), "sk": f(r, "sacks_suffered", "sacks"), "rushAtt": f(r, "carries"), "rushYds": f(r, "rushing_yards"), "rushTD": f(r, "rushing_tds"),
         "tgt": f(r, "targets"), "rec": f(r, "receptions"), "recYds": f(r, "receiving_yards"), "recTD": f(r, "receiving_tds")}
    T = tot[pos][opp]
    for k, v in s.items(): T[k] += v
    if pos == "QB":
        qb_att[tm][w] += s["att"]; qb_name.setdefault(tm, {}); qb_name[tm][nm] = qb_name[tm].get(nm, 0) + s["att"]
        if s["att"] >= 5: posv[opp]["QB"].append([w, tm, nm, {"comp": int(s["comp"]), "passYds": int(s["passYds"]), "passTD": int(s["passTD"]), "int": int(s["int"])}])
    elif pos == "RB":
        if s["rushAtt"] + s["rec"] >= 3: posv[opp]["RB"].append([w, tm, nm, {"rushAtt": int(s["rushAtt"]), "rushYds": int(s["rushYds"]), "rushTD": int(s["rushTD"]), "rec": int(s["rec"]), "recYds": int(s["recYds"])}])
    elif s["tgt"] >= 2:
        posv[opp][pos].append([w, tm, nm, {"rec": int(s["rec"]), "recYds": int(s["recYds"]), "recTD": int(s["recTD"])}])
def rating(c, a, y, td, i):
    if not a: return 0
    cl = lambda x: max(0, min(2.375, x))
    return round((cl((c / a - .3) * 5) + cl((y / a - 3) * .25) + cl(td / a * 20) + cl(2.375 - i / a * 25)) / 6 * 100, 1)
DVPC = {"QB": ["att", "comp", "passYds", "passTD", "int", "rate", "rushAtt", "rushYds", "rushTD"], "RB": ["rushAtt", "rushYds", "rushTD", "tgt", "rec", "recYds", "recTD"],
        "WR": ["rushAtt", "rushYds", "rushTD", "tgt", "rec", "recYds", "recTD"], "TE": ["tgt", "rec", "recYds", "recTD"]}
PFRC = {"QB": ["G", "comp", "att", "passYds", "passTD", "int", "2pp", "sk", "rushAtt", "rushYds", "rushTD"], "RB": ["G", "rushAtt", "rushYds", "rushTD", "tgt", "rec", "recYds", "recTD"],
        "WR": ["G", "tgt", "rec", "recYds", "recTD"], "TE": ["G", "tgt", "rec", "recYds", "recTD"]}
dvp, pfr = {}, {}
for pos in DVPC:
    dvp[pos] = {"cols": DVPC[pos], "rows": {}}; pfr[pos] = {"cols": PFRC[pos], "rows": {}}
    for t, T in tot[pos].items():
        g = gp[t] or 1
        dvp[pos]["rows"][t] = [rating(T["comp"], T["att"], T["passYds"], T["passTD"], T["int"]) if c == "rate" else round(T[c] / g, 2) for c in DVPC[pos]]
        pfr[pos]["rows"][t] = [gp[t] if c == "G" else int(T[c]) for c in PFRC[pos]]
posv_out = {t: {p: sorted(L, key=lambda x: -x[0])[:10] for p, L in P.items()} for t, P in posv.items()}
qb1 = {}
INJ = set()   # players on ESPN's injury report right now (data/espn_inj.txt, refreshed by every automatic run)
try:
    for line in open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "espn_inj.txt"), encoding="utf8"):
        if line.startswith("#") or "|" not in line: continue
        nm, pos, st = (line.split("|") + ["", "", ""])[:3]
        if st.strip() in ("Out", "IR", "Doubtful", "Questionable", "PUP-R", "IR-R"): INJ.add(nm.strip())
except Exception: pass
played = collections.defaultdict(set)
for g in games:
    if g["season"] == str(YEAR) and g["game_type"] == "REG" and g["home_score"] != "":
        played[fx(g["home_team"])].add(int(g["week"])); played[fx(g["away_team"])].add(int(g["week"]))
def starter(tm, w):   # the QB with the most attempts for that team that week
    best = None
    for r in ST:
        if int(r["week"]) == w and fx(r.get("team") or r.get("recent_team") or "") == tm and POS.get(r.get("position") or "") == "QB":
            a = f(r, "attempts")
            if best is None or a > best[1]: best = (r.get("player_display_name") or r.get("player_name"), a)
    return best[0] if best else None
for tm, N in qb_name.items():
    # QB1: the QB who started each of the last 3 games (the current starter); otherwise whoever started the most games.
    # Exception: the season-opening starter who started 3+ of the first 4 games and is on the injury report now stays QB1
    # (an injured star, e.g. a backup filling in). Starter of a game = the QB with the most attempts.
    wks = sorted(played[tm]); S_ = {w: starter(tm, w) for w in wks}; st_ = collections.Counter(x for x in S_.values() if x)
    last3 = [S_[w] for w in wks[-3:]]
    q = last3[0] if len(last3) == 3 and len(set(last3)) == 1 and last3[0] else (st_.most_common(1)[0][0] if st_ else max(N, key=N.get))
    op = S_.get(wks[0]) if wks else None
    if op and op != q and op in INJ and sum(1 for w in wks[:4] if S_[w] == op) >= 3: q = op
    wk_att = {}
    for r in ST:
        if (r.get("player_display_name") or r.get("player_name")) == q and fx(r.get("team") or r.get("recent_team") or "") == tm: wk_att[int(r["week"])] = f(r, "attempts")
    out_, left = [], []
    for w in sorted(played[tm]):
        a = wk_att.get(w, 0)
        if a == 0: out_.append(w)
        elif a < 10 and qb_att[tm][w] - a >= 10: left.append(w)
    subs = collections.Counter()
    for r in ST:
        if fx(r.get("team") or r.get("recent_team") or "") == tm and POS.get(r.get("position") or "") == "QB" and int(r["week"]) in out_ + left and (r.get("player_display_name") or r.get("player_name")) != q:
            subs[r.get("player_display_name") or r.get("player_name")] += f(r, "attempts")
    qb1[tm] = {"qb": q, "out": out_, "left": left, "sub": subs.most_common(1)[0][0] if subs else ""}
# head to head for every matchup on the schedule this season (regular season + playoffs since 2002), most recent first
sched = {(fx(g["away_team"]), fx(g["home_team"])) for g in games if g["season"] == str(YEAR) and (g["home_score"] == "" or int(g["week"]) >= maxw)}   # games still to play (+ this week)
past = [g for g in games if g["home_score"] != "" and int(g["season"]) >= 2002]
h2h = {}
for a, h in sched:
    M = [g for g in past if {fx(g["away_team"]), fx(g["home_team"])} == {a, h}]
    M.sort(key=lambda g: g["gameday"], reverse=True)
    h2h[f"{a}|{h}"] = [[g["gameday"], fx(g["away_team"]), int(g["away_score"]), fx(g["home_team"]), int(g["home_score"])] + ([1] if g["game_type"] != "REG" else []) for g in M[:8]]
print(f"/* NFL weekly tables — tools/nflweekly.py (nflverse player stats + schedules), through Week {maxw} {YEAR} */")
print("var NFLW=" + json.dumps({"asof": f"through Week {maxw}", "week": maxw, "dvp": dvp, "pfr": pfr, "posv": posv_out, "qb1": qb1, "h2h": h2h}, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"nflweekly: through Week {maxw}, {len(qb1)} QB1s, {len(h2h)} matchups with history", file=sys.stderr)
