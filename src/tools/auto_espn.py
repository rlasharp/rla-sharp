#!/usr/bin/env python3
"""Automatic data refresh from ESPN's public JSON feeds (runs in GitHub Actions, no Claude needed).
Run from the src/ folder:
  python3 tools/auto_espn.py nba-inj                 -> data/nba_inj.txt
  python3 tools/auto_espn.py nba-lines YYYY-MM-DD    -> data/nba_lines.txt (keeps open numbers already saved)
  python3 tools/auto_espn.py nfl-inj "Tue Nov 3"     -> data/espn_inj.txt + inj.js (via tools/injgen.py)
  python3 tools/auto_espn.py nfl-update              -> engine.js LINES (games not started) + market.js MOVE now,
                                                        finals into SLATE (final:[a,h]) + real.js RESULTS
Real numbers only: anything ESPN doesn't list is left as it was."""
import json, re, sys, os, subprocess, datetime, urllib.request

UA = {"User-Agent": "Mozilla/5.0"}
B = "https://site.api.espn.com/apis/site/v2/sports/"
MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
FIX_NFL = {"WSH": "WAS", "LA": "LAR"}

def get(u):
    if os.environ.get("ESPN_CACHE"):   # offline testing: map URL -> cached file
        m = json.load(open(os.environ["ESPN_CACHE"]))
        for k, f in m.items():
            if k in u: return json.load(open(f))
        raise SystemExit("no cache for " + u)
    last = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            last = e
    raise SystemExit(f"fetch failed {u}: {last}")

def mday(iso):
    if not iso: return ""
    try:
        d = datetime.date.fromisoformat(iso[:10]); return f"{MON[d.month-1]} {d.day}"
    except Exception: return ""

def num(x):
    try: return float(str(x).replace("+", "").replace("o", "").replace("u", ""))
    except Exception: return None

def fmt(x):
    return ("%g" % x) if x is not None else ""

# ---------------- NBA ----------------
def nba_inj():
    d = get(B + "basketball/nba/injuries")
    out = ["# ESPN NBA injuries (auto, ESPN JSON feed) " + datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).strftime("%Y-%m-%d %H:%MZ")]
    n = 0
    for t in sorted(d.get("injuries", []), key=lambda t: t.get("displayName", "")):
        rows = []
        for i in t.get("injuries", []):
            st = i.get("status", "")
            if st not in ("Out", "Day-To-Day", "Doubtful", "Questionable"): continue
            a = i.get("athlete", {}); det = i.get("details", {}) or {}
            pos = ((a.get("position") or {}).get("abbreviation")) or ""
            inj = (det.get("type") or "").lower() or "undisclosed"
            if det.get("detail"): inj = (inj + " " + det["detail"].lower()).strip()
            rows.append(f"{a.get('displayName','')}|{pos}|{st}|{inj}|{mday(det.get('returnDate'))}")
        if rows:
            out.append("#" + t.get("displayName", "")); out += rows; n += len(rows)
    if n < 20: raise SystemExit(f"nba-inj: only {n} rows — feed looks wrong, keeping old file")
    open("data/nba_inj.txt", "w").write("\n".join(out) + "\n")
    print(f"nba-inj: {n} players")

def odds_of(c):
    o = (c.get("odds") or [None])[0]
    if not o: return None
    ps, ml, tt = o.get("pointSpread") or {}, o.get("moneyline") or {}, o.get("total") or {}
    hs = num(((ps.get("home") or {}).get("close") or {}).get("line"))
    hso = num(((ps.get("home") or {}).get("open") or {}).get("line"))
    spx = num(((ps.get("home") or {}).get("close") or {}).get("odds"))
    tot = num(o.get("overUnder")) if o.get("overUnder") is not None else num(((tt.get("over") or {}).get("close") or {}).get("line"))
    toto = num(((tt.get("over") or {}).get("open") or {}).get("line"))
    ox = num(((tt.get("over") or {}).get("close") or {}).get("odds")); ux = num(((tt.get("under") or {}).get("close") or {}).get("odds"))
    mla = num(((ml.get("away") or {}).get("close") or {}).get("odds")); mlh = num(((ml.get("home") or {}).get("close") or {}).get("odds"))
    if hs is None:
        dt = (o.get("details") or "").split()
        if len(dt) == 2 and num(dt[1]) is not None:
            fav, x = dt[0], abs(num(dt[1])); home = c["competitors"][0] if c["competitors"][0]["homeAway"] == "home" else c["competitors"][1]
            hs = -x if home["team"]["abbreviation"] == fav else x
        elif (o.get("details") or "").upper() in ("EVEN", "PK"): hs = 0.0
    return dict(sp=hs, spo=hso, spx=spx, tot=tot, toto=toto, ox=ox, ux=ux, mla=mla, mlh=mlh)

