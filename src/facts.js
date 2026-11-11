/* ---------- 💡 Fun facts for a game: head-to-head and form streaks, from real results only ----------
   One set of rules for every sport. Each sport turns its data into
     meetings (newest first): {d, a, h, as, hs, ot, tot, cor, card}   (a/h = away/home team of THAT meeting)
     team games (newest first): {d, opp, home, pf, pa, ot, tot}
   and the rules pick the facts worth showing (a strong pattern, enough games). Every fact says how many games it covers.
   Sample sizes are small — these are talking points, not picks. */
function fxFacts(o){/* o: {sp, a, h, name(t), M:[meetings], A:[team games of a], H:[team games of h], line:{tot}, unit:"points"} */
  const F=[],nmRaw=o.name,nm=t=>nmRaw(t),pos=t=>{const n=nmRaw(t);return /s$/i.test(n)?n+"'":n+"'s"},M=o.M||[],U=o.unit||"points",add=(score,icon,txt)=>F.push({score,icon,txt});
  const win=m=>m.hs>m.as?m.h:m.as>m.hs?m.a:null,n=M.length;
  if(n>=3){
    /* who wins this matchup */
    for(const t of [o.a,o.h]){const L=M.slice(0,10),w=L.filter(m=>win(m)===t).length,k=L.length;
      if(w===k&&k>=3)add(10+k,"🔥",`<b>${nm(t)}</b> won all <b>${k}</b> of the last ${k} meetings`);
      else if(k>=5&&w/k>=.7)add(6+w,"🔥",`<b>${nm(t)}</b> won <b>${w} of the last ${k}</b> meetings`);
      let s=0;for(const m of M){if(win(m)===t)s++;else break}
      if(s>=3&&s<k)add(5+s,"📈",`<b>${nm(t)}</b> won the last <b>${s}</b> meetings in a row`)}
    /* home / away team in this matchup */
    for(const [side,lab] of [["h","home team"],["a","away team"]]){let s=0;for(const m of M){if(win(m)===m[side])s++;else break}
      if(s>=4)add(4+s,side==="h"?"🏠":"✈️",`The <b>${lab}</b> has won the last <b>${s}</b> meetings`)}
    /* overtime (NHL / NBA / NFL) */
    const oc=M.filter(m=>m.ot!=null);if(oc.length>=3){const L=oc.slice(0,6),k=L.filter(m=>m.ot).length;let s=0;for(const m of oc){if(m.ot)s++;else break}
      if(s>=2)add(9+s,"⏱️",`The last <b>${s}</b> meetings all went to <b>overtime</b>${o.sp==="nhl"?" / shootout":""}`);
      else if(k>=3&&k/L.length>=.5)add(7+k,"⏱️",`<b>${k} of the last ${L.length}</b> meetings went to <b>overtime</b>${o.sp==="nhl"?" / shootout":""}`)}
    /* scoring */
    const L=M.slice(0,8),avg=L.reduce((x,m)=>x+m.as+m.hs,0)/L.length,lt=o.line&&o.line.tot;
    if(lt!=null&&L.length>=4){const ov=L.filter(m=>m.as+m.hs>lt).length,un=L.filter(m=>m.as+m.hs<lt).length;
      if(ov/L.length>=.75)add(6+ov,"⬆️",`<b>${ov} of the last ${L.length}</b> meetings had more than tonight's total of ${lt} ${U} (avg ${avg.toFixed(1)})`);
      else if(un/L.length>=.75)add(6+un,"⬇️",`<b>${un} of the last ${L.length}</b> meetings stayed under tonight's total of ${lt} ${U} (avg ${avg.toFixed(1)})`)}
    const close=o.sp==="nfl"?8:o.sp==="nba"?5:1,cl=L.filter(m=>Math.abs(m.as-m.hs)<=close&&m.as!==m.hs).length;
    if(o.sp!=="soc"&&cl/L.length>=.6&&cl>=3)add(5+cl,"😬",`<b>${cl} of the last ${L.length}</b> meetings were decided by ${o.sp==="nhl"?"one goal":close+" points or fewer"}`);
    const big=o.sp==="nfl"?17:o.sp==="nba"?15:o.sp==="nhl"?3:3,bl=L.filter(m=>Math.abs(m.as-m.hs)>=big).length;
    if(bl/L.length>=.6&&bl>=3)add(4+bl,"💥",`<b>${bl} of the last ${L.length}</b> meetings were won by ${big}+ ${U}`);
    if(o.sp==="soc"){const S=M.slice(0,8),k=S.length,bt=S.filter(m=>m.as>0&&m.hs>0).length,o25=S.filter(m=>m.as+m.hs>2.5).length,dr=S.filter(m=>m.as===m.hs).length,u25=k-o25;
      if(bt/k>=.75)add(6+bt,"⚽",`Both teams scored in <b>${bt} of the last ${k}</b> meetings`);else if(bt/k<=.25&&k>=4)add(6+k-bt,"🧱",`Both teams scored in only <b>${bt} of the last ${k}</b> meetings`);
      if(o25/k>=.75)add(6+o25,"⬆️",`<b>${o25} of the last ${k}</b> meetings had 3+ goals`);else if(u25/k>=.75)add(6+u25,"⬇️",`<b>${u25} of the last ${k}</b> meetings had 2 goals or fewer`);
      if(dr/k>=.5&&dr>=3)add(6+dr,"🤝",`<b>${dr} of the last ${k}</b> meetings were draws`);
      const C=S.filter(m=>m.cor!=null);if(C.length>=4){const ac=C.reduce((x,m)=>x+m.cor,0)/C.length;if(ac>=11||ac<=7.5)add(5,"🚩",`These two averaged <b>${ac.toFixed(1)} corners</b> in their last ${C.length} meetings`)}
      const K=S.filter(m=>m.card!=null);if(K.length>=4){const ak=K.reduce((x,m)=>x+m.card,0)/K.length;if(ak>=5.5||ak<=2.5)add(5,"🟨",`These two averaged <b>${ak.toFixed(1)} cards</b> in their last ${K.length} meetings`)}}
  }
  /* form streaks (this season) */
  for(const [t,G,hm] of [[o.a,o.A||[],false],[o.h,o.H||[],true]]){if(G.length<4)continue;const res=g=>g.pf>g.pa?"W":g.pf<g.pa?"L":"D";
    let s=0;const r0=res(G[0]);for(const g of G){if(res(g)===r0)s++;else break}
    if(r0==="W"&&s>=4)add(4+s,"🔥",`<b>${nm(t)}</b> have won <b>${s} straight</b>`);
    if(r0==="L"&&s>=4)add(3+s,"🥶",`<b>${nm(t)}</b> have lost <b>${s} straight</b>`);
    if(o.sp==="soc"){let u=0;for(const g of G){if(res(g)!=="L")u++;else break}if(u>=6&&r0!=="W"||u>=8)add(3+u,"🛡️",`<b>${nm(t)}</b> are unbeaten in their last <b>${u}</b>`)}
    const V=G.filter(g=>g.home===hm).slice(0,10),vw=V.filter(g=>g.pf>g.pa).length;
    if(V.length>=4&&(vw===V.length||vw/V.length>=.8))add(3+vw,hm?"🏠":"✈️",`<b>${nm(t)}</b> won <b>${vw} of ${V.length}</b> ${hm?"at home":"on the road"} this season`);
    else if(V.length>=4&&vw/V.length<=.2)add(3+V.length-vw,hm?"🏠":"✈️",vw?`<b>${nm(t)}</b> won just <b>${vw} of ${V.length}</b> ${hm?"at home":"on the road"} this season`:`<b>${nm(t)}</b> haven't won ${hm?"at home":"on the road"} this season (<b>0 of ${V.length}</b>)`);
    const T=G.filter(g=>g.tot!=null).slice(0,10);if(T.length>=6){const ov=T.filter(g=>g.pf+g.pa>g.tot).length,un=T.filter(g=>g.pf+g.pa<g.tot).length;
      if(ov/T.length>=.8)add(4+ov,"⬆️",`<b>${pos(t)}</b> games went over the total in <b>${ov} of the last ${T.length}</b>`);
      else if(un/T.length>=.8)add(4+un,"⬇️",`<b>${pos(t)}</b> games stayed under the total in <b>${un} of the last ${T.length}</b>`)}
    {const VT=G.filter(g=>g.home===hm&&g.tot!=null).slice(0,10);if(VT.length>=4){const ov=VT.filter(g=>g.pf+g.pa>g.tot).length,un=VT.filter(g=>g.pf+g.pa<g.tot).length;
      if(ov/VT.length>=.8)add(4+ov,hm?"🏟️":"🧳",`<b>${pos(t)}</b> ${hm?"home":"road"} games went over the total in <b>${ov} of ${VT.length}</b>`);
      else if(un/VT.length>=.8)add(4+un,hm?"🏟️":"🧳",`<b>${pos(t)}</b> ${hm?"home":"road"} games stayed under the total in <b>${un} of ${VT.length}</b>`)}}
    if(o.sp==="nhl"){const k=G.slice(0,8).filter(g=>g.ot).length;if(k>=4)add(4+k,"⏱️",`<b>${k} of ${pos(t)} last 8</b> games went to overtime / shootout`)}}
  for(const x of o.extra||[])add(x[0],x[1],x[2]);   /* referee / venue facts from the sport */
  return F.sort((x,y)=>y.score-x.score).filter((f,i,A)=>A.findIndex(z=>z.txt===f.txt)===i).slice(0,6)}
