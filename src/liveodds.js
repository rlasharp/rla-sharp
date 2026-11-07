/* ---------- ⚡ Live odds from data/live_odds.json (GitHub Action + PropLine, every ~30 min) ----------
   Merges real sportsbook lines into NBA_PROPS / REAL_PROPS, keeps the open line to show ▲▼ moves.
   The bundled daily data stays as the fallback when the file is missing (e.g. the private copy). */
const LO={data:null,move:{},alt:{},pick:{},openAlt:null,applied:0,nba:0,nfl:0};
function loNorm(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g,"").replace(/[^a-z]/g,"")}
let LO_IDX=null;
function loIdx(){if(LO_IDX)return LO_IDX;const nba={},nfl={};
  if(typeof NBA_LOGS!=="undefined")for(const nm in NBA_LOGS)nba[loNorm(nm)]=nm;
  if(typeof PINFO!=="undefined")for(const nm in PINFO)nfl[loNorm(nm)]=nm;
  return LO_IDX={nba,nfl}}
function loMoveTag(nm,k,line){if(LO.pick[nm+"|"+k]!=null)return loAltChip(nm,k);const m=LO.move[nm+"|"+k];if(!m)return "";
  if(m.l!=null&&m.l!==line)return `<span class="lmv ${line>m.l?"up":"dn"}" title="Opened at ${m.l} today">${line>m.l?"▲":"▼"} from ${m.l}</span>`;
  if(m.o!=null&&m.oNow!=null&&Math.abs(m.oNow-m.o)>=10)return `<span class="lmv fl" title="Over price opened ${m.o>0?"+":""}${m.o}">price ${m.oNow>m.o?"↑":"↓"} ${m.o>0?"+":""}${m.o}→${m.oNow>0?"+":""}${m.oNow}</span>`;
  return ""}
function loApply(d){
  const I=loIdx();let nNba=0,nNfl=0;LO.move={};LO.alt={};
  const nb=d.nba||{},nf=d.nfl||{};
  if(typeof NBA_PROPS!=="undefined"&&nb.props&&typeof NBA_SLATE_DATE!=="undefined"){
    const today=new Set((nb.events||[]).filter(e=>e.date===NBA_SLATE_DATE).map(e=>String(e.id)));
    const pos={};NBA_PROPS.forEach((r,i)=>pos[r[0]+"|"+r[1]]=i);
    for(const r of nb.props){if(!today.has(String(r[13])))continue;const nm=I.nba[loNorm(r[0])];if(!nm||!NBA_MK[r[1]])continue;
      const row=[nm,r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9]];while(row.length&&row[row.length-1]==null&&row.length>6)row.pop();
      const k=nm+"|"+r[1];if(k in pos)NBA_PROPS[pos[k]]=row;else{pos[k]=NBA_PROPS.length;NBA_PROPS.push(row)}
      LO.move[k]={l:r[10],o:r[11],u:r[12],oNow:r[3],uNow:r[4],now:r[2],sp:"nba",nm,k:r[1]};if(Array.isArray(r[14])&&r[14].length)LO.alt[k]=r[14];nNba++}
    if(typeof NB!=="undefined"){NB._best=null}
  }
  if(typeof REAL_PROPS!=="undefined"&&nf.props&&typeof SLATE!=="undefined"){
    const teams=new Set(SLATE.filter(g=>!g.final).flatMap(g=>[g.away,g.home]));
    /* only use each player's line for his CURRENT game (e.g. tonight's Monday night game, not next week's) */
    const full=t=>(TEAMS[t]&&TEAMS[t][0]||"").toLowerCase(),evOK={};
    for(const e of nf.events||[])evOK[String(e.id)]=[String(e.home||"").toLowerCase(),String(e.away||"").toLowerCase()];
    const curEv=nm=>{const P=PINFO[nm],o=P&&typeof oppOf!=="undefined"&&oppOf(P.team);return o?[full(o.g.home),full(o.g.away)]:null};
    for(const r of nf.props){const nm=I.nfl[loNorm(r[0])];if(!nm||!MARKETS[r[1]])continue;const P=PINFO[nm];if(!P||!teams.has(P.team))continue;
      const ev=evOK[String(r[13])],ce=curEv(nm);if(ev&&ce&&!(ev[0]===ce[0]&&ev[1]===ce[1]))continue;
      if(typeof pLogs!=="undefined"&&!pLogs(nm).length)continue;
      REAL_PROPS[nm+"|"+r[1]]=[r[2],r[3],r[4],r[5]];LO.move[nm+"|"+r[1]]={l:r[10],o:r[11],u:r[12],oNow:r[3],uNow:r[4],now:r[2],sp:"nfl",nm,k:r[1]};if(Array.isArray(r[14])&&r[14].length)LO.alt[nm+"|"+r[1]]=r[14];nNfl++}
    if(typeof NFL_BEST_C!=="undefined")NFL_BEST_C=null;
  }
  LO.nba=nNba;LO.nfl=nNfl;return nNba+nNfl}
