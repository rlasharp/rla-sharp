"""(1) Check the site's quarter/period box-score counting against ESPN's own game box (sum of quarters = game).
(2) Can we reach NBA.com's matchup data (who guarded whom)?"""
import json, re, urllib.request, datetime as dt
UA = {"User-Agent": "Mozilla/5.0"}
def get(u, h=None):
    with urllib.request.urlopen(urllib.request.Request(u, headers=h or UA), timeout=40) as r: return json.load(r)
def nba_q(S):
    per = {}
    for p in S.get("plays") or []:
        q = (p.get("period") or {}).get("number"); P = [str(x["athlete"]["id"]) for x in (p.get("participants") or []) if x.get("athlete")]
        if not q or not P: continue
        t = (p.get("type") or {}).get("text") or ""; tx = p.get("text") or ""
        A = lambda i: per.setdefault(i, [0] * 9)
        if "Rebound" in t: A(P[0])[1] += 1; continue
        if t.startswith("Free Throw"):
            s = A(P[0]); s[8] += 1
            if p.get("scoringPlay"): s[7] += 1; s[0] += p.get("scoreValue") or 1
            continue
        if p.get("shootingPlay"):
            s = A(P[0]); m = re.search(r"(\d+)-foot", tx); d = int(m.group(1)) if m else 0
            three = p.get("scoreValue") == 3 or "three point" in tx.lower() or (d >= 22 and "two point" not in tx.lower())
            s[4] += 1; s[6] += three
            if p.get("scoringPlay"):
                s[3] += 1; s[0] += p.get("scoreValue") or 2; s[5] += three
                if len(P) > 1: A(P[1])[2] += 1
    return per
def nhl_q(S):
    per = {}
    for p in S.get("plays") or []:
        P = [(str(x["athlete"]["id"]), x.get("type") or "") for x in (p.get("participants") or []) if x.get("athlete")]
        ab = (p.get("type") or {}).get("abbreviation") or ""; A = lambda i: per.setdefault(i, [0] * 6)
        if ab == "goal":
            for j, (i, t) in enumerate(P):
                if t == "scorer" or (not t and j == 0): A(i)[0] += 1; A(i)[2] += 1
                elif "assist" in t or (not t and 0 < j < 3): A(i)[1] += 1
        elif ab == "shot-on-goal" and P: A(P[0][0])[2] += 1
        elif ab == "hit" and P: A(P[0][0])[3] += 1
        elif ab == "shot-blocked" and len(P) > 1: A(P[1][0])[4] += 1
    return per
for sp, path, cols in (("nba", "basketball/nba", {"PTS": 0, "REB": 1, "AST": 2}), ("nhl", "hockey/nhl", {"G": 0, "A": 1, "S": 2, "SOG": 2, "HT": 3, "BS": 4})):
    tot = {k: [0, 0] for k in cols}; seen = 0
    for back in (1, 2):
        d = (dt.date.today() - dt.timedelta(days=back)).strftime("%Y%m%d")
        for ev in get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/scoreboard?dates={d}").get("events", [])[:3]:
            S = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/summary?event={ev['id']}"); per = nba_q(S) if sp == "nba" else nhl_q(S); seen += 1
            for T in (S.get("boxscore") or {}).get("players") or []:
                for g in T.get("statistics") or []:
                    L = g.get("labels") or []
                    for x in g.get("athletes") or []:
                        if not x.get("stats"): continue
                        mine = per.get(str(x["athlete"]["id"]), [0] * 9)
                        for k, j in cols.items():
                            if k in L:
                                try: v = int(str(x["stats"][L.index(k)]).split("-")[0])
                                except Exception: continue
                                tot[k][0] += 1; tot[k][1] += (v == mine[j])
    print(sp, seen, "games — players where our count matches ESPN's box:", {k: f"{a[1]}/{a[0]}" for k, a in tot.items()})
H = {"User-Agent": "Mozilla/5.0", "Referer": "https://www.nba.com/", "Origin": "https://www.nba.com", "Accept": "application/json", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true"}
try:
    j = get("https://stats.nba.com/stats/leagueseasonmatchups?LeagueID=00&PerMode=Totals&Season=2026-27&SeasonType=Regular%20Season&OffPlayerID=&DefPlayerID=&OffTeamID=&DefTeamID=", H)
    rs = j["resultSets"][0]; print("matchups OK:", rs["headers"][:12], len(rs["rowSet"]), "rows", rs["rowSet"][:1])
except Exception as e: print("matchups failed:", e)
