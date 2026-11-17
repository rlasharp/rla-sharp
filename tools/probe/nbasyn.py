import urllib.request, json, time
H={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36","Referer":"https://www.nba.com/","Origin":"https://www.nba.com","Accept":"application/json, text/plain, */*","Accept-Language":"en-US,en;q=0.9","x-nba-stats-origin":"stats","x-nba-stats-token":"true"}
for who,grp in [("P","offensive"),("T","defensive")]:
  u=f"https://stats.nba.com/stats/synergyplaytypes?LeagueID=00&PerMode=PerGame&PlayType=PRBallHandler&PlayerOrTeam={who}&SeasonType=Regular%20Season&SeasonYear=2026-27&TypeGrouping={grp}"
  t=time.time()
  try:
    J=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=40))
    rs=J["resultSets"][0];print(who,"OK",round(time.time()-t,1),"s",rs["headers"],len(rs["rowSet"]),rs["rowSet"][:2])
  except Exception as e:print(who,"FAIL",round(time.time()-t,1),e)
u="https://stats.nba.com/stats/leaguedashteamstats?MeasureType=Opponent&PerMode=PerGame&Season=2026-27&SeasonType=Regular%20Season&LeagueID=00&LastNGames=0&Month=0&OpponentTeamID=0&PaceAdjust=N&Period=0&PlusMinus=N&Rank=N&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&PORound=0&SeasonSegment=&ShotClockRange=&VsConference=&VsDivision=&Conference=&Division=&GameScope=&PlayerExperience=&PlayerPosition=&StarterBench=&TeamID=0&TwoWay=0"
try:
  J=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=40));rs=J["resultSets"][0];print("OPP OK",rs["headers"],rs["rowSet"][:1])
except Exception as e:print("OPP FAIL",e)
