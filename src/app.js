/* ---------- App shell: Today page, bottom tab bar, global search, favorites, updated-at, age check ---------- */

/* ===== Favorites (saved on this phone/browser only) ===== */
function favs(){return LS.get("favs",[])||[]}
function isFav(t,id){return favs().some(f=>f.t===t&&f.id===id)}
function toggleFav(t,id){let F=favs();F=isFav(t,id)?F.filter(f=>!(f.t===t&&f.id===id)):[...F,{t,id}];LS.set("favs",F);return isFav(t,id)}
function favBtn(t,id){const on=isFav(t,id);return `<button class="favb${on?" on":""}" data-fav="${t}|${esc(id)}" title="${on?"Remove from":"Add to"} My favorites">${on?"★":"☆"}<span>${on?"Saved":"Save"}</span></button>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-fav]");if(!b)return;e.preventDefault();e.stopPropagation();
  const v=b.dataset.fav.replace(/&amp;/g,"&").replace(/&quot;/g,'"'),i=v.indexOf("|"),on=toggleFav(v.slice(0,i),v.slice(i+1));
  b.classList.toggle("on",on);b.innerHTML=`${on?"★":"☆"}<span>${on?"Saved":"Save"}</span>`;if(typeof shareToast!=="undefined")shareToast(on?"Saved ⭐ — see Favorites (More menu or top of Today)":"Removed from favorites")});
/* put a star button in page headers after each render */
function favDecorate(){
  const h=decodeURIComponent((location.hash||"").slice(1));
  const put=(sel,t,id)=>{const el=document.querySelector(sel);if(!el||el.querySelector(".favb"))return;el.insertAdjacentHTML("beforeend",favBtn(t,id))};
  if(h.startsWith("nba-player-"))put("#v-nba .phead > div:last-child","nbap",h.slice(11));
  if(h.startsWith("nba-team-"))put("#v-nba .phead > div:last-child","nbat",h.slice(9));
  if(h.startsWith("nhl-player-"))put("#v-nhl .phead > div:last-child","nhlp",h.slice(11));
  if(h.startsWith("nhl-team-"))put("#v-nhl .phead > div:last-child","nhlt",h.slice(9));
  if(h==="props"&&typeof S!=="undefined"&&S.prop&&S.prop.open&&S.prop.player){const r=document.querySelector("#v-props .row h1");if(r&&!r.parentElement.querySelector(".favb"))r.insertAdjacentHTML("afterend",favBtn("nflp",S.prop.player))}
}

/* ===== Updated-at strip ===== */
function updatedHtml(sport){
  const lb=typeof loBadge!=="undefined"?loBadge():"";if(lb&&(sport==="nba"?LO.nba:LO.nfl))return lb+updatedHtml0(sport);return updatedHtml0(sport)}
function updatedHtml0(sport){
  if(sport==="nba"&&typeof NBA_GEN!=="undefined")return `<div class="upd">🕒 NBA updated <b>${esc(NBA_GEN)}</b> · stats through ${nbaDayS(window.NBA_THRU||NBA_ASOF)} · game lines ${esc(NBA_LINES_ASOF||"")}</div>`;
  if(sport==="nfl")return `<div class="upd">🕒 NFL lines & injuries <b>${typeof MARKET_ASOF!=="undefined"?esc(MARKET_ASOF):""}</b> · stats ${typeof USAGE_ASOF!=="undefined"?esc(USAGE_ASOF):""}${typeof NFL_XWEEK!=="undefined"?` · standings through Week ${NFL_XWEEK}`:""} · <a href="#guide" style="color:inherit">sources</a></div>`;
  return "";
}

/* ===== Global search: players and teams, NFL + NBA ===== */
let SRCH=null;
function searchIndex(){
  if(SRCH)return SRCH;const L=[];
  if(typeof NBA_LOGS!=="undefined")for(const [n,p] of Object.entries(NBA_LOGS))L.push({k:n.toLowerCase(),l:n,s:"NBA",sub:`${p.tm} · ${p.p5||p.pos||""}`,h:"nba-player-"+encodeURIComponent(n),w:p.g.length?p.g.reduce((a,x)=>a+x[4],0)/p.g.length:0});
  if(typeof NBA_TEAMS!=="undefined")for(const [t,n] of Object.entries(NBA_TEAMS))if(t!=="TBD")L.push({k:(n+" "+t).toLowerCase(),l:n,s:"NBA",sub:"Team",h:"nba-team-"+t,w:99});
  if(typeof NHL_P!=="undefined"){for(const [n,p] of Object.entries(NHL_P))L.push({k:n.toLowerCase(),l:n,s:"NHL",sub:`${p.tm} · ${p.pos}`,h:"nhl-player-"+encodeURIComponent(n),w:p.s?p.s[3]/Math.max(1,p.s[0])*10:0});
    for(const [n,p] of Object.entries(NHL_G))L.push({k:n.toLowerCase(),l:n,s:"NHL",sub:`${p.tm} · G`,h:"nhl-player-"+encodeURIComponent(n),w:5});
    for(const [t,v] of Object.entries(NHL_TEAM))L.push({k:((v.n||"")+" "+t).toLowerCase(),l:v.n||t,s:"NHL",sub:"Team",h:"nhl-team-"+t,w:99})}
  if(typeof PINFO!=="undefined")for(const [n,p] of Object.entries(PINFO))L.push({k:n.toLowerCase(),l:n,s:"NFL",sub:`${p.team} · ${p.pos}`,nfl:n,w:50});
  if(typeof TEAMS!=="undefined")for(const [t,v] of Object.entries(TEAMS))L.push({k:(v[0]+" "+t).toLowerCase(),l:v[0],s:"NFL",sub:"Team",h:"team-"+t,w:99});
  if(window.SOC_OK)for(const [id,t] of Object.entries(SOC_TM)){if(!(t[4]||[]).length)continue;L.push({k:(t[0]+" "+t[1]+" "+t[2]).toLowerCase(),l:t[0],s:"SOC",sub:"Team · "+(t[4]||[]).map(c=>(SOC_LG[c]||{}).sh||c).join(", "),h:"soccer-team-"+id,w:90})}
  if(window.SOC_P_OK)for(const [aid,P] of Object.entries(SOC_P)){if(P[3].length<2)continue;L.push({k:P[0].toLowerCase(),l:P[0],s:"SOC",sub:`${typeof socTm!=="undefined"?socTm(P[1]):""} · ${P[2]||""}`,h:"soccer-player-"+aid,w:P[3].length})}
  for(const x of L){x.n=srchNorm(x.l+(x.sub==="Team"?" "+x.k:""));x.tk=x.n.split(" ").filter(Boolean);x.ini=srchNorm(x.l).split(/[ -]+/).filter(Boolean).map(w=>w[0]).join("")}
  return SRCH=L;
}
/* 🔎 smarter search: ignores accents and punctuation (Jokic = Jokić, DAngelo = D'Angelo), knows initials (SGA, KD, CMC)
   and a few well-known nicknames, and forgives a typo or two (“Jokci”, “Mahommes”). Exact matches always rank first. */
function srchNorm(t){return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[.'’`]/g,"").replace(/[-_/]/g," ").replace(/\s+/g," ").trim()}
const SRCH_NICK={"king james":"LeBron James","lbj":"LeBron James","bron":"LeBron James","greek freak":"Giannis Antetokounmpo","joker":"Nikola Jokic","the joker":"Nikola Jokic",
  "steph":"Stephen Curry","chef curry":"Stephen Curry","the brow":"Anthony Davis","cp3":"Chris Paul","the beard":"James Harden","spida":"Donovan Mitchell","wemby":"Victor Wembanyama",
  "ant":"Anthony Edwards","ant man":"Anthony Edwards","book":"Devin Booker","dame":"Damian Lillard","jimmy buckets":"Jimmy Butler","zion":"Zion Williamson","melo":"LaMelo Ball",
  "ovi":"Alex Ovechkin","mcdavid":"Connor McDavid","the great 8":"Alex Ovechkin","geno":"Evgeni Malkin","sid":"Sidney Crosby","sid the kid":"Sidney Crosby",
  "cmc":"Christian McCaffrey","jj":"Justin Jefferson","ceedee":"CeeDee Lamb","saquon":"Saquon Barkley","king henry":"Derrick Henry","tyreek":"Tyreek Hill","cheetah":"Tyreek Hill",
  "lamar":"Lamar Jackson","josh":"Josh Allen","burrow":"Joe Burrow","joey b":"Joe Burrow","amon ra":"Amon-Ra St. Brown","arsb":"Amon-Ra St. Brown","jsn":"Jaxon Smith-Njigba","bijan":"Bijan Robinson"};
/* team nicknames -> part of the official name (| = several teams share it) */
const SRCH_TEAM_NICK={"niners":"49ers","sixers":"76ers","habs":"canadiens","cavs":"cavaliers","mavs":"mavericks","wolves":"timberwolves|wolverhampton","pens":"penguins","caps":"capitals","bolts":"lightning|chargers",
  "canes":"hurricanes","sens":"senators","isles":"islanders","avs":"avalanche","preds":"predators","dubs":"warriors","clips":"clippers","nugs":"nuggets","blazers":"trail blazers","sonics":"thunder","pels":"pelicans","grizz":"grizzlies",
  "pats":"patriots","bucs":"buccaneers","jags":"jaguars","fins":"dolphins","g men":"giants","boys":"cowboys","birds":"eagles","hawks":"hawks|seahawks","blues":"st louis blues|chelsea","kings":"kings",
  "gunners":"arsenal","spurs":"spurs|tottenham","man utd":"manchester united","man u":"manchester united","man united":"manchester united","man city":"manchester city","city":"manchester city","united":"manchester united|newcastle",
  "the reds":"liverpool","toffees":"everton","villa":"aston villa","forest":"nottingham","barca":"barcelona","atleti":"atletico","real":"real madrid","inter":"internazionale|inter","juve":"juventus","milan":"milan",
  "bvb":"dortmund","dortmund":"dortmund","leverkusen":"leverkusen","psg":"paris saint","om":"marseille","ol":"lyon","bayern":"bayern"};
function srchLev(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;let pp=null,p=Array.from({length:b.length+1},(_,j)=>j);
  for(let i=1;i<=a.length;i++){const c=[i];let mn=i;for(let j=1;j<=b.length;j++){c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));
      if(pp&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])c[j]=Math.min(c[j],pp[j-2]+1);mn=Math.min(mn,c[j])}if(mn>max)return max+1;pp=p;p=c}return p[b.length]}
