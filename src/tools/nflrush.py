#!/usr/bin/env python3
"""Pass rush vs offensive line extras from nflverse play-by-play + FTN charting.
Usage: python3 tools/nflrush.py /home/claude/nflv > nfl_rush.js
"Pressured" here = the QB was sacked, hit, or scrambled (free play-by-play has no hurries).
Outputs:
  NFL_RUSH[team] = {o:{p, pR, p4, p4R}, d:{p, pR, p4, p4R, blz, blzR}}   pressure % per dropback, season + last 4 games; blitz % (5+ rushers)
  NFL_QBP[name]  = {db, pdb, cy, py, cd, pd, ci, pi, by, ny, bdb}  dropbacks; yards per dropback clean/pressured; deep-throw % clean/pressured;
                   INT % clean/pressured; yards per dropback vs blitz / no blitz, blitzed dropbacks
"""
import csv, gzip, json, os, sys, collections
D = sys.argv[1]
names = {}
for r in csv.DictReader(open(os.path.join(D, "pstats.csv"))):
    names[r["player_id"]] = r["player_display_name"]
ftn = {}
fp = os.path.join(D, "ftn.csv")
if os.path.exists(fp):
    for r in csv.DictReader(open(fp)):
        try: ftn[(r["nflverse_game_id"], r["nflverse_play_id"])] = int(r["n_pass_rushers"] or 0)
        except ValueError: pass
off = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))   # team -> week -> [dropbacks, pressured]
dfn = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))
blz = collections.defaultdict(lambda: [0, 0])                                     # def team -> [charted dropbacks, 5+ rushers]
qb = collections.defaultdict(lambda: collections.Counter())
weeks = set()
for r in csv.DictReader(gzip.open(os.path.join(D, "pbp.csv.gz"), "rt")):
    if r["season_type"] != "REG" or r["qb_dropback"] != "1" or not r["posteam"] or not r["defteam"]: continue
    if r.get("two_point_attempt") == "1" or r.get("qb_spike") == "1" or r.get("qb_kneel") == "1": continue
    wk = int(r["week"]); weeks.add(wk)
    pr = r["sack"] == "1" or r["qb_hit"] == "1" or r["qb_scramble"] == "1"
    o = off[r["posteam"]][wk]; o[0] += 1; o[1] += pr
    d = dfn[r["defteam"]][wk]; d[0] += 1; d[1] += pr
    nr = ftn.get((r["game_id"], r["play_id"]))
    if nr: blz[r["defteam"]][0] += 1; blz[r["defteam"]][1] += nr >= 5
    pid = r["passer_player_id"] or (r["rusher_player_id"] if r["qb_scramble"] == "1" else "")
    if not pid: continue
    y = float(r["yards_gained"] or 0); c = qb[pid]; k = "p" if pr else "c"
    c["db"] += 1; c[k + "db"] += 1; c[k + "y"] += y
    if r["pass_attempt"] == "1" and r["sack"] != "1":
        c[k + "att"] += 1; c[k + "deep"] += (float(r["air_yards"] or 0) >= 20); c[k + "int"] += r["interception"] == "1"
    if nr:
        b = "b" if nr >= 5 else "n"; c[b + "db"] += 1; c[b + "y"] += y
if not weeks: sys.exit("no play-by-play rows")
def rate(wd, last=None):
    ks = sorted(wd)[-last:] if last else wd
    db = sum(wd[k][0] for k in ks); return round(100 * sum(wd[k][1] for k in ks) / db, 1) if db else None
def ranks(vals, low_is_best):
    s = sorted(vals, key=lambda t: vals[t] if low_is_best else -vals[t]); return {t: i + 1 for i, t in enumerate(s)}
T = sorted(off)
op = {t: rate(off[t]) for t in T}; op4 = {t: rate(off[t], 4) for t in T}
dp = {t: rate(dfn[t]) for t in T}; dp4 = {t: rate(dfn[t], 4) for t in T}
bz = {t: round(100 * blz[t][1] / blz[t][0], 1) if blz[t][0] else 0 for t in T}
R = [ranks(op, True), ranks(op4, True), ranks(dp, False), ranks(dp4, False), ranks(bz, False)]
rush = {t: {"o": {"p": op[t], "pR": R[0][t], "p4": op4[t], "p4R": R[1][t]},
            "d": {"p": dp[t], "pR": R[2][t], "p4": dp4[t], "p4R": R[3][t], "blz": bz[t], "blzR": R[4][t]}} for t in T}
qbp = {}
for pid, c in qb.items():
    if c["db"] < 60 or c["pdb"] < 12 or pid not in names: continue
    f = lambda a, b, m=1: round(m * c[a] / c[b], 1) if c[b] else None
    qbp[names[pid]] = {"db": c["db"], "pdb": c["pdb"], "cy": f("cy", "cdb"), "py": f("py", "pdb"),
                       "cd": f("cdeep", "catt", 100), "pd": f("pdeep", "patt", 100), "ci": f("cint", "catt", 100), "pi": f("pint", "patt", 100),
                       "by": f("by", "bdb"), "ny": f("ny", "ndb"), "bdb": c["bdb"]}
print("/* Pass rush vs offensive line — nflverse play-by-play (regular season, weeks %d-%d) + FTN charting (blitzes). tools/nflrush.py — do not hand-edit.\n"
      "   Pressured = sacked, hit or scrambled, per dropback. */" % (min(weeks), max(weeks)))
print("const NFL_RUSH_WK=%d;" % max(weeks))
print("const NFL_RUSH=" + json.dumps(rush, separators=(",", ":")) + ";")
print("const NFL_QBP=" + json.dumps(qbp, separators=(",", ":"), ensure_ascii=False) + ";")
print("teams %d, QBs %d, weeks %d-%d" % (len(rush), len(qbp), min(weeks), max(weeks)), file=sys.stderr)
