/* ---------- Shared pages: combined record, beginner guide; share images; install-as-app ---------- */

/* ===== Combined record (NFL Plays of the Week + NBA Plays of the day) ===== */
function recAll(){
  const rows=[];
  if(typeof nbaRecord!=="undefined"){for(const x of nbaRecord().rows){const [d,nm,k,side,line,odds]=x.r;
    let st=x.st,u0=x.u||0,v=x.v,lv=0;if(st==="pending"&&typeof finProp!=="undefined"&&NBA_LOGS[nm]){const g=finProp("nba",d,NBA_LOGS[nm].tm,nm,k,side,line);if(g){st=g.r;v=g.v;lv=1;u0=st==="win"?(odds>0?odds/100:100/-(odds||-110)):st==="loss"?-1:0}}
    rows.push({sport:"NBA",when:d,sort:d,date:d,label:`${nm} ${side==="o"?"Over":"Under"} ${line} ${NBA_MK[k]?NBA_MK[k][1]:k}`,type:"Player prop",st,u:u0,odds,v,lv,cl:{sp:"nba",nm,k,side,line,odds,dates:[d]}})}}
  if(typeof TRACK!=="undefined"&&TRACK&&TRACK.sum&&TRACK.sum.nhl){for(const x0 of TRACK.sum.nhl.recent||[]){const L=!x0.r&&typeof finItem!=="undefined"?finItem("nhl",x0.d,x0):null,x=L?{...x0,r:L.r,v:L.v}:x0;const st=x.r==="win"?"win":x.r==="loss"?"loss":x.r==="push"?"push":x.r==="void"?"void":"pending";const pay=x.odds>0?x.odds/100:100/-x.odds;
    rows.push({sport:"NHL",when:x.d,sort:x.d,date:x.d,label:typeof nhlPlayTitle!=="undefined"?nhlPlayTitle(x).replace(/<[^>]+>/g,""):"",type:x.type==="prop"?"Player prop":x.mk,st,u:st==="win"?pay:st==="loss"?-1:0,odds:x.odds,v:x.v,lv:L?1:0,cl:null})}}
  if(typeof TRACK!=="undefined"&&TRACK&&TRACK.sum&&TRACK.sum.soc){for(const x0 of TRACK.sum.soc.recent||[]){const g=(!x0.r||x0.r==="pending")&&typeof socGrade!=="undefined"&&window.SOC_OK?socGrade(x0):null,r=g&&g.r!=="pending"?g.r:x0.r;
    const st=r==="win"?"win":r==="loss"?"loss":r==="push"?"push":r==="void"?"void":"pending",pay=x0.odds>0?x0.odds/100:100/-x0.odds;
    rows.push({sport:"Soccer",when:x0.d,sort:x0.d,date:x0.d,label:x0.title||"",type:x0.type==="prop"?"Player prop":({ml:"Match result",tot:"Goals over/under",btts:"Both teams to score",cor:"Corners"}[x0.kind]||"Soccer"),st,u:st==="win"?pay:st==="loss"?-1:0,odds:x0.odds,v:null,lv:g?1:0,cl:null})}}
  if(typeof PLAY_ARCHIVE!=="undefined"&&typeof gradeOne!=="undefined"){
    const tn={prop:"Player prop",spread:"Spread",ml:"Moneyline",total:"Over / Under"};
    const add=(pl,wk,d)=>{const g=gradeOne(pl,wk,d),odds=pl.odds!=null?pl.odds:d?d.odds:null;
      const sun=nflWeekDate(wk),dd=[-3,0,1].map(n=>{const x=new Date(sun+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)});
      rows.push({sport:"NFL",when:"Week "+wk,sort:"w"+String(wk).padStart(2,"0"),date:sun,label:pl.title||(d&&d.title)||"",type:tn[pl.type]||"Other",st:g.r,u:unitsFor(g.r,odds),odds,
        cl:pl.type==="prop"&&pl.line!=null?{sp:"nfl",nm:pl.player,k:pl.market,side:pl.side==="over"?"o":"u",line:pl.line,odds,dates:dd}:null})};
    Object.entries(PLAY_ARCHIVE).forEach(([wk,a])=>a.forEach(pl=>add(pl,+wk,null)));
    if(typeof PLAYS!=="undefined")PLAYS.forEach(pl=>add(pl,PLAYS_WEEK,playData(pl)));
  }
  return rows;
}
/* NFL week -> that week's Sunday (2026: Week 1 Sunday = Sep 13) */
function nflWeekDate(wk){const d=new Date(Date.UTC((typeof CUR!=="undefined"?CUR:2026),8,13+7*(wk-1)));return d.toISOString().slice(0,10)}
function recChart(R){
  const G=R.filter(r=>r.st==="win"||r.st==="loss"||r.st==="push").sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  if(G.length<2)return `<div class="small" style="padding:10px 0">The profit chart appears once a few plays are graded.</div>`;
  const pts=[];let u=0,nfl=0,nba=0;const P={all:[0],NFL:[0],NBA:[0]};
  for(const r of G){u+=r.u;if(r.sport==="NFL")nfl+=r.u;else nba+=r.u;P.all.push(u);P.NFL.push(nfl);P.NBA.push(nba)}
  const W=600,H=190,pad=28,all=[...P.all,...P.NFL,...P.NBA],mx=Math.max(1,...all),mn=Math.min(-1,...all);
  const X=i=>pad+(W-pad*2)*i/(G.length),Y=v=>H-pad-(H-pad*2)*(v-mn)/(mx-mn);
  const line=(a,c,w)=>`<polyline fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" points="${a.map((v,i)=>X(i).toFixed(1)+","+Y(v).toFixed(1)).join(" ")}"/>`;
  const last=P.all[P.all.length-1];
  return `<svg class="rchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Units won over time">
   <line x1="${pad}" x2="${W-pad}" y1="${Y(0)}" y2="${Y(0)}" stroke="#3a3f47" stroke-dasharray="4 4"/>
   <text x="${pad}" y="${Y(0)-4}" fill="#7c828c" font-size="11">0u</text>
   ${line(P.NFL,"#8cc0ff",1.5)}${line(P.NBA,"#ffb36b",1.5)}${line(P.all,last>=0?"#3fb26b":"#e5534b",3)}
   <text x="${W-pad}" y="${Y(last)-6}" fill="#fff" font-size="13" font-weight="700" text-anchor="end">${last>0?"+":""}${last.toFixed(2)}u</text>
   <text x="${pad}" y="${H-6}" fill="#7c828c" font-size="11">${G[0].date}</text><text x="${W-pad}" y="${H-6}" fill="#7c828c" font-size="11" text-anchor="end">${G[G.length-1].date}</text></svg>
   <div class="small"><b style="color:${last>=0?"#3fb26b":"#e5534b"}">━</b> All plays · <b style="color:#8cc0ff">━</b> NFL · <b style="color:#ffb36b">━</b> NBA — cumulative units, 1 unit per play, in order of game date.</div>`;
}
function recSum(rows){const t={win:0,loss:0,push:0,void:0,pending:0,u:0};for(const r of rows){t[r.st]=(t[r.st]||0)+1;t.u+=r.u||0}t.g=t.win+t.loss;return t}
function recLine(t){return `${t.win}-${t.loss}${t.push?"-"+t.push:""}`}
function viewRecord(){if(typeof nhlEnsure!=="undefined"&&!NHL_READY&&!NHL_DATE){nhlEnsure(()=>{if((location.hash||"").slice(1)==="record")viewRecord()})}
  const RA=recAll(),host=document.getElementById("v-record"),F=window.RECF||(window.RECF={per:"all",sp:"all"});
  const etDay=o=>{const d=new Date(Date.now()-(o||0)*864e5);return d.toLocaleDateString("en-CA",{timeZone:"America/New_York"})},td=etDay(0),yd=etDay(1),wk=etDay(6);
  const perOk=r=>F.per==="all"||!r.date?F.per==="all":F.per==="today"?r.date===td:F.per==="yday"?r.date===yd:r.date>=wk&&r.date<=td;
  const R=RA.filter(r=>perOk(r)&&(F.sp==="all"||r.sport===F.sp)),T=recSum(R);
  const PER=[["today","Today"],["yday","Yesterday"],["week","Last 7 days"],["all","All time"]],SPS=[["all","All sports"],...["NFL","NBA","NHL","Soccer"].filter(k=>RA.some(r=>r.sport===k)).map(k=>[k,k])];
  const perL=(PER.find(x=>x[0]===F.per)||PER[3])[1];
  const fbar=`<div class="recf"><div class="seg">${PER.map(([k,l])=>`<button class="btn${F.per===k?" on":""}" data-recp="${k}">${l}</button>`).join("")}</div><div class="seg">${SPS.map(([k,l])=>`<button class="btn${F.sp===k?" on":""}" data-recs="${k}">${({NFL:"🏈 ",NBA:"🏀 ",NHL:"🏒 ",Soccer:"⚽ "}[k]||"")+l}</button>`).join("")}</div></div>`;
  const tile=(l,v,c)=>`<div><b class="${c||""}">${v}</b>${l}</div>`;
  const uTxt=u=>(u>0?"+":"")+u.toFixed(2)+"u",uCls=u=>u>0?"up":u<0?"dn":"";
  const grp=(key)=>{const m={};for(const r of R){const k=key(r);(m[k]=m[k]||[]).push(r)}return Object.entries(m).map(([k,a])=>[k,recSum(a)])};
  const tbl=(title,G)=>`<div class="card"><h2 style="margin-bottom:8px">${title}</h2><div class="nbatbl"><table class="bxt" style="min-width:0"><thead><tr><th></th><th>Record</th><th>Hit %</th><th>Units</th><th>Pending</th></tr></thead><tbody>
    ${G.map(([k,t])=>`<tr><td><b>${esc(k)}</b></td><td>${recLine(t)}</td><td>${t.g?Math.round(t.win/t.g*100)+"%":"–"}</td><td class="${uCls(t.u)}">${uTxt(t.u)}</td><td>${t.pending||""}</td></tr>`).join("")}</tbody></table></div></div>`;
  const chip={win:["W","o"],loss:["L","u"],push:["P","p"],void:["Void","p"],pending:["Pending","p"]};
  const recent=R.slice().sort((a,b)=>(b.st==="pending")-(a.st==="pending")||b.sort.localeCompare(a.sort));
  const bySp=grp(r=>r.sport),play=r=>`<div class="rcr"><span class="lc ${chip[r.st]?chip[r.st][1]:"p"} rcc">${chip[r.st]?chip[r.st][0]:r.st}</span><div style="flex:1;min-width:0"><b>${esc(r.label)}</b><div class="small">${r.sport} · ${esc(r.sport==="NBA"?nbaDayS(r.when):r.when)}${r.odds!=null?" · "+oddsFmt(r.odds):""}${r.v!=null?" · finished "+r.v:""}${r.lv?` <span class="livegr" title="Graded from ESPN's final box score — made official at the next site update">⚡</span>`:""}</div></div><span class="${uCls(r.u)}">${r.st==="pending"?"":uTxt(r.u)}</span></div>`;
  const ic={NFL:"🏈",NBA:"🏀",NHL:"🏒",Soccer:"⚽"};
  host.innerHTML=`<h1>Our record</h1>
  <p class="sub">Every pick we post, graded from official results. Wins and losses both stay up · 1 unit per play.</p>
  ${fbar}${F.per!=="all"||F.sp!=="all"?`<div class="small" style="margin:-4px 0 8px">Showing <b>${perL.toLowerCase()}</b>${F.per==="today"?` (${td})`:""}${F.sp!=="all"?` · <b>${esc(F.sp)}</b> only`:""}${R.length?"":" — no plays yet"}.</div>`:""}
  <div class="card rec"><div class="recs">${tile("Record",recLine(T))}${tile("Hit rate",T.g?Math.round(T.win/T.g*100)+"%":"–")}${tile("Units",uTxt(T.u),uCls(T.u))}</div>
   <div class="recsp">${bySp.map(([k,t])=>`<span class="recchip">${ic[k]||""} <b>${esc(k)}</b> ${recLine(t)} <em class="${uCls(t.u)}">${uTxt(t.u)}</em></span>`).join("")}</div>
   <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center"><button class="btn" id="recShare">📤 Share</button><span class="small">${T.pending?`${T.pending} pending · `:""}pushes and no-plays don't count</span></div></div>
  <div class="card" style="margin-top:14px"><h2 style="margin-bottom:6px">📈 Profit over time</h2>${recChart(R)}</div>
  ${typeof xInsights!=="undefined"?xInsights("rec","📒 The details",[
    ["plays","📋 Plays",`<div class="card"><h2>x</h2><div id="recList" class="reclist">${recent.map(play).join("")||`<div class="small">No plays yet.</div>`}</div>${recent.length>12?`<button class="btn" id="recMore" style="width:100%;margin-top:8px">Show all ${recent.length}</button>`:""}</div>`],
    ["sport","📊 By sport",`<div class="card"><h2>x</h2>${tbl("By sport",bySp).replace(/^<div class="card">/,"<div>")}${tbl("By bet type",grp(r=>r.sport+" · "+r.type)).replace(/^<div class="card">/,'<div style="margin-top:12px">')}</div>`],
    ["nums","🎯 Our numbers",(typeof xTrackCard!=="undefined"?xTrackCard():"")+(typeof xCalCard!=="undefined"?xCalCard().replace(/^\s*<div class="card[^"]*"[^>]*>/,'<div style="margin-top:14px">'):"")],
    ["clv","💹 Closing line",`<div class="card"><h2>x</h2><div id="clvCard">${clvCardHtml(R)}</div></div>`]]):""}
  <p class="note" style="margin-top:10px">Past results don't guarantee future results. Bet small.</p>`;
  host.querySelectorAll("[data-recp]").forEach(b=>b.onclick=()=>{F.per=b.dataset.recp;viewRecord()});host.querySelectorAll("[data-recs]").forEach(b=>b.onclick=()=>{F.sp=b.dataset.recs;viewRecord()});
  {const m=document.getElementById("recMore");if(m)m.onclick=()=>{document.getElementById("recList").classList.add("all");m.remove()}}
  clvLoad(R).then(ch=>{if(ch){const c=document.getElementById("clvCard");if(c)c.innerHTML=clvCardHtml(R)}});
  document.getElementById("recShare").onclick=()=>shareImage({title:"Our record",sub:"NFL Plays of the Week + NBA Plays of the day",
    rows:[{a:F.per==="all"&&F.sp==="all"?"Overall":[F.sp!=="all"?F.sp:"",F.per!=="all"?perL:""].filter(Boolean).join(" · "),b:recLine(T),c:uTxt(T.u)},...grp(r=>r.sport).map(([k,t])=>({a:k,b:recLine(t),c:uTxt(t.u)}))],file:"rla-sharp-record.png"});
}

