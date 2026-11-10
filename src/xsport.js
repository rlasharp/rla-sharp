/* ================= Cross-sport helpers =================
   💰 odds edges (NBA + NFL, same idea as NHL: our number vs the books after removing their margin)
   🧭 NBA player angles (hot / cold / role changes) · 🧠 quick reads for NBA and NFL game pages
   📉 closing-line check for tracked bets (data/close/<date>.json saved by the odds job) */
function xImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
function xNoVig(a,b){const x=xImp(a),y=xImp(b);return x!=null&&y!=null?[x/(x+y),y/(x+y)]:null}
function xNorm(z){return typeof normCdf!=="undefined"?normCdf(z):.5*(1+Math.tanh(.7978845608*(z+.044715*z*z*z)))}
const xOdds=o=>o==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(o):(o>0?"+":"")+o);
function xEdgeRow(e,showGame){return `<a class="nher" href="${e.href}"><span>${showGame?`<span class="small">${e.game} · ${e.mk}</span>`:`<span class="small">${e.mk}</span>`}<b>${e.pick}</b> <span class="small">${xOdds(e.odds)}${e.est?" (assumed)":""}</span></span>
  <span class="nhedv"><b class="${e.edge>=.04?"up":""}">+${Math.round(e.edge*100)}%</b><span class="small">us ${Math.round(e.me*100)}% · books ${Math.round(e.bk*100)}%</span></span></a>`}
/* NBA: margin ~ normal(sd 12), total ~ normal(sd 18) around our team-rating numbers */
function nbaOddsEdges(g){const L=typeof NBA_LINES!=="undefined"&&NBA_LINES[g.a+"@"+g.h],M=typeof nbaModel!=="undefined"&&nbaModel(g.a,g.h);if(!L||!M||(typeof nbaStarted!=="undefined"&&nbaStarted(g)))return [];
  const out=[],gm=`${g.a} @ ${g.h}`,href=`#nba-game-${g.id}`,add=(mk,pick,odds,me,bk,est)=>{if(me==null||bk==null)return;out.push({g,game:gm,href,mk,pick,odds,me,bk,edge:me-bk,est})};
  if(L.sp!=null){const ph=xNorm((M.m+L.sp)/12),hp=L.spx??-110,nv=xNoVig(hp,-110);add("Spread",`${g.h} ${L.sp>0?"+":""}${L.sp}`,hp,ph,nv[0],L.spx==null);add("Spread",`${g.a} ${-L.sp>0?"+":""}${-L.sp}`,-110,1-ph,nv[1],true)}
  if(L.tot!=null){const po=1-xNorm((L.tot-M.tot)/18),nv=xNoVig(L.ox??-110,L.ux??-110);add("Total",`Over ${L.tot}`,L.ox??-110,po,nv[0],L.ox==null);add("Total",`Under ${L.tot}`,L.ux??-110,1-po,nv[1],L.ux==null)}
  if(L.mla!=null&&L.mlh!=null){const nv=xNoVig(L.mla,L.mlh);add("Moneyline",g.h,L.mlh,M.p,nv[1]);add("Moneyline",g.a,L.mla,1-M.p,nv[0])}
  const out2=typeof nbaKeyOutAll!=="undefined"&&nbaKeyOutAll(g).length?[]:out;   // key player out: our ratings don't know it
  return out2.filter(e=>e.edge>0&&e.edge<=.2).sort((a,b)=>b.edge-a.edge)}
/* NFL: our pure projected score (no market blend), margin sd 13.5, total sd 13 */
function nflOddsEdges(g){if(typeof projectGame==="undefined"||g.final||(typeof nflStarted!=="undefined"&&nflStarted(g)))return [];const L=LINES[g.id];if(!L)return [];const P=projectGame(g),m=P.shp-P.sap,t=P.shp+P.sap;
  const out=[],gm=`${g.away} @ ${g.home}`,href=`#game-${g.id}`,add=(mk,pick,odds,me,bk,est)=>{if(me==null||bk==null)return;out.push({g,game:gm,href,mk,pick,odds,me,bk,edge:me-bk,est})};
  if(L.sp!=null){const ph=xNorm((m+L.sp)/13.5);add("Spread",`${g.home} ${L.sp>0?"+":""}${L.sp}`,-110,ph,.5,true);add("Spread",`${g.away} ${-L.sp>0?"+":""}${-L.sp}`,-110,1-ph,.5,true)}
  if(L.tot!=null){const po=1-xNorm((L.tot-t)/13);add("Total",`Over ${L.tot}`,-110,po,.5,true);add("Total",`Under ${L.tot}`,-110,1-po,.5,true)}
  if(L.ml&&L.ml[0]!=null&&L.ml[1]!=null){const nv=xNoVig(L.ml[0],L.ml[1]),pw=xNorm(m/13.5);add("Moneyline",g.home,L.ml[1],pw,nv[1]);add("Moneyline",g.away,L.ml[0],1-pw,nv[0])}
  return out.filter(e=>e.edge>0&&e.edge<=.2).sort((a,b)=>b.edge-a.edge)}
function xEdgesCard(sp){const L=(sp==="nba"?(typeof NBA_SLATE!=="undefined"?NBA_SLATE:[]).flatMap(nbaOddsEdges):(typeof SLATE!=="undefined"?SLATE:[]).flatMap(nflOddsEdges)).filter(e=>e.edge>=.03).sort((a,b)=>b.edge-a.edge).slice(0,8);
  if(!L.length)return "";
  return `<div class="card" style="margin-bottom:12px"><h2 style="margin-bottom:2px">💰 Biggest gaps vs the odds</h2><div class="small" style="margin-bottom:8px">${sp==="nba"?"Our team-rating numbers (scoring margin, points for and against, home court)":"Our projected score from points for and against this season and lately, home field"} vs the books, after removing their margin.${sp==="nba"?" Games with a key player out are left out.":""}</div>${L.map(e=>xEdgeRow(e,true)).join("")}
   <div class="small" style="margin-top:6px">A rough model — a gap is a reason to dig in, not a pick. "(assumed)" = −110 used where the book's price isn't in our feed.</div></div>`}

