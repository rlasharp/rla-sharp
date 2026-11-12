"""Is FotMob's public data reachable without special headers? (matches by date + one match's details)"""
import json, urllib.request, datetime as dt
H = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=30) as r: return r.status, r.read()[:400]
    except Exception as e: return "ERR", str(e)[:200].encode()
d = (dt.date.today() - dt.timedelta(days=3)).strftime("%Y%m%d")
for u in (f"https://www.fotmob.com/api/data/matches?date={d}", f"https://www.fotmob.com/api/matches?date={d}", "https://www.fotmob.com/api/data/matchDetails?matchId=4506263", "https://www.fotmob.com/api/matchDetails?matchId=4506263"):
    s, b = get(u); print(u, "->", s, b[:200])
