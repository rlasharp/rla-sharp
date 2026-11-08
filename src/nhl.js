/* ================= 🏒 NHL section =================
   Data: NHL_* from nhl_data.js (official NHL API box scores, standings, team stats, built by tools/nhlfetch.py)
   + player props / game lines from the PropLine feed (baked in nhl_data.js, refreshed live by liveodds.js).
   Routes: #nhl (games) · #nhl-game-<id> · #nhl-props · #nhl-player-<name> · #nhl-standings */
const NH={tm:"all",mk:"all",gp:"all",gm:"all"};
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
function nhStarted(g){return !!g&&(g.st&&!["FUT","PRE"].includes(g.st)||Date.parse(g.iso)<=Date.now())}
function nhGameOf(tm){return nhAllGames().find(g=>(g.a===tm||g.h===tm)&&!nhStarted(g))||nhAllGames().find(g=>g.a===tm||g.h===tm)}
function nhWho(nm){return NHL_P[nm]||NHL_G[nm]||null}
function nhIsG(nm){return !!NHL_G[nm]&&!NHL_P[nm]}
function nhLink(nm){return `<a href="#nhl-player-${encodeURIComponent(nm)}">${nhE(nm)}</a>`}
/* one value per game for a market (goalies: only games they started) */
function nhVals(nm,k){const m=NH_MK[k];if(!m||!m[3])return [];
  if(m[4]){const G=NHL_G[nm];return G?G.g.filter(x=>x[7]).map(x=>({v:m[3](x),x})):[]}
  const P=NHL_P[nm];return P?P.g.map(x=>({v:m[3](x),x})).filter(o=>o.v!=null):[]}
function nhLab(x){return (x[2]==="H"?"":"@")+x[1]}
/* implied probability from American odds */
function nhImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
/* hit score: last 10 (60%) + season (40%) vs the price */
function nhScore(nm,k,line,side){const V=nhVals(nm,k).map(o=>o.v);if(V.length<3)return null;const hit=a=>a.filter(v=>side==="u"?v<line:v>line).length/a.length;
  const L10=V.slice(-10);return {p:hit(L10)*.6+hit(V)*.4,l10:L10.filter(v=>side==="u"?v<line:v>line).length,n10:L10.length,ns:V.length,hs:V.filter(v=>side==="u"?v<line:v>line).length,avg:V.reduce((a,b)=>a+b,0)/V.length}}
function nhPropRows(){return (NHL_PROPS||[]).filter(r=>NH_MK[r[1]]&&nhWho(r[0]))}
function nhBest(){const out=[];for(const r of nhPropRows()){const [nm,k,line,o,u]=r,w=nhWho(nm),g=w&&nhGameOf(w.tm);if(!g||nhStarted(g)||!NH_MK[k][3])continue;
  for(const [side,odds] of [["o",o],["u",u]]){if(odds==null)continue;const s=nhScore(nm,k,line,side);if(!s||s.ns<5)continue;const imp=nhImp(odds);out.push({nm,k,line,side,odds,s,edge:s.p-imp,g})}}
  return out.sort((a,b)=>b.edge-a.edge)}
function nhBestRow(b){const m=NH_MK[b.k];return `<a class="bprow" href="#nhl-player-${encodeURIComponent(b.nm)}"><span>${nhBadge(nhWho(b.nm).tm)} <b>${nhE(b.nm)}</b> <span class="small">${b.side==="o"?(b.k==="hanyG"?"Scores":"Over"):"Under"} ${b.k==="hanyG"?"":b.line+" "}${m[1]}</span></span>
   <span><b>${nhOdds(b.odds)}</b> <span class="small">hit ${b.s.l10}/${b.s.n10} L10 · ${b.s.hs}/${b.s.ns} season · ${Math.round(b.s.p*100)}% vs ${Math.round(nhImp(b.odds)*100)}% needed</span></span></a>`}

