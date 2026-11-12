/* ---------- 📋 box scores for head-to-head meetings (NBA / NHL / NFL) ----------
   Tap "Box score" on any of the last 5 meetings: the page finds that game on ESPN's public scoreboard for that date
   and opens its official box score (line score by period + every player's stats) right under the row. Loaded only
   when tapped, cached for the visit. ESPN's numbers, shown as they are. */
const BXH={c:{},busy:{}};
const BXH_PATH={nba:"basketball/nba",nhl:"hockey/nhl",nfl:"football/nfl"};
const BXH_AB={nhl:{TBL:"TB",NJD:"NJ",LAK:"LA",SJS:"SJ",UTA:"UTAH"},nfl:{WAS:"WSH",LA:"LAR"},nba:{}};
function bxhNick(sp,t){try{const n=sp==="nba"?(typeof NBA_TEAMS!=="undefined"&&NBA_TEAMS[t]):sp==="nhl"?(NHL_TEAM[t]||{}).n:(typeof TEAMS!=="undefined"&&TEAMS[t]&&TEAMS[t][0]);return n?String(n).split(" ").pop().toLowerCase():""}catch(e){return ""}}
function bxhIs(sp,t,team){const ab=(BXH_AB[sp]||{})[t]||t;if(team.abbreviation===ab||team.abbreviation===t)return true;const n=bxhNick(sp,t);return !!n&&String(team.displayName||"").toLowerCase().split(" ").pop()===n}
function bxBtn(sp,d,a,h){return d?`<button class="bxb" data-h2hbx="${sp}|${d}|${a}|${h}" aria-expanded="false">📋 Box score</button>`:""}
async function bxhJson(u){const r=await fetch(u,{cache:"force-cache"});if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
async function bxhFind(sp,d,a,h){const B=`https://site.api.espn.com/apis/site/v2/sports/${BXH_PATH[sp]}/`;
  const day=n=>{const x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10).replace(/-/g,"")};
  for(const n of [0,-1,1]){const sb=await bxhJson(B+"scoreboard?dates="+day(n)+(sp==="nfl"?"":"&limit=50"));
    const ev=(sb.events||[]).find(e=>{const C=((e.competitions||[])[0]||{}).competitors||[];return C.length===2&&[a,h].every(t=>C.some(c=>bxhIs(sp,t,c.team||{})))});
    if(ev)return bxhJson(B+"summary?event="+ev.id)}
  throw new Error("not found")}
/* which columns to keep per stat group (ESPN labels), so the tables fit a phone */
const BXH_COLS={nba:{"":["MIN","PTS","REB","AST","FG","3PT","FT","STL","BLK","TO","+/-"]},
  nhl:{forwards:["G","A","SOG","+/-","HT","BS","TOI","FW"],defenses:["G","A","SOG","+/-","HT","BS","TOI"],goalies:["SA","SV","SV%","GA","TOI"]},
  nfl:{passing:["C/ATT","YDS","TD","INT","SACKS","RTG"],rushing:["CAR","YDS","AVG","TD","LONG"],receiving:["REC","YDS","TD","LONG","TGTS"],defensive:["TOT","SACKS","TFL","PD","QB HTS"],interceptions:["INT","YDS","TD"],kicking:["FG","LONG","XP","PTS"]}};
