import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';

assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-write-latency',owned=JSON.parse(await readFile(prefix+'-owned-private.json','utf8'));
assert.equal(owned.origin,origin);assert.equal(owned.phase,'profile-retry-complete');assert.equal(owned.cleanupComplete,false);
try{await access('artifacts/playtt-canonical-writes-native.json');assert.fail('Do not replay a completed comparison');}catch(e){if(e.code!=='ENOENT')throw e;}
const version=(await readFile('artifacts/playtt-canonical-writes-deploy.log','utf8')).match(/Current Version ID:\s*([a-f0-9-]{36})/)?.[1];assert.ok(version);assert.notEqual(version,owned.baselineVersion);
const expected=JSON.parse(await readFile(prefix+'-profile-retry.json','utf8'));
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.state.version,expected.canonicalVersion);assert.equal(before.state.pointer.revision,expected.revision);assert.equal(before.coherent,true);assert.equal(before.fence.active,false);
const sha=x=>createHash('sha256').update(x).digest('hex'),route='pages/'+owned.id;
async function save(phase){owned.phase=phase;await writeFile(prefix+'-owned-private.json',JSON.stringify(owned,null,2));console.log(JSON.stringify({phase,id:owned.id}));}
try{
 await c.login();const actual=await c.rest(route+'?context=edit');assert.equal(actual.status,200);assert.equal(actual.body.slug,owned.marker);assert.equal(sha(actual.body.content.raw),sha(owned.content));await save('candidate-cold-read-verified');
 const writes=[];
 for(let i=8;i<=10;i++){
  const content='<!-- wp:paragraph --><p>'+owned.marker+' 保存延遲量測 '+i+'</p><!-- /wp:paragraph --> \n';
  const at=performance.now(),r=await c.rest(route,{content});assert.equal(r.status,200);assert.equal(sha(r.body.content.raw),sha(content));writes.push({index:i,wallMs:Math.round((performance.now()-at)*1000)/1000});owned.content=content;await save('candidate-write-'+i);
 }
 const fresh=await privateClient();await fresh.login();const after=await fresh.rest(route+'?context=edit');assert.equal(after.status,200);assert.equal(after.body.slug,owned.marker);assert.equal(sha(after.body.content.raw),sha(owned.content));
 const home=await fresh.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(sha(home.body.content.raw),owned.homeHash);await fresh.paused();const state=await fresh.operator('operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
 await save('candidate-complete');const sorted=writes.map(w=>w.wallMs).sort((a,b)=>a-b);
 const report={at:new Date().toISOString(),result:'pass',scope:'Same owned draft, candidate cold read, three sequential native updates without CPU capture, exact trailing-space/LF read in a fresh login and original homepage unchanged. Fixture retained for same-code redeploy/cleanup.',version,id:owned.id,writes,medianMs:sorted[1],minMs:sorted[0],maxMs:sorted.at(-1),wholeResponseClientWallTime:true,contentHash:sha(owned.content),homeHash:owned.homeHash,canonicalVersion:state.state.version,revision:state.state.pointer.revision,publisher:'paused',checks:[...c.checks,...fresh.checks]};await writeFile('artifacts/playtt-canonical-writes-native.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await writeFile('artifacts/playtt-canonical-writes-native-failure.json',JSON.stringify({at:new Date().toISOString(),errorName:error.name,id:owned.id,phase:owned.phase,checks:c.checks},null,2));throw error;}
