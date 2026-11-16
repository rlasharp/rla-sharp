/* ---------- 🏈🏀 College football (FBS) + men's college basketball — same layout as the NBA / NFL sections:
   Games (with our number and a predicted score), game pages (matchup stats, head to head, injuries, box scores),
   picks, players, teams, rankings, My Bets grading. Data: cfb_data.js / cbb_data.js (tools/collegefetch.py, ESPN) loaded on demand;
   sportsbook lines + player props: live_odds.json "cfb" / "cbb" (tools/college_odds.py, PropLine).
   Routes: #cfb · #cfb-game-<id> · #cfb-props · #cfb-best · #cfb-player-<id> · #cfb-team-<id> · #cfb-rank (same for cbb) ---------- */
const CO={
  cfb:{U:"CFB",nm:"College football",em:"🏈",hfa:2.5,sd:15.5,lean:[7,10],unit:"pts",
    mk:{player_pass_yds:["Pass yds",r=>r[3]],player_rush_yds:["Rush yds",r=>r[9]],player_reception_yds:["Rec yds",r=>r[12]],player_receptions:["Receptions",r=>r[11]],player_pass_tds:["Pass TDs",r=>r[6]],player_anytime_td:["Anytime TD",r=>(r[10]||0)+(r[13]||0)]},
    cols:[["Pass",r=>r[3]!=null&&r[5]?`${r[4]}/${r[5]} · ${r[3]} yds${r[6]?` · ${r[6]} TD`:""}${r[7]?` · ${r[7]} INT`:""}`:""],["Rush",r=>r[8]?`${r[8]}-${r[9]}${r[10]?` · ${r[10]} TD`:""}`:""],["Rec",r=>r[11]?`${r[11]}-${r[12]}${r[13]?` · ${r[13]} TD`:""}`:""]]},
  cbb:{U:"CBB",nm:"College basketball",em:"🏀",hfa:3.0,sd:11,lean:[5,8],unit:"pts",
    mk:{player_points:["Points",r=>r[4]],player_rebounds:["Rebounds",r=>r[11]],player_assists:["Assists",r=>r[12]],player_threes:["3-pointers",r=>r[7]],player_points_rebounds_assists:["Pts+Reb+Ast",r=>(r[4]||0)+(r[11]||0)+(r[12]||0)]},
    cols:[["MIN",r=>r[3]],["PTS",r=>r[4]],["REB",r=>r[11]],["AST",r=>r[12]],["3PM",r=>r[7]],["FG",r=>r[6]?`${r[5]}/${r[6]}`:""]]}};
const COS={day:{},flt:{},mk:{},wait:{cfb:[],cbb:[]}};
function coE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function coV(sp,n){return window[CO[sp].U+"_"+n]}
function coOk(sp){return !!window[CO[sp].U+"_OK"]}
function coEnsure(sp,cb){if(typeof socLoad!=="undefined")socLoad(sp+"_data.js",CO[sp].U+"_OK",COS.wait[sp],()=>{},cb);else cb&&cb()}
function coAm(o){return o==null?"–":typeof oddsFmt!=="undefined"?oddsFmt(o):(o>0?"+":"")+o}
function coImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
function coPc(p){return p==null?"–":Math.round(p*100)+"%"}
function coF(v,d){return v==null||!isFinite(v)?"–":(+v).toFixed(d==null?1:d)}
function coT(sp,id){const T=(coV(sp,"TM")||{})[id]||{a:"?",n:"?",s:"?"};if(T.cf&&/^\d{4}/.test(T.cf))T.cf=T.cf.replace(/^\d{4}(-\d{2})?\s*/,"").replace(/ Conference$/,"").replace("Atlantic Coast","ACC").replace("Southeastern","SEC");return T}
function coTN(sp,id,full){const T=coT(sp,id);return `${T.rk?`<small class="corank">${T.rk}</small> `:""}${coE(full?T.n:(T.s||T.a))}`}
function coBadge(sp,id){const T=coT(sp,id);return `<span class="cobd" style="background:${T.c||"#555"}">${coE(T.a)}</span>`}
function coDay(t){try{return new Date(t).toLocaleDateString("en-CA",{timeZone:"America/New_York"})}catch(e){return (t||"").slice(0,10)}}
function coWhen(t){try{const d=new Date(t);return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",timeZone:"America/New_York"})+" · "+d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/New_York"})+" ET"}catch(e){return ""}}
function coGames(sp){return (coV(sp,"G")||[]).slice().sort((a,b)=>a.t<b.t?-1:1)}
function coGame(sp,id){return coGames(sp).find(g=>String(g.id)===String(id))}
/* sportsbook odds from the live feed (PropLine) for a game, by ESPN id */
function coOdds(sp,id){const D=typeof LO!=="undefined"&&LO.data&&LO.data[sp];return D&&D.ev&&D.ev[String(id)]||null}
/* the line we show: best sportsbook prices from the feed when we have them, else ESPN's (DraftKings) */
function coLine(sp,g){const O=coOdds(sp,g.id),L=g.ln||{};const r={src:L.bk||"ESPN"};
  if(O&&O.sp&&O.sp[0]!=null){r.sp=O.sp[0];r.spx=[O.sp[1],O.sp[2]];r.src="best of licensed books"}else if(L.sp!=null){r.sp=L.sp;r.spx=L.spx}
  if(O&&O.tot&&O.tot[0]!=null){r.tot=O.tot[0];r.ox=[O.tot[1],O.tot[2]]}else if(L.tot!=null){r.tot=L.tot;r.ox=L.ox}
  if(O&&O.ml&&(O.ml[0]!=null||O.ml[1]!=null))r.ml=O.ml;else if(L.ml)r.ml=L.ml;return r}
/* ---------- our number: each team's points for / against (season 55% + last 5 45%), home edge, blended 50/50 with the market ---------- */
function coNcdf(z){const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p}
function coModel(sp,g){const TS=coV(sp,"TS")||{},A=TS[g.a[0]],H=TS[g.h[0]];if(!A||!H||A.g<2||H.g<2)return null;const C=CO[sp];
  const b=(x,y)=>x==null?y:y==null?x:x*.55+y*.45,ao=b(A.pf,A.pf5),ad=b(A.pa,A.pa5),ho=b(H.pf,H.pf5),hd=b(H.pa,H.pa5);
  /* strength of schedule: when the fitted ratings exist (tools/collegefetch.py — every result, adjusted for who it came against),
     expected points = league average + this offense's rating + the other defense's rating ± home edge */
  const TR=coTR(sp),LG=coV(sp,"LG"),RA=TR[g.a[0]],RH=TR[g.h[0]],sos=!!(RA&&RH&&LG&&RA.g>=3&&RH.g>=3);
  /* home edge: the home team's own (how much better it plays at home, shrunk toward the default) */
  const hfa=g.neu?0:(RH&&RH.h!=null?RH.h:C.hfa);
  let hp=sos?LG+RH.o+RA.d+hfa/2:(ho+ad)/2+hfa/2,ap=sos?LG+RA.o+RH.d-hfa/2:(ao+hd)/2-hfa/2;const L=coLine(sp,g);
  /* pace + efficiency: expected plays/possessions × points per play/possession for each side (opponent-adjusted); averaged in */
  const EF=coEF(sp),EL=coV(sp,"EFFLG"),EA=EF[g.a[0]],EH=EF[g.h[0]];let eff=null;
  if(EL&&EA&&EH&&EA.g>=3&&EH.g>=3){const u=EL[1]+EA.t+EH.t,he=(EL[0]+EH.o+EA.d)/100*u+hfa/2,ae=(EL[0]+EA.o+EH.d)/100*u-hfa/2;eff={u,hp:he,ap:ae}}const rawTR={m:hp-ap,tot:hp+ap};if(eff){hp=(hp+eff.hp)/2;ap=(ap+eff.ap)/2}let mh=hp-ap,tot=hp+ap;const raw={m:mh,tot};
  if(L.sp!=null)mh=(mh+(-L.sp))/2;if(L.tot!=null)tot=(tot+L.tot)/2;
  return {m:mh,tot,hp:(tot+mh)/2,ap:(tot-mh)/2,p:coNcdf(mh/C.sd),raw,rawTR,n:Math.min(A.g,H.g),sos,eff,hfa}}
/* leans: where our own number (before the blend) is far from the market */
/* lean thresholds from the season replay (tools/collegefetch.py, CFB_BT/CBB_BT): the smallest gap from the line whose leans won
   53.5%+ over 40+ games; if none did, no leans of that kind (null); with too few games yet, the defaults */
function coThr(sp,kind){const r=coThrV(sp,kind);return r?r.t:null}
/* which version of our number to trust and from what gap: every replayed version × gap is checked; with several versions to choose
   from, the bar is a bit higher (54.5% over 40+ games) so a lucky pick doesn't slip through. null = none held up → no leans */
function coThrV(sp,kind){const B=coV(sp,"BT"),d=CO[sp].lean[kind==="sp"?0:1];if(!B||!B.n)return {t:d,v:"mix"};const V=B.v||{tr:{sp:B.sp,tot:B.tot}},nv=Object.keys(V).length,bar=nv>1?.545:.535;
  const first=Object.values(V)[0][kind]||{},E0=Object.entries(first).sort((a,b)=>a[0]-b[0])[0];if(!E0||E0[1][0]+E0[1][1]<40)return {t:d,v:"mix"};
  let best=null;for(const [v,X] of Object.entries(V))for(const [t,[w,l]] of Object.entries(X[kind]||{}).sort((a,b)=>a[0]-b[0]))if(w+l>=40&&w/(w+l)>=bar){const c={t:+t,v,p:w/(w+l),n:w+l};if(!best||c.p>best.p)best=c;break}
  return best}
function coLeans(sp,g){if(g.st!=="pre")return [];const M=coModel(sp,g),L=coLine(sp,g),C=CO[sp];if(!M||M.n<3)return [];const out=[],V1=coThrV(sp,"sp"),V2=coThrV(sp,"tot"),t1=V1&&V1.t,t2=V2&&V2.t,R1=V1&&V1.v==="tr"?M.rawTR:M.raw,R2=V2&&V2.v==="tr"?M.rawTR:M.raw;
  const CAP=sp==="cfb"?14:10;   /* a gap this big vs the line = something our ratings don't know (early season, injuries) — not a pick */
  if(L.sp!=null&&V1){const e=R1.m-(-L.sp);if(Math.abs(e)<=CAP&&Math.abs(e)>=t1){const home=e>0;out.push({k:"Spread",tid:home?g.h[0]:g.a[0],txt:`${coT(sp,home?g.h[0]:g.a[0]).s||coT(sp,home?g.h[0]:g.a[0]).a} ${home?(L.sp>0?"+":"")+L.sp:(L.sp<0?"+":"")+(-L.sp)}`,edge:Math.abs(e),odds:L.spx?L.spx[home?1:0]:null})}}
  if(L.tot!=null&&V2){const e=R2.tot-L.tot;if(Math.abs(e)<=CAP&&Math.abs(e)>=t2)out.push({k:"Total",txt:`${e>0?"Over":"Under"} ${L.tot}`,edge:Math.abs(e),odds:L.ox?L.ox[e>0?0:1]:null})}
  return out}
/* ---------- props: his values, hit rates, our chance ---------- */
/* ---------- picks: our leans on spread / total, tracked in My Bets and graded from the final score ---------- */
function coSpecG(sp,g,x){const L=coLine(sp,g);const kind=x.k==="Spread"?"sp":"tot";const home=kind==="sp"?x.tid===g.h[0]:null;
  return {k:"colg",sp,eid:g.id,kind,team:kind==="sp"?(home?g.h[0]:g.a[0]):null,home:kind==="sp"?!!home:null,side:kind==="tot"?(/^Over/.test(x.txt)?"over":"under"):null,line:kind==="sp"?(home?L.sp:-L.sp):L.tot,odds:x.odds!=null?x.odds:-110,date:coDay(g.t),label:`${x.txt} · ${coT(sp,g.a[0]).a} @ ${coT(sp,g.h[0]).a}`}}
function coGradeG(b){const sp=b.sp;if(!coOk(sp))return {r:"pending"};const g=coGame(sp,b.eid);let hs=null,as=null;
  if(g&&g.st==="post"){hs=+g.h[3];as=+g.a[3]}else{const R=(coV(sp,"RES")||{});for(const L of Object.values(R))for(const r of L)if(String(r[6])===String(b.eid)){if(r[3]==="H"){hs=r[4];as=r[5]}else{hs=r[5];as=r[4]}}}
  if(hs==null||as==null||isNaN(hs))return {r:"pending"};const why=`Final ${as}-${hs}`;
  if(b.kind==="tot"){const t=hs+as;return {r:t===b.line?"push":((b.side==="over")===(t>b.line))?"win":"loss",why}}
  const m=(b.home?hs-as:as-hs)+b.line;return {r:m>0?"win":m<0?"loss":"push",why}}
