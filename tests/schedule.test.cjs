const {test} = require('node:test');
const assert = require('node:assert/strict');
const { makeDemoSchedule, validateSchedule, eventsFor, sharedWindow, plannedMinutes } = require('../research-models/schedule.js');
const fixture = () => ({schemaVersion:1,source:'Test fixture',updatedAt:'2026-11-15T07:00:00Z',events:[]});
const event = (id,start,end,participants,category='available',extra={}) => ({id,start:`2026-11-15T${start}:00Z`,end:`2026-11-15T${end}:00Z`,participants,category,visibility:'crew',title:'Test',status:'planned',revision:1,...extra});
test('all eight crew schedules exist; work context comes from intervals',()=>{
 const data=validateSchedule(makeDemoSchedule());
 for(const id of ['AC','MP','LR','SR','NH','EB','YT','SF']) assert.ok(eventsFor(data,'2026-11-15',id).length);
 assert.equal(plannedMinutes(data,'AC','2026-11-15',7,'solo'),1120);
 assert.equal(plannedMinutes(data,'AC','2026-11-08',7,'solo'),700);
});
test('intersects explicit approved windows and subtracts private and exercise conflicts',()=>{
 const data=fixture();data.events=[event('a','18:00','18:40',['AC']),event('b','18:05','18:35',['LR']),event('p','18:05','18:15',['AC'],'private',{visibility:'private',title:'Confidential appointment'}),event('e','18:20','18:30',['LR'],'exercise')];
 const valid=validateSchedule(data);assert.equal(valid.events[2].title,'Busy');
 // First remaining slot is 5 minutes, so skip it; 18:30 to 18:35 also insufficient.
 assert.deepEqual(sharedWindow(valid,'2026-11-15',['AC','LR']),{unavailable:true});
 data.events[1].end='2026-11-15T18:45:00Z';
 assert.equal(new Date(sharedWindow(validateSchedule(data),'2026-11-15',['AC','LR']).start).toISOString(),'2026-11-15T18:30:00.000Z');
});
test('missing data and cancelled approved windows never imply free time',()=>{
 const data=fixture();data.events=[event('a','18:00','19:00',['AC'])];
 assert.deepEqual(sharedWindow(data,'2026-11-15',['AC','LR']),{unavailable:true});
 data.events.push(event('b','18:00','19:00',['LR'],'available',{status:'cancelled'}));
 assert.deepEqual(sharedWindow(data,'2026-11-15',['AC','LR']),{unavailable:true});
});
test('requires unique IDs, known participants, valid times and paired actual times',()=>{
 const data=fixture();data.events=[event('a','18:00','19:00',['AC'])];
 assert.throws(()=>validateSchedule({...data,events:[...data.events,...data.events]}),/unique/);
 assert.throws(()=>validateSchedule({...data,events:[{...data.events[0],participants:['UNKNOWN']}]}),/crew IDs/);
 assert.throws(()=>validateSchedule({...data,events:[{...data.events[0],end:'2026-11-15T17:00:00Z'}]}),/ordered/);
 assert.throws(()=>validateSchedule({...data,events:[{...data.events[0],actualStart:'2026-11-15T18:05:00Z'}]}),/actualStart/);
});
test('clips cross-midnight blocks to the selected date and handles timezone offsets',()=>{
 const data=fixture();data.events=[event('a','18:00','19:00',['AC'],'solo',{start:'2026-11-15T23:30:00Z',end:'2026-11-16T02:30:00+02:00'})];
 assert.equal(plannedMinutes(validateSchedule(data),'AC','2026-11-15',1,'solo'),30);
 assert.equal(eventsFor(data,'2026-11-16','AC').length,1);
});
