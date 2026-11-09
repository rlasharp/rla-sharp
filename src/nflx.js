/* Team records always follow RESULTS (real.js, updated with every final by the 2-hour job) — so a Monday-night
   final shows up in every record right away instead of waiting for the weekly rebuild. */
(function(){if(typeof RESULTS==="undefined"||typeof TEAMS==="undefined")return;
  const conf={},div={};if(typeof NFL_DIV!=="undefined")for(const [d,T] of Object.entries(NFL_DIV))T.forEach(t=>{div[t]=d;conf[t]=d.split(" ")[0]});
  const S={};Object.keys(TEAMS).forEach(t=>S[t]={w:0,l:0,t:0,pf:0,pa:0,hw:0,hl:0,aw:0,al:0,dw:0,dl:0,cw:0,cl:0,seq:[]});
  [...RESULTS].sort((a,b)=>a[0]-b[0]).forEach(([w,a,ap,h,hp])=>{for(const [t,o,me,op,home] of [[a,h,ap,hp,0],[h,a,hp,ap,1]]){const x=S[t];if(!x)continue;
    const r=me>op?"W":me<op?"L":"T";x.pf+=me;x.pa+=op;x.seq.push(r);if(r==="W")x.w++;else if(r==="L")x.l++;else x.t++;
    if(r!=="T"){x[(home?"h":"a")+(r==="W"?"w":"l")]++;if(div[t]&&div[t]===div[o])x[r==="W"?"dw":"dl"]++;if(conf[t]&&conf[t]===conf[o])x[r==="W"?"cw":"cl"]++}}});
  const n=Object.values(S).reduce((a,x)=>a+x.w+x.l+x.t,0),old=typeof NFL_STAND!=="undefined"?Object.values(NFL_STAND).reduce((a,x)=>a+x.w+x.l+(x.t||0),0):0;
  for(const [t,x] of Object.entries(S)){if(!x.seq.length)continue;TEAMS[t][1]=x.w;TEAMS[t][2]=x.l;TEAMS[t].ties=x.t;
    if(typeof NFL_STAND!=="undefined"&&n>=old){let k=x.seq.length-1;const c=x.seq[k];while(k>=0&&x.seq[k]===c)k--;
      NFL_STAND[t]=Object.assign(NFL_STAND[t]||{},{w:x.w,l:x.l,t:x.t,pf:x.pf,pa:x.pa,hw:x.hw,hl:x.hl,aw:x.aw,al:x.al,dw:x.dw,dl:x.dl,cw:x.cw,cl:x.cl,
        l5:x.seq.slice(-5).join(""),strk:c+(x.seq.length-1-k),pct:+((x.w+x.t/2)/(x.w+x.l+x.t)).toFixed(3)})}}})();
/* ---------- NFL extras: standings + playoff picture, upcoming schedule, target/snap share, pass rush vs O-line ----------
   Data: nfl_extra.js (tools/nflgen.py, nflverse). */