function coGrade(b){return b&&b.k==="colg"?coGradeG(b):{r:"pending"}}
/* team stats per game (box scores) + ranks among the teams we have */
const CO_ST={cfb:[["Total yards","totalYards",1],["Passing yards","netPassingYards",1],["Rushing yards","rushingYards",1],["Yards per carry",o=>o.rushingAttempts?o.rushingYards/o.rushingAttempts:null,1],["Completion %",o=>o.patt?o.comp/o.patt*100:null,1],["3rd-down %",o=>o["3da"]?o["3dc"]/o["3da"]*100:null,1],["First downs","firstDowns",1],["Turnovers","turnovers",0],["Penalty yards","peny",0],["Time of possession (min)","top",1]],
  cbb:[["Field goal %",o=>o.fieldGoalsA?o.fieldGoalsM/o.fieldGoalsA*100:null,1],["3-pointers made","threePointFieldGoalsM",1],["3-point %",o=>o.threePointFieldGoalsA?o.threePointFieldGoalsM/o.threePointFieldGoalsA*100:null,1],["Free throw %",o=>o.freeThrowsA?o.freeThrowsM/o.freeThrowsA*100:null,1],["Rebounds","totalRebounds",1],["Offensive rebounds","offensiveRebounds",1],["Assists","assists",1],["Turnovers","totalTurnovers",0],["Steals","steals",1],["Blocks","blocks",1],["Points in the paint","pointsInPaint",1],["Fast-break points","fastBreakPoints",1]]};
function coSV(o,f){if(!o)return null;const v=typeof f==="function"?f(o):o[f];return v==null||!isFinite(v)?null:v}
let CO_RK={};function coRk(sp,i,side,v){const k=sp+i+side;if(!CO_RK[k]){const X=coV(sp,"TSX")||{},f=CO_ST[sp][i][1];CO_RK[k]=Object.values(X).map(t=>coSV(t[side],f)).filter(x=>x!=null).sort((a,b)=>b-a)}const A=CO_RK[k];if(v==null||!A.length)return null;
  const hi=CO_ST[sp][i][2];const better=side==="o"?hi:!hi;const r=A.filter(x=>better?x>v:x<v).length+1;return [r,A.length]}
function coRkTxt(r){return r?`<span class="small">${r[0]}${r[0]%10===1&&r[0]!==11?"st":r[0]%10===2&&r[0]!==12?"nd":r[0]%10===3&&r[0]!==13?"rd":"th"}/${r[1]}</span>`:""}
function coHead(sp,sub){return `<h1>${CO[sp].em} ${CO[sp].nm}</h1>${sub?`<p class="sub">${sub}</p>`:""}`}
/* game card: same layout as the NBA / NFL cards (team rows with spread · win · team total, win bar, our pick) */
function coWin(sp,g){const L=coLine(sp,g);if(L.ml&&L.ml[0]!=null&&L.ml[1]!=null){const a=coImp(L.ml[0]),h=coImp(L.ml[1]);return {a:a/(a+h),h:h/(a+h),src:"odds"}}const M=coModel(sp,g);return M?{a:1-M.p,h:M.p,src:"ours"}:null}
function coPick(sp,g){const Le=coLeans(sp,g),M=coModel(sp,g);if(Le.length){const x=Le[0];return `<div class="nbpick">⭐ Our pick: <b>${coE(x.txt)}</b> <span class="small">${x.k.toLowerCase()}${x.odds!=null?" · "+coAm(x.odds):""} · ${coF(x.edge)} ${CO[sp].unit} off the market</span></div>`}
  return ""}
function coRow(sp,g){const L=coLine(sp,g),W=coWin(sp,g),fin=g.st==="post",live=g.st==="in";
  const row=(s,isH)=>{const T=coT(sp,s[0]),spv=L.sp!=null?(isH?L.sp:-L.sp):null,ml=L.ml?L.ml[isH?1:0]:null,fav=W&&(isH?W.h>W.a:W.a>W.h);
    return `<div class="nbtr"><div class="nbtn">${coBadge(sp,s[0])}<div><b style="${fav?"":"font-weight:600"}">${s[2]?`<small class="corank">${s[2]}</small> `:""}${coE(fin||live?(T.s||T.a):T.a)}</b> <span class="small">${coE(s[1])}</span></div></div>
     ${fin||live?`<div class="nbtl"><b class="cosc">${coE(s[3])}</b></div>`:`<div class="nbtl">${spv!=null?`<span class="small">Spread</span> <b>${spv>0?"+":""}${spv}</b>`:""}</div><div class="nbtl">${ml!=null?`<span class="small">Win</span> <b>${coAm(ml)}</b>`:""}</div><div class="nbtl">${spv!=null&&L.tot!=null?`<span class="small">Team total</span> <b>${(Math.round((L.tot/2-spv/2)*2)/2).toFixed(1)}</b>`:""}</div>`}</div>`};
  const fav=L.sp!=null?(L.sp<=0?g.h[0]:g.a[0]):null;
  return `<div class="card nbag nbg2" data-cog="${sp}-game-${g.id}"><div class="when"><span>${live?`<b class="dn">● ${coE(g.det)}</b>`:fin?`<b style="color:var(--text)">Final</b>`:`<b style="color:var(--text)">${coWhen(g.t).split(" · ")[1]||""}</b> · ${coWhen(g.t).split(" · ")[0]}`}</span><span>${g.tv?coE(g.tv)+" · ":""}Details →</span></div>
   ${row(g.a,false)}${row(g.h,true)}
   ${W&&!fin?`<div class="nbwp"><div style="width:${Math.round(W.a*100)}%;background:${coT(sp,g.a[0]).c||"#888"}"></div><div style="width:${100-Math.round(W.a*100)}%;background:${coT(sp,g.h[0]).c||"#555"}"></div></div>
   <div class="nbwpl"><span>${coE(coT(sp,g.a[0]).a)} ${Math.round(W.a*100)}%</span><span class="small">chance to win (${W.src==="odds"?"from the odds":"our number"})</span><span>${coE(coT(sp,g.h[0]).a)} ${Math.round(W.h*100)}%</span></div>`:""}
   ${fin?(L.sp!=null?`<div class="nbsay">${(()=>{const m=(+g.h[3])-(+g.a[3])+L.sp,t=(+g.a[3])+(+g.h[3]);return `${m===0?"Push on the spread":`<b>${coE(coT(sp,m>0?g.h[0]:g.a[0]).a)}</b> covered`} · total ${t} — ${t>L.tot?"over":t<L.tot?"under":"push"} ${L.tot}`})()}</div>`:""):L.sp!=null?`<div class="nbsay">${coE(coT(sp,fav).s)} favored by <b>${Math.abs(L.sp)}</b>${L.tot!=null?` · total points line <b>${L.tot}</b>`:""}</div>`:`<div class="nbsay">Lines not posted yet</div>`}
   ${g.neu||g.ven?`<div class="spotl"><span class="small">${g.neu?"🏟️ Neutral site · ":""}${coE(g.ven)}</span></div>`:""}
   ${coChips(sp,g)}
   ${fin?"":coPred(sp,g)+coPick(sp,g)}</div>`}
