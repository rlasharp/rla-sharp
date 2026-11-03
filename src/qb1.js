
/* ---------- Starting QB (QB1) missed games, 2026 Weeks 1-8 ----------
   out:  weeks QB1 did not play
   left: weeks QB1 left early (1st quarter / a handful of throws) — counted as "without QB1"
   sub:  who started instead (when known)
   now:  QB1 status for Week 9
   Sources: ESPN game logs + injury reports (SI, CBS Sports, Fox Sports) */
const QB1_STATUS={
  SEA:{qb:"Sam Darnold",out:[2],left:[1],sub:"Drew Lock",now:"Playing"},
  MIN:{qb:"Kyler Murray",out:[2],left:[1],sub:"Carson Wentz",now:"Questionable — hamstring (ESPN injury report, Nov 2)"},
  ATL:{qb:"Michael Penix Jr.",out:[1,2],sub:"Cooper Rush",now:"Playing"},
  BAL:{qb:"Lamar Jackson",out:[5,6,7],left:[8],sub:"Tyler Huntley",now:"Out — right thumb surgery, going on injured reserve (Ravens, Nov 1). Week 9 starter not yet named; Huntley (toe) and rookie Joe Fagnano finished Week 8"},
  CHI:{qb:"Caleb Williams",out:[3,4,5],sub:"",now:"Playing"},
  TB:{qb:"Baker Mayfield",out:[4,5,6],sub:"Jalon Daniels",now:"Playing (protective glove on throwing hand)"},
  WAS:{qb:"Jayden Daniels",out:[3,4],sub:"Marcus Mariota",now:"Playing"},
  PHI:{qb:"Jalen Hurts",out:[6,7],sub:"Tanner McKee",now:"On injured reserve — out"},
  NYG:{qb:"Jaxson Dart",out:[3,4,5,6,7],left:[2],sub:"Jake Haener",now:"On injured reserve — out"},
};
const QB1_MARKETS=["rec","recYds","anyTD"];
function qb1Miss(team){const q=QB1_STATUS[team];return q?[...q.out,...(q.left||[])]:[]}
function qb1Applies(pl,k){return QB1_STATUS[pl.team]&&["WR","TE","RB"].includes(pl.pos)&&QB1_MARKETS.includes(k)&&pl.name!==QB1_STATUS[pl.team].qb}

/* Weeks a player's team played but he has no stat line.
   Default label = "Did not play" (injury / inactive — confirmed against ESPN season totals).
   Exceptions below: he played but a per-game line isn't published in our sources. */
const LOG_NOTES={
  "Aaron Jones":{7:"Played — left in 4th quarter (knee); box score line not found"},
  "Darius Cooper":{1:"Played — Wks 1–2 combined: 2 rec, 26 yds, 1 TD (split not published)",2:"Played — see Week 1 note"},
};
function teamWeeks(team){return RESULTS.filter(r=>r[0]<=8&&(r[1]===team||r[3]===team)).map(r=>({w:r[0],home:r[3]===team,opp:r[3]===team?r[1]:r[3]}))}

/* Pass attempts by week (ESPN game logs) for QBs whose original logs had completions only */
const QB_ATT={
  "Josh Allen":{1:29,2:31,3:26,4:33,5:19,6:33},
  "Patrick Mahomes":{1:27,2:47,3:24,4:30,6:30,7:33},
  "Joe Burrow":{1:35,2:31,3:37,4:54,5:32,7:30},
  "Drake Maye":{1:33,2:22,3:25,4:37,5:34,6:32,7:31},
  "Jared Goff":{1:39,2:38,3:32,4:52,5:30,7:32},
  "Dak Prescott":{1:34,2:31,3:40,4:45,5:42,6:54,7:27},
  "Geno Smith":{1:24,2:41,3:37,4:15,5:30,6:30,7:30},
  "Jacoby Brissett":{1:37,2:28,3:52,4:35,5:47,6:35,7:48},
  "Justin Herbert":{1:27,2:27,3:34,5:24},
  "Trevor Lawrence":{1:23,2:29,3:29,5:39,6:41},
  "Lamar Jackson":{1:25,2:31,3:20,4:20},
  "Michael Penix Jr.":{3:25,4:20,5:32,6:33,7:34},
  "Aaron Rodgers":{1:40,2:39,3:34,4:40,5:31,6:49,7:30},
};
