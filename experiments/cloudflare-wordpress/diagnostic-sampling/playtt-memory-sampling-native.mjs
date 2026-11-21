import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));const ownedPath='artifacts/playtt-memory-sampling-owned-private.json';
try{await access(ownedPath);assert.fail('Do not replay an existing owned cycle');}catch(e){if(e.code!=='ENOENT')throw e;}
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.fence.active,false);assert.equal(before.state.version,153);assert.equal(before.state.pointer.revision,'4b8438b1-e89d-4d01-90d3-96d2026d6cf6');
const sha=x=>createHash('sha256').update(x).digest('hex'),marker='playtt-memory-sampling-'+randomUUID();
const initial='<!-- wp:paragraph --><p>'+marker+' 初稿</p><!-- /wp:paragraph -->\n';
const content='<!-- wp:paragraph --><p>'+marker+' 保留末尾空白與換行</p><!-- /wp:paragraph --> \n';
const owned={origin,marker,id:null,initial,content,cleanupComplete:false,phase:'prepared'};await writeFile(ownedPath,JSON.stringify(owned,null,2));
async function save(phase){owned.phase=phase;await writeFile(ownedPath,JSON.stringify(owned,null,2));}
try{
 await c.login();const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);const homeHash=sha(home.body.content.raw);
 const created=await c.rest('pages',{slug:marker,title:marker,status:'draft',content:initial});assert.equal(created.status,201);assert.ok(created.body.id>143);owned.id=created.body.id;await save('created');
 const route='pages/'+owned.id;const updated=await c.rest(route,{content});assert.equal(updated.status,200);assert.equal(sha(updated.body.content.raw),sha(content));await save('updated');
 const fresh=await privateClient();await fresh.login();const actual=await fresh.rest(route+'?context=edit');assert.equal(actual.status,200);assert.equal(actual.body.slug,marker);assert.equal(actual.body.title.raw,marker);assert.equal(actual.body.status,'draft');assert.equal(sha(actual.body.content.raw),sha(content));await save('fresh-verified');
 const original=await fresh.rest('pages/24?context=edit');assert.equal(original.status,200);assert.equal(sha(original.body.content.raw),homeHash);
 const deleted=await fresh.rest(route+'?force=true',undefined,'DELETE');assert.equal(deleted.status,200);assert.equal(deleted.body.deleted,true);assert.equal(deleted.body.previous.id,owned.id);assert.equal(deleted.body.previous.slug,marker);assert.equal((await fresh.rest(route+'?context=edit')).status,404);owned.cleanupComplete=true;await save('cleaned');await fresh.paused();
 const report={at:new Date().toISOString(),result:'pass',scope:'After diagnostic sampling change: native draft create/update, exact trailing-space/LF readback in a fresh login, original homepage unchanged and owned cleanup; no browser UI claim.',id:owned.id,contentHash:sha(content),homeHash,cleanupComplete:true,publisher:'paused',checks:[...c.checks,...fresh.checks]};await writeFile('artifacts/playtt-memory-sampling-native.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await writeFile('artifacts/playtt-memory-sampling-native-failure.json',JSON.stringify({at:new Date().toISOString(),result:'fail',id:owned.id,phase:owned.phase,errorName:error.name,checks:c.checks},null,2));throw error;}
