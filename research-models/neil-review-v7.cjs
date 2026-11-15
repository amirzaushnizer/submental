function reviewNeilDay(data,review){
 if(data.date!==review.date||data.targetSpeaker!==review.targetSpeaker)throw new Error('The review does not match this astronaut day.');
 const index=new Map(data.utterances.map(row=>[`${row.speaker}/${row.get}`,row]));
 const rows=data.utterances.filter(row=>row.speaker===data.targetSpeaker);
 const covered=new Set(review.reviewedCdrTimes);
 if(covered.size!==rows.length||rows.some(row=>!covered.has(row.get)))throw new Error('The semantic review must cover every extracted Armstrong turn.');
 const resolve=ref=>{const row=index.get(`${ref.speaker}/${ref.get}`);if(!row)throw new Error(`Missing evidence: ${ref.speaker} ${ref.get}`);return row;};
 const definitions=[
  {id:'demand',label:'Communication demand',status:'Demanding tasks',color:'amber',unit:'requests, decisions or issues',description:'Requests, decisions and actionable issue reports voiced by you. Follow-up turns on the same request are grouped.',reading:'Preparation, landing and technical follow-up kept creating decisions and coordination work. The landing context and your own words support a demanding-day reading; the count alone does not.',scope:'Voiced demand only. This is not a count of every request directed at you.'},
  {id:'effort',label:'Effort to understand',status:'Some extra effort',color:'amber',unit:'repeats or corrections',description:'An explicit restatement, repeat request or correction in a reviewed exchange. Routine questions and scheduled measurement repeats are excluded.',reading:'Four exchanges required a restatement, repeated value or correction. The angle readback, timer repeat and T4 correction have a captured confirmation; the checklist restatement has no explicit acknowledgment here.',scope:'Ordinary questions are not counted as failure or confusion.'},
  {id:'coordination',label:'Coordination strain',status:'Operational snags',color:'cyan',unit:'coordination snags',description:'An operational mismatch or relay problem that required coordination to be repaired.',reading:'A relay needed repeated numbers and a shared time value needed correction. These show extra coordination work. They do not establish a strained relationship or conflict with Buzz.',scope:'Two reviewed operational snags. Interpersonal strain is not established.'},
  {id:'pressure',label:'Expressed pressure',status:'Clearly voiced',color:'amber',unit:'task-pressure statements',description:'Explicit first-person language about being busy or attention being divided between tasks.',reading:'You asked for a minute to focus after landing. You later described alarms drawing attention away from locating the landing site. This is the clearest personal account of the day’s demand.',scope:'Task pressure is supported; fatigue, low mood and lasting overload are not established.'},
  {id:'support',label:'Team support',status:'Responses available',color:'green',unit:'technical-support exchanges',description:'Four reviewed technical issue-report or help-seeking episodes: activation, alarm, timer and battery voltage.',reading:'A ground response is captured in all four reviewed episodes. The support was available, even though a response does not mean every technical issue was resolved.',scope:'These four issue episodes, not every request in the day. This does not measure the whole crew relationship.'}
 ];
 if(review.baseline.kind!=='simulated')throw new Error('This demo baseline must be explicitly labeled simulated.');
 const metrics=definitions.map(def=>{
  const episodes=review.episodes[def.id].map(episode=>({...episode,records:episode.refs.map(resolve)}));
  const baseline=review.baseline.metrics[def.id];
  const comparisonValue=def.id==='support'?episodes.filter(e=>e.responseCaptured).length/episodes.length*100:episodes.length;
  return {...def,episodes,count:episodes.length,baseline,comparisonValue,comparisonLabel:comparisonValue>baseline.max?'Above usual':'Within usual',comparisonColor:comparisonValue>baseline.max?'amber':def.id==='support'?'green':'cyan'};
 });
 const excerpts=review.excerpts.map(excerpt=>{const row=resolve({get:excerpt.get,speaker:'CDR'});if(!row.text.includes(excerpt.quote))throw new Error(`Excerpt does not match NASA text: ${excerpt.id}`);return {...excerpt,row};});
 const bins=Array.from({length:12},(_,i)=>({hour:i*2,count:0}));
 for(const episode of metrics[0].episodes){const hour=Number(episode.records[0].utc.slice(11,13));bins[Math.floor(hour/2)].count++;}
 return {metrics,excerpts,bins,turnCount:rows.length,dayStatus:review.dayStatus,rationale:review.dayRationale,comparison:review.comparisonStatus,recommendations:review.recommendations,baseline:review.baseline,supportResponses:metrics[4].episodes.filter(e=>e.responseCaptured).length};
}
module.exports={reviewNeilDay};
