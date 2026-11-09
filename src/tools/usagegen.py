# Builds usage.js (snap share, target share, air-yards share, carry share) from nflverse open data (CC-BY 4.0).
# Usage: python3 tools/usagegen.py <dir with stats_player_week_2026.csv + snap_counts_2026.csv> > usage_data.js
import csv,sys,json,re,collections
import os
D=sys.argv[1]
def pick(*names):   # tools/nflfetch.sh saves short names; older runs used the nflverse names
    for n_ in names:
        if os.path.exists(os.path.join(D,n_)):return os.path.join(D,n_)
    return os.path.join(D,names[0])
st=[r for r in csv.DictReader(open(pick("stats_player_week_2026.csv","pstats.csv"))) if r["season_type"]=="REG"]
sn=[r for r in csv.DictReader(open(pick("snap_counts_2026.csv","snaps.csv"))) if r["game_type"]=="REG"]
TM={"LA":"LAR","WSH":"WAS","JAC":"JAX"}
t=lambda x:TM.get(x,x)
num=lambda v:float(v) if v not in ("","NA",None) else 0.0
# team totals per (team,week)
tt=collections.defaultdict(lambda:{"tgt":0,"car":0,"ay":0})
for r in st:
    k=(t(r["team"]),int(r["week"]));tt[k]["tgt"]+=num(r["targets"]);tt[k]["car"]+=num(r["carries"]);tt[k]["ay"]+=num(r["receiving_air_yards"])
snap={}
for r in sn:
    if r["position"] in ("RB","WR","TE","FB","QB"):snap[(r["player"],t(r["team"]),int(r["week"]))]=num(r["offense_pct"])
P=collections.defaultdict(dict)
for r in st:
    if r["position"] not in ("RB","WR","TE","FB","QB"):continue
    n=r["player_display_name"];k=(t(r["team"]),int(r["week"]))
    P[n][k[1]]={"tm":k[0],"pos":r["position"],"tgt":num(r["targets"]),"car":num(r["carries"]),"ay":num(r["receiving_air_yards"]),"T":tt[k]}
# snap-only weeks (on the field, no stat) still count for snap share
out={};maxw=max(int(r["week"]) for r in st)
for n,W in P.items():
    wks=sorted(W);pos=W[wks[-1]]["pos"];tm=W[wks[-1]]["tm"]
    def agg(ws):
        T=sum(W[w]["T"]["tgt"] for w in ws);C=sum(W[w]["T"]["car"] for w in ws);A=sum(W[w]["T"]["ay"] for w in ws)
        tg=sum(W[w]["tgt"] for w in ws);ca=sum(W[w]["car"] for w in ws);ay=sum(W[w]["ay"] for w in ws)
        sp=[snap.get((n,W[w]["tm"],w)) for w in ws];sp=[x for x in sp if x is not None]
        return {"tsh":round(100*tg/T,1) if T else None,"csh":round(100*ca/C,1) if C else None,"ays":round(100*ay/A,1) if A else None,
                "snap":round(100*sum(sp)/len(sp)) if sp else None,"tpg":round(tg/len(ws),1),"cpg":round(ca/len(ws),1)}
    tot=sum(W[w]["tgt"]+W[w]["car"] for w in wks)
    if tot<5:continue
    s=agg(wks);l3=agg(wks[-3:])
    out[n]={"tm":tm,"pos":pos,"g":len(wks),"s":s,"l3":l3,
            "wk":{w:[round(100*snap[(n,W[w]["tm"],w)]) if (n,W[w]["tm"],w) in snap else None,int(W[w]["tgt"]),int(W[w]["car"])] for w in wks}}
print("/* ---------- Usage: snap share, target share, air-yards share, carry share ----------")
print("   Source: nflverse open data (player stats + snap counts, CC-BY 4.0), regular season. Regenerate with tools/usagegen.py. */")
print("const USAGE_ASOF="+json.dumps(f"through Week {maxw}")+";")
print("const USAGE_RAW="+json.dumps(out,separators=(",",":"))+";")
