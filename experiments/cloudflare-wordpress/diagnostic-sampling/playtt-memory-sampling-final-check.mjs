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
const before=await backup('after-history-origin'),after=await backup('after-memory-sampling');
const owned=JSON.parse(await readFile('artifacts/playtt-memory-sampling-owned-private.json','utf8'));assert.equal(owned.origin,origin);assert.equal(owned.cleanupComplete,true);
const unchanged=before.manifest.files.filter(f=>f.path.endsWith('.md')||f.path.startsWith('_tables/')&&f.path!=='_tables/usermeta.json').map(f=>f.path);
for(const path of unchanged){const a=before.manifest.files.find(f=>f.path===path),b=after.manifest.files.find(f=>f.path===path);assert.ok(b);assert.equal(a.sha256,b.sha256,'Original canonical file unchanged: '+path);}
assert.deepEqual(after.manifest.files.map(f=>f.path).sort(),before.manifest.files.map(f=>f.path).sort(),'Owned Markdown fully removed; no canonical paths added/deleted');
for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(after.manifest[key],before.manifest[key],key+' unchanged');
const rows=await after.object('_tables/postmeta.json');assert.equal(rows.length,48);assert.equal(rows.some(r=>Number(r.post_id)===owned.id),false);
const posts=await after.object('_tables/posts.json');assert.equal(posts.some(r=>Number(r.ID)===owned.id||Number(r.post_parent)===owned.id),false);
const oldSeq=await before.object('_runtime/playtt-auto-increment.json'),seq=await after.object('_runtime/playtt-auto-increment.json');for(const [key,value]of Object.entries(oldSeq.sequences))assert.ok(BigInt(seq.sequences[key])>=BigInt(value));assert.ok(BigInt(seq.sequences.wp_posts)>=BigInt(owned.id));
const c=await privateClient();await c.paused();const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);assert.equal(s.state.pointer.revision,after.report.revision);
const states=[{target:'rebuild',version:s.state.version,revision:s.state.pointer.revision,coherent:true,fenceActive:false,publisher:'paused'}];
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')),source='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
async function sourceGet(path){const r=await fetch(source+path,{headers:{'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN},signal:AbortSignal.timeout(60000)});assert.equal(r.status,200);assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');return r.json();}
const ss=await sourceGet('/?phase=operator-fence-status');assert.equal(ss.coherent,true);assert.equal(ss.fence.active,false);assert.equal((await sourceGet('/__playtt-publishing')).state,'paused');states.push({target:'daily-source',version:ss.state.version,revision:ss.state.pointer.revision,coherent:true,fenceActive:false,publisher:'paused'});
const gateChecks=[];for(const path of ['/wp-admin/','/wp-json/wp/v2/media','/wp-content/uploads/2026/11/logo.webp']){const r=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,404);assert.ok(r.headers.get('x-robots-tag')?.includes('noindex'));await r.arrayBuffer();gateChecks.push({path,status:r.status});}
const report={at:new Date().toISOString(),result:'pass',scope:'Complete backup after diagnostic sampling and native write cycle; all original content, historical revisions, media and metadata retained; owned draft/revisions absent',ownedId:owned.id,cleanupComplete:true,unchangedCanonicalFiles:unchanged.length,originalMarkdown:unchanged.filter(f=>f.endsWith('.md')).length,uploads:after.manifest.uploads.length,postmetaRows:rows.length,sequenceHighWater:seq.sequences,states,gateChecks,backup:after.report};
await writeFile('artifacts/playtt-memory-sampling-final.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
