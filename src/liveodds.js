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
  let nNhl=0;const nh=d.nhl||{};
  if(typeof NHL_PROPS!=="undefined"&&nh.props&&typeof NHL_DATE!=="undefined"&&NHL_DATE){
    const days=new Set([NHL_DATE,NHL_TOM]),evd={};for(const e of nh.events||[])evd[String(e.id)]=e.date;
    const idx={};for(const nm of [...Object.keys(NHL_P),...Object.keys(NHL_G)])idx[loNorm(nm)]=nm;
    const pos={};NHL_PROPS.forEach((r,i)=>pos[r[0]+"|"+r[1]]=i);
    for(const r of nh.props){if(!days.has(evd[String(r[13])]))continue;const nm=idx[loNorm(r[0])];if(!nm)continue;
      const row=[nm,r[1],r[2],r[3],r[4],r[5]],k=nm+"|"+r[1];if(k in pos)NHL_PROPS[pos[k]]=row;else{pos[k]=NHL_PROPS.length;NHL_PROPS.push(row)}
      LO.move[k]={l:r[10],o:r[11],u:r[12],oNow:r[3],uNow:r[4],now:r[2],sp:"nhl",nm,k:r[1]};if(Array.isArray(r[14])&&r[14].length)LO.alt[k]=r[14];nNhl++}
    const full={};for(const [a,t] of Object.entries(NHL_TEAM))full[t.n]=a;
    for(const e of nh.events||[]){const a=full[e.away],h=full[e.home];const g=[...NHL_SLATE,...NHL_NEXT].find(x=>x.a===a&&x.h===h&&x.d===e.date);if(g)for(const k of ["ml","tot","pl"])if(e[k])g[k]=e[k]}
  }
  const nSoc=typeof socLoApply!=="undefined"?socLoApply(d):0;
  LO.nba=nNba;LO.nfl=nNfl;LO.nhl=nNhl;LO.soc=nSoc;return nNba+nNfl+nNhl+nSoc}
function loAgo(){if(!LO.data)return "";const m=Math.max(0,Math.round((Date.now()-Date.parse(LO.data.updated))/60000));return m<1?"just now":m<60?m+" min ago":Math.round(m/60)+" h ago"}
function loBadge(){return LO.data&&(LO.nba||LO.nfl)?`<div class="upd lo">⚡ Live sportsbook odds · updated <b>${loAgo()}</b> · ${LO.nba?LO.nba+" NBA":""}${LO.nba&&LO.nfl?" + ":""}${LO.nfl?LO.nfl+" NFL":""} lines</div>`:""}
/* full redraw; with an alt key, keep that prop's − / + exactly where it was on screen so the page doesn't jump */
function loRerender(key){const y=scrollY,fb=key?[...document.querySelectorAll(".alsb")].find(b=>b.dataset.altkey===key&&b.offsetParent):null,top=fb?fb.getBoundingClientRect().top:null;
  if(typeof route==="function")route();scrollTo(0,y);
  if(fb){const nb=[...document.querySelectorAll(".alsb")].find(b=>b.dataset.altkey===key&&b.offsetParent);if(nb)scrollBy(0,nb.getBoundingClientRect().top-top)}}
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
  const b=(d,t)=>`<button class="alsb" data-altkey="${key}" data-main="${main}" onclick="event.stopPropagation();loAltStep(this.dataset.altkey,${d},+this.dataset.main,this)" title="${t}" aria-label="${t}">${d<0?"−":"+"}</button>`;
  return `<span class="alst">${b(-1,"Lower the line")}${b(1,"Raise the line")}</span>`}
function loAltStep(key,d,main,btn){const cur=LO.pick[key]!=null?LO.pick[key]:main,k=key.split("|").pop();d=d*(/Yds$|^rushRec$/.test(k)?5:1);
  const L=[...new Set([main,...(LO.alt[key]||[]).map(r=>r[0])])].sort((a,b)=>a-b);let nx;
  if(L.length>1){const i=L.findIndex(x=>x===cur);nx=i<0?(d>0?L.find(x=>x>cur):[...L].reverse().find(x=>x<cur)):L[i+Math.sign(d)];
    if(nx==null)nx=cur+d}
  else nx=cur+d;
  nx=Math.round(nx*2)/2;if(nx<0)return;
  /* rebuilding the whole page costs ~200 ms on a phone, so quick taps lagged: show the new number right away (odds/hit rates dim)
     and rebuild once, when the taps stop */
  if(nx===main)delete LO.pick[key];else LO.pick[key]=nx;
  if(btn){const st=btn.closest(".alst"),box=st&&st.parentElement,card=btn.closest(".card,.pl")||box;
    const v=box&&box.classList.contains("pcv")?[...box.childNodes].find(n=>n.nodeType===3):st&&st.previousElementSibling&&st.previousElementSibling.classList.contains("plv")?st.previousElementSibling:null;
    if(v)v.textContent=String(nx);if(card)card.classList.add("lopend")}
  clearTimeout(LO.stepT);LO.stepT=setTimeout(()=>{if(!loSwapCards(key))loRerender(key)},btn?250:0)}