function fxCard(F,src){if(!F||!F.length)return "";
  return `<div class="card fxc" style="margin-top:12px"><h2 style="margin-bottom:6px">💡 Fun facts</h2>${F.map(f=>`<div class="fxr"><span class="fxi">${f.icon}</span><span>${f.txt}</span></div>`).join("")}
   <div class="small" style="margin-top:6px">${src||"From real results."} Small samples — talking points, not picks.</div></div>`}

/* ----- per sport: build meetings + team games from the site's data ----- */
function fxNba(g){try{const prev=((typeof NBA_H2H!=="undefined"&&NBA_H2H[g.a+"@"+g.h])||[]).map(r=>({d:r[0],a:r[1],h:r[2],as:r[3],hs:r[4]}));
  const SP=typeof NBA_SPR!=="undefined"?NBA_SPR:{};
  const cur=NBA_RES.filter(r=>(r[2]===g.a&&r[3]===g.h)||(r[2]===g.h&&r[3]===g.a)).map(r=>({d:r[1],a:r[2],h:r[3],as:r[4],hs:r[5]}));
  const M=[...prev,...cur].sort((x,y)=>x.d<y.d?1:-1);
  const tg=t=>NBA_RES.filter(r=>r[2]===t||r[3]===t).sort((x,y)=>x[1]<y[1]?1:-1).map(r=>{const h=r[3]===t,s=SP[r[0]];return {d:r[1],home:h,pf:h?r[5]:r[4],pa:h?r[4]:r[5],tot:s&&s[4]!=null?s[4]:null}});
  const L=typeof NBA_LINES!=="undefined"&&NBA_LINES[g.a+"@"+g.h],X=[];
  /* tonight's referee crew: their games this season (overs vs the closing total, free throws, points) */
  try{const crew=NBA_REFS&&NBA_REFS.today&&NBA_REFS.today[g.a+"@"+g.h],R=NBA_REFS.ref||{},lg=NBA_REFS.lg;if(crew&&lg){const S=crew.map(n=>R[n]).filter(Boolean);
    if(S.length){const ov=S.reduce((a,r)=>a+r[4],0),gr=S.reduce((a,r)=>a+r[5],0),ft=S.reduce((a,r)=>a+r[1],0)/S.length,pt=S.reduce((a,r)=>a+r[3],0)/S.length,who=crew.length>1?"Tonight's referees":"Tonight's referee";
      if(gr>=8&&ov/gr>=.7)X.push([7+ov/gr*5,"🦓",`${who}' games went <b>over</b> the closing total <b>${ov} of ${gr}</b> times this season`]);
      else if(gr>=8&&ov/gr<=.3)X.push([7+(1-ov/gr)*5,"🦓",`${who}' games stayed <b>under</b> the closing total <b>${gr-ov} of ${gr}</b> times this season`]);
      if(ft>=lg[0]+3)X.push([6,"🦓",`A whistle-heavy crew: <b>${ft.toFixed(1)}</b> free throws a game in their games (league ${lg[0]})`]);else if(ft<=lg[0]-3)X.push([6,"🦓",`A crew that lets them play: <b>${ft.toFixed(1)}</b> free throws a game (league ${lg[0]})`]);
      if(Math.abs(pt-lg[2])>=6)X.push([5,"🦓",`This crew's games average <b>${pt.toFixed(1)}</b> points (league ${lg[2]})`])}}}catch(e){}
  return fxFacts({sp:"nba",a:g.a,h:g.h,name:nbaShort,M,A:tg(g.a),H:tg(g.h),line:{tot:L?L.tot:null},extra:X.concat(fxPlayerVs("nba",g.a,g.h))})}catch(e){return []}}
