// Complete snapshot graph and narrow content comparison after real Browser UI.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {parse as yaml} from 'yaml';
import {openSnapshotBundle,exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {createCloudflareSnapshotSource} from './playtt-snapshot-download.mjs';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
import {isMetadataOverlay} from '../src/playtt-metadata-overlay.ts';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-window-retry-backup-',origin='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n'),sha=b=>createHash('sha256').update(b).digest('hex');
const resumeLocal=process.argv.includes('--resume-local');
if(!resumeLocal){try{await access(prefix+'owned-private.json');throw Error('Existing UI backup attempt: inspect before retry');}catch(e){if(e.code!=='ENOENT')throw e;}}
const closed=await load('artifacts/playtt-window-retry-closed.json'),ui=await load('artifacts/playtt-window-retry-owned-private.json'),browser=await load('artifacts/playtt-window-retry-browser-private.json');
assert.equal(closed.result,'sealed');assert.equal(browser.result,'pass');assert.equal(browser.tabClosed,true);assert.equal(ui.id,193);assert.equal(browser.marker,ui.marker);assert.equal(browser.saveFailureObserved,true);assert.equal(browser.unsavedTextRetained,true);assert.equal(browser.retrySavedAndReloaded,true);const refusal=await load('artifacts/playtt-window-retry-verify-failed.json');assert.equal(refusal.result,'pass');assert.equal(refusal.canonicalUnchanged,true);assert.equal(refusal.capacityUnchanged,true);
const location=await load('artifacts/playtt-window-ui-backup-owned-private.json');assert.equal(location.phase,'verified');const baseline=await openSnapshotBundle(location.directory+'/independent',location.anchor);
const secrets=await load('../../../playtt-cms-secrets.json'),oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
async function request(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));return fetch(origin+path,{...options,headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json',...options.headers},redirect:'error',signal:AbortSignal.timeout(45000)});}
async function json(path,body){const r=await request(path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,path+': HTTP '+r.status);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body),before=await op('fence-status'),budget=await json('/__playtt-capacity'),pins=await json('/__playtt-backup-pins');
assert.deepEqual(before.state,closed.state);assert.equal(before.fence.active,false);assert.equal(before.coherent,true);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(pins.generation,6);assert.equal((await json('/__playtt-publishing')).state,'paused');
const owner=resumeLocal?await load(prefix+'owned-private.json'):{directory:resolve('../../../../outputs/backups/cloudflare-wordpress-window-retry/'+new Date().toISOString().replace(/[:.]/g,'-')),phase:'prepared',fenceReleased:true};
if(resumeLocal){assert.equal(owner.phase,'failed');assert.equal(owner.fenceReleased,true);const failed=await load(prefix+'result.json');assert.equal(failed.result,'fail');assert.equal(failed.canonicalVersion,before.state.version);await writeFile(prefix+'initial-failure.json',JSON.stringify(failed,null,2)+'\n',{flag:'wx'});}
const directory=owner.directory;if(!resumeLocal)await mkdir(directory,{recursive:true});await save(prefix+'owned-private.json',owner);
const report={at:new Date().toISOString(),result:'pending',canonicalVersion:before.state.version,remoteR2Mutations:0,sourceRevision:location.anchor.revision};
try{
 const fence=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);
 const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-window-audit',token:oauth}),cache=new Map();const bucket={async get(key){if(cache.has(key))return cache.get(key);const v=await source.bucket.get(key);cache.set(key,v);return v;}};
 let anchor=owner.anchor,independent;
 if(resumeLocal){anchor=backupPinInput(anchor);for(const key of ['revision','manifestKey','persistedAt'])assert.equal(anchor[key],before.state.pointer[key]);independent=await openSnapshotBundle(directory+'/independent',anchor);}
 else{
  const object=await bucket.get(before.state.pointer.manifestKey);assert.ok(object);const raw=new Uint8Array(await object.arrayBuffer()),manifest=JSON.parse(new TextDecoder().decode(raw));for(const key of ['revision','manifestKey','persistedAt'])assert.equal(manifest[key],before.state.pointer[key]);
  let base=manifest;if(isMetadataOverlay(manifest.restorePack)){const v=await bucket.get(manifest.restorePack.base.manifestKey);assert.ok(v);base=JSON.parse(new TextDecoder().decode(await v.arrayBuffer()));}
  anchor=backupPinInput({...before.state.pointer,manifestSha256:sha(raw),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});owner.anchor=anchor;await save(prefix+'owned-private.json',owner);
  await exportSnapshotBundle(bucket,anchor,directory+'/export');independent=await importSnapshotBundle(directory+'/export',anchor,directory+'/independent');
 }
 const old=baseline.graph,next=independent.graph;
 for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(next.manifest[key],old.manifest[key]);
 const oldFiles=new Map(old.contents.markdown.map(f=>[f.path,f.bytes])),newFiles=new Map(next.contents.markdown.map(f=>[f.path,f.bytes]));assert.deepEqual([...newFiles.keys()].sort(),[...oldFiles.keys()].sort());
 const draftPath='page/'+ui.expectedBefore.slug+'.md',changed=[...newFiles].filter(([path,bytes])=>sha(bytes)!==sha(oldFiles.get(path))).map(([path])=>path);report.changedMarkdownFiles=changed;
 assert.ok(changed.every(p=>[draftPath,'_tables/posts.json','_tables/postmeta.json','_tables/usermeta.json','_runtime/playtt-auto-increment.json'].includes(p)),'Unexpected content change after native UI');
 const decode=(files,path)=>JSON.parse(new TextDecoder().decode(files.get(path)));
 function page(bytes){const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes),end=raw.indexOf('\n---\n',4);assert.ok(raw.startsWith('---\n')&&end>4);const meta=yaml(raw.slice(4,end)),marker=/^v1:(\d+):([a-f0-9]{64})$/.exec(meta.__playtt_content);assert.ok(marker);const length=Number(marker[1]);assert.ok(length<bytes.length-1&&bytes.at(-1)===10);const body=bytes.subarray(bytes.length-1-length,bytes.length-1);assert.equal(sha(body),marker[2]);return {meta,body:new TextDecoder('utf-8',{fatal:true}).decode(body)};}
 const oldPage=page(oldFiles.get(draftPath)),newPage=page(newFiles.get(draftPath));assert.equal(oldPage.body,ui.expectedBefore.content);assert.ok(newPage.body.includes(oldPage.body.trim()));assert.ok(newPage.body.includes('<p>'+ui.testText+'</p>'));assert.equal(newPage.body.split(ui.testText).length,2);assert.equal((newPage.body.match(/<!-- wp:paragraph -->/g)||[]).length,3);
 // Pinned WordPress wp_update_post() clears a draft date when its GMT date is
 // zero and edit_date was not explicitly supplied. Scope this exception to
 // this owned draft, require the observed date to equal its modification time,
 // and still compare every other frontmatter field, including date_gmt.
 assert.equal(oldPage.meta.wordpress.date_gmt,'0000-00-00 00:00:00');assert.equal(newPage.meta.wordpress.date,newPage.meta.wordpress.modified);
 assert.deepEqual({...newPage.meta,__playtt_content:oldPage.meta.__playtt_content,wordpress:{...newPage.meta.wordpress,date:oldPage.meta.wordpress.date,modified:oldPage.meta.wordpress.modified,modified_gmt:oldPage.meta.wordpress.modified_gmt}},oldPage.meta);assert.equal(newPage.meta.wordpress.status,'draft');
 const oldPosts=decode(oldFiles,'_tables/posts.json'),posts=decode(newFiles,'_tables/posts.json');for(const row of oldPosts)assert.deepEqual(posts.find(r=>r.ID===row.ID),row);
 const added=posts.filter(r=>!oldPosts.some(old=>old.ID===r.ID));assert.ok(added.length>0&&added.length<=3);for(const row of added){assert.equal(row.post_type,'revision');assert.equal(Number(row.post_parent),193);assert.ok([oldPage.body,newPage.body].includes(row.post_content));}
 const oldMeta=decode(oldFiles,'_tables/postmeta.json'),meta=decode(newFiles,'_tables/postmeta.json');
 for(const row of oldMeta){const now=meta.find(r=>r.meta_id===row.meta_id);assert.ok(now);if(Number(row.post_id)===193&&['_edit_lock','_edit_last'].includes(row.meta_key))assert.deepEqual({...now,meta_value:row.meta_value},row);else assert.deepEqual(now,row);}
 for(const row of meta.filter(r=>!oldMeta.some(old=>old.meta_id===r.meta_id)))assert.ok(Number(row.post_id)===193&&['_edit_lock','_edit_last'].includes(row.meta_key));
 const oldUsers=decode(oldFiles,'_tables/usermeta.json'),users=decode(newFiles,'_tables/usermeta.json'),userKeys=new Set(['session_tokens','wp_persisted_preferences']);
 for(const row of oldUsers){const now=users.find(r=>r.umeta_id===row.umeta_id);assert.ok(now);if(Number(row.user_id)===1&&userKeys.has(row.meta_key))assert.deepEqual({...now,meta_value:row.meta_value},row);else assert.deepEqual(now,row);}
 const addedUserKeys=users.filter(r=>!oldUsers.some(old=>old.umeta_id===r.umeta_id)).map(r=>{assert.equal(Number(r.user_id),1);assert.ok(userKeys.has(r.meta_key));return r.meta_key;});
 const oldSeq=decode(oldFiles,'_runtime/playtt-auto-increment.json'),seq=decode(newFiles,'_runtime/playtt-auto-increment.json');assert.deepEqual(Object.keys(seq.sequences).sort(),Object.keys(oldSeq.sequences).sort());for(const [table,value]of Object.entries(oldSeq.sequences))assert.ok(BigInt(seq.sequences[table])>=BigInt(value));
 const receipt=await registerBackupPin(request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,anchor);assert.equal(receipt.generation,7);await save(directory+'/export/retention-pin.json',receipt);
 const after=await op('fence-status'),afterBudget=await json('/__playtt-capacity'),afterPins=await json('/__playtt-backup-pins');assert.deepEqual(after.state,before.state);assert.deepEqual(afterBudget,budget);assert.equal(afterPins.generation,7);for(const pin of pins.pins)assert.deepEqual(afterPins.pins.find(p=>p.revision===pin.revision),pin);
 Object.assign(report,{result:'pass',anchor,format:next.format,baseRevision:next.base.revision,files:Object.values(next.contents).reduce((n,a)=>n+a.length,0),objects:next.objects.length,payloadBytes:next.payloadBytes,remoteGetsThisRun:source.stats.requests,downloadedBytesThisRun:source.stats.downloadedBytes,resumedVerifiedLocalGraph:resumeLocal,independentCopyVerified:true,unchangedMarkdownFiles:newFiles.size-changed.length,ownedDraft:193,ownedDraftStillPrivate:true,originalParagraphPreserved:true,browserParagraphExact:true,ownedDraftDateUpdatedByNativeSave:true,addedRevisionIds:added.map(r=>Number(r.ID)),addedUserKeys,postmetaRows:meta.length,postTableRows:posts.length,mediaAndThemeIdentical:true,finalPins:7,canonicalUnchanged:true,capacityLedgerUnchanged:true});owner.phase='verified';
}catch(e){report.result='fail';report.errorName=e.name;owner.phase='failed';process.exitCode=1;}
finally{if(!owner.fenceReleased){try{await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;}catch(e){report.fenceReleaseError=e.name;process.exitCode=1;}}await save(prefix+'owned-private.json',owner);report.fenceReleased=owner.fenceReleased;await save(prefix+'result.json',report);console.log(JSON.stringify(report));}
