# what ESPN summaries carry for new graphics: NBA shot coordinates + win prob, NFL drives + win prob, soccer commentary shots by minute
import json, urllib.request
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
B = "https://site.api.espn.com/apis/site/v2/sports/"
def first_done(path):
    sb = get(B + path + "/scoreboard")
    for e in sb.get("events", []):
        if e["status"]["type"]["completed"]: return e["id"]
    return None
nba = first_done("basketball/nba") or "401809839"
s = get(B + f"basketball/nba/summary?event={nba}")
pl = s.get("plays") or []; sh = [p for p in pl if p.get("shootingPlay")]
print("NBA", nba, "keys", list(s.keys())); print(" plays", len(pl), "shots", len(sh), "sample", json.dumps({k: sh[0].get(k) for k in ("coordinate", "text", "scoringPlay", "participants", "period", "clock", "team")} if sh else {})[:600])
print(" winprob", len(s.get("winprobability") or []), json.dumps((s.get("winprobability") or [{}])[:1]))
nfl = first_done("football/nfl")
s = get(B + f"football/nfl/summary?event={nfl}")
d = (s.get("drives") or {}).get("previous") or []
print("NFL", nfl, "keys", list(s.keys())); print(" drives", len(d), json.dumps({k: d[0].get(k) for k in ("team", "start", "end", "result", "displayResult", "yards", "description")} if d else {})[:900])
print(" winprob", len(s.get("winprobability") or []), json.dumps((s.get("winprobability") or [{}])[:1]))
s = get(B + "soccer/eng.1/summary?event=401879239")
c = s.get("commentary") or []; ke = s.get("keyEvents") or []
print("SOC keys", list(s.keys())); print(" commentary", len(c), json.dumps(c[:3])[:900]); print(" keyEvents", len(ke), json.dumps([{k: x.get(k) for k in ("type", "clock", "team", "shortText")} for x in ke[:4]])[:800])
