#!/usr/bin/env python3
"""NFL referee crews -> nfl_refs.js (var NFL_REFS). Runs with the NFL site update.
  Every final regular-season game this season (ESPN summary, cached in data/nfl_refs.json so each game is read once):
  the referee, both teams' penalties + penalty yards, total points. Per referee: games, flags a game, yards, points.
  This week's games: the referee once ESPN lists the crew (usually late in the week). Real data only.
usage (from src/): python3 tools/nflrefs.py > nfl_refs.js"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from auto_espn import get, teams_of, FIX_NFL, B
ROOT = os.environ.get("REPO", os.path.abspath(".."))
CF = os.path.join(ROOT, "data/nfl_refs.json")
try: C = json.load(open(CF))
except Exception: C = {}
wk = int(re.search(r"PLAYS_WEEK=(\d+)", open("plays.js", encoding="utf-8").read()).group(1))
slate = {(a, h): int(i) for i, a, h in re.findall(r'\{id:(\d+),away:"(\w+)",home:"(\w+)"', open("engine.js", encoding="utf-8").read())}
def ref_of(s): return next((o.get("displayName") for o in ((s.get("gameInfo") or {}).get("officials") or []) if ((o.get("position") or {}).get("name") == "Referee")), None)
UP, newg = {}, 0
for w in range(1, wk + 1):
    try: sb = get(B + f"football/nfl/scoreboard?week={w}&seasontype=2")
    except SystemExit: continue
    for e in sb.get("events") or []:
        eid, st = e["id"], ((e.get("status") or {}).get("type") or {}).get("name")
        c = e["competitions"][0]; a, h, T = teams_of(c, FIX_NFL)
        if st == "STATUS_FINAL":
            if eid in C and len(C[eid]) >= 6 and all(len(v) >= 4 for v in C[eid][5].values()): continue   # older cache rows (no sack / red-zone numbers) are read again once
            try: s = get(B + "football/nfl/summary?event=" + eid)
            except SystemExit: continue
            r = ref_of(s); pen = yds = 0; ok = False; SK = {}
            for t in (s.get("boxscore") or {}).get("teams") or []:
                ab = FIX_NFL.get(t["team"]["abbreviation"], t["team"]["abbreviation"]); sk = att = None; rz = [0, 0]
                for x in t.get("statistics") or []:
                    v = str(x.get("displayValue") or "")
                    if x.get("name") == "totalPenaltiesYards" and "-" in v:
                        n, y = v.split("-", 1); pen += int(n); yds += int(y); ok = True
                    if x.get("name") == "sacksYardsLost" and "-" in v: sk = int(v.split("-", 1)[0])
                    if x.get("name") == "completionAttempts" and "/" in v: att = int(v.split("/", 1)[1])
                    if x.get("name") == "redZoneAttempts" and "-" in v: rz = [int(z) for z in v.split("-", 1)]   # red-zone TDs - trips
                if sk is not None and att is not None: SK[ab] = [sk, att + sk, rz[0], rz[1]]   # sacks taken, dropbacks (passes + sacks)
            pts = sum(int(T[k].get("score") or 0) for k in ("away", "home"))
            if r and ok: C[eid] = [w, r, pen, yds, pts, SK]; newg += 1
        elif w == wk and (a, h) in slate:
            try: r = ref_of(get(B + "football/nfl/summary?event=" + eid))
            except SystemExit: r = None
            if r: UP[slate[(a, h)]] = r
json.dump(C, open(CF, "w"), separators=(",", ":"))
G = list(C.values())
if not G: sys.exit("nflrefs: no games — keeping the old file")
R = {}
SKT = {}
for g in G:
    if len(g) < 6: continue
    T2 = list(g[5].items())
    for i, (ab, v) in enumerate(T2):
        sk, db = v[0], v[1]; rt, ra = (v[2], v[3]) if len(v) >= 4 else (0, 0)
        z = {"osk": 0, "odb": 0, "dsk": 0, "ddb": 0, "ort": 0, "ora": 0, "drt": 0, "dra": 0}
        o = SKT.setdefault(ab, dict(z)); o["osk"] += sk; o["odb"] += db; o["ort"] += rt; o["ora"] += ra
        if len(T2) == 2:
            d = SKT.setdefault(T2[1 - i][0], dict(z)); d["dsk"] += sk; d["ddb"] += db; d["drt"] += rt; d["dra"] += ra
for w, r, p, y, t, *_ in G:
    x = R.setdefault(r, [0, 0, 0, 0]); x[0] += 1; x[1] += p; x[2] += y; x[3] += t
out = {"r": {r: {"n": n, "pen": round(p / n, 2), "yds": round(y / n, 1), "pts": round(t / n, 1)} for r, (n, p, y, t) in R.items()},
       "lg": {"pen": round(sum(g[2] for g in G) / len(G), 2), "pts": round(sum(g[4] for g in G) / len(G), 1)}, "g": UP, "wk": wk, "sk": SKT}
print(f"/* NFL referee crews — ESPN officials + team penalties (tools/nflrefs.py), {len(G)} games */")
print("var NFL_REFS=" + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"nflrefs: {len(G)} games ({newg} new), {len(R)} referees, {len(UP)} of this week's crews posted", file=sys.stderr)
