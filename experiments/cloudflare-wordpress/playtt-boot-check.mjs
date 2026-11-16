import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:9427';
const remote=!base.startsWith('http://127.0.0.1:');
const token=remote?(await readFile('../../../playtt-probe-secret.txt','utf8')).trim():'local-boot-probe-only';
const results=[];
for(const [route,auth] of [['/health',false],['/health',true],...['worker','durable-object'].flatMap(kind=>['php','streamed-files','mdi-wordpress'].map(phase=>[`/${kind}?phase=${phase}`,true]))]){
  const started=Date.now();
  try {
    const response=await fetch(base+route,{method:'POST',headers:auth?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(45000)});
    const body=await response.text();
    const result={route,authenticated:auth,status:response.status,wallMs:Date.now()-started,cfRay:response.headers.get('cf-ray'),body:body.slice(0,1500)};
    results.push(result);console.log(JSON.stringify(result));
  }catch(error){const result={route,error:String(error),wallMs:Date.now()-started};results.push(result);console.log(JSON.stringify(result));}
}
await writeFile(`artifacts/playtt-boot-${remote?'remote':'local'}.json`,JSON.stringify({at:new Date().toISOString(),base,scope:'CPU boot prerequisite only; no persisted content',results},null,2));
