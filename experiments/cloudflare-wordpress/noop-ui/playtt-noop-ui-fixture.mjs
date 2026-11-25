import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {privateClient,origin} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(v=>['--prepare','--verify','--cleanup'].includes(v));assert.ok(mode);
const prefix='artifacts/playtt-noop-ui-',ownedPath=prefix+'owned-private.json';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
// Gutenberg serializes newlines around block comments on the first native save.
// Do not normalize HTML, attributes, text whitespace or block-comment contents.
const blockBoundaryFormat=s=>s.replace(/(<!-- \/?wp:[^\n]*? -->)\n+/g,'$1').replace(/\n+(?=<!-- \/?wp:)/g,'');
// Audited against the saved fixture: four class-token trailing spaces,
// six default h2 attributes, and one literal ampersand in a fixed paragraph.
// This is deliberately not a generic HTML/whitespace normalizer.
const expectedNativeSerialization=s=>blockBoundaryFormat(s)
 .replaceAll('<section class="wp-block-group lp-section ">','<section class="wp-block-group lp-section">')
 .replaceAll('<!-- wp:heading {"level":2} -->','<!-- wp:heading -->')
 .replaceAll('<p class="lp-eyebrow">PLAY, LEARN & GROW</p>','<p class="lp-eyebrow">PLAY, LEARN &amp; GROW</p>');
const c=await privateClient();
async function report(name,data){const r={at:new Date().toISOString(),origin,...data,checks:c.checks};await writeFile(prefix+name+'.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}
const pick=p=>({id:p.id,slug:p.slug,status:p.status,title:p.title.raw,content:p.content.raw});
try{
 await c.paused();const state=await c.operator('operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
 await c.login();
 if(mode==='--prepare'){
  let exists=false;try{await readFile(ownedPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!exists,'Do not recreate an existing owned fixture');
  const migration=JSON.parse(await readFile('artifacts/playtt-origin-migration-plan-private.json','utf8'));assert.equal(migration.completed.length,5);assert.equal(migration.rolledBack.length,0);
  const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(home.body.content.raw,migration.after.entities.find(e=>e.type==='pages'&&e.id===24).fields.content);
  const marker='playtt-noop-ui-'+randomUUID(),before='從孩子到大人，一起讓桌球走進生活。',after='新版背景請求驗收：從孩子到大人，一起讓桌球走進生活。';
  assert.equal(home.body.content.raw.split(before).length,2);
  const owned={at:new Date().toISOString(),origin,marker,title:'新版背景請求驗收 '+marker,beforeText:before,afterText:after,sourceHomeHash:hash(pick(home.body)),sourceContent:home.body.content.raw,expectedContent:home.body.content.raw.replace(before,after),id:null,verified:false,cleanupComplete:false};await writeFile(ownedPath,JSON.stringify(owned,null,2));
  const created=await c.rest('pages',{title:owned.title,slug:marker,status:'draft',content:owned.sourceContent});assert.equal(created.status,201);owned.id=created.body.id;owned.expectedOriginal=pick(created.body);assert.equal(owned.expectedOriginal.content,owned.sourceContent);assert.equal(owned.expectedOriginal.status,'draft');await writeFile(ownedPath,JSON.stringify(owned,null,2));
  await report('prepare',{result:'pass',scope:'Created owned draft containing the migrated homepage blocks for native visual-editor acceptance; original homepage unchanged',id:owned.id,editUrl:origin+'/wp-admin/post.php?post='+owned.id+'&action=edit',beforeText:before,afterText:after,publisher:'paused'});
 }else{
  const owned=JSON.parse(await readFile(ownedPath,'utf8'));assert.equal(owned.origin,origin);assert.ok(owned.id&&!owned.cleanupComplete);
  const item=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(item.status,200);const actual=pick(item.body);assert.equal(actual.id,owned.id);assert.equal(actual.slug,owned.marker);assert.equal(actual.status,'draft');assert.equal(actual.title,owned.title);
  await writeFile(prefix+'saved-readback-private.json',JSON.stringify(actual,null,2));
  assert.equal(blockBoundaryFormat(actual.content),expectedNativeSerialization(owned.expectedContent),'Only the planned paragraph and explicitly audited native serialization changes may differ');
  const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(hash(pick(home.body)),owned.sourceHomeHash,'Original homepage must remain identical');
  if(mode==='--verify'){
   owned.verified=true;owned.expectedSaved=actual;await writeFile(ownedPath,JSON.stringify(owned,null,2));
   await report('verification',{result:'pass',scope:'Post-noop-change native UI save independently read through authenticated REST; planned paragraph plus audited block-boundary newlines, four trailing class spaces, six default h2 attributes and one ampersand escape; original homepage is byte-identical',id:owned.id,contentHash:hash(actual),plannedRawHash:hash(owned.expectedContent),actualRawHash:hash(actual.content),auditedSerializationChanges:true,sourceHomeHash:owned.sourceHomeHash,publisher:'paused'});
  }else{
   assert.equal(owned.verified,true);assert.deepEqual(actual,owned.expectedSaved);
   const deleted=await c.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(deleted.status,200);assert.equal(deleted.body.deleted,true);assert.equal(deleted.body.previous.id,owned.id);assert.equal((await c.rest('pages/'+owned.id+'?context=edit')).status,404);
   owned.cleanupComplete=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));await report('cleanup',{result:'pass',scope:'Removed only the identity/content-checked native-editor test draft; original homepage remained byte-identical in REST content',id:owned.id,publisher:'paused'});
  }
 }
 await c.paused();
}catch(error){await report('failure-'+mode.slice(2),{result:'fail',errorName:error.name});process.exitCode=1;}
