import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
const source='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const sha=x=>createHash('sha256').update(x).digest('hex');
async function backup(label){
 const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-'+label+'-location-private.json','utf8'));
 const report=JSON.parse(await readFile(directory+'/verification.json','utf8'));assert.equal(report.result,'pass');assert.equal(report.bucket,'playtt-wordpress-rebuild-audit');
 const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));assert.equal(manifest.revision,report.revision);
 async function object(path){const entry=manifest.files.find(f=>f.path===path);assert.ok(entry);const bytes=await readFile(directory+'/objects/'+entry.sha256);assert.equal(sha(bytes),entry.sha256);return JSON.parse(bytes);}
 return {manifest,report,object};
}
const owned=JSON.parse(await readFile('artifacts/playtt-postmeta-native-owned-private.json','utf8'));assert.equal(owned.origin,origin);assert.equal(owned.cleanupComplete,true);
const before=await backup('before-postmeta'),after=await backup('postmeta-cleanup');
const select=manifest=>manifest.files.filter(f=>f.path.endsWith('.md')).map(f=>({path:f.path,sha256:f.sha256})).sort((a,b)=>a.path.localeCompare(b.path));
assert.deepEqual(select(after.manifest),select(before.manifest),'All pre-existing Markdown content must remain byte-identical');
const uploads=m=>(m.uploads||[]).map(f=>({path:f.path,sha256:f.sha256,size:f.size})).sort((a,b)=>a.path.localeCompare(b.path));
assert.deepEqual(uploads(after.manifest),uploads(before.manifest));assert.equal(after.manifest.uploads.length,15);
const beforeRows=await before.object('_tables/postmeta.json'),afterRows=await after.object('_tables/postmeta.json');
assert.equal(afterRows.some(r=>Number(r.post_id)===owned.id),false);
for(const row of beforeRows)assert.deepEqual(afterRows.find(r=>String(r.meta_id)===String(row.meta_id)),row,'Existing JSON metadata row unchanged');
assert.deepEqual(await after.object('_runtime/playtt-postmeta-layout.json'),{schema:'playtt/postmeta-table/v1'});
const seq=await after.object('_runtime/playtt-auto-increment.json');assert.ok(BigInt(seq.sequences.wp_postmeta)>=20n);assert.ok(BigInt(seq.sequences.wp_posts)>=BigInt(owned.id));
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));const states=[];
for(const host of [source,origin]){
 async function req(path){const r=await fetch(host+path,{headers:{'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');return r.json();}
 const s=await req('/?phase=operator-fence-status'),p=await req('/__playtt-publishing');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);assert.equal(p.state,'paused');
 states.push({target:host===origin?'rebuild':'daily-source',version:s.state.version,revision:s.state.pointer.revision,coherent:true,fenceActive:false,publisher:'paused'});
}
assert.equal(states[1].revision,after.report.revision);
const gateChecks=[];for(const path of ['/wp-admin/','/wp-json/wp/v2/media','/wp-content/uploads/2026/11/logo.webp']){const r=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,404);assert.ok(r.headers.get('x-robots-tag')?.includes('noindex'));await r.arrayBuffer();gateChecks.push({path,status:r.status});}
const report={at:new Date().toISOString(),result:'pass',scope:'Verified cleanup backup: all prior Markdown and 15 uploaded files byte-identical; existing JSON rows retained, owned attachment absent, full-table marker and sequence high-water preserved. Read-only live state/pause/gate checks.',markdownFiles:select(after.manifest).length,originalUploads:15,legacyJsonRows:beforeRows.length,finalPostmetaRows:afterRows.length,ownedId:owned.id,cleanupComplete:true,sequenceHighWater:seq.sequences,states,gateChecks};
await writeFile('artifacts/playtt-postmeta-final.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
