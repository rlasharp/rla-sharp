# do NBA player props come with 1st-quarter versions? do NHL goalie saves lines come back? (2 odds requests)
import os, json, collections
from propline import PropLine
c = PropLine(os.environ["PROPLINE_API_KEY"])
def g(o, k, d=None): return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)
for sp, mk in (("basketball_nba", ["player_points", "player_rebounds", "player_assists", "player_free_throws_made"]), ("icehockey_nhl", ["goalie_saves"])):
    ev = c.get_events(sp)
    if not ev: print(sp, "no events"); continue
    e = ev[0]
    try: o = c.get_odds(sp, event_id=g(e, "id"), markets=mk, period="all")
    except TypeError: o = c.get_odds(sp, event_id=g(e, "id"), markets=mk)
    cnt = collections.Counter(); ex = {}
    for bk in g(o, "bookmakers", []) or []:
        for m in g(bk, "markets", []) or []:
            k = f"{g(m,'key')}@{g(m,'period')}"; cnt[k] += 1
            if k not in ex: ex[k] = [g(bk, "key"), [[g(x, 'name'), g(x, 'description'), g(x, 'point'), g(x, 'price')] for x in (g(m, 'outcomes', []) or [])[:2]]]
    print(sp, g(e, "home_team"), json.dumps(cnt)); print(json.dumps(ex)[:3000])