function srchFind(q0){const q=srchNorm(q0),W=q.split(" ").filter(Boolean),I=searchIndex(),out=new Map();if(!W.length)return [];
  const put=(x,t,via)=>{const o=out.get(x);if(!o||o._t>t)out.set(x,{...x,_t:t,_via:via||""})};
  for(const x of I)if(W.every(w=>x.n.includes(w)))put(x,x.n.startsWith(q)||x.tk.some(t=>t.startsWith(q))?0:0.5);
  const nk=SRCH_NICK[q];if(nk){const nn=srchNorm(nk);for(const x of I)if(!/^Team/.test(x.sub)&&srchNorm(x.l)===nn)put(x,0.2,q0.trim())}
  if(/^[a-z]{2,4}$/.test(q))for(const x of I)if(!/^Team/.test(x.sub)&&x.ini===q)put(x,0.3,q0.trim().toUpperCase());
  const tn=SRCH_TEAM_NICK[q];if(tn)for(const part of tn.split("|")){const pn=srchNorm(part);for(const x of I)if(/^Team/.test(x.sub)&&x.n.includes(pn))put(x,0.1,q0.trim())}
  if(!out.size)for(const x of I){let ok=true;for(const w of W){if(w.length<4){if(!x.tk.some(t=>t.startsWith(w))){ok=false;break}continue}
      const m=w.length>=7?2:1;if(!x.tk.some(t=>srchLev(w,t,m)<=m||(t.length>w.length&&srchLev(w,t.slice(0,w.length),m)<=m))){ok=false;break}}
    if(ok)put(x,2)}
  return [...out.values()].sort((a,b)=>a._t-b._t||(/^Team/.test(b.sub)-/^Team/.test(a.sub))||b.w-a.w).slice(0,10)}
function appSearchSetup(){
  const inp=document.getElementById("plSearch"),box=document.getElementById("plRes");if(!inp)return;
  inp.addEventListener("focus",()=>{if(typeof nhlEnsure!=="undefined")nhlEnsure();if(typeof socEnsure!=="undefined"){socEnsure();setTimeout(()=>socPEnsure(),1200)}});
  inp.placeholder="🔍 Search any player or team (all sports)";
  const draw=()=>{const q=inp.value.trim().toLowerCase();if(q.length<2){box.innerHTML="";box.hidden=true;return}
    const hit=srchFind(q);const fz=hit.length&&hit[0]._t===2;
    box.innerHTML=hit.length?(fz?'<div class="small" style="padding:6px 8px 2px">No exact match — did you mean:</div>':"")+hit.map((x,i)=>`<button data-i="${i}"><span class="stag ${x.s==="NBA"?"nb":x.s==="NHL"?"nh":x.s==="SOC"?"sc":"nf"}">${x.s==="SOC"?"⚽":x.s}</span> <span>${/^Team/.test(x.sub)?"🛡️ ":""}${esc(x.l)}</span><small>${esc(x.sub)}${x._via?` · “${esc(x._via)}”`:""}</small></button>`).join(""):'<div class="small" style="padding:8px">Nothing found — try a last name or team</div>';
    box.hidden=false;box._hits=hit};
  inp.oninput=draw;inp.onfocus=draw;
  inp.onkeydown=e=>{if(e.key==="Enter"){const b=box.querySelector("button");if(b)b.click()}if(e.key==="Escape"){inp.value="";draw();inp.blur()}};
  box.onclick=e=>{const b=e.target.closest("button");if(!b)return;const x=box._hits[+b.dataset.i];inp.value="";draw();inp.blur();
    if(x.nfl){LS.set("sport","nfl");if(typeof goPlayer!=="undefined")goPlayer(x.nfl)}else location.hash=x.h};
  document.addEventListener("click",e=>{if(!e.target.closest(".psearch"))box.hidden=true});
}

/* ===== Bottom tab bar (phones) + More sheet ===== */
function curSport(){const h=(location.hash||"").slice(1);if(h.startsWith("nba"))return "nba";if(h.startsWith("nhl"))return "nhl";if(h.startsWith("soccer"))return "soc";if(["games","plays","props","public","weeks","trends","injuries","bets","standings"].some(x=>h===x||h.startsWith(x))||h.startsWith("game-"))return "nfl";const s=LS.get("sport","nba");return s==="nfl"||s==="nhl"||s==="soc"?s:"nba"}
function tabbarRender(){
  let bar=document.getElementById("tabbar");if(!bar){bar=document.createElement("nav");bar.id="tabbar";document.body.appendChild(bar)}
  const sp=curSport(),h=(location.hash||"#today").slice(1)||"today";
  const T=[["today","🏠","Today","#today"],["games",sp==="nba"?"🏀":sp==="nhl"?"🏒":sp==="soc"?"⚽":"🏈","Games",sp==="nba"?"#nba":sp==="nhl"?"#nhl":sp==="soc"?"#soccer":"#games"],["props","🎯","Props",sp==="nba"?"#nba-best":sp==="nhl"?"#nhl-props":sp==="soc"?"#soccer-props":"#props"],["bets","🎟️","My Bets","#bets"],["more","☰","More",""]];
  const on=k=>k==="today"?h==="today":k==="games"?(h==="nba"||h==="nhl"||h==="soccer"||h.startsWith("soccer-game")||h.startsWith("nhl-game")||h==="games"||h==="nextweek"||h.startsWith("nba-tomorrow")||h.startsWith("nba-game")||h.startsWith("game-")):k==="props"?/^(nba-props|nba-best|props|nhl-props|soccer-props)$/.test(h):k==="bets"?h==="bets":false;
  const nb=typeof uxBetsCount!=="undefined"?uxBetsCount():0;
  bar.innerHTML=T.map(([k,i,l,href])=>k==="more"?`<button data-more="1"><b>${i}</b><span>${l}</span></button>`:`<a href="${href}" class="${on(k)?"on":""}"><b>${i}${k==="bets"&&nb?`<em class="tbn">${nb}</em>`:""}</b><span>${l}</span></a>`).join("");
  bar.querySelector("[data-more]").onclick=moreOpen;
}
function moreOpen(){
  let sh=document.getElementById("moresheet");if(!sh){sh=document.createElement("div");sh.id="moresheet";document.body.appendChild(sh)}
  const nba=[["#nba","🏀 Games"],["#nba-best","🔥 Best props"],["#nba-props","🎯 All props"],["#nba-players","👤 Players"],["#nba-teams","📊 Standings"],["#nba-scores","🧾 Scores"],["#nba-injuries","🚑 Injuries"]];
  const nfl=[["#games","🏈 Games"],["#plays","⭐ Plays of the Week"],["#props","🎯 Player props"],["#weeks","🧾 Scores"],["#standings","📊 Standings & trends"],["#injuries","🚑 Injuries"],["#bets","🎟️ My bets"]];
  const nhl=[["#nhl","🏒 Games"],["#nhl-props","🎯 Player props"],["#nhl-scores","🧾 Scores"],["#nhl-standings","📊 Standings"],["#nhl-injuries","🚑 Injuries"]];
  const all=[["#record","📒 Our record"],["#favs","⭐ Favorites"],["#bets","🎟️ My bets"],["#calc","🧮 Odds calculator"],["#guide","📘 Betting 101"]];
  const grp=(t,L)=>`<h3>${t}</h3><div class="mgrid">${L.map(([h,l])=>`<a href="${h}">${l}</a>`).join("")}</div>`;
  const of=typeof ODDS_FMT!=="undefined"?ODDS_FMT:"am";
  sh.innerHTML=`<div class="msback"></div><div class="mspanel"><div class="msgrab"></div>${grp("NBA",nba)}${grp("NHL",nhl)}${grp("NFL",nfl)}${grp("More",all)}
   <h3>Odds format</h3><div class="seg" id="msOdds"><button data-f="am" class="${of==="am"?"on":""}">American (−110)</button><button data-f="dec" class="${of==="dec"?"on":""}">Decimal (1.91)</button></div>
   <h3>Theme</h3>${typeof uxThemeSeg!=="undefined"?uxThemeSeg():""}<h3>View</h3>${typeof uxViewSeg!=="undefined"?uxViewSeg():""}
   <button class="btn" id="msClose" style="width:100%;margin-top:14px">Close</button></div>`;
  sh.querySelectorAll("#msOdds button").forEach(b=>b.onclick=()=>{if(typeof setOddsFmt!=="undefined"){setOddsFmt(b.dataset.f);if(typeof syncOddsBtns!=="undefined")syncOddsBtns();sh.className="";route()}});
  sh.className="open";const close=()=>{sh.className=""};
  sh.querySelector(".msback").onclick=close;sh.querySelector("#msClose").onclick=close;sh.querySelectorAll("a").forEach(a=>a.onclick=close);
}

/* ===== Today page (both sports) ===== */
function todayLive(){
  const rows=[];
  if(typeof LIVE!=="undefined"){
    for(const [sp,M] of [["NBA",LIVE.nba],["NHL",LIVE.nhl||{}],["NFL",LIVE.nfl]])for(const [k,g] of Object.entries(M||{})){if(k.includes("@")||g.st!=="in")continue;rows.push(liveBar(sp.toLowerCase(),g))}
  }
  return rows.length?`<div class="card"><h2 style="margin-bottom:6px"><span class="lvdot"></span>&nbsp; Live now</h2>${rows.join("")}</div>`:"";
}
function favListHtml(full){
  const emptyFav=`<div class="card tip"><b>⭐ No favorites yet.</b> Open any player or team page (NBA, NHL or NFL) and tap <b>☆ Save</b> next to the name. They'll show up here and at the top of Today, every day, with their lines.<div style="margin-top:8px"><a class="btn" href="#nba-players">Find an NBA player</a> <a class="btn" href="#props">Find an NFL player</a></div></div>`;
  const F=favs();let favHtml="";
  if(F.length){
    const items=F.map(f=>{
      if(f.t==="nbap"&&typeof NBA_LOGS!=="undefined"&&NBA_LOGS[f.id]){const p=NBA_LOGS[f.id],g=nbaGameOf(p.tm),pr=NBA_PROPS.filter(r=>r[0]===f.id);
        return `<a class="fv" href="#nba-player-${encodeURIComponent(f.id)}"><b>⭐ ${esc(f.id)}</b><span class="small">${p.tm} · ${g?(nbaStarted(g)?"game started":`${g.a===p.tm?"@":"vs"} ${g.a===p.tm?g.h:g.a} ${g.t}`):"no game today"}${pr.length&&g&&!nbaStarted(g)?` · ${pr.length} lines: ${pr.slice(0,3).map(r=>`${NBA_MK[r[1]]?NBA_MK[r[1]][2]:r[1]} ${r[2]}`).join(", ")}${pr.length>3?"…":""}`:""}</span></a>`}
      if(f.t==="nbat"&&typeof NBA_TEAM!=="undefined"&&NBA_TEAM[f.id]){const g=nbaGameOf(f.id),x=NBA_TEAM[f.id];
        return `<a class="fv" href="#nba-team-${f.id}"><b>⭐ ${esc(nbaTm(f.id))}</b><span class="small">${x.w}-${x.l} · ${g?`${g.a===f.id?"@":"vs"} ${g.a===f.id?g.h:g.a} ${g.t}`:"no game today"}</span></a>`}
      if(f.t==="nhlp"&&typeof nhWho!=="undefined"&&nhWho(f.id)){const p=nhWho(f.id),g=nhGameOf(p.tm),pr=NHL_PROPS.filter(r=>r[0]===f.id&&NH_MK[r[1]]);
        return `<a class="fv" href="#nhl-player-${encodeURIComponent(f.id)}"><b>⭐ ${esc(f.id)}</b><span class="small">🏒 ${p.tm} · ${g?(nhStarted(g)?"game started":`${g.a===p.tm?"@":"vs"} ${g.a===p.tm?g.h:g.a} ${g.d===NHL_DATE?"today":nhDayS(g.d).split(",")[0]} ${g.t}`):"no game soon"}${pr.length&&g&&!nhStarted(g)?` · ${pr.slice(0,3).map(r=>`${NH_MK[r[1]][0]} ${r[2]}`).join(", ")}`:""}</span></a>`}
      if(f.t==="nhlt"&&typeof NHL_TEAM!=="undefined"&&NHL_TEAM[f.id]){const g=nhGameOf(f.id);
        return `<a class="fv" href="#nhl-team-${f.id}"><b>⭐ ${esc(nhTm(f.id))}</b><span class="small">🏒 ${nhRec(f.id)} · ${g?`${g.a===f.id?"@":"vs"} ${g.a===f.id?g.h:g.a} ${g.d===NHL_DATE?"today":nhDayS(g.d).split(",")[0]} ${g.t}`:"no game soon"}</span></a>`}
      if(f.t==="nflp"&&typeof PINFO!=="undefined"&&PINFO[f.id]){const P=PINFO[f.id],o=oppOf(P.team),MK=marketsFor(P.pos).filter(m=>realProp(f.id,m));
        return `<a class="fv" href="#" data-nflfav="${esc(f.id)}"><b>⭐ ${esc(f.id)}</b><span class="small">${P.team} ${P.pos} · ${o?`${o.home?"vs":"@"} ${o.opp} ${esc(o.g.when)}`:"no game this week"}${MK.length?` · ${MK.slice(0,3).map(m=>`${MARKETS[m].n} ${realProp(f.id,m)[0]}`).join(", ")}`:""}</span></a>`}
      return "";}).join("");
    if(!items)return emptyFav;
    favHtml=`<div class="card"><h2 style="margin-bottom:6px">⭐ My favorites</h2>${items}${full?"":`<a href="#favs" class="small" style="display:block;margin-top:8px;color:var(--text2)">Open Favorites page →</a>`}<div class="small" style="margin-top:6px">Tap ☆ Save on any player or team page to add more.</div></div>`;
  }else favHtml=emptyFav;
  return favHtml;
}
function viewFavs(){if(typeof nhlEnsure!=="undefined"&&!NHL_READY&&favs().some(f=>f.t==="nhlp"||f.t==="nhlt")){nhlEnsure(()=>viewFavs())}const host=document.getElementById("v-favs");if(!host)return;const n=favs().length;
  host.innerHTML=`<h1>⭐ Favorites</h1><p class="sub">${n?`${n} saved · `:""}Saved on this phone/browser only. Tap a name for today's lines and stats.</p>${favListHtml(true)}`;
  host.querySelectorAll("[data-nflfav]").forEach(el=>el.onclick=e=>{e.preventDefault();if(typeof goPlayer!=="undefined")goPlayer(el.dataset.nflfav.replace(/&amp;/g,"&"))});}
