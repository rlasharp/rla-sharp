// Tracker (runs in auto_run.sh after the build): opens the built site headless and uses the SITE'S OWN functions to
//  1) snapshot, before games start: each sport's top-10 best props, our game numbers (winner / total / edges vs the odds),
//     and the NHL Plays of the day (locked once, within 6 h of the first puck drop),
//  2) grade every snapshot once the box scores are in.
// State: src/data/track.json · output for the site: src/track_data.js (var TRACK=...)
// usage: node tools/track.js /abs/path/src/index.html
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const f=process.argv[2],dir=path.dirname(f),SF=path.join(dir,'data','track.json'),OUT=path.join(dir,'track_data.js');
let T={};try{T=JSON.parse(fs.readFileSync(SF,'utf8'))}catch(e){}
for(const s of ['nba','nfl','nhl'])T[s]=T[s]||{};
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 await p.route(/espn|fonts\.g|cdnjs|jsdelivr|api\./,r=>r.abort());
 await p.addInitScript(()=>{window.Chart=class{constructor(){}destroy(){}update(){}};window.Chart.defaults={font:{},borderColor:''}});
 await p.goto('file://'+f+'#today');await p.waitForTimeout(800);
 await p.evaluate(()=>new Promise(r=>{if(typeof nhlEnsure==="undefined")return r();nhlEnsure(r);setTimeout(r,8000)}));
 const R=await p.evaluate((T)=>{
  const imp=o=>o==null?null:o<0?-o/(-o+100):100/(o+100),pay=o=>o==null?.909:o>0?o/100:100/-o,log=[];
  const keep=(o,ks)=>{const x={};for(const k of ks)if(o[k]!==undefined)x[k]=o[k];return x};
  /* ---------- snapshots ---------- */
  // NBA
  if(typeof NBA_SLATE!=="undefined"&&NBA_SLATE.length){const d=NBA_SLATE_DATE,S=T.nba[d]||(T.nba[d]={});
    if(!NBA_SLATE.some(nbaStarted)){
      S.best=(typeof nbaBest!=="undefined"?nbaBest():[]).slice(0,10).map(b=>({nm:b.nm,k:b.k,side:b.side,line:b.line,odds:b.odds,book:b.book||"",tm:b.p?b.p.tm:"",sc:Math.round((b.sc||0)*100)/100}));
      S.games=NBA_SLATE.map(g=>{const M=nbaModel(g.a,g.h),L=NBA_LINES[g.a+"@"+g.h];if(!M)return null;const E=typeof nbaOddsEdges!=="undefined"?nbaOddsEdges(g):[];
        return {a:g.a,h:g.h,p:Math.round(M.p*1000)/1000,m:M.m,tot:M.tot,L:L?{sp:L.sp,tot:L.tot}:null,edges:E.filter(e=>e.edge>=.04).map(e=>({mk:e.mk,pick:e.pick,odds:e.odds,me:Math.round(e.me*1000)/1000,bk:Math.round(e.bk*1000)/1000}))}}).filter(Boolean);
      log.push(`nba ${d}: snapshot ${S.best.length} props, ${S.games.length} games`)}}
  // NHL
  if(typeof NHL_SLATE!=="undefined"&&NHL_DATE&&NHL_SLATE.length){const d=NHL_DATE,S=T.nhl[d]||(T.nhl[d]={});const open=NHL_SLATE.filter(g=>!nhStarted(g));
    if(open.length===NHL_SLATE.length){S.best=nhBest().slice(0,10).map(b=>({nm:b.nm,k:b.k,side:b.side,line:b.line,odds:b.odds,tm:nhWho(b.nm).tm,sc:Math.round(b.s.p*100)/100}))}
    // Plays of the day: lock once, within 6 h of the first puck drop (never with zero plays)
    const first=Math.min(...NHL_SLATE.map(g=>Date.parse(g.iso)));
    if(!S.locked&&open.length===NHL_SLATE.length&&first-Date.now()<=6*3600e3){
      const used=new Set(),P=[];
      for(const b of nhBest()){if(P.length>=3)break;if(used.has(b.nm)||b.s.n10<8||b.s.l10<7||b.edge<.05||b.odds==null||b.odds<-200||nhOutNow(b.nm))continue;used.add(b.nm);
        P.push({type:"prop",nm:b.nm,tm:nhWho(b.nm).tm,k:b.k,side:b.side,line:b.line,odds:b.odds,why:`hit ${b.s.l10}/${b.s.n10} last 10 · ${b.s.hs}/${b.s.ns} this season · ${Math.round(b.s.p*100)}% vs ${Math.round(imp(b.odds)*100)}% the odds need`})}
      const ge=[];for(const g of NHL_SLATE){const E=nhEdges(g).filter(e=>e.edge>=.05&&e.odds>=-200&&e.odds<=250&&e.mk!=="1st period total");if(E[0])ge.push(E[0])}
      for(const e of ge.sort((a,b)=>b.edge-a.edge).slice(0,2))P.push({type:"game",mk:e.mk,pick:e.pick,a:e.g.a,h:e.g.h,odds:e.odds,line:e.mk==="Total"?e.g.tot[0]:e.mk==="Puck line"?e.g.pl[0]:null,why:`our estimate ${Math.round(e.me*100)}% vs ${Math.round(e.bk*100)}% from the odds`});
      if(P.length){S.plays=P;S.locked=1;log.push(`nhl ${d}: locked ${P.length} plays`)}}}
  // NFL (by game date, this week's games that haven't started)
  if(typeof SLATE!=="undefined"){const by={};for(const g of SLATE){if(g.final||nflStarted(g))continue;const d=nflDate(g);if(d)(by[d]=by[d]||[]).push(g)}
    for(const [d,G] of Object.entries(by)){const S=T.nfl[d]||(T.nfl[d]={});S.wk=typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:null;
      const ids=new Set(G.map(g=>g.id));S.best=nflBest().filter(b=>ids.has(b.g.id)).slice(0,10).map(b=>({nm:b.name,k:b.k,side:b.side,line:b.line,odds:b.odds,tm:b.pl.team,sc:Math.round(b.sc*100)/100}));
      S.games=G.map(g=>{const P=projectGame(g),L=LINES[g.id],m=P.shp-P.sap,E=typeof nflOddsEdges!=="undefined"?nflOddsEdges(g):[];
        return {id:g.id,a:g.away,h:g.home,p:Math.round(normCdf(m/13.5)*1000)/1000,m:Math.round(m*10)/10,tot:Math.round((P.shp+P.sap)*10)/10,L:L?{sp:L.sp,tot:L.tot}:null,edges:E.filter(e=>e.edge>=.04).map(e=>({mk:e.mk,pick:e.pick,odds:e.odds,me:Math.round(e.me*1000)/1000,bk:Math.round(e.bk*1000)/1000}))}})}}
  /* ---------- grading ---------- */
  const side=(v,line,s)=>v===line?"push":((s==="o")===(v>line))?"win":"loss";
  const gradeProp=(sp,d,x)=>{
    if(sp==="nba"){const P=NBA_LOGS[x.nm],r=P&&P.g.find(y=>y[1]===d);if(!r){const fin=NBA_RES.some(z=>z[1]===d&&(z[2]===x.tm||z[3]===x.tm));return fin?{r:"void"}:null}const v=nbaVal(r,x.k);return {r:side(v,x.line,x.side),v}}
    if(sp==="nhl"){const w=nhWho(x.nm),m=NH_MK[x.k];if(!w||!m||!m[3])return null;const r=w.g.find(y=>y[0]===d&&(NHL_G[x.nm]?y[7]:true));
      if(!r){const fin=(NHL_RES||[]).some(z=>z[0]===d&&(z[1]===x.tm||z[3]===x.tm));return fin?{r:"void"}:null}const v=m[3](r);if(v==null)return null;return {r:side(v,x.line,x.side),v}}
    if(sp==="nfl"){const L=pLogs(x.nm).find(l=>l.season===CUR&&l.week===T.nfl[d].wk);if(!L){const fin=RESULTS.some(z=>z[0]===T.nfl[d].wk&&(z[1]===x.tm||z[3]===x.tm));return fin?{r:"void"}:null}const v=stat(L,x.k);if(!Number.isFinite(v))return null;return {r:side(v,x.line,x.side),v}}};
  const final=(sp,d,a,h)=>{if(sp==="nba"){const z=NBA_RES.find(z=>z[1]===d&&z[2]===a&&z[3]===h);return z?[z[4],z[5]]:null}
    if(sp==="nhl"){const z=(NHL_RES||[]).find(z=>z[0]===d&&z[1]===a&&z[3]===h);return z?[z[2],z[4]]:null}
    if(sp==="nfl"){const z=RESULTS.find(z=>z[0]===T.nfl[d].wk&&z[1]===a&&z[3]===h);return z?[z[2],z[4]]:null}};
  const gradeEdge=(e,a,h,F)=>{const [as,hs]=F,mk=e.mk,pk=String(e.pick);
    if(mk==="Moneyline")return (pk===h)===(hs>as)?"win":"loss";
    if(mk==="Total"){const L=+pk.split(" ")[1],t=as+hs;return t===L?"push":((pk.startsWith("Over"))===(t>L))?"win":"loss"}
    if(mk==="Spread"||mk==="Puck line"){const [tm,ln]=pk.split(" "),v=+ln,mg=tm===h?hs-as:as-hs;return mg+v===0?"push":mg+v>0?"win":"loss"}return null};
  for(const sp of ['nba','nfl','nhl'])for(const [d,S] of Object.entries(T[sp])){
    for(const x of S.best||[])if(!x.r){const g=gradeProp(sp,d,x);if(g){x.r=g.r;if(g.v!=null)x.v=g.v}}
    for(const x of S.plays||[])if(!x.r){if(x.type==="prop"){const g=gradeProp(sp,d,x);if(g){x.r=g.r;if(g.v!=null)x.v=g.v}}else{const F=final(sp,d,x.a,x.h);if(F){x.r=gradeEdge({mk:x.mk,pick:x.pick},x.a,x.h,F);x.f=F}}}
    for(const G of S.games||[])if(!G.f){const F=final(sp,d,G.a,G.h);if(F){G.f=F;G.win=(G.p>=.5)===(F[1]>F[0]);if(G.L&&G.L.tot!=null&&F[0]+F[1]!==G.L.tot)G.tw=(G.tot>G.L.tot)===(F[0]+F[1]>G.L.tot);for(const e of G.edges||[])e.r=gradeEdge(e,G.a,G.h,F)}}}
  /* ---------- summaries ---------- */
  const SUM={};for(const sp of ['nba','nfl','nhl']){const s={best:{w:0,l:0,u:0,n:0},win:[0,0],tot:[0,0],edge:{},plays:{w:0,l:0,p:0,u:0},recent:[]};
    for(const [d,S] of Object.entries(T[sp])){for(const x of S.best||[]){if(x.r==="win"){s.best.w++;s.best.u+=pay(x.odds)}else if(x.r==="loss"){s.best.l++;s.best.u-=1}if(x.r)s.best.n++}
      for(const G of S.games||[])if(G.f){s.win[G.win?0:1]++;if(G.tw!=null)s.tot[G.tw?0:1]++;for(const e of G.edges||[])if(e.r==="win"||e.r==="loss"){const E=s.edge[e.mk]||(s.edge[e.mk]=[0,0,0]);if(e.r==="win"){E[0]++;E[2]+=pay(e.odds)}else{E[1]++;E[2]-=1}}}
      for(const x of S.plays||[]){if(x.r==="win"){s.plays.w++;s.plays.u+=pay(x.odds)}else if(x.r==="loss"){s.plays.l++;s.plays.u-=1}else if(x.r)s.plays.p++;s.recent.push({d,...x})}}
    s.best.u=Math.round(s.best.u*100)/100;s.plays.u=Math.round(s.plays.u*100)/100;for(const E of Object.values(s.edge))E[2]=Math.round(E[2]*100)/100;
    s.recent=s.recent.sort((a,b)=>a.d<b.d?1:-1).slice(0,40);SUM[sp]=s}
  const today=(typeof NHL_DATE!=="undefined"&&NHL_DATE&&T.nhl[NHL_DATE])||null;
  return {T,SUM,todayPlays:today&&today.plays||[],log};
 },T);
 /* keep ~60 days */
 const cut=new Date(Date.now()-60*864e5).toISOString().slice(0,10);for(const s of ['nba','nfl','nhl'])for(const d of Object.keys(R.T[s]))if(d<cut)delete R.T[s][d];
 fs.mkdirSync(path.dirname(SF),{recursive:true});fs.writeFileSync(SF,JSON.stringify(R.T));
 fs.writeFileSync(OUT,`/* tracker summaries — tools/track.js */\nvar TRACK=${JSON.stringify({sum:R.SUM,nhlPlays:R.todayPlays,at:new Date().toISOString()})};\n`);
 console.log("track: "+(R.log.join("; ")||"no new snapshots")+` · graded: NHL plays ${R.SUM.nhl.plays.w}-${R.SUM.nhl.plays.l}, best props NBA ${R.SUM.nba.best.w}-${R.SUM.nba.best.l} NFL ${R.SUM.nfl.best.w}-${R.SUM.nfl.best.l} NHL ${R.SUM.nhl.best.w}-${R.SUM.nhl.best.l}`);
 await b.close()})().catch(e=>{console.error("track failed:",e.message);process.exit(1)});
