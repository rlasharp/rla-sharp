/* ---------- ⚡ Instant results: grade finished games right in the browser ----------
   As soon as ESPN marks a game final, pending props, My Bets, plays and tonight's best props are graded here from
   ESPN's final box score — no waiting for the next site update. The next site update makes it official from our own
   data (same numbers). Fails silently if ESPN can't be reached: everything then just waits for the site update.
   Only ever reads real final stats; a player missing from the box score is left pending (never guessed). */
const FIN={sb:{},box:{},sig:null,busy:0,want:new Set()};
const FIN_NFLK=new Set(["passYds","passTD","comp","rushYds","rushAtt","rushTD","recYds","rec","recTD","rushRec","anyTD"]);
function finNorm(s){return typeof loNorm!=="undefined"?loNorm(s):String(s||"").toLowerCase().replace(/[^a-z]/g,"")}
function finRecent(d){if(!d)return false;const t=etNow().d;return d<=t&&(Date.parse(t)-Date.parse(d))/864e5<=3}
async function finDay(sp,d){const key=sp+d,c=FIN.sb[key];if(c&&(c.done||Date.now()-c.t<60000))return c.g;
  try{const r=await fetch(LIVE_URL[sp]+"?dates="+String(d).replace(/-/g,""),{cache:"no-store"});if(!r.ok)throw 0;const j=await r.json(),G=[];
    for(const e of j.events||[]){const cp=(e.competitions||[])[0];if(!cp)continue;const st=(((cp.status||e.status||{}).type)||{}).state||"pre";let h=null,a=null;
      for(const x of cp.competitors||[]){const o={ab:liveTeam(sp,(x.team&&x.team.abbreviation)||""),sc:+x.score||0};if(x.homeAway==="home")h=o;else a=o}
      if(h&&a)G.push({id:String(e.id),a:a.ab,h:h.ab,as:a.sc,hs:h.sc,st})}
    FIN.sb[key]={t:Date.now(),g:G,done:G.length>0&&G.every(x=>x.st==="post")};return G}catch(e){return c?c.g:[]}}
async function finBox(sp,id){const key=sp+id;if(FIN.box[key])return FIN.box[key];let p=null;
  try{p=JSON.parse(sessionStorage.getItem("fin:"+key)||"null")}catch(e){}
  if(!p){let raw=null;try{raw=sp==="nba"?await liveBox(id):sp==="nfl"?await liveNflBox(id):await nhlLiveBox(id)}catch(e){}
    if(!raw||!Object.keys(raw).length)return null;p={};for(const n in raw)p[finNorm(n)]=raw[n];
    try{sessionStorage.setItem("fin:"+key,JSON.stringify(p))}catch(e){}}
  FIN.box[key]=p;return p}
/* ---- sync lookups (they note what's missing; finRefresh fetches it and redraws) ---- */
function finGameOf(sp,d,tm){if(!finRecent(d)||!tm)return null;const c=FIN.sb[sp+d];if(!c){FIN.want.add(sp+"|"+d);return null}
  if(!c.done)FIN.want.add(sp+"|"+d);return c.g.find(g=>g.a===tm||g.h===tm)||null}
function finScore(sp,d,a,h){if(!finRecent(d))return null;const c=FIN.sb[sp+d];if(!c){FIN.want.add(sp+"|"+d);return null}
  if(!c.done)FIN.want.add(sp+"|"+d);const g=c.g.find(g=>g.a===a&&g.h===h);return g&&g.st==="post"?[g.as,g.hs]:null}
function finStat(sp,d,tm,nm,k){const g=finGameOf(sp,d,tm);if(!g||g.st!=="post")return null;const B=FIN.box[sp+g.id];
  if(!B){FIN.want.add(sp+"|"+d+"|"+g.id);return null}const o=B[finNorm(nm)];if(!o)return null;
  const v=sp==="nba"?liveVal(o,k):sp==="nfl"?(FIN_NFLK.has(k)?liveNflVal(o,k):null):nhlLiveVal(o,k);return v==null||!Number.isFinite(+v)?null:+v}
/* prop result: side "o"/"over" or "u"/"under" */
function finProp(sp,d,tm,nm,k,side,line){if(line==null&&(k==="hanyG"||k==="anyTD"))line=.5;if(line==null)return null;const v=finStat(sp,d,tm,nm,k);if(v==null)return null;
  const over=side==="o"||side==="over";return {r:v===+line?"push":(over===(v>+line))?"win":"loss",v}}
function finEdge(mk,pick,a,h,F){const [as,hs]=F,pk=String(pick);
  if(mk==="Moneyline")return (pk===h)===(hs>as)?"win":"loss";
  if(mk==="Total"){const L=+pk.split(" ")[1],t=as+hs;return t===L?"push":(pk.startsWith("Over")===(t>L))?"win":"loss"}
  if(mk==="Spread"||mk==="Puck line"){const [tm,ln]=pk.split(" "),mg=tm===h?hs-as:as-hs;return mg+(+ln)===0?"push":mg+(+ln)>0?"win":"loss"}return null}
/* a tracked play / best prop {type?, nm,k,side,line,tm | mk,pick,a,h} on date d */
function finItem(sp,d,x){if(x.r)return null;
  if(x.type==="game"){const F=finScore(sp,d,x.a,x.h);if(!F)return null;const r=finEdge(x.mk,x.pick,x.a,x.h,F);return r?{r,f:F}:null}
  return finProp(sp,d,x.tm,x.nm,x.k,x.side,x.line)}
