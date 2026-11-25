/* ---------- Injuries: ESPN NFL injury report (espn.com/nfl/injuries + ESPN team injury pages) ----------
   Every player ESPN lists, incl. injured reserve / PUP / NFI. Regenerate with tools/injgen.py data/espn_inj.txt "<date>". */
const INJ_ASOF="Wed Nov 25";
const INJ={
  ARI:[["Jon Gaines II", "G", "Questionable", "Ankle", "Nov 29"], ["Carson Beck", "QB", "Questionable", "Back", "Nov 29"], ["Jeremiyah Love", "RB", "IR", "Ankle", "Dec 6"], ["Cody Simon", "LB", "Questionable", "Calf", "Nov 29"], ["Zachary Carter", "DT", "IR", "Knee", "Nov 29"]],
  ATL:[["Zachariah Branch", "WR", "Questionable", "Hamstring", "Nov 29"], ["Divine Deablo", "LB", "Questionable", "Forearm", "Nov 29"]],
  BAL:[["Nnamdi Madubuike", "DT", "Questionable", "Hamstring", "Nov 29"], ["Jaylinn Hawkins", "S", "Questionable", "Knee", "Nov 29"], ["Marlon Humphrey", "CB", "Questionable", "Coach's Decision", "Nov 29"]],
  BUF:[["Christian Benford", "CB", "Questionable", "Groin", "Nov 26"], ["Dalton Kincaid", "TE", "Questionable", "Thumb", "Nov 26"], ["T.J. Sanders", "DT", "Questionable", "Shoulder", "Nov 26"], ["Dorian Williams", "LB", "Questionable", "Calf", "Nov 26"], ["O'Cyrus Torrence", "G", "Questionable", "Ankle", "Nov 26"]],
  CAR:[["Brady Christensen", "G", "IR", "Hamstring", "Feb 15"], ["Bobby Okereke", "LB", "Questionable", "Foot", "Nov 30"], ["Jaycee Horn", "CB", "IR", "Quadriceps", "Dec 6"], ["Isaiah Simmons", "S", "IR", "Knee", "Dec 20"]],
  CHI:[["Elijah Hicks", "S", "Out", "Concussion", "Dec 6"], ["Roschon Johnson", "RB", "Questionable", "Ankle", "Nov 26"], ["Kyler Gordon", "CB", "Questionable", "Shoulder", "Nov 26"]],
  CIN:[["Dalton Risner", "G", "Questionable", "Knee", "Nov 29"], ["Kyle Dugger", "S", "Questionable", "Quadriceps", "Nov 29"], ["Jalen Davis", "CB", "IR", "Hamstring", "Nov 29"], ["Andrei Iosivas", "WR", "IR", "Thumb", "Nov 29"], ["Oren Burks", "LB", "IR", "Groin", "Dec 20"]],
  CLE:[["Denzel Boston", "WR", "Questionable", "Toe", "Nov 29"], ["Raheim Sanders", "RB", "IR", "Hip", "Nov 29"], ["Ronnie Hickman", "S", "Questionable", "Concussion", "Nov 29"], ["Michael Burton", "FB", "IR", "Calf", "Dec 20"]],
  DAL:[["Devin Moore", "CB", "IR", "Hip", "Nov 26"], ["Dee Winters", "LB", "Questionable", "Knee", "Nov 26"], ["Jonathan Mingo", "WR", "Questionable", "Ankle", "Nov 26"], ["P.J. Locke", "S", "Questionable", "Concussion", "Nov 26"], ["Jake Ferguson", "TE", "Doubtful", "Knee", "Nov 26"], ["Jaishawn Barham", "LB", "Questionable", "Hip", "Nov 26"], ["DaRon Bland", "CB", "IR", "Ankle", "Dec 27"], ["Tyler Booker", "G", "Out", "Ankle", "Dec 7"], ["Jalen Thompson", "S", "IR", "Hamstring", "Nov 26"]],
  DEN:[["Sai'vion Jones", "DE", "Questionable", "Hamstring", "Nov 27"], ["Jonah Elliss", "LB", "IR", "Ankle", "Dec 6"], ["Tyler Badie", "RB", "IR", "Thumb", "Nov 27"], ["Taylor Rapp", "S", "Questionable", "Quadriceps", "Nov 27"], ["J.K. Dobbins", "RB", "Out", "Personal", "Dec 6"]],
  DET:[["Chuck Clark", "S", "Questionable", "Hamstring", "Nov 26"], ["Skyler Gill-Howard", "DT", "Out", "Knee", "Feb 15"], ["Ennis Rakestraw Jr.", "CB", "Questionable", "Shoulder", "Nov 26"], ["DJ Wonnum", "LB", "Questionable", "Back", "Nov 26"], ["Cade Mays", "C", "IR", "Ankle", "Dec 20"]],
  GB:[["Kevin Zeitler", "G", "Questionable", "Triceps", "Nov 25"], ["Sean Rhyan", "G", "Questionable", "Ankle", "Nov 25"], ["Travis Glover", "OT", "Questionable", "Shoulder", "Nov 25"], ["Skyy Moore", "WR", "Questionable", "Ankle", "Nov 25"], ["Bo Melton", "WR", "Questionable", "Thigh", "Nov 25"], ["Zaire Franklin", "LB", "Questionable", "Shin", "Nov 25"], ["Micah Parsons", "DE", "Questionable", "Knee - ACL", "Nov 25"], ["Josh Jacobs", "RB", "Questionable", "Finger", "Nov 25"], ["Luke Musgrave", "TE", "Out", "Neck", "Feb 15"]],
  HOU:[["Wyatt Teller", "G", "Questionable", "Back", "Nov 29"], ["Brevin Jordan", "TE", "Questionable", "Foot", "Nov 29"], ["Marvin Harrison Jr.", "WR", "Questionable", "Hamstring", "Nov 29"], ["Danielle Hunter", "DE", "Questionable", "Hamstring", "Nov 29"], ["Woody Marks", "RB", "Questionable", "Concussion", "Nov 29"], ["Kayshon Boutte", "WR", "Questionable", "Hip", "Nov 29"], ["Keylan Rutledge", "G", "Questionable", "Undisclosed", "Nov 29"], ["Sheldon Rankins", "DT", "Questionable", "Ankle", "Nov 29"]],
  IND:[["Caden Curry", "LB", "IR", "Wrist", "Feb 15"], ["Bernhard Raimann", "OT", "Questionable", "Concussion", "Nov 29"], ["Jerry Tillery", "DT", "Questionable", "Calf", "Nov 29"], ["Jalen Travis", "OT", "Questionable", "Knee", "Nov 29"], ["Charvarius Ward", "CB", "Questionable", "Knee", "Nov 29"], ["Will Mallory", "TE", "Questionable", "Hamstring", "Nov 29"], ["Sauce Gardner", "CB", "Questionable", "Calf", "Nov 29"], ["Seth McGowan", "RB", "Out", "Hamstring", "Dec 13"], ["Alec Pierce", "WR", "IR", "Heel", "Jan 10"]],
  JAX:[["Bhayshul Tuten", "RB", "Questionable", "Ankle", "Nov 29"], ["Danny Striggow", "DE", "Questionable", "Concussion", "Nov 29"], ["Matt Dickerson", "DE", "Questionable", "Neck", "Nov 29"], ["Robert Hainsey", "C", "Questionable", "Knee", "Nov 29"], ["Walker Little", "OT", "Questionable", "Knee", "Nov 29"], ["Jarrian Jones", "CB", "Questionable", "Chest", "Nov 29"]],
  KC:[["Peter Woods", "DT", "Questionable", "Neck", "Nov 26"], ["Omarr Norman-Lott", "DT", "Out", "Knee", "Dec 3"], ["Jaylon Moore", "OT", "Out", "Ankle", "Dec 3"], ["Noah Gray", "TE", "Questionable", "Ribs", "Nov 26"], ["Kenneth Walker III", "RB", "Out", "Groin", "Dec 3"], ["Ben VanSumeren", "FB", "IR", "Knee", "Dec 27"], ["Jared Wiley", "TE", "IR", "Ankle", "Dec 21"]],
  LV:[["Tonka Hemingway", "DT", "Questionable", "Upper Body", "Nov 29"], ["Brock Bowers", "TE", "Questionable", "Ankle", "Nov 29"], ["JJ Pegues", "DT", "Questionable", "Forearm", "Nov 29"], ["Tim Keenan III", "DT", "Questionable", "Knee", "Nov 29"], ["Adam Butler", "DT", "Questionable", "Concussion", "Nov 29"], ["Dareke Young", "WR", "Questionable", "Neck", "Nov 29"]],
  LAC:[["Kendall Williamson", "S", "Questionable", "Calf", "Nov 29"], ["Tarheeb Still", "CB", "Questionable", "Ankle", "Nov 29"], ["Brenen Thompson", "WR", "Questionable", "Hamstring", "Nov 29"], ["Daiyan Henley", "LB", "Questionable", "Knee", "Nov 29"], ["Justin Herbert", "QB", "Questionable", "Concussion", "Nov 29"], ["Akheem Mesidor", "LB", "Questionable", "Ankle", "Nov 29"], ["Keaton Mitchell", "RB", "Questionable", "Knee", "Nov 29"], ["Rodney Shelley", "CB", "IR", "Ankle", "Dec 17"]],
  LAR:[["Justin Dedich", "G", "IR", "Hand", "Nov 25"], ["Kobie Turner", "DE", "IR", "Groin", "Nov 25"], ["Coleman Shelton", "C", "Out", "Hamstring", "Dec 3"], ["Terrance Ferguson", "TE", "IR", "Ankle", "Feb 15"], ["Davante Adams", "WR", "IR", "Hamstring", "Dec 13"], ["Puka Nacua", "WR", "IR", "Knee - MCL", "Feb 15"], ["Steve Avila", "G", "Out", "Hamstring", "Dec 3"], ["Dylan McMahon", "C", "IR", "Knee", "Dec 25"]],
  MIA:[["Jaylin Simpson", "S", "Questionable", "Knee", "Nov 29"], ["Dante Trader Jr.", "S", "Questionable", "Shoulder", "Nov 29"], ["Jared Wayne", "WR", "Questionable", "Quadriceps", "Nov 29"], ["Bradley Pinion", "P", "Questionable", "Groin", "Nov 29"], ["Ronnie Harrison Jr.", "LB", "IR", "Hamstring", "Nov 29"], ["JuJu Brents", "CB", "Questionable", "Shoulder", "Nov 29"], ["Malik Willis", "QB", "IR", "Abdomen", "Dec 13"]],
  MIN:[["Isaiah Rodgers", "CB", "Questionable", "Quadriceps", "Nov 29"], ["Jay Ward", "S", "Questionable", "Knee", "Nov 29"], ["Kyler Murray", "QB", "Questionable", "Hamstring", "Nov 29"], ["Jordan Addison", "WR", "Doubtful", "Thumb", "Nov 29"], ["Bo Richter", "LB", "IR", "Foot", "Dec 20"]],
  NE:[["A.J. Brown", "WR", "Doubtful", "Hamstring", "Nov 29"], ["Walter Rouse", "OL", "Questionable", "Concussion", "Nov 29"], ["Brenden Schooler", "S", "Questionable", "Hamstring", "Nov 29"], ["Carlton Davis III", "CB", "Questionable", "Knee", "Nov 29"], ["Ben Brown", "C", "Questionable", "Knee", "Nov 29"], ["Alijah Vera-Tucker", "G", "IR", "Hamstring", "Nov 29"], ["Drake Maye", "QB", "Out", "Lower Leg", "Dec 27"], ["Romeo Doubs", "WR", "IR", "Shoulder", "Nov 29"], ["Dre'Mont Jones", "DE", "Questionable", "Undisclosed", "Nov 29"], ["Robert Spillane", "LB", "Questionable", "Illness", "Nov 29"]],
  NO:[["Asim Richards", "OT", "Doubtful", "Knee", "Nov 29"], ["Pete Werner", "LB", "Questionable", "Hamstring", "Nov 29"], ["Erik McCoy", "C", "Questionable", "Biceps", "Nov 29"], ["Martin Emerson Jr.", "CB", "Questionable", "Concussion", "Nov 29"], ["Taliese Fuaga", "OT", "Questionable", "Knee", "Nov 29"], ["Juwan Johnson", "TE", "Questionable", "Hamstring", "Nov 29"]],
  NYG:[["Greg Newsome II", "CB", "IR", "Ankle", "Dec 28"], ["Tyrone Tracy Jr.", "RB", "IR", "Hamstring", "Dec 6"]],
  NYJ:[["Omar Cooper Jr.", "WR", "Questionable", "Ankle", "Nov 29"], ["Isaiah Williams", "WR", "Questionable", "Ribs", "Nov 29"], ["Trevin Wallace", "LB", "Questionable", "Groin", "Nov 29"]],
  PHI:[["Arnold Ebiketie", "LB", "Questionable", "Oblique", "Nov 26"], ["Quinyon Mitchell", "CB", "Questionable", "Hamstring", "Nov 26"], ["Will Shipley", "RB", "Questionable", "Illness", "Nov 26"], ["Smael Mondon Jr.", "LB", "Questionable", "Ankle", "Nov 26"], ["Jonathan Jones", "CB", "Questionable", "Ankle", "Nov 26"], ["Zack Baun", "LB", "IR", "Back", "Dec 19"], ["Dontayvion Wicks", "WR", "IR", "Ankle", "Dec 19"]],
  PIT:[["Gennings Dunker", "G", "IR", "Knee", "Nov 27"], ["Nick Herbig", "LB", "Questionable", "Hip", "Nov 27"], ["Ben Skowronek", "WR", "Questionable", "Calf", "Nov 27"], ["Michael Pittman Jr.", "WR", "IR", "Foot", "Nov 27"], ["Alex Highsmith", "LB", "Doubtful", "Ankle", "Nov 27"]],
  SF:[["Khalid Kareem", "DE", "Questionable", "Ankle", "Nov 29"], ["Dre Greenlaw", "LB", "Questionable", "Neck", "Nov 29"], ["Colton McKivitz", "OT", "Out", "Ankle", "Feb 15"], ["Deommodore Lenoir", "CB", "Questionable", "Foot", "Nov 29"]],
  SEA:[["Sam Darnold", "QB", "Questionable", "Quadriceps", "Nov 29"], ["Leonard Williams", "DT", "Questionable", "Shoulder", "Nov 29"], ["Quenton Nelson", "G", "Doubtful", "Knee", "Nov 29"], ["Charles Cross", "OT", "Questionable", "Ankle", "Nov 29"], ["George Holani", "RB", "IR", "Knee - MCL", "Dec 25"], ["Jarran Reed", "DT", "Questionable", "Toe", "Nov 29"], ["Abraham Lucas", "OT", "Questionable", "Ankle", "Nov 29"]],
  TB:[["Jalen McMillan", "WR", "IR", "Knee - PCL", "Nov 30"], ["Antoine Winfield Jr.", "S", "Questionable", "Ankle", "Nov 30"], ["Elijah Simmons", "DT", "Questionable", "Concussion", "Nov 30"], ["Benjamin Morrison", "CB", "Questionable", "Hamstring", "Nov 30"], ["Jacob Parrish", "CB", "Questionable", "Back", "Nov 30"]],
  TEN:[["Dan Moore Jr.", "OT", "Questionable", "Knee", "Nov 29"], ["Terrell Burgess", "S", "Questionable", "Knee", "Nov 29"], ["Cor'Dale Flott", "CB", "Questionable", "Neck", "Nov 29"], ["Tony Adams", "S", "Questionable", "Illness", "Nov 29"]],
  WAS:[["Amik Robertson", "CB", "Questionable", "Ankle", "Nov 29"], ["Laremy Tunsil", "OT", "IR", "Triceps", "Dec 20"]],
};
const INJ_P={};Object.entries(INJ).forEach(([t,a])=>a.forEach(([n,p,s,i,r])=>INJ_P[n]={team:t,pos:p,s,i,r}));
const INJ_LBL={IR:"Injured reserve","IR-R":"IR · designated to return","PUP-R":"PUP list","NFI-R":"Non-football injury list","Reserve-DNR":"Reserve · did not report","Reserve-CEL":"Reserve list"};
const INJ_ORD={Out:0,Doubtful:1,Questionable:2,"IR-R":3,IR:4,"PUP-R":5,"NFI-R":6,"Reserve-DNR":7,"Reserve-CEL":8};
const injGroup=s=>s==="Out"||s==="Doubtful"||s==="Questionable"?s:"Reserve";
const INJ_COL={Out:"#f05252",Doubtful:"#f97316",Questionable:"#fab219",Reserve:"#a78bfa"};
const injColor=s=>INJ_COL[injGroup(s)]||"#9aa";
const injLabel=s=>INJ_LBL[s]||s;
/* true when the player will not play this week (Out or any reserve list) */
const injSidelined=n=>{const x=INJ_P[n];return !!x&&x.s!=="Questionable"&&x.s!=="Doubtful"};
function injChip(s){const c=injColor(s);return `<span class="tag" style="background:${c}22;color:${c};white-space:nowrap">${esc(injGroup(s)==="Reserve"?s.replace("-R","").replace("Reserve-","Res-"):s)}</span>`}
function injTag(name){const x=INJ_P[name];if(!x)return "";const c=injColor(x.s);return `<span class="tag" style="background:${c}22;color:${c}">⚠ ${esc(injLabel(x.s))}${x.i?" · "+esc(x.i):""}${x.r?" · est. return "+esc(x.r):""}</span>`}
function injRows(a){return [...a].sort((x,y)=>(INJ_ORD[x[2]]??9)-(INJ_ORD[y[2]]??9)).map(([n,p,s,i,r])=>`<tr><td><b>${esc(n)}</b> <span class="small">${p}</span></td><td class="small">${esc(i).replace(/\//g,"/<wbr>")}${r?`<br><span style="opacity:.7;white-space:nowrap">ret. ${esc(r)}</span>`:""}</td><td class="r">${injChip(s)}</td></tr>`).join("")}
function injList(team){const a=INJ[team]||[];if(!a.length)return '<p class="small" style="margin:6px 0 0">ESPN lists no injured players.</p>';
  const act=a.filter(x=>injGroup(x[2])!=="Reserve"),res=a.filter(x=>injGroup(x[2])==="Reserve");
  return `${act.length?`<table style="margin-top:6px"><tbody>${injRows(act)}</tbody></table>`:'<p class="small" style="margin:6px 0 0">No game-status designations.</p>'}
   ${res.length?`<details style="margin-top:8px"><summary class="small" style="cursor:pointer">Injured reserve & other lists (${res.length})</summary><table style="margin-top:6px"><tbody>${injRows(res)}</tbody></table></details>`:""}`}
