/* ---------- 🧭 Game factors: the situational stuff that moves games beyond the numbers ----------
   NBA / NHL / NFL: altitude (Denver, Salt Lake City). NFL: offensive-line injuries, expected game script, referee crew.
   Soccer: fixture congestion (rest days + the next match), motivation (where each team stands in the table), derbies,
   manager changes. Every line is built from this site's own data (results, injuries, lines, standings, fixtures) or
   ESPN's news/officials; nothing invented. Shown as one card near the top of each game page. */
const XF_ALT={nba:{DEN:["Denver",5280],UTAH:["Salt Lake City",4226]},nhl:{COL:["Denver",5280],UTA:["Salt Lake City",4226]},nfl:{DEN:["Denver",5280]}};
function xfE(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
function xfCard(rows,sub){rows=rows.filter(Boolean);if(!rows.length)return "";
  return `<div class="card xfcard"><h2 style="margin-bottom:2px">🧭 Game factors</h2><div class="small" style="margin-bottom:6px">${sub||"Situations that can swing this game beyond the numbers."}</div>
   ${rows.map(r=>`<div class="xfr ${r.c||""}"><span class="xfi">${r.ic}</span><div><b>${r.h}</b><div class="small">${r.t}</div></div></div>`).join("")}</div>`}
/* altitude: visitors' results in the building this season (+ the visitor's rest) */
function xfAlt(sp,a,h,o){const A=(XF_ALT[sp]||{})[h];if(!A)return null;let w=0,l=0;
  try{if(sp==="nba")for(const r of NBA_RES)if(r[3]===h){r[4]>r[5]?w++:l++}
    if(sp==="nhl")for(const r of NHL_RES||[])if(r[3]===h){r[2]>r[4]?w++:l++}
    if(sp==="nfl")for(const r of RESULTS||[])if(r[3]===h){r[2]>r[4]?w++:l++}}catch(e){}
  const tired=o&&o.b2b;
  return {ic:"🏔️",c:tired?"dn":"",h:`Altitude: ${A[0]}, ${A[1].toLocaleString("en-US")} ft`,
    t:`Thin air tires visitors, mostly late in games.${w+l?` Visiting teams are <b>${w}–${l}</b> here this season.`:""}${tired?` <b>${xfE(o.name)}</b> are also on a back-to-back — the toughest spot to play here.`:""}`}}

/* ---- NFL ---- */
const XF_OL=/^(OT|T|G|OG|C|OL|LT|RT|LG|RG)$/;
function xfOline(t){const L=(typeof INJ!=="undefined"&&INJ[t]||[]).filter(r=>XF_OL.test(r[1]));
  const out=L.filter(r=>/^(Out|Doubtful)$/i.test(r[2])),ir=L.filter(r=>/IR|Reserve|PUP/i.test(r[2])),q=L.filter(r=>/Questionable/i.test(r[2]));
  if(!out.length&&q.length<2&&ir.length<2)return null;const nm=a=>a.map(r=>`${xfE(r[0])} (${xfE(r[1])})`).join(", ");
  const hit=out.length+Math.min(ir.length,2)>=2;
  return {ic:"🧱",c:hit?"dn":"",h:`${xfE(short(t))} offensive line${out.length?`: ${out.length} out this week`:""}`,
    t:[out.length?`Out/doubtful: ${nm(out)}.`:"",q.length?`Questionable: ${nm(q)}.`:"",ir.length?`On IR: ${nm(ir)}.`:"",hit?" A thin line means more pressure and sacks — usually bad for the QB's passing numbers and the run game.":""].filter(Boolean).join(" ")}}
function xfScriptOf(g){const L=typeof LINES!=="undefined"&&LINES[g.id];if(!L||L.sp==null)return null;const n=Math.abs(L.sp);if(n<6.5)return null;
  const fav=L.sp<=0?g.home:g.away,dog=fav===g.home?g.away:g.home;return {fav,dog,n}}
function xfScript(g){const s=xfScriptOf(g);if(!s)return null;
  return {ic:"📜",h:`Expected game script: ${xfE(short(s.fav))} favored by ${s.n}`,
    t:`If it plays out that way, ${xfE(short(s.dog))} spend the second half throwing to catch up (more pass attempts for their QB and receivers) and ${xfE(short(s.fav))} lean on the run to close it out (more carries for their backs, fewer late passes).`}}
/* chip on NFL prop cards */
function xfScriptChip(pl){try{const o=oppOf(pl.team);if(!o)return "";const s=xfScriptOf(o.g);if(!s)return "";const dog=s.dog===pl.team,P=pl.pos;
  if(dog&&/QB|WR|TE/.test(P))return `<span class="qbc y" title="Big underdog: teams that trail throw more">📜 likely trailing → more passes</span>`;
  if(!dog&&P==="RB")return `<span class="qbc y" title="Big favorite: teams that lead run more late">📜 likely leading → more carries</span>`;
  if(!dog&&/QB|WR|TE/.test(P))return `<span class="qbc" title="Big favorite: passing can dry up once they lead">📜 big favorite — fewer late passes</span>`;}catch(e){}return ""}
function xfRef(g){const R=typeof NFL_REFS!=="undefined"&&NFL_REFS;if(!R||!R.g)return null;const nm=R.g[g.id];if(!nm)return null;const s=R.r[nm],L=R.lg;
  if(!s)return {ic:"🧑‍⚖️",h:`Referee: ${xfE(nm)}`,t:"No games from his crew in our data yet this season."};
  const fl=s.pen-L.pen,pt=s.pts-L.pts;
  return {ic:"🧑‍⚖️",c:Math.abs(fl)>=2||Math.abs(pt)>=4?"y":"",h:`Referee: ${xfE(nm)}'s crew`,
    t:`${s.n} games this season: <b>${s.pen.toFixed(1)}</b> flags a game (league ${L.pen.toFixed(1)}), ${s.yds.toFixed(0)} penalty yards, <b>${s.pts.toFixed(1)}</b> total points a game (league ${L.pts.toFixed(1)}).${fl>=2?" A flag-heavy crew — drives get extended, which tends to help overs.":fl<=-2?" Lets them play — fewer stoppages.":""}`}}

/* ---- Soccer ---- */
/* every match each team has in our data (all competitions), by kickoff time */
let XF_SCH=null;function xfSched(){if(XF_SCH)return XF_SCH;XF_SCH={};const add=(t,ts,c,id,opp,home)=>{(XF_SCH[t]=XF_SCH[t]||[]).push({ts:Date.parse(ts),c,id,opp,home})};
  for(const r of [...(window.SOC_OLD||[]),...(typeof SOC_RES!=="undefined"?SOC_RES:[])]){add(r[3],r[1]+"Z",r[2],r[0],r[4],1);add(r[4],r[1]+"Z",r[2],r[0],r[3],0)}
  for(const f of SOC_FX||[]){add(f.h,f.t,f.c,f.id,f.a,1);add(f.a,f.t,f.c,f.id,f.h,0)}
  for(const k in XF_SCH){const m=new Map();for(const x of XF_SCH[k])m.set(x.id,x);XF_SCH[k]=[...m.values()].sort((a,b)=>a.ts-b.ts)}return XF_SCH}
const XF_EURO=["ucl","uel","uecl"];
function xfLgN(c){return (SOC_LG[c]||{}).sh||(SOC_LG[c]||{}).n||c}
function xfCongest(f){const S=xfSched(),T=Date.parse(f.t),out=[];
  for(const t of [f.h,f.a]){const L=S[t]||[],prev=[...L].reverse().find(x=>x.ts<T-3*36e5),next=L.find(x=>x.ts>T+3*36e5);
    const rd=prev?Math.round((T-prev.ts)/864e5):null,nd=next?Math.round((next.ts-T)/864e5):null;
    const big=x=>x&&(XF_EURO.includes(x.c)||(x.c!==f.c&&!XF_EURO.includes(f.c)));
    const parts=[];if(rd!=null&&rd<=3)parts.push(`played ${rd} day${rd>1?"s":""} ago${prev.c!==f.c?` (${xfE(xfLgN(prev.c))} vs ${xfE(socTm(prev.opp))})`:""}`);
    if(nd!=null&&nd<=4&&big(next))parts.push(`${xfE(xfLgN(next.c))} ${next.home?"vs":"at"} ${xfE(socTm(next.opp))} in ${nd} day${nd>1?"s":""}`);
    if(parts.length)out.push({ic:"🔄",c:"y",h:`${xfE(socTm(t))}: busy week — rotation risk`,t:`${parts.join(" · ")}. Coaches often rest starters around a midweek game, which hits player props and the team's strength.`})}
  return out}
/* where each team stands — league size / matches / zones per competition (domestic leagues only) */
const XF_TBL={epl:[20,38,4,3],laliga:[20,38,4,3],seriea:[20,38,4,3],bund:[18,34,4,2],ligue1:[18,34,3,2],champ:[24,46,2,3],ered:[18,34,2,2],port:[18,34,2,2]};
function xfMotiv(f){const Z=XF_TBL[f.c],L=(SOC_ST||{})[f.c];if(!Z||!L||L.length<Z[0]-2)return [];const [N,G,top,rel]=Z,out=[];
  const row=t=>L.find(r=>r[0]===t),pts=i=>(L.find(r=>r[1]===i)||[])[8];
  for(const t of [f.h,f.a]){const r=row(t);if(!r)continue;const [,rk,pl,,,,,,p]=r,left=G-pl,lead=pts(1),safe=pts(N-rel),cut=pts(top);if(pl<6)continue;
    const nm=xfE(socTm(t));let h=null,tx="",c="";
    const early=pl<G/3;   /* first third of the season: only say where they are, no "race" talk */
    if(rk===1){h=`${nm} top of the table`;tx=`${p} pts, ${p-pts(2)?`${p-pts(2)} clear of 2nd`:"level on points with 2nd"} with ${left} games left.`}
    else if(early){if(rk>N-rel){h=`${nm} in the relegation zone`;tx=`${socOrd(rk)} after ${pl} games, ${safe-p>0?`${safe-p} pt${safe-p===1?"":"s"} from safety`:"level on points with the team above the drop"}.`;c="dn"}}
    else if(lead-p<=6&&left>=1){h=`${nm} in the title race`;tx=`${lead-p} pts behind the leaders with ${left} to play.`;c="up"}
    else if(rk>N-rel){h=`${nm} in the relegation zone`;tx=`${socOrd(rk)}, ${safe-p>0?`${safe-p} pt${safe-p===1?"":"s"} from safety`:"level on points with safety"} with ${left} left — every point matters.`;c="dn"}
    else if(p-pts(N-rel+1)<=3){h=`${nm} close to the drop zone`;tx=`Only ${p-pts(N-rel+1)} pt${p-pts(N-rel+1)===1?"":"s"} above the relegation places.`;c="dn"}
    else if(rk>top&&cut-p<=3){h=`${nm} chasing a top-${top} place`;tx=`${cut-p} pt${cut-p===1?"":"s"} off ${socOrd(top)} (${f.c==="champ"?"automatic promotion":"Champions League places"}).`;c="up"}
    else if(rk<=top&&p-pts(top+1)<=3){h=`${nm} defending a top-${top} place`;tx=`${socOrd(rk)}, ${p-pts(top+1)} pt${p-pts(top+1)===1?"":"s"} ahead of ${socOrd(top+1)}.`;c="up"}
    else if(left<=6&&lead-p>3*left&&p-pts(N-rel+1)>3*left){h=`${nm} have little to play for`;tx=`Can't catch the top and can't go down with ${left} left — end-of-season games like this can be flat.`;c="y"}
    if(h)out.push({ic:"🎯",c,h,t:tx})}return out}
/* derbies: well-known local rivalries (by team name as ESPN spells it) */
const XF_DERBY=[["Arsenal","Tottenham Hotspur","North London derby"],["Liverpool","Everton","Merseyside derby"],["Manchester United","Manchester City","Manchester derby"],["Manchester United","Liverpool","North West derby"],["Newcastle United","Sunderland","Tyne–Wear derby"],["Aston Villa","Birmingham City","Second City derby"],["West Ham United","Millwall","Dockers derby"],["Chelsea","Tottenham Hotspur","London derby"],["Arsenal","Chelsea","London derby"],["Leeds United","Manchester United","Roses rivalry"],["Sheffield United","Sheffield Wednesday","Steel City derby"],["Nottingham Forest","Derby County","East Midlands derby"],["Brighton & Hove Albion","Crystal Palace","M23 derby"],["Southampton","Portsmouth","South Coast derby"],
  ["Real Madrid","Barcelona","El Clásico"],["Real Madrid","Atlético Madrid","Madrid derby"],["Sevilla","Real Betis","Seville derby"],["Barcelona","Espanyol","Barcelona derby"],["Athletic Club","Real Sociedad","Basque derby"],["Valencia","Levante","Valencia derby"],
  ["Internazionale","AC Milan","Derby della Madonnina"],["AS Roma","Lazio","Derby della Capitale"],["Juventus","Torino","Derby della Mole"],["Juventus","Internazionale","Derby d'Italia"],["Genoa","Sampdoria","Derby della Lanterna"],["Napoli","AS Roma","Derby del Sole"],
  ["Borussia Dortmund","Schalke 04","Revierderby"],["Bayern Munich","Borussia Dortmund","Der Klassiker"],["Hamburg SV","St. Pauli","Hamburg derby"],["FC Cologne","Borussia Mönchengladbach","Rhine derby"],["Werder Bremen","Hamburg SV","Nordderby"],
  ["Paris Saint-Germain","Marseille","Le Classique"],["Lyon","Saint-Étienne","Derby du Rhône"],["Nice","AS Monaco","Côte d'Azur derby"],["Lens","Lille","Derby du Nord"],
  ["Ajax Amsterdam","Feyenoord Rotterdam","De Klassieker"],["Ajax Amsterdam","PSV Eindhoven","Ajax–PSV"],["Feyenoord Rotterdam","Sparta Rotterdam","Rotterdam derby"],
  ["Benfica","Sporting CP","Lisbon derby"],["FC Porto","Benfica","O Clássico"],["FC Porto","Sporting CP","Porto–Sporting"],
  ["LA Galaxy","LAFC","El Tráfico"],["Seattle Sounders FC","Portland Timbers","Cascadia derby"],["New York City FC","Red Bull New York","Hudson River derby"],["Toronto FC","CF Montréal","Canadian Classique"],["Orlando City SC","Inter Miami CF","Florida derby"],["Columbus Crew","FC Cincinnati","Hell is Real derby"],["Austin FC","Houston Dynamo FC","Texas derby"]];
function xfNm(t){const T=(SOC_TM||{})[t];return T?String(T[0]):""}
function xfDerby(f){const a=xfNm(f.h),b=xfNm(f.a),eq=(x,y)=>x.toLowerCase()===y.toLowerCase();const D=XF_DERBY.find(([x,y])=>(eq(x,a)&&eq(y,b))||(eq(x,b)&&eq(y,a)));if(!D)return null;
  /* cards in their past meetings vs each team's own average */
  const ids=(window.SOC_H2H||{})[f.id]||[],R=ids.map(id=>typeof socMatchRow!=="undefined"&&socMatchRow(id)).filter(r=>r&&r[7]&&r[8]&&r[7][4]!=null);
  const cd=R.length?R.reduce((s,r)=>s+(r[7][4]||0)+(r[7][5]||0)+(r[8][4]||0)+(r[8][5]||0),0)/R.length:null;
  return {ic:"🔥",c:"y",h:`Derby: ${xfE(D[2])}`,t:`Rivalry games run hotter — more fouls and cards, and form counts for less.${cd!=null?` Their last ${R.length} meeting${R.length>1?"s":""} averaged <b>${cd.toFixed(1)}</b> cards.`:""}`}}
/* manager news (ESPN, tools/soccerfetch.py -> SOC_MGR: last 60 days of sackings / appointments / suspensions per team) */
function xfMgr(f){const M=(typeof SOC_MGR!=="undefined"&&SOC_MGR)||{},out=[];
  for(const t of [f.h,f.a])for(const x of (M[t]||[]).slice(0,2)){const d=Math.round((Date.now()-Date.parse(x.at))/864e5);if(!(d>=0)||d>60)continue;
    out.push({ic:"🧑‍💼",c:"y",h:`${xfE(socTm(t))}: ${({sacked:"manager change",suspended:"manager suspended",appointed:"new manager",interim:"interim manager",pressure:"manager under pressure"})[x.k]||"manager news"}`,t:`<a href="${xfE(x.url)}" target="_blank" rel="noopener">${xfE(x.h)}</a> · ${d===0?"today":d+" day"+(d>1?"s":"")+" ago"}${["sacked","appointed","interim"].includes(x.k)&&d<=30?". Teams often get a short-term lift right after a new manager comes in.":""}`})}
  return out}

/* ===================== more factors (Nov 11) ===================== */
/* ---- NBA: revenge games (NBA_FORMER = teams he played for last season / earlier this season) ---- */
function xfRevenge(g){const F=typeof NBA_FORMER!=="undefined"?NBA_FORMER:{},out=[];
  for(const [t,o] of [[g.a,g.h],[g.h,g.a]])for(const [n,p] of Object.entries(NBA_LOGS)){if(p.tm!==t||!F[n])continue;const f=F[n].find(x=>x[0]===o);if(!f)continue;
    const mn=p.g.length?p.g.reduce((s,x)=>s+x[4],0)/p.g.length:0;if(mn<15)continue;
    const all=typeof nbaAllG!=="undefined"?nbaAllG(n):[],vs=all.filter(z=>z.x[2]===o&&z.x[1]>f[2]),avg=a=>a.length?a.reduce((s,z)=>s+z.x[5],0)/a.length:null,sa=avg(p.g.map(x=>({x})));
    out.push({ic:"🔁",c:"y",h:`Revenge game: ${xfE(n)} vs the ${xfE(nbaShort(o))}`,t:`Played ${f[1]} games for them (last ${xfE(nbaDayS(f[2]))}).${vs.length?` Since leaving: ${avg(vs).toFixed(1)} pts in ${vs.length} game${vs.length>1?"s":""} against them (season ${sa.toFixed(1)}).`:" First time facing them since leaving."}`})}
  return out.slice(0,3)}
/* ---- NBA: back from injury / could return (minutes are often limited in the first games back) ---- */
function xfReturn(g){const out=[];
  for(const t of [g.a,g.h]){const TG=NBA_RES.filter(r=>r[2]===t||r[3]===t).map(r=>r[0]);if(TG.length<6)continue;
    for(const [n,p] of Object.entries(NBA_LOGS)){if(p.tm!==t||p.g.length<4)continue;const mn=p.g.reduce((s,x)=>s+x[4],0)/p.g.length;if(mn<20)continue;
      const pl=new Set(p.g.map(x=>x[0])),seq=TG.map(id=>pl.has(id));let k=seq.length-1,back=0;while(k>=0&&seq[k]){back++;k--}let miss=0;while(k>=0&&!seq[k]){miss++;k--}
      const inj=(typeof nbaInjOf!=="undefined"&&nbaInjOf(n))||null,st=inj?String(inj[2]||""):"";
      if(back>=1&&back<=3&&miss>=3){const last=p.g.slice(-back).map(x=>x[4]);
        out.push({ic:"⏱️",c:"y",h:`${xfE(n)} back from a ${miss}-game absence`,t:`Minutes in ${back===1?"his first game":"his "+back+" games"} back: <b>${last.join(", ")}</b> (season ${mn.toFixed(0)}). Teams often ease players in — watch his minutes-based props.`})}
      else if(back===0){let m2=0;for(let i=seq.length-1;i>=0&&!seq[i];i--)m2++;
        if(m2>=3&&/quest|probable|day|game-time|gtd/i.test(st))out.push({ic:"⏱️",c:"y",h:`${xfE(n)} could return tonight`,t:`Missed the last ${m2} games (${xfE(st)}). Players are often on a minutes limit in their first game back.`})}}}
  return out.slice(0,4)}
function xfNba(g){try{const R=(typeof NBA_REST!=="undefined"&&NBA_REST)||{};return xfCard([xfBlow(g),...xfBump(g),xfAlt("nba",g.a,g.h,{b2b:!g.fut&&R[g.a]&&R[g.a].rest===0,name:nbaShort(g.a)}),...xfReturn(g),...xfRevenge(g)])}catch(e){return ""}}

/* ---- NFL: backup QB, divisional rematch, pass rush vs offensive line ---- */
function xfQB(t){try{const Q=(typeof QB1_STATUS!=="undefined"&&QB1_STATUS[t])||null;
  const qb=Q&&Q.qb||(()=>{const m={};for(const l of S.playerLogs)if(l.season===CUR&&l.team===t&&l.pos==="QB")m[l.player]=(m[l.player]||0)+(l.passAtt||0);return (Object.entries(m).sort((a,b)=>b[1]-a[1])[0]||[])[0]})();if(!qb)return null;
  const st=woHurt("nfl",qb);if(!/out|doubt|ir|reserve|quest/i.test(st))return null;const sure=/out|doubt|ir|reserve/i.test(st);
  const G=woGames("nfl",t),P=woPlayed("nfl",qb),W=woSum(G.filter(x=>P.has(x.k))),O=woSum(G.filter(x=>!P.has(x.k)));
  const sub=Q&&Q.sub||(()=>{const m={};for(const l of S.playerLogs)if(l.season===CUR&&l.team===t&&l.player!==qb&&l.pos==="QB")m[l.player]=(m[l.player]||0)+(l.passAtt||0)+1;return (Object.entries(m).sort((a,b)=>b[1]-a[1])[0]||[])[0]})();
  return {ic:"🧢",c:"dn",h:`${xfE(short(t))}: ${sure?"backup QB likely":"QB questionable"} — ${xfE(qb)} (${xfE(st)})`,
    t:`${sub?`Next up: <b>${xfE(sub)}</b>. `:""}This season with ${xfE(qb.split(" ").pop())}: ${W?`${W.w}-${W.l}, ${W.pf.toFixed(1)} pts a game`:"–"}${O?` · without him: <b>${O.w}-${O.l}, ${O.pf.toFixed(1)} pts</b>`:" · no games without him yet"}. A QB change moves every receiver's props too.`}}catch(e){return null}}
function xfDiv(g){try{const A=TEAMS[g.away],H=TEAMS[g.home];if(!A||!H||A[1]!==H[1]||A[2]!==H[2])return null;
  const first=(RESULTS||[]).find(r=>(r[1]===g.away&&r[3]===g.home)||(r[1]===g.home&&r[3]===g.away));
  const R=(typeof nflH2hRows!=="undefined"?nflH2hRows(g):[]).map(([d,a,as,h,hs])=>({d,a,as,h,hs})),sea=d=>{const y=+d.slice(0,4),m=+d.slice(5,7);return m<=2?y-1:y},by={};
  for(const m of R)(by[sea(m.d)]=by[sea(m.d)]||[]).push(m);let n=0,flip=0,t1=0,t2=0;
  for(const L of Object.values(by)){if(L.length<2)continue;const [x,y]=L.sort((p,q)=>p.d<q.d?-1:1);const lose1=x.as>x.hs?x.h:x.a,win2=y.as>y.hs?y.a:y.hs>y.as?y.h:null;n++;if(win2===lose1)flip++;t1+=x.as+x.hs;t2+=y.as+y.hs}
  return {ic:"🤝",h:`Division game${first?" — the rematch":""}`,t:`${first?`First meeting this season (Week ${first[0]}): ${xfE(short(first[1]))} ${first[2]}, ${xfE(short(first[3]))} ${first[4]}. `:""}${n?`In the ${n} seasons since 2002 they met twice, the loser of the first game won the rematch ${flip} time${flip===1?"":"s"}; rematches averaged ${(t2/n).toFixed(1)} points vs ${(t1/n).toFixed(1)} in the first meetings.`:"Teams that know each other well — divisional games tend to be tighter."}`}}catch(e){return null}}
function xfRush(g){const R=typeof NFL_REFS!=="undefined"&&NFL_REFS&&NFL_REFS.sk;if(!R)return [];const out=[],T=Object.keys(R);
  const rate=(t,k)=>{const x=R[t];return x&&x[k+"db"]?x[k+"sk"]/x[k+"db"]*100:null},rk=(t,k,hi)=>{const L=T.map(x=>[x,rate(x,k)]).filter(x=>x[1]!=null).sort((a,b)=>hi?b[1]-a[1]:a[1]-b[1]);return L.findIndex(x=>x[0]===t)+1};
  for(const [o,d] of [[g.away,g.home],[g.home,g.away]]){const ol=rate(o,"o"),pr=rate(d,"d");if(ol==null||pr==null)continue;const r1=rk(o,"o",false),r2=rk(d,"d",true);
    const bad=r1>=22&&r2<=10,good=r1<=10&&r2>=22;
    out.push({ic:"💥",c:bad?"dn":good?"up":"",h:`${xfE(short(o))} O-line vs ${xfE(short(d))} pass rush`,t:`${xfE(short(o))} allow a sack on <b>${ol.toFixed(1)}%</b> of dropbacks (${nbaOrd?nbaOrd(r1):r1} fewest); ${xfE(short(d))} get one on <b>${pr.toFixed(1)}%</b> (${nbaOrd?nbaOrd(r2):r2} most).${bad?" A mismatch — more sacks and hurried throws for the QB.":good?" His protection should hold up.":""}`})}
  return out}
function xfNfl(g){try{return xfCard([...xfRest(g),xfQB(g.away),xfQB(g.home),xfScript(g),xfDiv(g),...xfRush(g),xfOline(g.away),xfOline(g.home),xfRef(g),xfAlt("nfl",g.away,g.home,{name:short(g.away)})])}catch(e){return ""}}

/* ---- Soccer ---- */
function xfSeasonStart(c){return c==="mls"?"2026-01-01":"2026-07-01"}
function xfResLg(c){const s=xfSeasonStart(c);return (typeof SOC_RES!=="undefined"?SOC_RES:[]).filter(r=>r[2]===c&&r[1]>=s)}
/* home team at home, away team on the road (this league season) */
function xfHomeAway(f){const R=xfResLg(f.c);if(R.length<20)return null;
  const rec=(t,home)=>{const L=R.filter(r=>home?r[3]===t:r[4]===t);let w=0,d=0,l=0,gf=0,ga=0;for(const r of L){const a=home?r[5]:r[6],b=home?r[6]:r[5];gf+=a;ga+=b;a>b?w++:a<b?l++:d++}return {n:L.length,w,d,l,gf,ga}};
  const H=rec(f.h,1),A=rec(f.a,0);if(H.n<3||A.n<3)return null;const p=x=>(x.w*3+x.d)/x.n;
  return {ic:"🏠",c:p(H)-p(A)>=1?"up":"",h:`Home vs away form`,t:`${xfE(socTm(f.h))} at home: <b>${H.w}W ${H.d}D ${H.l}L</b>, goals ${H.gf}–${H.ga}. ${xfE(socTm(f.a))} away: <b>${A.w}W ${A.d}D ${A.l}L</b>, goals ${A.gf}–${A.ga}.`}}
/* finishing luck: goals per shot on target vs the league (for and against) */
function xfFinish(f){const R=xfResLg(f.c);if(R.length<30)return [];let G=0,S=0;for(const r of R){if(!r[7]||!r[8])continue;G+=r[5]+r[6];S+=(r[7][1]||0)+(r[8][1]||0)}if(!S)return [];const lg=G/S,out=[];
  for(const t of [f.h,f.a]){let g=0,s=0,ga=0,sa=0,n=0;for(const r of R){if(!r[7]||!r[8])continue;const h=r[3]===t;if(!h&&r[4]!==t)continue;n++;g+=h?r[5]:r[6];s+=(h?r[7]:r[8])[1]||0;ga+=h?r[6]:r[5];sa+=(h?r[8]:r[7])[1]||0}
    if(n<6||s<15||sa<15)continue;const cv=g/s/lg,cd=ga/sa/lg;
    if(cv>=1.3)out.push({ic:"🍀",c:"y",h:`${xfE(socTm(t))} finishing hot`,t:`Scoring ${(g/s*100).toFixed(0)}% of shots on target (league ${(lg*100).toFixed(0)}%) — ${g} goals from ${s}. Runs like this usually cool off.`});
    else if(cv<=.72)out.push({ic:"🍀",c:"y",h:`${xfE(socTm(t))} finishing cold`,t:`Only ${(g/s*100).toFixed(0)}% of shots on target go in (league ${(lg*100).toFixed(0)}%) — ${g} goals from ${s}. Due a bounce back.`});
    if(cd>=1.3)out.push({ic:"🧤",c:"y",h:`${xfE(socTm(t))} conceding from little`,t:`Opponents score ${(ga/sa*100).toFixed(0)}% of their shots on target (league ${(lg*100).toFixed(0)}%) — keeper having a rough run, which tends to even out.`});
    else if(cd<=.7)out.push({ic:"🧤",c:"y",h:`${xfE(socTm(t))} keeper on a hot streak`,t:`Opponents score only ${(ga/sa*100).toFixed(0)}% of shots on target (league ${(lg*100).toFixed(0)}%) — hard to keep up.`})}
  return out}
/* set pieces: corners won vs corners the opponent concedes (league season, ranks) */
function xfSetP(f){const R=xfResLg(f.c);if(R.length<30)return null;const T={};
  for(const r of R){if(!r[7]||!r[8])continue;for(const [t,me,op] of [[r[3],r[7],r[8]],[r[4],r[8],r[7]]]){const x=T[t]||(T[t]={n:0,w:0,c:0});x.n++;x.w+=me[2]||0;x.c+=op[2]||0}}
  const per=(t,k)=>T[t]&&T[t].n>=5?T[t][k]/T[t].n:null,rank=(t,k,hi)=>{const L=Object.keys(T).filter(x=>T[x].n>=5).sort((a,b)=>hi?per(b,k)-per(a,k):per(a,k)-per(b,k));return L.indexOf(t)+1};
  const rows=[];for(const [t,o] of [[f.h,f.a],[f.a,f.h]]){const w=per(t,"w"),c=per(o,"c");if(w==null||c==null)continue;const r1=rank(t,"w",true),r2=rank(o,"c",true);
    rows.push(`${xfE(socTm(t))} win <b>${w.toFixed(1)}</b> corners a game (${socOrd(r1)}); ${xfE(socTm(o))} concede ${c.toFixed(1)} (${socOrd(r2)} most)`)}
  return rows.length?{ic:"🚩",h:"Set pieces (corners)",t:rows.join(". ")+". More corners = more set-piece chances — and helps corner overs."}:null}
/* first match after the international break: each team's record this season in matches after 11+ days off */
function xfBreak(f){const S=xfSched(),T=Date.parse(f.t),out=[];let any=false;
  for(const t of [f.h,f.a]){const L=S[t]||[],prev=[...L].reverse().find(x=>x.ts<T-3*36e5);if(!prev||(T-prev.ts)/864e5<11)continue;any=true;
    const R=[...(window.SOC_OLD||[]),...(typeof SOC_RES!=="undefined"?SOC_RES:[])],byId={};for(const r of R)byId[r[0]]=r;
    let w=0,d=0,l=0;const st=Date.parse(xfSeasonStart(f.c));for(let i=1;i<L.length;i++){const x=L[i];if(x.ts<st||x.ts>=T-3*36e5)continue;if((x.ts-L[i-1].ts)/864e5<11)continue;const r=byId[x.id];if(!r)continue;const me=x.home?r[5]:r[6],op=x.home?r[6]:r[5];me>op?w++:me<op?l++:d++}
    out.push(`${xfE(socTm(t))}: ${Math.round((T-prev.ts)/864e5)} days since their last match${w+d+l?` · after breaks this season: <b>${w}W ${d}D ${l}L</b>`:""}`)}
  return any?{ic:"✈️",c:"y",h:"First match after the international break",t:out.join(". ")+". Players back from national-team trips (especially long-haul) are often rested or rusty."}:null}
/* newly promoted: in this league now, not in it last season (our data) */
function xfPromoted(f){if(XF_EURO.includes(f.c)||f.c==="mls")return [];const s=xfSeasonStart(f.c),y=+s.slice(0,4),ps=`${y-1}-07-01`;
  const R=[...(window.SOC_OLD||[]),...(typeof SOC_RES!=="undefined"?SOC_RES:[])].filter(r=>r[2]===f.c&&r[1]>=ps&&r[1]<s);if(R.length<100)return [];const was=new Set();for(const r of R){was.add(r[3]);was.add(r[4])}
  const out=[];for(const t of [f.h,f.a])if(!was.has(t)){const rk=typeof socRank!=="undefined"?socRank(f.c,t):null;out.push({ic:"🆕",h:`${xfE(socTm(t))} newly promoted`,t:`First season up${rk?` — ${socOrd(rk)} so far`:""}. Promoted teams usually lean on their home form and struggle away against established sides.`})}
  return out}
/* suspensions: sent off last time out, or one yellow from a ban (league rule: every 5th yellow in these leagues) */
const XF_YB={epl:5,laliga:5,seriea:5,bund:5,ered:5,port:5,champ:5};
function xfSusp(f){if(typeof SOC_P==="undefined")return [];try{if(typeof socPKeys!=="undefined"&&socPKeys([f.h,f.a]).some(k=>!SOCPL.have[k]))return {wait:1}}catch(e){}const s=xfSeasonStart(f.c),R=typeof SOC_RES!=="undefined"?SOC_RES:[],M={};for(const r of R)M[r[0]]=r;
  const out=[],nY=XF_YB[f.c],lastLg=t=>{const L=R.filter(r=>r[2]===f.c&&(r[3]===t||r[4]===t)&&r[1]>=s&&Date.parse(r[1]+"Z")<Date.parse(f.t)).sort((a,b)=>a[1]<b[1]?1:-1);return L[0]};
  for(const t of [f.h,f.a]){const last=lastLg(t);let n=0;
    for(const [pid,p] of Object.entries(SOC_P)){if(!p||String(p[1])!==String(t))continue;const G=(p[3]||[]).filter(x=>{const r=M[x[0]];return r&&r[2]===f.c&&r[1]>=s});
      const y=G.reduce((a,x)=>a+(x[9]||0),0),red=last&&G.find(x=>x[0]===last[0]&&x[10]);
      if(red){out.push({ic:"🟥",c:"dn",h:`${xfE(p[0])} (${xfE(socTm(t))}) sent off last match`,t:`A red card usually means at least a one-match ban — check the lineup.`});n++}
      else if(nY&&y>0&&y%nY===nY-1&&G.length>=3){out.push({ic:"🟨",c:"y",h:`${xfE(p[0])} (${xfE(socTm(t))}) one yellow from a ban`,t:`${y} yellow cards in the league this season — a ${y+1}th means a suspension. Players in this spot sometimes ease off tackles.`});n++}
      if(n>=3)break}}
  return out}
const XF_W={};function xfSoc(f){XF_W[f.id]=XF_W[f.id]||0;try{const sp=xfSusp(f);if(sp&&sp.wait&&typeof socPEnsure!=="undefined"&&!(XF_W[f.id]++))socPEnsure(()=>{const el=document.getElementById("xfSoc");if(el)el.outerHTML=xfSoc(f)},[f.h,f.a]);
  const rows=[...xfMgr(f),...(Array.isArray(sp)?sp:[]),xfBreak(f),xfDerby(f),...xfMotiv(f),...xfCongest(f),xfHomeAway(f),...xfFinish(f),xfSetP(f),...xfPromoted(f)];
  const c=xfCard(rows,"Situations that can swing this match beyond the numbers.");return c?c.replace('class="card xfcard"','class="card xfcard" id="xfSoc"'):""}catch(e){return ""}}

/* ---- NHL: line combinations + power-play units (Daily Faceoff, NHL_LINES) ---- */
const XF_GL=g=>/^f\d/.test(g)?"Line "+g.slice(1):/^d\d/.test(g)?"D pair "+g.slice(1):/^pp\d/.test(g)?"PP"+g.slice(2):/^pk\d/.test(g)?"PK"+g.slice(2):/^g/.test(g)?"Goalies":g;
function xfLn(t){const L=typeof NHL_LINES!=="undefined"&&NHL_LINES&&NHL_LINES[t];return L&&L.cur?L:null}
/* "L1 · PP1" for a player */
function xfLineOf(nm){try{const w=typeof nhWho!=="undefined"&&nhWho(nm),L=w&&xfLn(w.tm);if(!L)return "";const n=String(nm).toLowerCase(),tags=[];
  for(const [g,P] of Object.entries(L.cur.g))if(P.some(p=>String(p[0]).toLowerCase()===n)){if(/^f\d/.test(g))tags.push("L"+g.slice(1));else if(/^d\d/.test(g))tags.push("D"+g.slice(1));else if(/^pp\d/.test(g))tags.push("PP"+g.slice(2))}
  return tags.join(" · ")}catch(e){return ""}}
function xfLineChip(nm){const t=xfLineOf(nm);return t?` <span class="pll${/PP1|L1/.test(t)?" o":""}" title="Daily Faceoff line combinations">${t}</span>`:""}
/* who moved up / down since the last version (changes in the last 3 days) */
function xfLineMoves(t){const L=xfLn(t);if(!L||!L.prev||!L.chg||(Date.now()-Date.parse(L.chg))/864e5>3)return [];
  const rank=(G,n)=>{let r={};for(const [g,P] of Object.entries(G))for(const p of P)if(p[0]===n){if(/^f\d/.test(g))r.f=+g.slice(1);if(/^pp\d/.test(g))r.pp=+g.slice(2)}return r};
  const names=new Set([...Object.values(L.cur.g).flat(),...Object.values(L.prev.g).flat()].map(p=>p[0])),out=[];
  for(const n of names){const a=rank(L.prev.g,n),b=rank(L.cur.g,n);
    if(b.pp===1&&a.pp!==1)out.push(`<b>${xfE(n)}</b> up to PP1`);else if(a.pp===1&&b.pp!==1)out.push(`${xfE(n)} off PP1`);
    if(b.f===1&&a.f&&a.f>1)out.push(`<b>${xfE(n)}</b> up to the top line`);else if(a.f===1&&b.f&&b.f>1)out.push(`${xfE(n)} down to line ${b.f}`)}
  return out.length?[{ic:"🔀",c:"y",h:`${xfE(nhTm(t))} line changes`,t:out.slice(0,6).join(" · ")+". A move onto the top line or first power-play unit is the biggest boost for points and shots props."}]:[]}
function xfLinesCard(g){const T=[g.a,g.h].filter(xfLn);if(!T.length)return "";const last=n=>xfE(String(n).split(" ").slice(-1)[0]);
  const team=t=>{const L=xfLn(t).cur,G=L.g,ks=Object.keys(G),row=g0=>`<div class="lnr"><span class="small">${XF_GL(g0)}</span><span>${G[g0].map(p=>`${last(p[0])}${p[2]?" <span title='game-time decision'>❓</span>":""}`).join(" – ")}</span></div>`;
    const f=ks.filter(k=>/^f\d/.test(k)).sort(),d=ks.filter(k=>/^d\d/.test(k)).sort(),pp=ks.filter(k=>/^pp\d/.test(k)).sort();
    return `<div class="lnt"><h3 class="nhh3">${nhBadge(t)} ${xfE(nhTm(t))}</h3>${f.map(row).join("")}${d.map(row).join("")}${pp.length?`<div class="small lnsub">Power play</div>${pp.map(row).join("")}`:""}<div class="small" style="margin-top:4px">Updated ${typeof newsAge!=="undefined"?newsAge(L.at):xfE(L.at)} · ${xfE(L.src)}</div></div>`};
  return `<div class="card xacard lncard" style="margin-top:12px"><h2>🧩 Lines &amp; power play</h2><div class="xasub">Expected forward lines, defence pairs and power-play units (Daily Faceoff). ❓ = game-time decision.</div><div class="grid g2">${T.map(team).join("")}</div></div>`}
function xfNhl(g){try{return xfCard([xfAlt("nhl",g.a,g.h,{b2b:typeof nhB2B!=="undefined"&&nhB2B(g.a,g.d),name:nhTm(g.a)}),...xfLineMoves(g.a),...xfLineMoves(g.h)])}catch(e){return ""}}

/* ---- NBA: blowout risk + usage bump (the same numbers the prop chances now use) ---- */
function xfBlow(g){try{const L=NBA_LINES[g.a+"@"+g.h];if(!L||Math.abs(L.sp)<9)return null;const spA=Math.abs(L.sp),pB=nbaBlowP(spA);if(pB==null)return null;const fav=L.sp<=0?g.h:g.a;
  const st=Object.entries(NBA_LOGS).filter(([,p])=>(p.tm===g.a||p.tm===g.h)&&nbaAvg(p,"min")>=28).map(([n,p])=>[n,nbaBlowMin(p)]).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]).slice(0,4);
  return {ic:"📉",c:"y",h:`Blowout risk: ${xfE(nbaShort(fav))} favored by ${spA}`,t:`${Math.round(pB*100)}% of this season's games with a similar spread were decided by 15+ points.${st.length?` Minutes in blowouts vs other games: ${st.map(([n,r])=>`${xfE(nbaLastNm(n))} ${Math.round(r*100)}%`).join(", ")}.`:""} Our chances on starters' overs are lowered to match.`}}catch(e){return null}}
