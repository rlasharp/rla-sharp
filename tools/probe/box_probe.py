"""One-off: shape of ESPN scoreboard (by date) + summary box scores for NBA / NHL / NFL, NFL venue + weather fields,
and an Open-Meteo forecast sample — for the head-to-head box scores and the NFL kickoff weather."""
import json, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (rla-sharp research site)"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r: return json.load(r)
B = "https://site.api.espn.com/apis/site/v2/sports/"
for sp, d in [("basketball/nba", "20251128"), ("hockey/nhl", "20260203"), ("football/nfl", "20231015"), ("football/nfl", "20051204")]:
    try:
        sb = get(B + sp + "/scoreboard?dates=" + d); ev = sb.get("events") or []
        print("==", sp, d, len(ev), [(e["id"], [(c["team"].get("abbreviation"), c["team"].get("displayName"), c.get("homeAway"), c.get("score")) for c in e["competitions"][0]["competitors"]]) for e in ev[:3]])
        if not ev: continue
        s = get(B + sp + "/summary?event=" + ev[0]["id"]); b = s.get("boxscore") or {}
        print("  summary keys", list(s)[:20])
        for t in (b.get("players") or [])[:1]:
            print("  team", t["team"].get("abbreviation"))
            for st in t.get("statistics") or []:
                a = (st.get("athletes") or [{}])[0]
                print("   grp", st.get("name"), st.get("text"), st.get("labels"), st.get("keys", [])[:3], "n", len(st.get("athletes") or []), "|", (a.get("athlete") or {}).get("displayName"), a.get("stats"), a.get("didNotPlay"), "| totals", st.get("totals"))
        print("  linescores", [(c["team"]["abbreviation"], [l.get("displayValue") for l in c.get("linescores", [])], c.get("score")) for c in s["header"]["competitions"][0]["competitors"]])
        print("  status", s["header"]["competitions"][0].get("status", {}).get("type", {}).get("shortDetail"))
    except Exception as e: print("fail", sp, d, e)
# NFL upcoming: venue + weather on the scoreboard
try:
    sb = get(B + "football/nfl/scoreboard?week=10&seasontype=2&dates=2026")
    for e in sb.get("events", [])[:16]:
        c = e["competitions"][0]
        print("NFL wk10", e["date"], [x["team"]["abbreviation"] for x in c["competitors"]], json.dumps(c.get("venue"))[:260], "| weather", json.dumps(e.get("weather") or c.get("weather"))[:200])
except Exception as e: print("fail nfl wk10", e)
try:
    w = get("https://api.open-meteo.com/v1/forecast?latitude=40.81&longitude=-74.07&hourly=temperature_2m,precipitation_probability,precipitation,snowfall,wind_speed_10m,wind_gusts_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7&timezone=UTC")
    print("open-meteo ok", list(w["hourly"]), w["hourly"]["time"][:2], w["hourly"]["temperature_2m"][:2])
    g = get("https://geocoding-api.open-meteo.com/v1/search?count=5&name=East%20Rutherford")
    print("geocode", [(x["name"], x.get("admin1"), x.get("country_code"), x["latitude"], x["longitude"]) for x in g.get("results", [])])
except Exception as e: print("fail open-meteo", e)