const BXH_GN={forwards:"Forwards",defenses:"Defense",goalies:"Goalies",passing:"Passing",rushing:"Rushing",receiving:"Receiving",defensive:"Defense",interceptions:"Interceptions",kicking:"Kicking"};
function bxhE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function bxhHtml(sp,S){const comp=((S.header||{}).competitions||[])[0]||{},C=comp.competitors||[];
  const away=C.find(c=>c.homeAway==="away")||C[0],home=C.find(c=>c.homeAway==="home")||C[1];if(!away||!home)return `<div class="small">No box score on ESPN for this game.</div>`;
  const np=Math.max(...[away,home].map(c=>(c.linescores||[]).length)),per=i=>sp==="nhl"?(i<3?["1st","2nd","3rd"][i]:i===3?"OT":"SO"):i<4?"Q"+(i+1):"OT";
  const ls=`<div class="nbatbl"><table class="bxt bxls"><thead><tr><th></th>${Array.from({length:np},(_,i)=>`<th>${per(i)}</th>`).join("")}<th>T</th></tr></thead><tbody>${[away,home].map(c=>`<tr><td><b>${bxhE(c.team.abbreviation)}</b></td>${Array.from({length:np},(_,i)=>`<td>${bxhE(((c.linescores||[])[i]||{}).displayValue||"–")}</td>`).join("")}<td><b>${bxhE(c.score)}</b></td></tr>`).join("")}</tbody></table></div>`;
  const P=((S.boxscore||{}).players)||[],keep=BXH_COLS[sp]||{};
  const team=T=>{const groups=(T.statistics||[]).filter(g=>(g.athletes||[]).length&&(sp==="nba"?(g.labels||[]).includes("PTS"):keep[g.name]));
    return `<div class="bxteam"><h3 class="nhh3">${bxhE(T.team.displayName||T.team.abbreviation)}</h3>${groups.map(g=>{const want=keep[g.name||""]||g.labels,idx=want.map(l=>(g.labels||[]).indexOf(l)).filter(i=>i>=0);
      const rows=(g.athletes||[]).filter(x=>!x.didNotPlay&&(x.stats||[]).length);if(!rows.length)return "";
      return `${sp==="nba"?"":`<div class="small bxgn">${bxhE(BXH_GN[g.name]||g.text||g.name)}</div>`}<div class="nbatbl"><table class="bxt"><thead><tr><th>${sp==="nba"?"Player":""}</th>${idx.map(i=>`<th>${bxhE(g.labels[i])}</th>`).join("")}</tr></thead><tbody>
        ${rows.map(x=>`<tr><td>${bxhE((x.athlete||{}).shortName||(x.athlete||{}).displayName)}${x.starter&&sp==="nba"?"":""}</td>${idx.map(i=>`<td>${bxhE(x.stats[i])}</td>`).join("")}</tr>`).join("")}
        ${g.totals&&g.totals.some(Boolean)?`<tr class="bxtot"><td>Team</td>${idx.map(i=>`<td>${bxhE(g.totals[i])}</td>`).join("")}</tr>`:""}</tbody></table></div>`}).join("")}</div>`};
  const st=((comp.status||{}).type||{}).shortDetail||"";
  const evid=(S.header||{}).id,qb=(sp==="nba"||sp==="nhl")&&evid&&P.length&&typeof qbTabs!=="undefined";if(qb&&typeof QB_S!=="undefined")QB_S[sp+"|"+evid]=S;
  return `<div class="bxhd small">${bxhE(st)} · ${bxhE(new Date(comp.date||Date.now()).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}))}</div>${ls}${qb?qbTabs(sp,evid,np):""}<div class="qbarea">${P.length?P.map(team).join(""):`<div class="small">ESPN has no player stats for this game.</div>`}</div><div class="small" style="margin-top:6px">Official box score from ESPN.</div>`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-h2hbx]");if(!b)return;e.preventDefault();e.stopPropagation();
  const key=b.dataset.h2hbx,[sp,d,a,h]=key.split("|"),row=b.closest("[data-bxrow]")||b.parentElement,isTr=row.tagName==="TR";
  const nx=row.nextElementSibling;if(nx&&nx.classList.contains("bxpanel")){nx.remove();b.setAttribute("aria-expanded","false");b.classList.remove("on");return}
  const pan=document.createElement(isTr?"tr":"div");pan.className="bxpanel";const inner=`<div class="bxin small">Loading the box score…</div>`;
  pan.innerHTML=isTr?`<td colspan="${row.children.length}">${inner}</td>`:inner;row.after(pan);b.setAttribute("aria-expanded","true");b.classList.add("on");
  const box=pan.querySelector(".bxin");
  try{const S=BXH.c[key]||(BXH.c[key]=await bxhFind(sp,d,a,h));box.classList.remove("small");box.innerHTML=bxhHtml(sp,S)}
  catch(err){delete BXH.c[key];box.innerHTML=location.protocol==="file:"?"Box scores load from ESPN when the site is online.":`Couldn't load this box score from ESPN right now${String(err.message)==="not found"?" (game not found on their scoreboard)":""}. Try again in a minute.`}});
