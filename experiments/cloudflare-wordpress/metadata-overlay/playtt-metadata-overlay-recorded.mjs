import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { randomUUID,createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createCanonicalRestorePack,decodeCanonicalRestorePack } from '../src/canonical-restore-pack.ts';
import { createMetadataOverlay,readMetadataOverlay } from '../src/playtt-metadata-overlay.ts';
import { verifiedBackupPin } from './playtt-backup-pin-client.mjs';
const root='sites/default',sha=b=>createHash('sha256').update(b).digest('hex'),json=b=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
const load=async p=>json(await readFile(p)),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const location=await load('artifacts/playtt-editor-recovery-inspection-backup-location-private.json'),directory=location.directory;
const verification=await load(directory+'/verification.json');assert.equal(verification.result,'pass');assert.equal(verification.version,62);
const baseBytes=await readFile(directory+'/manifest.json'),base=json(baseBytes),zip=await readFile(directory+'/restore.zip');assert.equal(sha(zip),verification.archiveSha256);
const original=await decodeCanonicalRestorePack(base.restorePack,root,{markdown:base.files,uploads:base.uploads,wpContent:base.wpContent,wpContentDeleted:base.wpContentDeleted},zip);
const data=new Map([[base.manifestKey,baseBytes],[base.restorePack.objectKey,zip]]);
for(const item of await load(directory+'/object-inventory.json')){assert.match(item.file,/^(objects\/[a-f0-9]{64}|manifest\.json|restore\.zip)$/);const b=await readFile(directory+'/'+item.file);assert.equal(b.length,item.size);assert.equal(sha(b),item.sha256);data.set(item.key,b);}
const reads=[],bucket={async get(key){reads.push(key);const b=data.get(key);return b?{size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer}:null;}};
const next=structuredClone(base),revision=randomUUID();Object.assign(next,{revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString()});delete next.restorePack;
const changed=[];
for(const path of ['_tables/postmeta.json','_runtime/playtt-auto-increment.json']){
 const f=next.files.find(x=>x.path===path),value=json(data.get(f.objectKey));
 if(path==='_tables/postmeta.json'){const row=value.find(x=>x.post_id==='192'&&x.meta_key==='_edit_lock');assert.ok(row);const [time,user]=row.meta_value.split(':');row.meta_value=String(BigInt(time)+120n)+':'+user;}
 else value.sequences.wp_options=String(BigInt(value.sequences.wp_options)+2n);
 const bytes=new TextEncoder().encode(JSON.stringify(value));f.sha256=sha(bytes);f.size=bytes.length;f.objectKey=`${root}/markdown/objects/${f.sha256}`;data.set(f.objectKey,bytes);changed.push({path,size:bytes.length,objectKey:f.objectKey,sha256:f.sha256});
}
next.restorePack=await createMetadataOverlay(bucket,root,next,base);assert.ok(next.restorePack);const writeReads=reads.length;reads.length=0;
const manifestBytes=new TextEncoder().encode(JSON.stringify(next));data.set(next.manifestKey,manifestBytes);
const restored=await readMetadataOverlay(bucket,root,next);const coldReads=reads.length;
let unchanged=0;for(const group of ['markdown','uploads','wpContent'])for(const item of original[group]){const actual=restored.contents[group].find(x=>x.path===item.path);assert.ok(actual);if(changed.some(x=>x.path===item.path)&&group==='markdown')continue;assert.equal(sha(actual.bytes),sha(item.bytes));unchanged++;}
assert.deepEqual(restored.contents.wpContentDeleted,original.wpContentDeleted);
const full=await createCanonicalRestorePack(root,restored.contents);await decodeCanonicalRestorePack(full.metadata,root,{markdown:next.files,uploads:next.uploads,wpContent:next.wpContent,wpContentDeleted:next.wpContentDeleted},full.bytes);
const output=resolve('../../../../outputs/backups/cloudflare-wordpress-metadata-overlay-local/candidate-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(output,{recursive:true});await mkdir(output+'/objects');
await writeFile(output+'/manifest.json',manifestBytes);await writeFile(output+'/base-manifest.json',baseBytes);await writeFile(output+'/restore.zip',zip);
for(const item of changed)await writeFile(output+'/objects/'+item.sha256,data.get(item.objectKey));
const verified=await verifiedBackupPin(output);assert.equal(verified.format,'metadata-overlay-with-base');assert.equal(verified.dependenciesVerified,true);
await writeFile(output+'/materialized-full.zip',full.bytes);await save('artifacts/playtt-metadata-overlay-local-location-private.json',{directory:output,manifest:next});
const pointerBytes=Buffer.byteLength(JSON.stringify({revision,manifestKey:next.manifestKey,persistedAt:next.persistedAt}));
const overlayWriteBytes=changed.reduce((n,x)=>n+x.size,0)+manifestBytes.length+pointerBytes;
const fullManifestBytes=Buffer.byteLength(JSON.stringify({...next,restorePack:full.metadata}));
const fullWriteBytes=changed.reduce((n,x)=>n+x.size,0)+full.bytes.length+fullManifestBytes+pointerBytes;
const result={at:new Date().toISOString(),result:'pass',scope:'Offline candidate using the complete verified private canonical62 snapshot; simulated next lock/counter values, not a live PHP heartbeat or provider deployment',baseVersion:62,baseRevision:base.revision,baseArchiveSha256:verification.archiveSha256,filesCompared:original.markdown.length+original.uploads.length+original.wpContent.length,unchangedFileBytes:unchanged,changedFiles:changed.map(({path,size})=>({path,size})),manifestBytes:manifestBytes.length,descriptorBytes:Buffer.byteLength(JSON.stringify(next.restorePack)),creationObjectReads:writeReads,coldRestoreObjectReads:coldReads,overlayWriteBytes,fullWriteBytes,avoidedWriteBytes:fullWriteBytes-overlayWriteBytes,estimatedPayloadReductionPercent:100*(1-overlayWriteBytes/fullWriteBytes),portableCompositeBackupVerified:true,materializedFullArchiveVerified:true,materializedArchiveBytes:full.bytes.length,remoteObjectsWritten:0,remotePinsRegistered:0,featureFlagEnabled:false,originalSourceUnchanged:true};
await save('artifacts/playtt-metadata-overlay-recorded.json',result);await save(output+'/local-candidate-verification.json',result);console.log(JSON.stringify(result));
