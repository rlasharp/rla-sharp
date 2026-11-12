/* ---------- 📐 Deeper analysis (all sports): vs defenses like tonight's, blowout risk, with/without teammates,
   line vs result history, minutes / ice-time streaks, NFL quarters, NBA referees, NHL listed goalies ----------
   Everything here is computed from the box scores and lines the site already has — nothing invented. */
const XA={tier:{},hist:null,hb:0,hcb:[]};
const XA_BLOW={nba:15,nhl:3,nfl:17},XA_CLOSE={nba:8,nhl:1,nfl:8};
function xaEsc(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function xaOver(side){return side==="o"||side==="over"}
/* this season's games for a player + market: [{d, opp, v, mg (final margin, + = his team won), min, wk}] */
function xaGames(sp,nm,k){const out=[];
  try{
    if(sp==="nba"){const p=NBA_LOGS[nm];if(!p||!NBA_MK[k])return out;
      for(const x of p.g){const r=NBA_RES.find(z=>z[0]===x[0]);const mine=r?(r[2]===p.tm?r[4]-r[5]:r[5]-r[4]):null;out.push({d:x[1],opp:x[2],v:nbaVal(x,k),mg:mine,min:x[4]})}}
    if(sp==="nhl"){const w=nhWho(nm),m=NH_MK[k];if(!w||!m||!m[3])return out;const gk=!!NHL_G[nm];
      for(const x of w.g){if(gk?x[9]===1:x[16]===1)continue;if(gk&&!x[7])continue;const r=(NHL_RES||[]).find(z=>z[0]===x[0]&&(z[1]===w.tm||z[3]===w.tm));
        const mine=r?(r[1]===w.tm?r[2]-r[4]:r[4]-r[2]):null;const v=m[3](x);if(v==null)continue;out.push({d:x[0],opp:x[1],v,mg:mine,min:(gk?x[6]:x[10])/60})}}
    if(sp==="nfl"){const P=PINFO[nm];if(!P||!MARKETS[k])return out;
      for(const l of pLogs(nm).filter(l=>l.season===CUR)){const v=stat(l,k);if(!Number.isFinite(v))continue;const r=RESULTS.find(z=>z[0]===l.week&&(z[1]===l.team||z[3]===l.team));
        const mine=r?(r[1]===l.team?r[2]-r[4]:r[4]-r[2]):null;out.push({d:typeof nflWeekDate!=="undefined"?nflWeekDate(l.week):"",wk:l.week,opp:l.opp,v,mg:mine})}}
  }catch(e){}
  return out}
/* how generous each defense is for this stat (rank 1 = allows the most = softest) */
function xaTierTable(sp,pos,k){const key=sp+"|"+pos+"|"+k;if(XA.tier[key])return XA.tier[key];let T={};
  try{
    if(sp==="nba"){const idx=nbaDvpIdx(),teams=Object.keys(NBA_TEAMS);
      for(const t of teams){const G=NBA_RES.filter(r=>r[2]===t||r[3]===t);let s=0,n=0;for(const r of G){const xs=(idx[r[0]+"|"+t]||{})[pos];if(!xs)continue;s+=xs.reduce((a,o)=>a+nbaVal(o.x,k),0);n++}if(n)T[t]=s/n}}
    if(sp==="nhl"){const f={hsog:t=>t.sa,hgoals:t=>t.ga,hpts:t=>t.ga,hast:t=>t.ga,hanyG:t=>t.ga,hppp:t=>100-(t.pk||80),hsaves:t=>t.sf,hblk:t=>t.sf,hfow:t=>100-(t.fo||50)}[k];
      if(f)for(const [t,x] of Object.entries(NHL_TEAM)){const v=f(x);if(v!=null&&isFinite(v))T[t]=v}}
    if(sp==="nfl"){for(const t of (typeof TEAM_IDS!=="undefined"?TEAM_IDS:[])){const r=dvpFor(t,pos,k);if(Number.isFinite(r.avg))T[t]=r.avg}}
  }catch(e){}
  const L=Object.entries(T).sort((a,b)=>b[1]-a[1]),R={};L.forEach(([t,v],i)=>R[t]={rank:i+1,n:L.length,v,tier:i<L.length/3?"soft":i>=L.length*2/3?"tough":"avg"});
  return XA.tier[key]=R}
function xaPos(sp,nm){if(sp==="nba"){const p=NBA_LOGS[nm];return p&&(p.p5||null)}if(sp==="nfl")return (PINFO[nm]||{}).pos;return "all"}
function xaOpp(sp,nm){try{
  if(sp==="nba"){const p=NBA_LOGS[nm],g=p&&nbaGameOf(p.tm);return g?{opp:g.a===p.tm?g.h:g.a,g,home:g.h===p.tm}:null}
  if(sp==="nhl"){const w=nhWho(nm),g=w&&nhGameOf(w.tm);return g?{opp:g.a===w.tm?g.h:g.a,g,home:g.h===w.tm}:null}
  if(sp==="nfl"){const P=PINFO[nm],o=P&&oppOf(P.team);return o?{opp:o.opp,g:o.g,home:o.home}:null}}catch(e){}return null}
/* tonight's expected margin for his team (+ = favoured by that much) */
function xaSpread(sp,nm,O){try{if(!O)return null;
  if(sp==="nba"){const L=NBA_LINES[O.g.a+"@"+O.g.h];if(!L||L.sp==null)return null;return O.home?-L.sp:L.sp}
  if(sp==="nfl"){const L=LINES[O.g.id];if(!L||L.sp==null)return null;return O.home?-L.sp:L.sp}
  if(sp==="nhl"){const ml=O.g.ml;if(!ml)return null;const imp=o=>o==null?null:o<0?-o/(-o+100):100/(o+100);const pa=imp(ml[0]),ph=imp(ml[1]);if(pa==null||ph==null)return null;const me=O.home?ph/(pa+ph):pa/(pa+ph);return (me-.5)*6}  // win chance -> rough goal margin
}catch(e){}return null}
function xaGrp(G,line,over){const n=G.length,h=G.filter(x=>x.v===line?false:over?x.v>line:x.v<line).length,av=n?G.reduce((s,x)=>s+x.v,0)/n:null;return {n,h,av}}
/* ---- minutes / ice-time streaks ---- */
function xaMinTrend(sp,nm){if(sp==="nfl")return null;const G=xaGames(sp,nm,sp==="nba"?"pts":(NHL_G[nm]?"hsaves":"hsog")).filter(x=>x.min!=null);if(G.length<6)return null;
  const avg=G.reduce((s,x)=>s+x.min,0)/G.length,thr=sp==="nba"?3:NHL_G[nm]?99:1.5;let up=0,dn=0;
  for(let i=G.length-1;i>=0&&G[i].min>=avg+thr;i--)up++;for(let i=G.length-1;i>=0&&G[i].min<=avg-thr;i--)dn++;
  const n=Math.max(up,dn);if(n<3)return null;return {dir:up?"up":"dn",n,avg,last:G.slice(-n).map(x=>x.min)}}
function xaMinChip(sp,nm){const t=xaMinTrend(sp,nm);if(!t)return "";const u=sp==="nba"?"min":"min TOI";
  return `<span class="xachip ${t.dir}" title="${t.n} straight games ${t.dir==="up"?"above":"below"} his season average of ${t.avg.toFixed(1)} ${u}">⏱️ ${u==="min"?"minutes":"ice time"} ${t.dir==="up"?"⬆":"⬇"} ${t.n} straight</span>`}
/* ---- blowout risk ---- */
function xaBlow(sp,nm,k,side){const O=xaOpp(sp,nm),s=xaSpread(sp,nm,O);if(s==null)return null;const big=Math.abs(s)>=(sp==="nhl"?1.2:10),some=Math.abs(s)>=(sp==="nhl"?.9:7);
  const G=xaGames(sp,nm,k).filter(x=>x.mg!=null),B=G.filter(x=>Math.abs(x.mg)>=XA_BLOW[sp]),C=G.filter(x=>Math.abs(x.mg)<=XA_CLOSE[sp]);
  const avg=a=>a.length?a.reduce((t,x)=>t+x.v,0)/a.length:null;return {s,big,some,B,C,bAvg:avg(B),cAvg:avg(C)}}
function xaBlowChip(sp,nm,k,side){if(!xaOver(side))return "";const b=xaBlow(sp,nm,k,side);if(!b||!b.big)return "";
  const drop=b.B.length>=2&&b.cAvg!=null&&b.bAvg!=null&&b.bAvg<b.cAvg*.9;
  return `<span class="xachip warn" title="Tonight's line expects a ${Math.abs(b.s).toFixed(1)}-point game${drop?` — in his blowouts he averaged ${b.bAvg.toFixed(1)} vs ${b.cAvg.toFixed(1)} in close games`:""}">⚠️ blowout risk</span>`}
function xaChips(sp,nm,k,side){try{return xaMinChip(sp,nm)+xaBlowChip(sp,nm,k,side)+(sp==="nba"?xa3PChip(nm,k):"")}catch(e){return ""}}
/* ---- with / without teammates (NHL + NFL; NBA has its own teammate filter on the charts) ---- */
function xaOutNow(sp,tm){const L=[];try{
  if(sp==="nhl")for(const r of (NHL_INJ[tm]||[]))if(/out|reserve|\bir\b|suspen/i.test(r[2])&&nhWho(r[0]))L.push(r[0]);
  if(sp==="nfl")for(const [n,x] of Object.entries(typeof INJ_P!=="undefined"?INJ_P:{}))if(x.team===tm&&/out|ir|doubtful|reserve/i.test(x.s)&&pLogs(n).some(l=>l.season===CUR))L.push(n)}catch(e){}return L}
function xaWithout(sp,nm,k,line,side){if(sp==="nba")return [];const over=xaOver(side),G=xaGames(sp,nm,k);if(G.length<4)return [];
  const tm=sp==="nhl"?(nhWho(nm)||{}).tm:(PINFO[nm]||{}).team,out=[];
  const gk=sp==="nhl"&&!!NHL_G[nm];
  for(const m of xaOutNow(sp,tm).filter(m=>sp!=="nhl"||(!!NHL_G[m])===gk||!gk&&false).slice(0,4)){if(m===nm)continue;
    const played=sp==="nhl"?new Set((nhWho(m).g||[]).filter(x=>x[16]!==1&&x[9]!==1).map(x=>x[0])):new Set(pLogs(m).filter(l=>l.season===CUR).map(l=>l.week));
    const key=x=>sp==="nhl"?x.d:x.wk,W=G.filter(x=>played.has(key(x))),WO=G.filter(x=>!played.has(key(x)));
    if(WO.length>=2&&W.length>=2)out.push({m,w:xaGrp(W,line,over),wo:xaGrp(WO,line,over)})}
  return out}
/* ---- closing-line history (lines_hist.js, loaded on demand) ---- */
function xaHistEnsure(cb){if(XA.hist||typeof LINE_HIST!=="undefined"){XA.hist=XA.hist||LINE_HIST;cb();return}XA.hcb.push(cb);if(XA.hb)return;XA.hb=1;
  const s=document.createElement("script");s.src="lines_hist.js?v="+(typeof BUILD_AT!=="undefined"?BUILD_AT.replace(/\D/g,""):Date.now());
  const done=()=>{XA.hist=typeof LINE_HIST!=="undefined"?LINE_HIST:{};XA.hb=0;XA.hcb.splice(0).forEach(f=>{try{f()}catch(e){}})};s.onload=done;s.onerror=done;document.head.appendChild(s)}
function xaHistHtml(sp,nm,k,side){const H=(XA.hist||{})[sp+"|"+nm+"|"+k];if(!H||!H.length)return `<div class="small">No closing lines saved for him in this market yet (we save every line from Nov 2, 2026 on).</div>`;
  const G=xaGames(sp,nm,k),over=xaOver(side),pts=[];
  for(const [d,ln] of H){let g=null;if(sp==="nfl"){const t=Date.parse(d);g=G.find(x=>x.d&&Math.abs(Date.parse(x.d)-t)<=4*864e5)}else g=G.find(x=>x.d===d);pts.push({d,ln,v:g?g.v:null})}
  const done=pts.filter(p=>p.v!=null),hit=done.filter(p=>p.v!==p.ln&&(over?p.v>p.ln:p.v<p.ln)).length;
  const W=Math.max(220,pts.length*34),Hh=90,all=pts.flatMap(p=>[p.ln,p.v]).filter(v=>v!=null),mx=Math.max(...all)*1.1||1,X=i=>18+i*((W-36)/Math.max(1,pts.length-1)),Y=v=>Hh-14-(Hh-28)*v/mx;
  const svg=`<svg viewBox="0 0 ${W} ${Hh}" class="xahs" role="img" aria-label="Closing line vs result">${pts.map((p,i)=>`<line x1="${X(i)-9}" x2="${X(i)+9}" y1="${Y(p.ln)}" y2="${Y(p.ln)}" class="xaln"/><text x="${X(i)}" y="${Y(p.ln)-4}" class="xalt">${p.ln}</text>${p.v!=null?`<circle cx="${X(i)}" cy="${Y(p.v)}" r="4.5" class="${p.v>p.ln?"xao":p.v<p.ln?"xau":"xap"}"/>`:""}<text x="${X(i)}" y="${Hh-2}" class="xald">${p.d.slice(5).replace("-","/")}</text>`).join("")}</svg>`;
  const first=pts[0].ln,last=pts[pts.length-1].ln;
  return `<div class="xah">${svg}</div><div class="small">Dash = closing line, dot = what he did (filled = over). ${done.length?`${over?"Over":"Under"} hit <b>${hit} of ${done.length}</b> closing lines.`:""} ${pts.length>1&&first!==last?(()=>{const r3=done.slice(-3),ov=r3.filter(p=>p.v>p.ln).length,un=r3.filter(p=>p.v<p.ln).length;return `Line went ${first} → ${last}${last>first&&ov>=2?" — and he kept going over it":last<first&&un>=2?" — and he kept falling short":""}.`})():""}</div>`}
/* ---- the panel ---- */
function xaPanel(sp,nm,k,line,side){if(line==null)return "";return `<details class="drawer xa xadeep" data-xa="${xaEsc(JSON.stringify([sp,nm,k,line,side||"o"]))}"><summary>📐 Deeper splits <span class="small">defenses like tonight's · blowouts · teammates · line history</span></summary><div class="xab small">Loading…</div></details>`}
function xaPanelBody(sp,nm,k,line,side){const over=xaOver(side),word=over?"Over":"Under",G=xaGames(sp,nm,k);if(G.length<3)return `<div class="small">Not enough games this season yet.</div>`;
  const pos=xaPos(sp,nm),O=xaOpp(sp,nm),TT=pos?xaTierTable(sp,pos,k):{},tn=O&&TT[O.opp],rows=[];
  const cell=(g,lab,me)=>g.n?`<tr${me?' class="xame"':""}><td>${lab}</td><td><b>${g.h}/${g.n}</b></td><td>${g.av.toFixed(1)}</td></tr>`:"";
  /* vs defenses */
  if(Object.keys(TT).length){const by={soft:[],avg:[],tough:[]};for(const x of G){const t=TT[x.opp];if(t)by[t.tier].push(x)}
    rows.push(`<h4>🛡️ Against defenses like tonight's</h4><div class="small">${tn?`${xaEsc(O.opp)} rank <b>${tn.rank} of ${tn.n}</b> in what they allow here (${tn.tier==="soft"?"one of the most generous":tn.tier==="tough"?"one of the stingiest":"middle of the pack"}).`:""}</div>
      ${O?xaDefTrendLine(sp,O.opp,pos,k):""}<table class="bxt xat"><thead><tr><th>Defense</th><th>${word} ${line}</th><th>Avg</th></tr></thead><tbody>${cell(xaGrp(by.soft,line,over),"Generous (top third)",tn&&tn.tier==="soft")}${cell(xaGrp(by.avg,line,over),"Middle third",tn&&tn.tier==="avg")}${cell(xaGrp(by.tough,line,over),"Stingy (bottom third)",tn&&tn.tier==="tough")}</tbody></table>`)}
  /* blowouts */
  const b=xaBlow(sp,nm,k,side),M=G.filter(x=>x.mg!=null),Bl=M.filter(x=>Math.abs(x.mg)>=XA_BLOW[sp]),Cl=M.filter(x=>Math.abs(x.mg)<=XA_CLOSE[sp]);
  if(Bl.length||Cl.length){const u=sp==="nhl"?"goals":"points",X=XA_BLOW[sp],Wb=M.filter(x=>x.mg>=X),Lb=M.filter(x=>x.mg<=-X),fav=b&&b.s>0;
    rows.push(`<h4>💨 Game script: winning big, close, losing big</h4><div class="small">${b?`Tonight: ${b.s>=0?"favoured":"underdog"}${sp==="nhl"?"":` by ${Math.abs(b.s)}`} — ${b.big?"<b>real blowout risk</b> (starters can sit late)":b.some?"some blowout risk":"should be competitive"}.`:""}${sp==="nfl"?" Trailing teams throw more; leading teams run more.":""}</div>
      <table class="bxt xat"><thead><tr><th>His team…</th><th>${word} ${line}</th><th>Avg</th></tr></thead><tbody>${cell(xaGrp(Wb,line,over),`won by ${X}+ ${u}`,b&&b.big&&fav)}${cell(xaGrp(Cl,line,over),`close (≤${XA_CLOSE[sp]})`,b&&!b.some)}${cell(xaGrp(Lb,line,over),`lost by ${X}+ ${u}`,b&&b.big&&!fav)}</tbody></table>`)}
  /* teammates */
  const WO=xaWithout(sp,nm,k,line,side);if(WO.length)rows.push(`<h4>👥 With / without teammates who are out now</h4><table class="bxt xat"><thead><tr><th>Teammate</th><th>With him</th><th>Without</th></tr></thead><tbody>${WO.map(o=>`<tr class="xame"><td>${xaEsc(o.m)}</td><td>${o.w.h}/${o.w.n} · ${o.w.av.toFixed(1)}</td><td><b>${o.wo.h}/${o.wo.n} · ${o.wo.av.toFixed(1)}</b></td></tr>`).join("")}</tbody></table><div class="small">${word} ${line} hits / games · average.</div>`);
  /* NBA extras */
  if(sp==="nba"){const pj=xaProjBody(nm,k,line);if(pj)rows.unshift(pj);const us=xaUsageSay(nm);if(us)rows.push(`<h4>📊 Usage</h4><div class="small">${us}</div>`);
    if(["pts","pa","pr","pra"].includes(k)){const ft=xaFTSay(nm);if(ft)rows.push(`<h4>🎯 Free throws</h4><div class="small">${ft}</div>`)}
    const pc=xaPaceBody(nm,k,line,over);if(pc)rows.push(pc);
    if(["pts","3pm","3pa","pa","pr","pra"].includes(k)){const t=xa3PSay(nm);if(t)rows.push(`<h4>🎯 3-point shooting</h4><div class="small">${t}</div>`)}
    const f=xaFoulSay(nm);if(f)rows.push(`<h4>🟨 Fouls</h4><div class="small">${f}</div>`);
    const q=xaQ1Body(nm,k);if(q)rows.push(q)}
  /* NFL extras */
  if(sp==="nfl"){const P=PINFO[nm]||{};
    if(k==="anyTD"){const t=xaTdSay(nm);if(t)rows.push(`<h4>🎯 Anytime TD estimate</h4><div class="small">${t}</div>`)}
    if(P.pos==="QB"&&["passYds","passAtt","comp","passTD","int"].includes(k)){const t=xaQBVolSay(nm);if(t)rows.push(`<h4>📈 Pass volume tonight</h4><div class="small">${t}</div>`)}
    if(P.pos==="QB"&&["rushYds","rushAtt","anyTD"].includes(k)){const t=xaQBRunSay(nm);if(t)rows.push(`<h4>🏃 Designed runs vs scrambles</h4><div class="small">${t}</div>`)}
    if(["rec","recYds","rushRec"].includes(k)){const t=xaLocSay(nm);if(t)rows.push(`<h4>↔️ Middle vs outside</h4><div class="small">${t}</div>`)}
    const X=xaNflGame(nm),pr=X&&typeof NFL_PROE!=="undefined"&&NFL_PROE[X.P.team];if(pr&&pr[0]!=null)rows.push(`<div class="small" style="margin-top:6px">🧠 ${xaEsc(X.P.team)} pass ${pr[0]>0?"+":""}${pr[0]}% over expected (${xaOrd(xaProeRank(X.P.team))} of 32).</div>`)}
  /* power play + NHL extras */
  if(sp==="nhl"){const s=[xaPPSay(nm),["hpts","hast","hgoals","hanyG","hppp"].includes(k)?xaPPSplitSay(nm):""].filter(Boolean).join(" ");if(s)rows.push(`<h4>⚡ Power play</h4><div class="small">${s}</div>`);
    if(["hgoals","hanyG","hpts","hsog"].includes(k)){const f=xaFinishSay(nm);if(f)rows.push(`<h4>🎯 Finishing (expected goals)</h4><div class="small">${f}</div>`)}
    if(k==="hfow"){const f=xaFOSay(nm);if(f)rows.push(`<h4>🔁 Faceoff matchups</h4><div class="small">${f}</div>`)}
    if(k==="hsaves"){const f=xaSavesSay(nm,line);if(f)rows.push(`<h4>🧤 Projected saves</h4><div class="small">${f}</div>`)}}
  /* minutes */
  const t=xaMinTrend(sp,nm);if(t)rows.push(`<h4>⏱️ ${sp==="nba"?"Minutes":"Ice time"}</h4><div class="small">${t.n} straight games ${t.dir==="up"?"above":"below"} his season average (${t.avg.toFixed(1)} min): ${t.last.map(v=>v.toFixed(1)).join(", ")}. Lines often lag a role change.</div>`);
  rows.push(`<h4>📉 Closing line vs result</h4><div class="xahw">${XA.hist?xaHistHtml(sp,nm,k,side):"Loading…"}</div>`);
  return xaTabify(rows)+`<div class="small" style="margin-top:6px">This season's games only. Defense ranks use each team's season-long numbers.</div>`}
document.addEventListener("toggle",e=>{const d=e.target;if(!d.matches||!d.matches("details.xa")||!d.open||d.dataset.done)return;d.dataset.done=1;
  let a;try{a=JSON.parse(d.dataset.xa)}catch(x){return}const body=d.querySelector(".xab");try{body.innerHTML=xaPanelBody(...a)}catch(x){body.textContent="Couldn't build these splits."}
  xaHistEnsure(()=>{const w=d.querySelector(".xahw");if(w)w.innerHTML=xaHistHtml(a[0],a[1],a[2],a[4])})},true);

/* ---------- ⏱️ minutes / ice-time streak list (insights tab) ---------- */
function xaTrendCard(sp){const L=[];
  try{if(sp==="nba"){for(const g of NBA_SLATE.filter(g=>!nbaStarted(g)))for(const t of [g.a,g.h])for(const [n,p] of Object.entries(NBA_LOGS))if(p.tm===t&&p.g.length>=6){const r=xaMinTrend("nba",n);if(r)L.push({n,t,r})}}
    if(sp==="nhl"){for(const g of NHL_SLATE.filter(g=>!nhStarted(g)))for(const t of [g.a,g.h])for(const [n,p] of Object.entries(NHL_P))if(p.tm===t){const r=xaMinTrend("nhl",n);if(r)L.push({n,t,r})}}}catch(e){}
  L.sort((a,b)=>b.r.n-a.r.n||Math.abs(b.r.last.at(-1)-b.r.avg)-Math.abs(a.r.last.at(-1)-a.r.avg));
  if(!L.length)return `<div class="small">Nobody playing tonight has 3+ straight games well above or below his usual ${sp==="nba"?"minutes":"ice time"}.</div>`;
  const href=n=>sp==="nba"?`#nba-player-${encodeURIComponent(n)}`:`#nhl-player-${encodeURIComponent(n)}`;
  return `<div class="small" style="margin-bottom:6px">Players tonight with 3+ straight games ${sp==="nba"?"3+ minutes":"1.5+ minutes of ice time"} above or below their season average — props often lag a role change.</div>
   ${L.slice(0,14).map(x=>`<a class="nher" href="${href(x.n)}"><span><b>${xaEsc(x.n)}</b> <span class="small">${x.t}</span></span><span class="nhedv"><b class="${x.r.dir==="up"?"up":"dn"}">${x.r.dir==="up"?"⬆":"⬇"} ${x.r.n} straight</b><span class="small">${x.r.last.map(v=>v.toFixed(0)).join(" · ")} (avg ${x.r.avg.toFixed(1)})</span></span></a>`).join("")}`}

/* ---------- 🏈 NFL quarters & halves (NFL_QTR from ESPN) ---------- */
function xaNflQtr(t){const Q=[];for(const [key,[aq,hq]] of Object.entries(typeof NFL_QTR!=="undefined"?NFL_QTR:{})){const [,a,h]=key.split("|");if(a===t)Q.push([aq,hq]);else if(h===t)Q.push([hq,aq])}
  if(Q.length<2)return null;const n=Q.length,s=(i,me)=>Q.reduce((x,[m,o])=>x+((me?m:o)[i]||0),0)/n,h1=me=>Q.reduce((x,[m,o])=>x+((me?m:o)[0]||0)+((me?m:o)[1]||0),0)/n;
  return {n,f:[0,1,2,3].map(i=>s(i,1)),a:[0,1,2,3].map(i=>s(i,0)),f1:h1(1),a1:h1(0),w1:Q.filter(([m,o])=>m[0]+m[1]>o[0]+o[1]).length}}
function xaNflQtrCard(g){const A=xaNflQtr(g.away),H=xaNflQtr(g.home);if(!A||!H)return "";const f=v=>v.toFixed(1);
  const h1=(A.f1+H.a1)/2+(H.f1+A.a1)/2,m1=((A.f1+H.a1)/2)-((H.f1+A.a1)/2),q1=(A.f[0]+H.a[0])/2+(H.f[0]+A.a[0])/2;
  const row=(l,fa,aa,fh,ah)=>`<tr><td><b>${l}</b></td><td>${f(fa)}</td><td>${f(aa)}</td><td>${f(fh)}</td><td>${f(ah)}</td></tr>`;
  return `<div class="section"><div class="card"><h2 style="margin-bottom:2px">By quarter & first half</h2><div class="small" style="margin-bottom:8px">Points scored (For) and allowed (Agst) per quarter this season — useful for 1st-quarter and 1st-half bets.</div>
   <div class="nbatbl"><table class="bxt spl" style="min-width:0"><thead><tr><th></th><th>${g.away} For</th><th>Agst</th><th>${g.home} For</th><th>Agst</th></tr></thead><tbody>
   ${row("Q1",A.f[0],A.a[0],H.f[0],H.a[0])}${row("Q2",A.f[1],A.a[1],H.f[1],H.a[1])}${row("1st half",A.f1,A.a1,H.f1,H.a1)}${row("Q3",A.f[2],A.a[2],H.f[2],H.a[2])}${row("Q4",A.f[3],A.a[3],H.f[3],H.a[3])}</tbody></table></div>
   <div class="grid g2" style="margin-top:10px;gap:8px"><div class="tile"><div class="small">1st-half points (both teams)</div><b>${f(h1)}</b><div class="small">1st quarter ${f(q1)}</div></div>
   <div class="tile"><div class="small">1st-half lead</div><b>${Math.abs(m1)<.5?"About even":(m1>0?g.away:g.home)+" by "+f(Math.abs(m1))}</b><div class="small">led at half: ${g.away} ${A.w1}/${A.n} · ${g.home} ${H.w1}/${H.n}</div></div></div>
   <div class="small" style="margin-top:6px">Blend of each offense's points for and the other defense's points against, by quarter. A guide, not a line.</div></div></div>`}

/* ---------- 🦓 NBA referees (NBA_REFS) ---------- */
function xaRefCard(g){if(typeof NBA_REFS==="undefined"||!NBA_REFS)return "";const crew=(NBA_REFS.today||{})[g.a+"@"+g.h],R=NBA_REFS.ref||{},lg=NBA_REFS.lg;
  if(!crew)return `<div class="card xacard xadeep"><h2>🦓 Referees</h2><div class="small">The NBA posts tonight's crews around 9 AM ET — they'll show here after the next update.</div></div>`;
  const rows=crew.map(n=>{const r=R[n];return `<tr><td><b>${xaEsc(n)}</b></td>${r?`<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[5]?`${r[4]}-${r[5]-r[4]}`:"–"}</td>`:`<td colspan="5" class="small">fewer than 3 games this season</td>`}</tr>`}).join("");
  const S=crew.map(n=>R[n]).filter(Boolean);let say="";
  if(S.length&&lg){const ft=S.reduce((a,r)=>a+r[1],0)/S.length,pt=S.reduce((a,r)=>a+r[3],0)/S.length,ov=S.reduce((a,r)=>a+r[4],0),gr=S.reduce((a,r)=>a+r[5],0);
    say=`This crew's games average <b>${ft.toFixed(1)}</b> free-throw attempts (league ${lg[0]}) and <b>${pt.toFixed(1)}</b> points (league ${lg[2]})${gr?`; their games went over the closing total ${ov} of ${gr} times`:""}. ${ft>=lg[0]+3?"A whistle-heavy crew — helps free-throw-heavy scorers and overs.":ft<=lg[0]-3?"A crew that lets them play — fewer free throws.":"About average."}`}
  return `<div class="card xacard xadeep"><h2>🦓 Referees</h2><div class="xasub">Tonight's crew (official.nba.com) and the games they've worked this season (both teams combined).</div>
   <div class="nbatbl"><table class="bxt xat xaflow"><thead><tr><th>Referee</th><th>G</th><th>FTA</th><th>Fouls</th><th>Pts</th><th>O-U</th></tr></thead><tbody>${rows}</tbody></table></div>
   ${say?`<div class="small" style="margin-top:8px">${say}</div>`:""}<div class="small" style="margin-top:4px">Small samples — a nudge, not a reason on its own.</div></div>`}