/* full ESPN report page */
window.INJV=window.INJV||{team:"ALL",f:"all",q:""};
function viewInjuries(){const V=window.INJV,el=document.getElementById("v-injuries");
  const teams=Object.keys(INJ).sort((a,b)=>TEAMS[a][0].localeCompare(TEAMS[b][0]));
  const wk=new Set(SLATE.filter(g=>!g.final).flatMap(g=>[g.away,g.home]));
  const all=Object.values(INJ).flat(),cnt=g=>all.filter(x=>injGroup(x[2])===g).length;
  const fil=x=>(V.f==="all"||V.f==="skill"||injGroup(x[2])===V.f)&&(!V.q||x[0].toLowerCase().includes(V.q.toLowerCase()))&&(V.f!=="skill"||["QB","RB","WR","TE"].includes(x[1]));
  const sel=V.team==="ALL"?teams:[V.team];
  const cards=sel.map(t=>{const a=INJ[t].filter(fil);if(!a.length)return "";
    return `<div class="card"><h2>${badge(t)} ${TEAMS[t][0]} <span class="small" style="font-weight:400">· ${a.length}${wk.has(t)?"":" · no game left this week"}</span></h2><table><tbody>${injRows(a)}</tbody></table></div>`}).join("");
  el.innerHTML=`<h1>NFL Injury Report</h1>
   <p class="small" style="margin-top:-4px">Every player on ESPN's NFL injury report — game statuses plus injured reserve, PUP and other lists. As of ${INJ_ASOF}. Source: ESPN.com/nfl/injuries.</p>
   <div class="grid g4" style="margin:10px 0">${["Out","Doubtful","Questionable","Reserve"].map(g=>`<div class="card" style="padding:10px"><small>${g==="Reserve"?"IR / PUP / NFI":g}</small><b style="font-size:22px;color:${INJ_COL[g]};display:block">${cnt(g)}</b></div>`).join("")}</div>
   <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px">
    <select id="injTeam" style="max-width:100%"><option value="ALL">All 32 teams</option>${teams.map(t=>`<option value="${t}"${V.team===t?" selected":""}>${TEAMS[t][0]}</option>`).join("")}</select>
    <select id="injF"><option value="all">All statuses</option><option value="Out">Out</option><option value="Doubtful">Doubtful</option><option value="Questionable">Questionable</option><option value="Reserve">IR / PUP / NFI</option><option value="skill">QB/RB/WR/TE only</option></select>
    <input id="injQ" placeholder="Search player" value="${esc(V.q)}" style="flex:1;min-width:140px">
   </div>
   <div class="grid g2">${cards||'<p class="small">No players match.</p>'}</div>`;
  el.querySelector("#injF").value=V.f;
  el.querySelector("#injTeam").onchange=e=>{V.team=e.target.value;viewInjuries()};
  el.querySelector("#injF").onchange=e=>{V.f=e.target.value;viewInjuries()};
  const q=el.querySelector("#injQ");q.oninput=e=>{V.q=e.target.value;clearTimeout(q._t);q._t=setTimeout(()=>{viewInjuries();const n=document.getElementById("injQ");n.focus();n.setSelectionRange(n.value.length,n.value.length)},250)};
}

