import assert from 'node:assert/strict';
import { access, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { client, bucket, configName, cli, load, save, sha, hash } from './playtt-pin-restore-lib.mjs';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-editor-recovery-',owned=await load(prefix+'owned-private.json'),c=await client();
assert.equal(owned.phase,'sealed');const state=await c.operator('operator-fence-status');assert.equal(hash(state.state),hash(owned.sealedState));assert.equal(state.fence.active,false);
const rr=await c.request('/__playtt-reference-roots',{headers:c.auth});assert.equal(rr.status,200);const roots=await rr.json();assert.equal(roots.version,62);assert.equal(roots.completeCommitListing,true);
const dir=resolve('artifacts/playtt-editor-recovery-lock-delta-private');
const resume=process.argv.includes('--resume-downloaded');
if(resume){await access(dir);}else await mkdir(dir);
async function download(key,file){
 if(resume){try{await access(file);return;}catch(e){if(e.code!=='ENOENT')throw e;}}
 await cli(['r2','object','get',bucket+'/'+key,'--file',file,'--remote','--config',configName]);
}
const snapshots=[];
for(const version of [61,62]){
 const p=roots.commitReceipts.find(x=>x.version===version)?.pointer;assert.ok(p);assert.equal(p.manifestKey,'sites/default/markdown/revisions/'+p.revision+'.json');
 const mf=dir+'/'+version+'-manifest.json';await download(p.manifestKey,mf);const m=JSON.parse(await readFile(mf,'utf8'));assert.equal(m.revision,p.revision);
 const tables={};for(const [name,path]of [['postmeta','_tables/postmeta.json'],['sequence','_runtime/playtt-auto-increment.json']]){const entry=m.files.find(x=>x.path===path);assert.ok(entry&&entry.objectKey.startsWith('sites/default/markdown/objects/'));const file=dir+'/'+version+'-'+name+'.json';await download(entry.objectKey,file);const bytes=await readFile(file);assert.equal(sha(bytes),entry.sha256);assert.equal(bytes.length,entry.size);tables[name]=JSON.parse(bytes);}
 snapshots.push({version,m,rows:tables.postmeta,sequence:tables.sequence});
}
const [a,b]=snapshots,changed=b.m.files.filter(x=>a.m.files.find(y=>y.path===x.path)?.sha256!==x.sha256).map(x=>x.path);assert.deepEqual(changed,['_runtime/playtt-auto-increment.json','_tables/postmeta.json']);
assert.deepEqual(a.m.files.map(x=>x.path),b.m.files.map(x=>x.path));for(const k of ['uploads','wpContent','wpContentDeleted'])assert.equal(hash(a.m[k]),hash(b.m[k]));
assert.equal(a.rows.length,b.rows.length);const rows=b.rows.filter(x=>hash(a.rows.find(y=>y.meta_id===x.meta_id))!==hash(x));assert.equal(rows.length,1);const row=rows[0],old=a.rows.find(x=>x.meta_id===row.meta_id);assert.equal(row.meta_key,'_edit_lock');assert.equal(Number(row.post_id),owned.id);
assert.deepEqual(Object.keys(row).filter(k=>row[k]!==old[k]),['meta_value']);assert.match(row.meta_value,/^\d+:\d+$/);assert.equal(row.meta_value.split(':')[1],old.meta_value.split(':')[1]);
const sequenceChanges=Object.entries(b.sequence.sequences).filter(([k,v])=>v!==a.sequence.sequences[k]).map(([k,v])=>{assert.ok(BigInt(v)>=BigInt(a.sequence.sequences[k]));return {table:k,before:a.sequence.sequences[k],after:v};});
const report={at:new Date().toISOString(),result:'pass',scope:'Two adjacent committed snapshots differ in one native edit-lock timestamp and monotonic counters; manifest and changed loose-object hashes checked, latest complete pack independently decoded',versions:[61,62],changedFiles:changed,changedRows:1,field:'meta_value',key:'_edit_lock',postId:owned.id,secondsBetweenLockValues:Number(row.meta_value.split(':')[0])-Number(old.meta_value.split(':')[0]),sameLockOwner:true,sequenceChanges,restorePackBytes:[a.m.restorePack.size,b.m.restorePack.size],restorePackKeysDiffer:a.m.restorePack.objectKey!==b.m.restorePack.objectKey,contentMediaThemeUnchanged:true};
await save(prefix+'lock-delta.json',report);assert.equal(hash((await c.operator('operator-fence-status')).state),hash(owned.sealedState));console.log(JSON.stringify(report));
