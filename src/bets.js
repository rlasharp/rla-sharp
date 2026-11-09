
/* ---------- My Bets: per-viewer bet tracker (saved in this browser only) ---------- */
// Bet: {id,k:"prop"|"spread"|"ml"|"total",wk,odds(American),est(bool odds assumed),stake,added,
//       prop: player,market,side,line,team | game bets: game,away,home,team,side,line}
const BETS_WEEK=(typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:Math.max(...RESULTS.map(r=>r[0]))+1);
function betsLoad(){return LS.get("bets",[])}
function betsSave(a){LS.set("bets",a)}
function betStakeDefault(){return LS.get("betStake",10)}
function betTitle(b){
  if(b.k==="soc")return b.title||"Soccer bet";
  if(b.k==="nbaprop"){const m=typeof NBA_MK!=="undefined"&&NBA_MK[b.market];return `${b.player} ${b.side==="over"?"Over":"Under"} ${b.line} ${m?m[1]:b.market}`}
  if(b.k==="nhlprop"){const m=typeof NH_MK!=="undefined"&&NH_MK[b.market];if(b.market==="hanyG")return `${b.player} anytime goal`;return `${b.player} ${b.side==="over"?"Over":"Under"} ${b.line} ${m?m[1].toLowerCase():b.market}`}
  if(b.k==="parlay")return `${b.legs.length}-leg parlay`;
  if(b.k==="prop"){const m=MARKETS[b.market];if(b.market==="anyTD")return `${b.player} anytime TD`;
    return `${b.player} ${b.side==="over"?"Over":"Under"} ${b.line} ${m?m.n.toLowerCase().replace(/\btds\b/,"TDs"):b.market}`}
  if(b.k==="spread")return `${TEAMS[b.team][0]} ${b.line>0?"+":""}${b.line}`;
  if(b.k==="ml")return `${TEAMS[b.team][0]} moneyline`;
  return `${short(b.away)} @ ${short(b.home)} ${b.side==="over"?"Over":"Under"} ${b.line}`}
function betMatchup(b){if(b.k==="nhlprop")return `NHL · ${b.team} ${b.home?"vs":"@"} ${b.opp} · ${typeof nhDayS!=="undefined"?nhDayS(b.date):b.date}`;
  if(b.k==="nbaprop")return `NBA · ${b.team} ${b.home?"vs":"@"} ${b.opp} · ${typeof nbaDayS!=="undefined"?nbaDayS(b.date):b.date}`;
  if(b.k==="parlay")return b.legs.map(l=>betTitle(l)).join(" + ");
  if(b.k==="prop"){const o=b.team&&oppOf(b.team);return o?`${short(b.team)} ${o.home?"vs":"at"} ${short(o.opp)} · ${o.g.when}`:short(b.team||"")}
  const g=SLATE.find(x=>x.id===b.game);return `${short(b.away)} @ ${short(b.home)}${g?" · "+g.when:""}`}