/* ---------- kickoff weather (nfl_wx.js: ESPN venue + Open-Meteo forecast for the kickoff hour; refreshed every NFL update) ---------- */
/* read at render time (PLAYS_WEEK is defined later in the page); only this week's forecasts count */
const WX=new Proxy({},{get:(t,k)=>{const W=typeof NFL_WX!=="undefined"&&NFL_WX;let wk=null;try{wk=PLAYS_WEEK}catch(e){}return W&&W.g&&(wk==null||W.wk===wk)?W.g[k]:undefined}});
function wxNight(g){const m=String(g&&g.when||"").match(/(\d+):\d+\s*(AM|PM)/i);return m?(m[2].toUpperCase()==="PM"&&+m[1]%12>=6):false}
function wxIcon(x,g){const c=x.wc,n=wxNight(g);
  return c==null?"🌡️":c===0?(n?"🌙":"☀️"):c===1?(n?"🌙":"🌤️"):c===2?"⛅":c===3?"☁️":c<=48?"🌫️":c<=57?"🌦️":c<=67?"🌧️":c<=77?"❄️":c<=82?"🌧️":c<=86?"🌨️":"⛈️"}
function wxWord(x){const c=x.wc;return c==null?"":c<=1?"Clear":c===2?"Partly cloudy":c===3?"Cloudy":c<=48?"Fog":c<=57?"Drizzle":c<=67?"Rain":c<=77?"Snow":c<=82?"Showers":c<=86?"Snow showers":"Thunderstorms"}
/* how much the weather matters for passing/kicking: wind is the big one, then snow / heavy rain, then cold */
function wxLvl(x){if(x.dome)return 0;let l=0;if(x.ws>=20||x.wg>=30)l=3;else if(x.ws>=15||x.wg>=25)l=2;else if(x.ws>=10)l=1;
  if(x.sn>=1||(x.wc>=63&&x.wc<=67)||x.wc>=95)l=Math.max(l,2);else if(x.pp>=50)l=Math.max(l,1);if(x.t<=20)l=Math.max(l,1);return l}
