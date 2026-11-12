"""What do ESPN summary 'plays' look like for NBA and NHL (period, type, participants order)? Prints a few of each play type."""
import json, urllib.request, datetime as dt
UA = {"User-Agent": "Mozilla/5.0"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r: return json.load(r)
for sp, path in (("nba", "basketball/nba"), ("nhl", "hockey/nhl")):
    d = (dt.date.today() - dt.timedelta(days=1)).strftime("%Y%m%d")
    sb = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/scoreboard?dates={d}")
    ev = sb["events"][0]["id"]; S = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/summary?event={ev}")
    P = S.get("plays") or []; print("=====", sp, ev, "plays", len(P), "keys", list(P[0].keys()) if P else None)
    seen = {}
    for p in P:
        t = (p.get("type") or {}).get("text"); seen.setdefault(t, 0); seen[t] += 1
        if seen[t] <= 1:
            print(json.dumps({k: p.get(k) for k in ("period", "type", "text", "scoringPlay", "scoreValue", "shootingPlay", "participants", "team")})[:600])
    print("types:", seen)
    bx = (S.get("boxscore") or {}).get("players") or []
    if bx: a = bx[0]["statistics"][0]["athletes"][0]["athlete"]; print("box athlete keys:", list(a.keys()), a.get("id"), a.get("displayName"))
