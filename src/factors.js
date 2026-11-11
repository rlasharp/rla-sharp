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
function xfNba(g){const R=(typeof NBA_REST!=="undefined"&&NBA_REST)||{};return xfCard([xfAlt("nba",g.a,g.h,{b2b:R[g.a]&&R[g.a].rest===0,name:typeof nbaShort!=="undefined"?nbaShort(g.a):g.a})])}
function xfNhl(g){return xfCard([xfAlt("nhl",g.a,g.h,{b2b:typeof nhB2B!=="undefined"&&nhB2B(g.a,g.d),name:typeof nhTm!=="undefined"?nhTm(g.a):g.a})])}

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
function xfNfl(g){const W=typeof WX!=="undefined"&&WX[g.id];return xfCard([xfScript(g),xfOline(g.away),xfOline(g.home),xfRef(g),xfAlt("nfl",g.away,g.home,{name:short(g.away)})])}

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
    else if(early){if(rk>N-rel){h=`${nm} in the relegation zone`;tx=`${socOrd(rk)} after ${pl} games, ${safe-p} pt${safe-p===1?"":"s"} from safety.`;c="dn"}}
    else if(lead-p<=6&&left>=1){h=`${nm} in the title race`;tx=`${lead-p} pts behind the leaders with ${left} to play.`;c="up"}
    else if(rk>N-rel){h=`${nm} in the relegation zone`;tx=`${socOrd(rk)}, ${safe-p} pt${safe-p===1?"":"s"} from safety with ${left} left — every point matters.`;c="dn"}
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
    out.push({ic:"🧑‍💼",c:"y",h:`${xfE(socTm(t))}: ${x.k==="sacked"?"manager change":x.k==="suspended"?"manager suspended":"new manager"}`,t:`<a href="${xfE(x.url)}" target="_blank" rel="noopener">${xfE(x.h)}</a> · ${d===0?"today":d+" day"+(d>1?"s":"")+" ago"}${x.k!=="suspended"&&d<=30?". Teams often get a short-term lift right after a new manager comes in.":""}`})}
  return out}
function xfSoc(f){try{return xfCard([...xfMgr(f),xfDerby(f),...xfMotiv(f),...xfCongest(f)],"Situations that can swing this match beyond the numbers.")}catch(e){return ""}}