/* ---------- goalies: probable starter ---------- */
function nhGoalies(tm){return Object.entries(NHL_G).filter(([,g])=>g.tm===tm).map(([nm,g])=>({nm,...g,last:(g.g.filter(x=>x[7]).slice(-1)[0]||[])[0]||""}))
  .sort((a,b)=>(b.last>a.last?1:b.last<a.last?-1:0)||b.gs-a.gs)}
function nhProbable(tm){const L=nhGoalies(tm).filter(x=>{const r=nhInjOf(x.nm);return !r||!/out|reserve|ir/i.test(r[2])});if(!L.length)return null;const lined=L.find(x=>(NHL_PROPS||[]).some(r=>r[0]===x.nm&&r[1]==="hsaves"));
  /* who started the team's last 5 games */
  const st=[];for(const x of L)for(const z of x.g)if(z[7])st.push([z[0],x.nm]);st.sort((a,b)=>a[0]<b[0]?1:-1);const l5=st.slice(0,5),cnt={};l5.forEach(([,n])=>cnt[n]=(cnt[n]||0)+1);
  const n5=x=>cnt[x.nm]||0;
  if(lined)return {...lined,why:`books posted a saves line for him · started ${n5(lined)} of the team's last ${l5.length}`};
  const s=L.slice().sort((a,b)=>n5(b)-n5(a)||(b.last>a.last?1:-1))[0];
  return {...s,why:`started ${n5(s)} of the team's last ${l5.length}${l5[0]&&l5[0][1]===s.nm?", including the last game":l5[0]?` — ${l5[0][1]} started the last game`:""}`}}
function nhGoalieLine(x){if(!x)return `<span class="small">No goalie data</span>`;const L5=x.g.filter(z=>z[7]).slice(-5),sa=L5.reduce((a,z)=>a+z[3],0),sv=L5.reduce((a,z)=>a+z[4],0);
  return `${nhLink(x.nm)} <span class="small">${x.gs} GS · ${x.w} W · SV% ${x.svp!=null?(x.svp/100).toFixed(3).slice(1):"–"} · GAA ${x.gaa!=null?x.gaa.toFixed(2):"–"}${L5.length?` · last ${L5.length} starts ${sa?(sv/sa).toFixed(3).slice(1):"–"}`:""}</span>`}

/* ---------- lines (moneyline / puck line / total) ---------- */
function nhLinesHtml(g){const p=[];
  if(g.ml)p.push(`<span><b>ML</b> ${nhE(g.a)} ${nhOdds(g.ml[0])} · ${nhE(g.h)} ${nhOdds(g.ml[1])}</span>`);
  if(g.pl)p.push(`<span><b>Puck line</b> ${nhE(g.h)} ${g.pl[0]>0?"+":""}${g.pl[0]} (${nhOdds(g.pl[2])}) · ${nhE(g.a)} ${g.pl[0]>0?"−":"+"}${Math.abs(g.pl[0])} (${nhOdds(g.pl[1])})</span>`);
  if(g.tot)p.push(`<span><b>Total</b> ${g.tot[0]} · O ${nhOdds(g.tot[1])} / U ${nhOdds(g.tot[2])}</span>`);
  return p.length?`<div class="nhln">${p.join("")}<span class="small">${nhE((g.ml||g.tot||g.pl)[3]||"")}</span></div>`:`<div class="small">Lines not posted yet.</div>`}

