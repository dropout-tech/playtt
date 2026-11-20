// Preserve and compare the completed restore exercise; target remains sealed.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {openSnapshotBundle,exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {createCloudflareSnapshotSource} from './playtt-snapshot-download.mjs';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-window-restore-backup-',origin='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n'),sha=b=>createHash('sha256').update(b).digest('hex');
try{await access(prefix+'owned-private.json');throw Error('Existing backup attempt: inspect before retry');}catch(e){if(e.code!=='ENOENT')throw e;}
const restored=await load('artifacts/playtt-window-restore-cold-result.json');assert.equal(restored.result,'pass');assert.equal(restored.writeSealed,true);assert.equal(restored.windowClosed,true);
const location=await load('artifacts/playtt-window-backup-owned-private.json'),baseAnchor=location.anchors.find(x=>x.label==='final').anchor;
const baseline=await openSnapshotBundle(location.directory+'/final-independent',baseAnchor),secrets=await load('../../../playtt-cms-secrets.json');
const oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
async function request(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));return fetch(origin+path,{...options,headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json',...options.headers},redirect:'error',signal:AbortSignal.timeout(45000)});}
async function json(path,body){const r=await request(path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,path+': HTTP '+r.status);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body),before=await op('fence-status'),budget=await json('/__playtt-capacity'),pins=await json('/__playtt-backup-pins');
assert.deepEqual(before.state,restored.finalState);assert.equal(before.fence.active,false);assert.equal(before.coherent,true);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(pins.generation,4);assert.equal((await json('/__playtt-publishing')).state,'paused');
const directory=resolve('../../../../outputs/backups/cloudflare-wordpress-window-restore/'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(directory,{recursive:true});
const owner={directory,phase:'prepared',fenceReleased:true};await save(prefix+'owned-private.json',owner);
const report={at:new Date().toISOString(),result:'pending',canonicalVersion:before.state.version,remoteR2Mutations:0,sourceRevision:baseAnchor.revision};
try{
 const fence=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);
 const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-window-audit',token:oauth}),cache=new Map();const bucket={async get(key){if(cache.has(key))return cache.get(key);const v=await source.bucket.get(key);cache.set(key,v);return v;}};
 const object=await bucket.get(before.state.pointer.manifestKey);assert.ok(object);const raw=new Uint8Array(await object.arrayBuffer()),manifest=JSON.parse(new TextDecoder().decode(raw));
 for(const key of ['revision','manifestKey','persistedAt'])assert.equal(manifest[key],before.state.pointer[key]);assert.equal(manifest.restorePack.schema,'wp-codebox/cloudflare-canonical-restore-pack/v1');
 const anchor=backupPinInput({...before.state.pointer,manifestSha256:sha(raw),packKey:manifest.restorePack.objectKey,packSha256:manifest.restorePack.sha256,packBytes:manifest.restorePack.size});owner.anchor=anchor;await save(prefix+'owned-private.json',owner);
 await exportSnapshotBundle(bucket,anchor,directory+'/export');const independent=await importSnapshotBundle(directory+'/export',anchor,directory+'/independent'),old=baseline.graph,next=independent.graph;
 for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(next.manifest[key],old.manifest[key]);
 const oldFiles=new Map(old.contents.markdown.map(f=>[f.path,f.bytes])),newFiles=new Map(next.contents.markdown.map(f=>[f.path,f.bytes]));assert.deepEqual([...newFiles.keys()].sort(),[...oldFiles.keys()].sort());
 const changed=[...newFiles].filter(([path,bytes])=>sha(bytes)!==sha(oldFiles.get(path))).map(([path])=>path);report.changedMarkdownFiles=changed;
 assert.ok(changed.every(p=>['_tables/usermeta.json','_runtime/playtt-auto-increment.json'].includes(p)),'Unexpected content change after restore');
 const decode=(files,path)=>JSON.parse(new TextDecoder().decode(files.get(path)));
 const oldRows=decode(oldFiles,'_tables/usermeta.json'),newRows=decode(newFiles,'_tables/usermeta.json');assert.equal(newRows.length,oldRows.length);
 let changedSessionRows=0;for(const row of oldRows){const nextRow=newRows.find(r=>r.umeta_id===row.umeta_id);assert.ok(nextRow);if(row.meta_key==='session_tokens'&&String(row.user_id)==='1'){assert.deepEqual({...nextRow,meta_value:row.meta_value},row);if(nextRow.meta_value!==row.meta_value)changedSessionRows++;}else assert.deepEqual(nextRow,row);}
 const oldSeq=decode(oldFiles,'_runtime/playtt-auto-increment.json'),seq=decode(newFiles,'_runtime/playtt-auto-increment.json');assert.deepEqual(Object.keys(seq.sequences).sort(),Object.keys(oldSeq.sequences).sort());for(const [table,value]of Object.entries(oldSeq.sequences))assert.ok(BigInt(seq.sequences[table])>=BigInt(value));
 const receipt=await registerBackupPin(request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,anchor);assert.equal(receipt.generation,5);await save(directory+'/export/retention-pin.json',receipt);
 const after=await op('fence-status'),afterBudget=await json('/__playtt-capacity'),afterPins=await json('/__playtt-backup-pins');assert.deepEqual(after.state,before.state);assert.deepEqual(afterBudget,budget);assert.equal(afterPins.generation,5);for(const pin of pins.pins)assert.deepEqual(afterPins.pins.find(p=>p.revision===pin.revision),pin);
 Object.assign(report,{result:'pass',anchor,format:next.format,files:Object.values(next.contents).reduce((n,a)=>n+a.length,0),objects:next.objects.length,payloadBytes:next.payloadBytes,remoteGets:source.stats.requests,downloadedBytes:source.stats.downloadedBytes,independentCopyVerified:true,unchangedMarkdownFiles:newFiles.size-changed.length,changedSessionRows,sequenceTables:Object.keys(seq.sequences).length,postmetaRows:decode(newFiles,'_tables/postmeta.json').length,postTableRows:decode(newFiles,'_tables/posts.json').length,mediaAndThemeIdentical:true,finalPins:5,canonicalUnchanged:true,capacityLedgerUnchanged:true});owner.phase='verified';
}catch(e){report.result='fail';report.errorName=e.name;owner.phase='failed';process.exitCode=1;}
finally{if(!owner.fenceReleased){try{await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;}catch(e){report.fenceReleaseError=e.name;process.exitCode=1;}}await save(prefix+'owned-private.json',owner);report.fenceReleased=owner.fenceReleased;await save(prefix+'result.json',report);console.log(JSON.stringify(report));}
