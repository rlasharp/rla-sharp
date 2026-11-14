/* ---------- 🏆 Futures: championship, MVP and award, division and conference prices (ESPN's futures feed), how each
   one moved since we started tracking, the market's fair chance (the book's margin taken out), and each team's /
   player's futures on their own page. Route: #futures · data: futures_data.js (tools/futures.py) ---------- */
const FU={lg:null,mk:{}};
function fuE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function fuImp(o){return o==null?null:o<0?-o/(-o+100):100/(o+100)}
function fuAm(o){return typeof oddsFmt!=="undefined"?oddsFmt(o):(o>0?"+":"")+o}
/* market names cleaned (AFC / NFC, no hidden characters) and the big ones first: title, conference, MVP, other awards, divisions */
function fuName(n){return String(n||"").replace(/[\u200e\u200f]/g,"").replace(/Pro Football \(A\)/g,"AFC").replace(/Pro Football \(N\)/g,"NFC").replace(/\s+/g," ").replace(/^(NBA|NHL|NFL)\s*-\s*/,"").trim()}
function fuRank(n){n=n.toLowerCase();return /super bowl|stanley cup|^winner$|nba - winner/.test(n)?0:/conference/.test(n)&&!/division/.test(n)?1:/mvp|hart/.test(n)?2:/player|vezina|norris|rookie|coach/.test(n)?3:/playoff|presidents/.test(n)?4:/division/.test(n)?5:6}
let FU_MC={};function fuMarkets(lg){if(FU_MC[lg])return FU_MC[lg];const M=((typeof FUT!=="undefined"&&FUT&&FUT.lg&&FUT.lg[lg])||[]).map(m=>Object.assign({},m,{n:fuName(m.n),_r:fuRank(m.n)}));M.sort((a,b)=>a._r-b._r);return FU_MC[lg]=M}
/* one market: implied chances, and the fair chance when exactly one selection can win (book margin removed) */
function fuRows(m){const R=m.rows.map(r=>({nm:r[0],tm:r[1],o:r[2],h:r[3]||[],imp:fuImp(r[2])}));const sum=R.reduce((s,r)=>s+(r.imp||0),0);const one=sum>.95&&sum<1.7&&!/make|miss|over|under|win total|wins|to reach|top \d/i.test(m.n);
  R.forEach(r=>{r.fair=one?r.imp/sum:null;const h=r.h,ago=d=>{const t=Date.now()-d*864e5;let x=null;for(const p of h)if(Date.parse(p[0])<=t)x=p;return x};r.first=h[0];r.w=ago(7)||h[0];
    r.dOpen=r.first?r.imp-fuImp(r.first[1]):0;r.dW=r.w?r.imp-fuImp(r.w[1]):0});return {R,one,margin:sum-1}}
function fuSpark(h){const v=h.map(p=>fuImp(p[1])).filter(x=>x!=null);if(v.length<2)return "";const W=70,Hh=20,mx=Math.max(...v),mn=Math.min(...v),X=i=>i/(v.length-1)*W,Y=x=>Hh-2-(mx===mn?.5:(x-mn)/(mx-mn))*(Hh-4);
  const up=v[v.length-1]>=v[0];return `<svg viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" aria-hidden="true"><polyline fill="none" stroke="${up?"#3fb26b":"#e5534b"}" stroke-width="1.8" points="${v.map((x,i)=>X(i).toFixed(1)+","+Y(x).toFixed(1)).join(" ")}"/></svg>`}
function fuPc(p){return p==null?"–":p<.005?"<1%":p<.1?(p*100).toFixed(1)+"%":Math.round(p*100)+"%"}
function fuMove(d){if(!d||Math.abs(d)<.0025)return `<span class="small">–</span>`;const pp=(d*100).toFixed(Math.abs(d)<.01?1:0);return `<span class="${d>0?"up":"dn"}">${d>0?"▲":"▼"} ${Math.abs(pp)} pts</span>`}
function fuLink(lg,r){try{if(lg==="nba"){if(typeof NBA_LOGS!=="undefined"&&NBA_LOGS[r.nm])return `#nba-player-${encodeURIComponent(r.nm)}`;const t=Object.entries(NBA_TEAMS||{}).find(([a,n])=>n===r.nm);if(t)return "#nba-team-"+t[0]}
  if(lg==="nhl"){if(typeof NHL_P!=="undefined"&&(NHL_P[r.nm]||NHL_G[r.nm]))return `#nhl-player-${encodeURIComponent(r.nm)}`;const t=Object.entries(NHL_TEAM||{}).find(([a,v])=>v.n===r.nm);if(t)return "#nhl-team-"+t[0]}
  if(lg==="nfl"){if(typeof PINFO!=="undefined"&&PINFO[r.nm])return `#props/${encodeURIComponent(r.nm)}`;const t=Object.entries(TEAMS||{}).find(([a,v])=>v[0]===r.nm);if(t)return "#team-"+t[0]}}catch(e){}return null}
