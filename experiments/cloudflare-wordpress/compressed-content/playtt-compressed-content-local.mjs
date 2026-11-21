// Local workerd codec/restore proof only; no WordPress, DO, deployment or cloud.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
const finalSource=process.argv.includes('--final-source');
assert.deepEqual(process.argv.slice(2),finalSource?['--local','--final-source']:['--local']);
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const prefix=finalSource?'artifacts/playtt-compressed-content-local-final':'artifacts/playtt-compressed-content-local';
const ownerPath=prefix+'-owned-private.json';
if(finalSource){const prior=await load('artifacts/playtt-compressed-content-local-owned-private.json');assert.equal(prior.phase,'finished');assert.equal(prior.localProcessesDisposed,true);}
try{await access(ownerPath);throw Error('Existing local codec attempt; inspect, do not replay');}catch(e){if(e.code!=='ENOENT')throw e;}
const proof=await load('artifacts/playtt-compressed-content-prototype-owned-private.json');assert.equal(proof.phase,'verified');
const directory=await mkdtemp(resolve('artifacts/compressed-content-local-')),scriptPath=join(directory,'harness.mjs');
const code=`
import {createCompressedContent,readCompressedContent,readExactCompressedStream} from './src/playtt-compressed-content.ts';
const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
const groups=['markdown','uploads','wpContent'];
async function identify(c){const result={wpContentDeleted:c.wpContentDeleted};for(const g of groups){result[g]=[];for(const f of c[g])result[g].push({path:f.path,size:f.bytes.length,sha256:await sha(f.bytes)});result[g].sort((a,b)=>a.path.localeCompare(b.path));}return result;}
export default {async fetch(request,env){
 const url=new URL(request.url);if(url.hostname!=='127.0.0.1'||url.pathname!=='/verify'||request.method!=='POST')return new Response('Local only',{status:403});
 const input=await request.json(),object=await env.FIXTURE.get(input.manifestKey);if(!object||object.size>262144)return new Response('Missing',{status:400});
 const raw=new Uint8Array(await object.arrayBuffer());if(await sha(raw)!==input.manifestSha256)return new Response('Hash mismatch',{status:400});
 const m=JSON.parse(new TextDecoder().decode(raw));
 const first=await readCompressedContent(env.FIXTURE,'sites/default',m),firstIdentity=await identify(first.contents);
 const encoded=await createCompressedContent(env.FIXTURE,'sites/default',m,first.base,(g,p)=>first.contents[g].find(f=>f.path===p).bytes);
 if(!encoded)throw Error('Unexpected fallback');
 const composed={get:key=>key===encoded.descriptor.delta.objectKey?Promise.resolve({size:encoded.bytes.length,body:new Blob([encoded.bytes]).stream(),arrayBuffer:async()=>encoded.bytes.buffer}):env.FIXTURE.get(key)};
 const second=await readCompressedContent(composed,'sites/default',{...m,restorePack:encoded.descriptor});
 const oversized=await env.FIXTURE.get('__local-test/bomb');let boundedRejected=false;
 try{await readExactCompressedStream(oversized.body.pipeThrough(new DecompressionStream('gzip')),360087,1310720);}
 catch(error){if(!String(error.message).includes('exceeds declared size'))throw error;boundedRejected=true;}
 return Response.json({first:firstIdentity,second:await identify(second.contents),compressedBytes:encoded.bytes.length,compressedSha256:encoded.descriptor.delta.sha256,decodedBytes:encoded.descriptor.delta.decodedBytes,boundedRejected});
}};`;
await build({stdin:{contents:code,resolveDir:process.cwd(),sourcefile:'compressed-local.ts',loader:'ts'},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:scriptPath,external:['node:*'],logLevel:'silent'});
const sourceSha256=sha((await readFile('src/playtt-compressed-content.ts','utf8')).replaceAll('\r\n','\n'));
const owner={at:new Date().toISOString(),phase:'starting',directory,sourceSha256,finalSource};await writeFile(ownerPath,JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
let mf,outboundAttempts=0;let report;
try{
 mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-compressed-content-local-only',modules:true,scriptPath,host:'127.0.0.1',port:0,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat'],cf:false,log:new Log(LogLevel.ERROR),r2Buckets:['FIXTURE'],telemetry:{enabled:false},outboundService:()=>{outboundAttempts++;throw Error('No outbound requests allowed');}}));
 const origin=String(await mf.ready).replace(/\/$/,''),bucket=await mf.getR2Bucket('FIXTURE');owner.phase='running';owner.origin=origin;await writeFile(ownerPath,JSON.stringify(owner,null,2)+'\n');
 for(const item of proof.physicalIndex.objects){const bytes=await readFile(proof.directory+'/independent/'+item.file);assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.size);await bucket.put(item.key,bytes);}
 await bucket.put('__local-test/bomb',gzipSync(new Uint8Array(2*1024*1024)));
 const response=await fetch(origin+'/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({manifestKey:proof.manifest.manifestKey,manifestSha256:proof.manifestSha256}),signal:AbortSignal.timeout(45000)});
 assert.equal(response.status,200);const result=await response.json();
 assert.deepEqual(result.first,proof.expected);assert.deepEqual(result.second,proof.expected);assert.equal(result.boundedRejected,true);assert.equal(outboundAttempts,0);
 assert.equal(result.compressedSha256,proof.manifest.restorePack.delta.sha256,'Final encoding differs from independently materialized prototype');
 report={schema:'playtt/local-compressed-content-proof/v1',at:new Date().toISOString(),result:'pass',sourceSha256,finalSource,realWorkerd:true,coldLocalInstance:true,localR2:true,physicalDependencies:4,canonicalFiles:298,firstRestoreExact:true,workerdReencodingAndSecondRestoreExact:true,encodedArchiveMatchesIndependentPrototype:true,compressedBytes:result.compressedBytes,decodedBytes:result.decodedBytes,oversizedDecodedStreamRejected:true,decodedStreamTestBytes:2097152,decodedStreamAllowance:360087,outboundAttempts,wordpressOrPhpExecuted:false,workerEntrypointIntegrated:false,providerTested:false,cpuOrWholeIsolateMemoryMeasured:false,localProcessesDisposed:false};
 owner.phase='finished';
}catch(error){owner.phase='failed';owner.errorName=error.name;throw error;}
finally{if(mf)await mf.dispose();owner.localProcessesDisposed=true;await writeFile(ownerPath,JSON.stringify(owner,null,2)+'\n');}
report.localProcessesDisposed=true;await writeFile(prefix+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