/* ---------- 🧭 NBA player angles: hot / cold (last 5 vs season) + role changes ---------- */
function nbaHotCold(){if(typeof NBA_LOGS==="undefined")return {hot:[],cold:[]};const tm=new Set(NBA_SLATE.filter(g=>!nbaStarted(g)).flatMap(g=>[g.a,g.h])),hot=[],cold=[];
  const K=[["pts","pts"],["reb","reb"],["ast","ast"],["3pm","threes"]];
  for(const [nm,p] of Object.entries(NBA_LOGS)){if(!tm.has(p.tm)||p.g.length<8||nbaAvg(p,"min")<20)continue;if(/out/i.test(((typeof nbaInjOf!=="undefined"&&nbaInjOf(nm))||[])[2]||""))continue;
    for(const [k,l] of K){const s=nbaAvg(p,k),l5=nbaAvg(p,k,5),min=k==="pts"?8:k==="3pm"?1.2:3;if(s<min)continue;
      if(l5>=s*1.35&&l5-s>=(k==="pts"?4:1))hot.push({n:nm,p,t:`${l5.toFixed(1)} ${l}/game last 5 vs ${s.toFixed(1)} season`,s:l5/s});
      if(l5<=s*.65&&s-l5>=(k==="pts"?4:1))cold.push({n:nm,p,t:`${l5.toFixed(1)} ${l}/game last 5 vs ${s.toFixed(1)} season`,s:s/Math.max(.1,l5)})}}
  const by=a=>a.sort((x,y)=>y.s-x.s).slice(0,10);return {hot:by(hot),cold:by(cold)}}
