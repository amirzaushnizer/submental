const {test}=require('node:test');
const assert=require('node:assert/strict');
const {initialState,scheduleReducer,tomorrowFor,tomorrowDense,tomorrowRecovery,today}=require('../research-models/demo-v5.cjs');
test('approval replaces tomorrow across shared views, leaving today untouched',()=>{
 const todayBefore=JSON.stringify(today);
 assert.equal(initialState.isScheduleOptimized,false);
 assert.equal(tomorrowFor(initialState),tomorrowDense);
 const approved=scheduleReducer(initialState,{type:'APPROVE_OPTIMIZATION'});
 assert.equal(approved.isScheduleOptimized,true);
 assert.equal(tomorrowFor(approved),tomorrowRecovery);
 assert.match(tomorrowFor(approved)[2].title,/rest/);
 assert.equal(JSON.stringify(today),todayBefore);
 assert.equal(initialState.isScheduleOptimized,false);
 assert.deepEqual(scheduleReducer(approved,{type:'APPROVE_OPTIMIZATION'}),approved);
 assert.deepEqual(scheduleReducer(approved,{type:'RESET_DEMO'}),initialState);
});
test('both tomorrow plans cover the same window with no overlaps or gaps',()=>{
 const minutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
 for(const tasks of [tomorrowDense,tomorrowRecovery]){
  assert.equal(tasks[0].time,'08:00');assert.equal(tasks.at(-1).end,'18:00');
  for(let i=0;i<tasks.length;i++){
   assert.ok(minutes(tasks[i].end)>minutes(tasks[i].time));
   if(i)assert.equal(tasks[i].time,tasks[i-1].end);
  }
 }
});