/* redraw only the card(s) for this prop (NBA prop cards) instead of the whole page: no lag, and nothing else moves */
function loSwapCards(key){if(typeof nbaPropCard==="undefined"||typeof NBA_PROPS==="undefined")return false;
  const i=key.lastIndexOf("|"),nm=key.slice(0,i),k=key.slice(i+1),r=NBA_PROPS.find(x=>x[0]===nm&&x[1]===k);if(!r)return false;
  const C=[...document.querySelectorAll(".card.prop[data-k]")].filter(c=>c.dataset.k===k&&c.dataset.nm===nm&&/^pc_/.test(c.id));
  if(!C.length)return false;
  /* this prop shows up elsewhere on the page too (a row on a game page, the alt-lines table) — those need the full redraw */
  if([...document.querySelectorAll(".alsb")].some(b=>b.dataset.altkey===key&&!C.some(c=>c.contains(b))))return false;
  try{for(const c of C){const w=document.createElement("div");w.innerHTML=nbaPropCard(r,/_p$/.test(c.id)?100:0);const n=w.firstElementChild;if(!n)return false;
      c.replaceWith(n);if(typeof nbaWireCharts!=="undefined")nbaWireCharts(n,()=>loRerender(key));if(typeof nbaWireBest!=="undefined")nbaWireBest(n)}
    return true}catch(e){return false}}
function loAltChip(nm,k){const a=loAltOdds(nm,k);if(!a)return "";
  return `<span class="altc">🪜 Alt line${a.o==null&&a.u==null?" · no book odds":""}<button class="altx" data-altkey="${esc(nm+"|"+k)}" onclick="event.stopPropagation();loAltPick(this.dataset.altkey,null)" title="Back to the main line">✕ main</button></span>`}
function loAltPick(key,line,keepClosed){if(line==null)delete LO.pick[key];else LO.pick[key]=line;LO.openAlt=keepClosed?LO.openAlt:key;loRerender()}
/* every new page starts from the normal (main) line */
window.addEventListener("hashchange",()=>{clearTimeout(LO.stepT);LO.pick={};LO.openAlt=null});
function loAltClick(e){e.stopPropagation();const tr=e.target.closest("[data-alt]");if(!tr)return;
  const key=tr.dataset.alt,l=tr.dataset.l===""?null:+tr.dataset.l;loAltPick(key,LO.pick[key]===l?null:l)}
function loAltHtml(nm,k,line,vals){
  const key=nm+"|"+k,A=LO.alt[key];if(!A||!A.length)return "";
  const pr=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
  const AB={DraftKings:"DK",FanDuel:"FD",BetMGM:"MGM",Caesars:"CZR",Fanatics:"FAN","ESPN BET":"ESPN",BetRivers:"BR","Hard Rock Bet":"HR",Unibet:"UNI"};
  const bk=b=>b?`<span class="alb" title="${esc(b)}">${esc(AB[b]||b)}</span>`:"",mv=LO.move[key]||{},main=mv.now!=null?mv.now:line,pick=LO.pick[key];
  const V=(vals||[]).filter(Number.isFinite),R=[...A,[main,mv.oNow,null,mv.uNow,null,1]].sort((a,b)=>a[0]-b[0]);
  const hit=l=>{if(!V.length)return "";const o=V.filter(v=>v>l).length,p=o/V.length;return `<span class="${p>=.5?"up":"dn"}">${o}/${V.length}</span>`};
  const ak=esc(key),open=LO.openAlt===key,bestHtml=(()=>{if(V.length<5)return "";const imp=o=>o==null?null:o<0?-o/(-o+100):100/(o+100);let best=null;
      for(const r of R){for(const [i,side] of [[1,"o"],[3,"u"]]){const pr=r[i];if(pr==null)continue;const h=V.filter(v=>side==="o"?v>r[0]:v<r[0]).length/V.length,val=h-imp(pr);if(val>.06&&(!best||val>best.val))best={l:r[0],side,pr,val,h}}}
      if(best)R.forEach(r=>{if(r[0]===best.l)r.best=best});return best?`<div class="altbest">⭐ Best value: <b>${best.side==="o"?"Over":"Under"} ${best.l}</b> at ${pr(best.pr)} — hit ${Math.round(best.h*100)}% of his last ${V.length} vs ${Math.round(imp(best.pr)*100)}% the price needs.</div>`:""})();
  return `<details class="alt"${open?" open":""} onclick="loAltClick(event)"><summary>🪜 Alt lines (${A.length})${bestHtml?' <span class="altn">⭐ value</span>':""}${pick!=null?` · <span class="altn">showing ${pick}</span>`:""}</summary>
   <div class="small" style="margin:4px 0 2px">👆 Tap a line (or use − / + next to the line) to see it in the charts and hit rates. Leaving the page puts it back to the normal line.</div>
   ${bestHtml}<div class="alw"><table class="altt"><thead><tr><th>Line</th><th>Over</th><th>Under</th>${V.length?`<th title="Last ${V.length} games over this line">L${V.length} over</th>`:""}</tr></thead><tbody>
   ${R.map(r=>{const isM=!!r[5],on=isM?pick==null:pick===r[0];
     return `<tr class="alr${isM?" alm":""}${on?" on":""}${r.best?" albest":""}" data-alt="${ak}" data-l="${isM?"":r[0]}"><td><b>${r[0]}</b>${isM?' <span class="small">main</span>':""}</td><td>${pr(r[1])}${bk(r[2])}</td><td>${pr(r[3])}${bk(r[4])}</td>${V.length?`<td>${hit(r[0])}</td>`:""}</tr>`}).join("")}
   </tbody></table></div><div class="small" style="margin-top:4px">Lower and higher lines than the main one, best price per line across licensed US books. Longer odds = less likely — alt lines are fun but riskier; bet small.</div></details>`}

