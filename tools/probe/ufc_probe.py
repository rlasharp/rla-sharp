# what ESPN + PropLine offer for UFC
import json, os, urllib.request, datetime as dt
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
    except Exception as e: return {"_err": str(e)}
def keys(o, n=0):
    return list(o.keys())[:40] if isinstance(o, dict) else type(o).__name__
B = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/"
sb = get(B + "scoreboard")
print("SCOREBOARD keys", keys(sb)); ev = (sb.get("events") or [])
print(" events", len(ev), [(e.get("id"), e.get("name"), e.get("date")) for e in ev[:3]])
if ev:
    e = ev[0]; c = e.get("competitions") or []
    print(" comps", len(c)); 
    if c: print(" comp0", json.dumps({k: c[0].get(k) for k in ("id", "type", "format", "status", "notes", "cardSegment")})[:600]); print(" competitor0", json.dumps(c[0]["competitors"][0])[:1500])
cal = (sb.get("leagues") or [{}])[0].get("calendar") or []
print(" calendar", len(cal), json.dumps(cal[:3])[:400])
# a past event: last finished date in calendar
today = dt.date.today().isoformat()
past = [x for x in cal if isinstance(x, dict) and (x.get("startDate") or "")[:10] < today][-1:] or []
if past:
    d = past[0]["startDate"][:10].replace("-", "")
    s2 = get(B + f"scoreboard?dates={d}"); e2 = (s2.get("events") or [{}])[0]; c2 = (e2.get("competitions") or [{}])[0]
    print("PAST", e2.get("name"), "comp keys", keys(c2)); print(" status", json.dumps(c2.get("status"))[:500]); print(" details", json.dumps(c2.get("details"))[:500]); print(" competitor", json.dumps((c2.get("competitors") or [{}])[0])[:800])
    sm = get(B + f"summary?event={e2.get('id')}"); print(" SUMMARY keys", keys(sm))
    aid = (((c2.get("competitors") or [{}])[0]).get("athlete") or {}).get("id") or (((c2.get("competitors") or [{}])[0]).get("id"))
    for u in [f"https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/{aid}", f"https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/{aid}/fighthistory", f"https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/{aid}/stats", f"https://sports.core.api.espn.com/v2/sports/mma/athletes/{aid}"]:
        a = get(u); print("ATH", u.split("/mma/")[1], keys(a)); print("  ", json.dumps(a)[:900])
try:
    from propline import PropLine
    pc = PropLine(os.environ["PROPLINE_API_KEY"])
    sp = pc.get_sports(); g = lambda o, k: o.get(k) if isinstance(o, dict) else getattr(o, k, None)
    print("PROPLINE sports", [g(x, "key") for x in sp][:80])
    mma = [g(x, "key") for x in sp if "mma" in str(g(x, "key")).lower() or "ufc" in str(g(x, "key")).lower()]
    for k in mma[:2]:
        evs = pc.get_events(k); print(k, "events", len(evs), [(g(x, "home_team"), g(x, "away_team"), g(x, "commence_time")) for x in evs[:3]])
        if evs: print("  markets", [g(m, "key") for m in pc.get_markets(k, g(evs[0], "id"))])
except Exception as e: print("propline err", e)
