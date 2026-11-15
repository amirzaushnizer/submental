const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {analyze,DATES,MODEL}=require('./local-analysis.cjs');
const ROOT=path.resolve(__dirname,'..'),DIST=path.join(ROOT,'dist');
const PORT=Number(process.env.ORBIT_PORT||4180),HOST=process.env.ORBIT_HOST||'127.0.0.1';
const jobs=new Map();let running=false;
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function readBody(req){let body='';for await(const chunk of req){body+=chunk;if(body.length>2048)throw new Error('Request body is too large.');}return JSON.parse(body);}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/status'&&req.method==='GET'){
   const response=await fetch(`${process.env.ORBIT_OLLAMA_URL||'http://127.0.0.1:11434'}/api/tags`,{signal:AbortSignal.timeout(3000)});if(!response.ok)throw new Error('Ollama is not responding.');const data=await response.json();return json(res,200,{local:true,model:MODEL,modelReady:data.models.some(m=>m.name===MODEL),busy:running});
  }
  if(url.pathname==='/api/analyze'&&req.method==='POST'){
   if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'Use application/json.'});
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Open the local app to run analysis.'});
   if(running)return json(res,409,{error:'A local analysis is already running. Wait for it to finish.'});
   const body=await readBody(req);if(!DATES.includes(body.date))return json(res,400,{error:'Unknown demo day.'});
   const id=crypto.randomUUID(),job={id,date:body.date,status:'running',stage:'Starting Gemma locally'};jobs.set(id,job);running=true;
   analyze(body.date,stage=>{job.stage=stage;}).then(result=>{job.status='complete';job.result=result;job.stage='Complete';}).catch(error=>{job.status='failed';job.error=error.message;job.stage='Analysis failed';}).finally(()=>{running=false;});
   return json(res,202,{id,date:job.date});
  }
  if(url.pathname.startsWith('/api/jobs/')&&req.method==='GET'){const job=jobs.get(url.pathname.slice('/api/jobs/'.length));return job?json(res,200,job):json(res,404,{error:'Unknown analysis run.'});}
  if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Unknown API route.'});
  const download=url.pathname.match(/^\/data\/(source|run|raw)-(1969-07-(?:18|20|22))\.json$/);
  if(download&&req.method==='GET'){const [,kind,date]=download;const file=kind==='source'?path.join(ROOT,'data/days',date+'.json'):path.join(ROOT,'data/runs',date+(kind==='raw'?'-raw':'')+'.json');const value=JSON.parse(await fs.readFile(file,'utf8'));return json(res,200,value);}

  if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed.'});
  const file=path.resolve(DIST,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(DIST+path.sep))return json(res,403,{error:'Path not allowed.'});
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8'};
  const content=await fs.readFile(file),headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Content-Length':content.length};
  if(path.extname(file)==='.mp4'){
   headers['Accept-Ranges']='bytes';
   if(req.headers.range){
    const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(!range||(!range[1]&&!range[2])){res.writeHead(416,{'Content-Range':`bytes */${content.length}`});return res.end();}
    const start=range[1]?Number(range[1]):Math.max(0,content.length-Number(range[2])),end=range[1]&&range[2]?Math.min(Number(range[2]),content.length-1):content.length-1;
    if(start>=content.length||end<start){res.writeHead(416,{'Content-Range':`bytes */${content.length}`});return res.end();}
    res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${content.length}`});return res.end(req.method==='HEAD'?undefined:content.subarray(start,end+1));
   }
  }
  res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:content);
 }catch(error){json(res,error.code==='ENOENT'?404:500,{error:error.code==='ENOENT'?'File not found.':error.message});}
});
server.listen(PORT,HOST,()=>console.log(`Neil's local HUD: http://${HOST}:${PORT}\nOllama model: ${MODEL}\nKeep this terminal open for live reruns.`));
