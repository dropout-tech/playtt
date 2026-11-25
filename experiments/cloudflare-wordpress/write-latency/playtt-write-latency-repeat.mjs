import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));const variant=process.argv.find(x=>x.startsWith('--variant='))?.slice(10);assert.ok(['concurrent','serial'].includes(variant));
const prefix='artifacts/playtt-write-latency',file=prefix+'-repeat-'+variant+'.json',owned=JSON.parse(await readFile(prefix+'-owned-private.json','utf8'));assert.equal(owned.origin,origin);assert.equal(owned.cleanupComplete,false);assert.equal(owned.phase,variant==='concurrent'?'candidate-complete':'repeat-concurrent-complete');
try{await access(file);assert.fail('Each variant is measured once');}catch(e){if(e.code!=='ENOENT')throw e;}
const expected=JSON.parse(await readFile(variant==='concurrent'?'artifacts/playtt-canonical-writes-native.json':prefix+'-repeat-concurrent.json','utf8'));
const deployment=variant==='concurrent'?'artifacts/playtt-canonical-writes-deploy.log':prefix+'-serial-deploy.log';const version=(await readFile(deployment,'utf8')).match(/Current Version ID:\s*([a-f0-9-]{36})/)?.[1];assert.ok(version);
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.fence.active,false);assert.equal(before.state.version,expected.canonicalVersion);assert.equal(before.state.pointer.revision,expected.revision);
const sha=v=>createHash('sha256').update(v).digest('hex'),route='pages/'+owned.id;
await c.login();const initial=await c.rest(route+'?context=edit');assert.equal(initial.status,200);assert.equal(initial.body.slug,owned.marker);assert.equal(sha(initial.body.content.raw),sha(owned.content));
const writes=[];
for(let i=0;i<6;i++){
 const content='<!-- wp:paragraph --><p>'+owned.marker+' 固定六次比較 '+variant+' '+i+'</p><!-- /wp:paragraph --> \n';const at=performance.now(),r=await c.rest(route,{content});assert.equal(r.status,200);assert.equal(sha(r.body.content.raw),sha(content));writes.push({index:i,wallMs:Math.round((performance.now()-at)*1000)/1000});owned.content=content;owned.phase='repeat-'+variant+'-'+i;await writeFile(prefix+'-owned-private.json',JSON.stringify(owned,null,2));console.log(JSON.stringify({variant,index:i,wallMs:writes.at(-1).wallMs}));
}
const final=await c.rest(route+'?context=edit');assert.equal(final.status,200);assert.equal(sha(final.body.content.raw),sha(owned.content));const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(sha(home.body.content.raw),owned.homeHash);await c.paused();const state=await c.operator('operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
owned.phase='repeat-'+variant+'-complete';await writeFile(prefix+'-owned-private.json',JSON.stringify(owned,null,2));const sorted=writes.map(w=>w.wallMs).sort((a,b)=>a-b);
const report={at:new Date().toISOString(),result:'pass',scope:'One fixed six-update comparison on the same owned draft; logged-in/warm before timed updates; no CPU capture, sanitized tail on both variants. Sequential order and growing owned revision history are limitations.',variant,version,id:owned.id,writes,medianMs:(sorted[2]+sorted[3])/2,minMs:sorted[0],maxMs:sorted.at(-1),wholeResponseClientWallTime:true,homeUnchanged:true,contentHash:sha(owned.content),canonicalVersion:state.state.version,revision:state.state.pointer.revision,publisher:'paused'};await writeFile(file,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