/* ---------- 🧤 NHL saves & hits when books haven't posted lines yet ---------- */
function xaNhlNoLine(k){const L=[];
  for(const g of NHL_SLATE.filter(g=>!nhStarted(g)))for(const t of [g.a,g.h]){const opp=g.a===t?g.h:g.a;
    if(k==="hsaves"){const p=typeof nhProbable!=="undefined"?nhProbable(t):null;if(!p)continue;const G=xaGames("nhl",p.nm,"hsaves");if(G.length<3)continue;const PJ=xaSavesProj(p.nm);L.push({nm:p.nm,t,opp,G,ctx:PJ?`projected ${PJ.saves.toFixed(1)} saves on ${PJ.shots.toFixed(1)} shots`:`${opp} average ${(NHL_TEAM[opp]||{}).sf||"–"} shots`})}
    else for(const [n,p] of Object.entries(NHL_P)){if(p.tm!==t)continue;const G=xaGames("nhl",n,k);if(G.length<5)continue;const av=G.reduce((s,x)=>s+x.v,0)/G.length;if(av<(k==="hhit"?2:1))continue;L.push({nm:n,t,opp,G})}}
  const out=L.map(x=>{const v=x.G.map(z=>z.v).sort((a,b)=>a-b),med=v[Math.floor(v.length/2)],ln=Math.max(.5,Math.round(med)-.5),l10=x.G.slice(-10);
    return {...x,ln,av:x.G.reduce((s,z)=>s+z.v,0)/x.G.length,l10:[l10.filter(z=>z.v>ln).length,l10.length]}}).sort((a,b)=>b.av-a.av).slice(0,20);
  return out}