def teams_of(c, fix=None):
    t = {x["homeAway"]: x for x in c["competitors"]}
    f = lambda ab: (fix or {}).get(ab, ab)
    return f(t["away"]["team"]["abbreviation"]), f(t["home"]["team"]["abbreviation"]), t

def nba_lines(date):
    d = get(B + "basketball/nba/scoreboard?dates=" + date.replace("-", ""))
    old = {}
    if os.path.exists("data/nba_lines.txt"):
        for ln in open("data/nba_lines.txt"):
            if ln.startswith("#") or "|" not in ln: continue
            p = ln.strip().split("|"); old[p[0]] = p
    rows, n = [], 0
    for e in d.get("events", []):
        c = e["competitions"][0]; a, h, _ = teams_of(c); k = f"{a}@{h}"; o = odds_of(c)
        st = ((c.get("status") or e.get("status") or {}).get("type") or {}).get("state", "pre")
        if k in old and (st != "pre" or not o or o["sp"] is None):
            rows.append("|".join(old[k])); continue   # game started or no line: keep what we had (closing line)
        if not o or o["sp"] is None or o["tot"] is None: continue
        op = old.get(k)
        ospo = op[1] if op else fmt(o["spo"] if o["spo"] is not None else o["sp"])
        otot = op[2] if op else fmt(o["toto"] if o["toto"] is not None else o["tot"])
        rows.append("|".join([k, ospo, otot, fmt(o["sp"]), fmt(o["spx"] or -110), fmt(o["tot"]), fmt(o["ox"] or -110), fmt(o["ux"] or -110), fmt(o["mla"]), fmt(o["mlh"])]))
        n += 1
    if not rows: print("nba-lines: no games / no lines today — keeping old file"); return
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(hours=5)
    hdr = ["# AWAY@HOME|open home spread|open total|home spread|spread price|total|over price|under price|away ML|home ML   (ESPN odds feed, DraftKings) — auto",
           "# asof: " + now.strftime("%a %b %-d, %-I:%M %p") + " ET"]
    open("data/nba_lines.txt", "w").write("\n".join(hdr + rows) + "\n")
    print(f"nba-lines: {len(rows)} games ({n} refreshed)")

# ---------------- NFL ----------------
def nfl_team_map():
    js = open("engine.js", encoding="utf-8").read()
    m = re.search(r"const TEAMS\s*=\s*\{(.*?)\n\};", js, re.S)
    out = {}
    for ab, nm in re.findall(r'(\w+):\s*\["([^"]+)"', m.group(1) if m else ""):
        out[nm] = ab
    return out

def nfl_inj(asof):
    d = get(B + "football/nfl/injuries"); M = nfl_team_map()
    stmap = {"Out": "Out", "Doubtful": "Doubtful", "Questionable": "Questionable", "Injured Reserve": "IR"}
    out = ["# ESPN NFL injuries (auto, ESPN JSON feed) " + datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).strftime("%Y-%m-%d %H:%MZ"),
           "# name|pos|status|injury|est. return     status: Out, Doubtful, Questionable, IR"]
    n = 0
    for t in d.get("injuries", []):
        ab = M.get(t.get("displayName", ""))
        if not ab: continue
        rows = []
        for i in t.get("injuries", []):
            st = stmap.get(i.get("status", ""))
            if not st: continue
            a = i.get("athlete", {}); det = i.get("details", {}) or {}
            pos = ((a.get("position") or {}).get("abbreviation")) or ""
            rows.append(f"{a.get('displayName','')}|{pos}|{st}|{det.get('type') or 'Undisclosed'}|{mday(det.get('returnDate'))}")
        out.append("#" + ab); out += rows; n += len(rows)
    if n < 100: raise SystemExit(f"nfl-inj: only {n} rows — feed looks wrong, keeping old file")
    open("data/espn_inj.txt", "w").write("\n".join(out) + "\n")
    subprocess.run([sys.executable, "tools/injgen.py", "data/espn_inj.txt", asof], check=True)
    print(f"nfl-inj: {n} players")

