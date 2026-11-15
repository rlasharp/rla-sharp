#!/usr/bin/env python3
"""Split nfl_tgt.js (NFL targets / zones / red zone / blitz / spreads / rest — ~200 KB) out of the page:
 nfl_tgt_stub.js  -> bundled: empty placeholders with the same names (var NFL_X={})
 nfl_tgt_lazy.js  -> next to index.html, loaded on demand (window.NFL_X=...; window.NFL_TGT_OK=1)
The router waits for it on NFL pages (ui.js route -> nflLazy). usage: python3 tools/nfllazy.py (run in src/)"""
import re
src = open("nfl_tgt.js", encoding="utf-8").read()
names = re.findall(r"^const (NFL_\w+)\s*=", src, re.M)
stub = "/* NFL target data loads on demand from nfl_tgt_lazy.js (tools/nfllazy.py) */\n" + "".join(f'var {n}={"" if n.endswith("WEEKS") else {}};\n'.replace("{}", "{}") for n in names)
stub = "/* NFL target data loads on demand from nfl_tgt_lazy.js (tools/nfllazy.py) */\n" + "".join(f"var {n}={chr(34)*2 if n.endswith('WEEKS') else '{}'};\n" for n in names) + "var NFL_TGT_OK=0;\n"
lazy = re.sub(r"^const (NFL_\w+)\s*=", r"window.\1=", src, flags=re.M) + "\nwindow.NFL_TGT_OK=1;\n"
open("nfl_tgt_stub.js", "w", encoding="utf-8").write(stub); open("nfl_tgt_lazy.js", "w", encoding="utf-8").write(lazy)
print(f"nfllazy: {len(names)} NFL target tables -> nfl_tgt_lazy.js ({len(lazy)//1024} KB)")