/* ===== Today: one clean screen — summary, plays, best of tonight, games, then extras folded away ===== */
let TODAY_T={plays:"",games:""};
function todayRowsNba(){const G=(typeof NBA_SLATE!=="undefined"?NBA_SLATE:[]);return G.map(g=>{const L=NBA_LINES[g.a+"@"+g.h],fav=L?(L.sp<=0?g.h:g.a):null,st=nbaStarted(g);
  return `<a class="tgr" href="#nba-game-${g.id}"><span class="tt">${st?"<b class='up'>LIVE</b>":esc(g.t)}</span><span class="tm">${nbaBadge(g.a)} <span class="small">@</span> ${nbaBadge(g.h)}</span><span class="tl">${L?`${esc(fav)} −${Math.abs(L.sp)} · ${L.tot}`:""}</span></a>`}).join("")}
function todayRowsNhl(){if(typeof NHL_SLATE==="undefined"||!NHL_DATE)return `<div class="small">Loading NHL…</div>`;return NHL_SLATE.map(g=>{const st=nhStarted(g),fin=g.as!=null&&["OFF","FINAL"].includes(g.st);
  return `<a class="tgr" href="#nhl-game-${g.id}"><span class="tt">${fin?"FINAL":st?"<b class='up'>LIVE</b>":esc(g.t)}</span><span class="tm">${nhBadge(g.a)} <span class="small">@</span> ${nhBadge(g.h)}</span><span class="tl">${fin?`${g.as}-${g.hs}`:g.ml?`${nhOdds(g.ml[0])} / ${nhOdds(g.ml[1])}${g.tot?" · "+g.tot[0]:""}`:""}</span></a>`}).join("")||`<div class="small">No NHL games today.</div>`}
function todayRowsNfl(){const G=(typeof SLATE!=="undefined"?SLATE.filter(g=>!g.final):[]);return G.slice(0,10).map(g=>{const L=LINES[g.id];
  return `<a class="tgr" href="#game-${g.id}"><span class="tt">${esc(String(g.when).split("·")[0].replace(/^\w+\s/,""))}</span><span class="tm">${badge(g.away)} <span class="small">@</span> ${badge(g.home)}</span><span class="tl">${L?`${esc(L.sp<=0?g.home:g.away)} −${Math.abs(L.sp)} · ${L.tot}`:esc((String(g.when).split("·")[1]||"").trim())}</span></a>`}).join("")||`<div class="small">No NFL games left this week.</div>`}
function todayTabs(key,T,cur){return `<div class="seg ttabs">${T.map(([k,l])=>`<button class="btn${k===cur?" on":""}" data-tt="${key}|${k}">${l}</button>`).join("")}</div>`}
function viewToday(){
  const host=document.getElementById("v-today");if(!host)return;
  if(typeof nhlEnsure!=="undefined"&&!NHL_READY&&!NHL_DATE)nhlEnsure(()=>{if(((location.hash||"#today").slice(1)||"today")==="today")viewToday()});
  const nbaGames=(typeof NBA_SLATE!=="undefined"?NBA_SLATE:[]),nhlGames=(typeof NHL_SLATE!=="undefined"?NHL_SLATE:[]),nflUp=(typeof SLATE!=="undefined"?SLATE.filter(g=>!g.final):[]);
  const today=new Date().toLocaleDateString("en-US",{timeZone:"America/Toronto",weekday:"long",month:"long",day:"numeric"});
  const T=typeof recAll!=="undefined"?recSum(recAll()):null;
  /* plays: one card, a tab per sport */
  const nflPlays=typeof PLAYS!=="undefined"&&PLAYS.length?`<div class="card potd"><h2 style="margin-bottom:6px">🏈 NFL Plays of the Week</h2>${PLAYS.map((pl,i)=>{const d=playData(pl);if(!d)return "";const g=gradeOne(pl,PLAYS_WEEK,d);return `<a class="fv" href="#plays"><b>${i+1}. ${esc(d.title)}</b><span class="small">${d.odds!=null?oddsFmt(d.odds)+" · ":""}${g.r==="win"?"✅ Win":g.r==="loss"?"❌ Loss":g.r==="pending"?"Pending":esc(g.r)}</span></a>`}).join("")}<a href="#plays" class="small" style="display:block;margin-top:8px">Why we like them →</a></div>`:"";
  const PT=[["nba","🏀 NBA",typeof nbaPlaysCard!=="undefined"?nbaPlaysCard():""],["nhl","🏒 NHL",typeof nhlPlaysCard!=="undefined"?nhlPlaysCard():""],["nfl","🏈 NFL",nflPlays],["soc","⚽ Soccer",typeof socPlaysCard!=="undefined"?socPlaysCard():""]].filter(x=>x[2]);
  const pc=PT.some(x=>x[0]===TODAY_T.plays)?TODAY_T.plays:(PT[0]||[])[0];
  const GT=[["nba",`🏀 NBA <small>${nbaGames.length}</small>`,todayRowsNba],["nhl",`🏒 NHL <small>${nhlGames.length||""}</small>`,todayRowsNhl],["nfl",`🏈 NFL <small>${nflUp.length}</small>`,todayRowsNfl],["soc",`⚽ Soccer <small>${typeof socTodayCount!=="undefined"&&socTodayCount()!=null?socTodayCount():""}</small>`,typeof todayRowsSoc!=="undefined"?todayRowsSoc:()=>""]];
  const gc=TODAY_T.games||(nbaGames.some(g=>!nbaStarted(g))?"nba":nhlGames.length?"nhl":"nfl");
  const moves=typeof loMovesCard!=="undefined"?["nba","nhl","nfl"].map(sp=>loMovesCard(sp,5)).join(""):"";
  const role=nbaGames.some(g=>!nbaStarted(g))&&typeof nbaRoleCard!=="undefined"?nbaRoleCard(5):"";
  host.innerHTML=`<h1>Today</h1><p class="sub">${today} · <span class="freshtx"></span></p>
  <div class="tsum"><a href="#nba"><b>${nbaGames.length}</b><span>NBA games</span></a><a href="#nhl"><b>${nhlGames.length||"–"}</b><span>NHL games</span></a><a href="#games"><b>${nflUp.length}</b><span>NFL games left</span></a>${typeof socTodayCount!=="undefined"&&socTodayCount()?`<a href="#soccer"><b>${socTodayCount()}</b><span>Soccer matches</span></a>`:""}${T?`<a href="#record"><b class="${T.u>0?"up":T.u<0?"dn":""}">${recLine(T)}</b><span>our record · ${(T.u>0?"+":"")+T.u.toFixed(1)}u</span></a>`:""}${typeof finTonightTile!=="undefined"?finTonightTile():""}</div>
  ${typeof pxRecentHtml!=="undefined"?pxRecentHtml(null,6):""}
  <div id="todayLive">${todayLive()}</div>
  ${favs().length?`<div class="tsec">${favListHtml(false)}</div>`:""}
  ${PT.length?`<h2 class="tsh">⭐ Today's plays</h2>${PT.length>1?todayTabs("plays",PT,pc):""}<div class="tsec">${(PT.find(x=>x[0]===pc)||PT[0])[2]}</div>`:""}
  <h2 class="tsh">🔥 Best of tonight</h2><div id="xTonight" class="tsec tcap5">${typeof xTonightCard!=="undefined"?xTonightCard().replace(/<h2[^>]*>.*?<\/h2>/,""):""}</div>
  <h2 class="tsh">🗓️ Games</h2>${todayTabs("games",GT,gc)}<div class="card tsec tcap5">${(GT.find(x=>x[0]===gc)||GT[0])[2]()}<button class="btn tmorebtn" data-tcap="1">Show all</button>
   <a href="${gc==="nba"?"#nba":gc==="nhl"?"#nhl":gc==="soc"?"#soccer":"#games"}" class="small" style="display:block;margin-top:8px">All ${gc==="soc"?"soccer matches":gc.toUpperCase()+" games"}, matchups &amp; props →</a></div>
  ${moves||role?`<details class="tmore"><summary>📈 Line moves${role?" &amp; role changes":""} <span class="small">— tap to open</span></summary><div class="grid g2" style="margin-top:10px">${moves}${role}</div></details>`:""}
  ${favs().length?"":`<p class="small" style="margin-top:14px">⭐ Tip: tap ☆ Save on any player or team page to pin them here every day.</p>`}
  <details class="tmore"><summary>🕒 When the data was updated</summary><div style="margin-top:8px">${updatedHtml("nba")}${updatedHtml("nfl")}</div></details>`;
  host.querySelectorAll("[data-tt]").forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.tt.split("|");TODAY_T[k]=v;const y=scrollY;viewToday();scrollTo(0,y)});
  if(typeof freshPaint!=="undefined")freshPaint();
  host.querySelectorAll(".tcap5").forEach(c=>{const R=[...c.querySelectorAll(".nher,.tgr")],b0=c.querySelector("[data-tcap]");if(R.length<=5){if(b0)b0.remove();return}
    R.slice(5).forEach(r=>r.classList.add("tcaph"));const b=b0||(c.insertAdjacentHTML("beforeend",`<button class="btn tmorebtn" data-tcap="1"></button>`),c.querySelector("[data-tcap]"));
    b.textContent=`Show all ${R.length}`;b.onclick=()=>{R.forEach(r=>r.classList.remove("tcaph"));b.remove()}});
  host.querySelectorAll("[data-bp]").forEach(b=>b.onclick=e=>{if(e.target.closest("[data-act]"))return;nbaGoPlayer(nbaUnesc(b.dataset.nm),b.dataset.bp.split("|")[0])});
  host.querySelectorAll("[data-shimg=nba]").forEach(b=>b.onclick=e=>{e.stopPropagation();shareNbaPlays()});
  host.querySelectorAll("[data-nflp]").forEach(el=>el.onclick=()=>{S.prop={player:el.dataset.nflp.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"'),market:el.dataset.k,open:true};location.hash="props"});
  host.querySelectorAll("[data-nflfav]").forEach(el=>el.onclick=e=>{e.preventDefault();if(typeof goPlayer!=="undefined")goPlayer(el.dataset.nflfav.replace(/&amp;/g,"&"))});
}

/* ===== Age check (first visit) — skipped for automated test browsers ===== */
function ageGate(){
  if(LS.get("age_ok",false)||navigator.webdriver)return;
  const d=document.createElement("div");d.id="agegate";
  d.innerHTML=`<div class="agbox"><div class="logo" style="margin:0 auto 12px">RLA</div><h2 style="margin:0 0 8px">Are you of legal betting age?</h2>
   <p>This site is sports-betting research. You must be <b>21+</b> (18+ in some US states; 18+ in Quebec, 19+ in Ontario and most of Canada).</p>
   <button class="btn agyes">Yes, I'm of legal age</button><button class="btn agno">No</button>
   <p class="small" style="margin-top:12px">Gambling problem? Call or text <b>1-800-GAMBLER</b>. Quebec: Jeu : aide et référence 1-800-461-0140 · Ontario: ConnexOntario 1-866-531-2600.</p></div>`;
  document.body.appendChild(d);document.body.classList.add("gated");
  d.querySelector(".agyes").onclick=()=>{LS.set("age_ok",true);d.remove();document.body.classList.remove("gated")};
  d.querySelector(".agno").onclick=()=>{d.querySelector(".agbox").innerHTML=`<h2>Thanks for being honest 👋</h2><p>Come back when you're of legal age. Sports are more fun without money on them anyway.</p><p class="small">If someone you know is struggling with gambling: <b>1-800-GAMBLER</b>.</p>`};
}