const NFX=typeof NFL_STAND!=="undefined";
function nfTm(t){return (TEAMS[t]&&TEAMS[t][0])||t}
function nfRec(s){return `${s.w}-${s.l}${s.t?"-"+s.t:""}`}
function nfNextHtml(t){
  const N=(NFX&&NFL_NEXT[t])||[];if(!N.length)return `<div class="small">No games scheduled.</div>`;
  return N.map(([wk,d,op,ha,tm])=>{const dt=new Date(d+"T12:00:00");const ds=dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
    let ts="";if(tm){let [h,m]=tm.split(":").map(Number);const ap=h>=12?"PM":"AM";h=h%12||12;ts=`${h}:${String(m).padStart(2,"0")} ${ap} ET`}
    return `<div class="l5r"><span class="chip" style="background:var(--card2);color:var(--text2)">Wk ${wk}</span><span>${ha==="H"?"vs":"@"} ${badge(op)} ${esc(short(op))}</span><span class="small">${ds}</span><b class="small">${ts}</b></div>`}).join("");
}
function viewStandings(){
  const host=document.getElementById("v-standings");
  if(!NFX){host.innerHTML="<h1>Standings</h1><p class='sub'>Not loaded.</p>";return}
  const seedOf={};for(const c of ["AFC","NFC"])NFL_SEEDS[c].forEach((t,i)=>seedOf[t]=i+1);
  const div=d=>{const T=NFL_DIV[d].slice().sort((a,b)=>NFL_STAND[b].pct-NFL_STAND[a].pct||(NFL_STAND[b].pf-NFL_STAND[b].pa)-(NFL_STAND[a].pf-NFL_STAND[a].pa));
    return `<div class="card"><h3 style="margin:0 0 6px">${d}</h3><div class="nbatbl"><table class="bxt stand" style="min-width:0"><thead><tr><th>Team</th><th>W-L</th><th>Div</th><th>PF</th><th>PA</th><th>Diff</th><th>Strk</th></tr></thead><tbody>
    ${T.map(t=>{const s=NFL_STAND[t],df=s.pf-s.pa;return `<tr><td>${badge(t)} <a href="#team-${t}" class="sctl">${esc(short(t))}</a>${seedOf[t]?` <span class="pll ${seedOf[t]<=4?"o":""}">${seedOf[t]}</span>`:""}</td><td><b>${nfRec(s)}</b></td><td>${s.dw}-${s.dl}</td><td>${s.pf}</td><td>${s.pa}</td><td class="${df>0?"up":df<0?"dn":""}">${df>0?"+":""}${df}</td><td class="${/^W/.test(s.strk)?"up":"dn"}">${s.strk}</td></tr>`}).join("")}</tbody></table></div></div>`};
  const pic=c=>`<div class="card"><h2 style="margin-bottom:6px">${c} playoff picture</h2>
    ${NFL_SEEDS[c].map((t,i)=>{const s=NFL_STAND[t];return `<div class="l5r"><span class="chip ${i<4?"w":""}" style="${i<4?"":"background:#2b2a1a;color:#f3c75a"}">${i+1}</span><span>${badge(t)} ${esc(nfTm(t))}</span><span class="small">${i<4?(i===0?"Bye · division leader":"Division leader"):"Wild card"}</span><b>${nfRec(s)}</b></div>`}).join("")}
    ${(NFL_SEEDS[c+"_hunt"]||[]).length?`<div class="small" style="margin-top:8px">In the hunt: ${NFL_SEEDS[c+"_hunt"].map(t=>`${esc(short(t))} (${nfRec(NFL_STAND[t])})`).join(" · ")}</div>`:""}</div>`;
  host.innerHTML=`<h1>NFL standings</h1><p class="sub">Through Week ${nflXWeek()}. If the season ended today: seeds 1–4 are division leaders (1 gets the only bye), 5–7 are wild cards. Ties are broken by win %, then division record, then point differential — the NFL's full tiebreakers can differ.</p>
   <div class="grid g2">${pic("AFC")}${pic("NFC")}</div>
   <h2 style="margin-top:18px">AFC</h2><div class="grid g2">${["AFC East","AFC North","AFC South","AFC West"].map(div).join("")}</div>
   <h2 style="margin-top:18px">NFC</h2><div class="grid g2">${["NFC East","NFC North","NFC South","NFC West"].map(div).join("")}</div>
   <h2 style="margin-top:18px">Betting trends</h2><div class="card" style="overflow-x:auto"><div id="stTrends"></div></div>
   <p class="note" style="margin-top:10px">Source: nflverse schedule & results (open data).</p>`;
  if(typeof viewTrends!=="undefined")viewTrends();
}
function nfTeamQb(t){const q=typeof QB1_STATUS!=="undefined"&&QB1_STATUS[t];if(q&&q.qb)return q.qb;const U=typeof USAGE_RAW!=="undefined"?USAGE_RAW:{};
  const c=Object.entries(U).filter(([,u])=>u.tm===t&&u.pos==="QB").sort((a,b)=>(b[1].s.snap||0)*b[1].g-(a[1].s.snap||0)*a[1].g)[0];return c?c[0]:null}
function nfOlHurt(t){return ((typeof INJ!=="undefined"&&INJ[t])||[]).filter(r=>/^(OT|T|G|C|OL|OG)$/.test(r[1])&&/out|doubt|quest/i.test(r[2]))}
function nfQbLg(){if(nfQbLg.v)return nfQbLg.v;const Q=Object.values(typeof NFL_QBP!=="undefined"?NFL_QBP:{});let a=0,b=0,c=0,d=0;Q.forEach(q=>{a+=q.py*q.pdb;b+=q.pdb;c+=q.cy*(q.db-q.pdb);d+=q.db-q.pdb});return nfQbLg.v={py:b?a/b:0,cy:d?c/d:0}}
function nfRushVerdict(off,def){const R=typeof NFL_RUSH!=="undefined"?NFL_RUSH:{};const O=R[off],D=R[def];if(!O||!D)return null;
  const hurt=nfOlHurt(off).filter(r=>/out|doubt/i.test(r[2])).length,oR=Math.round((O.o.pR+O.o.p4R)/2)+(hurt>=2?6:hurt?3:0),dR=Math.round((D.d.pR+D.d.p4R)/2);
  const sc=(oR-16.5)+(16.5-dR);return sc>=13?"bad":sc<=-13?"good":oR>=24?"leaky":dR<=5?"rush":oR<=6?"wall":"even"}
function nfPressCard(g){
  const R=typeof NFL_RUSH!=="undefined"?NFL_RUSH:null,P=typeof NFL_PRESS!=="undefined"?NFL_PRESS:{};
  if(!R||!R[g.away]||!R[g.home])return "";
  const row=(lbl,a,ar,b,br)=>`<div class="ovd"><div class="ovl">${lbl}</div><div>${a==null?"—":`<b>${a}%</b> ${rankPill(ar)}${rkBar(ar)}`}</div><div>${b==null?"—":`<b>${b}%</b> ${rankPill(br)}${rkBar(br)}`}</div></div>`;
  const side=(off,def)=>{const O=R[off].o,D=R[def].d,PO=P[off]||{},PD=P[def]||{},so=esc(short(off)),sd=esc(short(def));
    const hurt=nfOlHurt(off),qb=nfTeamQb(off),q=qb&&typeof NFL_QBP!=="undefined"?NFL_QBP[qb]:null,lg=nfQbLg(),v=nfRushVerdict(off,def);
    const w=v==="bad"?[`🔥 Edge: ${sd} pass rush. Lean ${so} QB yards/attempts unders and ${sd} sacks overs; long passes get harder.`,"dn"]
      :v==="good"?[`🛡️ Edge: ${so} line. The QB should have time — good for passing yards and deep shots.`,"up"]
      :v==="leaky"?[`⚠️ The ${so} line struggles to protect${hurt.some(r=>/out|doubt/i.test(r[2]))?" and is banged up":""}, but the ${sd} rush is only average — slight lean to ${so} QB unders.`,"dn"]
      :v==="rush"?[`⚠️ The ${sd} pass rush is one of the best — even a decent line can get beat. Slight lean to ${so} QB unders.`,"dn"]
      :v==="wall"?[`🛡️ The ${so} line is one of the best — the QB should mostly stay clean.`,"up"]:["Even matchup up front.",""];
    const qbl=q?`<div class="small" style="margin-top:8px"><b>${esc(qb)}</b> is pressured on ${Math.round(100*q.pdb/q.db)}% of dropbacks. Under pressure: <b>${q.py}</b> yds per dropback <span class="${q.py>=lg.py+0.5?"up":q.py<=lg.py-0.5?"dn":""}">(NFL QBs ${lg.py.toFixed(1)})</span> vs <b>${q.cy}</b> when clean. INTs: ${q.pi}% of throws under pressure vs ${q.ci}% clean.${q.bdb>=25&&q.by!=null?` Vs the blitz: ${q.by} yds per dropback (${q.ny} without)${D.blzR<=8?` — ${sd} blitzes a lot (${ordinal(D.blzR)})`:""}.`:""}</div>`:"";
    const ol=hurt.length?`<div class="small" style="margin-top:8px">🩹 <b>${so} O-line this week:</b> ${hurt.map(r=>`${esc(r[0])} (${esc(r[1])}, ${esc(r[2])})`).join(" · ")}</div>`:`<div class="small" style="margin-top:8px">✅ No ${so} offensive linemen on this week's injury report.</div>`;
    return `<div class="card"><h3 style="margin:0 0 8px">${badge(off)} ${so} line <span class="small">vs</span> ${badge(def)} ${sd} pass rush</h3>
      <div class="ovd head"><div></div><div>${so} line allows</div><div>${sd} defense gets</div></div>
      ${row("Pressure",O.p,O.pR,D.p,D.pR)}${row("Pressure, last 4",O.p4,O.p4R,D.p4,D.p4R)}${PO.sackA!=null&&PD.sackD!=null?row("Sacks",PO.sackA,PO.sackAR,PD.sackD,PD.sackDR):""}
      <div class="ovd"><div class="ovl">Blitz</div><div class="small">—</div><div><b>${D.blz}%</b> ${rankPill(D.blzR)}${rkBar(D.blzR)}</div></div>
      ${ol}${qbl}<div class="small ${w[1]}" style="margin-top:8px;font-weight:600">${w[0]}</div></div>`};
  return `<div class="section"><h2>Pass rush vs offensive line</h2><p class="small" style="margin-top:-6px">Per dropback this season (weeks 1–${typeof NFL_RUSH_WK!=="undefined"?NFL_RUSH_WK:""}). <b>Pressure</b> = the QB was sacked, hit or flushed into a scramble. <b>Blitz</b> = 5+ pass rushers. Rank 1st = best (least allowed for a line, most created for a defense). Pressure cuts QB yards and long passes. <span class="tag real">Real</span> nflverse play-by-play + FTN charting; injuries from ESPN.</p>
   <div class="grid g2">${side(g.away,g.home)}${side(g.home,g.away)}</div></div>`;
}
function nfRushChip(pl){if(!/^(QB|WR|TE)$/.test(pl.pos)||typeof NFL_RUSH==="undefined")return "";const o=oppOf(pl.team);if(!o)return "";
  const v=nfRushVerdict(pl.team,o.opp),D=NFL_RUSH[o.opp];if(!v||!D)return "";
  return v==="bad"?`<span class="qbc r" title="Pressure: ${esc(short(o.opp))} defense ${ordinal(D.d.pR)} · ${esc(short(pl.team))} line ${ordinal(NFL_RUSH[pl.team].o.pR)}">🔥 Tough pass rush (${esc(short(o.opp))} ${ordinal(D.d.pR)})</span>`
    :v==="good"?`<span class="qbc g" title="Pressure: ${esc(short(pl.team))} line ${ordinal(NFL_RUSH[pl.team].o.pR)} · ${esc(short(o.opp))} defense ${ordinal(D.d.pR)}">🛡️ Clean pocket likely</span>`:""}