/* ---------- 📈 Biggest line moves today (open = first line the feed saw today) ---------- */
function loMoves(sp,n){
  const out=[];for(const m of Object.values(LO.move)){if(m.sp!==sp||m.l==null||m.now==null)continue;
    if(sp==="nba"){const p=NBA_LOGS[m.nm],g=p&&nbaGameOf(p.tm);if(!g||nbaStarted(g))continue}
    else if(sp==="nhl"){const w=typeof nhWho!=="undefined"&&nhWho(m.nm),g=w&&nhGameOf(w.tm);if(!g||nhStarted(g))continue}
    else{const P=PINFO[m.nm],o=P&&oppOf(P.team);if(!o||nflStarted(o.g))continue}
    const dl=m.now-m.l,dp=m.oNow!=null&&m.o!=null?m.oNow-m.o:0;if(!dl&&Math.abs(dp)<20)continue;
    out.push({...m,dl,dp,score:Math.abs(dl)/Math.max(4,Math.abs(m.l))*100+(dl?10:0)+Math.abs(dp)/10})}
  return out.sort((a,b)=>b.score-a.score).slice(0,n)}
function loMovesCard(sp,n){
  if(!LO.data)return "";const L=loMoves(sp,n||8);if(!L.length)return "";
  const mk=m=>sp==="nba"?(NBA_MK[m.k]?NBA_MK[m.k][1]:m.k):sp==="nhl"?(NH_MK[m.k]?NH_MK[m.k][1]:m.k):(MARKETS[m.k]?MARKETS[m.k].n:m.k);
  const pr=x=>x==null?"–":(typeof oddsFmt!=="undefined"?oddsFmt(x):(x>0?"+":"")+x);
  const row=m=>{const href=sp==="nba"?`#nba-player-${encodeURIComponent(m.nm)}`:sp==="nhl"?`#nhl-player-${encodeURIComponent(m.nm)}`:"#props";
    const what=m.dl?`<b>${m.l} → ${m.now}</b> <span class="lmv ${m.dl>0?"up":"dn"}">${m.dl>0?"▲":"▼"} ${Math.abs(m.dl)}</span>`:`<b>${m.now}</b> <span class="lmv fl">over ${pr(m.o)} → ${pr(m.oNow)}</span>`;
    const why=m.dl>0?"books moved it up — money on the over":m.dl<0?"books moved it down — money on the under":m.dp<0?"over getting pricier":"under getting pricier";
    return `<a class="lmr" href="${href}" ${sp==="nfl"?`data-nflfav="${esc(m.nm)}"`:""}><span><b>${esc(m.nm)}</b> <span class="small">${esc(mk(m))}</span></span><span>${what}</span><span class="small">${why}</span></a>`};
  return `<div class="card lmc"><h2 style="margin-bottom:2px">📈 Biggest ${sp.toUpperCase()} line moves today</h2><div class="small" style="margin-bottom:8px">Since the first line we saw this morning · live sportsbook odds, updated ${loAgo()}. Big moves often follow injury news or sharp money.</div>${L.map(row).join("")}</div>`}
