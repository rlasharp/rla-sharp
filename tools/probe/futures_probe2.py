import os, json, urllib.request
from propline import PropLine
c = PropLine(os.environ["PROPLINE_API_KEY"])
def g(o, k): return o.get(k) if isinstance(o, dict) else getattr(o, k, None)
for sp in ("basketball_nba", "americanfootball_nfl", "football_nfl", "icehockey_nhl", "hockey_nhl", "soccer_epl", "mma_ufc"):
    try: ev = c.get_events(sp)
    except Exception as e: print(sp, "err", e); continue
    out = [e for e in ev if g(e, "is_outright")]
    print(sp, len(ev), "outrights", len(out), [(g(e, "id"), g(e, "home_team"), g(e, "tournament"), g(e, "commence_time")) for e in out][:12])
    for e in out[:2]:
        try:
            mk = [g(m, "key") for m in c.get_markets(sp, g(e, "id"))]; print("  mk", mk[:15])
            o = c.get_odds(sp, event_id=g(e, "id"), markets=",".join(mk[:2]) if mk else None)
            bk = g(o, "bookmakers") or []
            print("  books", [g(b, "key") for b in bk][:10])
            if bk:
                m0 = (g(bk[0], "markets") or [{}])[0]; print("  market", g(m0, "key"), g(m0, "description"), [(g(x, "name"), g(x, "price")) for x in (g(m0, "outcomes") or [])][:8])
        except Exception as ex: print("  err", ex)
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
for lg, yr in (("basketball/leagues/nba", 2027), ("football/leagues/nfl", 2026), ("hockey/leagues/nhl", 2027)):
    u = f"https://sports.core.api.espn.com/v2/sports/{lg}/seasons/{yr}/futures"
    r = get(u); print("ESPN", lg, json.dumps(r)[:900])
    for it in (r.get("items") or [])[:1]:
        x = get(it["$ref"].replace("http://", "https://")) if "$ref" in it else it
        print("  item", json.dumps(x)[:1500])
