#!/usr/bin/env python3
"""Futures odds (championship, MVP and other awards, division / conference winners, win totals...) from ESPN's public
futures feed (prices from DraftKings, as ESPN lists them) for the NBA, NFL and NHL.
Keeps one price per day per selection in data/futures_hist.json so the site can show how each one moved over the season.
Output (stdout): futures_data.js ->  var FUT={at, lg:{nba:[{id, n: market, rows:[[name, team abbr, price now, [[date, price], ...]]]}]}}
Real data only. usage: python3 tools/futures.py <repo root> > futures_data.js"""
import json, os, sys, time, datetime as dt, urllib.request
from concurrent.futures import ThreadPoolExecutor
R = sys.argv[1] if len(sys.argv) > 1 else "."
NOW = dt.datetime.now(dt.timezone.utc); TODAY = NOW.astimezone(dt.timezone(dt.timedelta(hours=-5))).strftime("%Y-%m-%d")
def log(*a): print(*a, file=sys.stderr)
def get(u, tries=3):
    u = u.replace("http://", "https://")
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(1 + i)
        except Exception: time.sleep(1 + i)
    return None
# season year in ESPN's core API: NBA / NHL use the year the season ends; NFL the year it starts
Y = NOW.year
LG = {"nba": ("basketball", "nba", Y + 1 if NOW.month >= 9 else Y), "nhl": ("hockey", "nhl", Y + 1 if NOW.month >= 9 else Y), "nfl": ("football", "nfl", Y if NOW.month >= 3 else Y - 1)}
HF = os.path.join(R, "data/futures_hist.json"); CF = os.path.join(R, "data/futures_names.json")
try: H = json.load(open(HF))
except Exception: H = {}
try: NM = json.load(open(CF))
except Exception: NM = {}
OUT = {}
for lg, (sp, code, yr) in LG.items():
    base = f"https://sports.core.api.espn.com/v2/sports/{sp}/leagues/{code}/seasons/{yr}/futures?limit=50"
    L = get(base) or {}
    items = L.get("items") or []
    if not items: log(f"{lg}: no futures ({yr})"); continue
    # team id -> abbreviation (one call)
    tm = {}
    T = get(f"https://site.api.espn.com/apis/site/v2/sports/{sp}/{code}/teams") or {}
    for t in (((T.get("sports") or [{}])[0].get("leagues") or [{}])[0].get("teams") or []):
        t = t.get("team") or {}; tm[str(t.get("id"))] = [t.get("abbreviation") or "", t.get("displayName") or ""]
    refs = set()
    for it in items:
        for fu in it.get("futures") or []:
            for b in fu.get("books") or []:
                a = (b.get("athlete") or {}).get("$ref")
                if a: refs.add(a.split("?")[0])
    need = [r for r in refs if r not in NM]
    def ath(r):
        a = get(r) or {}
        if a: NM[r] = [a.get("displayName") or a.get("fullName") or "", str(((a.get("team") or {}).get("$ref") or "").split("/teams/")[-1].split("?")[0])]
    with ThreadPoolExecutor(10) as ex: list(ex.map(ath, need))
    mk = []
    for it in items:
        name = it.get("name") or ""; fid = str(it.get("id"))
        F = (it.get("futures") or [])
        if not F: continue
        fu = sorted(F, key=lambda x: (x.get("provider") or {}).get("priority", 9))[0]   # ESPN's first listed book
        rows = []
        for b in fu.get("books") or []:
            try: price = int(str(b.get("value") or "").replace("+", ""))
            except Exception: continue
            if b.get("team"):
                tid = b["team"]["$ref"].split("/teams/")[-1].split("?")[0]; ab, full = tm.get(tid, ["", ""]); nm = full or ab
            elif b.get("athlete"):
                r = b["athlete"]["$ref"].split("?")[0]; nm, tid = (NM.get(r) or ["", ""]); ab = tm.get(tid, [""])[0]
            else: continue
            if not nm: continue
            key = f"{lg}|{fid}|{nm}"; h = H.setdefault(key, [])
            if h and h[-1][0] == TODAY: h[-1][1] = price
            else: h.append([TODAY, price])
            H[key] = h[-200:]
            rows.append([nm, ab, price, H[key]])
        if rows: mk.append({"id": fid, "n": name, "book": (fu.get("provider") or {}).get("name") or "", "rows": sorted(rows, key=lambda r: r[2])})
    OUT[lg] = mk
    log(f"{lg}: {len(mk)} futures markets, {sum(len(m['rows']) for m in mk)} prices")
os.makedirs(os.path.dirname(HF), exist_ok=True)
json.dump(H, open(HF, "w"), separators=(",", ":")); json.dump(NM, open(CF, "w"), separators=(",", ":"))
print("/* 🏆 Futures — tools/futures.py (ESPN futures feed; prices as listed by ESPN's sportsbook partner; one price per day kept for movement) */")
print("var FUT=" + json.dumps({"at": NOW.isoformat(timespec="seconds"), "lg": OUT}, separators=(",", ":"), ensure_ascii=False) + ";")
print("var FUT_OK=1;")