/* ===== hooks ===== */
function appAfterRoute(){tabbarRender();favDecorate();if(typeof uxCollapse!=="undefined")setTimeout(()=>{uxCollapse();if(typeof xaPlayerChipsInject!=="undefined")xaPlayerChipsInject();if(typeof freshLateInject!=="undefined")freshLateInject();if(typeof uxFoldCards!=="undefined")uxFoldCards();if(typeof uxJump!=="undefined")uxJump()},0);{const ms=document.getElementById("moresheet");if(ms)ms.className=""}
  const h=(location.hash||"").slice(1),host=document.getElementById("banner");
  if(host&&(h==="nba"||h==="games"||h==="nba-props"||h==="nba-best"||h==="props")){host.innerHTML=updatedHtml(h.startsWith("nba")?"nba":"nfl")}
}
window.addEventListener("hashchange",()=>setTimeout(appAfterRoute,40));
window.addEventListener("load",()=>{setTimeout(appAfterRoute,60);ageGate()});
/* NFL player view re-renders on market tabs: watch for it */
new MutationObserver(()=>{if(/^#props(\/|$)/.test(location.hash||""))favDecorate()}).observe(document.documentElement,{childList:true,subtree:true});

/* ===== NBA role changes: minutes trend + lineup moves ===== */
function nbaRole(nm){
  const p=typeof NBA_LOGS!=="undefined"&&NBA_LOGS[nm];if(!p||p.g.length<5)return null;
  const g=p.g,l3=g.slice(-3),pr=g.slice(0,-3),av=a=>a.reduce((s,x)=>s+x[4],0)/a.length;
  const d=av(l3)-av(pr),st3=l3.filter(x=>x[9]).length,stP=pr.filter(x=>x[9]).length/pr.length;
  const out=[];
  if(g.slice(-2).every(x=>x[9])&&stP<.5)out.push({t:"🚀 Moved into the starting lineup",c:"o",w:3});
  else if(g.slice(-2).every(x=>!x[9])&&stP>=.7)out.push({t:"⬇️ Moved to the bench",c:"u",w:3});
  if(d>=5)out.push({t:`📈 Minutes up ${d.toFixed(1)}/game last 3 (${av(l3).toFixed(1)} vs ${av(pr).toFixed(1)})`,c:"o",w:d/5});
  else if(d<=-5)out.push({t:`📉 Minutes down ${Math.abs(d).toFixed(1)}/game last 3 (${av(l3).toFixed(1)} vs ${av(pr).toFixed(1)})`,c:"u",w:-d/5});
  return out.length?out:null;
}
function nbaRoleTag(nm){const R=nbaRole(nm);return R?`<div class="roles">${R.map(r=>`<span class="pll ${r.c}">${r.t}</span>`).join("")}</div>`:""}
function nbaRoleList(){
  if(typeof NBA_SLATE==="undefined")return [];const teams=NBA_SLATE.flatMap(g=>[g.a,g.h]),L=[];
  for(const [n,p] of Object.entries(NBA_LOGS)){if(!teams.includes(p.tm)||/out/i.test((nbaInjOf(n)||[])[2]||""))continue;const R=nbaRole(n);if(R)L.push({n,p,R,w:Math.max(...R.map(r=>r.w))})}
  return L.sort((a,b)=>b.w-a.w);
}
function nbaRoleCard(max){const L=nbaRoleList().slice(0,max||8);if(!L.length)return "";
  return `<div class="card"><h2 style="margin-bottom:2px">📈 Role changes tonight</h2><div class="small" style="margin-bottom:6px">Players whose minutes or starting spot just changed — prop lines are often slow to catch up.</div>
  ${L.map(x=>`<a class="fv" href="#nba-player-${encodeURIComponent(x.n)}"><b>${esc(x.n)} <span class="small">${x.p.tm}</span></b>${x.R.map(r=>`<span class="small ${r.c==="o"?"up":"dn"}">${r.t}</span>`).join("")}</a>`).join("")}</div>`}

/* ===== Track / parlay buttons: one action menu for every bet button ===== */
function nbaSpec(nm,k,side){
  const r=NBA_PROPS.find(x=>x[0]===nm&&x[1]===k),p=NBA_LOGS[nm];if(!r||!p)return null;const g=nbaGameOf(p.tm);
  const bp=typeof nbaBestPrice!=="undefined"?nbaBestPrice(r,side==="over"?"o":"u"):null;
  return {k:"nbaprop",player:nm,market:k,side,line:r[2],odds:bp?bp[0]:(side==="over"?r[3]:r[4]),book:bp?bp[1]:r[5],team:p.tm,opp:g?(g.a===p.tm?g.h:g.a):"",home:g?g.h===p.tm:false,date:NBA_SLATE_DATE,wk:NBA_SLATE_DATE};
}
function nhlSpec(nm,k,side){
  if(typeof NHL_PROPS==="undefined")return null;const r=NHL_PROPS.find(x=>x[0]===nm&&x[1]===k),w=r&&nhWho(nm);if(!r||!w)return null;const g=nhGameOf(w.tm);
  const alt=typeof loAltOdds!=="undefined"?loAltOdds(nm,k):null,line=alt?alt.line:r[2],odds=alt?(side==="over"?alt.o:alt.u):(side==="over"?r[3]:r[4]);if(odds==null)return null;
  return {k:"nhlprop",player:nm,market:k,side,line,odds,book:alt?(side==="over"?alt.ob:alt.ub):r[5],team:w.tm,opp:g?(g.a===w.tm?g.h:g.a):"",home:g?g.h===w.tm:false,date:g?g.d:NHL_DATE,wk:g?g.d:NHL_DATE};
}
function actBtn(spec,label,cls){if(!spec)return "";return `<button class="obtn ${cls||""}" data-act='${esc(JSON.stringify(spec))}'>${label}</button>`}
function nbaOddsBtns(nm,k){const o=nbaSpec(nm,k,"over"),u=nbaSpec(nm,k,"under");if(!o)return "";
  return `<div class="obrow">${o.odds!=null?actBtn(o,`Over ${o.line} <b>${oddsFmt(o.odds)}</b>`,"ov"):""}${u.odds!=null?actBtn(u,`Under ${u.line} <b>${oddsFmt(u.odds)}</b>`,"un"):""}${snapBtn("nba",nm,k)}</div>`}
function legHit(s){try{
  if(s.k==="nhlprop"){const sc=typeof nhScore!=="undefined"&&nhScore(s.player,s.market,s.line,s.side==="over"?"o":"u");return sc?sc.p:null}
  if(s.k==="nbaprop"){const e=nbaEval(s.player,s.market,s.line,s.side==="over"?"o":"u",s.odds,s.book,s.opp);return e?e.sc:null}
  if(s.k==="prop"&&typeof nflEval!=="undefined"){const e=nflEval(s.player,s.market,s.side==="over"?"o":"u");return e?e.sc:null}}catch(e){}return null}
let ACT=null;
document.addEventListener("click",e=>{
  const m=document.getElementById("actmenu");
  const b=e.target.closest&&e.target.closest("[data-act]");
  if(m&&!e.target.closest("#actmenu")&&!b){m.remove();ACT=null}
  if(!b)return;e.preventDefault();e.stopPropagation();
  let spec;try{spec=JSON.parse(b.dataset.act.replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">"))}catch(err){return}
  ACT=spec;if(m)m.remove();
  const r=b.getBoundingClientRect(),d=document.createElement("div");d.id="actmenu";
  d.innerHTML=`<div class="small" style="margin-bottom:6px"><b style="color:var(--text)">${esc(betTitle(spec))}</b>${spec.odds!=null?" · "+oddsFmt(spec.odds):""}${spec.book?" · "+esc(spec.book):""}</div>
    <button class="btn" data-a="track">＋ Track in My Bets</button><button class="btn" data-a="slip">🎟 Add to parlay</button>`;
  document.body.appendChild(d);
  const W=Math.min(300,window.innerWidth-16);d.style.width=W+"px";d.style.left=Math.max(8,Math.min(window.innerWidth-W-8,r.left))+"px";
  d.style.top=(r.bottom+6+window.scrollY)+"px";
  d.querySelector('[data-a=track]').onclick=()=>{addBet(ACT);d.remove()};
  d.querySelector('[data-a=slip]').onclick=()=>{slipAdd(ACT);d.remove()};
},true);

/* ===== Parlay slip ===== */
function slipGet(){return LS.get("slip",[])||[]}
function slipSet(a){LS.set("slip",a);slipRender()}
function slipAdd(s){const a=slipGet();const key=JSON.stringify([s.k,s.player,s.market,s.game,s.team]);
  if(a.some(x=>JSON.stringify([x.k,x.player,x.market,x.game,x.team])===key)){toast("That bet is already in your parlay (one side per market)");return}
  if(a.length>=10){toast("Max 10 legs");return}
  if(s.odds==null){s.odds=-110;s.est=true}
  a.push(s);slipSet(a);toast(`Added to parlay — ${a.length} leg${a.length>1?"s":""}`)}
function slipCalc(a){const dec=a.reduce((x,l)=>x*betDec(l.odds),1),am=dec>=2?Math.round((dec-1)*100):Math.round(-100/(dec-1));
  const hs=a.map(legHit),known=hs.every(h=>h!=null);return {dec,am,impl:1/dec,est:known?hs.reduce((x,h)=>x*h,1):null,hs}}
function slipRender(){
  let btn=document.getElementById("slipBtn");const a=slipGet();
  if(!a.length){if(btn)btn.remove();const p=document.getElementById("slipPanel");if(p)p.remove();return}
  if(!btn){btn=document.createElement("button");btn.id="slipBtn";document.body.appendChild(btn);btn.onclick=slipOpen}
  const c=slipCalc(a);btn.innerHTML=`🎟 Parlay · ${a.length} leg${a.length>1?"s":""} · <b>${a.length>1?(c.am>0?"+":"")+c.am:oddsFmt(a[0].odds)}</b>`;
  const p=document.getElementById("slipPanel");if(p&&p.classList.contains("open"))slipOpen();
}

/* ===== Same-game parlay check: do two legs tend to hit together? (from shared past games) ===== */
function sgpSame(x,y){
  if((x.k==="nbaprop"&&y.k==="nbaprop")||(x.k==="nhlprop"&&y.k==="nhlprop"))return [x.team,x.opp].sort().join()===[y.team,y.opp].sort().join();
  if(x.k==="prop"&&y.k==="prop"&&typeof oppOf!=="undefined"){if(x.team===y.team)return true;const o=oppOf(x.team);return !!(o&&o.opp===y.team)}
  return false}
function sgpLog(l){ // {key: hit(bool)}
  const M={},over=l.side==="over";
  if(l.k==="nbaprop"){for(const o of nbaAllG(l.player)){const v=nbaVal(o.x,l.market);M[o.x[1]]=over?v>l.line:v<l.line}}
  else if(l.k==="nhlprop"){for(const o of nhVals(l.player,l.market))M[o.x[0]]=over?o.v>l.line:o.v<l.line}
  else if(l.k==="prop"){for(const g of pLogs(l.player)){const v=stat(g,l.market);if(Number.isFinite(v))M[g.season+"-"+g.week]=over?v>l.line:v<l.line}}
  return M}
function sgpPair(x,y){
  const A=sgpLog(x),B=sgpLog(y),ks=Object.keys(A).filter(k=>k in B);const n=ks.length;if(n<5)return {n};
  const a=ks.filter(k=>A[k]).length,b=ks.filter(k=>B[k]).length,both=ks.filter(k=>A[k]&&B[k]).length,exp=a*b/n;
  const lift=a&&b?(both/n)/((a/n)*(b/n)):1;
  const sd=Math.sqrt(Math.max(.25,exp*(1-a/n)*(1-b/n))),z=(both-exp)/sd;
  return {n,a,b,both,exp,lift,z,tag:n<8?"n":z>=1.6&&lift>=1.25&&both-exp>=1.5?"t":z<=-1.6&&lift<=.75&&exp-both>=1.5?"a":"n"}}
function sgpHtml(a){
  const rows=[];let adj=1;
  for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){if(!sgpSame(a[i],a[j]))continue;const r=sgpPair(a[i],a[j]);
    const nm=l=>{const last=esc(l.player.split(" ").slice(-1)[0]);if(l.market==="anyTD")return last+" TD";const mk=l.k==="nhlprop"?(NH_MK[l.market]?NH_MK[l.market][2]:l.market):l.k==="nbaprop"?(NBA_MK[l.market]?NBA_MK[l.market][2]:l.market):(MARKETS[l.market]?MARKETS[l.market].n:l.market);return `${last} ${l.side==="over"?"O":"U"} ${l.line} ${esc(mk)}`};
    if(!r.lift){rows.push(`<div class="sgr"><b>${nm(a[i])} + ${nm(a[j])}</b><span class="small">Not enough shared games to check (${r.n}).</span></div>`);continue}
    if(r.tag!=="n")adj*=Math.max(.6,Math.min(1.6,1+(r.lift-1)*r.n/(r.n+10)));
    rows.push(`<div class="sgr ${r.tag}"><b>${r.tag==="t"?"🤝":r.tag==="a"?"⚔️":"➖"} ${nm(a[i])} + ${nm(a[j])}</b><span class="small">Both hit in <b>${r.both} of ${r.n}</b> shared games — about ${r.exp.toFixed(1)} if they were unrelated. ${r.tag==="t"?"They tend to <b class='up'>hit together</b>.":r.tag==="a"?"They tend to <b class='dn'>work against each other</b> — when one hits, the other often misses.":"No strong link either way."}</span></div>`)}
  return rows.length?{html:`<div class="sgp"><div class="small" style="font-weight:700;margin-bottom:4px">🔗 Same-game check (from past games they both played)</div>${rows.join("")}</div>`,adj}:null}
function slipOpen(){
  const a=slipGet();let p=document.getElementById("slipPanel");if(!p){p=document.createElement("div");p.id="slipPanel";document.body.appendChild(p)}
  const c=slipCalc(a),stake=LS.get("slipStake",10),pay=stake*c.dec;let SG=null;try{SG=sgpHtml(a)}catch(e){}
  const games={};a.forEach(l=>{const g=l.k==="nbaprop"||l.k==="nhlprop"?l.date+[l.team,l.opp].sort().join(""):l.team||l.game;if(g)games[g]=(games[g]||0)+1});
  const same=a.filter(l=>l.k==="nbaprop").map(l=>[l.team,l.opp].sort().join("-")).filter((x,i,arr)=>arr.indexOf(x)!==i).length;
  p.innerHTML=`<div class="msback"></div><div class="mspanel"><div class="msgrab"></div><h2 style="margin:4px 0 8px">🎟 Parlay builder</h2>
   ${a.map((l,i)=>`<div class="rcr"><div style="flex:1;min-width:0"><b>${esc(betTitle(l))}</b><div class="small">${oddsFmt(l.odds)}${l.est?" (assumed)":""}${l.book?" · "+esc(l.book):""}${c.hs[i]!=null?` · our chance ${Math.round(c.hs[i]*100)}%`:""}</div></div><button class="btn" data-rmleg="${i}">✕</button></div>`).join("")}
   <div class="grid g2" style="gap:8px;margin-top:10px">
    <div class="stat"><div class="l">Parlay odds</div><div style="font-size:22px;font-weight:800">${a.length>1?(c.am>0?"+":"")+c.am:oddsFmt(a[0].odds)}</div><div class="small">book's chance ${(c.impl*100).toFixed(1)}%</div></div>
    <div class="stat"><div class="l">Our estimate</div><div style="font-size:22px;font-weight:800">${c.est!=null?(c.est*100).toFixed(1)+"%":"–"}</div><div class="small">${c.est!=null?(c.est>c.impl?"<b class='up'>above</b> the book's price":"<b class='dn'>below</b> the book's price"):"needs hit scores for every leg"}</div></div>
   </div>
   <label class="small" style="display:block;margin-top:10px">Stake $ <input type="number" min="0" step="1" id="slipStake" value="${stake}" style="width:90px"></label>
   <div style="font-size:15px;margin-top:6px">Pays <b>$${pay.toFixed(2)}</b> (profit $${(pay-stake).toFixed(2)}) if all ${a.length} hit.</div>
   ${SG?SG.html+(c.est!=null&&Math.abs(SG.adj-1)>.03?`<div class="small" style="margin-top:6px">Adjusted for these links, our estimate is <b>${(Math.min(.99,c.est*SG.adj)*100).toFixed(1)}%</b> (vs ${(c.impl*100).toFixed(1)}% the book's price implies). Books price same-game parlays with these links in mind, so check the SGP odds at your book.</div>`:`<div class="small" style="margin-top:6px">Many books only allow legs from one game as a "same game parlay" (SGP), with their own price.</div>`):same?`<div class="small" style="margin-top:6px;color:#f3c75a">⚠️ Two legs come from the same game — results can be linked. Many books only allow these as a "same game parlay".</div>`:""}
   <div class="small" style="margin-top:6px">Every leg must win. Our estimate multiplies each leg's chance of winning, as if the legs were independent — a guide, not a guarantee.</div>
   <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" id="slipTrack" ${a.length<2?"disabled":""}>＋ Track this parlay</button><button class="btn" data-snap="parlay||">📸 Share</button><button class="btn" id="slipClear">Clear</button><button class="btn" id="slipClose">Close</button></div></div>`;
  p.className="open";
  const close=()=>{p.className=""};p.querySelector(".msback").onclick=close;p.querySelector("#slipClose").onclick=close;
  p.querySelectorAll("[data-rmleg]").forEach(b=>b.onclick=()=>{const x=slipGet();x.splice(+b.dataset.rmleg,1);slipSet(x);if(x.length)slipOpen()});
  p.querySelector("#slipStake").onchange=e=>{LS.set("slipStake",Math.max(0,+e.target.value||0));slipOpen()};
  p.querySelector("#slipClear").onclick=()=>{slipSet([]);close()};
  const tr=p.querySelector("#slipTrack");if(tr)tr.onclick=()=>{const x=slipGet();if(x.length<2)return;const cc=slipCalc(x);
    addBet({k:"parlay",legs:x,odds:cc.am,stake:LS.get("slipStake",10),wk:new Date().toISOString().slice(0,10)});slipSet([]);close()};
}

/* ===== Visitor stats (GoatCounter, privacy-friendly, no cookies) — set the code to switch on ===== */
const ANALYTICS_CODE="";
if(ANALYTICS_CODE&&/github\.io$/.test(location.hostname)){const s=document.createElement("script");s.async=true;s.dataset.goatcounter=`https://${ANALYTICS_CODE}.goatcounter.com/count`;s.src="https://gc.zgo.at/count.js";document.head.appendChild(s);
  window.addEventListener("hashchange",()=>{if(window.goatcounter&&goatcounter.count)goatcounter.count({path:location.pathname+location.hash})})}

window.addEventListener("load",()=>setTimeout(slipRender,80));

/* ===== One-glance verdict on every prop (NBA + NFL) ===== */
function vMark(ok){return ok===1?"✅":ok===-1?"⚠️":"➖"}
function vBox(side,strength,items,small){
  const cls=strength==="Strong"?"vs3":strength==="Medium"?"vs2":strength==="Weak"?"vs1":"vs0";
  const head=strength==="none"?`<b>No clear lean</b>`:`<b>Lean ${side}</b> <span class="vst">· ${strength}</span>`;
  if(small)return `<span class="vpill ${cls}">${strength==="none"?"No clear lean":`Lean ${side} · ${strength}`}</span>`;
  const key=items.find(x=>x[0]===1)||items[0];
  return `<div class="vbox ${cls}"><details class="vd"><summary><div class="vh">${head}<span class="vwhy">Why?</span></div>${key?`<div class="vk">${key[1]}</div>`:""}</summary><ul>${items.map(([m,t])=>`<li><span>${vMark(m)}</span><div>${t}</div></li>`).join("")}</ul></details></div>`;
}
function vStrength(e){if(!e||e.edge<=0||e.sc<.55)return "none";if(e.sc>=.75&&e.edge>=.12)return "Strong";if(e.sc>=.62&&e.edge>=.05)return "Medium";return "Weak"}
function nbaVerdict(nm,k,small){
  const r=NBA_PROPS.find(x=>x[0]===nm&&x[1]===k),p=NBA_LOGS[nm];if(!r||!p)return "";
  const ev=sd=>{const bp=nbaBestPrice(r,sd),o=bp?bp[0]:(sd==="o"?r[3]:r[4]);return o==null?null:nbaEval(nm,k,r[2],sd,o,bp?bp[1]:r[5])};
  const O=ev("o"),U=ev("u"),e=(O&&U)?(O.sc>=U.sc?O:U):(O||U);if(!e)return "";
  const st=vStrength(e),side=e.side==="o"?"Over":"Under",over=e.side==="o",I=[];
  const rate=(c,l)=>{if(!c[1])return;const x=c[0]/c[1];I.push([x>=.6?1:x<.5?-1:0,`${side} in <b>${c[0]} of ${c[1]}</b> ${l}`])};
  rate(e.c10,"of his last games");if(e.cS[1]>=3)rate(e.cS,"this season");if(e.cH[1]>=2)rate(e.cH,"vs "+e.opp);
  if(e.dvOk===1)I.push([1,`${e.opp} has been ${over?"soft":"tough"} on ${nbaPosWord(p.p5)} lately`]);else if(e.dvOk===-1)I.push([-1,`${e.opp} has been ${over?"tough":"soft"} on ${nbaPosWord(p.p5)} lately`]);
  const R=typeof nbaRole!=="undefined"&&nbaRole(nm);if(R)for(const x of R){const up=x.c==="o";I.push([up===over?1:-1,x.t.replace(/^\S+\s/,"")])}
  const rest=NBA_REST&&NBA_REST[p.tm];if(rest&&rest.rest===0)I.push([over?-1:1,"Back-to-back tonight (tired legs)"]);
  for(const s of nbaStarsOut(p.tm)){const sp=nbaSplit(nm,s,p.tm);if(sp.o.n<2||sp.w.n<2)continue;const a=sp.w.fn(k),b=sp.o.fn(k);if(a>0&&Math.abs(b/a-1)>=.1)I.push([(b>a)===over?1:-1,`${nbaEsc(s)} is out — ${nbaF(b)} without him vs ${nbaF(a)} with`])}
  const inj=nbaInjOf(nm);if(inj&&/day|quest/i.test(inj[2]))I.push([-1,"Listed as a game-time decision"]);
  I.push([e.edge>=.05?1:e.edge>0?0:-1,`Price ${oddsFmt(e.odds)} needs ${Math.round(e.be*100)}% — hit score ${Math.round(e.sc*100)}%`]);
  return vBox(side,st,I,small);
}
function nflVerdict(name,k,small){
  if(typeof nflEval==="undefined")return "";const O=nflEval(name,k,"o"),U=nflEval(name,k,"u"),e=(O&&U)?(O.sc>=U.sc?O:U):(O||U);if(!e)return "";
  const st=vStrength(e),td=k==="anyTD",side=td?"Yes (scores)":e.side==="o"?"Over":"Under",over=e.side==="o",I=[];
  const rate=(c,l)=>{if(!c[1])return;const x=c[0]/c[1];I.push([x>=.6?1:x<.5?-1:0,`${td?"Scored":side} in <b>${c[0]} of ${c[1]}</b> ${l}`])};
  rate(e.c5,"of his last games");rate(e.cS,"this season");if(e.cH[1]>=2)rate(e.cH,"vs "+e.opp);
  if(Number.isFinite(e.dv))I.push([e.dvOk||0,`${short(e.opp)} allow the ${ordinal(e.dv)} most to ${POSNAME[e.pl.pos]||e.pl.pos}`]);
  const u=typeof USAGE!=="undefined"&&USAGE[name];if(u&&u.s&&u.l3&&k!=="passYds"&&k!=="passTD"&&k!=="comp"){const rush=/rush/.test(k)&&!/Rec/.test(k),a=rush?u.s.csh:u.s.tsh,b=rush?u.l3.csh:u.l3.tsh;if(a!=null&&b!=null&&Math.abs(b-a)>=3)I.push([(b>a)===over?1:-1,`${rush?"Carry":"Target"} share ${b>a?"up":"down"} lately (${b}% last 3 vs ${a}%)`])}
  if(typeof QUESTIONABLE!=="undefined"&&QUESTIONABLE[name])I.push([-1,`Injury: ${esc(QUESTIONABLE[name])}`]);
  I.push([e.edge>=.05?1:e.edge>0?0:-1,`${e.odds!=null?"Price "+amTxt(e.odds)+" needs":"Assumed −110 needs"} ${Math.round(e.be*100)}% — hit score ${Math.round(e.sc*100)}%`]);
  return vBox(side,st,I,small);
}

/* ===== Collapsible drawers on long pages (keeps the top short; remembers what you opened) ===== */
const DZ_OPEN=new Set(LS.get("dzOpen",[])||[]);
const DZ_RULES=[
  [/^nba-game-/,"#v-nba",[/^When the /,/^By quarter/,/ last 5$/,/^Head to head/,/ players$/]],
  [/^nba-player-/,"#v-nba",[/^Advanced/,/^Where he scores/,/^Last \d+ games/,/^Splits/,/schedule/,/^Game log/]],
  [/^game-/,"#v-game",[/^Offense vs defense/,/^Pass rush/,/^Target & snap/,/^Run game/,/^Coverage/,/^Recent form/,/^Head-to-head/,/next games$/,/^Pace/,/^Line movement/]],
  [/^props$/,"#v-props",[/^Usage/,/^Splits/,/^Red zone/,/^All \d+ games/,/next games$/,/vs /,/^What .* allow/,/^How .* did/]],
];
function drawerize(){
  const h=decodeURIComponent((location.hash||"").slice(1));const rule=DZ_RULES.find(r=>r[0].test(h));if(!rule)return;
  const root=document.querySelector(rule[1]);if(!root)return;dzRepair(root);
  root.querySelectorAll("h2,h3").forEach(hd=>{
    const t=hd.textContent.trim();if(!rule[2].some(re=>re.test(t))||hd.closest(".nodz"))return;
    let tgt=hd.closest(".section")||hd.closest(".card");if(!tgt||tgt===root||tgt.closest("details.drawer")||tgt.querySelector("canvas")||tgt.querySelector(".plines,.vbox"))return;
    if(tgt.classList.contains("section")&&(tgt.querySelectorAll(":scope > .card").length>1||tgt.querySelector("details.drawer"))){const c=hd.closest(".card");if(!c)return;tgt=c}
    if(hd.classList.contains("dzh")||tgt.closest("details.drawer"))return;
    const label=t.replace(/\s+/g," ").slice(0,70),d=document.createElement("details");d.className="drawer";if(DZ_OPEN.has(label))d.open=true;
    d.innerHTML=`<summary><span>${esc(label)}</span><b>›</b></summary>`;tgt.parentNode.insertBefore(d,tgt);d.appendChild(tgt);hd.classList.add("dzh");
    d.addEventListener("toggle",()=>{if(d.open)DZ_OPEN.add(label);else DZ_OPEN.delete(label);LS.set("dzOpen",[...DZ_OPEN].slice(-60))});
  });
}
function dzRepair(root){root.querySelectorAll("details.drawer > details.drawer").forEach(inner=>{const outer=inner.parentElement;while(inner.lastChild&&inner.lastChild.tagName!=="SUMMARY")outer.insertBefore(inner.lastChild,inner.nextSibling);inner.remove()})}
let DZ_T=null;const dzSoon=()=>{clearTimeout(DZ_T);DZ_T=setTimeout(drawerize,30)};
["v-nba","v-game","v-props"].forEach(id=>{const el=document.getElementById(id);if(el)new MutationObserver(dzSoon).observe(el,{childList:true})});
window.addEventListener("hashchange",()=>setTimeout(drawerize,70));window.addEventListener("load",()=>setTimeout(drawerize,120));

/* ===== 📸 Snapshots: shareable images with the RLA Sharp logo ===== */
function drawLogo(x,X,Y,S){ /* same design as the app icon: dark rounded square, white RLA, gold rising line */
  const r=S*.22;x.save();x.fillStyle="#121418";x.strokeStyle="#3a3320";x.lineWidth=S*.03;x.beginPath();
  if(x.roundRect)x.roundRect(X,Y,S,S,r);else x.rect(X,Y,S,S);x.fill();x.stroke();
  x.fillStyle="#fff";x.font=`800 ${Math.round(S*.27)}px system-ui,sans-serif`;x.textAlign="center";x.fillText("RLA",X+S/2,Y+S*.42);
  x.strokeStyle="#f3c75a";x.lineWidth=S*.05;x.lineJoin="round";x.beginPath();
  const P=[[.18,.78],[.4,.62],[.56,.7],[.84,.42]];P.forEach(([a,b],i)=>i?x.lineTo(X+S*a,Y+S*b):x.moveTo(X+S*a,Y+S*b));x.stroke();
  x.fillStyle="#f3c75a";P.forEach(([a,b])=>{x.beginPath();x.arc(X+S*a,Y+S*b,S*.035,0,7);x.fill()});x.restore();
}
async function snapImage(o){
  const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#1d1a10");g.addColorStop(.35,"#121418");g.addColorStop(1,"#0d0f12");x.fillStyle=g;x.fillRect(0,0,W,H);
  drawLogo(x,72,64,110);x.fillStyle="#fff";x.font="800 52px system-ui,sans-serif";x.fillText("RLA Sharp",204,122);
  x.fillStyle="#f3c75a";x.font="600 26px system-ui,sans-serif";x.fillText(o.kicker||"NFL & NBA betting research",206,160);
  const fit=(t,w,px,max)=>{let f=px;do{x.font=`${w} ${f}px system-ui,sans-serif`;if(x.measureText(t).width<=max)break;f-=2}while(f>22);return t};
  let y=270;x.fillStyle="#fff";x.fillText(fit(o.title,800,66,W-144),72,y);y+=52;
  x.fillStyle="#c7cbd2";x.fillText(fit(o.sub||"",500,32,W-144),72,y);y+=40;
  if(o.lean){y+=26;const col=o.lean.st==="Strong"?"#3fb26b":o.lean.st==="Medium"?"#f3c75a":"#8a8f98";x.fillStyle=col+"33";x.beginPath();x.roundRect?x.roundRect(72,y,W-144,96,20):x.rect(72,y,W-144,96);x.fill();
    x.fillStyle=col;x.fillText(fit(o.lean.txt,800,48,W-200),100,y+64);y+=124}
  for(const it of (o.items||[]).slice(0,o.bars?4:5)){x.fillStyle="#e1e4e9";const t=(it[0]===1?"✅ ":it[0]===-1?"⚠️ ":"• ")+String(it[1]).replace(/<[^>]+>/g,"");x.fillText(fit(t,500,32,W-144),72,y+30);y+=50}
  if(o.tiles&&o.tiles.length){y+=14;const n=o.tiles.length,gap=16,tw=(W-144-gap*(n-1))/n;
    o.tiles.forEach((t,i)=>{const X=72+i*(tw+gap),pct=t[2]==null?null:t[1]/t[2],col=pct==null?"#c7cbd2":pct>=.6?"#7ee2a0":pct<=.4?"#ff9a9d":"#f3c75a";
      x.fillStyle="#1c1f25";x.beginPath();x.roundRect?x.roundRect(X,y,tw,104,18):x.rect(X,y,tw,104);x.fill();
      x.textAlign="center";x.fillStyle=col;x.font="800 44px system-ui,sans-serif";x.fillText(t[2]?`${t[1]}/${t[2]}`:"—",X+tw/2,y+54);
      x.fillStyle="#9aa0aa";x.font="600 22px system-ui,sans-serif";x.fillText(t[0],X+tw/2,y+88);x.textAlign="left"});y+=128}
  if(o.bars&&o.bars.vals.length){const B=o.bars,n=B.vals.length;y+=18;x.fillStyle="#9aa0aa";x.font="600 26px system-ui,sans-serif";x.fillText(B.cap||"Last games",72,y);y+=20;
    const ch=196,top=y+40,base=top+ch,mx=Math.max(B.line,...B.vals.map(b=>b.v))*1.15||1,gap=12,bw=(W-144-gap*(n-1))/n,Y=v=>base-(v/mx)*ch;
    x.fillStyle="#16191e";x.beginPath();x.roundRect?x.roundRect(60,y,W-120,ch+96,20):x.rect(60,y,W-120,ch+96);x.fill();
    B.vals.forEach((b,i)=>{const X=72+i*(bw+gap),c=b.v>B.line?"#3fb26b":b.v<B.line?"#e5534b":"#8a8f98",h=Math.max(4,base-Y(b.v));
      x.fillStyle=c;x.beginPath();x.roundRect?x.roundRect(X,base-h,bw,h,[10,10,0,0]):x.rect(X,base-h,bw,h);x.fill();
      x.textAlign="center";x.fillStyle="#fff";x.font=`800 ${n>8?26:30}px system-ui,sans-serif`;x.fillText(String(b.v),X+bw/2,base-h-10);
      x.fillStyle="#9aa0aa";x.font=`500 ${n>8?18:21}px system-ui,sans-serif`;x.fillText(String(b.lab||""),X+bw/2,base+30);x.textAlign="left"});
    const ly=Y(B.line);x.strokeStyle="#f3c75a";x.lineWidth=4;x.setLineDash([16,12]);x.beginPath();x.moveTo(66,ly);x.lineTo(W-66,ly);x.stroke();x.setLineDash([]);
    y=base+66}
  if(!o.bars&&o.boxes&&o.boxes.length){y+=20;x.fillStyle="#9aa0aa";x.font="600 26px system-ui,sans-serif";x.fillText(o.boxCap||"Last games (newest on the right)",72,y);y+=18;
    const n=o.boxes.length,gap=14,bw=(W-144-gap*(n-1))/n;
    o.boxes.forEach((b,i)=>{const X=72+i*(bw+gap);x.fillStyle=b.c==="o"?"#173323":b.c==="u"?"#3a1d1e":"#24272c";x.beginPath();x.roundRect?x.roundRect(X,y,bw,120,18):x.rect(X,y,bw,120);x.fill();
      x.fillStyle=b.c==="o"?"#7ee2a0":b.c==="u"?"#ff9a9d":"#c7cbd2";x.textAlign="center";x.font="800 46px system-ui,sans-serif";x.fillText(String(b.v),X+bw/2,y+66);x.font="500 22px system-ui,sans-serif";x.fillText(String(b.lab||""),X+bw/2,y+100);x.textAlign="left"});y+=150}
  if(o.rows)for(const r of o.rows.slice(0,8)){x.fillStyle="#1c1f25";x.beginPath();x.roundRect?x.roundRect(72,y,W-144,88,18):x.rect(72,y,W-144,88);x.fill();
    x.fillStyle="#fff";x.fillText(fit(r.a,700,32,W-360),100,y+40);x.fillStyle=r.col||"#9aa0aa";x.fillText(fit(r.b||"",500,26,W-360),100,y+74);
    if(r.c){x.fillStyle="#f3c75a";x.font="800 36px system-ui,sans-serif";x.textAlign="right";x.fillText(r.c,W-100,y+56);x.textAlign="left"}y+=100}
  if(o.big){y+=10;x.fillStyle="#f3c75a";x.font="800 60px system-ui,sans-serif";x.fillText(o.big,72,y+60);x.fillStyle="#9aa0aa";x.font="500 28px system-ui,sans-serif";x.fillText(o.bigSub||"",72,y+100)}
  x.fillStyle="#7c828c";x.font="500 24px system-ui,sans-serif";x.fillText("Leans from past numbers, not guarantees. 21+ · 1-800-GAMBLER",72,H-110);
  x.fillStyle="#fff";x.font="700 34px system-ui,sans-serif";x.fillText(typeof siteUrl!=="undefined"?siteUrl():"rlasharp.github.io/rla-sharp",72,H-58);
  drawLogo(x,W-72-70,H-122,70);
  const blob=await new Promise(r=>c.toBlob(r,"image/png"));const file=new File([blob],(o.file||"rla-sharp")+".png",{type:"image/png"});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:o.title,text:`${o.title} — ${siteUrl()}`});return}}catch(e){if(e&&e.name==="AbortError")return}
  if(await uxSave(blob,file.name)!=="saved")return;
  if(typeof shareToast!=="undefined")shareToast("Snapshot saved — post it anywhere 📸");
}
function vData(html){const d=document.createElement("div");d.innerHTML=html;const b=d.querySelector(".vh"),items=[...d.querySelectorAll("li")].map(li=>{const m=li.querySelector("span").textContent;return [m==="✅"?1:m==="⚠️"?-1:0,li.textContent.slice(m.length)]});
  const st=d.querySelector(".vbox");return b?{txt:b.textContent.replace(/\s+/g," ").trim(),st:st.classList.contains("vs3")?"Strong":st.classList.contains("vs2")?"Medium":"Weak",items}:null}