function xaNhlNoLineCard(k){const L=xaNhlNoLine(k),nm=k==="hsaves"?"Saves":"Hits";if(!L.length)return "";
  return `<div class="card xacard xadeep"><h2>${k==="hsaves"?"🧤":"💥"} ${nm} — no book lines yet</h2><div class="xasub">Books usually post ${nm.toLowerCase()} the afternoon of the game. Until then: tonight's ${k==="hsaves"?"probable goalies":"top hitters"}, his usual number (the middle of his games this season) and how often he went over it lately. No odds are shown because none are posted.</div>
   ${L.map(x=>`<a class="nher" href="#nhl-player-${encodeURIComponent(x.nm)}"><span><span>${typeof nhBadge!=="undefined"?nhBadge(x.t):""} <b>${xaEsc(x.nm)}</b> <span class="small">vs ${x.opp}</span></span><span class="small">avg ${x.av.toFixed(1)} · usual line ${x.ln}${x.ctx?" · "+x.ctx:""}</span></span><span class="nhedv"><b>${x.l10[0]}/${x.l10[1]}</b><span class="small">over ${x.ln}, last ${x.l10[1]}</span></span></a>`).join("")}</div>`}

/* ---------- 🥅 NHL: ESPN's listed starting goalie, checked live in the browser ---------- */
function xaGoalieNote(g){const L=typeof liveGet!=="undefined"&&liveGet("nhl",g.a,g.h),eg=(L&&L.pg)||g.eg;if(!eg)return "";const q=g.proj||{};
  const one=(t,i,ours)=>{const e=eg[i];if(!e)return "";const same=ours&&loNorm(ours)===loNorm(e);return `<span class="xachip ${same?"":"warn"}">${t}: ESPN lists <b>${xaEsc(e)}</b>${ours&&!same?` · our numbers used ${xaEsc(ours)}`:""}</span>`};
  return `<div class="xagl">${one(g.a,0,q.ga)}${one(g.h,1,q.gh)}</div>`}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("details.xa"))e.stopPropagation()},true);

/* ---------- 📈 Season-long role trends: minutes / ice time, shot volume, usage — every game + a rolling 5-game line ---------- */
function xaSeries(sp,nm){const S=[];
  try{
    if(sp==="nba"){const p=NBA_LOGS[nm];if(!p)return S;const G=p.g;if(G.length<4)return S;
      S.push({t:"Minutes",u:"min",v:G.map(x=>x[4])},{t:"Shots",u:"shots",v:G.map(x=>x[11]||0)},
        {t:"Plays used (shots + FT trips + turnovers)",u:"plays",v:G.map(x=>Math.round(((x[11]||0)+.44*(x[17]||0)+(x[14]||0))*10)/10)});
      S.forEach(s=>s.d=G.map(x=>x[1]));const U=xaUsage(nm);if(U&&U.length>=4){const m=new Map(U.map(u=>[u.d,u.u]));S.push({t:"Usage % (share of team plays on court)",u:"%",v:G.map(x=>m.has(x[1])?Math.round(m.get(x[1])*10)/10:null),d:G.map(x=>x[1])})}}
    if(sp==="nhl"){const w=nhWho(nm);if(!w)return S;const gk=!!NHL_G[nm];const G=w.g.filter(x=>gk?(x[9]!==1&&x[7]):x[16]!==1);if(G.length<4)return S;
      if(gk)S.push({t:"Shots faced",u:"shots",v:G.map(x=>x[3])},{t:"Saves",u:"saves",v:G.map(x=>x[4])});
      else{S.push({t:"Ice time",u:"minutes",v:G.map(x=>Math.round(x[10]/6)/10)},{t:"Shots on goal",u:"SOG",v:G.map(x=>x[6])});
        if(G.some(x=>x[15]!=null))S.push({t:"Shot attempts",u:"attempts",v:G.map(x=>x[15]==null?null:x[15])});
        const PP=xaPP(nm);if(PP){const m=new Map(PP.map(r=>[r[0],r[1]]));S.push({t:"Power-play time",u:"min",v:G.map(x=>m.has(x[0])?Math.round(m.get(x[0])/6)/10:null)})}}
      S.forEach(s=>s.d=G.map(x=>x[0]))}
    if(sp==="nfl"){const P=PINFO[nm];if(!P)return S;const L=pLogs(nm).filter(l=>l.season===CUR).sort((a,b)=>a.week-b.week);if(L.length<3)return S;const f=k=>L.map(l=>l[k]==null?null:+l[k]);
      if(P.pos==="QB")S.push({t:"Pass attempts",u:"attempts",v:f("passAtt")},{t:"Rush attempts",u:"carries",v:f("rushAtt")});
      else if(P.pos==="RB")S.push({t:"Carries",u:"carries",v:f("rushAtt")},{t:"Catches",u:"receptions",v:f("rec")});
      else S.push({t:"Catches",u:"receptions",v:f("rec")},{t:"Receiving yards",u:"yards",v:f("recYds")});
      S.forEach(s=>s.d=L.map(l=>"Wk "+l.week))}
  }catch(e){}
  return S.filter(s=>s.v.filter(v=>v!=null).length>=3)}
