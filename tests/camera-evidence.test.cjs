const {test}=require('node:test');
const assert=require('node:assert/strict');
const {matchCamera}=require('../src/camera-evidence.cjs');
const {validateCamera}=require('../scripts/validate-camera.cjs');
const source=require('../data/days/1969-07-18.json');
const row=id=>source.utterances.find(r=>r.id===id);
test('only explicitly checked spoken turns match; timestamp proximity cannot match footage',()=>{
 const entry=matchCamera(row('a11-02130'));assert.equal(entry.status,'audio_match');assert.equal(entry.clipId,'july18-tunnel');assert.ok(entry.spokenTurn.startSeconds>9&&entry.spokenTurn.startSeconds<10);
 const banding=matchCamera(row('a11-02371'));assert.equal(banding.status,'audio_match');assert.equal(banding.clipId,'july18-tour');assert.match(banding.spokenTurn.quote,/horizontal banding/);
 assert.equal(matchCamera(row('a11-02073')).status,'reference');
 assert.equal(matchCamera(row('a11-02363')).status,'reference');
 assert.equal(matchCamera({...row('a11-02130'),text:'Different words at the same timestamp.'}).status,'reference');
 assert.equal(matchCamera({utc:row('a11-02130').utc}).status,'reference');
 assert.equal(matchCamera({...row('a11-02130'),utc:'1969-07-20T21:05:24Z'}).status,'unavailable');
 for(const day of ['1969-07-20','1969-07-22'])assert.equal(matchCamera({utc:day+'T20:18:23Z'}).status,'unavailable');
});
test('saved camera packets retain source frames, audio hashes, source captions and genuine local outputs',()=>{
 const result=validateCamera();assert.equal(result.clips,5);assert.ok(result.turns>=121);
});
