#!/usr/bin/env python3
"""Faster first load: the NFL box scores (BOX, ~120 KB) are only needed on finished-game pages, so they move out of the main
page into nfl_box2.js, loaded on demand with the quarter boxes (adv.js: nflBoxqEnsure).
usage: python3 tools/splitbox.py adv_data.js   -> writes adv_core.js (concatenated into index.html) + nfl_box2.js"""
import sys
s = open(sys.argv[1], encoding="utf8").read(); core, box = [], []
for line in s.split("\n"):
    if line.startswith("const BOX="): box.append("var BOX=" + line[len("const BOX="):])
    else: core.append(line)
open("adv_core.js", "w", encoding="utf8").write("\n".join(core) + ("\nvar BOX;  /* filled by nfl_box2.js on demand */\n" if box else "\n"))
open("nfl_box2.js", "w", encoding="utf8").write("/* NFL box scores (nflverse) — split out of adv_data.js by tools/splitbox.py, loaded on game pages */\n" + "\n".join(box) + "\nvar NFL_BOX2_OK=1;\n")
print(f"splitbox: {sum(map(len, box))//1024} KB moved to nfl_box2.js", file=sys.stderr)
