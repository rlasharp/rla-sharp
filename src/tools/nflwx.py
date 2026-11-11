#!/usr/bin/env python3
"""NFL kickoff weather for this week's games -> nfl_wx.js (var NFL_WX). Runs with every NFL site update (several times a day).
  ESPN scoreboard: kickoff time, stadium, city/state and whether it's indoors (dome / closed roof).
  Open-Meteo: hourly forecast at the stadium's city for the kickoff hour — conditions code, temperature (°F),
  chance of rain/snow, wind and gusts (mph). Free, no key. Forecasts only reach ~16 days out; games further away get none.
Real data only: a game without a forecast is left out; on any failure the old file is kept.
usage (from src/): python3 tools/nflwx.py > nfl_wx.js"""
import json, re, sys, os, datetime as dt, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from auto_espn import get, teams_of, FIX_NFL, B
ROOT = os.environ.get("REPO", os.path.abspath(".."))
GEOF = os.path.join(ROOT, "data/nfl_geo.json")
try: GEO = json.load(open(GEOF))
except Exception: GEO = {}
wk = int(re.search(r"PLAYS_WEEK=(\d+)", open("plays.js", encoding="utf-8").read()).group(1))
slate = {(a, h): int(i) for i, a, h in re.findall(r'\{id:(\d+),away:"(\w+)",home:"(\w+)"', open("engine.js", encoding="utf-8").read())}
sb = get(B + f"football/nfl/scoreboard?week={wk}&seasontype=2")
OUT, FC = {}, {}
STATES = dict(x.split(":") for x in "AL:Alabama,AZ:Arizona,CA:California,CO:Colorado,FL:Florida,GA:Georgia,IL:Illinois,IN:Indiana,LA:Louisiana,MA:Massachusetts,MD:Maryland,MI:Michigan,MN:Minnesota,MO:Missouri,NC:North Carolina,NJ:New Jersey,NV:Nevada,NY:New York,OH:Ohio,PA:Pennsylvania,TN:Tennessee,TX:Texas,WA:Washington,WI:Wisconsin".split(","))
for e in sb.get("events") or []:
    c = e["competitions"][0]; a, h, _ = teams_of(c, FIX_NFL); gid = slate.get((a, h))
    if gid is None: continue
    v = c.get("venue") or {}; ad = v.get("address") or {}
    if v.get("indoor"):
        OUT[gid] = {"dome": v.get("fullName") or "Indoors"}; continue
    city, st = ad.get("city"), ad.get("state") or ""
    if not city: continue
    key = f"{city}|{st}|{ad.get('country') or ''}"
    if key not in GEO:
        try:
            res = get("https://geocoding-api.open-meteo.com/v1/search?count=10&name=" + urllib.parse.quote(city)).get("results") or []
        except SystemExit: res = []
        ctry = ad.get("country") or "USA"; us = ctry in ("USA", "United States")
        pick = (next((x for x in res if x.get("country_code") == "US" and STATES.get(st) == x.get("admin1")), None) or next((x for x in res if x.get("country_code") == "US"), None)) if us \
            else next((x for x in res if x.get("country") == ctry or x.get("country_code") == {"Germany": "DE", "England": "GB", "United Kingdom": "GB", "Mexico": "MX", "Brazil": "BR", "Spain": "ES", "Ireland": "IE", "Australia": "AU", "France": "FR", "Canada": "CA"}.get(ctry)), None)
        GEO[key] = [round(pick["latitude"], 3), round(pick["longitude"], 3)] if pick else None
    if not GEO.get(key): continue
    ko = dt.datetime.fromisoformat(e["date"].replace("Z", "+00:00"))
    if ko - dt.datetime.now(dt.timezone.utc) > dt.timedelta(days=15) or ko < dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=4): continue
    la, lo = GEO[key]
    if key not in FC:
        try:
            FC[key] = get(f"https://api.open-meteo.com/v1/forecast?latitude={la}&longitude={lo}&hourly=temperature_2m,precipitation_probability,snowfall,wind_speed_10m,wind_gusts_10m,weather_code"
                          "&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=16&timezone=UTC").get("hourly") or {}
        except SystemExit: FC[key] = {}
    H = FC[key]; T = H.get("time") or []; k = ko.replace(minute=0, second=0).strftime("%Y-%m-%dT%H:%M")
    if k not in T: continue
    i = T.index(k); hrs = range(i, min(i + 3, len(T)))   # the 3 hours of the game
    val = lambda n, j: (H.get(n) or [None] * len(T))[j]
    OUT[gid] = {"stad": v.get("fullName") or "", "city": f"{city}{', ' + st if st else ''}", "t": round(val("temperature_2m", i)), "wc": val("weather_code", i),
                "pp": max((val("precipitation_probability", j) or 0) for j in hrs), "sn": round(sum((val("snowfall", j) or 0) for j in hrs), 1),
                "ws": round(max((val("wind_speed_10m", j) or 0) for j in hrs)), "wg": round(max((val("wind_gusts_10m", j) or 0) for j in hrs))}
json.dump(GEO, open(GEOF, "w"), separators=(",", ":"))
if not OUT: sys.exit("nflwx: no games matched — keeping the old file")
at = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
print(f"/* NFL kickoff weather — ESPN venues + Open-Meteo forecasts (tools/nflwx.py), Week {wk}, {at} */")
print("var NFL_WX=" + json.dumps({"wk": wk, "at": at, "g": OUT}, separators=(",", ":"), ensure_ascii=False) + ";")
print(f"nflwx: Week {wk} · {sum(1 for x in OUT.values() if 'dome' in x)} indoors, {sum(1 for x in OUT.values() if 't' in x)} with a forecast", file=sys.stderr)
