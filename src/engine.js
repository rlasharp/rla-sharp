/* ============================================================
   REAL DATA (nflverse schedule + ESPN/DraftKings lines, Nov 2 2026)
   ============================================================ */
const TEAMS = {
 ARI:["Arizona Cardinals",2,5,"#97233F"], ATL:["Atlanta Falcons",3,4,"#A71930"], BAL:["Baltimore Ravens",4,3,"#241773"],
 BUF:["Buffalo Bills",5,1,"#00338D"], CAR:["Carolina Panthers",3,4,"#0085CA"], CHI:["Chicago Bears",5,2,"#0B162A"],
 CIN:["Cincinnati Bengals",4,2,"#FB4F14"], CLE:["Cleveland Browns",5,2,"#311D00"], DAL:["Dallas Cowboys",3,4,"#003594"],
 DEN:["Denver Broncos",5,2,"#FB4F14"], DET:["Detroit Lions",4,2,"#0076B6"], GB:["Green Bay Packers",5,3,"#203731"],
 HOU:["Houston Texans",2,5,"#03202F"], IND:["Indianapolis Colts",2,5,"#002C5F"], JAX:["Jacksonville Jaguars",4,2,"#006778"],
 KC:["Kansas City Chiefs",5,1,"#E31837"], LV:["Las Vegas Raiders",3,4,"#4a4a4a"], LAC:["Los Angeles Chargers",0,6,"#0080C6"],
 LAR:["Los Angeles Rams",3,4,"#003594"], MIA:["Miami Dolphins",1,5,"#008E97"], MIN:["Minnesota Vikings",6,0,"#4F2683"],
 NE:["New England Patriots",4,3,"#002244"], NO:["New Orleans Saints",2,5,"#9f8958"], NYG:["New York Giants",4,2,"#0B2265"],
 NYJ:["New York Jets",2,5,"#125740"], PHI:["Philadelphia Eagles",2,5,"#004C54"], PIT:["Pittsburgh Steelers",5,2,"#c9a400"],
 SF:["San Francisco 49ers",6,1,"#AA0000"], SEA:["Seattle Seahawks",4,3,"#002244"], TB:["Tampa Bay Buccaneers",2,5,"#D50A0A"],
 TEN:["Tennessee Titans",1,6,"#4B92DB"], WAS:["Washington Commanders",1,4,"#5A1414"]
};
const TEAM_IDS = Object.keys(TEAMS);
// Week 9 slate (nflverse schedule; kickoff times ET from ESPN). wp = home win probability from feed (null = not provided)
const SLATE = [
 {id:"mnf8",away:"CHI",home:"SEA",final:[34,17],when:"Mon Nov 2 · 8:15 PM",wp:null,tv:"MNF",wk:8},
 {id:1,away:"JAX",home:"BAL",when:"Thu Nov 5 · 8:15 PM",wp:null,tv:"TNF"},
 {id:2,away:"CIN",home:"ATL",when:"Sun Nov 8 · 9:30 AM",wp:null},
 {id:3,away:"CLE",home:"NO",when:"Sun Nov 8 · 1:00 PM",wp:null},
 {id:4,away:"DAL",home:"IND",when:"Sun Nov 8 · 1:00 PM",wp:null},
 {id:5,away:"DEN",home:"CAR",when:"Sun Nov 8 · 1:00 PM",wp:null},
 {id:6,away:"DET",home:"MIA",when:"Sun Nov 8 · 1:00 PM",wp:null},
 {id:7,away:"LAR",home:"WAS",when:"Sun Nov 8 · 1:00 PM",wp:null},
 {id:8,away:"NYG",home:"PHI",when:"Sun Nov 8 · 1:00 PM",wp:null},
 {id:9,away:"NYJ",home:"KC",when:"Sun Nov 8 · 1:00 PM",wp:null},
 {id:10,away:"HOU",home:"LAC",when:"Sun Nov 8 · 4:05 PM",wp:null},
 {id:11,away:"LV",home:"SF",when:"Sun Nov 8 · 4:25 PM",wp:null},
 {id:12,away:"ARI",home:"SEA",when:"Sun Nov 8 · 4:25 PM",wp:null},
 {id:13,away:"GB",home:"NE",when:"Sun Nov 8 · 4:25 PM",wp:null},
 {id:14,away:"TB",home:"CHI",when:"Sun Nov 8 · 8:20 PM",wp:null,tv:"SNF"},
 {id:15,away:"BUF",home:"MIN",when:"Mon Nov 9 · 8:15 PM",wp:null,tv:"MNF"}
];
// REAL lines: DraftKings current lines on ESPN's NFL odds page, Mon Nov 2 2026 (evening refresh). sp = HOME spread, ml = [away, home]
const LINES = {
 mnf8:{sp:-3.5,ml:[145,-175],tot:46.5}, // Week 8 Monday night, DraftKings via ESPN odds page (Nov 2 evening)
 1:{sp:10,ml:[-535,400],tot:39.5},
 2:{sp:3,ml:[-166,140],tot:52.5},
 3:{sp:-3,ml:[136,-162],tot:42.5},
 4:{sp:5.5,ml:[-245,200],tot:51.5},
 5:{sp:2.5,ml:[-155,130],tot:44.5},
 6:{sp:7,ml:[-355,280],tot:50.5},
 7:{sp:5.5,ml:[-225,185],tot:47.5},
 8:{sp:3.5,ml:[-166,140],tot:38.5},
 9:{sp:-10,ml:[440,-600],tot:47.5},
 10:{sp:4.5,ml:[-225,185],tot:40.5},
 11:{sp:-10,ml:[400,-535],tot:52.5},
 12:{sp:-8.5,ml:[350,-455],tot:39.5},
 13:{sp:-3.5,ml:[145,-175],tot:45.5},
 14:{sp:-6,ml:[245,-305],tot:47.5},
 15:{sp:3.5,ml:[-180,150],tot:45.5}
};
// Public betting splits for Week 9: not posted yet when this update ran (Mon Nov 2). Values = [% of bets, % of money] on the AWAY side (moneyline, spread) or the OVER (total).
const SPLITS = {};
const SPLIT_SRC={};
const SPLIT_MISSING={};
// REAL team stats 2026: ESPN offense (net pass, rush, points per game); NFL.com yards allowed. Matched by team totals.
const TEAM_STATS={"PIT": {"gp": 8, "ppg": 22.5, "pass_": 210.5, "rush": 117.9, "dpass": 242.0, "drush": 83.9}, "ATL": {"gp": 8, "ppg": 21.4, "pass_": 188.4, "rush": 134.8, "dpass": 237.5, "drush": 118.2}, "BAL": {"gp": 8, "ppg": 22.4, "pass_": 205.1, "rush": 133.5, "dpass": 241.9, "drush": 102.8}, "IND": {"gp": 8, "ppg": 20.1, "pass_": 174.6, "rush": 116.5, "dpass": 226.2, "drush": 131.8}, "LAR": {"gp": 8, "ppg": 24.2, "pass_": 258.9, "rush": 125.5, "dpass": 201.0, "drush": 109.2}, "SF": {"gp": 7, "ppg": 28.1, "pass_": 244.0, "rush": 127.4, "dpass": 223.9, "drush": 89.0}, "LV": {"gp": 8, "ppg": 27.6, "pass_": 265.1, "rush": 77.2, "dpass": 250.8, "drush": 146.4}, "MIA": {"gp": 7, "ppg": 16.7, "pass_": 166.7, "rush": 123.3, "dpass": 230.9, "drush": 113.1}, "MIN": {"gp": 7, "ppg": 20.0, "pass_": 165.6, "rush": 113.9, "dpass": 180.1, "drush": 116.7}, "GB": {"gp": 8, "ppg": 21.4, "pass_": 271.0, "rush": 60.6, "dpass": 220.9, "drush": 110.9}, "NYJ": {"gp": 8, "ppg": 21.2, "pass_": 214.9, "rush": 105.1, "dpass": 208.4, "drush": 123.6}, "TEN": {"gp": 8, "ppg": 18.0, "pass_": 173.0, "rush": 99.5, "dpass": 272.8, "drush": 124.1}, "DAL": {"gp": 8, "ppg": 27.4, "pass_": 247.9, "rush": 94.1, "dpass": 244.1, "drush": 152.8}, "NYG": {"gp": 7, "ppg": 23.3, "pass_": 229.3, "rush": 116.7, "dpass": 192.1, "drush": 128.1}, "CAR": {"gp": 7, "ppg": 25.4, "pass_": 261.7, "rush": 102.0, "dpass": 219.6, "drush": 140.7}, "CHI": {"gp": 7, "ppg": 25.7, "pass_": 236.4, "rush": 154.3, "dpass": 241.3, "drush": 87.6}, "WAS": {"gp": 7, "ppg": 22.7, "pass_": 200.6, "rush": 126.6, "dpass": 260.0, "drush": 99.1}, "PHI": {"gp": 8, "ppg": 17.1, "pass_": 177.1, "rush": 88.1, "dpass": 244.0, "drush": 131.9}, "LAC": {"gp": 7, "ppg": 14.1, "pass_": 177.1, "rush": 111.1, "dpass": 207.7, "drush": 124.6}, "ARI": {"gp": 8, "ppg": 21.9, "pass_": 223.8, "rush": 109.2, "dpass": 237.6, "drush": 122.1}, "KC": {"gp": 7, "ppg": 23.9, "pass_": 249.0, "rush": 134.1, "dpass": 228.4, "drush": 96.3}, "DEN": {"gp": 8, "ppg": 21.5, "pass_": 180.4, "rush": 92.6, "dpass": 246.6, "drush": 127.9}, "NE": {"gp": 8, "ppg": 23.0, "pass_": 244.1, "rush": 123.1, "dpass": 235.5, "drush": 92.6}, "SEA": {"gp": 7, "ppg": 24.0, "pass_": 229.6, "rush": 113.7, "dpass": 158.0, "drush": 89.4}, "HOU": {"gp": 7, "ppg": 23.6, "pass_": 253.4, "rush": 84.7, "dpass": 262.7, "drush": 98.0}, "BUF": {"gp": 7, "ppg": 33.3, "pass_": 244.7, "rush": 148.4, "dpass": 269.0, "drush": 97.4}, "TB": {"gp": 8, "ppg": 22.2, "pass_": 131.4, "rush": 168.6, "dpass": 220.1, "drush": 80.0}, "CIN": {"gp": 7, "ppg": 29.4, "pass_": 288.4, "rush": 80.3, "dpass": 261.0, "drush": 122.3}, "JAX": {"gp": 7, "ppg": 28.0, "pass_": 227.4, "rush": 122.9, "dpass": 264.3, "drush": 77.4}, "CLE": {"gp": 8, "ppg": 17.4, "pass_": 204.2, "rush": 97.6, "dpass": 214.6, "drush": 126.9}, "DET": {"gp": 7, "ppg": 29.0, "pass_": 264.0, "rush": 131.4, "dpass": 298.7, "drush": 96.6}, "NO": {"gp": 7, "ppg": 23.1, "pass_": 229.7, "rush": 86.0, "dpass": 249.7, "drush": 139.4}};
// REAL Week 9 player prop lines found publicly (source per line). Only the Thursday JAX-BAL game had props posted on Mon Nov 2; other games are added on the Saturday run.
const REAL_PROPS={"Trevor Lawrence|passYds": [243.5, null, null, "DraftKings (via Football Nation USA, Nov 2)"], "Trevor Lawrence|passTD": [1.5, null, null, "Football Nation USA (Nov 2)"], "Bhayshul Tuten|rushYds": [63.5, null, null, "FanDuel (via Football Nation USA, Nov 2)"], "Parker Washington|recYds": [67.5, null, null, "Football Nation USA (Nov 2)"], "Parker Washington|rec": [4.5, null, null, "Football Nation USA (Nov 2)"], "Brenton Strange|recYds": [33.5, null, null, "Football Nation USA (Nov 2)"], "Jakobi Meyers|recYds": [42.5, null, null, "Football Nation USA (Nov 2)"], "Derrick Henry|rushYds": [75.5, null, null, "Football Nation USA (Nov 2)"], "Zay Flowers|recYds": [45.5, null, null, "Football Nation USA (Nov 2)"], "Mark Andrews|recYds": [19.5, null, null, "Football Nation USA (Nov 2)"], "Caleb Williams|comp": [20.5, -115, -115, "BetOnline"], "Sam Darnold|comp": [19.5, -130, 100, "BetOnline"], "Caleb Williams|passTD": [1.5, 140, -170, "BetOnline"], "Sam Darnold|passTD": [1.5, -115, -115, "BetOnline"], "Caleb Williams|passYds": [229.5, -115, -115, "BetOnline"], "Sam Darnold|passYds": [238.5, -115, -115, "BetOnline"], "Colston Loveland|recYds": [44.5, -110, -120, "BetOnline"], "Jaxon Smith-Njigba|recYds": [99.5, -115, -115, "BetOnline"], "Luther Burden III|recYds": [50.5, -115, -115, "BetOnline"], "Rome Odunze|recYds": [39.5, -115, -115, "BetOnline"], "Colston Loveland|rec": [4.5, 115, -145, "BetOnline"], "Jaxon Smith-Njigba|rec": [7.5, -105, -125, "BetOnline"], "Luther Burden III|rec": [4.5, 120, -150, "BetOnline"], "Rome Odunze|rec": [3.5, 130, -160, "BetOnline"], "Caleb Williams|rushYds": [24.5, -125, -105, "BetOnline"], "Caleb Williams|int": [0.5, -110, -120, "BetOnline"], "Sam Darnold|int": [0.5, -110, -120, "BetOnline"], "AJ Barner|recYds": [31.5, -110, -114, "DraftKings"], "AJ Barner|rec": [3.5, 114, -145, "DraftKings"], "D'Andre Swift|rushYds": [59.5, -115, -115, "BetOnline"], "D'Andre Swift|recYds": [18.5, -115, -115, "BetOnline"], "D'Andre Swift|rec": [3.5, 130, -160, "BetOnline"], "D'Andre Swift|rushRec": [82.5, -120, -110, "Bovada"], "Jadarian Price|rushYds": [28.5, -115, -115, "BetOnline"], "Sam Darnold|rushYds": [4.5, -115, -115, "BetOnline"], "AJ Barner|anyTD": [0.5, 265, null, "BetRivers"], "Caleb Williams|anyTD": [0.5, 430, null, "BetRivers"], "Colston Loveland|anyTD": [0.5, 245, null, "BetRivers"], "D'Andre Swift|anyTD": [0.5, -117, null, "BetRivers"], "Jaxon Smith-Njigba|anyTD": [0.5, -109, null, "BetRivers"], "Luther Burden III|anyTD": [0.5, 240, null, "BetRivers"], "Rome Odunze|anyTD": [0.5, 285, null, "BetRivers"], "Sam Darnold|anyTD": [0.5, 650, null, "BetRivers"], "D'Andre Swift|rushAtt": [16.5, -110, -120, "Bovada"], "Caleb Williams|rushAtt": [4.5, -105, -125, "Bovada"], "Jadarian Price|anyTD": [0.5, 240, null, "BetRivers"], "Luther Burden III|rushYds": [3.5, -116, -108, "DraftKings"], "Luther Burden III|rushRec": [60.5, -113, -112, "DraftKings"]};
const SRC_LINKS = {lines:"https://www.foxsports.com/stories/nfl/2026-nfl-odds-week-8-lines-spreads-results-all-14-games",splits:"https://www.scoresandodds.com/nfl/consensus-picks",cleatz:"https://cleatz.com/public-betting/nfl/"};
// Latest real results (weeks 7–8)
const RECENT = [
 ["GB",27,"CAR",19],["DAL",38,"PHI",21],["SEA",20,"KC",3],["DET",20,"GB",17],["LAR",35,"LV",21],["DEN",30,"ARI",16],
 ["NYG",27,"HOU",21],["ATL",29,"SF",20],["TB",43,"CAR",13],["CLE",27,"TEN",24],["CIN",35,"BAL",13],["MIA",28,"NYJ",25],
 ["MIN",16,"IND",10],["PIT",16,"NO",10],["CHI",30,"NE",24]
];
const CUR = 2026;
const POS = ["QB","RB","WR","TE"];
const MARKETS = {
 passYds:{n:"Pass Yds",pos:["QB"]}, comp:{n:"Completions",pos:["QB"]}, passTD:{n:"Pass TDs",pos:["QB"],cnt:1},
 int:{n:"Interceptions",pos:["QB"],cnt:1}, rushYds:{n:"Rush Yds",pos:["QB","RB"]}, rushAtt:{n:"Rush Att",pos:["RB"]},
 rec:{n:"Receptions",pos:["RB","WR","TE"],cnt:1}, recYds:{n:"Rec Yds",pos:["RB","WR","TE"]},
 rushRec:{n:"Rush+Rec Yds",pos:["RB"]}, anyTD:{n:"Anytime TD",pos:["RB","WR","TE"],cnt:1}
};
const STAT_COLS = ["passYds","comp","passTD","int","rushAtt","rushYds","rushTD","rec","recYds","recTD"];

