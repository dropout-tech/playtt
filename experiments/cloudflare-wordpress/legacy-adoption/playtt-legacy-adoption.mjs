// Transport-independent, bounded recovery procedure. No network client or deploy.
// A transport must enforce an owned fence, real write accounting and conditional
// object/pointer writes. An operator response or journal alone is never truth.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
const ROOT='sites/default',POINTER=ROOT+'/markdown/current.json';
const sha=b=>createHash('sha256').update(b).digest('hex'),enc=x=>new TextEncoder().encode(JSON.stringify(x));
const pointer=a=>Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,a[k]]));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const contents=c=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]));
const descriptor=p=>({...p,objects:p.objects.map(({key,bytes,sha256})=>({key,size:bytes.length,sha256}))});
export async function prepareLegacyAdoption({sourceDirectory,sourceAnchor,targetDirectory,targetAnchor,sourceVersion}){
 assert.ok(Number.isSafeInteger(sourceVersion)&&sourceVersion>0&&sourceVersion<Number.MAX_SAFE_INTEGER);
 const source=await openSnapshotBundle(sourceDirectory,sourceAnchor),target=await openSnapshotBundle(targetDirectory,targetAnchor);
 assert.equal(source.graph.format,'compressed-content');assert.equal(target.graph.format,'content-overlay');assert.equal(target.graph.manifestEncoding,'plain-json');
 assert.notEqual(sourceAnchor.revision,targetAnchor.revision);assert.deepEqual(contents(source.graph.contents),contents(target.graph.contents));assert.deepEqual(source.graph.contents.wpContentDeleted,target.graph.contents.wpContentDeleted);
 assert.equal(sourceAnchor.packKey,targetAnchor.packKey);assert.equal(sourceAnchor.packSha256,targetAnchor.packSha256);assert.equal(sourceAnchor.packBytes,targetAnchor.packBytes);
 const base=target.graph.base,unchanged=new Set([base.manifestKey,base.restorePack.objectKey,...['files','uploads','wpContent'].flatMap(k=>(base[k]||[]).map(f=>f.objectKey))]);
 const objects=target.graph.objects.filter(o=>!unchanged.has(o.key)).map(o=>({key:o.key,sha256:o.sha256,bytes:Uint8Array.from(o.bytes)}));
 // Stage raw dependencies before the manifest. It is still not a live pointer.
 objects.sort((a,b)=>(a.key===targetAnchor.manifestKey)-(b.key===targetAnchor.manifestKey)||a.key.localeCompare(b.key));
 const plan={schema:'playtt/legacy-adoption-plan/v1',source:backupPinInput(sourceAnchor),target:backupPinInput(targetAnchor),sourceVersion,targetVersion:sourceVersion+1,pointerKey:POINTER,objects};
 const digest=sha(enc(descriptor(plan)));validatePlan(plan,digest);return{plan,digest};
}
function validatePlan(plan,digest){
 assert.equal(plan.schema,'playtt/legacy-adoption-plan/v1');assert.equal(plan.pointerKey,POINTER);backupPinInput(plan.source);backupPinInput(plan.target);assert.equal(plan.targetVersion,plan.sourceVersion+1);assert.ok(Number.isSafeInteger(plan.sourceVersion)&&plan.sourceVersion>0&&Number.isSafeInteger(plan.targetVersion));assert.notEqual(plan.source.revision,plan.target.revision);
 assert.ok(plan.objects.length>0&&plan.objects.length<=65);let total=0;const seen=new Set();
 for(const o of plan.objects){assert.ok(!seen.has(o.key));seen.add(o.key);assert.equal(sha(o.bytes),o.sha256);assert.ok(o.bytes.length<=1024*1024);total+=o.bytes.length;if(o.key===plan.target.manifestKey)assert.equal(o.sha256,plan.target.manifestSha256);else assert.ok(new RegExp('^'+ROOT+'/(markdown|uploads|wp-content)/objects/'+o.sha256+'$').test(o.key));}
 assert.ok(seen.has(plan.target.manifestKey));assert.ok(total<=1024*1024+256*1024);assert.equal(sha(enc(descriptor(plan))),digest,'Recovery plan changed');
}
function classify(s,p){
 assert.equal(s.publisherPaused,true);assert.equal(s.pending,0,'Pending storage attempt requires independent completion evidence; cannot resume');assert.equal(s.fenceOwned,true);
 const src=pointer(p.source),dst=pointer(p.target);
 if(same(s.state.pointer,src)&&s.state.version===p.sourceVersion&&same(s.receipt,src)&&same(s.r2Pointer,src))return'source';
 if(same(s.state.pointer,dst)&&s.state.version===p.targetVersion&&same(s.receipt,dst)&&(same(s.r2Pointer,src)||same(s.r2Pointer,dst)))return same(s.r2Pointer,dst)?'target-complete':'target-pointer-pending';
 throw Error('Recovery state differs from both exact permitted states; no mutation is allowed');
}
function containsPins(now,before){for(const pin of before)assert.ok(now.some(x=>same(backupPinInput(x),backupPinInput(pin))),'Existing pin changed or disappeared');}
function requireWrites(state,bytes,operations){if(!operations)return;assert.equal(state.admitsNewWrites,true,'Write window is closed or expired');assert.ok(bytes<=state.remainingWriteBytes&&operations<=state.remainingWriteOperations,'Insufficient remaining write allowance');}
export async function executeLegacyAdoption({plan,digest,io,journal}){
 validatePlan(plan,digest);assert.equal(typeof journal,'function');
 const record=async(phase,details={})=>journal({schema:'playtt/legacy-adoption-event/v1',planDigest:digest,phase,...details});
 // Renew before inspection, and again before each mutation. Never release a
 // fence in finally: an error after adoption may leave an unfinished pointer.
 await io.renewFence();let state=await io.inspect(),mode=classify(state,plan);const pinsBefore=await io.listPins();
 assert.ok(pinsBefore.some(x=>same(backupPinInput(x),plan.source)),'Source backup pin must already exist');
 await record('observed',{mode,version:state.state.version});
 const missing=[];
 for(const item of plan.objects){const bytes=await io.getObject(item.key,item.bytes.length);if(bytes===null)missing.push(item);else assert.equal(sha(bytes),item.sha256,'Existing immutable object conflicts; never overwrite');}
 const pointerBytes=enc(pointer(plan.target));const requiredBytes=missing.reduce((n,o)=>n+o.bytes.length,0)+(mode==='target-complete'?0:pointerBytes.length),requiredOperations=missing.length+(mode==='target-complete'?0:1);
 requireWrites(state,requiredBytes,requiredOperations);
 if(mode!=='source')assert.equal(missing.length,0,'Adopted target lost dependencies; preserve containment');
 for(const item of missing){
  await io.renewFence();const current=await io.inspect();assert.equal(classify(current,plan),'source');requireWrites(current,item.bytes.length+pointerBytes.length,2);await record('upload-intent',{key:item.key,bytes:item.bytes.length});
  // A thrown/unknown write response stops this attempt. A later invocation
  // reads the exact object and skips it, keeping its original attempt charged.
  await io.putAbsent(item.key,Uint8Array.from(item.bytes));const bytes=await io.getObject(item.key,item.bytes.length);assert.ok(bytes!==null);assert.equal(sha(bytes),item.sha256);await record('upload-verified',{key:item.key});
 }
 await io.renewFence();mode=classify(await io.inspect(),plan);await record('pin-intent');
 // Server pin verification must walk and hash the full base and replacements.
 await io.ensurePin(plan.target);const pinned=await io.listPins();containsPins(pinned,pinsBefore);assert.ok(pinned.some(x=>same(backupPinInput(x),plan.target)));
 await io.verifySnapshot(plan.target);await record('target-pinned-and-dependencies-verified');
 if(mode==='source'){
  await io.renewFence();const current=await io.inspect();assert.equal(classify(current,plan),'source');requireWrites(current,pointerBytes.length,1);await record('adopt-intent',{version:plan.targetVersion});
  try{await io.adopt(pointer(plan.target),plan.targetVersion);}catch(error){const observed=classify(await io.inspect(),plan);await record('adopt-response-unknown',{observed});if(observed==='source')throw error;}
 }
 mode=classify(await io.inspect(),plan);assert.notEqual(mode,'source');
 if(mode==='target-pointer-pending'){
  await io.renewFence();const current=await io.inspect();assert.equal(classify(current,plan),'target-pointer-pending');requireWrites(current,pointerBytes.length,1);await record('pointer-intent');
  try{await io.compareAndSetPointer(pointer(plan.source),pointer(plan.target));}catch(error){const observed=classify(await io.inspect(),plan);await record('pointer-response-unknown',{observed});if(observed!=='target-complete')throw error;}
 }
 assert.equal(classify(await io.inspect(),plan),'target-complete');containsPins(await io.listPins(),pinsBefore);await record('both-pointers-verified');
 // Caller closes/seals writes and releases its fence only after this result.
 return{result:'adopted-and-pointer-verified',planDigest:digest,sourceVersion:plan.sourceVersion,targetVersion:plan.targetVersion,sourcePinPreserved:true,targetPinned:true,bothPointersVerified:true,containmentStillHeld:true};
}
