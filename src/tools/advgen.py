# Builds adv_data.js: box scores, red-zone usage, team pace/pass rate, rest & travel.
# Source: nflverse open data (CC-BY 4.0): stats_player_week_2026.csv, play_by_play_2026.csv.gz, games.csv
# Usage: python3 tools/advgen.py <nflverse dir> <current week> > adv_data.js
import csv,gzip,sys,json,math,collections
import os
D=sys.argv[1]
def pick(*names):   # tools/nflfetch.sh saves short names (pstats.csv / pbp.csv.gz); older runs used the nflverse names
    for n_ in names:
        if os.path.exists(os.path.join(D,n_)):return os.path.join(D,n_)
    return os.path.join(D,names[0])
TM={"LA":"LAR","WSH":"WAS","JAC":"JAX"};t=lambda x:TM.get(x,x)
n=lambda v:float(v) if v not in ("","NA",None) else 0.0
i=lambda v:int(round(n(v)))
st=[r for r in csv.DictReader(open(pick("stats_player_week_2026.csv","pstats.csv"))) if r["season_type"]=="REG"]
games=[r for r in csv.DictReader(open(D+"/games.csv")) if r["season"]=="2026" and r["game_type"]=="REG"]
# current week: given, or "auto" = the first week with a game not played yet
CW=int(sys.argv[2]) if len(sys.argv)>2 and sys.argv[2]!="auto" else min([int(g["week"]) for g in games if g["home_score"]==""] or [18])
gid={r["game_id"]:r for r in games}
# ---- box scores: BOX["wk|AWAY|HOME"]={p:[...],r:[...],c:[...]}
BOX=collections.defaultdict(lambda:{"p":[],"r":[],"c":[]})
for r in st:
    g=gid.get(r["game_id"]);
    if not g:continue
    k=f'{r["week"]}|{t(g["away_team"])}|{t(g["home_team"])}';tm=t(r["team"]);nm=r["player_display_name"]
    if n(r["attempts"])>0:BOX[k]["p"].append([nm,tm,i(r["completions"]),i(r["attempts"]),i(r["passing_yards"]),i(r["passing_tds"]),i(r["passing_interceptions"])])
    if n(r["carries"])>0:BOX[k]["r"].append([nm,tm,i(r["carries"]),i(r["rushing_yards"]),i(r["rushing_tds"])])
    if n(r["targets"])>0 or n(r["receptions"])>0:BOX[k]["c"].append([nm,tm,i(r["receptions"]),i(r["targets"]),i(r["receiving_yards"]),i(r["receiving_tds"])])
for v in BOX.values():
    v["p"].sort(key=lambda x:-x[3]);v["r"].sort(key=lambda x:-x[3]);v["c"].sort(key=lambda x:-x[4])
