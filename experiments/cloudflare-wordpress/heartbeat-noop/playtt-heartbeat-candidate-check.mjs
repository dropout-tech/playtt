import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {privateClient,origin} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const path='artifacts/playtt-heartbeat-audit-owned-private.json';
const owned=JSON.parse(await readFile(path,'utf8'));assert.equal(owned.origin,origin);assert.equal(owned.measured,true);assert.equal(owned.cleanupComplete,false);assert.ok(!owned.candidateChecked,'Do not repeat completed candidate check');
const pick=p=>({id:p.id,slug:p.slug,title:p.title.raw,status:p.status,content:p.content.raw}),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const c=await privateClient(),report={at:new Date().toISOString(),result:'pending',checks:c.checks,samples:[]};
async function state(){const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);return s.state;}
try{
 await c.paused();const initial=await state();assert.equal(initial.version,243);assert.equal(initial.pointer.revision,JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-before-heartbeat-candidate.json','utf8')).revision);
 await c.login();const item=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(item.status,200);assert.deepEqual(pick(item.body),owned.expected);
 const editor=await c.request('/wp-admin/post.php?post='+owned.id+'&action=edit');assert.equal(editor.status,200);const html=await editor.text();const settings=html.match(/var heartbeatSettings\s*=\s*(\{[^;]+\});/);assert.ok(settings);const nonce=JSON.parse(settings[1]).nonce;assert.ok(nonce);
 for(const kind of ['empty-warmup','empty','post-lock','empty','post-lock','empty']){
  const before=await state(),body=new URLSearchParams({action:'heartbeat',_nonce:nonce,screen_id:'page',has_focus:'true',interval:'10'});if(kind==='post-lock')body.set('data[wp-refresh-post-lock][post_id]',String(owned.id));
  const at=new Date().toISOString(),start=performance.now(),r=await c.request('/wp-admin/admin-ajax.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});assert.equal(r.status,200);const data=await r.json(),wallMs=performance.now()-start;assert.ok(Number.isInteger(data.server_time)&&!data.nonces_expired);if(kind==='post-lock')assert.match(data['wp-refresh-post-lock']?.new_lock||'',/^\d+:\d+$/);
  const after=await state(),changed=after.pointer.revision!==before.pointer.revision;assert.equal(after.version-before.version,changed?1:0,'No-change native request must not create a commit; changed state still commits exactly once');assert.equal(Number(r.headers.get('x-wp-codebox-canonical-version')),after.version);
  if(!changed)assert.deepEqual(after,before);
  report.samples.push({at,kind,wallMs,status:r.status,canonicalChanged:changed,versionDelta:after.version-before.version,beforeVersion:before.version,afterVersion:after.version,beforeRevision:before.pointer.revision,afterRevision:after.pointer.revision,lockRefreshed:kind==='post-lock'});
 }
 assert.ok(report.samples.filter(s=>!s.canonicalChanged).length>=2,'At least two verified no-change requests required');assert.ok(report.samples.filter(s=>s.kind==='post-lock'&&s.canonicalChanged).length>=2,'Both native lock refreshes must persist');
 const beforeUpdate=await state(),content='<!-- wp:paragraph -->\n<p>背景請求驗收：修正後內容更新仍完整保存。 &amp; LF</p>\n<!-- /wp:paragraph --> \n';
 const updated=await c.rest('pages/'+owned.id,{content});assert.equal(updated.status,200);assert.equal(updated.body.content.raw,content);const afterUpdate=await state();assert.equal(afterUpdate.version,beforeUpdate.version+1);assert.notEqual(afterUpdate.pointer.revision,beforeUpdate.pointer.revision);owned.expected=pick(updated.body);owned.content=content;await writeFile(path,JSON.stringify(owned,null,2));
 const fresh=await privateClient();await fresh.login();const actual=await fresh.rest('pages/'+owned.id+'?context=edit');assert.equal(actual.status,200);assert.deepEqual(pick(actual.body),owned.expected);const home=await fresh.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(hash(pick(home.body)),owned.homeHash);c.checks.push(...fresh.checks);await c.paused();
 owned.candidateChecked=true;await writeFile(path,JSON.stringify(owned,null,2));Object.assign(report,{result:'pass',ownedId:owned.id,scope:'Native no-change requests retain full inventory reconciliation but release without a commit; lock refreshes and content update still commit; exact trailing whitespace survives fresh login',contentHash:hash(owned.expected.content),homepageUnchanged:true,finalState:await state()});
}catch(error){Object.assign(report,{result:'fail',errorName:error.name});process.exitCode=1;}
await writeFile('artifacts/playtt-heartbeat-candidate-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
