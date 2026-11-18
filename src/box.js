/* ---------- 📋 Box scores for NBA and NHL games, straight from ESPN the moment a game ends (and live while it's on).
   Route: #box/<nba|nhl>/<ESPN event id>  or  #box/<nba|nhl>/<YYYY-MM-DD>/<away>/<home> (the id is looked up on ESPN's scoreboard).
   Linked from the live/final bar on game cards and game pages, the NBA game page once a game has started, and both scores pages.
   Only ESPN's posted numbers are shown — nothing is estimated. ---------- */
const BXS={c:{},url:{nba:"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=",nhl:"https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event="}};
function bxE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function bxFix(sp,ab){return typeof liveTeam!=="undefined"?liveTeam(sp,ab):ab}
async function bxLoad(sp,id){const k=sp+id,c=BXS.c[k];if(c&&(c.st==="post"||Date.now()-c.t<30000))return c;
  try{const s=sessionStorage.getItem("box:"+k);if(s){const o=JSON.parse(s);BXS.c[k]=o;return o}}catch(e){}
  const r=await fetch(BXS.url[sp]+id,{cache:"no-store"});if(!r.ok)throw new Error("ESPN "+r.status);const j=await r.json();
  const cp=((j.header||{}).competitions||[])[0]||{},T=((cp.status||{}).type)||{},o={t:Date.now(),id,sp,st:T.state||"pre",det:T.shortDetail||T.detail||"",teams:[],pl:{},ts:{}};
  for(const x of cp.competitors||[]){const t=x.team||{};o.teams.push({ab:bxFix(sp,t.abbreviation||""),nm:t.displayName||t.name||"",logo:(t.logos&&t.logos[0]&&t.logos[0].href)||t.logo||"",sc:x.score,ls:(x.linescores||[]).map(l=>l.displayValue??l.value),home:x.homeAway==="home",w:!!x.winner})}
  o.teams.sort((a,b)=>a.home-b.home);
  const bs=j.boxscore||{};
  for(const t of bs.players||[]){const ab=bxFix(sp,(t.team||{}).abbreviation||""),G=[];
    for(const s of t.statistics||[]){const A=(s.athletes||[]);if(!A.length)continue;
      G.push({nm:s.name||"",lab:s.labels||s.names||[],tot:s.totals||null,rows:A.map(a=>({n:(a.athlete||{}).displayName||"",pos:(((a.athlete||{}).position)||{}).abbreviation||"",st:!!a.starter,dnp:!!a.didNotPlay||!(a.stats&&a.stats.length),why:a.reason||"",s:a.stats||[]}))})}
    o.pl[ab]=G}
  for(const t of bs.teams||[]){const ab=bxFix(sp,(t.team||{}).abbreviation||"");o.ts[ab]=(t.statistics||[]).map(s=>[s.label||s.abbreviation||s.name,s.displayValue])}
  BXS.c[k]=o;if(o.st==="post")try{sessionStorage.setItem("box:"+k,JSON.stringify(o))}catch(e){}return o}
/* columns to show (ESPN label -> shown), in order; anything not listed is hidden to keep tables phone-sized */
const BX_COLS={nba:["MIN","PTS","REB","AST","FG","3PT","FT","STL","BLK","TO","PF","+/-"],
  nhlS:["G","A","SOG","+/-","HT","BS","TK","GV","PIM","FW","FL","TOI","PPTOI"],nhlG:["SA","GA","SV","SV%","TOI"]};
function bxTable(sp,g){const goalie=/goal/i.test(g.nm),want=sp==="nba"?BX_COLS.nba:goalie?BX_COLS.nhlG:BX_COLS.nhlS,ix=want.map(l=>[l,g.lab.indexOf(l)]).filter(x=>x[1]>=0);
  const P=g.rows.filter(r=>!r.dnp),D=g.rows.filter(r=>r.dnp),S=sp==="nba"?[P.filter(r=>r.st),P.filter(r=>!r.st)]:[P];
  const pl=n=>sp==="nba"?`#nba-player-${encodeURIComponent(n)}`:`#nhl-player-${encodeURIComponent(n)}`;
  const tr=r=>`<tr><td style="text-align:left;white-space:nowrap"><a href="${pl(r.n)}">${bxE(r.n)}</a>${r.pos?` <span class="small">${bxE(r.pos)}</span>`:""}</td>${ix.map(([l,i])=>`<td${l==="PTS"||l==="G"||l==="SV"?' style="font-weight:700"':""}>${bxE(r.s[i]??"")}</td>`).join("")}</tr>`;
  const head=`<thead><tr><th style="text-align:left">${sp==="nba"?"":goalie?"Goalies":/def/i.test(g.nm)?"Defense":"Forwards"}</th>${ix.map(([l])=>`<th>${l}</th>`).join("")}</tr></thead>`;
  let body=S.map((L,i)=>!L.length?"":(sp==="nba"?`<tr><td colspan="${ix.length+1}" class="small" style="text-align:left;padding-top:8px"><b>${i?"Bench":"Starters"}</b></td></tr>`:"")+L.map(tr).join("")).join("");
  if(g.tot&&g.tot.some(v=>v!==""))body+=`<tr class="bxtot"><td style="text-align:left"><b>Team</b></td>${ix.map(([,i])=>`<td><b>${bxE(g.tot[i]??"")}</b></td>`).join("")}</tr>`;
  return `<div class="nbatbl"><table class="bxt">${head}<tbody>${body}</tbody></table></div>${D.length?`<div class="small" style="margin-top:4px">Did not play: ${D.map(r=>bxE(r.n)+(r.why?` (${bxE(r.why.toLowerCase())})`:"")).join(", ")}</div>`:""}`}
