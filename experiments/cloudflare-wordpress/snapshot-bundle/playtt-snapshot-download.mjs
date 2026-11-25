import assert from 'node:assert/strict';

export function createCloudflareSnapshotSource({bucketName,token,fetchImpl=fetch}){
 assert.ok(['playtt-wordpress-rebuild-audit','playtt-wordpress-pin-restore-audit'].includes(bucketName));
 assert.ok(typeof token==='string'&&token.length>0&&token.length<=8192);
 const base=`https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/r2/buckets/${bucketName}/objects/`;
 const stats={requests:0,downloadedBytes:0};
 const bucket={async get(key){
  assert.ok(typeof key==='string'&&key.startsWith('sites/default/')&&!key.includes('..')&&!key.includes('\\'));
  assert.ok(stats.requests<5,'Snapshot exceeded its bounded dependency request count');stats.requests++;
  const r=await fetchImpl(base+encodeURIComponent(key),{method:'GET',headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(45000),redirect:'error'});
  if(r.status===404){await r.body?.cancel();return null;}
  if(r.status!==200){await r.body?.cancel();throw new Error('Snapshot GET failed: HTTP '+r.status);}
  assert.ok(r.body);const reader=r.body.getReader(),parts=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;stats.downloadedBytes+=value.length;assert.ok(size<=8*1024*1024&&stats.downloadedBytes<=10*1024*1024,'Snapshot response exceeded its byte budget');parts.push(value);}}
  catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  return {size,arrayBuffer:async()=>bytes.buffer};
 }};
 return {bucket,stats};
}
