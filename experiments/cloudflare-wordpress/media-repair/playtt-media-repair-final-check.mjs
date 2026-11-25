import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const sha=x=>createHash('sha256').update(x).digest('hex');
async function backup(label){
 const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-'+label+'-location-private.json','utf8'));
 const report=JSON.parse(await readFile(directory+'/verification.json','utf8'));assert.equal(report.result,'pass');assert.equal(report.bucket,'playtt-wordpress-rebuild-audit');
 const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));assert.equal(manifest.revision,report.revision);
 async function object(path){const e=manifest.files.find(f=>f.path===path);assert.ok(e);const bytes=await readFile(directory+'/objects/'+e.sha256);assert.equal(sha(bytes),e.sha256);return JSON.parse(bytes);}
 return {manifest,report,object};
}
const owned=JSON.parse(await readFile('artifacts/playtt-native-ui-owned-private.json','utf8'));
assert.equal(owned.origin,origin);assert.equal(owned.verified,true);assert.equal(owned.cleanupComplete,true);
const repaired=await backup('after-media-repair'),migrated=await backup('after-origin'),after=await backup('after-native-ui');
const entries=items=>(items||[]).map(x=>({path:x.path,sha256:x.sha256,size:x.size})).sort((a,b)=>a.path.localeCompare(b.path));
assert.deepEqual(entries(after.manifest.files.filter(f=>f.path.endsWith('.md'))),entries(migrated.manifest.files.filter(f=>f.path.endsWith('.md'))),'All original Markdown remains byte-identical after native UI acceptance');
for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(after.manifest[key],repaired.manifest[key],key+' unchanged');
assert.equal(after.manifest.uploads.length,15);
const originalRows=await repaired.object('_tables/postmeta.json'),finalRows=await after.object('_tables/postmeta.json');
assert.equal(originalRows.length,48);for(const row of originalRows)assert.deepEqual(finalRows.find(r=>r.meta_id===row.meta_id),row,'Repaired metadata row and ID preserved');
assert.equal(finalRows.some(r=>Number(r.post_id)===owned.id),false,'Owned draft metadata removed');
assert.deepEqual(await after.object('_runtime/playtt-postmeta-layout.json'),{schema:'playtt/postmeta-table/v1'});
const sequence=await after.object('_runtime/playtt-auto-increment.json');assert.ok(BigInt(sequence.sequences.wp_postmeta)>=64n);assert.ok(BigInt(sequence.sequences.wp_posts)>=BigInt(owned.id));
const oldOrigin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const initialPosts=await migrated.object('_tables/posts.json'),finalPosts=await after.object('_tables/posts.json');
assert.equal(finalPosts.some(r=>Number(r.ID)===owned.id||Number(r.post_parent)===owned.id),false,'Owned draft and revisions removed');
for(const row of initialPosts)assert.deepEqual(finalPosts.find(r=>r.ID===row.ID),row,'Existing table-backed posts and revisions preserved');
const historical=finalPosts.filter(r=>r.post_type==='revision'&&[r.post_content,r.post_excerpt].some(s=>s.includes(oldOrigin))).map(r=>({id:Number(r.ID),parent:Number(r.post_parent),references:[r.post_content,r.post_excerpt].reduce((n,s)=>n+s.split(oldOrigin).length-1,0)}));
const states=[],c=await privateClient();await c.paused();const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);assert.equal(s.state.pointer.revision,after.report.revision);states.push({target:'rebuild',version:s.state.version,revision:s.state.pointer.revision,coherent:true,fenceActive:false,publisher:'paused'});
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const source='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
async function sourceGet(path){const r=await fetch(source+path,{headers:{'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN},signal:AbortSignal.timeout(60000)});assert.equal(r.status,200);assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');return r.json();}
const sourceState=await sourceGet('/?phase=operator-fence-status'),sourcePause=await sourceGet('/__playtt-publishing');assert.equal(sourceState.coherent,true);assert.equal(sourceState.fence.active,false);assert.equal(sourcePause.state,'paused');states.push({target:'daily-source',version:sourceState.state.version,revision:sourceState.state.pointer.revision,coherent:true,fenceActive:false,publisher:'paused'});
const gateChecks=[];for(const path of ['/wp-admin/','/wp-json/wp/v2/media','/wp-content/uploads/2026/11/logo.webp']){const r=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,404);assert.ok(r.headers.get('x-robots-tag')?.includes('noindex'));await r.arrayBuffer();gateChecks.push({path,status:r.status});}
const report={at:new Date().toISOString(),result:'pass-with-open-acceptance',scope:'Native UI cleanup full-backup comparison and read-only live state checks; historical revision migration remains open',ownedId:owned.id,cleanupComplete:true,originalMarkdownFiles:migrated.manifest.files.filter(f=>f.path.endsWith('.md')).length,uploads:15,brandAssets:14,legacyProbeAssets:1,preservedPostmetaRows:originalRows.length,finalPostmetaRows:finalRows.length,sequenceHighWater:sequence.sequences,historicalRevisionsWithOldOrigin:historical,states,gateChecks,backup:after.report};
await writeFile('artifacts/playtt-media-repair-final.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