function bxHtml(o){const sp=o.sp,[A,H]=o.teams;if(!A||!H)return `<div class="card small">ESPN hasn't posted this game yet.</div>`;
  const per=sp==="nba"?(i=>i<4?"Q"+(i+1):i===4?"OT":"OT"+(i-3)):(i=>i<3?"P"+(i+1):i===3?"OT":"SO"),n=Math.max(A.ls.length,H.ls.length);
  const live=o.st==="in",fin=o.st==="post",badge=t=>t.logo?`<img src="${bxE(t.logo)}" alt="" style="width:26px;height:26px;vertical-align:middle;margin-right:6px">`:"";
  const ls=n?`<div class="nbatbl"><table class="bxt"><thead><tr><th></th>${Array.from({length:n},(_,i)=>`<th>${per(i)}</th>`).join("")}<th>T</th></tr></thead><tbody>${[A,H].map(t=>`<tr><td style="text-align:left"><b>${bxE(t.ab)}</b></td>${Array.from({length:n},(_,i)=>`<td>${bxE(t.ls[i]??"")}</td>`).join("")}<td><b>${bxE(t.sc)}</b></td></tr>`).join("")}</tbody></table></div>`:"";
  const tsKeep=sp==="nba"?/^(FG%|Field Goal %|3P%|Three Point %|FT%|Free Throw %|Rebounds|Offensive Rebounds|Assists|Steals|Blocks|Turnovers|Fast Break Points|Points in Paint|Points Conceded Off Turnovers|Largest Lead)$/:/./;
  const TA=o.ts[A.ab]||[],TH=o.ts[H.ab]||[],tsRows=TA.map((x,i)=>[x[0],x[1],(TH[i]||[])[1]]).filter(x=>tsKeep.test(x[0])&&x[1]!=null);
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px">${[A,H].map((t,i)=>`<div style="text-align:${i?"right":"left"}">${i?"":badge(t)}<b>${bxE(t.nm||t.ab)}</b>${i?badge(t):""}<div style="font-size:30px;font-weight:800${t.w?"":";opacity:.75"}">${bxE(t.sc??"–")}</div></div>`).join(`<div class="small" style="text-align:center">${live?`<span class="lvdot"></span> <b>LIVE</b><br>`:fin?"<b>FINAL</b><br>":""}${bxE(fin?(o.det||"").replace(/^Final\/?/,""):o.det)}</div>`)}</div>${ls}</div>
   ${[A,H].map(t=>`<div class="card"><h2>${badge(t)}${bxE(t.nm||t.ab)}</h2>${(o.pl[t.ab]||[]).map(g=>bxTable(sp,g)).join("")||`<div class="small">No player stats yet.</div>`}</div>`).join("")}
   ${tsRows.length?`<div class="card"><h2>Team stats</h2><div class="nbatbl"><table class="bxt"><thead><tr><th style="text-align:left"></th><th>${bxE(A.ab)}</th><th>${bxE(H.ab)}</th></tr></thead><tbody>${tsRows.map(r=>`<tr><td style="text-align:left">${bxE(r[0])}</td><td>${bxE(r[1])}</td><td>${bxE(r[2]??"")}</td></tr>`).join("")}</tbody></table></div></div>`:""}
   <p class="note">Box score from ESPN${live?" — live, refreshes every 30 seconds":""}.</p>`}
let BX_T=null;
async function viewBox(h){const el=document.getElementById("v-box");if(!el)return;const p=h.split("/"),sp=p[1]==="nhl"?"nhl":"nba";let id=p[2];
  const back=typeof xBack!=="undefined"?xBack(sp==="nba"?"#nba-scores":"#nhl-scores",sp==="nba"?"NBA scores":"NHL scores"):"";
  if(!el.dataset.k||el.dataset.k!==h){el.dataset.k=h;el.innerHTML=`<p>${back}</p><h1>📋 Box score</h1><div class="card small">Loading from ESPN…</div>`}
  try{if(p.length>=5&&typeof finDay!=="undefined"){const G=await finDay(sp,p[2]),g=G.find(x=>x.a===p[3]&&x.h===p[4]);if(!g)throw new Error("not found");id=g.id}
    const o=await bxLoad(sp,id);if((location.hash||"").slice(1)!==h)return;
    el.innerHTML=`<p>${back}</p><h1>📋 Box score</h1>${bxHtml(o)}`;
    clearTimeout(BX_T);if(o.st==="in")BX_T=setTimeout(()=>{if((location.hash||"").slice(1)===h)viewBox(h)},30000)}
  catch(e){if((location.hash||"").slice(1)===h)el.innerHTML=`<p>${back}</p><h1>📋 Box score</h1><div class="card small">Couldn't load this box score from ESPN right now${/not found/.test(e.message)?" (game not found on ESPN's scoreboard)":""}. Try again in a minute.</div>`}}