function xaDay(d){const m=/^\d{4}-(\d\d)-(\d\d)$/.exec(d||"");return m?["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m[1]]+" "+(+m[2]):d}
function xaSpark(s){const v=s.v,n=v.length,W=300,H=64,ok=v.filter(x=>x!=null),hi0=Math.max(...ok),lo0=Math.min(...ok),pad=Math.max(1,(hi0-lo0)*.15),hi=hi0+pad,lo=Math.max(0,lo0-pad),X=i=>8+i*((W-16)/Math.max(1,n-1)),Y=x=>H-6-(H-12)*(x-lo)/(hi-lo||1);
  const roll=v.map((_,i)=>{const w=v.slice(Math.max(0,i-4),i+1).filter(x=>x!=null);return w.length?w.reduce((a,b)=>a+b,0)/w.length:null});
  const path=a=>a.map((x,i)=>x==null?"":`${X(i).toFixed(1)},${Y(x).toFixed(1)}`).filter(Boolean).join(" ");
  const avg=ok.reduce((a,b)=>a+b,0)/ok.length,l5=ok.slice(-5),a5=l5.reduce((a,b)=>a+b,0)/l5.length,d=a5-avg,big=Math.abs(d)>=Math.max(1,avg*.12);
  return `<div class="xasp"><div class="xasph"><b>${s.t}</b><span class="small">season ${avg.toFixed(1)} · last 5 <b class="${big?(d>0?"up":"dn"):""}">${a5.toFixed(1)}${big?(d>0?" ▲":" ▼"):""}</b></span></div>
   <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="xasvg" role="img" aria-label="${xaEsc(s.t)} by game">
    <line x1="8" x2="${W-8}" y1="${Y(avg).toFixed(1)}" y2="${Y(avg).toFixed(1)}" class="xaavg"/>
    <polyline points="${path(v)}" class="xaraw"/>${v.map((x,i)=>x==null?"":`<circle cx="${X(i).toFixed(1)}" cy="${Y(x).toFixed(1)}" r="2.3" class="xadot"><title>${xaEsc(s.d[i])}: ${x}</title></circle>`).join("")}
    <polyline points="${path(roll)}" class="xaroll"/></svg>
   <div class="xaspf small"><span>${xaEsc(xaDay(s.d[0]))}</span><span>${lo0}–${hi0} ${xaEsc(s.u.split(" ")[0])}</span><span>${xaEsc(xaDay(s.d[n-1]))}</span></div></div>`}
function xaTrendsCard(sp,nm){const S=xaSeries(sp,nm);if(!S.length)return "";
  const U=sp==="nfl"&&typeof USAGE!=="undefined"&&USAGE[nm],us=U&&U.s&&U.l3?` Snap share ${U.s.snap}% season, ${U.l3.snap}% last 3${U.s.tsh?` · target share ${U.s.tsh}% → ${U.l3.tsh}%`:""}${U.s.csh?` · carry share ${U.s.csh}% → ${U.l3.csh}%`:""}.`:"";
  return `<div class="card xacard xatr xadeep"><h2>📈 Role over the season</h2><div class="xasub">Every game this season (dots), the 5-game rolling average (bold line) and his season average (dashed). ▲▼ = last 5 games well above or below his season.${us}</div>
   <div class="xagrid">${S.map(xaSpark).join("")}</div></div>`}

/* ---------- 📉 defense trending: last 10 (NFL: last 4) vs season ---------- */
function xaDefSeries(sp,t,pos,k){try{
  if(sp==="nba"){const idx=nbaDvpIdx(),G=NBA_RES.filter(r=>r[2]===t||r[3]===t);
    if(pos&&k&&NBA_MK[k])return G.map(r=>{const xs=(idx[r[0]+"|"+t]||{})[pos];return xs?xs.reduce((a,o)=>a+nbaVal(o.x,k),0):null}).filter(v=>v!=null);
    return G.map(r=>r[2]===t?r[5]:r[4])}
  if(sp==="nhl"){const G=(NHL_RES||[]).filter(r=>r[0]>="2026-10-01"&&(r[1]===t||r[3]===t));
    if(k==="hsog"||k==="hblk")return G.map(r=>r[1]===t?r[7]:r[6]).filter(v=>v!=null);
    if(k==="hsaves")return G.map(r=>r[1]===t?r[6]:r[7]).filter(v=>v!=null);
    return G.map(r=>r[1]===t?r[4]:r[2])}
  if(sp==="nfl")return RESULTS.filter(r=>r[1]===t||r[3]===t).sort((a,b)=>a[0]-b[0]).map(r=>r[1]===t?r[4]:r[2])}catch(e){}return []}
function xaDefTrend(sp,t,pos,k){const v=xaDefSeries(sp,t,pos,k),n=sp==="nfl"?4:Math.min(10,Math.floor(v.length/2));if(v.length<(sp==="nfl"?6:8))return null;const av=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const s=av(v),l=av(v.slice(-n));return {s,l,n,d:l-s,big:Math.abs(l-s)>=Math.max(sp==="nhl"?.25:1,s*.08)}}
function xaDefTrendLine(sp,t,pos,k){const r=xaDefTrend(sp,t,pos,k);if(!r)return "";const what=sp==="nhl"?(k==="hsog"||k==="hblk"?"shots on goal allowed":k==="hsaves"?"shots taken":"goals allowed"):sp==="nfl"?"points allowed":(pos&&NBA_MK[k]?`${NBA_MK[k][2]} allowed to ${pos}s`:"points allowed");
  const easier=k==="hsaves"?r.d>0:r.d>0;
  return `<div class="small" style="margin:4px 0">Trend: ${xaEsc(t)} ${what} — last ${r.n} games <b>${r.l.toFixed(1)}</b> vs season ${r.s.toFixed(1)}${r.big?` <b class="${easier?"up":"dn"}">${easier?"▲ getting easier":"▼ getting tougher"}</b>`:" (steady)"}.</div>`}
function xaDefTrendCard(sp,a,h){const rows=[];const lab=sp==="nhl"?"Goals allowed":"Points allowed";
  for(const t of [a,h]){const r=xaDefTrend(sp,t,null,sp==="nhl"?"hgoals":null),s2=sp==="nhl"?xaDefTrend(sp,t,null,"hsog"):null;if(!r)continue;
    const c=x=>x.big?`<b class="${x.d>0?"dn":"up"}">${x.d>0?"▲ worse":"▼ better"}</b>`:`<span class="small">steady</span>`;
    rows.push(`<tr><td><b>${xaEsc(t)}</b></td><td>${r.l.toFixed(1)} <span class="small">vs ${r.s.toFixed(1)}</span></td><td>${c(r)}</td>${s2?`<td>${s2.l.toFixed(1)} <span class="small">vs ${s2.s.toFixed(1)}</span> ${c(s2)}</td>`:""}</tr>`)}
  if(!rows.length)return "";const n=xaDefTrend(sp,a,null,sp==="nhl"?"hgoals":null)?.n||10;
  return `<div class="card xacard xadeep"><h2>📉 Defense trending</h2><div class="xasub">Last ${n} games vs the season — a defense that's slipping (or tightening up) shows here before its season rank catches up.</div>
   <div class="nbatbl"><table class="bxt xat xaflow"><thead><tr><th></th><th>${lab}/game</th><th></th>${sp==="nhl"?"<th>Shots allowed</th>":""}</tr></thead><tbody>${rows.join("")}</tbody></table></div></div>`}

/* ---------- 🚑 team without its key players (who are out tonight) ---------- */
function xaKeyOut(sp,t){const L=[];try{
  if(sp==="nba"){for(const [n,p] of Object.entries(NBA_LOGS)){if(p.tm!==t||p.g.length<3)continue;const i=xaNbaInj(n);if(!i||!/out/i.test(i[2]||""))continue;const a=nbaAvg(p,"pts");if(a>=10||nbaAvg(p,"min")>=26)L.push({n,ids:new Set(p.g.map(x=>x[0])),why:`${a.toFixed(1)} pts`})}}
  if(sp==="nhl"){for(const r of (NHL_INJ[t]||[])){if(!/out|reserve|\bir\b|suspen/i.test(r[2]))continue;const w=nhWho(r[0]);if(!w)continue;const G=w.g.filter(x=>NHL_G[r[0]]?(x[9]!==1&&x[7]):x[16]!==1);if(G.length<3)continue;
    const pts=NHL_G[r[0]]?null:G.reduce((s,x)=>s+x[5],0)/G.length;if(!NHL_G[r[0]]&&pts<.5)continue;L.push({n:r[0],ds:new Set(G.map(x=>x[0])),why:NHL_G[r[0]]?`${G.length} starts`:`${pts.toFixed(2)} pts/game`})}}
  if(sp==="nfl"){for(const [n,x] of Object.entries(typeof INJ_P!=="undefined"?INJ_P:{})){if(x.team!==t||!/out|ir|doubtful/i.test(x.s))continue;const U=(typeof USAGE!=="undefined"&&USAGE[n])||{};const s=U.s||{};
    if(!(x.pos==="QB"||s.tsh>=15||s.csh>=35))continue;const W=new Set(pLogs(n).filter(l=>l.season===CUR).map(l=>l.week));if(W.size<2)continue;L.push({n,ws:W,why:x.pos==="QB"?"starting QB":s.tsh>=15?`${s.tsh}% of targets`:`${s.csh}% of carries`})}}
}catch(e){}return L.slice(0,3)}
function xaTeamSplit(sp,t,k){const G=[];try{
  if(sp==="nba")for(const r of NBA_RES){if(r[2]!==t&&r[3]!==t)continue;const me=r[2]===t?r[4]:r[5],op=r[2]===t?r[5]:r[4];G.push({id:r[0],d:r[1],me,op,in:k.ids?k.ids.has(r[0]):true})}
  if(sp==="nhl")for(const r of (NHL_RES||[])){if(r[0]<"2026-10-01"||(r[1]!==t&&r[3]!==t))continue;const me=r[1]===t?r[2]:r[4],op=r[1]===t?r[4]:r[2];G.push({d:r[0],me,op,in:k.ds.has(r[0])})}
  if(sp==="nfl")for(const r of RESULTS){if(r[1]!==t&&r[3]!==t)continue;const me=r[1]===t?r[2]:r[4],op=r[1]===t?r[4]:r[2];G.push({wk:r[0],me,op,in:k.ws.has(r[0])})}}catch(e){}
  const S=a=>({n:a.length,w:a.filter(x=>x.me>x.op).length,l:a.filter(x=>x.me<x.op).length,me:a.length?a.reduce((s,x)=>s+x.me,0)/a.length:0,op:a.length?a.reduce((s,x)=>s+x.op,0)/a.length:0});
  return {w:S(G.filter(x=>x.in)),wo:S(G.filter(x=>!x.in))}}
function xaKeyOutCard(sp,a,h){const rows=[];
  for(const t of [a,h])for(const k of xaKeyOut(sp,t)){const s=xaTeamSplit(sp,t,k);if(s.wo.n<1||!s.w.n)continue;rows.push(typeof vxMeter!=="undefined"?vxMeter(sp,t,k,s):"")}
  if(!rows.length)return "";
  return `<div class="card xacard xadeep"><h2>🚑 Without their key players</h2><div class="xasub">How each team has done this season with and without its key players who are out tonight.</div>${rows.join("")}</div>`}

/* ---------- 🍀 NHL luck check: close-game record, expected points from goal differential, shooting + save % (PDO) ---------- */
function xaLuck(t){const G=(NHL_RES||[]).filter(r=>r[0]>="2026-10-01"&&(r[1]===t||r[3]===t));if(G.length<6)return null;
  let gf=0,ga=0,sf=0,sa=0,one=[0,0],oth=[0,0],pts=0;
  for(const r of G){const me=r[1]===t?r[2]:r[4],op=r[1]===t?r[4]:r[2],ms=r[1]===t?r[6]:r[7],os=r[1]===t?r[7]:r[6];gf+=me;ga+=op;if(ms!=null&&os!=null){sf+=ms;sa+=os}
    const w=me>op,close=Math.abs(me-op)===1||!!r[5];(close?one:oth)[w?0:1]++;pts+=w?2:r[5]?1:0}
  const n=G.length,exp=Math.pow(gf,2.1)/(Math.pow(gf,2.1)+Math.pow(ga,2.1)),act=pts/(2*n),pdo=sf&&sa?(gf/sf+1-ga/sa)*100:null;
  return {n,one,oth,exp,act,pdo,gd:gf-ga}}
function xaLuckCard(g){const R=[g.a,g.h].map(t=>[t,xaLuck(t)]).filter(x=>x[1]);if(!R.length)return "";
  const say=x=>{const d=x.act-x.exp,l=[];if(d>=.06)l.push("winning more than their goal differential says");if(d<=-.06)l.push("winning less than their goal differential says");
    if(x.pdo!=null&&x.pdo>=101.5)l.push("hot shooting + goaltending (PDO high)");if(x.pdo!=null&&x.pdo<=98.5)l.push("cold shooting + goaltending (PDO low)");
    const c=x.one[0]+x.one[1];if(c>=5&&x.one[0]/c>=.7)l.push("very good in one-goal games");if(c>=5&&x.one[0]/c<=.3)l.push("very bad in one-goal games");
    return l.length?`<b class="${d>0||(x.pdo||100)>101.5?"dn":"up"}">${d>0||(x.pdo||100)>101.5?"Due to cool off":"Due to bounce back"}</b> — ${l.join(" · ")}`:"Results match how they've played"};
  return `<div class="card xacard xadeep"><h2>🍀 Luck check</h2><div class="xasub">One-goal and OT games are close to a coin flip over a season, and very high or low shooting / save % (PDO, normal ≈ 100) usually drifts back. Teams living on those tend to even out.</div>
   <div class="nbatbl"><table class="bxt xat xaflow"><thead><tr><th></th><th>One-goal / OT</th><th>Other games</th><th>Points % (expected)</th><th>PDO</th></tr></thead><tbody>
   ${R.map(([t,x])=>`<tr><td><b>${xaEsc(t)}</b></td><td>${x.one[0]}-${x.one[1]}</td><td>${x.oth[0]}-${x.oth[1]}</td><td>${Math.round(x.act*100)}% <span class="small">(${Math.round(x.exp*100)}%)</span></td><td>${x.pdo!=null?x.pdo.toFixed(1):"–"}</td></tr><tr><td colspan="5" class="small">${say(x)}</td></tr>`).join("")}</tbody></table></div></div>`}

/* ---------- 🥅 goalie vs tonight's opponent + rest ---------- */
function xaGoalieVs(x,g){if(!g)return "";const t=x.tm||(NHL_G[x.nm]||{}).tm,opp=g.a===t?g.h:g.a;const st=x.g.filter(z=>z[7]);const vs=st.filter(z=>z[1]===opp);
  const sv=a=>{const sa=a.reduce((s,z)=>s+z[3],0),v=a.reduce((s,z)=>s+z[4],0);return sa?(v/sa).toFixed(3).slice(1):"–"};
  const cur=st.filter(z=>z[9]!==1),rest=[];for(let i=1;i<cur.length;i++){const d=(Date.parse(cur[i][0])-Date.parse(cur[i-1][0]))/864e5;rest.push({d,z:cur[i]})}
  const r1=rest.filter(o=>o.d>=3).map(o=>o.z),r0=rest.filter(o=>o.d===2).map(o=>o.z);
  const PJ=xaSavesProj(x.nm);
  return `${PJ?`<div class="small" style="margin-top:6px">🧤 Projected tonight: <b>${PJ.saves.toFixed(1)} saves</b> on ${PJ.shots.toFixed(1)} shots.</div>`:""}<div class="small" style="margin-top:6px">vs ${xaEsc(opp)}: <b>${vs.length?sv(vs):"–"}</b> save % in ${vs.length} start${vs.length===1?"":"s"}${vs.some(z=>z[9]===1)?" (incl. last season)":""} · on 2+ days' rest <b>${r1.length?sv(r1):"–"}</b> (${r1.length}) · 1 day's rest <b>${r0.length?sv(r0):"–"}</b> (${r0.length})</div>`}

/* ---------- 🔮 prediction markets (Kalshi / Polymarket via the odds feed) ---------- */
function xaPmProb(p){if(p==null)return null;p=+p;if(p>0&&p<1)return p;if(Math.abs(p)>=100)return p<0?-p/(-p+100):100/(p+100);if(p>1&&p<50)return 1/p;return null}
function xaPmFor(sp,a,h){const D=typeof LO!=="undefined"&&LO.data&&LO.data[sp];if(!D||!D.events)return null;
  const nick=t=>sp==="nba"?(NBA_TEAMS[t]||t).split(" ").pop():sp==="nhl"?((NHL_TEAM[t]||{}).cn||t):((typeof TEAMS!=="undefined"&&TEAMS[t]&&TEAMS[t][0])||t).split(" ").pop();
  const na=String(nick(a)).toLowerCase(),nh=String(nick(h)).toLowerCase();
  const ev=D.events.find(e=>e.pm&&String(e.away).toLowerCase().includes(na)&&String(e.home).toLowerCase().includes(nh));if(!ev)return null;
  const out=[];for(const [b,[pa,ph]] of Object.entries(ev.pm)){const A=xaPmProb(pa),H=xaPmProb(ph);if(A==null||H==null)continue;const s=A+H;out.push({b:b==="kalshi"?"Kalshi":"Polymarket",a:A/s,h:H/s})}
  return out.length?out:null}
function xaPmLine(sp,a,h,bookA,bookH){const P=xaPmFor(sp,a,h);if(!P)return "";
  return `<div class="xapm small">🔮 Prediction markets: ${P.map(p=>`${p.b} <b>${xaEsc(a)} ${Math.round(p.a*100)}%</b> / <b>${xaEsc(h)} ${Math.round(p.h*100)}%</b>`).join(" · ")}${bookA!=null?` <span class="small">(sportsbooks ${Math.round(bookA*100)}% / ${Math.round(bookH*100)}%)</span>`:""}</div>`}

/* ---------- ⚡ NHL power-play time (NHL_PP from ESPN box scores, in nhl_data.js) ---------- */
function xaPP(nm){if(typeof NHL_PP==="undefined"||!NHL_PP)return null;if(NHL_PP[nm])return NHL_PP[nm];const k=loNorm(nm);for(const n in NHL_PP)if(loNorm(n)===k)return NHL_PP[n];return null}
function xaPPRank(nm){const w=nhWho(nm);if(!w||typeof NHL_PP==="undefined")return null;const L=[];
  for(const [n,p] of Object.entries(NHL_P)){if(p.tm!==w.tm)continue;const r=xaPP(n);if(!r)continue;const l3=r.slice(-3);L.push([n,l3.reduce((s,x)=>s+x[1],0)/l3.length])}
  L.sort((a,b)=>b[1]-a[1]);const i=L.findIndex(x=>x[0]===nm);return i<0?null:i+1}
function xaPPSay(nm){const r=xaPP(nm);if(!r||r.length<3)return "";const av=a=>a.reduce((s,x)=>s+x[1],0)/a.length/60,l5=r.slice(-5),rk=xaPPRank(nm);
  const unit=rk==null?"":rk<=5?" — <b>on the top power-play unit</b>":rk<=10?" — on the second unit":" — little power-play time";
  return `Power-play time last ${l5.length}: <b>${av(l5).toFixed(1)} min/game</b> (last ${r.length}: ${av(r).toFixed(1)})${rk?` · ${xaOrd(rk)} on his team over the last 3 games`:""}${unit}.`}

/* ---------- 🏒 NHL extras: expected goals, shooting %, PP vs even-strength points, faceoff matchups, projected saves, game flow ---------- */
function xaXG(nm){const w=NHL_P[nm];if(!w||!w.sz||typeof NHL_LZ==="undefined"||!NHL_LZ.length)return null;
  let att=0,xg=0,g=0,sog=0;w.sz.forEach((z,i)=>{const L=NHL_LZ[i];const r=L&&L[0]?L[2]/L[0]:0;att+=z[0];xg+=z[0]*r;g+=z[2];sog+=z[1]});return att>=10?{att,xg,g,sog}:null}
function xaShPct(nm){const w=NHL_P[nm];if(!w)return null;const cur=w.g.filter(x=>x[16]!==1),prev=w.g.filter(x=>x[16]===1);
  const f=a=>{const s=a.reduce((t,x)=>t+(x[6]||0),0),g=a.reduce((t,x)=>t+(x[3]||0),0);return s?{g,s,p:g/s*100}:null};return {cur:f(cur),prev:f(prev)}}
function xaFinishSay(nm){const X=xaXG(nm),S=xaShPct(nm);if(!X&&!S)return "";const out=[];
  if(X){const d=X.g-X.xg;out.push(`From where he shoots, an average NHL shooter would have about <b>${X.xg.toFixed(1)}</b> goals on his ${X.att} unblocked attempts — he has <b>${X.g}</b>${Math.abs(d)>=2?` (${d>0?"running hot — likely to cool off":"running cold — goals likely to come"})`:" (about what you'd expect)"}.`)}
  if(S&&S.cur&&S.cur.s>=15){out.push(`Shooting ${S.cur.p.toFixed(1)}% this season${S.prev&&S.prev.s>=20?` vs ${S.prev.p.toFixed(1)}% in his last-season games`:""} (league average ≈ ${NHL_LZ&&NHL_LZ.length?(NHL_LZ.reduce((a,z)=>a+z[2],0)/Math.max(1,NHL_LZ.reduce((a,z)=>a+z[1],0))*100).toFixed(1):"10"}%).`)}
  return out.join(" ")}
function xaPPSplitSay(nm){const w=NHL_P[nm];if(!w||!w.ppp||!w.s)return "";const [pg,pa,sh,n]=w.ppp,pts=w.s[3],pp=pg+pa;if(!pts)return "";
  const g=nhGameOf(w.tm),opp=g?(g.a===w.tm?g.h:g.a):null,O=opp&&NHL_TEAM[opp];
  return `<b>${pp}</b> of his ${pts} points on the power play (${Math.round(pp/pts*100)}%)${sh?`, ${sh} short-handed`:""}, ${pts-pp-sh} at even strength.${O&&O.pen?` Tonight ${xaEsc(opp)} take <b>${O.pen[0].toFixed(1)}</b> penalties a game${O.pkR?` and rank ${xaOrd(O.pkR)} on the penalty kill`:""}${pp/pts>=.4&&O.pen[0]<=2.8?" — fewer power plays likely, a knock on his points":pp/pts>=.4&&O.pen[0]>=3.6?" — lots of power plays likely, good for his points":""}.`:""}`}
function xaFOSay(nm){const w=NHL_P[nm];if(!w||!w.s||!(w.s[9]+w.s[10]))return "";const g=nhGameOf(w.tm),opp=g?(g.a===w.tm?g.h:g.a):null;if(!opp)return "";
  const M=(typeof NHL_FOM!=="undefined"&&NHL_FOM[nm])||{};
  const cs=Object.entries(NHL_P).filter(([n,p])=>p.tm===opp&&p.s&&p.s[0]&&(p.s[9]+p.s[10])/p.s[0]>=5).sort((a,b)=>(b[1].s[9]+b[1].s[10])-(a[1].s[9]+a[1].s[10])).slice(0,4);
  if(!cs.length)return "";const pct=(w_,l_)=>w_+l_?Math.round(w_/(w_+l_)*100)+"%":"–";
  return `His faceoffs: ${pct(w.s[9],w.s[10])} won, ${((w.s[9]+w.s[10])/w.s[0]).toFixed(1)} a game. ${xaEsc(opp)} centres: ${cs.map(([n,p])=>{const r=M[n];return `${xaEsc(n)} ${pct(p.s[9],p.s[10])}${r?` (he's <b>${r[0]}-${r[1]}</b> vs him)`:""}`}).join(" · ")}.`}
function xaSavesProj(nm){const G=NHL_G[nm];if(!G)return null;const g=nhGameOf(G.tm);if(!g)return null;const opp=g.a===G.tm?g.h:g.a,O=NHL_TEAM[opp],T=NHL_TEAM[G.tm];if(!O||!T||!O.sf||!T.sa)return null;
  const lg=Object.values(NHL_TEAM).reduce((a,t)=>a+(t.sf||0),0)/Math.max(1,Object.values(NHL_TEAM).filter(t=>t.sf).length);
  const shots=O.sf*T.sa/lg,sv=G.svp!=null&&G.gs>=3?(G.svp/100*Math.min(1,G.gs/20)+.9*(1-Math.min(1,G.gs/20))):.9;
  return {shots,saves:shots*sv,sv,opp,osf:O.sf,tsa:T.sa,lg}}
function xaSavesSay(nm,line){const P=xaSavesProj(nm);if(!P)return "";
  return `Projected about <b>${P.shots.toFixed(1)} shots</b> faced (${xaEsc(P.opp)} average ${P.osf} shots, his team allows ${P.tsa}, league ${P.lg.toFixed(1)}) × ${(P.sv*100).toFixed(1)}% save rate ≈ <b>${P.saves.toFixed(1)} saves</b>${line!=null?` vs the line of ${line} (${P.saves>line+1?"leans over":P.saves<line-1?"leans under":"close to the line"})`:""}. Blowouts and empty nets move this a lot.`}
function xaFlowCard(g){const R=[g.a,g.h].map(t=>[t,NHL_TEAM[t]]).filter(x=>x[1]);if(!R.length)return "";const rc=a=>a?`${a[0]}-${a[1]}-${a[2]}`:"–",f=v=>v==null?"–":(+v).toFixed(2);
  const A=NHL_TEAM[g.a],H=NHL_TEAM[g.h];const ppA=A&&H&&A.pen&&H.pen?(A.pen[1]+H.pen[0])/2:null,ppH=A&&H&&A.pen&&H.pen?(H.pen[1]+A.pen[0])/2:null;
  return `<div class="card xacard xadeep"><h2>🧮 Game flow</h2><div class="xasub">Penalties, empty-net goals and how each team plays the 3rd period this season.</div>
   <div class="nbatbl"><table class="bxt xat xaflow"><thead><tr><th>per game</th>${R.map(([t])=>`<th>${xaEsc(t)}</th>`).join("")}</tr></thead><tbody>
   <tr><td>Penalties taken / drawn</td>${R.map(([,T])=>`<td>${T.pen?`${T.pen[0].toFixed(1)} / ${T.pen[1].toFixed(1)}`:"–"}</td>`).join("")}</tr>
   <tr><td>PP% / PK%</td>${R.map(([,T])=>`<td>${T.pp!=null?T.pp+"%":"–"} / ${T.pk!=null?T.pk+"%":"–"}</td>`).join("")}</tr>
   <tr><td>Empty-net goals for / ag.</td>${R.map(([,T])=>`<td>${T.eng?`${f(T.eng[0])} / ${f(T.eng[1])}`:"–"}</td>`).join("")}</tr>
   <tr><td>Games with an empty-netter</td>${R.map(([,T])=>`<td>${T.eng?T.eng[4]+"%":"–"}</td>`).join("")}</tr>
   <tr><td>3rd-period goals for / ag.</td>${R.map(([,T])=>`<td>${T.per?`${f(T.per[2][0])} / ${f(T.per[2][1])}`:"–"}</td>`).join("")}</tr>
   <tr><td>Up after 2 periods (W-L-OTL)</td>${R.map(([,T])=>`<td>${rc(T.a2&&T.a2.lead)}</td>`).join("")}</tr>
   <tr><td>Tied after 2</td>${R.map(([,T])=>`<td>${rc(T.a2&&T.a2.tied)}</td>`).join("")}</tr>
   <tr><td>Down after 2</td>${R.map(([,T])=>`<td>${rc(T.a2&&T.a2.trail)}</td>`).join("")}</tr>
   </tbody></table></div>${ppA!=null?`<div class="small" style="margin-top:8px">Expected power plays tonight: <b>${xaEsc(g.a)} ${ppA.toFixed(1)}</b> · <b>${xaEsc(g.h)} ${ppH.toFixed(1)}</b> (each side's penalties drawn blended with the other's penalties taken). More whistles = more power-play points and usually more goals.</div>`:""}</div>`}

function xaOrd(n){const v=n%100;return n+(v>=11&&v<=13?"th":["th","st","nd","rd"][n%10]||"th")}

/* ================= NBA extras ================= */
/* quick situation chips on each prop card (same Venue / Role / Rest filters as the 🎚 Filters panel, one tap) */
function xaSitChips(nm,k,line){const p=NBA_LOGS[nm];if(!p||!NBA_MK[k]||line==null)return "";const over=typeof PXSIDE==="undefined"||PXSIDE!=="u";
  const G=p.g,hit=a=>a.filter(x=>{const v=nbaVal(x,k);return v!==line&&(over?v>line:v<line)}).length,f=NB.gf||{};
  const groups=[["ven","H","Home",x=>x[3]==="H"],["ven","A","Away",x=>x[3]==="A"],["role","st","Starting",x=>x[9]===1||x[9]===true],["role","bn","Bench",x=>!(x[9]===1||x[9]===true)],
    ["rest","b2b","Back-to-back",x=>typeof nbaRestOf!=="undefined"&&nbaRestOf(x)===0],["rest","rest","Rested",x=>typeof nbaRestOf!=="undefined"&&nbaRestOf(x)>=1]];
  const B=groups.map(([g,v,l,fn])=>{const a=G.filter(fn);if(!a.length)return "";return `<button class="xsit${(f[g]||"")===v?" on":""}" data-xsit="${g}|${v}">${l} <b>${hit(a)}/${a.length}</b></button>`}).join("");
  return B?`<div class="xsitw xadeep"><span class="small">${over?"Over":"Under"} ${line} by situation · tap to filter:</span><div class="xsitr">${B}</div></div>`:""}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-xsit]");if(!b||typeof NB==="undefined")return;e.preventDefault();e.stopPropagation();
  const [g,v]=b.dataset.xsit.split("|");NB.gf[g]=(NB.gf[g]||"")===v?"":v;try{LS.set("nbaGF",NB.gf)}catch(x){}const y=scrollY;if(typeof route!=="undefined")route();scrollTo(0,y)},true);

