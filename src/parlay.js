/* ---------- 🎟 Parlays: one per sport (legs from different games) and one per game (legs that hit together) ----------
   Built only from picks where our chance beats the price (the same "our chance" as the best props: the book's fair price
   moved partway toward the player's hit rates). Different games → the legs are independent, so our chance of the
   parlay is just our chances multiplied. Same game → from the games those players shared: how often ALL legs hit,
   blended with the multiplied chances for small samples. Target payout: ~5–6.5 (decimal), 3–4 legs.
   Real prices only; a parlay is shown only when our chance beats what the price needs. Tracked in the record. */
const PRL={lo:5,hi:6.5};
function prlDec(o){return o>0?1+o/100:1+100/(-o)}
function prlAm(d){return d>=2?Math.round((d-1)*100):-Math.round(100/(d-1))}
function prlLast(n){const w=String(n).split(" ").filter(x=>!/^(Jr\.?|Sr\.?|II|III|IV|V)$/i.test(x));return w[w.length-1]||n}
/* legs for a sport: {sp,g,player,team,label,odds,p,edge,spec} */
function prlLegs(sp){const L=[];
  try{
    if(sp==="nba"&&typeof nbaBest!=="undefined")for(const b of nbaBest()){if(!b.g||b.odds==null)continue;const s=nbaSpec(b.nm,b.k,b.side==="o"?"over":"under");if(!s)continue;Object.assign(s,{line:b.line,odds:b.odds,book:b.book||s.book});
      L.push({sp,g:String(b.g.id),player:b.nm,team:b.p.tm,label:`${prlLast(b.nm)} ${b.side==="o"?"over":"under"} ${b.line} ${NBA_MK[b.k][2]}`,odds:b.odds,p:b.sc,edge:b.edge,spec:s,k:b.k,side:b.side,line:b.line})}
    if(sp==="nhl"&&typeof nhBest!=="undefined")for(const b of nhBest()){if(!b.g||b.odds==null||b.g.d!==NHL_DATE)continue;const s=nhlSpec(b.nm,b.k,b.side==="o"?"over":"under");if(!s)continue;Object.assign(s,{line:b.line,odds:b.odds});
      L.push({sp,g:String(b.g.id),player:b.nm,team:nhWho(b.nm).tm,label:b.k==="hanyG"?`${prlLast(b.nm)} to score`:`${prlLast(b.nm)} ${b.side==="o"?"over":"under"} ${b.line} ${NH_MK[b.k][2]}`,odds:b.odds,p:b.s.p,edge:b.edge,spec:s,k:b.k,side:b.side,line:b.line})}
    if(sp==="nfl"&&typeof nflBest!=="undefined")for(const b of nflBest()){if(!b.g||b.odds==null)continue;const s=specProp(b.name,b.k,b.side==="o"?"over":"under");if(!s)continue;Object.assign(s,{line:b.line,odds:b.odds});
      L.push({sp,g:String(b.g.id),player:b.name,team:b.pl.team,label:b.k==="anyTD"?`${prlLast(b.name)} TD`:`${prlLast(b.name)} ${b.side==="o"?"over":"under"} ${b.line} ${MARKETS[b.k].n.toLowerCase()}`,odds:b.odds,p:b.sc,edge:b.edge,spec:s,k:b.k,side:b.side,line:b.line})}
    if(sp==="soc"&&typeof SOC_FX!=="undefined"&&window.SOC_OK){
      for(const f of SOC_FX){if(socStarted(f)||!f.odds||(Date.parse(f.t)-Date.now())/36e5>36)continue;
        for(const e of socEdges(f)){const p=e.e+socImp(e.o);L.push({sp,g:String(f.id),player:"",team:"",label:`${socTm(f.h)} v ${socTm(f.a)}: ${e.t}`,odds:e.o,p,edge:e.e,spec:e.spec,mkt:e.spec.kind})}}
      if(typeof socBestProps!=="undefined"&&window.SOC_P_OK)for(const x of socBestProps()){if((Date.parse(x.f.t)-Date.now())/36e5>36||x.price==null)continue;
        const s=socSpec(x.f,"prop","o",x.line,x.price,x.book,{pid:x.aid,mk:x.mk,player:x.nm,title:`${x.nm} ${socPropLab(x.mk,x.line)}`});
        L.push({sp,g:String(x.f.id),player:x.nm,team:"",label:`${prlLast(x.nm)} ${socPropLab(x.mk,x.line).toLowerCase()}`,odds:x.price,p:x.our,edge:x.edge,spec:s})}}
  }catch(e){}
  return L.filter(l=>l.p!=null&&l.edge!=null&&l.edge>=.03&&l.p>=.4&&prlDec(l.odds)>=1.3&&prlDec(l.odds)<=3.4)}
/* best combination: 3–4 legs, all different games and players (soccer: one leg per match), payout in [lo, hi],
   highest value (our chance × payout); only when that is above 1 (our chance beats what the price needs) */