const betDec=a=>a>0?1+a/100:1+100/(-a);
/* our own data first; if it has no result yet, a game ESPN already marked final is graded live (finals.js) */
function gradeBet(b){const g=gradeBetCore(b);if(g.r!=="pending"||b.k==="parlay"||typeof finBet==="undefined")return g;return finBet(b)||g}
function gradeBetCore(b){
  if(b.k==="soc")return typeof socGrade!=="undefined"?socGrade(b):{r:"pending"};
  if(b.k==="nhlprop"){if(typeof NH_MK==="undefined")return {r:"pending"};const m=NH_MK[b.market],w=nhWho(b.player);
    const fin=(NHL_RES||[]).some(z=>z[0]===b.date&&(z[1]===b.team||z[3]===b.team));
    const row=w&&w.g.find(x=>x[0]===b.date);if(!row||!m||!m[3])return fin?(w&&!row?{r:"void",why:"Did not play — no action"}:{r:"pending",why:"Result not in our data"}):{r:"pending"};
    const v=m[3](row);if(v==null)return {r:"pending"};const r=v===b.line?"push":((b.side==="over")===(v>b.line))?"win":"loss";return {r,why:`Final: ${v}`}}
  if(b.k==="nbaprop"){const p=typeof NBA_LOGS!=="undefined"&&NBA_LOGS[b.player],x=p&&p.g.find(y=>y[1]===b.date&&(!b.opp||y[2]===b.opp));
    if(!x){const done=typeof NBA_RES!=="undefined"&&NBA_RES.some(z=>z[1]===b.date&&(z[2]===b.team||z[3]===b.team));return done?{r:"void",why:"Did not play — no action"}:{r:"pending"}}
    const v=nbaVal(x,b.market),r=v===b.line?"push":((b.side==="over")===(v>b.line))?"win":"loss";return {r,why:`Final: ${v}`}}
  if(b.k==="parlay"){const G=b.legs.map(gradeBet);if(G.some(g=>g.r==="loss"))return {r:"loss",why:`${G.filter(g=>g.r==="win").length}/${G.length} legs hit`};
    if(G.some(g=>g.r==="pending"))return {r:"pending",why:`${G.filter(g=>g.r==="win").length}/${G.length} legs won so far`};
    const live=b.legs.filter((l,i)=>G[i].r==="win");if(!live.length)return {r:"push",why:"All legs pushed or voided"};
    return {r:"win",why:`All ${live.length} live legs hit`}}
  if(b.k==="prop"){const lg=pLogs(b.player).find(l=>l.season===CUR&&l.week===b.wk);
    const played=RESULTS.some(r=>r[0]===b.wk&&(r[1]===b.team||r[3]===b.team));
    if(!lg)return played?{r:"void",why:"Did not play — no action"}:{r:"pending"};
    const v=stat(lg,b.market);if(!Number.isFinite(v))return {r:"pending"};
    const r=v===b.line?"push":((b.side==="over")===(v>b.line))?"win":"loss";
    return {r,why:`Final: ${v} ${MARKETS[b.market]?MARKETS[b.market].u:""}`}}
  const res=RESULTS.find(r=>r[0]===b.wk&&r[1]===b.away&&r[3]===b.home);if(!res)return {r:"pending"};
  const ap=res[2],hp=res[4],why=`Final: ${short(b.away)} ${ap}, ${short(b.home)} ${hp}`;
  if(b.k==="ml"){const w=ap>hp?b.away:hp>ap?b.home:null;return {r:w===null?"push":w===b.team?"win":"loss",why}}
  if(b.k==="spread"){const me=b.team===b.away?ap:hp,op=b.team===b.away?hp:ap,m=me-op+b.line;return {r:m>0?"win":m<0?"loss":"push",why}}
  const t=ap+hp;return {r:t===b.line?"push":((b.side==="over")===(t>b.line))?"win":"loss",why}}
function betProfit(b,g){g=g||gradeBet(b);
  if(b.k==="parlay"&&g.r==="win"){const G=b.legs.map(gradeBet),d=b.legs.reduce((a,l,i)=>a*(G[i].r==="win"?betDec(l.odds):1),1);return b.stake*(d-1)}
  return g.r==="win"?b.stake*(betDec(b.odds)-1):g.r==="loss"?-b.stake:0}
function addBet(spec){const a=betsLoad();
  const key=JSON.stringify([spec.k,spec.player,spec.market,spec.side,spec.game,spec.team,spec.line,spec.date,spec.legs&&spec.legs.map(l=>l.key||betTitle(l))]);
  const wk=spec.wk||BETS_WEEK;
  if(a.some(b=>b.key===key&&b.wk===wk)){toast("Already in My Bets");return}
  const b=Object.assign({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),key,wk,stake:betStakeDefault(),added:Date.now()},spec);
  if(b.odds==null){b.odds=-110;b.est=true}
  a.push(b);betsSave(a);toast("Added to My Bets: "+betTitle(b));updateBetsBadge()}
function updateBetsBadge(){const n=betsLoad().filter(b=>gradeBet(b).r==="pending").length;const a=document.querySelector('#nav a[data-v="bets"]');if(a)a.textContent=n?`My Bets (${n})`:"My Bets"}
// small button HTML; spec is JSON in a data attribute (handled by one delegated listener)
function betBtn(spec,label){return `<button class="btn betbtn" data-act='${esc(JSON.stringify(spec))}' title="Track or add to parlay">＋ ${label||"My Bets"}</button>`}
function shareBtn(spec,label){return `<button class="btn betbtn" data-share='${esc(JSON.stringify(spec))}' title="Share as image">⤴ ${label||"Share"}</button>`}
document.addEventListener("click",e=>{
  const t=e.target.closest&&e.target.closest("[data-bet],[data-share]");if(!t)return;
  e.preventDefault();e.stopPropagation();
  try{if(t.dataset.bet)addBet(JSON.parse(t.dataset.bet));else shareCard(JSON.parse(t.dataset.share))}catch(err){toast("Something went wrong: "+err.message)}},true);

