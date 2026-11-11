"""One-off: NFL referee + penalty fields in ESPN summaries (a final game and an upcoming one), and ESPN soccer news
categories (for manager sackings / appointments)."""
import json, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (rla-sharp research site)"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r: return json.load(r)
B = "https://site.api.espn.com/apis/site/v2/sports/"
for wk in (9, 10):
    sb = get(B + f"football/nfl/scoreboard?week={wk}&seasontype=2")
    for e in sb["events"][:2]:
        s = get(B + "football/nfl/summary?event=" + e["id"]); gi = s.get("gameInfo") or {}
        print("NFL wk", wk, e["id"], e["status"]["type"]["name"], "officials:", json.dumps(gi.get("officials"))[:400])
        for t in (s.get("boxscore") or {}).get("teams") or []:
            print("   team", t["team"]["abbreviation"], [(x.get("name"), x.get("displayValue")) for x in t.get("statistics") or [] if "enalt" in (x.get("name") or "") or "enalt" in (x.get("label") or "")])
for lg in ("eng.1", "esp.1"):
    n = get(B + f"soccer/{lg}/news?limit=50"); A = n.get("articles") or []
    print("SOC news", lg, len(A))
    for a in A[:40]:
        h = (a.get("headline") or "")
        if any(k in h.lower() for k in ("sack", "manager", "coach", "appoint", "interim", "fired", "boss")):
            print("  ", h, "|", a.get("published"), "|", [(c.get("type"), c.get("teamId") or (c.get("team") or {}).get("id"), c.get("description")) for c in a.get("categories") or []][:5])
    a = A[0] if A else {}
    print("  sample cats", json.dumps(a.get("categories", [])[:4])[:600])
