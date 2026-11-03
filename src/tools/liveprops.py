#!/usr/bin/env python3
"""Merge the PropLine live feed (GitHub repo data/live_odds.json) into data/nba_props.txt.
Usage: python3 tools/liveprops.py <path/to/live_odds.json> [YYYY-MM-DD]
Keeps existing lines the feed doesn't have, maps accented / Jr. / III names to NBA_LOGS names, one line per player+market."""
import json, re, sys, unicodedata, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
live = json.load(open(sys.argv[1])); day = sys.argv[2] if len(sys.argv) > 2 else None
nba = live.get("nba") or {}
if day and not str(nba.get("at", "")).startswith(day) and not str(live.get("updated", "")).startswith(day):
    print("live feed is not from", day, "- nothing merged"); sys.exit(0)
src = open(os.path.join(root, "nba_data.js"), encoding="utf-8").read()
m = re.search(r"^const NBA_LOGS=(.*);$", src, re.M); logs = json.loads(m.group(1)) if m else {}
def norm(s):
    s = unicodedata.normalize("NFD", s); s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"[^a-z ]", "", s.replace("-", " ")); s = re.sub(r"\b(jr|sr|ii|iii|iv)\b", "", s); return " ".join(s.split())
AL = {"joshua": "josh", "cam": "cameron", "ron": "ronald", "airious": "ace", "t": "terrence"}
idx = {norm(n): n for n in logs}
def find(p):
    p = re.sub(r"\s*\([A-Z]{2,4}\)$", "", p); n = norm(p)
    if p in logs: return p
    if n in idx: return idx[n]
    parts = n.split()
    if parts and parts[0] in AL and " ".join([AL[parts[0]]] + parts[1:]) in idx: return idx[" ".join([AL[parts[0]]] + parts[1:])]
    if len(parts) >= 2:
        c = [x for k, x in idx.items() if k.split()[-1] == parts[-1] and k[0] == parts[0][0]]
        if len(c) == 1: return c[0]
    return None
f = os.path.join(root, "data", "nba_props.txt"); lines = open(f, encoding="utf-8").read().split("\n")
hdr = [l for l in lines if l.startswith("#")]; rows = {}
for l in lines:
    if not l or l.startswith("#"): continue
    x = l.split("|"); rows[(x[0], x[1])] = l
v = lambda a: "" if a is None else str(a); added = 0; miss = set()
evday = {str(e.get("id")): e.get("date") for e in nba.get("events", [])}
stale = 0
for r in nba.get("props", []):
    if day and len(r) > 13 and evday.get(str(r[13])) and evday[str(r[13])] != day: stale += 1; continue   # yesterday's game still in the feed
    nm = find(r[0])
    if not nm: miss.add(r[0]); continue
    best = r[6:10]
    rows[(nm, r[1])] = "|".join(v(a) for a in [nm] + list(r[1:6])) + ("|" + "|".join(v(a) for a in best) if any(a is not None for a in best) else ""); added += 1
note = f"# Only real posted sportsbook lines (main lines, same book for over and under). Source: PropLine live feed as of {nba.get('at', '?')} + covers.com/FanDuel pulls."
hdr = [h for h in hdr if not h.startswith("# Only real")] + [note]
open(f, "w", encoding="utf-8").write("\n".join(hdr + sorted(rows.values())) + "\n")
print(f"liveprops: {added} feed lines merged ({stale} skipped from other days), {len(rows)} total, unmatched names: {sorted(miss)}")