/* ============================================================
   DEMO DATA GENERATOR (deterministic) — replaced by imports
   ============================================================ */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// REAL starters (StatRankings depth charts Oct 30 2026; BAL QB changed Nov 2 after Lamar Jackson's thumb surgery): QB, RB1, WR1, WR2, TE1
const STARTERS={"BUF": ["Josh Allen", "James Cook", "DJ Moore", "Josh Palmer", "Dalton Kincaid"], "MIA": ["Malik Willis", "Ollie Gordon II", "Chris Bell", "Caleb Douglas", "Greg Dulcich"], "NE": ["Drake Maye", "Rhamondre Stevenson", "A.J. Brown", "Kyle Williams", "Hunter Henry"], "NYJ": ["Geno Smith", "Breece Hall", "Garrett Wilson", "Adonai Mitchell", "Mason Taylor"], "BAL": ["Tyler Huntley", "Derrick Henry", "Rashod Bateman", "Ja'Kobi Lane", "Mark Andrews"], "CIN": ["Joe Burrow", "Chase Brown", "Ja'Marr Chase", "Tee Higgins", "Mike Gesicki"], "CLE": ["Deshaun Watson", "Quinshon Judkins", "Denzel Boston", "Jerry Jeudy", "Harold Fannin Jr."], "PIT": ["Aaron Rodgers", "Jaylen Warren", "DK Metcalf", "Germie Bernard", "Pat Freiermuth"], "HOU": ["C.J. Stroud", "David Montgomery", "Nico Collins", "Marvin Harrison Jr.", "Dalton Schultz"], "IND": ["Daniel Jones", "Jonathan Taylor", "Keenan Allen", "Laquon Treadwell", "Tyler Warren"], "JAX": ["Trevor Lawrence", "Bhayshul Tuten", "Brian Thomas Jr.", "Jakobi Meyers", "Brenton Strange"], "TEN": ["Cam Ward", "Tony Pollard", "Elic Ayomanor", "Carnell Tate", "Gunnar Helm"], "DEN": ["Bo Nix", "Jonah Coleman", "Courtland Sutton", "Jaylen Waddle", "Evan Engram"], "KC": ["Patrick Mahomes", "Kenneth Walker III", "Jalen Royals", "Xavier Worthy", "Travis Kelce"], "LV": ["Kirk Cousins", "Ashton Jeanty", "Tre Tucker", "Jalen Nailor", "Brock Bowers"], "LAC": ["Justin Herbert", "Omarion Hampton", "Quentin Johnston", "Tre Harris", "Oronde Gadsden II"], "DAL": ["Dak Prescott", "Javonte Williams", "CeeDee Lamb", "George Pickens", "Jake Ferguson"], "NYG": ["J.J. McCarthy", "Cam Skattebo", "Malik Nabers", "Malachi Fields", "Isaiah Likely"], "PHI": ["Tanner McKee", "Saquon Barkley", "Marquise Brown", "Darius Cooper", "Dallas Goedert"], "WAS": ["Jayden Daniels", "Rachaad White", "Antonio Williams", "Treylon Burks", "Chig Okonkwo"], "CHI": ["Caleb Williams", "D'Andre Swift", "Rome Odunze", "Luther Burden III", "Colston Loveland"], "DET": ["Jared Goff", "Jahmyr Gibbs", "Jameson Williams", "Isaac TeSlaa", "Sam LaPorta"], "GB": ["Jordan Love", "Josh Jacobs", "Christian Watson", "Matthew Golden", "Tucker Kraft"], "MIN": ["Kyler Murray", "Aaron Jones", "Justin Jefferson", "Jordan Addison", "T.J. Hockenson"], "ATL": ["Michael Penix Jr.", "Bijan Robinson", "Drake London", "Jahan Dotson", "Kyle Pitts"], "CAR": ["Bryce Young", "Chuba Hubbard", "Tetairoa McMillan", "Brycen Tremayne", "Darren Waller"], "NO": ["Tyler Shough", "Kendre Miller", "Chris Olave", "Bryce Lance", "Juwan Johnson"], "TB": ["Baker Mayfield", "Bucky Irving", "Tez Johnson", "Ted Hurst III", "Cade Otton"], "ARI": ["Jacoby Brissett", "Jeremiyah Love", "Michael Wilson", "Kendrick Bourne", "Trey McBride"], "LAR": ["Matthew Stafford", "Kyren Williams", "Puka Nacua", "Konata Mumpfield", "Tyler Higbee"], "SF": ["Brock Purdy", "Christian McCaffrey", "Brandin Cooks", "Jordan Watkins", "George Kittle"], "SEA": ["Sam Darnold", "Jadarian Price", "Jaxon Smith-Njigba", "Rashid Shaheed", "AJ Barner"]};
const SLOT_IX={QB:0,RB1:1,WR1:2,WR2:3,TE1:4};
function buildDemo(){
  const R=rng(20261031), g=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
  const pois=l=>{const L=Math.exp(-Math.max(l,0.01));let k=0,p=1;do{k++;p*=R()}while(p>L);return k-1};
  const off={},def={},pdef={},tal={};
  // anchor demo ratings to real market-implied team totals where available
  const imp={};SLATE.forEach(gm=>{const L=LINES[gm.id];if(!L)return;imp[gm.home]=[(L.tot-L.sp)/2,(L.tot+L.sp)/2];imp[gm.away]=[(L.tot+L.sp)/2,(L.tot-L.sp)/2]});
  TEAM_IDS.forEach(t=>{const[,w,l]=TEAMS[t];const wp=(w+0.5)/(w+l+1);const r=(wp-.5)*1.4+g()*.3;
    if(imp[t]){off[t]=(imp[t][0]-22.5)/12+g()*.12;def[t]=(22.5-imp[t][1])/12+g()*.12}else{off[t]=r*.6+g()*.3;def[t]=r*.6+g()*.3}
    pdef[t]={};POS.forEach(p=>pdef[t][p]=Math.min(1.35,Math.max(.7,1-.11*def[t]+g()*.09)))});
  const roster={QB:["QB"],RB:["RB1"],WR:["WR1","WR2"],TE:["TE1"]};
  const players=[];TEAM_IDS.forEach(t=>POS.forEach(p=>roster[p].forEach(slot=>{const name=STARTERS[t]?STARTERS[t][SLOT_IX[slot]]:t+" "+slot;tal[name]=1+g()*.16+off[t]*.08;players.push({name,team:t,pos:p,slot})})));
  const teamLogs=[],playerLogs=[];
  function playGame(season,week,a,b){ // a home
    const pa=Math.max(0,Math.round(22.5+1.2+6*off[a]-6*def[b]+g()*8.5)), pb=Math.max(0,Math.round(22.5-1.2+6*off[b]-6*def[a]+g()*8.5));
    teamLogs.push({team:a,season,week,opp:b,home:1,pf:pa,pa:pb});teamLogs.push({team:b,season,week,opp:a,home:0,pf:pb,pa:pa});
    [[a,b,1],[b,a,0]].forEach(([t,o,h])=>players.filter(p=>p.team===t).forEach(p=>{
      const m=pdef[o][p.pos]*tal[p.name], s={player:p.name,team:t,pos:p.pos,season,week,opp:o,home:h};
      STAT_COLS.forEach(c=>s[c]=0);
      if(p.pos==="QB"){s.passYds=Math.max(70,Math.round(232*m+g()*58));s.comp=Math.max(8,Math.round(s.passYds/11.3+g()*2.2));s.passTD=pois(1.5*m);s.int=pois(.7/m);s.rushAtt=Math.max(0,Math.round(3.5+g()*2));s.rushYds=Math.max(-2,Math.round(15*tal[p.name]+g()*11));s.rushTD=pois(.1)}
      else if(p.pos==="RB"){s.rushAtt=Math.max(5,Math.round(15*tal[p.name]+g()*4));s.rushYds=Math.max(0,Math.round(s.rushAtt*4.25*m+g()*17));s.rushTD=pois(.48*m);s.rec=pois(2.8*m);s.recYds=Math.max(0,Math.round(s.rec*7.6+g()*6));s.recTD=pois(.1*m)}
      else{const base=p.slot==="WR1"?[5.6,12.6,.45]:p.slot==="WR2"?[4.1,11.6,.3]:[3.9,10.4,.3];s.rec=pois(base[0]*m);s.recYds=Math.max(0,Math.round(s.rec*base[1]+g()*14*(s.rec?1:0)));s.recTD=pois(base[2]*m)}
      playerLogs.push(s)}));
  }
  function roundRobin(season,weeks){weeks.forEach(w=>{const ts=[...TEAM_IDS].sort(()=>R()-.5);for(let i=0;i<ts.length;i+=2)playGame(season,w,ts[i],ts[i+1])})}
  roundRobin(2026,[1,2,3,4,5,6,7]);
  // historical meetings for every slate pair
  SLATE.forEach(gm=>{[[2022,6],[2023,11],[2024,4],[2025,8]].forEach(([s,w],i)=>{if(R()<.85)playGame(s,w+Math.floor(R()*2),i%2?gm.home:gm.away,i%2?gm.away:gm.home)})});
  // centre sample logs on real book lines so sample numbers stay plausible for that player
  Object.entries(REAL_PROPS).forEach(([key,v])=>{const [name,k]=key.split("|");if(k==="anyTD")return;
    if(k==="rushRec"){const L=playerLogs.filter(l=>l.player===name&&l.season===CUR);if(!L.length)return;const m=L.reduce((s,l)=>s+l.rushYds+l.recYds,0)/L.length;const f=m?(v[0]+(R()-.5)*v[0]*.08)/m:1;L.forEach(l=>{l.rushYds=Math.round(l.rushYds*f);l.recYds=Math.round(l.recYds*f)});return}
    const L=playerLogs.filter(l=>l.player===name&&l.season===CUR);if(!L.length)return;const m=L.reduce((s,l)=>s+(+l[k]||0),0)/L.length;
    const target=v[0]+(R()-.5)*(MARKETS[k].cnt?.5:v[0]*.08);if(!m){L.forEach(l=>l[k]=Math.max(0,Math.round(target+g()*(MARKETS[k].cnt?1:target*.3))));return}
    const f=target/m;L.forEach(l=>{l[k]=Math.max(0,MARKETS[k].cnt?Math.round(l[k]*f+(R()-.5)*.6):Math.round(l[k]*f))})});
  return {teamLogs,playerLogs};
}

