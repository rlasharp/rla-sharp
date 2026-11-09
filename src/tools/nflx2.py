#!/usr/bin/env python3
"""NFL extras from nflverse (play-by-play, weekly player stats, schedules) -> nfl_x2.js
  NFL_RZ    player -> [red-zone touches (carries+targets inside the 20), goal-line touches (inside the 5), rush+rec TDs, games]
  NFL_RZT   team   -> [red-zone touches, goal-line touches, offensive TDs, games, points]
  NFL_LOC   player -> {m:[targets, yards], o:[targets, yards]}   middle vs outside (left/right) targets (pbp pass_location)
  NFL_DLOC  team   -> {WR|TE|RB: {m:[t, yds], o:[t, yds]}}        what each defense allows, same split
  NFL_QBRUN QB     -> [[week, designed runs, yds, scrambles, yds], ...]
  NFL_QBV   QB     -> [[week, pass attempts, team spread (- = favoured), implied team points], ...]
  NFL_PROE  team   -> [pass rate over expected %, pass rate %, plays/game]   (neutral-ish downs: win prob 20-80%, not 4th qtr garbage)
  NFL_DIVX  {lg: division games since 2021 [n, unders, overs, dog covers, fav covers], non: same for non-division,
             tm: team -> [W, L, ATS W, ATS L, O, U] in division games last 3 seasons + this one}, NFL_DIVG: ["wk|away|home", ...] this season
  NFL_K     kicker -> {tm, g: [[week, FG made, FG att, PAT made, kicking points, long], ...]}
Real data only. usage: python3 tools/nflx2.py <nflverse dir> > nfl_x2.js"""
import csv, gzip, json, sys, os, collections
D = sys.argv[1]
FX = {"LA": "LAR"}
fx = lambda t: FX.get(t, t)
def f(x):
    try: return float(x)
    except Exception: return None

games = list(csv.DictReader(open(os.path.join(D, "games.csv"))))
yr = max(int(r["season"]) for r in games if r["home_score"] != "")
# ---- player names by id (weekly player stats) + kickers ----
NAME, POS, K = {}, {}, {}
for r in csv.DictReader(open(os.path.join(D, "pstats.csv"))):
    if r.get("season_type", "REG") != "REG": continue
    pid = r["player_id"]; NAME[pid] = r.get("player_display_name") or r.get("player_name"); POS[pid] = r.get("position") or r.get("position_group")
    if (r.get("position") == "K") and (r.get("fg_att") not in ("", None, "0") or r.get("pat_att") not in ("", None, "0")):
        fm, fa, pm = int(f(r.get("fg_made")) or 0), int(f(r.get("fg_att")) or 0), int(f(r.get("pat_made")) or 0)
        k_ = K.setdefault(NAME[pid], {"tm": "", "g": []}); k_["tm"] = fx(r.get("team") or r.get("recent_team") or k_["tm"])
        k_["g"].append([int(r["week"]), fm, fa, pm, fm * 3 + pm, int(f(r.get("fg_long")) or 0)])
for k in K: K[k]["g"].sort()

# ---- spreads / implied points per team-week (schedule closing lines) ----
SP = {}
for r in games:
    if int(r["season"]) != yr or r["game_type"] != "REG" or r["spread_line"] == "" or r["total_line"] == "": continue
    w, sl, tl = int(r["week"]), float(r["spread_line"]), float(r["total_line"])   # spread_line > 0 = home favoured by that much
    SP[(w, fx(r["home_team"]))] = (-sl, tl / 2 + sl / 2); SP[(w, fx(r["away_team"]))] = (sl, tl / 2 - sl / 2)

RZ, RZT = collections.defaultdict(lambda: [0, 0, 0, set()]), collections.defaultdict(lambda: [0, 0, 0, set(), 0])
LOC = collections.defaultdict(lambda: {"m": [0, 0], "o": [0, 0]}); DLOC = collections.defaultdict(lambda: collections.defaultdict(lambda: {"m": [0, 0], "o": [0, 0]}))
QBR = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0, 0, 0])); ATT = collections.defaultdict(lambda: collections.Counter())
PR = collections.defaultdict(lambda: [0.0, 0, 0, 0, set()])   # sum pass_oe, n, passes, xpass-plays, games
with gzip.open(os.path.join(D, "pbp.csv.gz"), "rt") as fh:
    for r in csv.DictReader(fh):
        if r.get("season_type") != "REG": continue
        w = int(r["week"]); pt, dt = fx(r["posteam"] or ""), fx(r["defteam"] or "")
        if not pt: continue
        yl = f(r["yardline_100"]); typ = r["play_type"]
        rid, tid, qid = r.get("rusher_player_id"), r.get("receiver_player_id"), r.get("passer_player_id")
        # red zone / goal line touches (no two-point tries)
        if r.get("two_point_attempt") != "1" and yl is not None and yl <= 20 and typ in ("run", "pass"):
            who = rid if typ == "run" and rid else tid if typ == "pass" and tid else None
            if who:
                RZ[who][0] += 1; RZT[pt][0] += 1
                if yl <= 5: RZ[who][1] += 1; RZT[pt][1] += 1
        RZ[rid or tid or "-"][3].add(w) if (rid or tid) else None
        RZT[pt][3].add(w)
        if r.get("touchdown") == "1" and r.get("td_team") == r["posteam"] and r.get("td_player_id") and typ in ("run", "pass"):
            RZ[r["td_player_id"]][2] += 1; RZT[pt][2] += 1
        # middle vs outside targets
        if typ == "pass" and tid and r.get("pass_location") in ("left", "middle", "right"):
            side = "m" if r["pass_location"] == "middle" else "o"; yd = f(r.get("receiving_yards")) or 0
            LOC[tid][side][0] += 1; LOC[tid][side][1] += yd
            p = POS.get(tid)
            if p in ("WR", "TE", "RB"): DLOC[dt][p][side][0] += 1; DLOC[dt][p][side][1] += yd
        # QB runs: designed vs scrambles (kneels out)
        if typ == "run" and rid and POS.get(rid) == "QB" and r.get("qb_kneel") != "1":
            a = QBR[rid][w]; yd = f(r["yards_gained"]) or 0
            if r.get("qb_scramble") == "1": a[2] += 1; a[3] += yd
            else: a[0] += 1; a[1] += yd
        if typ == "pass" and r.get("qb_scramble") == "1" and rid and POS.get(rid) == "QB":
            a = QBR[rid][w]; a[2] += 1; a[3] += f(r["yards_gained"]) or 0
        if typ == "pass" and qid and r.get("sack") != "1" and r.get("qb_scramble") != "1": ATT[qid][w] += 1
        # pass rate over expected, competitive situations
        wp, qtr = f(r.get("wp")), r.get("qtr")
        if typ in ("run", "pass") and r.get("pass_oe") not in ("", "NA", None) and wp is not None and .2 <= wp <= .8 and qtr in ("1", "2", "3", "4"):
            P_ = PR[pt]; P_[0] += float(r["pass_oe"]); P_[1] += 1; P_[2] += 1 if typ == "pass" else 0
        if typ in ("run", "pass"): PR[pt][3] += 1; PR[pt][4].add(w)
