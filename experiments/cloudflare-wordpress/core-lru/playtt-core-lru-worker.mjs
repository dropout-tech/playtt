// Benchmark fixture only: injected immutable records/sequences, never a WordPress worker.
import{inflateRawSync}from'node:zlib';import{createHash}from'node:crypto';import{createDecodedCoreCache}from'./playtt-core-lru-cache.mjs';
import{records,sequences,payloadSha256}from'./fixture-data.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');let payload,ran=false;
function originalSingle(){let cache;return{get:r=>cache?.record===r?cache.bytes:undefined,set(r,bytes){cache=bytes.buffer.byteLength<=524288?{record:r,bytes}:undefined;},get bytes(){return cache?.bytes.buffer.byteLength||0;},get size(){return cache?1:0;},memory:()=>({bytes:cache?.bytes.buffer.byteLength||0,entries:cache?1:0,buffers:cache?1:0,limit:524288,maxEntries:1})};}
export default{async fetch(request,env){
 const url=new URL(request.url);if(url.hostname!=='127.0.0.1')throw Error('Local only');const mode=env.MODE,phase=env.PHASE;if(!['single','lru512','lru12'].includes(mode))throw Error('Unknown mode');const sequence=sequences.find(s=>s.phase===phase);if(!sequence)throw Error('Unknown trace');
 if(url.pathname==='/load'&&request.method==='POST'){if(payload||ran)throw Error('Load once');payload=new Uint8Array(await request.arrayBuffer());if(sha(payload)!==payloadSha256)throw Error('Payload mismatch');return new Response(null,{status:204});}
 if(url.pathname!=='/run')return new Response(null,{status:404});if(!payload||ran)throw Error('Run once');ran=true;
 const cacheLimit=mode==='lru12'?12582912:524288,cache=mode==='single'?originalSingle():createDecodedCoreCache({mode:'lru',limitBytes:cacheLimit}),digest=createHash('sha256'),verified=new Set();let calls=0,hits=0,misses=0,decodedBytes=0,maxCacheBytes=0,maxEntries=0;
 const start=performance.now();
 for(const [id,flag,count]of sequence.sequence){const r=records[id-1];if(r.id!==id||(flag&3)!==0)throw Error('Trace record mismatch');for(let i=0;i<count;i++){
  let bytes=cache.get(r);if(mode==='single'&&Boolean(bytes)!==Boolean(flag&4))throw Error('Single cache differs from native trace');
  if(bytes)hits++;else{const output=inflateRawSync(payload.subarray(r.offset,r.offset+r.encodedBytes),{maxOutputLength:r.length,info:true,chunkSize:r.length+1}).buffer;if(output.length!==r.length)throw Error('Exact output length mismatch');bytes=new Uint8Array(output.buffer,output.byteOffset,output.byteLength);if(bytes.buffer===payload.buffer)throw Error('Decoded alias of compressed input');if(!verified.has(id)){if(sha(bytes)!==r.sha256)throw Error('Decoded file hash mismatch');verified.add(id);}cache.set(r,bytes);misses++;decodedBytes+=bytes.length;}
  digest.update(bytes);calls++;maxCacheBytes=Math.max(maxCacheBytes,cache.bytes);maxEntries=Math.max(maxEntries,cache.size);if(cache.bytes>cacheLimit)throw Error('Cache capacity exceeded');
 }}
 const elapsedMs=performance.now()-start,streamSha256=digest.digest('hex');if(streamSha256!==sequence.expectedStreamSha256||calls!==sequence.expectedCalls||sha(payload)!==payloadSha256)throw Error('Trace/output/input mismatch');
 // Retain only the bounded cache for the post-run observation.
 globalThis.__playttCacheControl=cache;
 return Response.json({mode,phase,calls,hits,misses,decodedBytes,verifiedFiles:verified.size,streamSha256,payloadSha256,elapsedMs,maxCacheBytes,maxEntries,cache:cache.memory(),expectedStreamBytes:sequence.expectedStreamBytes});
}};
