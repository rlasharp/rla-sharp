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
function xQuickHtml(items,foot){if(!items.length)return "";return `<div class="card nhquick" style="margin:12px 0"><h2 style="margin-bottom:6px">🧠 Quick read</h2>${items.slice(0,6).map(x=>`<div class="nhq ${x.c}"><span>${x.ic}</span><div>${x.t}</div></div>`).join("")}<div class="small" style="margin-top:6px">${foot||"Automatic notes from this season's numbers — reasons to look closer, not picks."}</div></div>`}
function nbaQuick(g){const out=[],S=(c,ic,t)=>out.push({c,ic,t});const ra=(typeof NBA_REST!=="undefined"&&NBA_REST)||{};
  for(const [t,o] of [[g.a,g.h],[g.h,g.a]]){const r=ra[t],ro=ra[o];if(r&&ro&&r.rest===0&&ro.rest>0)S("dn","😴",`<b>${nbaEsc(nbaShort(t))}</b> are on a back-to-back — ${nbaEsc(nbaShort(o))} are rested.`)}
  const k=typeof nbaKeyOutAll!=="undefined"?nbaKeyOutAll(g):[];if(k.length)S("dn","🚑",`Out: <b>${k.map(nbaEsc).join(", ")}</b> — lines usually already account for it; player props for teammates may not.`);
  const E=nbaOddsEdges(g).filter(e=>e.edge>=.04);for(const e of E.slice(0,2))S("up","💰",`Our numbers like <b>${e.pick}</b> (${e.mk.toLowerCase()}) — ${Math.round(e.me*100)}% vs ${Math.round(e.bk*100)}% from the odds.`);
  const M=typeof nbaEdges!=="undefined"?nbaEdges(g):[];for(const m of M.slice(0,3))S(m.c,m.c==="up"?"🎯":"🧱",m.t);
  return xQuickHtml(out)}
function nflQuick(g){const out=[],S=(c,ic,t)=>out.push({c,ic,t});
  const E=nflOddsEdges(g).filter(e=>e.edge>=.04);for(const e of E.slice(0,2))S("up","💰",`Our projection likes <b>${esc(e.pick)}</b> (${e.mk.toLowerCase()}) — ${Math.round(e.me*100)}% vs ${Math.round(e.bk*100)}% from the odds.`);
  const M=typeof nflEdges!=="undefined"?nflEdges(g):[];for(const m of M.slice(0,3))S(m.e>0?"up":"dn",m.e>0?"🎯":"🧱",m.t);
  if(typeof OUT!=="undefined"){const o=Object.keys(OUT).filter(n=>{const P=PINFO[n];return P&&(P.team===g.away||P.team===g.home)}).slice(0,4);if(o.length)S("dn","🚑",`Out: <b>${o.map(esc).join(", ")}</b>.`)}
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
