/* ---------- Injuries: ESPN NFL injury report (espn.com/nfl/injuries + ESPN team injury pages) ----------
   Every player ESPN lists, incl. injured reserve / PUP / NFI. Regenerate with tools/injgen.py data/espn_inj.txt "<date>". */
const INJ_ASOF="Tue Nov 10";
const INJ={
  ARI:[["Michael Wilson", "WR", "IR", "Neck", "Feb 15"], ["Gardner Minshew II", "QB", "IR", "Elbow", "Feb 15"], ["Jayden Williams", "OT", "Questionable", "Knee", "Nov 15"], ["Bam Knight", "RB", "Questionable", "Concussion", "Nov 15"], ["Jon Gaines II", "G", "Questionable", "Ankle", "Nov 15"], ["Hjalte Froholdt", "C", "Questionable", "Concussion", "Nov 15"], ["Roy Lopez", "DT", "Questionable", "Toe", "Nov 15"], ["James Conner", "RB", "IR", "Foot", "Nov 15"]],
  ATL:[["Zachariah Branch", "WR", "Doubtful", "Hamstring", "Nov 15"], ["Cameron Williams", "OL", "IR", "Ankle", "Nov 15"], ["Brian Robinson Jr.", "RB", "IR", "Hamstring", "Dec 13"], ["Samson Ebukam", "DE", "IR", "Hamstring", "Dec 13"], ["Anterio Thompson", "DT", "Out", "Undisclosed", "Feb 15"]],
  BAL:[["Kyle Hamilton", "S", "Questionable", "Hip", "Nov 16"], ["Nate Wiggins", "CB", "Questionable", "Illness", "Nov 16"], ["Jaylinn Hawkins", "S", "Questionable", "Knee", "Nov 16"], ["Lamar Jackson", "QB", "IR", "Thumb", "Dec 13"], ["Adisa Isaac", "LB", "Questionable", "Hamstring", "Nov 16"], ["Tyler Huntley", "QB", "IR", "Toe", "Feb 15"], ["Adam Randall", "RB", "IR", "Neck", "Nov 16"]],
  BUF:[["Joshua Palmer", "WR", "IR", "Hamstring", "Dec 6"], ["Greg Gaines", "DT", "Questionable", "Calf", "Nov 15"], ["Alec Anderson", "OT", "Questionable", "Ankle", "Nov 15"], ["Dion Dawkins", "OT", "Questionable", "Ribs", "Nov 15"], ["Tyrell Shavers", "WR", "Out", "Knee - ACL", "Nov 15"], ["Jordan Hancock", "CB", "IR", "Hamstring", "Nov 15"]],
  CAR:[["Jaelan Phillips", "LB", "Questionable", "Hamstring", "Nov 15"], ["Will Lee III", "CB", "Questionable", "Hamstring", "Nov 15"], ["Damien Lewis", "G", "Questionable", "Knee", "Nov 15"], ["Bobby Okereke", "LB", "Questionable", "Foot", "Nov 15"], ["Jaycee Horn", "CB", "IR", "Quadriceps", "Nov 15"], ["Mike Jackson", "CB", "IR", "Groin", "Nov 22"], ["Xavier Legette", "WR", "IR", "Knee", "Nov 15"], ["Jonathon Brooks", "RB", "IR", "Abdomen", "Nov 15"], ["Brady Christensen", "G", "IR", "Hamstring", "Nov 15"]],
  CHI:[["Kyle Monangai", "RB", "Out", "Toe", "Nov 22"], ["Malik Muhammad II", "CB", "Out", "Toe", "Nov 22"], ["Luther Burden III", "WR", "Questionable", "Concussion", "Nov 22"], ["Tyrique Stevenson Sr.", "CB", "Questionable", "Hand", "Nov 8"], ["Case Keenum", "QB", "Out", "Undisclosed", ""], ["Zavier Scott", "RB", "IR", "Wrist", "Dec 13"], ["Kentavius Street", "DT", "IR", "Knee", "Feb 15"], ["Braxton Jones", "OT", "IR", "Knee", "Feb 15"]],
  CIN:[["Kyle Dugger", "S", "Questionable", "Quadriceps", "Nov 15"], ["Andrei Iosivas", "WR", "IR", "Thumb", "Nov 15"], ["Cashius Howell", "DE", "IR", "Wrist", "Dec 6"], ["Erick All Jr.", "TE", "IR", "Knee - ACL", "Feb 15"]],
  CLE:[["Deshaun Watson", "QB", "Questionable", "Concussion", "Nov 15"], ["Maliek Collins", "DT", "Questionable", "Elbow", "Nov 15"]],
  DAL:[["DeMarvion Overshown", "LB", "Questionable", "Hamstring", "Nov 15"], ["George Pickens", "WR", "Questionable", "Hamstring", "Nov 15"], ["Joey Porter Jr.", "CB", "Questionable", "Ankle", "Nov 15"], ["Luke Schoonmaker", "TE", "Questionable", "Groin", "Nov 15"], ["KaVontae Turpin", "WR", "Questionable", "Ribs", "Nov 15"], ["Tyler Goodson", "RB", "Out", "Knee - ACL + MCL", "Nov 26"], ["Jake Ferguson", "TE", "Out", "Knee", "Nov 22"], ["Donovan Ezeiruaku", "LB", "Questionable", "Ankle", "Nov 15"], ["P.J. Locke", "S", "Out", "Concussion", "Nov 22"], ["Jonathan Mingo", "WR", "Questionable", "Ankle", "Nov 15"], ["Jonathan Bullard", "DT", "IR", "Calf", "Nov 15"], ["Malachi Lawrence", "LB", "IR", "Ankle", "Dec 7"]],
  DEN:[["Brandon Jones", "S", "Out", "Hamstring", "Nov 22"], ["Talanoa Hufanga", "S", "Out", "Ankle", "Nov 22"], ["Kris Abrams-Draine", "CB", "Out", "Ankle", "Nov 22"], ["Jaylen Waddle", "WR", "Questionable", "Concussion", "Nov 22"], ["Riley Moss", "CB", "Questionable", "Concussion", "Nov 22"], ["Eyioma Uwazurike", "DE", "IR", "Shoulder", "Dec 13"]],
  DET:[["Kerby Joseph", "S", "Out", "Knee", "Nov 22"], ["DJ Wonnum", "LB", "Questionable", "Concussion", "Nov 15"], ["D.J. Reed", "CB", "Questionable", "Hip", "Nov 15"], ["Jacob Saylors", "RB", "Questionable", "Neck", "Nov 15"], ["Cade Mays", "C", "Questionable", "Ankle", "Nov 15"], ["Jack Campbell", "LB", "IR", "Neck", "Dec 6"], ["Jimmy Rolder", "LB", "IR", "Hamstring", "Feb 15"], ["Isiah Pacheco", "RB", "IR", "Back", "Dec 28"]],
  GB:[["Josh Whyle", "TE", "Questionable", "Concussion", "Nov 15"], ["Sean Rhyan", "G", "Questionable", "Ankle", "Nov 15"], ["MarShawn Lloyd", "RB", "Questionable", "Knee", "Nov 15"], ["Zaire Franklin", "LB", "Doubtful", "Shin", "Nov 15"], ["Travis Glover", "OT", "Questionable", "Knee", "Nov 15"], ["Josh Jacobs", "RB", "Out", "Finger", "Nov 25"], ["Chris Brooks", "RB", "IR", "Ankle", "Nov 15"], ["Bo Melton", "WR", "Questionable", "Head", "Nov 15"], ["Ty'Ron Hopper", "LB", "Questionable", "Chest", "Nov 15"], ["Micah Parsons", "DE", "Out", "Knee - ACL", "Nov 25"]],
  HOU:[["David Montgomery", "RB", "Questionable", "Groin", "Nov 15"], ["Reed Blankenship", "S", "Questionable", "Concussion", "Nov 15"], ["Jaylin Noel", "WR", "IR", "Toe", "Feb 15"]],
  IND:[["Jalen Travis", "OT", "Doubtful", "Knee", "Nov 29"], ["Justin Walley", "CB", "Questionable", "Knee", "Nov 15"], ["Akeem Davis-Gaither", "LB", "Questionable", "Knee", "Nov 15"], ["A.J. Haulcy", "S", "Questionable", "Ankle", "Nov 15"], ["Mo Alie-Cox", "TE", "Questionable", "Groin", "Nov 15"], ["Jaylon Carlies", "LB", "Questionable", "Neck", "Nov 15"], ["Alec Pierce", "WR", "IR", "Heel", "Nov 29"]],
  JAX:[["Cam'Ron Silmon-Craig", "S", "Out", "Coach's Decision", "Nov 15"]],
  KC:[["Peter Woods", "DT", "Questionable", "Neck", "Nov 15"], ["Mansoor Delane", "CB", "Questionable", "Shoulder", "Nov 15"], ["Jaylon Moore", "OT", "Questionable", "Ankle", "Nov 15"], ["Xavier Worthy", "WR", "Questionable", "Hamstring", "Nov 15"], ["Patrick Mahomes", "QB", "Questionable", "Elbow", "Nov 15"], ["L'Jarius Sneed", "CB", "IR", "Knee", "Nov 26"], ["Omarr Norman-Lott", "DT", "Out", "Knee - ACL", "Nov 15"]],
  LV:[["Thomas Booker IV", "DT", "Questionable", "Ankle", "Nov 15"], ["Trey Zuhn III", "C", "Questionable", "Concussion", "Nov 15"]],
  LAC:[["Justin Herbert", "QB", "Questionable", "Finger", "Nov 16"], ["Kendall Williamson", "S", "Questionable", "Calf", "Nov 16"], ["Brenen Thompson", "WR", "Questionable", "Quadriceps", "Nov 16"], ["Deane Leonard", "CB", "Questionable", "Concussion", "Nov 16"], ["Kayode Awosika", "G", "Questionable", "Lower Leg", "Nov 16"], ["Ladd McConkey", "WR", "Questionable", "Back", "Nov 16"], ["Isas Waxter", "CB", "Questionable", "Ankle", "Nov 16"], ["Justin Eboigbe", "DT", "Questionable", "Ankle", "Nov 16"], ["Denzel Perryman", "LB", "IR", "Undisclosed", "Nov 16"], ["David Njoku", "TE", "IR", "Lower Leg", "Nov 16"]],
  LAR:[["Jordan Whittington", "WR", "IR", "Back", "Dec 20"], ["Puka Nacua", "WR", "Doubtful", "Knee - MCL", "Nov 15"], ["Trent McDuffie", "CB", "Questionable", "Back", "Nov 15"], ["Joe Cardona", "LS", "Questionable", "Ankle", "Nov 15"], ["Terrance Ferguson", "TE", "IR", "Hamstring", "Nov 25"], ["Steve Avila", "G", "Questionable", "Hamstring", "Nov 15"], ["Jaylen Watson", "CB", "IR", "Shoulder", "Feb 15"]],
  MIA:[["Malik Willis", "QB", "IR", "Groin", "Dec 13"], ["Zach Sieler", "DT", "IR", "Biceps", "Feb 15"], ["Jaylen Wright", "RB", "Questionable", "Quadriceps", "Nov 15"], ["Will Kacmarek", "TE", "Questionable", "Quadriceps", "Nov 15"]],
  MIN:[["Kyler Murray", "QB", "Doubtful", "Hamstring", "Nov 15"], ["Jauan Jennings", "WR", "Questionable", "Calf", "Nov 15"], ["Tyrion Ingram-Dawkins", "DE", "Questionable", "Ankle", "Nov 15"], ["Demond Claiborne", "RB", "IR", "Knee", "Dec 6"], ["Theo Jackson", "S", "Questionable", "Undisclosed", ""]],
  NE:[["Rhamondre Stevenson", "RB", "Doubtful", "Knee", "Nov 15"], ["Charles Woods", "CB", "Questionable", "Hamstring", "Nov 15"], ["TreVeyon Henderson", "RB", "Questionable", "Illness", "Nov 15"], ["A.J. Brown", "WR", "Questionable", "Knee", "Nov 15"], ["Ben Brown", "C", "Doubtful", "Knee", "Nov 15"], ["Brenden Schooler", "S", "Questionable", "Hamstring", "Nov 15"], ["Will Campbell", "OT", "Questionable", "Knee", "Nov 15"], ["Carlton Davis III", "CB", "Questionable", "Knee", "Nov 15"], ["Greg Van Roten", "G", "IR", "Hamstring", "Nov 15"]],
  NO:[["Travis Etienne Jr.", "RB", "IR", "Hamstring", "Nov 15"], ["Erik McCoy", "C", "Doubtful", "Biceps", "Nov 15"], ["CJ Donaldson", "RB", "Questionable", "Shoulder", "Nov 15"]],
  NYG:[["Colton Hood", "CB", "Questionable", "Finger", "Nov 12"], ["J.J. McCarthy", "QB", "Questionable", "Undisclosed", ""], ["Cam Skattebo", "RB", "Out", "Undisclosed", ""], ["Malik Harrison", "LB", "Questionable", "Groin", "Nov 12"], ["Abdul Carter", "LB", "Questionable", "Knee", "Nov 12"]],
  NYJ:[["Trevin Wallace", "LB", "Questionable", "Groin", "Nov 15"], ["Garrett Wilson", "WR", "Questionable", "Concussion", "Nov 15"], ["Nahshon Wright", "CB", "Questionable", "Back", "Nov 15"], ["Joseph Ossai", "DE", "Questionable", "Ankle", "Nov 15"], ["VJ Payne", "S", "IR", "Knee", "Nov 15"], ["Max Mitchell", "OT", "IR", "Concussion", "Dec 13"]],
  PHI:[["Dontayvion Wicks", "WR", "Out", "Ankle", "Nov 22"], ["DeVonta Smith", "WR", "Out", "Hamstring", "Nov 22"], ["Jonathan Jones", "CB", "Out", "Hamstring", "Nov 22"], ["Britain Covey", "WR", "Out", "Knee", "Nov 22"], ["Jihaad Campbell", "LB", "Out", "Hamstring", "Nov 22"], ["Michael Carter II", "CB", "Out", "Abdomen", "Nov 22"], ["Zack Baun", "LB", "Questionable", "Back", "Nov 22"]],
  PIT:[["Ben Skowronek", "WR", "Questionable", "Calf", "Nov 15"], ["Doneiko Slaughter", "CB", "Questionable", "Hamstring", "Nov 15"], ["Brandin Echols", "CB", "Questionable", "Hamstring", "Nov 15"], ["Michael Pittman Jr.", "WR", "IR", "Foot", "Nov 15"], ["Sebastian Joseph-Day", "DT", "IR", "Triceps", "Nov 27"]],
  SF:[["Gracen Halton", "DT", "Out", "Ankle", "Feb 15"], ["Mike Evans", "WR", "Questionable", "Achilles", "Nov 15"], ["Deebo Samuel Sr.", "WR", "Questionable", "Hamstring", "Nov 15"], ["C.J. West", "DT", "IR", "Knee", "Nov 15"], ["Deommodore Lenoir", "CB", "Questionable", "Foot", "Nov 15"], ["Renardo Green", "CB", "Questionable", "Back", "Nov 15"], ["Brandon Aiyuk", "WR", "Out", "Personal", "Nov 29"], ["Nate Hobbs", "CB", "IR", "Groin", "Nov 15"], ["Christian Kirk", "WR", "IR", "Knee - Meniscus", "Dec 6"]],
  SEA:[["Leonard Williams", "DT", "Questionable", "Shoulder", "Nov 15"], ["Brandon Pili", "DT", "Questionable", "Back", "Nov 15"], ["Rashid Shaheed", "WR", "Questionable", "Knee", "Nov 15"], ["Quenton Nelson", "G", "Doubtful", "Knee", "Nov 15"], ["Uchenna Nwosu", "LB", "Questionable", "Ankle", "Nov 15"], ["Charles Cross", "OT", "Doubtful", "Ankle", "Nov 15"], ["Sam Darnold", "QB", "Out", "Quadriceps", "Nov 29"], ["Drew Lock", "QB", "Questionable", "Oblique", "Nov 15"]],
  TB:[["Yaya Diaby", "LB", "Out", "Knee - MCL", "Nov 22"], ["Jalen McMillan", "WR", "IR", "Knee - PCL", "Nov 30"], ["Antoine Winfield Jr.", "S", "Questionable", "Ankle", "Nov 22"]],
  TEN:[["James Williams Sr.", "LB", "IR", "Groin", "Dec 13"], ["Tyjae Spears", "RB", "Questionable", "Knee", "Nov 15"], ["Carnell Tate", "WR", "Questionable", "Shoulder", "Nov 15"], ["Tommy Townsend", "P", "Questionable", "Knee", "Nov 15"], ["Jaylon Jones", "CB", "Questionable", "Knee", "Nov 15"], ["Dorian Mausi", "LB", "IR", "Undisclosed", ""], ["Peter Skoronski", "G", "Questionable", "Hamstring", "Nov 15"], ["JC Latham", "OT", "Questionable", "Finger", "Nov 15"], ["Marcus Harris", "CB", "Questionable", "Ankle", "Nov 15"]],
  WAS:[["Treylon Burks", "WR", "Questionable", "Foot", "Nov 12"], ["Lucas Patrick", "G", "Doubtful", "Concussion", "Nov 12"], ["Colson Yankoff", "TE", "Questionable", "Knee", "Nov 12"], ["Dyami Brown", "WR", "IR", "Calf", "Dec 6"], ["Daron Payne", "DT", "IR", "Foot", "Feb 15"], ["Jeremy McNichols", "RB", "IR", "Foot", "Feb 15"], ["Javon Kinlaw", "DT", "IR", "Knee - MCL", "Feb 15"]],
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

/* ---------- Week 9 game-time weather ----------
   Forecasts are added on the Saturday run. Roofs/domes listed now. */
const WX={
  3:{dome:"Dome (Caesars Superdome)"},
  4:{dome:"Retractable roof (Lucas Oil Stadium)"},
  10:{dome:"Covered (SoFi Stadium)"},
  15:{dome:"Dome (U.S. Bank Stadium)"},
};
const WX_LVL=["Low impact","Minor impact","Moderate impact","High impact"],WX_COL=["#22c55e","#a3e635","#fab219","#f05252"];
function wxMini(g){const x=WX[g.id];if(!x)return "";if(x.dome)return `<div class="pubmini">🏟️ ${x.dome} — weather not a factor</div>`;
  const ic=x.lvl>=3?"⛈️":x.rain&&/[1-9]/.test(x.rain)&&x.lvl>=1?"🌧️":x.lvl<0?"❔":"🌤️";
  return `<div class="pubmini">${ic} ${esc(x.w)} · ${esc(x.t)} · wind ${esc(x.wind)}${x.lvl>=0?` · <b style="color:${WX_COL[x.lvl]}">${WX_LVL[x.lvl]}</b>`:""}</div>`}
function wxCard(g){const x=WX[g.id];if(!x)return "";
  if(x.dome)return `<div class="card"><h2>Weather</h2><p style="margin:0">🏟️ ${x.dome} — played indoors, weather is not a factor.</p></div>`;
  return `<div class="card"><h2>Weather at kickoff</h2>${x.lvl>=0?`<span class="tag" style="background:${WX_COL[x.lvl]}22;color:${WX_COL[x.lvl]}">${WX_LVL[x.lvl]}</span>`:""}
   <div class="pgrid" style="margin-top:10px"><div><small>Conditions</small><b>${esc(x.w)}</b><small>${esc(x.t)}</small></div><div><small>Wind · Rain chance</small><b>${esc(x.wind)}</b><small>rain ${esc(x.rain)}</small></div></div>
   <p class="small" style="margin:10px 0 0">${esc(x.note)} Forecasts change — recheck on game day.</p></div>`}
function injWxSection(g){return `<div class="section"><h2>Injuries & weather</h2><p class="small" style="margin-top:-6px">ESPN injury report as of ${INJ_ASOF} — every listed player; reserve lists are folded. <a href="#injuries">Full league report →</a></p>
  <div class="grid g3"><div class="card"><h2>${badge(g.away)} ${short(g.away)}</h2>${injList(g.away)}</div><div class="card"><h2>${badge(g.home)} ${short(g.home)}</h2>${injList(g.home)}</div>${wxCard(g)}</div></div>`}
