import json, urllib.request
def get(u):
    u=u.replace("http://","https://")
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
def show(t, o, n=2500): print(t, json.dumps(o)[:n])
C="https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/"
s=get("https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=20261101-20261110");ev=(s.get("events") or [])
e=ev[-1];print("EVENT",e["id"],e["name"])
done=0
for c in e["competitions"]:
    st=get(C+f"events/{e['id']}/competitions/{c['id']}/status")
    res=(st.get("result") or {}).get("displayName","")
    if "dec" not in res.lower() or done: continue
    done=1;print("DECISION FIGHT",c["id"],res)
    comp=get(C+f"events/{e['id']}/competitions/{c['id']}")
    show("COMP keys",sorted(comp.keys()),800)
    for k in ("linescores","judges","officials","details","situation","notes"):
        if k in comp: show(" comp."+k,comp[k],1500)
    cp=comp["competitors"][0]
    show("COMPETITOR",cp,1500)
    for k in ("linescores","statistics","scores"):
        if isinstance(cp.get(k),dict) and "$ref" in cp[k]:
            r=get(cp[k]["$ref"]);show(" "+k,r,3000)
            for it in (r.get("items") or [])[:2]:
                if "$ref" in it: show("   item",get(it["$ref"]),1500)
    show("STATUS",st,1500)
    sm=get(f"https://site.api.espn.com/apis/site/v2/sports/mma/ufc/summary?event={e['id']}")
    show("SUMMARY keys",sorted(sm.keys()) if isinstance(sm,dict) else sm,600)
    for k in ("boxscore","rounds","scoringPlays","plays","header"):
        if k in sm: show(" sum."+k,sm[k],2500)
n=get("https://site.api.espn.com/apis/site/v2/sports/mma/ufc/news?limit=5");show("NEWS",[(a.get("headline"),[c.get("description") for c in a.get("categories",[])]) for a in n.get("articles",[])],1500)