/* pace: possessions per game (NBA_GPACE) — fast / middle / slow thirds of the league */
function xaPaceCuts(){if(XA.pc)return XA.pc;const v=Object.values(typeof NBA_GPACE!=="undefined"?NBA_GPACE:{}).sort((a,b)=>a-b);if(v.length<30)return null;return XA.pc=[v[Math.floor(v.length/3)],v[Math.floor(v.length*2/3)]]}
function xaPaceBody(nm,k,line,over){const p=NBA_LOGS[nm],C=xaPaceCuts();if(!p||!C)return "";const T=(x)=>{const pc=NBA_GPACE[x[0]];return pc==null?null:pc<C[0]?"slow":pc>=C[1]?"fast":"avg"};
  const by={fast:[],avg:[],slow:[]};for(const x of p.g){const t=T(x);if(t)by[t].push({v:nbaVal(x,k)})}if(by.fast.length+by.slow.length<3)return "";
  const g=nbaGameOf(p.tm),A=g&&NBA_TADV[g.a],H=g&&NBA_TADV[g.h],tp=A&&H?(A.pace+H.pace)/2:null,tt=tp==null?null:tp<C[0]?"slow":tp>=C[1]?"fast":"avg";
  const cell=(a,l,me)=>{const s=xaGrp(a,line,over);return s.n?`<tr${me?' class="xame"':""}><td>${l}</td><td><b>${s.h}/${s.n}</b></td><td>${s.av.toFixed(1)}</td></tr>`:""};
  return `<h4>🏃 Fast vs slow games</h4><div class="small">${tp?`Tonight's expected pace ≈ <b>${tp.toFixed(1)}</b> possessions (${tt==="fast"?"a fast game":tt==="slow"?"a slow game":"about average"}).`:""} Fast = ${C[1]}+ possessions, slow = under ${C[0]}.</div>
   <table class="bxt xat"><thead><tr><th>Game pace</th><th>${over?"Over":"Under"} ${line}</th><th>Avg</th></tr></thead><tbody>${cell(by.fast,"Fast",tt==="fast")}${cell(by.avg,"Middle",tt==="avg")}${cell(by.slow,"Slow",tt==="slow")}</tbody></table>`}
/* 3-point shooting: last 10 vs season vs last season */
function xa3P(nm){const p=NBA_LOGS[nm];if(!p)return null;const f=a=>{const m=a.reduce((s,x)=>s+(x[8]||0),0),t=a.reduce((s,x)=>s+(x[15]||0),0);return t?{m,t,p:m/t*100}:null};
  const pv=(typeof NBA_PREV!=="undefined"&&NBA_PREV[nm])||[];return {l10:f(p.g.slice(-10)),s:f(p.g),prev:f(pv)}}
function xa3PSay(nm){const r=xa3P(nm);if(!r||!r.l10||r.l10.t<15)return "";const base=r.prev&&r.prev.t>=100?r.prev:r.s;if(!base)return "";const d=r.l10.p-base.p;
  return `3-pointers: <b>${r.l10.p.toFixed(1)}%</b> over the last 10 games (${r.l10.m}/${r.l10.t}) vs ${r.s?r.s.p.toFixed(1)+"% this season":""}${r.prev&&r.prev.t>=100?` and ${r.prev.p.toFixed(1)}% last season`:""}${Math.abs(d)>=7?` — <b>${d>0?"running hot, likely to cool off":"running cold, likely to bounce back"}</b>`:""}. ${r.l10.t/Math.min(10,NBA_LOGS[nm].g.length)>=1?`${(r.l10.t/Math.min(10,NBA_LOGS[nm].g.length)).toFixed(1)} attempts a game lately.`:""}`}
function xa3PChip(nm,k){if(!["pts","3pm","pa","pr","pra"].includes(k))return "";const r=xa3P(nm);if(!r||!r.l10||r.l10.t<20)return "";const base=r.prev&&r.prev.t>=100?r.prev:r.s;if(!base)return "";const d=r.l10.p-base.p;
  return Math.abs(d)>=8?`<span class="xachip ${d>0?"warn":""}" title="3P% last 10 ${r.l10.p.toFixed(1)}% vs ${base.p.toFixed(1)}%">🎯 3s ${d>0?"hot":"cold"}</span>`:""}
/* fouls */
function xaFoulSay(nm){const p=NBA_LOGS[nm];if(!p)return "";const G=p.g.filter(x=>x[18]!=null&&x[4]>0);if(G.length<4)return "";
  const pf=G.reduce((s,x)=>s+x[18],0),mn=G.reduce((s,x)=>s+x[4],0),f5=G.filter(x=>x[18]>=5),oth=G.filter(x=>x[18]<5),am=a=>a.length?a.reduce((s,x)=>s+x[4],0)/a.length:0;
  const g=nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):null,O=opp&&NBA_TADV[opp];
  return `${(pf/mn*36).toFixed(1)} fouls per 36 minutes; 5+ fouls in <b>${f5.length} of ${G.length}</b> games${f5.length?` (he played ${am(f5).toFixed(0)} min in those vs ${am(oth).toFixed(0)} otherwise)`:""}.${O?` ${xaEsc(opp)} draw ${O.o.fta} free-throw attempts a game (${xaOrd(O.oR.fta)} of 30)${O.oR.fta<=8&&pf/mn*36>=4.5?" — foul-trouble risk tonight":""}.`:""}`}
/* 1st quarter (NBA_Q1, in nba_detail.js) */
function xaQ1Body(nm,k){if(typeof NBA_Q1==="undefined"||!NBA_Q1[nm]||!["pts","reb","ast"].includes(k))return "";const R=NBA_Q1[nm],i={pts:1,reb:2,ast:3}[k];if(R.length<4)return "";
  const v=R.map(r=>r[i]),av=a=>a.reduce((s,x)=>s+x,0)/a.length,ln=Math.max(.5,Math.round(av(v))-.5),l5=v.slice(-5),h=a=>a.filter(x=>x>ln).length;
  return `<h4>1️⃣ 1st quarter</h4><div class="small">1st-quarter ${NBA_MK[k][1].toLowerCase()}: <b>${av(v).toFixed(1)}</b> a game (last 5: ${av(l5).toFixed(1)} — ${l5.join(", ")}). Over ${ln}: <b>${h(v)}/${v.length}</b> games. For 1st-quarter props when books post them.</div>`}

/* yes-only markets from the odds feed: double-double (dd), triple-double (td), first basket (fb) */
function xaYesRows(mk){const D=typeof LO!=="undefined"&&LO.data&&LO.data.nba;if(!D||!D.props)return [];const today=new Set((D.events||[]).filter(e=>e.date===NBA_SLATE_DATE).map(e=>String(e.id)));
  return D.props.filter(r=>r[1]===mk&&(!today.size||today.has(String(r[13])))).map(r=>{const nm=(typeof loIdx!=="undefined"&&loIdx().nba[loNorm(r[0])])||r[0];return {nm,odds:r[3],book:r[5],best:r[6]!=null?r[6]:r[3],bestBook:r[7]||r[5]}}).filter(x=>NBA_LOGS[x.nm])}
function xaDD(x,n){const c=[x[5],x[6],x[7],x[12],x[13]].filter(v=>v>=10).length;return c>=n}
function xaImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
function xaYesCard(g){const rows=[];
  for(const [mk,lab,n] of [["dd","Double-double",2],["td","Triple-double",3]])for(const r of xaYesRows(mk)){const p=NBA_LOGS[r.nm];if(g&&p.tm!==g.a&&p.tm!==g.h)continue;const G=p.g,l10=G.slice(-10);
    const s=G.filter(x=>xaDD(x,n)).length,t=l10.filter(x=>xaDD(x,n)).length,ch=(s/G.length*.5+t/l10.length*.5),need=xaImp(r.best);rows.push({lab,r,p,s,n:G.length,t,tn:l10.length,ch,need,edge:need!=null?ch-need:null})}
  const fb=xaFirstBasketRows(g);if(!rows.length&&!fb)return "";rows.sort((a,b)=>(b.edge??-1)-(a.edge??-1));
  return `<div class="card xacard xadeep"><h2>🎯 Double-doubles${fb?" & first basket":""}</h2>
   ${rows.length?`<div class="small" style="margin-bottom:8px">Every double-double / triple-double price posted${g?" for this game":" tonight"}: how often he got one this season and over his last 10, vs what the odds need.</div>
   ${rows.slice(0,g?12:20).map(x=>`<a class="nher" href="#nba-player-${encodeURIComponent(x.r.nm)}"><span><span>${nbaBadge(x.p.tm)} <b>${xaEsc(x.r.nm)}</b> <span class="small">${x.lab}</span></span><span class="small">${x.s}/${x.n} this season · ${x.t}/${x.tn} last 10 · ${xaEsc(x.r.bestBook||"")}</span></span><span class="nhedv"><b class="${x.edge>0.03?"up":x.edge<-0.03?"dn":""}">${oddsFmt(x.r.best)}</b><span class="small">${Math.round(x.ch*100)}% vs ${x.need!=null?Math.round(x.need*100)+"% needed":"–"}</span></span></a>`).join("")}`:""}
   ${fb||""}</div>`}
/* first basket: opening possession + who scores first (NBA_FB from play-by-play) */
function xaFBTeam(t){const F=Object.entries(typeof NBA_FB!=="undefined"?NBA_FB:{});let n=0,tip=0,first=0;const by={};
  for(const [gid,[nm,tm,tp]] of F){const r=NBA_RES.find(z=>String(z[0])===gid);if(!r||(r[2]!==t&&r[3]!==t))continue;n++;if(tp===t)tip++;if(tm===t){first++;if(nm)by[nm]=(by[nm]||0)+1}}
  return n?{n,tip,first,by}:null}
function xaFirstBasketRows(g){if(!g||typeof NBA_FB==="undefined")return "";const odds={};for(const r of xaYesRows("fb"))odds[r.nm]=r;
  const T=[g.a,g.h].map(t=>[t,xaFBTeam(t)]).filter(x=>x[1]);if(!T.length)return "";
  return `<h3 class="nhh3" style="margin-top:12px">🏀 First basket</h3><div class="small" style="margin-bottom:6px">Opening possession and first made basket in every game this season (play-by-play). Chance ≈ his team scores first × his share of his team's first baskets.</div>
   ${T.map(([t,x])=>{const tf=x.first/x.n,L=Object.entries(x.by).sort((a,b)=>b[1]-a[1]).slice(0,5);
     return `<div style="margin-bottom:8px"><b>${xaEsc(t)}</b> <span class="small">won the opening possession ${x.tip}/${x.n} · scored first ${x.first}/${x.n}</span>
      ${L.map(([nm,c])=>{const ch=tf*c/Math.max(1,x.first),o=odds[nm],need=o?xaImp(o.best):null;return `<div class="xafb"><span>${xaEsc(nm)} <span class="small">${c} first baskets</span></span><span><b>${Math.round(ch*100)}%</b>${o?` <span class="small">· ${oddsFmt(o.best)} needs ${Math.round(need*100)}%</span>`:""}</span></div>`}).join("")}</div>`}).join("")}`}
/* bench & rotation */
function xaRot(t){const by={};for(const [nm,p] of Object.entries(NBA_LOGS))if(p.tm===t)for(const x of p.g){const o=by[x[0]]||(by[x[0]]={st:0,bn:0,rot:0,d:x[1]});if(x[9]===1||x[9]===true)o.st+=x[5];else o.bn+=x[5];if(x[4]>=10)o.rot++}
  const G=Object.values(by).filter(o=>o.st+o.bn>60).sort((a,b)=>a.d<b.d?-1:1);if(G.length<3)return null;const av=(a,k)=>a.reduce((s,o)=>s+o[k],0)/a.length;
  return {n:G.length,st:av(G,"st"),bn:av(G,"bn"),rot:av(G,"rot"),bn5:av(G.slice(-5),"bn")}}
function xaBenchCard(g){const R=[g.a,g.h].map(t=>[t,xaRot(t)]).filter(x=>x[1]);if(R.length<2)return "";
  const all=Object.keys(NBA_TEAMS).map(t=>[t,xaRot(t)]).filter(x=>x[1]).sort((a,b)=>b[1].bn-a[1].bn),rk=t=>all.findIndex(x=>x[0]===t)+1;
  return `<div class="card xacard xadeep"><h2>🪑 Bench & rotation</h2><div class="xasub">Points from starters vs the bench, and how many players get 10+ minutes. Deep benches hold up better on back-to-backs and in blowouts.</div>
   <div class="nbatbl"><table class="bxt xat xaflow"><thead><tr><th>per game</th>${R.map(([t])=>`<th>${xaEsc(t)}</th>`).join("")}</tr></thead><tbody>
   <tr><td>Starters' points</td>${R.map(([,x])=>`<td>${x.st.toFixed(1)}</td>`).join("")}</tr>
   <tr><td>Bench points</td>${R.map(([t,x])=>`<td><b>${x.bn.toFixed(1)}</b><div class="small">${xaOrd(rk(t))} of ${all.length}</div></td>`).join("")}</tr>
   <tr><td>Bench, last 5 games</td>${R.map(([,x])=>`<td>${x.bn5.toFixed(1)}</td>`).join("")}</tr>
   <tr><td>Players with 10+ min</td>${R.map(([,x])=>`<td>${x.rot.toFixed(1)}</td>`).join("")}</tr></tbody></table></div></div>`}

/* ================= NFL extras (nfl_x2.js from nflverse) ================= */
function xaNflGame(nm){const P=PINFO[nm];if(!P||typeof oppOf==="undefined")return null;const o=oppOf(P.team);if(!o)return null;const L=LINES[o.g.id];
  const imp=L&&L.sp!=null&&L.tot!=null?(o.home?L.tot/2-L.sp/2:L.tot/2+L.sp/2):null,sp=L&&L.sp!=null?(o.home?L.sp:-L.sp):null;return {P,o,L,imp,sp}}
/* 🎯 anytime TD estimate: his share of the team's red-zone + goal-line touches and TDs × tonight's expected team TDs */
function xaTdEst(nm){if(typeof NFL_RZ==="undefined")return null;const X=xaNflGame(nm),R=NFL_RZ[nm];if(!X||!R||X.imp==null)return null;const T=NFL_RZT[X.P.team];if(!T||!T[0]||!T[4])return null;
  const touch=(R[0]+R[1])/Math.max(1,T[0]+T[1]),td=T[2]?R[2]/T[2]:0,share=.6*touch+.4*td,expTD=X.imp*(T[2]/T[4]),lam=expTD*share;
  return {p:1-Math.exp(-lam),share,expTD,imp:X.imp,R,T}}
function xaTdSay(nm){const e=xaTdEst(nm);if(!e)return "";const R=e.R;
  return `Inside the 20 he has <b>${R[0]}</b> touches (${R[1]} inside the 5) and ${R[2]} TDs — about <b>${Math.round(e.share*100)}%</b> of his team's red-zone work. Tonight's implied points ${e.imp.toFixed(1)} ≈ ${e.expTD.toFixed(1)} offensive TDs → <b>${Math.round(e.p*100)}%</b> chance he scores.`}
/* 📈 QB pass volume from tonight's spread */
function xaQBSlope(){if(XA.qbs!=null)return XA.qbs;const pts=[];for(const r of Object.values(typeof NFL_QBV!=="undefined"?NFL_QBV:{}))for(const x of r)pts.push([x[2],x[1]]);if(pts.length<20)return XA.qbs=0;
  const mx=pts.reduce((s,p)=>s+p[0],0)/pts.length,my=pts.reduce((s,p)=>s+p[1],0)/pts.length,c=pts.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0),v=pts.reduce((s,p)=>s+(p[0]-mx)**2,0);return XA.qbs=v?c/v:0}
function xaQBVol(nm){const R=typeof NFL_QBV!=="undefined"&&NFL_QBV[nm];const X=xaNflGame(nm);if(!R||R.length<3||!X||X.sp==null)return null;
  const avA=R.reduce((s,x)=>s+x[1],0)/R.length,avS=R.reduce((s,x)=>s+x[2],0)/R.length,b=xaQBSlope(),exp=avA+b*(X.sp-avS);return {exp,avA,b,sp:X.sp}}
function xaQBVolSay(nm){const v=xaQBVol(nm);if(!v)return "";
  const weak=Math.abs(v.b)<.1;
  return `Expected pass attempts tonight ≈ <b>${v.exp.toFixed(1)}</b> (his average ${v.avA.toFixed(1)}; ${v.sp>0?`underdog by ${v.sp}`:v.sp<0?`favoured by ${-v.sp}`:"pick'em"}). ${weak?"So far this season the pre-game spread has barely changed how much QBs throw — his own average is the better guide.":`This season each point of spread has moved QB attempts by about ${Math.abs(v.b).toFixed(2)} (${v.b>0?"underdogs throw more":"favourites throw more"}).`}`}
/* ↔️ middle vs outside targets + what tonight's defense allows */
function xaLocSay(nm){if(typeof NFL_LOC==="undefined")return "";const L=NFL_LOC[nm],X=xaNflGame(nm);if(!L||!X)return "";const pos=X.P.pos;const D=(NFL_DLOC[X.o.opp]||{})[pos];
  const t=L.m[0]+L.o[0],ypt=a=>a[0]?a[1]/a[0]:0;
  const lg={m:[0,0],o:[0,0]};for(const v of Object.values(NFL_DLOC))if(v[pos])for(const s of ["m","o"]){lg[s][0]+=v[pos][s][0];lg[s][1]+=v[pos][s][1]}
  return `${Math.round(L.m[0]/t*100)}% of his targets are over the middle (${ypt(L.m).toFixed(1)} yds/target) and ${Math.round(L.o[0]/t*100)}% outside (${ypt(L.o).toFixed(1)}).${D?` ${xaEsc(X.o.opp)} allow ${pos}s <b>${ypt(D.m).toFixed(1)}</b> yds/target over the middle (league ${ypt(lg.m).toFixed(1)}) and <b>${ypt(D.o).toFixed(1)}</b> outside (league ${ypt(lg.o).toFixed(1)}).`:""}`}
/* 🏃 QB designed runs vs scrambles */
function xaQBRunSay(nm){const R=typeof NFL_QBRUN!=="undefined"&&NFL_QBRUN[nm];if(!R||R.length<2)return "";const n=R.length,s=(i)=>R.reduce((a,x)=>a+x[i],0),l3=R.slice(-3),s3=i=>l3.reduce((a,x)=>a+x[i],0);
  const d=s(1)/n,sc=s(3)/n;return `Designed runs <b>${d.toFixed(1)}</b> a game (${(s(2)/n).toFixed(0)} yds) and scrambles <b>${sc.toFixed(1)}</b> (${(s(4)/n).toFixed(0)} yds); last ${l3.length}: ${(s3(1)/l3.length).toFixed(1)} designed, ${(s3(3)/l3.length).toFixed(1)} scrambles. ${d>=sc?"Mostly called runs — steadier week to week.":"Mostly scrambles — they swing with the pass rush and coverage."}`}
/* 🧠 pass rate over expected */
function xaProeRank(t){const L=Object.entries(typeof NFL_PROE!=="undefined"?NFL_PROE:{}).filter(x=>x[1][0]!=null).sort((a,b)=>b[1][0]-a[1][0]);return L.findIndex(x=>x[0]===t)+1}
function xaProeCard(g){if(typeof NFL_PROE==="undefined")return "";const R=[g.away,g.home].map(t=>[t,NFL_PROE[t]]).filter(x=>x[1]);if(R.length<2)return "";
  const w=v=>v>=3?"pass-heavy":v<=-3?"run-heavy":"balanced";
  return `<div class="card xacard xadeep"><h2>🧠 Pass-heavy or run-heavy?</h2><div class="xasub">How much more (or less) each team throws than an average team would in the same down, distance and score (competitive situations only).</div>
   <div class="nbatbl"><table class="bxt xat xaflow"><thead><tr><th></th>${R.map(([t])=>`<th>${xaEsc(t)}</th>`).join("")}</tr></thead><tbody>
   <tr><td>Pass rate over expected</td>${R.map(([t,x])=>`<td><b>${x[0]>0?"+":""}${x[0]}%</b><div class="small">${xaOrd(xaProeRank(t))} · ${w(x[0])}</div></td>`).join("")}</tr>
   <tr><td>Pass rate</td>${R.map(([,x])=>`<td>${x[1]}%</td>`).join("")}</tr><tr><td>Plays per game</td>${R.map(([,x])=>`<td>${x[2]}</td>`).join("")}</tr></tbody></table></div>
   <div class="small" style="margin-top:6px">Pass-heavy teams lift QB and receiver volume; run-heavy teams lift RB carries and usually mean fewer plays and points.</div></div>`}
/* 🤝 division games */
function xaDivCard(g){if(typeof NFL_DIVX==="undefined"||!NFL_DIVX||typeof NFL_DIVG==="undefined")return "";const wk=g.wk||(typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:null);
  if(!NFL_DIVG.some(k=>k.endsWith("|"+g.away+"|"+g.home)))return "";const L=NFL_DIVX.lg,N=NFL_DIVX.non,pc=(a,b)=>b?Math.round(a/b*100)+"%":"–",T=NFL_DIVX.tm;
  return `<div class="card xacard xadeep"><h2>🤝 Division game</h2><div class="xasub">Teams that play twice a year know each other well — scoring tends to dip and underdogs keep it closer.</div>
   <div class="small">Since ${NFL_DIVX.since}: division games went <b>under ${pc(L[1],L[1]+L[2])}</b> of the time (other games ${pc(N[1],N[1]+N[2])}); underdogs covered <b>${pc(L[3],L[3]+L[4])}</b> (other games ${pc(N[3],N[3]+N[4])}) — ${L[0]} games.</div>
   <div class="nbatbl" style="margin-top:8px"><table class="bxt xat xaflow"><thead><tr><th>In division games, last 3+ seasons</th><th>${xaEsc(g.away)}</th><th>${xaEsc(g.home)}</th></tr></thead><tbody>
   ${[["Won-lost",0,1],["Against the spread",2,3],["Over-under",4,5]].map(([l,i,j])=>`<tr><td>${l}</td>${[g.away,g.home].map(t=>{const x=T[t];return `<td>${x?x[i]+"-"+x[j]:"–"}</td>`}).join("")}</tr>`).join("")}</tbody></table></div></div>`}
/* 🦵 kickers: field goals / kicking points, plus any posted lines */
function xaKickCard(g){if(typeof NFL_K==="undefined")return "";const rows=[];const D=typeof LO!=="undefined"&&LO.data&&LO.data.nfl;
  const lines={};if(D&&D.props)for(const r of D.props)if(["fgm","kpts","xpm"].includes(r[1]))lines[loNorm(r[0])+"|"+r[1]]=r;
  for(const t of [g.away,g.home]){const K=Object.entries(NFL_K).filter(([,k])=>k.tm===t).sort((a,b)=>b[1].g.length-a[1].g.length)[0];if(!K)continue;const [nm,k]=K,G=k.g,n=G.length,s=i=>G.reduce((a,x)=>a+x[i],0);
    const X={sp:null};const L=LINES[g.id],imp=L&&L.sp!=null&&L.tot!=null?(t===g.home?L.tot/2-L.sp/2:L.tot/2+L.sp/2):null;
    const ln=r=>r?`${r[2]} <span class="small">(o ${oddsFmt(r[3])}${r[4]!=null?" / u "+oddsFmt(r[4]):""})</span>`:"–";
    const hit=(i,l)=>l==null?"":` · over ${l} in ${G.filter(x=>x[i]>l).length}/${n}`;const fl=lines[loNorm(nm)+"|fgm"],kl=lines[loNorm(nm)+"|kpts"];
    rows.push(`<tr><td><b>${xaEsc(nm)}</b> <span class="small">${t}</span></td><td>${(s(1)/n).toFixed(1)} <span class="small">(${s(1)}/${s(2)}, long ${Math.max(...G.map(x=>x[5]))})</span><div class="small">line ${ln(fl)}${hit(1,fl&&fl[2])}</div></td><td>${(s(4)/n).toFixed(1)}<div class="small">line ${ln(kl)}${hit(4,kl&&kl[2])}</div></td></tr>`)}
  if(!rows.length)return "";
  return `<div class="card xacard xadeep"><h2>🦵 Kickers</h2><div class="xasub">Field goals made and kicking points per game this season (nflverse), with the books' lines when posted. Kickers score more when drives stall in field-goal range — low red-zone TD rates and domes help.</div>
   <div class="nbatbl"><table class="bxt xat"><thead><tr><th>Kicker</th><th>FG made / game</th><th>Kicking pts / game</th></tr></thead><tbody>${rows.join("")}</tbody></table></div></div>`}
function xaTdCard(g){if(typeof REAL_PROPS==="undefined"||typeof NFL_RZ==="undefined")return "";const L=[];
  for(const [key,v] of Object.entries(REAL_PROPS)){const [nm,k]=key.split("|");if(k!=="anyTD")continue;const P=PINFO[nm];if(!P||(P.team!==g.away&&P.team!==g.home))continue;const e=xaTdEst(nm);if(!e)continue;const need=xaImp(v[1]);L.push({nm,P,e,odds:v[1],need,edge:need!=null?e.p-need:null})}
  if(!L.length)return "";L.sort((a,b)=>(b.edge??-1)-(a.edge??-1));
  return `<div class="card xacard xadeep"><h2>🎯 Anytime TD estimates</h2><div class="xasub">His share of his team's red-zone and goal-line touches and TDs × tonight's expected team TDs (from the implied points), vs what the odds need.</div>
   ${L.slice(0,12).map(x=>`<div class="nher"><span><span>${typeof badge!=="undefined"?badge(x.P.team):""} <b>${xaEsc(x.nm)}</b> <span class="small">${x.P.pos}</span></span><span class="small">${x.e.R[0]} red-zone touches · ${x.e.R[2]} TDs · ${Math.round(x.e.share*100)}% of team</span></span><span class="nhedv"><b class="${x.edge>.03?"up":x.edge<-.03?"dn":""}">${Math.round(x.e.p*100)}%</b><span class="small">${x.odds!=null?amTxt(x.odds)+" needs "+Math.round(x.need*100)+"%":""}</span></span></div>`).join("")}
   <div class="small" style="margin-top:6px">A rough guide — touchdowns are streaky and small samples swing a lot.</div></div>`}

/* ================= NBA: projection, usage, free throws, who gains ================= */
function xaNormCdf(z){const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p}
function xaPois(lam,k){let p=Math.exp(-lam),s=p;for(let i=1;i<=k;i++){p*=lam/i;s+=p}return s}   // P(X<=k)
const XA_POIS=new Set(["3pm","stl","blk","sb"]);
/* 📐 projection: minutes × per-minute rate × pace × defense, with a range from his own game-to-game spread */
function xaProj(nm,k){const p=NBA_LOGS[nm];if(!p||!NBA_MK[k])return null;const G=p.g.filter(x=>x[4]>0);if(G.length<5)return null;
  const avg=a=>a.reduce((s,x)=>s+x,0)/a.length,mins=G.map(x=>x[4]),min=.6*avg(mins.slice(-5))+.4*avg(mins);
  const L10=G.slice(-10),rate=(.55*L10.reduce((s,x)=>s+nbaVal(x,k),0)/L10.reduce((s,x)=>s+x[4],0))+(.45*G.reduce((s,x)=>s+nbaVal(x,k),0)/G.reduce((s,x)=>s+x[4],0));
  const g=nbaGameOf(p.tm);let pace=1,def=1,notes=[];
  if(g&&typeof NBA_TADV!=="undefined"&&NBA_TADV[g.a]&&NBA_TADV[g.h]&&typeof NBA_GPACE!=="undefined"){const tp=(NBA_TADV[g.a].pace+NBA_TADV[g.h].pace)/2,mp=G.map(x=>NBA_GPACE[x[0]]).filter(Boolean);
    if(mp.length>=4){pace=Math.max(.92,Math.min(1.08,tp/avg(mp)));if(Math.abs(pace-1)>=.02)notes.push(`pace ${pace>1?"+":""}${Math.round((pace-1)*100)}%`)}}
  const opp=g?(g.a===p.tm?g.h:g.a):null,pos=p.p5;
  if(opp&&pos){const T=xaTierTable("nba",pos,k),vs=Object.values(T).map(x=>x.v);if(T[opp]&&vs.length>=20){const lg=avg(vs);def=Math.max(.88,Math.min(1.12,1+.6*(T[opp].v/lg-1)));if(Math.abs(def-1)>=.02)notes.push(`${opp} defense ${def>1?"+":""}${Math.round((def-1)*100)}%`)}}
  const inj=xaNbaInj(nm);const out=inj&&/out/i.test(inj[2]||"");const mean=min*rate*pace*def;
  const vals=G.map(x=>nbaVal(x,k)),m0=avg(vals),sd0=Math.sqrt(avg(vals.map(v=>(v-m0)**2))),sd=m0>0?sd0/m0*mean:sd0;
  return {mean,sd:Math.max(sd,XA_POIS.has(k)?Math.sqrt(mean):.5),min,rate,pace,def,notes,out}}
function xaProjP(P,k,line){if(XA_POIS.has(k))return 1-xaPois(P.mean,Math.floor(line));return 1-xaNormCdf((line+.5-.5-P.mean)/P.sd)}   // continuity: over x.5 means >= ceil
function xaProjLine(nm,k,line){const P=xaProj(nm,k);if(!P||P.out||line==null)return "";const lo=Math.max(0,P.mean-P.sd),hi=P.mean+P.sd,po=xaProjP(P,k,line),over=typeof PXSIDE==="undefined"||PXSIDE!=="u";
  return `<div class="xaproj"><span>📐 Our projection <b>${P.mean.toFixed(1)}</b> <span class="small">(usually ${lo.toFixed(0)}–${hi.toFixed(0)})</span></span><span><b>${Math.round((over?po:1-po)*100)}%</b> <span class="small">${over?"over":"under"} ${line}</span></span></div>`}
function xaProjBody(nm,k,line){const P=xaProj(nm,k);if(!P)return "";if(P.out)return `<h4>📐 Projection</h4><div class="small">Listed out tonight.</div>`;
  const alt=(typeof LO!=="undefined"&&LO.alt&&LO.alt[nm+"|"+k])||[];const lines=[...new Set([line,...alt.map(a=>a[0])])].filter(v=>v!=null).sort((a,b)=>a-b).slice(0,9);
  return `<h4>📐 Projection</h4><div class="small">${P.min.toFixed(1)} minutes × ${(P.rate*36).toFixed(1)} per 36 (last 10 weighted)${P.notes.length?" · "+P.notes.join(" · "):""} ≈ <b>${P.mean.toFixed(1)}</b>, usually ${Math.max(0,P.mean-P.sd).toFixed(1)}–${(P.mean+P.sd).toFixed(1)}.</div>
   <table class="bxt xat"><thead><tr><th>Line</th><th>Over</th><th>Under</th>${alt.length?"<th>Best odds (o/u)</th>":""}</tr></thead><tbody>${lines.map(l=>{const po=xaProjP(P,k,l),a=alt.find(z=>z[0]===l);return `<tr${l===line?' class="xame"':""}><td>${l}</td><td><b>${Math.round(po*100)}%</b></td><td>${Math.round((1-po)*100)}%</td>${alt.length?`<td>${a?`${a[1]!=null?oddsFmt(a[1]):"–"} / ${a[3]!=null?oddsFmt(a[3]):"–"}`:"–"}</td>`:""}</tr>`}).join("")}</tbody></table>
   <div class="small">A model, not a promise — it can't see tonight's injuries until they're posted.</div>`}
/* 📊 usage share per game: (FGA + 0.44·FTA + TOV) of his team's, scaled to his minutes */
function xaUsage(nm){const p=NBA_LOGS[nm];if(!p)return null;if(!XA.tp){XA.tp={};for(const q of Object.values(NBA_LOGS))for(const x of q.g){const key=x[0]+"|"+q.tm,o=XA.tp[key]||(XA.tp[key]=[0,0]);o[0]+=(x[11]||0)+.44*(x[17]||0)+(x[14]||0);o[1]+=x[4]||0}}
  const out=[];for(const x of p.g){const T=XA.tp[x[0]+"|"+p.tm];if(!T||!T[0]||!(x[4]>0))continue;const mine=(x[11]||0)+.44*(x[17]||0)+(x[14]||0);out.push({d:x[1],u:100*mine*(T[1]/5)/(x[4]*T[0])})}return out}
function xaUsageSay(nm){const U=xaUsage(nm);if(!U||U.length<5)return "";const av=a=>a.reduce((s,x)=>s+x.u,0)/a.length,s=av(U),l5=av(U.slice(-5)),d=l5-s;
  return `Usage: he finishes <b>${l5.toFixed(1)}%</b> of his team's plays while on the court over the last 5 (season ${s.toFixed(1)}%)${Math.abs(d)>=3?` — <b>${d>0?"a bigger role lately":"a smaller role lately"}</b>; lines often lag this`:""}.`}
/* 🎯 free-throw matchup */
function xaFTSay(nm){const p=NBA_LOGS[nm];if(!p)return "";const G=p.g.filter(x=>x[4]>0);if(G.length<4)return "";const fta=G.reduce((s,x)=>s+(x[17]||0),0)/G.length,ftm=G.reduce((s,x)=>s+(x[16]||0),0)/G.length;if(fta<1)return "";
  const g=nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):null,O=opp&&NBA_TADV[opp];const lgF=Object.values(NBA_TADV).reduce((s,t)=>s+t.d.fta,0)/Object.keys(NBA_TADV).length;
  let f=O?O.d.fta/lgF:1,txt=O?`${xaEsc(opp)} allow ${O.d.fta} free-throw attempts a game (${xaOrd(O.dR.fta)} fewest of 30)`:"";
  const crew=g&&typeof NBA_REFS!=="undefined"&&NBA_REFS&&NBA_REFS.today&&NBA_REFS.today[g.a+"@"+g.h];
  if(crew&&NBA_REFS.lg){const S=crew.map(n=>NBA_REFS.ref[n]).filter(Boolean);if(S.length){const cf=S.reduce((s,r)=>s+r[1],0)/S.length/NBA_REFS.lg[0];f*=cf;txt+=`; tonight's referees call ${cf>=1?Math.round((cf-1)*100)+"% more":Math.round((1-cf)*100)+"% fewer"} free throws than average`}}
  return `He averages <b>${fta.toFixed(1)}</b> free-throw attempts (${ftm.toFixed(1)} made)${txt?". "+txt:""}. Expected tonight ≈ <b>${(fta*f).toFixed(1)}</b> attempts.`}