let NB_ANG="hot";
function nbaAnglesCard(){const HC=nbaHotCold(),R=typeof nbaRoleList!=="undefined"?nbaRoleList().slice(0,10):[];if(!HC.hot.length&&!HC.cold.length&&!R.length)return "";
  const L=NB_ANG==="hot"?HC.hot:NB_ANG==="cold"?HC.cold:R;
  const row=x=>x.R?`<a class="fv" href="#nba-player-${encodeURIComponent(x.n)}"><b>${nbaBadge(x.p.tm)} ${nbaEsc(x.n)}</b>${x.R.map(r=>`<span class="small ${r.c==="o"?"up":"dn"}">${r.t}</span>`).join("")}</a>`
    :`<a class="fv" href="#nba-player-${encodeURIComponent(x.n)}"><b>${nbaBadge(x.p.tm)} ${nbaEsc(x.n)}</b><span class="small">${x.t}</span></a>`;
  return `<div class="card" style="margin-bottom:12px"><h2 style="margin-bottom:6px">🧭 Player angles</h2><div class="seg" style="margin-bottom:8px">${[["hot",`🔥 Hot (${HC.hot.length})`],["cold",`🧊 Cold (${HC.cold.length})`],["role",`📈 Role changes (${R.length})`]].map(([k,l])=>`<button class="btn${NB_ANG===k?" on":""}" data-nbang="${k}">${l}</button>`).join("")}</div>
   ${L.map(row).join("")||`<div class="small">Nothing stands out right now.</div>`}<div class="small" style="margin-top:6px">Players in tonight's games, 20+ minutes a night. Last 5 games vs his season.</div></div>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-nbang]");if(!b)return;NB_ANG=b.dataset.nbang;const y=scrollY;if(typeof route!=="undefined")route();scrollTo(0,y)});

/* ---------- 🧠 quick reads for NBA and NFL game pages ---------- */
function xQuickTidy(items,max){const by=new Map();for(const x of items){const y=by.get(x.ic);if(y){if(y.n<2){y.t+=" · "+x.t;y.n++}}else by.set(x.ic,{...x,n:1})}return [...by.values()].slice(0,max||5)}
function xQuickHtml(items,foot){if(!items.length)return "";items=xQuickTidy(items,5);return `<div class="card nhquick" style="margin:12px 0"><h2 style="margin-bottom:6px">🔑 Key takeaways</h2>${items.slice(0,7).map(x=>`<div class="nhq ${x.c}"><span>${x.ic}</span><div>${x.t}</div></div>`).join("")}<div class="small" style="margin-top:6px">${foot||"Automatic notes from this season's numbers — reasons to look closer, not picks."}</div></div>`}
function nbaQuick(g){const out=[],S=(c,ic,t)=>out.push({c,ic,t});const ra=(typeof NBA_REST!=="undefined"&&NBA_REST)||{};
  for(const [t,o] of [[g.a,g.h],[g.h,g.a]]){const r=ra[t],ro=ra[o];if(r&&ro&&r.rest===0&&ro.rest>0)S("dn","😴",`<b>${nbaEsc(nbaShort(t))}</b> are on a back-to-back — ${nbaEsc(nbaShort(o))} are rested.`)}
  const k=typeof nbaKeyOutAll!=="undefined"?nbaKeyOutAll(g):[];if(k.length)S("dn","🚑",`Out: <b>${k.map(nbaEsc).join(", ")}</b> — lines usually already account for it; player props for teammates may not.`);
  const E=nbaOddsEdges(g).filter(e=>e.edge>=.04);for(const e of E.slice(0,2))S("up","💰",`Our numbers like <b>${e.pick}</b> (${e.mk.toLowerCase()}) — ${Math.round(e.me*100)}% vs ${Math.round(e.bk*100)}% from the odds.`);
  const M=typeof nbaEdges!=="undefined"?nbaEdges(g):[];for(const m of M.slice(0,3))S(m.c,m.c==="up"?"🎯":"🧱",m.t);
  if(typeof xaTakeaways!=="undefined")out.push(...xaTakeaways("nba",g));
  return xQuickHtml(out)}
function nflQuick(g){const out=[],S=(c,ic,t)=>out.push({c,ic,t});
  const E=nflOddsEdges(g).filter(e=>e.edge>=.04);for(const e of E.slice(0,2))S("up","💰",`Our projection likes <b>${esc(e.pick)}</b> (${e.mk.toLowerCase()}) — ${Math.round(e.me*100)}% vs ${Math.round(e.bk*100)}% from the odds.`);
  const M=typeof nflEdges!=="undefined"?nflEdges(g):[];for(const m of M.slice(0,3))S(m.e>0?"up":"dn",m.e>0?"🎯":"🧱",m.t);
  if(typeof OUT!=="undefined"){const o=Object.keys(OUT).filter(n=>{const P=PINFO[n];return P&&(P.team===g.away||P.team===g.home)}).slice(0,4);if(o.length)S("dn","🚑",`Out: <b>${o.map(esc).join(", ")}</b>.`)}
  if(typeof xaTakeaways!=="undefined")out.push(...xaTakeaways("nfl",g));
  return xQuickHtml(out)}

/* ---------- 📉 closing-line check for tracked bets ---------- */
const XCLOSE={};
async function xCloseLoad(d){if(!d||location.protocol==="file:")return null;if(d in XCLOSE)return XCLOSE[d];XCLOSE[d]=null;
  try{const r=await fetch(`data/close/${d}.json`,{cache:"no-store"});if(r.ok){const j=await r.json(),m={};for(const [k,v] of Object.entries(j)){const [sp,nm,mk]=k.split("|");m[sp+"|"+(typeof loNorm!=="undefined"?loNorm(nm):nm)+"|"+mk]=v}XCLOSE[d]=m}}catch(e){}
  return XCLOSE[d]}
/* -> {beat:true/false/null, txt} comparing the bet with the last pre-game line we saw */
function xBetDate(b){if(b.date)return b.date;if(b.k==="prop"&&b.team&&typeof oppOf!=="undefined"&&typeof PLAYS_WEEK!=="undefined"&&b.wk===PLAYS_WEEK){const o=oppOf(b.team);return o&&typeof nflDate!=="undefined"?nflDate(o.g):null}return null}
function xClv(b,close){if(!close||!b.player)return null;const sp=b.k==="nbaprop"?"nba":b.k==="nhlprop"?"nhl":b.k==="prop"?"nfl":null;if(!sp)return null;
  const c=close[sp+"|"+(typeof loNorm!=="undefined"?loNorm(b.player):b.player)+"|"+b.market];if(!c)return null;const [cl,co,cu]=c,over=b.side==="over";
  if(cl!==b.line){const beat=over?cl>b.line:cl<b.line;return {beat,txt:`closed at ${cl} (you took ${b.line})`}}
  const cOdds=over?co:cu;if(cOdds==null||b.odds==null)return null;const d=xImp(cOdds)-xImp(b.odds);if(Math.abs(d)<.005)return {beat:null,txt:`closed at the same price (${xOdds(cOdds)})`};
  return {beat:d>0,txt:`closed at ${xOdds(cOdds)} (you got ${xOdds(b.odds)})`}}
async function xClvDecorate(){const host=document.getElementById("v-bets");if(!host||typeof betsLoad==="undefined")return;const a=betsLoad();let n=0,w=0;
  for(const b of a){const d=xBetDate(b);if(!d||!b.player)continue;const el=host.querySelector(`[data-clv="${b.id}"]`);const c=await xCloseLoad(d),r=xClv(b,c);if(!r||!el)continue;n++;if(r.beat)w++;
    el.innerHTML=`<span class="nhcx ${r.beat===true?"up":r.beat===false?"dn":""}">${r.beat===true?"✅ Beat the closing line":r.beat===false?"❌ Line moved against you":"➖ Even with the close"} — ${r.txt}</span>`}
  const s=document.getElementById("clvSum");if(s&&n)s.innerHTML=`<div class="card" style="padding:12px;margin-bottom:12px"><b>📉 Closing line check</b> <span class="small">— beat the close on <b>${w} of ${n}</b> bets we can check (${Math.round(w/n*100)}%). Beating the closing line often is the best long-run sign of good bets, win or lose.</span></div>`}

/* ---------- ⭐ NHL Plays of the day (locked + graded by tools/track.js) ---------- */
function nhlPlayTitle(x){if(x.type==="prop"){const m=typeof NH_MK!=="undefined"&&NH_MK[x.k];return x.k==="hanyG"?`${x.nm} to score`:`${x.nm} ${x.side==="o"?"Over":"Under"} ${x.line} ${m?m[1].toLowerCase():x.k}`}
  return `${x.pick}${x.mk==="Moneyline"?" moneyline":""} <span class="small">(${x.a} @ ${x.h})</span>`}
function nhlPlaysCard(){if(typeof TRACK==="undefined"||!TRACK)return "";const P=TRACK.nhlPlays||[],S=TRACK.sum&&TRACK.sum.nhl&&TRACK.sum.nhl.plays;
  const rec=S&&(S.w+S.l)?`${S.w}-${S.l}${S.p?"-"+S.p:""} · ${S.u>0?"+":""}${S.u}u`:"tracking started Nov 8";
  return `<div class="card potd" style="margin-bottom:12px"><h2 style="margin-bottom:2px">⭐ NHL Plays of the day</h2><div class="small" style="margin-bottom:6px">${P.length?`Locked before puck drop · counted in our record (${rec})`:`Posted about 6 hours before the first puck drop, once lines are up. Record: ${rec}.`}</div>
   ${P.map(x0=>{const L=!x0.r&&typeof finItem!=="undefined"&&typeof NHL_DATE!=="undefined"&&NHL_DATE?finItem("nhl",NHL_DATE,x0):null;return L?{...x0,r:L.r,v:L.v,lv:1}:x0}).map((x,i)=>`<div class="pod"><div class="podn">${i+1}</div><div style="min-width:0;flex:1" ${x.type==="prop"?`data-nhlp="${esc(JSON.stringify({nm:x.nm,k:x.k,side:x.side,line:x.line,tm:x.tm}))}"`:""}><div class="bpl"><b class="${x.r==="win"?"up":x.r==="loss"?"dn":""}">${x.type==="prop"?(typeof esc!=="undefined"?esc(nhlPlayTitle(x)):nhlPlayTitle(x)):nhlPlayTitle(x)}</b> <span class="small">${xOdds(x.odds)}</span>${x.r?` <span class="nhtag ${x.r==="win"?"up":x.r==="loss"?"dn":""}">${x.r==="win"?"✓ won":x.r==="loss"?"✗ lost":x.r}${x.v!=null?" · "+x.v:""}</span>${x.lv?`<span class="livegr" title="Graded from ESPN's final box score — made official at the next site update">⚡ live</span>`:""}`:""}</div><div class="small">${x.why||""}</div></div></div>`).join("")}
   <div class="small" style="margin-top:6px">Picked automatically: props that hit 7+ of the last 10 with a clear edge over the odds (no worse than −200, nobody injured), plus our biggest game edges. Leans, not guarantees — bet small.</div></div>`}
/* ---------- 📊 tracking: best props + our game numbers, per sport ---------- */
function xTrackCard(){if(typeof TRACK==="undefined"||!TRACK)return "";const S=TRACK.sum||{},rows=[];const pc=(w,l)=>w+l?Math.round(w/(w+l)*100)+"%":"–",u=x=>(x>0?"+":"")+(+x).toFixed(2)+"u";
  for(const [sp,nm] of [["nba","NBA"],["nhl","NHL"],["nfl","NFL"]]){const s=S[sp];if(!s)continue;const E=Object.values(s.edge||{}),ew=E.reduce((a,e)=>a+e[0],0),el=E.reduce((a,e)=>a+e[1],0),eu=E.reduce((a,e)=>a+e[2],0);
    let win=s.win,tot=s.tot;if(sp==="nhl"&&typeof NHL_MODEL!=="undefined"&&NHL_MODEL){win=NHL_MODEL.win;tot=NHL_MODEL.tot;const NE=Object.values(NHL_MODEL.edge||{});rows.push([nm,s.best,win,tot,[NE.reduce((a,e)=>a+e[0],0),NE.reduce((a,e)=>a+e[1],0),NE.reduce((a,e)=>a+e[2],0)]]);continue}
    rows.push([nm,s.best,win,tot,[ew,el,eu]])}
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">📊 How our numbers are doing</h2><div class="small" style="margin-bottom:8px">Saved before every game and graded after — nothing is picked after the fact. Best props = each day's top 10 by our chance of winning, 1 unit each at the posted odds.</div>${typeof finTonightHtml!=="undefined"?finTonightHtml():""}
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Top-10 best props</th><th>Winner picked</th><th>Total O/U</th><th>Odds edges ≥ 4%</th></tr></thead><tbody>
   ${rows.map(([nm,b,w,t,e])=>`<tr><td><b>${nm}</b></td><td>${b.w}-${b.l} <span class="small">${pc(b.w,b.l)} · <span class="${b.u>0?"up":b.u<0?"dn":""}">${u(b.u)}</span></span></td><td>${w[0]}-${w[1]} <span class="small">${pc(w[0],w[1])}</span></td><td>${t[0]}-${t[1]} <span class="small">${pc(t[0],t[1])}</span></td><td>${e[0]}-${e[1]} <span class="small ${e[2]>0?"up":e[2]<0?"dn":""}">${u(e[2])}</span></td></tr>`).join("")}</tbody></table></div>
   <div class="small" style="margin-top:6px">Tracking started Nov 8, 2026 — give it a few weeks before trusting any of these.</div></div>`}

