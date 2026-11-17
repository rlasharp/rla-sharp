/* ---------- ⚖️ Player comparison: two players side by side — averages (season, last 10, last 5), today's line for each stat
   if one is posted, how often he went over it in his last 10, and his next opponent. NBA, NHL and NFL. Route: #compare/<sp>/<a>/<b> ---------- */
const CMP={sp:"nba"};
function cmpE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function cmpNames(sp){try{if(sp==="nba")return Object.keys(NBA_LOGS||{}).filter(n=>NBA_LOGS[n].g&&NBA_LOGS[n].g.length>=3);if(sp==="nhl")return Object.keys(Object.assign({},NHL_P||{},NHL_G||{}));
  return Object.keys(PINFO||{}).filter(n=>pLogs(n).some(l=>l.season===CUR))}catch(e){return []}}
/* per sport: stat list [key, label], values (oldest → newest) for this season, posted line [line, over, under] or null, team, opponent */
function cmpInfo(sp,nm){try{
  if(sp==="nba"){const p=NBA_LOGS[nm];if(!p)return null;const ks=["pts","reb","ast","3pm","pra","stl","blk"].filter(k=>NBA_MK[k]);const g=typeof nbaGameOf!=="undefined"&&nbaGameOf(p.tm);
    return {tm:p.tm,pos:p.pos||"",opp:g?(g.a===p.tm?"@ "+g.h:"vs "+g.a):"",href:`#nba-player-${encodeURIComponent(nm)}`,rows:ks.map(k=>{const r=(NBA_PROPS||[]).find(x=>x[0]===nm&&x[1]===k);return {k,lab:NBA_MK[k][1],v:p.g.map(x=>nbaVal(x,k)),line:r?[r[2],r[3],r[4]]:null}}),min:nbaAvg(p,"min")}}
  if(sp==="nhl"){const w=nhWho(nm);if(!w)return null;const isG=!!(NHL_G||{})[nm],ks=Object.keys(NH_MK).filter(k=>NH_MK[k][3]&&(!!NH_MK[k][4])===isG&&k!=="hanyG");const g=nhGameOf(w.tm);
    return {tm:w.tm,pos:isG?"G":(w.pos||""),opp:g?(g.a===w.tm?"@ "+g.h:"vs "+g.a):"",href:`#nhl-player-${encodeURIComponent(nm)}`,rows:ks.map(k=>{const r=(NHL_PROPS||[]).find(x=>x[0]===nm&&x[1]===k);return {k,lab:NH_MK[k][1],v:nhVals(nm,k).filter(o=>!o.prev).map(o=>o.v),line:r?[r[2],r[3],r[4]]:null}})}}
  const P=PINFO[nm];if(!P)return null;const L=pLogs(nm).filter(l=>l.season===CUR),ks=(typeof marketsFor!=="undefined"?marketsFor(P.pos):[]).filter(k=>k!=="anyTD"&&MARKETS[k]);const o=typeof oppOf!=="undefined"&&oppOf(P.team);
  return {tm:P.team,pos:P.pos,opp:o?(o.home?"vs ":"@ ")+o.opp:"",href:`#props/${encodeURIComponent(nm)}`,rows:ks.map(k=>{const r=realProp(nm,k);return {k,lab:MARKETS[k].n,v:L.map(l=>stat(l,k)).filter(Number.isFinite),line:r?[r[0],r[1],r[2]]:null}})}}catch(e){return null}}
