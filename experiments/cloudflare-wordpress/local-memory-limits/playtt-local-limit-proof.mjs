// Bounded LOCAL capability probe. No WordPress, browser, data stores or cloud.
// Shows why local success and V8 old-space flags are not provider admission tests.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {connectLimitMetrics} from './playtt-local-limit-metrics.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-local-limit-v2-',ownerPath=prefix+'owned-private.json',load=async p=>JSON.parse(await readFile(p,'utf8'));
await access(ownerPath).then(()=>{throw Error('Completed/started attempt exists; inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const versions={};for(const name of ['workerd','miniflare','wrangler'])versions[name]=(await load('node_modules/'+name+'/package.json')).version;
assert.equal(versions.workerd,'1.20260828.1');assert.equal(versions.miniflare,'5.20260828.0-alpha');
const binaryVersion=execFileSync('node_modules/@cloudflare/workerd-windows-64/bin/workerd.exe',['--version'],{encoding:'utf8'}).trim();assert.equal(binaryVersion,'workerd 2026-08-28');
const capnp=await readFile('node_modules/workerd/workerd.capnp'),blobSha=createHash('sha1').update('blob '+capnp.length+'\0').update(capnp).digest('hex');assert.equal(blobSha,'43d59cd6848e71624a2837762fe56828d714f97f');
const originalFlag=process.env.MINIFLARE_WORKERD_V8_FLAGS,size=160*1024*1024,page=4096,results=[];let expectedChecksum=0;for(let i=0;i<size;i+=page)expectedChecksum+=(i/page)%251+1;
const owner={phase:'starting',startedAt:new Date().toISOString(),localProcessesDisposed:false,casesCompleted:0};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
let mf,metrics,outboundAttempts=0;
try{
 for(const flags of [null,'--max-old-space-size=128'])for(const kind of ['array-buffer','wasm-memory']){
  if(flags===null)delete process.env.MINIFLARE_WORKERD_V8_FLAGS;else process.env.MINIFLARE_WORKERD_V8_FLAGS=flags;
  const script=`let held,instanceId,requests=0;
export default{fetch(request){const u=new URL(request.url);if(u.hostname!=='127.0.0.1'||request.method!=='GET')return new Response('Local GET only',{status:403});instanceId??=crypto.randomUUID();requests++;
if(u.pathname==='/allocate'){if(held)return new Response('Already allocated',{status:409});held=${kind==='wasm-memory'?'new WebAssembly.Memory({initial:2560,maximum:2560})':'new ArrayBuffer(167772160)'};const view=new Uint8Array(${kind==='wasm-memory'?'held.buffer':'held'});for(let i=0;i<view.length;i+=4096)view[i]=(i/4096)%251+1;}
else if(u.pathname!=='/status')return new Response('Unknown path',{status:404});if(!held)return Response.json({ready:false,instanceId,requests});const view=new Uint8Array(${kind==='wasm-memory'?'held.buffer':'held'});let checksum=0;for(let i=0;i<view.length;i+=4096)checksum+=view[i];return Response.json({ready:true,kind:${JSON.stringify(kind)},bytes:view.length,checksum,touchedPages:view.length/4096,instanceId,requests});}};`;
  mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-limit-proof',modules:true,script,host:'127.0.0.1',port:9499,inspectorHost:'127.0.0.1',inspectorPort:9500,compatibilityDate:'2026-07-18',cf:false,telemetry:{enabled:false},log:new Log(LogLevel.ERROR),outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));
  const origin=new URL(String(await mf.ready)).origin;assert.equal(origin,'http://127.0.0.1:9499');
  const get=async path=>{const r=await fetch(origin+path,{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);return r.json();};
  metrics=await connectLimitMetrics(await mf.getInspectorURL());
  const before=await get('/status');assert.equal(before.ready,false);const usageBefore=await metrics.retained();const allocated=await get('/allocate'),later=await get('/status'),usageAfter=await metrics.retained();
  assert.equal(allocated.bytes,size);assert.equal(allocated.checksum,expectedChecksum);assert.equal(later.bytes,size);assert.equal(later.checksum,expectedChecksum);assert.equal(later.instanceId,allocated.instanceId);assert.equal(allocated.instanceId,before.instanceId);assert.equal(later.requests,before.requests+2);
  results.push({v8Flags:flags?flags.split(' '):[],kind,allocatedBytes:allocated.bytes,touchedPages:allocated.touchedPages,pageBytes:page,checksum:allocated.checksum,allocationHttp200:true,separateRequestRetainedExact:true,sameInstance:true,requests:later.requests,usageBefore,usageAfter,usageDelta:Object.fromEntries(Object.keys(usageBefore).map(k=>[k,usageAfter[k]-usageBefore[k]])),forcedGc:false,exceptions:metrics.exceptions});
  assert.equal(metrics.exceptions.length,0);await metrics.close();metrics=undefined;await mf.dispose();mf=undefined;owner.casesCompleted++;await writeFile(ownerPath,JSON.stringify(owner,null,2));
 }
 assert.equal(outboundAttempts,0);owner.phase='verified';
}catch(e){owner.phase='failed';await writeFile(prefix+'failure-private.json',JSON.stringify({name:e.name,message:e.message,results}));throw e;}
finally{try{try{if(metrics)await metrics.close();}finally{if(mf){await mf.dispose();mf=undefined;}}}finally{if(originalFlag===undefined)delete process.env.MINIFLARE_WORKERD_V8_FLAGS;else process.env.MINIFLARE_WORKERD_V8_FLAGS=originalFlag;owner.localProcessesDisposed=mf===undefined;owner.environmentRestored=process.env.MINIFLARE_WORKERD_V8_FLAGS===originalFlag;await writeFile(ownerPath,JSON.stringify(owner,null,2));}}
const report={schema:'playtt/local-limit-capability-proof/v1',at:new Date().toISOString(),result:'local-runtime-is-not-cloudflare-memory-limit-emulation',versions,binaryVersion,pinnedWorkerdCommit:'8ea63498c7aa107995f9b2ffee7789631707e09f',installedCapnpMatchesPinnedBlob:true,capnpBlobSha:blobSha,source:'https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/server/server.c%2B%2B',cases:results,localOnly:true,cloudRequests:0,wordpressRequests:0,dataStoresConfigured:false,outboundAttempts,localProcessesDisposed:true,environmentRestored:owner.environmentRestored,limitations:['This proves the pinned local runtime permits these individual160MiB allocations across requests. It does not measure peak process memory or WordPress peak.','V8 old-space128 flag is not an aggregate JavaScript-plus-WASM Cloudflare128MB enforcement mechanism.','Local functional tests remain useful for content/recovery semantics, not cloud resource admission.','Cloudflare documentation describes128MB per isolate including JavaScript and WebAssembly; no Cloudflare request was made here.']};
await writeFile(prefix+'proof.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