/* ---------- Games page: today + the next 3 days (same tabs as NBA) ---------- */
function nhCard(g){const A=NHL_TEAM[g.a]||{},H=NHL_TEAM[g.h]||{},pa=nhProbable(g.a),ph=nhProbable(g.h),fin=g.as!=null&&g.st&&["OFF","FINAL"].includes(g.st);
  return `<a class="card nhg" href="#nhl-game-${g.id}"><div class="nhgh"><span class="small"><b style="color:var(--text)">${nhE(g.t)}</b> ET${g.tv?" · "+nhE(g.tv):""}</span>${fin?`<b>FINAL${g.ot===1?" (OT)":g.ot===2?" (SO)":""}</b>`:nhStarted(g)?`<b class="up">LIVE</b>`:`<span class="small">${nhDayS(g.d)}</span>`}</div>
   <div class="nhgt">${[["a",g.a,A,pa],["h",g.h,H,ph]].map(([s,t,T,pg])=>`<div class="nhrow"><span>${nhBadge(t)} <b>${nhE(nhTm(t))}</b> <span class="small">${nhRec(t)} · ${s==="a"?"road "+nhRecA(T.road):"home "+nhRecA(T.home)}</span>${!fin&&nhB2B(t,g.d)?` <span class="pll u" style="white-space:nowrap">2nd night of back-to-back</span>`:""}</span>${fin?`<b class="nhsc">${s==="a"?g.as:g.hs}</b>`:""}
     <span class="small">GF ${T.gf!=null?(+T.gf).toFixed(2):"–"} · GA ${T.ga!=null?(+T.ga).toFixed(2):"–"} · L10 ${nhRecA(T.l10)}${T.stk?" · "+nhE(T.stk):""}</span>
     <span class="small nhrkl">PP ${T.pp??"–"}% <b class="${nhRkC(T.ppR)}">${nhOrd(T.ppR)}</b> · PK ${T.pk??"–"}% <b class="${nhRkC(T.pkR)}">${nhOrd(T.pkR)}</b> · PPG <b class="${nhRkC(T.far&&T.far.ppg[0])}">${nhOrd(T.far&&T.far.ppg[0])}</b> · FO ${T.fo??"–"}% <b class="${nhRkC(T.foR)}">${nhOrd(T.foR)}</b></span>
     ${fin?"":`<span class="small">🥅 ${pg?nhE(pg.nm)+` (SV% ${pg.svp!=null?(pg.svp/100).toFixed(3).slice(1):"–"}) <span class="small">probable</span>`:"–"}</span>`}</div>`).join("")}</div>
   ${fin?"":(()=>{const o=[g.a,g.h].flatMap(t=>nhInjList(t,3).filter(r=>/out|reserve|ir/i.test(r[2])).map(r=>`${nhE(r[0])} (${t})`));return o.length?`<div class="nbout">Out: ${o.join(", ")}</div>`:""})()}
   ${fin?"":nhLinesHtml(g)}</a>`}