function loAgo(){if(!LO.data)return "";const m=Math.max(0,Math.round((Date.now()-Date.parse(LO.data.updated))/60000));return m<1?"just now":m<60?m+" min ago":Math.round(m/60)+" h ago"}
function loBadge(){return LO.data&&(LO.nba||LO.nfl)?`<div class="upd lo">⚡ Live sportsbook odds · updated <b>${loAgo()}</b> · ${LO.nba?LO.nba+" NBA":""}${LO.nba&&LO.nfl?" + ":""}${LO.nfl?LO.nfl+" NFL":""} lines</div>`:""}
function loRerender(){const y=scrollY;if(typeof route==="function")route();scrollTo(0,y)}
async function loFetch(first){
  if(location.protocol==="file:")return;
  try{const r=await fetch("data/live_odds.json",{cache:"no-store"});if(!r.ok)return;const d=await r.json();if(!d||!d.updated)return;
    if(LO.data&&LO.data.updated===d.updated)return;
    LO.data=d;const n=loApply(d);if(!n)return;
    if(first||!LO.applied){LO.applied=1;loRerender();return}
    let b=document.getElementById("loPill");if(!b){b=document.createElement("button");b.id="loPill";document.body.appendChild(b);b.onclick=()=>{b.remove();loRerender()}}
    b.textContent="🔄 New odds — tap to update";
  }catch(e){}}
window.addEventListener("load",()=>{setTimeout(()=>loFetch(true),300);setInterval(()=>loFetch(false),5*60*1000)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loFetch(false)});

/* ---------- 🪜 Alternate lines (other lines books post for the same prop; best price per line across books) ----------
   vals = his recent results for this stat (oldest→newest) so each rung shows how often it would have hit. */
/* picked alt line (tap a row): the charts, hit rates and odds on that prop switch to it; tap main to go back */
function loAltOdds(nm,k){const key=nm+"|"+k,p=LO.pick[key];if(p==null)return null;const r=(LO.alt[key]||[]).find(x=>x[0]===p);
  return r?{line:p,o:r[1],ob:r[2],u:r[3],ub:r[4]}:{line:p,o:null,ob:null,u:null,ub:null}}
function loLine(nm,k,line){const a=loAltOdds(nm,k);return a?a.line:line}
/* − / + stepper: walks the real alt ladder when books post one, otherwise moves the line by 1 (5 for yards; no odds for those) */
function loStep(nm,k,main){if(main==null||!Number.isFinite(+main))return "";const key=esc(nm+"|"+k),cur=loLine(nm,k,main);
  const b=(d,t)=>`<button class="alsb" data-altkey="${key}" data-main="${main}" onclick="event.stopPropagation();loAltStep(this.dataset.altkey,${d},+this.dataset.main)" title="${t}" aria-label="${t}">${d<0?"−":"+"}</button>`;
  return `<span class="alst">${b(-1,"Lower the line")}${b(1,"Raise the line")}</span>`}
function loAltStep(key,d,main){const cur=LO.pick[key]!=null?LO.pick[key]:main,k=key.split("|").pop();d=d*(/Yds$|^rushRec$/.test(k)?5:1);
  const L=[...new Set([main,...(LO.alt[key]||[]).map(r=>r[0])])].sort((a,b)=>a-b);let nx;
  if(L.length>1){const i=L.findIndex(x=>x===cur);nx=i<0?(d>0?L.find(x=>x>cur):[...L].reverse().find(x=>x<cur)):L[i+Math.sign(d)];
    if(nx==null)nx=cur+d}
  else nx=cur+d;
  nx=Math.round(nx*2)/2;if(nx<0)return;loAltPick(key,nx===main?null:nx,1)}
function loAltChip(nm,k){const a=loAltOdds(nm,k);if(!a)return "";
  return `<span class="altc">🪜 Alt line${a.o==null&&a.u==null?" · no book odds":""}<button class="altx" data-altkey="${esc(nm+"|"+k)}" onclick="event.stopPropagation();loAltPick(this.dataset.altkey,null)" title="Back to the main line">✕ main</button></span>`}
function loAltPick(key,line,keepClosed){if(line==null)delete LO.pick[key];else LO.pick[key]=line;LO.openAlt=keepClosed?LO.openAlt:key;loRerender()}
/* every new page starts from the normal (main) line */
window.addEventListener("hashchange",()=>{LO.pick={};LO.openAlt=null});
function loAltClick(e){e.stopPropagation();const tr=e.target.closest("[data-alt]");if(!tr)return;
  const key=tr.dataset.alt,l=tr.dataset.l===""?null:+tr.dataset.l;loAltPick(key,LO.pick[key]===l?null:l)}
