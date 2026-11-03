import json,urllib.request,os
os.makedirs("probe",exist_ok=True)
U={"nba_inj":"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries",
   "nfl_inj":"https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries",
   "nba_sb":"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261103",
   "nfl_sb":"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=9&seasontype=2",
   "nfl_sb8":"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=8&seasontype=2"}
for k,u in U.items():
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=30) as r: d=json.load(r)
        json.dump(d,open(f"probe/{k}.json","w"))
        print(k,"ok",len(json.dumps(d)))
    except Exception as e: print(k,"ERR",e)
