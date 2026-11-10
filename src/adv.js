
/* ---------- Advanced views: box scores, red zone, splits, pace, rest/travel, search (data in adv_data.js) ---------- */
const ADVOK=typeof BOX!=="undefined";
const ord=n=>typeof ordinal==="function"?ordinal(n):n;
const nmKey=n=>n.toLowerCase().replace(/[.'’-]/g,"").replace(/\b(jr|sr|ii|iii|iv)\b/g,"").replace(/\s+/g," ").trim();
let PIDX=null;function pinfoName(n){if(typeof PINFO==="undefined")return null;if(PINFO[n])return n;if(!PIDX){PIDX={};Object.keys(PINFO).forEach(k=>PIDX[nmKey(k)]=k)}return PIDX[nmKey(n)]||null}
function plLink(name){const k=pinfoName(name);return k?`<a href="#" class="pl-go" data-pl="${esc(k)}">${esc(name)}</a>`:esc(name)}
function goPlayer(name){const P=PINFO[name];if(!P)return;const mk=null;
  S.prop={player:name,market:mk,open:true};if(location.hash==="#props")viewProps();else location.hash="props";window.scrollTo(0,0)}
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest(".pl-go");if(!a)return;e.preventDefault();goPlayer(a.dataset.pl)});

/* 1. Box score for one game */
function boxScoreHtml(wk,away,home){const k=`${wk}|${away}|${home}`,B=(typeof BOX!=="undefined"&&BOX[k])||(typeof BOX_ESPN!=="undefined"&&BOX_ESPN[k]);if(!B&&!ADVOK)return "";
  if(!B)return `<div class="card"><p class="note" style="margin:0">Box score not available yet.</p></div>`;
  const tbl=(title,head,rows,fn)=>`<div class="card"><h3 style="margin:0 0 6px">${title}</h3><div style="overflow-x:auto"><table class="wtbl"><thead><tr><th>Player</th>${head.map(h=>`<th class="r">${h}</th>`).join("")}</tr></thead><tbody>
    ${[away,home].map(tm=>{const R=rows.filter(r=>r[1]===tm);return R.length?`<tr class="tmrow"><td colspan="${head.length+1}">${badge(tm)} ${short(tm)}</td></tr>`+R.map(r=>`<tr><td>${plLink(r[0])}</td>${fn(r).map(v=>`<td class="r num">${v}</td>`).join("")}</tr>`).join(""):""}).join("")}</tbody></table></div></div>`;
  return `<div class="grid g3 boxgrid">${tbl("Passing",["C/Att","Yds","TD","INT"],B.p,r=>[r[2]+"/"+r[3],r[4],r[5],r[6]])}
   ${tbl("Rushing",["Att","Yds","TD"],B.r,r=>[r[2],r[3],r[4]])}
   ${tbl("Receiving",["Rec","Tgt","Yds","TD"],B.c,r=>[r[2],r[3],r[4],r[5]])}</div>
   <p class="note" style="margin-top:6px">Box score: ${typeof BOX!=="undefined"&&BOX[k]?"nflverse official stats":"ESPN, posted right after the game (official nflverse stats replace it on Tuesday)"}. Tap a name for that player's page.</p>`}

/* 3. Player search (header) */
function searchSetup(){const inp=document.getElementById("plSearch"),box=document.getElementById("plRes");if(!inp||typeof PINFO==="undefined")return;
  const names=Object.keys(PINFO).sort();
  const draw=()=>{const q=inp.value.trim().toLowerCase();if(q.length<2){box.innerHTML="";box.hidden=true;return}
    const hit=names.filter(n=>n.toLowerCase().includes(q)).slice(0,8);
    box.innerHTML=hit.length?hit.map(n=>`<button data-n="${esc(n)}">${badge(PINFO[n].team)} <span>${esc(n)}</span><small>${PINFO[n].pos}</small></button>`).join(""):'<div class="small" style="padding:8px">No player found</div>';box.hidden=false};
  inp.oninput=draw;inp.onfocus=draw;
  inp.onkeydown=e=>{if(e.key==="Enter"){const b=box.querySelector("button");if(b)b.click()}if(e.key==="Escape"){inp.value="";draw()}};
  box.onclick=e=>{const b=e.target.closest("button");if(!b)return;inp.value="";draw();inp.blur();goPlayer(b.dataset.n)};
  document.addEventListener("click",e=>{if(!e.target.closest(".psearch"))box.hidden=true});
}