// spec builders used across the site
function specProp(player,market,side){const P=PINFO[player]||{};const rp=realProp(player,market);
  const line=lineFor(player,market);const odds=rp?(side==="over"?rp[1]:rp[2]):null;
  const o=P.team&&typeof oppOf!=="undefined"?oppOf(P.team):null,date=o&&typeof nflDate!=="undefined"?nflDate(o.g):null;
  return {k:"prop",player,market,side,line,team:P.team,pos:P.pos,odds,book:rp?rp[3]:null,date}}
function specGame(g,k,teamOrSide){const L=LINES[g.id];
  if(k==="ml")return {k,game:g.id,away:g.away,home:g.home,team:teamOrSide,odds:teamOrSide===g.away?L.ml[0]:L.ml[1]};
  if(k==="spread")return {k,game:g.id,away:g.away,home:g.home,team:teamOrSide,line:teamOrSide===g.home?L.sp:-L.sp,odds:-110,est:true};
  return {k:"total",game:g.id,away:g.away,home:g.home,side:teamOrSide,line:L.tot,odds:-110,est:true}}
function specFromPlay(pl){if(pl.type==="prop")return specProp(pl.player,pl.market,pl.side);
  const g=SLATE.find(x=>x.id===pl.game);return specGame(g,pl.type==="total"?"total":pl.type,pl.type==="total"?pl.side:pl.team)}

