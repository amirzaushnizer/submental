const esbuild=require('esbuild');
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const {DATES,validateResult}=require('./local-analysis.cjs');
async function build(){
 require('./validate-camera.cjs').validateCamera();
 for(const date of DATES){const text=await fs.readFile(`data/days/${date}.json`,'utf8'),day=JSON.parse(text),run=JSON.parse(await fs.readFile(`data/runs/${date}.json`,'utf8'));if(run.pipelineVersion!=='literal-spans-v3')throw new Error(`Run local Gemma for ${date} first.`);if(run.inputSha256!==crypto.createHash('sha256').update(text).digest('hex'))throw new Error(`Stale Gemma analysis for ${date}.`);validateResult(run.analysis,day);}
 await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist/assets',{recursive:true});await fs.mkdir('dist/data',{recursive:true});
 await fs.cp('assets/camera','dist/assets/camera',{recursive:true});
 await fs.copyFile('data/camera/audio-alignment.json','dist/data/camera-audio-alignment.json');
 await fs.copyFile('data/camera/observations.json','dist/data/camera-observations.json');await fs.copyFile('data/camera/combined.json','dist/data/camera-combined.json');
 await fs.copyFile('index.html','dist/index.html');await fs.copyFile('assets/neil-armstrong.jpg','dist/assets/neil-armstrong.jpg');
 const combined=JSON.parse(await fs.readFile('data/camera/combined.json','utf8'));await fs.writeFile('data/camera/view.json',JSON.stringify({model:combined.model,turns:Object.fromEntries(Object.entries(combined.turns).map(([id,r])=>[id,{result:r.result}]))}));
 await esbuild.build({entryPoints:['src/main.jsx'],bundle:true,minify:true,sourcemap:true,outfile:'dist/main.js'});
 for(const date of DATES){await fs.copyFile(`data/days/${date}.json`,`dist/data/source-${date}.json`);await fs.copyFile(`data/runs/${date}.json`,`dist/data/run-${date}.json`);await fs.copyFile(`data/runs/${date}-raw.json`,`dist/data/raw-${date}.json`);}
}
build().catch(error=>{console.error(error);process.exitCode=1;});