/* 4. Red zone card + TD-prop line */
function rzCard(pl){if(!ADVOK)return "";const r=RZ[pl.name];if(!r)return pl.pos==="QB"?"":`<div class="card"><h2>Red zone</h2><p class="note" style="margin:0">No red-zone targets or carries yet this season.</p></div>`;
  const t=(lab,v,sub)=>`<div class="stat"><div class="l">${lab}</div><div class="v">${v}</div><div class="s">${sub}</div></div>`;
  const tiles=[t("Targets inside the 20",r.t20,`${r.ts}% of team`),t("Targets inside the 10",r.t10,"end-zone range")];
  if(r.c20||pl.pos==="RB"){tiles.push(t("Carries inside the 20",r.c20,`${r.cs}% of team`));tiles.push(t("Carries inside the 5",r.c5,`${r.c5s}% of team · goal line`))}
  else tiles.push(t("Red-zone TDs",r.td,"this season"));
  return `<div class="card"><div class="row" style="align-items:center"><h2 style="margin:0">Red zone & goal line</h2><span class="sp"></span><span class="tag real">nflverse</span></div>
   <div class="stats3 usage-tiles" style="margin-top:12px">${tiles.join("")}</div>
   <p class="note" style="margin:8px 0 0">${r.td} red-zone touchdown${r.td===1?"":"s"} this season (${ADV_ASOF}). Touchdowns mostly come from these chances — a big share of his team's red-zone work is the best sign for anytime-TD props.</p></div>`}
function rzLine(name){if(!ADVOK)return "";const r=RZ[name];if(!r)return "";
  const b=[];if(r.c5)b.push(`goal-line carries <b>${r.c5s}%</b> of team`);if(r.t20)b.push(`red-zone targets <b>${r.ts}%</b>`);
  return b.length?`<div class="small usage-line">🎯 ${b.join(" · ")} · ${r.td} RZ TD</div>`:""}

