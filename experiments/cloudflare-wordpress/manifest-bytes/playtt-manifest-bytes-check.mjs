// Differential decoding plus independent expected rejection categories. No cloud or PHP.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {api,enc,sha,root,fixture,envelope,sourceHashes} from './playtt-manifest-bytes-common.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const a=await api('baseline'),b=await api('candidate'),outcomes=[];
async function result(fn){try{return {ok:true,value:await fn()};}catch(e){return {ok:false,name:e.name,message:e.message};}}
async function compare(label,bytes,expectedOk,message){
 const old=await result(()=>a.decodeCanonicalManifestBytes(bytes,root)),next=await result(()=>b.decodeCanonicalManifestBytes(bytes,root));
 assert.deepEqual(next,old,label);assert.equal(next.ok,expectedOk,label);if(message)assert.match(next.message,message,label);outcomes.push({label,ok:next.ok,...(next.ok?{}:{error:next.name})});return next.value;
}
let fullByteAlphabet=false;
for(const [count,padding]of [[0,0],[1,0],[48,0],[200,0],[48,120000]]){
 const m=fixture(count,padding),e=envelope(m),bytes=enc(e);assert.deepEqual(await compare(`valid-${count}-${padding}`,bytes,true),m);
 if(padding){assert.equal(new Set(Buffer.from(e.payload,'base64')).size,256);fullByteAlphabet=true;}
 const oldWire=await a.serializeManifestEnvelope(m,root),newWire=await b.serializeManifestEnvelope(m,root);assert.equal(newWire,oldWire);
 assert.deepEqual(await b.decodeCanonicalManifestBytes(enc(newWire),root),m);
}
const m=fixture(),e=envelope(m),wire=enc(e);
const patches=[['extra-key',{extra:1}],['codec',{codec:'identity'}],['schema',{schema:'v2'}],['revision',{revision:'bad'}],['other-root',{manifestKey:e.manifestKey.replace('default','other')}],['timestamp',{persistedAt:'yesterday'}],['identity-time',{persistedAt:'2026-11-20T00:00:00Z'}],['encoded-hash',{encodedSha256:'0'.repeat(64)}],['decoded-hash',{decodedSha256:'0'.repeat(64)}],['hash-case',{encodedSha256:e.encodedSha256.toUpperCase()}]];
for(const name of ['decodedBytes','encodedBytes'])for(const value of [0,-1,1.5,null,'10',Number.MAX_SAFE_INTEGER+1,(name==='decodedBytes'?b.MAX_MANIFEST_DECODED:b.MAX_MANIFEST_GZIP)+1])patches.push([`${name}-${String(value)}`,{[name]:value}]);
for(const [label,patch]of patches)await compare(label,enc({...e,...patch}),false);
for(const payload of [' '+e.payload,e.payload.slice(1),e.payload.slice(0,-1),e.payload.slice(0,-1)+'-',e.payload.slice(0,-1)+'_',e.payload.slice(0,-1)+'\u0100',e.payload+'='])await compare('bad-base64-'+outcomes.length,enc({...e,payload}),false);
// Same-length nonzero padding bits are accepted by atob but rejected by btoa round trip.
for(const [good,bad,z]of [['AA==','AB==',1],['AAA=','AAB=',2]]){
 assert.equal(atob(good),atob(bad));await compare(`noncanonical-padding-${z}`,enc({...e,payload:bad,encodedBytes:z}),false,/canonical/);
}
await compare('wire-over-limit',Buffer.alloc(b.MAX_MANIFEST_ENVELOPE+1),false,/wire bytes/);
await compare('invalid-wire-utf8',Buffer.from([255]),false);
await compare('wire-not-json',enc('invalid'),false);
for(const value of [null,[],3,'hello',{schema:'unknown'}])await compare('plain-invalid-'+outcomes.length,enc(value),false);
await compare('legacy-plain',enc({files:[]}),true);
for(const [label,raw]of [['utf8',Buffer.from([255])],['json',enc('no JSON')],['nested',wire],['legacy',enc({files:[]})],['bad-path',enc({...m,files:[{...m.files[0],path:'../escape'}]})]])await compare('decoded-'+label,enc(envelope(m,raw)),false);
const bomb=envelope(m,Buffer.alloc(2*1024*1024));bomb.decodedBytes=100;await compare('compressed-bomb',enc(bomb),false,/declared size/);
await compare('decoded-short',enc({...e,decodedBytes:e.decodedBytes+1}),false,/truncated/);
await compare('decoded-long',enc({...e,decodedBytes:e.decodedBytes-1}),false,/declared size/);
const zipped=Buffer.from(e.payload,'base64');for(const [label,bad]of [['truncated',zipped.subarray(0,-4)],['crc',Buffer.from(zipped)]]){if(label==='crc')bad[bad.length-8]^=1;await compare(label+'-gzip',enc({...e,payload:bad.toString('base64'),encodedBytes:bad.length,encodedSha256:sha(bad)}),false);}
const large={...m,padding:''};large.padding='x'.repeat(b.MAX_MANIFEST_DECODED-enc(large).length);assert.equal(enc(large).length,b.MAX_MANIFEST_DECODED);assert.deepEqual(await compare('decoded-at-limit',enc(envelope(large)),true),large);
large.padding+='x';for(const codec of [a,b])await assert.rejects(codec.serializeManifestEnvelope(large,root),/budget/);
// Caller inputs are snapshotted before asynchronous decompression/hashing.
for(const codec of [a,b]){
 const mutable=Buffer.from(wire),pending=codec.decodeCanonicalManifestBytes(mutable,root);mutable.fill(0);assert.deepEqual(await pending,m);
 const original=fixture(),expected=structuredClone(original),serialization=codec.serializeManifestEnvelope(original,root);original.files[0].path='../changed';original.revision='changed';assert.deepEqual(await codec.decodeCanonicalManifestBytes(enc(await serialization),root),expected);
 let canceled=0;const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(20));},cancel(){canceled++;}});await assert.rejects(codec.readCanonicalManifestObject({size:1,body:stream},root),/declared size/);assert.equal(canceled,1);
 let arrayReads=0;const legacy={files:[],padding:'x'.repeat(300000)};assert.deepEqual(await codec.readCanonicalManifestObject({size:enc(legacy).length,json:async()=>legacy,arrayBuffer:async()=>{arrayReads++;throw Error('wrong branch');}},root),legacy);assert.equal(arrayReads,0);
 for(const body of [false,true]){const input={size:wire.length,json:async()=>{throw Error('wrong branch');},arrayBuffer:async()=>Uint8Array.from(wire).buffer,...(body?{body:new Blob([wire]).stream()}: {})};assert.deepEqual(await codec.readCanonicalManifestObject(input,root),m);}
}
const report={schema:'playtt/manifest-bytes-check/v1',result:'pass',sourceHashes,comparisons:outcomes.length,outcomes,all256PayloadBytes:fullByteAlphabet,serializerByteIdentical:true,callerMutationChecks:4,objectStreamAndLegacyCases:8,productionSourceChanged:false,cloudRequests:0,scope:'Standard atob/btoa and String builtins. The internal atob result is Latin-1; this does not redefine a general Unicode conversion API.'};
const path='artifacts/playtt-manifest-bytes-check.json';if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path,'utf8')),report);else await writeFile(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:report.result,comparisons:report.comparisons,all256PayloadBytes:fullByteAlphabet}));