function fxNhl(g){try{const P=((typeof NHL_H2HP!=="undefined"&&NHL_H2HP[[g.a,g.h].sort().join("|")])||[]).map(r=>({d:r[0],a:r[1],as:r[2],h:r[3],hs:r[4],ot:r[5]!=null?!!r[5]:null}));
  const cur=nhH2H(g.a,g.h).map(r=>({d:r[0],a:r[1],as:r[2],h:r[3],hs:r[4],ot:r[5]!=null?!!r[5]:null}));
  const M=[...P,...cur].sort((x,y)=>x.d<y.d?1:-1);
  const tg=t=>(NHL_RES||[]).filter(r=>r[1]===t||r[3]===t).slice().reverse().map(r=>{const h=r[3]===t;return {d:r[0],home:h,pf:h?r[4]:r[2],pa:h?r[2]:r[4],ot:!!r[5],tot:r[9]!=null?r[9]:null}});
  return fxFacts({sp:"nhl",a:g.a,h:g.h,name:t=>nhTm(t),M,A:tg(g.a),H:tg(g.h),line:{tot:g.tot?g.tot[0]:null},unit:"goals",extra:fxPlayerVs("nhl",g.a,g.h)})}catch(e){return []}}
function fxNfl(g){try{const R=typeof nflH2hRows!=="undefined"?nflH2hRows(g):[];
  const M=R.map(([d,a,as,h,hs])=>({d,a,as,h,hs}));
  const SP=typeof NFL_SPR!=="undefined"?NFL_SPR:{};
  const tg=t=>(typeof RESULTS!=="undefined"?RESULTS:[]).filter(r=>r[1]===t||r[3]===t).sort((x,y)=>y[0]-x[0]).map(r=>{const h=r[3]===t,s=SP[r[0]+"|"+t];return {d:r[0],home:h,pf:h?r[4]:r[2],pa:h?r[2]:r[4],tot:s&&s[2]!=null?s[2]:null}});
  const L=typeof LINES!=="undefined"&&LINES[g.id];
  return fxFacts({sp:"nfl",a:g.away,h:g.home,name:short,M,A:tg(g.away),H:tg(g.home),line:{tot:L?L.tot:null},extra:fxPlayerVs("nfl",g.away,g.home)})}catch(e){return []}}