/* ============================================================
   STATE
   ============================================================ */
const LS={get(k,d){try{const v=localStorage.getItem("ge_"+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("ge_"+k,JSON.stringify(v))}catch(e){}}};
const DEMO={teamLogs:[],playerLogs:[]};
// real team logs from CBS results
RESULTS.forEach(([w,a,ap,h,hp])=>{DEMO.teamLogs.push({team:a,season:2026,week:w,opp:h,home:0,pf:ap,pa:hp});DEMO.teamLogs.push({team:h,season:2026,week:w,opp:a,home:1,pf:hp,pa:ap})});
// null = stat missing from source
REAL_LOGS.forEach(l=>{if(l.player==="Trevor Lawrence"&&l.week===6){l.rushAtt=3;l.rushYds=11}});
REAL_LOGS.forEach(l=>{const q=typeof QB_ATT!=="undefined"&&QB_ATT[l.player];if(q&&l.passAtt==null&&q[l.week]!=null)l.passAtt=q[l.week]});
DEMO.playerLogs=REAL_LOGS;
const S={
  teamLogs:LS.get("teamLogs",null)||DEMO.teamLogs, playerLogs:LS.get("playerLogs",null)||DEMO.playerLogs,
  src:{team:LS.get("teamLogs",null)?"imp":"real",player:LS.get("playerLogs",null)?"imp":"real"},
  lines:LS.get("lines",{}), odds:LS.get("odds",{}), probs:LS.get("probs",{}), totals:LS.get("totals",{}),
  prop:{player:null,market:null}, gameTab:"proj"
};
function saveUser(){LS.set("lines",S.lines);LS.set("odds",S.odds);LS.set("probs",S.probs);LS.set("totals",S.totals)}

/* ============================================================
   HELPERS
   ============================================================ */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const avg=a=>{a=a.filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:0};
const sd=a=>{if(a.length<2)return 0;const m=avg(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))};
const fmt=(x,d=1)=>Number.isFinite(x)?x.toFixed(d):"—";
const pct=x=>Number.isFinite(x)?Math.round(x*100)+"%":"—";
const sortKey=l=>l.season*100+l.week;
function stat(l,k){if(k==="anyTD")return (l.rushTD||0)+(l.recTD||0);if(k==="rushRec")return (l.rushYds==null||l.recYds==null)?NaN:(l.rushYds||0)+(l.recYds||0);if(l[k]===null)return NaN;return +l[k]||0}
function srcTag(kind){const s=S.src[kind];return s==="imp"?'<span class="tag imp">Imported</span>':'<span class="tag real">CBS Sports</span>'}
const realTag='<span class="tag real">Live feed</span>';
// odds
function amToProb(a){a=+a;if(!a)return NaN;return a<0?-a/(-a+100):100/(a+100)}
function probToAm(p){if(!(p>0&&p<1))return "—";const v=p>=.5?-100*p/(1-p):100*(1-p)/p;return oddsFmt(Math.round(v))}
function profit(a){a=+a;return a>0?a:10000/-a}
function ev(p,a){if(!a||!Number.isFinite(p))return NaN;return p*profit(a)-(1-p)*100}
function normCdf(x){const t=1/(1+.2316419*Math.abs(x));const d=.3989423*Math.exp(-x*x/2);let p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-p:p}
function poisCdf(k,l){let s=0,t=Math.exp(-l);for(let i=0;i<=k;i++){s+=t;t*=l/(i+1)}return s}
function teamGames(t,season=CUR){return S.teamLogs.filter(l=>l.team===t&&(season==null||l.season===season)).sort((a,b)=>sortKey(a)-sortKey(b))}
const SLOT_POS={QB:"QB",RB1:"RB",WR1:"WR",WR2:"WR",TE1:"TE"};
const PINFO={};Object.entries(STARTERS).forEach(([t,arr])=>Object.entries(SLOT_IX).forEach(([slot,i])=>{PINFO[arr[i]]={name:arr[i],team:t,pos:SLOT_POS[slot]}}));

