import test from 'node:test';
import assert from 'node:assert/strict';
import {createContentSnapshotSource} from '../scripts/playtt-content-snapshot-source.mjs';
const key='sites/default/markdown/objects/'+'a'.repeat(64);
test('content downloader uses only fixed-account/bucket GETs and admits exactly67 dependencies',async()=>{
 let calls=0;const s=createContentSnapshotSource({token:'synthetic-token',fetchImpl:async(url,options)=>{
  calls++;assert.equal(url,'https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/r2/buckets/playtt-wordpress-session-audit/objects/'+encodeURIComponent(key));
  assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.headers.authorization,'Bearer synthetic-token');assert.ok(options.signal instanceof AbortSignal);return new Response('');
 }});
 for(let i=0;i<67;i++)assert.equal((await s.bucket.get(key)).size,0);
 await assert.rejects(s.bucket.get(key),/dependency count/);assert.equal(calls,67);assert.equal(s.stats.downloadedBytes,0);
 for(const invalid of ['sites/other/markdown/objects/'+'a'.repeat(64),'sites/default/markdown/current.json','../escape',key+'?query'])await assert.rejects(s.bucket.get(invalid));assert.equal(calls,67);
});
test('oversized individual and cumulative streams cancel before exposing partial bytes',async()=>{
 for(const mode of ['individual','cumulative']){let canceled=0,calls=0;const source=createContentSnapshotSource({token:'synthetic-token',fetchImpl:async()=>{calls++;return new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array((mode==='individual'?9:6)*1024*1024));if(mode==='cumulative'&&calls===1)c.close();},cancel(){canceled++;}}));}});
  if(mode==='cumulative')assert.equal((await source.bucket.get(key)).size,6*1024*1024);
  await assert.rejects(source.bucket.get(key),/byte budget/);assert.equal(canceled,1);
 }
});
test('missing and failed HTTP responses never include provider bodies or credentials',async()=>{
 for(const status of [404,401,403,500]){const s=createContentSnapshotSource({token:'synthetic-token',fetchImpl:async()=>new Response('sensitive-error-details',{status})});
  if(status===404)assert.equal(await s.bucket.get(key),null);else await assert.rejects(s.bucket.get(key),{message:'Content snapshot GET failed: HTTP '+status});
 }
});