function prlPick(legs,lo,hi,same){legs=legs.slice().sort((a,b)=>b.edge-a.edge).slice(0,same?10:14);let best=null;const n=legs.length;
  const ok=(A)=>{const g=new Set(),pl=new Set();for(const l of A){if(!same&&g.has(l.g))return false;g.add(l.g);if(l.player){if(pl.has(l.player))return false;pl.add(l.player)}
    if(same&&A.some(x=>x!==l&&x.mkt&&x.mkt===l.mkt))return false}return true};
  const tryA=A=>{if(!ok(A))return;const dec=A.reduce((x,l)=>x*prlDec(l.odds),1);if(dec<lo||dec>hi)return;
    const P=same?prlSameP(A):A.reduce((x,l)=>x*l.p,1);if(P==null)return;const v=P*dec;if(v<=1.02)return;if(!best||v>best.v)best={legs:A,dec,p:P,v,need:1/dec}};
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++){tryA([legs[a],legs[b],legs[c]]);for(let d=c+1;d<n;d++)tryA([legs[a],legs[b],legs[c],legs[d]])}
  return best}
/* same game: how often all legs hit in the games these players shared (season-to-date), blended toward the multiplied
   chances when there are few shared games; null if fewer than 6 shared games */
function prlSameP(A){if(typeof sgpLog==="undefined")return null;const M=A.map(l=>sgpLog(l.spec));let ks=Object.keys(M[0]);for(const m of M.slice(1))ks=ks.filter(k=>k in m);const n=ks.length;if(n<6)return null;
  const all=ks.filter(k=>M.every(m=>m[k])).length,ind=A.reduce((x,l)=>x*l.p,1),w=n/(n+25);   /* few shared games → mostly the multiplied chances */A._n=n;A._all=all;return w*(all/n)+(1-w)*ind}
function prlForSport(sp){return prlPick(prlLegs(sp),PRL.lo,PRL.hi,false)}
function prlForGame(sp,gid){const L=prlLegs(sp).filter(l=>l.g===String(gid)&&l.spec&&l.spec.k!=="soc");if(L.length<3)return null;return prlPick(L,4.5,8,true)}
function prlCard(sp,P,title,note,same){const nm={nba:"NBA",nhl:"NHL",nfl:"NFL",soc:"Soccer"}[sp];
  if(!P)return `<div class="card prl" style="margin:12px 0"><h2 style="margin-bottom:2px">🎟 ${title||nm+" parlay of the day"}</h2><div class="small">${same?"No 3 legs from this game have hit together often enough at a price around 5–8 to suggest one.":"No 3–4 of today's picks combine into a parlay around 5–6.5 where our chance beats the price — no parlay today is better than a bad one."}</div></div>`;
  const pct=x=>Math.round(x*100)+"%",key="prl"+sp+(same?"g":"");window.PRL_LAST=window.PRL_LAST||{};window.PRL_LAST[key]=P;
  return `<div class="card prl" style="margin:12px 0"><h2 style="margin-bottom:2px">🎟 ${title||nm+" parlay of the day"}</h2>
   <div class="small" style="margin-bottom:8px">${note||(same?"Legs that have hit together in the games these players shared.":"One leg from each game, each a pick where our chance beats the price.")}</div>
   <div class="prlh"><div><b>${P.dec.toFixed(2)}</b><span>payout (${prlAm(P.dec)>0?"+":""}${prlAm(P.dec)})</span></div><div><b>${pct(P.p)}</b><span>our chance all hit</span></div><div><b>${pct(P.need)}</b><span>the price needs</span></div></div>
   ${P.legs.map(l=>`<div class="prll"><span>${typeof esc!=="undefined"?esc(l.label):l.label}</span><span class="small">${typeof oddsFmt!=="undefined"?oddsFmt(l.odds):l.odds} · our ${pct(l.p)}</span></div>`).join("")}
   ${same&&P.legs._n?`<div class="small" style="margin-top:4px">All ${P.legs.length} hit in <b>${P.legs._all} of ${P.legs._n}</b> shared games.</div>`:""}
   <button class="btn" data-prl="${key}" style="width:100%;margin-top:8px">🎟 Load into my parlay slip</button><button class="btn" data-prlsh="${key}" style="width:100%;margin-top:6px">📤 Share this parlay</button>
   <div class="small" style="margin-top:6px">${same?"Books price same-game parlays lower than the legs multiplied — check your book's real parlay price. ":""}Even a good parlay misses most of the time (${pct(1-P.p)} here) — bet small.</div></div>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-prl]");if(!b)return;e.preventDefault();const P=window.PRL_LAST&&window.PRL_LAST[b.dataset.prl];if(!P||typeof slipSet==="undefined")return;
  slipSet(P.legs.map(l=>Object.assign({},l.spec)));if(typeof toast!=="undefined")toast(`Parlay loaded — ${P.legs.length} legs`);if(typeof slipOpen!=="undefined")slipOpen()});
/* page helpers: nothing when the sport has no open picks at all (no games left / data not loaded) */
function prlSportHtml(sp){if(sp==="soc"&&!window.SOC_OK)return "";const L=prlLegs(sp);if(!L.length)return "";return prlCard(sp,prlPick(L,PRL.lo,PRL.hi,false))}
function prlGameHtml(sp,gid){try{const L=prlLegs(sp).filter(l=>l.g===String(gid));if(L.length<3)return "";return prlCard(sp,prlForGame(sp,gid),"3-leg parlay from this game","",true)}catch(e){return ""}}