function snapNba(nm,k){
  const r=NBA_PROPS.find(x=>x[0]===nm&&x[1]===k),p=NBA_LOGS[nm];if(!r||!p)return;const g=nbaGameOf(p.tm),opp=g?(g.a===p.tm?g.h:g.a):"";
  const v=vData(nbaVerdict(nm,k)),L6=nbaAllG(nm).slice(-6),AG=nbaAllG(nm),VL=AG.map(o=>nbaVal(o.x,k)).filter(Number.isFinite),hr=m=>{const a=VL.slice(-m);return [`Last ${a.length}`,a.filter(z=>z>r[2]).length,a.length]},L10=AG.slice(-10);
  snapImage({kicker:`NBA · ${nbaDay(NBA_SLATE_DATE)}`,title:nm,sub:`${p.tm} ${g?(g.a===p.tm?"@ ":"vs ")+opp:""} · ${NBA_MK[k][1]} ${r[2]} · O ${oddsFmt(r[3])} / U ${oddsFmt(r[4])}`,
    lean:v,items:v?v.items:[],boxes:L6.map(o=>{const val=nbaVal(o.x,k);return {v:val,c:val>r[2]?"o":val<r[2]?"u":"p",lab:(o.x[3]==="H"?"":"@")+o.x[2]}}),boxCap:`Last ${L6.length} games vs ${r[2]} (green = over)`,tiles:[hr(5),hr(10),hr(20)].map(t=>[t[0]+" over",t[1],t[2]]),
    bars:{line:r[2],cap:`${NBA_MK[k][1]} · last ${L10.length} games (gold line = ${r[2]})`,vals:L10.map(o=>({v:nbaVal(o.x,k),lab:(o.x[3]==="H"?"":"@")+o.x[2]})).filter(b=>Number.isFinite(b.v))},file:`${nm.replace(/\W+/g,"-")}-${k}`});
}
function snapNfl(name,k){
  const rp=realProp(name,k),P=PINFO[name];if(!rp||!P)return;const o=oppOf(P.team),v=vData(nflVerdict(name,k)),G=pLogs(name).filter(l=>l.season===CUR&&Number.isFinite(stat(l,k))).slice(-6);
  const ALL=pLogs(name).filter(l=>Number.isFinite(stat(l,k))),SZ=ALL.filter(l=>l.season===CUR),G10=ALL.slice(-10),ov=a=>a.filter(l=>stat(l,k)>rp[0]).length;
  snapImage({kicker:`NFL · Week ${typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:""}`,title:name,sub:`${P.team} ${o?(o.home?"vs ":"@ ")+o.opp:""} · ${MARKETS[k].n} ${k==="anyTD"?"":rp[0]}${rp[1]!=null?" · "+amTxt(rp[1]):""}`,
    lean:v,items:v?v.items:[],boxes:G.map(l=>{const val=stat(l,k);return {v:val,c:val>rp[0]?"o":val<rp[0]?"u":"p",lab:(l.home?"":"@")+l.opp}}),boxCap:`Last ${G.length} games vs ${rp[0]} (green = over)`,tiles:[[`Last ${Math.min(3,ALL.length)} over`,ov(ALL.slice(-3)),Math.min(3,ALL.length)],[`Last ${Math.min(5,ALL.length)} over`,ov(ALL.slice(-5)),Math.min(5,ALL.length)],[SZ.length===ALL.length?"This season":`Last ${G10.length} over`,SZ.length===ALL.length?ov(SZ):ov(G10),SZ.length===ALL.length?SZ.length:G10.length]],
    bars:Number.isFinite(rp[0])?{line:rp[0],cap:`${MARKETS[k].n} · last ${G10.length} games (gold line = ${rp[0]})`,vals:G10.map(l=>({v:stat(l,k),lab:(l.season!==CUR?"'"+String(l.season).slice(2)+" ":"")+(l.home?"":"@")+l.opp}))}:null,file:`${name.replace(/\W+/g,"-")}-${k}`});
}
function snapParlay(){const a=slipGet();if(!a.length)return;const c=slipCalc(a);
  snapImage({kicker:"My parlay",title:`${a.length}-leg parlay`,sub:`Built on RLA Sharp`,rows:a.map(l=>({a:betTitle(l),b:l.book||"",c:oddsFmt(l.odds)})),
    big:a.length>1?(c.am>0?"+":"")+c.am:oddsFmt(a[0].odds),bigSub:`Book's chance ${(c.impl*100).toFixed(1)}%${c.est!=null?` · our estimate ${(c.est*100).toFixed(1)}%`:""}`,file:"rla-parlay"})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-snap]");if(!b)return;e.preventDefault();e.stopPropagation();
  const [sp,nm,k]=b.dataset.snap.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").split("|");
  if(sp==="nba")snapNba(nm,k);else if(sp==="nfl")snapNfl(nm,k);else if(sp==="parlay")snapParlay()},true);
