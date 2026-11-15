const {test}=require('node:test');
const assert=require('node:assert/strict');
const {workloadSummary}=require('../research-models/workload.js');
test('busy work block aggregates only that person and raises a combined review',()=>{
 const s=workloadSummary('AC','block');
 assert.equal(s.captured,60);assert.equal(s.metrics[0].value,12);
 assert.equal(s.metrics[4].numerator,3);assert.equal(s.metrics[4].total,4);
 assert.equal(s.needsReview,true);
 assert.ok(s.metrics.every(m=>m.events.every(e=>e.id.startsWith('AC-14-1-'))));
});
test('normal and missing-data scenarios do not flag overload',()=>{
 assert.equal(workloadSummary('AC','block','steady').needsReview,false);
 const missing=workloadSummary('AC','block','missing');
 assert.equal(missing.sufficient,false);assert.equal(missing.needsReview,false);
 assert.equal(missing.status,'Not enough data');
});
test('day and week counts use captured hours rather than total event counts',()=>{
 const day=workloadSummary('AC','day');const week=workloadSummary('AC','week');
 assert.equal(day.captured,180);assert.equal(week.captured,1260);
 assert.equal(day.metrics[0].value,day.metrics[0].total/3);
 assert.equal(week.metrics[0].value,week.metrics[0].total/21);
 assert.equal(week.repeated,true);
 assert.equal(day.needsReview,true);assert.equal(week.needsReview,true);
});
test('removing a semantic label updates the right KPI and preserves capture denominator',()=>{
 const before=workloadSummary('AC','block');const id=before.metrics[0].events[0].id;
 const after=workloadSummary('AC','block','busy',[id]);
 assert.equal(after.metrics[0].value,before.metrics[0].value-1);
 assert.equal(after.metrics[1].value,before.metrics[1].value);
 assert.equal(after.captured,before.captured);
});
test('one crewmate’s pattern does not set another’s review status',()=>{
 assert.equal(workloadSummary('LR','block').needsReview,true);
 assert.equal(workloadSummary('MP','block').needsReview,false);
});

test('a review does not mark unrelated normal metrics as elevated',()=>{
 const s=workloadSummary('AC','block');
 const excluded=s.metrics.find(m=>m.id==='strain').events.map(e=>e.id);
 const revised=workloadSummary('AC','block','busy',excluded);
 assert.equal(revised.needsReview,true);
 assert.equal(revised.metrics.find(m=>m.id==='strain').elevated,false);
});
const {conversationScore,scoreBand}=require('../research-models/workload.js');
test('experimental scores are bounded and higher for steady conversations',()=>{
 const busy=conversationScore('AC','block','busy');const steady=conversationScore('AC','block','steady');
 assert.ok(busy.value<steady.value);
 assert.ok(busy.metrics.every(m=>m.value>=0&&m.value<=100));
 assert.equal(busy.value,Math.round(busy.metrics.reduce((sum,m)=>sum+m.value,0)/5));
});
test('insufficient recordings withhold all score estimates',()=>{
 const score=conversationScore('AC','week','missing');assert.equal(score.value,null);
 assert.ok(score.metrics.every(m=>m.value===null));assert.equal(score.band.key,'unknown');
});
test('wide windows preserve the lowest complete block score',()=>{
 const score=conversationScore('AC','week');
 assert.equal(score.value,Math.min(...score.blocks.filter(b=>b.value!==null).map(b=>b.value)));
});
test('missing support evidence withholds the combined block estimate',()=>{
 const s=workloadSummary('AC','block');const excluded=s.metrics.find(m=>m.id==='support').events.map(e=>e.id);
 assert.equal(conversationScore('AC','block','busy',excluded).value,null);
});
test('score bands handle each boundary and missing data',()=>{
 assert.equal(scoreBand(80).key,'steady');assert.equal(scoreBand(79).key,'mixed');
 assert.equal(scoreBand(60).key,'mixed');assert.equal(scoreBand(59).key,'demanding');
 assert.equal(scoreBand(40).key,'demanding');assert.equal(scoreBand(39).key,'strain');
 assert.equal(scoreBand(null).key,'unknown');
});
