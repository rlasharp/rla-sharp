#!/usr/bin/env python3
"""Closing prop lines per player (from data/close/<game date>.json, saved by tools/fetch_odds.py since Nov 2, 2026)
-> lines_hist.js (var LINE_HIST={"nba|Player|mk":[[date,line],...]}), loaded on demand by the site.
usage (from src/): python3 tools/linehist.py REPO > lines_hist.js"""
import json, os, sys, glob
REPO = sys.argv[1] if len(sys.argv) > 1 else ".."
H = {}
for f in sorted(glob.glob(os.path.join(REPO, "data", "close", "*.json"))):
    d = os.path.basename(f)[:10]
    try: m = json.load(open(f))
    except Exception: continue
    for k, v in m.items():
        H.setdefault(k, []).append([d, v[0]])
print("/* closing prop lines by player — tools/linehist.py */")
print("var LINE_HIST=" + json.dumps(H, separators=(",", ":"), ensure_ascii=False) + ";")
