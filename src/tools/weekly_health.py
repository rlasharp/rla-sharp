#!/usr/bin/env python3
"""Weekly site health report (markdown) from data/health.json's run history + the data files' own timestamps.
usage: python3 src/tools/weekly_health.py <repo root> [alerts.json]   -> prints the issue title on line 1, then the body.
alerts.json (optional): `gh issue list --label site-alert --state all --json number,title,createdAt,closedAt` output."""
import json, os, re, sys, datetime, collections
R = sys.argv[1]; now = datetime.datetime.now(datetime.timezone.utc); since = now - datetime.timedelta(days=7)
h = json.load(open(os.path.join(R, "data/health.json")))
ts = lambda s: datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
runs = [r for r in h.get("hist", []) if ts(r["at"]) >= since]
n = len(runs); ok = sum(r["ok"] for r in runs); pub = sum(r.get("published", False) for r in runs)
chk = sum(r.get("check_failed", False) for r in runs); site_bad = [r for r in runs if not r.get("site_ok", True)]

def key(l):   # group similar failure lines: drop numbers / names after the first ':' or '—'
    l = re.split(r"\s[—:]\s?|: ", l, 1)[0]; return re.sub(r"\d+", "#", l).strip()[:90]
F = collections.Counter(); ex = {}
for r in runs:
    for l in set(r.get("fails", [])): k = key(l); F[k] += 1; ex.setdefault(k, l)
# per sport: runs that included it and had no failure line naming it
SP = {"NBA": "nba", "NFL": "nfl", "NHL": "nhl", "Soccer": "soc"}
sp_rows = []
for lab, w in SP.items():
    inc = [r for r in runs if r["what"] == "all" or w in r["what"].split(",")]
    bad = [r for r in inc if any(re.search(lab, l, re.I) for l in r.get("fails", []))]
    sp_rows.append((lab, len(inc), len(inc) - len(bad)))
# data age right now
def grab(path, pat):
    try: m = re.search(pat, open(os.path.join(R, path), encoding="utf8").read()); return m.group(1) if m else "?"
    except Exception: return "?"
ages = [("NBA", grab("src/nba_data.js", r'NBA_GEN="([^"]*)"')), ("NHL", grab("src/nhl_data.js", r'NHL_GEN="([^"]*)"')),
        ("NFL lines", grab("src/market.js", r'MARKET_ASOF="([^"]*)"')), ("Site build", grab("version.json", r'"at":"([^"]*)"'))]
alerts = []
if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
    try: alerts = [a for a in json.load(open(sys.argv[2])) if ts(a["createdAt"]) >= since]
    except Exception: alerts = []
grade = "✅ Healthy" if n and ok / n >= .95 and not chk and len(site_bad) <= 1 else "⚠️ Needs a look" if n else "❔ No runs recorded"
out = [f"Weekly site health — {grade} — week ending {now.strftime('%b %-d')}", ""]
if not n:
    out += ["No automatic runs were recorded in the last 7 days (the history starts filling once this report exists). "
            "If this repeats next week, the automatic updates are not running — check the Actions tab."]
else:
    out += [f"**{grade}** · {n} automatic updates in the last 7 days · {ok} finished OK ({ok*100//n}%) · {pub} published to the site",
            f"Site check blocked a broken build **{chk}** time(s) (the live site was left unchanged each time)." if chk else "The site check never had to block a build.",
            f"Live-site problems seen: **{len(site_bad)}** run(s)" + (f" — latest: {site_bad[-1]['site_issue']}" if site_bad else "") + ".", "",
            "### Each sport", "| Sport | Runs | Data refreshed OK |", "|---|---|---|"]
    out += [f"| {s} | {i} | {g} ({g*100//i if i else 0}%) |" for s, i, g in sp_rows]
    out += ["", "### Steps that failed (old data was kept each time)"]
    out += [f"- **{c}×** {ex[k]}" for k, c in F.most_common(12)] or ["- None 🎉"]
out += ["", "### Data timestamps right now"] + [f"- {a}: {b}" for a, b in ages]
if alerts:
    out += ["", "### Site alerts this week"] + [f"- #{a['number']} {a['title']} — {'closed' if a.get('closedAt') else 'still open'}" for a in alerts]
out += ["", "_Automatic weekly report (tools/weekly_health.py). Real run logs only. Last week's report is closed when this one opens._"]
print("\n".join(out))
