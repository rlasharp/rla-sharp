// Tracker (runs in auto_run.sh after the build): opens the built site headless and uses the SITE'S OWN functions to
//  1) snapshot, before games start: each sport's top-10 best props, our game numbers (winner / total / edges vs the odds),
//     and the NHL Plays of the day (locked once, within 6 h of the first puck drop),
//  2) grade every snapshot once the box scores are in.
// State: src/data/track.json · output for the site: src/track_data.js (var TRACK=...)
// usage: node tools/track.js /abs/path/src/index.html
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const f=process.argv[2],dir=path.dirname(f),SF=path.join(dir,'data','track.json'),OUT=path.join(dir,'track_data.js');
let T={};try{T=JSON.parse(fs.readFileSync(SF,'utf8'))}catch(e){}
for(const s of ['nba','nfl','nhl','soc','ufc','cfb','cbb'])T[s]=T[s]||{};
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 await p.route(/espn|fonts\.g|cdnjs|jsdelivr|api\./,r=>r.abort());
 await p.addInitScript(()=>{window.Chart=class{constructor(){}destroy(){}update(){}};window.Chart.defaults={font:{},borderColor:''}});
 await p.goto('file://'+f+'#today');await p.waitForTimeout(800);
 await p.evaluate(()=>new Promise(r=>{if(typeof nhlEnsure==="undefined")return r();nhlEnsure(r);setTimeout(r,8000)}));
 await p.evaluate(()=>new Promise(r=>{if(typeof socEnsure==="undefined")return r();socEnsure(()=>socPEnsure(r));setTimeout(r,8000)}));
 const R=await p.evaluate((T)=>{
  const imp=o=>o==null?null:o<0?-o/(-o+100):100/(o+100),pay=o=>o==null?.909:o>0?o/100:100/-o,log=[];
  const keep=(o,ks)=>{const x={};for(const k of ks)if(o[k]!==undefined)x[k]=o[k];return x};
  /* ---------- NFL Plays of the Week: picked automatically and locked once per week ---------- */
  try{if(typeof potwAuto!=="undefined"&&typeof PLAYS_WEEK!=="undefined"&&!PLAYS_HAND){T.potw=T.potw||{};if(!T.potw[PLAYS_WEEK]){const P=potwAuto();
    if(P.length>=3){T.potw[PLAYS_WEEK]=P.map(x=>{const d=playData(x);return Object.assign(x,{title:d?d.title:"",odds:x.odds!=null?x.odds:(d?d.odds:null),line:x.line!=null?x.line:(d&&d.line!=null?d.line:null)})});log.push(`nfl: Plays of the Week ${PLAYS_WEEK} locked (${P.length})`)}}}}catch(e){log.push("potw: "+e.message)}
  /* ---------- snapshots ---------- */
  // NBA
  if(typeof NBA_SLATE!=="undefined"&&NBA_SLATE.length){const d=NBA_SLATE_DATE,S=T.nba[d]||(T.nba[d]={});
    if(!NBA_SLATE.some(nbaStarted)){
      S.best=(typeof nbaBest!=="undefined"?nbaBest():[]).slice(0,10).map(b=>({nm:b.nm,k:b.k,side:b.side,line:b.line,odds:b.odds,book:b.book||"",tm:b.p?b.p.tm:"",sc:Math.round((b.sc||0)*100)/100,sc0:Math.round((b.sc0!=null?b.sc0:b.sc||0)*1000)/1000}));
      S.games=NBA_SLATE.map(g=>{const M=nbaModel(g.a,g.h),L=NBA_LINES[g.a+"@"+g.h];if(!M)return null;const E=typeof nbaOddsEdges!=="undefined"?nbaOddsEdges(g):[];
        return {a:g.a,h:g.h,p:Math.round(M.p*1000)/1000,m:M.m,tot:M.tot,L:L?{sp:L.sp,tot:L.tot}:null,edges:E.filter(e=>e.edge>=.04).map(e=>({mk:e.mk,pick:e.pick,odds:e.odds,me:Math.round(e.me*1000)/1000,bk:Math.round(e.bk*1000)/1000}))}}).filter(Boolean);
      S.op=S.op||{};for(const b of S.best){const q=b.nm+"|"+b.k+"|"+b.side;if(!S.op[q])S.op[q]=[b.odds,b.line]}   /* first price we listed (for closing-line value) */
      log.push(`nba ${d}: snapshot ${S.best.length} props, ${S.games.length} games`)}}
  // NHL
  if(typeof NHL_SLATE!=="undefined"&&NHL_DATE&&NHL_SLATE.length){const d=NHL_DATE,S=T.nhl[d]||(T.nhl[d]={});const open=NHL_SLATE.filter(g=>!nhStarted(g));
    if(open.length===NHL_SLATE.length){S.best=nhBest().filter(b=>b.g&&b.g.d===d).slice(0,10).map(b=>({nm:b.nm,k:b.k,side:b.side,line:b.line,odds:b.odds,tm:nhWho(b.nm).tm,sc:Math.round(b.s.p*100)/100,sc0:Math.round((b.s.p0!=null?b.s.p0:b.s.p)*1000)/1000}));S.op=S.op||{};for(const b of S.best){const q=b.nm+"|"+b.k+"|"+b.side;if(!S.op[q])S.op[q]=[b.odds,b.line]}}   /* only that day's games (the props list also has tomorrow's) */
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
    /* fitted trust multiplier m (0–1.2, by log-likelihood) on the unadjusted chances: overall and per side */
    {const X=[];for(const [d,S] of Object.entries(T[sp]))for(const x of S.best||[]){if((x.r!=="win"&&x.r!=="loss")||x.odds==null)continue;const c=x.sc0!=null?x.sc0:x.sc;if(c==null)continue;X.push({c,f:imp(x.odds)/1.045,y:x.r==="win"?1:0,side:x.side,k:x.k})}
     const fit=A=>{if(!A.length)return {m:1,n:0};let best=null;for(let i=0;i<=24;i++){const m=i*.05;let ll=0;for(const o of A){const p=Math.min(.97,Math.max(.03,o.f+m*(o.c-o.f)));ll+=Math.log(o.y?p:1-p)}if(!best||ll>best[1])best=[m,ll]}return {m:Math.round(best[0]*100)/100,n:A.length}};
     s.fit={all:fit(X),o:fit(X.filter(o=>o.side==="o")),u:fit(X.filter(o=>o.side==="u")),mk:{}};
     /* per market (points, rebounds, shots...): its own trust level and record, so the ones that work aren't held back by the ones that don't */
     s.mkrec={};for(const o of X){const R=s.mkrec[o.k]||(s.mkrec[o.k]=[0,0]);R[o.y?0:1]++}
     for(const k of Object.keys(s.mkrec)){const A=X.filter(o=>o.k===k);if(A.length>=8)s.fit.mk[k]=fit(A)}}
    /* slices of the graded best props — over/under, price, market × side — with units, so losing slices can be cut */
    {const Sl={side:{},price:{},mks:{}},add=(g,k,x)=>{const R=Sl[g][k]||(Sl[g][k]=[0,0,0]);if(x.r==="win"){R[0]++;R[2]+=pay(x.odds)}else{R[1]++;R[2]-=1}};
     for(const [d,S] of Object.entries(T[sp]))for(const x of S.best||[]){if((x.r!=="win"&&x.r!=="loss")||x.odds==null)continue;add("side",x.side,x);add("price",x.odds<=-130?"fav":x.odds>=100?"dog":"even",x);add("mks",x.k+"|"+x.side,x)}
     for(const g of Object.values(Sl))for(const R of Object.values(g))R[2]=Math.round(R[2]*100)/100;s.slices=Sl}
    /* closing-line value: the first price we listed vs the last one before the game started */
    {const C={n:0,beat:0,sum:0,sn:0};for(const [d,S] of Object.entries(T[sp]))for(const x of S.best||[]){const o=S.op&&S.op[x.nm+"|"+x.k+"|"+x.side];if(!o||o[0]==null||x.odds==null)continue;
       if(o[1]===x.line){if(o[0]===x.odds)continue;const dv=imp(x.odds)-imp(o[0]);C.n++;C.sn++;C.sum+=dv;if(dv>0)C.beat++}else{const lm=(x.line-o[1])*(x.side==="o"?1:-1);C.n++;if(lm>0)C.beat++}}
     C.sum=Math.round(C.sum*1000)/1000;s.clv=C}
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
 /* 🥊 UFC (separate pass so the odds feed it needs can't touch the other sports): lock up to 5 best-value bets per card
    within 36 h of the first fight (one per fight, priced 20%+ to win, edge 5+ points), grade them from the results */
 try{let src=null;for(const fn of [path.join(dir,'ufc_data.js'),path.join(dir,'..','ufc_data.js')])if(fs.existsSync(fn)){src=fs.readFileSync(fn,'utf8');break}
  const lof=path.join(dir,'..','data','live_odds.json');const lo=fs.existsSync(lof)?JSON.parse(fs.readFileSync(lof,'utf8')):null;
  if(src){await p.addScriptTag({content:src});
   const U=await p.evaluate(([T,lo])=>{if(typeof ufValues==="undefined"||!window.UFC_OK)return null;if(lo&&typeof LO!=="undefined")LO.data=lo;const log=[],pay=o=>o>0?o/100:100/-o,r3=x=>Math.round(x*1000)/1000;
     for(const e of ufUpcoming()){const S=T[e.id]||(T[e.id]={n:e.n,d:(e.d||"").slice(0,10)});if(S.locked)continue;if(Date.parse(e.d)-Date.now()>36*3600e3)continue;
       const FF=e.f.map(f=>Object.assign({ev:e},f));if(FF.some(f=>f.st!=="pre"))continue;const P=[],seen=new Set();
       for(const x of ufValues(FF)){if(P.length>=5)break;if(x.edge<.05||x.need<.2||!ufEst(x.f)||ufEst(x.f).n<4||seen.has(x.f.id))continue;seen.add(x.f.id);const sp=ufSpec(x.f,x.o);
         P.push({fid:sp.fid,ev:e.id,title:sp.label,mk:UF_MK[x.o[0]]||x.o[0],odds:x.o[4],book:x.o[5]||"",p:sp.p,e:r3(x.e),need:r3(x.need)})}
       if(P.length){S.plays=P;S.locked=1;log.push(`ufc ${e.n}: locked ${P.length} picks`)}}
     for(const S of Object.values(T))for(const x of S.plays||[])if(!x.r||x.r==="pending"){const g=ufGrade({fid:x.fid,p:x.p});if(g&&g.r&&g.r!=="pending"){x.r=g.r;x.v=g.why||""}}
     const s={plays:{w:0,l:0,p:0,u:0},by:{},recent:[]};
     for(const S of Object.values(T))for(const x of S.plays||[]){const B=s.by[x.mk]||(s.by[x.mk]=[0,0,0]);if(x.r==="win"){s.plays.w++;s.plays.u+=pay(x.odds);B[0]++;B[2]+=pay(x.odds)}else if(x.r==="loss"){s.plays.l++;s.plays.u-=1;B[1]++;B[2]-=1}else if(x.r==="push"||x.r==="void")s.plays.p++;s.recent.push({d:S.d,...x})}
     s.plays.u=Math.round(s.plays.u*100)/100;for(const B of Object.values(s.by))B[2]=Math.round(B[2]*100)/100;s.recent=s.recent.sort((a,b)=>a.d<b.d?1:-1).slice(0,60);return {T,s,log}},[R.T.ufc||{},lo]);
   if(U){R.T.ufc=U.T;R.SUM.ufc=U.s;R.log.push(...U.log)}}}catch(e){console.error("ufc track:",e.message)}
 /* 🏈🏀 College: lock our 3 biggest game leans per sport per day (within 6 h of that day's first game), grade from the box scores */
 for(const CS of ["cfb","cbb"]){try{let src=null;for(const fn of [path.join(dir,CS+'_data.js'),path.join(dir,'..',CS+'_data.js')])if(fs.existsSync(fn)){src=fs.readFileSync(fn,'utf8');break}
  if(!src||!/_OK=1/.test(src))continue;const lof=path.join(dir,'..','data','live_odds.json');const lo=fs.existsSync(lof)?JSON.parse(fs.readFileSync(lof,'utf8')):null;
  await p.addScriptTag({content:src});
  const U=await p.evaluate(([CS,T,lo])=>{if(typeof coLeans==="undefined")return null;if(lo&&typeof LO!=="undefined")LO.data=lo;const log=[],pay=o=>o>0?o/100:100/-o,r3=x=>Math.round(x*1000)/1000;
    for(const S of Object.values(T)){if(S.plays&&S.plays.some(x=>x.k!=="colg")){S.plays=S.plays.filter(x=>x.k==="colg");if(!S.plays.length){delete S.plays;delete S.locked}}}   /* old prop picks (props were dropped for college) */
    const byDay={};for(const g of coGames(CS))if(g.st==="pre")(byDay[coDay(g.t)]=byDay[coDay(g.t)]||[]).push(g);
    for(const [d,G] of Object.entries(byDay)){const S=T[d]||(T[d]={});if(S.locked)continue;const first=Math.min(...G.map(g=>Date.parse(g.t)));if(first-Date.now()>6*3600e3)continue;
      const P=G.flatMap(g=>coLeans(CS,g).map(x=>({g,x}))).sort((a,b)=>b.x.edge-a.x.edge).slice(0,3).map(({g,x})=>{const sp=coSpecG(CS,g,x);return Object.assign(sp,{title:sp.label,mk:x.k,edge:Math.round(x.edge*10)/10})});
      if(P.length){S.plays=P;S.locked=1;log.push(`${CS} ${d}: locked ${P.length} picks`)}}
    for(const S of Object.values(T))for(const x of S.plays||[])if(!x.r||x.r==="pending"){const g=coGrade(x);if(g&&g.r&&g.r!=="pending"){x.r=g.r;x.v=g.why||""}}
    const s={plays:{w:0,l:0,p:0,u:0},recent:[]};for(const [d,S] of Object.entries(T))for(const x of S.plays||[]){if(x.r==="win"){s.plays.w++;s.plays.u+=pay(x.odds)}else if(x.r==="loss"){s.plays.l++;s.plays.u-=1}else if(x.r==="push"||x.r==="void")s.plays.p++;s.recent.push({d,...x})}
    s.plays.u=Math.round(s.plays.u*100)/100;s.recent=s.recent.sort((a,b)=>a.d<b.d?1:-1).slice(0,60);return {T,s,log}},[CS,R.T[CS]||{},lo]);
  if(U){R.T[CS]=U.T;R.SUM[CS]=U.s;R.log.push(...U.log)}
  /* 🏈 weekly pick'em: our side and total on every game with a ranked team, locked 3 h before kickoff, kept all season */
  if(CS==="cfb"){const PE=await p.evaluate(PE=>{if(typeof coPickEm==="undefined")return null;const now=Date.now();let n=0;
    for(const g of coGames("cfb")){if(g.st!=="pre"||PE[g.id]||!(typeof coPeOk!=="undefined"?coPeOk("cfb",g):(g.a[2]||g.h[2])))continue;const t=Date.parse(g.t);if(t-now>3*3600e3||t<now)continue;const x=coPickEm("cfb",g);if(x){PE[g.id]=x;n++}}
    for(const x of Object.values(PE))if(x.cl==null){const A=((coV("cfb","ATS")||{})[x.h]||[]).find(r=>String(r[7])===String(x.eid));if(A){x.cl=A[5];x.clt=A[6]}}
    for(const x of Object.values(PE))if(!x.r){let g=coGame("cfb",x.eid);if(!g||g.st!=="post"){const r=((coV("cfb","RES")||{})[x.h]||[]).find(r=>String(r[6])===String(x.eid));if(r)g={st:"post",a:[0,0,0,r[5]],h:[0,0,0,r[4]]}}if(g&&g.st==="post"){const a=+g.a[3],h=+g.h[3];if(isFinite(a)&&isFinite(h)){x.f=[a,h];const m=h-a+x.sp,cv=x.ps===x.h?m:-m;x.ra=cv>0?"win":cv<0?"loss":"push";if(x.tot!=null){const d=a+h-x.tot;x.ro=d===0?"push":(d>0)===(x.po==="over")?"win":"loss"}x.r=1}}}
    const S={ats:[0,0,0],ou:[0,0,0],clv:{n:0,beat:0,pts:0,tn:0,tbeat:0}},k={win:0,loss:1,push:2};for(const x of Object.values(PE)){if(x.r){S.ats[k[x.ra]]++;if(x.ro)S.ou[k[x.ro]]++}
      if(x.cl!=null&&x.sp!=null){const t=x.ps===x.h?x.sp:-x.sp,c=x.ps===x.h?x.cl:-x.cl,v=t-c;S.clv.n++;S.clv.pts+=v;if(v>0)S.clv.beat++}
      if(x.clt!=null&&x.tot!=null&&x.po){const v=x.po==="over"?x.clt-x.tot:x.tot-x.clt;S.clv.tn++;if(v>0)S.clv.tbeat++}}
    return {PE,S,n}},R.T.cfbpe||{});
   if(PE){R.T.cfbpe=PE.PE;(R.SUM.cfb=R.SUM.cfb||{}).pe={ats:PE.S.ats,ou:PE.S.ou,clv:PE.S.clv,rows:Object.values(PE.PE).sort((a,b)=>a.t<b.t?1:-1).slice(0,150)};if(PE.n)R.log.push(`cfb pick'em: locked ${PE.n}`)}}
  }catch(e){console.error(CS+" track:",e.message)}}
 /* keep ~60 days */
 const cut=new Date(Date.now()-60*864e5).toISOString().slice(0,10);for(const s of ['nba','nfl','nhl','soc'])for(const d of Object.keys(R.T[s]))if(d<cut)delete R.T[s][d];for(const [k,S] of Object.entries(R.T.ufc||{}))if((S.d||k)<cut)delete R.T.ufc[k];for(const CS of ['cfb','cbb'])for(const k of Object.keys(R.T[CS]||{}))if(k<cut)delete R.T[CS][k];
 fs.mkdirSync(path.dirname(SF),{recursive:true});fs.writeFileSync(SF,JSON.stringify(R.T));
 fs.writeFileSync(OUT,`/* tracker summaries — tools/track.js */\nvar TRACK=${JSON.stringify({sum:R.SUM,nhlPlays:R.todayPlays,today:R.today,potw:R.T.potw||{},at:new Date().toISOString()})};\n`);
 console.log("track: "+(R.log.join("; ")||"no new snapshots")+` · graded: NHL plays ${R.SUM.nhl.plays.w}-${R.SUM.nhl.plays.l}, best props NBA ${R.SUM.nba.best.w}-${R.SUM.nba.best.l} NFL ${R.SUM.nfl.best.w}-${R.SUM.nfl.best.l} NHL ${R.SUM.nhl.best.w}-${R.SUM.nhl.best.l}`);
 await b.close()})().catch(e=>{console.error("track failed:",e.message);process.exit(1)});