/* 5. Home/away + last-5 splits for the chosen market */
function splitsCard(pl,k,line,CL){const unit=MARKETS[k].u,dec=MARKETS[k].cnt?1:0;
  const v=a=>a.map(l=>stat(l,k)).filter(Number.isFinite);const av=a=>a.length?fmt(a.reduce((x,y)=>x+y,0)/a.length,dec):"—";
  const hit=a=>a.length?`${a.filter(x=>x>line).length} of ${a.length} over ${line}`:"no games";
  const H=v(CL.filter(l=>+l.home===1)),A=v(CL.filter(l=>+l.home===0)),L5=v(CL.slice(-5)),S5=v(CL);
  if(!S5.length)return "";const o=oppOf(pl.team),here=o?(o.home?"home":"away"):null;
  const box=(lab,a,cur)=>`<div class="stat ${cur?"cur":""}"><div class="l">${lab}${cur?' <span class="tag real">this week</span>':""}</div><div class="v">${av(a)}</div><div class="s">${unit} · ${hit(a)}</div></div>`;
  return `<div class="card"><h2>Splits: ${MARKETS[k].n.toLowerCase()}</h2>
   <div class="stats3 usage-tiles" style="margin-top:12px">${box("At home",H,here==="home")}${box("On the road",A,here==="away")}${box("Last 5 games",L5)}${box("Season",S5)}</div>
   <p class="note" style="margin:8px 0 0">${here?`He's ${here==="home"?"at home":"on the road"} this week. `:""}Compare his last 5 with his season average to see if he's trending up or down.</p></div>`}

/* 6+7. Pace / play style + rest & travel on a game page */
function paceRestSection(g){if(!ADVOK)return "";const pa=PACE[g.away],ph=PACE[g.home],ra=REST[g.away],rh=REST[g.home];if(!pa&&!ra)return "";
  const row=(lab,a,b)=>`<tr><td>${lab}</td><td class="r">${a}</td><td class="r">${b}</td></tr>`;
  const pv=(p,key,fmtv)=>p&&p[key]!=null?`<b>${fmtv(p[key])}</b> <span class="small">${ord(p[key+"R"])}</span>`:"—";
  let paceTxt="";if(pa&&ph){const comb=pa.ppg+ph.ppg;const lg=Object.values(PACE).reduce((s,x)=>s+x.ppg,0)/Object.keys(PACE).length*2;
    paceTxt=comb>lg+3?`Fast matchup: ${comb.toFixed(0)} combined plays a game vs ${lg.toFixed(0)} league average — more volume for player overs.`:comb<lg-3?`Slow matchup: ${comb.toFixed(0)} combined plays a game vs ${lg.toFixed(0)} league average — fewer snaps for player props.`:`About average pace: ${comb.toFixed(0)} combined plays a game (league ${lg.toFixed(0)}).`}
  const pace=pa&&ph?`<div class="card"><h2>Pace & play style</h2><table><thead><tr><th></th><th class="r">${short(g.away)}</th><th class="r">${short(g.home)}</th></tr></thead><tbody>
    ${row("Plays per game",pv(pa,"ppg",x=>x),pv(ph,"ppg",x=>x))}
    ${row("Pass rate (neutral)",pv(pa,"npr",x=>x+"%"),pv(ph,"npr",x=>x+"%"))}
    ${row("Pass rate vs expected",pv(pa,"proe",x=>(x>0?"+":"")+x+"%"),pv(ph,"proe",x=>(x>0?"+":"")+x+"%"))}</tbody></table>
    <p class="note" style="margin:8px 0 0">${paceTxt} Neutral = 1st–3rd down, game within reach. Small number = NFL rank (1st = most).</p></div>`:"";
  const rs=r=>!r?"—":`<b>${r.rest} days</b>${r.bye?' <span class="tag real">off bye</span>':r.short?' <span class="tag" style="background:#f0525222;color:#f05252">short week</span>':""}`;
  const tv=r=>!r?"—":r.mi===0?"Home":r.mi==null?"Neutral site":`<b>${r.mi.toLocaleString()} mi</b>${r.tz?` <span class="small">${Math.abs(r.tz)} time zone${Math.abs(r.tz)>1?"s":""} ${r.tz>0?"east":"west"}</span>`:""}`;
  const edge=ra&&rh?(()=>{const d=rh.rest-ra.rest;const t=[];if(Math.abs(d)>=3)t.push(`${short(d>0?g.home:g.away)} have ${Math.abs(d)} more days of rest`);
    if(ra.mi>=1500)t.push(`${short(g.away)} travel ${ra.mi.toLocaleString()} miles`);if(ra.tz<=-2||ra.tz>=2)t.push(`${short(g.away)} cross ${Math.abs(ra.tz)} time zones`);
    return t.length?t.join("; ")+".":"No big rest or travel edge."})():"";
  const rest=ra&&rh?`<div class="card"><h2>Rest & travel</h2><table><thead><tr><th></th><th class="r">${short(g.away)}</th><th class="r">${short(g.home)}</th></tr></thead><tbody>
    ${row("Days since last game",rs(ra),rs(rh))}${row("Travel",tv(ra),tv(rh))}</tbody></table>
    <p class="note" style="margin:8px 0 0">${edge} Teams coming off a bye or with extra rest have historically covered slightly more often; long trips and short weeks are small negatives.</p></div>`:"";
  return `<div class="section"><h2>Pace, rest & travel</h2><div class="grid g2">${pace}${rest}</div></div>`}
function restMini(g){if(!ADVOK)return "";const t=[];[g.away,g.home].forEach(tm=>{const r=REST[tm];if(!r)return;
  if(r.bye)t.push(`${short(tm)} off bye`);else if(r.short)t.push(`${short(tm)} short week`);if(r.mi>=1500)t.push(`${short(tm)} ${r.mi.toLocaleString()} mi trip`)});
  return t.length?`<div class="pubmini">🧳 ${t.join(" · ")}</div>`:""}

/* ⏱ NFL player game logs right after the games: ESPN box scores (nfl_box.js) fill in weeks the nflverse logs don't have yet,
   so prop hit rates include last Sunday. The official nflverse rows replace them on Tuesday. */
/* 📒 official nflverse game logs (tools/nfllogs.py, weekly): replace the typed-in numbers for the same game and add the
   weeks the typed-in logs never got (they stopped at Week 8). Matched by name (+ position when two players share a name).
   Typed-in rows nflverse doesn't have (games with no stats at all) are kept. Runs before the ESPN fill below. */
(function(){if(typeof NFLV_LOGS==="undefined"||!NFLV_LOGS||typeof REAL_LOGS==="undefined"||typeof PINFO==="undefined")return;
  const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,"").replace(/[^a-z]/g,"");
  const by={};for(const r of NFLV_LOGS.rows)(by[norm(r[0])]=by[norm(r[0])]||[]).push(r);
  const cur={};REAL_LOGS.forEach((l,i)=>{if(l.season===CUR)cur[l.player+"|"+l.week]=l});let upd=0,add=0;
  for(const [name,P] of Object.entries(PINFO)){let R=by[norm(name)];if(!R)continue;
    if(new Set(R.map(r=>r[2])).size>1){const R2=R.filter(r=>r[2]===P.pos);if(R2.length)R=R2}
    for(const r of R){const [,tm,pos,wk,opp,home,att,comp,py,ptd,int,ra,ry,rtd,rec,tgt,cy,ctd]=r;
      const v={team:tm,opp,home,passAtt:att,comp,passYds:py,passTD:ptd,int,rushAtt:ra,rushYds:ry,rushTD:rtd,rec,tgt,recYds:cy,recTD:ctd};
      const ex=cur[name+"|"+wk];if(ex){Object.assign(ex,v,{src:"nflverse"});upd++}else{const x=Object.assign({player:name,pos:P.pos,season:CUR,week:wk,src:"nflverse"},v);REAL_LOGS.push(x);cur[name+"|"+wk]=x;add++}}}
  window.NFLV_ON={upd,add,wk:NFLV_LOGS.week}})();
(function(){if(typeof BOX_ESPN==="undefined"||typeof REAL_LOGS==="undefined"||typeof PINFO==="undefined")return;
  const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,"").replace(/[^a-z]/g,"");
  const idx={};for(const n in PINFO)idx[norm(n)+"|"+PINFO[n].team]=n;const have=new Set(REAL_LOGS.map(l=>l.player+"|"+l.week));let n=0;
  for(const [key,B] of Object.entries(BOX_ESPN)){const [w,a,h]=key.split("|"),wk=+w,P={};
    const row=(nm,tm)=>{const name=idx[norm(nm)+"|"+tm];if(!name||have.has(name+"|"+wk))return null;return P[name]||(P[name]={player:name,team:tm,pos:PINFO[name].pos,season:CUR,week:wk,opp:tm===a?h:a,home:tm===h?1:0,src:"espn",
      passYds:0,comp:0,passTD:0,int:0,passAtt:0,rushAtt:0,rushYds:0,rushTD:0,rec:0,recYds:0,recTD:0,tgt:0})};
    for(const r of B.p||[]){const x=row(r[0],r[1]);if(x){x.comp=r[2];x.passAtt=r[3];x.passYds=r[4];x.passTD=r[5];x.int=r[6]}}
    for(const r of B.r||[]){const x=row(r[0],r[1]);if(x){x.rushAtt=r[2];x.rushYds=r[3];x.rushTD=r[4]}}
    for(const r of B.c||[]){const x=row(r[0],r[1]);if(x){x.rec=r[2];x.tgt=r[3];x.recYds=r[4];x.recTD=r[5]}}
    for(const x of Object.values(P)){REAL_LOGS.push(x);n++}}
  window.NFL_ESPN_LOGS=n})();

/* 🗓️ weekly NFL tables (tools/nflweekly.py, every Tuesday): replace the older hand-made defense-vs-position, recent-players,
   QB1 and head-to-head data when they're newer */
(function(){if(typeof NFLW==="undefined"||!NFLW||!NFLW.week)return;
  const oldWk=+((typeof PFR_SRC!=="undefined"&&String(PFR_SRC).match(/Week (\d+)/))||[0,0])[1]||8;if(NFLW.week<oldWk)return;
  if(typeof DVP_RAW!=="undefined")for(const [p,v] of Object.entries(NFLW.dvp||{}))DVP_RAW[p]=v;
  if(typeof PFR_DVP!=="undefined")for(const [p,v] of Object.entries(NFLW.pfr||{}))PFR_DVP[p]=v;
  if(typeof POSV!=="undefined")for(const [t,v] of Object.entries(NFLW.posv||{}))POSV[t]=v;
  if(typeof QB1_STATUS!=="undefined")for(const [t,q] of Object.entries(NFLW.qb1||{})){const i=typeof INJ_P!=="undefined"&&INJ_P[q.qb];
    QB1_STATUS[t]={qb:q.qb,out:q.out,left:q.left,sub:q.sub,now:i?`${i.s}${i.i?" — "+String(i.i).toLowerCase():""}${typeof INJ_ASOF!=="undefined"?` (ESPN injury report, ${INJ_ASOF.replace(/^\w+ /,"")})`:""}`:"Playing"}}
  window.NFLW_ON=1})();
function nflH2hRows(g){const P=typeof NFLW!=="undefined"&&NFLW&&NFLW.h2h;const r=P&&(P[g.away+"|"+g.home]||P[g.home+"|"+g.away]);return r||((typeof H2H_RAW!=="undefined"&&H2H_RAW[g.id])||[])}