function coSc(M){let a=Math.round(M.ap),h=Math.round(M.hp);if(a===h){if(M.m>=0)h++;else a++}return [a,h]}
function coPred(sp,g){const M=coModel(sp,g);if(!M)return "";const [a,h]=coSc(M);return `<div class="copred">🔮 Predicted score: <b>${coE(coT(sp,g.a[0]).a)} ${a}</b> – <b>${h} ${coE(coT(sp,g.h[0]).a)}</b></div>`}
function coGamesPage(sp,el){const G=coGames(sp),days=[...new Set(G.map(g=>coDay(g.t)))];const d=days.includes(COS.day[sp])?COS.day[sp]:days.find(x=>G.some(g=>coDay(g.t)===x&&g.st!=="post"))||days[0];
  const flt=COS.flt[sp]||"top",TM=coV(sp,"TM")||{},P5=/SEC|Big Ten|Big 12|ACC|Big East|Pac/;const ord={in:0,pre:1,post:2};
  const inF=g=>flt==="all"||(flt==="top"?(g.a[2]||g.h[2]):(P5.test(coT(sp,g.a[0]).cf||"")||P5.test(coT(sp,g.h[0]).cf||"")||g.a[2]||g.h[2]));
  const L=G.filter(g=>coDay(g.t)===d).filter(inF).sort((a,b)=>(ord[a.st]??1)-(ord[b.st]??1)||(a.t<b.t?-1:1));
  const lab=x=>{const t=coDay(new Date().toISOString()),tm=coDay(new Date(Date.now()+864e5).toISOString());return x===t?"Today":x===tm?"Tomorrow":new Date(x+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"})};
  const best=coGames(sp).filter(g=>g.st==="pre").flatMap(g=>coLeans(sp,g).map(x=>({g,x}))).sort((a,b)=>b.x.edge-a.x.edge)[0];
  el.innerHTML=`<h1>${CO[sp].em} ${CO[sp].U} · ${new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</h1>
   <div class="gtabs">${days.filter(x=>x===d||G.some(g=>coDay(g.t)===x&&inF(g))).slice(0,4).map(x=>`<a href="javascript:void 0" data-coday="${x}" class="${x===d?"on":""}">${lab(x)}<small>${G.filter(g=>coDay(g.t)===x).filter(inF).length}</small></a>`).join("")}</div>
   ${best?`<a class="card pdteas" href="#${sp}-picks"><span>⭐ <b>Top pick</b></span><span class="pdtx"><b>${coE(best.x.txt)}</b> <span class="small">${coE(coT(sp,best.g.a[0]).a)} @ ${coE(coT(sp,best.g.h[0]).a)}${best.x.odds!=null?" · "+coAm(best.x.odds):""}</span></span><span class="small">All picks →</span></a>`:""}
   <div class="seg" style="margin:8px 0">${[["top","Top 25"],["p5","+ Power conferences"],["all","All games"]].map(([k,l])=>`<button class="${flt===k?"on":""}" data-coflt="${k}">${l}</button>`).join("")}</div>
   <p class="sub">${L.length} game${L.length===1?"":"s"}${flt==="top"?" with a ranked team":""}. Tap a game for the matchup, stats, head-to-head and box scores.</p>
   <div class="grid g2">${L.map(g=>coRow(sp,g)).join("")||`<div class="card small">No ${flt==="top"?"Top 25 ":""}games that day${flt!=="all"?" — try All games":""}.</div>`}</div>
   <a href="#${sp}-picks" class="btn" style="display:block;text-align:center;margin-top:10px">⭐ Our picks + predicted scores →</a>
   <details class="adv" style="margin-top:14px"><summary><b>How to read this</b></summary><p class="small" style="margin:8px 0 0"><b>Spread</b>: the favorite (minus number) has to win by more than that; the underdog can lose by less. <b>Win</b>: moneyline odds. <b>Team total</b>: points the line implies for that team. Our number = each team's offense and defense ratings, adjusted for strength of schedule (every result compared with what those opponents usually score and allow, blowouts capped), plus home edge, blended 50/50 with the line. Lines: licensed US books via our odds feed, or ESPN's partner book. 21+.</p></details>`;
  el.querySelectorAll("[data-cog]").forEach(c=>c.onclick=()=>location.hash=c.dataset.cog);
  el.querySelectorAll("[data-coday]").forEach(b=>b.onclick=e=>{e.preventDefault();COS.day[sp]=b.dataset.coday;coGamesPage(sp,el)});el.querySelectorAll("[data-coflt]").forEach(b=>b.onclick=()=>{COS.flt[sp]=b.dataset.coflt;coGamesPage(sp,el)})}
/* ⭐ picks: every upcoming game's predicted score, and our leans where our number is far from the line */
function coPicksPage(sp,el){const G=coGames(sp).filter(g=>g.st==="pre"),P=G.flatMap(g=>coLeans(sp,g).map(x=>({g,x}))).sort((a,b)=>b.x.edge-a.x.edge),flt=COS.pf||"top";
  const S=G.filter(g=>flt==="all"||g.a[2]||g.h[2]).filter(g=>coModel(sp,g));
  el.innerHTML=`<h1>${CO[sp].em} ${CO[sp].U} picks</h1><p class="sub">Predicted scores for every game, and our leans where our number is far from the line.</p>
   ${coBTCard(sp)}<div class="card potd"><h2 style="margin-bottom:2px">⭐ Best bets</h2><div class="small" style="margin-bottom:6px">${(()=>{const a=coThr(sp,"sp"),b=coThr(sp,"tot");return a==null&&b==null?`Leans are paused: in the season replay above, none of our spread or total gaps beat the closing line often enough to list. Predicted scores below are still our best number.`:`Where our own number (before blending with the market) is ${a==null?"":a+"+ points off the spread"}${a!=null&&b!=null?" or ":""}${b==null?"":b+"+ points off the total"}.${a==null?" Spread leans are paused (didn't hold up in the replay).":""}${b==null?" Total leans are paused (didn't hold up in the replay).":""}`})()}</div>
    ${P.slice(0,10).map(({g,x},i)=>`<div class="pod"><div class="podn">${i+1}</div><div style="min-width:0;flex:1"><a href="#${sp}-game-${g.id}"><b>${coE(x.txt)}</b></a> <span class="small">${x.k.toLowerCase()}${x.odds!=null?" · "+coAm(x.odds):""}</span><div class="small">${coE(coT(sp,g.a[0]).s)} @ ${coE(coT(sp,g.h[0]).s)} · ${coWhen(g.t)}</div>${(()=>{const M=coModel(sp,g);return M?`<div class="small">Predicted: ${coE(coT(sp,g.a[0]).a)} ${coSc(M)[0]} – ${coSc(M)[1]} ${coE(coT(sp,g.h[0]).a)} · our number ${coF(x.edge)} ${CO[sp].unit} off the market</div>`:""})()}</div><div class="bps"><b>${coF(x.edge)}</b><span>pts off</span>${typeof actBtn!=="undefined"?actBtn(coSpecG(sp,g,x),"＋","plus"):""}</div></div>`).join("")||`<div class="small">No game passes our threshold right now.</div>`}
    <div class="small" style="margin-top:6px">Our number: strength-of-schedule ratings + pace and efficiency + each team's home edge. Research, not a sure thing. Bet small.</div></div>
   ${coPickEmSec(sp)}
   <div class="seg" style="margin:10px 0">${[["top","Top 25 games"],["all","All games"]].map(([k,l])=>`<button class="${flt===k?"on":""}" data-copf="${k}">${l}</button>`).join("")}</div>
   <div class="card"><h2>🔮 Predicted scores</h2>${S.map(g=>{const M=coModel(sp,g),L=coLine(sp,g),[a,h]=coSc(M);return `<a class="ufval" href="#${sp}-game-${g.id}"><span class="small">${coWhen(g.t).split(" · ")[0]}</span><b>${coE(coT(sp,g.a[0]).a)} ${a} – ${h} ${coE(coT(sp,g.h[0]).a)}</b><span class="small">${coPc(M.p>=.5?M.p:1-M.p)} ${coE(coT(sp,M.p>=.5?g.h[0]:g.a[0]).a)}</span><span class="small">${L.sp!=null?`line ${coE(coT(sp,L.sp<=0?g.h[0]:g.a[0]).a)} ${-Math.abs(L.sp)} · ${L.tot??"–"}`:"no line"}</span></a>`}).join("")||`<div class="small">No games.</div>`}</div>`;
  el.querySelectorAll("[data-copf]").forEach(b=>b.onclick=()=>{COS.pf=b.dataset.copf;coPicksPage(sp,el)})}
/* matchup stats: each offense against what the other defense allows (per game, ranks among the teams we have) */
function coMatchup(sp,g){const X=coV(sp,"TSX")||{},A=X[g.a[0]],H=X[g.h[0]],TS=coV(sp,"TS")||{};if(!A||!H)return `<div class="card small">Matchup stats appear once both teams have box scores.</div>`;
  const tbl=(off,def,oN,dN)=>`<div class="nbatbl"><table class="uftape"><thead><tr><th>${coE(oN)} gets</th><th></th><th>${coE(dN)} allows</th></tr></thead><tbody>${CO_ST[sp].map(([lab,f,hi],i)=>{const v=coSV(off.o,f),w=coSV(def.d,f),r1=coRk(sp,i,"o",v),r2=coRk(sp,i,"d",w);return v==null&&w==null?"":`<tr><td>${coF(v)} ${coRkTxt(r1)}</td><th>${lab}</th><td>${coF(w)} ${coRkTxt(r2)}</td></tr>`}).join("")}</tbody></table></div>`;
  const an=coT(sp,g.a[0]).s,hn=coT(sp,g.h[0]).s;
  return `${coPowerVs(sp,g)}<div class="card"><h2>${coE(an)} offense vs ${coE(hn)} defense</h2>${tbl(A,H,an,hn)}</div><div class="card"><h2>${coE(hn)} offense vs ${coE(an)} defense</h2>${tbl(H,A,hn,an)}</div>
   <div class="small">Per game this season, from ESPN box scores (${A.n} and ${H.n} games). Ranks among the ${Object.keys(X).length} teams playing in the next few days (1st = best for that side).</div>`}
function coInj(sp,t){const I=(coV(sp,"INJ")||{})[t]||[];return I.length?I.map(r=>`<div class="ufval"><b>${coE(r[0])}</b><span class="small">${coE(r[1])}</span><span>${coE(r[2])}</span><span class="small">${coE(r[3]).slice(0,120)}</span></div>`).join(""):`<div class="small">No injuries listed by ESPN${sp==="cbb"?" (college basketball reports are rare)":""}.</div>`}
function coH2H(sp,g){const H=(coV(sp,"H2H")||{})[g.id]||[],h=coT(sp,g.h[0]).a,a=coT(sp,g.a[0]).a;if(!H.length)return `<div class="card small">${coE(coT(sp,g.a[0]).s)} and ${coE(coT(sp,g.h[0]).s)} haven't met in the last ${sp==="cfb"?"4 seasons":"4 seasons"}.</div>`;
  const hw=H.filter(r=>r[2]>r[3]).length,WL=H.filter(r=>r[6]!=null);let cv=[0,0,0],ou=[0,0,0];for(const r of WL){const m=r[2]-r[3]+r[6];cv[m>0?0:m<0?1:2]++;if(r[7]!=null){const t=r[2]+r[3]-r[7];ou[t>0?0:t<0?1:2]++}}
  const ats=WL.length?`<div class="small" style="margin:4px 0 6px">With closing lines (${WL.length}): <b>${coE(h)}</b> ${cv[0]}-${cv[1]}${cv[2]?"-"+cv[2]:""} against the spread · overs ${ou[0]}-${ou[1]}${ou[2]?"-"+ou[2]:""}</div>`:"";
  return `<div class="card"><h2>Head to head <span class="small">· last ${H.length} meeting${H.length>1?"s":""}</span></h2><div class="nbsay"><b>${coE(h)}</b> ${hw}-${H.length-hw} vs <b>${coE(a)}</b></div>
   ${H.map(r=>`<div class="ufval"><span class="small">${coE(r[0])}</span><span>${r[1]==="H"?`${coE(a)} @ ${coE(h)}`:`${coE(h)} @ ${coE(a)}`}${r[4]?" (N)":""}</span><b>${coE(r[2]>r[3]?h:a)} ${Math.max(r[2],r[3])}-${Math.min(r[2],r[3])}</b><span class="small">total ${r[2]+r[3]}${r[6]!=null?` · ${coE(h)} ${r[6]>0?"+":""}${r[6]} ${r[2]-r[3]+r[6]>0?"✓":r[2]-r[3]+r[6]<0?"✗":"P"}${r[7]!=null?` · ${r[2]+r[3]>r[7]?"O":r[2]+r[3]<r[7]?"U":"P"} ${r[7]}`:""}`:g.riv||g.ttl?" · line unavailable":""}</span></div>`).join("")}${ats}</div>`}
/* box scores (separate file, loaded when one is opened) */
function coBoxEnsure(sp,cb){if(window[CO[sp].U+"_BX_OK"])return cb();if(typeof socLoad!=="undefined")socLoad(sp+"_box.js",CO[sp].U+"_BX_OK",COS["bw"+sp]||(COS["bw"+sp]=[]),()=>{},cb);else cb()}
function coBoxPage(sp,el,eid){el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Loading box score…</div>`;coBoxEnsure(sp,()=>{const B=(window[CO[sp].U+"_BX"]||{})[eid];
  if(!B){el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"Back"):""}</p><div class="card">Box score not available for this game.</div>`;return}
  const tm=[B.a[0],B.h[0]],tt=k=>B.t[k]||{},C=CO[sp];
  const teamRows=sp==="cfb"?[["Total yards","totalYards"],["Passing","netPassingYards"],["Comp/Att","completionAttempts"],["Rushing","rushingYards"],["Carries","rushingAttempts"],["First downs","firstDowns"],["3rd down","thirdDownEff"],["Turnovers","turnovers"],["Penalties","totalPenaltiesYards"],["Possession","possessionTime"]]
    :[["FG","fieldGoalsMade-fieldGoalsAttempted"],["3PT","threePointFieldGoalsMade-threePointFieldGoalsAttempted"],["FT","freeThrowsMade-freeThrowsAttempted"],["Rebounds","totalRebounds"],["Off. reb","offensiveRebounds"],["Assists","assists"],["Turnovers","totalTurnovers"],["Steals","steals"],["Blocks","blocks"],["Paint pts","pointsInPaint"],["Fast break","fastBreakPoints"]];
  const pl=t=>{const R=(B.p[t]||[]).map(r=>[r[0],r[1]].concat(r.slice(2)));if(!R.length)return `<div class="small">No player stats.</div>`;
    if(sp==="cbb")return `<div class="nbatbl"><table class="bxt cobx"><thead><tr><th>Player</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th><th>3PT</th><th>FT</th><th>TO</th><th>STL</th><th>BLK</th></tr></thead><tbody>${R.sort((a,b)=>(b[3]||0)-(a[3]||0)).map(r=>`<tr><td><b>${coE(r[0])}</b> <span class="small">${coE(r[1])}</span></td><td>${r[2]??""}</td><td><b>${r[3]??""}</b></td><td>${r[10]??""}</td><td>${r[11]??""}</td><td>${r[4]??"–"}/${r[5]??"–"}</td><td>${r[6]??"–"}/${r[7]??"–"}</td><td>${r[8]??"–"}/${r[9]??"–"}</td><td>${r[12]??""}</td><td>${r[13]??""}</td><td>${r[14]??""}</td></tr>`).join("")}</tbody></table></div>`;
    const sec=(h,f,cols)=>{const X=R.filter(f);return X.length?`<h3 class="nhh3">${h}</h3><div class="nbatbl"><table class="bxt cobx"><tbody>${X.map(r=>`<tr><td><b>${coE(r[0])}</b> <span class="small">${coE(r[1])}</span></td>${cols(r)}</tr>`).join("")}</tbody></table></div>`:""};
    return sec("Passing",r=>r[4],r=>`<td>${r[3]??""}/${r[4]??""}</td><td>${r[2]??0} yds</td><td>${r[5]??0} TD</td><td>${r[6]??0} INT</td>`)+sec("Rushing",r=>r[7],r=>`<td>${r[7]} car</td><td>${r[8]??0} yds</td><td>${r[9]??0} TD</td><td>long ${r[14]??"–"}</td>`)+sec("Receiving",r=>r[10],r=>`<td>${r[10]} rec</td><td>${r[11]??0} yds</td><td>${r[12]??0} TD</td><td>long ${r[13]??"–"}</td>`)};
  el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"Back"):""}</p>
   <div class="gh"><div class="ght">${coBadge(sp,B.a[0])}<b><a href="#${sp}-team-${B.a[0]}">${coE(coT(sp,B.a[0]).s)}</a></b><b class="cosc">${B.a[1]??""}</b></div><div class="ghm"><b>Final</b><span class="small">${coE(B.d)}${B.n?" · neutral":""}</span></div><div class="ght">${coBadge(sp,B.h[0])}<b><a href="#${sp}-team-${B.h[0]}">${coE(coT(sp,B.h[0]).s)}</a></b><b class="cosc">${B.h[1]??""}</b></div></div>
   <div class="card"><h2>Team stats</h2><div class="nbatbl"><table class="uftape"><thead><tr><th>${coE(coT(sp,B.a[0]).a)}</th><th></th><th>${coE(coT(sp,B.h[0]).a)}</th></tr></thead><tbody>${teamRows.map(([l,k])=>`<tr><td>${coE(tt(B.a[0])[k]??"–")}</td><th>${l}</th><td>${coE(tt(B.h[0])[k]??"–")}</td></tr>`).join("")}</tbody></table></div></div>
   ${tm.map(t=>`<div class="card"><h2>${coBadge(sp,t)} ${coE(coT(sp,t).n)}</h2>${pl(t)}</div>`).join("")}<p class="note">ESPN box score.</p>`})}
/* quick facts for "What matters" */
function coFacts(sp,g){const RES=coV(sp,"RES")||{},TS=coV(sp,"TS")||{},F=[];
  for(const s of [g.a,g.h]){const t=s[0],R=RES[t]||[],T=TS[t]||{},nm=coE(coT(sp,t).s);if(!R.length)continue;
    let st=0;const last=R[R.length-1],w=last[4]>last[5];for(let i=R.length-1;i>=0&&((R[i][4]>R[i][5])===w);i--)st++;if(st>=3)F.push([w?"good":"bad",w?"🔥":"🧊",`<b>${nm}</b> has ${w?"won":"lost"} ${st} straight.`]);
    if(T.pf5!=null&&T.pf!=null&&Math.abs(T.pf5-T.pf)>=(sp==="cfb"?5:5))F.push(["",T.pf5>T.pf?"📈":"📉",`<b>${nm}</b> is scoring ${coF(T.pf5)} a game over its last 5 (season ${coF(T.pf)}).`]);
    const road=R.filter(r=>r[3]==="A"&&!r[7]);if(road.length>=2&&s===g.a&&!g.neu){const rw=road.filter(r=>r[4]>r[5]).length;F.push(["","🧳",`<b>${nm}</b> is ${rw}-${road.length-rw} on the road.`])}
    const home=R.filter(r=>r[3]==="H"&&!r[7]);if(home.length>=2&&s===g.h&&!g.neu){const hw=home.filter(r=>r[4]>r[5]).length;F.push(["","🏠",`<b>${nm}</b> is ${hw}-${home.length-hw} at home.`])}}
  if(g.a[2]&&g.h[2])F.unshift(["","⭐",`Ranked matchup: #${g.a[2]} vs #${g.h[2]}.`]);else if(g.a[2]||g.h[2]){const r=g.a[2]?g.a:g.h;F.unshift(["","⭐",`<b>${coE(coT(sp,r[0]).s)}</b> is ranked #${r[2]}.`])}
  for(const s of [g.a,g.h])for(const r of coRest(sp,g,s[0]))F.push(["",r[0],`<b>${coE(coT(sp,s[0]).s)}</b>: ${r[1]}.`]);
  {const w=coWxTxt(sp,g);if(w)F.push(["","🌦️",w])}
  if(g.riv||g.ttl)F.unshift(["","🔥",`<b>${coE(g.riv||g.ttl)}</b>${g.riv&&g.ttl?" · "+coE(g.ttl):""}.`]);
  if(g.pred&&g.pred[1]>2&&g.pred[1]<98)F.push(["","🧮",`ESPN's matchup predictor: ${coE(coT(sp,g.h[0]).s)} ${Math.round(g.pred[1])}% to win.`]);
  return F.length?`<div class="cofacts">${F.map(([c,i,t])=>`<div class="${c==="good"?"up":c==="bad"?"dn":""}">${i} ${t}</div>`).join("")}</div>`:""}
