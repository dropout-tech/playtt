import assert from 'node:assert/strict';
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {sep} from 'node:path';
import {createHash} from 'node:crypto';
import {decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';
assert.ok(process.argv.includes('--offline'));
const {directory}=JSON.parse(await readFile('../../../playtt-snapshot-audit-backup-location.json','utf8'));
assert.ok((await realpath(directory)).startsWith((await realpath('../../../../outputs/backups/cloudflare-wordpress-snapshot-audit'))+sep));
const verified=JSON.parse(await readFile(directory+'/verification.json','utf8'));assert.equal(verified.result,'pass');assert.equal(verified.bucket,'playtt-wordpress-retirement-audit');
const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8')),pack=await readFile(directory+'/restore.zip');
assert.equal(createHash('sha256').update(pack).digest('hex'),verified.archiveSha256);
const decoded=await decodeCanonicalRestorePack(manifest.restorePack,'sites/default',{markdown:manifest.files,uploads:manifest.uploads||[],wpContent:manifest.wpContent||[],wpContentDeleted:manifest.wpContentDeleted||[]},pack);
const path='_runtime/playtt-auto-increment.json',source=manifest.files.find(f=>f.path===path),entry=decoded.markdown.find(f=>f.path===path);assert.ok(source&&entry);
const sha=createHash('sha256').update(entry.bytes).digest('hex');assert.equal(sha,source.sha256);assert.equal(entry.bytes.length,source.size);
const metadata=JSON.parse(new TextDecoder().decode(entry.bytes));assert.equal(metadata.schema,'playtt/auto-increment/v1');assert.ok(Object.keys(metadata.sequences).length<=512);
for(const [name,value]of Object.entries(metadata.sequences)){assert.match(name,/^[A-Za-z_][A-Za-z0-9_$-]{0,127}$/);assert.equal(typeof value,'string');assert.match(value,/^(0|[1-9][0-9]{0,18})$/);assert.ok(BigInt(value)<=9223372036854775807n);}
for(const label of ['remote-rest','remote-native']){
 const test=JSON.parse(await readFile('artifacts/playtt-id-sequence-'+label+'-check.json','utf8'));assert.equal(test.result,'pass');assert.equal(test.evidence.ownedDraftsRemoved,true);
 assert.ok(BigInt(metadata.sequences.wp_posts)>=BigInt(test.evidence.createdAfterRestart));
}
const report={at:new Date().toISOString(),result:'pass',scope:'Latest authenticated remote backup fully decoded and hash-checked; canonical sequence metadata preserves highest IDs even after owned drafts were deleted. This is archive verification, not another independent full WordPress restore.',revision:verified.revision,objects:verified.objects,archiveBytes:pack.length,archiveSha256:verified.archiveSha256,metadataPath:path,metadataBytes:source.size,metadataSha256:sha,tableCount:Object.keys(metadata.sequences).length,wpPostsHighWater:metadata.sequences.wp_posts};
await writeFile('artifacts/playtt-id-sequence-backup.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
