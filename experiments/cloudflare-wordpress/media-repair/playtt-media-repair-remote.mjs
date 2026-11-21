import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';

assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(v=>['--upload','--apply','--verify'].includes(v));assert.ok(mode);
const prefix='artifacts/playtt-media-repair-',planPath=prefix+'plan-private.json';
const plan=JSON.parse(await readFile(planPath,'utf8'));
const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev',bucket='playtt-wordpress-rebuild-audit';
assert.equal(plan.origin,origin);assert.equal(plan.bucket,bucket);assert.equal(plan.baseVersion,85);assert.equal(plan.basePointer.revision,'edf7bf71-b84e-444e-a6d9-1cce10366841');
const config=JSON.parse(await readFile('wrangler.playtt-rebuild-audit.jsonc','utf8'));assert.equal(config.name,'playtt-wp-free-rebuild-audit');assert.equal(config.r2_buckets[0].bucket_name,bucket);assert.ok(!config.routes&&!config.services);assert.deepEqual(config.triggers.crons,[]);
assert.ok(resolve(plan.output).startsWith(resolve('../../../../outputs/backups/cloudflare-wordpress-media-repair')+sep));
const sha=x=>createHash('sha256').update(x).digest('hex');
const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-postmeta-cleanup-location-private.json','utf8'));
const before=JSON.parse(await readFile(directory+'/manifest.json','utf8')),after=JSON.parse(await readFile(plan.output+'/manifest.json','utf8'));
assert.equal(before.revision,plan.basePointer.revision);assert.equal(after.revision,plan.pointer.revision);
const decoded=await decodeCanonicalRestorePack(after.restorePack,'sites/default',{markdown:after.files,uploads:after.uploads||[],wpContent:after.wpContent||[],wpContentDeleted:after.wpContentDeleted||[]},await readFile(plan.output+'/restore.zip'));
assert.deepEqual(after.uploads,before.uploads);assert.deepEqual(after.wpContent,before.wpContent);assert.deepEqual(after.wpContentDeleted,before.wpContentDeleted);assert.equal(after.files.length,before.files.length);
const changed=after.files.filter((f,i)=>{assert.equal(f.path,before.files[i].path);return f.sha256!==before.files[i].sha256;}).map(f=>f.path).sort();assert.deepEqual(changed,['_runtime/playtt-auto-increment.json','_tables/postmeta.json']);
const rows=JSON.parse(new TextDecoder().decode(decoded.markdown.find(f=>f.path==='_tables/postmeta.json').bytes));assert.equal(rows.length,48);
const oldEntry=before.files.find(f=>f.path==='_tables/postmeta.json'),oldRows=JSON.parse(await readFile(directory+'/objects/'+oldEntry.sha256,'utf8'));assert.deepEqual(rows.slice(0,4),oldRows);assert.deepEqual(rows.slice(4),plan.added);
assert.equal(plan.added.length,44);assert.equal(new Set(plan.added.map(r=>r.meta_id)).size,44);assert.deepEqual(plan.added.map(r=>r.meta_id),Array.from({length:44},(_,i)=>String(i+21)));
for(const row of plan.added){const item=plan.inventory.find(i=>i.id===Number(row.post_id));assert.ok(item);assert.ok(['_wp_attached_file','_wp_attachment_metadata',...(item.brand?['_lets_play_asset']:[])].includes(row.meta_key));}
const seq=JSON.parse(new TextDecoder().decode(decoded.markdown.find(f=>f.path==='_runtime/playtt-auto-increment.json').bytes));assert.equal(seq.sequences.wp_postmeta,'64');
assert.equal(plan.uploadObjects.length,4);for(const item of plan.uploadObjects){assert.ok(/^(objects\/[a-f0-9]{64}|restore\.zip|manifest\.json)$/.test(item.file));assert.ok(item.key.startsWith('sites/default/')&&!item.key.includes('..'));const bytes=await readFile(resolve(plan.output,item.file));assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.size);}
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')),cookies=new Map(),checks=[];let nonce;
async function request(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));const at=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-at});for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}return r;}
async function operator(phase,body){const r=await request('/?phase='+phase,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,'Operator '+phase);return r.json();}
async function paused(){const r=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
async function wrangler(args){await new Promise((done,fail)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--remote','--config','wrangler.playtt-rebuild-audit.jsonc'],{stdio:'ignore'});child.on('error',fail);child.on('exit',code=>code===0?done():fail(Error('Scoped R2 transfer failed: '+code)));});}
async function report(name,data){const r={at:new Date().toISOString(),result:'pass',origin,bucket,...data,checks};await writeFile(prefix+name+'.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}
try{
 await paused();const current=await operator('operator-fence-status');assert.equal(current.coherent,true);assert.equal(current.fence.active,false);
 if(mode==='--upload'){
  assert.equal(plan.applied,false);assert.deepEqual(current.state.pointer,plan.basePointer);assert.equal(current.state.version,plan.baseVersion);
  const verifyDir=plan.output+'/remote-readback';await mkdir(verifyDir,{recursive:true});
  for(const [i,item]of plan.uploadObjects.entries()){
   await wrangler(['r2','object','put',bucket+'/'+item.key,'--file',resolve(plan.output,item.file)]);
   const file=verifyDir+'/'+i;await wrangler(['r2','object','get',bucket+'/'+item.key,'--file',file]);assert.equal(sha(await readFile(file)),item.sha256);
  }
  await report('upload',{scope:'Four bounded immutable objects uploaded to private R2 and downloaded for SHA verification; canonical pointer unchanged',objects:4,candidateRevision:plan.pointer.revision,baseRevision:plan.basePointer.revision});
 }
 if(mode==='--apply'){
  const upload=JSON.parse(await readFile(prefix+'upload.json','utf8'));assert.equal(upload.result,'pass');assert.equal(upload.candidateRevision,plan.pointer.revision);assert.equal(plan.applied,false);
  const fence=await operator('operator-fence-acquire',{ttlSeconds:600});
  try{
   const beforeAdopt=await operator('operator-fence-status');assert.equal(beforeAdopt.coherent,true);assert.deepEqual(beforeAdopt.state.pointer,plan.basePointer);assert.equal(beforeAdopt.state.version,plan.baseVersion);await paused();
   const applied=await operator('operator-adopt',{pointer:plan.pointer,version:plan.baseVersion+1,fenceToken:fence.token});assert.equal(applied.adopted,true);assert.equal(applied.version,86);assert.deepEqual(applied.pointer,plan.pointer);
   // Record the authoritative mutation before further verification so an
   // interrupted response can never cause an untracked reset/reapplication.
   plan.applied=true;plan.appliedAt=new Date().toISOString();await writeFile(planPath,JSON.stringify(plan,null,2));
   const state=await operator('operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.state.version,86);assert.deepEqual(state.state.pointer,plan.pointer);
  }finally{await operator('operator-fence-release',{token:fence.token});}
  await paused();await report('apply',{scope:'Monotonic canonical adoption under an active fence after exact base-version/pointer check; no reset, no deployment, two metadata files changed',version:86,revision:plan.pointer.revision,addedRows:44,attachments:15,publisher:'paused'});
 }
 if(mode==='--verify'){
  assert.equal(plan.applied,true);
  assert.equal((await request('/wp-login.php')).status,200);
  const login=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})});assert.equal(login.status,302);assert.equal(new URL(login.headers.get('location'),origin).origin,origin);
  const page=await request('/wp-admin/');assert.equal(page.status,200);const text=await page.text();nonce=text.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  const r=await request('/wp-json/wp/v2/media?context=edit&per_page=100',{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);assert.equal(Number(r.headers.get('x-wp-totalpages')),1);const media=await r.json();assert.equal(media.length,15);
  for(const item of plan.inventory){
   const actual=media.find(m=>m.id===item.id),expected=plan.generated.find(g=>g.id===item.id);assert.ok(actual);assert.equal(actual.slug,item.slug);assert.equal(actual.status,'inherit');assert.equal(actual.title.raw,item.slug);assert.equal(actual.mime_type,item.mime);assert.equal(actual.source_url,expected.source_url);
   const attachment=decoded.markdown.find(f=>f.path===item.markdownPath);const guid=new TextDecoder().decode(attachment.bytes).match(/^  guid: "([^"]+)"$/m)?.[1];assert.equal(actual.guid.raw,guid);
   const metadata={...expected.metadata,sizes:{}};assert.deepEqual(actual.media_details,metadata);assert.equal(actual.alt_text,'');
   const image=await request('/wp-content/uploads/'+item.path);assert.equal(image.status,200);assert.equal(sha(Buffer.from(await image.arrayBuffer())),item.sha256);
  }
  await writeFile(prefix+'native-media-private.json',JSON.stringify(media,null,2));plan.nativeVerified=true;await writeFile(planPath,JSON.stringify(plan,null,2));await paused();
  const state=await operator('operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
  await report('verification',{scope:'Native authenticated WordPress media API: all 15 original attachment IDs, titles, slugs, GUIDs unchanged; file paths, image metadata and current-origin URLs repaired; all 15 image SHA checks pass',attachments:15,brandAssets:14,legacyProbeAssets:1,version:state.state.version,revision:state.state.pointer.revision,publisher:'paused'});
 }
}catch(error){await report('failure-'+mode.slice(2),{result:'fail',error:String(error)});process.exitCode=1;}