// Extra players tracked beyond the starter list (prop-line players from past weeks)
[["Chris Godwin Jr.","TB","WR"],["Keon Coleman","BUF","WR"],["Samaje Perine","CIN","RB"],["Dylan Sampson","CLE","RB"],["Darnell Washington","PIT","TE"],["Blake Corum","LAR","RB"],
 ["Eli Raridon","NE","TE"],["Dyami Brown","WAS","WR"],["Cooper Kupp","SEA","WR"],["Zay Flowers","BAL","WR"],["Omar Cooper Jr.","NYJ","WR"],["Chris Rodriguez Jr.","JAX","RB"],["Seth McGowan","IND","RB"],["Parker Washington","JAX","WR"],["Lamar Jackson","BAL","QB"]].forEach(([n,t,p])=>PINFO[n]={name:n,team:t,pos:p});


// ---- Extra prop batch (empty for Week 9 so far) ----
(function(){const N={};for(const k in N)if(!REAL_PROPS[k])REAL_PROPS[k]=N[k];})();
[["Baker Mayfield","TB","QB"],["Colston Loveland","CHI","TE"],["AJ Barner","SEA","TE"],["Kirk Cousins","LV","QB"],["Mike Washington Jr.","LV","RB"],["George Pickens","DAL","WR"],["KC Concepcion","CLE","WR"],["Denzel Boston","CLE","WR"]].forEach(([n,t,p])=>{if(!PINFO[n])PINFO[n]={name:n,team:t,pos:p}});
// ---- Extra prop batch (empty for Week 9 so far) ----
(function(){const N={};for(const k in N)if(!REAL_PROPS[k])REAL_PROPS[k]=N[k];})();
[["Jeremy McNichols","WAS","RB"],["Makai Lemon","PHI","WR"],["Stefon Diggs","WAS","WR"],["Ladd McConkey","LAC","WR"],["Amon-Ra St. Brown","DET","WR"],["Jordan Mason","MIN","RB"],["Jauan Jennings","MIN","WR"],["Luther Burden III","CHI","WR"],["Rome Odunze","CHI","WR"],["Matthew Stafford","LAR","QB"],["A.J. Brown","NE","WR"],["Jonathan Taylor","IND","RB"],["Daniel Jones","IND","QB"],["Isaac TeSlaa","DET","WR"],["Mason Taylor","NYJ","TE"],["Jordan Addison","MIN","WR"],["Aaron Jones","MIN","RB"]].forEach(([n,t,p])=>{if(!PINFO[n])PINFO[n]={name:n,team:t,pos:p}});
// (Week 8 extra prop batches removed when the site rolled to Week 9.)
function realPropPlayers(){const m=new Map();Object.keys(REAL_PROPS).forEach(key=>{const n=key.split("|")[0];if(PINFO[n])m.set(n,PINFO[n])});S.playerLogs.forEach(l=>{if(!m.has(l.player))m.set(l.player,{name:l.player,team:l.team,pos:l.pos})});return [...m.values()]}
function playersOf(t){return realPropPlayers().filter(p=>p.team===t)}
function playersOfOld(t){const m=new Map();S.playerLogs.forEach(l=>{if(l.team===t&&!m.has(l.player))m.set(l.player,{name:l.player,team:t,pos:l.pos})});return [...m.values()].sort((a,b)=>POS.indexOf(a.pos)-POS.indexOf(b.pos)||a.name.localeCompare(b.name))}
function allPlayers(){return realPropPlayers()}
/* memoised per player; rebuilt automatically if the log array is replaced or grows */
let PL_IDX=null,PL_SRC=null,PL_LEN=0;
function pLogs(name){if(PL_SRC!==S.playerLogs||PL_LEN!==S.playerLogs.length){PL_IDX=new Map();for(const l of S.playerLogs){let a=PL_IDX.get(l.player);if(!a)PL_IDX.set(l.player,a=[]);a.push(l)}for(const a of PL_IDX.values())a.sort((x,y)=>sortKey(x)-sortKey(y));PL_SRC=S.playerLogs;PL_LEN=S.playerLogs.length}
  return (PL_IDX.get(name)||[]).slice()}