function cmpAvg(v,n){const a=n?v.slice(-n):v;return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function viewCompare(h){const el=document.getElementById("v-compare");if(!el)return;const parts=String(h||"").split("/").map(decodeURIComponent);
  if(parts[1])CMP.sp=parts[1];CMP.a=parts[2]||CMP.a||"";CMP.b=parts[3]||CMP.b||"";const sp=CMP.sp,names=cmpNames(sp).sort();
  const A=CMP.a&&cmpInfo(sp,CMP.a),B=CMP.b&&cmpInfo(sp,CMP.b),f=x=>x==null?"–":(+x).toFixed(1),hit=(v,l)=>{const a=v.slice(-10);return a.length?`${a.filter(x=>x>l).length}/${a.length}`:"–"};
  const head=I=>I?`<a href="${I.href}"><b>${cmpE(I===A?CMP.a:CMP.b)}</b></a><div class="small">${cmpE(I.tm)}${I.pos?" · "+cmpE(I.pos):""}${I.opp?" · next "+cmpE(I.opp):""}${I.min?` · ${f(I.min)} min`:""}</div>`:`<span class="small">pick a player</span>`;
  const keys=[...new Set([...(A?A.rows:[]),...(B?B.rows:[])].map(r=>r.k))],row=(I,k)=>I&&I.rows.find(r=>r.k===k);
  const cell=(r,o)=>{if(!r)return `<td>–</td>`;const s=cmpAvg(r.v),l10=cmpAvg(r.v,10),l5=cmpAvg(r.v,5),ol=o&&row(o,r.k),better=ol&&cmpAvg(ol.v,10)!=null&&l10!=null&&l10>cmpAvg(ol.v,10);
    return `<td class="${better?"up":""}"><b>${f(l10)}</b> <span class="small">L10</span><div class="small">season ${f(s)} · L5 ${f(l5)}</div>${r.line?`<div class="small">line <b>${r.line[0]}</b> · over in ${hit(r.v,r.line[0])} last 10</div>`:""}</td>`};
  el.innerHTML=`<h1>⚖️ Compare players</h1><p class="sub">Two players side by side: their averages this season and lately, today's line for each stat if one is posted, and how often they went over it.</p>
   <div class="seg" style="margin-bottom:10px">${[["nba","🏀 NBA"],["nhl","🏒 NHL"],["nfl","🏈 NFL"]].map(([k,l])=>`<button class="${sp===k?"on":""}" data-cmpsp="${k}">${l}</button>`).join("")}</div>
   <datalist id="cmpList">${names.map(n=>`<option value="${cmpE(n)}">`).join("")}</datalist>
   <div class="grid g2" style="margin-bottom:10px"><input list="cmpList" data-cmp="a" placeholder="First player" value="${cmpE(CMP.a)}"><input list="cmpList" data-cmp="b" placeholder="Second player" value="${cmpE(CMP.b)}"></div>
   ${A||B?`<div class="card"><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>${head(A)}</th><th>${head(B)}</th></tr></thead><tbody>
     ${keys.map(k=>{const ra=row(A,k),rb=row(B,k);return `<tr><th style="text-align:left">${cmpE((ra||rb).lab)}</th>${cell(ra,B)}${cell(rb,A)}</tr>`}).join("")}</tbody></table></div>
     <div class="small" style="margin-top:6px">Green = the higher average over the last 10 games. Lines: today's posted main line (licensed US books) where there is one.</div></div>`:`<div class="card small">Type two ${sp.toUpperCase()} players above (start typing a name).</div>`}`;
  el.querySelectorAll("[data-cmpsp]").forEach(b=>b.onclick=()=>{CMP.sp=b.dataset.cmpsp;CMP.a=CMP.b="";location.hash=`compare/${CMP.sp}`});
  el.querySelectorAll("[data-cmp]").forEach(i=>i.onchange=()=>{CMP[i.dataset.cmp]=i.value.trim();if(names.includes(CMP[i.dataset.cmp])||!CMP[i.dataset.cmp])location.hash=`compare/${CMP.sp}/${encodeURIComponent(CMP.a||"")}/${encodeURIComponent(CMP.b||"")}`})}
/* a "Compare" link for a player page */
function cmpBtn(sp,nm){return `<a class="btn" style="font-size:13px;padding:5px 10px" href="#compare/${sp}/${encodeURIComponent(nm)}/">⚖️ Compare</a>`}

/* ---------- ⭐ All picks: every sport's picks in one list, same format — Plays of the Day (NBA, NHL), the NFL Plays of the Week,
   our game-line picks and the college leans. Route: #allpicks ---------- */
const ALLP={sp:"all"};
function allPicks(){const out=[],pc=x=>x==null?null:Math.round(x*100),odd=o=>o==null?"":(typeof oddsFmt!=="undefined"?oddsFmt(o):o);
  try{if(typeof nbaTodayPlays!=="undefined"&&NBA_PROPS.length){const T=nbaTodayPlays();for(const b of T.P)out.push({sp:"nba",kind:"Play of the Day",txt:`${b.nm} ${b.side==="o"?"Over":"Under"} ${b.line} ${NBA_MK[b.k][1]}`,odds:b.odds,ch:pc(b.sc),need:pc(b.be),game:`${b.g.a} @ ${b.g.h}`,when:b.g.t?b.g.t+" ET":"",href:`#nba-player-${encodeURIComponent(b.nm)}`,lock:T.locked})}}catch(e){}
  try{if(typeof nbaGamePick!=="undefined")for(const g of NBA_SLATE||[]){if(nbaStarted(g))continue;const x=nbaGamePick(g);if(x)out.push({sp:"nba",kind:"Game pick",txt:x.txt,odds:x.odds,ch:pc(x.ch),need:pc(x.need),game:`${g.a} @ ${g.h}`,when:g.t?g.t+" ET":"",href:`#nba-game-${g.id}`,strong:x.strong})}}catch(e){}
  try{if(typeof nhDayPlays!=="undefined"&&NHL_DATE){const L=(typeof TRACK!=="undefined"&&TRACK&&TRACK.nhlPlays)||null,lock=!!(L&&L.length);
    if(lock)for(const x of L)out.push({sp:"nhl",kind:"Play of the Day",txt:x.type==="prop"?`${x.nm} ${x.side==="o"?"Over":"Under"} ${x.line} ${(NH_MK[x.k]||[])[1]||x.k}`:`${x.pick} (${x.mk})`,odds:x.odds,why:x.why,game:x.type==="prop"?(x.tm||""):`${x.a} @ ${x.h}`,href:x.type==="prop"?`#nhl-player-${encodeURIComponent(x.nm)}`:"#nhl",lock:true});
    else for(const x of nhDayPlays())out.push(x.type==="prop"?{sp:"nhl",kind:"Play of the Day",txt:`${x.b.nm} ${x.b.side==="o"?"Over":"Under"} ${x.b.line} ${NH_MK[x.b.k][1]}`,odds:x.b.odds,ch:pc(x.b.s.p),need:pc(nhImp(x.b.odds)),game:`${x.b.g.a} @ ${x.b.g.h}`,href:`#nhl-player-${encodeURIComponent(x.b.nm)}`}:{sp:"nhl",kind:"Play of the Day",txt:`${x.e.pick} (${x.e.mk})`,odds:x.e.odds,ch:pc(x.e.me),need:pc(x.e.bk),game:`${x.e.g.a} @ ${x.e.g.h}`,href:`#nhl-game-${x.e.g.id}`})}}catch(e){}
  try{if(typeof potwInit!=="undefined"){potwInit();for(const pl of PLAYS){const d=playData(pl);if(!d)continue;const g=d.game;if(g&&(g.final||(typeof nflStarted!=="undefined"&&nflStarted(g))))continue;
    out.push({sp:"nfl",kind:"Play of the Week",txt:d.title,odds:d.odds,ch:pl.ch||null,game:g?`${g.away} @ ${g.home}`:"",when:g?g.when:"",href:pl.type==="prop"?`#props/${encodeURIComponent(pl.player)}`:g?`#game-${g.id}`:"#plays",lock:!POTW_LIVE})}}}catch(e){}
  for(const sp of ["cfb","cbb"])try{if(typeof coOk!=="undefined"&&coOk(sp))for(const g of coGames(sp).filter(g=>g.st==="pre"))for(const x of coLeans(sp,g))out.push({sp,kind:"Lean",txt:x.txt,odds:x.odds,edgePts:x.edge,game:`${coT(sp,g.a[0]).a} @ ${coT(sp,g.h[0]).a}`,when:coWhen(g.t),href:`#${sp}-game-${g.id}`})}catch(e){}
  return out}
function viewAllPicks(){const el=document.getElementById("v-allpicks");if(!el)return;
  /* load college / NHL data once; redraw once when it arrives (never re-request from the redraw — that looped when a sport had no data) */
  const again=()=>setTimeout(()=>{if((location.hash||"").slice(1)==="allpicks")viewAllPicks()},0);
  for(const sp of ["cfb","cbb"])if(!ALLP["ld"+sp]&&typeof coOk!=="undefined"&&!coOk(sp)&&typeof coEnsure!=="undefined"){ALLP["ld"+sp]=1;coEnsure(sp,again)}
  if(!ALLP.ldnhl&&typeof nhlEnsure!=="undefined"&&typeof NHL_DATE!=="undefined"&&!NHL_DATE){ALLP.ldnhl=1;nhlEnsure(again)}
  const L=allPicks(),SPN={nba:"🏀 NBA",nhl:"🏒 NHL",nfl:"🏈 NFL",cfb:"🏈 CFB",cbb:"🏀 CBB"},f=ALLP.sp,shown=L.filter(x=>f==="all"||x.sp===f);
  const n=sp=>L.filter(x=>x.sp===sp).length,odd=o=>o==null?"":(typeof oddsFmt!=="undefined"?oddsFmt(o):o);
  el.innerHTML=`<h1>⭐ All picks</h1><p class="sub">Every sport's picks in one place, same format. All follow the same rules: real posted lines only, our chance has to beat what the price needs, no long-shot moneylines. <a href="#record">📒 Our record</a> · <a href="#calib">🎯 How accurate</a></p>
   <div class="seg" style="margin-bottom:10px;flex-wrap:wrap">${[["all","All",L.length],...Object.keys(SPN).map(k=>[k,SPN[k],n(k)])].map(([k,l,c])=>`<button class="${f===k?"on":""}" data-alls="${k}">${l} <small>${c}</small></button>`).join("")}</div>
   <div class="card">${shown.map(x=>`<a class="ufval" href="${x.href}" style="align-items:flex-start"><span style="min-width:0"><span class="small">${SPN[x.sp]} · ${x.kind}${x.lock?" · 🔒 locked":""}${x.strong?" · ⭐ strong":""}</span><br><b>${cmpE(x.txt)}</b>${x.odds!=null?` <span class="small">${odd(x.odds)}</span>`:""}<br><span class="small">${cmpE(x.game)}${x.when?" · "+cmpE(x.when):""}</span></span>
     <span style="text-align:right">${x.ch!=null?`<b>${x.ch}%</b><br><span class="small">${x.need!=null?`need ${x.need}%`:"our chance"}</span>`:x.edgePts!=null?`<b>${(+x.edgePts).toFixed(1)}</b><br><span class="small">pts off the line</span>`:x.why?`<span class="small">${cmpE(x.why).slice(0,60)}</span>`:""}</span></a>`).join("")||`<div class="small">No picks right now — sometimes the best play is no play. They post as lines come out (NBA/NHL Plays of the Day lock ~6 h before the first game; NFL Plays of the Week Thursday 9 AM ET).</div>`}</div>`;
  el.querySelectorAll("[data-alls]").forEach(b=>b.onclick=()=>{ALLP.sp=b.dataset.alls;viewAllPicks()})}
