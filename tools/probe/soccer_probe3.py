#!/usr/bin/env python3
"""Probe 3: market coverage (cards? fouls? shots?), referee match detail, ESPN season paging."""
import json, os, urllib.request
def j(x, n=900): s = json.dumps(x, default=lambda o: getattr(o, "__dict__", str(o)), ensure_ascii=False); return s[:n]
def get(u):
    try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))
    except Exception as e: print("  GET failed", u[-80:], e); return None
B = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard"
for q in ["?dates=2026&limit=1000", "?dates=202611", "?dates=20260801-20260831", "?dates=20261101-20261108", "?dates=2026-11-08"]:
    r = get(B + q)
    if r: ev = r.get("events", []); print(q, len(ev), ev[0]["date"] if ev else "", ev[-1]["date"] if ev else "")
from propline import PropLine
cl = PropLine(os.environ["PROPLINE_API_KEY"].strip())
for sp in ["soccer_epl", "soccer_la_liga", "soccer_serie_a", "soccer_bundesliga", "soccer_ligue_1"]:
    try:
        c = cl.get_market_coverage(sp, days=7)
        print("COV", sp, j(c, 300))
        allk = set()
        def walk(o):
            if isinstance(o, dict):
                for k, v in o.items():
                    if k in ("market", "key", "market_key") and isinstance(v, str): allk.add(v)
                    walk(v)
                    if isinstance(v, (list, dict)) and k not in ("books", "bookmakers"): pass
            elif isinstance(o, list):
                for x in o: walk(x) if not isinstance(x, str) else allk.add(x)
        walk(c); print("  markets:", sorted(x for x in allk if "_" in x or x in ("h2h", "totals", "spreads"))[:120])
    except Exception as e: print("COV", sp, "failed", e)
try:
    r = cl.get_referee_matches("soccer_epl", "Michael Oliver", limit=3); print("REFM", j(r, 1500))
except Exception as e: print("REFM failed", e)
try:
    r = cl.get_referees("soccer_la_liga"); L = r.get("referees", []); print("REF laliga", len(L), "with next_match", sum(1 for x in L if x.get("next_match")), j([x for x in L if x.get("next_match")][:2], 400))
    for sp in ["soccer_epl", "soccer_serie_a", "soccer_bundesliga", "soccer_ligue_1"]:
        L = cl.get_referees(sp).get("referees", []); print("REF", sp, len(L), "next_match set:", sum(1 for x in L if x.get("next_match")))
except Exception as e: print("REF failed", e)
try:
    r = cl.get_player_games("soccer_epl", "Erling Haaland", limit=3); print("PGAMES", j(r, 1200))
except Exception as e: print("PGAMES failed", e)