function loAltHtml(nm,k,line,vals){
  const key=nm+"|"+k,A=LO.alt[key];if(!A||!A.length)return "";
  const pr=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
  const AB={DraftKings:"DK",FanDuel:"FD",BetMGM:"MGM",Caesars:"CZR",Fanatics:"FAN","ESPN BET":"ESPN",BetRivers:"BR","Hard Rock Bet":"HR",Unibet:"UNI"};
  const bk=b=>b?`<span class="alb" title="${esc(b)}">${esc(AB[b]||b)}</span>`:"",mv=LO.move[key]||{},main=mv.now!=null?mv.now:line,pick=LO.pick[key];
  const V=(vals||[]).filter(Number.isFinite),R=[...A,[main,mv.oNow,null,mv.uNow,null,1]].sort((a,b)=>a[0]-b[0]);
  const hit=l=>{if(!V.length)return "";const o=V.filter(v=>v>l).length,p=o/V.length;return `<span class="${p>=.5?"up":"dn"}">${o}/${V.length}</span>`};
  const ak=esc(key),open=LO.openAlt===key;
  return `<details class="alt"${open?" open":""} onclick="loAltClick(event)"><summary>🪜 Alt lines (${A.length})${pick!=null?` · <span class="altn">showing ${pick}</span>`:""}</summary>
   <div class="small" style="margin:4px 0 2px">👆 Tap a line (or use − / + next to the line) to see it in the charts and hit rates. Leaving the page puts it back to the normal line.</div>
   <div class="alw"><table class="altt"><thead><tr><th>Line</th><th>Over</th><th>Under</th>${V.length?`<th title="Last ${V.length} games over this line">L${V.length} over</th>`:""}</tr></thead><tbody>
   ${R.map(r=>{const isM=!!r[5],on=isM?pick==null:pick===r[0];
     return `<tr class="alr${isM?" alm":""}${on?" on":""}" data-alt="${ak}" data-l="${isM?"":r[0]}"><td><b>${r[0]}</b>${isM?' <span class="small">main</span>':""}</td><td>${pr(r[1])}${bk(r[2])}</td><td>${pr(r[3])}${bk(r[4])}</td>${V.length?`<td>${hit(r[0])}</td>`:""}</tr>`}).join("")}
   </tbody></table></div><div class="small" style="margin-top:4px">Lower and higher lines than the main one, best price per line across licensed US books. Longer odds = less likely — alt lines are fun but riskier; bet small.</div></details>`}

/* ---------- 📈 Biggest line moves today (open = first line the feed saw today) ---------- */
function loMoves(sp,n){
  const out=[];for(const m of Object.values(LO.move)){if(m.sp!==sp||m.l==null||m.now==null)continue;
    if(sp==="nba"){const p=NBA_LOGS[m.nm],g=p&&nbaGameOf(p.tm);if(!g||nbaStarted(g))continue}
    else{const P=PINFO[m.nm],o=P&&oppOf(P.team);if(!o||nflStarted(o.g))continue}
    const dl=m.now-m.l,dp=m.oNow!=null&&m.o!=null?m.oNow-m.o:0;if(!dl&&Math.abs(dp)<20)continue;
    out.push({...m,dl,dp,score:Math.abs(dl)/Math.max(4,Math.abs(m.l))*100+(dl?10:0)+Math.abs(dp)/10})}
  return out.sort((a,b)=>b.score-a.score).slice(0,n)}
function loMovesCard(sp,n){
  if(!LO.data)return "";const L=loMoves(sp,n||8);if(!L.length)return "";
  const mk=m=>sp==="nba"?(NBA_MK[m.k]?NBA_MK[m.k][1]:m.k):(MARKETS[m.k]?MARKETS[m.k].n:m.k);
  const pr=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
  const row=m=>{const href=sp==="nba"?`#nba-player-${encodeURIComponent(m.nm)}`:"#props";
    const what=m.dl?`<b>${m.l} → ${m.now}</b> <span class="lmv ${m.dl>0?"up":"dn"}">${m.dl>0?"▲":"▼"} ${Math.abs(m.dl)}</span>`:`<b>${m.now}</b> <span class="lmv fl">over ${pr(m.o)} → ${pr(m.oNow)}</span>`;
    const why=m.dl>0?"books moved it up — money on the over":m.dl<0?"books moved it down — money on the under":m.dp<0?"over getting pricier":"under getting pricier";
    return `<a class="lmr" href="${href}" ${sp==="nfl"?`data-nflfav="${esc(m.nm)}"`:""}><span><b>${esc(m.nm)}</b> <span class="small">${esc(mk(m))}</span></span><span>${what}</span><span class="small">${why}</span></a>`};
  return `<div class="card lmc"><h2 style="margin-bottom:2px">📈 Biggest ${sp.toUpperCase()} line moves today</h2><div class="small" style="margin-bottom:8px">Since the first line we saw this morning · live sportsbook odds, updated ${loAgo()}. Big moves often follow injury news or sharp money.</div>${L.map(row).join("")}</div>`}
