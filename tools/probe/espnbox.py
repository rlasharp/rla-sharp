import urllib.request, json
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=30))
for sp,eid in (("basketball/nba","401909993"),):
  j=get(f"https://site.api.espn.com/apis/site/v2/sports/{sp}/summary?event={eid}")
  b=j["boxscore"]
  for t in b["players"][:1]:
    for s in t["statistics"]:
      print("NBA GROUP",s.get("name"),s.get("labels"),s.get("totals"));a=s["athletes"][0];print(" ATH",{k:a[k] for k in a if k!="athlete"},a["athlete"].get("displayName"),a["athlete"].get("position",{}).get("abbreviation"))
  print("NBA TEAMSTATS",[(s.get("name"),s.get("label"),s.get("abbreviation"),s.get("displayValue")) for s in b["teams"][0]["statistics"]])
  c=j["header"]["competitions"][0];print("NBA HDR",[(x["team"].get("abbreviation"),x.get("score"),[l.get("displayValue") for l in x.get("linescores",[])],x["homeAway"],x["team"].get("logos",[{}])[0].get("href") if x["team"].get("logos") else x["team"].get("logo")) for x in c["competitors"]],c["status"]["type"])
s=get("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=20261116");e=s["events"][0];print("NHL EV",e["id"],e["shortName"])
j=get(f"https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event={e['id']}");b=j["boxscore"]
for t in b["players"][:1]:
  for s in t["statistics"]:
    print("NHL GROUP",s.get("name"),s.get("labels"),s.get("keys"),s.get("totals"));a=s["athletes"][0];print(" ATH",{k:a[k] for k in a if k!="athlete"},a["athlete"].get("displayName"))
print("NHL TEAMSTATS",[(s.get("name"),s.get("label"),s.get("displayValue")) for s in b["teams"][0]["statistics"]])
c=j["header"]["competitions"][0];print("NHL HDR",[(x["team"].get("abbreviation"),x.get("score"),[l.get("displayValue") for l in x.get("linescores",[])],x["homeAway"]) for x in c["competitors"]],c["status"]["type"])
print("NHL KEYS",list(j.keys()))
