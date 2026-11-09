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
function xaChips(sp,nm,k,side){try{return xaMinChip(sp,nm)+xaBlowChip(sp,nm,k,side)}catch(e){return ""}}
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
function xaPanel(sp,nm,k,line,side){if(line==null)return "";return `<details class="drawer xa" data-xa="${xaEsc(JSON.stringify([sp,nm,k,line,side||"o"]))}"><summary>📐 Deeper splits <span class="small">defenses like tonight's · blowouts · teammates · line history</span></summary><div class="xab small">Loading…</div></details>`}
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
  /* power play */
  if(sp==="nhl"){const s=xaPPSay(nm);if(s)rows.push(`<h4>⚡ Power play</h4><div class="small">${s}</div>`)}
  /* minutes */
  const t=xaMinTrend(sp,nm);if(t)rows.push(`<h4>⏱️ ${sp==="nba"?"Minutes":"Ice time"}</h4><div class="small">${t.n} straight games ${t.dir==="up"?"above":"below"} his season average (${t.avg.toFixed(1)} min): ${t.last.map(v=>v.toFixed(1)).join(", ")}. Lines often lag a role change.</div>`);
  rows.push(`<h4>📉 Closing line vs result</h4><div class="xahw">${XA.hist?xaHistHtml(sp,nm,k,side):"Loading…"}</div>`);
  return rows.join("")+`<div class="small" style="margin-top:6px">This season's games only. Defense ranks use each team's season-long numbers.</div>`}
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
  if(!crew)return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">🦓 Referees</h2><div class="small">The NBA posts tonight's crews around 9 AM ET — they'll show here after the next update.</div></div>`;
  const rows=crew.map(n=>{const r=R[n];return `<tr><td><b>${xaEsc(n)}</b></td>${r?`<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[5]?`${r[4]}-${r[5]-r[4]}`:"–"}</td>`:`<td colspan="5" class="small">fewer than 3 games this season</td>`}</tr>`}).join("");
  const S=crew.map(n=>R[n]).filter(Boolean);let say="";
  if(S.length&&lg){const ft=S.reduce((a,r)=>a+r[1],0)/S.length,pt=S.reduce((a,r)=>a+r[3],0)/S.length,ov=S.reduce((a,r)=>a+r[4],0),gr=S.reduce((a,r)=>a+r[5],0);
    say=`This crew's games average <b>${ft.toFixed(1)}</b> free-throw attempts (league ${lg[0]}) and <b>${pt.toFixed(1)}</b> points (league ${lg[2]})${gr?`; their games went over the closing total ${ov} of ${gr} times`:""}. ${ft>=lg[0]+3?"A whistle-heavy crew — helps free-throw-heavy scorers and overs.":ft<=lg[0]-3?"A crew that lets them play — fewer free throws.":"About average."}`}
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">🦓 Referees</h2><div class="small" style="margin-bottom:8px">Tonight's crew (official.nba.com) and the games they've worked this season (both teams combined).</div>
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Referee</th><th>G</th><th>FTA</th><th>Fouls</th><th>Pts</th><th>O-U</th></tr></thead><tbody>${rows}</tbody></table></div>
   ${say?`<div class="small" style="margin-top:8px">${say}</div>`:""}<div class="small" style="margin-top:4px">Small samples — a nudge, not a reason on its own.</div></div>`}

/* ---------- 🧤 NHL saves & hits when books haven't posted lines yet ---------- */
function xaNhlNoLine(k){const L=[];
  for(const g of NHL_SLATE.filter(g=>!nhStarted(g)))for(const t of [g.a,g.h]){const opp=g.a===t?g.h:g.a;
    if(k==="hsaves"){const p=typeof nhProbable!=="undefined"?nhProbable(t):null;if(!p)continue;const G=xaGames("nhl",p.nm,"hsaves");if(G.length<3)continue;L.push({nm:p.nm,t,opp,G,ctx:`${opp} average ${(NHL_TEAM[opp]||{}).sf||"–"} shots (${(NHL_TEAM[opp]||{}).sfR||"–"} of 32)`})}
    else for(const [n,p] of Object.entries(NHL_P)){if(p.tm!==t)continue;const G=xaGames("nhl",n,k);if(G.length<5)continue;const av=G.reduce((s,x)=>s+x.v,0)/G.length;if(av<(k==="hhit"?2:1))continue;L.push({nm:n,t,opp,G})}}
  const out=L.map(x=>{const v=x.G.map(z=>z.v).sort((a,b)=>a-b),med=v[Math.floor(v.length/2)],ln=Math.max(.5,Math.round(med)-.5),l10=x.G.slice(-10);
    return {...x,ln,av:x.G.reduce((s,z)=>s+z.v,0)/x.G.length,l10:[l10.filter(z=>z.v>ln).length,l10.length]}}).sort((a,b)=>b.av-a.av).slice(0,20);
  return out}
function xaNhlNoLineCard(k){const L=xaNhlNoLine(k),nm=k==="hsaves"?"Saves":"Hits";if(!L.length)return "";
  return `<div class="card" style="margin-top:12px"><h2 style="margin-bottom:2px">${k==="hsaves"?"🧤":"💥"} ${nm} — no book lines yet</h2><div class="small" style="margin-bottom:8px">Books usually post ${nm.toLowerCase()} the afternoon of the game. Until then: tonight's ${k==="hsaves"?"probable goalies":"top hitters"}, his usual number (the middle of his games this season) and how often he went over it lately. No odds are shown because none are posted.</div>
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
      S.forEach(s=>s.d=G.map(x=>x[1]))}
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
  return `<div class="card xatr" style="margin-top:12px"><h2 style="margin-bottom:2px">📈 Role over the season</h2><div class="small" style="margin-bottom:8px">Every game this season (dots), the 5-game rolling average (bold line) and his season average (dashed). ▲▼ = last 5 games well above or below his season.${us}</div>
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
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">📉 Defense trending</h2><div class="small" style="margin-bottom:8px">Last ${n} games vs the season — a defense that's slipping (or tightening up) shows here before its season rank catches up.</div>
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>${lab}/game</th><th></th>${sp==="nhl"?"<th>Shots allowed</th>":""}</tr></thead><tbody>${rows.join("")}</tbody></table></div></div>`}