function viewFutures(){const el=document.getElementById("v-futures");if(!el)return;const LGS=[["nba","🏀 NBA"],["nfl","🏈 NFL"],["nhl","🏒 NHL"]].filter(([k])=>fuMarkets(k).length&&(typeof xFollow==="undefined"||xFollow(k)));
  if(!LGS.length){el.innerHTML=`<h1>🏆 Futures</h1><div class="card small">Futures prices load with the next data update.</div>`;return}
  const lg=LGS.some(x=>x[0]===FU.lg)?FU.lg:LGS[0][0],M=fuMarkets(lg),mi=Math.min(FU.mk[lg]||0,M.length-1),m=M[mi],{R,one,margin}=fuRows(m),pl=/mvp|player|rookie|coach|hart|vezina|norris|most|leader|award/i.test(m.n);
  const days=Math.max(1,...M.flatMap(x=>x.rows.map(r=>(r[3]||[]).length)));
  /* biggest movers this week across the league's markets (fair or implied chance, at least 2% to win) */
  const mv=M.flatMap(x=>fuRows(x).R.filter(r=>r.imp>=.02&&r.w&&r.w!==r.h[r.h.length-1]).map(r=>({x,r}))).sort((a,b)=>Math.abs(b.r.dW)-Math.abs(a.r.dW)).filter(o=>Math.abs(o.r.dW)>=.01).slice(0,6);
  el.innerHTML=`<h1>🏆 Futures</h1><p class="sub">Championship, awards, division and conference prices · ${fuE(m.book||"sportsbook")} via ESPN · updated ${typeof FUT!=="undefined"&&FUT.at?new Date(FUT.at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):""}</p>
   <div class="seg">${LGS.map(([k,l])=>`<button data-fulg="${k}" class="${k===lg?"on":""}">${l}</button>`).join("")}</div>
   ${mv.length?`<div class="card"><h2>📈 Biggest moves this week</h2>${mv.map(({x,r})=>`<div class="ufval"><b>${fuE(r.nm)}</b><span class="small">${fuE(x.n)}</span><span>${fuAm(r.w[1])} → <b>${fuAm(r.o)}</b></span>${fuMove(r.dW)}</div>`).join("")}</div>`:""}
   <div class="fuchips">${M.map((x,i)=>`<button class="fxp${i===mi?" on":""}" data-fumk="${i}">${fuE(x.n)}</button>`).join("")}</div>
   <div class="card"><h2>${fuE(m.n)}</h2><div class="small" style="margin-bottom:6px">${one?`Fair chance = the price's chance with the book's ${Math.round(margin*100)}% margin taken out.`:"Chance = what the price implies (several can win this one, so there's no single margin to remove)."} Moves = change in that chance${days>1?"":" — movement fills in as we keep a price every day (tracking started recently)"}.</div>
    <div class="nbatbl"><table class="bxt futbl"><colgroup><col style="width:28px"><col><col style="width:74px"><col style="width:58px"></colgroup><thead><tr><th>#</th><th></th><th>Price</th><th>${one?"Fair %":"Chance"}</th></tr></thead><tbody>
     ${R.map((r,i)=>{const L=fuLink(lg,r),mv=r.h.length>1;return `<tr><td>${i+1}</td><td>${L?`<a href="${L}">${fuE(r.nm)}</a>`:fuE(r.nm)}${pl&&r.tm?` <span class="small">${fuE(r.tm)}</span>`:""}${mv?`<div class="fumv"><span class="small">7 d</span> ${fuMove(r.dW)} <span class="small">since ${fuE(r.first[0].slice(5))} (${fuAm(r.first[1])})</span> ${fuMove(r.dOpen)} ${fuSpark(r.h)}</div>`:""}</td><td><b>${fuAm(r.o)}</b></td><td>${fuPc(one?r.fair:r.imp)}</td></tr>`}).join("")}</tbody></table></div></div>
   <p class="note">Futures tie up your money for months and carry a bigger book margin than single games. Prices: ESPN's futures feed. Research, not advice. 21+.</p>`;
  el.querySelectorAll("[data-fulg]").forEach(b=>b.onclick=()=>{FU.lg=b.dataset.fulg;viewFutures()});
  el.querySelectorAll("[data-fumk]").forEach(b=>b.onclick=()=>{FU.mk[lg]=+b.dataset.fumk;const y=scrollY;viewFutures();scrollTo(0,y)})}
/* a team's or player's futures, for their own page */
function fuFor(lg,names){const N=new Set(names.filter(Boolean));const out=[];for(const m of fuMarkets(lg)){const {R,one}=fuRows(m);R.forEach((r,i)=>{if(N.has(r.nm))out.push({m,r,rank:i+1,of:R.length,one})})}return out}
function fuCard(lg,names,title){const L=fuFor(lg,names);if(!L.length)return "";
  return `<div class="card"><h2>🏆 ${fuE(title||"Futures")}</h2>${L.slice(0,8).map(({m,r,rank,of,one})=>`<div class="ufval"><span>${fuE(m.n)}</span><b>${fuAm(r.o)}</b><span class="small">${fuPc(one?r.fair:r.imp)} · ${rank}${rank===1?"st":rank===2?"nd":rank===3?"rd":"th"} of ${of}</span>${fuMove(r.dW)}</div>`).join("")}<a class="small" href="#futures">All futures →</a></div>`}