function nhlGames(el){
  const today=NHL_SLATE||[],best=nhBest().slice(0,6);
  el.innerHTML=`<h1>🏒 NHL · ${nhE(nhDayS(NHL_DATE))}</h1>${nhDayTabs("nhl")}<p class="sub">${nhE(NHL_GEN?`Updated ${NHL_GEN}`:"")} · official NHL stats + live sportsbook lines. Tap a game for the matchup, goalies and every player prop.</p>
   ${best.length?`<div class="card"><h2 style="margin-bottom:2px">🔥 Best NHL props</h2><div class="small" style="margin-bottom:8px">How often the line would have hit (last 10 games 60%, season 40%) vs what the odds need.</div><div class="nhbp">${best.map(nhBestRow).join("")}</div><a href="#nhl-props" class="small" style="display:block;margin-top:8px">All NHL props →</a></div>`:""}
   <h2 style="margin:16px 0 8px">Today${today.length?` · ${today.length} game${today.length>1?"s":""}`:""}</h2>
   ${today.length?`<div class="grid g2">${today.map(nhCard).join("")}</div>`:`<div class="card small">No NHL games today — see the next days above.</div>`}
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
  const v=(T,k,i)=>T.fa&&T.fa[k]&&T.fa[k][i]!=null?T.fa[k][i]:"–";
  return `<div class="card"><h2 style="margin-bottom:6px">Rankings</h2><table class="nhrk"><thead><tr><th>${nhBadge(o)} ${nhE(nhTm(o))}<div class="small">FOR</div></th><th>Stat<div><button class="altx" data-nhsw="${g.id}" title="Swap sides">⇄</button></div></th><th>${nhBadge(d)} ${nhE(nhTm(d))}<div class="small">AGAINST</div></th></tr></thead><tbody>
   ${R.map(([k,l,t])=>`<tr><td><b class="${nhRkC(O.far[k]&&O.far[k][0])}">${nhOrd(O.far[k]&&O.far[k][0])}</b> <span class="small">${v(O,k,0)}</span></td><th title="${nhE(t)}">${l}</th><td><span class="small">${v(D,k,1)}</span> <b class="${nhRkC(D.far[k]&&D.far[k][1])}">${nhOrd(D.far[k]&&D.far[k][1])}</b></td></tr>`).join("")}</tbody></table>
   <div class="small" style="margin-top:6px">Per game, rank of 32 (1st = best for that team: most for, fewest against). A high FOR rank against a low AGAINST rank (e.g. 5th vs 27th) is a mismatch worth a look. Tap ⇄ to flip to ${nhE(nhTm(d))}'s offense vs ${nhE(nhTm(o))}'s defense.</div></div>`}
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
function nhlGame(el,id){
  const g=nhGame(id);if(!g){el.innerHTML=`<h1>Game not found</h1><p><a href="#nhl">← NHL games</a></p>`;return}
  el.innerHTML=`<p class="small"><a href="#nhl">← NHL games</a></p><h1>${nhBadge(g.a)} ${nhE(nhTm(g.a))} <span class="small">@</span> ${nhBadge(g.h)} ${nhE(nhTm(g.h))}</h1>
   <p class="sub">${g.d===NHL_DATE?"Today":g.d===NHL_TOM?"Tomorrow":nhE(nhDayS(g.d))} ${nhE(g.t)} ET${nhB2B(g.a,g.d)?` · ${nhE(g.a)} on a back-to-back`:""}${nhB2B(g.h,g.d)?` · ${nhE(g.h)} on a back-to-back`:""}${g.tv?" · "+nhE(g.tv):""}${g.as!=null?` · Final ${g.as}-${g.hs}`:""}</p>
   <div class="card">${nhLinesHtml(g)}</div>
   <div class="grid g2" style="margin-top:12px">${nhCmp(g)}<div>${nhRankCard(g)}${nhGoalieCard(g)}</div></div>
   <div style="margin-top:12px">${nhInjCard(g)}</div>
   <h2 style="margin:16px 0 8px">Player props</h2><div id="nhGP">${nhGameProps(g)}</div>${nhFoot()}`;
  nhWire(el,()=>{const b=document.getElementById("nhGP");if(b)b.innerHTML=nhGameProps(g);nhWire(el)})}
function nhGameProps(g){
  if(nhStarted(g))return `<div class="info"><span>🔒 This game has started — pregame props are closed.</span></div>`;
  const tms=[g.a,g.h],all=nhPropRows().filter(r=>tms.includes(nhWho(r[0]).tm));
  if(!all.length)return `<div class="card small">No player props posted yet — books usually post NHL props the morning of the game.</div>`;
  const tf=tms.includes(NH.gp)?NH.gp:"all",mks=[...new Set(all.map(r=>r[1]))].sort((x,y)=>Object.keys(NH_MK).indexOf(x)-Object.keys(NH_MK).indexOf(y)),mf=mks.includes(NH.gm)?NH.gm:"all";
  const by={};all.filter(r=>(tf==="all"||nhWho(r[0]).tm===tf)&&(mf==="all"||r[1]===mf)).forEach(r=>(by[r[0]]=by[r[0]]||[]).push(r));
  const order=Object.keys(by).sort((x,y)=>{const X=nhWho(x),Y=nhWho(y);return (X.tm===g.a?0:1)-(Y.tm===g.a?0:1)||((Y.s&&Y.s[3])||0)-((X.s&&X.s[3])||0)});
  const chip=(a,v,l,on)=>`<button class="btn${on?" on":""}" data-${a}="${v}">${l}</button>`;
  return `<div class="gpf"><div class="seg">${chip("nhgp","all","Both teams",tf==="all")}${tms.map(t=>chip("nhgp",t,`${nhBadge(t)} ${nhE(t)}`,tf===t)).join("")}</div>
   <div class="seg">${chip("nhgm","all","All",mf==="all")}${mks.map(m=>chip("nhgm",m,NH_MK[m][0],mf===m)).join("")}</div></div>
   ${order.map(nm=>nhPlayerLines(nm,by[nm],true)).join("")}`}
/* one card per player with every prop line */
function nhPlayerLines(nm,rows,head){const w=nhWho(nm);
  return `<div class="card plines" style="margin-top:12px">${head?`<div class="gph">${nhBadge(w.tm)}<div style="min-width:0"><a href="#nhl-player-${encodeURIComponent(nm)}"><b>${nhE(nm)}</b></a>${nhInjChip(nm)}<div class="small">${nhE(w.tm)} · ${nhE(w.pos||(NHL_G[nm]?"G":""))}${w.s?` · ${w.s[1]} G · ${w.s[2]} A · ${w.s[8]} min TOI`:` · ${w.gs} starts · SV% ${w.svp!=null?(w.svp/100).toFixed(3).slice(1):"–"}`}</div></div></div>`:""}
   ${rows.map(r=>nhLineRow(nm,r)).join("")}</div>`}
function nhLineRow(nm,r){
  let [,k,line,op,up,book]=r;const m=NH_MK[k],main=line,yes=k==="hanyG",alt=!yes&&typeof loAltOdds!=="undefined"?loAltOdds(nm,k):null;
  if(alt){line=alt.line;op=alt.o;up=alt.u;book=alt.ob||alt.ub||""}
  const V=nhVals(nm,k),L10=V.slice(-10),v10=L10.map(o=>o.v),hit=a=>a.filter(o=>pxHit(o.v,line)).length,w=nhWho(nm),g=nhGameOf(w.tm),opp=g?(g.a===w.tm?g.h:g.a):null,vs=opp?V.filter(o=>o.x[1]===opp):[];
  const avg=a=>a.length?(a.reduce((s,o)=>s+o.v,0)/a.length).toFixed(1):"–";
  return `<div class="pl"><div class="plh"><div><b>${m[1]}</b> ${yes?"":`<span class="plv">${line}</span>${typeof loStep!=="undefined"&&m[3]?loStep(nm,k,main):""}`}${typeof loMoveTag!=="undefined"?loMoveTag(nm,k,line):""}</div>
    <div class="small">${yes?"Yes ":"O "}${nhOdds(op)}${up!=null?" · U "+nhOdds(up):""}${book?" · "+nhE(book):""}</div></div>
   ${m[3]&&!yes&&typeof loAltHtml!=="undefined"?loAltHtml(nm,k,main,v10):""}
   ${m[3]?(L10.length?`<div class="mbw">${nbaMiniBars(v10,line,L10.map(o=>nhLab(o.x)))}<div class="small mbs">Last ${L10.length}: <b class="${hit(L10)/L10.length>=.5?"up":"dn"}">${hit(L10)}/${L10.length} ${yes?(PXSIDE==="u"?"no goal":"scored"):pxSW()}</b> · season <b>${hit(V)}/${V.length}</b> · avg <b>${avg(V)}</b> (L5 ${avg(V.slice(-5))})${vs.length?` · vs ${nhE(opp)} <b>${hit(vs)}/${vs.length}</b>`:""}</div></div>`:`<div class="small">No games logged this season.</div>`):`<div class="small">Game-by-game power-play points aren't in our box-score data — season PP goals: ${w.s?w.s[7]:"–"}.</div>`}
   ${w.s&&["hsog","hgoals","hpts","hanyG"].includes(k)&&L10.length?`<div class="small">Avg TOI last 5: <b>${(w.g.slice(-5).reduce((s,x)=>s+x[10],0)/Math.max(1,w.g.slice(-5).length)/60).toFixed(1)} min</b> · shots/game ${(w.s[4]/w.s[0]).toFixed(1)} · shooting ${w.s[4]?(w.s[1]/w.s[4]*100).toFixed(1):"–"}%${opp&&NHL_TEAM[opp]?` · ${nhE(opp)} allow ${NHL_TEAM[opp].sa} shots/g (#${NHL_TEAM[opp].saR||"–"} fewest), ${NHL_TEAM[opp].ga} goals/g`:""}</div>`:""}
   ${k==="hsaves"&&opp&&NHL_TEAM[opp]?`<div class="small">${nhE(opp)} take ${NHL_TEAM[opp].sf} shots/game (#${NHL_TEAM[opp].sfR||"–"} most) · score ${NHL_TEAM[opp].gf}/game.</div>`:""}
   ${k==="hfow"&&w.s&&w.s[9]!=null&&(w.s[9]+w.s[10])?`<div class="small">Season faceoffs: <b>${w.s[9]} won</b> of ${w.s[9]+w.s[10]} (${Math.round(w.s[9]/(w.s[9]+w.s[10])*100)}%) · ${((w.s[9]+w.s[10])/w.s[0]).toFixed(1)} taken per game — volume (more draws) matters as much as win %.</div>`:""}
   ${k==="hhit"&&opp&&NHL_TEAM[opp]&&NHL_TEAM[opp].fa?`<div class="small">${nhE(opp)} games average ${(NHL_TEAM[opp].fa.hit[0]+NHL_TEAM[opp].fa.hit[1]).toFixed(1)} hits combined · his TOI last 5: ${(w.g.slice(-5).reduce((s,x)=>s+x[10],0)/Math.max(1,w.g.slice(-5).length)/60).toFixed(1)} min.</div>`:""}
   ${k==="hblk"&&opp&&NHL_TEAM[opp]?`<div class="small">${nhE(opp)} take ${NHL_TEAM[opp].sf} shots/game (#${NHL_TEAM[opp].sfR||"–"} most) — more shots = more chances to block.</div>`:""}</div>`}

/* ---------- All props page ---------- */
function nhlProps(el){
  const rows=nhPropRows().filter(r=>{const w=nhWho(r[0]),g=w&&nhGameOf(w.tm);return g&&!nhStarted(g)});
  const mks=[...new Set(rows.map(r=>r[1]))].sort((x,y)=>Object.keys(NH_MK).indexOf(x)-Object.keys(NH_MK).indexOf(y)),mf=mks.includes(NH.mk)?NH.mk:"all";
  const best=nhBest().filter(b=>mf==="all"||b.k===mf).slice(0,12);
  const by={};rows.filter(r=>mf==="all"||r[1]===mf).forEach(r=>(by[r[0]]=by[r[0]]||[]).push(r));
  const names=Object.keys(by).sort((a,b)=>{const ga=nhGameOf(nhWho(a).tm),gb=nhGameOf(nhWho(b).tm);return (ga.iso>gb.iso?1:ga.iso<gb.iso?-1:0)||a.localeCompare(b)}).slice(0,60);
  el.innerHTML=`<h1>🎯 NHL player props</h1><p class="sub">${rows.length} lines from licensed US books · ${nhE(NHL_GEN?`stats updated ${NHL_GEN}`:"")}</p>
   <div class="seg" style="margin-bottom:10px">${[["all","All"],...mks.map(m=>[m,NH_MK[m][1]])].map(([v,l])=>`<button class="btn${mf===v?" on":""}" data-nhmk="${v}">${l}</button>`).join("")}</div>
   ${best.length?`<div class="card"><h2 style="margin-bottom:2px">🔥 Best edges</h2><div class="small" style="margin-bottom:8px">Hit rate (last 10 60%, season 40%) minus the probability the odds imply.</div><div class="nhbp">${best.map(nhBestRow).join("")}</div></div>`:""}
   ${rows.length?names.map(nm=>nhPlayerLines(nm,by[nm],true)).join(""):`<div class="card small">No NHL props posted yet — books usually post them the morning of the game.</div>`}
   ${Object.keys(by).length>60?`<p class="small">Showing 60 players — pick a market above to narrow it down.</p>`:""}${nhFoot()}`;
  nhWire(el,()=>nhlProps(el))}

/* ---------- Player page ---------- */
function nhlPlayer(el,nm){
  nm=decodeURIComponent(nm);const w=nhWho(nm);if(!w){el.innerHTML=`<h1>Player not found</h1><p><a href="#nhl">← NHL</a></p>`;return}
  const g=nhGameOf(w.tm),opp=g?(g.a===w.tm?g.h:g.a):null,isG=nhIsG(nm),rows=nhPropRows().filter(r=>r[0]===nm);
  const head=isG?`${w.gp} GP · ${w.gs} starts · ${w.w} W · SV% ${w.svp!=null?(w.svp/100).toFixed(3).slice(1):"–"} · GAA ${w.gaa??"–"}`
    :`${w.s[0]} GP · ${w.s[1]} G · ${w.s[2]} A · ${w.s[3]} PTS · ${(w.s[4]/w.s[0]).toFixed(1)} SOG/g · ${(w.s[5]/w.s[0]).toFixed(1)} BLK/g · ${(w.s[6]/w.s[0]).toFixed(1)} hits/g · ${w.s[7]} PPG · ${w.s[8]} min TOI`;
  const lg=isG?w.g.slice().reverse().map(x=>`<tr><td>${nhE(x[0].slice(5))}</td><td>${nhLab(x)}</td><td>${x[7]?"✔":""}</td><td>${x[3]}</td><td>${x[4]}</td><td>${x[5]}</td><td>${x[3]?(x[4]/x[3]).toFixed(3).slice(1):"–"}</td><td>${Math.round(x[6]/60)}</td></tr>`).join("")
    :w.g.slice().reverse().map(x=>`<tr><td>${nhE(x[0].slice(5))}</td><td>${nhLab(x)}</td><td>${x[3]}</td><td>${x[4]}</td><td>${x[5]}</td><td>${x[6]}</td><td>${x[7]}</td><td>${x[8]}</td><td>${x[11]}</td><td>${x[13]!=null&&(x[13]+x[14])?x[13]+"/"+(x[13]+x[14]):"–"}</td><td>${(x[10]/60).toFixed(1)}</td></tr>`).join("");
  el.innerHTML=`<p class="small"><a href="${g?"#nhl-game-"+g.id:"#nhl"}">← ${g?"Game":"NHL"}</a></p>
   <div class="phead"><div>${nhBadge(w.tm)}</div><div><h1 style="margin:0">${nhE(nm)}${nhInjChip(nm)}</h1><div class="small">${nhE(nhTm(w.tm))} · ${nhE(isG?"G":w.pos)}${g?` · next: ${g.a===w.tm?"@":"vs"} ${nhE(nhTm(opp))} ${g.d===NHL_DATE?"today":"tomorrow"} ${nhE(g.t)}`:""}</div></div></div>
   <div class="card" style="margin-top:10px"><b>This season</b><div class="small">${head}</div></div>
   ${typeof pxSideTg!=="undefined"?pxSideTg():""}
   ${rows.length?nhPlayerLines(nm,rows,false):`<div class="card small" style="margin-top:12px">No props posted for him yet.</div>`}
   <div class="card" style="margin-top:12px"><h2>Game log</h2><div class="alw"><table class="altt nhlog"><thead><tr>${isG?"<th>Date</th><th>Opp</th><th>Start</th><th>SA</th><th>SV</th><th>GA</th><th>SV%</th><th>Min</th>":"<th>Date</th><th>Opp</th><th>G</th><th>A</th><th>PTS</th><th>SOG</th><th>BLK</th><th>HIT</th><th>PPG</th><th>FO</th><th>TOI</th>"}</tr></thead><tbody>${lg}</tbody></table></div></div>${nhFoot()}`;
  nhWire(el,()=>nhlPlayer(el,nm))}

/* ---------- Standings ---------- */
function nhlStandings(el){const T=Object.entries(NHL_TEAM).sort((a,b)=>(a[1].rk||99)-(b[1].rk||99));const divs=[...new Set(T.map(([,t])=>t.div))].filter(Boolean);
  el.innerHTML=`<h1>📊 NHL standings</h1><p class="sub">${nhE(NHL_GEN?`Updated ${NHL_GEN}`:"")}</p><div class="grid g2">${divs.map(d=>`<div class="card"><h2>${nhE(d)}</h2><div class="alw"><table class="altt"><thead><tr><th>Team</th><th>W-L-OT</th><th>PTS</th><th>GF/g</th><th>GA/g</th><th>PP%</th><th>PK%</th><th>L10</th></tr></thead><tbody>
   ${T.filter(([,t])=>t.div===d).sort((a,b)=>(a[1].drk||99)-(b[1].drk||99)).map(([a,t])=>`<tr><td>${nhBadge(a)} ${nhE(t.cn||a)}</td><td>${nhRec(a)}</td><td><b>${t.pts}</b></td><td>${t.gf??"–"}</td><td>${t.ga??"–"}</td><td>${t.pp??"–"}</td><td>${t.pk??"–"}</td><td>${nhRecA(t.l10)}</td></tr>`).join("")}</tbody></table></div></div>`).join("")||`<div class="card small">No standings yet.</div>`}</div>${nhFoot()}`}

/* ---------- wiring + router ---------- */
function nhWire(el,redraw){
  el.querySelectorAll("[data-nhmk]").forEach(b=>b.onclick=()=>{NH.mk=b.dataset.nhmk;nhlProps(el)});
  el.querySelectorAll("[data-nhgp]").forEach(b=>b.onclick=()=>{NH.gp=b.dataset.nhgp;redraw&&redraw()});
  el.querySelectorAll("[data-nhgm]").forEach(b=>b.onclick=()=>{NH.gm=b.dataset.nhgm;redraw&&redraw()});
  el.querySelectorAll("[data-nhsw]").forEach(b=>b.onclick=()=>{const y=scrollY;NH.sw=NH.sw===b.dataset.nhsw?null:b.dataset.nhsw;nhlGame(el,b.dataset.nhsw);scrollTo(0,y)});}
function nhlRoute(h){const el=document.getElementById("v-nhl");if(!el)return;
  if(h.startsWith("nhl-game-"))return nhlGame(el,h.slice(9));
  if(h.startsWith("nhl-player-"))return nhlPlayer(el,h.slice(11));
  if(h.startsWith("nhl-tomorrow"))return nhlUpcoming(el,h);
  ({"nhl-props":nhlProps,"nhl-standings":nhlStandings,"nhl-injuries":nhlInjuries}[h]||nhlGames)(el)}
/* Today page snippet */
function nhlTodayCard(){const L=(NHL_SLATE||[]).filter(g=>!nhStarted(g));if(!L.length)return "";
  return `<div class="card" style="margin-top:12px"><h2 style="margin-bottom:6px">🏒 NHL today</h2>${L.map(g=>`<a class="tgame" href="#nhl-game-${g.id}"><span class="small">${nhE(g.t)}</span><span>${nhBadge(g.a)} ${nhE(g.a)} <span class="small">@</span> ${nhBadge(g.h)} ${nhE(g.h)}</span><span class="small">${g.ml?`${nhOdds(g.ml[0])} / ${nhOdds(g.ml[1])}`:""}${g.tot?` · ${g.tot[0]}`:""}</span></a>`).join("")}
   <a href="#nhl" class="small" style="display:block;margin-top:8px;color:var(--text2)">All NHL games &amp; props →</a></div>`}
