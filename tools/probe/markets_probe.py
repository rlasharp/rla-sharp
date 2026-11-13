# list the prop markets PropLine offers for one upcoming event per sport (3 requests + 3 event lists)
import os, json
from propline import PropLine
c = PropLine(os.environ["PROPLINE_API_KEY"])
def g(o, k, d=None): return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)
for sp in ("basketball_nba", "icehockey_nhl", "americanfootball_nfl"):
    try:
        ev = c.get_events(sp)
        e = ev[0] if ev else None
        if not e: print(sp, "no events"); continue
        mk = [g(m, "key") for m in c.get_markets(sp, g(e, "id"))]
        print(sp, g(e, "home_team"), "-", len(mk), "markets:", json.dumps(sorted(mk)))
    except Exception as ex: print(sp, "failed", ex)
