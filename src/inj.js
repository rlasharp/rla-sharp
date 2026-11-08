/* ---------- Injuries: ESPN NFL injury report (espn.com/nfl/injuries + ESPN team injury pages) ----------
   Every player ESPN lists, incl. injured reserve / PUP / NFI. Regenerate with tools/injgen.py data/espn_inj.txt "<date>". */
const INJ_ASOF="Sat Nov 7";
const INJ={
  ARI:[["Isaiah Adams", "G", "Questionable", "Ankle", "Nov 8"], ["Jon Gaines II", "G", "Out", "Ankle", "Nov 15"], ["Jayden Williams", "OT", "Out", "Knee", "Nov 15"], ["Walter Nolen III", "DT", "Questionable", "Ankle", "Nov 8"], ["Max Melton", "CB", "Questionable", "Knee", "Nov 8"], ["Bam Knight", "RB", "Out", "Concussion", "Nov 15"], ["James Conner", "RB", "IR", "Foot", "Nov 15"], ["Jeremiyah Love", "RB", "IR", "Ankle", "Dec 6"], ["Kendrick Bourne", "WR", "IR", "Lower Leg", "Feb 15"]],
  ATL:[["Cameron Williams", "OL", "IR", "Ankle", "Nov 15"], ["Yasir Abdullah", "LB", "Questionable", "Hamstring", "Nov 8"], ["Beaux Collins", "WR", "Questionable", "Hip", "Nov 8"], ["Brian Robinson Jr.", "RB", "IR", "Hamstring", "Dec 13"], ["James Pearce Jr.", "LB", "Questionable", "Back", "Nov 8"], ["Divine Deablo", "LB", "Questionable", "Forearm", "Nov 8"], ["Samson Ebukam", "DE", "IR", "Hamstring", "Dec 13"], ["Zachariah Branch", "WR", "Out", "Hamstring", "Nov 15"], ["Anterio Thompson", "DT", "Out", "Undisclosed", "Feb 15"]],
  BAL:[["Lamar Jackson", "QB", "IR", "Thumb", "Dec 13"], ["Kyle Hamilton", "S", "Questionable", "Hip", "Nov 16"], ["Adisa Isaac", "LB", "Questionable", "Hamstring", "Nov 16"], ["Nate Wiggins", "CB", "Out", "Illness", "Nov 16"], ["Kedon Slovis", "QB", "Out", "Coach's Decision", "Nov 16"], ["Elijah Sarratt", "WR", "Out", "Coach's Decision", "Nov 16"], ["Emery Jones Jr.", "OT", "Out", "Coach's Decision", "Nov 16"], ["Aeneas Peebles", "DT", "Out", "Coach's Decision", "Nov 16"], ["Tyler Huntley", "QB", "IR", "Toe", "Feb 15"], ["Jaylinn Hawkins", "S", "Out", "Knee", "Nov 16"], ["Adam Randall", "RB", "IR", "Neck", "Nov 16"]],
  BUF:[["Alec Anderson", "OT", "Questionable", "Ankle", "Nov 9"], ["Dion Dawkins", "OT", "Questionable", "Ribs", "Nov 9"], ["Tyrell Shavers", "WR", "Out", "Knee - ACL", "Nov 9"], ["Joshua Palmer", "WR", "Out", "Hamstring", "Nov 15"], ["Jordan Hancock", "CB", "IR", "Hamstring", "Nov 9"], ["Greg Gaines", "DT", "Questionable", "Calf", "Nov 9"]],
  CAR:[["Brady Christensen", "G", "IR", "Hamstring", "Nov 15"], ["Damien Lewis", "G", "Out", "Knee", "Nov 15"], ["Will Lee III", "CB", "Out", "Hamstring", "Nov 15"], ["Jaelan Phillips", "LB", "Out", "Hamstring", "Nov 15"], ["Bobby Okereke", "LB", "Out", "Foot", "Nov 15"], ["Torricelli Simpkins III", "G", "Questionable", "Ankle", "Nov 8"], ["Corey Bullock", "C", "Questionable", "Quadriceps", "Nov 8"], ["Jonathon Brooks", "RB", "IR", "Abdomen", "Nov 8"], ["Xavier Legette", "WR", "IR", "Knee", "Nov 8"], ["Akayleb Evans", "CB", "IR", "Triceps", "Nov 30"]],
  CHI:[["Tyrique Stevenson Sr.", "CB", "Questionable", "Thumb", "Nov 8"], ["Malik Muhammad II", "CB", "Questionable", "Toe", "Nov 8"], ["Kyle Monangai", "RB", "Questionable", "Toe", "Nov 8"], ["Zavier Scott", "RB", "IR", "Wrist", "Dec 13"], ["Kentavius Street", "DT", "IR", "Knee", "Feb 15"], ["Braxton Jones", "OT", "IR", "Knee", "Feb 15"]],
  CIN:[["Cedric Johnson", "DE", "Questionable", "Ankle", "Nov 8"], ["Kyle Dugger", "S", "Out", "Quadriceps", "Nov 15"], ["Cashius Howell", "DE", "IR", "Wrist", "Dec 6"], ["Andrei Iosivas", "WR", "IR", "Thumb", "Nov 15"], ["Erick All Jr.", "TE", "IR", "Knee - ACL", "Feb 15"]],
  CLE:[["Deshaun Watson", "QB", "Questionable", "Concussion", "Nov 8"], ["Maliek Collins", "DT", "Out", "Elbow", "Nov 15"]],
  DAL:[["Jonathan Bullard", "DT", "IR", "Calf", "Nov 15"], ["Marist Liufau", "LB", "Questionable", "Forearm", "Nov 8"], ["Malachi Lawrence", "LB", "IR", "Ankle", "Dec 7"], ["Joey Porter Jr.", "CB", "Questionable", "Ankle", "Nov 8"], ["DeMarvion Overshown", "LB", "Questionable", "Hamstring", "Nov 8"], ["KaVontae Turpin", "WR", "Out", "Ribs", "Nov 15"], ["Jake Ferguson", "TE", "Questionable", "Ankle", "Nov 8"], ["George Pickens", "WR", "Questionable", "Hamstring", "Nov 8"], ["Jalen Thompson", "S", "IR", "Hamstring", "Nov 8"], ["Luke Schoonmaker", "TE", "Questionable", "Groin", "Nov 8"]],
  DEN:[["Eyioma Uwazurike", "DE", "IR", "Shoulder", "Dec 13"], ["Pat Bryant", "WR", "Questionable", "Ankle", "Nov 8"], ["Kris Abrams-Draine", "CB", "Out", "Ankle", "Nov 22"], ["Brandon Jones", "S", "Out", "Hamstring", "Nov 22"], ["Talanoa Hufanga", "S", "Questionable", "Ankle", "Nov 8"], ["Dondrea Tillman", "LB", "Questionable", "Hip", "Nov 8"]],
  DET:[["Jack Campbell", "LB", "IR", "Neck", "Dec 6"], ["Cade Mays", "C", "Out", "Ankle", "Nov 15"], ["DJ Wonnum", "LB", "Out", "Concussion", "Nov 15"], ["D.J. Reed", "CB", "Out", "Hip", "Nov 15"], ["Kerby Joseph", "S", "Out", "Knee", "Nov 15"], ["Jacob Saylors", "RB", "Questionable", "Neck", "Nov 8"], ["Sione Vaki", "RB", "Questionable", "Ankle", "Nov 8"], ["Amon-Ra St. Brown", "WR", "Questionable", "Ribs", "Nov 8"], ["Jimmy Rolder", "LB", "IR", "Hamstring", "Feb 15"], ["Isiah Pacheco", "RB", "IR", "Back", "Dec 28"]],
  GB:[["Chris Brooks", "RB", "IR", "Ankle", "Nov 15"], ["Travis Glover", "OT", "Out", "Knee", "Nov 15"], ["Sean Rhyan", "G", "Out", "Ankle", "Nov 15"], ["Keisean Nixon", "CB", "Questionable", "Groin", "Nov 8"], ["Zaire Franklin", "LB", "Out", "Shin", "Nov 15"], ["Josh Whyle", "TE", "Out", "Concussion", "Nov 15"], ["MarShawn Lloyd", "RB", "Questionable", "Knee", "Nov 8"], ["Micah Parsons", "DE", "Out", "Knee - ACL", "Nov 25"]],
  HOU:[["Reed Blankenship", "S", "Out", "Concussion", "Nov 15"], ["David Montgomery", "RB", "Out", "Groin", "Nov 15"], ["Jaylin Noel", "WR", "IR", "Toe", "Feb 15"]],
  IND:[["A.J. Haulcy", "S", "Out", "Ankle", "Nov 15"], ["Justin Walley", "CB", "Out", "Knee", "Nov 15"], ["Jalen Travis", "OT", "Questionable", "Thumb", "Nov 8"], ["Akeem Davis-Gaither", "LB", "Out", "Knee", "Nov 15"], ["Alec Pierce", "WR", "IR", "Heel", "Nov 29"]],
  JAX:[["Wesley Williams", "DE", "Out", "Coach's Decision", "Nov 15"], ["CJ Williams", "WR", "Out", "Coach's Decision", "Nov 15"], ["Cam'Ron Silmon-Craig", "S", "Out", "Coach's Decision", "Nov 15"], ["Alijah Huzzie", "CB", "Out", "Coach's Decision", "Nov 15"], ["Eric Murray", "S", "IR", "Elbow", "Feb 15"]],
  KC:[["Peter Woods", "DT", "Out", "Neck", "Nov 15"], ["Nikko Remigio", "WR", "Questionable", "Hip", "Nov 8"], ["Mansoor Delane", "CB", "Out", "Shoulder", "Nov 15"], ["L'Jarius Sneed", "CB", "IR", "Knee", "Nov 26"], ["Omarr Norman-Lott", "DT", "Out", "Knee - ACL", "Nov 15"]],
  LV:[["Thomas Booker IV", "DT", "Out", "Ankle", "Nov 15"], ["Darien Porter", "CB", "Questionable", "Groin", "Nov 8"]],
  LAC:[["Denzel Perryman", "LB", "IR", "Undisclosed", "Nov 8"], ["Kendall Williamson", "S", "Out", "Calf", "Nov 16"], ["Deane Leonard", "CB", "Out", "Concussion", "Nov 16"], ["Brenen Thompson", "WR", "Doubtful", "Quadriceps", "Nov 8"], ["David Njoku", "TE", "IR", "Lower Leg", "Nov 8"], ["Kayode Awosika", "G", "Doubtful", "Lower Leg", "Nov 8"], ["Derwin James Jr.", "S", "IR", "Hamstring", "Nov 29"]],
  LAR:[["Jaylen Watson", "CB", "IR", "Shoulder", "Feb 15"], ["Jordan Whittington", "WR", "Questionable", "Back", "Nov 8"], ["Terrance Ferguson", "TE", "IR", "Hamstring", "Nov 15"], ["Colby Parkinson", "TE", "Questionable", "Ribs", "Nov 8"], ["Joe Cardona", "LS", "Doubtful", "Ankle", "Nov 8"], ["Kam Curl", "S", "Questionable", "Foot", "Nov 8"], ["Trent McDuffie", "CB", "Questionable", "Back", "Nov 8"], ["Dean Connors", "RB", "IR", "Hand", "Dec 13"], ["Grant Stuard", "LB", "Questionable", "Hamstring", "Nov 8"]],
  MIA:[["Malik Herring", "DE", "Questionable", "Neck", "Nov 8"], ["Kaytron Allen", "RB", "Questionable", "Quadriceps", "Nov 8"], ["Jaylen Wright", "RB", "Questionable", "Quadriceps", "Nov 8"], ["Darrell Baker Jr.", "CB", "Out", "Undisclosed", "Nov 15"]],
  MIN:[["Demond Claiborne", "RB", "Out", "Knee", "Nov 15"], ["Jauan Jennings", "WR", "Out", "Calf", "Nov 15"], ["Kyler Murray", "QB", "Out", "Hamstring", "Nov 15"], ["Jay Ward", "S", "Questionable", "Knee", "Nov 9"]],
  NE:[["Greg Van Roten", "G", "IR", "Hamstring", "Nov 15"], ["Mack Hollins", "WR", "Questionable", "Calf", "Nov 8"], ["TreVeyon Henderson", "RB", "Out", "Illness", "Nov 15"], ["Hunter Henry", "TE", "Questionable", "Foot", "Nov 8"], ["A.J. Brown", "WR", "Out", "Knee", "Nov 15"], ["Brenden Schooler", "S", "Questionable", "Hamstring", "Nov 8"], ["Morgan Moses", "OT", "Questionable", "Foot", "Nov 8"]],
  NO:[["Kelvin Banks Jr.", "OT", "Questionable", "Ankle", "Nov 8"], ["Jordyn Tyson", "WR", "Questionable", "Hamstring", "Nov 8"], ["Martin Emerson Jr.", "CB", "Questionable", "Shin", "Nov 8"], ["CJ Donaldson", "RB", "Out", "Shoulder", "Nov 15"], ["Asim Richards", "OT", "Questionable", "Thumb", "Nov 8"], ["Travis Etienne Jr.", "RB", "IR", "Hamstring", "Nov 8"]],
  NYG:[["Cam Skattebo", "RB", "Doubtful", "Hamstring", "Nov 8"], ["Charlie Jones", "WR", "Questionable", "Hand", "Nov 8"], ["Tyrone Tracy Jr.", "RB", "IR", "Hamstring", "Dec 6"]],
  NYJ:[["VJ Payne", "S", "IR", "Knee", "Nov 15"], ["Nahshon Wright", "CB", "Out", "Back", "Nov 15"], ["Joseph Ossai", "DE", "Out", "Ankle", "Nov 15"], ["Trevin Wallace", "LB", "Out", "Groin", "Nov 15"], ["Garrett Wilson", "WR", "Out", "Concussion", "Nov 15"], ["Harrison Phillips", "DT", "Questionable", "Ankle", "Nov 8"], ["Max Mitchell", "OT", "IR", "Concussion", "Dec 13"], ["T'Vondre Sweat", "DT", "IR", "Knee", "Nov 29"]],
  PHI:[["Jonathan Jones", "CB", "Out", "Hamstring", "Nov 22"], ["Michael Carter II", "CB", "Out", "Abdomen", "Nov 22"], ["Jihaad Campbell", "LB", "Out", "Hamstring", "Nov 22"], ["Britain Covey", "WR", "Out", "Knee", "Nov 22"], ["Tanner McKee", "QB", "Questionable", "Ribs", "Nov 8"], ["DeVonta Smith", "WR", "Out", "Hamstring", "Nov 22"], ["Dontayvion Wicks", "WR", "Out", "Ankle", "Nov 22"]],
  PIT:[["Doneiko Slaughter", "CB", "Out", "Hamstring", "Nov 8"], ["Ben Skowronek", "WR", "Out", "Calf", "Nov 8"], ["Brandin Echols", "CB", "Out", "Hamstring", "Nov 8"], ["Michael Pittman Jr.", "WR", "IR", "Foot", "Nov 15"], ["Sebastian Joseph-Day", "DT", "IR", "Triceps", "Nov 27"]],
  SF:[["Nate Hobbs", "CB", "IR", "Groin", "Nov 15"], ["Christian Kirk", "WR", "IR", "Knee - Meniscus", "Dec 6"], ["Brandon Aiyuk", "WR", "Out", "Personal", "Nov 15"], ["Mike Evans", "WR", "Out", "Achilles", "Nov 15"], ["Deebo Samuel Sr.", "WR", "Out", "Hamstring", "Nov 15"], ["Siran Neal", "S", "Questionable", "Knee", "Nov 8"], ["De'Zhaun Stribling", "WR", "IR", "Ankle", "Dec 6"], ["Upton Stout", "CB", "Questionable", "Shoulder - AC Joint", "Nov 8"]],
  SEA:[["Charles Cross", "OT", "Out", "Ankle", "Nov 15"], ["Brandon Pili", "DT", "Out", "Back", "Nov 15"], ["Uchenna Nwosu", "LB", "Out", "Ankle", "Nov 15"], ["Leonard Williams", "DT", "Out", "Shoulder", "Nov 15"], ["Quenton Nelson", "G", "Out", "Knee", "Nov 15"], ["Rashid Shaheed", "WR", "Out", "Knee", "Nov 15"], ["Sam Darnold", "QB", "Out", "Quadriceps", "Nov 15"], ["Connor O'Toole", "LB", "Questionable", "Foot", "Nov 8"]],
  TB:[["Emeka Egbuka", "WR", "Questionable", "Foot", "Nov 8"], ["Jalen McMillan", "WR", "IR", "Knee - PCL", "Nov 22"], ["Yaya Diaby", "LB", "Out", "Knee - MCL", "Nov 22"], ["Josh Hayes", "CB", "IR", "Knee", "Nov 22"]],
  TEN:[["Tommy Townsend", "P", "Out", "Knee", "Nov 15"], ["Tyjae Spears", "RB", "Out", "Knee", "Nov 15"], ["Carnell Tate", "WR", "Out", "Shoulder", "Nov 15"], ["Jaylon Jones", "CB", "Out", "Knee", "Nov 15"], ["Peter Skoronski", "G", "Questionable", "Hamstring", "Nov 15"], ["JC Latham", "OT", "Questionable", "Finger", "Nov 15"], ["James Williams Sr.", "LB", "Questionable", "Groin", "Nov 15"], ["Marcus Harris", "CB", "Questionable", "Ankle", "Nov 15"], ["Dorian Mausi", "LB", "IR", "Foot", "Nov 15"]],
  WAS:[["Dyami Brown", "WR", "IR", "Calf", "Dec 6"], ["Jer'Zhan Newton", "DT", "Questionable", "Pectoral", "Nov 8"], ["Treylon Burks", "WR", "Out", "Foot", "Nov 12"], ["Daron Payne", "DT", "IR", "Foot", "Feb 15"], ["Jeremy McNichols", "RB", "IR", "Foot", "Feb 15"], ["Javon Kinlaw", "DT", "IR", "Knee - MCL", "Feb 15"], ["Terry McLaurin", "WR", "IR", "Knee", "Feb 15"]],
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
