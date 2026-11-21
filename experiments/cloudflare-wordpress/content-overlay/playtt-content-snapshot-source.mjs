// Explicit content-overlay download profile for the existing private bucket.
// One current manifest + one full-base manifest + one ZIP + <=64 replacements.
// This changes neither the legacy downloader nor any cloud write allowance.
import assert from 'node:assert/strict';
export function createContentSnapshotSource({token,fetchImpl=fetch}){
 assert.ok(typeof token==='string'&&token.length>0&&token.length<=8192);
 const base='https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/r2/buckets/playtt-wordpress-session-audit/objects/';
 const stats={requests:0,downloadedBytes:0};
 const bucket={async get(key){
  assert.ok(typeof key==='string'&&/^sites\/default\/(?:markdown\/revisions\/[a-f0-9-]{36}\.json|restore-packs\/[a-f0-9]{64}\.zip|(?:markdown|uploads|wp-content)\/objects\/[a-f0-9]{64})$/.test(key));
  assert.ok(stats.requests<67,'Content snapshot exceeded its bounded dependency count');stats.requests++;
  const response=await fetchImpl(base+encodeURIComponent(key),{method:'GET',headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(45000),redirect:'error'});
  if(response.status===404){await response.body?.cancel();return null;}
  if(response.status!==200){await response.body?.cancel();throw Error('Content snapshot GET failed: HTTP '+response.status);}
  assert.ok(response.body);const reader=response.body.getReader(),parts=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;stats.downloadedBytes+=value.length;assert.ok(size<=8*1024*1024&&stats.downloadedBytes<=10*1024*1024,'Content snapshot exceeded its byte budget');parts.push(value);}}
  catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  return {size,arrayBuffer:async()=>bytes.buffer};
 }};
 return {bucket,stats};
}
