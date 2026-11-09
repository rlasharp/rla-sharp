#!/usr/bin/env python3
"""NHL power-play time per player per game (ESPN box scores: PPTOI / TOI) -> appended to nhl_data.js as var NHL_PP.
Linemates / line combinations are not published in any free feed before games, so only PP time is tracked.
Cache: data/nhl_pp.json (src/). usage (from src/, after nhlfetch): python3 tools/nhlpp.py >> nhl_data.js"""
import json, sys, time, urllib.request, datetime as dt
UA = {"User-Agent": "rla-sharp-site-updater"}
B = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/"
def log(*a): print(*a, file=sys.stderr)
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25) as r: return json.load(r)
def sec(v):
    try: m, s = str(v).split(":"); return int(m) * 60 + int(s)
    except Exception: return None
try: C = json.load(open("data/nhl_pp.json"))
except Exception: C = {}
C.setdefault("done", []); C.setdefault("p", {})
start = dt.date(2026, 10, 1); today = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=5)).date()
days = [(start + dt.timedelta(days=i)).isoformat() for i in range((today - start).days)]
n_req = 0
for d in days:
    if d in C["done"] or n_req > 400: continue
    try: sb = get(B + "scoreboard?dates=" + d.replace("-", "")); n_req += 1; time.sleep(0.1)
    except Exception as e: log("nhlpp scoreboard", d, e); continue
    ok = True
    for e in sb.get("events") or []:
        c = (e.get("competitions") or [{}])[0]
        if not ((c.get("status") or {}).get("type") or {}).get("completed"): ok = False; continue
        try: s = get(B + "summary?event=" + str(e["id"])); n_req += 1; time.sleep(0.1)
        except Exception as x: log("nhlpp summary", e.get("id"), x); ok = False; continue
        for tm in (s.get("boxscore") or {}).get("players") or []:
            for grp in tm.get("statistics") or []:
                lab = [str(x).upper() for x in (grp.get("labels") or grp.get("keys") or [])]
                if "PPTOI" not in lab: continue
                ip, it = lab.index("PPTOI"), lab.index("TOI") if "TOI" in lab else None
                for a in grp.get("athletes") or []:
                    nm = (a.get("athlete") or {}).get("displayName"); st = a.get("stats") or []
                    if not nm or len(st) <= ip: continue
                    pp = sec(st[ip]); toi = sec(st[it]) if it is not None and len(st) > it else None
                    if pp is not None: C["p"].setdefault(nm, {})[d] = [pp, toi]
    if ok: C["done"].append(d)
json.dump(C, open("data/nhl_pp.json", "w"), separators=(",", ":"))
out = {}
for nm, g in C["p"].items():
    rows = sorted(g.items())[-15:]
    if any(v[0] for _, v in rows): out[nm] = [[d, v[0], v[1]] for d, v in rows]
log(f"NHL PP time: {len(out)} players, {n_req} ESPN requests this run")
print("var NHL_PP=" + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";")