/* ---------- 🔥 one list for tonight, all sports ---------- */
function xTonightCard(){const L=[];const pill=s=>`<span class="xsp ${s}">${s==="soc"?"⚽":s.toUpperCase()}</span>`;
  try{if(typeof nbaBest!=="undefined")for(const b of nbaBest().slice(0,5))L.push({sp:"nba",e:b.sc-xImp(b.odds??-110),href:`#nba-player-${encodeURIComponent(b.nm)}`,t:`${nbaEsc(b.nm)} ${b.side==="o"?"Over":"Under"} ${b.line} ${NBA_MK[b.k]?NBA_MK[b.k][1]:b.k}`,o:b.odds,s:`our chance ${Math.round(b.sc*100)}%`})}catch(e){}
  try{if(typeof nhBest!=="undefined"&&NHL_DATE)for(const b of nhBest().filter(b=>b.g.d===NHL_DATE).slice(0,5))L.push({sp:"nhl",e:b.edge,href:`#nhl-player-${encodeURIComponent(b.nm)}`,t:`${nhE(b.nm)} ${b.side==="o"?(b.k==="hanyG"?"to score":"Over "+b.line):"Under "+b.line} ${b.k==="hanyG"?"":NH_MK[b.k][1]}`,o:b.odds,s:`hit ${b.s.l10}/${b.s.n10} last 10`})}catch(e){}
  try{if(typeof nflBest!=="undefined"){const soon=g=>{const d=nflDate(g);if(!d)return false;return (Date.parse(d)-Date.parse(etNow().d))/864e5<=1};for(const b of nflBest().filter(b=>soon(b.g)).slice(0,5))L.push({sp:"nfl",e:b.edge,href:"#props",nfl:b.name,t:`${esc(b.name)} ${b.k==="anyTD"?"anytime TD":(b.side==="o"?"Over ":"Under ")+b.line+" "+MARKETS[b.k].n}`,o:b.odds,s:`our chance ${Math.round(b.sc*100)}%`})}}catch(e){}
  try{for(const e of (typeof NBA_SLATE!=="undefined"?NBA_SLATE:[]).flatMap(nbaOddsEdges).slice(0,3))L.push({sp:"nba",e:e.edge,href:e.href,t:`${e.pick} <span class="small">${e.mk.toLowerCase()} · ${e.game}</span>`,o:e.odds,s:`us ${Math.round(e.me*100)}% vs ${Math.round(e.bk*100)}%`})}catch(e){}
  try{if(typeof nhEdges!=="undefined"&&NHL_DATE)for(const e of NHL_SLATE.filter(g=>!nhStarted(g)).flatMap(nhEdges).sort((a,b)=>b.edge-a.edge).slice(0,3))L.push({sp:"nhl",e:e.edge,href:`#nhl-game-${e.g.id}`,t:`${nhE(e.pick)} <span class="small">${e.mk.toLowerCase()} · ${nhE(e.g.a)} @ ${nhE(e.g.h)}</span>`,o:e.odds,s:`us ${Math.round(e.me*100)}% vs ${Math.round(e.bk*100)}%`})}catch(e){}
  try{if(typeof socTonightItems!=="undefined")for(const x of socTonightItems())L.push(Object.assign({o:null,s:"our estimate vs the best price"},x))}catch(e){}
  try{if(typeof socBestProps!=="undefined"&&window.SOC_P_OK){const d=socToday(),d1=socAddDays(d,1);for(const x of socBestProps().filter(x=>[d,d1].includes(socDay(x.f.t))).slice(0,3))L.push({sp:"soc",e:x.edge,href:`#soccer-game-${x.f.id}`,t:`${socE(x.nm)} ${socE(socPropLab(x.mk,x.line))}`,o:x.price,s:`hit ${x.h}/${x.n} last 10`})}}catch(e){}
  /* hit scores aren't comparable across sports, so take each sport's best 3 props + best game edge, then rank */
  const top=[];for(const sp of ["nba","nhl","nfl","soc"]){const P=L.filter(x=>x.sp===sp&&x.e>0&&!x.t.includes('class="small"')).sort((a,b)=>b.e-a.e).slice(0,3),G=L.filter(x=>x.sp===sp&&x.e>0&&x.t.includes('class="small"')).sort((a,b)=>b.e-a.e).slice(0,1);top.push(...P,...G)}
  top.sort((a,b)=>b.e-a.e);if(!top.length)return "";
  return `<div class="card" style="margin-top:12px"><h2 style="margin-bottom:2px">🔥 Best of tonight · all sports</h2><div class="small" style="margin-bottom:8px">Each sport's 3 strongest props and its biggest game edge, ranked by how far our numbers beat what the odds need.</div>
   ${top.map(x=>`<a class="nher" href="${x.href}" ${x.nfl?`data-nflfav="${esc(x.nfl)}"`:""}><span><span>${pill(x.sp)} <b>${x.t}</b></span><span class="small">${x.s}</span></span><span class="nhedv"><b class="up">+${Math.round(x.e*100)}%</b><span class="small">${xOdds(x.o)}</span></span></a>`).join("")}
   <div class="small" style="margin-top:6px">Leans from past results, not guarantees — bet small.</div></div>`}

