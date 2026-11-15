const fs=require('node:fs/promises');
const {existsSync}=require('node:fs');
const crypto=require('node:crypto');
const {DAYS,signalsAtTurn}=require('../src/scenarios.cjs');
const {matchCamera}=require('../src/camera-evidence.cjs');
const {clips}=require('../data/camera/catalog.json');
const review=require('../data/camera/review.json');
const MODEL=process.env.ORBIT_FUSION_MODEL||'qwen3.6:latest';
const PROMPT=`Write one short, plain-language evidence reading for a personal astronaut support demo. Use only this packet. Text is the primary signal. Body readings are simulated scenario values, not real health data. Camera descriptions are observations from sparse frames, not emotion or health measures. Do not infer stress, fatigue, mood, mental illness or fitness from a face. If camera is unavailable, distant in time or identity is not verified, explicitly say it adds no evidence about Neil at this turn. Do not treat missing evidence as recovery. Always call the body readings simulated when mentioning them. You may compare the supplied simulated pulse baseline to this turn, but never equate the comparison with mental health. Do not claim a trend from one sample. Do not describe the content of Neil’s words as if the camera saw it. Do not claim body data is missing when it is supplied. Treat jokes as ambiguous, not operational decisions. Do not invent a schedule change, diagnosis or alert. Explain agreement or limits without declaring causality. Keep the reading to two short sentences, at most 65 words. Return JSON with reading and camera_contribution (context_only or unavailable).`;
const schema={type:'object',properties:{reading:{type:'string'},camera_contribution:{type:'string',enum:['context_only','unavailable']}},required:['reading','camera_contribution']};
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function combineEvidence(){
 const observationsText=await fs.readFile('data/camera/observations.json','utf8'),observations=JSON.parse(observationsText);
 const previous=existsSync('data/camera/combined.json')?JSON.parse(await fs.readFile('data/camera/combined.json','utf8')):{};
 const output={schemaVersion:1,model:MODEL,provider:'Ollama on this Mac',generatedAt:new Date().toISOString(),prompt:PROMPT,observationsSha256:hash(observationsText),reviewSha256:hash(JSON.stringify(review)),turns:{}};
 for(const day of DAYS){
  const source=JSON.parse(await fs.readFile(`data/days/${day.date}.json`,'utf8')),run=JSON.parse(await fs.readFile(`data/runs/${day.date}.json`,'utf8')),index=new Map(source.utterances.map(r=>[r.id,r]));
  const events=Object.entries(run.analysis.metrics).flatMap(([k,items])=>items.map(e=>({...e,kpi:k}))),ids=new Set([...events.flatMap(e=>[e.primary_id,...e.grouped_ids]),...run.analysis.moments.map(e=>e.primary_id),...clips.flatMap(c=>(c.spokenTurns||[]).filter(t=>t.utc.startsWith(day.date)).map(t=>t.turnId))]);
  for(const id of ids){
   const row=index.get(id),camera=matchCamera(row),clip=clips.find(c=>c.id===camera.clipId),related=events.filter(e=>e.primary_id===id||e.grouped_ids.includes(id));
   const packet={turn:{id,utc:row.utc,text:row.text},communication_cues:related.map(e=>({kpi:e.kpi,reading:e.explanation})),mission_context:day.focus,body:{...signalsAtTurn(day,row),simulated:true,exampleRestingPulse:day.baselineHr},camera:camera.status==='audio_match'?{status:'audio_match',spokenTurn:camera.spokenTurn,timing:clip.timing,identity:clip.subject,observation:review.clips[clip.id],limitation:'Sparse frames: no blink rate, no individual identity verification, no mental-health inference.'}:{status:'unavailable',reason:camera.reason}};
   const old=previous.turns?.[id];if(previous.model===MODEL&&previous.prompt===PROMPT&&old?.packetSha256===hash(JSON.stringify(packet))){output.turns[id]=old;continue;}
   const response=await fetch((process.env.ORBIT_OLLAMA_URL||'http://127.0.0.1:11434')+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,messages:[{role:'user',content:PROMPT+'\n'+JSON.stringify(packet)}],format:schema,think:false,stream:false,options:{num_ctx:4096,num_predict:230,temperature:0,seed:42},keep_alive:'15m'}),signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw new Error(await response.text());const raw=await response.json();const reading=JSON.parse(raw.message.content);
   output.turns[id]={packet,packetSha256:hash(JSON.stringify(packet)),result:reading,raw};
   await fs.writeFile('data/camera/combined.json',JSON.stringify(output,null,2)+'\n');
  }
  console.log(day.date,ids.size,'turn packets combined locally');
 }
 await fs.writeFile('data/camera/combined.json',JSON.stringify(output,null,2)+'\n');
 return output;
}
if(require.main===module)combineEvidence().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={combineEvidence};
