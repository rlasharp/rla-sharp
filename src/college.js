/* ---------- 🏈🏀 College football (FBS) + men's college basketball — same layout as the NBA / NFL sections:
   Games (with our number), game pages, Props (hit rates + our chance), Best bets (plays of the day), players, teams,
   rankings, My Bets grading. Data: cfb_data.js / cbb_data.js (tools/collegefetch.py, ESPN) loaded on demand;
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
  const b=(x,y)=>x==null?y:y==null?x:x*.55+y*.45,ao=b(A.pf,A.pf5),ad=b(A.pa,A.pa5),ho=b(H.pf,H.pf5),hd=b(H.pa,H.pa5),hfa=g.neu?0:C.hfa;
  const hp=(ho+ad)/2+hfa/2,ap=(ao+hd)/2-hfa/2,L=coLine(sp,g);let mh=hp-ap,tot=hp+ap;const raw={m:mh,tot};
  if(L.sp!=null)mh=(mh+(-L.sp))/2;if(L.tot!=null)tot=(tot+L.tot)/2;
  return {m:mh,tot,hp:(tot+mh)/2,ap:(tot-mh)/2,p:coNcdf(mh/C.sd),raw,n:Math.min(A.g,H.g)}}
/* leans: where our own number (before the blend) is far from the market */
function coLeans(sp,g){if(g.st!=="pre")return [];const M=coModel(sp,g),L=coLine(sp,g),C=CO[sp];if(!M||M.n<3)return [];const out=[];
  if(L.sp!=null){const e=M.raw.m-(-L.sp);if(Math.abs(e)>=C.lean[0]){const home=e>0;out.push({k:"Spread",txt:`${coT(sp,home?g.h[0]:g.a[0]).s||coT(sp,home?g.h[0]:g.a[0]).a} ${home?(L.sp>0?"+":"")+L.sp:(L.sp<0?"+":"")+(-L.sp)}`,edge:Math.abs(e),odds:L.spx?L.spx[home?1:0]:null})}}
  if(L.tot!=null){const e=M.raw.tot-L.tot;if(Math.abs(e)>=C.lean[1])out.push({k:"Total",txt:`${e>0?"Over":"Under"} ${L.tot}`,edge:Math.abs(e),odds:L.ox?L.ox[e>0?0:1]:null})}
  return out}
/* ---------- props: his values, hit rates, our chance ---------- */
let CO_PIX={};function coPlayerByName(sp,nm){const k=sp+"|"+(typeof loNorm!=="undefined"?loNorm(nm):nm.toLowerCase());if(!CO_PIX[sp]){CO_PIX[sp]={};for(const [aid,p] of Object.entries(coV(sp,"P")||{}))CO_PIX[sp][sp+"|"+(typeof loNorm!=="undefined"?loNorm(p.n):p.n.toLowerCase())]=aid}return CO_PIX[sp][k]||null}
function coVals(sp,aid,mk){const p=(coV(sp,"P")||{})[aid],f=CO[sp].mk[mk];if(!p||!f)return [];return p.g.map(r=>({v:f[1](r),r})).filter(o=>o.v!=null)}
function coEval(sp,g,row){const [mk,nm,line,ov,un,bo,bu]=row,aid=coPlayerByName(sp,nm);if(!aid)return null;const V=coVals(sp,aid,mk).map(o=>o.v);if(V.length<2)return null;
  const hit=a=>a.filter(v=>v>line).length,mean=a=>a.reduce((s,x)=>s+x,0)/a.length,L5=V.slice(-5),m=mean(L5)*.5+mean(V)*.5,sd=Math.max(.8,Math.sqrt(mean(V.map(v=>(v-mean(V))**2)))||1);
  const hr=(hit(V)+2)/(V.length+4),pn=1-coNcdf((line+(mk==="player_anytime_td"?0:0)-m)/sd),pO=Math.min(.95,Math.max(.05,.5*hr+.5*pn));
  const io=coImp(ov),iu=coImp(un),fair=io!=null&&iu!=null?[io/(io+iu),iu/(io+iu)]:[io,iu];
  const eO=ov!=null&&fair[0]!=null?pO-fair[0]:null,eU=un!=null&&fair[1]!=null?(1-pO)-fair[1]:null;const side=eU!=null&&(eO==null||eU>eO)?"u":"o";
  const p=(coV(sp,"P")||{})[aid];return {sp,g,mk,nm,aid,tm:p.t,line,ov,un,bo,bu,V,L5:[hit(L5),L5.length],L10:[hit(V.slice(-10)),Math.min(10,V.length)],S:[hit(V),V.length],m,pO,side,
    ch:side==="o"?pO:1-pO,odds:side==="o"?ov:un,book:side==="o"?bo:bu,edge:side==="o"?eO:eU,need:side==="o"?fair[0]:fair[1]}}