/* My Bets (called from gradeBet when our data has no result yet) */
function finBet(b){try{
  const why=v=>`Final: ${v} · ⚡ graded from ESPN's box score`;
  if(b.k==="nbaprop"||b.k==="nhlprop"){const g=finProp(b.k==="nbaprop"?"nba":"nhl",b.date,b.team,b.player,b.market,b.side,b.line);return g?{r:g.r,why:why(g.v),live:1}:null}
  if(b.k==="prop"){if(b.wk!==BETS_WEEK||typeof oppOf==="undefined")return null;const o=oppOf(b.team),d=o&&nflDate(o.g);const g=d&&finProp("nfl",d,b.team,b.player,b.market,b.side,b.line);return g?{r:g.r,why:why(g.v),live:1}:null}
  if(b.k==="ml"||b.k==="spread"||b.k==="total"){if(b.wk!==BETS_WEEK)return null;const gm=SLATE.find(x=>x.id===b.game),d=gm&&nflDate(gm),F=d&&finScore("nfl",d,b.away,b.home);if(!F)return null;
    const [ap,hp]=F,w=`Final: ${short(b.away)} ${ap}, ${short(b.home)} ${hp} · ⚡ from ESPN`;
    if(b.k==="ml"){const win=ap>hp?b.away:hp>ap?b.home:null;return {r:win===null?"push":win===b.team?"win":"loss",why:w,live:1}}
    if(b.k==="spread"){const me=b.team===b.away?ap:hp,op=b.team===b.away?hp:ap,m=me-op+b.line;return {r:m>0?"win":m<0?"loss":"push",why:w,live:1}}
    const t=ap+hp;return {r:t===b.line?"push":((b.side==="over")===(t>b.line))?"win":"loss",why:w,live:1}}
 }catch(e){}return null}
/* tonight's tracked best props + plays, with live grades filled in: {sp:{w,l,p,n,pend}} */
function finTonight(){const T=typeof TRACK!=="undefined"&&TRACK&&TRACK.today;if(!T)return null;const out={};
  for(const sp of ["nba","nhl","nfl"])for(const day of T[sp]||[]){const o=out[sp]||(out[sp]={w:0,l:0,p:0,n:0,pend:0,live:0,d:day.d});
    for(const x of day.best||[]){o.n++;let r=x.r;if(!r){const g=finItem(sp,day.d,x);if(g){r=g.r;o.live++}}
      if(r==="win")o.w++;else if(r==="loss")o.l++;else if(r==="push")o.p++;else if(r==="void")o.n--;else o.pend++}}
  return out}
function finTonightHtml(){const T=finTonight();if(!T)return "";const parts=[];
  for(const [sp,nm] of [["nba","NBA"],["nhl","NHL"],["nfl","NFL"]]){const o=T[sp];if(!o||!o.n||o.w+o.l+o.p===0)continue;
    parts.push(`<span class="fint"><b>${nm}</b> ${o.w}-${o.l}${o.p?"-"+o.p:""}${o.pend?` <span class="small">· ${o.pend} still to play</span>`:""}</span>`)}
  return parts.length?`<div class="fintw"><span class="small">⚡ Latest top-10 best props:</span> ${parts.join("")}</div>`:""}
function finTonightTile(){const T=finTonight();if(!T)return "";let w=0,l=0,pend=0;for(const o of Object.values(T)){w+=o.w;l+=o.l;pend+=o.pend}
  return w+l?`<a href="#record"><b class="${w>l?"up":w<l?"dn":""}">${w}-${l}</b><span>latest best props${pend?` · ${pend} to go`:""}</span></a>`:""}
/* everything that can be graded live right now — used to notice when a new final comes in */
function finCollect(){const sig=[];
  try{if(typeof betsLoad!=="undefined")for(const b of betsLoad()){const g=gradeBet(b);if(g.live)sig.push(b.id+g.r)}}catch(e){}
  try{const T=finTonight();if(T)for(const [sp,o] of Object.entries(T))if(o.live)sig.push(sp+o.live+":"+o.w+"-"+o.l+"-"+o.p)}catch(e){}
  try{if(typeof TRACK!=="undefined"&&TRACK&&TRACK.nhlPlays&&typeof NHL_DATE!=="undefined"&&NHL_DATE)for(const x of TRACK.nhlPlays){const g=finItem("nhl",NHL_DATE,x);if(g)sig.push("np"+(x.nm||x.pick)+g.r)}}catch(e){}
  try{if(typeof nbaRecord!=="undefined")for(const x of nbaRecord().rows){if(x.st!=="pending")continue;const [d,nm,k,side,line]=x.r,p=NBA_LOGS[nm];const g=p&&finProp("nba",d,p.tm,nm,k,side,line);if(g)sig.push("nr"+nm+g.r)}}catch(e){}
  return sig.join("|")}
async function finRefresh(){if(FIN.busy||location.protocol==="file:"||typeof LIVE_URL==="undefined")return;FIN.busy=1;
  try{for(let pass=0;pass<3;pass++){FIN.want.clear();finCollect();if(!FIN.want.size)break;
      await Promise.all([...FIN.want].map(w=>{const [sp,d,id]=w.split("|");return id?finBox(sp,id):finDay(sp,d)}))}
    const sig=finCollect(),h=(location.hash||"#today").slice(1)||"today";
    if(sig!==(FIN.sig||"")&&/^(bets|record|today|nhl$|nba$)/.test(h)&&typeof loRerender!=="undefined")loRerender();
    FIN.sig=sig}finally{FIN.busy=0}}
window.addEventListener("load",()=>setTimeout(finRefresh,1500));
window.addEventListener("hashchange",()=>setTimeout(finRefresh,400));
document.addEventListener("visibilitychange",()=>{if(!document.hidden)finRefresh()});
setInterval(()=>{if(!document.hidden)finRefresh()},90000);
