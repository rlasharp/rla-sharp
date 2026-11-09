#!/usr/bin/env python3
"""NBA referees: tonight's crews (official.nba.com assignments, posted ~9 AM ET) + how each referee's games have gone
this season (ESPN game summaries: officials, free throws, fouls, points; closing totals from data/nba_spreads.json).
Real data only — a referee with fewer than 3 games is shown without averages.
Cache: data/nba_refs.json (src/). Output (stdout): nba_refs.js -> var NBA_REFS={...}
usage (from src/): python3 tools/nbarefs.py [REPO]"""
import json, os, re, sys, time, html, urllib.request, datetime as dt

REPO = sys.argv[1] if len(sys.argv) > 1 else ".."
UA = {"User-Agent": "rla-sharp-site-updater"}
CACHE = "data/nba_refs.json"
def log(*a): print(*a, file=sys.stderr)
def get(u, raw=False):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25) as r:
        b = r.read()
    return b.decode("utf8", "ignore") if raw else json.loads(b)
def const(name, src):
    m = re.search(r"const %s=(.*?);\n" % name, src, re.S)
    return json.loads(m.group(1)) if m else None

nba = open("nba_data.js", encoding="utf8").read()
RES, TEAMS = const("NBA_RES", nba) or [], const("NBA_TEAMS", nba) or {}
try: C = json.load(open(CACHE))
except Exception: C = {}
C.setdefault("games", {})

# ---- past games: officials + free throws / fouls from ESPN summaries (new finals only, max 80 per run) ----
todo = [str(r[0]) for r in RES if str(r[0]) not in C["games"]][:80]
for gid in todo:
    try:
        s = get(f"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={gid}"); time.sleep(0.12)
        refs = [o.get("displayName") or o.get("fullName") for o in (s.get("gameInfo") or {}).get("officials") or []]
        refs = [r for r in refs if r]
        ft, pf = 0, 0
        for t in (s.get("boxscore") or {}).get("teams") or []:
            for st in t.get("statistics") or []:
                n = st.get("name") or ""; v = str(st.get("displayValue") or "")
                if n.startswith("freeThrowsMade-freeThrowsAttempted") and "-" in v: ft += int(v.split("-")[1] or 0)
                elif n == "fouls": pf += int(float(v or 0))
        if refs: C["games"][gid] = {"r": refs, "fta": ft, "pf": pf}
    except Exception as e:
        log("ESPN summary failed", gid, e)
log(f"NBA refs: {len(todo)} summaries checked, {len(C['games'])} games cached")

# ---- tonight's assignments ----
today = {}
try:
    page = get("https://official.nba.com/referee-assignments/", raw=True)
    nick = {ab: (n.split()[-1] if not n.endswith("Trail Blazers") else "Trail Blazers") for ab, n in TEAMS.items()}
    city = {ab: " ".join(n.split()[:-1]) for ab, n in TEAMS.items()}
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.S):
        cells = [html.unescape(re.sub(r"<[^>]+>", " ", c)).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        cells = [re.sub(r"\s+", " ", c) for c in cells]
        if len(cells) < 3 or "@" not in cells[0]: continue
        a_txt, h_txt = [x.strip() for x in cells[0].split("@", 1)]
        def team(t):
            for ab in TEAMS:
                if t.lower() == ab.lower() or nick[ab].lower() in t.lower() or (city[ab] and t.lower() == city[ab].lower()): return ab
            return None
        a, h = team(a_txt), team(h_txt)
        names = [re.sub(r"\s*\(#?\d+\)\s*$", "", c).strip() for c in cells[1:4] if c and not re.match(r"^[-–\s]*$", c)]
        if a and h and names: today[f"{a}@{h}"] = names
    log(f"NBA refs: {len(today)} crews posted today")
except Exception as e:
    log("referee assignments failed", e)

# ---- per-referee season numbers ----
spr = {}
try: spr = json.load(open(os.path.join(REPO, "data", "nba_spreads.json")))
except Exception: pass
pts = {str(r[0]): r[4] + r[5] for r in RES}
agg = {}
for gid, g in C["games"].items():
    p = pts.get(gid)
    if p is None: continue
    tot = (spr.get(gid) or [None] * 5)[4]
    for n in g["r"]:
        a = agg.setdefault(n, [0, 0, 0, 0, 0, 0])   # games, fta, fouls, points, overs, graded totals
        a[0] += 1; a[1] += g["fta"]; a[2] += g["pf"]; a[3] += p
        if tot is not None and p != tot: a[5] += 1; a[4] += 1 if p > tot else 0
G = [g for gid, g in C["games"].items() if gid in pts]
lg = [round(sum(g["fta"] for g in G) / len(G), 1), round(sum(g["pf"] for g in G) / len(G), 1),
      round(sum(pts[gid] for gid in C["games"] if gid in pts) / len(G), 1)] if G else None
REF = {n: [a[0], round(a[1] / a[0], 1), round(a[2] / a[0], 1), round(a[3] / a[0], 1), a[4], a[5]] for n, a in agg.items() if a[0] >= 3}
os.makedirs("data", exist_ok=True)
json.dump(C, open(CACHE, "w"), separators=(",", ":"))
asof = dt.datetime.now(dt.timezone.utc).astimezone(dt.timezone(dt.timedelta(hours=-5))).strftime("%a %b %-d, %-I:%M %p ET")
print("/* NBA referees — tools/nbarefs.py: tonight's crews (official.nba.com) + this season's games they worked (ESPN box scores) */")
print("var NBA_REFS=" + json.dumps({"today": today, "ref": REF, "lg": lg, "asof": asof}, separators=(",", ":"), ensure_ascii=False) + ";")
