/* ---------- 🚫 Without their stars: how a team has done this season with vs without the players you pick ----------
   NBA / NHL / NFL game pages (Trends tab). Tap players (each team's biggest roles this season; 🚑 = out or questionable
   tonight) and the table splits the team's games this season into "with" (all picked played) and "without" (none
   of them played): record, points for/against, against the spread and over/under vs the closing lines.
   A player "played" when he has a box-score line that game (NHL goalies: when he started). Real results only. */
const WO={sel:{}};
function woE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
/* the team's games this season: key (game id / date / week), points for/against, cover (+1/0/-1), total result (+1 over / 0 / -1 under) */
function woGames(sp,t){const out=[];
  if(sp==="nba")for(const r of NBA_RES){if(r[2]!==t&&r[3]!==t)continue;const h=r[3]===t,pf=h?r[5]:r[4],pa=h?r[4]:r[5],L=(typeof NBA_SPR!=="undefined"&&NBA_SPR[r[0]])||null;
    const sp_=L?(h?L[3]:-L[3]):null,cv=sp_==null?null:Math.sign(pf-pa+sp_),ou=L&&L[4]!=null?Math.sign(pf+pa-L[4]):null;out.push({k:r[0],pf,pa,cv,ou})}
  if(sp==="nhl")for(const r of NHL_RES||[]){if(r[1]!==t&&r[3]!==t)continue;const h=r[3]===t,pf=h?r[4]:r[2],pa=h?r[2]:r[4],s=r[8];
    const cv=s==null?null:Math.sign(h?(r[4]-r[2])+s:(r[2]-r[4])-s),ou=r[9]!=null?Math.sign(r[2]+r[4]-r[9]):null;out.push({k:r[0],pf,pa,cv,ou})}
  if(sp==="nfl")for(const r of RESULTS||[]){if(r[1]!==t&&r[3]!==t)continue;const h=r[3]===t,pf=h?r[4]:r[2],pa=h?r[2]:r[4],s=(typeof NFL_SPR!=="undefined"&&NFL_SPR[r[0]+"|"+t])||null;
    const cv=s&&s[0]!=null?Math.sign(pf-pa+s[0]):null,ou=s&&s[2]!=null?Math.sign(pf+pa-s[2]):null;out.push({k:r[0],pf,pa,cv,ou})}
  return out}
/* keys of the games a player played this season */
function woPlayed(sp,nm){try{
  if(sp==="nba"){const p=NBA_LOGS[nm];return new Set(p?p.g.map(x=>x[0]):[])}
  if(sp==="nhl"){if(NHL_G[nm])return new Set(NHL_G[nm].g.filter(x=>x[9]!==1&&x[7]).map(x=>x[0]));const p=NHL_P[nm];return new Set(p?p.g.filter(x=>x[16]!==1).map(x=>x[0]):[])}
  if(sp==="nfl")return new Set(pLogs(nm).filter(l=>l.season===CUR).map(l=>l.week))}catch(e){}return new Set()}
/* each team's biggest roles this season: NBA minutes, NHL ice time (+ the No. 1 goalie), NFL scrimmage/passing yards */
function woStars(sp,t){try{
  if(sp==="nba")return Object.entries(NBA_LOGS).filter(([,p])=>p.tm===t&&p.g.length>=3).map(([n,p])=>[n,p.g.reduce((s,x)=>s+x[4],0)/p.g.length]).sort((a,b)=>b[1]-a[1]).slice(0,7).map(x=>x[0]);
  if(sp==="nhl"){const sk=Object.entries(NHL_P).filter(([,p])=>p.tm===t).map(([n,p])=>{const g=p.g.filter(x=>x[16]!==1);return [n,g.length>=3?g.reduce((s,x)=>s+(x[10]||0),0)/g.length:0]}).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
    const gk=Object.entries(NHL_G).filter(([,p])=>p.tm===t).sort((a,b)=>(b[1].gs||0)-(a[1].gs||0)).slice(0,1).map(x=>x[0]);return [...gk,...sk]}
  if(sp==="nfl"){const m={};for(const l of S.playerLogs)if(l.season===CUR&&l.team===t)m[l.player]=(m[l.player]||0)+(l.passYds||0)*.6+(l.rushYds||0)+(l.recYds||0);
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,7).map(x=>x[0])}}catch(e){}return []}
function woHurt(sp,nm){try{const r=sp==="nba"?(typeof nbaInjOf!=="undefined"&&nbaInjOf(nm)):sp==="nhl"?(typeof nhInjOf!=="undefined"&&nhInjOf(nm)):(()=>{for(const t in INJ){const x=INJ[t].find(r=>r[0]===nm);if(x)return x}return null})();return r?r[2]||"":""}catch(e){return ""}}
function woSum(G){const n=G.length;if(!n)return null;const w=G.filter(g=>g.pf>g.pa).length,cv=G.filter(g=>g.cv!=null),ou=G.filter(g=>g.ou!=null);
  return {n,w,l:n-w,pf:G.reduce((s,g)=>s+g.pf,0)/n,pa:G.reduce((s,g)=>s+g.pa,0)/n,ats:[cv.filter(g=>g.cv>0).length,cv.filter(g=>g.cv<0).length],ov:[ou.filter(g=>g.ou>0).length,ou.filter(g=>g.ou<0).length]}}
