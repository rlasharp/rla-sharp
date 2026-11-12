/* ---------- ⭐ Plays of the Day (NBA + NHL) — the daily version of the NFL Plays of the Week ----------
   One page, a tab per sport. Each play gets a full write-up: the line and price, our chance vs what the odds need,
   his last 10 games against the line, and the reasons. The #1 is the Play of the Day. The plays are the same ones the
   record counts (locked before the first game by the site update; until then a preview using the same rules).
   Everything comes from real posted lines and box scores — nothing invented. */
let POTD_SP=null;
/* NHL play titles: props are plain text (escape them); game plays already carry their own small-print markup */
function potdNhTitle(x){return x.type==="prop"?potdE(nhlPlayTitle(x)):nhlPlayTitle(x)}
function potdSp(){if(POTD_SP)return POTD_SP;let s=null;try{s=LS.get("potdSp")||LS.get("sport")}catch(e){}return s==="nhl"?"nhl":s==="soc"?"soc":"nba"}
function potdE(s){return typeof esc!=="undefined"?esc(String(s)):String(s).replace(/[<&"]/g,c=>({"<":"&lt;","&":"&amp;",'"':"&quot;"})[c])}
function potdPct(x){return Math.round(x*100)+"%"}
/* last-10 strip: each game's number, green when it beat the line on our side */
function potdStrip(vals,line,side){if(!vals.length)return "";const hit=v=>side==="u"?v<line:v>line;
  return `<div class="pdstrip">${vals.map(v=>`<span class="${hit(v)?"h":v===line?"p":"m"}">${Math.round(v*10)/10}</span>`).join("")}<em>line ${line}</em></div>`}
function potdRes(r,v){if(!r||r==="pending")return "";const c=r==="win"?"up":r==="loss"?"dn":"";
  return `<span class="nhtag ${c}">${r==="win"?"✓ won":r==="loss"?"✗ lost":r}${v!=null&&v!==""?" · "+potdE(v):""}</span>`}
function potdCard(o,i){const top=i===0;
  return `<div class="card pdcard${top?" top":""}" ${o.attr||""}>${top?`<div class="pdrib">⭐ Play of the day</div>`:""}
   <div class="pdh"><div class="podn">${i+1}</div><div style="min-width:0;flex:1"><div class="pdt">${o.title} ${potdRes(o.r,o.v)}</div><div class="small">${o.sub}</div></div>
    ${o.ch!=null?`<div class="bps"><b>${potdPct(o.ch)}</b><span>our chance</span></div>`:""}</div>
   <div class="pdodds"><span>Odds <b>${typeof oddsFmt!=="undefined"?oddsFmt(o.odds):o.odds}</b>${o.book?` <span class="small">${potdE(o.book)}</span>`:""}</span>${o.need!=null?`<span>The odds need <b>${potdPct(o.need)}</b></span>`:""}${o.ch!=null&&o.need!=null?`<span>Edge <b class="up">+${Math.round((o.ch-o.need)*100)} pts</b></span>`:""}</div>
   ${o.strip||""}${o.why&&o.why.length?`<ul class="pdwhy">${o.why.map(w=>`<li>${w}</li>`).join("")}</ul>`:""}
   ${o.foot||""}</div>`}

/* ---- NBA ---- */
function potdNba(){if(typeof nbaTodayPlays==="undefined")return `<div class="card small">NBA data isn't loaded.</div>`;
  const TP=nbaTodayPlays(),P=TP.P,day=typeof nbaDayS!=="undefined"?nbaDayS(NBA_SLATE_DATE):NBA_SLATE_DATE;
  const lockRows=typeof NBA_PL!=="undefined"?NBA_PL.filter(r=>r[0]===NBA_SLATE_DATE):[];
  let head;
  if(!NBA_PROPS.length)head=`Today's player lines aren't posted yet (books usually put them up by late morning ET). The plays appear here as soon as they are.`;
  else if(!P.length)head=`No prop passes all of our filters for ${day} — sometimes the best play is no play. Every game still has our pick on the Games page.`;
  else head=TP.locked?`🔒 Locked for ${day} — these count in our record.`:`Preview for ${day} — locks about 6 hours before the first tip (it can still change until then).`;
  const cards=P.map((b,i)=>{const vals=nbaAllG(b.nm).slice(-(b.c10[1]||10)).map(o=>nbaVal(o.x,b.k)),avg=vals.length?vals.reduce((a,c)=>a+c,0)/vals.length:null;
    const mk=NBA_MK[b.k][1].toLowerCase(),ov=b.side==="o"?"over":"under";
    const why=[`Went ${ov} ${b.line} in <b>${b.c10[0]} of his last ${b.c10[1]}</b>${avg!=null?` (averaging ${avg.toFixed(1)} ${mk})`:""}.`];
    if(b.cS[1])why.push(`This season: ${b.cS[0]} of ${b.cS[1]} games ${ov} the line.`);
    if(b.cH[1])why.push(`Against ${potdE(b.opp)}: ${b.cH[0]} of ${b.cH[1]}.`);
    if(b.dvOk===1)why.push(`${potdE(b.opp)} ${b.side==="o"?"give up more":"allow less"} than average to his position in this stat.`);
    else if(b.dvOk===-1)why.push(`Watch out: ${potdE(b.opp)} ${b.side==="o"?"defend his position well":"give up a lot to his position"} in this stat.`);
    const inj=typeof nbaInjOf!=="undefined"&&nbaInjOf(b.nm);if(inj)why.push(`Injury report: ${potdE(inj[2]||"listed")}.`);
    const row=lockRows.find(r=>r[1]===b.nm&&r[2]===b.k),gr=row&&typeof nbaGradeOne!=="undefined"?nbaGradeOne(row):null;
    return potdCard({title:`${potdE(b.nm)} <span class="xpk">${b.side==="o"?"Over":"Under"} ${b.line}</span> ${potdE(NBA_MK[b.k][1])}`,
      sub:`${potdE(b.p.tm)} ${b.g&&b.g.a===b.p.tm?"@":"vs"} ${potdE(b.opp)}${b.g&&b.g.t?" · "+potdE(b.g.t)+" ET":""}`,odds:b.odds,book:b.book,ch:b.sc,need:b.be,
      strip:potdStrip(vals,b.line,b.side),why,r:gr&&gr.st,v:gr&&gr.v,
      attr:`data-pdnba="${potdE(b.nm)}|${b.k}"`,
      foot:`<div class="pdft"><span class="small">Tap for his full game log →</span>${typeof actBtn!=="undefined"&&typeof nbaSpec!=="undefined"?actBtn(nbaSpec(b.nm,b.k,b.side==="o"?"over":"under"),"＋ My bets","plus"):""}</div>`},i)}).join("");
  const rec=typeof nbaRecordCard!=="undefined"?nbaRecordCard(false):"";
  return `<p class="small pdhead">${head}</p>${cards}${typeof prlSportHtml!=="undefined"?prlSportHtml("nba"):""}<div style="margin-top:14px">${rec}</div>
   <div class="small" style="margin-top:8px">How they're picked: real posted lines only — over/under hit 7+ of his last 10 and 60%+ this season with our chance 7+ points over what the odds need (on a day when nothing clears that: 6+ of 10, 55%+ this season, 4+ points), odds between −200 and +150, nobody on the injury report, at most one player per game when possible. Leans, not guarantees — bet small.</div>`}

/* ---- NHL ---- */
/* the same rule the tracker locks with (tools/track.js) — shown as a preview until the lock */
function potdNhlPreview(){if(typeof nhBest==="undefined"||!NHL_DATE)return [];const d=NHL_DATE,used=new Set(),P=[];
  for(const b of nhBest()){if(P.length>=3)break;if(!b.g||b.g.d!==d)continue;if(used.has(b.nm)||b.s.n10<8||b.s.l10<7||b.edge<.05||b.odds==null||b.odds<-200||nhOutNow(b.nm))continue;used.add(b.nm);
    P.push({type:"prop",nm:b.nm,tm:nhWho(b.nm).tm,k:b.k,side:b.side,line:b.line,odds:b.odds,b})}
  const ge=[];for(const g of NHL_SLATE||[]){if(nhStarted(g))continue;const E=nhEdges(g).filter(e=>e.edge>=.05&&e.odds>=-200&&e.odds<=250&&e.mk!=="1st period total");if(E[0])ge.push(E[0])}
  for(const e of ge.sort((a,b)=>b.edge-a.edge).slice(0,2))P.push({type:"game",mk:e.mk,pick:e.pick,a:e.g.a,h:e.g.h,odds:e.odds,e});
  return P}
function potdNhl(){if(typeof NHL_DATE==="undefined"||!NHL_DATE){if(typeof nhlEnsure!=="undefined")nhlEnsure(()=>{if(location.hash==="#potd")viewPotd()});return `<div class="card small">Loading NHL data…</div>`}
  const T=typeof TRACK!=="undefined"&&TRACK?TRACK:null,lk=T&&T.nhlPlays||[],locked=lk.length>0,P=locked?lk:potdNhlPreview(),day=nhDayS(NHL_DATE);
  const S=T&&T.sum&&T.sum.nhl&&T.sum.nhl.plays;
  const head=!NHL_SLATE.length?`No NHL games today.`:!P.length?`Nothing passes our filters for ${day} yet — lines and props fill in through the day.`:locked?`🔒 Locked for ${day} — these count in our record.`:`Preview for ${day} — locks about 6 hours before the first puck drop (it can still change until then).`;
  const imp=o=>nhImp(o);
  const cards=P.map((x0,i)=>{const L=!x0.r&&typeof finItem!=="undefined"?finItem("nhl",NHL_DATE,x0):null,x=L?{...x0,r:L.r,v:L.v}:x0;
    if(x.type==="prop"){const b=x.b||nhBest().find(y=>y.nm===x.nm&&y.k===x.k&&y.side===x.side&&y.line===x.line),s=b?b.s:nhScore(x.nm,x.k,x.line,x.side);
      const vals=nhVals(x.nm,x.k).map(o=>o.v).slice(-10),m=NH_MK[x.k],g=nhGameOf(x.tm),ov=x.side==="o"?"over":"under";
      const why=[];if(s){why.push(`Went ${ov} ${x.line} in <b>${s.l10} of his last ${s.n10}</b> (averaging ${s.avg.toFixed(1)} ${potdE(m[2])} this season).`);why.push(`This season: ${s.hs} of ${s.ns} games ${ov} the line.`)}
      if(NHL_G[x.nm]&&g){const opp=g.a===x.tm?g.h:g.a,o=NHL_TEAM[opp];if(o&&o.sf)why.push(`${potdE(nhTm(opp))} average ${(+o.sf).toFixed(1)} shots a game.`)}
      return potdCard({title:`${potdNhTitle(x)}`,sub:`${potdE(x.tm)}${g?` ${g.a===x.tm?"@":"vs"} ${potdE(g.a===x.tm?g.h:g.a)} · ${potdE(g.t)} ET`:""}`,odds:x.odds,ch:b?b.s.p:null,need:imp(x.odds),
        strip:potdStrip(vals,x.line,x.side),why,r:x.r,v:x.v,attr:`data-pdnhl="${potdE(x.nm)}"`,foot:`<div class="pdft"><span class="small">Tap for his full game log →</span></div>`},i)}
    const g=(NHL_SLATE||[]).find(y=>y.a===x.a&&y.h===x.h),e=x.e||(g?nhEdges(g).find(y=>y.mk===x.mk&&y.pick===x.pick):null),pr=g&&nhProject(g);
    const why=[];if(pr)why.push(`Our model: ${potdE(nhTm(g.h))} win ${potdPct(pr.hwin)} of the time; expected score ${potdE(nhTm(g.a))} ${pr.la.toFixed(1)} – ${pr.lh.toFixed(1)} ${potdE(nhTm(g.h))}.`);
    if(g){const pa=nhProbable(g.a,g),ph=nhProbable(g.h,g);if(pa||ph)why.push(`Goalies: ${potdE(pa?pa.nm:"TBD")} vs ${potdE(ph?ph.nm:"TBD")}.`)}
    if(x.why&&!e)why.push(potdE(x.why));
    return potdCard({title:`${potdE(x.pick)} <span class="small">${potdE(x.mk)}</span>`,sub:`${potdE(nhTm(x.a))} @ ${potdE(nhTm(x.h))}${g?" · "+potdE(g.t)+" ET":""}`,odds:x.odds,ch:e?e.me:null,need:e?e.bk:imp(x.odds),why,r:x.r,v:x.v,
      attr:g?`data-pdgame="#nhl-game-${g.id}"`:"",foot:g?`<div class="pdft"><span class="small">Tap for the full matchup →</span></div>`:""},i)}).join("");
  const R=T&&T.sum&&T.sum.nhl&&(T.sum.nhl.recent||[]).filter(x=>x.r&&x.r!=="pending"&&x.d!==NHL_DATE).slice(0,10);
  const rec=`<div class="card rec"><h2 style="margin-bottom:4px">📒 NHL plays of the day record</h2>
    ${S&&(S.w+S.l)?`<div class="recs"><div><b>${S.w}-${S.l}${S.p?"-"+S.p:""}</b>Record</div><div><b class="${S.u>0?"up":S.u<0?"dn":""}">${S.u>0?"+":""}${(+S.u).toFixed(2)}u</b>Units (1u a play)</div><div><b>${potdPct(S.w/(S.w+S.l))}</b>Hit rate</div></div>`:`<div class="small">Tracking started Nov 8 — results post after the games.</div>`}
    ${(R||[]).map(x=>`<div class="rcr"><span class="lc ${x.r==="win"?"o":x.r==="loss"?"u":"p"} rcc">${x.r==="win"?"W":x.r==="loss"?"L":"P"}</span><div style="flex:1;min-width:0"><b>${potdNhTitle(x)}</b> <span class="small">${typeof xOdds!=="undefined"?xOdds(x.odds):x.odds} · ${potdE(nhDayS(x.d).split(",").slice(0,2).join(","))}${x.v!=null?" · "+potdE(x.v):""}</span></div></div>`).join("")}
    <a href="#record" class="small" style="display:block;text-align:center;margin-top:8px;color:var(--text2)">📒 Full record →</a></div>`;
  return `<p class="small pdhead">${head}</p>${cards}${typeof prlSportHtml!=="undefined"?prlSportHtml("nhl"):""}<div style="margin-top:14px">${rec}</div>
   <div class="small" style="margin-top:8px">How they're picked: props that went our way in 7+ of the last 10 with our chance at least 5 points over what the odds need (odds −200 or better, player not injured), plus our two biggest game edges (moneyline, puck line or total). Leans, not guarantees — bet small.</div>`}

function viewPotd(){const el=document.getElementById("v-potd");if(!el)return;const sp=potdSp();
  el.innerHTML=`<h1>⭐ Plays of the Day</h1><p class="sub">Our strongest leans for today's games, written up like the NFL Plays of the Week — every day, locked before the games and graded after.</p>
   <div class="seg ttabs" style="margin-bottom:10px">${[["nba","🏀 NBA"],["nhl","🏒 NHL"],["soc","⚽ Soccer"]].map(([k,l])=>`<button class="btn${sp===k?" on":""}" data-pdsp="${k}">${l}</button>`).join("")}<a class="btn" href="#plays">🏈 NFL week</a></div>
   <div id="pdBody">${sp==="nhl"?potdNhl():sp==="soc"?potdSoc():potdNba()}</div>`;
  el.querySelectorAll("[data-pdsp]").forEach(b=>b.onclick=()=>{POTD_SP=b.dataset.pdsp;try{LS.set("potdSp",POTD_SP)}catch(e){}viewPotd()});
  el.querySelectorAll("[data-pdnba]").forEach(c=>c.onclick=e=>{if(e.target.closest("[data-act],button,a"))return;const [nm,k]=c.dataset.pdnba.split("|");nbaGoPlayer(typeof nbaUnesc!=="undefined"?nbaUnesc(nm):nm,k)});
  el.querySelectorAll("[data-pdnhl]").forEach(c=>c.onclick=e=>{if(e.target.closest("[data-act],button,a"))return;location.hash="#nhl-player-"+encodeURIComponent(c.dataset.pdnhl.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&lt;/g,"<"))});
  el.querySelectorAll("[data-pdgame]").forEach(c=>c.onclick=e=>{if(e.target.closest("[data-act],button,a"))return;location.hash=c.dataset.pdgame});
  if(typeof actBind!=="undefined")try{actBind(el)}catch(e){}}
function potdSoc(){if(!window.SOC_OK){if(typeof socEnsure!=="undefined")socEnsure(()=>{if(location.hash==="#potd")viewPotd()});return `<div class="card small">Loading soccer…</div>`}
  const c=typeof socPlaysCard!=="undefined"?socPlaysCard():"";
  return `${c||`<div class="card small">No soccer plays right now — they're picked 1–2 days before kickoff once odds are posted (club matches return after the international break).</div>`}${typeof prlSportHtml!=="undefined"?prlSportHtml("soc"):""}<div class="small" style="margin-top:8px">Picked automatically from posted odds where our estimate beats the price; locked before kickoff and graded after.</div>`}
/* a one-line teaser at the top of the NBA / NHL games pages */
function potdTeaser(sp){try{let t="";
  if(sp==="nba"&&typeof nbaTodayPlays!=="undefined"){const b=nbaTodayPlays().P[0];if(b)t=`${potdE(b.nm)} ${b.side==="o"?"Over":"Under"} ${b.line} ${potdE(NBA_MK[b.k][1])} <span class="small">${oddsFmt(b.odds)}</span>`}
  if(sp==="nhl"){const T=typeof TRACK!=="undefined"&&TRACK,P=T&&T.nhlPlays&&T.nhlPlays.length?T.nhlPlays:potdNhlPreview(),x=P[0];if(x)t=`${potdNhTitle(x)} <span class="small">${typeof xOdds!=="undefined"?xOdds(x.odds):x.odds}</span>`}
  return `<a class="card pdteas" href="#potd" data-pdgo="${sp}"><span>⭐ <b>Play of the day</b></span><span class="pdtx">${t||`<span class="small">${sp==="nba"&&typeof NBA_PROPS!=="undefined"&&NBA_PROPS.length?"nothing passes our filters today":"posted once today's lines are up"}</span>`}</span><span class="small">All plays →</span></a>`}catch(e){return ""}}
document.addEventListener("click",e=>{const a=e.target.closest("[data-pdgo]");if(a){POTD_SP=a.dataset.pdgo;try{LS.set("potdSp",POTD_SP)}catch(x){}}});