for g in games:
    if int(g["season"]) == yr and g["game_type"] == "REG" and g["home_score"] != "":
        for t, s in ((fx(g["home_team"]), g["home_score"]), (fx(g["away_team"]), g["away_score"])): RZT[t][4] += int(s)

out = {}
out["NFL_RZ"] = {NAME[p]: [v[0], v[1], v[2], len(v[3])] for p, v in RZ.items() if p in NAME and (v[0] or v[2])}
out["NFL_RZT"] = {t: [v[0], v[1], v[2], len(v[3]), v[4]] for t, v in RZT.items() if t}
out["NFL_LOC"] = {NAME[p]: {k: [a[0], round(a[1])] for k, a in v.items()} for p, v in LOC.items() if p in NAME and v["m"][0] + v["o"][0] >= 8}
out["NFL_DLOC"] = {t: {p: {k: [a[0], round(a[1])] for k, a in s.items()} for p, s in v.items()} for t, v in DLOC.items() if t}
out["NFL_QBRUN"] = {NAME[p]: [[w] + a[:1] + [round(a[1])] + a[2:3] + [round(a[3])] for w, a in sorted(v.items())] for p, v in QBR.items() if p in NAME}
team_of = {}
for r in csv.DictReader(open(os.path.join(D, "pstats.csv"))):
    if r.get("season_type", "REG") == "REG": team_of[(r["player_id"], int(r["week"]))] = fx(r.get("team") or r.get("recent_team") or "")
QBV = {}
for p, wk in ATT.items():
    if POS.get(p) != "QB" or p not in NAME: continue
    rows = []
    for w, n in sorted(wk.items()):
        if n < 10: continue
        t = team_of.get((p, w)); s = SP.get((w, t))
        if s: rows.append([w, n, s[0], round(s[1], 1)])
    if rows: QBV[NAME[p]] = rows
out["NFL_QBV"] = QBV
out["NFL_PROE"] = {t: [round(v[0] / v[1], 1) if v[1] else None, round(v[2] / v[1] * 100, 1) if v[1] else None, round(v[3] / max(1, len(v[4])), 1)] for t, v in PR.items() if t}
# ---- division games: league trends since 2021, team records in them (last 3 seasons + this one) ----
def blank(): return [0, 0, 0, 0, 0]
lg, non, tm, DIVG = blank(), blank(), collections.defaultdict(lambda: [0, 0, 0, 0, 0, 0]), []
for r in games:
    if r["game_type"] != "REG": continue
    s = int(r["season"])
    if s == yr and r["div_game"] == "1": DIVG.append(f'{r["week"]}|{fx(r["away_team"])}|{fx(r["home_team"])}')
    if r["home_score"] == "" or r["spread_line"] == "" or r["total_line"] == "" or s < 2021: continue
    hs, as_, sl, tl = int(r["home_score"]), int(r["away_score"]), float(r["spread_line"]), float(r["total_line"])
    tot, m = hs + as_, hs - as_; B = lg if r["div_game"] == "1" else non; B[0] += 1
    if tot < tl: B[1] += 1
    elif tot > tl: B[2] += 1
    if sl != 0 and m != sl:
        fav_home = sl > 0; cover_home = m > sl
        if cover_home == fav_home: B[4] += 1
        else: B[3] += 1
    if r["div_game"] == "1" and s >= yr - 3:
        for t, me, op, ats in ((fx(r["home_team"]), hs, as_, m - sl), (fx(r["away_team"]), as_, hs, -m + sl)):
            T = tm[t]
            if me > op: T[0] += 1
            elif me < op: T[1] += 1
            if ats > 0: T[2] += 1
            elif ats < 0: T[3] += 1
            if tot > tl: T[4] += 1
            elif tot < tl: T[5] += 1
out["NFL_DIVX"] = {"lg": lg, "non": non, "tm": dict(tm), "since": 2021}
out["NFL_DIVG"] = DIVG
out["NFL_K"] = K
print("/* NFL extras — tools/nflx2.py (nflverse play-by-play, weekly stats, schedules) */")
for k, v in out.items(): print(f"var {k}=" + json.dumps(v, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"nflx2: {len(out['NFL_RZ'])} RZ players, {len(QBV)} QBs, {len(out['NFL_PROE'])} teams PROE, {len(DIVG)} division games, {len(K)} kickers", file=sys.stderr)