/* small "📋 Box score" link that works inside clickable cards */
function bxLink(sp,id,txt){return `<span class="lvbx" role="link" tabindex="0" data-bxgo="box/${sp}/${bxE(id)}">📋 ${txt||"Box score"}</span>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-bxgo]");if(!b)return;e.preventDefault();e.stopPropagation();location.hash=b.dataset.bxgo},true);

/* ---------- ⚡ Last night's NBA games on the page right away: when ESPN marks a game final and the site's data doesn't have it yet,
   its box score is added to the results and every player's game log in the browser (hit rates, last-10, averages, defense numbers
   update at once). The next site update brings the same numbers from our own data. Only ESPN's final numbers; nothing is estimated. ---------- */
const BXP={busy:0,done:new Set()};
async function bxPatchNba(){if(BXP.busy||typeof NBA_RES==="undefined"||typeof finDay==="undefined"||typeof etNow==="undefined")return;BXP.busy=1;let n=0;
  try{const t=etNow().d,y=new Date(Date.parse(t+"T12:00:00Z")-864e5).toISOString().slice(0,10),have=new Set(NBA_RES.map(r=>String(r[0])));
    for(const d of [y,t]){const G=await finDay("nba",d);
      for(const g of G){if(g.st!=="post"||have.has(String(g.id))||BXP.done.has(g.id))continue;let o;try{o=await bxLoad("nba",g.id)}catch(e){continue}
        if(!o||o.st!=="post")continue;const [A,H]=o.teams;if(!A||!H)continue;
        const rows=[];for(const T of [A,H]){const opp=T===A?H:A;for(const grp of o.pl[T.ab]||[]){const ix=l=>grp.lab.indexOf(l),v=(r,l)=>{const i=ix(l);return i<0?null:r.s[i]},pr=x=>String(x||"").split("-").map(Number);
          for(const r of grp.rows){if(r.dnp)continue;const mn=+v(r,"MIN");if(!(mn>0))continue;const [fgm,fga]=pr(v(r,"FG")),[tpm,tpa]=pr(v(r,"3PT")),[ftm,fta]=pr(v(r,"FT"));
            rows.push([r.n,T.ab,r.pos,[+g.id,d,opp.ab,T.home?"H":"A",mn,+v(r,"PTS")||0,+v(r,"REB")||0,+v(r,"AST")||0,tpm||0,r.st?1:0,fgm||0,fga||0,+v(r,"STL")||0,+v(r,"BLK")||0,+v(r,"TO")||0,tpa||0,ftm||0,fta||0,v(r,"PF")==null?null:+v(r,"PF")]])}}}
        if(rows.length<10)continue;
        NBA_RES.push([+g.id,d,A.ab,H.ab,+A.sc,+H.sc]);for(const [nm,tm,pos,row] of rows){const p=NBA_LOGS[nm]||(NBA_LOGS[nm]={tm,pos,id:0,g:[]});if(!p.g.some(x=>String(x[0])===String(row[0])))p.g.push(row)}
        BXP.done.add(g.id);have.add(String(g.id));n++}}}catch(e){}
  BXP.busy=0;
  if(n){try{NBA_DVP_IDX=null;NBA_ALLOW=null;NBA_RESTM=null}catch(e){}const h=(location.hash||"").slice(1);if(/^(nba|today|allpicks|compare\/nba)/.test(h)&&typeof route!=="undefined")route()}}
setTimeout(bxPatchNba,4000);setInterval(bxPatchNba,5*60*1000);