/* 🔁 who gains when a star is out */
function xaGainCard(g){const cards=[];
  for(const t of [g.a,g.h]){const stars=Object.entries(NBA_LOGS).filter(([n,p])=>{if(p.tm!==t||p.g.length<3)return false;const i=xaNbaInj(n);return i&&/out/i.test(i[2]||"")&&(nbaAvg(p,"pts")>=12||nbaAvg(p,"min")>=26)});
    for(const [sn,sp] of stars.slice(0,2)){const ids=new Set(sp.g.map(x=>x[0])),L=[];
      for(const [n,p] of Object.entries(NBA_LOGS)){if(p.tm!==t||n===sn)continue;const i=xaNbaInj(n);if(i&&/out/i.test(i[2]||""))continue;
        const W=p.g.filter(x=>ids.has(x[0])),WO=p.g.filter(x=>!ids.has(x[0]));if(WO.length<2||W.length<2)continue;const a=(A,f)=>A.reduce((s,x)=>s+f(x),0)/A.length;
        const dm=a(WO,x=>x[4])-a(W,x=>x[4]),df=a(WO,x=>x[11]||0)-a(W,x=>x[11]||0),dp=a(WO,x=>x[5])-a(W,x=>x[5]);if(dm<2&&df<2&&dp<3)continue;L.push({n,dm,df,dp,wo:WO.length,pts:a(WO,x=>x[5])})}
      L.sort((a,b)=>(b.dp+b.df)-(a.dp+a.df));if(L.length)cards.push(`<div style="margin-bottom:10px"><b>${xaEsc(t)} without ${xaEsc(sn)}</b>
        ${L.slice(0,5).map(x=>`<a class="xafb" href="#nba-player-${encodeURIComponent(x.n)}"><span>${xaEsc(x.n)} <span class="small">${x.wo} games without</span></span><span class="small">${x.dm>=0?"+":""}${x.dm.toFixed(1)} min · ${x.df>=0?"+":""}${x.df.toFixed(1)} shots · <b>${x.dp>=0?"+":""}${x.dp.toFixed(1)} pts</b> (${x.pts.toFixed(1)})</span></a>`).join("")}</div>`)}}
  if(!cards.length)return "";
  return `<div class="card xacard xadeep"><h2>🔁 Who gains with a star out</h2><div class="xasub">Teammates whose minutes, shots and points went up in games the star missed this season (vs games he played). Props are often slow to catch up.</div>${cards.join("")}<div class="small">Small samples — check his props for tonight's line.</div></div>`}

