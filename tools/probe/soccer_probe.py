#!/usr/bin/env python3
"""One-off probe (prints to the job log): what PropLine and ESPN return for soccer. ~16 PropLine requests."""
import json, os, sys, urllib.request, datetime as dt
def j(x, n=900): s = json.dumps(x, default=lambda o: getattr(o, "__dict__", str(o)), ensure_ascii=False); return s[:n]
def g(o, k, d=None): return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)
def get(u):
    r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30); return json.load(r)
print("=== ESPN ===")
for lg in ["eng.1", "esp.1", "ita.1", "ger.1", "fra.1"]:
    try:
        sb = get(f"https://site.api.espn.com/apis/site/v2/sports/soccer/{lg}/scoreboard?dates=20260801-20261130&limit=500")
        ev = sb.get("events", []); done = [e for e in ev if e["status"]["type"].get("completed")]
        print(lg, "events", len(ev), "completed", len(done), "league", j(sb.get("leagues", [{}])[0].get("season"), 200))
        if lg == "eng.1" and done:
            e = done[-1]; c = e["competitions"][0]
            print(" scoreboard comp keys", list(c.keys())); print(" competitor keys", list(c["competitors"][0].keys()))
            print(" competitor stats", j(c["competitors"][0].get("statistics"), 700)); print(" odds", j(c.get("odds"), 600))
            print(" details sample", j(c.get("details", [])[:3], 600))
            sm = get(f"https://site.api.espn.com/apis/site/v2/sports/soccer/{lg}/summary?event={e['id']}")
            print(" summary keys", list(sm.keys()))
            bt = sm.get("boxscore", {}).get("teams", [])
            if bt: print(" box team stat names", [s.get("name") for s in bt[0].get("statistics", [])]); print(" box team stat sample", j(bt[0].get("statistics", [])[:4], 500))
            print(" gameInfo", j(sm.get("gameInfo"), 600))
            ro = sm.get("rosters", [])
            if ro:
                p = ro[0].get("roster", [])
                print(" roster n", len(p), "player keys", list(p[0].keys()) if p else None)
                if p: print(" player sample", j(p[0], 1200)); print(" player stat names", [s.get("name") for s in p[0].get("stats", [])])
            print(" odds(summary)", j(sm.get("odds") or sm.get("pickcenter"), 500))
            print(" keyEvents sample", j((sm.get("keyEvents") or [])[:2], 500))
        if lg == "eng.1":
            nxt = [e for e in ev if not e["status"]["type"].get("completed")][:1]
            if nxt: c = nxt[0]["competitions"][0]; print(" upcoming", nxt[0]["date"], nxt[0]["name"], "odds", j(c.get("odds"), 500))
    except Exception as ex: print(lg, "ESPN failed", ex)
try:
    st = get("https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings")
    ch = st.get("children", [{}])[0]; en = ch.get("standings", {}).get("entries", [])
    print("standings entries", len(en), "stat names", [s.get("name") for s in (en[0].get("stats", []) if en else [])])
except Exception as ex: print("standings failed", ex)
print("=== PropLine ===")
from propline import PropLine
cl = PropLine(os.environ["PROPLINE_API_KEY"].strip())
print("client methods", [m for m in dir(cl) if not m.startswith("_")])
try: sp = cl.get_sports(); print("sports", j([g(s, "key") for s in sp], 3000))
except Exception as ex: print("sports failed", ex)
for key in ["soccer_epl", "soccer_spain_la_liga", "soccer_italy_serie_a", "soccer_germany_bundesliga", "soccer_france_ligue_one"]:
    try:
        ev = cl.get_events(key); print(key, "events", len(ev or []))
        if not ev: continue
        e = sorted(ev, key=lambda x: g(x, "commence_time"))[0]; print(" event", j(e, 700))
        try: mk = cl.get_markets(key, g(e, "id")); print(" markets", j([g(m, "key") for m in mk], 1500))
        except Exception as ex: mk = []; print(" markets failed", ex)
        want = [k for k in [g(m, "key") for m in mk]][:40] or ["h2h", "totals"]
        od = cl.get_odds(key, event_id=g(e, "id"), markets=want)
        print(" odds top keys", list(od.keys()) if isinstance(od, dict) else type(od))
        bks = g(od, "bookmakers", []) or []; print(" books", [g(b, "key") for b in bks])
        seen = {}
        for b in bks:
            for m in g(b, "markets", []) or []:
                k = g(m, "key")
                if k not in seen: seen[k] = (g(b, "key"), j(m, 450))
        for k, (b, s) in seen.items(): print("  MK", k, b, s)
        for k in ("referee", "officials", "venue"): print(" ", k, j(g(od, k), 300))
    except Exception as ex: print(key, "failed", ex)