function marketsFor(pos){return Object.keys(MARKETS).filter(k=>MARKETS[k].pos.includes(pos))}
function nflDone(g){if(g.final)return true;const L=typeof LIVE!=="undefined"&&LIVE.nfl&&LIVE.nfl[g.away+"@"+g.home];if(L&&L.st==="post")return true;
  /* a leftover game from an earlier week whose date has passed (e.g. last Monday night once it's over) */
  if(g.wk&&typeof PLAYS_WEEK!=="undefined"&&g.wk<PLAYS_WEEK&&typeof nflDate!=="undefined"&&typeof etNow!=="undefined"){const d=nflDate(g);if(d&&etNow().d>d)return true}return false}
function oppOf(team){const g=SLATE.find(g=>!nflDone(g)&&(g.home===team||g.away===team));return g?(g.home===team?{opp:g.away,home:1,g}:{opp:g.home,home:0,g}):null}

/* ---------- Defense vs position ---------- */
const dvpCache={};
function dvpVal(row,cols,k){const g=c=>{const i=cols.indexOf(c);return i<0?NaN:row[i]};
  if(k==="anyTD")return (g("rushTD")||0)+(g("recTD")||0);if(k==="rushRec")return (g("rushYds")||0)+(g("recYds")||0);return g(k)}