function xaNbaInj(n){const r=nbaInjOf(n);if(r)return r;if(!XA.inj){XA.inj={};for(const t in NBA_INJ)for(const x of NBA_INJ[t])XA.inj[loNorm(x[0])]=x}return XA.inj[loNorm(n)]||null}

/* ================= Easier to read: verdict, takeaways, drawer tabs, player chips, chart taps ================= */
/* ✅ one-line verdict: independent signals, each pointing over / under / neither */
function xaVerdict(sp,nm,k,line){if(line==null)return null;const G=xaGames(sp,nm,k);if(G.length<5)return null;const S=[];const add=(ic,lab,d,why)=>S.push({ic,lab,d,why});
  const L=G.slice(-10),hr=a=>a.filter(x=>x.v>line).length/a.length;
  {const h=hr(L);add("🔥","last 10",h>=.7?1:h<=.3?-1:0,`over in ${L.filter(x=>x.v>line).length} of ${L.length}`)}
  if(G.length>=6){const h=hr(G);add("📅","season",h>=.6?1:h<=.4?-1:0,`over in ${Math.round(h*100)}% of games`)}
  if(sp==="nba"){const P=xaProj(nm,k);if(P&&!P.out){const po=xaProjP(P,k,line);add("📐","projection",po>=.58?1:po<=.42?-1:0,`${P.mean.toFixed(1)} projected · ${Math.round(po*100)}% over`)}}
  const O=xaOpp(sp,nm),pos=xaPos(sp,nm);if(O&&pos){const T=xaTierTable(sp,pos,k)[O.opp];if(T)add("🛡️","matchup",T.tier==="soft"?1:T.tier==="tough"?-1:0,`${O.opp} rank ${T.rank} of ${T.n} in what they allow`)
    const D=xaDefTrend(sp,O.opp,pos==="all"?null:pos,k);if(D&&D.big)add("📉","defense trend",D.d>0?1:-1,`${O.opp} allowing ${D.d>0?"more":"less"} lately`)}
  const M=xaMinTrend(sp,nm);if(M)add("⏱️","role",M.dir==="up"?1:-1,`${sp==="nba"?"minutes":"ice time"} ${M.dir==="up"?"up":"down"} ${M.n} straight`);
  const up=S.filter(s=>s.d>0).length,dn=S.filter(s=>s.d<0).length,n=S.length;
  const v=up-dn>=2&&up>=dn*2?"o":dn-up>=2&&dn>=up*2?"u":"m";return {v,up,dn,n,S}}
