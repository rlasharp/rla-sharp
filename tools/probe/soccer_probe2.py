#!/usr/bin/env python3
"""Probe 2: ESPN soccer formats (scoreboard / summary / standings) + PropLine referees, stats and prop outcome shapes."""
import json, os, inspect, urllib.request
def j(x, n=900): s = json.dumps(x, default=lambda o: getattr(o, "__dict__", str(o)), ensure_ascii=False); return s[:n]
def g(o, k, d=None): return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)
def get(u):
    try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))
    except Exception as e: print("  GET failed", u[-90:], e); return None
B = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1"
for q in ["/scoreboard", "/scoreboard?dates=20261108", "/scoreboard?dates=20261101-20261109", "/scoreboard?dates=20260815-20261109&limit=400", "/scoreboard?dates=2026"]:
    sb = get(B + q); 
    if sb: print(q, "events", len(sb.get("events", [])), "season", j(sb.get("leagues", [{}])[0].get("season"), 150))
sb = get(B + "/scoreboard?dates=20261108") or get(B + "/scoreboard?dates=20261101-20261109")
done = [e for e in (sb or {}).get("events", []) if e["status"]["type"].get("completed")]
if done:
    e = done[0]; c = e["competitions"][0]
    print("comp keys", list(c.keys())); print("competitor", j({k: v for k, v in c["competitors"][0].items() if k != "team"}, 900)); print("team", j(c["competitors"][0]["team"], 300))
    print("details", j(c.get("details", [])[:2], 500))
    sm = get(B + f"/summary?event={e['id']}")
    if sm:
        print("summary keys", list(sm.keys()))
        bt = sm.get("boxscore", {}).get("teams", [])
        if bt: print("box team stats", j([(s.get("name"), s.get("displayValue")) for s in bt[0].get("statistics", [])], 1500))
        print("gameInfo", j(sm.get("gameInfo"), 700))
        ro = sm.get("rosters", [])
        if ro:
            p = ro[0].get("roster", []); print("roster n", len(p), "keys", list(p[0].keys()) if p else None)
            if p:
                st = [x for x in p if x.get("starter")][:1] or p[:1]
                print("player", j({k: v for k, v in st[0].items() if k != "stats"}, 700)); print("player stats", j([(s.get("name"), s.get("value")) for s in st[0].get("stats", [])], 1200))
        print("keyEvents", len(sm.get("keyEvents") or []), j([(k.get("type", {}).get("text"), k.get("clock", {}).get("displayValue"), (k.get("participants") or [{}])[0].get("athlete", {}).get("displayName")) for k in (sm.get("keyEvents") or [])[:8]], 600))
        print("odds/pickcenter", j(sm.get("odds") or sm.get("pickcenter"), 400))
st = get("https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings")
if st: en = st["children"][0]["standings"]["entries"]; print("standings row", j({"team": en[0]["team"].get("abbreviation"), "stats": [(s["name"], s.get("value")) for s in en[0]["stats"]]}, 900))
print("=== PropLine ===")
from propline import PropLine
cl = PropLine(os.environ["PROPLINE_API_KEY"].strip())
for m in ["get_referees", "get_referee_matches", "get_stats", "get_results", "get_player_history", "get_player_games", "get_context", "get_scores", "get_injuries", "search_players", "get_player_trends", "get_market_coverage"]:
    try: print("SIG", m, str(inspect.signature(getattr(cl, m))), (getattr(cl, m).__doc__ or "").strip().replace("\n", " ")[:300])
    except Exception as e: print("SIG", m, e)
def tryit(lab, f):
    try: r = f(); print(lab, "->", type(r).__name__, len(r) if hasattr(r, "__len__") else "", j(r, 1300))
    except Exception as e: print(lab, "failed", e)
tryit("referees epl", lambda: cl.get_referees("soccer_epl"))
evs = cl.get_events("soccer_epl"); e = sorted(evs, key=lambda x: g(x, "commence_time"))[0]; eid = g(e, "id")
tryit("context", lambda: cl.get_context("soccer_epl", eid))
tryit("results epl", lambda: cl.get_results("soccer_epl"))
tryit("stats epl", lambda: cl.get_stats("soccer_epl"))
tryit("injuries epl", lambda: cl.get_injuries("soccer_epl"))
od = cl.get_odds("soccer_epl", event_id=eid, markets=["player_shots_on_target", "anytime_goal_scorer", "player_assists", "total_corners", "totals", "both_teams_to_score", "spreads", "h2h"])
for b in g(od, "bookmakers", []) or []:
    if g(b, "key") not in ("draftkings", "fanduel", "betmgm", "betrivers", "fanatics", "hardrock"): continue
    for m in g(b, "markets", []) or []:
        oc = g(m, "outcomes", []) or []
        print("OC", g(b, "key"), g(m, "key"), g(m, "line_type"), g(m, "description"), "|", j([(g(o, "name"), g(o, "description"), g(o, "price"), g(o, "point")) for o in oc[:6]], 400))