/* ---------- 📡 NHL live prop tracking (ESPN summary box score, in the visitor's browser) ---------- */
const NHL_LIVE_SUM="https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=",NHL_LBOX={};
async function nhlLiveBox(id){const b=NHL_LBOX[id];if(b&&Date.now()-b.t<25000)return b.p;
  try{const r=await fetch(NHL_LIVE_SUM+id,{cache:"no-store"});if(!r.ok)throw 0;const j=await r.json(),p={};
    for(const tm of ((j.boxscore||{}).players||[]))for(const st of tm.statistics||[]){const lab=(st.labels||st.names||st.keys||[]).map(x=>String(x).toUpperCase());
      for(const a of st.athletes||[]){const nm=a.athlete&&a.athlete.displayName;if(!nm||!a.stats)continue;const o=p[loNorm(nm)]||(p[loNorm(nm)]={});lab.forEach((l,i)=>{if(o[l]==null)o[l]=a.stats[i]})}}
    NHL_LBOX[id]={t:Date.now(),p};return p}catch(e){return b?b.p:null}}
function nhlLiveVal(o,k){if(!o)return null;const n=l=>{for(const x of l){const v=o[x];if(v!=null&&v!==""&&isFinite(+v))return +v}return null};
  if(k==="hpts"){const g=n(["G","GOALS"]),a=n(["A","ASSISTS"]);return g==null||a==null?null:g+a}
  return n({hgoals:["G","GOALS"],hanyG:["G","GOALS"],hast:["A","ASSISTS"],hsog:["S","SOG","SHOTS"],hblk:["BS","BLK","BLOCKEDSHOTS"],hhit:["HT","HITS","H"],hfow:["FW","FOW","FACEOFFSWON"],hsaves:["SV","SAVES"]}[k]||[])}