function snapBtn(sp,nm,k,label){return `<button class="obtn snapb" data-snap="${sp}|${esc(nm||"")}|${k||""}">📸 ${label||"Snapshot"}</button>`}

/* ===== ⓘ Glossary: tap a term for a one-line explanation ===== */
const GLOSS=[
 ["pressure","How often the QB is sacked, hit or flushed into a scramble on a dropback. More pressure = fewer passing yards and long throws.",1],
 ["blitz","When the defense sends 5 or more pass rushers. More heat on the QB, but fewer players in coverage.",1],
 ["hit score","Our estimated chance this bet wins, built from his recent games, this season, the matchup and the minutes he's getting.",1],
 ["hit rate","How often he went over this line in past games — e.g. 7/10 means over in 7 of his last 10.",1],
 ["DvP","Defense vs Position: how much this opponent gives up to players at his position, ranked 1–30 (30 = softest).",0],
 ["usage","Usage rate: the share of his team's plays he finishes (shots, free throws, turnovers) while on the court. Higher = more chances.",1],
 ["USG%","Usage rate: the share of his team's plays he finishes while on the court. Higher = more chances to hit overs.",0],
 ["USG","Usage rate: the share of his team's plays he finishes while on the court. Higher = more chances to hit overs.",0],
 ["edge","Our chance of winning minus the chance the odds imply. +8% means we think it wins 8 points more often than the price says — bigger is better.",1],
 ["PRA","Points + Rebounds + Assists added together.",0],
 ["P+R","Points + Rebounds added together.",0],["P+A","Points + Assists added together.",0],["R+A","Rebounds + Assists added together.",0],
 ["S+B","Steals + Blocks added together.",0],
 ["PDO","Shooting % + save % (×100). Normal is about 100 — well above usually means luck that fades, well below usually means bad luck that turns.",0],
 ["SOG","Shots on goal: shots that would have gone in if the goalie hadn't stopped them (goals count too).",0],
 ["TOI","Time on ice: minutes a hockey player was on the ice.",0],
 ["PP","Power play: playing with one more skater because the other team has a player in the penalty box.",0],
 ["PK","Penalty kill: playing short-handed. PK% = how often a team stops the other side's power play.",0],
 ["expected goals","How many goals an average shooter would score from the same spots. Scoring far above it usually cools off.",1],
 ["usage","The share of his team's plays he finishes while on the court (shots, free-throw trips, turnovers). Rising usage = more chances.",1],
 ["pass rate over expected","How much more (or less) a team throws than an average team would in the same down, distance and score.",1],
 ["our chance","Our estimated chance this bet wins, from his recent games, this season, the matchup and his minutes. Compare it with what the odds need.",1],
 ["odds need","The win rate the price needs just to break even. −128 needs 56%; +120 needs 45%.",1],
 ["closing line","The last odds before the game starts — the market's best guess. Getting a better price than the close is the best sign of a real edge.",1],
 ["puck line","Hockey's spread: almost always 1.5 goals. Favorite −1.5 must win by 2+; underdog +1.5 wins the bet if they lose by 1 or win.",1],
 ["Corsi","All shot attempts (on goal, missed and blocked). A team with more of them usually controls the puck and the game.",0],
 ["power play","When the other team has a player in the penalty box — more room, more shots and goals.",1],
 ["penalty kill","Playing short-handed. PK% = how often a team stops the other side's power play.",1],
 ["implied","The win chance hidden in the odds. −110 implies about 52.4%.",1],
 ["book's chance","The win chance hidden in the odds. −110 implies about 52.4%.",1],
 ["no-vig","The odds with the sportsbook's fee taken out — the market's fair price.",1],
 ["vig","The sportsbook's built-in fee. It's why both sides of a bet are usually −110, not +100.",1],
 ["juice","Another word for vig: the sportsbook's built-in fee in the odds.",1],
 ["ATS","Against the spread: whether a team covered the point spread, not just won.",0],
 ["O/U","Over/Under: a bet on whether the total points (or a player's stat) goes above or below a number.",0],
 ["spread","The points a favorite must win by (or an underdog can lose by) for the bet to win.",1],
 ["moneyline","A bet on who wins the game outright, no points involved.",1],
 ["line movement","How the line or odds changed since they opened. Moves often follow sharp money or injury news.",1],
 ["best price","The best odds we found for this bet across sportsbooks — shopping lines adds up over time.",1],
 ["line shopping","Comparing the same bet across sportsbooks to get the best odds.",1],
 ["pace","How many possessions a team plays per game. Faster pace = more shots and stats for everyone.",1],
 ["back-to-back","Playing on two days in a row. Tired legs and rest days for stars are common on the second night.",1],
 ["B2B","Back-to-back: playing on two days in a row. Stars often rest or play fewer minutes.",0],
 ["target share","The share of his team's passes thrown his way. Steady 20%+ usually means steady catches.",1],
 ["snap share","The share of his team's offensive plays he was on the field for.",1],
 ["air yards","How far passes travel in the air to him before the catch — a sign of big-play chances.",1],
 ["EPA","Expected Points Added: how much each play raised or lowered the team's expected score. Higher is better.",0],
 ["red zone","Inside the opponent's 20-yard line, where most touchdowns are scored.",1],
 ["pressure rate","How often the pass rush hurries, hits or sacks the quarterback.",1],
 ["sack rate","Sacks per dropback. A high rate means the quarterback is often taken down.",1],
 ["ROI","Return on investment: profit divided by total amount bet.",0],
 ["units","A unit is your standard bet size (e.g. 1% of your bankroll). +3u = up three standard bets.",1],
 ["parlay","Several bets joined into one. Bigger payout, but every leg must win.",1],
 ["lean","Our side based on the numbers. A lean is not a guarantee.",1],
 ["push","A tie with the line — the bet is refunded.",1],
 ["prop","A bet on one player's stat (points, rebounds, yards…) instead of the game result.",1],
 ["aDOT","Average depth of target: how far past the line of scrimmage his targets travel in the air. High = deep threat, low = short/underneath role.",0],
 ["YAC","Yards after catch: yards he gains with the ball after catching it.",0],
 ["target share","The share of his team's passes thrown to him. 25%+ is a true No. 1 option.",1],
 ["snap share","The share of his team's offensive plays he was on the field for.",1],
 ["air yards","How far the ball travelled in the air on passes thrown to him (caught or not).",1],
 ["red zone","Inside the opponent's 20-yard line, where most touchdowns are scored.",1],
 ["man coverage","Each defender follows one receiver around the field.",1],
 ["zone coverage","Defenders guard areas of the field instead of following one player.",1],
 ["blitz","The defense sends extra rushers (5 or more) after the quarterback.",1],
 ["contested","A catch made with a defender right on him — the ball could have been knocked away.",1],
 ["first downs","Plays where he gained enough yards to move the chains (a new set of downs).",1],
];
const GL_MAP={};GLOSS.forEach(g=>GL_MAP[g[0].toLowerCase()]=g[1]);
const GL_RE=new RegExp("(?<![\\w%/])("+GLOSS.map(g=>g[0]).sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\\/%']/g,"\\$&")).join("|")+")(?![\\w%/])","gi");
const GL_CASE=new Set(GLOSS.filter(g=>!g[2]).map(g=>g[0]));
const GL_SKIP=new Set("A,BUTTON,SELECT,OPTION,INPUT,TEXTAREA,SCRIPT,STYLE,SVG,CANVAS,SUMMARY,H1,LABEL,TITLE,TEXT".split(","));
function glDecorate(root){
  if(!root)return;const nodes=[],C={};root.querySelectorAll(".gl").forEach(e=>C[e.dataset.gl]=(C[e.dataset.gl]||0)+1);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    if(!n.nodeValue||n.nodeValue.length<2)return NodeFilter.FILTER_REJECT;
    for(let p=n.parentElement;p&&p!==root;p=p.parentElement){if(GL_SKIP.has(p.tagName.toUpperCase())||p.classList.contains("gl")||p.classList.contains("noglo")||p.id==="glossary")return NodeFilter.FILTER_REJECT}
    return NodeFilter.FILTER_ACCEPT}});
  while(w.nextNode())nodes.push(w.currentNode);
  for(const n of nodes){
    const txt=n.nodeValue;GL_RE.lastIndex=0;let m,last=0,frag=null;
    while((m=GL_RE.exec(txt))){const raw=m[1],key=GLOSS.find(g=>g[0].toLowerCase()===raw.toLowerCase());if(!key)continue;
      if(GL_CASE.has(key[0])&&raw!==key[0])continue;const k=key[0].toLowerCase();if((C[k]||0)>=2)continue;C[k]=(C[k]||0)+1;
      frag=frag||document.createDocumentFragment();frag.append(txt.slice(last,m.index));
      const sp=document.createElement("span");sp.className="gl";sp.dataset.gl=k;sp.tabIndex=0;sp.textContent=raw;frag.append(sp);last=m.index+raw.length}
    if(frag){frag.append(txt.slice(last));n.replaceWith(frag)}
  }
}
let GL_T=0;function glRun(){clearTimeout(GL_T);GL_T=setTimeout(()=>{const s=document.querySelector("main>section:not(.hide)");if(s)glDecorate(s);glGuide()},220)}
function glShow(el){let p=document.getElementById("glpop");if(!p){p=document.createElement("div");p.id="glpop";p.setAttribute("role","tooltip");document.body.appendChild(p)}
  const k=el.dataset.gl;p.innerHTML=`<b>${esc(k.replace(/\b\w/g,c=>c.toUpperCase()).replace(/^Dvp$/,"DvP").replace(/^(Ats|Roi|Epa|Usg%?|B2b|O\/u)$/,x=>x.toUpperCase()))}</b> — ${esc(GL_MAP[k]||"")}`;
  p.className="open";const r=el.getBoundingClientRect(),pw=Math.min(300,innerWidth-24);p.style.width=pw+"px";
  let L=Math.max(12,Math.min(innerWidth-pw-12,r.left+r.width/2-pw/2));p.style.left=L+"px";
  const ph=p.offsetHeight;let T=r.top-ph-8;if(T<8)T=r.bottom+8;p.style.top=(T+scrollY)+"px"}