def nfl_update():
    js = open("engine.js", encoding="utf-8").read()
    slate = re.findall(r'\{id:("?[\w]+"?),away:"(\w+)",home:"(\w+)"([^}]*)\}', js.split("const LINES")[0])
    games = {(a, h): (i.strip('"'), rest) for i, a, h, rest in slate}
    weeks = set()
    pw = re.search(r"PLAYS_WEEK\s*=\s*(\d+)", "".join(open(f, encoding="utf-8").read() for f in os.listdir(".") if f.endswith(".js")))
    wk = int(pw.group(1)) if pw else None
    if wk: weeks |= {wk - 1, wk}
    real = open("real.js", encoding="utf-8").read(); mk = open("market.js", encoding="utf-8").read()
    nl = nf = 0
    for w in sorted(weeks):
        d = get(B + f"football/nfl/scoreboard?week={w}&seasontype=2")
        for e in d.get("events", []):
            c = e["competitions"][0]; a, h, T = teams_of(c, FIX_NFL)
            if (a, h) not in games: continue
            gid, rest = games[(a, h)]; st = ((c.get("status") or {}).get("type") or {}).get("state", "pre")
            if st == "post":
                asc, hsc = int(T["away"].get("score") or 0), int(T["home"].get("score") or 0)
                if "final:" not in rest:
                    js = re.sub(r'(\{id:"?%s"?,away:"%s",home:"%s")' % (re.escape(gid), a, h), r'\1,final:[%d,%d]' % (asc, hsc), js, count=1); nf += 1
                gw = int(re.search(r"wk:(\d+)", rest).group(1)) if "wk:" in rest else w
                if not re.search(r'\[%d,"%s",\d+,"%s",\d+\]' % (gw, a, h), real):
                    real = re.sub(r"(const RESULTS=\[\n(?:.*\n)*?)(\];)", lambda m: m.group(1).rstrip("\n") + f',[{gw},"{a}",{asc},"{h}",{hsc}]\n' + m.group(2), real, count=1)
            elif st == "pre":
                o = odds_of(c)
                if not o or o["sp"] is None or o["tot"] is None: continue
                ml = f"[{fmt(o['mla'])},{fmt(o['mlh'])}]" if o["mla"] is not None and o["mlh"] is not None else None
                new = f"{gid}:{{sp:{fmt(o['sp'])},{'ml:'+ml+',' if ml else ''}tot:{fmt(o['tot'])}}}"
                pat = re.compile(r'\n\s*"?%s"?:\{sp:[^}]*\}' % re.escape(gid))
                if pat.search(js):
                    js = pat.sub(lambda m: "\n " + new, js, count=1); nl += 1
                mp = re.compile(r'(\n\s*%s:\{open:\{[^}]*\},now:)\{[^}]*\}' % re.escape(gid))
                if mp.search(mk):
                    mk = mp.sub(lambda m: m.group(1) + f"{{sp:{fmt(o['sp'])},tot:{fmt(o['tot'])}" + (f",ml:{ml}" if ml else "") + "}", mk, count=1)
    now = (datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(hours=5)).strftime("%a %b %-d, %-I %p ET")
    mk = re.sub(r'(MARKET_ASOF\s*=\s*)"[^"]*"', lambda m: m.group(1) + json.dumps(now), mk, count=1)
    open("engine.js", "w", encoding="utf-8").write(js); open("real.js", "w", encoding="utf-8").write(real); open("market.js", "w", encoding="utf-8").write(mk)
    print(f"nfl-update: {nl} lines refreshed, {nf} new finals (weeks {sorted(weeks)})")

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "nba-inj": nba_inj()
    elif cmd == "nba-lines": nba_lines(sys.argv[2])
    elif cmd == "nfl-inj": nfl_inj(sys.argv[2])
    elif cmd == "nfl-update": nfl_update()
    else: raise SystemExit("unknown command")
