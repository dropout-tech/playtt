import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-write-latency',owned=JSON.parse(await readFile(prefix+'-owned-private.json','utf8'));
assert.equal(owned.origin,origin);assert.equal(owned.phase,'repeat-serial-complete');assert.equal(owned.cleanupComplete,false);
try{await access(prefix+'-cleanup.json');assert.fail('Owned cleanup is already recorded');}catch(e){if(e.code!=='ENOENT')throw e;}
const expected=JSON.parse(await readFile(prefix+'-repeat-serial.json','utf8'));
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.fence.active,false);assert.equal(before.state.version,expected.canonicalVersion);assert.equal(before.state.pointer.revision,expected.revision);
const sha=v=>createHash('sha256').update(v).digest('hex'),route='pages/'+owned.id;
await c.login();const current=await c.rest(route+'?context=edit');assert.equal(current.status,200);assert.equal(current.body.slug,owned.marker);assert.equal(current.body.title.raw,owned.marker);assert.equal(current.body.status,'draft');assert.equal(sha(current.body.content.raw),sha(owned.content));
const revisions=await c.rest(route+'/revisions?per_page=100');assert.equal(revisions.status,200);assert.ok(Array.isArray(revisions.body));assert.ok(revisions.body.length<100);assert.ok(revisions.body.every(r=>r.parent===owned.id));
const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(sha(home.body.content.raw),owned.homeHash);
const removed=await c.rest(route+'?force=true',undefined,'DELETE');assert.equal(removed.status,200);assert.equal(removed.body.deleted,true);assert.equal(removed.body.previous.id,owned.id);assert.equal(removed.body.previous.slug,owned.marker);assert.equal((await c.rest(route+'?context=edit')).status,404);
owned.phase='cleaned';owned.cleanupComplete=true;owned.revisionIds=revisions.body.map(r=>r.id);await writeFile(prefix+'-owned-private.json',JSON.stringify(owned,null,2));await c.paused();const state=await c.operator('operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
const report={at:new Date().toISOString(),result:'pass',scope:'Fresh-login exact content read after fixed comparisons, original homepage unchanged, identity-checked owned draft removal. Complete backup independently verifies no owned revisions remain.',id:owned.id,revisionIds:owned.revisionIds,contentHash:sha(owned.content),homeHash:owned.homeHash,cleanupComplete:true,canonicalVersion:state.state.version,revision:state.state.pointer.revision,publisher:'paused',checks:c.checks};await writeFile(prefix+'-cleanup.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
