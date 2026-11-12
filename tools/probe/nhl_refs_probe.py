"""Where does the NHL API put the referees? Print the keys of a finished game's right-rail / landing / boxscore."""
import json, urllib.request, datetime as dt
UA = {"User-Agent": "Mozilla/5.0 (rla-sharp research site)"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r: return json.load(r)
d = (dt.date.today() - dt.timedelta(days=2)).isoformat()
s = get(f"https://api-web.nhle.com/v1/schedule/{d}")
gid = s["gameWeek"][0]["games"][0]["id"]; print("game", gid)
for ep in ("right-rail", "landing", "boxscore"):
    try:
        j = get(f"https://api-web.nhle.com/v1/gamecenter/{gid}/{ep}")
        print(ep, "keys:", list(j.keys())[:30])
        txt = json.dumps(j)
        for k in ("referee", "Referee", "official", "linesm"):
            i = txt.find(k)
            if i >= 0: print("  ", k, "->", txt[max(0, i - 80):i + 300])
    except Exception as e: print(ep, "failed", e)