function xfBump(g){const out=[];try{for(const t of [g.a,g.h]){const so=nbaStarsOut(t);if(!so.length)continue;const S=so.map(n=>new Set((NBA_LOGS[n]||{g:[]}).g.map(x=>x[0]))),TG=new Set(NBA_RES.filter(r=>r[2]===t||r[3]===t).map(r=>r[0]));
  const R=Object.entries(NBA_LOGS).filter(([n,p])=>p.tm===t&&!so.includes(n)).map(([n,p])=>{const wo=p.g.filter(x=>TG.has(x[0])&&S.every(z=>!z.has(x[0]))),w=p.g.filter(x=>!wo.includes(x));if(wo.length<3||w.length<3)return null;
    const a=(z,i)=>z.reduce((s,x)=>s+(x[i]||0),0)/z.length;return {n,wo:wo.length,dp:a(wo,5)-a(w,5),df:a(wo,11)-a(w,11)}}).filter(x=>x&&x.dp>=2).sort((a,b)=>b.dp-a.dp).slice(0,3);
  if(R.length)out.push({ic:"📈",c:"up",h:`Usage bump: ${xfE(nbaShort(t))} without ${xfE(so.map(nbaLastNm).join(", "))}`,t:R.map(x=>`<b>${xfE(x.n)}</b> +${x.dp.toFixed(1)} pts, ${x.df>=0?"+":""}${x.df.toFixed(1)} shots a game (${x.wo} games without)`).join(" · ")+". Their prop chances use these games."})}}catch(e){}return out}