function coGamePage(sp,el,id0){const id=String(id0).replace(/-props$/,""),g=coGame(sp,id);if(!g){el.innerHTML=coHead(sp,"Game not found.")+`<a href="#${sp}">← Games</a>`;return}
  const TS=coV(sp,"TS")||{},RES=coV(sp,"RES")||{},L=coLine(sp,g),M=coModel(sp,g),Le=coLeans(sp,g),W=coWin(sp,g),A=TS[g.a[0]]||{},H=TS[g.h[0]]||{},tab=COS.gtab&&!(COS.gtab==="bx"&&g.st==="pre")?COS.gtab:"ov";
  const cmp=(lab,x,y,hi)=>{const bx=x!=null&&y!=null&&x!==y?((x>y)===hi?0:1):-1;return `<tr><td class="${bx===0?"ufbt":""}">${coF(x)}</td><th>${lab}</th><td class="${bx===1?"ufbt":""}">${coF(y)}</td></tr>`};
  const last=t=>(RES[t]||[]).slice(-6).reverse().map(r=>`<a class="ufval" href="#${sp}-box-${r[6]}"><span class="small">${coE(r[0].slice(5))}</span><span>${r[3]==="H"?"vs":"@"} ${coE(r[2])}</span><b class="${r[4]>r[5]?"up":"dn"}">${r[4]>r[5]?"W":"L"} ${r[4]}-${r[5]}</b><span class="small">box →</span></a>`).join("")||`<div class="small">No games yet.</div>`;
  const P=coV(sp,"P")||{},lead=t=>Object.entries(P).filter(([a,p])=>p.t===t&&p.g.length).map(([a,p])=>{const f=sp==="cfb"?(r=>(r[3]||0)+(r[9]||0)+(r[12]||0)):(r=>r[4]||0);return [a,p,p.g.reduce((s,r)=>s+f(r),0)/p.g.length]}).sort((x,y)=>y[2]-x[2]).slice(0,5);
  const tabs=typeof gpTabs!=="undefined"?gpTabs(tab,[["ov","Overview","#"+sp+"-game-"+g.id,'data-cot="ov"'],["mu","Matchup","#"+sp+"-game-"+g.id,'data-cot="mu"'],["h2","H2H","#"+sp+"-game-"+g.id,'data-cot="h2"'],["tr",g.st==="pre"?"Recent":"Box score","#"+sp+"-game-"+g.id,'data-cot="tr"'],...(coPropRows(sp,g).length?[["pr","Props","#"+sp+"-game-"+g.id,'data-cot="pr"']]:[])]):"";
  const linesCard=`<div class="card gplines">${L.sp!=null?`<div class="nbl" style="justify-content:center"><span>Spread <b>${coE(coT(sp,L.sp<=0?g.h[0]:g.a[0]).a)} ${-Math.abs(L.sp)||"PK"}</b></span>${L.tot!=null?`<span>Total <b>${L.tot}</b></span>`:""}${L.ml?`<span>Win <b>${coE(coT(sp,g.a[0]).a)} ${coAm(L.ml[0])} / ${coE(coT(sp,g.h[0]).a)} ${coAm(L.ml[1])}</b></span>`:""}</div>`:`<div class="small" style="text-align:center">Sportsbook lines aren't posted yet.</div>`}
    ${W?`<div class="nbwp"><div style="width:${Math.round(W.a*100)}%;background:${coT(sp,g.a[0]).c||"#888"}"></div><div style="width:${100-Math.round(W.a*100)}%;background:${coT(sp,g.h[0]).c||"#555"}"></div></div><div class="nbwpl"><span>${coE(coT(sp,g.a[0]).a)} ${Math.round(W.a*100)}%</span><span class="small">chance to win (${W.src==="odds"?"from the odds":"our number"})</span><span>${coE(coT(sp,g.h[0]).a)} ${Math.round(W.h*100)}%</span></div>`:""}
    ${M?`<div class="small" style="margin-top:6px;text-align:center">Our number: <b>${coE(coT(sp,M.m>=0?g.h[0]:g.a[0]).a)} by ${coF(Math.abs(M.m))}</b>, total <b>${coF(M.tot)}</b> <span class="small">(before blending with the line: ${coF(Math.abs(M.raw.m))}, ${coF(M.raw.tot)})</span> · prices: ${coE(L.src)}</div>`:""}${typeof glBtns!=="undefined"?glBtns(sp,g):""}</div>`;
  let body="";
  if(tab==="pr")body=coProps(sp,g)||`<div class="card small">No player props posted for this game.</div>`;
  else if(tab==="h2")body=coH2H(sp,g);
  else if(tab==="mu")body=coMatchup(sp,g)+`<div class="card"><h2>Team comparison <span class="small">· per game this season</span></h2><div class="nbatbl"><table class="uftape"><thead><tr><th>${coE(coT(sp,g.a[0]).a)}</th><th></th><th>${coE(coT(sp,g.h[0]).a)}</th></tr></thead><tbody>
    <tr><td>${A.w??"–"}-${A.g!=null?A.g-A.w:"–"}</td><th>Record (D-I / FBS games)</th><td>${H.w??"–"}-${H.g!=null?H.g-H.w:"–"}</td></tr>${cmp("Points scored",A.pf,H.pf,true)}${cmp("Points allowed",A.pa,H.pa,false)}${cmp("Scored, last 5",A.pf5,H.pf5,true)}${cmp("Allowed, last 5",A.pa5,H.pa5,false)}${cmp("Margin",A.pf!=null?A.pf-A.pa:null,H.pf!=null?H.pf-H.pa:null,true)}</tbody></table></div></div>
    <div class="grid g2">${[g.a[0],g.h[0]].map(t=>`<div class="card"><h2>${coBadge(sp,t)} ${coE(coT(sp,t).s)} leaders</h2>${lead(t).map(([a,p,v])=>`<a class="ufval" href="#${sp}-player-${a}"><b>${coE(p.n)}</b><span class="small">${coE(p.p)}</span><span>${coF(v)} ${sp==="cfb"?"yds":"pts"}/g</span></a>`).join("")||`<div class="small">–</div>`}</div>`).join("")}</div>`;
  else if(tab==="tr"&&g.st!=="pre"){location.hash=sp+"-box-"+g.id;return}
  else if(tab==="tr")body=`<div class="grid g2">${[g.a[0],g.h[0]].map(t=>`<div class="card"><h2>${coBadge(sp,t)} ${coE(coT(sp,t).s)} last 6</h2>${last(t)}</div>`).join("")}</div>${(()=>{const s=t=>(RES[t]||[]).map(r=>r[4]+r[5]),av=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null,ta=av(s(g.a[0])),th=av(s(g.h[0]));return L.tot!=null&&ta!=null&&th!=null?`<div class="card"><h2>Totals</h2><div class="nbsay">${coE(coT(sp,g.a[0]).s)} games average <b>${coF(ta)}</b> total points, ${coE(coT(sp,g.h[0]).s)} games <b>${coF(th)}</b> — the line is <b>${L.tot}</b>.</div><div class="small">${coE(coT(sp,g.a[0]).a)} went over ${L.tot} in ${s(g.a[0]).filter(x=>x>L.tot).length}/${s(g.a[0]).length}, ${coE(coT(sp,g.h[0]).a)} in ${s(g.h[0]).filter(x=>x>L.tot).length}/${s(g.h[0]).length}.</div></div>`:""})()}`;
  else body=(g.st==="post"?`<div class="card"><h2>Final</h2><div class="nbsay">${coE(coT(sp,+g.a[3]>+g.h[3]?g.a[0]:g.h[0]).n)} won ${Math.max(+g.a[3],+g.h[3])}–${Math.min(+g.a[3],+g.h[3])}.${L.sp!=null?` ${(()=>{const m=(+g.h[3])-(+g.a[3])+L.sp;return m===0?"Push against the spread":`${coE(coT(sp,m>0?g.h[0]:g.a[0]).a)} covered`})()}.`:""}${L.tot!=null?` Total ${(+g.a[3])+(+g.h[3])} — ${(+g.a[3])+(+g.h[3])>L.tot?"over":(+g.a[3])+(+g.h[3])<L.tot?"under":"push"} ${L.tot}.`:""}</div></div>`
      :(typeof gpSummary!=="undefined"?gpSummary({pick:(()=>{const M=coModel(sp,g);return M?`🔮 Predicted score: <b>${coE(coT(sp,g.a[0]).a)} ${coSc(M)[0]} – ${coSc(M)[1]} ${coE(coT(sp,g.h[0]).a)}</b><br>`:""})()+(Le.length?`<b>${coE(Le[0].txt)}</b> <span class="small">${Le[0].k.toLowerCase()} · ${coF(Le[0].edge)} ${CO[sp].unit} off the market${Le[0].odds!=null?" · "+coAm(Le[0].odds):""}</span>`:M?`Our estimate: <b>${coE(coT(sp,M.m>=0?g.h[0]:g.a[0]).s)} by ${coF(Math.abs(M.m))}</b>, total ${coF(M.tot)} — no strong lean`:""),props:[]}):""))
    +linesCard+(typeof gpMerge!=="undefined"?gpMerge("What matters","gpwm",[coFacts(sp,g)])+gpMerge("Injuries","gpinj",[`<div class="grid g2">${[g.a[0],g.h[0]].map(t=>`<div><h3 class="nhh3">${coE(coT(sp,t).s)}</h3>${coInj(sp,t)}</div>`).join("")}</div>`])+gpMerge("Recent form","gpone",[`<div class="grid g2">${[g.a[0],g.h[0]].map(t=>`<div><h3 class="nhh3">${coE(coT(sp,t).s)}</h3>${last(t)}</div>`).join("")}</div>`]):"");
  el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"All games"):`<a href="#${sp}">← All games</a>`}</p>
   <div class="gh"><div class="ght">${coBadge(sp,g.a[0])}<b><a href="#${sp}-team-${g.a[0]}">${coTN(sp,g.a[0])}</a></b><span class="small">${coE(g.a[1])}</span>${g.st!=="pre"?`<b class="cosc">${coE(g.a[3])}</b>`:""}</div>
    <div class="ghm"><b>${g.st==="in"?coE(g.det):g.st==="post"?"Final":(coWhen(g.t).split(" · ")[1]||"")}</b><span class="small">${coWhen(g.t).split(" · ")[0]}${g.neu?" · neutral":""}</span>${g.tv?`<span class="small">${coE(g.tv)}</span>`:""}</div>
    <div class="ght">${coBadge(sp,g.h[0])}<b><a href="#${sp}-team-${g.h[0]}">${coTN(sp,g.h[0])}</a></b><span class="small">${coE(g.h[1])}</span>${g.st!=="pre"?`<b class="cosc">${coE(g.h[3])}</b>`:""}</div></div>
   ${tabs}<div id="gpBody">${body}</div>`;
  el.querySelectorAll("[data-cot]").forEach(a=>a.onclick=e=>{e.preventDefault();COS.gtab=a.dataset.cot;coGamePage(sp,el,g.id)})}
