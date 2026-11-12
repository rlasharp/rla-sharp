#!/usr/bin/env python3
"""Target map + production matchup data for NFL receivers, from nflverse play-by-play (+ FTN charting for
contested balls and blitzes). Usage: python3 tools/nfltgt.py /home/claude/nflv > nfl_tgt.js
Needs pbp.csv.gz and pstats.csv (tools/nflfetch.sh) and ftn.csv (ftn_charting_<year>.csv, optional)."""
import csv, gzip, json, os, sys, collections
D = sys.argv[1]
names = {}
for r in csv.DictReader(open(os.path.join(D, "pstats.csv"))):
    names[r["player_id"]] = (r["player_display_name"], r["position"])
ftn = {}
fp = os.path.join(D, "ftn.csv")
if os.path.exists(fp):
    for r in csv.DictReader(open(fp)):
        ftn[(r["nflverse_game_id"], r["nflverse_play_id"])] = (r["is_contested_ball"] == "TRUE", int(r["n_blitzers"] or 0) > 0, r["is_drop"] == "TRUE")
def zone(ay, loc):
    d = "B" if ay < 0 else "S" if ay < 10 else "I" if ay < 20 else "D"
    return d + {"left": "L", "middle": "M", "right": "R"}[loc]
def blank(): return {"t": 0, "rec": 0, "yds": 0, "yac": 0, "fd": 0, "ay": 0, "ct": 0, "cc": 0, "drop": 0, "z": collections.Counter(), "g": set()}
P = collections.defaultdict(blank); DEF = collections.defaultdict(lambda: collections.defaultdict(blank)); LG = collections.defaultdict(blank)
BL = collections.defaultdict(lambda: [0, 0]); weeks = set()
RZ, RZD, TZ, QBZ, LGZ_ = {}, {}, {}, {}, {}
GWX, GQB = {}, {}
def rzb(): return {"c20": [0, 0], "c10": [0, 0], "c5": [0, 0], "t20": [0, 0, 0], "t10": [0, 0, 0], "ez": {"L": [0, 0, 0], "M": [0, 0, 0], "R": [0, 0, 0]}}
def rzdb(): return {"ru": [0, 0], "pa": [0, 0, 0], "ez": {"L": [0, 0, 0], "M": [0, 0, 0], "R": [0, 0, 0]}}
for r in csv.DictReader(gzip.open(os.path.join(D, "pbp.csv.gz"), "rt")):
    if r["season_type"] != "REG" or r["two_point_attempt"] == "1": continue
    key = (r["game_id"], r["play_id"]); f = ftn.get(key)
    # per game, for the props filters: weather/roof, and which QB threw the passes (most attempts) for each team
    po_ = "LAR" if r["posteam"] == "LA" else r["posteam"]; dt_ = "LAR" if r["defteam"] == "LA" else r["defteam"]
    if po_ and dt_ and r.get("week"):
        for t_ in (po_, dt_):
            k_ = f'{r["week"]}|{t_}'
            if k_ not in GWX:
                try: GWX[k_] = [r.get("roof") or "", round(float(r["temp"])) if r.get("temp") else None, round(float(r["wind"])) if r.get("wind") else None]
                except Exception: GWX[k_] = [r.get("roof") or "", None, None]
        if r["pass_attempt"] == "1" and r.get("passer_player_id"):
            qn = names.get(r["passer_player_id"], (None, None))[0]
            if qn: GQB.setdefault(f'{r["week"]}|{po_}', collections.Counter())[qn] += 1
    if r["qb_dropback"] == "1" and r["defteam"] and f is not None:
        dt = "LAR" if r["defteam"] == "LA" else r["defteam"]; BL[dt][1] += 1; BL[dt][0] += 1 if f[1] else 0
    # red zone: carries and targets inside the 20 / 10 / 5, and passes thrown into the end zone (air yards reach the goal line)
    try: yl = float(r["yardline_100"])
    except Exception: yl = None
    if yl is not None and yl <= 20 and r["season_type"] == "REG":
        po = "LAR" if r["posteam"] == "LA" else r["posteam"]; dfn = "LAR" if r["defteam"] == "LA" else r["defteam"]
        if r["rush_attempt"] == "1" and r["rusher_player_id"] and r["qb_kneel"] != "1":
            nm_, ps_ = names.get(r["rusher_player_id"], (None, None)); td_ = r["rush_touchdown"] == "1"
            if nm_:
                q = RZ.setdefault(nm_, rzb()); q["tm"] = po; q["pos"] = ps_
                for cut, k_ in ((20, "c20"), (10, "c10"), (5, "c5")):
                    if yl <= cut: q[k_][0] += 1; q[k_][1] += td_
            if dfn: RZD.setdefault(dfn, rzdb())["ru"][0] += 1; RZD[dfn]["ru"][1] += td_
        elif r["pass_attempt"] == "1" and r["receiver_player_id"] and r["sack"] != "1":
            nm_, ps_ = names.get(r["receiver_player_id"], (None, None)); td_ = r["pass_touchdown"] == "1"; cp_ = r["complete_pass"] == "1"
            try: ay_ = float(r["air_yards"])
            except Exception: ay_ = None
            ez_ = ay_ is not None and ay_ >= yl and r["pass_location"] in ("left", "middle", "right")
            if nm_:
                q = RZ.setdefault(nm_, rzb()); q["tm"] = po; q["pos"] = ps_
                for cut, k_ in ((20, "t20"), (10, "t10")):
                    if yl <= cut: q[k_][0] += 1; q[k_][1] += cp_; q[k_][2] += td_
                if ez_: e_ = q["ez"][r["pass_location"][0].upper()]; e_[0] += 1; e_[1] += cp_; e_[2] += td_
            if dfn:
                D_ = RZD.setdefault(dfn, rzdb()); D_["pa"][0] += 1; D_["pa"][1] += cp_; D_["pa"][2] += td_
                if ez_: e_ = D_["ez"][r["pass_location"][0].upper()]; e_[0] += 1; e_[1] += cp_; e_[2] += td_
    # where each offense (and each QB) throws, and where each defense gives up catches: 12 areas (depth x side)
    if r["pass_attempt"] == "1" and r["sack"] != "1" and r["air_yards"] and r["pass_location"] in ("left", "middle", "right"):
        po = "LAR" if r["posteam"] == "LA" else r["posteam"]; dfn = "LAR" if r["defteam"] == "LA" else r["defteam"]
        z_ = zone(float(r["air_yards"]), r["pass_location"]); cp_ = r["complete_pass"] == "1"; yd_ = float(r["receiving_yards"] or 0) if cp_ else 0; td_ = r["pass_touchdown"] == "1"
        rows_ = [TZ.setdefault(po, {"o": {}, "d": {}})["o"], TZ.setdefault(dfn, {"o": {}, "d": {}})["d"], LGZ_]
        qn_ = names.get(r["passer_player_id"], (None, None))[0]
        if qn_: QB_ = QBZ.setdefault(qn_, {"tm": po, "z": {}, "att": 0}); QB_["tm"] = po; QB_["att"] += 1; rows_.append(QB_["z"])
        for Zt in rows_:
            c_ = Zt.setdefault(z_, [0, 0, 0, 0]); c_[0] += 1; c_[1] += cp_; c_[2] += yd_; c_[3] += td_
    if r["pass_attempt"] != "1" or not r["receiver_player_id"] or r["sack"] == "1" or not r["air_yards"] or r["pass_location"] not in ("left", "middle", "right"): continue
    nm, pos = names.get(r["receiver_player_id"], (None, None))
    if not nm or pos not in ("WR", "TE", "RB"): continue
    r["posteam"]="LAR" if r["posteam"]=="LA" else r["posteam"]; r["defteam"]="LAR" if r["defteam"]=="LA" else r["defteam"]
    weeks.add(int(r["week"])); ay = float(r["air_yards"]); z = zone(ay, r["pass_location"])
    comp = r["complete_pass"] == "1"; yds = float(r["receiving_yards"] or 0) if comp else 0; yac = float(r["yards_after_catch"] or 0) if comp else 0
    fd = r["first_down_pass"] == "1"; ct = bool(f and f[0]); drop = bool(f and f[2])
    for s in (P[nm], DEF[r["defteam"]][pos], LG[pos]):
        s["t"] += 1; s["rec"] += comp; s["yds"] += yds; s["yac"] += yac; s["fd"] += fd; s["ay"] += ay; s["ct"] += ct; s["cc"] += comp and ct; s["drop"] += drop; s["z"][z] += 1
    P[nm]["g"].add(r["game_id"]); P[nm]["pos"] = pos; P[nm]["tm"] = r["posteam"]
