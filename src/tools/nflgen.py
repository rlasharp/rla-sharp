#!/usr/bin/env python3
"""NFL extras from nflverse (free, public, on GitHub releases):
   standings + playoff picture, upcoming schedule, target/snap share, pass rush vs offensive line.
Usage: python3 tools/nflgen.py <nflverse dir> > nfl_extra.js
The dir must hold games.csv, stats_player_week_<YEAR>.csv (saved as pstats.csv), snap_counts_<YEAR>.csv
(saved as snaps.csv) and play_by_play_<YEAR>.csv.gz (saved as pbp.csv.gz) — tools/nflfetch.sh downloads them."""
import csv, gzip, json, sys, os, collections

D = sys.argv[1]
YEAR = int(sys.argv[2]) if len(sys.argv) > 2 else 2026
FIX = {"LA": "LAR", "STL": "LAR", "SD": "LAC", "OAK": "LV"}
fx = lambda t: FIX.get(t, t)
DIV = {"AFC East": ["BUF", "MIA", "NE", "NYJ"], "AFC North": ["BAL", "CIN", "CLE", "PIT"], "AFC South": ["HOU", "IND", "JAX", "TEN"],
       "AFC West": ["DEN", "KC", "LV", "LAC"], "NFC East": ["DAL", "NYG", "PHI", "WAS"], "NFC North": ["CHI", "DET", "GB", "MIN"],
       "NFC South": ["ATL", "CAR", "NO", "TB"], "NFC West": ["ARI", "LAR", "SF", "SEA"]}
DIVOF = {t: d for d, ts in DIV.items() for t in ts}

# ---------- standings ----------
games = [r for r in csv.DictReader(open(os.path.join(D, "games.csv"))) if r["season"] == str(YEAR)]
reg = [g for g in games if g["game_type"] == "REG"]
done = [g for g in reg if g["home_score"] != "" and g["away_score"] != ""]
S = {t: dict(w=0, l=0, t=0, pf=0, pa=0, hw=0, hl=0, aw=0, al=0, dw=0, dl=0, cw=0, cl=0, seq=[]) for t in DIVOF}
for g in sorted(done, key=lambda g: (int(g["week"]), g["gameday"])):
    a, h, sa, sh = fx(g["away_team"]), fx(g["home_team"]), int(g["away_score"]), int(g["home_score"])
    for me, op, pf, pa, home in ((a, h, sa, sh, 0), (h, a, sh, sa, 1)):
        s = S[me]; s["pf"] += pf; s["pa"] += pa
        r = "w" if pf > pa else "l" if pf < pa else "t"
        s[r] += 1; s["seq"].append(r.upper())
        if r != "t":
            s[("h" if home else "a") + r] += 1
            if DIVOF[me] == DIVOF[op]: s["d" + r] += 1
            if DIVOF[me][:3] == DIVOF[op][:3]: s["c" + r] += 1
pct = lambda s: (s["w"] + .5 * s["t"]) / max(1, s["w"] + s["l"] + s["t"])
for t, s in S.items():
    seq = s.pop("seq"); s["l5"] = "".join(seq[-5:])
    st = 0
    for x in reversed(seq):
        if x == seq[-1]: st += 1
        else: break
    s["strk"] = (seq[-1] + str(st)) if seq else "–"
    s["pct"] = round(pct(s), 3)
key = lambda t: (pct(S[t]), (S[t]["dw"] + .0) / max(1, S[t]["dw"] + S[t]["dl"]), S[t]["pf"] - S[t]["pa"])
SEEDS = {}
for conf in ("AFC", "NFC"):
    divs = [d for d in DIV if d.startswith(conf)]
    winners = sorted([max(DIV[d], key=key) for d in divs], key=key, reverse=True)
    rest = sorted([t for d in divs for t in DIV[d] if t not in winners], key=key, reverse=True)
    SEEDS[conf] = winners + rest[:3]
    SEEDS[conf + "_hunt"] = rest[3:6]

# ---------- upcoming schedule (next 3 games for every team) ----------
NEXT = collections.defaultdict(list)
up = sorted([g for g in reg if g["home_score"] == ""], key=lambda g: (int(g["week"]), g["gameday"], g["gametime"] or ""))
for g in up:
    a, h = fx(g["away_team"]), fx(g["home_team"])
    for me, op, ha in ((a, h, "A"), (h, a, "H")):
        if len(NEXT[me]) < 3: NEXT[me].append([int(g["week"]), g["gameday"], op, ha, g["gametime"] or ""])
