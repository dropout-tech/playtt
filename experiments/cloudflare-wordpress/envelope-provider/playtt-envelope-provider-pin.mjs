// Pin only the independently reconstructed, current, sealed private snapshot.
// A pin proves recoverability; native workflow/content acceptance is separate.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
assert.deepEqual(process.argv.slice(2),['--remote']);
const prefix='artifacts/playtt-envelope-provider-backup-',load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const owner=await load(prefix+'owned-private.json'),ui=await load('artifacts/playtt-envelope-provider-ui-owned-private.json'),run=await load('artifacts/playtt-envelope-provider-ui-result.json');
assert.equal(owner.phase,'independent-copy-verified-awaiting-diff');assert.equal(ui.phase,'closed-sealed');assert.equal(run.contained,true);
const independent=await openSnapshotBundle(owner.directory+'/independent',owner.anchor),materializedIndex=await load(owner.directory+'/materialized/bundle.json'),full=await openSnapshotBundle(owner.directory+'/materialized',materializedIndex.anchor);
const normalize=g=>Object.fromEntries(['markdown','uploads','wpContent'].map(k=>[k,[...g.contents[k]].sort((a,b)=>a.path.localeCompare(b.path))]));
assert.deepEqual(normalize(independent.graph),normalize(full.graph));assert.deepEqual(independent.graph.contents.wpContentDeleted,full.graph.contents.wpContentDeleted);assert.equal(full.graph.format,'full-pack');
const secrets=await load('../../../playtt-cms-secrets.json'),origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
async function request(path,options={}){assert.ok(['/?phase=operator-fence-status','/?phase=operator-fence-acquire','/?phase=operator-fence-release','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].includes(path));return fetch(origin+path,{...options,headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json',...options.headers},redirect:'error',signal:AbortSignal.timeout(45000)});}
async function json(path,body){const r=await request(path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});assert.equal(r.status,200);return r.json();}
async function snapshot(){const results=await Promise.allSettled(['/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].map(p=>json(p)));for(const r of results)assert.equal(r.status,'fulfilled');const[s,b,p,pub]=results.map(r=>r.value);assert.equal(s.coherent,true);assert.deepEqual(s.state,run.after.state);assert.equal(s.state.pointer.revision,owner.anchor.revision);assert.equal(b.writeTracking.pending,0);assert.equal(b.writeTracking.sealed,true);assert.equal(b.writeTracking.window.closed,true);assert.equal(pub.state,'paused');return{s,b,p};}
const before=await snapshot();assert.equal(before.s.fence.active,false);assert.equal(before.p.generation,13);
const report={at:new Date().toISOString(),result:'pending',canonicalVersion:before.s.state.version,anchor:owner.anchor,format:independent.graph.format,manifestEncoding:independent.graph.manifestEncoding,objects:independent.graph.objects.length,files:independent.graph.contents.markdown.length+independent.graph.contents.uploads.length+independent.graph.contents.wpContent.length,independentOpenedAgain:true,fullMaterializedOpenedAgain:true,allContentsExact:true,nativeAcceptance:'separate-verification-required'};
try{
 const f=await json('/?phase=operator-fence-acquire',{ttlSeconds:600});owner.fenceToken=f.token;owner.fenceReleased=false;owner.phase='pinning';await save(prefix+'owned-private.json',owner);
 const receipt=await registerBackupPin(request,secrets.WORDPRESS_OPERATOR_TOKEN,f.token,owner.anchor);assert.equal(receipt.generation,14);await save(owner.directory+'/export/retention-pin.json',receipt);
 const after=await snapshot();assert.equal(after.p.generation,14);assert.equal(after.b.chargedBytes,before.b.chargedBytes);assert.equal(after.b.chargedPuts,before.b.chargedPuts);for(const p of before.p.pins)assert.deepEqual(after.p.pins.find(n=>n.revision===p.revision),p);
 owner.phase='verified';report.finalPins=14;report.result='recovery-pin-verified';report.canonicalAndAccountingUnchanged=true;
}catch(e){report.result='fail';report.errorName=e.name;process.exitCode=1;}
finally{if(owner.fenceReleased===false){await json('/?phase=operator-fence-release',{token:owner.fenceToken});owner.fenceReleased=true;}await save(prefix+'owned-private.json',owner);report.fenceReleased=owner.fenceReleased;await save(prefix+'result.json',report);console.log(JSON.stringify(report));}