def out(s, games=True):
    o = {k: (round(v, 1) if isinstance(v, float) else v) for k, v in s.items() if k not in ("z", "g", "pos", "tm")}
    o["z"] = dict(s["z"])
    if games: o["gp"] = len(s["g"])
    return o
PL = {}
for nm, s in P.items():
    if s["t"] >= 5: o = out(s); o["pos"] = s["pos"]; o["tm"] = s["tm"]; PL[nm] = o
DF = {t: {p: out(s, False) for p, s in v.items()} for t, v in DEF.items()}
LGo = {p: out(s, False) for p, s in LG.items()}
BLo = {t: round(b / n * 100, 1) for t, (b, n) in BL.items() if n}
wk = f"{min(weeks)}-{max(weeks)}" if weeks else ""
print("/* NFL target map + production matchup — nflverse play-by-play (regular season, weeks %s) + FTN charting (contested balls, blitzes). tools/nfltgt.py */" % wk)
print("const NFL_TGT_WEEKS=" + json.dumps(wk) + ";")
print("const NFL_TGT=" + json.dumps(PL, separators=(",", ":")) + ";")
print("const NFL_DEFTGT=" + json.dumps(DF, separators=(",", ":")) + ";")
print("const NFL_LGTGT=" + json.dumps(LGo, separators=(",", ":")) + ";")
rd = lambda Z: {k: [v[0], v[1], round(v[2]), v[3]] for k, v in Z.items()}
print("const NFL_TZONE=" + json.dumps({t: {"o": rd(v["o"]), "d": rd(v["d"])} for t, v in TZ.items() if t}, separators=(",", ":")) + ";  /* per team: o = passes thrown, d = passes allowed, by area (B/S/I/D = behind line / 0-9 / 10-19 / 20+ air yards, L/M/R): [targets, catches, yards, TD] */")
print("const NFL_LGZONE=" + json.dumps(rd(LGZ_), separators=(",", ":")) + ";")
print("const NFL_QBZ=" + json.dumps({n: {"tm": v["tm"], "att": v["att"], "z": rd(v["z"])} for n, v in QBZ.items() if v["att"] >= 30}, separators=(",", ":")) + ";")
print("const NFL_RZP=" + json.dumps({n: v for n, v in RZ.items() if v["c20"][0] + v["t20"][0] >= 3}, separators=(",", ":")) + ";  /* red zone: c20/c10/c5 = [carries, TD]; t20/t10 = [targets, catches, TD]; ez = end-zone targets by side [targets, catches, TD] */")
print("const NFL_RZD=" + json.dumps(RZD, separators=(",", ":")) + ";  /* red zone allowed: ru = [carries, rush TD], pa = [targets, catches, pass TD], ez = end-zone targets by side */")
print("const NFL_GWX=" + json.dumps(GWX, separators=(",", ":")) + ";  /* week|team -> [roof, temp F, wind mph] (nflverse; dome/closed roofs have no weather) */")
print("const NFL_GQB=" + json.dumps({k: c.most_common(1)[0][0] for k, c in GQB.items()}, separators=(",", ":")) + ";  /* week|team -> QB with the most pass attempts that game */")
print("const NFL_BLITZ=" + json.dumps(BLo, separators=(",", ":")) + ";")
print(f"nfltgt: {len(PL)} players, {len(DF)} defenses, weeks {wk}, ftn plays {len(ftn)}", file=sys.stderr)
# game script: each team's closing spread (negative = favored) and final margin, this season (nflverse games.csv)
gp = os.path.join(D, "games.csv"); SPR = {}
if os.path.exists(gp):
    yr = max(int(r["season"]) for r in csv.DictReader(open(gp)))
    for r in csv.DictReader(open(gp)):
        if int(r["season"]) != yr or r["game_type"] != "REG" or r["spread_line"] == "" or r["home_score"] == "": continue
        sl = float(r["spread_line"]); m = int(r["home_score"]) - int(r["away_score"]); w = int(r["week"])
        fx = lambda t: "LAR" if t == "LA" else t
        tl = float(r["total_line"]) if r["total_line"] else None
        SPR[f"{w}|{fx(r['home_team'])}"] = [-sl, m, tl]; SPR[f"{w}|{fx(r['away_team'])}"] = [sl, -m, tl]
RST = {}
if os.path.exists(gp):
    for r in csv.DictReader(open(gp)):
        if int(r["season"]) != yr or r["game_type"] != "REG": continue
        fx = lambda t: "LAR" if t == "LA" else t; w = int(r["week"])
        if r["home_rest"]: RST[f"{w}|{fx(r['home_team'])}"] = int(r["home_rest"])
        if r["away_rest"]: RST[f"{w}|{fx(r['away_team'])}"] = int(r["away_rest"])
print("const NFL_SPR=" + json.dumps(SPR, separators=(",", ":")) + ";")
print("const NFL_RST=" + json.dumps(RST, separators=(",", ":")) + ";")
print(f"nfltgt: {len(SPR)//2} games with spreads", file=sys.stderr)
