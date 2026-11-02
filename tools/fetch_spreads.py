#!/usr/bin/env python3
"""Closing spreads for every finished NBA game this season, from ESPN's public scoreboard/summary JSON.
Writes data/nba_spreads.json: {eventId: [date, away, home, homeSpread, total, awayScore, homeScore, provider]}
homeSpread < 0 = home team favored. Only games ESPN has a line for are kept. Runs in the GitHub Action (spreads.yml)."""
import json, os, re, sys, time, datetime, urllib.request
OUT = "data/nba_spreads.json"
SB = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=%s&limit=50"
SM = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=%s"
START = datetime.date(2026, 10, 20)
def get(u):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
                return json.load(r)
        except Exception as e:
            err = e; time.sleep(2)
    print("fail", u, err, file=sys.stderr); return None
def parse(o, away, home):
    """o: an ESPN odds/pickcenter object -> (homeSpread, total)"""
    if not o: return None
    tot = o.get("overUnder")
    d = (o.get("details") or "").strip()
    if d.upper() in ("EVEN", "PK", "PICK"): return (0.0, tot)
    m = re.match(r"^([A-Z]{2,4})\s+([-+]?\d+(?:\.\d+)?)$", d)
    if m:
        fav, x = m.group(1), abs(float(m.group(2)))
        if fav == home: return (-x, tot)
        if fav == away: return (x, tot)
    sp = o.get("spread")
    if isinstance(sp, (int, float)):
        hf = (o.get("homeTeamOdds") or {}).get("favorite"); af = (o.get("awayTeamOdds") or {}).get("favorite")
        x = abs(float(sp))
        if hf: return (-x, tot)
        if af: return (x, tot)
    return None
def main():
    have = json.load(open(OUT)) if os.path.exists(OUT) else {}
    today = (datetime.datetime.utcnow() - datetime.timedelta(hours=5)).date()
    d, new = START, 0
    while d <= today:
        sb = get(SB % d.strftime("%Y%m%d")); d0 = d.isoformat(); d += datetime.timedelta(days=1)
        if not sb: continue
        for e in sb.get("events", []):
            eid = str(e["id"]); c = e["competitions"][0]
            if not c.get("status", {}).get("type", {}).get("completed"): continue
            if eid in have: continue
            t = {x["homeAway"]: x for x in c["competitors"]}
            away, home = t["away"]["team"]["abbreviation"], t["home"]["team"]["abbreviation"]
            r = None; prov = ""
            for o in c.get("odds") or []:
                r = parse(o, away, home); prov = (o.get("provider") or {}).get("name", "")
                if r: break
            if not r:
                s = get(SM % eid) or {}
                for o in s.get("pickcenter") or []:
                    r = parse(o, away, home); prov = (o.get("provider") or {}).get("name", "")
                    if r: break
                time.sleep(.3)
            if not r: print("no line", eid, away, home, file=sys.stderr); continue
            have[eid] = [d0, away, home, r[0], r[1], int(t["away"].get("score") or 0), int(t["home"].get("score") or 0), prov]; new += 1
    os.makedirs("data", exist_ok=True)
    json.dump(dict(sorted(have.items())), open(OUT, "w"), separators=(",", ":"))
    print(f"nba spreads: {len(have)} games ({new} new)")
main()