/* ---------- 🚑 team without its key players (who are out tonight) ---------- */
function xaKeyOut(sp,t){const L=[];try{
  if(sp==="nba"){for(const [n,p] of Object.entries(NBA_LOGS)){if(p.tm!==t||p.g.length<3)continue;const i=nbaInjOf(n);if(!i||!/out/i.test(i[2]||""))continue;const a=nbaAvg(p,"pts");if(a>=10||nbaAvg(p,"min")>=26)L.push({n,ids:new Set(p.g.map(x=>x[0])),why:`${a.toFixed(1)} pts`})}}
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
  for(const t of [a,h])for(const k of xaKeyOut(sp,t)){const s=xaTeamSplit(sp,t,k);if(s.wo.n<1)continue;const f=v=>v.toFixed(sp==="nhl"?2:1);
    rows.push(`<tr><td><b>${xaEsc(t)}</b> without <b>${xaEsc(k.n)}</b><div class="small">${xaEsc(k.why)}</div></td><td>${s.wo.w}-${s.wo.l}<div class="small">${f(s.wo.me)}–${f(s.wo.op)}</div></td><td>${s.w.w}-${s.w.l}<div class="small">${f(s.w.me)}–${f(s.w.op)}</div></td></tr>`)}
  if(!rows.length)return "";
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">🚑 Without their key players</h2><div class="small" style="margin-bottom:8px">Key players listed out tonight, and how the team did this season in games he missed vs games he played (record · average score for–against).</div>
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Without him</th><th>With him</th></tr></thead><tbody>${rows.join("")}</tbody></table></div><div class="small" style="margin-top:6px">Few games without him = small sample.</div></div>`}

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
  return `<div class="card" style="margin-top:14px"><h2 style="margin-bottom:2px">🍀 Luck check</h2><div class="small" style="margin-bottom:8px">One-goal and OT games are close to a coin flip over a season, and very high or low shooting / save % (PDO, normal ≈ 100) usually drifts back. Teams living on those tend to even out.</div>
   <div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>One-goal / OT</th><th>Other games</th><th>Points % (expected)</th><th>PDO</th></tr></thead><tbody>
   ${R.map(([t,x])=>`<tr><td><b>${xaEsc(t)}</b></td><td>${x.one[0]}-${x.one[1]}</td><td>${x.oth[0]}-${x.oth[1]}</td><td>${Math.round(x.act*100)}% <span class="small">(${Math.round(x.exp*100)}%)</span></td><td>${x.pdo!=null?x.pdo.toFixed(1):"–"}</td></tr><tr><td colspan="5" class="small">${say(x)}</td></tr>`).join("")}</tbody></table></div></div>`}

/* ---------- 🥅 goalie vs tonight's opponent + rest ---------- */
function xaGoalieVs(x,g){if(!g)return "";const t=x.tm||(NHL_G[x.nm]||{}).tm,opp=g.a===t?g.h:g.a;const st=x.g.filter(z=>z[7]);const vs=st.filter(z=>z[1]===opp);
  const sv=a=>{const sa=a.reduce((s,z)=>s+z[3],0),v=a.reduce((s,z)=>s+z[4],0);return sa?(v/sa).toFixed(3).slice(1):"–"};
  const cur=st.filter(z=>z[9]!==1),rest=[];for(let i=1;i<cur.length;i++){const d=(Date.parse(cur[i][0])-Date.parse(cur[i-1][0]))/864e5;rest.push({d,z:cur[i]})}
  const r1=rest.filter(o=>o.d>=3).map(o=>o.z),r0=rest.filter(o=>o.d===2).map(o=>o.z);
  return `<div class="small" style="margin-top:6px">vs ${xaEsc(opp)}: <b>${vs.length?sv(vs):"–"}</b> save % in ${vs.length} start${vs.length===1?"":"s"}${vs.some(z=>z[9]===1)?" (incl. last season)":""} · on 2+ days' rest <b>${r1.length?sv(r1):"–"}</b> (${r1.length}) · 1 day's rest <b>${r0.length?sv(r0):"–"}</b> (${r0.length})</div>`}

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
  return `Power-play time last ${l5.length}: <b>${av(l5).toFixed(1)} min/game</b> (last ${r.length}: ${av(r).toFixed(1)})${rk?` · ${rk}${rk===1?"st":rk===2?"nd":rk===3?"rd":"th"} on his team over the last 3 games`:""}${unit}.`}
