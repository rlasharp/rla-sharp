import json, urllib.request
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
def show(t, o, n=900): print(t, json.dumps(o)[:n])
for lg, path, tid, eid in (("college-football", "football/college-football", "2390", None), ("mens-college-basketball", "basketball/mens-college-basketball", "150", None)):
    show(lg+" core injuries", get(f"https://sports.core.api.espn.com/v2/sports/{path.split('/')[0]}/leagues/{lg}/teams/{tid}/injuries"))
    show(lg+" site injuries", get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/injuries"), 500)
    t = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/teams/{tid}?enable=injuries"); show(lg+" team?enable=injuries keys", sorted((t.get("team") or {}).keys()), 600); show("  inj", (t.get("team") or {}).get("injuries"), 600)
    s = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/teams/{tid}/schedule?season=2025"); ev = s.get("events") or []; print(lg, "2025 schedule events", len(ev), ev[0]["name"] if ev else None)
    sb = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/scoreboard?groups={80 if 'foot' in path else 50}&limit=5"); E = sb.get("events") or []
    if E:
        sm = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/summary?event={E[0]['id']}")
        show(" summary injuries", sm.get("injuries"), 600); show(" lastFiveGames", (sm.get("lastFiveGames") or [{}])[0], 600); show(" headToHead", sm.get("headToHeadGames") or sm.get("seasonseries"), 600)
        show(" boxscore teams", [(x.get("team", {}).get("abbreviation"), [(st.get("name"), st.get("displayValue")) for st in (x.get("statistics") or [])][:30]) for x in ((sm.get("boxscore") or {}).get("teams") or [])], 1500)
