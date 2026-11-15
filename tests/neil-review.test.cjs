const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const fs=require('node:fs');
const data=require('../data/nasa/armstrong-1969-07-20.json');
const review=require('../data/nasa/armstrong-day-review.json');
const {reviewNeilDay}=require('../research-models/neil-review-v7.cjs');
test('all five reviewed KPI episode counts reconcile with linked source records',()=>{
 const report=reviewNeilDay(data,review);
 assert.deepEqual(report.metrics.map(m=>m.id),['demand','effort','coordination','pressure','support']);
 assert.deepEqual(report.metrics.map(m=>m.count),[37,4,2,2,4]);
 assert.equal(report.bins.reduce((s,b)=>s+b.count,0),report.metrics[0].count);
 for(const metric of report.metrics){
  assert.equal(new Set(metric.episodes.map(e=>e.id)).size,metric.count);
  for(const episode of metric.episodes)assert.ok(episode.records.some(r=>r.speaker==='CDR'));
 }
 assert.equal(report.supportResponses,4);
 for(const ep of report.metrics[4].episodes)assert.ok(ep.records.some(r=>r.speaker==='CC'));
 assert.match(report.metrics[2].scope,/Interpersonal strain is not established/);
 assert.ok(!Object.hasOwn(report,'readinessScore'));
 assert.equal(report.baseline.kind,'simulated');
 assert.deepEqual(report.metrics.map(m=>m.comparisonLabel),['Above usual','Above usual','Above usual','Above usual','Within usual']);
});
test('the prepared review covers every Armstrong turn and matches the input snapshot',()=>{
 assert.equal(review.inputSha256,createHash('sha256').update(fs.readFileSync(require.resolve('../data/nasa/armstrong-1969-07-20.json'))).digest('hex'));
 const partial=structuredClone(review);partial.reviewedCdrTimes.pop();
 assert.throws(()=>reviewNeilDay(data,partial),/cover every/);
 const wrongDay=structuredClone(review);wrongDay.date='1969-07-21';
 assert.throws(()=>reviewNeilDay(data,wrongDay),/does not match/);
});
test('unlinked interpretations and modified quotes fail instead of showing fabricated evidence',()=>{
 const missing=structuredClone(review);missing.episodes.effort[0].refs[0].get='999:00:00';
 assert.throws(()=>reviewNeilDay(data,missing),/Missing evidence/);
 const changed=structuredClone(review);changed.excerpts[0].quote='I am exhausted and cannot continue.';
 assert.throws(()=>reviewNeilDay(data,changed),/does not match NASA text/);
});
test('OCR timestamp normalization does not attribute the following Collins words to Neil',()=>{
 const neil=data.utterances.find(r=>r.get==='098:41:01'&&r.speaker==='CDR');
 assert.equal(neil.text,'Roger. Understand.');
 const collins=data.utterances.find(r=>r.get==='098:41:41'&&r.speaker==='CMP');
 assert.equal(collins.timestampNormalized,true);assert.match(collins.text,/check points/);
});
