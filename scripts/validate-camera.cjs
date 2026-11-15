const fs=require('node:fs');
const crypto=require('node:crypto');
const {DAYS,signalsAtTurn}=require('../src/scenarios.cjs');
const {clips}=require('../data/camera/catalog.json');
const {matchCamera}=require('../src/camera-evidence.cjs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function validateCamera(){
 const observedText=fs.readFileSync('data/camera/observations.json','utf8'),observed=JSON.parse(observedText),combined=JSON.parse(fs.readFileSync('data/camera/combined.json','utf8')),review=JSON.parse(fs.readFileSync('data/camera/review.json','utf8'));
 if(combined.observationsSha256!==hash(observedText)||combined.reviewSha256!==hash(JSON.stringify(review)))throw new Error('Camera observations changed. Run the combined evidence analysis again.');
 const audio=JSON.parse(fs.readFileSync('data/camera/audio-alignment.json','utf8'));
 const rows=new Map(DAYS.flatMap(d=>JSON.parse(fs.readFileSync(`data/days/${d.date}.json`,'utf8')).utterances).map(r=>[r.id,r]));
 for(const clip of clips){
  if(!fs.statSync(`assets/camera/${clip.id}.mp4`).size)throw new Error(`Missing camera video: ${clip.id}`);
  if(clip.audioVerified){
   const checked=audio.clips[clip.id];if(!checked||hash(fs.readFileSync(`assets/camera/${clip.id}.mp4`))!==checked.videoSha256||JSON.stringify(checked.spokenTurns)!==JSON.stringify(clip.spokenTurns))throw new Error(`Recheck changed clip audio: ${clip.id}`);
   const vtt=fs.readFileSync(`assets/camera/${clip.id}.vtt`,'utf8').replace(/\s+/g,' ');
   for(const turn of clip.spokenTurns){const row=rows.get(turn.turnId);if(!row||row.speaker!=='CDR'||row.text!==turn.quote||row.utc!==turn.utc||turn.startSeconds<0||turn.endSeconds<=turn.startSeconds||turn.endSeconds>clip.durationSeconds||!vtt.includes(turn.quote.replace(/\s+/g,' ')))throw new Error(`Invalid caption or transcript link: ${turn.turnId}`);}
  }
  if(!review.clips[clip.id])throw new Error(`Review camera frames for ${clip.id}`);
  for(const frame of observed.clips[clip.id].frames)if(hash(fs.readFileSync(`assets/camera/${frame.file}`))!==frame.sha256)throw new Error(`Camera frame changed: ${frame.file}`);
 }
 for(const day of DAYS){
  const source=JSON.parse(fs.readFileSync(`data/days/${day.date}.json`,'utf8')),run=JSON.parse(fs.readFileSync(`data/runs/${day.date}.json`,'utf8')),index=new Map(source.utterances.map(r=>[r.id,r]));
  const ids=new Set([...Object.values(run.analysis.metrics).flatMap(events=>events.flatMap(e=>[e.primary_id,...e.grouped_ids])),...run.analysis.moments.map(m=>m.primary_id)]);
  for(const id of ids){
   const record=combined.turns[id];if(!record)throw new Error(`Combine evidence for ${id} before building.`);
   const row=index.get(id),match=matchCamera(row),body=signalsAtTurn(day,row);
   if(record.packet.turn.text!==row.text||record.packet.turn.utc!==row.utc||hash(JSON.stringify(record.packet))!==record.packetSha256)throw new Error(`Stale turn packet: ${id}`);
   for(const field of ['hr','systolic','diastolic','tension'])if(record.packet.body[field]!==body[field])throw new Error(`Stale body signal: ${id}`);
   if((record.packet.camera.status==='audio_match')!==(match.status==='audio_match'))throw new Error(`Camera time mismatch: ${id}`);
   if(match.status==='audio_match'&&JSON.stringify(record.packet.camera.spokenTurn)!==JSON.stringify(match.spokenTurn))throw new Error(`Stale spoken-turn anchor: ${id}`);
   if(match.status!=='audio_match'&&record.packet.camera.observation)throw new Error(`Reference footage entered analysis for ${id}`);
   if(JSON.stringify(record.result)!==JSON.stringify(JSON.parse(record.raw.message.content)))throw new Error(`Combined reading differs from local output: ${id}`);
  }
 }
 return {clips:clips.length,turns:Object.keys(combined.turns).length};
}
module.exports={validateCamera};
