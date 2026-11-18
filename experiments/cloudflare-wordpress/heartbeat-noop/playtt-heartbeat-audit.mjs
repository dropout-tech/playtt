import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {privateClient,origin} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--prepare','--measure','--cleanup'].includes(x));assert.ok(mode);
const prefix='artifacts/playtt-heartbeat-audit-',file=prefix+'owned-private.json';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const pick=p=>({id:p.id,slug:p.slug,title:p.title.raw,status:p.status,content:p.content.raw});
const c=await privateClient(),report={at:new Date().toISOString(),mode,result:'pending',checks:c.checks};
async function state(){const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);return s.state;}
try{
 await c.paused();const initial=await state();await c.login();
 if(mode==='--prepare'){
  let exists=false;try{await readFile(file);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!exists,'Do not recreate owned fixture');
  const backup=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-after-mobile-native.json','utf8'));assert.equal(initial.pointer.revision,backup.revision);assert.equal(initial.version,232);
  const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);
  const marker='playtt-heartbeat-audit-'+randomUUID();
  const owned={origin,marker,id:null,homeHash:hash(pick(home.body)),content:'<!-- wp:paragraph -->\n<p>背景請求驗收：保留原生文章鎖與精確內容。</p>\n<!-- /wp:paragraph -->',cleanupComplete:false,measured:false};await writeFile(file,JSON.stringify(owned,null,2));
  const r=await c.rest('pages',{slug:marker,title:marker,status:'draft',content:owned.content});assert.equal(r.status,201);owned.id=r.body.id;owned.expected=pick(r.body);assert.equal(owned.expected.content,owned.content);await writeFile(file,JSON.stringify(owned,null,2));
  Object.assign(report,{result:'pass',ownedId:owned.id,canonicalBefore:initial,scope:'Created one owned draft for authenticated native heartbeat measurements; original homepage unchanged'});
 }else{
  const owned=JSON.parse(await readFile(file,'utf8'));assert.equal(owned.origin,origin);assert.ok(owned.id&&!owned.cleanupComplete);
  const item=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(item.status,200);assert.deepEqual(pick(item.body),owned.expected);
  if(mode==='--measure'){
   assert.equal(owned.measured,false,'Do not repeat a completed measurement');
   const editor=await c.request('/wp-admin/post.php?post='+owned.id+'&action=edit');assert.equal(editor.status,200);const html=await editor.text();
   const settings=html.match(/var heartbeatSettings\s*=\s*(\{[^;]+\});/);assert.ok(settings,'Native heartbeat settings must be present');const nonce=JSON.parse(settings[1]).nonce;assert.ok(typeof nonce==='string'&&nonce.length>5);
   const samples=[];
   async function beat(kind){
    const before=await state();const body=new URLSearchParams({action:'heartbeat',_nonce:nonce,screen_id:'page',has_focus:'true',interval:'10'});
    if(kind==='post-lock')body.set('data[wp-refresh-post-lock][post_id]',String(owned.id));
    const at=new Date().toISOString(),start=performance.now();const r=await c.request('/wp-admin/admin-ajax.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});assert.equal(r.status,200);const data=await r.json();const wallMs=performance.now()-start;
    assert.ok(Number.isInteger(data.server_time));assert.ok(!data.nonces_expired&&!data.error);
    if(kind==='post-lock')assert.match(data['wp-refresh-post-lock']?.new_lock||'',/^\d+:\d+$/);
    const after=await state();samples.push({at,kind,wallMs,status:r.status,canonicalChanged:after.pointer.revision!==before.pointer.revision,versionDelta:after.version-before.version,beforeVersion:before.version,afterVersion:after.version,serverTime:data.server_time,lockRefreshed:kind==='post-lock',responseKeys:Object.keys(data).sort()});
   }
   await beat('empty-warmup');for(let i=0;i<3;i++){await beat('empty');await beat('post-lock');}
   const fresh=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(fresh.status,200);assert.deepEqual(pick(fresh.body),owned.expected);
   const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(hash(pick(home.body)),owned.homeHash);
   owned.measured=true;await writeFile(file,JSON.stringify(owned,null,2));Object.assign(report,{result:'pass',ownedId:owned.id,samples,scope:'Seven sequential native authenticated heartbeats: excluded empty warmup then three alternating empty/lock pairs, no browser and no concurrency; not a throughput or whole-backend benchmark',homepageUnchanged:true,draftContentUnchanged:true,finalState:await state()});
  }else{
   assert.equal(owned.measured,true);const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(hash(pick(home.body)),owned.homeHash);
   const deleted=await c.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(deleted.status,200);assert.equal(deleted.body.deleted,true);assert.equal(deleted.body.previous.id,owned.id);assert.equal((await c.rest('pages/'+owned.id+'?context=edit')).status,404);
   owned.cleanupComplete=true;await writeFile(file,JSON.stringify(owned,null,2));Object.assign(report,{result:'pass',ownedId:owned.id,cleanupComplete:true,homepageUnchanged:true,scope:'Identity/content-guarded owned fixture cleanup; originals unchanged'});
  }
 }
 await c.paused();
}catch(error){Object.assign(report,{result:'fail',errorName:error.name});process.exitCode=1;}
await writeFile(prefix+mode.slice(2)+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