function coAllProps(sp){const out=[];for(const g of coGames(sp)){if(g.st!=="pre")continue;const O=coOdds(sp,g.id);if(!O)continue;for(const row of O.props||[]){const e=coEval(sp,g,row);if(e)out.push(e)}}return out}
function coBest(sp){return coAllProps(sp).filter(x=>x.edge!=null&&x.edge>=.05&&x.S[1]>=4&&x.odds!=null&&x.odds>=-200&&(x.side==="o"?x.L10[0]/x.L10[1]>=.6:(x.L10[1]-x.L10[0])/x.L10[1]>=.6)).sort((a,b)=>b.edge-a.edge)}
function coSpec(x){return {k:"col",sp:x.sp,aid:x.aid,player:x.nm,team:coT(x.sp,x.tm).a,market:x.mk,line:x.line,side:x.side==="o"?"over":"under",odds:x.odds,book:x.book||"",date:coDay(x.g.t),eid:x.g.id,label:`${x.nm} ${x.side==="o"?"Over":"Under"} ${x.line} ${CO[x.sp].mk[x.mk][0]}`}}
/* grading for My Bets */
function coGrade(b){const sp=b.sp;if(!coOk(sp))return {r:"pending"};const p=(coV(sp,"P")||{})[b.aid],f=CO[sp].mk[b.market];if(!p||!f)return {r:"pending"};
  const row=p.g.find(r=>r[0]===b.date);if(!row){const T=(coV(sp,"RES")||{})[p.t]||[];return T.some(r=>r[0]===b.date)?{r:"void",why:"Did not play — no action"}:{r:"pending"}}
  const v=f[1](row);if(v==null)return {r:"pending"};if(b.market==="player_anytime_td")return {r:v>=1?"win":"loss",why:`${v} TD`};
  return {r:v===b.line?"push":((b.side==="over")===(v>b.line))?"win":"loss",why:`Final: ${v}`}}
/* ---------- pages ---------- */
function coHead(sp,sub){return `<h1>${CO[sp].em} ${CO[sp].nm}</h1>${sub?`<p class="sub">${sub}</p>`:""}`}
function coRow(sp,g){const L=coLine(sp,g),M=coModel(sp,g),Le=coLeans(sp,g),fin=g.st==="post",live=g.st==="in";
  const side=(s,i)=>`<div class="cosd${fin&&+s[3]>+(i?g.a[3]:g.h[3])?" won":""}">${coBadge(sp,s[0])}<b>${coTN(sp,s[0])}</b><span class="small">${coE(s[1])}</span>${fin||live?`<b class="cosc">${coE(s[3])}</b>`:""}</div>`;
  return `<a class="card corow" href="#${sp}-game-${g.id}"><div class="small">${live?`<b class="dn">● ${coE(g.det)}</b>`:fin?`Final`:coWhen(g.t)}${g.tv?" · "+coE(g.tv):""}${g.neu?" · neutral site":""}</div>
   <div class="copair">${side(g.a,0)}<span class="small">@</span>${side(g.h,1)}</div>
   <div class="coln small">${L.sp!=null?`Line: <b>${coE(coT(sp,L.sp<=0?g.h[0]:g.a[0]).a)} ${L.sp<=0?L.sp:-L.sp}</b>`:"No line yet"}${L.tot!=null?` · O/U <b>${L.tot}</b>`:""}${M?` · ours: <b>${coE(coT(sp,M.m>=0?g.h[0]:g.a[0]).a)} by ${coF(Math.abs(M.m))}</b>, ${coF(M.tot)} total`:""}</div>
   ${Le.length&&!fin?`<div class="small">⭐ ${Le.map(x=>`${coE(x.txt)} <span class="small">(${coF(x.edge)} ${CO[sp].unit} off the market)</span>`).join(" · ")}</div>`:""}</a>`}
