#!/usr/bin/env python3
"""Soccer manager news -> soccer_mgr.js (var SOC_MGR). Runs with the soccer site update.
ESPN's news feed for each league we cover; headlines about a manager being sacked / leaving, appointed, made interim,
suspended or under pressure, tagged with the club (ESPN team id = our team id). Kept 60 days in data/soccer_mgr.json so
a new manager still shows a few weeks later. Questions ("Who will be ... if X is sacked?") are skipped. Real headlines only.
usage (from src/): python3 tools/socmgr.py > soccer_mgr.js"""
import json, re, sys, os, datetime as dt
sys.path.insert(0, os.path.dirname(__file__))
from auto_espn import get, B
ROOT = os.environ.get("REPO", os.path.abspath(".."))
CF = os.path.join(ROOT, "data/soccer_mgr.json")
try: C = json.load(open(CF))
except Exception: C = {}
LG = ["eng.1", "esp.1", "ita.1", "ger.1", "fra.1", "eng.2", "ned.1", "por.1", "usa.1", "uefa.champions"]
K = [("sacked", r"\b(sacked|fired|dismissed|parted ways|part ways|relieved of (his|her) duties|leaves? (the )?club|steps? down|resign(s|ed)?)\b"),
     ("suspended", r"\b(suspended|touchline ban|banned from the touchline|sent to the stands)\b"),
     ("appointed", r"\b(appointed|named (as )?(new )?(head coach|manager|boss)|new (head coach|manager|boss)|hires?|unveil(s|ed)?)\b"),
     ("interim", r"\b(interim|caretaker)\b"),
     ("pressure", r"\b(on the brink|under pressure|job (is )?(in danger|at risk|on the line)|future in doubt|set to be sacked|facing the sack)\b")]
ROLE = re.compile(r"\b(manager|coach|boss|head coach|sack|interim|caretaker|touchline)\b", re.I)
now = dt.datetime.now(dt.timezone.utc); n = 0
for lg in LG:
    try: A = get(B + f"soccer/{lg}/news?limit=50").get("articles") or []
    except SystemExit: continue
    for a in A:
        h = (a.get("headline") or "").strip(); txt = h + " " + (a.get("description") or "")
        if not h or h.endswith("?") or not ROLE.search(txt): continue
        k = next((k for k, rx in K if re.search(rx, h, re.I)), None) or next((k for k, rx in K if re.search(rx, txt, re.I)), None)
        if not k: continue
        teams = [str(c.get("teamId") or (c.get("team") or {}).get("id")) for c in a.get("categories") or [] if c.get("type") == "team"]
        url = ((a.get("links") or {}).get("web") or {}).get("href") or ""
        for t in teams[:2]:
            if t == "None": continue
            L = C.setdefault(t, [])
            if any(x["h"] == h for x in L): continue
            L.append({"h": h, "at": a.get("published") or now.isoformat(), "url": url, "k": k}); n += 1
cut = (now - dt.timedelta(days=60)).isoformat()
C = {t: sorted([x for x in L if x["at"] >= cut], key=lambda x: x["at"], reverse=True)[:4] for t, L in C.items()}
C = {t: L for t, L in C.items() if L}
json.dump(C, open(CF, "w"), separators=(",", ":"), ensure_ascii=False)
print(f"/* Soccer manager news — ESPN headlines (tools/socmgr.py), {now:%Y-%m-%d %H:%MZ} */")
print("var SOC_MGR=" + json.dumps(C, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"socmgr: {n} new headlines, {len(C)} clubs with manager news", file=sys.stderr)
