/* ================= 🏒 NHL section =================
   Data: NHL_* from nhl_data.js (official NHL API box scores, standings, team stats, built by tools/nhlfetch.py)
   + player props / game lines from the PropLine feed (baked in nhl_data.js, refreshed live by liveodds.js).
   Routes: #nhl (games) · #nhl-game-<id> · #nhl-props · #nhl-player-<name> · #nhl-standings */
const NH={tm:"all",mk:"all",gp:"all",gm:"all"};
/* NHL data is a separate file (nhl_data.js next to index.html) loaded the first time it's needed — keeps the first page load light */
let NHL_READY=false,NHL_WAIT=[];
function nhlEnsure(cb){if(NHL_READY||NHL_DATE){NHL_READY=true;cb&&cb();return}if(NHL_WAIT.fail&&Date.now()-NHL_WAIT.fail<60000)return;/* failed just now (offline / missing file): no retry loop */if(cb)NHL_WAIT.push(cb);if(NHL_WAIT.loading)return;NHL_WAIT.loading=1;
  const sc=document.createElement("script");sc.src="nhl_data.js?v="+(typeof BUILD_AT!=="undefined"&&BUILD_AT?BUILD_AT.replace(/\D/g,""):Math.floor(Date.now()/600000));
  sc.onload=()=>{NHL_READY=true;if(typeof loDropOut!=="undefined")loDropOut();try{if(typeof SRCH!=="undefined")SRCH=null;const i=document.getElementById("plSearch");if(i&&document.activeElement===i&&i.value.trim().length>=2)setTimeout(()=>i.dispatchEvent(new Event("input")),0);if(typeof LO!=="undefined"&&LO.data&&typeof loApply!=="undefined")loApply(LO.data)}catch(e){}const W=NHL_WAIT.splice(0);NHL_WAIT.loading=0;W.forEach(f=>{try{f()}catch(e){console.error(e)}})};
  sc.onerror=()=>{NHL_WAIT.loading=0;NHL_WAIT.fail=Date.now();const W=NHL_WAIT.splice(0);W.forEach(f=>{try{f()}catch(e){}})};document.head.appendChild(sc)}
const NH_COL={ANA:"#F47A38",BOS:"#C69214",BUF:"#003087",CAR:"#CE1126",CBJ:"#002654",CGY:"#C8102E",CHI:"#CF0A2C",COL:"#6F263D",DAL:"#006847",DET:"#CE1126",EDM:"#FF4C00",FLA:"#C8102E",LAK:"#3d3d3d",MIN:"#154734",MTL:"#AF1E2D",NJD:"#CE1126",NSH:"#c9a227",NYI:"#00539B",NYR:"#0038A8",OTT:"#C52032",PHI:"#F74902",PIT:"#a88b2c",SEA:"#2b8a8f",SJS:"#006D75",STL:"#002F87",TBL:"#002868",TOR:"#00205B",UTA:"#5b8fbf",VAN:"#00205B",VGK:"#9a8655",WPG:"#041E42",WSH:"#C8102E"};
/* market: [short, name, unit, value-of-a-game-row (null = no game log), goalie market] */
const NH_MK={hpts:["PTS","Points","pts",x=>x[5]],hgoals:["G","Goals","goals",x=>x[3]],hast:["A","Assists","ast",x=>x[4]],hsog:["SOG","Shots on goal","shots",x=>x[6]],
  hblk:["BLK","Blocked shots","blocks",x=>x[7]],hppp:["PPP","Power-play points","PPP",null],hanyG:["Goal","Anytime goal","goal",x=>x[3]],hsaves:["SV","Saves","saves",x=>x[4],1],
  hhit:["HIT","Hits","hits",x=>x[8]],hfow:["FOW","Faceoffs won","faceoffs won",x=>x[13]]};