function coPlayerPage(sp,el,aid){const p=(coV(sp,"P")||{})[aid];if(!p){el.innerHTML=coHead(sp,"Player not found.")+`<a href="#${sp}">← Games</a>`;return}const C=CO[sp],R=p.g,n=R.length||1,av=f=>R.reduce((s,r)=>s+(+f(r)||0),0)/n;
  const nx=coGames(sp).find(g=>g.st==="pre"&&(g.a[0]===p.t||g.h[0]===p.t));
  const strip=sp==="cfb"?[["Pass yds",coF(av(r=>r[3]))],["Rush yds",coF(av(r=>r[9]))],["Rec",coF(av(r=>r[11]))],["Rec yds",coF(av(r=>r[12]))],["TDs",R.reduce((s,r)=>s+(r[6]||0)+(r[10]||0)+(r[13]||0),0)]].filter(x=>+x[1]>0||x[0]==="TDs"):[["PTS",coF(av(r=>r[4]))],["REB",coF(av(r=>r[11]))],["AST",coF(av(r=>r[12]))],["3PM",coF(av(r=>r[7]))],["MIN",coF(av(r=>r[3]))],["FG%",(()=>{const m=R.reduce((s,r)=>s+(r[5]||0),0),a=R.reduce((s,r)=>s+(r[6]||0),0);return a?(m/a*100).toFixed(1):"–"})()]];
  el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"Back"):""}</p><div class="phead tch" style="--tc:${coT(sp,p.t).c||"#555"}"><div>${coBadge(sp,p.t)}</div><div><h1 style="margin:0">${coE(p.n)}</h1><div class="small">${coE(p.p)} · <a href="#${sp}-team-${p.t}">${coE(coT(sp,p.t).n)}</a>${nx?` · next: ${nx.a[0]===p.t?"@":"vs"} ${coE(coT(sp,nx.a[0]===p.t?nx.h[0]:nx.a[0]).s)} ${coWhen(nx.t)}`:""}</div></div></div>
   ${typeof xStrip!=="undefined"?xStrip(strip.map(x=>[x[0],x[1],""]),`Per game · ${R.length} games this season${sp==="cfb"?" (TDs total)":""}`):""}
   <div class="card"><h2>Game log</h2><div class="nbatbl"><table class="bxt"><thead><tr><th>Date</th><th>Opp</th>${C.cols.map(c=>`<th>${c[0]}</th>`).join("")}</tr></thead><tbody>${R.slice().reverse().map(r=>`<tr><td>${coE(r[0].slice(5))}</td><td>${r[2]==="H"?"vs":"@"} ${coE(r[1])}</td>${C.cols.map(c=>`<td>${coE(c[1](r.slice(0))??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="small">ESPN box scores.</div></div>`}
function coTeamPage(sp,el,tid){const T=coT(sp,tid),TS=(coV(sp,"TS")||{})[tid]||{},R=(coV(sp,"RES")||{})[tid]||[],P=coV(sp,"P")||{};const nx=coGames(sp).filter(g=>g.a[0]===tid||g.h[0]===tid);
  const roster=Object.entries(P).filter(([a,p])=>p.t===tid).map(([a,p])=>{const n=p.g.length||1,f=sp==="cfb"?(r=>(r[3]||0)+(r[9]||0)+(r[12]||0)):(r=>r[4]||0);return [a,p,p.g.reduce((s,r)=>s+f(r),0)/n]}).sort((x,y)=>y[2]-x[2]);
  el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"Back"):""}</p><div class="phead tch" style="--tc:${T.c||"#555"}"><div>${coBadge(sp,tid)}</div><div><h1 style="margin:0">${T.rk?`<small class="corank">#${T.rk}</small> `:""}${coE(T.n)}</h1><div class="small">${coE(T.cf||"")}${TS.g?` · ${TS.w}-${TS.g-TS.w} vs D-I`:""}</div></div></div>
   ${typeof xStrip!=="undefined"?xStrip([["Scored",coF(TS.pf)],["Allowed",coF(TS.pa)],["Margin",TS.pf!=null?coF(TS.pf-TS.pa):"–"],["Last 5 scored",coF(TS.pf5)],["Last 5 allowed",coF(TS.pa5)]].map(x=>[x[0],x[1],""]),"Per game this season"):""}
   ${coPower(sp,tid)}${coEffCard(sp,tid)}
   ${nx.length?`<h2 style="margin:12px 0 8px">Next</h2>${nx.map(g=>coRow(sp,g)).join("")}`:""}
   ${(()=>{const X=(coV(sp,"TSX")||{})[tid];return X?`<div class="card"><h2>Stats per game <span class="small">· ${X.n} games with box scores</span></h2><div class="nbatbl"><table class="uftape"><thead><tr><th>${coE(T.a)}</th><th></th><th>Opponents</th></tr></thead><tbody>${CO_ST[sp].map(([lab,f],i)=>{const v=coSV(X.o,f),w=coSV(X.d,f);return v==null&&w==null?"":`<tr><td>${coF(v)} ${coRkTxt(coRk(sp,i,"o",v))}</td><th>${lab}</th><td>${coF(w)} ${coRkTxt(coRk(sp,i,"d",w))}</td></tr>`}).join("")}</tbody></table></div><div class="small">Ranks among the teams playing in the next few days.</div></div>`:""})()}
   ${coBetRec(sp,tid)}
   <div class="card"><h2>🚑 Injuries</h2>${coInj(sp,tid)}</div>
   <div class="card"><h2>Results <span class="small">· tap for the box score</span></h2>${R.slice().reverse().map(r=>`<a class="ufval" href="#${sp}-box-${r[6]}"><span class="small">${coE(r[0].slice(5))}</span><span>${r[3]==="H"?"vs":"@"} ${coE(r[2])}${r[7]?" (N)":""}</span><b class="${r[4]>r[5]?"up":"dn"}">${r[4]>r[5]?"W":"L"} ${r[4]}-${r[5]}</b><span class="small">box →</span></a>`).join("")||`<div class="small">No games yet.</div>`}</div>
   <div class="card"><h2>Players</h2>${roster.slice(0,15).map(([a,p,v])=>`<a class="ufval" href="#${sp}-player-${a}"><b>${coE(p.n)}</b><span class="small">${coE(p.p)} · ${p.g.length} games</span><span>${coF(v)} ${sp==="cfb"?"yds":"pts"}/g</span></a>`).join("")||`<div class="small">No player logs yet.</div>`}</div>`}
function coRankPage(sp,el){const L=coV(sp,"RANK")||[],ours=COS.rk===-1;const k=ours?-1:Math.min(COS.rk||0,Math.max(0,L.length-1)),R=ours?null:L[k];
  el.innerHTML=`${coHead(sp,"Rankings")}<div class="seg">${L.map((x,i)=>`<button class="${i===k?"on":""}" data-cork="${i}">${coE(x.n)}</button>`).join("")}<button class="${ours?"on":""}" data-cork="-1">📈 Our ratings</button></div>
   ${ours?coOurRank(sp):R?`<div class="card">${R.r.map(([rk,tid,rec,tr])=>{const nx=coGames(sp).find(g=>g.st==="pre"&&(g.a[0]===tid||g.h[0]===tid));return `<div class="ufval"><b>#${rk}</b><a href="#${sp}-team-${tid}">${coBadge(sp,tid)} ${coE(coT(sp,tid).n)}</a><span class="small">${coE(rec)}${tr&&tr!=="-"?" · "+coE(tr):""}</span>${nx?`<a class="small" href="#${sp}-game-${nx.id}">${nx.a[0]===tid?"@":"vs"} ${coE(coT(sp,nx.a[0]===tid?nx.h[0]:nx.a[0]).a)} · ${coWhen(nx.t).split(" · ")[0]}</a>`:`<span class="small">–</span>`}</div>`}).join("")}</div>`:`<div class="card small">Rankings load with the data.</div>`}`;
  el.querySelectorAll("[data-cork]").forEach(b=>b.onclick=()=>{COS.rk=+b.dataset.cork;coRankPage(sp,el)})}
function coRoute(sp,h){const el=document.getElementById("v-"+sp);if(!el)return;
  if(!coOk(sp)){el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Loading ${CO[sp].nm.toLowerCase()}…</div>`;coEnsure(sp,()=>{if(!coOk(sp)){el.innerHTML=`<div class="card">${CO[sp].nm} data isn't ready yet — it comes with the next data update.</div>`;return}if((location.hash||"").slice(1).startsWith(sp))coRoute(sp,decodeURIComponent((location.hash||"").slice(1)))});return}
  if(!(typeof LO!=="undefined"&&LO.data)&&!COS["w"+sp]){COS["w"+sp]=1;let n=0;const t=setInterval(()=>{n++;if(typeof LO!=="undefined"&&LO.data){clearInterval(t);const hh=decodeURIComponent((location.hash||"").slice(1));if(hh.startsWith(sp)){const y=scrollY;coRoute(sp,hh);scrollTo(0,y)}}else if(n>20)clearInterval(t)},500)}
  coLiveStart(sp);const r=h.slice(sp.length);if(r.startsWith("-game-"))return coGamePage(sp,el,r.slice(6));if(r.startsWith("-player-"))return coPlayerPage(sp,el,r.slice(8));if(r.startsWith("-team-"))return coTeamPage(sp,el,r.slice(6));
  if(r.startsWith("-box-"))return coBoxPage(sp,el,r.slice(5));if(r==="-picks"||r==="-props"||r==="-best")return coPicksPage(sp,el);if(r==="-rank")return coRankPage(sp,el);if(r==="-stand")return coStandPage(sp,el);if(r==="-pickem"){coPicksPage(sp,el);setTimeout(()=>{const x=document.getElementById("pickem");x&&x.scrollIntoView()},50);return}if(r==="-more")return coMorePage(sp,el);if(r==="-big")return coBigPage(sp,el);if(r==="-bracket")return coBracketPage(sp,el);if(r==="-lead")return coLeadPage(sp,el);return coGamesPage(sp,el)}

/* ---------- 💪 strength of schedule: power rating, schedule strength ---------- */
function coOrd(n){return n+(n%10===1&&n%100!==11?"st":n%10===2&&n%100!==12?"nd":n%10===3&&n%100!==13?"rd":"th")}
/* ratings for this division only (teams with a conference), ranked 1..n */
/* the division: teams in the conference standings (falls back to teams with a conference) */
let CO_DV={};function coInDiv(sp,t){if(!CO_DV[sp]){const S=coV(sp,"STAND")||[],D=new Set();S.forEach(g=>(g.r||[]).forEach(r=>D.add(String(r[0]))));CO_DV[sp]=D}return CO_DV[sp].size?CO_DV[sp].has(String(t)):!!coT(sp,t).cf}
function coConf(sp,t){const c=coT(sp,t).cf;if(c)return c;const g=(coV(sp,"STAND")||[]).find(g=>(g.r||[]).some(r=>String(r[0])===String(t)));return g?g.n.replace(/\s*-\s*(East|West|North|South)$/,""):""}
let CO_TR={};function coTR(sp){if(CO_TR[sp])return CO_TR[sp];const T=coV(sp,"TR")||{},O={};Object.entries(T).filter(([t])=>coInDiv(sp,t)).sort((a,b)=>b[1].r-a[1].r).forEach(([t,v],i)=>O[t]=Object.assign({},v,{rk:i+1}));return CO_TR[sp]=O}
let CO_SOS={};function coSOS(sp){if(CO_SOS[sp])return CO_SOS[sp];const TR=coTR(sp),RES=coV(sp,"RES")||{},S={};
  for(const [t,L] of Object.entries(RES)){if(!coInDiv(sp,t))continue;const v=L.map(r=>TR[r[1]]).filter(Boolean).map(x=>x.r);if(v.length)S[t]=v.reduce((a,b)=>a+b,0)/v.length}
  Object.entries(S).sort((a,b)=>b[1]-a[1]).forEach(([t,v],i)=>S[t]={v,rk:i+1,of:Object.keys(S).length});return CO_SOS[sp]=S}
function coPower(sp,tid){const TR=coTR(sp),R=TR[tid];if(!R)return "";const n=Object.keys(TR).length,S=coSOS(sp)[tid];
  return `<div class="card"><h2>💪 Power rating <span class="small">· adjusted for strength of schedule</span></h2><div class="xstrip">
   <div><b>${coOrd(R.rk)}</b><span>of ${n}</span><small>${R.r>0?"+":""}${coF(R.r)} pts vs average</small></div>
   <div><b>${R.o>0?"+":""}${coF(R.o)}</b><span>Offense</span><small>pts above avg</small></div>
   <div><b>${R.d>0?"+":""}${coF(R.d)}</b><span>Defense</span><small>pts allowed vs avg (− = better)</small></div>
   ${S?`<div><b>${coOrd(S.rk)}</b><span>Schedule so far</span><small>of ${S.of} · 1st = hardest</small></div>`:""}</div>
   <div class="small">From ${R.g} games against ${CO[sp].U==="CFB"?"FBS":"Division I"} teams. Each result is compared with what those opponents usually score and allow; margins over ${sp==="cfb"?28:22} count as ${sp==="cfb"?28:22}.</div></div>`}
function coPowerVs(sp,g){const TR=coTR(sp),A=TR[g.a[0]],H=TR[g.h[0]];if(!A||!H)return "";const S=coSOS(sp),sa=S[g.a[0]],sh=S[g.h[0]],an=coT(sp,g.a[0]).a,hn=coT(sp,g.h[0]).a;
  const row=(l,a,h)=>`<tr><td>${a}</td><th>${l}</th><td>${h}</td></tr>`,sg=v=>(v>0?"+":"")+coF(v);
  const BR=t=>{const A_=(coV(sp,"ATS")||{})[t]||[];let c=[0,0],o=[0,0];for(const r of A_){const m=r[3]-r[4]+r[5],x=r[3]+r[4]-r[6];if(m)c[m>0?0:1]++;if(x)o[x>0?0:1]++}return A_.length?[`${c[0]}-${c[1]}`,`${o[0]}-${o[1]}`]:["–","–"]},ba=BR(g.a[0]),bh=BR(g.h[0]);
  return `<div class="card"><h2>💪 Power + betting record</h2><div class="nbatbl"><table class="uftape"><thead><tr><th>${coE(an)}</th><th></th><th>${coE(hn)}</th></tr></thead><tbody>
   ${row("Power rank",coOrd(A.rk),coOrd(H.rk))}${row("Rating (pts)",sg(A.r),sg(H.r))}${row("Offense",sg(A.o),sg(H.o))}${row("Defense (− better)",sg(A.d),sg(H.d))}${row("Schedule rank",sa?coOrd(sa.rk):"–",sh?coOrd(sh.rk):"–")}${(()=>{const EF=coEF(sp),EL=coV(sp,"EFFLG"),x=EF[g.a[0]],y=EF[g.h[0]];if(!EL||!x||!y)return "";const u=sp==="cfb"?"plays":"poss.";return row(`Offense per 100 ${u}`,coF(EL[0]+x.o),coF(EL[0]+y.o))+row(`Defense per 100 ${u}`,coF(EL[0]+x.d),coF(EL[0]+y.d))+row(sp==="cfb"?"Plays per game":"Tempo (poss./game)",coF(EL[1]+x.t),coF(EL[1]+y.t))})()}${row("Home edge (pts)",A.h!=null?coF(A.h):"–",H.h!=null?coF(H.h):"–")}${row("Vs spread",ba[0],bh[0])}${row("Over / under",ba[1],bh[1])}${(()=>{if(typeof xSplits==="undefined")return "";const R=t=>((coV(sp,"ATS")||{})[t]||[]).map(r=>({home:r[2]==="H",sp:r[5],tot:r[6],pf:r[3],pa:r[4]})),A=xSplits(R(g.a[0])).road,H=xSplits(R(g.h[0])).home;
   return g.neu?"":row("Record (road / home)",xRec(A[0]),xRec(H[0]))+row("Vs spread (road / home)",xRec(A[1]),xRec(H[1]))+row("O/U (road / home)",xRec(A[2]),xRec(H[2]))})()}</tbody></table></div>
   <div class="small">Ratings adjusted for strength of schedule. Spread / total records use ESPN's closing lines.</div></div>`}
/* ---------- 📒 against the spread / over-under (closing lines) ---------- */
function coBetRec(sp,tid){const A=(coV(sp,"ATS")||{})[tid]||[];if(!A.length||typeof xBetRec==="undefined")return "";
  return xBetRec(A.map(r=>({d:String(r[0]).slice(5),opp:r[1],home:r[2]==="H",sp:r[5],tot:r[6],pf:r[3],pa:r[4]})),{src:"ESPN (DraftKings)"})}
/* ---------- 📊 conference standings + 🏈 playoff picture ---------- */
const CO_AUTO=[["SEC",/^SEC$|Southeastern/],["Big Ten",/Big Ten/],["Big 12",/Big 12/],["ACC",/^ACC$|Atlantic Coast/]],CO_G6=/American|Conference USA|C-USA|Mid-American|^MAC$|Mountain West|Pac-12|Sun Belt/;
function coStandCf(sp,grp){const c={};for(const r of grp.r){const f=coT(sp,r[0]).cf||"";if(f)c[f]=(c[f]||0)+1}return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(x=>x[0])[0]||grp.n}
function coCFP(sp){if(sp!=="cfb")return "";const RK=coV(sp,"RANK")||[],P=RK.find(x=>/playoff|cfp/i.test(x.n));const ST=coV(sp,"STAND")||[];
  if(!P||!P.r||!P.r.length)return `<div class="card"><h2>🏈 Playoff picture</h2><div class="small">Shows once the committee's rankings are out (weekly from early November).</div></div>`;
  const rk={};P.r.forEach(r=>rk[r[1]]=+r[0]);const R=t=>rk[t]||99;
  /* projected champion = the team at the top of each conference's standings */
  const leaders={};for(const g of ST){if(!g.r||!g.r.length)continue;const cf=coStandCf(sp,g);if(!leaders[cf])leaders[cf]=g.r[0][0]}
  const auto=[];for(const [nm,re] of CO_AUTO){const cf=Object.keys(leaders).find(c=>re.test(c));if(cf)auto.push({t:leaders[cf],why:nm+" leader"})}
  const g6=P.r.map(r=>r[1]).filter(t=>CO_G6.test(coT(sp,t).cf||"")).sort((a,b)=>R(a)-R(b))[0];if(g6)auto.push({t:g6,why:"Top Group of Six"});
  const nd=Object.keys(coV(sp,"TM")||{}).find(t=>/Notre Dame/.test(coT(sp,t).n));const inn=new Set(auto.map(x=>x.t));
  const F=auto.slice();if(nd&&R(nd)<=12&&!inn.has(nd)){F.push({t:nd,why:"Notre Dame, top 12"});inn.add(nd)}
  for(const r of P.r){if(F.length>=12)break;if(!inn.has(r[1])){F.push({t:r[1],why:"At-large"});inn.add(r[1])}}
  while(F.length>12){const i=F.map((x,j)=>[x,j]).filter(([x])=>x.why==="At-large").sort((a,b)=>R(b[0].t)-R(a[0].t))[0];if(!i)break;F.splice(i[1],1)}
  const S=F.slice().sort((a,b)=>R(a.t)-R(b.t));const out=P.r.filter(r=>!inn.has(r[1])).slice(0,4);
  const tm=(x,i)=>`<a class="ufval" href="#${sp}-team-${x.t}"><b>${i+1}</b><span>${coBadge(sp,x.t)} ${coE(coT(sp,x.t).s||coT(sp,x.t).n)}</span><span class="small">${rk[x.t]?"CFP #"+rk[x.t]:"unranked"} · ${coE(x.why)}</span></a>`;
  const pair=(a,b)=>`<div class="ufval"><span>${S[a-1]?coE(coT(sp,S[a-1].t).a):"?"} <span class="small">(${a})</span> vs ${S[b-1]?coE(coT(sp,S[b-1].t).a):"?"} <span class="small">(${b})</span></span><span class="small">at ${S[a-1]?coE(coT(sp,S[a-1].t).a):"?"}</span></div>`;
  return `<div class="card"><h2>🏈 Playoff picture <span class="small">· if it ended today</span></h2>
   <div class="small" style="margin-bottom:6px">From the latest committee rankings (${coE(P.n)}). In: the SEC, Big Ten, Big 12 and ACC champions, the top Group of Six team, Notre Dame if it's top 12, then the highest-ranked others. Today's conference leaders stand in for the champions. Seeds 1–4 (first-round byes) go to the four highest-ranked teams.</div>
   <h3 style="margin:8px 0 4px">Byes</h3>${S.slice(0,4).map(tm).join("")}
   <h3 style="margin:10px 0 4px">First round (Dec 18–19, higher seed hosts)</h3>${pair(5,12)}${pair(6,11)}${pair(7,10)}${pair(8,9)}
   <h3 style="margin:10px 0 4px">Seeds 5–12</h3>${S.slice(4).map((x,i)=>tm(x,i+4)).join("")}
   ${out.length?`<h3 style="margin:10px 0 4px">First out</h3>${out.map(r=>`<a class="ufval" href="#${sp}-team-${r[1]}"><span>${coBadge(sp,r[1])} ${coE(coT(sp,r[1]).s||coT(sp,r[1]).n)}</span><span class="small">CFP #${r[0]} · ${coE(r[2]||"")}</span></a>`).join("")}`:""}</div>`}
function coStandPage(sp,el){const ST=(coV(sp,"STAND")||[]).filter(g=>g.r&&g.r.length);const names=ST.map(g=>g.n);
  const P5=/SEC|Southeastern|Big Ten|Big 12|ACC|Atlantic Coast|Big East/;let k=COS.st&&COS.st[sp]!=null?COS.st[sp]:Math.max(0,names.findIndex(n=>P5.test(n)));if(k>=ST.length)k=0;const G=ST[k],TR=coTR(sp);
  el.innerHTML=`${coHead(sp,"Standings")}${coCFP(sp)}
   ${ST.length?`<div class="card"><h2>📊 Conference standings</h2><select data-cost style="width:100%;margin-bottom:8px">${ST.map((g,i)=>`<option value="${i}"${i===k?" selected":""}>${coE(g.n)}</option>`).join("")}</select>
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Team</th><th>Conf</th><th>Overall</th><th>Streak</th><th>Power</th></tr></thead><tbody>
   ${G.r.map((r,i)=>`<tr><td>${i+1}</td><td><a href="#${sp}-team-${r[0]}">${coBadge(sp,r[0])} ${coT(sp,r[0]).rk?`<small class="corank">${coT(sp,r[0]).rk}</small> `:""}${coE(coT(sp,r[0]).s||coT(sp,r[0]).n)}</a></td><td>${coE(r[1]||"–")}</td><td>${coE(r[2]||"–")}</td><td>${coE(r[3]||"")}</td><td>${TR[r[0]]?coOrd(TR[r[0]].rk):"–"}</td></tr>`).join("")}</tbody></table></div>
   <div class="small">Standings from ESPN. Power = our strength-of-schedule rating rank.</div></div>`:`<div class="card small">Standings come with the next data update.</div>`}`;
  const s=el.querySelector("[data-cost]");if(s)s.onchange=()=>{(COS.st=COS.st||{})[sp]=+s.value;coStandPage(sp,el)}}
/* ---------- 🏅 leaderboards (every box score this season) ---------- */
function coLeadPage(sp,el){const L=coV(sp,"LEAD")||{},cats=Object.keys(L);const c=cats.includes((COS.ld||{})[sp])?COS.ld[sp]:cats[0],P=coV(sp,"P")||{};
  const tot=sp==="cfb";el.innerHTML=`${coHead(sp,"Leaders")}${cats.length?`<div class="seg" style="margin-bottom:8px;flex-wrap:wrap">${cats.map(x=>`<button class="${x===c?"on":""}" data-cold="${coE(x)}">${coE(x)}</button>`).join("")}</div>
   <div class="card"><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Player</th><th>${tot?"Total":"Per game"}</th><th>${tot?"Per game":"Total"}</th><th>GP</th></tr></thead><tbody>
   ${(L[c]||[]).map((r,i)=>{const nm=P[r[0]]?`<a href="#${sp}-player-${r[0]}"><b>${coE(r[1])}</b></a>`:`<b>${coE(r[1])}</b>`;return `<tr><td>${i+1}</td><td>${nm} <span class="small">${coE(r[3]||"")} · <a href="#${sp}-team-${r[2]}">${coE(coT(sp,r[2]).a)}</a></span></td><td><b>${tot?r[5]:coF(r[4])}</b></td><td>${tot?coF(r[4]):r[5]}</td><td>${r[6]}</td></tr>`}).join("")}</tbody></table></div>
   <div class="small">${tot?"Ranked by season total":"Ranked by per-game average"} · minimum 3 games · from ESPN box scores of every ${sp==="cfb"?"FBS":"Division I"} game this season.</div></div>`:`<div class="card small">Leaderboards come with the next data update.</div>`}`;
  el.querySelectorAll("[data-cold]").forEach(b=>b.onclick=()=>{(COS.ld=COS.ld||{})[sp]=b.dataset.cold;coLeadPage(sp,el)})}
/* ---------- 🔴 live scores: ESPN scoreboard every 30 s while a college page is open and games are on ---------- */
const CO_PATH={cfb:["football/college-football",80],cbb:["basketball/mens-college-basketball",50]};
function coLiveStart(sp){if(COS["lv"+sp])return;COS["lv"+sp]=1;const tick=async()=>{try{
    const h=(location.hash||"").slice(1),onBets=h==="bets"&&typeof betsLoad!=="undefined"&&betsLoad().some(b=>((b.k==="col"||b.k==="colg"||b.k==="gl")&&b.sp===sp)||(b.k==="parlay"&&(b.legs||[]).some(l=>l.sp===sp)));if(!(h.startsWith(sp)||onBets)||document.hidden||!coOk(sp))return;
    const G=coV(sp,"G")||[],now=Date.now(),on=G.filter(g=>g.st==="in"||(g.st==="pre"&&new Date(g.t).getTime()<=now+5*60e3&&new Date(g.t).getTime()>now-6*3600e3));if(!on.length)return;
    const days=[...new Set(on.map(g=>coDay(g.t).replace(/-/g,"")))];let ch=0;
    for(const d of days){const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${CO_PATH[sp][0]}/scoreboard?groups=${CO_PATH[sp][1]}&limit=400&dates=${d}`);if(!r.ok)continue;const J=await r.json();
      for(const e of J.events||[]){const g=G.find(x=>String(x.id)===String(e.id));if(!g)continue;const c=(e.competitions||[{}])[0],st=(c.status||{}).type||{};
        for(const x of c.competitors||[]){const s=String((x.team||{}).id)===String(g.h[0])?g.h:String((x.team||{}).id)===String(g.a[0])?g.a:null;if(s&&x.score!=null&&s[3]!==x.score){s[3]=x.score;ch=1}}
        if(st.state&&(st.state!==g.st||st.shortDetail!==g.det)){g.st=st.state;g.det=st.shortDetail||g.det;ch=1}}}
    if(ch&&onBets&&typeof viewBets!=="undefined"){const y=scrollY;viewBets();scrollTo(0,y)}
    if(ch&&(location.hash||"").slice(1).startsWith(sp)){const y=scrollY;coRoute(sp,decodeURIComponent((location.hash||"").slice(1)));scrollTo(0,y)}
  }catch(e){}};setInterval(tick,30000);setTimeout(tick,1500)}

/* ---------- 🌦️ weather at kickoff (outdoor football; Open-Meteo forecast) ---------- */
function coWxCode(c){return c==null?"":c===0?"clear":c<=3?"cloudy":c===45||c===48?"fog":c>=51&&c<=67?"rain":c>=71&&c<=77?"snow":c>=80&&c<=82?"showers":c===85||c===86?"snow showers":c>=95?"thunderstorms":""}
function coWx(sp,g){const W=(coV(sp,"WX")||{})[g.id];return W&&W[0]!=null?W:null}
function coWxTxt(sp,g){const W=coWx(sp,g);if(!W)return g.ind&&sp==="cfb"?"Indoors — no weather.":"";const [t,w,gu,pp,c]=W,d=coWxCode(c);
  return `Kickoff forecast: <b>${Math.round(t)}°F</b>, wind <b>${Math.round(w)} mph</b>${gu!=null&&gu>=w+8?` (gusts ${Math.round(gu)})`:""}${pp!=null?`, ${Math.round(pp)}% chance of rain`:""}${d?` · ${d}`:""}.${w>=15||gu>=25?" Strong wind usually cuts passing and kicking — it tends to hold totals down.":t<=32?" Freezing cold can slow passing games.":pp>=60?" Wet ball: more running, fewer big plays.":""}`}
function coChips(sp,g){const C=[];if(g.riv)C.push(`🔥 ${coE(g.riv)}`);if(g.ttl)C.push(`🏆 ${coE(g.ttl)}`);const W=coWx(sp,g);if(W&&g.st==="pre")C.push(`${W[1]>=15||W[2]>=25?"🌬️":coWxCode(W[4])==="rain"||coWxCode(W[4])==="showers"?"🌧️":coWxCode(W[4]).includes("snow")?"❄️":"🌤️"} ${Math.round(W[0])}° · ${Math.round(W[1])} mph`);
  if(g.st==="pre")for(const s of [g.a,g.h])for(const r of coRest(sp,g,s[0]))C.push(`${r[0]} ${coE(coT(sp,s[0]).a)} ${r[2]}`);
  return C.length?`<div class="spotl" style="flex-wrap:wrap;gap:4px">${C.map(c=>`<span class="pll">${c}</span>`).join("")}</div>`:""}
/* ---------- 😴 tired legs: rest days, games in a few days, road trips (from each team's results) ---------- */
function coRest(sp,g,t){const R=((coV(sp,"RES")||{})[t]||[]).filter(r=>r[0]<coDay(g.t));if(!R.length)return [];const day=x=>Date.parse(x+"T12:00:00Z"),gd=day(coDay(g.t)),last=R[R.length-1],rest=Math.round((gd-day(last[0]))/864e5);
  const out=[],away=!g.neu&&g.a[0]===t;let road=away?1:0;if(away)for(let i=R.length-1;i>=0&&R[i][3]==="A"&&!R[i][7];i--)road++;
  if(sp==="cbb"){const n4=R.filter(r=>gd-day(r[0])<=4*864e5).length;if(rest<=1)out.push(["😴","2nd game in 2 days","on no rest"]);else if(n4>=2)out.push(["😴",`${n4+1}${n4+1===3?"rd":"th"} game in 5 days`,`${n4+1} games / 5 days`]);if(road>=3)out.push(["🧳",`${road}${road===3?"rd":"th"} straight road game`,`road game #${road}`])}
  else{if(rest<=5)out.push(["😴",`short week (${rest} days since the last game)`,"short week"]);else if(rest>=13)out.push(["🔋",`coming off a bye (${rest} days rest)`,"off a bye"]);if(road>=3)out.push(["🧳",`${road}${road===3?"rd":"th"} straight road game`,`road game #${road}`])}
  const mi=((coV(sp,"TRV")||{})[g.id]||{})[g.a[0]===t?"a":"h"];if(mi!=null&&mi>=(sp==="cbb"?800:1200))out.push(["✈️",`traveled about ${mi.toLocaleString()} miles since the last game`,`${(Math.round(mi/100)*100).toLocaleString()} mi trip`]);
  return out}
/* ---------- ⚡ pace + efficiency card ---------- */
/* pace + efficiency for this division only, ranked 1..n by net */
let CO_EF={};function coEF(sp){if(CO_EF[sp])return CO_EF[sp];const E=coV(sp,"EFF")||{},O={};Object.entries(E).filter(([t])=>coInDiv(sp,t)).sort((a,b)=>(b[1].o-b[1].d)-(a[1].o-a[1].d)).forEach(([t,v],i)=>O[t]=Object.assign({},v,{rk:i+1}));return CO_EF[sp]=O}
function coEffCard(sp,tid){const EF=coEF(sp),EL=coV(sp,"EFFLG"),x=EF[tid],T=coTR(sp)[tid];if(!EL||!x)return "";const n=Object.keys(EF).length,u=sp==="cfb"?"plays":"possessions";
  const rk=(f,lo)=>{const v=Object.values(EF).map(f).sort((a,b)=>lo?a-b:b-a);return v.indexOf(f(x))+1};
  return `<div class="card"><h2>⚡ ${sp==="cfb"?"Pace + efficiency":"Tempo + efficiency"} <span class="small">· adjusted for opponents</span></h2><div class="xstrip">
   <div><b>${coF(EL[0]+x.o)}</b><span>Offense</span><small>pts / 100 ${u} · ${coOrd(rk(e=>e.o))}</small></div>
   <div><b>${coF(EL[0]+x.d)}</b><span>Defense</span><small>allowed / 100 · ${coOrd(rk(e=>e.d,1))}</small></div>
   <div><b>${(x.o-x.d)>0?"+":""}${coF(x.o-x.d)}</b><span>Net</span><small>${coOrd(x.rk)} of ${n}</small></div>
   <div><b>${coF(EL[1]+x.t)}</b><span>${sp==="cfb"?"Plays / game":"Tempo"}</span><small>${coOrd(rk(e=>e.t))} fastest</small></div>
   ${T&&T.h!=null?`<div><b>${coF(T.h)}</b><span>Home edge</span><small>pts (${T.hn[0]} home / ${T.hn[1]} road games)</small></div>`:""}</div>
   <div class="small">${sp==="cfb"?"Plays = runs + passes":"Possessions = shots − offensive rebounds + turnovers + 0.475 × free throws"}, from ESPN box scores of ${x.g} games vs the division. Average: ${coF(EL[0])} pts / 100, ${coF(EL[1])} ${u} a game. Home edge = how much better this team does at home than on the road against what its ratings expect (pulled toward the usual ${CO[sp].hfa} until there are more games).</div></div>`}
function coOurRank(sp){const TR=coTR(sp),EF=coV(sp,"EFF")||{},EL=coV(sp,"EFFLG"),L=Object.entries(TR).sort((a,b)=>a[1].rk-b[1].rk).slice(0,50);if(!L.length)return `<div class="card small">Our ratings come with the next data update.</div>`;
  return `<div class="card"><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Team</th><th>Rating</th>${EL?`<th>Off</th><th>Def</th><th>${sp==="cfb"?"Plays":"Tempo"}</th>`:""}</tr></thead><tbody>
   ${L.map(([t,v])=>{const e=EF[t];return `<tr><td>${v.rk}</td><td><a href="#${sp}-team-${t}">${coBadge(sp,t)} ${coT(sp,t).rk?`<small class="corank">${coT(sp,t).rk}</small> `:""}${coE(coT(sp,t).s||coT(sp,t).n)}</a></td><td><b>${v.r>0?"+":""}${coF(v.r)}</b></td>${EL?`<td>${e?coF(EL[0]+e.o):"–"}</td><td>${e?coF(EL[0]+e.d):"–"}</td><td>${e?coF(EL[1]+e.t):"–"}</td>`:""}</tr>`}).join("")}</tbody></table></div>
   <div class="small">Rating = points better than an average ${sp==="cfb"?"FBS":"D-I"} team on a neutral field, adjusted for strength of schedule. Off / Def = points scored / allowed per 100 ${sp==="cfb"?"plays":"possessions"}, adjusted for opponents. Top 50 shown.</div></div>`}
/* ---------- 🎯 college basketball props (ranked teams' games): hit rates + our chance ---------- */
function coPropRows(sp,g){const O=coOdds(sp,g.id);if(!O||!O.props||!O.props.length||!CO[sp].mk)return [];const P=coV(sp,"P")||{},by={};
  for(const [a,p] of Object.entries(P))if(p.t===g.a[0]||p.t===g.h[0])by[p.n.toLowerCase()]=[a,p];
  const out=[];for(const [k,nm,line,ov,un,bo,bu] of O.props){const mk=CO[sp].mk[k],x=by[String(nm).toLowerCase()];if(!mk||!x||line==null)continue;
    const V=x[1].g.map(mk[1]).filter(v=>v!=null&&isFinite(v));if(V.length<3)continue;const L10=V.slice(-10),hit=(A,s)=>A.filter(v=>s==="o"?v>line:v<line).length;
    const fo=ov!=null&&un!=null?coImp(ov)/(coImp(ov)+coImp(un)):null;
    for(const [side,odds,bk] of [["o",ov,bo],["u",un,bu]]){if(odds==null)continue;const fair=fo!=null?(side==="o"?fo:1-fo):coImp(odds)/1.045,raw=.6*hit(L10,side)/L10.length+.4*hit(V,side)/V.length,nE=Math.min(25,L10.length+.5*V.length),p0=fair+.4*nE/(nE+10)*(raw-fair),m=typeof xCalM!=="undefined"?xCalM("nba",side):1,pc=Math.max(.03,Math.min(.9,fair+m*(p0-fair))),be=coImp(odds);
      out.push({aid:x[0],p:x[1],k,lab:mk[0],line,side,odds,bk,h10:[hit(L10,side),L10.length],hs:[hit(V,side),V.length],avg:V.reduce((a,b)=>a+b,0)/V.length,pc,be,edge:pc-be})}}
  return out.sort((a,b)=>b.edge-a.edge)}
function coProps(sp,g){const R=coPropRows(sp,g);if(!R.length)return "";const seen=new Set(),L=R.filter(r=>{const k=r.aid+r.k;if(seen.has(k))return false;seen.add(k);return true});
  return `<div class="card"><h2>🎯 Player props <span class="small">· better side of each line</span></h2>${typeof xCalNote!=="undefined"?xCalNote("nba"):""}
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Player</th><th>Pick</th><th>Odds</th><th>Last 10</th><th>Season</th><th>Avg</th><th>Chance</th></tr></thead><tbody>
   ${L.map(r=>`<tr><td><a href="#${sp}-player-${r.aid}"><b>${coE(r.p.n)}</b></a> <span class="small">${coE(coT(sp,r.p.t).a)}</span></td><td>${r.edge>0?"⭐ ":""}${r.side==="o"?"Over":"Under"} ${r.line} ${coE(r.lab)}</td><td>${coAm(r.odds)}${r.bk?` <span class="small">${coE(r.bk)}</span>`:""}</td><td>${r.h10[0]}/${r.h10[1]}</td><td>${r.hs[0]}/${r.hs[1]}</td><td>${coF(r.avg)}</td><td><b class="${r.edge>0?"up":""}">${Math.round(r.pc*100)}%</b> <span class="small">need ${Math.round(r.be*100)}%</span></td></tr>`).join("")}</tbody></table></div>
   <div class="small">Only for games with a ranked team. Chance = the price (margin removed) moved toward his hit rates only as far as our NBA props' graded record supports. ⭐ = our chance beats what the odds need. A lean, not a guarantee. 21+.</div></div>`}
/* ---------- 🏈 weekly pick'em: every game with a ranked team, against the spread and the total ---------- */
function coPickEm(sp,g){const M=coModel(sp,g),L=coLine(sp,g);if(!M||L.sp==null)return null;const m=M.raw.m,ps=m+L.sp>=0?g.h[0]:g.a[0],po=L.tot!=null?(M.raw.tot>=L.tot?"over":"under"):null;
  return {eid:String(g.id),t:g.t,a:g.a[0],h:g.h[0],an:coT(sp,g.a[0]).a,hn:coT(sp,g.h[0]).a,ar:g.a[2]||null,hr:g.h[2]||null,sp:L.sp,tot:L.tot,ps,po,m:Math.round(m*10)/10,mt:Math.round(M.raw.tot*10)/10}}
function coWeek(t){const d=new Date(coDay(t)+"T12:00:00Z"),s=new Date(d.getTime()+((6-d.getUTCDay()+7)%7)*864e5);return s.toISOString().slice(0,10)}
function coPickEmPage(sp,el){el.innerHTML=coHead(sp,"Picks")+coPickEmSec(sp)}
function coPickEmSec(sp){if(sp!=="cfb")return "";const S=(typeof TRACK!=="undefined"&&TRACK&&TRACK.sum&&TRACK.sum[sp]&&TRACK.sum[sp].pe)||null,locked=new Map(((S&&S.rows)||[]).map(x=>[x.eid,x]));
  const up=coGames(sp).filter(g=>g.st!=="post"&&coPeOk(sp,g)).map(g=>locked.get(String(g.id))||coPickEm(sp,g)).filter(Boolean);
  const rec=a=>a?`${a[0]}-${a[1]}${a[2]?"-"+a[2]:""}`:"0-0",pc=a=>a&&a[0]+a[1]?Math.round(a[0]/(a[0]+a[1])*100)+"%":"–";
  /* ⚡ grade a locked pick as soon as the game is final here (live scores), before the tracker gets to it */
  const live=x=>{if(x.r)return x;const g=coGame(sp,x.eid);if(!g||g.st!=="post")return x;const a=+g.a[3],h=+g.h[3];if(!isFinite(a)||!isFinite(h))return x;const m=h-a+x.sp,cv=x.ps===x.h?m:-m,y={...x,f:[a,h],ra:cv>0?"win":cv<0?"loss":"push"};
    if(x.tot!=null&&x.po){const d=a+h-x.tot;y.ro=d===0?"push":(d>0)===(x.po==="over")?"win":"loss"}return y};
  const row=x0=>{const x=live(x0),pick=`${coE(coT(sp,x.ps).a)} ${(x.ps===x.h?x.sp:-x.sp)>0?"+":""}${x.ps===x.h?x.sp:-x.sp}`,res=r=>r?`<span class="ufr ${r==="win"?"W":r==="loss"?"L":"NC"}">${r==="win"?"✓":r==="loss"?"✗":"P"}</span>`:"";
    return `<a class="ufval" href="#${sp}-game-${x.eid}"><span>${x.ar?`<small class="corank">${x.ar}</small> `:""}${coE(x.an)} @ ${x.hr?`<small class="corank">${x.hr}</small> `:""}${coE(x.hn)}${x.f?` <span class="small">${x.f[0]}-${x.f[1]}</span>`:""}</span><span><b>${pick}</b> ${res(x.ra)}</span><span>${x.po?`<b>${x.po==="over"?"O":"U"} ${x.tot}</b> ${res(x.ro)}`:"–"}</span><span class="small">our ${coE(coT(sp,x.m>=0?x.h:x.a).a)} by ${coF(Math.abs(x.m))}, ${coF(x.mt)}</span></a>`};
  const done=((S&&S.rows)||[]).filter(x=>x.r),wk={};for(const x of done)(wk[coWeek(x.t)]=wk[coWeek(x.t)]||[]).push(x);
  return `<h2 id="pickem" style="margin:16px 0 8px">✅ Every ranked + power-conference game</h2>
   <div class="card"><div class="xstrip"><div><b>${rec(S&&S.ats)}</b><span>Against the spread</span><small>${pc(S&&S.ats)}</small></div><div><b>${rec(S&&S.ou)}</b><span>Totals</span><small>${pc(S&&S.ou)}</small></div><div><b>${done.length}</b><span>Games graded</span></div></div>
   <div class="small">Our side and total on every game with a ranked or power-conference team, from our own number (strength-of-schedule ratings + pace and efficiency, before blending with the line). Picks lock 3 hours before kickoff and are graded at the closing line ESPN shows. Need 52.4% to beat a −110 price.</div>${S&&S.clv&&S.clv.n?`<div class="small" style="margin-top:6px">📉 Closing line: the spread moved our way after we locked on <b>${S.clv.beat} of ${S.clv.n}</b> (${Math.round(S.clv.beat/S.clv.n*100)}%, ${(S.clv.pts/S.clv.n>0?"+":"")+(S.clv.pts/S.clv.n).toFixed(1)} pts on average)${S.clv.tn?` · totals ${S.clv.tbeat} of ${S.clv.tn}`:""}. Beating the close more often than not is the first sign of a real edge.</div>`:""}</div>
   <h3 style="margin:12px 0 8px">This week</h3><div class="card">${up.map(row).join("")||`<div class="small">No ranked games with lines yet.</div>`}</div>
   ${Object.keys(wk).sort().reverse().map(w=>{const A=[0,0,0],O=[0,0,0],k={win:0,loss:1,push:2};for(const x of wk[w]){A[k[x.ra]]++;if(x.ro)O[k[x.ro]]++}return `<h3 style="margin:12px 0 8px">Week of ${new Date(w+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric"})} <span class="small">· ATS ${rec(A)} · totals ${rec(O)}</span></h3><div class="card">${wk[w].map(row).join("")}</div>`}).join("")}`}
function coPeOk(sp,g){return !!(g.a[2]||g.h[2]||[g.a[0],g.h[0]].some(t=>/^(SEC|Big Ten|Big 12|ACC)$|Southeastern|Atlantic Coast|Big Ten|Big 12/.test(coConf(sp,t))))}
/* the season replay: how our ratings' leans would have done against the closing line, week by week, using only earlier games */
function coBTCard(sp){const B=coV(sp,"BT");if(!B||!B.n)return "";const VN={tr:"Ratings only",mix:"Ratings + pace/efficiency"},V=B.v||{tr:{sp:B.sp,tot:B.tot}};const row=(X,k,lab)=>Object.entries(X[k]||{}).map(([t,[w,l,p]])=>`<tr><td>${lab} ${t}+ pts off</td><td>${w}-${l}${p?"-"+p:""}</td><td><b class="${w+l>=40&&w/(w+l)>=.535?"up":w+l&&w/(w+l)<.5?"dn":""}">${w+l?Math.round(w/(w+l)*100)+"%":"–"}</b></td></tr>`).join("");
  return `<details class="card adv"><summary><b>🧪 Season replay</b> <span class="small">· ${B.n} games, ${B.wk} weeks</span></summary><div class="small" style="margin:6px 0">Every week of this season replayed: ratings built only from the games before that week, compared with ESPN's closing line. Shows how often our side would have covered when our number was at least that far from the line. 52.4% breaks even at −110. Leans are only listed for a version and gap that won 54.5%+ over 40+ games (a higher bar because we compare two versions).</div>
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Lean</th><th>Record</th><th>Won</th></tr></thead><tbody>${Object.entries(V).map(([v,X])=>`<tr><th colspan="3" style="text-align:left">${VN[v]||v}</th></tr>${row(X,"sp","Spread")}${row(X,"tot","Total")}`).join("")}</tbody></table></div>${(()=>{const a=coThrV(sp,"sp"),b=coThrV(sp,"tot");return `<div class="small" style="margin-top:6px">Listing now: spreads — ${a?`${VN[a.v]||a.v}, ${a.t}+ pts off`:"paused"} · totals — ${b?`${VN[b.v]||b.v}, ${b.t}+ pts off`:"paused"}. Injuries aren't in the replay (we don't have past injury reports).</div>`})()}</details>`}
/* ---------- 🔥 rivalries + conference title games ---------- */
function coBigPage(sp,el){const G=coGames(sp).filter(g=>g.riv||g.ttl);
  el.innerHTML=`${coHead(sp,"Rivalries + title games")}<p class="sub">This week's rivalry games and title games, with every meeting from the last 4 seasons and how each side did against the spread in them.</p>
   ${G.map(g=>`<h2 style="margin:12px 0 6px">${g.riv?"🔥 "+coE(g.riv):""}${g.riv&&g.ttl?" · ":""}${g.ttl?"🏆 "+coE(g.ttl):""}</h2>${coRow(sp,g)}${coH2H(sp,g)}`).join("")||`<div class="card small">No rivalry or conference title games in the next few days.</div>`}`;
  el.querySelectorAll("[data-cog]").forEach(c=>c.onclick=()=>location.hash=c.dataset.cog)}
/* ---------- 🏀 bracket watch: a rough 68-team field from our ratings ---------- */
function coBracketPage(sp,el){const TR=coTR(sp),TS=coV(sp,"TS")||{},AP={};(((coV(sp,"RANK")||[])[0]||{}).r||[]).forEach(r=>AP[r[1]]=+r[0]);
  /* early in the season a few games say little, so the order leans on the AP poll and shifts to our ratings as games pile up (all ours by ~15 games) */
  const gp=Object.values(TR).map(v=>v.g).sort((a,b)=>a-b)[Math.floor(Object.keys(TR).length/2)]||0,w=Math.min(1,gp/15),key=t=>w*TR[t].rk+(1-w)*(AP[t]||25+TR[t].rk);
  const T=Object.keys(TR).sort((a,b)=>key(a)-key(b));
  if(T.length<68){el.innerHTML=`${coHead(sp,"Bracket watch")}<div class="card small">Bracket watch needs our ratings — they come with the next data update.</div>`;return}
  const cf={};for(const t of T){const c=coConf(sp,t);if(c&&!cf[c])cf[c]=t}const auto=new Set(Object.values(cf));const atl=T.filter(t=>!auto.has(t)).slice(0,68-auto.size),field=new Set([...auto,...atl]);
  const lastIn=atl.slice(-4),autoLow=[...auto].sort((a,b)=>key(b)-key(a)).slice(0,4),ff=new Set([...lastIn,...autoLow]),direct=T.filter(t=>field.has(t)&&!ff.has(t));
  const lines=[];for(let i=0;i<10;i++)lines.push(direct.slice(i*4,i*4+4).map(t=>[t]));lines.push([...direct.slice(40,42).map(t=>[t]),[lastIn[0],lastIn[1]],[lastIn[2],lastIn[3]]]);
  for(let i=0;i<4;i++)lines.push(direct.slice(42+i*4,46+i*4).map(t=>[t]));const lo=autoLow.slice().sort((a,b)=>key(a)-key(b));lines.push([...direct.slice(58,60).map(t=>[t]),[lo[0],lo[1]],[lo[2],lo[3]]]);
  const nm=t=>t?`<a href="#${sp}-team-${t}">${coBadge(sp,t)} ${coT(sp,t).rk?`<small class="corank">${coT(sp,t).rk}</small> `:""}${coE(coT(sp,t).s||coT(sp,t).n)}</a>${auto.has(t)?` <span class="small" title="projected automatic bid">🎟️</span>`:""} <span class="small">${TS[t]?`${TS[t].w}-${TS[t].g-TS[t].w}`:""}</span>`:"?";
  const out=T.filter(t=>!field.has(t)).slice(0,8);
  el.innerHTML=`${coHead(sp,"Bracket watch")}<div class="card"><div class="small">A rough projection of the 68-team NCAA field from our ratings${w<1?` blended with the AP poll (${Math.round(w*100)}% ours so far — teams have played about ${gp} games; it's all ours by about 15)`:""}. Not the committee's, and early-season numbers move a lot. 🎟️ = projected automatic bid (top team in each conference by this order). Seeds follow the order; the last four at-large teams and the four lowest-rated automatic qualifiers play in the First Four (shown as "A / B").</div></div>
   <div class="card"><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Seed</th><th>Teams</th></tr></thead><tbody>${lines.map((L,i)=>`<tr><td><b>${i+1}</b></td><td>${L.map(p=>p.length>1?`<div>${nm(p[0])} / ${nm(p[1])} <span class="small">First Four</span></div>`:`<div>${nm(p[0])}</div>`).join("")}</td></tr>`).join("")}</tbody></table></div></div>
   <div class="card"><h2>Last four in</h2>${lastIn.map(t=>`<div class="ufval">${nm(t)}<span class="small">rating ${coF(TR[t].r)}</span></div>`).join("")}<h2 style="margin-top:10px">First eight out</h2>${out.map(t=>`<div class="ufval">${nm(t)}<span class="small">rating ${coF(TR[t].r)}</span></div>`).join("")}</div>`}

/* ☰ More: the less-used college pages, so the tab bar fits on a phone */
function coMorePage(sp,el){const L=[["-stand",sp==="cfb"?"📊 Standings + playoff picture":"📊 Standings"],["-lead","🏅 Leaders"],["-big","🔥 Rivalries + title games"],...(sp==="cbb"?[["-bracket","🗂️ Bracket watch"]]:[]),["-rank","📈 Our ratings"]];
  el.innerHTML=`${coHead(sp,"More")}<div class="card">${L.map(([h,l])=>`<a class="ufval" href="#${sp}${h}"${h==="-rank"?` data-ours="1"`:""}><b>${l}</b><span class="small">→</span></a>`).join("")}<a class="ufval" href="#record"><b>📒 Our record</b><span class="small">→</span></a><a class="ufval" href="#calib"><b>🎯 Calibration</b><span class="small">→</span></a></div>`;
  const o=el.querySelector("[data-ours]");if(o)o.onclick=()=>{COS.rk=-1}}