function nfShareCard(g){
  if(!NFX)return "";
  const out=t=>{const R=(NFL_SHARE[t]||[]).filter(r=>!(typeof OUT!=="undefined"&&OUT[r[0]])).slice(0,6);if(!R.length)return "";
    const injOut=(typeof INJ!=="undefined"&&INJ[t]||[]).filter(x=>x[2]==="Out"&&["WR","TE","RB"].includes(x[1])).map(x=>x[0]);
    const arr=(s,l)=>Math.abs(l-s)<2?'<span class="small">→</span>':l>s?'<span class="up">▲</span>':'<span class="dn">▼</span>';
    return `<div class="card"><h3 style="margin:0 0 6px">${badge(t)} ${esc(short(t))} — who gets the ball</h3><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th>Player</th><th>Target share</th><th>Snaps</th><th>Tgts/g L3</th></tr></thead><tbody>
      ${R.map(r=>`<tr><td><a href="#" class="pl-go" data-pl="${esc(r[0])}" style="color:inherit">${esc(r[0])}</a> <span class="small">${r[1]}</span></td><td><b>${r[3]}%</b> ${arr(r[2],r[3])}<div class="small">season ${r[2]}%</div></td><td>${Math.round(r[5])}% ${arr(r[4],r[5])}</td><td>${r[6]}${r[1]==="RB"&&r[9]?`<div class="small">${r[9]} carries</div>`:""}</td></tr>`).join("")}</tbody></table></div>
      ${injOut.length?`<div class="small" style="margin-top:6px">🚑 Out this week: <b>${injOut.map(esc).join(", ")}</b> — their targets go to the players above; watch the ▲ trends.</div>`:""}</div>`};
  const a=out(g.away),h=out(g.home);if(!a&&!h)return "";
  return `<div class="section"><h2>Target & snap share</h2><p class="small" style="margin-top:-6px">Last 3 games (big number) vs season. Target share = % of the team's passes thrown his way; snaps = % of offensive plays he's on the field. ▲▼ = rising or falling role. Source: nflverse.</p>
   <div class="grid g2">${a}${h}</div></div>`;
}
function nfNextCard(g){if(!NFX)return "";
  return `<div class="section grid g2"><div class="card"><h2>${esc(short(g.away))} — next games</h2>${nfNextHtml(g.away)}</div><div class="card"><h2>${esc(short(g.home))} — next games</h2>${nfNextHtml(g.home)}</div></div>`}