# ---- play by play
idname={r["player_id"]:r["player_display_name"] for r in st}
rz=collections.defaultdict(lambda:collections.Counter());team_rz=collections.defaultdict(collections.Counter)
pace=collections.defaultdict(lambda:{"plays":0,"games":set(),"np":0,"nr":0,"poe":0.0,"poen":0})
BOXQ=collections.defaultdict(lambda:collections.defaultdict(lambda:{"p":{},"r":{},"c":{}}))
rd=csv.DictReader(gzip.open(pick("play_by_play_2026.csv.gz","pbp.csv.gz"),"rt"))
for p in rd:
    if p.get("season_type","REG")!="REG":continue
    pt=p["play_type"];
    if pt not in ("pass","run"):continue
    if p["two_point_attempt"]=="1" or p["qb_kneel"]=="1" or p["qb_spike"]=="1":continue
    tm=t(p["posteam"]);yl=n(p["yardline_100"]);wk=p["week"]
    # per-quarter box score (quarter 5 = overtime)
    g_=gid.get(p["game_id"])
    if g_ and p.get("qtr"):
        bq=BOXQ[f'{g_["week"]}|{t(g_["away_team"])}|{t(g_["home_team"])}'][p["qtr"]]
        if pt=="pass" and p.get("passer_player_id") and p.get("sack")!="1":
            nm_=idname.get(p["passer_player_id"],p.get("passer_player_name") or "");a_=bq["p"].setdefault((nm_,tm),[0,0,0,0,0])
            a_[1]+=1;a_[0]+=p["complete_pass"]=="1";a_[2]+=i(p.get("passing_yards"));a_[3]+=p.get("pass_touchdown")=="1";a_[4]+=p.get("interception")=="1"
            if p.get("receiver_player_id"):
                rn_=idname.get(p["receiver_player_id"],p.get("receiver_player_name") or "");c_=bq["c"].setdefault((rn_,tm),[0,0,0,0])
                c_[1]+=1;c_[0]+=p["complete_pass"]=="1";c_[2]+=i(p.get("receiving_yards"));c_[3]+=p.get("pass_touchdown")=="1"
        if pt=="run" and p.get("rusher_player_id"):
            rn_=idname.get(p["rusher_player_id"],p.get("rusher_player_name") or "");r_=bq["r"].setdefault((rn_,tm),[0,0,0])
            r_[0]+=1;r_[1]+=i(p.get("rushing_yards"));r_[2]+=p.get("rush_touchdown")=="1"
    pc=pace[tm];pc["plays"]+=1;pc["games"].add(p["game_id"])
    try:
        wp=float(p["wp"]);dn=int(float(p["down"] or 0));hs=float(p["half_seconds_remaining"] or 0)
        if 0.2<=wp<=0.8 and dn in (1,2,3) and hs>120:
            if pt=="pass":pc["np"]+=1
            else:pc["nr"]+=1
    except ValueError:pass
    if p["pass_oe"] not in ("","NA"):pc["poe"]+=float(p["pass_oe"]);pc["poen"]+=1
    if yl>20:continue
    if pt=="pass" and p["receiver_player_id"]:
        nm=idname.get(p["receiver_player_id"],p["receiver_player_name"]);c=rz[(nm,tm)]
        c["t20"]+=1;team_rz[tm]["t20"]+=1
        if yl<=10:c["t10"]+=1;team_rz[tm]["t10"]+=1
        if p["touchdown"]=="1" and p["td_player_id"]==p["receiver_player_id"]:c["td"]+=1
    if pt=="run" and p["rusher_player_id"]:
        nm=idname.get(p["rusher_player_id"],p["rusher_player_name"]);c=rz[(nm,tm)]
        c["c20"]+=1;team_rz[tm]["c20"]+=1
        if yl<=5:c["c5"]+=1;team_rz[tm]["c5"]+=1
        if p["touchdown"]=="1" and p["td_player_id"]==p["rusher_player_id"]:c["td"]+=1
RZ={}
for (nm,tm),c in rz.items():
    T=team_rz[tm];sh=lambda a:round(100*c[a]/T[a]) if T[a] else 0
    if c["t20"]+c["c20"]<2:continue
    RZ[nm]={"tm":tm,"t20":c["t20"],"t10":c["t10"],"c20":c["c20"],"c5":c["c5"],"td":c["td"],"ts":sh("t20"),"cs":sh("c20"),"c5s":sh("c5")}
PACE={}
for tm,pc in pace.items():
    g=len(pc["games"]);np_,nr=pc["np"],pc["nr"]
    PACE[tm]={"ppg":round(pc["plays"]/g,1),"npr":round(100*np_/(np_+nr),1) if np_+nr else None,"proe":round(pc["poe"]/pc["poen"],1) if pc["poen"] else None,"g":g}
def rank(key,desc=True):
    v=[(tm,x[key]) for tm,x in PACE.items() if x[key] is not None];v.sort(key=lambda z:-z[1] if desc else z[1])
    for k,(tm,_) in enumerate(v):PACE[tm][key+"R"]=k+1