/* host: element to put the line into; x: {nm, k, side, line, tm} */
async function nhlLiveLine(host,x){if(!host||typeof liveGet==="undefined"||typeof nhGameOf==="undefined")return;const w=nhWho(x.nm),g=w&&nhGameOf(w.tm);const lg=g&&g.d===NHL_DATE&&liveGet("nhl",g.a,g.h);let el=host.querySelector(".lvp");
  if(!lg||lg.st==="pre"){if(el)el.remove();return}const bx=await nhlLiveBox(lg.id),v=bx&&nhlLiveVal(bx[loNorm(x.nm)],x.k);if(v==null){if(el)el.remove();return}
  const over=x.side!=="u",line=x.k==="hanyG"?.5:x.line,hit=over?v>line:v<line,fin=lg.st==="post",u=NH_MK[x.k]?NH_MK[x.k][2]:"";
  const html=`<div class="lvp ${fin?(hit?"w":"l"):"on"}">${fin?`${hit?"✅ Hit":"❌ Missed"} — finished with <b>${v}</b> ${u}`:`<span class="lvdot"></span>&nbsp; So far: <b>${v}</b> ${u} (line ${line}) · ${esc(lg.det)}${over?(v>line?" · already over ✅":` · needs ${+(line-v+.5).toFixed(1)} more`):(v>line?" · already over ❌":"")}`}</div>`;
  el=host.querySelector(".lvp");if(el)el.outerHTML=html;else host.insertAdjacentHTML("beforeend",html)}
async function nhlLiveDecorate(){if(typeof NHL_DATE==="undefined"||!NHL_DATE)return;
  for(const el of document.querySelectorAll("[data-nhlp]")){try{await nhlLiveLine(el,JSON.parse(el.dataset.nhlp))}catch(e){}}
  if((location.hash||"").slice(1)==="bets"&&typeof betsLoad!=="undefined")for(const b of betsLoad()){if(b.k!=="nhlprop"||b.date!==NHL_DATE)continue;const el=document.querySelector(`[data-clv="${b.id}"]`);if(el)await nhlLiveLine(el.parentElement,{nm:b.player,k:b.market,side:b.side==="over"?"o":"u",line:b.line,tm:b.team})}}

/* ---------- 🎟 smart parlays: same-game legs that tend to hit together ---------- */
function xParlays(legs,max,sameTeam){/* legs: [{spec, label}] — spec as used by the parlay slip (nbaprop / nhlprop / prop) */
  if(typeof sgpPair==="undefined"||legs.length<2)return [];const dec=o=>o>0?1+o/100:1+100/(-o),out=[];
  for(let i=0;i<legs.length;i++)for(let j=i+1;j<legs.length;j++){const A=legs[i],B=legs[j];if(A.spec.player===B.spec.player)continue;
    if(sameTeam&&A.spec.team!==B.spec.team)continue;   /* NFL: past games are matched by week, so only teammates share the same games */
    const r=sgpPair(A.spec,B.spec);if(!r||!r.n||r.n<6||r.lift==null)continue;const joint=r.both/r.n,price=dec(A.spec.odds)*dec(B.spec.odds),need=1/price;
    if(joint<.4||r.lift<1.05)continue;out.push({A,B,n:r.n,both:r.both,joint,price,need,edge:joint-need,lift:r.lift})}
  return out.sort((a,b)=>b.edge-a.edge).slice(0,max||3)}
function xParlayCard(legs,title,sameTeam){const P=xParlays(legs,3,sameTeam);
  if(!P.length)return legs.length>=2?`<div class="card" style="margin:10px 0"><h2 style="margin-bottom:2px">🎟 Smart parlays${title?" · "+title:""}</h2><div class="small">No two strong legs in this game have hit together often enough in the games both players played — nothing to suggest right now.</div></div>`:"";const am=d=>d>=2?"+"+Math.round((d-1)*100):"−"+Math.round(100/(d-1));
  return `<div class="card" style="margin:10px 0"><h2 style="margin-bottom:2px">🎟 Smart parlays${title?" · "+title:""}</h2><div class="small" style="margin-bottom:8px">Two strong legs from this game that hit together more often than chance, from the games both players played${sameTeam?" (teammates)":""}.</div>
   ${P.map(p=>`<div class="sgr t"><b>🤝 ${p.A.label} + ${p.B.label}</b><span class="small">Both hit in <b>${p.both} of ${p.n}</b> shared games (${Math.round(p.joint*100)}%) · priced as two separate bets ≈ ${am(p.price)}, which needs ${Math.round(p.need*100)}%.</span>
     <div class="obrow" style="margin-top:4px">${typeof actBtn!=="undefined"?actBtn(p.A.spec,`＋ ${p.A.label}`,"ov")+actBtn(p.B.spec,`＋ ${p.B.label}`,"ov"):""}</div></div>`).join("")}
   <div class="small" style="margin-top:6px">Books price same-game parlays lower because they know legs are linked — check the real parlay price; small samples, bet small.</div></div>`}
function nhlParlayLegs(g){if(typeof nhBest==="undefined"||typeof nhlSpec==="undefined")return [];const L=nhBest().filter(b=>b.g.id===g.id&&b.s.p>=.6&&b.k!=="hanyG").slice(0,12),out=[];
  for(const b of L){const s=nhlSpec(b.nm,b.k,b.side==="o"?"over":"under");if(s)out.push({spec:s,label:`${b.nm.split(" ").slice(-1)[0]} ${b.side==="o"?"o":"u"}${b.line} ${NH_MK[b.k][0]}`})}return out}
function nflParlayLegs(g){if(typeof nflBest==="undefined"||typeof specProp==="undefined")return [];const tms=[g.away,g.home];
  const L=nflBest().filter(b=>tms.includes(b.pl.team)&&b.sc>=.55&&b.odds!=null).slice(0,14),out=[];
  for(const b of L){const s=specProp(b.name,b.k,b.side==="o"?"over":"under");if(!s||s.odds==null)continue;s.line=b.line;
    out.push({spec:s,label:`${b.name.split(" ").filter(w=>!/^(Jr\.?|Sr\.?|II|III|IV)$/.test(w)).slice(-1)[0]} ${b.k==="anyTD"?"TD":`${b.side==="o"?"o":"u"}${b.line} ${MARKETS[b.k].n.toLowerCase()}`}`})}return out}
