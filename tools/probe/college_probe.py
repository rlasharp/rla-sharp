import os, json, urllib.request
from propline import PropLine
c = PropLine(os.environ["PROPLINE_API_KEY"])
def g(o, k): return o.get(k) if isinstance(o, dict) else getattr(o, k, None)
for sp in ("football_ncaaf", "basketball_ncaab"):
    try: ev = c.get_events(sp)
    except Exception as e: print(sp, "err", e); continue
    print(sp, "events", len(ev), [(g(e, "away_team"), g(e, "home_team"), g(e, "commence_time"), g(e, "espn_event_id")) for e in ev[:4]])
    for e in ev[:3]:
        try:
            mk = [g(m, "key") for m in c.get_markets(sp, g(e, "id"))]; print("  mk", len(mk), mk[:40])
        except Exception as ex: print("  mk err", ex)
    if ev:
        e = ev[0]
        try:
            pm = [m for m in mk if m.startswith("player_")][:3]
            o = c.get_odds(sp, event_id=g(e, "id"), markets=",".join(["h2h", "spreads", "totals"] + pm))
            for b in (g(o, "bookmakers") or [])[:3]:
                print("  book", g(b, "key"), [(g(m, "key"), [(g(x, "name"), g(x, "description"), g(x, "point"), g(x, "price")) for x in (g(m, "outcomes") or [])][:4]) for m in (g(b, "markets") or [])][:5])
        except Exception as ex: print("  odds err", ex)
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
def show(t, o, n=1500): print(t, json.dumps(o)[:n])
for path, grp in (("football/college-football", 80), ("basketball/mens-college-basketball", 50)):
    sb = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/scoreboard?groups={grp}&limit=300")
    E = sb.get("events") or []
    print(path, "events", len(E), "odds on first:", json.dumps(((E[0].get("competitions") or [{}])[0].get("odds") if E else None))[:600])
    if E:
        eid = E[-1]["id"]
        sm = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/summary?event={eid}")
        show(" summary keys", sorted(sm.keys()) if isinstance(sm, dict) else sm, 400)
        bx = (sm.get("boxscore") or {}).get("players") or []
        if bx:
            st = bx[0].get("statistics") or []
            show(" box", [(s.get("name"), s.get("labels"), (s.get("athletes") or [{}])[0].get("stats")) for s in st][:6], 1500)
        show(" pickcenter", sm.get("pickcenter"), 800)
        show(" predictor", sm.get("predictor"), 400)
    show(" rankings", [(r.get("name"), [(x.get("current"), (x.get("team") or {}).get("abbreviation")) for x in (r.get("ranks") or [])[:5]]) for r in (get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/rankings").get("rankings") or [])[:2]], 600)
    tm = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/teams?groups={grp}&limit=400")
    T = (((tm.get("sports") or [{}])[0].get("leagues") or [{}])[0].get("teams") or [])
    print(" teams", len(T))
    if T:
        tid = T[0]["team"]["id"]
        sc = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/teams/{tid}/schedule")
        show(" schedule ev0", (sc.get("events") or [{}])[0], 700)
        ts = get(f"https://site.api.espn.com/apis/site/v2/sports/{path}/teams/{tid}/statistics")
        show(" team stats", ts, 700)