function xaVerdictHtml(sp,nm,k,line){let V;try{V=xaVerdict(sp,nm,k,line)}catch(e){return ""}if(!V)return "";
  const head=V.v==="o"?`✅ Leans <b>over</b> ${line} — ${V.up} of ${V.n} signals agree`:V.v==="u"?`✅ Leans <b>under</b> ${line} — ${V.dn} of ${V.n} signals agree`:`➖ Mixed signals on ${line} — ${V.up} say over, ${V.dn} say under`;
  return `<div class="xaver ${V.v}"><div>${head}</div><div class="xavs">${V.S.map(s=>`<span title="${xaEsc(s.why)}">${s.ic} ${s.lab} <b>${s.d>0?"▲":s.d<0?"▼":"–"}</b></span>`).join("")}</div></div>`}
/* 🔑 extra key takeaways for the game pages' Quick read */
function xaTakeaways(sp,g){const out=[],S=(c,ic,t)=>out.push({c,ic,t});try{
  const a=sp==="nfl"?g.away:g.a,h=sp==="nfl"?g.home:g.h;
  for(const t of [a,h]){const r=xaDefTrend(sp,t,null,sp==="nhl"?"hgoals":null);if(r&&r.big)S(r.d>0?"up":"dn","📉",`<b>${xaEsc(t)}</b> defense ${r.d>0?"slipping":"tightening up"}: ${r.l.toFixed(1)} allowed over the last ${r.n} vs ${r.s.toFixed(1)} on the season.`)}
  if(sp==="nba"){const A=NBA_TADV[a],H=NBA_TADV[h],C=xaPaceCuts();if(A&&H&&C){const tp=(A.pace+H.pace)/2;if(tp>=C[1])S("up","🏃",`Fast game expected (${tp.toFixed(1)} possessions) — more shots for everyone.`);else if(tp<C[0])S("dn","🐢",`Slow game expected (${tp.toFixed(1)} possessions) — fewer shots, leans unders.`)}
    const crew=typeof NBA_REFS!=="undefined"&&NBA_REFS&&NBA_REFS.today&&NBA_REFS.today[a+"@"+h];if(crew&&NBA_REFS.lg){const R=crew.map(n=>NBA_REFS.ref[n]).filter(Boolean);if(R.length){const ft=R.reduce((s,r)=>s+r[1],0)/R.length,d=ft-NBA_REFS.lg[0];if(Math.abs(d)>=3)S(d>0?"up":"dn","🦓",`Referees call ${d>0?"lots of":"few"} free throws (${ft.toFixed(1)} a game vs ${NBA_REFS.lg[0]}) — ${d>0?"helps free-throw-heavy scorers":"a small knock on scorers who live at the line"}.`)}}}
  if(sp==="nhl"){for(const t of [a,h]){const x=xaLuck(t);if(!x)continue;const d=x.act-x.exp;if(d>=.06||(x.pdo||100)>=101.5)S("dn","🍀",`<b>${xaEsc(t)}</b> have been lucky (points ${Math.round(x.act*100)}% vs ${Math.round(x.exp*100)}% expected, PDO ${x.pdo?x.pdo.toFixed(1):"–"}) — due to cool off.`);else if(d<=-.06||(x.pdo||100)<=98.5)S("up","🍀",`<b>${xaEsc(t)}</b> have been unlucky — due to bounce back.`)}
    const A=NHL_TEAM[a],H=NHL_TEAM[h];if(A&&H&&A.pen&&H.pen){const pp=(A.pen[1]+H.pen[0])/2+(H.pen[1]+A.pen[0])/2;if(pp>=8)S("up","⚡",`Lots of penalties likely (${pp.toFixed(1)} power plays expected in total) — good for power-play points.`)}}
  if(sp==="nfl"){const P=typeof NFL_PROE!=="undefined"?NFL_PROE:{};for(const t of [a,h]){const x=P[t];if(x&&x[0]!=null&&Math.abs(x[0])>=4)S(x[0]>0?"up":"n","🧠",`<b>${xaEsc(t)}</b> are ${x[0]>0?"pass-heavy":"run-heavy"} (${x[0]>0?"+":""}${x[0]}% pass rate over expected).`)}
    if(typeof NFL_DIVG!=="undefined"&&NFL_DIVG.some(k=>k.endsWith("|"+a+"|"+h)))S("n","🤝","Division game — historically lower scoring and closer than the spread.")}
}catch(e){}return out}
/* drawer sections -> tabs */
const XA_TABS=[["proj","📐 Projection",/📐|📊|🎯|🟨|1️⃣|⚡|🧤|📈 Pass/],["match","🛡️ Matchup",/🛡️|🏃 Fast|↔️|🔁/],["role","⏱️ Role",/💨|👥|⏱️|🏃 Designed/],["hist","📉 History",/📉/]];
function xaTabify(rows){const B={proj:[],match:[],role:[],hist:[]},misc=[];
  for(const r of rows){const h=(/<h4>([^<]*)/.exec(r)||[])[1]||"";const t=XA_TABS.find(([,,re])=>re.test(h));if(t)B[t[0]].push(r);else misc.push(r)}
  B.match.push(...misc);const on=XA_TABS.filter(([k])=>B[k].length);if(on.length<2)return rows.join("");
  return `<div class="xatabs">${on.map(([k,l],i)=>`<button data-xat="${k}" class="${i?"":"on"}">${l}</button>`).join("")}</div>${on.map(([k],i)=>`<div class="xatp" data-xatp="${k}"${i?" hidden":""}>${B[k].join("")}</div>`).join("")}`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-xat]");if(!b)return;e.preventDefault();e.stopPropagation();const box=b.closest(".xab");
  box.querySelectorAll("[data-xat]").forEach(x=>x.classList.toggle("on",x===b));box.querySelectorAll("[data-xatp]").forEach(p=>p.hidden=p.dataset.xatp!==b.dataset.xat)},true);
/* 🏷️ player summary chips */
function xaPlayerChips(sp,nm){const C=[];const add=(ic,t,why)=>C.push(`<span class="xapc" title="${xaEsc(why||"")}">${ic} ${t}</span>`);try{
  const mk=sp==="nba"?"pts":sp==="nhl"?(NHL_G[nm]?"hsaves":"hsog"):({QB:"passYds",RB:"rushYds"}[(PINFO[nm]||{}).pos]||"recYds");const G=xaGames(sp,nm,mk);
  const lab=sp==="nba"?"points":sp==="nhl"?(NHL_G[nm]?"saves":"shots"):(MARKETS[mk]||{}).n||"";
  if(G.length>=6){const av=a=>a.reduce((s,x)=>s+x.v,0)/a.length,s=av(G),l=av(G.slice(-5));if(s>0&&l>=s*1.15)add("🔥","Hot",`${lab}: last 5 avg ${l.toFixed(1)} vs ${s.toFixed(1)} season`);else if(s>0&&l<=s*.85)add("❄️","Cold",`${lab}: last 5 avg ${l.toFixed(1)} vs ${s.toFixed(1)} season`)}
  const M=xaMinTrend(sp,nm);if(M)add("⏱️",`${sp==="nba"?"Minutes":"Ice time"} ${M.dir==="up"?"up":"down"}`,`${M.n} straight games`);
  const O=xaOpp(sp,nm),pos=xaPos(sp,nm);if(O&&pos){const T=xaTierTable(sp,pos,mk)[O.opp];if(T&&T.tier!=="avg")add("🛡️",`${T.tier==="soft"?"Soft":"Tough"} matchup tonight`,`${O.opp} rank ${T.rank} of ${T.n} in ${lab} allowed`)}
  if(sp==="nba"){const U=xaUsage(nm);if(U&&U.length>=6){const av=a=>a.reduce((s,x)=>s+x.u,0)/a.length,d=av(U.slice(-5))-av(U);if(Math.abs(d)>=3)add("🎯",`Usage ${d>0?"rising":"falling"}`,`last 5 ${av(U.slice(-5)).toFixed(1)}% vs ${av(U).toFixed(1)}%`)}
    const c3=xa3PChip(nm,"pts");if(c3)C.push(c3)}
  if(sp==="nhl"&&!NHL_G[nm]){const rk=xaPPRank(nm);if(rk&&rk<=5)add("⚡","Top power-play unit",`${xaOrd(rk)} on his team in PP time`)}
  if(sp==="nhl"&&NHL_G[nm]){const P=xaSavesProj(nm);if(P)add("🧤",`~${P.saves.toFixed(0)} saves projected`,`${P.shots.toFixed(1)} shots expected`)}
}catch(e){}return C.length?`<div class="xapcw">${C.join("")}</div>`:""}
function xaPlayerChipsInject(){const h=(location.hash||"").slice(1);let sp=null,nm=null,host=null;try{
  if(h.startsWith("nba-player-")){sp="nba";nm=decodeURIComponent(h.slice(11));host=document.querySelector("#v-nba .phead")}
  else if(h.startsWith("nhl-player-")){sp="nhl";nm=decodeURIComponent(h.slice(11));host=document.querySelector("#v-nhl .phead")}
  else if(h.startsWith("props/")){sp="nfl";nm=decodeURIComponent(h.split("/")[1]);const h1=document.querySelector("#v-props h1");host=h1&&h1.closest(".row")}}catch(e){}
  if(!host||!nm||host.nextElementSibling&&host.nextElementSibling.classList.contains("xapcw"))return;const html=xaPlayerChips(sp,nm);if(html)host.insertAdjacentHTML("afterend",html)}
/* 👆 tap a chart bar / dot to see the game (title text, which phones never show) */
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest(".nbbar[title],.mbc[title],.xasvg circle");if(!el)return;
  const t=el.getAttribute("title")||(el.querySelector&&el.querySelector("title")&&el.querySelector("title").textContent);if(!t)return;
  let tip=document.getElementById("xatip");if(!tip){tip=document.createElement("div");tip.id="xatip";document.body.appendChild(tip)}
  tip.textContent=t;tip.style.left=Math.max(8,Math.min(innerWidth-208,e.clientX-100))+"px";tip.style.top=(e.clientY-48)+"px";tip.className="show";clearTimeout(tip._t);tip._t=setTimeout(()=>tip.className="",2600)});
