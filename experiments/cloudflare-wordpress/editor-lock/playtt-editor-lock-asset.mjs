// Read-only checks while PHP/write window remains sealed; never opens a window.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PLAYTT_EDITOR_LOCK_PATH,PLAYTT_EDITOR_LOCK_PATCH_SHA,PLAYTT_EDITOR_LOCK_QUERY} from '../src/playtt-editor-lock.js';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const headers={'accept-encoding':'identity','X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN};
const request=(path,options={})=>fetch(origin+path,{headers,redirect:'error',signal:AbortSignal.timeout(45000),...options});
async function json(path){const r=await request(path);assert.equal(r.status,200);return r.json();}
async function state(){const control=await json('/?phase=operator-fence-status'),budget=await json('/__playtt-capacity'),pins=await json('/__playtt-backup-pins'),publisher=await json('/__playtt-publishing');assert.equal(control.coherent,true);assert.equal(control.fence.active,false);assert.equal(control.state.version,43);assert.equal(pins.generation,6);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.window.closed,true);assert.equal(publisher.state,'paused');return{state:control.state,budget,pins,publisher:publisher.state};}
const before=await state(),checks=[];
for(const path of [PLAYTT_EDITOR_LOCK_PATH+'?ver=pinned',PLAYTT_EDITOR_LOCK_PATH+'?'+PLAYTT_EDITOR_LOCK_QUERY+'='+PLAYTT_EDITOR_LOCK_PATCH_SHA]){
 const r=await request(path);assert.equal(r.status,200);const bytes=new Uint8Array(await r.arrayBuffer());assert.equal(bytes.length,1574744);assert.equal(createHash('sha256').update(bytes).digest('hex'),PLAYTT_EDITOR_LOCK_PATCH_SHA);assert.ok(['"'+PLAYTT_EDITOR_LOCK_PATCH_SHA+'"','W/"'+PLAYTT_EDITOR_LOCK_PATCH_SHA+'"'].includes(r.headers.get('etag')));assert.equal(r.headers.get('x-wp-codebox-static'),'r2-range');checks.push({method:'GET',versioned:path.includes(PLAYTT_EDITOR_LOCK_QUERY),bytes:bytes.length,etag:r.headers.get('etag'),contentEncoding:r.headers.get('content-encoding'),sha256:PLAYTT_EDITOR_LOCK_PATCH_SHA});
}
const head=await request(PLAYTT_EDITOR_LOCK_PATH,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'1574744');assert.equal((await head.arrayBuffer()).byteLength,0);
const anon=await request(PLAYTT_EDITOR_LOCK_PATH,{headers:{}});assert.equal(anon.status,404);
const after=await state();assert.deepEqual(after,before);
const result={at:new Date().toISOString(),result:'pass',origin,checks,headVerified:true,anonymousStatus:anon.status,canonicalVersion:43,pins:6,sealed:true,windowClosed:true,stateAndBudgetUnchanged:true,remainingBytes:after.budget.remainingBytes,phpInvoked:false,productionChanged:false};
await writeFile('artifacts/playtt-editor-lock-asset.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
