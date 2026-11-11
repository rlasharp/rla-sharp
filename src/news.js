/* ---------- 📰 Latest news (ESPN's public news feed, read live by the page every 10 minutes) ----------
   Game pages: headlines about either team from the last 2 days. Player pages: headlines that tag the player.
   Prop cards get a 📰 flag when a headline from the last 24 h about the player says he's out / questionable / scratched,
   so late news shows up before the injury report catches up. Headlines are ESPN's, linked to the story; nothing invented. */
const NEWS={nba:null,nhl:null,nfl:null,t:{},busy:{}};
const NEWS_URL={nba:"basketball/nba",nhl:"hockey/nhl",nfl:"football/nfl"};
const NEWS_BAD=/\b(ruled out|will not play|won't play|won’t play|out for|out (tonight|today|thursday|friday|saturday|sunday|monday|tuesday|wednesday)|(is|are) out\b|scratched|scratch|sidelined|placed on (ir|injured reserve)|to ir\b|season-ending|suspended|inactive)\b/i;
const NEWS_Q=/\b(questionable|doubtful|day-to-day|game-time decision|gtd|limited|did not practice|dnp|uncertain|status (is )?(unclear|in doubt))\b/i;
const NEWS_START=/\b(will start|to start|starting|gets the start|in goal|in net)\b/i;
function newsNorm(s){return typeof loNorm!=="undefined"?loNorm(s):String(s||"").toLowerCase().replace(/[^a-z]/g,"")}
function newsTeamMap(sp){const m={};try{if(sp==="nba"&&typeof NBA_TEAMS!=="undefined")for(const [a,n] of Object.entries(NBA_TEAMS))m[newsNorm(n)]=a;
  if(sp==="nhl"&&typeof NHL_TEAM!=="undefined")for(const [a,t] of Object.entries(NHL_TEAM))if(t.n)m[newsNorm(t.n)]=a;
  if(sp==="nfl"&&typeof TEAMS!=="undefined")for(const [a,t] of Object.entries(TEAMS))m[newsNorm(t[0])]=a}catch(e){}
  /* also by nickname ("LA Clippers" vs "Los Angeles Clippers", "Montréal" vs "Montreal") */
  return m}
function newsTeamOf(m,desc){const n=newsNorm(desc);if(m[n])return m[n];const w=String(desc||"").split(" ").pop();const hit=Object.entries(m).find(([k])=>k.endsWith(newsNorm(w)));return hit?hit[1]:null}
async function newsLoad(sp,force){if(location.protocol==="file:"||NEWS.busy[sp])return false;if(!force&&NEWS[sp]&&Date.now()-(NEWS.t[sp]||0)<9.5*60e3)return false;NEWS.busy[sp]=1;
  try{let raw=null;try{const c=JSON.parse(sessionStorage.getItem("news:"+sp)||"null");if(c&&!force&&Date.now()-c.t<9.5*60e3)raw=c.d}catch(e){}
    if(!raw){const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${NEWS_URL[sp]}/news?limit=50`,{cache:"no-store"});if(!r.ok)throw 0;raw=(await r.json()).articles||[];try{sessionStorage.setItem("news:"+sp,JSON.stringify({t:Date.now(),d:raw}))}catch(e){}}
    const TM=newsTeamMap(sp);
    NEWS[sp]=raw.map(a=>{const C=a.categories||[],txt=(a.headline||"")+" — "+(a.description||"");
      return {h:a.headline||"",d:a.description||"",at:a.published||a.lastModified||"",url:((a.links||{}).web||{}).href||"",type:a.type||"",
        ath:C.filter(c=>c.type==="athlete").map(c=>c.description||(c.athlete||{}).description||"").filter(Boolean),
        tm:[...new Set(C.filter(c=>c.type==="team").map(c=>newsTeamOf(TM,c.description)).filter(Boolean))],
        bad:NEWS_BAD.test(txt),q:NEWS_Q.test(txt),start:NEWS_START.test(txt)}}).filter(x=>x.h&&x.type!=="Media");   /* skip video highlight clips */
    NEWS.t[sp]=Date.now();const sig=NEWS[sp].slice(0,8).map(x=>x.h).join("|");const ch=sig!==NEWS["sig"+sp];NEWS["sig"+sp]=sig;return ch}catch(e){NEWS.t[sp]=Date.now();return false}finally{NEWS.busy[sp]=0}}
function newsAge(at){const m=(Date.now()-Date.parse(at))/6e4;return !isFinite(m)?"":m<60?Math.max(1,Math.round(m))+" min ago":m<1440?Math.round(m/60)+" h ago":Math.round(m/1440)+" d ago"}
function newsFor(sp,o){const L=NEWS[sp]||[],hrs=o.hrs||48;
  return L.filter(x=>(Date.now()-Date.parse(x.at))/36e5<=hrs&&((o.teams&&x.tm.some(t=>o.teams.includes(t)))||(o.player&&(x.ath.some(n=>newsNorm(n)===newsNorm(o.player))||x.h.includes(o.player)))))}
/* a 📰 chip for a player with fresh injury-type news (last 24 h) */
function newsFlag(sp,nm){const L=newsFor(sp,{player:nm,hrs:24}).filter(x=>x.bad||x.q);if(!L.length)return "";const x=L[0];
  return ` <a class="newsf ${x.bad?"b":"q"}" href="${x.url||"#"}" target="_blank" rel="noopener" title="${(x.h+" — "+x.d).replace(/"/g,"&quot;")}">📰 ${x.bad?"news: out?":"news: questionable"}</a>`}
function newsCard(sp,o,title){if(!NEWS[sp]){newsLoad(sp).then(ok=>{if(ok)newsRefresh()});return `<div class="card newsc" style="margin-top:12px" data-news="${sp}"><h2 style="margin-bottom:4px">📰 Latest news</h2><div class="small">Loading ESPN headlines…</div></div>`}
  const L=newsFor(sp,o).slice(0,6);if(!L.length)return "";
  return `<div class="card newsc" style="margin-top:12px"><h2 style="margin-bottom:4px">📰 ${title||"Latest news"}</h2>
   ${L.map(x=>`<a class="newsr" href="${x.url||"#"}" target="_blank" rel="noopener"><span><b>${x.bad?"🚑 ":x.q?"⚠️ ":x.start&&sp==="nhl"?"🥅 ":""}${(x.h||"").replace(/</g,"&lt;")}</b><span class="small">${(x.d||"").replace(/</g,"&lt;").slice(0,160)}</span></span><span class="small newsa">${newsAge(x.at)}</span></a>`).join("")}
   <div class="small" style="margin-top:6px">From ESPN's news feed — tap a headline for the story. Checked every 10 minutes while this page is open.</div></div>`}
/* redraw once when fresh news arrives (keeps your place) */
let NEWS_RT=0;function newsRefresh(){clearTimeout(NEWS_RT);NEWS_RT=setTimeout(()=>{if(typeof route==="function"){const y=scrollY;route();scrollTo(0,y)}},150)}
function newsSportNow(){const h=(location.hash||"").slice(1);return h.startsWith("nba")?"nba":h.startsWith("nhl")?"nhl":/^(game-|props|team-|plays|games)/.test(h)?"nfl":null}
window.addEventListener("load",()=>{setTimeout(()=>{const sp=newsSportNow();if(sp)newsLoad(sp).then(ok=>{if(ok)newsRefresh()})},2500);
  setInterval(()=>{const sp=newsSportNow();if(sp&&!document.hidden)newsLoad(sp).then(ok=>{if(ok)newsRefresh()})},60e3)});
window.addEventListener("hashchange",()=>{const sp=newsSportNow();if(sp&&!NEWS[sp])newsLoad(sp).then(ok=>{if(ok)newsRefresh()})});