rank("ppg");rank("npr");rank("proe")
# ---- rest & travel for current week
LL={"ARI":(33.53,-112.26),"ATL":(33.76,-84.40),"BAL":(39.28,-76.62),"BUF":(42.77,-78.79),"CAR":(35.23,-80.85),"CHI":(41.86,-87.62),
"CIN":(39.10,-84.52),"CLE":(41.51,-81.70),"DAL":(32.75,-97.09),"DEN":(39.74,-105.02),"DET":(42.34,-83.05),"GB":(44.50,-88.06),
"HOU":(29.68,-95.41),"IND":(39.76,-86.16),"JAX":(30.32,-81.64),"KC":(39.05,-94.48),"LV":(36.09,-115.18),"LAC":(33.95,-118.34),
"LAR":(33.95,-118.34),"MIA":(25.96,-80.24),"MIN":(44.97,-93.26),"NE":(42.09,-71.26),"NO":(29.95,-90.08),"NYG":(40.81,-74.07),
"NYJ":(40.81,-74.07),"PHI":(39.90,-75.17),"PIT":(40.45,-80.02),"SF":(37.40,-121.97),"SEA":(47.60,-122.33),"TB":(27.98,-82.50),
"TEN":(36.17,-86.77),"WAS":(38.91,-76.86)}
TZ={"ARI":-7,"DEN":-7,"LV":-8,"LAC":-8,"LAR":-8,"SF":-8,"SEA":-8,"DAL":-6,"HOU":-6,"KC":-6,"MIN":-6,"NO":-6,"CHI":-6,"GB":-6,"TEN":-6}
tz=lambda x:TZ.get(x,-5)
def miles(a,b):
    (la1,lo1),(la2,lo2)=LL[a],LL[b];R=3958.8;p1,p2=math.radians(la1),math.radians(la2);dp=p2-p1;dl=math.radians(lo2-lo1)
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2;return round(2*R*math.asin(math.sqrt(h)))
REST={}
for g in games:
    if int(g["week"])!=CW:continue
    a,h=t(g["away_team"]),t(g["home_team"]);neutral=g["location"]!="Home"
    for side,tm,opp in (("away",a,h),("home",h,a)):
        r=int(n(g[side+"_rest"]))
        trav=0 if (side=="home" and not neutral) else (miles(tm,h) if not neutral else None)
        REST[tm]={"rest":r,"bye":r>=13,"short":r<=5,"mi":trav,"tz":(tz(h)-tz(tm)) if side=="away" else 0,"neutral":neutral,"day":g["weekday"]}
maxw=max(int(r["week"]) for r in st)
print("/* ---------- Advanced data: box scores, red zone, pace, rest/travel ----------")
print("   Source: nflverse open data (player stats, play-by-play, schedules; CC-BY 4.0). Regenerate with tools/advgen.py. */")
print("const ADV_ASOF="+json.dumps(f"through Week {maxw}")+";")
BQ={}
for k,Q in BOXQ.items():
    if int(k.split("|")[0])<maxw-2:continue   # last 3 weeks only, to keep the page small
    BQ[k]={q:{"p":sorted([[a[0],a[1]]+v for a,v in d["p"].items()],key=lambda x:-x[3]),"r":sorted([[a[0],a[1]]+v for a,v in d["r"].items()],key=lambda x:-x[3]),"c":sorted([[a[0],a[1]]+v for a,v in d["c"].items()],key=lambda x:-x[4])} for q,d in Q.items()}
for nm,obj in (("BOX",dict(BOX)),("RZ",RZ),("PACE",PACE),("REST",REST)):
    print(f"const {nm}="+json.dumps(obj,separators=(",",":"),ensure_ascii=False)+";")

# per-quarter box scores go to their own file (loaded only when someone opens a box score)
with open("nfl_boxq.js","w") as f_: f_.write("/* NFL box scores by quarter, last 3 weeks (nflverse play-by-play) — tools/advgen.py, loaded on demand */\nvar BOXQ="+json.dumps(BQ,separators=(",",":"),ensure_ascii=False)+";\n")