function dvpTable(pos,k){
  const key=pos+k; if(dvpCache[key])return dvpCache[key];
  const D=DVP_RAW[pos];const rows=TEAM_IDS.map(t=>({team:t,avg:D&&D.rows[t]?dvpVal(D.rows[t],D.cols,k):NaN,games:1}));
  const ok=rows.filter(r=>Number.isFinite(r.avg));const lg=avg(ok.map(r=>r.avg));
  [...ok].sort((a,b)=>b.avg-a.avg).forEach((r,i)=>r.rank=i+1);
  rows.forEach(r=>r.factor=lg&&Number.isFinite(r.avg)?r.avg/lg:1);
  return dvpCache[key]={rows,lg};
}
function dvpFor(team,pos,k){return dvpTable(pos,k).rows.find(r=>r.team===team)||{avg:NaN,factor:1,rank:NaN}}

/* ---------- Projections ---------- */
function teamProfile(t){const g=teamGames(t);const all=g;
  return{pf:avg(all.map(x=>x.pf)),pa:avg(all.map(x=>x.pa)),pf5:avg(g.slice(-5).map(x=>x.pf)),pa5:avg(g.slice(-5).map(x=>x.pa)),n:g.length}}
const LG_PTS=()=>avg(S.teamLogs.filter(l=>l.season===CUR).map(l=>l.pf))||22;
function projectGame(g){
  const A=teamProfile(g.away),H=teamProfile(g.home),lg=LG_PTS();
  const blend=(p)=>({pf:p.pf*.55+p.pf5*.45,pa:p.pa*.55+p.pa5*.45});
  const a=blend(A),h=blend(H);
  let shp=lg+(h.pf-lg)+(a.pa-lg)+1.2, sap=lg+(a.pf-lg)+(h.pa-lg)-1.2; // home field ≈ 2.4 pts
  shp=Math.max(6,shp);sap=Math.max(6,sap);
  // blend 50/50 with market-implied team totals (from spread + total)
  const L=LINES[g.id];let hp=shp,ap=sap,mh=null,ma=null;
  if(L){mh=(L.tot-L.sp)/2;ma=(L.tot+L.sp)/2;hp=(shp+mh)/2;ap=(sap+ma)/2}
  const spread=hp-ap, total=hp+ap, modelHomeWp=normCdf(spread/13.5);
  return{hp,ap,spread,total,modelHomeWp,shp,sap,mh,ma};
}
function noVig(g){const L=LINES[g.id];if(!L)return null;const a=amToProb(L.ml[0]),h=amToProb(L.ml[1]);return h/(a+h)}
function homeWp(g){if(S.probs[g.id]!=null&&S.probs[g.id]!=="")return S.probs[g.id]/100;if(g.wp!=null)return g.wp/100;const nv=noVig(g);if(nv!=null)return nv;return projectGame(g).modelHomeWp}
function wpSource(g){if(S.probs[g.id]!=null&&S.probs[g.id]!=="")return"Your input";if(g.wp!=null)return"Feed";if(noVig(g)!=null)return"Market, no-vig";return"Model"}
function defaultLine(name,k){const L=pLogs(name).filter(l=>l.season===CUR);if(k==="anyTD")return .5;const a=avg(L.map(l=>stat(l,k)));return Math.floor(a)+.5}
function lineFor(name,k){const v=S.lines[name+"|"+k];if(v!=null&&v!=="")return +v;const r=REAL_PROPS[name+"|"+k];return r?r[0]:defaultLine(name,k)}
function realProp(name,k){return REAL_PROPS[name+"|"+k]||null}
function projectProp(name,k,opp){
  const logs=pLogs(name);const cur=logs.filter(l=>l.season===CUR);const vals=logs.map(l=>stat(l,k));
  const cv=cur.map(l=>stat(l,k)).filter(Number.isFinite);
  const l5=avg(cv.slice(-5)),ss=avg(cv);const info=PINFO[name]||{};
  const pos=logs.length?logs[logs.length-1].pos:(info.pos||"WR");
  const rp=realProp(name,k);const noLogs=!cv.length;
  let base=cv.length?(l5*.5+ss*.5):(rp?(k==="anyTD"&&rp[1]!=null?-Math.log(1-Math.min(.95,amToProb(rp[1])*.95)):rp[0]):NaN);
  const d=opp?dvpFor(opp,pos==="WR"?"WR":pos,k==="anyTD"?"anyTD":k):{factor:1};
  // WR room is shared by 2 players, factor is ratio so it still applies
  const adj=1+((d.factor||1)-1)*.5; const proj=base*adj;
  const line=lineFor(name,k); let pOver;
  if(MARKETS[k].cnt){pOver=1-poisCdf(Math.floor(line),Math.max(proj,.01))}
  else{const s=Math.max(cv.length>2?sd(cv):proj*.3,proj*.18,3);pOver=1-normCdf((line-proj)/s)}
  pOver=Math.min(.92,Math.max(.08,pOver));
  return{proj,pOver,line,dvp:d,pos,noLogs};
}
function hitRate(vals,line){vals=vals.filter(Number.isFinite);if(!vals.length)return{o:NaN,u:NaN,n:0};const o=vals.filter(v=>v>line).length,u=vals.filter(v=>v<line).length;return{o:o/vals.length,u:u/vals.length,n:vals.length,oc:o}}

