"""One-off source check (run by probe.yml): which free official/ESPN feeds carry referees, probable goalies,
quarter scores and betting splits. Prints a short report. Delete after use."""
import json, urllib.request, datetime as dt
def get(u, raw=False):
    r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "rla-sharp-site-updater"}), timeout=20)
    b = r.read(); return b if raw else json.loads(b)
def keys(o, d=0, pre=""):
    if d > 2 or not isinstance(o, dict): return []
    out = []
    for k, v in o.items():
        out.append(pre + k)
        if isinstance(v, dict): out += keys(v, d + 1, pre + k + ".")
    return out
today = dt.date.today().strftime("%Y%m%d"); yest = (dt.date.today() - dt.timedelta(days=1)).strftime("%Y%m%d")
def sb(sp, d): return get(f"https://site.api.espn.com/apis/site/v2/sports/{sp}/scoreboard?dates={d}")
for sp in ["hockey/nhl", "basketball/nba", "football/nfl"]:
    try:
        j = sb(sp, today); ev = j.get("events", [])
        print(f"\n== ESPN {sp} today: {len(ev)} games")
        for e in ev[:2]:
            c = e["competitions"][0]
            print(" comp keys:", [k for k in c.keys()])
            for t in c["competitors"]:
                print("  ", t["team"]["abbreviation"], "probables:", json.dumps(t.get("probables"))[:300], "| linescores:", len(t.get("linescores") or []))
        try:
            if ev:
                s = get(f"https://site.api.espn.com/apis/site/v2/sports/{sp}/summary?event={ev[0]['id']}")
                gi = s.get("gameInfo", {}); print(" upcoming summary keys:", list(s.keys())); print(" upcoming officials:", json.dumps(gi.get("officials"))[:300])
                for k in ("againstTheSpread", "pickcenter", "predictor", "odds"):
                    if k in s: print(f"  {k}:", json.dumps(s[k])[:400])
        except Exception as x: print(" summary err", x)
        j = sb(sp, yest); ev = [e for e in j.get("events", []) if e["status"]["type"]["state"] == "post"]
        if ev:
            s = get(f"https://site.api.espn.com/apis/site/v2/sports/{sp}/summary?event={ev[0]['id']}")
            print(" final officials:", json.dumps(s.get("gameInfo", {}).get("officials"))[:300])
            bx = s.get("boxscore", {}).get("teams", [])
            if bx: print(" team box stats:", [x.get("name") or x.get("label") for x in bx[0].get("statistics", [])][:40])
            pl = s.get("boxscore", {}).get("players", [])
            if pl: print(" player stat groups:", [(g.get("name"), g.get("labels") or g.get("keys")) for g in pl[0].get("statistics", [])][:4])
    except Exception as x: print(sp, "ERR", x)
print("\n== NHL api-web")
try:
    s = get("https://api-web.nhle.com/v1/schedule/now"); g = [x for d in s["gameWeek"] for x in d["games"]]
    up = [x for x in g if x["gameState"] in ("FUT", "PRE")][:1]; fin = [x for x in g if x["gameState"] in ("OFF", "FINAL")][:1]
    for lab, L in (("upcoming", up), ("final", fin)):
        for x in L:
            for ep in ("right-rail", "landing"):
                try:
                    r = get(f"https://api-web.nhle.com/v1/gamecenter/{x['id']}/{ep}")
                    print(f" {lab} {ep} keys:", list(r.keys())[:30])
                    if "gameInfo" in r: print("   gameInfo:", json.dumps(r["gameInfo"])[:400])
                    if "matchup" in r: print("   matchup keys:", list(r["matchup"].keys()), json.dumps(r["matchup"].get("goalieComparison") or r["matchup"].get("goalieSeasonStats") or {})[:400])
                except Exception as e: print(" ", ep, "err", e)
except Exception as x: print("nhl err", x)
print("\n== official.nba.com referee assignments")
try:
    b = get("https://official.nba.com/referee-assignments/", raw=True); t = b.decode("utf8", "ignore")
    print(" bytes", len(b), "has table:", "<table" in t, "| snippet:", t[t.find("<table"):t.find("<table") + 300].replace("\n", " ") if "<table" in t else "")
except Exception as x: print(" err", x)
print("\n== propline package")
try:
    import propline, inspect
    print(" module attrs:", [a for a in dir(propline) if not a.startswith("_")])
    for a in dir(propline):
        o = getattr(propline, a)
        if inspect.isclass(o): print(" class", a, [m for m in dir(o) if not m.startswith("_")])
except Exception as x: print(" err", x)
