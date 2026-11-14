import os, json, inspect
from propline import PropLine
c = PropLine(os.environ["PROPLINE_API_KEY"])
print("METHODS", [m for m in dir(c) if not m.startswith("_")])
for m in [m for m in dir(c) if not m.startswith("_")]:
    try: print(" sig", m, inspect.signature(getattr(c, m)))
    except Exception: pass
def g(o, k):
    return o.get(k) if isinstance(o, dict) else getattr(o, k, None)
try:
    S = c.get_sports()
    keys = [g(s, "key") for s in S]
    print("SPORTS", len(keys), keys[:120])
    fut = [s for s in S if any(w in (str(g(s, "key")) + str(g(s, "title")) + str(g(s, "description"))).lower() for w in ("winner", "champion", "futures", "outright", "mvp", "award"))]
    print("FUTURES", [(g(s, "key"), g(s, "title"), g(s, "has_outrights")) for s in fut][:60])
    for s in fut[:3]:
        k = g(s, "key")
        try:
            ev = c.get_events(k); print(" EV", k, len(ev), str(ev[:1])[:600])
            if ev:
                eid = g(ev[0], "id")
                try: print("  MK", [g(m, "key") for m in c.get_markets(k, eid)][:20])
                except Exception as e: print("  mk err", e)
                o = c.get_odds(k, event_id=eid)
                print("  ODDS", str(o)[:1500])
        except Exception as e: print(" err", k, e)
except Exception as e: print("ERR", e)
# also check outright markets on a normal sport
for sp in ("basketball_nba", "americanfootball_nfl", "icehockey_nhl"):
    try:
        ev = c.get_events(sp)
        print(sp, "events", len(ev))
        if ev: print(" mk", [g(m, "key") for m in c.get_markets(sp, g(ev[0], "id"))][:40])
    except Exception as e: print(sp, "err", e)
