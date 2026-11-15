const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {DAYS,simulatedSignals,signalsAtTurn,metricSummary}=require('../src/scenarios.cjs');
const {validateResult,guardLabels,contextFor}=require('../scripts/local-analysis.cjs');
test('three real NASA day extracts attribute only CDR to Neil',()=>{
 assert.deepEqual(DAYS.map(d=>d.date),['1969-07-18','1969-07-20','1969-07-22']);
 const expected=[68,181,55];
 for(let i=0;i<DAYS.length;i++){const d=require(`../data/days/${DAYS[i].date}.json`);assert.equal(d.astronaut,'Neil Armstrong');assert.equal(contextFor(d).length,expected[i]);assert.ok(d.utterances.every(r=>r.utc.startsWith(d.date)));}
});
test('simulated supporting signals stay separate and change by selected scenario',()=>{
 const series=DAYS.map(simulatedSignals);
 for(const points of series){assert.equal(points.length,48);for(const p of points){assert.ok(p.hr>=45&&p.hr<=135);assert.ok(p.systolic>p.diastolic);assert.ok(p.tension>=0&&p.tension<=10);}}
 assert.ok(Math.max(...series[1].map(p=>p.hr))>Math.max(...series[0].map(p=>p.hr)));
 assert.equal(series[1][40].time,'20:00');assert.notDeepEqual(series[0],series[2]);
});
test('source rules reject technical pressure and acknowledgment labels',()=>{
 const make=(text,after=[])=>({primary:{text},before:[],after});
 assert.deepEqual(guardLabels({labels:['pressure'],moment:'none'},make('The fuel pressure is 30 psi.')).labels,[]);
 assert.deepEqual(guardLabels({labels:['demand','support'],moment:'none'},make('Roger.')).labels,[]);
 assert.deepEqual(guardLabels({labels:['pressure'],moment:'load'},make("We're going to be busy for a minute.")).labels,['pressure']);
 assert.deepEqual(guardLabels({labels:['support'],moment:'none'},make('Give us a reading on the alarm.')).labels,[]);
});
test('published result provenance links real local outputs to the exact selected transcript',()=>{
 for(const day of DAYS){const text=fs.readFileSync(require.resolve(`../data/days/${day.date}.json`),'utf8'),source=JSON.parse(text),run=require(`../data/runs/${day.date}.json`);
  assert.equal(run.pipelineVersion,'literal-spans-v3');assert.equal(run.model,'gemma4:e2b');assert.equal(run.inputSha256,createHash('sha256').update(text).digest('hex'));assert.ok(run.run.calls>0);assert.ok(run.run.outputTokens>0);assert.ok(run.modelReviewedTurns>0);assert.equal(run.classifications.length,run.inputTargetTurns);validateResult(run.analysis,source);
  const ids=new Map(source.utterances.map(r=>[r.id,r]));for(const row of run.classifications){assert.equal(ids.get(row.primary_id).speaker,'CDR');for(const span of Object.values(row.spans))assert.ok(!span||ids.get(row.primary_id).text.toLowerCase().includes(span.toLowerCase()));}
  assert.deepEqual(metricSummary(run).map(m=>m.id),['demand','effort','coordination','pressure','support']);
 }
});

test('turn biofeedback uses the exact UTC time and selected day',()=>{
 for(const day of DAYS){
  const points=simulatedSignals(day);
  for(const point of points){const sample=signalsAtTurn(day,{utc:`${day.date}T${point.time}:00Z`});for(const field of ['hr','systolic','diastolic','tension'])assert.equal(sample[field],point[field]);}
  const source=require(`../data/days/${day.date}.json`),run=require(`../data/runs/${day.date}.json`),index=new Map(source.utterances.map(r=>[r.id,r]));
  for(const events of Object.values(run.analysis.metrics))for(const event of events)for(const id of [event.primary_id,...event.grouped_ids]){const row=index.get(id),sample=signalsAtTurn(day,row);assert.equal(sample.time,row.utc.slice(11,19));assert.ok(sample.systolic>sample.diastolic);}
 }
 const landing=DAYS[1];assert.notDeepEqual(signalsAtTurn(landing,{utc:'1969-07-20T20:00:00Z'}),signalsAtTurn(landing,{utc:'1969-07-20T20:29:59Z'}));
 assert.throws(()=>signalsAtTurn(landing,{utc:'1969-07-18T20:00:00Z'}),/selected mission day/);
});