/* ---------- Lines & public splits ---------- */
function spTxt(g){const L=LINES[g.id];if(!L)return"—";if(L.sp===0)return"PK";return L.sp<0?`${g.home} ${L.sp}`:`${g.away} ${-L.sp}`}
/* odds display format: "am" (American) or "dec" (decimal); per-viewer, remembered in the browser */
var ODDS_FMT=(function(){try{return localStorage.getItem("rla_odds")==="dec"?"dec":"am"}catch(e){return "am"}})();
function setOddsFmt(f){ODDS_FMT=f==="dec"?"dec":"am";try{localStorage.setItem("rla_odds",ODDS_FMT)}catch(e){}}
function oddsFmt(a){a=+a;if(!Number.isFinite(a)||a===0)return "—";if(ODDS_FMT==="dec"){const d=a>0?1+a/100:1+100/(-a);return d.toFixed(2)}return (a>0?"+":"−")+Math.abs(Math.round(a))}
function amTxt(a){return a==null?"—":oddsFmt(a)}
function bookTotal(g){return S.totals[g.id]!=null&&S.totals[g.id]!==""?+S.totals[g.id]:(LINES[g.id]?LINES[g.id].tot:Math.round(projectGame(g).total*2)/2)}
function bookML(g){const u=S.odds[g.id]||{},L=LINES[g.id]||{ml:[]};return{a:u.a!=null?u.a:L.ml[0],h:u.h!=null?u.h:L.ml[1]}}
function bookSpread(g){return S.odds["sp"+g.id]!=null&&S.odds["sp"+g.id]!==""?+S.odds["sp"+g.id]:(LINES[g.id]?LINES[g.id].sp:0)}
// v = [bets, money] for side A (away / over)
function splitBlock(title,v,aLab,bLab,extra){
  if(!v)return `<div class="split"><div class="row"><b>${title}</b><span class="sp"></span><span class="note">not published</span></div></div>`;
  const [b,m]=v,diff=m-b;
  const bar=(lab,x)=>`<div class="sbar"><span class="sl">${lab}</span><div class="strk"><div style="width:${x}%;background:#3987e5"></div><div style="width:${100-x}%;background:#e8913a"></div></div><span class="mono sv">${x}% · ${100-x}%</span></div>`;
  let sig="";if(Math.abs(diff)>=10){const side=diff>0?aLab:bLab;sig=`<div class="sig">💰 Money-heavy side: <b>${side}</b> — ${Math.abs(diff)} pts more of the money than of the tickets (bigger bettors)</div>`}
  const pub=m>=50?aLab:bLab,pm=Math.max(m,100-m);
  return `<div class="split"><div class="row"><b>${title}</b><span class="sp"></span><span class="note">${extra||""}</span></div>
   <div class="legend" style="margin:6px 0 4px"><span><i style="background:#3987e5"></i>${aLab}</span><span><i style="background:#e8913a"></i>${bLab}</span></div>
   ${bar("Bets",b)}${bar("Money",m)}<div class="note" style="margin-top:4px">Most money: <b style="color:var(--text)">${pub} ${pm}%</b></div>${sig}</div>`;
}
const splitTag=`<span class="tag real">Real · Nov 2</span>`;
function splitsSrc(g){return `Lines: DraftKings via ESPN (Nov 2). Lines move until kickoff — recheck before betting.`}

