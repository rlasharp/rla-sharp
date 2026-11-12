#!/usr/bin/env python3
"""Make index.html lighter without changing what any code does: inside each <script> block, drop indentation,
blank lines and comment-only lines (a line that is just // ... or a /* ... */ block starting at the line start).
Code inside a line is never touched. The site check (tools/check.js) runs on the result before anything is published.
usage: python3 tools/slim.py index.html   (in place)"""
import re, sys
p = sys.argv[1]; s = open(p, encoding="utf-8").read()
def slim(js):
    out, blk = [], False
    for ln in js.split("\n"):
        t = ln.lstrip()
        if blk:
            if t.rstrip().endswith("*/"): blk = False
            continue
        if t.startswith("/*") and "*/" not in t: blk = True; continue
        if t.startswith("/*") and t.rstrip().endswith("*/") and t.count("*/") == 1: continue
        if t.startswith("//") or not t: continue
        out.append(t)
    return "\n".join(out)
parts = re.split(r"(<script>)(.*?)(</script>)", s, flags=re.S); o = []; i = 0
while i < len(parts):
    if parts[i] == "<script>": o += ["<script>", slim(parts[i + 1]), "</script>"]; i += 3
    else: o.append(parts[i]); i += 1
n = "".join(o); open(p, "w", encoding="utf-8").write(n)
print(f"slim: {len(s)//1024} KB -> {len(n)//1024} KB")
