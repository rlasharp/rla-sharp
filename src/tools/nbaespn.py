#!/usr/bin/env python3
"""Fill the newest NBA games from ESPN until the hoopR data catches up.
hoopR (our main NBA source) usually posts a night's box scores the next day, so for many hours after the games the site would
still be missing last night's results, player game logs, hit rates and grades. This reads ESPN's box scores (posted the moment a
game ends, same ESPN game and player ids hoopR uses) for every finished regular-season game from the last 4 days that hoopR doesn't
have yet, and adds them to the converted hoopR files in <dir> (player_box_2027.json, team_box_2027.json, nba_schedule_2027.json)
in hoopR's own row format, so tools/nbagen.mjs builds everything as usual. Once hoopR has a game, its own rows win (we skip it).
Real ESPN numbers only; a game that isn't final, or whose box can't be read, is left out.
usage: python3 tools/nbaespn.py <dir>"""
import json, os, sys, time, urllib.request, datetime as dt
D = sys.argv[1]
B = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/"
def get(u):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (rla-sharp research site)"}), timeout=25) as r: return json.load(r)
        except Exception as e:
            if i == 2: raise
            time.sleep(3 * (i + 1))
P = lambda f: os.path.join(D, f)
sched, box = json.load(open(P("nba_schedule_2027.json"))), json.load(open(P("player_box_2027.json")))
tb = json.load(open(P("team_box_2027.json"))) if os.path.exists(P("team_box_2027.json")) else []
have = {r["game_id"] for r in box}
now = dt.datetime.now(dt.timezone.utc)
want = [g for g in sched if g.get("season_type") == 2 and g["id"] not in have and g.get("game_date_time")
        and now - dt.timedelta(days=4) <= dt.datetime.fromisoformat(str(g["game_date_time"]).replace("Z", "+00:00")) <= now - dt.timedelta(hours=2)]
num = lambda v: None if v in (None, "", "--", "-") else (float(v) if "." in str(v) else int(str(v).replace("+", "")))
def pair(v):
    try: a, b = str(v).split("-"); return int(a), int(b)
    except Exception: return None, None
