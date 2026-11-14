import json, urllib.request
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
def show(t, o, n=1500): print(t, json.dumps(o)[:n])
for u in ["https://site.api.espn.com/apis/site/v2/sports/mma/ufc/rankings","https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/rankings",
          "https://site.web.api.espn.com/apis/site/v2/sports/mma/ufc/rankings","https://site.api.espn.com/apis/v2/sports/mma/ufc/rankings"]:
    r=get(u);show("RANK "+u,r,2500)
    for it in (r.get("items") or [])[:2]:
        if "$ref" in it: show("  item",get(it["$ref"].replace("http://","https://")),2500)
s=get("https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard");e=(s.get("events") or [{}])[0]
cs=e.get("competitions") or []
for c in cs[-3:]:
    show("COMP keys",sorted(c.keys()),600);show(" type",c.get("type"));show(" notes",c.get("notes"));show(" format",c.get("format"));show(" cardSegment",c.get("cardSegment"))
    show(" competitor",{k:v for k,v in c["competitors"][0].items() if k!="athlete"},800);show(" athlete keys",sorted(c["competitors"][0].get("athlete",{}).keys()))
    core=get(f"https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/{e['id']}/competitions/{c['id']}")
    show(" CORE comp",{k:v for k,v in core.items() if k not in("competitors",)},1500)
    show(" CORE competitor",core.get("competitors",[{}])[0],1000)
