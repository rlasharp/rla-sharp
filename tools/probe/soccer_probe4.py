#!/usr/bin/env python3
"""Probe 4: soccer injuries (ESPN), weather (Open-Meteo), UEFA cups (ESPN + PropLine)."""
import json, os, urllib.request, urllib.parse
def j(x, n=900): s = json.dumps(x, default=lambda o: getattr(o, "__dict__", str(o)), ensure_ascii=False); return s[:n]
def get(u):
    try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))
    except Exception as e: print("  GET failed", u[-100:], e); return None
S = "https://site.api.espn.com/apis/site/v2/sports/soccer/"
sb = get(S + "eng.1/scoreboard?dates=202611")
up = [e for e in sb["events"] if not e["status"]["type"].get("completed")]
e = up[0]; print("upcoming", e["id"], e["name"], e["date"])
sm = get(S + f"eng.1/summary?event={e['id']}")
print("upcoming summary keys", list(sm.keys()))
for k in ("injuries", "rosters", "gameInfo", "pickcenter", "odds", "lastFiveGames", "headToHeadGames"):
    if k in sm: print(" ", k, j(sm[k], 700))
c = e["competitions"][0]; tid = c["competitors"][0]["team"]["id"]; print("venue", j(c.get("venue"), 300))
for u in [S + f"eng.1/teams/{tid}/injuries", S + f"eng.1/teams/{tid}?enable=injuries", S + f"eng.1/teams/{tid}/roster",
          f"https://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.1/teams/{tid}/injuries", S + "eng.1/injuries"]:
    r = get(u)
    if r is not None:
        print("URL", u[-60:], "keys", list(r.keys())[:15] if isinstance(r, dict) else type(r))
        if isinstance(r, dict):
            if "athletes" in r:
                a = r["athletes"]; print("  athletes", len(a), "keys", list(a[0].keys()) if a else None)
                inj = [x for x in a if x.get("injuries") or x.get("status", {}).get("type") not in (None, "active")][:3]; print("  injured sample", j(inj, 900))
            if "items" in r: print("  items", j(r["items"][:3], 500))
            if "team" in r: print("  team.injuries", j(r["team"].get("injuries"), 500))
            if "injuries" in r: print("  injuries", j(r["injuries"][:2], 700))
print("=== weather ===")
city = (c.get("venue") or {}).get("address", {}).get("city") or "London"
gq = get("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + urllib.parse.quote(city)); print("geo", city, j(gq, 300))
if gq and gq.get("results"):
    r0 = gq["results"][0]
    w = get(f"https://api.open-meteo.com/v1/forecast?latitude={r0['latitude']}&longitude={r0['longitude']}&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code&forecast_days=16&timezone=UTC")
    print("weather keys", list((w or {}).get("hourly", {}).keys()), "n", len((w or {}).get("hourly", {}).get("time", [])))
print("=== UEFA ===")
for lg in ["uefa.champions", "uefa.europa", "uefa.europa.conf"]:
    r = get(S + lg + "/scoreboard?dates=202611"); print(lg, "events", len((r or {}).get("events", [])))
    r = get(f"https://site.api.espn.com/apis/v2/sports/soccer/{lg}/standings"); 
    if r: ch = r.get("children", []); print("  standings groups", len(ch), "rows", sum(len(x.get("standings", {}).get("entries", [])) for x in ch))
from propline import PropLine
cl = PropLine(os.environ["PROPLINE_API_KEY"].strip())
for sp in ["soccer_uefa_champions_league", "soccer_uefa_europa_league", "soccer_uefa_conference_league"]:
    try:
        ev = cl.get_events(sp); print(sp, "events", len(ev or []), [ (x.get("home_team"), x.get("commence_time")) for x in (ev or [])[:2]] if ev and isinstance(ev[0], dict) else "")
        r = cl.get_referees(sp); print("  refs", r.get("count"))
    except Exception as ex: print(sp, "failed", ex)