function nbaParlayLegs(g){if(typeof nbaBest==="undefined"||typeof nbaSpec==="undefined")return [];const L=nbaBest().filter(b=>b.g&&b.g.id===g.id&&b.sc>=.6).slice(0,12),out=[];
  for(const b of L){const s=nbaSpec(b.nm,b.k,b.side==="o"?"over":"under");if(s)out.push({spec:s,label:`${b.nm.split(" ").slice(-1)[0]} ${b.side==="o"?"o":"u"}${b.line} ${NBA_MK[b.k]?NBA_MK[b.k][2]:b.k}`})}return out}

/* ---------- one tabbed "insights" card instead of a stack of cards ---------- */
const XINS={};
function xInsights(id,title,tabs){tabs=tabs.filter(t=>t[2]);if(!tabs.length)return "";const cur=tabs.some(t=>t[0]===XINS[id])?XINS[id]:tabs[0][0];
  const strip=h=>h.replace(/^\s*<div class="card[^"]*"[^>]*>/,"").replace(/<\/div>\s*$/,"").replace(/<h2[^>]*>[\s\S]*?<\/h2>/,"");
  return `<div class="card xins" data-xins="${id}" style="margin-top:14px"><h2 style="margin-bottom:8px">${title}</h2><div class="seg ttabs">${tabs.map(([k,l])=>`<button class="btn${k===cur?" on":""}" data-xinst="${id}|${k}">${l}</button>`).join("")}</div>
   ${tabs.map(([k,,h])=>`<div class="xinsp" data-xinsp="${k}"${k===cur?"":" hidden"}>${strip(h)}</div>`).join("")}</div>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-xinst]");if(!b)return;const [id,k]=b.dataset.xinst.split("|");XINS[id]=k;const c=b.closest(".xins");
  c.querySelectorAll("[data-xinst]").forEach(x=>x.classList.toggle("on",x===b));c.querySelectorAll("[data-xinsp]").forEach(p=>p.hidden=p.dataset.xinsp!==k)});

/* ---------- 🎯 one prop row for every sport: who · the bet · odds · hit-rate bar · one plain reason · our chance ----------
   o: {i, tag, href, attrs, badge, name, sub, chips, pick, odds, book, l10:[hits,games], hits:[[h,n,label]], why, chance, need, act} */
function xPropRow(o){const L=o.l10&&o.l10[1]?o.l10:null,pc=L?Math.round(L[0]/L[1]*100):0,tag=o.href?"a":"div";
  const more=(o.hits||[]).filter(h=>h&&h[1]).map(h=>`${h[0]}/${h[1]} ${h[2]}`).join(" · ");
  return `<${tag} class="bp xp"${o.href?` href="${o.href}"`:""} ${o.attrs||""}>${o.i!=null?`<div class="bpn">${o.i+1}</div>`:""}
   <div class="bpm"><div class="bpw">${o.badge||""}<b>${o.name}</b> <span class="small">${o.sub||""}</span>${o.chips||""}</div>
    <div class="bpl"><b class="xpk">${o.pick}</b> <span class="xpo">${o.odds}</span>${o.book?` <span class="small">${o.book}</span>`:""}</div>
    ${L?`<div class="xph"><span class="xpbar" aria-hidden="true"><i style="width:${pc}%"></i></span><span>Hit <b>${L[0]} of last ${L[1]}</b></span></div>`:""}
    ${more||o.why?`<div class="xpw small">${[more,o.why].filter(Boolean).join(" · ")}</div>`:""}</div>
   <div class="bps"><b>${o.chance}%</b><span>our chance</span><span class="small">odds need ${o.need}%</span>${o.act||""}</div></${tag}>`}

/* ---------- 🎯 did our chances come true? (calibration from the tracker) ---------- */
function xCalCard(){if(typeof TRACK==="undefined"||!TRACK||!TRACK.sum)return "";const S=TRACK.sum,G=[];const u=x=>(x>0?"+":"")+(+x).toFixed(1)+"u";
  const judge=(n,said,got)=>n<20?`<span class="small" title="fewer than 20 graded">·</span>`:Math.abs(got-said)<=.05?"✅":got<said?"⬇️":"⬆️";
  const order={props:["50–59%","60–69%","70–79%","80%+"],edges:["4–6%","7–9%","10%+"]};
  for(const [sp,nm] of [["nba","🏀 NBA"],["nhl","🏒 NHL"],["nfl","🏈 NFL"]]){const c=S[sp]&&S[sp].cal;if(!c)continue;const R=[];
    for(const k of order.props){const B=c.props[k];if(B&&B[0])R.push(["Props we gave "+k,B])}
    for(const k of order.edges){const B=c.edges[k];if(B&&B[0])R.push(["Game edges "+k,B])}if(R.length)G.push([nm,R])}
  const sp=S.soc&&S.soc.plays;if(!G.length&&!(sp&&sp.w+sp.l))return `<div class="card" style="margin-top:14px"><h2>🎯 Did our chances come true?</h2><div class="small">Fills in as graded picks pile up — every top prop and game edge is saved before the game with the chance we gave it.</div></div>`;
  const row=(lab,said,B)=>`<tr><td>${lab} <span class="small">(${B[0]})</span></td><td>${said==null?"–":Math.round(said*100)+"%"}</td><td><b>${Math.round(B[1]/B[0]*100)}%</b> ${said==null?"":judge(B[0],said,B[1]/B[0])}</td><td class="${B[3]>0?"up":B[3]<0?"dn":""}">${u(B[3])}</td></tr>`;
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">🎯 Did our chances come true?</h2><div class="small" style="margin-bottom:8px">Every day's top props and game edges are saved before the game with the chance we gave them, then graded. If we say 65% and they hit about 65% of the time, the numbers can be trusted.</div>
   <table class="bxt calt"><thead><tr><th></th><th>We said</th><th>Hit</th><th>Units</th></tr></thead><tbody>
   ${G.map(([nm,R])=>`<tr class="calh"><td colspan="4">${nm}</td></tr>${R.map(([l,B])=>row(l,B[2]/B[0],B)).join("")}`).join("")}
   ${sp&&sp.w+sp.l?`<tr class="calh"><td colspan="4">⚽ Soccer</td></tr>${row("Plays of the day",null,[sp.w+sp.l,sp.w,0,sp.u])}`:""}</tbody></table>
   <div class="small" style="margin-top:6px">✅ within 5 points of what we said · ⬇️ hit less often · ⬆️ hit more often · “·” fewer than 20 graded picks, too early to judge. (n) = graded picks. 1 unit each at the posted odds. Tracking started Nov 8, 2026.</div></div>`}

