import json, urllib.request
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
def show(t, o, n=1200): print(t, json.dumps(o)[:n])
B = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/"
s = get(B + "scoreboard?dates=20261101-20261110"); ev = s.get("events") or []
print("RANGE events", [(e["id"], e["name"], e["date"]) for e in ev])
e = ev[-1] if ev else None
if e:
    c = e["competitions"][0]; show("PAST comp keys", list(c.keys()), 400); show(" status", c.get("status"), 700); show(" competitor", c["competitors"][0], 900)
    for k in ("details", "notes", "situation"): show(" " + k, c.get(k), 400)
    eid, cid, aid = e["id"], c["id"], c["competitors"][0]["id"]
    C = "https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/"
    show("CORE comp", get(C + f"events/{eid}/competitions/{cid}"), 1500)
    show("CORE status", get(C + f"events/{eid}/competitions/{cid}/status"), 800)
    show("CORE competitor stats", get(C + f"events/{eid}/competitions/{cid}/competitors/{aid}/statistics"), 2500)
    show("CORE athlete", get(f"https://sports.core.api.espn.com/v2/sports/mma/athletes/{aid}"), 1500)
    show("CORE athlete records", get(f"https://sports.core.api.espn.com/v2/sports/mma/athletes/{aid}/records"), 1200)
    show("WEB athlete", get(f"https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/{aid}"), 1500)
    show("WEB fighthistory", get(f"https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/{aid}/fighthistory"), 1800)
    show("WEB overview", get(f"https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/{aid}/overview"), 1500)
    show("CORE eventlog", get(f"https://sports.core.api.espn.com/v2/sports/mma/athletes/{aid}/eventlog"), 1200)