/* ---- NFL: rest and travel (kickoff dates from ESPN via NFL_REFS.kd; stadium time zones) ---- */
const XF_TZ={ATL:-5,BAL:-5,BUF:-5,CAR:-5,CIN:-5,CLE:-5,DET:-5,IND:-5,JAX:-5,MIA:-5,NE:-5,NYG:-5,NYJ:-5,PHI:-5,PIT:-5,TB:-5,WAS:-5,CHI:-6,DAL:-6,GB:-6,HOU:-6,KC:-6,MIN:-6,NO:-6,TEN:-6,DEN:-7,ARI:-7,LAR:-8,LAC:-8,LV:-8,SF:-8,SEA:-8};
function xfRest(g){const K=typeof NFL_REFS!=="undefined"&&NFL_REFS&&NFL_REFS.kd;if(!K)return [];const wk=typeof PLAYS_WEEK!=="undefined"?PLAYS_WEEK:null,out=[],info={};
  for(const t of [g.away,g.home]){const D=K[t]||{},now=D[wk]?Date.parse(D[wk]):null;if(!now)continue;const prevW=Object.keys(D).map(Number).filter(w=>w<wk&&D[w]).sort((a,b)=>b-a)[0];if(prevW==null)continue;
    const days=Math.round((now-Date.parse(D[prevW]))/864e5);info[t]={days,bye:prevW<wk-1};}
  const lbl=t=>{const x=info[t];return x?(x.bye?`off a bye (${x.days} days)`:x.days<=5?`<b>short week</b> (${x.days} days)`:x.days>=9?`extra rest (${x.days} days)`:`${x.days} days`):"–"};
  const A=info[g.away],H=info[g.home];
  if(A&&H&&(A.bye||H.bye||A.days<=5||H.days<=5||A.days>=9||H.days>=9||Math.abs(A.days-H.days)>=3))
    out.push({ic:"🛌",c:Math.abs(A.days-H.days)>=3?"y":"",h:"Rest",t:`${xfE(short(g.away))}: ${lbl(g.away)} · ${xfE(short(g.home))}: ${lbl(g.home)}.${Math.abs(A.days-H.days)>=3?` A ${Math.abs(A.days-H.days)}-day rest edge for ${xfE(short(A.days>H.days?g.away:g.home))}.`:""}`});
  /* travel: away team's home time zone vs the game's (international games noted) */
  const W=typeof WX!=="undefined"&&WX[g.id],intl=W&&W.city&&!/,\s*[A-Z]{2}$/.test(W.city)&&!W.dome;
  const ta=XF_TZ[g.away],th=XF_TZ[g.home],tm=String(g.when||"").match(/(\d+):(\d+)\s*(AM|PM)/i),etH=tm?((+tm[1]%12)+(tm[3].toUpperCase()==="PM"?12:0)):null;
  if(intl)out.push({ic:"✈️",c:"y",h:"International game",t:`Played in ${xfE(W.city)} — both teams travel overseas; body clocks and routines are off for everyone.`});
  else if(ta!=null&&th!=null&&ta!==th){const dz=th-ta;if(dz>=2&&etH!=null&&etH<=13)out.push({ic:"🕐",c:"y",h:`Early body clock for ${xfE(short(g.away))}`,t:`A ${tm[0]} ET kickoff feels like ${((etH+ta+5+24)%12)||12}:${tm[2]} ${etH+ta+5>=12?"PM":"AM"} back home — West-coast teams playing early in the East is a classic tough spot.`});
    else if(Math.abs(dz)>=2)out.push({ic:"✈️",h:`${xfE(short(g.away))} cross ${Math.abs(dz)} time zones`,t:`Long trip ${dz>0?"east":"west"} for the road team.`})}
  return out}
