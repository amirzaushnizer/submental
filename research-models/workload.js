const KPI_DEFINITIONS = [
  { id: 'demand', name: 'Communication demand', unit: 'requests & decisions / h', meaning: 'Separate requests, decisions and task changes handled in captured conversations.', caveat: 'More talking is not automatically more demand. Count distinct demands and compare similar tasks.' },
  { id: 'understanding', name: 'Effort to understand', unit: 'repeat / correction events / h', meaning: 'Repeated explanations and corrections about the same task.', caveat: 'Careful checking is useful. Repetition can also come from a harder task or a weak connection.' },
  { id: 'coordination', name: 'Coordination strain', unit: 'plan mismatches / h', meaning: 'Conflicting plans, expectations or decisions that are reopened.', caveat: 'A mismatch is a candidate event. It does not prove a task failed or a person made an error.' },
  { id: 'strain', name: 'Expressed pressure', unit: 'direct statements / h', meaning: 'Clear statements about pace, difficulty keeping up or needing relief.', caveat: 'This shows what was expressed in context. It is not a diagnosis or an inferred emotion score.' },
  { id: 'support', name: 'Team support', unit: 'help requests acknowledged', meaning: 'Explicit help requests followed by an acknowledgment or agreed response in the captured exchange.', caveat: 'An acknowledgment does not prove help was completed. An absent reply may be outside the recording.' }
];
const QUOTES = {
  demand: [ ['Ground', 'Please confirm the next sample time before we begin.'], ['Crew', 'I need a decision on which task takes priority before I start the next check.'], ['Ground', 'One more request: confirm the inventory count after this procedure.'] ],
  understanding: [ ['Crew', 'Could you explain that last step again? I was still working through the first instruction.'], ['Crew', 'I said tray three earlier; I meant tray four. Let me repeat the corrected sequence.'] ],
  coordination: [ ['Crew', 'My plan has the sample run first. Your update puts maintenance first; we need to align.'], ['Crew', 'I thought that decision was final. Are we changing the task order again?'] ],
  strain: [ ['Crew', 'There are too many requests at once. I need a pause to get the order clear.'], ['Crew', 'I’m finding it hard to keep up with this pace. Can we move the noncritical review?'] ],
  support: [ ['Crew', 'Could you take the labels while I finish the growth check?', 'Yes. I’ll handle the labels, then check back with you.'], ['Crew', 'Can someone help me sort the updated task order?', 'Let’s go through it together after this check.'] ]
};
function makeWorkloadData() {
  const records=[];
  ['AC','MP','LR','SR','NH','EB','YT','SF'].forEach((person,p)=>{
    for(let day=8;day<=14;day++) for(let block=0;block<3;block++) {
      const busy=(p===0||p===2)&&day>=13&&block===1;
      const counts=busy?[12,5,3,2,4]:[5+(p+day+block)%3,1+(p+block)%2,(p+day)%2,0,2];
      const events=[];
      KPI_DEFINITIONS.forEach((kpi,k)=>{
        for(let n=0;n<counts[k];n++) {
          const quote=QUOTES[kpi.id][n%QUOTES[kpi.id].length];
          events.push({ id:`${person}-${day}-${block}-${kpi.id}-${n}`, kpi:kpi.id, speaker:quote[0]==='Crew'?person:'Ground', text:quote[1], reply:kpi.id==='support' && (!busy||n<3)?quote[2]:'', minute:Math.min(59,4+n*4+k), source:kpi.id==='support'?'Crew–crew operational':'Crew–ground operational' });
        }
      });
      records.push({person,day,block,task:block===1?'Science / maintenance':block===0?'Planning / setup':'Handover / review',start:['08:00','11:00','16:00'][block],eligibleMinutes:75,capturedMinutes:60,events});
    }
  });
  return records;
}
const WORKLOAD_DATA = makeWorkloadData();
function selectWorkloadRecords(person,window,scenario='busy') {
  const records=WORKLOAD_DATA.filter(r=>r.person===person && (window==='week'||r.day===14) && (window!=='block'||r.block===1));
  if(scenario==='steady')return records.map(r=>r.day<=12?r:({...r,events:WORKLOAD_DATA.find(b=>b.person===person&&b.day===10&&b.block===r.block).events.map(e=>({...e,id:e.id.replace(`${person}-10-`,`${person}-${r.day}-`)}))}));
  if(scenario==='missing')return records.map(r=>({...r,capturedMinutes:10,events:r.events.slice(0,2)}));
  return records;
}
function workloadSummary(person,window,scenario='busy',excluded=[]) {
  const records=selectWorkloadRecords(person,window,scenario);
  const blocks=[...new Set(records.map(r=>r.block))];
  const baseline=WORKLOAD_DATA.filter(r=>r.person===person&&r.day<=12&&blocks.includes(r.block));
  const captured=records.reduce((sum,r)=>sum+r.capturedMinutes,0);
  const eligible=records.reduce((sum,r)=>sum+r.eligibleMinutes,0);
  const sufficient=captured/eligible>=.6; // Illustrative demo gate, not a validated NASA threshold.
  const metrics=KPI_DEFINITIONS.map(kpi=>{
    const events=records.flatMap(r=>r.events.filter(e=>e.kpi===kpi.id&&!excluded.includes(e.id)).map(e=>({...e,day:r.day,block:r.block,start:r.start,task:r.task})));
    const prior=baseline.flatMap(r=>r.events.filter(e=>e.kpi===kpi.id));
    const numerator=kpi.id==='support'?events.filter(e=>e.reply).length:events.length;
    const value=kpi.id==='support'?(events.length?numerator/events.length:0):events.length/(captured/60);
    const base=kpi.id==='support'?(prior.length?prior.filter(e=>e.reply).length/prior.length:0):prior.length/baseline.length;
    const elevated=sufficient&&kpi.id!=='support'&&value>Math.max(base*1.5,base+1);
    return {...kpi,events,numerator,total:events.length,value,base,elevated};
  });
  const raisedBlocks=records.map(record=>{
    if(record.capturedMinutes/record.eligibleMinutes<.6)return {...record,raisedIds:[]};
    const matching=WORKLOAD_DATA.filter(r=>r.person===person&&r.day<=12&&r.block===record.block);
    const raised=metrics.filter(metric=>{
      if(metric.id==='support')return false;
      const count=record.events.filter(e=>e.kpi===metric.id&&!excluded.includes(e.id)).length/(record.capturedMinutes/60);
      const base=matching.reduce((sum,r)=>sum+r.events.filter(e=>e.kpi===metric.id).length,0)/matching.length;
      return count>Math.max(base*1.5,base+1);
    });
    return {...record,raisedIds:raised.map(metric=>metric.id)};
  }).filter(record=>record.raisedIds.length>=2);
  for(const metric of metrics) {
    metric.aggregateElevated=metric.elevated;
    metric.raisedWithinWindow=sufficient&&raisedBlocks.some(record=>record.raisedIds.includes(metric.id))&&metric.id!=='support';
    metric.elevated=metric.elevated||metric.raisedWithinWindow;
  }
  const elevated=metrics.filter(m=>m.elevated);
  const repeated=raisedBlocks.length>=2;
  const needsReview=sufficient&&raisedBlocks.length>0;
  return {records,metrics,captured,eligible,coverage:Math.round(captured/eligible*100),sufficient,elevated,repeated,raisedBlocks,needsReview,status:!sufficient?'Not enough data':needsReview?'Worth a review':'Within example range'};
}
if(typeof module!=='undefined')module.exports={KPI_DEFINITIONS,WORKLOAD_DATA,selectWorkloadRecords,workloadSummary};