last_week = max([int(g["week"]) for g in done] or [0])

# ---------- target share + snap share ----------
ps = [r for r in csv.DictReader(open(os.path.join(D, "pstats.csv"))) if r.get("season_type", "REG") == "REG"]
sn = [r for r in csv.DictReader(open(os.path.join(D, "snaps.csv"))) if r.get("game_type", "REG") == "REG"]
f = lambda v: float(v) if v not in ("", "NA", None) else 0.0
P = collections.defaultdict(lambda: {"pos": "", "team": "", "wk": {}})
for r in ps:
    if r["position"] not in ("WR", "TE", "RB"): continue
    p = P[r["player_display_name"]]; p["pos"] = r["position"]; p["team"] = fx(r["team"])
    p["wk"].setdefault(int(r["week"]), {})["ts"] = f(r["target_share"]); p["wk"][int(r["week"])]["tg"] = f(r["targets"])
    p["wk"][int(r["week"])]["ay"] = f(r.get("air_yards_share")); p["wk"][int(r["week"])]["car"] = f(r.get("carries"))
for r in sn:
    if r["position"] not in ("WR", "TE", "RB"): continue
    p = P[r["player"]]
    if not p["pos"]: p["pos"] = r["position"]
    p["team"] = p["team"] or fx(r["team"])
    p["wk"].setdefault(int(r["week"]), {})["sp"] = f(r["offense_pct"])
SHARE = collections.defaultdict(list)
for n, p in P.items():
    wks = sorted(p["wk"]);
    if not wks: continue
    rows = [p["wk"][w] for w in wks]; l3 = rows[-3:]
    avg = lambda rs, k: round(sum(x.get(k, 0) for x in rs) / len(rs) * 100, 1) if rs else 0
    tot = lambda rs, k: round(sum(x.get(k, 0) for x in rs) / len(rs), 1) if rs else 0
    rec = [n, p["pos"], avg(rows, "ts"), avg(l3, "ts"), avg(rows, "sp"), avg(l3, "sp"), tot(l3, "tg"), avg(rows, "ay"), len(rows), tot(l3, "car")]
    if rec[4] < 15 and rec[2] < 5: continue
    SHARE[p["team"]].append(rec)
for t in SHARE: SHARE[t].sort(key=lambda r: (-r[3] - r[5] / 4))

# ---------- pass rush vs offensive line (play-by-play) ----------
O = collections.defaultdict(lambda: [0, 0, 0]); Dd = collections.defaultdict(lambda: [0, 0, 0])
for r in csv.DictReader(gzip.open(os.path.join(D, "pbp.csv.gz"), "rt")):
    if r.get("season_type") != "REG" or r.get("qb_dropback") != "1": continue
    pt, dt = fx(r["posteam"]), fx(r["defteam"])
    s, h = int(f(r["sack"])), int(f(r["qb_hit"]))
    for M, t in ((O, pt), (Dd, dt)): M[t][0] += 1; M[t][1] += s; M[t][2] += max(h, s)
PRESS = {}
for t in DIVOF:
    o, d = O[t], Dd[t]
    PRESS[t] = {"sackA": round(o[1] / max(1, o[0]) * 100, 1), "hitA": round(o[2] / max(1, o[0]) * 100, 1),
                "sackD": round(d[1] / max(1, d[0]) * 100, 1), "hitD": round(d[2] / max(1, d[0]) * 100, 1), "db": o[0]}
for k, best_low in (("sackA", True), ("hitA", True), ("sackD", False), ("hitD", False)):
    for i, t in enumerate(sorted(PRESS, key=lambda t: PRESS[t][k], reverse=not best_low)): PRESS[t][k + "R"] = i + 1

out = {"NFL_XWEEK": last_week, "NFL_STAND": S, "NFL_DIV": DIV, "NFL_SEEDS": SEEDS, "NFL_NEXT": NEXT, "NFL_SHARE": SHARE, "NFL_PRESS": PRESS}
print("/* NFL extras from nflverse (games, player stats, snap counts, play-by-play). Generated by tools/nflgen.py — do not hand-edit. */")
for k, v in out.items(): print(f"const {k}={json.dumps(v, separators=(',', ':'))};")
print(f"teams {len(S)}, through week {last_week}, share players {sum(len(v) for v in SHARE.values())}, upcoming {sum(len(v) for v in NEXT.values())}", file=sys.stderr)
