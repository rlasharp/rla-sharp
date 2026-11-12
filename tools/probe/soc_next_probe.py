import json, urllib.request
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r: return json.load(r)
for q in ("", "?fixture=true"):
    j = get("https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule" + q)
    ev = j.get("events", []); up = [e for e in ev if not ((e["competitions"][0].get("status") or {}).get("type") or {}).get("completed")]
    print(repr(q), len(ev), "events,", len(up), "upcoming", [e["date"] for e in up[:3]])
