import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));const mode=process.argv.find(v=>['--upload','--apply','--verify'].includes(v));assert.ok(mode);
const prefix='artifacts/playtt-history-origin-',planPath=prefix+'plan-private.json',plan=JSON.parse(await readFile(planPath,'utf8'));
assert.equal(plan.origin,origin);assert.equal(plan.bucket,'playtt-wordpress-rebuild-audit');assert.equal(plan.baseVersion,138);assert.equal(plan.basePointer.revision,'4e46e92b-788c-4ede-a2d0-7695153ea4e2');
assert.ok(resolve(plan.output).startsWith(resolve('../../../../outputs/backups/cloudflare-wordpress-history-origin')+sep));
const sha=x=>createHash('sha256').update(x).digest('hex');
const before=JSON.parse(await readFile(plan.directory+'/manifest.json','utf8')),after=JSON.parse(await readFile(plan.output+'/manifest.json','utf8'));
assert.equal(before.revision,plan.basePointer.revision);assert.equal(after.revision,plan.pointer.revision);
for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(after[key],before[key]);
assert.equal(after.files.length,before.files.length);assert.deepEqual(after.files.filter((f,i)=>{assert.equal(f.path,before.files[i].path);return f.sha256!==before.files[i].sha256;}).map(f=>f.path),['_tables/posts.json']);
const decoded=await decodeCanonicalRestorePack(after.restorePack,'sites/default',{markdown:after.files,uploads:after.uploads,wpContent:after.wpContent,wpContentDeleted:after.wpContentDeleted},await readFile(plan.output+'/restore.zip'));
const oldEntry=before.files.find(f=>f.path==='_tables/posts.json'),oldBytes=await readFile(plan.directory+'/objects/'+oldEntry.sha256);assert.equal(sha(oldBytes),oldEntry.sha256);
const oldRows=JSON.parse(oldBytes),rows=JSON.parse(new TextDecoder().decode(decoded.markdown.find(f=>f.path==='_tables/posts.json').bytes));assert.equal(rows.length,68);assert.equal(oldRows.length,68);assert.equal(plan.changes.length,18);
let count=0;for(let i=0;i<rows.length;i++){const old=oldRows[i],row=rows[i],change=plan.changes.find(c=>c.id===Number(row.ID));if(change){assert.equal(old.post_type,'revision');assert.equal(row.post_parent,old.post_parent);assert.equal(sha(old.post_content),change.beforeHash);assert.equal(sha(row.post_content),change.afterHash);assert.equal(row.post_content,old.post_content.split(plan.oldOrigin).join(origin));count+=change.references;}else assert.equal(row.post_content,old.post_content);assert.deepEqual({...row,post_content:old.post_content},old);assert.ok(!row.post_content.includes(plan.oldOrigin));}assert.equal(count,28);
assert.equal(plan.uploadObjects.length,3);for(const item of plan.uploadObjects){assert.ok(/^(objects\/[a-f0-9]{64}|restore\.zip|manifest\.json)$/.test(item.file));assert.ok(item.key.startsWith('sites/default/')&&!item.key.includes('..'));const bytes=await readFile(resolve(plan.output,item.file));assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.size);}
const c=await privateClient(),secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
async function operator(phase,body){const r=await c.request('/?phase='+phase,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200);return r.json();}
async function report(name,data){const r={at:new Date().toISOString(),result:'pass',...data,checks:c.checks};await writeFile(prefix+name+'.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}
async function transfer(args){await new Promise((done,fail)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--remote','--config','wrangler.playtt-rebuild-audit.jsonc'],{stdio:'ignore'});child.on('error',fail);child.on('exit',code=>code===0?done():fail(Error('Scoped R2 transfer failed')));});}
try{
 await c.paused();const current=await operator('operator-fence-status');assert.equal(current.coherent,true);assert.equal(current.fence.active,false);
 if(mode==='--upload'){
  assert.equal(plan.applied,false);assert.deepEqual(current.state.pointer,plan.basePointer);assert.equal(current.state.version,138);await mkdir(plan.output+'/remote-readback',{recursive:true});
  for(const [i,item]of plan.uploadObjects.entries()){await transfer(['r2','object','put',plan.bucket+'/'+item.key,'--file',resolve(plan.output,item.file)]);const file=plan.output+'/remote-readback/'+i;await transfer(['r2','object','get',plan.bucket+'/'+item.key,'--file',file]);assert.equal(sha(await readFile(file)),item.sha256);}
  await report('upload',{scope:'Three bounded immutable objects uploaded/downloaded for SHA verification; pointer unchanged',candidateRevision:plan.pointer.revision,objects:3});
 }
 if(mode==='--apply'){
  assert.equal(plan.applied,false);const uploaded=JSON.parse(await readFile(prefix+'upload.json','utf8'));assert.equal(uploaded.result,'pass');assert.equal(uploaded.candidateRevision,plan.pointer.revision);
  const fence=await operator('operator-fence-acquire',{ttlSeconds:600});
  try{
   const s=await operator('operator-fence-status');assert.equal(s.coherent,true);assert.deepEqual(s.state.pointer,plan.basePointer);assert.equal(s.state.version,138);await c.paused();
   const applied=await operator('operator-adopt',{pointer:plan.pointer,version:139,fenceToken:fence.token});assert.equal(applied.adopted,true);assert.equal(applied.version,139);assert.deepEqual(applied.pointer,plan.pointer);
   plan.applied=true;plan.appliedAt=new Date().toISOString();await writeFile(planPath,JSON.stringify(plan,null,2));
   const final=await operator('operator-fence-status');assert.equal(final.coherent,true);assert.deepEqual(final.state.pointer,plan.pointer);assert.equal(final.state.version,139);
  }finally{await operator('operator-fence-release',{token:fence.token});}
  await c.paused();await report('apply',{scope:'Fenced monotonic adoption after exact base comparison; only 18 historical post_content values changed',version:139,revision:plan.pointer.revision,revisions:18,references:28,publisher:'paused'});
 }
 if(mode==='--verify'){
  assert.equal(plan.applied,true);await c.login();let verified=0;
  for(const [parent,route]of [[34,'template-parts/lets-play//footer'],[61,'navigation/61'],[62,'template-parts/lets-play//header']]){
   const r=await c.rest(route+'/revisions?context=edit&per_page=100');assert.equal(r.status,200);assert.ok(Array.isArray(r.body)&&r.body.length<100);
   const expected=rows.filter(row=>row.post_type==='revision'&&Number(row.post_parent)===parent);assert.equal(r.body.length,expected.length);
   // Core's template revision controller returns the template slug as id and
   // the numeric revision key as wp_id; navigation uses ordinary revision id.
   const template=parent!==61;
   for(const row of expected){const actual=r.body.find(x=>(template?x.wp_id:x.id)===Number(row.ID));assert.ok(actual);assert.equal(actual.parent,parent);assert.equal(actual.content.raw,row.post_content);assert.equal(actual.title.raw,row.post_title);if(template){assert.equal(actual.id,'lets-play//'+(parent===34?'footer':'header'));assert.equal(actual.guid,undefined);}else assert.equal(actual.guid.raw,row.guid);assert.ok(!actual.content.raw.includes(plan.oldOrigin));verified++;}
  }
  await c.paused();const s=await operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);
  await report('verification',{scope:'Authenticated native template-part/navigation revision endpoints; every revision under the three parents matches candidate content/title/numeric revision ID. Template GUIDs are not exposed by this API and remain verified in full backups.',verifiedRevisions:verified,migratedRevisions:18,references:28,version:s.state.version,revision:s.state.pointer.revision,publisher:'paused'});
 }
}catch(error){await report('failure-'+mode.slice(2),{result:'fail',errorName:error.name,message:'Scoped history operation failed; private plan and current remote state must be inspected before retry.'});throw error;}
