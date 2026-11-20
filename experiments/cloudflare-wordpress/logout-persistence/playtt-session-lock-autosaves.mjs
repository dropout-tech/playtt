// Decode only the seven changed post tables identified by the manifest audit.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.ok(process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load('artifacts/playtt-session-lock-owned-private.json'),audit=await load('artifacts/playtt-session-lock-cost.json'),backup=await load('artifacts/playtt-session-lock-backup-result.json');assert.equal(audit.result,'pass');assert.equal(backup.result,'pass');assert.equal(backup.finalPins,6);
const old=await openSnapshotBundle(owner.baselineDirectory,owner.baseline);let rows=JSON.parse(new TextDecoder().decode(old.graph.contents.markdown.find(f=>f.path==='_tables/posts.json').bytes));
const versions=audit.changes.filter(c=>c.kind==='full');assert.deepEqual(versions.map(v=>v.version),[24,26,28,30,32,34,36]);for(const v of versions){assert.deepEqual(v.changed,['_tables/posts.json']);assert.deepEqual(v.removed,[]);}
const token=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(token);const changes=[];let total=0;
for(const v of versions){
 const raw=await readFile('artifacts/playtt-session-lock-cost-manifests-private/'+v.version+'.json');assert.equal(sha(raw),v.manifestSha256);const m=JSON.parse(raw),f=m.files.find(f=>f.path==='_tables/posts.json');assert.ok(f&&f.objectKey.startsWith('sites/default/')&&!f.objectKey.includes('..')&&f.size<=512*1024);
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/r2/buckets/playtt-wordpress-session-audit/objects/'+encodeURIComponent(f.objectKey),{headers:{authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);assert.ok(r.body);const reader=r.body.getReader(),parts=[];let size=0;
 try{for(;;){const p=await reader.read();if(p.done)break;size+=p.value.length;total+=p.value.length;assert.ok(size<=512*1024&&total<=4*1024*1024);parts.push(p.value);}}finally{reader.releaseLock();}
 const bytes=Buffer.concat(parts);assert.equal(bytes.length,f.size);assert.equal(sha(bytes),f.sha256);const next=JSON.parse(bytes.toString('utf8'));assert.equal(next.length,rows.length);const modified=[];
 for(const before of rows){const after=next.find(x=>x.ID===before.ID);assert.ok(after);if(JSON.stringify(after)===JSON.stringify(before))continue;assert.equal(before.ID,'198');assert.equal(before.post_parent,'193');assert.equal(before.post_author,'2');assert.equal(before.post_type,'revision');const fields=Object.keys(after).filter(k=>after[k]!==before[k]);assert.ok(fields.length&&fields.every(k=>['post_date','post_date_gmt','post_modified','post_modified_gmt'].includes(k)));assert.deepEqual({...after,...Object.fromEntries(fields.map(k=>[k,before[k]]))},before);modified.push({id:198,parent:193,author:2,fields,contentExact:true});}
 assert.equal(modified.length,1);changes.push({version:v.version,tableBytes:f.size,sha256:f.sha256,modified});rows=next;
}
const report={at:new Date().toISOString(),result:'pass',remoteGets:7,downloadedBytes:total,allSevenFullCommitsOnlyAutosave198DateChanges:true,contentAndOtherPostsExact:true,changes,committedFullPackBytes:audit.committedFullPackBytes,remoteMutations:0,causalUiFixVerified:false};await writeFile('artifacts/playtt-session-lock-autosaves.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