/* ===== Beginner guide ===== */
function viewGuide(){
  const host=document.getElementById("v-guide");
  const sec=(t,b)=>`<div class="card gd"><h2>${t}</h2>${b}</div>`;
  host.innerHTML=`<h1>Betting 101</h1><p class="sub">New to sports betting? Everything on this site in plain English — 5 minutes to read.</p>
  <div class="grid g2">
  ${sec("💵 Moneyline — who wins",`<p>You just pick the winner. The number tells you the payout on a $100 bet.</p>
   <ul><li><b>−150</b> (favorite): bet $150 to win $100.</li><li><b>+130</b> (underdog): bet $100 to win $130.</li></ul>
   <p class="small">Minus = favorite, plus = underdog. Your stake comes back too when you win.</p>`)}
  ${sec("📏 Spread — win by how much",`<p>The favorite has to win by <b>more</b> than the number; the underdog can lose by less (or win).</p>
   <ul><li><b>Lakers −6.5</b>: Lakers must win by 7+.</li><li><b>Raptors +6.5</b>: Raptors win the bet if they lose by 6 or less, or win.</li></ul>
   <p class="small">A whole number (like −6) can land exactly — that's a <b>push</b>: your money back.</p>`)}
  ${sec("➕ Total (over / under)",`<p>Bet whether both teams' points <b>added together</b> go over or under the number.</p>
   <ul><li><b>Total 227.5</b>: 115–113 = 228 → <b>Over</b> wins.</li></ul>`)}
  ${sec("🧑 Player props",`<p>Bets on one player's numbers: points, rebounds, passing yards, a touchdown…</p>
   <ul><li><b>Doncic over 33.5 points</b>: he needs 34+.</li><li><b>P+R+A</b> = points + rebounds + assists added up.</li></ul>
   <p class="small">On this site, green boxes = games he went over the line, red = under.</p>`)}
  ${sec("🧃 The juice (vig)",`<p>Most bets are priced <b>−110</b>: bet $110 to win $100. That extra $10 is the sportsbook's cut.</p>
   <p>It means you must win about <b>52.4%</b> of −110 bets just to break even — winning half isn't enough.</p>`)}
  ${sec("🎯 Odds → chance",`<p>Every price hides a win chance:</p>
   <ul><li>−110 ≈ 52% · −150 = 60% · −200 = 67%</li><li>+100 = 50% · +150 = 40% · +200 = 33%</li></ul>
   <p class="small">Our "hit score" vs "odds need" compares how often a bet would have hit with the chance the price needs.</p>`)}
  ${sec("📦 Units & bankroll",`<p>A <b>unit</b> is your standard bet size — usually 1–2% of the money you set aside for betting.</p>
   <ul><li>$500 bankroll → 1 unit ≈ $5–10.</li><li>Our record counts every play as 1 unit, so you can compare fairly.</li></ul>
   <p class="small">Never chase losses by betting bigger.</p>`)}
  ${sec("🎰 Parlays",`<p>Several bets in one ticket — <b>all</b> must win. The payout is big because the chance is small.</p>
   <ul><li>Two −110 bets ≈ +264 but only ~27% to hit.</li><li>Three legs ≈ +596, ~14%.</li></ul>
   <p class="small">Fun, but the book's edge stacks up with every leg.</p>`)}
  ${sec("📈 Line movement",`<p>Lines move when money or news comes in. A spread going from −4.5 to −6.5 means bettors (often pros) are on that team, or an injury hit the other side.</p>
   <p class="small">🔥 on our game cards = a big move (1.5+ on a spread, 3+ on a total).</p>`)}
  ${sec("🧭 How to use this site",`<ul><li><b>⭐ Plays of the day / week</b>: our strongest leans, locked before games and graded on the record.</li>
   <li><b>🔥 Best props</b>: every posted line ranked by past hit rate vs the price.</li>
   <li><b>Player pages</b>: last games vs each line, splits, and where he scores.</li>
   <li><b>Game pages</b>: offense vs defense, edges, injuries, head-to-head.</li></ul>
   <p class="small">Everything here is research from past numbers — leans, never guarantees.</p>`)}
  </div>
  <div class="card gd" style="margin-top:14px" id="sources"><h2>🔎 Where our data comes from</h2>
   <p><b>NFL:</b> scores, player stats, snap counts and play-by-play from nflverse (open data) and ESPN; injuries from ESPN (every listed player); lines and odds from ScoresAndOdds and the sportsbooks; team stats from ESPN/NFL.com; weather forecasts for outdoor stadiums.</p>
   <p><b>NBA:</b> box scores, play-by-play, rosters and schedule from hoopR/sportsdataverse (ESPN data); game lines from ESPN (DraftKings); player props from covers.com sportsbook listings (DraftKings, FanDuel, BetMGM, Caesars, bet365 and more); injuries and depth charts from ESPN.</p>
   <p><b>Live scores:</b> ESPN's public scoreboard. <b>Picks, projections and "hit scores"</b> are our own model built only from these numbers — estimates, never guarantees.</p></div>
  <div class="card gd" style="margin-top:14px;border-color:#5a2328"><h2>❤️ Bet responsibly</h2>
   <p>Set a budget before you start and treat it as the cost of entertainment. Don't bet to win back losses, and take breaks.</p>
   <p><b>21+ (18+ in some states). Gambling problem? Call or text 1-800-GAMBLER.</b><br>Canada: Quebec 18+, Jeu : aide et référence 1-800-461-0140 · Ontario 19+, ConnexOntario 1-866-531-2600.</p></div>
  <div class="card gd" style="margin-top:14px"><h2>📲 Get the app</h2>${installHtml()}</div>`;
  wireInstall(host);
}

/* ===== Share images (canvas → phone share sheet or download) ===== */
function siteUrl(){return /^https?:/.test(location.protocol)&&/github\.io$/.test(location.hostname)?location.host+location.pathname.replace(/index\.html$/,""):"rlasharp.github.io/rla-sharp"}
function shareWrap(ctx,text,x,y,maxW,lh){const words=String(text).split(" ");let line="",n=0;for(const w of words){const t=line?line+" "+w:w;if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,y+n*lh);n++;line=w}else line=t}if(line){ctx.fillText(line,x,y+n*lh);n++}return n}
async function shareImage(o){
  const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#1d1a10");g.addColorStop(.35,"#121418");g.addColorStop(1,"#0d0f12");x.fillStyle=g;x.fillRect(0,0,W,H);
  if(typeof drawLogo!=="undefined")drawLogo(x,72,52,84);x.fillStyle="#f3c75a";x.font="800 46px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";x.fillText("RLA SHARP",172,110);
  x.fillStyle="#9aa0aa";x.font="500 30px system-ui,sans-serif";x.fillText(o.kicker||new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}),72,160);
  x.fillStyle="#ffffff";x.font="800 70px system-ui,sans-serif";shareWrap(x,o.title,72,262,W-144,78);
  x.fillStyle="#c7cbd2";x.font="500 32px system-ui,sans-serif";shareWrap(x,o.sub||"",72,330,W-144,42);
  let y=420;const rows=(o.rows||[]).slice(0,6),bh=Math.min(170,Math.floor((H-y-210)/Math.max(1,rows.length))-18);
  rows.forEach((r,i)=>{x.fillStyle="#1c1f25";const rr=24;x.beginPath();x.roundRect?x.roundRect(72,y,W-144,bh,rr):x.rect(72,y,W-144,bh);x.fill();
    x.fillStyle="#f3c75a";x.beginPath();x.arc(124,y+bh/2,30,0,7);x.fill();x.fillStyle="#1a1608";x.font="800 32px system-ui,sans-serif";x.textAlign="center";x.fillText(String(i+1),124,y+bh/2+11);x.textAlign="left";
    const maxW=W-144-108-(r.c?170:40),fit=(t,w,px)=>{let f=px;do{x.font=`${w} ${f}px system-ui,sans-serif`;if(x.measureText(t).width<=maxW)break;f-=2}while(f>20);return t};
    x.fillStyle="#ffffff";x.fillText(fit(String(r.a),700,38),180,y+bh/2-14);
    x.fillStyle=r.col||"#7ee2a0";x.fillText(fit(String(r.b),700,34),180,y+bh/2+32);
    if(r.c){x.fillStyle="#f3c75a";x.font="800 40px system-ui,sans-serif";x.textAlign="right";x.fillText(String(r.c),W-100,y+bh/2+14);x.textAlign="left"}
    y+=bh+18});
  x.fillStyle="#7c828c";x.font="500 26px system-ui,sans-serif";shareWrap(x,"Leans from past numbers, not guarantees. 21+ · 1-800-GAMBLER",72,H-130,W-144,34);
  x.fillStyle="#ffffff";x.font="700 34px system-ui,sans-serif";x.fillText(siteUrl(),72,H-62);
  const blob=await new Promise(r=>c.toBlob(r,"image/png"));const file=new File([blob],o.file||"rla-sharp.png",{type:"image/png"});
  const text=`${o.title} — ${siteUrl()}`;
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:o.title,text});return}}catch(e){if(e&&e.name==="AbortError")return}
  if(await uxSave(blob,file.name)!=="saved")return;
  shareToast("Image saved — post it anywhere 📸");
}
function shareToast(t){let el=document.getElementById("shToast");if(!el){el=document.createElement("div");el.id="shToast";document.body.appendChild(el)}el.textContent=t;el.className="show";setTimeout(()=>el.className="",2600)}
function shareNbaPlays(){
  const TP=nbaTodayPlays(),P=TP.P;if(!P.length)return;
  shareImage({title:"NBA Plays of the day",kicker:nbaDay(NBA_SLATE_DATE),sub:"Our strongest leans tonight, picked from real posted lines.",file:"nba-plays-"+NBA_SLATE_DATE+".png",
    rows:P.map(b=>({a:b.nm,b:`${b.side==="o"?"Over":"Under"} ${b.line} ${NBA_MK[b.k][1]}`,c:oddsFmt(b.odds),col:b.side==="o"?"#7ee2a0":"#ff9a9d"}))});
}
function shareNflPlays(){
  const rows=PLAYS.map(pl=>{const d=playData(pl);if(!d)return null;
    if(pl.type==="prop")return {a:pl.player,b:`${pl.side==="over"?"Over":"Under"} ${d.line} ${MARKETS[pl.market]?MARKETS[pl.market].n:""}`,c:d.odds!=null?oddsFmt(d.odds):"",col:pl.side==="over"?"#7ee2a0":"#ff9a9d"};
    return {a:d.title,b:({spread:"Spread",total:"Total points",ml:"Moneyline"}[pl.type]||""),c:d.odds!=null?oddsFmt(d.odds):"",col:"#8cc0ff"}}).filter(Boolean);
  shareImage({title:`NFL Plays of the Week`,kicker:"Week "+PLAYS_WEEK,sub:"Our favourite spots this week, from the matchup data.",rows,file:"nfl-plays-week-"+PLAYS_WEEK+".png"});
}

/* ===== Install as an app (PWA) ===== */
let PWA_EVT=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();PWA_EVT=e;document.querySelectorAll(".pwaBtn").forEach(b=>b.hidden=false)});
function isStandalone(){return (window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone}
function installHtml(){
  if(isStandalone())return `<p>✅ You're using the app version. Nice.</p>`;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<p>Put RLA Sharp on your home screen — it opens full-screen like an app, with its own icon. Free, no app store.</p>
   <button class="btn pwaBtn" ${PWA_EVT?"":"hidden"}>📲 Install the app</button>
   <div class="small" style="margin-top:8px">${ios?"<b>iPhone / iPad:</b> open the site in Safari, tap the <b>Share</b> button (square with an arrow), then <b>Add to Home Screen</b>.":"<b>Android (Chrome):</b> tap the button above, or the ⋮ menu → <b>Install app</b> / <b>Add to Home screen</b>.<br><b>iPhone:</b> in Safari tap Share → <b>Add to Home Screen</b>."}</div>
   <div class="small" style="margin-top:6px">Works on the public site: ${siteUrl()}</div>`;
}
function wireInstall(root){root.querySelectorAll(".pwaBtn").forEach(b=>b.onclick=async()=>{if(!PWA_EVT)return;PWA_EVT.prompt();try{await PWA_EVT.userChoice}catch(e){}PWA_EVT=null;b.hidden=true})}
if("serviceWorker" in navigator&&/^https:/.test(location.protocol)&&/github\.io$/.test(location.hostname)){
  window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});
}

/* keep the active tab visible in the swipeable phone menu */
function navCenter(){document.querySelectorAll("nav:not([hidden]) a.on").forEach(a=>{const n=a.parentElement;if(n.scrollWidth>n.clientWidth)n.scrollLeft=a.offsetLeft-n.offsetLeft-n.clientWidth/2+a.offsetWidth/2})}
window.addEventListener("hashchange",()=>setTimeout(navCenter,80));window.addEventListener("load",()=>setTimeout(navCenter,200));


/* ===== 🎯 Closing line value: did we get a better number than the market's last pregame line? =====
   Closing lines come from data/close/<ET date>.json, written by the GitHub odds job every ~30 min
   (the last write before tip-off is the close). Public site only; starts Nov 2, 2026. */
const CLV={files:{},busy:{}};
function clvNorm(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\s*\([a-z]{2,4}\)\s*$/,"").replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g,"").replace(/[^a-z]/g,"")}
async function clvFile(d){if(d in CLV.files)return CLV.files[d];if(location.protocol==="file:")return CLV.files[d]=null;
  try{const r=await fetch(`data/close/${d}.json`,{cache:"no-store"});if(!r.ok)return CLV.files[d]=null;const j=await r.json(),m={};
    for(const [k,v] of Object.entries(j)){const [sp,nm,mk]=k.split("|");m[sp+"|"+clvNorm(nm)+"|"+mk]=v}return CLV.files[d]=m}catch(e){return CLV.files[d]=null}}
async function clvLoad(R){const ds=new Set();R.forEach(r=>r.cl&&r.cl.dates.forEach(d=>{if(!(d in CLV.files))ds.add(d)}));if(!ds.size)return false;await Promise.all([...ds].map(clvFile));return true}
function clvImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
function clvOf(c){
  if(!c)return null;let v=null;for(const d of c.dates){const f=CLV.files[d];if(f){v=f[c.sp+"|"+clvNorm(c.nm)+"|"+c.k];if(v)break}}if(!v)return null;
  const [L,o,u,book]=v,closeP=c.side==="o"?o:u;
  if(L!==c.line){const pts=c.side==="o"?L-c.line:c.line-L;return {pts,txt:`${pts>0?"+":""}${pts} pts`,beat:pts>0,close:`${c.side==="o"?"O":"U"} ${L}${closeP!=null?" "+oddsFmt(closeP):""}`,book}}
  const a=clvImp(c.odds),b=clvImp(closeP);if(a==null||b==null)return null;const pc=(b-a)*100;
  return {pc,txt:`${pc>0?"+":""}${pc.toFixed(1)}%`,beat:pc>0.05,even:Math.abs(pc)<=0.05,close:`${c.side==="o"?"O":"U"} ${L} ${oddsFmt(closeP)}`,book}}
function clvCardHtml(R){
  const L=R.filter(r=>r.cl).map(r=>({r,c:clvOf(r.cl)})).filter(x=>x.c);
  const intro=`<div class="small" style="margin-bottom:8px">Pros judge picks by whether they beat the <b>closing line</b> — the last price before the game, when the market knows the most. Getting a better number than the close, again and again, is the best sign of a real edge, even before wins and losses settle.</div>`;
  if(!L.length)return `<div class="card"><h2 style="margin-bottom:4px">🎯 Beat the closing line</h2>${intro}<div class="small">Tracking started Nov 2, 2026 — results appear here after each play's game starts. Works on the public site (rlasharp.github.io/rla-sharp).</div></div>`;
  const beat=L.filter(x=>x.c.beat).length,even=L.filter(x=>x.c.even).length,pts=L.filter(x=>x.c.pts!=null),avgPc=L.filter(x=>x.c.pc!=null);
  return `<div class="card rec"><h2 style="margin-bottom:4px">🎯 Beat the closing line</h2>${intro}
   <div class="recs"><div><b style="${beat*2<L.length?"color:#f0b429":""}" class="${beat*2>L.length?"up":""}">${beat}/${L.length}</b>Beat the close</div><div><b>${pts.length?(pts.reduce((s,x)=>s+x.c.pts,0)/pts.length).toFixed(1):"–"}</b>Avg pts gained</div><div><b>${avgPc.length?(avgPc.reduce((s,x)=>s+x.c.pc,0)/avgPc.length).toFixed(1)+"%":"–"}</b>Avg price edge</div></div>
   ${L.slice().sort((a,b)=>b.r.sort.localeCompare(a.r.sort)).slice(0,12).map(({r,c})=>{const res={win:["Won","o"],loss:["Lost","u"],push:["Push","p"],void:["Void","p"]}[r.st]||["Pending","p"];
     const amt=c.pts!=null?`${Math.abs(c.pts)} pt${Math.abs(c.pts)===1?"":"s"}`:`${Math.abs(c.pc).toFixed(1)}% in price`;
     const cl=c.beat?`<span class="clvb up">▲ ${amt} better than the close</span>`:c.even?`<span class="clvb">= same as the close</span>`:`<span class="clvb am">▼ ${amt} worse than the close</span>`;
     const u=r.st==="win"||r.st==="loss"?`${r.u>0?"+":""}${(+r.u).toFixed(2)}u`:"";
     return `<div class="rcr"><div style="flex:1;min-width:0"><b>${esc(r.label)}</b> <span class="small">${oddsFmt(r.cl.odds)}</span><div class="small">${r.sport} · ${esc(r.sport==="NBA"?nbaDayS(r.when):r.when)} · we posted ${esc((r.cl.side==="o"?"O ":"U ")+r.cl.line)} · closed ${esc(c.close)}${c.book?" ("+esc(c.book)+")":""}</div><div style="margin-top:3px">${cl}</div></div><div class="clvr"><span class="clvres ${res[1]}">${res[0]}</span>${u?`<b class="${r.u>0?"up":"dn"}">${u}</b>`:""}</div></div>`}).join("")}
   <div class="small" style="margin-top:6px">On the right: did the bet win, and the units. Underneath each play: did we get a better number than the closing line (▲ green) or a worse one (▼ amber) — a bet can win with a worse number, and lose with a better one. Points = how much better our line was than the closing line (for an Under, a higher line is better). % = how much more win-chance the closing price implied than the price we posted.</div></div>`;
}
