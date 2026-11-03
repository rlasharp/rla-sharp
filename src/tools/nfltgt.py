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
for r in csv.DictReader(gzip.open(os.path.join(D, "pbp.csv.gz"), "rt")):
    if r["season_type"] != "REG" or r["two_point_attempt"] == "1": continue
    key = (r["game_id"], r["play_id"]); f = ftn.get(key)
    if r["qb_dropback"] == "1" and r["defteam"] and f is not None:
        dt = "LAR" if r["defteam"] == "LA" else r["defteam"]; BL[dt][1] += 1; BL[dt][0] += 1 if f[1] else 0
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