function viewBets(){
  const a=betsLoad(),el=$("#v-bets");const gs=a.map(b=>({b,g:gradeBet(b)}));
  const set=gs.filter(x=>x.g.r!=="pending"),pend=gs.filter(x=>x.g.r==="pending");
  const W=set.filter(x=>x.g.r==="win").length,Lo=set.filter(x=>x.g.r==="loss").length,P=set.filter(x=>x.g.r==="push"||x.g.r==="void").length;
  const prof=set.reduce((s,x)=>s+betProfit(x.b,x.g),0),risk=set.filter(x=>x.g.r==="win"||x.g.r==="loss").reduce((s,x)=>s+x.b.stake,0);
  const money=v=>(v<0?"−$":"$")+Math.abs(v).toFixed(2);
  const row=({b,g})=>{const c=RES_COL[g.r];const pr=betProfit(b,g);
    return `<div class="card betrow"><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap">
      <span class="ptag" style="background:${c}22;color:${c}">${RES_TXT[g.r]}</span><span class="small">${b.k==="nbaprop"||b.k==="nhlprop"||b.k==="parlay"?"":"Week "+b.wk+" · "}${esc(betMatchup(b))}</span></div>
     <h3 style="margin:8px 0 2px">${esc(betTitle(b))}</h3>
     <div data-clv="${b.id}" style="margin-top:4px"></div>
     <div class="small">Odds ${amTxt(b.odds)}${b.est?" (assumed — exact price not published)":""}${b.book?" · "+esc(b.book):""}${g.why?` · <b style="color:${c}">${esc(g.why)}</b>`:""}</div>
     <div class="row" style="gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
      <label class="small">Stake $ <input type="number" min="0" step="1" value="${b.stake}" data-stake="${b.id}" style="width:80px"></label>
      <span class="small">${g.r==="pending"?`To win ${money(b.stake*(betDec(b.odds)-1))}`:`Result ${money(pr)}`}</span><span class="sp"></span>
      ${shareBtn(b)}<button class="btn" data-rm="${b.id}">Remove</button></div></div>`};
  el.innerHTML=`<h1>My Bets</h1>
   <p class="sub">Tap <b>＋ My Bets</b> on any play, prop or game line to track it here. Bets grade themselves after the game. Saved on this device only — nobody else can see them.</p>
   <div id="clvSum"></div>
   <div class="grid g4" style="margin:6px 0 14px">
    <div class="card" style="padding:12px"><small class="small">Record</small><b style="display:block;font-size:22px">${W}–${Lo}${P?"–"+P:""}</b></div>
    <div class="card" style="padding:12px"><small class="small">Profit</small><b style="display:block;font-size:22px;color:${prof>0?"#22c55e":prof<0?"#f05252":"inherit"}">${money(prof)}</b></div>
    <div class="card" style="padding:12px"><small class="small">ROI</small><b style="display:block;font-size:22px">${risk?(prof/risk*100).toFixed(1)+"%":"—"}</b></div>
    <div class="card" style="padding:12px"><small class="small">Pending</small><b style="display:block;font-size:22px">${pend.length}</b></div></div>
   <div class="row" style="gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><label class="small">Default stake for new bets $ <input type="number" min="0" step="1" id="betDef" value="${betStakeDefault()}" style="width:80px"></label>
    ${a.length?'<span class="sp"></span><button class="btn" id="betClear">Clear all</button>':""}</div>
   ${a.length?`${pend.length?`<h2>Pending</h2><div class="grid g2">${pend.slice().reverse().map(row).join("")}</div>`:""}
     ${set.length?`<h2 style="margin-top:18px">Settled</h2><div class="grid g2">${set.slice().reverse().map(row).join("")}</div>`:""}`
    :`<div class="card"><p class="note" style="margin:0">No bets yet. Tap any <b>odds button</b> on an NBA prop (Best props, player pages) or <b>＋ My Bets</b> on NFL plays, props and games — then choose <b>Track</b> or <b>Add to parlay</b>.</p></div>`}
   <p class="note" style="margin-top:12px">For tracking only — this site doesn't take bets. 21+ (18+ in some states). Gambling problem? Call or text 1-800-GAMBLER. In Canada: Quebec 18+, Jeu : aide et référence 1-800-461-0140 · Ontario 19+, ConnexOntario 1-866-531-2600.</p>`;
  const d=$("#betDef");if(d)d.onchange=()=>{LS.set("betStake",Math.max(0,+d.value||0))};
  el.querySelectorAll("[data-stake]").forEach(i=>i.onchange=()=>{const a=betsLoad(),b=a.find(x=>x.id===i.dataset.stake);if(b){b.stake=Math.max(0,+i.value||0);betsSave(a);viewBets()}});
  el.querySelectorAll("[data-rm]").forEach(x=>x.onclick=()=>{betsSave(betsLoad().filter(b=>b.id!==x.dataset.rm));updateBetsBadge();viewBets()});
  const cl=$("#betClear");if(cl)cl.onclick=()=>{if(cl.dataset.sure){betsSave([]);updateBetsBadge();viewBets()}else{cl.dataset.sure=1;cl.textContent="Tap again to clear all"}};
;if(typeof xClvDecorate!=="undefined")setTimeout(xClvDecorate,50)}

/* ---------- Share a pick as an image (drawn on a canvas, nothing uploaded) ---------- */
function shareInfo(s){
  const tag={prop:"PLAYER PROP",spread:"SPREAD",ml:"MONEYLINE",total:"OVER / UNDER"}[s.k];
  const lines=[];
  if(s.k==="prop"){const vals=pLogs(s.player).filter(l=>l.season===CUR).map(l=>stat(l,s.market)).filter(Number.isFinite);
    if(vals.length){const hit=vals.filter(v=>s.side==="over"?v>s.line:v<s.line).length;const av=vals.reduce((a,b)=>a+b,0)/vals.length;
      lines.push(`${hit} of ${vals.length} games ${s.market==="anyTD"?"with a TD":(s.side==="over"?"over ":"under ")+s.line} this season`);
      lines.push(`Season average ${av.toFixed(1)} ${MARKETS[s.market].u}`);lines.push(`Last ${Math.min(5,vals.length)}: ${vals.slice(-5).join(" · ")}`)}}
  else{const g=SLATE.find(x=>x.id===s.game);if(g){const x=projScore(g);
    lines.push(`Model: ${short(g.away)} ${x.a} – ${short(g.home)} ${x.h}`);lines.push(`${short(x.win)} ${x.winP}% to win · projected total ${x.total}`);
    lines.push(`Records: ${short(g.away)} ${teamRec(g.away).str} · ${short(g.home)} ${teamRec(g.home).str}`)}}
  return {tag,title:betTitle(s),odds:`Odds ${amTxt(s.odds==null?-110:s.odds)}${s.odds==null||s.est?" (est.)":""}`,match:betMatchup(s),lines}}
