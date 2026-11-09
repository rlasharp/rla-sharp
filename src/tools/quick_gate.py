#!/usr/bin/env python3
"""Game-night gate for .github/workflows/quick.yml (runs every 20 min, takes ~10 s).
Looks at ESPN's NBA / NFL / NHL scoreboards (today, plus yesterday until 7 AM ET) and decides whether to run a site
update now, and for which sports:
  * a game just went final                      -> update that sport (results, box scores, tracker grading)
  * the last game of the day for a sport is final -> full update (everything graded the same night)
  * a game starts in ~60-100 min or ~10-45 min  -> update that sport (late scratches, goalies, injuries, lines)
Also checks that the site itself is healthy and fresh (watchdog) and reports a problem for the alert step.
State: data/quick.json (committed by the update job, so nothing is missed if GitHub starts a run late).
Writes key=value lines to $GITHUB_OUTPUT: run, what, reason, state (json), alert, alert_title.
usage: python3 src/tools/quick_gate.py [force]
"""
import json, os, sys, subprocess, urllib.request, datetime as dt
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/Toronto")
URL = {"nba": "basketball/nba", "nfl": "football/nfl", "nhl": "hockey/nhl",
       # soccer: 8 competitions, all mapped to the "soc" site update
       "soc-epl": "soccer/eng.1", "soc-esp": "soccer/esp.1", "soc-ita": "soccer/ita.1", "soc-ger": "soccer/ger.1", "soc-fra": "soccer/fra.1",
       "soc-ucl": "soccer/uefa.champions", "soc-uel": "soccer/uefa.europa", "soc-uecl": "soccer/uefa.europa.conf"}
SP = lambda k: "soc" if k.startswith("soc") else k
STATE = "data/quick.json"

def get(u):
    req = urllib.request.Request(u, headers={"User-Agent": "rla-sharp-site-updater"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def games(sp, day):
    j = get(f"https://site.api.espn.com/apis/site/v2/sports/{URL[sp]}/scoreboard?dates={day.strftime('%Y%m%d')}")
    out = []
    for e in j.get("events", []):
        st = ((e.get("status") or {}).get("type") or {}).get("state", "pre")
        try: start = dt.datetime.fromisoformat(e["date"].replace("Z", "+00:00"))
        except Exception: start = None
        out.append({"id": f"{sp}:{e['id']}", "sp": sp, "st": st, "start": start, "name": e.get("shortName", "")})
    return out

def main():
    force = len(sys.argv) > 1 and sys.argv[1] in ("1", "true", "force", "all")
    now = dt.datetime.now(dt.timezone.utc); net = now.astimezone(ET)
    days = [net.date()] + ([net.date() - dt.timedelta(days=1)] if net.hour < 7 else [])
    try: S = json.load(open(STATE))
    except Exception: S = {}
    finals0, pre0, done0 = set(S.get("finals", [])), set(S.get("pre", [])), list(S.get("done", []))
    G, errs = {}, []
    for sp in URL:
        for d in days:
            try: G[(sp, d.isoformat())] = games(sp, d)
            except Exception as e: errs.append(f"{sp} {d}: {e}")
    allg = [g for L in G.values() for g in L]
    finals = {g["id"] for g in allg if g["st"] == "post"}
    new = sorted(finals - finals0)
    sports, why, full, pre, done = set(), [], force, set(), list(done0)
    if new:
        names = list(dict.fromkeys(g["name"] for g in allg if g["id"] in new))
        sports |= {SP(i.split(":")[0]) for i in new}
        why.append(f"{len(new)} game(s) final: " + ", ".join(names[:6]) + ("…" if len(names) > 6 else ""))
    for (sp, d), L in G.items():
        k = f"{sp}:{d}"
        if L and not sp.startswith("soc") and all(g["st"] == "post" for g in L) and k not in done0:
            done.append(k); full = True; why.append(f"last {sp.upper()} game of {d} is final — full update")
    for g in allg:
        if g["st"] != "pre" or not g["start"]: continue
        mins = (g["start"] - now).total_seconds() / 60
        key = f"{g['id']}:90" if 55 <= mins <= 100 else f"{g['id']}:30" if 10 <= mins <= 45 else None
        if not key: continue
        pre.add(key)
        if key not in pre0:
            sports.add(SP(g["sp"])); why.append(f"{g['name']} starts in {int(mins)} min — pre-game update")
    # keep state small: only games we can still see (+ the last 10 'done' days)
    ids = {g["id"] for g in allg}
    state = {"finals": sorted(finals | {f for f in finals0 if f in ids}), "pre": sorted(pre | {p for p in pre0 if p.rsplit(":", 1)[0] in ids}),
             "done": done[-10:], "at": now.isoformat(timespec="seconds")}
    why = list(dict.fromkeys(why))
    run = bool(full or sports)
    what = "all" if full else ",".join(sorted(sports))
    if force: why.insert(0, "started by hand")
    if errs: print("ESPN problems (gate keeps going):", "; ".join(errs))

    # ---- watchdog: is the site fresh and healthy? ----
    alert, title = [], ""
    try:
        at = json.load(open("version.json"))["at"]; last = dt.datetime.fromisoformat(at.replace("Z", "+00:00"))
    except Exception:
        try: last = dt.datetime.fromtimestamp(int(subprocess.check_output(["git", "log", "-1", "--format=%ct", "--", "index.html"]).strip()), dt.timezone.utc)
        except Exception: last = None
    age = (now - last).total_seconds() / 3600 if last else None
    if age is not None and age > 3.5:
        alert.append(f"The site has not been updated for {age:.1f} hours (last update {last.astimezone(ET):%a %b %-d %-I:%M %p} ET). Updates normally run at least every 2 hours.")
        title = f"Site data is {age:.0f} h old"
    try:
        h = json.load(open("data/health.json"))
        a, s, n = h.get("auto") or {}, h.get("site") or {}, h.get("nhl") or {}
        if a and not a.get("ok"):
            alert.append("The last automatic update FAILED (data, build or site check) — the site kept its previous version.\n\n```\n" + (a.get("summary") or "")[-700:] + "\n```")
            title = title or "Automatic update failed"
        if s and not s.get("ok"):
            alert.append(f"The live site check found a problem: {s.get('issue')}"); title = title or "Live site problem"
        if n and not n.get("ok"):
            alert.append(f"NHL data problem: {n.get('issue')}"); title = title or "NHL data problem"
    except Exception:
        pass
    if len(errs) == len(URL) * len(days):
        alert.append("ESPN's scoreboards could not be reached at all, so game-night updates are not being triggered."); title = title or "Game-night updates blocked"

    print(f"run={run} what={what} reason={' | '.join(why) or 'nothing new'}")
    print(f"alert={'; '.join(a.splitlines()[0] for a in alert) or 'none'}")
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a") as f:
            f.write(f"run={'1' if run else '0'}\nwhat={what}\nreason={' | '.join(why)[:900]}\nstate={json.dumps(state)}\n")
            f.write(f"alert_title={title}\n")
            f.write("alert<<ALERT_EOF\n" + "\n\n".join(alert) + "\nALERT_EOF\n")
    else:
        print(json.dumps(state)[:500])

if __name__ == "__main__":
    main()