const WX_LVL=["Low impact","Minor impact","Moderate impact","High impact"],WX_COL=["#22c55e","#a3e635","#fab219","#f05252"];
function wxLine(x,g){if(x.dome)return `🏟️ Indoors`;const sn=x.sn>0?` · snow ${(x.sn/2.54).toFixed(1)}"`:"";
  return `${wxIcon(x,g)} ${x.t}°F · 💨 ${x.ws} mph${x.wg>=x.ws+8?` (gusts ${x.wg})`:""}${x.pp>=20?` · ${x.wc>=71&&x.wc<=86?"snow":"rain"} ${x.pp}%`:""}${sn}`}
function wxMini(g){const x=WX[g.id];if(!x)return "";const l=wxLvl(x);
  return `<div class="pubmini">${wxLine(x,g)}${x.dome?" — weather not a factor":` · ${wxWord(x)}`}${l>=2?` · <b style="color:${WX_COL[l]}">${WX_LVL[l]}</b>`:""}</div>`}
/* the chip next to the kickoff time at the top of the game page */
function wxHead(g){const x=WX[g.id];if(!x)return "";const l=wxLvl(x);
  return `<div class="wxhead${l>=2?" hi":""}" title="${x.dome?esc(x.dome):`Forecast for kickoff at ${esc(x.stad||"")}${x.city?", "+esc(x.city):""} (Open-Meteo)`}">${x.dome?`🏟️ Indoors · ${esc(x.dome)}`:`${wxLine(x,g)} · ${wxWord(x)}${l>=2?` · <b>${WX_LVL[l]}</b>`:""}`}</div>`}
function injWxSection(g){return `<div class="section"><h2>Injuries</h2><p class="small" style="margin-top:-6px">ESPN injury report as of ${INJ_ASOF} — every listed player; reserve lists are folded. <a href="#injuries">Full league report →</a></p>
  <div class="grid g2"><div class="card"><h2>${badge(g.away)} ${short(g.away)}</h2>${injList(g.away)}</div><div class="card"><h2>${badge(g.home)} ${short(g.home)}</h2>${injList(g.home)}</div></div></div>`}
