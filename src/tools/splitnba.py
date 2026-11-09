#!/usr/bin/env python3
"""Faster first load: moves the NBA detail data that only player / prop pages use (rebound & assist chances, shot
zones, shot types — ~200 KB) out of the main page into nba_detail.js, loaded on demand (nba.js: nbaDetailEnsure).
usage: python3 tools/splitnba.py nba_data.js   -> writes nba_data_core.js (concatenated into index.html) + nba_detail.js"""
import re, sys
DETAIL = ("NBA_CHANCE", "NBA_SHOT", "NBA_STYPE", "NBA_Q1", "NBA_PREV", "NBA_BIO")
s = open(sys.argv[1], encoding="utf8").read()
core, det = [], []
for line in s.split("\n"):
    m = re.match(r"const (\w+)=", line)
    if m and m.group(1) in DETAIL: det.append(line[len("const "):])
    else: core.append(line)
stub = "var " + ",".join(f"{v}={{}}" for v in DETAIL) + ";  /* filled by nba_detail.js on demand */"
open("nba_data_core.js", "w", encoding="utf8").write("\n".join(core) + "\n" + stub + "\n")
open("nba_detail.js", "w", encoding="utf8").write("/* NBA detail data (chances, shot zones, shot types, last season, bios) — split out of nba_data.js by tools/splitnba.py */\n" + "\n".join(det) + "\nvar NBA_DETAIL_OK=1;\n")
print(f"splitnba: {len(det)} blocks, {sum(map(len, det))//1024} KB moved to nba_detail.js", file=sys.stderr)