function shareCard(s){
  const I=shareInfo(s),W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  const F='"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#0b0d10");bg.addColorStop(1,"#131a24");x.fillStyle=bg;x.fillRect(0,0,W,H);
  const lg=x.createLinearGradient(80,80,220,170);lg.addColorStop(0,"#22c55e");lg.addColorStop(1,"#3987e5");x.fillStyle=lg;
  const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
  rr(80,80,150,96,22);x.fill();x.fillStyle="#fff";x.font=`900 52px ${F}`;x.textBaseline="middle";x.fillText("RLA",104,130);
  x.font=`800 56px ${F}`;x.fillText("Sharp",252,130);
  x.fillStyle="#22c55e33";rr(80,240,x.measureText(I.tag).width+60,64,32);x.font=`800 30px ${F}`;const tw=x.measureText(I.tag).width;rr(80,240,tw+60,64,32);x.fill();
  x.fillStyle="#7fdc95";x.fillText(I.tag,110,273);
  // title (wrapped)
  x.fillStyle="#fff";x.font=`800 76px ${F}`;let y=390;const wrap=(t,maxW,lh)=>{const ws=t.split(" ");let ln="";ws.forEach(w=>{const tt=ln?ln+" "+w:w;if(x.measureText(tt).width>maxW&&ln){x.fillText(ln,80,y);y+=lh;ln=w}else ln=tt});if(ln){x.fillText(ln,80,y);y+=lh}};
  wrap(I.title,W-160,90);
  x.fillStyle="#fab219";x.font=`700 46px ${F}`;y+=10;x.fillText(I.odds,80,y);y+=70;
  x.fillStyle="#9aa3b2";x.font=`500 38px ${F}`;wrap(I.match,W-160,50);y+=30;
  x.strokeStyle="#2a2f3a";x.lineWidth=3;x.beginPath();x.moveTo(80,y);x.lineTo(W-80,y);x.stroke();y+=70;
  x.fillStyle="#e6e8eb";x.font=`600 42px ${F}`;I.lines.forEach(l=>{x.fillStyle="#22c55e";x.fillText("•",80,y);x.fillStyle="#e6e8eb";const sy=y;y=sy;const save=80;x.save();x.translate(44,0);wrap(l,W-204,56);x.restore();y+=14});
  x.fillStyle="#6b7280";x.font=`500 30px ${F}`;x.fillText("Research, not a guarantee · 21+ · 1-800-GAMBLER",80,H-150);
  x.fillStyle="#9aa3b2";x.font=`700 34px ${F}`;x.fillText("rlasharp.github.io/rla-sharp",80,H-95);
  const url=c.toDataURL("image/png"),name=("rla-sharp-"+I.title).toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,60)+".png";
  let m=document.getElementById("shareModal");if(m)m.remove();m=document.createElement("div");m.id="shareModal";m.className="modal";
  m.innerHTML=`<div class="mbox"><div class="row" style="align-items:center"><h2 style="margin:0">Share this pick</h2><span class="sp"></span><button class="btn" id="smClose">✕</button></div>
    <img src="${url}" alt="${esc(I.title)}" style="width:100%;border-radius:12px;margin:12px 0;display:block">
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn pri" id="smShare">Share…</button><button class="btn" id="smDl">Download image</button></div>
    <p class="small" style="margin:8px 0 0">On a phone you can also press and hold the image to save it.</p></div>`;
  document.body.appendChild(m);
  m.onclick=e=>{if(e.target===m)m.remove()};$("#smClose").onclick=()=>m.remove();
  const sb=$("#smShare");$("#smDl").onclick=()=>c.toBlob(bl=>bl&&uxSave(bl,name),"image/png");
  c.toBlob(bl=>{const f=bl&&typeof File!=="undefined"?new File([bl],name,{type:"image/png"}):null;
    if(!(f&&navigator.canShare&&navigator.canShare({files:[f]})))sb.style.display="none";
    else sb.onclick=()=>navigator.share({files:[f],title:I.title,text:I.title+" — RLA Sharp"}).catch(()=>{})},"image/png");
}
