#!/usr/bin/env python3
"""nba_spr.js from the repo's data/nba_spreads.json (GitHub Action, ESPN closing spreads).
Usage: python3 tools/nbaspr.py [/home/claude/rla-sharp/data/nba_spreads.json] > nba_spr.js"""
import json, sys, os
p = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/rla-sharp/data/nba_spreads.json"
d = json.load(open(p)) if os.path.exists(p) else {}
print("/* NBA closing spreads per game (ESPN via the spreads GitHub Action): id -> [date, away, home, homeSpread, total, awayPts, homePts, book] */")
print("const NBA_SPR=" + json.dumps({k: v for k, v in d.items()}, separators=(",", ":")) + ";")
