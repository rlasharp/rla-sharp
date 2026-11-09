/* ---------- 🏈 NFL team pages (#team-BUF): record, next game, offense / defense ranks, red zone, pass rate,
   division betting record, results, injuries and the key players. Real data only (nflverse, PFR, ESPN, books). ---------- */
function nflTeamLink(t,txt){return `<a href="#team-${t}" class="sctl">${txt||esc(short(t))}</a>`}
function viewNflTeam(t){const host=document.getElementById("v-nflteam");if(!host)return;
  if(!TEAMS[t]){host.innerHTML=`<p><a href="#standings">← Standings</a></p><div class="card">Team not found.</div>`;return}
  const S=typeof NFL_STAND!=="undefined"&&NFL_STAND[t],u=units()[t],o=oppOf(t),inj=(typeof INJ!=="undefined"&&INJ[t])||[];
  const divN=typeof NFL_DIV!=="undefined"?Object.keys(NFL_DIV).find(d=>NFL_DIV[d].includes(t)):null;
  const divRank=divN&&S?NFL_DIV[divN].slice().sort((a,b)=>NFL_STAND[b].pct-NFL_STAND[a].pct||(NFL_STAND[b].pf-NFL_STAND[b].pa)-(NFL_STAND[a].pf-NFL_STAND[a].pa)).indexOf(t)+1:null;
  const res=(typeof RESULTS!=="undefined"?RESULTS:[]).filter(r=>r[1]===t||r[3]===t).sort((a,b)=>b[0]-a[0]);
  const rk=(lab,k,side)=>u?`<tr><td>${lab}</td><td><b>${u[side][k]}</b></td><td>${rankPill(u[side][k+"R"])}</td></tr>`:"";
  const rz=typeof NFL_RZT!=="undefined"&&NFL_RZT[t],pr=typeof NFL_PROE!=="undefined"&&NFL_PROE[t],dv=typeof NFL_DIVX!=="undefined"&&NFL_DIVX&&NFL_DIVX.tm&&NFL_DIVX.tm[t];
  /* key players: this season's totals from the game logs */
  const P=Object.keys(PINFO).filter(n=>PINFO[n].team===t).map(n=>{const L=pLogs(n).filter(l=>l.season===CUR),sum=k=>L.reduce((a,l)=>a+(l[k]||0),0);return {n,pos:PINFO[n].pos,g:L.length,py:sum("passYds"),ptd:sum("passTD"),int:sum("int"),ry:sum("rushYds"),rtd:sum("rushTD"),rec:sum("rec"),yy:sum("recYds"),ytd:sum("recTD")}}).filter(x=>x.g);
  const top=(f,n)=>P.slice().sort((a,b)=>f(b)-f(a)).filter(x=>f(x)>0).slice(0,n);
  const prow=(x,txt)=>`<div class="scfr"><a href="#" data-nflp="${esc(x.n)}"><b>${esc(x.n)}</b></a> <span class="small">${esc(x.pos)} · ${x.g} g</span><span class="small" style="margin-left:auto">${txt}</span></div>`;
  host.innerHTML=`<p><a href="javascript:history.back()">← Back</a> · <a href="#standings">Standings</a></p>
  <div class="phead"><div><h1>${badge(t)} ${esc(nfTm(t))}</h1><p class="sub">${S?`<b>${nfRec(S)}</b>${divRank?` · ${ordinal(divRank)} in the ${esc(divN)}`:""} · home ${S.hw}-${S.hl} · away ${S.aw}-${S.al} · division ${S.dw}-${S.dl} · streak <b class="${/^W/.test(S.strk)?"up":"dn"}">${S.strk}</b>`:""}</p></div><div></div></div>
  ${o?`<div class="card"><h2>Next</h2><a class="scfr scfrl" href="#game-${o.g.id}">${o.home?"vs":"@"} ${badge(o.opp)} ${esc(nfTm(o.opp))}<span class="small">${esc(o.g.when||"")}</span></a></div>`:""}
  <div class="grid g2">
   <div class="card"><h2>🏈 Offense <span class="small">per game · rank of 32</span></h2><table class="bxt" style="min-width:0;width:100%"><tbody>${rk("Points","pts","o")}${rk("Pass yards","pass","o")}${rk("Rush yards","rush","o")}${rk("Total yards","tot","o")}</tbody></table></div>
   <div class="card"><h2>🛡️ Defense <span class="small">allowed per game · rank</span></h2><table class="bxt" style="min-width:0;width:100%"><tbody>${rk("Points","pts","d")}${rk("Pass yards","pass","d")}${rk("Rush yards","rush","d")}${rk("Total yards","tot","d")}</tbody></table></div></div>
  ${rz||pr||dv?`<div class="card"><h2>📊 How they play</h2><div class="pbio">
    ${S?`<div><b>${(S.pf/Math.max(1,S.w+S.l+(S.t||0))).toFixed(1)}</b>Points for / game</div><div><b>${(S.pa/Math.max(1,S.w+S.l+(S.t||0))).toFixed(1)}</b>Points against / game</div>`:""}
    ${rz?`<div><b>${(rz[0]/Math.max(1,rz[3])).toFixed(1)}</b>Red-zone touches / game</div><div><b>${(rz[2]/Math.max(1,rz[3])).toFixed(1)}</b>Offensive TDs / game</div>`:""}
    ${pr&&pr[0]!=null?`<div><b class="${pr[0]>0?"up":"dn"}">${pr[0]>0?"+":""}${pr[0]}%</b>Pass rate over expected</div><div><b>${pr[2]}</b>Plays / game</div>`:""}
    ${dv?`<div><b>${dv[2]}-${dv[3]}</b>Division games vs the spread</div><div><b>${dv[4]}-${dv[5]}</b>Division games over-under</div>`:""}</div>
    ${dv?`<div class="small" style="margin-top:6px">Division numbers cover the last 3 seasons plus this one (nflverse closing lines).</div>`:""}</div>`:""}
  <div class="card"><h2>📅 Results</h2>${res.map(r=>{const home=r[3]===t,me=home?r[4]:r[2],op=home?r[2]:r[4],opp=home?r[1]:r[3],x=me>op?"W":me<op?"L":"D";
    return `<div class="scfr"><i class="scf ${x}">${x}</i><span class="small">Wk ${r[0]}</span><span>${home?"vs":"@"} ${badge(opp)} ${nflTeamLink(opp)}</span><b>${me}-${op}</b></div>`}).join("")||`<div class="small">No games yet.</div>`}</div>
  <div class="card"><h2>⭐ Key players <span class="small">this season</span></h2>
   ${(()=>{const seen=new Set(),pick=(L)=>L.filter(x=>!seen.has(x.n)&&seen.add(x.n));
     const qb=pick(top(x=>x.pos==="QB"?x.py:0,1)),rb=pick(top(x=>x.pos==="RB"?x.ry:0,2)),wr=pick(top(x=>["WR","TE","RB"].includes(x.pos)?x.yy:0,4));
     return qb.map(x=>prow(x,`${x.py} pass yds · ${x.ptd} TD · ${x.int} INT${x.ry>=50?` · ${x.ry} rush yds`:""}`)).join("")+rb.map(x=>prow(x,`${x.ry} rush yds · ${x.rtd} TD${x.yy?` · ${x.yy} rec yds`:""}`)).join("")+wr.map(x=>prow(x,`${x.rec} rec · ${x.yy} yds · ${x.ytd} TD`)).join("")})()}
   <div class="small" style="margin-top:6px">Tap a player for his props and game log.</div></div>
  <div class="card"><h2>🚑 Injuries</h2>${inj.length?inj.map(([n,p,s,i,r])=>`<div class="scfr"><b>${esc(n)}</b> <span class="small">${esc(p)}</span><span class="pll ${/out|ir/i.test(s)?"u":"n"}">${esc(s)}</span><span class="small">${esc(i||"")}${r?" · "+esc(r):""}</span></div>`).join(""):`<div class="small">No one on the injury report.</div>`}</div>`;
  host.querySelectorAll("[data-nflp]").forEach(a=>a.onclick=e=>{e.preventDefault();if(typeof goPlayer!=="undefined"){LS.set("sport","nfl");goPlayer(a.dataset.nflp)}})}
