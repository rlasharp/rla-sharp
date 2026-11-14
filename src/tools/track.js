// Tracker (runs in auto_run.sh after the build): opens the built site headless and uses the SITE'S OWN functions to
//  1) snapshot, before games start: each sport's top-10 best props, our game numbers (winner / total / edges vs the odds),
//     and the NHL Plays of the day (locked once, within 6 h of the first puck drop),
//  2) grade every snapshot once the box scores are in.
// State: src/data/track.json · output for the site: src/track_data.js (var TRACK=...)
// usage: node tools/track.js /abs/path/src/index.html
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const f=process.argv[2],dir=path.dirname(f),SF=path.join(dir,'data','track.json'),OUT=path.join(dir,'track_data.js');
let T={};try{T=JSON.parse(fs.readFileSync(SF,'utf8'))}catch(e){}
for(const s of ['nba','nfl','nhl','soc'])T[s]=T[s]||{};
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 await p.route(/espn|fonts\.g|cdnjs|jsdelivr|api\./,r=>r.abort());
 await p.addInitScript(()=>{window.Chart=class{constructor(){}destroy(){}update(){}};window.Chart.defaults={font:{},borderColor:''}});
 await p.goto('file://'+f+'#today');await p.waitForTimeout(800);
 await p.evaluate(()=>new Promise(r=>{if(typeof nhlEnsure==="undefined")return r();nhlEnsure(r);setTimeout(r,8000)}));
 await p.evaluate(()=>new Promise(r=>{if(typeof socEnsure==="undefined")return r();socEnsure(()=>socPEnsure(r));setTimeout(r,8000)}));
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
    if(open.length===NHL_SLATE.length){S.best=nhBest().filter(b=>b.g&&b.g.d===d).slice(0,10).map(b=>({nm:b.nm,k:b.k,side:b.side,line:b.line,odds:b.odds,tm:nhWho(b.nm).tm,sc:Math.round(b.s.p*100)/100}))}   /* only that day's games (the props list also has tomorrow's) */
    // Plays of the day: lock once, within 6 h of the first puck drop (never with zero plays)
    const first=Math.min(...NHL_SLATE.map(g=>Date.parse(g.iso)));
    if(!S.locked&&open.length===NHL_SLATE.length&&first-Date.now()<=6*3600e3){
      const used=new Set(),P=[];
      for(const b of nhBest()){if(P.length>=3)break;if(!b.g||b.g.d!==d)continue;if(used.has(b.nm)||b.s.n10<8||b.s.l10<7||b.edge<.05||b.odds==null||b.odds<-200||nhOutNow(b.nm))continue;used.add(b.nm);
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
  // Soccer: plays of the day per ET date, locked once within 6 h of that day's first kickoff (matches with odds only)
  if(window.SOC_OK&&typeof socPickPlays!=="undefined"){const et=iso=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto"}).format(new Date(iso));const by={};
    for(const f of SOC_FX||[])if(f.odds)(by[et(f.t)]=by[et(f.t)]||[]).push(f);
    for(const [d,F] of Object.entries(by)){const S=T.soc[d]||(T.soc[d]={});if(S.locked)continue;const first=Math.min(...F.map(f=>Date.parse(f.t)));
      if(first-Date.now()>6*3600e3||F.some(socStarted))continue;
      const save=window.socDay;window.socDay=et;let P=[];try{P=socPickPlays(d)}finally{window.socDay=save}
      if(P.length){S.plays=P;S.locked=1;log.push(`soc ${d}: locked ${P.length} plays`)}}
    for(const S of Object.values(T.soc))for(const x of S.plays||[])if(!x.r||x.r==="pending"){const g=socGrade(x);if(g&&g.r&&g.r!=="pending"){x.r=g.r;x.v=g.why}}}
  /* ---------- 🎟 parlay of the day (parlay.js): saved while none of that day's games has started, frozen after ---------- */
  if(typeof prlLegs!=="undefined"){const legOf=l=>Object.assign({nm:l.player,k:l.k,side:l.side,line:l.line,odds:l.odds,tm:l.team,label:l.label,p:Math.round(l.p*1000)/1000},l.sp==="soc"?{spec:l.spec}:{});
    const snap=(sp,d,L)=>{const S=T[sp][d]||(T[sp][d]={});if(S.parlayLocked)return;const P=prlPick(L,PRL.lo,PRL.hi,false);
      S.parlay=P?{dec:Math.round(P.dec*100)/100,p:Math.round(P.p*1000)/1000,legs:P.legs.map(legOf)}:null};
    const lock=(sp,d)=>{const S=T[sp][d];if(S&&S.parlay&&!S.parlayLocked){S.parlayLocked=1;log.push(`${sp} ${d}: parlay locked (${S.parlay.legs.length} legs @ ${S.parlay.dec})`)}};
    if(typeof NBA_SLATE!=="undefined"&&NBA_SLATE.length){const d=NBA_SLATE_DATE;if(!NBA_SLATE.some(nbaStarted))snap("nba",d,prlLegs("nba"));else lock("nba",d)}
    if(typeof NHL_SLATE!=="undefined"&&NHL_DATE&&NHL_SLATE.length){const d=NHL_DATE;if(!NHL_SLATE.some(nhStarted))snap("nhl",d,prlLegs("nhl"));else lock("nhl",d)}
    if(typeof SLATE!=="undefined"){const by={};for(const g of SLATE){const d=nflDate(g);if(d)(by[d]=by[d]||[]).push(g)}
      for(const [d,G] of Object.entries(by)){if(G.some(g=>g.final||nflStarted(g))){lock("nfl",d);continue}const ids=new Set(G.map(g=>String(g.id)));if(!T.nfl[d])continue;snap("nfl",d,prlLegs("nfl").filter(l=>ids.has(l.g)))}}
    if(window.SOC_OK){const et=iso=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto"}).format(new Date(iso)),by={};for(const f of SOC_FX||[])if(f.odds)(by[et(f.t)]=by[et(f.t)]||[]).push(f);
      for(const [d,F] of Object.entries(by)){if(F.some(socStarted)){lock("soc",d);continue}if(Math.min(...F.map(f=>Date.parse(f.t)))-Date.now()>36*3600e3)continue;const ids=new Set(F.map(f=>String(f.id)));snap("soc",d,prlLegs("soc").filter(l=>ids.has(l.g)))}}}
  /* ---------- grading ---------- */
  const side=(v,line,s)=>v===line?"push":((s==="o")===(v>line))?"win":"loss";
  const gradeProp=(sp,d,x)=>{
    if(sp==="nba"){const P=NBA_LOGS[x.nm],r=P&&P.g.find(y=>y[1]===d);if(!r){const fin=NBA_RES.some(z=>z[1]===d&&(z[2]===x.tm||z[3]===x.tm));return fin?{r:"void"}:null}const v=nbaVal(r,x.k);return {r:side(v,x.line,x.side),v}}
    if(sp==="nhl"){const w=nhWho(x.nm),m=NH_MK[x.k];if(!w||!m||!m[3])return null;const r=w.g.find(y=>y[0]===d&&(NHL_G[x.nm]?y[7]:true));
      let gd=d;if(!(NHL_RES||[]).some(z=>z[0]===d&&(z[1]===x.tm||z[3]===x.tm))){const nx=(NHL_RES||[]).filter(z=>z[0]>d&&(z[1]===x.tm||z[3]===x.tm)&&(Date.parse(z[0])-Date.parse(d))/864e5<=2).map(z=>z[0]).sort()[0];if(nx)gd=nx}
      const r2=r||(gd!==d?w.g.find(y=>y[0]===gd&&(NHL_G[x.nm]?y[7]:true)):null);
      if(!r2){const fin=(NHL_RES||[]).some(z=>z[0]===gd&&(z[1]===x.tm||z[3]===x.tm));return fin?{r:"void"}:null}
      if(r2!==r){const v=m[3](r2);if(v==null)return null;return {r:side(v,x.line,x.side),v}}const v=m[3](r);if(v==null)return null;return {r:side(v,x.line,x.side),v}}
    if(sp==="nfl"){const L=pLogs(x.nm).find(l=>l.season===CUR&&l.week===T.nfl[d].wk);if(!L){const fin=RESULTS.some(z=>z[0]===T.nfl[d].wk&&(z[1]===x.tm||z[3]===x.tm));return fin?{r:"void"}:null}const v=stat(L,x.k);if(!Number.isFinite(v))return null;return {r:side(v,x.line,x.side),v}}};
  const final=(sp,d,a,h)=>{if(sp==="nba"){const z=NBA_RES.find(z=>z[1]===d&&z[2]===a&&z[3]===h);return z?[z[4],z[5]]:null}
    if(sp==="nhl"){const z=(NHL_RES||[]).find(z=>z[0]===d&&z[1]===a&&z[3]===h);return z?[z[2],z[4]]:null}
    if(sp==="nfl"){const z=RESULTS.find(z=>z[0]===T.nfl[d].wk&&z[1]===a&&z[3]===h);return z?[z[2],z[4]]:null}};
  const gradeEdge=(e,a,h,F)=>{const [as,hs]=F,mk=e.mk,pk=String(e.pick);
    if(mk==="Moneyline")return (pk===h)===(hs>as)?"win":"loss";
    if(mk==="Total"){const L=+pk.split(" ")[1],t=as+hs;return t===L?"push":((pk.startsWith("Over"))===(t>L))?"win":"loss"}
    if(mk==="Spread"||mk==="Puck line"){const [tm,ln]=pk.split(" "),v=+String(ln).replace(/[−–]/g,"-"),mg=tm===h?hs-as:as-hs;return mg+v===0?"push":mg+v>0?"win":"loss"}return null};
  for(const sp of ['nba','nfl','nhl'])for(const [d,S] of Object.entries(T[sp])){
    /* "void" is re-checked: a pick voided because the player's stats weren't in our data yet (not because he sat out) gets its real grade */
    for(const x of S.best||[])if(!x.r||x.r==="void"){const g=gradeProp(sp,d,x);if(g&&!(x.r==="void"&&g.r==="void")){x.r=g.r;if(g.v!=null)x.v=g.v}}
    for(const x of S.plays||[])if(!x.r||(x.r==="void"&&x.type==="prop")){if(x.type==="prop"){const g=gradeProp(sp,d,x);if(g&&!(x.r==="void"&&g.r==="void")){x.r=g.r;if(g.v!=null)x.v=g.v}}else{const F=final(sp,d,x.a,x.h);if(F){x.r=gradeEdge({mk:x.mk,pick:x.pick},x.a,x.h,F);x.f=F}}}
    for(const G of S.games||[])if(!G.f){const F=final(sp,d,G.a,G.h);if(F){G.f=F;G.win=(G.p>=.5)===(F[1]>F[0]);if(G.L&&G.L.tot!=null&&F[0]+F[1]!==G.L.tot)G.tw=(G.tot>G.L.tot)===(F[0]+F[1]>G.L.tot);for(const e of G.edges||[])e.r=gradeEdge(e,G.a,G.h,F)}}}
  /* re-grade finished game picks every run (deterministic from the final score) — fixes any earlier mis-grade,
     e.g. Nov 2026: picks written with a typographic minus ("NYR −1.5") were read as NaN and marked lost */
  for(const sp of ['nba','nfl','nhl'])for(const S of Object.values(T[sp])){
    for(const x of S.plays||[])if(x.type!=="prop"&&x.f&&x.mk){const r=gradeEdge({mk:x.mk,pick:x.pick},x.a,x.h,x.f);if(r)x.r=r}
    for(const G of S.games||[])if(G.f)for(const e of G.edges||[]){const r=gradeEdge(e,G.a,G.h,G.f);if(r)e.r=r}}
  /* parlays: every leg graded like a pick; any loss = loss; void/push legs drop out (payout from the legs that won) */
  const gradeParlay=(sp,d,P)=>{if(!P||P.r)return;for(const x of P.legs){if(x.r&&x.r!=="void")continue;
      if(sp==="soc"){const g=x.spec&&typeof socGrade!=="undefined"?socGrade(x.spec):null;if(g&&g.r&&g.r!=="pending")x.r=g.r}else{const g=gradeProp(sp,d,x);if(g&&!(x.r==="void"&&g.r==="void")){x.r=g.r;if(g.v!=null)x.v=g.v}}}
    if(P.legs.some(x=>x.r==="loss"))P.r="loss";else if(P.legs.every(x=>x.r)){const W=P.legs.filter(x=>x.r==="win");P.r=W.length?"win":"void";P.paid=Math.round(W.reduce((a,x)=>a*(x.odds>0?1+x.odds/100:1+100/(-x.odds)),1)*100)/100}};
  for(const sp of ['nba','nfl','nhl','soc'])for(const [d,S] of Object.entries(T[sp]))if(S.parlay&&S.parlayLocked)gradeParlay(sp,d,S.parlay);
  /* ---------- summaries ---------- */
  function confTier(sc,edge){return sc>=.62&&edge>=.07?'strong':sc>=.56&&edge>=.04?'medium':'small'}
  const SUM={};for(const sp of ['nba','nfl','nhl']){const s={best:{w:0,l:0,u:0,n:0},win:[0,0],tot:[0,0],edge:{},plays:{w:0,l:0,p:0,u:0},recent:[]};
    s.tier={strong:[0,0],medium:[0,0],small:[0,0]};
    for(const [d,S] of Object.entries(T[sp])){for(const x of S.best||[]){if(x.r==="win"){s.best.w++;s.best.u+=pay(x.odds)}else if(x.r==="loss"){s.best.l++;s.best.u-=1}if(x.r)s.best.n++;
        if((x.r==="win"||x.r==="loss")&&x.sc!=null){const t=confTier(x.sc,x.sc-imp(x.odds));s.tier[t][x.r==="win"?0:1]++}}
      for(const G of S.games||[])if(G.f){s.win[G.win?0:1]++;if(G.tw!=null)s.tot[G.tw?0:1]++;for(const e of G.edges||[])if(e.r==="win"||e.r==="loss"){const E=s.edge[e.mk]||(s.edge[e.mk]=[0,0,0]);if(e.r==="win"){E[0]++;E[2]+=pay(e.odds)}else{E[1]++;E[2]-=1}}}
      for(const x of S.plays||[]){if(x.r==="win"){s.plays.w++;s.plays.u+=pay(x.odds)}else if(x.r==="loss"){s.plays.l++;s.plays.u-=1}else if(x.r)s.plays.p++;s.recent.push({d,...x})}
      const P=S.parlay;if(P&&S.parlayLocked&&P.r){const q=s.parlay||(s.parlay={w:0,l:0,p:0,u:0});if(P.r==="win"){q.w++;q.u+=P.paid-1}else if(P.r==="loss"){q.l++;q.u-=1}else q.p++;q.u=Math.round(q.u*100)/100}}
    /* calibration — did our stated chances come true? props bucketed by our chance, game edges by edge size */
    const cal={props:{},edges:{}},pb=x=>x>=.8?"80%+":x>=.7?"70–79%":x>=.6?"60–69%":"50–59%",eb=e=>e>=.1?"10%+":e>=.07?"7–9%":"4–6%";
    for(const [d,S] of Object.entries(T[sp])){for(const x of S.best||[]){if(x.r!=="win"&&x.r!=="loss"||x.sc==null)continue;const B=cal.props[pb(x.sc)]||(cal.props[pb(x.sc)]=[0,0,0,0]);B[0]++;B[1]+=x.r==="win";B[2]+=x.sc;B[3]+=x.r==="win"?pay(x.odds):-1}
      for(const G of S.games||[])for(const e of G.edges||[]){if(e.r!=="win"&&e.r!=="loss"||e.me==null||e.bk==null)continue;const k=eb(e.me-e.bk),B=cal.edges[k]||(cal.edges[k]=[0,0,0,0]);B[0]++;B[1]+=e.r==="win";B[2]+=e.me;B[3]+=e.r==="win"?pay(e.odds):-1}}
    for(const g of [cal.props,cal.edges])for(const B of Object.values(g)){B[2]=Math.round(B[2]*1000)/1000;B[3]=Math.round(B[3]*100)/100}
    s.cal=cal;
    /* claimed vs real edge on the graded best props: sum of our chance, of the price's chance (vig removed ~4.5%), and wins */
    {const K={n:0,hit:0,sc:0,imp:0};for(const [d,S] of Object.entries(T[sp]))for(const x of S.best||[]){if((x.r!=="win"&&x.r!=="loss")||x.sc==null||x.odds==null)continue;K.n++;K.hit+=x.r==="win";K.sc+=x.sc;K.imp+=imp(x.odds)/1.045}
     K.sc=Math.round(K.sc*1000)/1000;K.imp=Math.round(K.imp*1000)/1000;s.calk=K}
    s.best.u=Math.round(s.best.u*100)/100;s.plays.u=Math.round(s.plays.u*100)/100;for(const E of Object.values(s.edge))E[2]=Math.round(E[2]*100)/100;
    s.recent=s.recent.sort((a,b)=>a.d<b.d?1:-1).slice(0,40);SUM[sp]=s}
  {const s={plays:{w:0,l:0,p:0,u:0},recent:[]};for(const [d,S] of Object.entries(T.soc))for(const x of S.plays||[]){if(x.r==="win"){s.plays.w++;s.plays.u+=pay(x.odds)}else if(x.r==="loss"){s.plays.l++;s.plays.u-=1}else if(x.r==="push"||x.r==="void")s.plays.p++;s.recent.push({d,...x})}
   for(const S of Object.values(T.soc)){const P=S.parlay;if(P&&S.parlayLocked&&P.r){const q=s.parlay||(s.parlay={w:0,l:0,p:0,u:0});if(P.r==="win"){q.w++;q.u+=P.paid-1}else if(P.r==="loss"){q.l++;q.u-=1}else q.p++;q.u=Math.round(q.u*100)/100}}
   s.plays.u=Math.round(s.plays.u*100)/100;s.recent=s.recent.sort((a,b)=>a.d<b.d?1:-1).slice(0,40);SUM.soc=s}
  const today=(typeof NHL_DATE!=="undefined"&&NHL_DATE&&T.nhl[NHL_DATE])||null;
  /* tonight's snapshots (latest 1 day for NBA/NHL, this week's game days for NFL) so the site can grade them live as games end */
  const etd=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto"}).format(new Date()),TD={};
  for(const sp of ['nba','nhl','nfl']){const ds=Object.keys(T[sp]).filter(d=>d<=etd&&(T[sp][d].best||T[sp][d].plays)).sort().reverse().slice(0,sp==="nfl"?4:1).filter(d=>(Date.parse(etd)-Date.parse(d))/864e5<=(sp==="nfl"?6:1));
    TD[sp]=ds.map(d=>({d,best:(T[sp][d].best||[]).map(x=>keep(x,["nm","k","side","line","odds","tm","r","v"])),plays:(T[sp][d].plays||[]).map(x=>keep(x,["type","nm","k","side","line","odds","tm","mk","pick","a","h","r","v","f"]))}))}
  TD.soc=Object.keys(T.soc).filter(d=>d>=etd&&(T.soc[d].plays||[]).length||d===etd).sort().slice(0,2).map(d=>({d,plays:T.soc[d].plays||[]}));
  return {T,SUM,todayPlays:today&&today.plays||[],today:TD,log};
 },T);
 /* keep ~60 days */
 const cut=new Date(Date.now()-60*864e5).toISOString().slice(0,10);for(const s of ['nba','nfl','nhl','soc'])for(const d of Object.keys(R.T[s]))if(d<cut)delete R.T[s][d];
 fs.mkdirSync(path.dirname(SF),{recursive:true});fs.writeFileSync(SF,JSON.stringify(R.T));
 fs.writeFileSync(OUT,`/* tracker summaries — tools/track.js */\nvar TRACK=${JSON.stringify({sum:R.SUM,nhlPlays:R.todayPlays,today:R.today,at:new Date().toISOString()})};\n`);
 console.log("track: "+(R.log.join("; ")||"no new snapshots")+` · graded: NHL plays ${R.SUM.nhl.plays.w}-${R.SUM.nhl.plays.l}, best props NBA ${R.SUM.nba.best.w}-${R.SUM.nba.best.l} NFL ${R.SUM.nfl.best.w}-${R.SUM.nfl.best.l} NHL ${R.SUM.nhl.best.w}-${R.SUM.nhl.best.l}`);
 await b.close()})().catch(e=>{console.error("track failed:",e.message);process.exit(1)});
