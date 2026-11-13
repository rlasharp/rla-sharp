# dump trimmed ESPN summaries (one NBA, one NFL, one soccer) so the new game-flow graphics can be tested offline
import json, urllib.request
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
B = "https://site.api.espn.com/apis/site/v2/sports/"
def hdr(s): return {"competitions": [{"competitors": [{"homeAway": c["homeAway"], "team": {k: c["team"].get(k) for k in ("abbreviation", "displayName", "shortDisplayName", "color")}} for c in s["header"]["competitions"][0]["competitors"]]}]}
s = get(B + "basketball/nba/summary?event=401809839")
print("NBAJSON " + json.dumps({"header": hdr(s), "winprobability": [{"homeWinPercentage": w["homeWinPercentage"], "playId": w["playId"]} for w in s["winprobability"]], "plays": [{"id": p["id"], "period": {"number": p["period"]["number"]}} for p in s["plays"]]}, separators=(",", ":")))
s = get(B + "football/nfl/summary?event=401873052")
print("NFLJSON " + json.dumps({"header": hdr(s), "winprobability": [{"homeWinPercentage": w["homeWinPercentage"], "playId": w["playId"]} for w in s["winprobability"]],
  "drives": {"previous": [{"team": {"abbreviation": d["team"]["abbreviation"]}, "start": {"text": (d.get("start") or {}).get("text")}, "end": {"text": (d.get("end") or {}).get("text")}, "result": d.get("result"), "displayResult": d.get("displayResult"), "plays": [{"id": p["id"], "period": {"number": p["period"]["number"]}} for p in d.get("plays") or []]} for d in s["drives"]["previous"]]}}, separators=(",", ":")))
s = get(B + "soccer/eng.1/summary?event=401879239")
print("SOCJSON " + json.dumps({"header": hdr(s), "commentary": [{"time": c.get("time"), "play": {"type": {"text": ((c.get("play") or {}).get("type") or {}).get("text")}, "team": {"displayName": ((c.get("play") or {}).get("team") or {}).get("displayName")}}} for c in s.get("commentary") or []]}, separators=(",", ":")))