function woTable(sp,t){const key=sp+"|"+t,sel=[...(WO.sel[key]||[])],G=woGames(sp,t);
  if(!sel.length)return `<div class="small">Tap one or more players to compare the team's games with and without them.</div>`;
  const P=sel.map(n=>woPlayed(sp,n)),W=woSum(G.filter(g=>P.every(s=>s.has(g.k)))),O=woSum(G.filter(g=>P.every(s=>!s.has(g.k))));
  const dp=sp==="nba"?1:sp==="nhl"?2:1,f=x=>x.toFixed(dp),unit=sp==="nhl"?"Goals":"Points",col=(lab,x)=>`<td>${x?lab(x):"–"}</td>`;
  const rows=[["Games",x=>x.n],["Record",x=>`${x.w}-${x.l}`],[`${unit} for`,x=>f(x.pf)],[`${unit} against`,x=>f(x.pa)],["Margin",x=>(x.pf-x.pa>0?"+":"")+f(x.pf-x.pa)],[sp==="nhl"?"Puck line":"Against the spread",x=>x.ats[0]+x.ats[1]?`${x.ats[0]}-${x.ats[1]}`:"–"],["Over / under",x=>x.ov[0]+x.ov[1]?`${x.ov[0]}-${x.ov[1]}`:"–"]];
  const who=sel.map(n=>woE(n.split(" ").slice(-1)[0])).join(" + ");
  return `<div class="nbatbl"><table class="bxt wotbl"><thead><tr><th></th><th>With ${who}</th><th>Without ${who}</th></tr></thead><tbody>${rows.map(([l,fn])=>`<tr><td>${l}</td>${col(fn,W)}${col(fn,O)}</tr>`).join("")}</tbody></table></div>
   ${!O?`<div class="small" style="margin-top:6px">${sel.length>1?"No games this season without all of them.":"He hasn't missed a game this season."}</div>`:O.n<3?`<div class="small" style="margin-top:6px">Only ${O.n} game${O.n>1?"s":""} without — a very small sample.</div>`:""}`}
function woTeam(sp,t,name){const key=sp+"|"+t,sel=WO.sel[key]||(WO.sel[key]=new Set()),L=woStars(sp,t);if(!L.length)return "";
  return `<div class="wot" data-wot="${key}"><h3 class="nhh3">${woE(name(t))}</h3><div class="wochips">${L.map(n=>{const h=woHurt(sp,n);return `<button class="pchip${sel.has(n)?" on":""}" data-wop="${woE(n)}">${woE(n)}${/out|doubt|quest|ir|day/i.test(h)?` <span title="${woE(h)}">🚑</span>`:""}</button>`}).join("")}</div><div class="wobody">${woTable(sp,t)}</div></div>`}
function woCard(sp,a,h,name){const x=woTeam(sp,a,name)+woTeam(sp,h,name);if(!x)return "";
  return `<div class="card wocard" style="margin-top:14px"><h2 style="margin-bottom:2px">🚫 With vs without their stars</h2><div class="small" style="margin-bottom:6px">This season. Pick players to see how the team does when they don't play. 🚑 = on tonight's injury report.</div>${x}</div>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-wop]");if(!b)return;const box=b.closest("[data-wot]");if(!box)return;e.preventDefault();
  const key=box.dataset.wot,[sp,t]=key.split("|"),nm=b.dataset.wop.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">"),S=WO.sel[key]||(WO.sel[key]=new Set());
  S.has(nm)?S.delete(nm):S.add(nm);b.classList.toggle("on",S.has(nm));box.querySelector(".wobody").innerHTML=woTable(sp,t)});