added, skipped = [], 0
for g in want:
    try: j = get(B + f"summary?event={g['id']}")
    except Exception as e: print(f"nbaespn: {g['id']} failed ({e})", file=sys.stderr); skipped += 1; continue
    cp = ((j.get("header") or {}).get("competitions") or [{}])[0]
    if (((cp.get("status") or {}).get("type") or {}).get("state")) != "post": continue
    C = {x["homeAway"]: x for x in cp.get("competitors") or []}
    if "home" not in C or "away" not in C: continue
    sc = {s: int(float(C[s].get("score") or 0)) for s in ("home", "away")}
    ab = {s: (C[s].get("team") or {}).get("abbreviation") for s in ("home", "away")}
    tid = {s: int((C[s].get("team") or {}).get("id") or 0) for s in ("home", "away")}
    rows, trows = [], []
    for T in (j.get("boxscore") or {}).get("players") or []:
        a_ = (T.get("team") or {}).get("abbreviation"); side = "home" if a_ == ab["home"] else "away"; op = "away" if side == "home" else "home"
        for st in T.get("statistics") or []:
            L = st.get("labels") or []
            ix = {l: i for i, l in enumerate(L)}
            for a in st.get("athletes") or []:
                A = a.get("athlete") or {}; s = a.get("stats") or []; dnp = bool(a.get("didNotPlay")) or not s
                v = (lambda k: (s[ix[k]] if k in ix and ix[k] < len(s) else None))
                fgm, fga = pair(v("FG")); tpm, tpa = pair(v("3PT")); ftm, fta = pair(v("FT"))
                rows.append({"game_id": g["id"], "season": 2027, "season_type": 2, "game_date": g.get("game_date"), "game_date_time": g["game_date_time"],
                    "athlete_id": int(A.get("id") or 0), "athlete_display_name": A.get("displayName"), "team_id": tid[side], "team_abbreviation": a_,
                    "minutes": None if dnp else num(v("MIN")), "field_goals_made": fgm, "field_goals_attempted": fga, "three_point_field_goals_made": tpm,
                    "three_point_field_goals_attempted": tpa, "free_throws_made": ftm, "free_throws_attempted": fta, "offensive_rebounds": num(v("OREB")),
                    "defensive_rebounds": num(v("DREB")), "rebounds": num(v("REB")), "assists": num(v("AST")), "steals": num(v("STL")), "blocks": num(v("BLK")),
                    "turnovers": num(v("TO")), "fouls": num(v("PF")), "plus_minus": num(v("+/-")), "points": num(v("PTS")), "starter": bool(a.get("starter")),
                    "ejected": bool(a.get("ejected")), "did_not_play": dnp, "reason": a.get("reason") or "", "active": not dnp,
                    "athlete_position_abbreviation": ((A.get("position") or {}).get("abbreviation")) or "NA", "home_away": side,
                    "team_score": sc[side], "opponent_team_id": tid[op], "opponent_team_abbreviation": ab[op], "opponent_team_score": sc[op], "_src": "espn"})
    for T in (j.get("boxscore") or {}).get("teams") or []:
        a_ = (T.get("team") or {}).get("abbreviation"); side = "home" if a_ == ab["home"] else "away"; op = "away" if side == "home" else "home"
        S = {x.get("name"): x.get("displayValue") for x in T.get("statistics") or []}
        fgm, fga = pair(S.get("fieldGoalsMade-fieldGoalsAttempted")); tpm, tpa = pair(S.get("threePointFieldGoalsMade-threePointFieldGoalsAttempted")); ftm, fta = pair(S.get("freeThrowsMade-freeThrowsAttempted"))
        trows.append({"game_id": g["id"], "season": 2027, "season_type": 2, "game_date": g.get("game_date"), "game_date_time": g["game_date_time"], "team_id": tid[side],
            "team_abbreviation": a_, "team_home_away": side, "team_score": sc[side], "team_winner": sc[side] > sc[op], "assists": num(S.get("assists")), "blocks": num(S.get("blocks")),
            "defensive_rebounds": num(S.get("defensiveRebounds")), "fast_break_points": S.get("fastBreakPoints"), "field_goals_made": fgm, "field_goals_attempted": fga,
            "fouls": num(S.get("fouls")), "free_throws_made": ftm, "free_throws_attempted": fta, "offensive_rebounds": num(S.get("offensiveRebounds")),
            "points_in_paint": S.get("pointsInPaint"), "steals": num(S.get("steals")), "three_point_field_goals_made": tpm, "three_point_field_goals_attempted": tpa,
            "total_rebounds": num(S.get("totalRebounds")), "total_turnovers": num(S.get("totalTurnovers")), "turnover_points": S.get("turnoverPoints"), "turnovers": num(S.get("turnovers")),
            "opponent_team_id": tid[op], "opponent_team_abbreviation": ab[op], "opponent_team_score": sc[op], "_src": "espn"})
    if len([r for r in rows if not r["did_not_play"]]) < 10: continue   # not a full box score yet
    box += rows; tb += trows
    g.update({"status_type_completed": True, "status_type_state": "post", "status_type_name": "STATUS_FINAL", "home_score": sc["home"], "away_score": sc["away"]})
    added.append(f"{ab['away']}@{ab['home']}")
if added:
    json.dump(box, open(P("player_box_2027.json"), "w")); json.dump(sched, open(P("nba_schedule_2027.json"), "w"))
    if tb: json.dump(tb, open(P("team_box_2027.json"), "w"))
print(f"nbaespn: {len(added)} game(s) filled from ESPN box scores (hoopR doesn't have them yet){': ' + ', '.join(added) if added else ''}{f'; {skipped} failed' if skipped else ''}", file=sys.stderr)