function conversationScore(person,window,scenario='busy',excluded=[]) {
  const summary=workloadSummary(person,window,scenario,excluded);
  const blocks=summary.records.map(record=>{
    const matching=WORKLOAD_DATA.filter(r=>r.person===person&&r.day<=12&&r.block===record.block);
    const covered=record.capturedMinutes/record.eligibleMinutes>=.6;
    const scores=KPI_DEFINITIONS.map(metric=>{
      const events=record.events.filter(e=>e.kpi===metric.id&&!excluded.includes(e.id));
      const previous=matching.flatMap(r=>r.events.filter(e=>e.kpi===metric.id));
      if(!covered)return null;
      if(metric.id==='support')return events.length?Math.round(events.filter(e=>e.reply).length/events.length*100):null;
      const rate=events.length/(record.capturedMinutes/60);
      const baseline=previous.length/matching.length;
      return Math.round(Math.max(0,Math.min(100,80-20*(rate-baseline)/Math.max(baseline,1))));
    });
    return {day:record.day,block:record.block,scores,value:scores.every(score=>score!==null)?Math.round(scores.reduce((sum,n)=>sum+n,0)/scores.length):null};
  });
  const complete=blocks.filter(b=>b.value!==null);
  const value=summary.sufficient&&complete.length?Math.min(...complete.map(b=>b.value)):null;
  const metrics=KPI_DEFINITIONS.map((m,i)=>{
    const available=blocks.map(b=>b.scores[i]).filter(score=>score!==null);
    return {id:m.id,value:summary.sufficient&&available.length?Math.min(...available):null};
  });
  return {value,metrics,blocks,band:scoreBand(value)};
}
function scoreBand(value) {
  if(value===null)return {name:'Not enough data',color:'#8b99a8',key:'unknown',message:'Check the recording coverage.'};
  if(value>=80)return {name:'Steady',color:'#60b5a0',key:'steady',message:'Keep the current pace in review.'};
  if(value>=60)return {name:'Mixed',color:'#7dacf0',key:'mixed',message:'A few signals are worth watching.'};
  if(value>=40)return {name:'Demanding',color:'#e7b65a',key:'demanding',message:'Consider a lighter next block.'};
  return {name:'High strain signals',color:'#e48c70',key:'strain',message:'Review the pace with your planner.'};
}
if(typeof module!=='undefined')Object.assign(module.exports,{conversationScore,scoreBand});