/* ---------- NFL: next week's schedule (from NFL_NEXT) ---------- */
function nfWeekGames(wk){const out=[];if(!NFX)return out;
  for(const [t,L] of Object.entries(NFL_NEXT))for(const [w,d,op,ha,tm] of L)if(w===wk&&ha==="H")out.push({away:op,home:t,d,tm});
  return out.sort((a,b)=>(a.d+a.tm).localeCompare(b.d+b.tm));}
function nfWeekTabs(cur){const wk=typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:0;
  return `<div class="gtabs"><a href="#games" class="${cur==="games"?"on":""}">This week · Wk ${wk}</a><a href="#nextweek" class="${cur==="nextweek"?"on":""}">Next week · Wk ${wk+1}<small>${nfWeekGames(wk+1).length}</small></a></div>`}
function viewNextWeek(){
  const host=document.getElementById("v-nextweek");if(!host)return;const wk=(typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:0)+1,G=nfWeekGames(wk);
  const thisWk=SLATE.flatMap(g=>[g.away,g.home]);const byes=Object.keys(TEAMS).filter(t=>!G.some(g=>g.away===t||g.home===t));
  const fmt=(d,tm)=>{const ds=new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});if(!tm)return ds;let [h,m]=tm.split(":").map(Number);const ap=h>=12?"PM":"AM";h=h%12||12;return `${ds} · ${h}:${String(m).padStart(2,"0")} ${ap} ET`};
  const divOf=t=>NFX?Object.keys(NFL_DIV).find(k=>NFL_DIV[k].includes(t)):null;
  const outs=t=>(INJ[t]||[]).filter(x=>(x[2]==="Out"||/IR|Reserve|PUP/.test(x[2]))&&["QB","RB","WR","TE"].includes(x[1])).map(x=>esc(x[0])+" ("+x[1]+")");
  const card=g=>{const o=[...outs(g.away),...outs(g.home)];const div=divOf(g.away)&&divOf(g.away)===divOf(g.home);
    return `<div class="card game nw"><div class="when"><span>${fmt(g.d,g.tm)}</span>${div?`<span class="tag real">Division game</span>`:""}</div>
      <div class="tm">${badge(g.away)}<span class="nm">${TEAMS[g.away]?TEAMS[g.away][0]:g.away}<small>${recTxt(g.away)}</small></span></div>
      <div class="tm" style="margin-top:8px">${badge(g.home)}<span class="nm">${TEAMS[g.home]?TEAMS[g.home][0]:g.home}<small>${recTxt(g.home)}</small></span></div>
      ${o.length?`<div class="pubmini">🚑 Out right now: ${o.slice(0,6).join(", ")}${o.length>6?"…":""}</div>`:""}</div>`};
  host.innerHTML=`<h1>NFL · Week ${wk}</h1>${nfWeekTabs("nextweek")}
   <p class="sub">${G.length} games. Lookahead spreads and totals post Sunday night, and player props Tuesday–Wednesday — they show up on the This week tab once the week rolls over.</p>
   <div class="games">${G.map(card).join("")||`<div class="card">Schedule not posted yet.</div>`}</div>
   ${byes.length&&G.length?`<p class="note" style="margin-top:10px">On bye: ${byes.map(t=>esc(short(t))).join(", ")}</p>`:""}`;
}

