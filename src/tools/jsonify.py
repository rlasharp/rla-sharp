#!/usr/bin/env python3
"""Speed-up for phones: big one-line data literals (const X={...};) are rewritten as
const X=JSON.parse("..."), which browsers parse several times faster than a JS object literal.
Lines that are not pure JSON are left alone, so this is always safe to run. Usage: python3 tools/jsonify.py index.html"""
import re, json, sys
p = sys.argv[1]; L = open(p, encoding="utf-8").read().split("\n"); n = 0; saved = 0
for i, l in enumerate(L):
    if len(l) < 10000: continue
    m = re.match(r'^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([\[{].*);\s*$', l)
    if not m: continue
    try: v = json.loads(m.group(3))
    except Exception: continue
    t = json.dumps(v, separators=(",", ":"), ensure_ascii=False)
    lit = "'" + t.replace("\\", "\\\\").replace("'", "\\'").replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029") + "'"
    new = f"{m.group(1)} {m.group(2)}=JSON.parse({lit});"
    saved += len(new.encode()) - len(l.encode()); L[i] = new; n += 1
open(p, "w", encoding="utf-8").write("\n".join(L))
print(f"jsonify: {n} data blocks now use JSON.parse ({saved:+d} bytes)")