function coGamesPage(sp,el){const G=coGames(sp),days=[...new Set(G.map(g=>coDay(g.t)))];const d=days.includes(COS.day[sp])?COS.day[sp]:days.find(x=>G.some(g=>coDay(g.t)===x&&g.st!=="post"))||days[0];
  const flt=COS.flt[sp]||"top",TM=coV(sp,"TM")||{},P5=/SEC|Big Ten|Big 12|ACC|Big East|Pac/;
  const ord={in:0,pre:1,post:2};const L=G.filter(g=>coDay(g.t)===d).sort((a,b)=>(ord[a.st]??1)-(ord[b.st]??1)||(a.t<b.t?-1:1)).filter(g=>flt==="all"||(flt==="top"?(g.a[2]||g.h[2]):(P5.test((TM[g.a[0]]||{}).cf||"")||P5.test((TM[g.h[0]]||{}).cf||"")||g.a[2]||g.h[2])));
  el.innerHTML=`${coHead(sp,`${G.length} games in the next few days · data ${coE(coV(sp,"GEN")||"")}`)}
   <div class="ufevs">${days.map(x=>`<button class="fxp${x===d?" on":""}" data-coday="${x}">${new Date(x+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} <small>${G.filter(g=>coDay(g.t)===x).length}</small></button>`).join("")}</div>
   <div class="seg" style="margin:6px 0 10px">${[["top","Top 25"],["p5","Top 25 + power conferences"],["all","All games"]].map(([k,l])=>`<button class="${flt===k?"on":""}" data-coflt="${k}">${l}</button>`).join("")}</div>
   ${L.map(g=>coRow(sp,g)).join("")||`<div class="card small">No ${flt==="top"?"Top 25 ":""}games that day${flt!=="all"?" — try All games":""}.</div>`}
   <p class="note">Our number = each team's points scored and allowed this season (recent games weighted up) plus home edge, blended 50/50 with the sportsbook line. It doesn't adjust for strength of schedule, so early-season and mismatched games are rough. Lines: licensed US books via our odds feed, or ESPN's partner book. 21+.</p>`;
  el.querySelectorAll("[data-coday]").forEach(b=>b.onclick=()=>{COS.day[sp]=b.dataset.coday;coGamesPage(sp,el)});el.querySelectorAll("[data-coflt]").forEach(b=>b.onclick=()=>{COS.flt[sp]=b.dataset.coflt;coGamesPage(sp,el)})}
function coPropRow(x,i){const C=CO[x.sp];return `<div class="card coprop"><div class="row" style="gap:8px;align-items:baseline;flex-wrap:wrap">${i!=null?`<span class="podn">${i+1}</span>`:""}<a href="#${x.sp}-player-${x.aid}"><b>${coE(x.nm)}</b></a><span class="small">${coE(coT(x.sp,x.tm).a)} · ${coWhen(x.g.t)}</span></div>
  <div class="bpl"><b class="xpk">${x.side==="o"?"Over":"Under"} ${x.line}</b> ${C.mk[x.mk][0]} <span class="small">${coAm(x.odds)}${x.book?" · "+coE(x.book):""}</span></div>
  <div class="small">${x.side==="o"?"Over":"Under"} in ${x.side==="o"?x.L5[0]:x.L5[1]-x.L5[0]} of last ${x.L5[1]} · ${x.side==="o"?x.L10[0]:x.L10[1]-x.L10[0]}/${x.L10[1]} last 10 · ${x.side==="o"?x.S[0]:x.S[1]-x.S[0]}/${x.S[1]} season · avg ${coF(x.V.reduce((s,v)=>s+v,0)/x.V.length)}</div>
  <div class="cobars">${x.V.slice(-10).map(v=>`<i class="${v>x.line?"o":v<x.line?"u":""}" style="height:${Math.max(6,Math.min(100,v/Math.max(x.line*2,1)*100))}%" title="${v}"><em>${v}</em></i>`).join("")}<span class="cobl" style="bottom:50%"></span></div>
  <div class="row" style="gap:8px;align-items:center;margin-top:6px"><span>Our chance <b class="${x.edge>=.05?"up":""}">${coPc(x.ch)}</b> <span class="small">vs ${coPc(x.need)} the price needs</span></span><span class="sp"></span>${typeof actBtn!=="undefined"&&x.odds!=null?actBtn(coSpec(x),"＋","ov"):""}</div></div>`}
function coPropsPage(sp,el,best){const A=best?coBest(sp):coAllProps(sp).sort((a,b)=>(b.edge??-1)-(a.edge??-1)),mks=[...new Set(A.map(x=>x.mk))],mk=COS.mk[sp]&&mks.includes(COS.mk[sp])?COS.mk[sp]:"all",L=A.filter(x=>mk==="all"||x.mk===mk);
  const D=typeof LO!=="undefined"&&LO.data&&LO.data[sp],nOdds=D&&D.ev?Object.keys(D.ev).length:0;
  if(best){const top=L.slice(0,3);el.innerHTML=`${coHead(sp,"Best bets: player props where our chance beats the price")}
    ${top.length?`<div class="card potd"><h2>⭐ Plays of the day</h2>${top.map((x,i)=>{const why=`${x.side==="o"?"Over":"Under"} in ${x.side==="o"?x.L10[0]:x.L10[1]-x.L10[0]} of his last ${x.L10[1]}, ${x.side==="o"?x.S[0]:x.S[1]-x.S[0]}/${x.S[1]} this season; our chance ${coPc(x.ch)} vs ${coPc(x.need)} the price needs.`;
      return `<div class="pod"><div class="podn">${i+1}</div><div style="min-width:0;flex:1"><div><a href="#${sp}-player-${x.aid}"><b>${coE(x.nm)}</b></a> <span class="small">${coE(coT(sp,x.tm).a)} · ${coWhen(x.g.t)}</span></div><div class="bpl"><b class="xpk">${x.side==="o"?"Over":"Under"} ${x.line}</b> ${CO[sp].mk[x.mk][0]} <span class="small">${coAm(x.odds)}</span></div><div class="small">${why}</div>${typeof pkWhyBox!=="undefined"?pkWhyBox(why,pkRisks({sp:null,nm:x.nm,side:x.side,line:x.line,odds:x.odds,ch:x.ch,vals:x.V})):""}</div><div class="bps"><b>${coPc(x.ch)}</b><span>our chance</span>${typeof actBtn!=="undefined"?actBtn(coSpec(x),"＋","plus"):""}</div></div>`}).join("")}<div class="small">Picked automatically: 6+ of the last 10 on our side, 4+ games of data, our chance 5+ points above what the price needs, odds no worse than −200.</div></div>`
      :`<div class="card small">${nOdds?"No prop passes our filters right now.":"Player props show up once books post them (usually the day before)."}</div>`}
    ${(()=>{const G=coGames(sp).filter(g=>g.st==="pre").flatMap(g=>coLeans(sp,g).map(x=>({g,x}))).sort((a,b)=>b.x.edge-a.x.edge).slice(0,8);return G.length?`<div class="card"><h2>📐 Biggest gaps vs the line</h2>${G.map(({g,x})=>`<a class="ufval" href="#${sp}-game-${g.id}"><b>${coE(x.txt)}</b><span class="small">${coE(coT(sp,g.a[0]).a)} @ ${coE(coT(sp,g.h[0]).a)} · ${x.k}</span><span>${coF(x.edge)} ${CO[sp].unit} off${x.odds!=null?" · "+coAm(x.odds):""}</span></a>`).join("")}<div class="small">Our number before the 50/50 blend vs the market. College lines are sharp on big games; treat these as research.</div></div>`:""})()}
    ${L.length>3?`<h2 style="margin:14px 0 8px">More props that pass</h2>${L.slice(3,20).map(x=>coPropRow(x)).join("")}`:""}`;return}
  el.innerHTML=`${coHead(sp,`${A.length} player props with game logs · ${nOdds} games with odds`)}
   <div class="ufevs"><button class="fxp${mk==="all"?" on":""}" data-comk="all">All</button>${mks.map(k=>`<button class="fxp${mk===k?" on":""}" data-comk="${k}">${CO[sp].mk[k][0]}</button>`).join("")}</div>
   ${L.slice(0,60).map(x=>coPropRow(x)).join("")||`<div class="card small">${nOdds?"No props match.":"Player props appear once books post them — for college that's usually the day before."}</div>`}
   <p class="note">Hit rates from his games this season (ESPN box scores). Our chance blends his hit rate with his average and spread vs the line. Best price across licensed US books.</p>`;
  el.querySelectorAll("[data-comk]").forEach(b=>b.onclick=()=>{COS.mk[sp]=b.dataset.comk;coPropsPage(sp,el,best)})}
function coGamePage(sp,el,id){const g=coGame(sp,id);if(!g){el.innerHTML=coHead(sp,"Game not found.")+`<a href="#${sp}">← Games</a>`;return}const TS=coV(sp,"TS")||{},RES=coV(sp,"RES")||{},L=coLine(sp,g),M=coModel(sp,g),Le=coLeans(sp,g),A=TS[g.a[0]]||{},H=TS[g.h[0]]||{};
  const props=coAllProps(sp).filter(x=>String(x.g.id)===String(g.id)).sort((a,b)=>(b.edge??-1)-(a.edge??-1));
  const cmp=(lab,x,y,hi)=>{const bx=x!=null&&y!=null&&x!==y?((x>y)===hi?0:1):-1;return `<tr><td class="${bx===0?"ufbt":""}">${coF(x)}</td><th>${lab}</th><td class="${bx===1?"ufbt":""}">${coF(y)}</td></tr>`};
  const last=t=>(RES[t]||[]).slice(-6).reverse().map(r=>`<div class="ufval"><span class="small">${coE(r[0].slice(5))}</span><span>${r[3]==="H"?"vs":"@"} ${coE(r[2])}</span><b class="${r[4]>r[5]?"up":"dn"}">${r[4]>r[5]?"W":"L"} ${r[4]}-${r[5]}</b></div>`).join("")||`<div class="small">No games yet.</div>`;
  const P=coV(sp,"P")||{},lead=t=>Object.entries(P).filter(([a,p])=>p.t===t&&p.g.length).map(([a,p])=>{const f=sp==="cfb"?(r=>(r[3]||0)+(r[9]||0)+(r[12]||0)):(r=>r[4]||0);return [a,p,p.g.reduce((s,r)=>s+f(r),0)/p.g.length]}).sort((x,y)=>y[2]-x[2]).slice(0,5);
  el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"Back"):`<a href="#${sp}">← Games</a>`}</p>
   <div class="card cohero"><div class="small">${g.st==="in"?`<b class="dn">● ${coE(g.det)}</b>`:g.st==="post"?"Final":coWhen(g.t)}${g.ven?" · "+coE(g.ven):""}${g.neu?" (neutral)":""}${g.tv?" · "+coE(g.tv):""}</div>
    <div class="copair big">${[g.a,g.h].map((s,i)=>`<a class="cosd" href="#${sp}-team-${s[0]}">${coBadge(sp,s[0])}<b>${coTN(sp,s[0],1)}</b><span class="small">${coE(s[1])}${coT(sp,s[0]).cf?" · "+coE(coT(sp,s[0]).cf):""}</span>${g.st!=="pre"?`<b class="cosc">${coE(s[3])}</b>`:""}</a>${i===0?`<span class="small">@</span>`:""}`).join("")}</div>
    ${M?`<div class="nbwp" style="margin-top:8px"><div style="width:${Math.round((1-M.p)*100)}%;background:${coT(sp,g.a[0]).c||"#d33f49"}"></div><div style="width:${Math.round(M.p*100)}%;background:${coT(sp,g.h[0]).c||"#3987e5"}"></div></div><div class="small" style="text-align:center">Our win chance: ${coE(coT(sp,g.a[0]).a)} ${coPc(1-M.p)} · ${coE(coT(sp,g.h[0]).a)} ${coPc(M.p)}${g.pred?` · ESPN predictor ${coE(coT(sp,g.h[0]).a)} ${Math.round(g.pred[1])}%`:""}</div>`:""}</div>
   ${g.st==="post"?`<div class="card"><h2>Final</h2><div class="nbsay">${coE(coT(sp,+g.a[3]>+g.h[3]?g.a[0]:g.h[0]).n)} won ${Math.max(+g.a[3],+g.h[3])}–${Math.min(+g.a[3],+g.h[3])}.${L.sp!=null?` ${(()=>{const m=(+g.h[3])-(+g.a[3])+L.sp;return m===0?"Push against the spread":`${coE(coT(sp,m>0?g.h[0]:g.a[0]).a)} covered ${L.sp>0?"+":""}${m>0?L.sp:-L.sp}`})()}.`:""}${L.tot!=null?` Total ${(+g.a[3])+(+g.h[3])} — ${(+g.a[3])+(+g.h[3])>L.tot?"over":(+g.a[3])+(+g.h[3])<L.tot?"under":"push"} ${L.tot}.`:""}</div></div>`:typeof gpSummary!=="undefined"?gpSummary({pick:Le.length?`<b>${coE(Le[0].txt)}</b> <span class="small">${Le[0].k.toLowerCase()} · ${coF(Le[0].edge)} ${CO[sp].unit} off the market${Le[0].odds!=null?" · "+coAm(Le[0].odds):""}</span>`:M?`Our number: <b>${coE(coT(sp,M.m>=0?g.h[0]:g.a[0]).a)} by ${coF(Math.abs(M.m))}</b>, about ${coF(M.tot)} total — no strong lean`:"",props:props.filter(x=>x.edge>=.04).slice(0,2).map(x=>`<a href="#${sp}-player-${x.aid}"><b>${coE(x.nm)}</b></a> ${x.side==="o"?"Over":"Under"} ${x.line} ${CO[sp].mk[x.mk][0]} <span class="small">${coAm(x.odds)} · our chance ${coPc(x.ch)}</span>`)}):""}
   <div class="card"><h2>Lines</h2><div class="nbatbl"><table class="bxt ufog"><thead><tr><th></th><th>${coE(coT(sp,g.a[0]).a)}</th><th>${coE(coT(sp,g.h[0]).a)}</th></tr></thead><tbody>
    <tr><th>Spread</th><td>${L.sp!=null?`${-L.sp>0?"+":""}${-L.sp}${L.spx?` <span class="small">${coAm(L.spx[0])}</span>`:""}`:"–"}</td><td>${L.sp!=null?`${L.sp>0?"+":""}${L.sp}${L.spx?` <span class="small">${coAm(L.spx[1])}</span>`:""}`:"–"}</td></tr>
    <tr><th>Moneyline</th><td>${L.ml?coAm(L.ml[0]):"–"}</td><td>${L.ml?coAm(L.ml[1]):"–"}</td></tr>
    <tr><th>Total</th><td colspan="2">${L.tot!=null?`${L.tot} <span class="small">O ${coAm(L.ox&&L.ox[0])} / U ${coAm(L.ox&&L.ox[1])}</span>`:"–"}</td></tr>
    ${M?`<tr><th>Our number</th><td colspan="2">${coE(coT(sp,M.m>=0?g.h[0]:g.a[0]).a)} by ${coF(Math.abs(M.m))} · total ${coF(M.tot)} <span class="small">(before the market blend: ${coF(M.raw.m>=0?M.raw.m:-M.raw.m)}, ${coF(M.raw.tot)})</span></td></tr>`:""}</tbody></table></div><div class="small">Prices: ${coE(L.src)}.</div></div>
   <div class="card"><h2>Team comparison <span class="small">· per game this season</span></h2><div class="nbatbl"><table class="uftape"><thead><tr><th>${coE(coT(sp,g.a[0]).a)}</th><th></th><th>${coE(coT(sp,g.h[0]).a)}</th></tr></thead><tbody>
    <tr><td>${A.w??"–"}-${A.g!=null?A.g-A.w:"–"}</td><th>Record (D-I / FBS games)</th><td>${H.w??"–"}-${H.g!=null?H.g-H.w:"–"}</td></tr>${cmp("Points scored",A.pf,H.pf,true)}${cmp("Points allowed",A.pa,H.pa,false)}${cmp("Scored, last 5",A.pf5,H.pf5,true)}${cmp("Allowed, last 5",A.pa5,H.pa5,false)}
    ${cmp("Margin",A.pf!=null?A.pf-A.pa:null,H.pf!=null?H.pf-H.pa:null,true)}</tbody></table></div></div>
   ${props.length?`<h2 style="margin:14px 0 8px">Player props · ${props.length}</h2>${props.slice(0,12).map(x=>coPropRow(x)).join("")}`:""}
   <div class="grid g2">${[g.a[0],g.h[0]].map(t=>`<div class="card"><h2>${coBadge(sp,t)} ${coE(coT(sp,t).s)} · recent</h2>${last(t)}<h3 style="margin:10px 0 4px">Leaders</h3>${lead(t).map(([a,p,v])=>`<a class="ufval" href="#${sp}-player-${a}"><b>${coE(p.n)}</b><span class="small">${coE(p.p)}</span><span>${coF(v)} ${sp==="cfb"?"yds":"pts"}/g</span></a>`).join("")||`<div class="small">–</div>`}</div>`).join("")}</div>`}
function coPlayerPage(sp,el,aid){const p=(coV(sp,"P")||{})[aid];if(!p){el.innerHTML=coHead(sp,"Player not found.")+`<a href="#${sp}">← Games</a>`;return}const C=CO[sp],R=p.g,n=R.length||1,av=f=>R.reduce((s,r)=>s+(+f(r)||0),0)/n;
  const nx=coGames(sp).find(g=>g.st==="pre"&&(g.a[0]===p.t||g.h[0]===p.t)),props=nx?coAllProps(sp).filter(x=>x.aid===aid):[];
  const strip=sp==="cfb"?[["Pass yds",coF(av(r=>r[3]))],["Rush yds",coF(av(r=>r[9]))],["Rec",coF(av(r=>r[11]))],["Rec yds",coF(av(r=>r[12]))],["TDs",R.reduce((s,r)=>s+(r[6]||0)+(r[10]||0)+(r[13]||0),0)]].filter(x=>+x[1]>0||x[0]==="TDs"):[["PTS",coF(av(r=>r[4]))],["REB",coF(av(r=>r[11]))],["AST",coF(av(r=>r[12]))],["3PM",coF(av(r=>r[7]))],["MIN",coF(av(r=>r[3]))],["FG%",(()=>{const m=R.reduce((s,r)=>s+(r[5]||0),0),a=R.reduce((s,r)=>s+(r[6]||0),0);return a?(m/a*100).toFixed(1):"–"})()]];
  el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"Back"):""}</p><div class="phead tch" style="--tc:${coT(sp,p.t).c||"#555"}"><div>${coBadge(sp,p.t)}</div><div><h1 style="margin:0">${coE(p.n)}</h1><div class="small">${coE(p.p)} · <a href="#${sp}-team-${p.t}">${coE(coT(sp,p.t).n)}</a>${nx?` · next: ${nx.a[0]===p.t?"@":"vs"} ${coE(coT(sp,nx.a[0]===p.t?nx.h[0]:nx.a[0]).s)} ${coWhen(nx.t)}`:""}</div></div></div>
   ${typeof xStrip!=="undefined"?xStrip(strip.map(x=>[x[0],x[1],""]),`Per game · ${R.length} games this season${sp==="cfb"?" (TDs total)":""}`):""}
   ${props.length?`<h2 style="margin:14px 0 8px">Props${nx?` · ${coE(coWhen(nx.t))}`:""}</h2>${props.map(x=>coPropRow(x)).join("")}`:`<div class="card small">No props posted for him${nx?" yet":""}.</div>`}
   <div class="card"><h2>Game log</h2><div class="nbatbl"><table class="bxt"><thead><tr><th>Date</th><th>Opp</th>${C.cols.map(c=>`<th>${c[0]}</th>`).join("")}</tr></thead><tbody>${R.slice().reverse().map(r=>`<tr><td>${coE(r[0].slice(5))}</td><td>${r[2]==="H"?"vs":"@"} ${coE(r[1])}</td>${C.cols.map(c=>`<td>${coE(c[1](r.slice(0))??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="small">ESPN box scores.</div></div>`}
function coTeamPage(sp,el,tid){const T=coT(sp,tid),TS=(coV(sp,"TS")||{})[tid]||{},R=(coV(sp,"RES")||{})[tid]||[],P=coV(sp,"P")||{};const nx=coGames(sp).filter(g=>g.a[0]===tid||g.h[0]===tid);
  const roster=Object.entries(P).filter(([a,p])=>p.t===tid).map(([a,p])=>{const n=p.g.length||1,f=sp==="cfb"?(r=>(r[3]||0)+(r[9]||0)+(r[12]||0)):(r=>r[4]||0);return [a,p,p.g.reduce((s,r)=>s+f(r),0)/n]}).sort((x,y)=>y[2]-x[2]);
  el.innerHTML=`<p>${typeof xBack!=="undefined"?xBack("#"+sp,"Back"):""}</p><div class="phead tch" style="--tc:${T.c||"#555"}"><div>${coBadge(sp,tid)}</div><div><h1 style="margin:0">${T.rk?`<small class="corank">#${T.rk}</small> `:""}${coE(T.n)}</h1><div class="small">${coE(T.cf||"")}${TS.g?` · ${TS.w}-${TS.g-TS.w} vs D-I`:""}</div></div></div>
   ${typeof xStrip!=="undefined"?xStrip([["Scored",coF(TS.pf)],["Allowed",coF(TS.pa)],["Margin",TS.pf!=null?coF(TS.pf-TS.pa):"–"],["Last 5 scored",coF(TS.pf5)],["Last 5 allowed",coF(TS.pa5)]].map(x=>[x[0],x[1],""]),"Per game this season"):""}
   ${nx.length?`<h2 style="margin:12px 0 8px">Next</h2>${nx.map(g=>coRow(sp,g)).join("")}`:""}
   <div class="card"><h2>Results</h2>${R.slice().reverse().map(r=>`<div class="ufval"><span class="small">${coE(r[0].slice(5))}</span><span>${r[3]==="H"?"vs":"@"} ${coE(r[2])}${r[7]?" (N)":""}</span><b class="${r[4]>r[5]?"up":"dn"}">${r[4]>r[5]?"W":"L"} ${r[4]}-${r[5]}</b></div>`).join("")||`<div class="small">No games yet.</div>`}</div>
   <div class="card"><h2>Players</h2>${roster.slice(0,15).map(([a,p,v])=>`<a class="ufval" href="#${sp}-player-${a}"><b>${coE(p.n)}</b><span class="small">${coE(p.p)} · ${p.g.length} games</span><span>${coF(v)} ${sp==="cfb"?"yds":"pts"}/g</span></a>`).join("")||`<div class="small">No player logs yet.</div>`}</div>`}
function coRankPage(sp,el){const L=coV(sp,"RANK")||[];const k=Math.min(COS.rk||0,Math.max(0,L.length-1)),R=L[k];
  el.innerHTML=`${coHead(sp,"Rankings")}<div class="seg">${L.map((x,i)=>`<button class="${i===k?"on":""}" data-cork="${i}">${coE(x.n)}</button>`).join("")}</div>
   ${R?`<div class="card">${R.r.map(([rk,tid,rec,tr])=>{const nx=coGames(sp).find(g=>g.st==="pre"&&(g.a[0]===tid||g.h[0]===tid));return `<div class="ufval"><b>#${rk}</b><a href="#${sp}-team-${tid}">${coBadge(sp,tid)} ${coE(coT(sp,tid).n)}</a><span class="small">${coE(rec)}${tr&&tr!=="-"?" · "+coE(tr):""}</span>${nx?`<a class="small" href="#${sp}-game-${nx.id}">${nx.a[0]===tid?"@":"vs"} ${coE(coT(sp,nx.a[0]===tid?nx.h[0]:nx.a[0]).a)} · ${coWhen(nx.t).split(" · ")[0]}</a>`:`<span class="small">–</span>`}</div>`}).join("")}</div>`:`<div class="card small">Rankings load with the data.</div>`}`;
  el.querySelectorAll("[data-cork]").forEach(b=>b.onclick=()=>{COS.rk=+b.dataset.cork;coRankPage(sp,el)})}
function coRoute(sp,h){const el=document.getElementById("v-"+sp);if(!el)return;
  if(!coOk(sp)){el.innerHTML=`<div class="small" style="padding:30px 0;text-align:center">Loading ${CO[sp].nm.toLowerCase()}…</div>`;coEnsure(sp,()=>{if(!coOk(sp)){el.innerHTML=`<div class="card">${CO[sp].nm} data isn't ready yet — it comes with the next data update.</div>`;return}CO_PIX[sp]=null;if((location.hash||"").slice(1).startsWith(sp))coRoute(sp,decodeURIComponent((location.hash||"").slice(1)))});return}
  if(!(typeof LO!=="undefined"&&LO.data)&&!COS["w"+sp]){COS["w"+sp]=1;let n=0;const t=setInterval(()=>{n++;if(typeof LO!=="undefined"&&LO.data){clearInterval(t);const hh=decodeURIComponent((location.hash||"").slice(1));if(hh.startsWith(sp)){const y=scrollY;coRoute(sp,hh);scrollTo(0,y)}}else if(n>20)clearInterval(t)},500)}
  const r=h.slice(sp.length);if(r.startsWith("-game-"))return coGamePage(sp,el,r.slice(6));if(r.startsWith("-player-"))return coPlayerPage(sp,el,r.slice(8));if(r.startsWith("-team-"))return coTeamPage(sp,el,r.slice(6));
  if(r==="-props")return coPropsPage(sp,el,false);if(r==="-best")return coPropsPage(sp,el,true);if(r==="-rank")return coRankPage(sp,el);return coGamesPage(sp,el)}
