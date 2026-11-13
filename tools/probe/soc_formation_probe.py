# check ESPN soccer summary roster fields for formations / formation places
import json, urllib.request
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
ids = ["401879239", "401879240"]
for i in ids:
    sm = get(f"https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event={i}")
    for side in sm.get("rosters") or []:
        print("EVENT", i, side["team"]["displayName"], "formation:", side.get("formation"), "keys:", [k for k in side if k != "roster"])
        for p in side.get("roster") or []:
            if p.get("starter"):
                print("  ", p.get("formationPlace"), (p.get("position") or {}).get("abbreviation"), (p.get("position") or {}).get("displayName"), p["athlete"]["displayName"], [k for k in p if k not in ("athlete", "stats", "position")])
