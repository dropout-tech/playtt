import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {privateClient,origin} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--prepare','--baseline','--candidate','--cold-check','--cleanup'].includes(x));assert.ok(mode);
const prefix='artifacts/playtt-manifest-cache-',ownedPath=prefix+'owned-private.json';
const pick=p=>({id:p.id,slug:p.slug,title:p.title.raw,status:p.status,content:p.content.raw});
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const c=await privateClient(),report={at:new Date().toISOString(),mode,result:'pending',samples:[],checks:c.checks};
async function state(){const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);return s.state;}
try{
 await c.paused();const initial=await state();await c.login();
 if(mode==='--prepare'){
  let exists=false;try{await readFile(ownedPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!exists,'Do not recreate an owned fixture');
  const backup=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-after-noop-ui.json','utf8'));assert.equal(initial.pointer.revision,backup.revision);assert.equal(initial.version,278);
  const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);
  const marker='playtt-manifest-cache-'+randomUUID(),owned={origin,marker,id:null,homeHash:hash(pick(home.body)),expected:null,cleanupComplete:false,baselineComplete:false,candidateComplete:false,coldChecked:false};await writeFile(ownedPath,JSON.stringify(owned,null,2));
  const created=await c.rest('pages',{slug:marker,title:marker,status:'draft',content:'<!-- wp:paragraph -->\n<p>清單快取驗收：完整保存。</p>\n<!-- /wp:paragraph --> \n'});assert.equal(created.status,201);owned.id=created.body.id;owned.expected=pick(created.body);await writeFile(ownedPath,JSON.stringify(owned,null,2));Object.assign(report,{result:'pass',ownedId:owned.id,canonicalBefore:initial});
 }else{
  const owned=JSON.parse(await readFile(ownedPath,'utf8'));assert.equal(owned.origin,origin);assert.ok(owned.id&&!owned.cleanupComplete);
  const original=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(original.status,200);assert.deepEqual(pick(original.body),owned.expected);
  if(mode==='--baseline'||mode==='--candidate'){
   const candidate=mode==='--candidate';assert.equal(candidate?owned.candidateComplete:owned.baselineComplete,false);
   if(candidate){assert.equal(owned.baselineComplete,true);const backup=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-before-manifest-cache.json','utf8'));assert.equal(initial.pointer.revision,backup.revision);}
   const editor=await c.request('/wp-admin/post.php?post='+owned.id+'&action=edit');assert.equal(editor.status,200);const html=await editor.text();const setting=html.match(/var heartbeatSettings\s*=\s*(\{[^;]+\});/);assert.ok(setting);const nonce=JSON.parse(setting[1]).nonce;assert.ok(nonce);
   for(const [index,kind] of ['empty-warmup','empty','post-lock','content','empty','post-lock','content','empty','post-lock','content'].entries()){
    const before=await state(),at=new Date().toISOString(),start=performance.now();let status;
    if(kind==='content'){
     const content='<!-- wp:paragraph -->\n<p>清單快取驗收 '+mode.slice(2)+' '+index+'：繁中 &amp; bytes。</p>\n<!-- /wp:paragraph --> \n';
     const result=await c.rest('pages/'+owned.id,{content});status=result.status;assert.equal(status,200);assert.equal(result.body.content.raw,content);owned.expected=pick(result.body);await writeFile(ownedPath,JSON.stringify(owned,null,2));
    }else{
     const body=new URLSearchParams({action:'heartbeat',_nonce:nonce,screen_id:'page',has_focus:'true',interval:'10'});if(kind==='post-lock')body.set('data[wp-refresh-post-lock][post_id]',String(owned.id));
     const r=await c.request('/wp-admin/admin-ajax.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});status=r.status;assert.equal(status,200);const data=await r.json();assert.ok(Number.isInteger(data.server_time)&&!data.nonces_expired&&!data.error);if(kind==='post-lock')assert.match(data['wp-refresh-post-lock']?.new_lock||'',/^\d+:\d+$/);
    }
    const wallMs=performance.now()-start,after=await state(),changed=after.pointer.revision!==before.pointer.revision;assert.equal(after.version-before.version,changed?1:0);if(kind==='content'||kind==='post-lock')assert.equal(changed,true);if(!changed)assert.deepEqual(after,before);
    report.samples.push({at,index,kind,wallMs,status,canonicalChanged:changed,versionDelta:after.version-before.version,beforeVersion:before.version,afterVersion:after.version});
    await writeFile(prefix+mode.slice(2)+'-partial.json',JSON.stringify(report,null,2));
   }
   owned[candidate?'candidateComplete':'baselineComplete']=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));
  }else if(mode==='--cold-check'){
   assert.equal(owned.candidateComplete,true);assert.equal(owned.coldChecked,false);owned.coldChecked=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));
  }else{
   assert.equal(owned.candidateComplete,true);assert.equal(owned.coldChecked,true);
   const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(hash(pick(home.body)),owned.homeHash);
   const result=await c.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(result.status,200);assert.equal(result.body.deleted,true);assert.equal(result.body.previous.id,owned.id);assert.equal((await c.rest('pages/'+owned.id+'?context=edit')).status,404);
   owned.cleanupComplete=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));
  }
  const fresh=await privateClient();await fresh.login();
  if(!owned.cleanupComplete){const current=await fresh.rest('pages/'+owned.id+'?context=edit');assert.equal(current.status,200);assert.deepEqual(pick(current.body),owned.expected);}
  const home=await fresh.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(hash(pick(home.body)),owned.homeHash);c.checks.push(...fresh.checks);
  Object.assign(report,{result:'pass',ownedId:owned.id,homepageUnchanged:true,contentHash:hash(owned.expected.content),cleanupComplete:owned.cleanupComplete,scope:'Bounded sequential native requests; exact content readback through a fresh login; runtime cache availability must be classified from separate platform traces'});
 }
 await c.paused();report.finalState=await state();
}catch(error){report.result='fail';report.errorName=error.name;process.exitCode=1;}
await writeFile(prefix+mode.slice(2)+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
