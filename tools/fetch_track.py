#!/usr/bin/env python3
"""RLA Sharp: NBA player-tracking numbers from NBA.com (stats.nba.com leaguedashptstats).
Rebound chances (Rebounding) and potential assists / passes (Passing), season and last 5 games.
Writes data/nba_track.json; the site build turns it into src/nba_track.js. Real data only:
if NBA.com does not answer, the old file is kept."""
import json, os, sys, time, datetime as dt, urllib.request, urllib.parse
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/Toronto")
OUT = "data/nba_track.json"
H = {"Referer": "https://www.nba.com/", "Origin": "https://www.nba.com", "Accept": "application/json, text/plain, */*",
     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
     "Accept-Language": "en-US,en;q=0.9", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true"}

def season_str(now):
    y = now.year if now.month >= 10 else now.year - 1
    return f"{y}-{str(y + 1)[2:]}"

def get(measure, season, last_n):
    q = {"College": "", "Conference": "", "Country": "", "DateFrom": "", "DateTo": "", "Division": "", "DraftPick": "",
         "DraftYear": "", "GameScope": "", "Height": "", "LastNGames": str(last_n), "LeagueID": "00", "Location": "",
         "Month": "0", "OpponentTeamID": "0", "Outcome": "", "PORound": "0", "PerMode": "PerGame", "PlayerExperience": "",
         "PlayerOrTeam": "Player", "PlayerPosition": "", "PtMeasureType": measure, "Season": season, "SeasonSegment": "",
         "SeasonType": "Regular Season", "StarterBench": "", "TeamID": "0", "VsConference": "", "VsDivision": "", "Weight": ""}
    url = "https://stats.nba.com/stats/leaguedashptstats?" + urllib.parse.urlencode(q)
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=40) as r:
                d = json.load(r)
            rs = d["resultSets"][0]; hd = rs["headers"]
            return [dict(zip(hd, row)) for row in rs["rowSet"]]
        except Exception as e:
            last = e; print(f"{measure} L{last_n}: try {i + 1} failed: {e}"); time.sleep(5 * (i + 1))
    raise RuntimeError(f"{measure} L{last_n}: {last}")

def num(v, d=1):
    try: return round(float(v), d)
    except Exception: return None

def main():
    now = dt.datetime.now(ET); season = season_str(now)
    out = {"asof": now.strftime("%Y-%m-%d %H:%M ET"), "season": season, "src": "NBA.com player tracking", "s": {}, "l5": {}}
    try:
        for key, n in (("s", 0), ("l5", 5)):
            R = {r["PLAYER_NAME"]: r for r in get("Rebounding", season, n)}
            P = {r["PLAYER_NAME"]: r for r in get("Passing", season, n)}
            for nm in set(R) | set(P):
                r, p = R.get(nm, {}), P.get(nm, {})
                # [gp, team, reb, rebChances, rebChance%, oreb chances, dreb chances, ast, potentialAst, passes, secondaryAst, ftAst, astPtsCreated]
                out[key][nm] = [int(r.get("GP") or p.get("GP") or 0), r.get("TEAM_ABBREVIATION") or p.get("TEAM_ABBREVIATION"),
                                num(r.get("REB")), num(r.get("REB_CHANCES")), num((r.get("REB_CHANCE_PCT") or 0) * 100 if r.get("REB_CHANCE_PCT") is not None else None),
                                num(r.get("OREB_CHANCES")), num(r.get("DREB_CHANCES")),
                                num(p.get("AST")), num(p.get("POTENTIAL_AST")), num(p.get("PASSES_MADE")),
                                num(p.get("SECONDARY_AST")), num(p.get("FT_AST")), num(p.get("AST_POINTS_CREATED"))]
            time.sleep(2)
    except Exception as e:
        print("NBA.com tracking not available:", e); sys.exit(0 if os.path.exists(OUT) else 1)
    if len(out["s"]) < 100:
        print(f"only {len(out['s'])} players — keeping the old file"); sys.exit(0)
    os.makedirs("data", exist_ok=True)
    with open(OUT, "w") as f: json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print(f"tracking: {len(out['s'])} players season, {len(out['l5'])} last-5 ({season})")

if __name__ == "__main__":
    main()
