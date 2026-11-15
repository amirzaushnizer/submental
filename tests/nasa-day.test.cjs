const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data/nasa/armstrong-1969-07-20.json');
const {analyzeDay,labelsFor}=require('../research-models/nasa-analysis-v6.cjs');

test('NASA day has attributed source records inside the declared UTC date',()=>{
 assert.equal(data.targetSpeaker,'CDR');
 assert.equal(data.utterances.filter(r=>r.speaker==='CDR').length,181);
 assert.equal(new Set(data.utterances.map(r=>r.id)).size,data.utterances.length);
 for(const r of data.utterances){
  assert.ok(r.utc>='1969-07-20T00:00:00Z'&&r.utc<'1969-07-21T00:00:00Z');
  assert.ok(r.rawHeader.includes(r.speaker));assert.ok(r.sourcePage.includes('Page'));
  assert.ok(r.sourcePages.length>0);assert.ok(r.text.length>0);
  assert.doesNotMatch(r.text,/BEGIN LUNAR REV|END OF TAPE|GOSS NET/);
 }
 for(let i=1;i<data.utterances.length;i++)assert.ok(data.utterances[i].elapsedSeconds>=data.utterances[i-1].elapsedSeconds);
});
test('the raw alarm exchange keeps NASA wording, source page and mission time',()=>{
 const quote=data.utterances.find(r=>r.speaker==='CDR'&&r.get==='102:38:48');
 assert.equal(quote.text,'Give us a reading on the 1202 PROGRAM ALARM.');
 assert.equal(quote.utc,'1969-07-20T20:10:48Z');
 assert.match(quote.sourcePage,/Page 312/);
 assert.deepEqual(labelsFor(quote),['clarification','equipment']);
});
test('only Armstrong contributes to counts; other voices remain contextual',()=>{
 const fixture={targetSpeaker:'CDR',utterances:[
  {id:'a',speaker:'CDR',utc:'1969-07-20T20:00:00Z',text:'Roger.'},
  {id:'b',speaker:'CC',utc:'1969-07-20T20:00:05Z',text:'Say again. Program alarm.'},
  {id:'c',speaker:'SC',utc:'1969-07-20T20:00:07Z',text:'Stand by.'},
 ]};
 const s=analyzeDay(fixture);assert.equal(s.astronaut.length,1);assert.equal(s.context.length,3);
 assert.equal(s.counts.clarification,0);assert.equal(s.counts.equipment,0);assert.equal(s.counts.hold,0);
});
test('replay cannot use later records or turn an empty window into a reassuring score',()=>{
 const s=analyzeDay(data,{until:0});assert.equal(s.astronaut.length,0);assert.equal(s.flagged.length,0);
 assert.ok(!Object.hasOwn(s,'readinessScore'));
 const before=analyzeDay(data,{until:20*60});
 assert.ok(before.astronaut.every(r=>r.utc<='1969-07-20T20:00:00Z'));
 assert.equal(before.counts.equipment,0);
});
test('mission windows restrict counts and evidence; hourly totals still reconcile',()=>{
 const s=analyzeDay(data,{start:1200,end:1230,filter:'equipment'});
 assert.equal(s.evidence.length,4);
 assert.ok(s.evidence.every(r=>r.speaker==='CDR'&&labelsFor(r).includes('equipment')));
 assert.equal(s.hourly.reduce((sum,h)=>sum+h.count,0),s.astronaut.length);
 assert.ok(s.astronaut.every(r=>r.utc>='1969-07-20T20:00:00Z'&&r.utc<'1969-07-20T20:30:00Z'));
});
test('equipment numbers embedded in other numbers do not become alarm mentions',()=>{
 assert.deepEqual(labelsFor({speaker:'CDR',text:'Copy. 11202, 20741, 00211.'}),[]);
 assert.deepEqual(labelsFor({speaker:'CDR',text:'1202. PROGRAM ALARM. 1202.'}),['equipment']);
});