function fxSoc(f){try{const ids=(window.SOC_H2H||{})[f.id]||[];
  const M=ids.map(socMatchRow).filter(Boolean).map(r=>({d:r[1],h:r[3],a:r[4],hs:r[5],as:r[6],cor:typeof socMatchVal!=="undefined"?socMatchVal(r,"cor"):null,card:typeof socMatchVal!=="undefined"?socMatchVal(r,"card"):null})).sort((x,y)=>x.d<y.d?1:-1);
  const tg=t=>socTeamRes(t).slice().sort((x,y)=>x[1]<y[1]?1:-1).map(r=>{const h=r[3]===t;return {d:r[1],home:h,pf:h?r[5]:r[6],pa:h?r[6]:r[5]}});
  const O=f.odds||{},tot=O.main_tot!=null?+O.main_tot:null;
  const X=[];try{const r=f.ref&&socRefRow(f.c,f.ref),av=socRefAvg(f.c);if(r&&r[1]>=4&&r[4]!=null&&av){if(r[4]>=av*1.25)X.push([7,"🟨",`Referee <b>${socE(f.ref)}</b> averages <b>${(+r[4]).toFixed(1)} cards</b> a game (league ${av.toFixed(1)}, ${r[1]} games)`]);
    else if(r[4]<=av*.75)X.push([7,"🟨",`Referee <b>${socE(f.ref)}</b> averages just <b>${(+r[4]).toFixed(1)} cards</b> a game (league ${av.toFixed(1)}, ${r[1]} games)`])}}catch(e){}
  return fxFacts({sp:"soc",a:f.a,h:f.h,name:socTm,M,A:tg(f.a),H:tg(f.h),line:{tot:null},unit:"goals",extra:X})   /* soccer has its own 3+ goals / BTTS rules */}catch(e){return []}}