/* ---------- Receiver matrix: target map + production matchup + coverage (nfl_tgt.js) ---------- */
const NF_ZR=[["D","Deep","20+ yds"],["I","Intermediate","10–19 yds"],["S","Short","0–9 yds"],["B","Behind LOS","screens, swings"]],NF_ZC=[["L","Left"],["M","Middle"],["R","Right"]];
function nfZoneGrid(z,tot,title,sub){
  if(!tot)return `<div class="small">No targets logged yet.</div>`;
  const pc=n=>Math.round((n||0)/tot*100),col=c=>NF_ZR.reduce((s,[r])=>s+(z[r+c]||0),0),row=r=>NF_ZC.reduce((s,[c])=>s+(z[r+c]||0),0),mx=Math.max(...Object.values(z),1);
  const cell=(r,c)=>{const n=z[r+c]||0,a=n/mx;return `<div class="tz${n?"":" none"}" style="background:${n?`rgba(126,226,160,${(0.08+a*0.62).toFixed(2)})`:"transparent"}"><b>${pc(n)}%</b>${n?`<span>${n}</span>`:""}</div>`};
  return `<div class="tzw"><div class="tzt"><b>${title}</b><span class="small">${sub}</span></div>
   <div class="tzg"><div class="tzh">Area<br><span>share of targets</span></div>${NF_ZC.map(([c,l])=>`<div class="tzh">${l}<br><b>${pc(col(c))}%</b></div>`).join("")}
   ${NF_ZR.map(([r,l,s])=>`<div class="tzr${r==="B"?" los":""}"><b>${l}</b><span>${s}</span><b>${pc(row(r))}%</b></div>${NF_ZC.map(([c])=>cell(r,c)).join("")}`).join("")}</div>
   <div class="small tzl">Brighter = more targets · small number = targets · gold line = line of scrimmage</div></div>`;
}
function nfMatrixCard(pl,opp){
  if(typeof NFL_TGT==="undefined"||!["WR","TE","RB"].includes(pl.pos))return "";const P=NFL_TGT[pl.name];if(!P)return "";
  const D=opp&&NFL_DEFTGT[opp]?NFL_DEFTGT[opp][pl.pos]:null,LG=NFL_LGTGT[pl.pos],pw=POSNAME[pl.pos]||pl.pos;
  const st=k=>S.prop["mx_"+k];const view=st("v")||"him";
  const met=[["Targets / game",s=>s.gp?s.t/s.gp:null,1,"",0],["Catch rate",s=>s.t?s.rec/s.t*100:null,0,"%",1],["Yards per target",s=>s.t?s.yds/s.t:null,1,"",1],["Target depth (aDOT)",s=>s.t?s.ay/s.t:null,1," yds",0],["YAC per catch",s=>s.rec?s.yac/s.rec:null,2,"",1],["First downs / 100 targets",s=>s.t?s.fd/s.t*100:null,1,"",1],["Contested catch %",s=>s.ct?s.cc/s.ct*100:null,1,"%",1]];
  const cmp=(v,l,hi)=>v==null||l==null||!hi?"":v>l*1.08?"g":v<l*0.92?"r":"y";
  const rows=met.map(([lab,f,dp,u,hi],i)=>{const a=f(P),b=D?f(D):null,c=LG?f(LG):null,fx=v=>v==null?"—":v.toFixed(dp)+u;
    return `<tr><td>${lab}</td><td><b>${fx(a)}</b></td>${D?`<td class="${i===0?"":cmp(b,c,hi)}">${i===0?"—":fx(b)}</td>`:""}<td>${i===0?"—":fx(c)}</td></tr>`}).join("");
  const cov=opp&&typeof DEF_COV!=="undefined"?DEF_COV[opp]:null,man=cov?Math.round(cov[0]/(cov[0]+cov[1])*100):null,bl=opp&&typeof NFL_BLITZ!=="undefined"?NFL_BLITZ[opp]:null;
  const blv=Object.values(typeof NFL_BLITZ!=="undefined"?NFL_BLITZ:{}),blLg=blv.length?blv.reduce((a,b)=>a+b,0)/blv.length:null;
  const zone=view==="opp"&&D?nfZoneGrid(D.z,D.t,`Where ${esc(short(opp))} allow targets to ${pw}`,`${D.t} targets · weeks ${NFL_TGT_WEEKS}`):nfZoneGrid(P.z,P.t,`Where ${esc(pl.name)} gets targeted`,`${P.t} targets in ${P.gp} games · weeks ${NFL_TGT_WEEKS}`);
  return `<div class="section"><div class="card nfmx"><h2 style="margin-bottom:4px">Target map & matchup</h2>
   <div class="small" style="margin-bottom:10px">From every 2026 pass thrown his way (NFL play-by-play) and FTN charting for contested balls and blitzes.</div>
   ${cov?`<div class="cvb"><div class="cvh"><b>${esc(short(opp))} coverage</b><span class="small">${bl!=null?`blitz on <b>${bl}%</b> of dropbacks${blLg!=null?` (NFL avg ${blLg.toFixed(0)}%, FTN)`:""} · `:""}coverage: Sharp Football</span></div>
     <div class="cvbar"><div style="width:${man}%"><b>${man}%</b> Man</div><div style="width:${100-man}%"><b>${100-man}%</b> Zone</div></div></div>`:""}
   ${D?`<div class="gtabs" style="margin:12px 0 8px"><a href="#" class="${view==="him"?"on":""}" data-mx="him">${esc(pl.name.split(" ").slice(-1)[0])}'s targets</a><a href="#" class="${view==="opp"?"on":""}" data-mx="opp">${esc(short(opp))} vs ${pl.pos}s</a></div>`:""}
   ${zone}
   <h3 style="margin:14px 0 6px">Production matchup</h3>
   <div><table class="mxt"><thead><tr><th>Metric</th><th>${esc(pl.name.split(" ").slice(-1)[0])}</th>${D?`<th>${esc(short(opp))} allow</th>`:""}<th>NFL ${pl.pos}</th></tr></thead><tbody>${rows}</tbody></table></div>
   <div class="small" style="margin-top:6px">"${D?esc(short(opp))+" allow":""}" = what ${pw} have done against them this season. <span class="up">Green</span> = more than the NFL average (good for him), <span class="dn">red</span> = less. Player stats vs man or zone aren't in public data, so we show the defense's coverage mix instead.</div></div></div>`;
}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-mx]");if(!b)return;e.preventDefault();if(typeof S==="undefined"||!S.prop)return;S.prop.mx_v=b.dataset.mx;const y=scrollY;viewPlayer();scrollTo(0,y)});
