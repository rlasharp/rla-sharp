"""One-off check (run from probe.yml): can GitHub's runners reach the sources for confirmed NHL goalies,
NBA starting lineups and ESPN news, and what do they look like?"""
import json, re, urllib.request, datetime as dt
UA = {"User-Agent": "Mozilla/5.0 (rla-sharp research site)", "Accept": "text/html,application/json"}
def get(u, hdr=None):
    req = urllib.request.Request(u, headers={**UA, **(hdr or {})})
    with urllib.request.urlopen(req, timeout=30) as r: return r.status, r.read().decode("utf8", "replace")
day = dt.datetime.now(dt.timezone(dt.timedelta(hours=-5))).date()
# 1) Daily Faceoff starting goalies (Next.js page with embedded JSON)
for u in [f"https://www.dailyfaceoff.com/starting-goalies/{day:%Y-%m-%d}", "https://www.dailyfaceoff.com/starting-goalies"]:
    try:
        st, h = get(u); print("DFO", u, st, len(h))
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
        if m:
            J = json.loads(m.group(1)); pp = J.get("props", {}).get("pageProps", {}); print("  pageProps keys:", list(pp)[:20])
            def walk(o, path=""):
                if isinstance(o, dict):
                    if any("Goalie" in k for k in o): print("  goalie obj at", path, {k: o[k] for k in list(o)[:40] if not isinstance(o[k], (dict, list))}); return True
                    for k, v in o.items():
                        if walk(v, path + "." + k): return True
                elif isinstance(o, list):
                    for i, v in enumerate(o[:3]):
                        if walk(v, f"{path}[{i}]"): return True
                return False
            walk(pp)
        else: print("  no __NEXT_DATA__; sample:", re.sub(r"\s+", " ", h[:300]))
        break
    except Exception as e: print("DFO fail", u, e)
# 2) NBA daily lineups JSON (NBA.com starting lineups page)
for u in [f"https://stats.nba.com/js/data/leaders/00_daily_lineups_{day:%Y%m%d}.json", f"https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json"]:
    try:
        st, t = get(u, {"Referer": "https://www.nba.com/", "Origin": "https://www.nba.com"}); print("NBA", u, st, len(t)); J = json.loads(t)
        g = (J.get("games") or (J.get("scoreboard") or {}).get("games") or [])[:1]; print("  first game:", json.dumps(g)[:900])
    except Exception as e: print("NBA fail", u, e)
# 3) ESPN news
for sp in ["basketball/nba", "hockey/nhl", "football/nfl"]:
    try:
        st, t = get(f"https://site.api.espn.com/apis/site/v2/sports/{sp}/news?limit=50"); J = json.loads(t); A = J.get("articles") or []
        print("ESPN news", sp, st, len(A)); a = A[0] if A else {}
        print("  sample:", json.dumps({k: a.get(k) for k in ("headline", "description", "published", "type")})[:400], "| categories:", json.dumps(a.get("categories", [])[:3])[:500])
    except Exception as e: print("ESPN news fail", sp, e)