function glHide(){const p=document.getElementById("glpop");if(p)p.className=""}
document.addEventListener("click",e=>{const g=e.target.closest&&e.target.closest(".gl");if(g){e.preventDefault();e.stopPropagation();const p=document.getElementById("glpop");if(p&&p.className==="open"&&p.dataset.k===g.dataset.gl){glHide();p.dataset.k="";return}glShow(g);document.getElementById("glpop").dataset.k=g.dataset.gl;return}
  if(!(e.target.closest&&e.target.closest("#glpop")))glHide()},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape")glHide();if((e.key==="Enter"||e.key===" ")&&document.activeElement&&document.activeElement.classList.contains("gl")){e.preventDefault();glShow(document.activeElement)}});
window.addEventListener("hashchange",glHide);
function glGuide(){if((location.hash||"")!=="#guide")return;const h=document.getElementById("v-guide");if(!h||h.querySelector("#glossary"))return;
  h.insertAdjacentHTML("beforeend",`<div class="card" id="glossary" style="margin-top:14px"><h2>📖 Glossary</h2><p class="small">Tip: anywhere on the site, tap a dotted-underlined word to see this in one line.</p>${GLOSS.filter((g,i,a)=>a.findIndex(z=>z[1]===g[1])===i).map(g=>`<div class="glrow"><b>${esc(g[0])}</b><span>${esc(g[1])}</span></div>`).join("")}</div>`)}
{const mo=new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!(n.classList&&(n.classList.contains("gl")||n.id==="glpop")))))glRun()});
 const mm=document.querySelector("main");if(mm)mo.observe(mm,{childList:true,subtree:true});window.addEventListener("hashchange",glRun);window.addEventListener("load",glRun)}