/* 🆚 player vs this opponent: for players with a line tonight, how often they cleared it against this team before
   (this season + last season for NBA/NHL; all seasons in our logs for NFL). Only strong patterns (3+ games, 80%+ one way). */
function fxPlayerVs(sp,a,h){const X=[];try{
  const rows=[],seen=new Set();
  if(sp==="nba")for(const r of NBA_PROPS){const p=NBA_LOGS[r[0]];if(!p||![a,h].includes(p.tm)||seen.has(r[0]+r[1]))continue;seen.add(r[0]+r[1]);const opp=p.tm===a?h:a;
      const V=nbaAllG(r[0]).filter(o=>o.x[2]===opp).map(o=>nbaVal(o.x,r[1])).filter(Number.isFinite);rows.push([r[0],opp,r[2],V,NBA_MK[r[1]]?NBA_MK[r[1]][2]:r[1],nbaShort(opp)])}
  if(sp==="nhl")for(const r of (typeof NHL_PROPS!=="undefined"?NHL_PROPS:[])){const w=nhWho(r[0]);if(!w||![a,h].includes(w.tm)||seen.has(r[0]+r[1])||!NH_MK[r[1]]||!NH_MK[r[1]][3])continue;seen.add(r[0]+r[1]);const opp=w.tm===a?h:a;
      const V=nhVals(r[0],r[1]).filter(o=>o.x[1]===opp).map(o=>o.v).filter(Number.isFinite);rows.push([r[0],opp,r[1]==="hanyG"?.5:r[2],V,r[1]==="hanyG"?"goals":NH_MK[r[1]][2],nhTm(opp)])}
  if(sp==="nfl")for(const [key,rp] of Object.entries(typeof REAL_PROPS!=="undefined"?REAL_PROPS:{})){const i=key.lastIndexOf("|"),nm=key.slice(0,i),k=key.slice(i+1),P=PINFO[nm];if(!P||![a,h].includes(P.team)||!MARKETS[k])continue;const opp=P.team===a?h:a;
      const V=pLogs(nm).filter(l=>l.opp===opp).map(l=>stat(l,k)).filter(Number.isFinite);rows.push([nm,opp,k==="anyTD"?.5:rp[0],V,k==="anyTD"?"TDs":MARKETS[k].n.toLowerCase(),short(opp)])}
  for(const [nm,opp,line,V,u,on] of rows){if(V.length<3||line==null)continue;const L=V.slice(-8),o=L.filter(v=>v>line).length,un=L.filter(v=>v<line).length,avg=L.reduce((x,y)=>x+y,0)/L.length;
    const last=String(nm).split(" ").filter(w=>!/^(Jr\.?|Sr\.?|II|III|IV)$/.test(w)).pop();
    if(o/L.length>=.8)X.push([6+o,"🆚",`<b>${last}</b> went <b>over ${line} ${u}</b> in <b>${o} of ${L.length}</b> games vs the ${on} (avg ${avg.toFixed(1)})`]);
    else if(un/L.length>=.8)X.push([6+un,"🆚",`<b>${last}</b> stayed <b>under ${line} ${u}</b> in <b>${un} of ${L.length}</b> games vs the ${on} (avg ${avg.toFixed(1)})`])}
  }catch(e){}const seen=new Set();return X.sort((x,y)=>y[0]-x[0]).filter(x=>{const who=x[2].match(/<b>([^<]+)<\/b>/)[1];if(seen.has(who))return false;seen.add(who);return true}).slice(0,2)}   /* one per player, two per game */
