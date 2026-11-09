#!/usr/bin/env python3
"""NFL box scores from ESPN right after each game goes final (the weekly nflverse box scores arrive on Tuesdays).
Finished games of the current and previous week that adv_data.js doesn't have yet -> nfl_box.js:
  var BOX_ESPN={"wk|AWAY|HOME":{p:[[name,team,comp,att,yds,td,int]],r:[[name,team,car,yds,td]],c:[[name,team,rec,tgt,yds,td]]}}
Cached in data/nfl_box.json (each final game is downloaded once). Real data only.
usage: python3 tools/nflbox.py <repo root> > nfl_box.js"""
import json, os, re, sys, urllib.request
R = sys.argv[1]; B = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/"
FIX = {"WSH": "WAS", "LA": "LAR", "JAC": "JAX"}; fx = lambda t: FIX.get(t, t)
def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))
CF = os.path.join(R, "data/nfl_box.json")
try: C = json.load(open(CF))
except Exception: C = {}
have = set(re.findall(r'"(\d+\|[A-Z]+\|[A-Z]+)"\s*:', open("adv_data.js", encoding="utf8").read())) if os.path.exists("adv_data.js") else set()
sb = get(B + "scoreboard"); wk = int((sb.get("week") or {}).get("number") or 0); n_new = 0
for w in sorted({wk, wk - 1} - {0}):
    try: d = get(B + f"scoreboard?week={w}&seasontype=2")
    except Exception as e: print("scoreboard failed", w, e, file=sys.stderr); continue
    for e in d.get("events", []):
        c = e["competitions"][0]
        if not ((c.get("status") or {}).get("type") or {}).get("completed"): continue
        H = next(x for x in c["competitors"] if x["homeAway"] == "home"); A = next(x for x in c["competitors"] if x["homeAway"] == "away")
        key = f'{w}|{fx(A["team"]["abbreviation"])}|{fx(H["team"]["abbreviation"])}'
        if key in have or key in C: continue
        try: sm = get(B + f"summary?event={e['id']}")
        except Exception as ex: print("summary failed", key, ex, file=sys.stderr); continue
        out = {"p": [], "r": [], "c": []}
        for team in (sm.get("boxscore") or {}).get("players") or []:
            tm = fx((team.get("team") or {}).get("abbreviation", ""))
            for grp in team.get("statistics") or []:
                lab = [str(x).upper() for x in grp.get("labels") or []]; nm_ = grp.get("name")
                idx = lambda k: lab.index(k) if k in lab else None
                for a in grp.get("athletes") or []:
                    st = a.get("stats") or []; nm = (a.get("athlete") or {}).get("displayName")
                    val = lambda k: (lambda i: st[i] if i is not None and i < len(st) else "0")(idx(k))
                    num = lambda k: int(float(re.sub(r"[^0-9.\-]", "", str(val(k))) or 0))
                    if not nm: continue
                    if nm_ == "passing":
                        ca = str(val("C/ATT")).split("/"); out["p"].append([nm, tm, int(ca[0] or 0), int(ca[1] or 0) if len(ca) > 1 else 0, num("YDS"), num("TD"), num("INT")])
                    elif nm_ == "rushing": out["r"].append([nm, tm, num("CAR"), num("YDS"), num("TD")])
                    elif nm_ == "receiving": out["c"].append([nm, tm, num("REC"), num("TGTS"), num("YDS"), num("TD")])
        if out["p"] or out["r"]:
            out["p"].sort(key=lambda x: -x[3]); out["r"].sort(key=lambda x: -x[3]); out["c"].sort(key=lambda x: -x[4]); C[key] = out; n_new += 1
C = {k: v for k, v in C.items() if k not in have}   # nflverse has it now: the official version wins
json.dump(C, open(CF, "w"), separators=(",", ":"))
print("/* NFL box scores from ESPN for finals nflverse hasn't published yet — tools/nflbox.py */")
print("var BOX_ESPN=" + json.dumps(C, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"nflbox: {n_new} new ESPN box scores, {len(C)} waiting for nflverse", file=sys.stderr)