/* ---------- 🎟 Soccer smart parlays: match-result, goals and both-teams-to-score legs that go together.
   Joint chance from our score model (Poisson + Dixon-Coles, the same lh / la / rho as the estimate): our chance of the
   first leg × our model's chance of the second given the first. Compared with the two book prices multiplied. ---------- */
function socParlays(f){const P=f.proj,O=f.odds||{};if(!P||P.lh==null||P.la==null)return [];const rho=P.rho||0,N=11,M=[];let tot=0;
  const pois=(l,k)=>{let v=Math.exp(-l);for(let i=1;i<=k;i++)v*=l/i;return v};
  for(let i=0;i<N;i++){M[i]=[];for(let j=0;j<N;j++){let t=1;if(i===0&&j===0)t=1-P.lh*P.la*rho;else if(i===0&&j===1)t=1+P.lh*rho;else if(i===1&&j===0)t=1+P.la*rho;else if(i===1&&j===1)t=1-rho;
    M[i][j]=Math.max(0,pois(P.lh,i)*pois(P.la,j)*t);tot+=M[i][j]}}
  const pr=fn=>{let s=0;for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(fn(i,j))s+=M[i][j];return s/tot};
  const L=[],add=(mk,lab,fn,odds,kind,side,line,book,ours)=>{if(odds!=null)L.push({mk,lab,fn,odds,ours:ours!=null?ours:pr(fn),spec:socSpec(f,kind,side,line,odds,book)})};
  if(O.ml){add("ml",`${socTm(f.h)} to win`,(i,j)=>i>j,O.ml.h,"ml","h",null,O.ml.hb,P.p&&P.p[0]);add("ml","Draw",(i,j)=>i===j,O.ml.d,"ml","d",null,O.ml.db,P.p&&P.p[1]);add("ml",`${socTm(f.a)} to win`,(i,j)=>i<j,O.ml.a,"ml","a",null,O.ml.ab,P.p&&P.p[2])}
  const mt=O.main_tot;if(mt&&O.tot&&O.tot[mt]){const [o,ob,u,ub]=O.tot[mt],ln=+mt;add("tot",`Over ${mt} goals`,(i,j)=>i+j>ln,o,"tot","o",ln,ob,P.o&&P.o[mt]);add("tot",`Under ${mt} goals`,(i,j)=>i+j<ln,u,"tot","u",ln,ub,P.o&&P.o[mt]!=null?1-P.o[mt]:null)}
  if(O.btts){add("btts","Both teams score",(i,j)=>i>0&&j>0,O.btts.y,"btts","y",null,O.btts.yb,P.btts);add("btts","Not both teams score",(i,j)=>!(i>0&&j>0),O.btts.n,"btts","n",null,O.btts.nb,P.btts!=null?1-P.btts:null)}
  const dec=o=>o>0?1+o/100:1+100/(-o),out=[];
  for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const A=L[a],B=L[b];if(A.mk===B.mk)continue;
    const pA=pr(A.fn),pAB=pr((i,j)=>A.fn(i,j)&&B.fn(i,j));if(!pA||pAB<=0)continue;const joint=A.ours*(pAB/pA);if(joint<.3)continue;
    const price=dec(A.odds)*dec(B.odds),need=1/price,lift=pAB/(pA*pr(B.fn));if(lift<1.05)continue;out.push({A,B,joint,price,need,edge:joint-need,lift})}
  return out.filter(x=>x.edge>0).sort((a,b)=>b.edge-a.edge).slice(0,3)}
function socParlayCard(f){if(!f||socStarted(f)||!f.proj||!f.odds)return "";const P=socParlays(f),am=d=>d>=2?"+"+Math.round((d-1)*100):"−"+Math.round(100/(d-1));
  return `<div class="card" style="margin:12px 0"><h2 style="margin-bottom:2px">🎟 Smart parlays</h2><div class="small" style="margin-bottom:8px">Two picks from this match that go together (one makes the other more likely), where our estimate for both beats the two prices multiplied.</div>
   ${P.length?P.map(p=>`<div class="sgr t"><b>🤝 ${socE(p.A.lab)} + ${socE(p.B.lab)}</b><span class="small">Our chance both hit: <b>${Math.round(p.joint*100)}%</b> (${p.lift.toFixed(2)}× more likely together than apart) · as two separate bets ≈ ${am(p.price)}, which needs ${Math.round(p.need*100)}%.</span>
     <div class="obrow" style="margin-top:4px">${socBetBtn(p.A.spec)} <span class="small">${socE(p.A.lab)}</span> ${socBetBtn(p.B.spec)} <span class="small">${socE(p.B.lab)}</span></div></div>`).join("")
     :`<div class="small">No pair from this match beats the prices right now.</div>`}
   <div class="small" style="margin-top:6px">Books price same-game parlays lower because they know these go together — check the real parlay price; it's our estimate, not a sure thing.</div></div>`}