const nhE=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nhOdds=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
function nhTm(a){return (NHL_TEAM[a]&&NHL_TEAM[a].cn)||a}
function nhBadge(a){return `<span class="nbbdg" style="background:${NH_COL[a]||"#444"}">${nhE(a)}</span>`}
function nhRec(a){const t=NHL_TEAM[a];return t?`${t.w}-${t.l}-${t.otl}`:""}
function nhRecA(r){return r&&r[0]!=null?`${r[0]}-${r[1]}-${r[2]}`:"–"}
function nhAllGames(){return [...(NHL_SLATE||[]),...(NHL_NEXT||[]),...((typeof NHL_LATER!=="undefined"&&NHL_LATER)||[])]}
function nhAddDays(d,n){const x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
function nhDayS(d){return new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",weekday:"long",month:"short",day:"numeric"})}
function nhGamesOn(d){return nhAllGames().filter(g=>g.d===d)}
/* back-to-back: the team also played the day before */
function nhB2B(t,d){const p=nhAddDays(d,-1);return (NHL_RES||[]).some(r=>r[0]===p&&(r[1]===t||r[3]===t))||nhGamesOn(p).some(g=>g.a===t||g.h===t)}
function nhDayTabs(cur){const T=[0,1,2,3].map(n=>{const d=nhAddDays(NHL_DATE,n);return [n?`nhl-tomorrow${n>1?"-"+n:""}`:"nhl",n===0?"Today":n===1?"Tomorrow":new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",weekday:"short"}),d]});
  return `<div class="gtabs">${T.map(([h,l,d])=>`<a href="#${h}" class="${h===cur?"on":""}">${l}<small>${nhGamesOn(d).length}</small></a>`).join("")}</div>`}
function nhGame(id){return nhAllGames().find(g=>String(g.id)===String(id))}
function nhStarted(g){if(!g)return false;const L=typeof LIVE!=="undefined"&&LIVE.nhl&&LIVE.nhl[g.a+"@"+g.h];if(L&&L.st!=="pre"&&g.d===NHL_DATE)return true;return (g.st&&!["FUT","PRE"].includes(g.st))||Date.parse(g.iso)<=Date.now()}
function nhGameOf(tm){return nhAllGames().find(g=>(g.a===tm||g.h===tm)&&!nhStarted(g))||nhAllGames().find(g=>g.a===tm||g.h===tm)}
function nhWho(nm){return NHL_P[nm]||NHL_G[nm]||null}
function nhIsG(nm){return !!NHL_G[nm]&&!NHL_P[nm]}
function nhLink(nm){return `<a href="#nhl-player-${encodeURIComponent(nm)}">${nhE(nm)}</a>`}
/* one value per game for a market (goalies: only games they started) */
/* game rows carry a last-season flag (skaters x[16], goalies x[9]) — charts use both seasons, "season" stats only this one */
function nhVals(nm,k){const m=NH_MK[k];if(!m||!m[3])return [];
  if(m[4]){const G=NHL_G[nm];return G?G.g.filter(x=>x[7]).map(x=>({v:m[3](x),x,prev:x[9]===1})):[]}
  const P=NHL_P[nm];return P?P.g.map(x=>({v:m[3](x),x,prev:x[16]===1})).filter(o=>o.v!=null):[]}
const nhCurS=x=>x[16]!==1,nhCurG=x=>x[9]!==1;
function nhLab(x,prev){return (prev?"'25 ":"")+(x[2]==="H"?"":"@")+x[1]}
/* implied probability from American odds */
function nhImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
/* hit score: last 10 (60%) + season (40%) vs the price */
function nhScore(nm,k,line,side){const VA=nhVals(nm,k),V=VA.filter(o=>!o.prev).map(o=>o.v);if(V.length<3)return null;const hit=a=>a.filter(v=>side==="u"?v<line:v>line).length/a.length;
  const L10=VA.map(o=>o.v).slice(-10),cnt=a=>[a.filter(v=>side==="u"?v<line:v>line).length,a.length];return {c3:cnt(V.slice(-3)),c5:cnt(V.slice(-5)),c10:cnt(L10),p:hit(L10)*.6+hit(V)*.4,l10:L10.filter(v=>side==="u"?v<line:v>line).length,n10:L10.length,ns:V.length,hs:V.filter(v=>side==="u"?v<line:v>line).length,avg:V.reduce((a,b)=>a+b,0)/V.length}}
function nhPropRows(){return (NHL_PROPS||[]).filter(r=>NH_MK[r[1]]&&nhWho(r[0]))}
function nhOutNow(nm){const r=typeof nhInjOf!=="undefined"&&nhInjOf(nm);return !!(r&&/out|reserve|ir\b|suspen/i.test(r[2]))}
function nhBest(){const out=[];for(const r of nhPropRows()){const [nm,k,line,o,u]=r,w=nhWho(nm),g=w&&nhGameOf(w.tm);if(!g||nhStarted(g)||!NH_MK[k][3]||nhOutNow(nm))continue;
  for(const [side,odds] of [["o",o],["u",u]]){if(odds==null)continue;const s=nhScore(nm,k,line,side);if(!s||s.ns<5)continue;const imp=nhImp(odds);
    /* calibrated chance (same method as NBA): fair price from both sides (vig removed), moved toward his hit rates only partway */
    const fair=o!=null&&u!=null?(side==="o"?nhImp(o)/(nhImp(o)+nhImp(u)):nhImp(u)/(nhImp(o)+nhImp(u))):imp/1.045,nEff=Math.min(25,s.n10+.5*s.ns),w=.4*nEff/(nEff+10);
    const sc=Object.assign({},s,{raw:s.p,fair,p:Math.max(.03,Math.min(.9,fair+w*(s.p-fair)))});if(sc.p-imp>0)out.push({nm,k,line,side,odds,s:sc,edge:sc.p-imp,g})}}
  return out.sort((a,b)=>b.edge-a.edge)}
function nhBestFilter(L){const f=NH.bf||{};return L.filter(b=>(!f.g||String(b.g.id)===f.g)&&(!f.m||b.k===f.m)&&(!f.s||b.side===f.s)&&(!f.pos||(f.pos==="G"?!!NHL_G[b.nm]:f.pos==="D"?(NHL_P[b.nm]||{}).pos==="D":NHL_P[b.nm]&&NHL_P[b.nm].pos!=="D"))&&(!f.min||b.s.p>=f.min/100)&&(typeof hotOk==="undefined"||hotOk({c3:b.s.c3,c5:b.s.c5,c10:b.s.c10},f.hot)))}
function nhBestFilterUI(L0){const f=NH.bf||(NH.bf={}),games=[...new Map(L0.map(b=>[b.g.id,b.g])).values()],mks=[...new Set(L0.map(b=>b.k))];
  return `<div class="bfil"><select data-nhbf="g"><option value="">All games</option>${games.map(g=>`<option value="${g.id}"${f.g==String(g.id)?" selected":""}>${nhE(g.a)} @ ${nhE(g.h)}</option>`).join("")}</select>
   <select data-nhbf="m"><option value="">All markets</option>${mks.map(m=>`<option value="${m}"${f.m===m?" selected":""}>${NH_MK[m][1]}</option>`).join("")}</select>
   <select data-nhbf="pos"><option value="">All positions</option>${[["F","Forwards"],["D","Defensemen"],["G","Goalies"]].map(([v,n])=>`<option value="${v}"${f.pos===v?" selected":""}>${n}</option>`).join("")}</select>
   <select data-nhbf="s"><option value="">Overs & unders</option><option value="o"${f.s==="o"?" selected":""}>Overs only</option><option value="u"${f.s==="u"?" selected":""}>Unders only</option></select>
   <select data-nhbf="min"><option value="">Any chance</option>${[60,70,80].map(v=>`<option value="${v}"${f.min==v?" selected":""}>${v}%+ our chance</option>`).join("")}</select>
   ${typeof hotSelect!=="undefined"?hotSelect('data-nhbf="hot"',f.hot):""}${typeof xResetChip!=="undefined"?xResetChip("nhl"):""}</div>`}
function nhBestRow(b,i){const m=NH_MK[b.k],tm=nhWho(b.nm).tm;
  return xPropRow({i:typeof i==="number"?i:null,href:`#nhl-player-${encodeURIComponent(b.nm)}`,badge:nhBadge(tm),name:nhE(b.nm),sub:b.g?`${b.g.a===tm?"@":"vs"} ${nhE(b.g.a===tm?b.g.h:b.g.a)}`:"",
    chips:(typeof nhInjChip!=="undefined"?nhInjChip(b.nm):"")+(b.s.c5&&b.s.c5[1]>=5&&b.s.c5[0]>=4?` <span class="bfire">🔥 ${b.s.c5[0]}/${b.s.c5[1]}</span>`:"")+(typeof xaChips!=="undefined"?xaChips("nhl",b.nm,b.k,b.side):""),
    pick:b.k==="hanyG"?(b.side==="o"?"Scores a goal":"No goal"):`${b.side==="o"?"Over":"Under"} ${b.line} ${m[1]}`,odds:nhOdds(b.odds),l10:[b.s.l10,b.s.n10],
    hits:[[b.s.hs,b.s.ns,"this season"]],chance:Math.round(b.s.p*100),need:Math.round(nhImp(b.odds)*100)})}

/* ---------- goalies: probable starter ---------- */
function nhGoalies(tm){return Object.entries(NHL_G).filter(([,g])=>g.tm===tm).map(([nm,g])=>({nm,...g,last:(g.g.filter(x=>x[7]&&nhCurG(x)).slice(-1)[0]||[])[0]||""}))
  .sort((a,b)=>(b.last>a.last?1:b.last<a.last?-1:0)||b.gs-a.gs)}
function nhProbable(tm){{const gg=nhGameOf(tm),q=gg&&gg.proj,nm=q&&(gg.a===tm?q.ga:q.gh);if(nm&&NHL_G[nm]){const x=nhGoalies(tm).find(z=>z.nm===nm);if(x)return {...x,why:(gg.a===tm?q.wa:q.wh)||""}}}
  const L=nhGoalies(tm).filter(x=>{const r=nhInjOf(x.nm);return !r||!/out|reserve|ir/i.test(r[2])});if(!L.length)return null;const lined=L.find(x=>(NHL_PROPS||[]).some(r=>r[0]===x.nm&&r[1]==="hsaves"));
  /* who started the team's last 5 games */
  const st=[];for(const x of L)for(const z of x.g)if(z[7]&&nhCurG(z))st.push([z[0],x.nm]);st.sort((a,b)=>a[0]<b[0]?1:-1);const l5=st.slice(0,5),cnt={};l5.forEach(([,n])=>cnt[n]=(cnt[n]||0)+1);
  const n5=x=>cnt[x.nm]||0;
  if(lined)return {...lined,why:`books posted a saves line for him · started ${n5(lined)} of the team's last ${l5.length}`};
  let s=L.slice().sort((a,b)=>n5(b)-n5(a)||(b.last>a.last?1:-1))[0];
  const gg=nhGameOf(tm);if(gg&&nhB2B(tm,gg.d)){const y=nhAddDays(gg.d,-1),yst=L.find(x=>x.g.some(z=>z[0]===y&&z[7])),alt=L.find(x=>x!==yst&&x.gs>=2);
    if(yst&&yst.nm===s.nm&&alt)return {...alt,why:`${s.nm} started last night — teams usually start the other goalie on a back-to-back`}}
  return {...s,why:`started ${n5(s)} of the team's last ${l5.length}${l5[0]&&l5[0][1]===s.nm?", including the last game":l5[0]?` — ${l5[0][1]} started the last game`:""}`}}
function nhGoalieLine(x){if(!x)return `<span class="small">No goalie data</span>`;const L5=x.g.filter(z=>z[7]&&nhCurG(z)).slice(-5),sa=L5.reduce((a,z)=>a+z[3],0),sv=L5.reduce((a,z)=>a+z[4],0);
  return `${nhLink(x.nm)} <span class="small">${x.gs} GS · ${x.w} W · SV% ${x.svp!=null?(x.svp/100).toFixed(3).slice(1):"–"} · GAA ${x.gaa!=null?x.gaa.toFixed(2):"–"}${L5.length?` · last ${L5.length} starts ${sa?(sv/sa).toFixed(3).slice(1):"–"}`:""}</span>`}

/* ---------- lines (moneyline / puck line / total) ---------- */
function nhLinesHtml(g){const p=[];
  if(g.ml)p.push(`<span><b>ML</b> ${nhE(g.a)} ${nhOdds(g.ml[0])} · ${nhE(g.h)} ${nhOdds(g.ml[1])}</span>`);
  if(g.pl)p.push(`<span><b>Puck line</b> ${nhE(g.h)} ${g.pl[0]>0?"+":""}${g.pl[0]} (${nhOdds(g.pl[2])}) · ${nhE(g.a)} ${g.pl[0]>0?"−":"+"}${Math.abs(g.pl[0])} (${nhOdds(g.pl[1])})</span>`);
  if(g.tot)p.push(`<span><b>Total</b> ${g.tot[0]} · O ${nhOdds(g.tot[1])} / U ${nhOdds(g.tot[2])}</span>`);
  return p.length?`<div class="nhln">${p.join("")}<span class="small">${nhE((g.ml||g.tot||g.pl)[3]||"")}</span></div>`:`<div class="small">Lines not posted yet.</div>`}

/* ---------- Games page: today + the next 3 days (same tabs as NBA) ---------- */
function nhCard(g){const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{},pa=nhProbable(g.a),ph=nhProbable(g.h),fin=g.as!=null&&g.st&&["OFF","FINAL"].includes(g.st);
  const sv=p=>p&&p.svp!=null?(p.svp/100).toFixed(3).slice(1):"–";
  const outN=t=>nhInjList(t).filter(r=>/out|reserve|ir/i.test(r[2])&&NHL_P[r[0]]&&NHL_P[r[0]].s[3]>=5).map(r=>r[0].split(" ").slice(-1)[0]);
  const row=(s,t,T,pg)=>`<div class="nhcrow"><span class="nhct">${nhBadge(t)}<b>${nhE(nhTm(t))}</b><span class="small">${nhRec(t)}</span>${!fin&&nhB2B(t,g.d)?`<span class="pll u" style="white-space:nowrap">B2B</span>`:""}</span>${fin?`<b class="nhsc">${s==="a"?g.as:g.hs}</b>`:`<span class="small nhcg">🥅 ${pg?nhE(pg.nm.split(" ").slice(-1)[0])+" "+sv(pg):"–"}</span>`}</div>`;
  const out=fin?[]:[...outN(g.a).map(n=>n+" ("+g.a+")"),...outN(g.h).map(n=>n+" ("+g.h+")")];
  const ln=[g.ml?`<span><span class="small">ML</span> <b>${nhOdds(g.ml[0])}</b> / <b>${nhOdds(g.ml[1])}</b></span>`:"",g.pl?`<span><span class="small">PL</span> <b>${nhE(g.h)} ${g.pl[0]>0?"+":""}${g.pl[0]}</b> ${nhOdds(g.pl[2])}</span>`:"",g.tot?`<span><span class="small">O/U</span> <b>${g.tot[0]}</b></span>`:""].filter(Boolean).join("");
  return `<a class="card nhg" href="#nhl-game-${g.id}" data-nhg="${g.id}"><div class="nhgh"><span><b>${nhE(g.t)}</b> <span class="small">ET${g.tv?" · "+nhE(g.tv.split(", ").slice(0,2).join(", ")):""}</span></span>${fin?`<b>FINAL${g.ot===1?" (OT)":g.ot===2?" (SO)":""}</b>`:nhStarted(g)?`<b class="up">LIVE</b>`:`<span class="small">${g.d===NHL_DATE?"":nhE(nhDayS(g.d).split(",")[0])}</span>`}</div>
   ${row("a",g.a,A,pa)}${row("h",g.h,H,ph)}
   ${fin?"":`${ln?`<div class="nhln2">${ln}</div>`:`<div class="small" style="margin-top:6px">Lines not posted yet.</div>`}${out.length?`<div class="small" style="margin-top:4px">🚑 Out: ${nhE(out.slice(0,4).join(", "))}</div>`:""}`}</a>`}
function nhlGamesW(el){nhlGames0(el);el.querySelectorAll("[data-nhang]").forEach(b=>b.onclick=()=>{const y=scrollY;NH.ang=b.dataset.nhang;nhlGamesW(el);scrollTo(0,y)})}
function nhlGames0(el){
  const today=NHL_SLATE||[],best=nhBest().slice(0,6);
  el.innerHTML=`<h1>🏒 NHL · ${nhE(nhDayS(NHL_DATE))}</h1>${nhDayTabs("nhl")}<p class="sub">${nhE(NHL_GEN?`Updated ${NHL_GEN}`:"")} · official NHL stats + live sportsbook lines. Tap a game for the matchup, goalies and every player prop.</p>

   ${typeof nhlPlaysCard!=="undefined"?nhlPlaysCard():""}
   <h2 style="margin:16px 0 8px">Today${today.length?` · ${today.length} game${today.length>1?"s":""}`:""}</h2>
   ${today.length?`<div class="grid g2">${today.map(nhCard).join("")}</div>`:`<div class="card small">No NHL games today — see the next days above.</div>`}
   ${typeof xInsights!=="undefined"?xInsights("nhl","🧠 Tonight's insights",[["best","🔥 Best props",best.length?`<div class="card"><h2></h2><div class="nhbp">${best.map(nhBestRow).join("")}</div><a href="#nhl-props" class="small" style="display:block;margin-top:8px">All NHL props →</a></div>`:""],["edges","💰 Odds gaps",nhEdgesCard()],["ang","🧭 Player angles",nhAnglesCard()],["moves","📈 Line moves",nhMovesCard()],["min","⏱️ Ice time",typeof xaTrendCard!=="undefined"?`<div class="card">${xaTrendCard("nhl")}</div>`:""],["model","📊 Our record",nhModelCard(false)]]):""}
   ${nhFoot()}`}
function nhlUpcoming(el,h){const n=h==="nhl-tomorrow"?1:+(h.split("-")[2]||1),d=nhAddDays(NHL_DATE,n),G=nhGamesOn(d);
  el.innerHTML=`<h1>🏒 NHL · ${nhE(nhDayS(d))}</h1>${nhDayTabs(h)}
   <p class="sub">${G.length} game${G.length===1?"":"s"}. Moneylines, puck lines and totals usually post the day before, and player props the morning of the game. Probable goalies are our guess from recent starts — teams confirm them on game day.</p>
   <div class="grid g2">${G.map(nhCard).join("")||`<div class="card small">No NHL games scheduled.</div>`}</div>${nhFoot()}`}
function nhFoot(){return `<p class="small" style="margin-top:14px">Stats: official NHL API (box scores of every game this season). Lines: licensed US sportsbooks via our odds feed. Leans from past results, not guarantees — bet small.</p>`}

/* ---------- Game page ---------- */
function nhH2H(a,h){return (NHL_RES||[]).filter(r=>(r[1]===a&&r[3]===h)||(r[1]===h&&r[3]===a))}
/* one result chip: W/L score, and how it went vs the closing puck line and total */
function nhResChip(r,t){const home=r[3]===t,f=home?r[4]:r[2],ag=home?r[2]:r[4],w=f>ag,sp=r[8],tot=r[9];
  const cov=sp==null?null:(home?(r[4]-r[2])+sp:(r[2]-r[4])-sp)>0,ou=tot==null?null:(r[2]+r[4]>tot?"O":r[2]+r[4]<tot?"U":"P");
  return `<span class="nhres ${w?"w":"l"}" title="${nhE(r[0])}${sp!=null?` · puck line ${home?(sp>0?"+":"")+sp:(sp>0?"−":"+")+Math.abs(sp)}`:""}${tot!=null?` · total ${tot}`:""}">${w?"W":r[5]?"OTL":"L"} ${f}-${ag} ${home?"vs":"@"} ${nhE(home?r[1]:r[3])}${cov!=null||ou?` <i>${cov==null?"":cov?"✓PL":"✗PL"}${ou?" "+ou+(tot!=null?tot:""):""}</i>`:""}</span>`}
function nhLast(t,n){return (NHL_RES||[]).filter(r=>r[1]===t||r[3]===t).slice(-n).reverse().map(r=>nhResChip(r,t)).join("")}
function nhH2H(a,h){return (NHL_RES||[]).filter(r=>(r[1]===a&&r[3]===h)||(r[1]===h&&r[3]===a))}
const nhOrd=n=>n==null?"–":n+(n%100>=11&&n%100<=13?"th":["th","st","nd","rd"][n%10]||"th");
const nhRkC=n=>n==null?"":n<=10?"up":n>=23?"dn":"";
function nhWL(r){return r?`${r[0]}-${r[1]}${r.length>2&&r[2]?"-"+r[2]:""}`:"–"}
function nhCmp(g){const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{};
  const rk=(t,k)=>t[k+"R"]?`<span class="small">#${t[k+"R"]}</span>`:"";
  const better=(x,y,hi)=>x==null||y==null||x===y?["",""]:((x>y)===hi?["nhb",""]:["","nhb"]);
  const row=(lab,k,hi)=>{const [ca,ch]=better(A[k],H[k],hi);const f=v=>v==null?"–":(k==="gf"||k==="ga")?(+v).toFixed(2):v;return `<tr><td class="${ca}">${f(A[k])} ${rk(A,k)}</td><th>${lab}</th><td class="${ch}">${f(H[k])} ${rk(H,k)}</td></tr>`};
  const pct=r=>r&&r[0]+r[1]?` <span class="small">${Math.round(r[0]/(r[0]+r[1])*100)}%</span>`:"";
  const hh=nhH2H(g.a,g.h);
  return `<div class="card"><h2>Team comparison</h2><table class="nhcmp"><thead><tr><th>${nhBadge(g.a)} ${nhE(g.a)}</th><th></th><th>${nhBadge(g.h)} ${nhE(g.h)}</th></tr></thead><tbody>
   <tr><td>${nhRec(g.a)} <span class="small">${A.pts??""} pts</span></td><th>Record</th><td>${nhRec(g.h)} <span class="small">${H.pts??""} pts</span></td></tr>
   <tr><td>${nhRecA(A.home)}</td><th>Home record</th><td class="nhhl">${nhRecA(H.home)}</td></tr>
   <tr><td class="nhhl">${nhRecA(A.road)}</td><th>Road record</th><td>${nhRecA(H.road)}</td></tr>
   <tr><td>${nhRecA(A.l10)}</td><th>Last 10</th><td>${nhRecA(H.l10)}</td></tr>
   <tr><td>${nhE(A.stk||"–")}</td><th>Streak</th><td>${nhE(H.stk||"–")}</td></tr>
   <tr><td>${nhWL(A.ats)}${pct(A.ats)}</td><th>Puck line (ATS)</th><td>${nhWL(H.ats)}${pct(H.ats)}</td></tr>
   <tr><td class="nhhl">${nhWL(A.atsR)} <span class="small">road</span></td><th>ATS home / road</th><td class="nhhl">${nhWL(H.atsH)} <span class="small">home</span></td></tr>
   <tr><td>${nhWL(A.ou)}</td><th>Over / under</th><td>${nhWL(H.ou)}</td></tr>
   <tr><td class="nhhl">${nhWL(A.ouR)} <span class="small">road</span></td><th>O/U home / road</th><td class="nhhl">${nhWL(H.ouH)} <span class="small">home</span></td></tr>
   ${row("Goals for / game","gf",true)}${row("Goals against / game","ga",false)}${row("Shots for / game","sf",true)}${row("Shots against / game","sa",false)}
   ${row("Power play %","pp",true)}${row("Penalty kill %","pk",true)}${row("Faceoff %","fo",true)}
   ${(()=>{const f=(T)=>T.fa?T.fa.ppg[0].toFixed(2):"–",r=T=>T.far&&T.far.ppg?`<span class="small">#${T.far.ppg[0]}</span>`:"",[ca,ch]=better(A.fa&&A.fa.ppg[0],H.fa&&H.fa.ppg[0],true);return `<tr><td class="${ca}">${f(A)} ${r(A)}</td><th>PP goals / game</th><td class="${ch}">${f(H)} ${r(H)}</td></tr>`})()}</tbody></table>
   <div class="small" style="margin-top:6px">#rank of 32 · <b class="up">green</b> = the better side · highlighted = the split that applies tonight. ATS = record against the closing puck line (±1.5); O/U = against the closing total.</div>
   <div style="margin-top:10px"><b>Head to head this season</b> ${hh.length?hh.slice().reverse().map(r=>nhResChip(r,g.h)).join(""):`<span class="small">— no games yet</span>`}</div>
   <div style="margin-top:8px"><b>${nhE(g.a)} last 5</b> <div>${nhLast(g.a,5)||"–"}</div></div><div style="margin-top:6px"><b>${nhE(g.h)} last 5</b> <div>${nhLast(g.h,5)||"–"}</div></div>
   <div class="small" style="margin-top:4px">Newest first · ✓PL / ✗PL = covered / missed the puck line · O / U = over / under the total.</div></div>`}
/* "Rankings" — one team's offense (FOR) vs the other's defense (AGAINST); ⇄ swaps */
function nhRankCard(g){const sw=NH.sw===String(g.id),o=sw?g.h:g.a,d=sw?g.a:g.h,O=NHL_TEAM[o]||{},D=NHL_TEAM[d]||{};if(!O.far||!D.far)return "";
  const R=[["g","G","Goals"],["sog","SOG","Shots on goal"],["ppg","PPG","Power-play goals"],["pp","PP% / PK%","Power play % — against = opponents' PP% vs them, i.e. their penalty kill"],["fo","FO%","Faceoff win %"],["sh","SH%","Shooting % (against = goals per shot allowed)"],["blk","BLK","Blocked shots"],["hit","HIT","Hits"],["pim","PIM","Penalty minutes"]];
  const v=(T,k,i)=>{const x=T.fa&&T.fa[k]&&T.fa[k][i];return x==null?"–":(+x).toFixed(k==="g"||k==="ppg"?2:1)};
  return `<div class="card"><h2 style="margin-bottom:6px">Rankings</h2><table class="nhrk"><thead><tr><th>${nhBadge(o)} ${nhE(nhTm(o))}<div class="small">FOR</div></th><th>Stat<div><button class="altx" data-nhsw="${g.id}" title="Swap sides">⇄</button></div></th><th>${nhBadge(d)} ${nhE(nhTm(d))}<div class="small">AGAINST</div></th></tr></thead><tbody>
   ${R.map(([k,l,t])=>{const ro=O.far[k]&&O.far[k][0],rd=D.far[k]&&D.far[k][1],bw=r=>r?((33-r)/32*100).toFixed(0):0;
     return `<tr><td><b class="${nhRkC(ro)}">${nhOrd(ro)}</b> <span class="small">${v(O,k,0)}</span><div class="nhbar l"><i class="${nhRkC(ro)}" style="width:${bw(ro)}%"></i></div></td><th title="${nhE(t)}">${l}${ro&&rd&&["g","sog","ppg","pp","sh","fo"].includes(k)?`<div class="small nhedge">${ro<=10&&rd>=23?"🔥 edge "+nhE(o):rd<=10&&ro>=23?"🧱 edge "+nhE(d):""}</div>`:""}</th><td><span class="small">${v(D,k,1)}</span> <b class="${nhRkC(rd)}">${nhOrd(rd)}</b><div class="nhbar r"><i class="${nhRkC(rd)}" style="width:${bw(rd)}%"></i></div></td></tr>`}).join("")}</tbody></table>
   <div class="small" style="margin-top:6px">Per game, rank of 32 (1st = best for that team: most for, fewest against). A high FOR rank against a low AGAINST rank (e.g. 5th vs 27th) is a mismatch worth a look. Tap ⇄ to flip sides: ${nhE(nhTm(d))} FOR vs ${nhE(nhTm(o))} AGAINST.</div></div>`}
/* injuries (ESPN report) */
function nhInjOf(nm){if(typeof NHL_INJ==="undefined")return null;const n=typeof loNorm!=="undefined"?loNorm(nm):nm;for(const L of Object.values(NHL_INJ))for(const r of L)if((typeof loNorm!=="undefined"?loNorm(r[0]):r[0])===n)return r;return null}
function nhInjChip(nm){const r=nhInjOf(nm);return r?` <span class="pll ${/out|reserve|ir/i.test(r[2])?"u":"n"}" title="${nhE(r[3])}${r[4]?" · est. return "+nhE(r[4]):""}">🚑 ${nhE(r[2])}</span>`:""}
function nhInjList(t,n){const L=(typeof NHL_INJ!=="undefined"&&NHL_INJ[t])||[];const pts=nm=>{const p=NHL_P[nm]||Object.values(NHL_P).find(x=>false);return p&&p.s?p.s[3]:-1};
  return L.slice().sort((a,b)=>pts(b[0])-pts(a[0])).slice(0,n||99)}
function nhInjCard(g){const side=t=>{const L=nhInjList(t);return `<div><h3 style="margin:0 0 6px">${nhBadge(t)} ${nhE(nhTm(t))}</h3>${L.length?L.map(r=>{const p=NHL_P[r[0]];return `<div class="nhgl"><b>${NHL_P[r[0]]||NHL_G[r[0]]?nhLink(r[0]):nhE(r[0])}</b> <span class="small">${nhE(r[1])}</span> <span class="pll ${/out|reserve|ir/i.test(r[2])?"u":"n"}">${nhE(r[2])}</span><div class="small">${nhE(r[3])}${r[4]?" · est. return "+nhE(r[4]):""}${p&&p.s?` · ${p.s[1]} G · ${p.s[3]} PTS in ${p.s[0]} GP`:""}</div></div>`}).join(""):`<div class="small">Nobody listed.</div>`}</div>`};
  return `<div class="card"><h2>🚑 Injuries</h2><div class="grid g2">${side(g.a)}${side(g.h)}</div><div class="small" style="margin-top:6px">ESPN injury report. Day-to-day players often play — check close to puck drop.</div></div>`}
function nhlInjuries(el){const T=Object.keys(NHL_TEAM).sort((a,b)=>nhTm(a).localeCompare(nhTm(b))).filter(t=>nhInjList(t).length);
  el.innerHTML=`<h1>🚑 NHL injuries</h1><p class="sub">ESPN injury report · ${nhE(NHL_GEN?`updated ${NHL_GEN}`:"")}</p><div class="grid g2">${T.map(t=>`<div class="card"><h2>${nhBadge(t)} ${nhE(nhTm(t))}</h2>${nhInjList(t).map(r=>`<div class="nhgl"><b>${NHL_P[r[0]]||NHL_G[r[0]]?nhLink(r[0]):nhE(r[0])}</b> <span class="small">${nhE(r[1])}</span> <span class="pll ${/out|reserve|ir/i.test(r[2])?"u":"n"}">${nhE(r[2])}</span><div class="small">${nhE(r[3])}${r[4]?" · est. return "+nhE(r[4]):""}</div></div>`).join("")}</div>`).join("")||`<div class="card small">No injuries listed.</div>`}</div>${nhFoot()}`}
function nhGoalieCard(g){
  const side=t=>{const L=nhGoalies(t),p=nhProbable(t);return `<div><h3 style="margin:0 0 6px">${nhBadge(t)} ${nhE(nhTm(t))}</h3>${p?`<div class="small" style="margin-bottom:4px">🥅 <b>Probable: ${nhE(p.nm)}</b> — ${nhE(p.why)} (not confirmed)</div>`:""}
    ${L.map(x=>`<div class="nhgl">${nhGoalieLine(x)}</div>`).join("")||`<div class="small">No goalie data.</div>`}</div>`};
  return `<div class="card" style="margin-top:12px"><h2>Goalies</h2><div class="grid g2">${side(g.a)}${side(g.h)}</div><div class="small" style="margin-top:6px">Starters are confirmed by teams shortly before the game — check before betting saves or totals.</div></div>`}
function nhGameProps(g){
  if(nhStarted(g))return `<div class="info"><span>🔒 This game has started — pregame props are closed.</span></div>`;
  const tms=[g.a,g.h],all=nhPropRows().filter(r=>tms.includes(nhWho(r[0]).tm));
  if(!all.length)return `<div class="card small">No player props posted yet — books usually post NHL props the morning of the game.</div>`;
  const tf=tms.includes(NH.gp)?NH.gp:"all",mks=[...new Set(all.map(r=>r[1]))].sort((x,y)=>Object.keys(NH_MK).indexOf(x)-Object.keys(NH_MK).indexOf(y)),mf=mks.includes(NH.gm)?NH.gm:"all";
  const by={};all.filter(r=>(tf==="all"||nhWho(r[0]).tm===tf)&&(mf==="all"||r[1]===mf)).forEach(r=>(by[r[0]]=by[r[0]]||[]).push(r));
  const order=Object.keys(by).sort((x,y)=>{const X=nhWho(x),Y=nhWho(y);return (X.tm===g.a?0:1)-(Y.tm===g.a?0:1)||((Y.s&&Y.s[3])||0)-((X.s&&X.s[3])||0)});
  const chip=(a,v,l,on)=>`<button class="btn${on?" on":""}" data-${a}="${v}">${l}</button>`;
  return `${typeof xParlayCard!=="undefined"?xParlayCard(nhlParlayLegs(g)):""}<div class="gpf"><div class="seg">${chip("nhgp","all","Both teams",tf==="all")}${tms.map(t=>chip("nhgp",t,`${nhBadge(t)} ${nhE(t)}`,tf===t)).join("")}</div>
   <div class="seg">${chip("nhgm","all","All",mf==="all")}${mks.map(m=>chip("nhgm",m,NH_MK[m][0],mf===m)).join("")}</div></div>
   ${order.map(nm=>nhPlayerLines(nm,by[nm],true)).join("")}`}
/* one card per player with every prop line */
function nhPlayerLines(nm,rows,head){const w=nhWho(nm);
  return `<div class="card plines" style="margin-top:12px">${head?`<div class="gph">${nhBadge(w.tm)}<div style="min-width:0"><a href="#nhl-player-${encodeURIComponent(nm)}"><b>${nhE(nm)}</b></a>${nhInjChip(nm)}<div class="small">${nhE(w.tm)} · ${nhE(w.pos||(NHL_G[nm]?"G":""))}${w.s?` · ${w.s[1]} G · ${w.s[2]} A · ${w.s[8]} min TOI`:` · ${w.gs} starts · SV% ${w.svp!=null?(w.svp/100).toFixed(3).slice(1):"–"}`}</div></div></div>`:""}
   ${rows.map(r=>nhLineRow(nm,r)).join("")}</div>`}
function nhLineRow(nm,r){
  let [,k,line,op,up,book]=r;const m=NH_MK[k],main=line,yes=k==="hanyG",alt=!yes&&typeof loAltOdds!=="undefined"?loAltOdds(nm,k):null;
  if(alt){line=alt.line;op=alt.o;up=alt.u;book=alt.ob||alt.ub||""}
  const VA=nhVals(nm,k),V=VA.filter(o=>!o.prev),VP=VA.filter(o=>o.prev),L10=VA.slice(-10),v10=L10.map(o=>o.v),hit=a=>a.filter(o=>pxHit(o.v,line)).length,w=nhWho(nm),g=nhGameOf(w.tm),opp=g?(g.a===w.tm?g.h:g.a):null,vs=opp?VA.filter(o=>o.x[1]===opp):[];
  const avg=a=>a.length?(a.reduce((s,o)=>s+o.v,0)/a.length).toFixed(1):"–";
  return `<div class="pl"><div class="plh"><div><b>${m[1]}</b> ${yes?"":`<span class="plv">${line}</span>${typeof loStep!=="undefined"&&m[3]?loStep(nm,k,main):""}`}${typeof loMoveTag!=="undefined"?loMoveTag(nm,k,line):""}</div>
    <div class="small">${op==null&&up==null&&!book?"no sportsbook line — his season average":`${yes?"Yes ":"O "}${nhOdds(op)}${up!=null?" · U "+nhOdds(up):""}${book?" · "+nhE(book):""}`}</div></div>
   ${op!=null&&typeof actBtn!=="undefined"&&typeof nhlSpec!=="undefined"?(()=>{const so=nhlSpec(nm,k,"over"),su=yes?null:nhlSpec(nm,k,"under");return so||su?`<div class="obrow">${so?actBtn(so,`${yes?"Scores":"Over "+so.line} <b>${oddsFmt(so.odds)}</b>`,"ov"):""}${su?actBtn(su,`Under ${su.line} <b>${oddsFmt(su.odds)}</b>`,"un"):""}</div>`:""})():""}
   ${m[3]&&!yes&&typeof loAltHtml!=="undefined"?loAltHtml(nm,k,main,v10):""}
   ${m[3]?(L10.length?`<div class="mbw">${nbaMiniBars(v10,line,L10.map(o=>nhLab(o.x,o.prev)))}<div class="small mbs">Last ${L10.length}: <b class="${hit(L10)/L10.length>=.5?"up":"dn"}">${hit(L10)}/${L10.length} ${yes?(PXSIDE==="u"?"no goal":"scored"):pxSW()}</b> · this season <b>${hit(V)}/${V.length}</b> · avg <b>${avg(V)}</b> (L5 ${avg(VA.slice(-5))})${VP.length?` · last season ${hit(VP)}/${VP.length}`:""}${vs.length?` · vs ${nhE(opp)} <b>${hit(vs)}/${vs.length}</b>${vs.some(o=>o.prev)?" (2 seasons)":""}`:""}</div></div>`:`<div class="small">No games logged this season.</div>`):`<div class="small">Game-by-game power-play points aren't in our box-score data — season PP goals: ${w.s?w.s[7]:"–"}.</div>`}
   ${nhCtx(nm,k,line,V)}
   ${k==="hfow"&&w.s&&w.s[9]!=null&&(w.s[9]+w.s[10])?`<div class="small">Season faceoffs: <b>${w.s[9]} won</b> of ${w.s[9]+w.s[10]} (${Math.round(w.s[9]/(w.s[9]+w.s[10])*100)}%) · ${((w.s[9]+w.s[10])/w.s[0]).toFixed(1)} taken per game — volume (more draws) matters as much as win %.</div>`:""}
   ${typeof xaVerdictHtml!=="undefined"&&m[3]?xaVerdictHtml("nhl",nm,k,yes?.5:line):""}${typeof xaPanel!=="undefined"&&m[3]?xaPanel("nhl",nm,k,yes?.5:line,PXSIDE):""}
   </div>`}

/* ---------- All props page ---------- */
function nhlProps(el){
  const rows=nhPropRows().filter(r=>{const w=nhWho(r[0]),g=w&&nhGameOf(w.tm);return g&&!nhStarted(g)});
  const mks=[...new Set([...rows.map(r=>r[1]),...(NHL_SLATE.some(g=>!nhStarted(g))?["hsaves","hhit"]:[])])].sort((x,y)=>Object.keys(NH_MK).indexOf(x)-Object.keys(NH_MK).indexOf(y)),mf=mks.includes(NH.mk)?NH.mk:"all";
  const best0=nhBest(),best=nhBestFilter(best0),showN=NH.bn||15;
  const by={};rows.filter(r=>mf==="all"||r[1]===mf).forEach(r=>(by[r[0]]=by[r[0]]||[]).push(r));
  const names=Object.keys(by).sort((a,b)=>{const ga=nhGameOf(nhWho(a).tm),gb=nhGameOf(nhWho(b).tm);return (ga.iso>gb.iso?1:ga.iso<gb.iso?-1:0)||a.localeCompare(b)}).slice(0,60);
  el.innerHTML=`<h1>🎯 NHL player props</h1><p class="sub">${rows.length} lines from licensed US books · ${nhE(NHL_GEN?`stats updated ${NHL_GEN}`:"")}</p>
   <div class="seg" style="margin-bottom:10px">${[["all","All"],...mks.map(m=>[m,NH_MK[m][1]])].map(([v,l])=>`<button class="btn${mf===v?" on":""}" data-nhmk="${v}">${l}</button>`).join("")}</div>
   ${best0.length?`<div class="card"><h2 style="margin-bottom:2px">🔥 Best edges</h2><div class="small" style="margin-bottom:8px">${best.length} of ${best0.length} lines with an edge — hit rate (last 10 60%, season 40%) vs the probability the odds imply. Filter by game, market, position or streak.</div>${nhBestFilterUI(best0)}
     <div class="nhbp">${best.slice(0,showN).map(nhBestRow).join("")||`<div class="small" style="padding:8px 0">Nothing matches these filters.</div>`}</div>${best.length>showN?`<button class="btn" data-nhmore="1" style="width:100%;margin-top:8px">Show ${Math.min(15,best.length-showN)} more</button>`:""}</div>`:""}
   ${(mf==="hsaves"||mf==="hhit")&&!Object.keys(by).length&&typeof xaNhlNoLineCard!=="undefined"?xaNhlNoLineCard(mf):rows.length?names.map(nm=>nhPlayerLines(nm,by[nm],true)).join(""):`<div class="card small">No NHL props posted yet — books usually post them the morning of the game.</div>`}
   ${Object.keys(by).length>60?`<p class="small">Showing 60 players — pick a market above to narrow it down.</p>`:""}${nhFoot()}`;
  el.querySelectorAll("[data-nhbf]").forEach(x=>x.onchange=()=>{NH.bf[x.dataset.nhbf]=x.value;NH.bn=15;const y=scrollY;nhlProps(el);scrollTo(0,y)});
  el.querySelectorAll("[data-nhmore]").forEach(x=>x.onclick=()=>{NH.bn=(NH.bn||15)+15;const y=scrollY;nhlProps(el);scrollTo(0,y)});
  nhWire(el,()=>nhlProps(el))}

/* ---------- Player page ---------- */
function nhlPlayer(el,nm){
  nm=decodeURIComponent(nm);const w=nhWho(nm);if(!w){el.innerHTML=`<h1>Player not found</h1><p><a href="#nhl">← NHL</a></p>`;return}
  const g=nhGameOf(w.tm),opp=g?(g.a===w.tm?g.h:g.a):null,isG=nhIsG(nm),rows=nhPropRows().filter(r=>r[0]===nm);
  const head=isG?`${w.gp} GP · ${w.gs} starts · ${w.w} W · SV% ${w.svp!=null?(w.svp/100).toFixed(3).slice(1):"–"} · GAA ${w.gaa??"–"}`
    :`${w.s[0]} GP · ${w.s[1]} G · ${w.s[2]} A · ${w.s[3]} PTS · ${(w.s[4]/w.s[0]).toFixed(1)} SOG/g · ${(w.s[5]/w.s[0]).toFixed(1)} BLK/g · ${(w.s[6]/w.s[0]).toFixed(1)} hits/g · ${w.s[7]} PPG · ${w.s[8]} min TOI`;
  const lg=isG?w.g.slice().reverse().map(x=>`<tr class="${x[9]===1?"nhprev":""}"><td>${x[9]===1?"'25 ":""}${nhE(x[0].slice(5))}</td><td>${nhLab(x)}</td><td>${x[7]?"✔":""}</td><td>${x[3]}</td><td>${x[4]}</td><td>${x[5]}</td><td>${x[3]?(x[4]/x[3]).toFixed(3).slice(1):"–"}</td><td>${Math.round(x[6]/60)}</td></tr>`).join("")
    :w.g.slice().reverse().map(x=>`<tr class="${x[16]===1?"nhprev":""}"><td>${x[16]===1?"'25 ":""}${nhE(x[0].slice(5))}</td><td>${nhLab(x)}</td><td>${x[3]}</td><td>${x[4]}</td><td>${x[5]}</td><td>${x[6]}</td><td>${x[7]}</td><td>${x[8]}</td><td>${x[11]}</td><td>${x[13]!=null&&(x[13]+x[14])?x[13]+"/"+(x[13]+x[14]):"–"}</td><td>${(x[10]/60).toFixed(1)}</td></tr>`).join("");
  el.innerHTML=`<p class="small"><a href="${g?"#nhl-game-"+g.id:"#nhl"}">← ${g?"Game":"NHL"}</a></p>
   <div class="phead"><div>${nhBadge(w.tm)}</div><div><h1 style="margin:0">${nhE(nm)}${nhInjChip(nm)}</h1><div class="small">${nhE(nhTm(w.tm))} · ${nhE(isG?"G":w.pos)}${g?` · next: ${g.a===w.tm?"@":"vs"} ${nhE(nhTm(opp))} ${g.d===NHL_DATE?"today":"tomorrow"} ${nhE(g.t)}`:""}</div></div></div>
   ${typeof pxSideTg!=="undefined"?pxSideTg():""}
   ${(()=>{const M=nhPMarkets(nm,rows,isG);if(!M.length)return `<div class="card small" style="margin-top:12px">No props or stats to chart yet.</div>`;const cur=M.find(x=>x.k===NH.pm)||M[0];
     return `<div class="nbtabs pmk nhpmk" style="margin-top:12px">${M.map(x=>`<button data-nhpm="${x.k}" class="${x.k===cur.k?"on":""}">${NH_MK[x.k][0]==="Goal"?"Goal":NH_MK[x.k][1].replace("Shots on goal","Shots").replace("Blocked shots","Blocks").replace("Faceoffs won","Faceoffs").replace("Anytime goal","Goal").replace("Power-play points","PP pts")}<small>${x.r?(x.k==="hanyG"?nhOdds(x.r[3]):x.r[2]):"avg"}</small></button>`).join("")}</div>
      <div class="card plines" style="margin-top:8px">${cur.r?"":`<div class="small" style="margin-bottom:4px">No sportsbook line in our feed for this one — the line starts at his season average. Use − / + to set your book's line.</div>`}${nhLineRow(nm,cur.r||cur.syn)}</div>`})()}
   <div class="card" style="margin-top:12px"><b>This season</b><div class="small">${head}</div></div>
   ${typeof xaTrendsCard!=="undefined"?xaTrendsCard("nhl",nm):""}
   ${isG?"":nhShotMap(nm)}
   <div class="card" style="margin-top:12px"><h2>Game log</h2><div class="alw"><table class="altt nhlog"><thead><tr>${isG?"<th>Date</th><th>Opp</th><th>Start</th><th>SA</th><th>SV</th><th>GA</th><th>SV%</th><th>Min</th>":"<th>Date</th><th>Opp</th><th>G</th><th>A</th><th>PTS</th><th>SOG</th><th>BLK</th><th>HIT</th><th>PPG</th><th>FO</th><th>TOI</th>"}</tr></thead><tbody>${lg}</tbody></table></div></div>${nhFoot()}`;
  el.querySelectorAll("[data-nhpm]").forEach(b=>b.onclick=()=>{NH.pm=b.dataset.nhpm;const y=scrollY;nhlPlayer(el,nm);scrollTo(0,y)});
  nhWire(el,()=>nhlPlayer(el,nm))}
/* market tabs for a player page: posted props first, then stats we can chart without a line */
function nhPMarkets(nm,rows,isG){const out=[],seen=new Set();for(const r of rows){if(seen.has(r[1]))continue;seen.add(r[1]);out.push({k:r[1],r})}
  const extra=isG?["hsaves"]:["hpts","hgoals","hast","hsog","hblk","hhit","hfow"];
  for(const k of extra){if(seen.has(k))continue;const V=nhVals(nm,k).filter(o=>!o.prev).map(o=>o.v);if(V.length<3)continue;const a=V.reduce((x,y)=>x+y,0)/V.length;if(k==="hfow"&&a<1.5)continue;if(k!=="hfow"&&k!=="hsaves"&&a<.15)continue;
    out.push({k,syn:[nm,k,Math.max(.5,Math.floor(a)+.5),null,null,""]})}
  return out}

/* ---------- Standings ---------- */
function nhlStandings(el){const T=Object.entries(NHL_TEAM).sort((a,b)=>(a[1].rk||99)-(b[1].rk||99));const divs=[...new Set(T.map(([,t])=>t.div))].filter(Boolean);
  el.innerHTML=`<h1>📊 NHL standings</h1><p class="sub">${nhE(NHL_GEN?`Updated ${NHL_GEN}`:"")}</p><div class="grid g2">${divs.map(d=>`<div class="card"><h2>${nhE(d)}</h2><div class="alw"><table class="altt"><thead><tr><th>Team</th><th>W-L-OT</th><th>PTS</th><th>GF/g</th><th>GA/g</th><th>PP%</th><th>PK%</th><th>L10</th></tr></thead><tbody>
   ${T.filter(([,t])=>t.div===d).sort((a,b)=>(a[1].drk||99)-(b[1].drk||99)).map(([a,t])=>`<tr><td><a href="#nhl-team-${a}" style="color:inherit">${nhBadge(a)} ${nhE(t.cn||a)}</a></td><td>${nhRec(a)}</td><td><b>${t.pts}</b></td><td>${t.gf??"–"}</td><td>${t.ga??"–"}</td><td>${t.pp??"–"}</td><td>${t.pk??"–"}</td><td>${nhRecA(t.l10)}</td></tr>`).join("")}</tbody></table></div></div>`).join("")||`<div class="card small">No standings yet.</div>`}</div>${nhFoot()}`}

/* ---------- wiring + router ---------- */
function nhWire(el,redraw){
  el.querySelectorAll("[data-nhmk]").forEach(b=>b.onclick=()=>{NH.mk=b.dataset.nhmk;nhlProps(el)});
  el.querySelectorAll("[data-nhgp]").forEach(b=>b.onclick=()=>{NH.gp=b.dataset.nhgp;redraw&&redraw()});
  el.querySelectorAll("[data-nhgm]").forEach(b=>b.onclick=()=>{NH.gm=b.dataset.nhgm;redraw&&redraw()});
  el.querySelectorAll("[data-nhsw]").forEach(b=>b.onclick=()=>{const y=scrollY;NH.sw=NH.sw===b.dataset.nhsw?null:b.dataset.nhsw;const gi=location.hash.match(/nhl-game-(\d+)/);if(gi)nhlGame(el,gi[1]);scrollTo(0,y)});}
function nhlRoute(h){const el=document.getElementById("v-nhl");if(!el)return;
  if(!NHL_READY&&!NHL_DATE){el.innerHTML=`<h1>🏒 NHL</h1><div class="card small">Loading NHL data…</div>`;nhlEnsure(()=>{if(decodeURIComponent((location.hash||"").slice(1))===h)nhlRoute(h)});return}
  if(h.startsWith("nhl-game-"))return nhlGame(el,h.slice(9));
  if(h.startsWith("nhl-player-"))return nhlPlayer(el,h.slice(11));
  if(h.startsWith("nhl-team-"))return nhlTeam(el,h.slice(9));
  if(h.startsWith("nhl-tomorrow"))return nhlUpcoming(el,h);
  ({"nhl-props":nhlProps,"nhl-standings":nhlStandings,"nhl-injuries":nhlInjuries,"nhl-scores":nhlScores}[h]||nhlGamesW)(el)}
/* Today page snippet */
function nhlTodayCard(){if(!NHL_READY&&!NHL_DATE){nhlEnsure(()=>{const el=document.getElementById("nhlTodayHost");if(el)el.innerHTML=nhlTodayCard();const x=document.getElementById("xTonight");if(x&&typeof xTonightCard!=="undefined")x.innerHTML=xTonightCard()});return ""}const L=(NHL_SLATE||[]).filter(g=>!nhStarted(g));if(!L.length)return "";
  return `${typeof nhlPlaysCard!=="undefined"&&typeof TRACK!=="undefined"&&TRACK&&TRACK.nhlPlays&&TRACK.nhlPlays.length?`<div style="margin-top:12px">${nhlPlaysCard()}</div>`:""}<div class="card" style="margin-top:12px"><h2 style="margin-bottom:6px">🏒 NHL today</h2>${L.map(g=>`<a class="tgame" href="#nhl-game-${g.id}"><span class="small">${nhE(g.t)}</span><span>${nhBadge(g.a)} ${nhE(g.a)} <span class="small">@</span> ${nhBadge(g.h)} ${nhE(g.h)}</span><span class="small">${g.ml?`${nhOdds(g.ml[0])} / ${nhOdds(g.ml[1])}`:""}${g.tot?` · ${g.tot[0]}`:""}</span></a>`).join("")}
   <a href="#nhl" class="small" style="display:block;margin-top:8px;color:var(--text2)">All NHL games &amp; props →</a></div>`}

/* =====================================================================
   Game page v2 — easier to read: hero + quick read + tabs
   (Matchup · Trends · Goalies · Injuries · Props)
   ===================================================================== */
const NH_LGSV=()=>{let sa=0,sv=0;for(const g of Object.values(NHL_G))for(const x of g.g)if(x[7]){sa+=x[3];sv+=x[4]}return sa?sv/sa:.9};
function nhLgAvg(k){const v=Object.values(NHL_TEAM).map(t=>t[k]).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
/* our estimate: goals = attack x opponent defence / league, home ice, probable goalie; Poisson for win % and total */
/* our estimate (v2): expected goals = league avg x attack x defence, where attack/defence blend goals (50%),
   chances near the net (30%) and shots (20%); then special teams, home ice, rest and the probable goalie. Poisson for the rest. */
function nhLgRate(f){let n=0,s=0;for(const t of Object.values(NHL_TEAM)){const v=f(t);if(v!=null&&isFinite(v)){s+=v;n++}}return n?s/n:null}
function nhProject(g){const A=NHL_TEAM[g.a],H=NHL_TEAM[g.h];if(!A||!H||A.gf==null||H.gf==null)return null;if(g.proj)return nhProjFrom(g,g.proj);const lg=nhLgAvg("gf")||3.0,lsv=NH_LGSV();
  const lhd=nhLgRate(t=>t.fa&&t.fa.hd&&t.fa.hd[0]),lsf=nhLgRate(t=>t.sf),lpp=nhLgRate(t=>t.pp),lpk=nhLgRate(t=>t.pk);
  const k=T=>Math.min(.75,(T.gp||0)/40+.3),rg=(r,T)=>1+(r-1)*k(T);
  const att=T=>rg(.5*(T.gf/lg)+.3*(T.fa&&T.fa.hd&&lhd?T.fa.hd[0]/lhd:T.gf/lg)+.2*(T.sf&&lsf?T.sf/lsf:1),T);
  const def=T=>rg(.5*(T.ga/lg)+.3*(T.fa&&T.fa.hd&&lhd?T.fa.hd[1]/lhd:T.ga/lg)+.2*(T.sa&&lsf?T.sa/lsf:1),T);
  const st=(O,D)=>O.pp&&D.pk&&lpp&&lpk?1+.15*((O.pp/lpp)*((100-D.pk)/(100-lpk))-1):1;
  const gk=t=>{const p=nhProbable(t);if(!p||!p.svp||p.gs<3)return 1;const sv=p.svp/100,w=Math.min(1,p.gs/20)*.3;return 1+((1-sv)/(1-lsv)-1)*w};
  const fa={aA:att(A),dH:def(H),aH:att(H),dA:def(A),sA:st(A,H),sH:st(H,A),gH:gk(g.h),gA:gk(g.a)};
  let la=lg*fa.aA*fa.dH*fa.sA*.985*fa.gH,lh=lg*fa.aH*fa.dA*fa.sH*1.015*fa.gA;
  if(nhB2B(g.a,g.d))la*=.98,lh*=1.02;if(nhB2B(g.h,g.d))lh*=.98,la*=1.02;
  const P=(l,k)=>{let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p};let hw=0,dr=0,h2=0,a2=0;
  for(let i=0;i<13;i++)for(let j=0;j<13;j++){const p=P(la,i)*P(lh,j);if(j>i)hw+=p;else if(i===j)dr+=p;if(j-i>=2)h2+=p;if(i-j>=2)a2+=p}
  const hwin=hw+dr*(lh/(la+lh)),tot=la+lh,line=g.tot?g.tot[0]:Math.round(tot*2)/2-.5,overL=L=>{let o=0;for(let i=0;i<15;i++)for(let j=0;j<15;j++)if(i+j>L)o+=P(la,i)*P(lh,j);return o};
  /* 1st period: each team's share of goals that come in the 1st, applied to the game estimate */
  const p1s=T=>T.per&&T.gf?Math.max(.22,Math.min(.42,T.per[0][0]/Math.max(.1,T.per.reduce((s,x)=>s+x[0],0)))):.31;
  const l1a=la*(p1s(A)+p1s(H))/2,l1h=lh*(p1s(A)+p1s(H))/2,over1=L=>{let o=0;for(let i=0;i<8;i++)for(let j=0;j<8;j++)if(i+j>L)o+=P(l1a,i)*P(l1h,j);return o};
  return {la,lh,hwin,tot,line,over:overL(line),overL,h2,a2,l1a,l1h,over1,fa}}
const nhPos=n=>/s$/i.test(n)?n+"'":n+"'s";
const nhImpP=o=>o==null?null:o<0?-o/(-o+100):100/(o+100);
function nhMove_unused(now,op,i){if(!op||!now)return "";const a=op[i],b=now[i];if(a==null||b==null||a===b)return "";return ` <span class="nhmv" title="opened ${a>0&&i!==0?"+":""}${a}">${b>a?"▲":"▼"} from ${a>0&&!(now===NH_TOTK)?nhOdds(a):a}</span>`}
const NH_TOTK={};
function nhHero(g){const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{},fin=g.as!=null&&["OFF","FINAL"].includes(g.st),pr=fin?null:nhProject(g),op=g.open||{};
  const side=(t,T,s)=>`<div class="nhhs ${s}">${nhBadge(t)}<b><a href="#nhl-team-${t}" style="color:inherit">${nhE(nhTm(t))}</a></b><span class="small">${nhRec(t)} · ${s==="a"?"road "+nhRecA(T.road):"home "+nhRecA(T.home)}</span>${nhB2B(t,g.d)&&!fin?`<span class="pll u">back-to-back</span>`:""}${fin?`<b class="nhhsc">${s==="a"?g.as:g.hs}</b>`:""}</div>`;
  const chip=(lab,main,sub)=>`<div class="nhlc"><span class="small">${lab}</span><b>${main}</b>${sub?`<span class="small">${sub}</span>`:""}</div>`;
  const mv=(k,i,fmt)=>{const a=op[k]&&op[k][i],b=g[k]&&g[k][i];if(a==null||b==null||a===b)return "";return `<span class="nhmv">opened ${fmt(a)}</span>`};
  const lines=fin?"":`<div class="nhlcs">${g.ml?chip("Moneyline",`${nhE(g.a)} ${nhOdds(g.ml[0])} · ${nhE(g.h)} ${nhOdds(g.ml[1])}`,mv("ml",1,x=>nhE(g.h)+" "+nhOdds(x))):""}
    ${g.pl?chip("Puck line",`${nhE(g.h)} ${g.pl[0]>0?"+":""}${g.pl[0]} (${nhOdds(g.pl[2])})`,`${nhE(g.a)} ${g.pl[0]>0?"−":"+"}${Math.abs(g.pl[0])} (${nhOdds(g.pl[1])})`):""}
    ${g.tot?chip("Total",`${g.tot[0]} · O ${nhOdds(g.tot[1])} / U ${nhOdds(g.tot[2])}`,mv("tot",0,x=>x)):""}
    ${g.p1&&g.p1.tot?chip("1st period total",`${g.p1.tot[0]} · O ${nhOdds(g.p1.tot[1])} / U ${nhOdds(g.p1.tot[2])}`,(()=>{const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{};if(!A.per||!H.per)return "";const e=(A.per[0][0]+H.per[0][1])/2+(H.per[0][0]+A.per[0][1])/2;return `teams avg ${e.toFixed(2)} 1st-period goals`})()):""}
    ${g.p1&&g.p1.ml?chip("1st period winner",`${nhE(g.a)} ${nhOdds(g.p1.ml[0])} · ${nhE(g.h)} ${nhOdds(g.p1.ml[1])}${g.p1.ml[3]!=null?` · tie ${nhOdds(g.p1.ml[3])}`:""}`,(()=>{const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{};return A.per&&H.per?`1st-period goal diff: ${nhE(g.a)} ${(A.per[0][0]-A.per[0][1]>=0?"+":"")+(A.per[0][0]-A.per[0][1]).toFixed(2)} · ${nhE(g.h)} ${(H.per[0][0]-H.per[0][1]>=0?"+":"")+(H.per[0][0]-H.per[0][1]).toFixed(2)}`:""})()):""}${!g.ml&&!g.tot?`<div class="small">Lines not posted yet — usually the day before.</div>`:""}</div>`;
  const est=pr?`<div class="nhest">🧮 <b>Our estimate:</b> ${nhE(g.a)} ${pr.la.toFixed(1)} – ${pr.lh.toFixed(1)} ${nhE(g.h)} · <b>${nhE(pr.hwin>=.5?g.h:g.a)} wins ${Math.round(Math.max(pr.hwin,1-pr.hwin)*100)}%</b>${g.ml?` <span class="small">(books: ${Math.round(nhImpP(pr.hwin>=.5?g.ml[1]:g.ml[0])*100)}%)</span>`:""} · ${pr.tot.toFixed(1)} goals${g.tot?` — over ${pr.line} ${Math.round(pr.over*100)}%`:""}<div class="small">From goals, chances near the net and shots (for and against), special teams, home ice, rest and the probable goalie${pr.fa?` · attack × defence: ${nhE(g.a)} ${(pr.fa.aA*pr.fa.dH).toFixed(2)}, ${nhE(g.h)} ${(pr.fa.aH*pr.fa.dA).toFixed(2)}`:""}. A rough guide, not a sportsbook line.</div></div>`:"";
  const ed=fin?[]:nhEdges(g).filter(e=>e.edge>=.02).slice(0,3),edh=ed.length?`<div class="nhedges"><div class="small" style="font-weight:700;margin-bottom:2px">💰 Where we disagree with the books</div>${ed.map(e=>nhEdgeRow(e,false)).join("")}</div>`:"";
  return `<div class="card nhhero"><div class="nhhw"><span class="small">${g.d===NHL_DATE?"Today":g.d===NHL_TOM?"Tomorrow":nhE(nhDayS(g.d))} · ${nhE(g.t)} ET${g.tv?" · "+nhE(g.tv):""}</span>${fin?`<b>FINAL${g.ot===1?" (OT)":g.ot===2?" (SO)":""}</b>`:""}</div>
   <div class="nhht">${side(g.a,A,"a")}<div class="nhat">@</div>${side(g.h,H,"h")}</div>${lines}${est}${edh}</div>`}
/* plain-English key points */
function nhQuick(g){const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{},out=[];const S=(c,ic,t)=>out.push({c,ic,t});
  for(const [t,T,o,O] of [[g.a,A,g.h,H],[g.h,H,g.a,A]]){
    if(nhB2B(t,g.d)&&!nhB2B(o,g.d))S("dn","😴",`<b>${nhE(nhTm(t))}</b> are on the 2nd night of a back-to-back — ${nhE(nhTm(o))} are rested.`);
    if(T.ppR&&O.pkR&&T.ppR<=10&&O.pkR>=21)S("up","⚡",`<b>${nhE(nhPos(nhTm(t)))} power play</b> (${nhOrd(T.ppR)}) faces a weak penalty kill (${nhE(nhTm(o))} ${nhOrd(O.pkR)}) — good for their PP points and goals.`);
    if(T.gfR&&O.gaR&&T.gfR<=8&&O.gaR>=24)S("up","🎯",`<b>${nhE(nhTm(t))}</b> score a lot (${nhOrd(T.gfR)}) and ${nhE(nhTm(o))} allow a lot (${nhOrd(O.gaR)} in goals against).`);
    if(T.fa&&O.fa&&T.far&&O.far&&T.far.sog&&O.far.sog&&T.far.sog[0]<=8&&O.far.sog[1]>=24)S("up","🏒",`<b>${nhE(nhTm(t))}</b> shoot a lot (${nhOrd(T.far.sog[0])}) vs a team that gives up shots (${nhOrd(O.far.sog[1])}) — shots-on-goal overs.`);
    const p=nhProbable(t);if(p&&p.svp&&p.gs>=3){if(p.svp<89)S("dn","🥅",`${nhE(nhPos(nhTm(t)))} probable goalie <b>${nhE(p.nm)}</b> has a weak .${String(Math.round(p.svp*10)).padStart(3,"0")} save % — good for ${nhE(nhTm(o))} goals.`);if(p.svp>=91.5)S("up","🧱",`${nhE(nhPos(nhTm(t)))} probable goalie <b>${nhE(p.nm)}</b> is hot: .${String(Math.round(p.svp*10)).padStart(3,"0")} save %.`)}
    if(T.ats&&T.ats[0]+T.ats[1]>=8){const r=T.ats[0]/(T.ats[0]+T.ats[1]);if(r>=.65)S("up","✅",`<b>${nhE(nhTm(t))}</b> cover the puck line often: ${T.ats[0]}-${T.ats[1]} this season.`);if(r<=.35)S("dn","❌",`<b>${nhE(nhTm(t))}</b> rarely cover the puck line: ${T.ats[0]}-${T.ats[1]}.`)}
    if(T.ou&&T.ou[0]+T.ou[1]>=8){const r=T.ou[0]/(T.ou[0]+T.ou[1]);if(r>=.65)S("n","📈",`${nhE(nhTm(t))} games go <b>over</b> a lot: ${T.ou[0]}-${T.ou[1]}.`);if(r<=.35)S("n","📉",`${nhE(nhTm(t))} games go <b>under</b> a lot: ${T.ou[1]} unders, ${T.ou[0]} overs.`)}
    if(T.sfp!=null&&T.recF&&T.sfp>=60&&T.recF[0]>=T.recF[1]+T.recF[2]+3)S("n","🥇",`<b>${nhE(nhTm(t))}</b> score first ${T.sfp}% of the time and are ${T.recF[0]}-${T.recF[1]}-${T.recF[2]} when they do.`);
    const inj=nhInjList(t).filter(r=>/out|reserve|ir/i.test(r[2])&&NHL_P[r[0]]&&NHL_P[r[0]].s[3]>=Math.max(6,NHL_P[r[0]].s[0]*.6));for(const r of inj.slice(0,2))S("dn","🚑",`<b>${nhE(r[0])}</b> (${nhE(t)}, ${NHL_P[r[0]].s[3]} pts) is out (${nhE(String(r[3]).toLowerCase())}).`);
  }
  if(A.otp!=null&&H.otp!=null&&A.otp+H.otp>=60)S("n","⏱️",`Both teams go to overtime a lot (${A.otp}% / ${H.otp}%) — the 60-minute line and puck line get riskier.`);
  if(typeof xaTakeaways!=="undefined")out.push(...xaTakeaways("nhl",g));
  if(!out.length)return "";
  return `<div class="card nhquick"><h2 style="margin-bottom:6px">🔑 Key takeaways</h2>${(typeof xQuickTidy!=="undefined"?xQuickTidy(out,5):out.slice(0,6)).map(x=>`<div class="nhq ${x.c}"><span>${x.ic}</span><div>${x.t}</div></div>`).join("")}<div class="small" style="margin-top:6px">Automatic notes from this season's numbers — the reasons to look closer, not picks.</div></div>`}
/* one comparison row with mirrored bars (rank strength) */
function nhCRow(lab,va,ra,vh,rh,tip){const bw=r=>r?Math.round((33-r)/32*100):0,bet=ra&&rh&&ra!==rh?(ra<rh?"a":"h"):"";
  const pill=r=>r?`<span class="nhpill ${nhRkC(r)}">${nhOrd(r)}</span>`:"";
  return `<div class="nhcr"><div class="nhcv ${bet==="a"?"win":""}"><b>${va}</b>${pill(ra)}</div><div class="nhcl" ${tip?`title="${nhE(tip)}"`:""}>${lab}</div><div class="nhcv r ${bet==="h"?"win":""}">${pill(rh)}<b>${vh}</b></div>
   <div class="nhcb"><div class="l"><i class="${bet==="a"?"win":""}" style="width:${bw(ra)}%"></i></div><div class="r"><i class="${bet==="h"?"win":""}" style="width:${bw(rh)}%"></i></div></div></div>`}
function nhMatchup(g){const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{},f=(v,d)=>v==null?"–":(+v).toFixed(d==null?1:d),fa=(T,k,i)=>T.fa&&T.fa[k]?T.fa[k][i]:null,fr=(T,k,i)=>T.far&&T.far[k]?T.far[k][i]:null;
  const mode=NH.mm||"side";
  const head=`<div class="nhcr nhch"><div class="nhcv">${nhBadge(g.a)} <b>${nhE(nhTm(g.a))}</b></div><div class="nhcl"></div><div class="nhcv r"><b>${nhE(nhTm(g.h))}</b> ${nhBadge(g.h)}</div></div>`;
  const grp=(t,rows)=>`<div class="nhgrp"><h3>${t}</h3>${rows}</div>`;
  let body;
  if(mode==="side"){
    body=head+grp("Scoring",nhCRow("Goals / game",f(A.gf,2),A.gfR,f(H.gf,2),H.gfR)+nhCRow("Goals allowed / game",f(A.ga,2),A.gaR,f(H.ga,2),H.gaR)+nhCRow("Shots / game",f(A.sf),A.sfR,f(H.sf),H.sfR)+nhCRow("Shots allowed / game",f(A.sa),A.saR,f(H.sa),H.saR)
      +nhCRow("Shot share (CF%)",f(fa(A,"cf",0)),fr(A,"cf",0),f(fa(H,"cf",0)),fr(H,"cf",0),"Share of all shot attempts in their games — over 50% means they control play")
      +nhCRow("Chances near the net / game",f(fa(A,"hd",0)),fr(A,"hd",0),f(fa(H,"hd",0)),fr(H,"hd",0),"Unblocked attempts from within 20 ft")+nhCRow("Chances allowed near the net",f(fa(A,"hd",1)),fr(A,"hd",1),f(fa(H,"hd",1)),fr(H,"hd",1))
      +nhCRow("Shooting %",f(fa(A,"sh",0)),fr(A,"sh",0),f(fa(H,"sh",0)),fr(H,"sh",0))+nhCRow("Save %",fa(A,"sh",1)!=null?f(100-fa(A,"sh",1)):"–",fr(A,"sh",1),fa(H,"sh",1)!=null?f(100-fa(H,"sh",1)):"–",fr(H,"sh",1)))
     +grp("Special teams",nhCRow("Power play %",f(A.pp),A.ppR,f(H.pp),H.ppR)+nhCRow("Penalty kill %",f(A.pk),A.pkR,f(H.pk),H.pkR)+nhCRow("PP goals / game",f(fa(A,"ppg",0),2),fr(A,"ppg",0),f(fa(H,"ppg",0),2),fr(H,"ppg",0))+nhCRow("Faceoff %",f(A.fo),A.foR,f(H.fo),H.foR))
     +grp("Physical",nhCRow("Hits / game",f(fa(A,"hit",0)),fr(A,"hit",0),f(fa(H,"hit",0)),fr(H,"hit",0))+nhCRow("Blocked shots / game",f(fa(A,"blk",0)),fr(A,"blk",0),f(fa(H,"blk",0)),fr(H,"blk",0))+nhCRow("Penalty min / game",f(fa(A,"pim",0)),fr(A,"pim",0),f(fa(H,"pim",0)),fr(H,"pim",0),"Fewer is better"));
  }else{
    const sw=NH.sw===String(g.id),o=sw?g.h:g.a,d=sw?g.a:g.h,O=NHL_TEAM[o]||{},D=NHL_TEAM[d]||{};
    const R=[["g","Goals",2],["sog","Shots on goal",1],["sat","Shot attempts",1],["hd","Chances near the net",1],["ppg","PP goals",2],["pp","Power play % vs penalty kill",1],["sh","Shooting % vs save %",1],["fo","Faceoff %",1]];
    body=`<div class="nhcr nhch"><div class="nhcv">${nhBadge(o)} <b>${nhE(nhTm(o))}</b><span class="small">attack</span></div><div class="nhcl"><button class="altx" data-nhsw="${g.id}" title="Swap">⇄ swap</button></div><div class="nhcv r"><span class="small">defence</span><b>${nhE(nhTm(d))}</b> ${nhBadge(d)}</div></div>`
      +R.map(([k,l,dd])=>{const ro=fr(O,k,0),rd=fr(D,k,1);const tag=ro&&rd?(ro<=10&&rd>=23?" 🔥":rd<=10&&ro>=23?" 🧱":""):"";return nhCRow(l+tag,f(fa(O,k,0),dd),ro,f(fa(D,k,1),dd),rd)}).join("")
      +`<div class="small" style="margin-top:6px">Left: what ${nhE(nhTm(o))} create per game. Right: what ${nhE(nhTm(d))} allow. 🔥 = strong attack vs weak defence, 🧱 = the defence wins that one.</div>`;
  }
  return `<div class="card"><div class="seg" style="margin-bottom:10px"><button class="btn${mode==="side"?" on":""}" data-nhmm="side">Side by side</button><button class="btn${mode==="ad"?" on":""}" data-nhmm="ad">Attack vs defence</button></div>${body}
   <div class="small" style="margin-top:8px">Pills = league rank of 32 (<span class="up">green</span> top 10, <span class="dn">red</span> bottom 10). Longer bar = better rank; the better team's bar is coloured.</div></div>`}
function nhTile(lab,val,sub,c){return `<div class="nhtile"><span class="small">${lab}</span><b class="${c||""}">${val}</b>${sub?`<span class="small">${sub}</span>`:""}</div>`}
function nhRest(t,d){const R=(NHL_RES||[]).filter(r=>(r[1]===t||r[3]===t)&&r[0]<d);const last=R[R.length-1];const days=last?Math.round((Date.parse(d)-Date.parse(last[0]))/864e5)-1:null;
  const wk=R.filter(r=>Date.parse(d)-Date.parse(r[0])<=7*864e5).length;let trip=0;for(let i=R.length-1;i>=0&&R[i][1]===t;i--)trip++;return {days,wk,trip}}
function nhResRow(r,t){const home=r[3]===t,f=home?r[4]:r[2],ag=home?r[2]:r[4],w=f>ag,sp=r[8],tot=r[9],cov=sp==null?null:(home?(r[4]-r[2])+sp:(r[2]-r[4])-sp)>0,sum=r[2]+r[4];
  return `<div class="nhrr"><span class="nhwl ${w?"w":"l"}">${w?"W":r[5]?"OTL":"L"}</span><span><b>${f}-${ag}</b>${r[5]===1?" OT":r[5]===2?" SO":""} ${home?"vs":"@"} ${nhBadge(home?r[1]:r[3])}</span><span class="small">${nhE(nhDayS(r[0]).replace(/^\w+, /,""))}</span>
   <span class="nhtag ${cov==null?"":cov?"up":"dn"}">${cov==null?"–":cov?"✓ covered":"✗ no cover"}</span><span class="nhtag">${tot==null?"–":sum>tot?`over ${tot}`:sum<tot?`under ${tot}`:`push ${tot}`}</span></div>`}
function nhTrends(g){const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{};
  const pct=(r)=>r&&(r[0]+r[1])?Math.round(r[0]/(r[0]+r[1])*100):null,rc=r=>r?`${r[0]}-${r[1]}${r.length>2?"-"+r[2]:""}`:"–";
  const team=(t,T,s)=>{const rs=nhRest(t,g.d),hr=s==="h";
    return `<div class="card"><h2>${nhBadge(t)} ${nhE(nhTm(t))}</h2>
     <h3 class="nhh3">Record</h3><div class="nhtiles">${nhTile("Overall",nhRec(t),`${T.pts??"–"} pts · ${nhOrd(T.rk)} in NHL`)}${nhTile(hr?"At home":"On the road",nhRecA(hr?T.home:T.road),"tonight's split")}${nhTile("Last 10",nhRecA(T.l10),T.stk?"streak "+nhE(T.stk):"")}${nhTile("In regulation",rc(T.reg),"wins-losses in 60 min")}${nhTile("One-goal games",rc(T.one))}${nhTile("Go to OT/SO",T.otp!=null?T.otp+"%":"–",T.otr?`${T.otr[0]}-${T.otr[1]} in OT/SO`:"")}</div>
     <h3 class="nhh3">Betting records</h3><div class="nhtiles">${nhTile("Puck line",rc(T.ats),pct(T.ats)!=null?pct(T.ats)+"% covered":"",pct(T.ats)>=60?"up":pct(T.ats)<=40?"dn":"")}${nhTile(hr?"Puck line at home":"Puck line on road",rc(hr?T.atsH:T.atsR),"")}${nhTile("Over / under",T.ou?`${T.ou[0]}-${T.ou[1]}${T.ou[2]?"-"+T.ou[2]:""}`:"–","overs-unders")}${nhTile(hr?"O/U at home":"O/U on road",(hr?T.ouH:T.ouR)?`${(hr?T.ouH:T.ouR)[0]}-${(hr?T.ouH:T.ouR)[1]}`:"–","")}${nhTile("1st period over 1.5",T.p1o?`${T.p1o[0]}-${T.p1o[1]}`:"–","over-under")}</div>
     <h3 class="nhh3">Goals by period <span class="small">(scored – allowed per game)</span></h3><div class="nhper">${(T.per||[]).map((p,i)=>`<div><span class="small">${i+1}${["st","nd","rd"][i]}</span><b><span class="up">${p[0].toFixed(2)}</span> – <span class="dn">${p[1].toFixed(2)}</span></b><div class="nhpb"><i class="up" style="width:${Math.min(100,p[0]/1.6*100)}%"></i></div><div class="nhpb"><i class="dn" style="width:${Math.min(100,p[1]/1.6*100)}%"></i></div></div>`).join("")||`<span class="small">–</span>`}</div>
     <h3 class="nhh3">First goal</h3><div class="nhtiles">${nhTile("Score first",T.sfp!=null?T.sfp+"%":"–","of games")}${nhTile("When they score first",T.recF?rc(T.recF):"–","W-L-OTL")}${nhTile("When opponent scores first",T.recFA?rc(T.recFA):"–","W-L-OTL")}</div>
     <h3 class="nhh3">Rest &amp; travel</h3><div class="nhtiles">${nhTile("Days of rest",rs.days==null?"–":rs.days===0?"0 (back-to-back)":rs.days,"",rs.days===0?"dn":"")}${nhTile("Games in last 7 days",rs.wk)}${nhTile("Road trip",rs.trip?`game ${rs.trip+(s==="a"?1:0)}`:(s==="a"?"1st road game":"at home"),"")}</div>
     <h3 class="nhh3">Last 5</h3>${(NHL_RES||[]).filter(r=>r[1]===t||r[3]===t).slice(-5).reverse().map(r=>nhResRow(r,t)).join("")||`<div class="small">–</div>`}</div>`};
  const hh=nhH2H(g.a,g.h);
  return `<div class="card"><h2>Head to head this season</h2>${hh.length?hh.slice().reverse().map(r=>nhResRow(r,g.h)).join(""):`<div class="small">They haven't played yet this season.</div>`}${(()=>{const P=(typeof NHL_H2HP!=="undefined"&&NHL_H2HP[[g.a,g.h].sort().join("|")])||[];return P.length?`<h3 class="nhh3">Last season (2025-26)</h3>${P.slice().reverse().map(r=>nhResRow([...r,null,null,null,null],g.h)).join("")}`:""})()}<div class="small" style="margin-top:6px">Shown from the ${nhE(nhTm(g.h))} side. Covered = beat the closing puck line (±1.5).</div></div>
   <div class="grid g2" style="margin-top:12px">${team(g.a,A,"a")}${team(g.h,H,"h")}</div>`}
function nhGoalieTab(g){const lsv=NH_LGSV();
  const side=t=>{const L=nhGoalies(t),p=nhProbable(t);return `<div class="card"><h2>${nhBadge(t)} ${nhE(nhTm(t))}</h2>${p?`<div class="nhprob">🥅 Probable: <b>${nhLink(p.nm)}</b><div class="small">${nhE(p.why)} — not confirmed until game day.</div></div>`:""}
    ${L.map(x=>{const st=x.g.filter(z=>z[7]&&nhCurG(z)),sv=a=>{const sa=a.reduce((s,z)=>s+z[3],0),v=a.reduce((s,z)=>s+z[4],0);return sa?(v/sa):null},fmt=v=>v==null?"–":v.toFixed(3).slice(1),c=v=>v==null?"":v>=lsv+.01?"up":v<=lsv-.01?"dn":"";
      const L5=sv(st.slice(-5)),hm=sv(st.filter(z=>z[2]==="H")),rd=sv(st.filter(z=>z[2]==="A")),inj=nhInjOf(x.nm);
      return `<div class="nhgk ${p&&p.nm===x.nm?"on":""}"><div><b>${nhLink(x.nm)}</b>${inj?nhInjChip(x.nm):""} <span class="small">${x.gs} starts · ${x.w} wins</span></div>
       <div class="nhtiles">${nhTile("Save %",fmt(x.svp!=null?x.svp/100:null),"season",c(x.svp/100))}${nhTile("GAA",x.gaa!=null?x.gaa.toFixed(2):"–","goals against avg")}${nhTile("Last 5 starts",fmt(L5),"save %",c(L5))}${nhTile("Home / road",`${fmt(hm)} / ${fmt(rd)}`,"save %")}${nhTile("Saves / start",st.length?(st.reduce((s,z)=>s+z[4],0)/st.length).toFixed(1):"–","")}</div>
       ${(()=>{const W=nhGoalieLoad(x,g);return `<div class="nhtiles" style="margin-top:6px">${nhTile("Starts last 7 days",W.s7,`${W.s14} in last 14`,W.s7>=4?"dn":"")}${nhTile("Days since last start",W.rest==null?"–":W.rest,W.run>1?`${W.run} straight starts`:"")}${nhTile("vs top-10 shooting teams",W.hsv,`${W.hs} starts`)}${nhTile("2nd night of back-to-backs",W.b2bsv,`${W.b2b} starts`)}</div>`})()}${typeof xaGoalieVs!=="undefined"?xaGoalieVs(x,g):""}</div>`}).join("")||`<div class="small">No goalie data.</div>`}</div>`};
  return `<div class="grid g2">${side(g.a)}${side(g.h)}</div><p class="small">League average save % this season: ${lsv.toFixed(3).slice(1)} — green above, red below.</p>`}
function nhlGame(el,id){
  const g=nhGame(id);if(!g){el.innerHTML=`<h1>Game not found</h1><p><a href="#nhl">← NHL games</a></p>`;return}
  const tab=NH.tab||"matchup",nInj=nhInjList(g.a).length+nhInjList(g.h).length,nP=nhPropRows().filter(r=>[g.a,g.h].includes(nhWho(r[0]).tm)).length;
  const T=[["matchup","📊 Matchup"],["trends","📈 Trends"],["goalies","🥅 Goalies"],["injuries",`🚑 Injuries${nInj?` <small>${nInj}</small>`:""}`],["props",`🎯 Props${nP?` <small>${nP}</small>`:""}`]];
  const body={matchup:()=>nhMatchup(g)+(typeof xaLuckCard!=="undefined"?xaLuckCard(g)+xaKeyOutCard("nhl",g.a,g.h)+xaDefTrendCard("nhl",g.a,g.h):""),trends:()=>nhTrends(g)+(typeof xaFlowCard!=="undefined"?xaFlowCard(g):""),goalies:()=>nhGoalieTab(g),injuries:()=>nhInjCard(g),props:()=>`<div id="nhGP">${nhGameProps(g)}</div>`}[tab]||(()=>nhMatchup(g));
  el.innerHTML=`<p class="small"><a href="#${g.d===NHL_DATE?"nhl":g.d===NHL_TOM?"nhl-tomorrow":"nhl-tomorrow-"+Math.round((Date.parse(g.d)-Date.parse(NHL_DATE))/864e5)}">← NHL games</a></p>
   ${nhHero(g)}${typeof xaGoalieNote!=="undefined"?xaGoalieNote(g)+xaPmLine("nhl",g.a,g.h):""}${nhQuick(g)}
   <div class="gtabs nhtabs" style="margin-top:12px">${T.map(([k,l])=>`<a href="#" data-nhtab="${k}" class="${k===tab?"on":""}">${l}</a>`).join("")}</div>
   <div style="margin-top:10px">${body()}</div>${nhFoot()}`;
  el.querySelectorAll("[data-nhtab]").forEach(a=>a.onclick=e=>{e.preventDefault();const y=scrollY;NH.tab=a.dataset.nhtab;nhlGame(el,id);scrollTo(0,y)});
  el.querySelectorAll("[data-nhmm]").forEach(b=>b.onclick=()=>{const y=scrollY;NH.mm=b.dataset.nhmm;nhlGame(el,id);scrollTo(0,y)});
  const redraw=()=>{const y=scrollY,b=document.getElementById("nhGP");if(b)b.innerHTML=nhGameProps(g);nhWire(el,redraw);scrollTo(0,y)};nhWire(el,redraw)}

/* ---------- prop context chips: opponent vs position, home/road, PP role, ice time, shot attempts, goalie splits ---------- */
const NH_VPK={hpts:["pts","points"],hgoals:["g","goals"],hanyG:["g","goals"],hast:["a","assists"],hsog:["sog","shots"],hblk:["blk","blocks"],hhit:["hit","hits"]};
function nhCtx(nm,k,line,V){const w=nhWho(nm),g=nhGameOf(w.tm),opp=g?(g.a===w.tm?g.h:g.a):null,O=opp&&NHL_TEAM[opp],home=g?g.h===w.tm:null,out=[];
  const c=(ic,t,cl)=>out.push(`<span class="nhcx ${cl||""}">${ic} ${t}</span>`);
  const avg=a=>a.length?a.reduce((s,o)=>s+o.v,0)/a.length:null,hit=a=>a.filter(o=>pxHit(o.v,line)).length;
  if(NHL_G[nm]&&k==="hsaves"){const st=NHL_G[nm].g.filter(x=>x[7]),hm=st.filter(x=>x[2]==="H"),rd=st.filter(x=>x[2]==="A"),a=x=>x.length?(x.reduce((s,z)=>s+z[4],0)/x.length).toFixed(1):"–";
    c("🏠",`saves at home <b>${a(hm)}</b> · on road <b>${a(rd)}</b>${home!=null?` — tonight ${home?"home":"road"}`:""}`);
    if(O)c("🏒",`${nhE(opp)} shoot <b>${O.sf}</b>/game (${nhOrd(O.sfR)} most)${O.fa&&O.fa.sat?` · ${O.fa.sat[0]} attempts`:""}`,O.sfR<=10?"up":O.sfR>=23?"dn":"");
    if(g&&nhB2B(w.tm,g.d))c("😴","team on a back-to-back — the backup often starts","dn");
    return out.length?`<div class="nhcxs">${out.join("")}</div>`:""}
  if(!w.s)return "";
  const vk=NH_VPK[k],pos=w.pos==="D"?"D":"F";
  if(vk&&O&&O.vp&&O.vp[pos]){const r=O.vpr[pos][vk[0]];c("🎯",`${nhE(opp)} allow <b>${O.vp[pos][vk[0]].toFixed(2)}</b> ${vk[1]} per ${pos==="D"?"defenseman":"forward"} game — ${r<=16?nhOrd(r)+" most":nhOrd(33-r)+" fewest"} in the NHL`,r<=10?"up":r>=23?"dn":"")}
  if(V&&V.length&&home!=null){V=V.filter(o=>!o.prev);const hm=V.filter(o=>o.x[2]==="H"),rd=V.filter(o=>o.x[2]==="A");if(hm.length&&rd.length)c("🏠",`home <b>${avg(hm).toFixed(1)}</b> (${hit(hm)}/${hm.length}) · road <b>${avg(rd).toFixed(1)}</b> (${hit(rd)}/${rd.length}) — tonight <b>${home?"home":"road"}</b>`)}
  if(w.ppt)c("⚡",`${w.pu===1?"<b>PP1</b>":w.pu===2?"PP2":"little PP time"} · ${Math.floor(w.ppt/60)}:${String(w.ppt%60).padStart(2,"0")} PP min/game${O&&O.pkR?` vs ${nhOrd(O.pkR)} PK`:""}`,w.pu===1&&O&&O.pkR>=21?"up":"");
  {const rl=nhRoleList().find(x=>x.n===nm);if(rl)rl.R.forEach(r=>c(r.c==="up"?"📈":"📉",r.t,r.c))}
  const t5=w.g.slice(-5),ts=w.s[8];if(t5.length){const a5=t5.reduce((s,x)=>s+x[10],0)/t5.length/60;c("⏱️",`ice time L5 <b>${a5.toFixed(1)}</b> vs season ${ts} min`,a5>=ts+1.5?"up":a5<=ts-1.5?"dn":"")}
  if(k==="hsog"){const sa=w.g.slice(-10).filter(x=>x[15]!=null);if(sa.length){const att=sa.reduce((s,x)=>s+x[15],0)/sa.length,sg=sa.reduce((s,x)=>s+x[6],0)/sa.length;c("🏒",`shot attempts L10 <b>${att.toFixed(1)}</b>/game → ${sg.toFixed(1)} on net (${att?Math.round(sg/att*100):0}%)`,att>=line*2.1?"up":"")}}
  if(k==="hanyG"||k==="hgoals"){const sh=w.s[4]?w.s[1]/w.s[4]*100:0,lg=(()=>{let G=0,S=0;for(const p of Object.values(NHL_P)){G+=p.s[1];S+=p.s[4]}return S?G/S*100:10})();
    c("🥅",`${(w.s[1]/w.s[0]).toFixed(2)} goals/game · ${w.s[7]} PP goals · shooting <b>${sh.toFixed(1)}%</b> (NHL ${lg.toFixed(1)}%)`,"");
    if(w.s[4]>=25&&sh<lg-4)c("📈","shooting well below average while still getting shots — goals often come back","up");
    if(w.s[4]>=15&&sh>lg+8)c("📉","shooting far above average — hard to keep up","dn");}
  return out.length?`<div class="nhcxs">${out.join("")}</div>`:""}

/* ---------- 🎯 shot map: where his unblocked attempts come from, vs the league ---------- */
function nhShotMap(nm){const w=NHL_P[nm];if(!w||!w.sz||typeof NHL_LZ==="undefined"||!NHL_LZ.length)return "";const Z=w.sz,tot=Z.reduce((a,z)=>a+z[0],0);if(tot<10)return "";
  const lt=NHL_LZ.reduce((a,z)=>a+z[0],0),N=["Slot (inside 20 ft)","High slot","Wide / circles","Long range"],sh=(z)=>z[1]?z[2]/z[1]*100:0;
  const col=(i)=>{const me=Z[i][0]/tot,lg=NHL_LZ[i][0]/lt,r=lg?me/lg:1;return r>=1.25?"#d9483b":r>=1.05?"#e8894a":r<=.75?"#5b9bd5":"#6b7078"};
  /* half rink, goal line at the top: zones drawn as simple shapes */
  const svg=`<svg viewBox="0 0 200 150" class="nhrink" role="img" aria-label="Shot zones">
   <rect x="2" y="2" width="196" height="146" rx="28" fill="none" stroke="currentColor" stroke-opacity=".25"/>
   <line x1="2" y1="22" x2="198" y2="22" stroke="#d9483b" stroke-opacity=".5"/><rect x="92" y="14" width="16" height="8" fill="none" stroke="currentColor" stroke-opacity=".6"/>
   <rect x="4" y="108" width="192" height="38" rx="22" fill="${col(3)}" fill-opacity=".75"/>
   <rect x="4" y="22" width="58" height="86" fill="${col(2)}" fill-opacity=".75"/><rect x="138" y="22" width="58" height="86" fill="${col(2)}" fill-opacity=".75"/>
   <rect x="62" y="22" width="76" height="86" fill="${col(1)}" fill-opacity=".8"/>
   <path d="M55 22 A45 45 0 0 0 145 22 Z" fill="${col(0)}" stroke="#111" stroke-opacity=".35"/>
   <rect x="92" y="14" width="16" height="8" fill="none" stroke="currentColor" stroke-opacity=".7"/>
   ${[[100,44],[100,92],[33,70],[100,131],[167,70]].map(([x,y],j)=>{const i=j===4?2:j;return `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${Math.round(Z[i][0]/tot*100)}%</text>`}).join("")}</svg>`;
  return `<div class="card" style="margin-top:12px"><h2 style="margin-bottom:2px">🎯 Where he shoots from</h2><div class="small" style="margin-bottom:8px">${tot} unblocked shot attempts this season. Colour = more (red) or fewer (blue) than the average NHL skater from that spot.</div>
   <div class="nhsm">${svg}<div class="alw"><table class="altt"><thead><tr><th>Zone</th><th>Share</th><th>NHL</th><th>Goals/SOG</th></tr></thead><tbody>${Z.map((z,i)=>`<tr><td><span class="nhdot" style="background:${col(i)}"></span>${N[i]}</td><td><b>${Math.round(z[0]/tot*100)}%</b></td><td class="small">${lt?Math.round(NHL_LZ[i][0]/lt*100):"–"}%</td><td>${z[2]}/${z[1]} <span class="small">${sh(z).toFixed(0)}% <span style="opacity:.7">(${sh(NHL_LZ[i]).toFixed(0)}%)</span></span></td></tr>`).join("")}</tbody></table></div></div>
   <div class="small" style="margin-top:6px">Lots of slot shots = more goals and steadier shots-on-goal; mostly long range = more shots but fewer goals.</div></div>`}

/* ---------- 📈 biggest NHL line moves (props + moneylines / totals since morning) ---------- */
function nhMovesCard(){const P=typeof loMovesCard!=="undefined"?loMovesCard("nhl",8):"";const G=[];
  for(const g of nhAllGames()){if(nhStarted(g)||!g.open)continue;const o=g.open;
    if(o.ml&&g.ml&&(Math.abs((o.ml[1]||0)-(g.ml[1]||0))>=12))G.push(`<a class="lmr" href="#nhl-game-${g.id}"><span><b>${nhE(g.a)} @ ${nhE(g.h)}</b> <span class="small">moneyline</span></span><span><b>${nhE(g.h)} ${nhOdds(o.ml[1])} → ${nhOdds(g.ml[1])}</b></span><span class="small">${(nhImpP(g.ml[1])>nhImpP(o.ml[1]))?`money on ${nhE(g.h)}`:`money on ${nhE(g.a)}`}</span></a>`);
    if(o.tot&&g.tot&&(o.tot[0]!==g.tot[0]||Math.abs((o.tot[1]||0)-(g.tot[1]||0))>=15))G.push(`<a class="lmr" href="#nhl-game-${g.id}"><span><b>${nhE(g.a)} @ ${nhE(g.h)}</b> <span class="small">total</span></span><span><b>${o.tot[0]} (${nhOdds(o.tot[1])}) → ${g.tot[0]} (${nhOdds(g.tot[1])})</b></span><span class="small">${g.tot[0]>o.tot[0]||(g.tot[0]===o.tot[0]&&g.tot[1]<o.tot[1])?"money on the over":"money on the under"}</span></a>`)}
  if(!P&&!G.length)return "";
  return `${G.length?`<div class="card lmc"><h2 style="margin-bottom:2px">📈 NHL game lines moving today</h2><div class="small" style="margin-bottom:8px">Since the first line we saw this morning. Big moves often follow goalie news or sharp money.</div>${G.join("")}</div>`:""}${P}`}

/* ---------- 🏒 team page ---------- */
function nhlTeam(el,t){const T=NHL_TEAM[t];if(!T){el.innerHTML=`<h1>Team not found</h1><p><a href="#nhl-standings">← Standings</a></p>`;return}
  const R=(NHL_RES||[]).filter(r=>r[1]===t||r[3]===t),up=nhAllGames().filter(g=>(g.a===t||g.h===t)&&!(g.as!=null&&["OFF","FINAL"].includes(g.st)));
  const sk=Object.entries(NHL_P).filter(([,p])=>p.tm===t).sort((a,b)=>b[1].s[3]-a[1].s[3]),gk=nhGoalies(t);
  const rc=r=>r?`${r[0]}-${r[1]}${r.length>2?"-"+r[2]:""}`:"–",fr=(k,i)=>T.far&&T.far[k]?T.far[k][i]:null;
  el.innerHTML=`<p class="small"><a href="#nhl-standings">← Standings</a></p>
   <div class="phead"><div>${nhBadge(t)}</div><div><h1 style="margin:0">${nhE(T.n||t)}</h1><div class="small">${nhRec(t)} · ${T.pts} pts · ${nhOrd(T.rk)} in the NHL · ${nhE(T.div||"")} ${nhOrd(T.drk)}</div></div></div>
   <div class="card" style="margin-top:12px"><div class="nhtiles">${nhTile("Home",nhRecA(T.home))}${nhTile("Road",nhRecA(T.road))}${nhTile("Last 10",nhRecA(T.l10),T.stk?"streak "+nhE(T.stk):"")}${nhTile("Goals for / against",`${(+T.gf).toFixed(2)} / ${(+T.ga).toFixed(2)}`,`${nhOrd(T.gfR)} / ${nhOrd(T.gaR)}`)}${nhTile("PP / PK",`${T.pp}% / ${T.pk}%`,`${nhOrd(T.ppR)} / ${nhOrd(T.pkR)}`)}${nhTile("Shot share",T.fa&&T.fa.cf?T.fa.cf[0]+"%":"–",fr("cf",0)?nhOrd(fr("cf",0)):"")}${nhTile("Puck line",rc(T.ats),T.ats&&T.ats[0]+T.ats[1]?Math.round(T.ats[0]/(T.ats[0]+T.ats[1])*100)+"% covered":"")}${nhTile("Over / under",T.ou?`${T.ou[0]}-${T.ou[1]}`:"–","overs-unders")}${nhTile("Score first",T.sfp!=null?T.sfp+"%":"–")}</div></div>
   ${up.length?`<div class="card" style="margin-top:12px"><h2>Next games</h2>${up.map(g=>`<a class="tgame" href="#nhl-game-${g.id}"><span class="small">${nhE(nhDayS(g.d).replace(/,.*/,""))} ${nhE(g.t)}</span><span>${g.a===t?"@":"vs"} ${nhBadge(g.a===t?g.h:g.a)} ${nhE(nhTm(g.a===t?g.h:g.a))}</span><span class="small">${g.ml?nhOdds(g.a===t?g.ml[0]:g.ml[1]):""}</span></a>`).join("")}</div>`:""}
   <div class="grid g2" style="margin-top:12px"><div class="card"><h2>Skaters</h2>${sk.length?`<div class="alw"><table class="altt nhlog"><thead><tr><th>Player</th><th>GP</th><th>G</th><th>A</th><th>PTS</th><th>SOG/g</th><th>TOI</th><th>PP</th></tr></thead><tbody>${sk.map(([n,p])=>`<tr><td style="text-align:left">${nhLink(n)}${nhInjChip(n)}</td><td>${p.s[0]}</td><td>${p.s[1]}</td><td>${p.s[2]}</td><td><b>${p.s[3]}</b></td><td>${(p.s[4]/p.s[0]).toFixed(1)}</td><td>${p.s[8]}</td><td>${p.pu===1?"PP1":p.pu===2?"PP2":"–"}</td></tr>`).join("")}</tbody></table></div>`:`<div class="small">Full skater stats load for teams playing in the next two days.</div>`}</div>
   <div class="card"><h2>Goalies</h2>${gk.map(x=>`<div class="nhgl">${nhGoalieLine(x)}</div>`).join("")||`<div class="small">No goalie data.</div>`}
   <h3 class="nhh3">Injuries</h3>${nhInjList(t).map(r=>`<div class="nhgl"><b>${nhE(r[0])}</b> <span class="pll ${/out|reserve|ir/i.test(r[2])?"u":"n"}">${nhE(r[2])}</span> <span class="small">${nhE(r[3])}</span></div>`).join("")||`<div class="small">Nobody listed.</div>`}</div></div>
   <div class="card" style="margin-top:12px"><h2>Every game this season</h2>${R.slice().reverse().map(r=>nhResRow(r,t)).join("")||`<div class="small">No games yet.</div>`}</div>${nhFoot()}`}

/* ---------- 💰 game edges: our estimate vs the odds (no-vig) ---------- */
/* probabilities from the expected goals the data job computed (so the site and the model scorecard agree) */
function nhProjFrom(g,q){const la=q.la,lh=q.lh,P=(l,k)=>{let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p};let hw=0,dr=0,h2=0,a2=0;
  for(let i=0;i<13;i++)for(let j=0;j<13;j++){const p=P(la,i)*P(lh,j);if(j>i)hw+=p;else if(i===j)dr+=p;if(j-i>=2)h2+=p;if(i-j>=2)a2+=p}
  const hwin=hw+dr*(lh/(la+lh)),tot=la+lh,line=g.tot?g.tot[0]:Math.round(tot*2)/2-.5,overL=L=>{let o=0;for(let i=0;i<15;i++)for(let j=0;j<15;j++)if(i+j>L)o+=P(la,i)*P(lh,j);return o};
  const over1=L=>{let o=0;for(let i=0;i<8;i++)for(let j=0;j<8;j++)if(i+j>L)o+=P(q.l1a,i)*P(q.l1h,j);return o};
  return {la,lh,hwin,tot,line,over:overL(line),overL,h2,a2,l1a:q.l1a,l1h:q.l1h,over1,fa:q.fa?{aA:q.fa[0],dH:1,aH:q.fa[1],dA:1}:null}}
function nhNoVig(a,b){const x=nhImpP(a),y=nhImpP(b);return x!=null&&y!=null?[x/(x+y),y/(x+y)]:null}
function nhEdges(g){const pr=nhProject(g);if(!pr)return [];const out=[],add=(mk,pick,odds,me,bk,txt)=>{if(odds==null||bk==null)return;out.push({g,mk,pick,odds,me,bk,edge:me-bk,txt})};
  if(g.ml){const nv=nhNoVig(g.ml[0],g.ml[1]);if(nv){add("Moneyline",g.h,g.ml[1],pr.hwin,nv[1]);add("Moneyline",g.a,g.ml[0],1-pr.hwin,nv[0])}}
  if(g.pl){const hp=g.pl[0],nv=nhNoVig(g.pl[2],g.pl[1]);if(nv){const hCov=hp<0?pr.h2:1-pr.a2;add("Puck line",`${g.h} ${hp>0?"+":""}${hp}`,g.pl[2],hCov,nv[0]);add("Puck line",`${g.a} ${hp>0?"−":"+"}${Math.abs(hp)}`,g.pl[1],1-hCov,nv[1])}}
  if(g.tot&&g.tot[0]>=4.5){const nv=nhNoVig(g.tot[1],g.tot[2]),o=pr.overL(g.tot[0]);if(nv){add("Total",`Over ${g.tot[0]}`,g.tot[1],o,nv[0]);add("Total",`Under ${g.tot[0]}`,g.tot[2],1-o,nv[1])}}
  if(g.p1&&g.p1.tot){const t=g.p1.tot,nv=nhNoVig(t[1],t[2]),o=pr.over1(t[0]);if(nv){add("1st period total",`Over ${t[0]}`,t[1],o,nv[0]);add("1st period total",`Under ${t[0]}`,t[2],1-o,nv[1])}}
  /* a gap over 20 points usually means a stale or odd line, not a real edge */
  return out.filter(e=>Math.abs(e.edge)<=.2).sort((a,b)=>b.edge-a.edge)}
function nhEdgeRow(e,showGame){return `<a class="nher" href="#nhl-game-${e.g.id}"><span>${showGame?`<span class="small">${nhE(e.g.a)} @ ${nhE(e.g.h)} · ${nhE(e.mk)}</span>`:`<span class="small">${nhE(e.mk)}</span>`}<b>${nhE(e.pick)}</b> <span class="small">${nhOdds(e.odds)}</span></span>
  <span class="nhedv"><b class="${e.edge>=.04?"up":e.edge<=-.04?"dn":""}">${e.edge>0?"+":""}${Math.round(e.edge*100)}%</b><span class="small">us ${Math.round(e.me*100)}% · books ${Math.round(e.bk*100)}%</span></span></a>`}
function nhEdgesCard(){const L=nhAllGames().filter(g=>!nhStarted(g)&&(g.d===NHL_DATE||g.d===NHL_TOM)).flatMap(g=>nhEdges(g)).filter(e=>e.edge>=.03).sort((a,b)=>b.edge-a.edge).slice(0,8);
  if(!L.length)return "";
  return `<div class="card"><h2 style="margin-bottom:2px">💰 Biggest gaps vs the odds</h2><div class="small" style="margin-bottom:8px">Where our estimate (goals, chances near the net, shots, special teams, home ice, rest, probable goalie) disagrees most with the books — after removing their margin.</div>${L.map(e=>nhEdgeRow(e,true)).join("")}
   <div class="small" style="margin-top:6px">A rough model, early in the season — treat a gap as a reason to dig in, not a pick.</div></div>`}

/* ---------- 📈 role changes + 🔥 hot / 🧊 cold (skaters playing today or tomorrow) ---------- */
function nhSkatersSoon(){const T=new Set(nhAllGames().filter(g=>(g.d===NHL_DATE||g.d===NHL_TOM)&&!nhStarted(g)).flatMap(g=>[g.a,g.h]));return Object.entries(NHL_P).filter(([n,p])=>T.has(p.tm)&&!nhOutNow(n)&&p.s[0]>=6)}
let NH_RLC=null;
function nhRoleList(){if(NH_RLC&&Date.now()-NH_RLC.t<60000)return NH_RLC.v;const v=nhRoleList0();NH_RLC={t:Date.now(),v};return v}
function nhRoleList0(){const out=[];for(const [n,p] of nhSkatersSoon()){const cur=p.g.filter(nhCurS);if(cur.length<6)continue;const L3=cur.slice(-3),toi3=L3.reduce((s,x)=>s+x[10],0)/3/60,ts=p.s[8],R=[];
    if(toi3>=ts+2.5)R.push({c:"up",t:`ice time ⬆ ${toi3.toFixed(1)} min last 3 (season ${ts})`});if(toi3<=ts-2.5)R.push({c:"dn",t:`ice time ⬇ ${toi3.toFixed(1)} min last 3 (season ${ts})`});
    const a3=L3.filter(x=>x[15]!=null),as=cur.filter(x=>x[15]!=null);if(a3.length===3&&as.length>=6){const r3=a3.reduce((s,x)=>s+x[15],0)/3,rs=as.reduce((s,x)=>s+x[15],0)/as.length;if(r3>=rs+2&&r3>=rs*1.4)R.push({c:"up",t:`shooting more: ${r3.toFixed(1)} attempts/game last 3 (season ${rs.toFixed(1)})`})}
    const f3=L3.filter(x=>x[13]!=null),fs=cur.filter(x=>x[13]!=null);if(f3.length===3&&fs.length>=6){const d3=f3.reduce((s,x)=>s+x[13]+x[14],0)/3,ds=fs.reduce((s,x)=>s+x[13]+x[14],0)/fs.length;if(d3>=ds+5)R.push({c:"up",t:`taking more faceoffs: ${d3.toFixed(1)}/game last 3 (season ${ds.toFixed(1)}) — moved to centre?`})}
    if(R.length)out.push({n,p,R,score:R.length+Math.abs(toi3-ts)/3})}
  return out.sort((a,b)=>b.score-a.score)}
function nhHotCold(){const lgSh=(()=>{let G=0,S=0;for(const p of Object.values(NHL_P)){G+=p.s[1];S+=p.s[4]}return S?G/S:.1})(),hot=[],cold=[];
  for(const [n,p] of nhSkatersSoon()){const cur=p.g.filter(nhCurS);if(cur.length<8)continue;const L5=cur.slice(-5),pg=k=>p.s[k]/p.s[0],l5=i=>L5.reduce((s,x)=>s+x[i],0)/5;
    const pts5=l5(5),sog5=l5(6),ptsS=pg(3),sogS=pg(4),sh=p.s[4]?p.s[1]/p.s[4]:0;
    if(ptsS>=.4&&pts5>=ptsS*1.6&&pts5>=1)hot.push({n,p,t:`${pts5.toFixed(1)} pts/game last 5 vs ${ptsS.toFixed(2)} season`,s:pts5/ptsS});
    if(sogS>=1.5&&sog5>=sogS*1.4)hot.push({n,p,t:`${sog5.toFixed(1)} shots/game last 5 vs ${sogS.toFixed(1)} season`,s:sog5/sogS});
    if(ptsS>=.6&&pts5<=ptsS*.4)cold.push({n,p,t:`${pts5.toFixed(1)} pts/game last 5 vs ${ptsS.toFixed(2)} season`,s:ptsS/Math.max(.1,pts5)});
    if(sogS>=2&&sog5<=sogS*.6)cold.push({n,p,t:`${sog5.toFixed(1)} shots/game last 5 vs ${sogS.toFixed(1)} season`,s:sogS/Math.max(.3,sog5)});
    if(p.s[4]>=30&&sh<=lgSh-.05)hot.push({n,p,t:`due: shooting ${(sh*100).toFixed(1)}% on ${p.s[4]} shots (NHL ${(lgSh*100).toFixed(1)}%) — goals tend to come back`,s:1.2,due:1});
    if(p.s[4]>=20&&sh>=lgSh+.1)cold.push({n,p,t:`running hot: shooting ${(sh*100).toFixed(1)}% (NHL ${(lgSh*100).toFixed(1)}%) — hard to keep up`,s:1.1,due:1})}
  const by=a=>a.sort((x,y)=>y.s-x.s).slice(0,10);return {hot:by(hot),cold:by(cold)}}
function nhAnglesCard(){const tab=NH.ang||"hot",HC=nhHotCold(),R=nhRoleList().slice(0,10);if(!HC.hot.length&&!HC.cold.length&&!R.length)return "";
  const row=x=>`<a class="fv" href="#nhl-player-${encodeURIComponent(x.n)}"><b>${nhBadge(x.p.tm)} ${nhE(x.n)} <span class="small">${nhE(x.p.pos)}</span></b>${x.R?x.R.map(r=>`<span class="small ${r.c}">${r.t}</span>`).join(""):`<span class="small">${x.t}</span>`}</a>`;
  const L=tab==="hot"?HC.hot:tab==="cold"?HC.cold:R;
  return `<div class="card"><h2 style="margin-bottom:6px">🧭 Player angles</h2><div class="seg" style="margin-bottom:8px">${[["hot",`🔥 Hot (${HC.hot.length})`],["cold",`🧊 Cold (${HC.cold.length})`],["role",`📈 Role changes (${R.length})`]].map(([k,l])=>`<button class="btn${tab===k?" on":""}" data-nhang="${k}">${l}</button>`).join("")}</div>
   ${L.map(row).join("")||`<div class="small">Nothing stands out right now.</div>`}
   <div class="small" style="margin-top:6px">${tab==="role"?"Ice time, shot attempts and faceoffs over the last 3 games vs his season — a bigger role often shows up before the prop lines move.":"Last 5 games vs his season, for players in today's and tomorrow's games. Shooting % far from the NHL average usually drifts back."}</div></div>`}

/* ---------- 🥅 goalie workload ---------- */
function nhGoalieLoad(x,g){const st=x.g.filter(z=>z[7]&&nhCurG(z)),d=g?g.d:NHL_DATE,days=n=>st.filter(z=>(Date.parse(d)-Date.parse(z[0]))/864e5<=n&&z[0]<d).length;
  const last=st.length?st[st.length-1][0]:null,rest=last?Math.round((Date.parse(d)-Date.parse(last))/864e5)-1:null;let run=0;
  const team=nhGoalies(x.tm),all=[];for(const y of team)for(const z of y.g)if(z[7]&&nhCurG(z))all.push([z[0],y.nm]);all.sort((a,b)=>a[0]<b[0]?1:-1);for(const [,n] of all){if(n===x.nm)run++;else break}
  const top=new Set(Object.entries(NHL_TEAM).filter(([,t])=>t.sfR&&t.sfR<=10).map(([a])=>a)),hs=st.filter(z=>top.has(z[1])),sv=a=>{const sa=a.reduce((s,z)=>s+z[3],0);return sa?(a.reduce((s,z)=>s+z[4],0)/sa).toFixed(3).slice(1):"–"};
  const b2b=st.filter(z=>{const p=nhAddDays(z[0],-1);return (NHL_RES||[]).some(r=>r[0]===p&&(r[1]===x.tm||r[3]===x.tm))});
  return {s7:days(7),s14:days(14),rest,run,hs:hs.length,hsv:sv(hs),b2b:b2b.length,b2bsv:sv(b2b)}}

/* ---------- 🧾 scores + prop results + model scorecard ---------- */
const NH_MKS={hpts:"Points",hgoals:"Goals",hast:"Assists",hsog:"Shots on goal",hblk:"Blocked shots",hhit:"Hits",hsaves:"Saves",hanyG:"Anytime goal",hfow:"Faceoffs won",hppp:"PP points"};
function nhModelCard(full){const M=typeof NHL_MODEL!=="undefined"&&NHL_MODEL;if(!M)return "";const pc=a=>a[0]+a[1]?Math.round(a[0]/(a[0]+a[1])*100)+"%":"–";
  const E=Object.entries(M.edge||{}),EW=E.reduce((s,[,e])=>s+e[0],0),EL=E.reduce((s,[,e])=>s+e[1],0),EU=E.reduce((s,[,e])=>s+e[2],0);
  return `<div class="card" style="margin-bottom:12px"><h2 style="margin-bottom:2px">📊 How our estimate is doing</h2><div class="small" style="margin-bottom:8px">${M.n?`Graded on ${M.n} finished game${M.n>1?"s":""}, using the numbers we showed before puck drop.`:"Tracking started today — the first games grade after tonight's finals."}</div>
   <div class="nhtiles">${nhTile("Winner picked",`${M.win[0]}-${M.win[1]}`,pc(M.win))}${nhTile("Total over/under",`${M.tot[0]}-${M.tot[1]}`,pc(M.tot))}${nhTile("Edges ≥ 4%",`${EW}-${EL}`,`${EU>0?"+":""}${EU.toFixed(2)} units`,EU>0?"up":EU<0?"dn":"")}</div>
   ${E.length?`<div class="small" style="margin-top:6px">${E.map(([k,e])=>`${nhE(k)} ${e[0]}-${e[1]} (${e[2]>0?"+":""}${e[2]}u)`).join(" · ")}</div>`:""}
   ${full&&M.recent&&M.recent.length?`<h3 class="nhh3">Recent games</h3>${M.recent.map(r=>`<div class="nhrr"><span class="nhwl ${r.ok?"w":"l"}">${r.ok?"✓":"✗"}</span><span>${nhE(r.a)} ${r.as} @ ${nhE(r.h)} ${r.hs} <span class="small">· picked ${nhE(r.pick)} ${Math.round(r.p*100)}%</span></span><span class="small">${nhE(r.d.slice(5))}</span>${r.bets.map(b=>`<span class="nhtag ${b[4]?"up":"dn"}">${b[4]?"✓":"✗"} ${nhE(b[1])} ${nhOdds(b[2])}</span>`).join("")}</div>`).join("")}`:""}
   <div class="small" style="margin-top:6px">1 unit per edge bet at the posted odds. Small samples swing a lot — judge it after a few weeks.</div></div>`}
function nhlScores(el){const R=(typeof NHL_RECENT!=="undefined"&&NHL_RECENT)||[],P=(typeof NHL_PRES!=="undefined"&&NHL_PRES)||[];
  const byMk={};for(const r of P){const m=byMk[r[2]]||(byMk[r[2]]={o:0,u:0,p:0});m[r[8]==="over"?"o":r[8]==="under"?"u":"p"]++}
  const mf=NH.sm&&byMk[NH.sm]?NH.sm:"all",PL=P.filter(r=>mf==="all"||r[2]===mf).sort((a,b)=>a[2]<b[2]?-1:a[2]>b[2]?1:a[0].localeCompare(b[0]));
  el.innerHTML=`<h1>🧾 NHL scores</h1><p class="sub">${R.length?nhE(nhDayS(R[0].d)):""} · finals, who starred, and how every posted prop finished.</p>
   ${nhModelCard(true)}
   <div class="grid g2">${R.map(g=>`<div class="card"><div class="nhgh"><span class="small">${nhE(nhDayS(g.d))}</span><b>FINAL${g.ot===1?" (OT)":g.ot===2?" (SO)":""}</b></div>
     ${[[g.a,g.as,g.asog],[g.h,g.hs,g.hsog]].map(([t,sc,sg])=>`<div class="nhrow" style="flex-direction:row;justify-content:space-between"><span><a href="#nhl-team-${t}" style="color:inherit">${nhBadge(t)} <b>${nhE(nhTm(t))}</b></a> <span class="small">${sg??"–"} shots</span></span><b style="font-size:20px">${sc}</b></div>`).join("")}
     <div class="small" style="margin-top:6px">⭐ ${g.stars.map(x=>`<b>${nhE(x[0])}</b> ${x[2]}G ${x[3]}A`).join(" · ")}</div>
     <div class="small">🥅 ${g.gk.map(x=>`${nhE(x[0])} ${x[2]}/${x[3]} saves`).join(" · ")}</div></div>`).join("")||`<div class="card small">No finals yet.</div>`}</div>
   <div class="card" style="margin-top:12px"><h2 style="margin-bottom:2px">🎯 How the props finished${typeof NHL_PRES_D!=="undefined"&&NHL_PRES_D?" · "+nhE(nhDayS(NHL_PRES_D)):""}</h2>
    ${P.length?`<div class="small" style="margin-bottom:8px">Every line we had at puck drop (closing line), graded from the box score.</div>
     <div class="nhtiles" style="margin-bottom:8px">${Object.entries(byMk).map(([k,m])=>nhTile(NH_MKS[k]||k,`${m.o} over · ${m.u} under`,`${Math.round(m.o/Math.max(1,m.o+m.u)*100)}% overs`,m.o>m.u?"up":"dn")).join("")}</div>
     <div class="seg" style="margin-bottom:8px">${[["all","All"],...Object.keys(byMk).map(k=>[k,NH_MKS[k]||k])].map(([v,l])=>`<button class="btn${mf===v?" on":""}" data-nhsm="${v}">${l}</button>`).join("")}</div>
     ${PL.map(r=>`<div class="nhrr"><span class="nhwl ${r[8]==="over"?"w":r[8]==="under"?"l":""}">${r[8]==="over"?"OVER":r[8]==="under"?"UNDER":"PUSH"}</span><span><b>${nhE(r[0])}</b> <span class="small">${nhE(r[1])} · ${nhE(NH_MKS[r[2]]||r[2])} ${r[2]==="hanyG"?"":r[3]}</span></span><span><b>${r[7]}</b></span></div>`).join("")}`
     :`<div class="small">Prop results appear the morning after games we had lines for (the first ones after tonight).</div>`}</div>${nhFoot()}`;
  el.querySelectorAll("[data-nhsm]").forEach(b=>b.onclick=()=>{NH.sm=b.dataset.nhsm;const y=scrollY;nhlScores(el);scrollTo(0,y)})}