/* ---------- Charts ---------- */
const charts={};
/* Chart.js loads in the background (not render-blocking); charts asked for before it arrives are queued */
const CH_Q={};let CH_LOADING=false;
function chartSetup(){try{Chart.defaults.color="#c3c2b7";Chart.defaults.font.family="Inter";Chart.defaults.borderColor="#26292e"}catch(e){}}
function loadChart(){if(window.Chart||CH_LOADING)return;CH_LOADING=true;const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";sc.async=true;
  sc.onload=()=>{chartSetup();for(const id of Object.keys(CH_Q)){const c=CH_Q[id];delete CH_Q[id];mk(id,c)}};sc.onerror=()=>{CH_LOADING=false};document.head.appendChild(sc)}
if(window.Chart)chartSetup();else window.addEventListener("load",()=>setTimeout(loadChart,1200));
function mk(id,cfg){if(!window.Chart){CH_Q[id]=cfg;loadChart();return}if(charts[id])charts[id].destroy();const el=document.getElementById(id);if(!el)return;charts[id]=new Chart(el,cfg)}
const baseOpts=(extra={})=>Object.assign({responsive:true,maintainAspectRatio:false,animation:{duration:250},interaction:{mode:"index",intersect:false},
  plugins:{legend:{display:false},tooltip:{backgroundColor:"#2b2b28",borderColor:"#44443f",borderWidth:1,padding:10,titleFont:{weight:"600"}}},
  scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:"#2a2a27"},ticks:{font:{size:11}},beginAtZero:true}}},extra);
function barVsLine(id,labels,vals,line,tipExtra){
  const col=vals.map(v=>v>line?"#0ca30c":v<line?"#e5484d":"#8d8c84");
  mk(id,{type:"bar",data:{labels,datasets:[
    {type:"line",label:"Line "+line,data:labels.map(()=>line),borderColor:"#fab219",borderWidth:2,borderDash:[6,4],pointRadius:0,order:0},
    {label:"Result",data:vals,backgroundColor:col,borderRadius:4,borderSkipped:"bottom",maxBarThickness:38,order:1}]},
    options:baseOpts({plugins:{legend:{display:false},tooltip:Object.assign({},baseOpts().plugins.tooltip,{callbacks:{afterBody:(it)=>{const i=it[0].dataIndex;return tipExtra?tipExtra(i):""}}})}})});
}

