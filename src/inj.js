/* ---------- Injuries: ESPN NFL injury report (espn.com/nfl/injuries + ESPN team injury pages) ----------
   Every player ESPN lists, incl. injured reserve / PUP / NFI. Regenerate with tools/injgen.py data/espn_inj.txt "<date>". */
const INJ_ASOF="Mon Nov 16";
const INJ={
  ARI:[["Jon Gaines II", "G", "Out", "Ankle", "Nov 22"], ["Hjalte Froholdt", "C", "Out", "Concussion", "Nov 22"], ["Jordan Burch", "LB", "Questionable", "Knee", "Nov 22"], ["Jayden Williams", "OT", "Out", "Knee", "Nov 22"], ["Gardner Minshew II", "QB", "IR", "Elbow", "Feb 15"], ["Zachary Carter", "DT", "IR", "Knee", "Nov 22"]],
  ATL:[["Divine Deablo", "LB", "Out", "Forearm", "Nov 29"], ["Zachariah Branch", "WR", "Out", "Hamstring", "Nov 29"]],
  BAL:[["Adam Randall", "RB", "IR", "Neck", "Nov 16"], ["Jaylinn Hawkins", "S", "Out", "Knee", "Nov 22"], ["Lamar Jackson", "QB", "IR", "Thumb", "Dec 27"]],
  BUF:[["Dorian Williams", "LB", "Questionable", "Calf", "Nov 22"], ["Dee Alford", "CB", "Questionable", "Concussion", "Nov 22"], ["Christian Benford", "CB", "Questionable", "Groin", "Nov 22"], ["Tyrell Shavers", "WR", "Out", "Knee - ACL", "Nov 22"]],
  CAR:[["Bobby Okereke", "LB", "Out", "Foot", "Nov 22"], ["Will Lee III", "CB", "Out", "Hamstring", "Nov 22"], ["Brady Christensen", "G", "IR", "Hamstring", "Nov 22"], ["Mike Jackson", "CB", "IR", "Groin", "Nov 22"], ["Jonathon Brooks", "RB", "IR", "Groin", "Nov 22"], ["Jaycee Horn", "CB", "IR", "Quadriceps", "Nov 22"]],
  CHI:[["Luther Burden III", "WR", "Questionable", "Concussion", "Nov 22"], ["Kyle Monangai", "RB", "Out", "Toe", "Nov 22"], ["Tyrique Stevenson Sr.", "CB", "Questionable", "Hand", "Nov 22"], ["Malik Muhammad II", "CB", "Out", "Toe", "Nov 22"], ["Zavier Scott", "RB", "IR", "Wrist", "Dec 13"], ["Kentavius Street", "DT", "IR", "Knee", "Feb 15"], ["Braxton Jones", "OT", "IR", "Knee", "Feb 15"]],
  CIN:[["Kyle Dugger", "S", "Out", "Quadriceps", "Nov 23"], ["Oren Burks", "LB", "Questionable", "Groin", "Nov 23"], ["Dalton Risner", "G", "Questionable", "Knee", "Nov 23"], ["Myles Hinton", "OT", "Out", "Illness", "Nov 23"], ["Andrei Iosivas", "WR", "IR", "Thumb", "Nov 23"], ["Brian Parker II", "OT", "IR", "Knee", "Nov 23"], ["Jalen Davis", "CB", "IR", "Hamstring", "Nov 23"], ["Cashius Howell", "DE", "IR", "Wrist", "Dec 6"]],
  CLE:[["Ronnie Hickman", "S", "Out", "Concussion", "Nov 29"], ["Michael Burton", "FB", "IR", "Calf", "Dec 20"]],
  DAL:[["DaRon Bland", "CB", "Doubtful", "Ankle", "Nov 22"], ["Tyler Booker", "G", "Out", "Ankle", "Dec 7"], ["Jonathan Mingo", "WR", "Out", "Ankle", "Nov 22"], ["Juanyeh Thomas", "S", "Out", "Ribs", "Nov 22"], ["P.J. Locke", "S", "Out", "Concussion", "Nov 22"], ["Jake Ferguson", "TE", "Out", "Knee", "Nov 26"], ["Donovan Ezeiruaku", "LB", "Out", "Ankle", "Nov 22"], ["Tyler Goodson", "RB", "IR", "Knee - ACL + MCL", "Dec 20"]],
  DEN:[["Brandon Jones", "S", "Out", "Hamstring", "Nov 22"], ["Talanoa Hufanga", "S", "Out", "Ankle", "Nov 22"], ["Kris Abrams-Draine", "CB", "Out", "Ankle", "Nov 22"], ["Jaylen Waddle", "WR", "Questionable", "Concussion", "Nov 22"], ["Riley Moss", "CB", "Questionable", "Concussion", "Nov 22"], ["Eyioma Uwazurike", "DE", "IR", "Shoulder", "Dec 13"]],
  DET:[["D.J. Reed", "CB", "Out", "Hip", "Nov 22"], ["Cade Mays", "C", "Out", "Ankle", "Nov 22"], ["Aidan Hutchinson", "DE", "Out", "Knee - ACL", "Feb 15"], ["Kerby Joseph", "S", "Out", "Knee", "Nov 22"], ["Jack Campbell", "LB", "IR", "Neck", "Dec 6"], ["Jimmy Rolder", "LB", "IR", "Hamstring", "Feb 15"]],
  GB:[["Skyy Moore", "WR", "Questionable", "Ankle", "Nov 25"], ["Micah Parsons", "DE", "Out", "Knee - ACL", "Nov 25"], ["Kevin Zeitler", "G", "Out", "Triceps", "Nov 25"], ["Sean Rhyan", "G", "Out", "Ankle", "Nov 25"], ["Josh Jacobs", "RB", "Out", "Finger", "Nov 25"], ["Zaire Franklin", "LB", "Out", "Shin", "Nov 25"], ["Bo Melton", "WR", "Questionable", "Thigh", "Nov 25"], ["Brandon Cisse", "CB", "Questionable", "Ribs", "Nov 25"], ["Josh Whyle", "TE", "IR", "Concussion", "Dec 20"]],
  HOU:[["Wyatt Teller", "G", "Out", "Illness", "Nov 19"], ["Keylan Rutledge", "G", "Out", "Neck", "Nov 19"], ["Danielle Hunter", "DE", "Out", "Hamstring", "Nov 19"], ["Brevin Jordan", "TE", "Out", "Finger", "Nov 19"], ["Marvin Harrison Jr.", "WR", "Out", "Hamstring", "Nov 19"], ["Azeez Al-Shaair", "LB", "Out", "Groin", "Nov 19"], ["David Montgomery", "RB", "Out", "Groin", "Nov 19"], ["Woody Marks", "RB", "Doubtful", "Concussion", "Nov 19"], ["Jaylin Smith", "CB", "IR", "Hamstring", "Nov 19"]],
  IND:[["Jalen Travis", "OT", "Out", "Knee", "Nov 19"], ["Luke Rhodes", "LS", "Out", "Hamstring", "Nov 19"], ["Jerry Tillery", "DT", "Out", "Calf", "Nov 19"], ["Will Mallory", "TE", "Out", "Hamstring", "Nov 19"], ["Jaylon Carlies", "LB", "Out", "Neck", "Nov 19"], ["Sauce Gardner", "CB", "Questionable", "Calf", "Nov 19"], ["Charvarius Ward", "CB", "Questionable", "Shin", "Nov 19"], ["Bernhard Raimann", "OT", "Questionable", "Concussion", "Nov 19"], ["Akeem Davis-Gaither", "LB", "IR", "Knee", "Dec 20"], ["Mo Alie-Cox", "TE", "IR", "Groin", "Dec 20"], ["Alec Pierce", "WR", "IR", "Heel", "Nov 29"]],
  JAX:[["Robert Hainsey", "C", "Questionable", "Knee", "Nov 22"], ["Danny Striggow", "DE", "Questionable", "Concussion", "Nov 22"], ["B.J. Green II", "DE", "IR", "Forearm", "Nov 22"]],
  KC:[["Peter Woods", "DT", "Out", "Neck", "Nov 22"], ["Kenneth Walker III", "RB", "Out", "Groin", "Nov 22"], ["Jaydn Ott", "RB", "Out", "Hamstring", "Nov 22"], ["Jaylon Moore", "OT", "Out", "Ankle", "Nov 22"], ["Jared Wiley", "TE", "Out", "Ankle", "Dec 13"], ["Trey Smith", "G", "Questionable", "Concussion", "Nov 22"]],
  LV:[["Brock Bowers", "TE", "Questionable", "Ankle", "Nov 22"], ["Kwity Paye", "DE", "Questionable", "Neck", "Nov 22"], ["Thomas Booker IV", "DT", "Out", "Ankle", "Nov 22"], ["Dont'e Thornton Jr.", "WR", "Out", "Back", "Nov 22"]],
  LAC:[["Brenen Thompson", "WR", "Doubtful", "Hamstring", "Nov 16"], ["Ladd McConkey", "WR", "Out", "Back", "Nov 22"], ["Branson Taylor", "G", "Out", "Ankle", "Nov 22"], ["Trey Pipkins III", "OT", "IR", "Knee", "Nov 16"], ["Kayode Awosika", "G", "Questionable", "Lower Leg", "Nov 16"], ["Kendall Williamson", "S", "Out", "Calf", "Nov 22"], ["Isas Waxter", "CB", "Out", "Ankle", "Nov 22"], ["Justin Eboigbe", "DT", "Questionable", "Ankle", "Nov 16"], ["Denzel Perryman", "LB", "IR", "Pectoral", "Nov 16"], ["David Njoku", "TE", "IR", "Lower Leg", "Nov 16"]],
  LAR:[["Steve Avila", "G", "Out", "Hamstring", "Nov 25"], ["Coleman Shelton", "C", "Questionable", "Hamstring", "Nov 25"], ["Dylan McMahon", "C", "Questionable", "Knee", "Nov 25"], ["Joe Cardona", "LS", "Out", "Ankle", "Nov 25"], ["Davante Adams", "WR", "IR", "Hamstring", "Nov 25"], ["Puka Nacua", "WR", "IR", "Knee - MCL", "Dec 20"]],
  MIA:[["Jordan Phillips", "DT", "Questionable", "Arm", "Nov 22"], ["Jared Wayne", "WR", "Out", "Quadriceps", "Nov 22"], ["Aaron Brewer", "C", "Out", "Concussion", "Nov 22"], ["Chris Bell", "WR", "Out", "Knee", "Nov 22"], ["Malik Willis", "QB", "IR", "Abdomen", "Dec 13"], ["Andrew Meyer", "C", "Questionable", "Undisclosed", "Nov 22"], ["Zeek Biggers", "DT", "Questionable", "Knee", "Nov 22"], ["Darrell Baker Jr.", "CB", "Out", "Knee", "Nov 22"]],
  MIN:[["Jordan Addison", "WR", "Out", "Thumb", "Nov 29"], ["T.J. Hockenson", "TE", "Out", "Wrist", "Nov 22"], ["Tyrion Ingram-Dawkins", "DE", "Out", "Ankle", "Nov 22"], ["Blake Cashman", "LB", "Out", "Concussion", "Nov 22"], ["Jauan Jennings", "WR", "Out", "Calf", "Nov 22"], ["Kyler Murray", "QB", "Out", "Hamstring", "Nov 29"], ["Andrew Van Ginkel", "LB", "Questionable", "Quadriceps", "Nov 22"], ["Jeshaun Jones", "WR", "Questionable", "Shoulder", "Nov 22"], ["Bo Richter", "LB", "Questionable", "Foot", "Nov 22"]],
  NE:[["Walter Rouse", "OL", "Out", "Concussion", "Nov 29"], ["Brenden Schooler", "S", "Out", "Hamstring", "Nov 29"], ["Ben Brown", "C", "Out", "Knee", "Nov 29"], ["Carlton Davis III", "CB", "Out", "Knee", "Nov 29"], ["Drake Maye", "QB", "Doubtful", "Ankle", "Nov 29"], ["A.J. Brown", "WR", "Questionable", "Hamstring", "Nov 29"], ["Dre'Mont Jones", "DE", "Questionable", "Undisclosed", "Nov 29"], ["Robert Spillane", "LB", "Questionable", "Illness", "Nov 29"], ["TreVeyon Henderson", "RB", "IR", "Illness", "Dec 21"]],
  NO:[["Erik McCoy", "C", "Out", "Biceps", "Nov 22"], ["Taliese Fuaga", "OT", "Out", "Knee", "Nov 22"], ["CJ Donaldson", "RB", "Out", "Shoulder", "Nov 22"], ["Asim Richards", "OT", "Out", "Knee", "Nov 29"], ["Pete Werner", "LB", "Questionable", "Hamstring", "Nov 22"], ["Christen Miller", "DT", "IR", "Knee", "Dec 13"]],
  NYG:[["Malik Harrison", "LB", "Out", "Groin", "Nov 22"], ["Jason Pinnock", "S", "Questionable", "Back", "Nov 22"]],
  NYJ:[["Trevin Wallace", "LB", "Out", "Groin", "Nov 22"], ["Jarvis Brownlee Jr.", "CB", "Out", "Illness", "Nov 22"], ["Omar Cooper Jr.", "WR", "Questionable", "Ankle", "Nov 22"], ["Geno Smith", "QB", "Questionable", "Ankle", "Nov 22"], ["Dylan Parham", "G", "Questionable", "Knee", "Nov 22"]],
  PHI:[["Dontayvion Wicks", "WR", "Out", "Ankle", "Nov 22"], ["DeVonta Smith", "WR", "Out", "Hamstring", "Nov 22"], ["Jonathan Jones", "CB", "Out", "Hamstring", "Nov 22"], ["Britain Covey", "WR", "Out", "Knee", "Nov 22"], ["Jihaad Campbell", "LB", "Out", "Hamstring", "Nov 22"], ["Michael Carter II", "CB", "Out", "Abdomen", "Nov 22"], ["Zack Baun", "LB", "Questionable", "Back", "Nov 22"]],
  PIT:[["Michael Pittman Jr.", "WR", "IR", "Foot", "Nov 22"], ["Roman Wilson", "WR", "IR", "Finger", "Nov 22"], ["Mason McCormick", "G", "Doubtful", "Ankle", "Nov 22"], ["DeShon Elliott", "S", "Out", "Knee", "Nov 22"]],
  SF:[["Mike Evans", "WR", "Out", "Achilles", "Nov 22"], ["C.J. West", "DT", "IR", "Knee", "Nov 22"], ["Nate Hobbs", "CB", "IR", "Groin", "Nov 22"], ["Gracen Halton", "DT", "IR", "Ankle", "Feb 15"]],
  SEA:[["Leonard Williams", "DT", "Out", "Shoulder", "Nov 29"], ["Quenton Nelson", "G", "Out", "Knee", "Nov 29"], ["Charles Cross", "OT", "Out", "Ankle", "Nov 29"], ["Sam Darnold", "QB", "Out", "Quadriceps", "Nov 29"], ["George Holani", "RB", "Questionable", "Knee - MCL", "Nov 29"], ["Jarran Reed", "DT", "Questionable", "Toe", "Nov 29"], ["Abraham Lucas", "OT", "Questionable", "Ankle", "Nov 29"]],
  TB:[["Baker Mayfield", "QB", "Questionable", "Foot", "Nov 22"], ["Yaya Diaby", "LB", "Out", "Knee - MCL", "Nov 22"], ["Jalen McMillan", "WR", "IR", "Knee - PCL", "Nov 30"], ["Antoine Winfield Jr.", "S", "Questionable", "Ankle", "Nov 22"]],
  TEN:[["Anthony Hill Jr.", "LB", "Out", "Neck", "Nov 22"], ["Cody Barton", "LB", "Out", "Concussion", "Nov 22"], ["Carnell Tate", "WR", "Out", "Shoulder", "Nov 22"], ["Wan'Dale Robinson", "WR", "Questionable", "Ankle", "Nov 22"], ["Tony Adams", "S", "Questionable", "Concussion", "Nov 22"], ["Tommy Townsend", "P", "IR", "Knee", "Dec 13"], ["Peter Skoronski", "G", "IR", "Hamstring", "Dec 13"], ["James Williams Sr.", "LB", "IR", "Groin", "Dec 13"]],
  WAS:[["Jacory Croskey-Merritt", "RB", "IR", "Groin", "Nov 23"], ["Colson Yankoff", "TE", "Out", "Knee", "Nov 23"], ["Lucas Patrick", "G", "Out", "Concussion", "Nov 23"], ["Dyami Brown", "WR", "IR", "Calf", "Dec 6"]],
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
