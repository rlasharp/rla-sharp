# Usage: python3 tools/injgen.py data/espn_inj.txt "Sat Oct 31"  -> rewrites the INJ block in inj.js
import sys,json,re
src,asof=sys.argv[1],sys.argv[2]
d={};t=None
for ln in open(src,encoding="utf-8"):
    ln=ln.rstrip("\n")
    if not ln.strip() or ln.startswith("# "): continue
    if ln.startswith("#"): t=ln[1:].strip(); d.setdefault(t,[]); continue
    p=(ln.split("|")+["",""])[:5]
    d[t].append([x.strip() for x in p])
body="const INJ_ASOF="+json.dumps(asof)+";\nconst INJ={\n"+"".join(f"  {k}:{json.dumps(v,ensure_ascii=False)},\n" for k,v in d.items())+"};\n"
js=open("inj.js",encoding="utf-8").read()
js=re.sub(r"const INJ_ASOF=.*?\n\};\n",lambda m:body,js,count=1,flags=re.S)
open("inj.js","w",encoding="utf-8").write(js)
print(sum(len(v) for v in d.values()),"players,",len(d),"teams")
