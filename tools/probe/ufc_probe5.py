import json, urllib.request
def get(u):
    u=u.replace("http://","https://")
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
def show(t, o, n=1800): print(t, json.dumps(o)[:n])
B="https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/600061268/competitions/401928117/"
for k in (1,2,3):
    r=get(B+f"competitors/4426282/statistics/{k}")
    st={x["name"]:x.get("value") for c in ((r.get("splits") or {}).get("categories") or []) for x in c.get("stats",[])}
    show(f"STAT split {k}",{"name":(r.get("splits") or {}).get("name"),"sl":st.get("sigStrikesLanded"),"td":st.get("takedownsLanded"),"n":len(st),"err":r.get("_err")})
show("OFFICIALS",get(B+"officials"),1500)
p=get(B+"plays");show("PLAYS",{k:p.get(k) for k in ("count","pageCount")},300)
for it in (p.get("items") or [])[:6]: show(" play",it,500)
