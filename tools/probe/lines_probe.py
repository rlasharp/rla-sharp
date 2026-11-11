"""One-off: Daily Faceoff line combinations page (forward lines, D pairs, power-play units) and ESPN NFL boxscore
team stats that hold sacks (for pass rush vs offensive line)."""
import json, re, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (rla-sharp research site)", "Accept": "text/html,application/json"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r: return r.read().decode("utf8", "replace")
for slug in ("toronto-maple-leafs", "edmonton-oilers"):
    try:
        h = get(f"https://www.dailyfaceoff.com/teams/{slug}/line-combinations"); print("DFO", slug, len(h))
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
        if not m: print("  no NEXT_DATA", re.sub(r"\s+", " ", h[:300])); continue
        pp = json.loads(m.group(1))["props"]["pageProps"]; print("  pageProps keys", list(pp)[:20])
        c = pp.get("combinations") or pp.get("data") or {}
        print("  combinations type", type(c).__name__, (list(c)[:20] if isinstance(c, dict) else len(c)))
        P = (c.get("players") if isinstance(c, dict) else None) or []
        print("  n players", len(P))
        for x in P[:14]: print("   ", {k: x.get(k) for k in ("name", "positionIdentifier", "groupIdentifier", "groupName", "categoryIdentifier", "lineId", "injuryStatus", "gameTimeDecision")})
        print("  updated", c.get("updatedAt") if isinstance(c, dict) else None, "| sample raw", json.dumps(P[0])[:500] if P else json.dumps(c)[:800])
    except Exception as e: print("DFO fail", slug, e)
B = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/"
sb = json.loads(get(B + "scoreboard?week=9&seasontype=2")); e = sb["events"][0]
s = json.loads(get(B + "summary?event=" + e["id"]))
for t in s["boxscore"]["teams"]: print("NFL", t["team"]["abbreviation"], [(x.get("name"), x.get("displayValue")) for x in t.get("statistics") or []])
