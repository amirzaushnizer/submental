const RULES = [
 {id:'clarification',label:'Clarification cues',short:'Clarification',pattern:/\b(say again|repeat|confirm|verify|give us a reading|take it again)\b|\?/i,description:'A question mark or an explicit request to repeat, confirm, verify or explain. Questions can be good safety behavior.'},
 {id:'equipment',label:'Equipment-alert mentions',short:'Equipment alerts',pattern:/\bprogram alarms?\b|\b120[12]\b/i,description:'Mentions of a program alarm, 1201 or 1202. These are spacecraft computer alarms, not diagnoses of the astronaut.'},
 {id:'hold',label:'Radio hold cues',short:'Radio holds',pattern:/\b(stand by|standby|busy for a minute|hold on|hold off)\b/i,description:'Explicit hold language. It may be part of a normal procedure, not a need for a personal break.'},
 {id:'pressure',label:'Explicit task pressure',short:'Task pressure',pattern:/\bbusy (?:for a minute|worrying)\b/i,description:'An explicit statement about being busy. This is a narrow language cue, not a fatigue or overload measurement.'}
];
function labelsFor(row){return row.speaker==='CDR'?RULES.filter(r=>r.pattern.test(row.text)).map(r=>r.id):[];}
function dayMinute(row){return Number(row.utc.slice(11,13))*60+Number(row.utc.slice(14,16))+Number(row.utc.slice(17,19))/60;}
function analyzeDay(data,{until=1440,start=0,end=1440,filter='all'}={}){
 const context=data.utterances.filter(r=>dayMinute(r)>=start&&dayMinute(r)<end&&dayMinute(r)<=until);
 const astronaut=context.filter(r=>r.speaker===data.targetSpeaker);
 const counts=Object.fromEntries(RULES.map(rule=>[rule.id,astronaut.filter(r=>labelsFor(r).includes(rule.id)).length]));
 const hourly=Array.from({length:24},(_,hour)=>({hour,count:astronaut.filter(r=>Math.floor(dayMinute(r)/60)===hour).length}));
 const evidence=astronaut.filter(r=>filter==='all'||labelsFor(r).includes(filter));
 return {context,astronaut,counts,hourly,evidence,flagged:astronaut.filter(r=>labelsFor(r).length),words:astronaut.reduce((sum,r)=>sum+r.text.trim().split(/\s+/).length,0)};
}
module.exports={RULES,labelsFor,dayMinute,analyzeDay};
