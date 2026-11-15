const fs=require('node:fs/promises');
const {existsSync}=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const {clips}=require('../data/camera/catalog.json');
const MODEL=process.env.ORBIT_VISION_MODEL||'qwen3.6:latest';
const URL=process.env.ORBIT_OLLAMA_URL||'http://127.0.0.1:11434';
const schema={type:'object',properties:{quality:{type:'string',enum:['clear','limited','unusable']},face_detail:{type:'string',enum:['visible','limited','not_visible']},observations:{type:'array',maxItems:3,items:{type:'object',properties:{frame_index:{type:'integer',minimum:0,maximum:2},description:{type:'string'}},required:['frame_index','description']}},limits:{type:'string'}},required:['quality','face_detail','observations','limits']};
const PROMPT='You are describing 3 ordered still frames sampled from real Apollo 11 footage. Report only visible actions, posture, objects and image quality. Do not identify anyone by face. Do not infer emotions, health, fatigue, stress, cognitive load or intent. Do not infer blink rate or action frequency from sparse frames. Each observation must name the zero-based frame index (0,1,2) that supports it. If a face is too small, shadowed, turned away or absent, say so. At most three short observations. Do not turn lack of evidence into a reassuring assessment. Return JSON.';
async function analyzeCamera(){
 const previous=existsSync('data/camera/observations.json')?JSON.parse(await fs.readFile('data/camera/observations.json','utf8')):{};
 const result={schemaVersion:1,model:MODEL,provider:'Ollama on this Mac',generatedAt:new Date().toISOString(),prompt:PROMPT,clips:{}};
 for(const clip of clips){
  const frames=await Promise.all(clip.frameSeconds.map((_,i)=>fs.readFile(path.join('assets/camera',`${clip.id}-${i}.jpg`))));
  const old=previous.clips?.[clip.id];if(previous.model===MODEL&&previous.prompt===PROMPT&&old&&frames.every((b,i)=>crypto.createHash('sha256').update(b).digest('hex')===old.frames[i].sha256)){result.clips[clip.id]=old;console.log(clip.id,'reused unchanged frame analysis');continue;}
  const request={model:MODEL,messages:[{role:'user',content:PROMPT,images:frames.map(b=>b.toString('base64'))}],format:schema,think:false,stream:false,options:{num_ctx:8192,num_predict:800,temperature:0,seed:42},keep_alive:'15m'};
  const response=await fetch(URL+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(300000)});if(!response.ok)throw new Error(await response.text());const raw=await response.json();const observation=JSON.parse(raw.message.content);
  result.clips[clip.id]={observation,frames:frames.map((b,i)=>({file:`${clip.id}-${i}.jpg`,clipSecond:clip.frameSeconds[i],sha256:crypto.createHash('sha256').update(b).digest('hex')})),totalDurationNs:raw.total_duration,outputTokens:raw.eval_count,raw};
  await fs.writeFile('data/camera/observations.json',JSON.stringify(result,null,2)+'\n');console.log(clip.id,observation.face_detail,observation.quality);
 }
 await fs.writeFile('data/camera/observations.json',JSON.stringify(result,null,2)+'\n');
 return result;
}
if(require.main===module)analyzeCamera().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={analyzeCamera};
