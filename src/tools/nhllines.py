#!/usr/bin/env python3
"""NHL line combinations + power-play units from Daily Faceoff (each team's line-combinations page) -> nhl_lines.js
(var NHL_LINES). Runs with the NHL site update. Keeps the previous version of each team's lines in data/nhl_lines.json
so the site can show who moved up (to the top line / first power-play unit) or down in the last few days.
Real data only; a team whose page fails keeps its last saved lines.
usage (from src/): python3 tools/nhllines.py > nhl_lines.js"""
import json, re, sys, os, time, unicodedata, datetime as dt, urllib.request
ROOT = os.environ.get("REPO", os.path.abspath(".."))
CF = os.path.join(ROOT, "data/nhl_lines.json")
try: C = json.load(open(CF))
except Exception: C = {}
src = open(os.path.join(ROOT, "nhl_data.js"), encoding="utf-8").read() if os.path.exists(os.path.join(ROOT, "nhl_data.js")) else open("nhl_data.js", encoding="utf-8").read()
TEAMS = dict(re.findall(r'"([A-Z]{3})":\{"n":"([^"]+)"', src))
def slug(n): return re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", n).encode("ascii", "ignore").decode().lower().replace(".", "")).strip("-")
UA = {"User-Agent": "Mozilla/5.0 (rla-sharp research site)", "Accept": "text/html"}
now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"); ok = 0
NOW = dt.datetime.now(dt.timezone.utc)
for ab, nm in sorted(TEAMS.items()):
    ft = (C.get(ab) or {}).get("ft")
    if ft and (NOW - dt.datetime.fromisoformat(ft)).total_seconds() < 75 * 60: ok += 1; continue   # read at most every 75 min
    try:
        with urllib.request.urlopen(urllib.request.Request(f"https://www.dailyfaceoff.com/teams/{slug(nm)}/line-combinations", headers=UA), timeout=30) as r: h = r.read().decode("utf8", "replace")
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
        cmb = json.loads(m.group(1))["props"]["pageProps"]["combinations"]
    except Exception as e:
        print(f"nhllines: {ab} failed ({e}) — kept old", file=sys.stderr); continue
    G = {}
    for p in cmb.get("players") or []:
        g = p.get("groupIdentifier") or ""; G.setdefault(g, []).append([p.get("name"), p.get("positionIdentifier") or "", 1 if p.get("gameTimeDecision") else 0, p.get("injuryStatus") or ""])
    order = {"lw": 0, "ld": 0, "c": 1, "rd": 1, "rw": 2}
    for g in G: G[g].sort(key=lambda x: order.get(x[1], 5))
    cur = {"at": cmb.get("updatedAt") or now, "src": cmb.get("sourceName") or "Daily Faceoff", "g": G}
    old = C.get(ab) or {}
    if old.get("cur") and json.dumps(old["cur"]["g"], sort_keys=True) != json.dumps(G, sort_keys=True):
        C[ab] = {"cur": cur, "prev": old["cur"], "chg": now, "ft": now}
    else:
        C[ab] = {"cur": cur, "prev": old.get("prev"), "chg": old.get("chg"), "ft": now}
    ok += 1; time.sleep(0.4)
json.dump(C, open(CF, "w"), separators=(",", ":"), ensure_ascii=False)
# daily power-play units (kept so the site can filter a player's past games by PP1 / PP2); date = today in Eastern time
HF = os.path.join(ROOT, "data/nhl_pp_hist.json")
try: PH = json.load(open(HF))
except Exception: PH = {}
day = (NOW - dt.timedelta(hours=5)).date().isoformat()
PH[day] = {t: {u: [p[0] for p in (X.get("cur") or {}).get("g", {}).get(u, [])] for u in ("pp1", "pp2")} for t, X in C.items() if X.get("cur")}
PH = {d: PH[d] for d in sorted(PH)[-200:]}
json.dump(PH, open(HF, "w"), separators=(",", ":"), ensure_ascii=False)
PPH = {}
for d, T in PH.items():
    for t, U in T.items():
        for u, n in (("pp1", 1), ("pp2", 2)):
            for nm in U.get(u) or []: PPH.setdefault(nm, {})[d] = n
PPD = sorted(PH)
if not C: sys.exit("nhllines: nothing — keeping the old file")
print(f"/* NHL line combinations + power-play units — Daily Faceoff (tools/nhllines.py), {now} */")
# the site only needs: forward lines, D pairs, power-play units (name, position, game-time decision); and for "who moved",
# just the previous top line + PP units, and only when they changed in the last 3 days
KEEP = ("f1", "f2", "f3", "f4", "d1", "d2", "d3", "pp1", "pp2")
def slim(c, keys=KEEP): return {"at": c.get("at"), "src": c.get("src"), "g": {g: [[p[0], p[1], p[2]] for p in P] for g, P in (c.get("g") or {}).items() if g in keys}}
S = {}
for t, X in C.items():
    if not X.get("cur"): continue
    o = {"cur": slim(X["cur"])}
    if X.get("prev") and X.get("chg") and (NOW - dt.datetime.fromisoformat(X["chg"])).total_seconds() < 3 * 86400:
        o["prev"] = slim(X["prev"], ("f1", "pp1", "f2", "pp2")); o["chg"] = X["chg"]
    S[t] = o
print("var NHL_LINES=" + json.dumps(S, separators=(",", ":"), ensure_ascii=False) + ";")
print("var NHL_PPH=" + json.dumps({"days": PPD, "p": PPH}, separators=(",", ":"), ensure_ascii=False) + ";  /* power-play unit by day: days we have lines for, player -> {date: 1 | 2} */")
print(f"nhllines: {ok}/{len(TEAMS)} teams", file=sys.stderr)
