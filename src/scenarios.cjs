const DAYS=[
 {date:'1969-07-18',title:'Outbound flight',shortDate:'18 July',missionDay:3,focus:'Lunar module checks and the journey to the Moon',scenario:'Steady work',color:'green',peaks:[{hour:16.5,hr:15,bp:13,tension:2},{hour:21.8,hr:12,bp:10,tension:1.5}],baselineHr:62,baselineBp:111,baselineTension:2,visual:[
  {time:'09:00',appearance:'Neil sits upright with an even posture. His gaze moves between the checklist and cabin instruments.',reading:'A steady-focus scene for the demo. This does not establish his mood.'},
  {time:'16:30',appearance:'His brow draws together while he checks the procedure. He pauses, rereads a line and points toward an instrument.',reading:'Fits a brief task-demand increase in this scenario; it is not evidence of a mental health condition.'},
  {time:'22:00',appearance:'He shifts his shoulders, loosens his hands and looks up from the checklist between tasks.',reading:'Illustrates a small release of tension after focused work. A personal check-in would add the missing context.'}
 ]},
 {date:'1969-07-20',title:'Landing day',shortDate:'20 July',missionDay:5,focus:'Preparation, landing and technical follow-up',scenario:'High task demand',color:'amber',peaks:[{hour:14.7,hr:24,bp:19,tension:3},{hour:20.2,hr:55,bp:34,tension:6},{hour:21.3,hr:24,bp:19,tension:3},{hour:23.7,hr:19,bp:13,tension:2}],baselineHr:64,baselineBp:112,baselineTension:2,visual:[
  {time:'14:30',appearance:'Neil keeps his eyes on the checklist and instruments. His shoulders are raised and his movements are deliberate.',reading:'Illustrates concentrated work during preparation, not an observed historical camera assessment.'},
  {time:'20:15',appearance:'His gaze stays fixed on the controls. His jaw is set, he leans forward and his head movements become brief and purposeful.',reading:'A generated high-demand scene aligned with the landing scenario. Appearance alone cannot tell us how he feels.'},
  {time:'21:00',appearance:'He leans back slightly, releases his grip and turns toward the window before returning to the checklist.',reading:'Illustrates an easing moment after the critical phase. It does not prove recovery is complete.'},
  {time:'23:30',appearance:'He rubs one eye, adjusts his posture and briefly pauses before the next checklist item.',reading:'Could prompt a gentle check-in in the demo. It does not diagnose fatigue.'}
 ]},
 {date:'1969-07-22',title:'Homeward bound',shortDate:'22 July',missionDay:7,focus:'Return-journey operations and time to reset',scenario:'Mixed work and recovery',color:'cyan',peaks:[{hour:5.2,hr:31,bp:25,tension:3},{hour:21.9,hr:29,bp:23,tension:3}],baselineHr:61,baselineBp:110,baselineTension:2,visual:[
  {time:'05:00',appearance:'Neil watches the instruments closely with an upright posture and short, deliberate movements.',reading:'A generated focused-operation scene. Focused appearance is not a measure of distress.'},
  {time:'12:00',appearance:'His shoulders are lower and his hands rest loosely. He looks away from the checklist during a quiet interval.',reading:'Illustrates a calmer interval in the recovery scenario, not a historical observation or proof of sleep quality.'},
  {time:'22:00',appearance:'He leans toward the instrument panel and revisits a checklist item, then turns to speak with a crewmate.',reading:'Illustrates renewed task effort and seeking coordination around a technical issue.'}
 ]}
];
function signalAtHour(day,hour){
 const i=hour*2,wave=(t,center)=>Math.exp(-((t-center)**2)/.5);
 let hr=day.baselineHr+Math.sin(i*.8)*3,bp=day.baselineBp+Math.sin(i*.6)*3,tension=day.baselineTension;
 for(const peak of day.peaks){const weight=wave(hour,peak.hour);hr+=peak.hr*weight;bp+=peak.bp*weight;tension+=peak.tension*weight;}
 return {hour,hr:Math.round(hr),systolic:Math.round(bp),diastolic:Math.round(70+(bp-day.baselineBp)*.46+Math.sin(i*.5)*2),tension:Math.min(10,Math.round(tension*10)/10)};
}
function simulatedSignals(day){return Array.from({length:48},(_,i)=>({...signalAtHour(day,i/2),time:`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`}));}
function signalsAtTurn(day,row){
 const utc=new Date(row.utc);
 if(!Number.isFinite(utc.getTime())||row.utc.slice(0,10)!==day.date)throw new Error('Turn timestamp must belong to the selected mission day');
 const hour=utc.getUTCHours()+utc.getUTCMinutes()/60+utc.getUTCSeconds()/3600;
 return {...signalAtHour(day,hour),time:row.utc.slice(11,19)};
}
const BASELINE={kind:'simulated',demand:[10,20],effort:[0,2],coordination:[0,1],pressure:[0,1],support:[75,100]};
const METRICS=[{id:'demand',name:'Communication demand',unit:'request / decision episodes',description:'Voiced requests, decisions and actionable issues; follow-up turns are grouped.'},{id:'effort',name:'Effort to understand',unit:'repeat / correction episodes',description:'Actual repeats, restatements or corrections. Ordinary questions are not automatically a difficulty.'},{id:'coordination',name:'Coordination strain',unit:'coordination snags',description:'Operational mismatches or relay problems. This does not establish interpersonal conflict.'},{id:'pressure',name:'Expressed pressure',unit:'explicit pressure statements',description:'Neil explicitly describes being busy, needing a pause or having divided attention.'},{id:'support',name:'Team support',unit:'captured help exchanges',description:'A concrete issue or help request has a captured ground or crew response. A reply does not prove resolution.'}];
function metricSummary(run){return METRICS.map(metric=>{const count=run.analysis.metrics[metric.id].length;const baseline=BASELINE[metric.id];return {...metric,count,baseline,status:metric.id==='support'?(count?'Support captured':'No clear exchange'):(count>baseline[1]?'Above usual':count<baseline[0]?'Below example range':'Within usual'),color:metric.id==='support'?'green':count>baseline[1]?'amber':'cyan'};});}
module.exports={DAYS,BASELINE,METRICS,simulatedSignals,signalsAtTurn,metricSummary};
