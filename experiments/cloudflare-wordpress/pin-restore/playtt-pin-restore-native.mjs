import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { origin, source, prefix, hash, sha, load, save, report, readPlan, client } from './playtt-pin-restore-lib.mjs';
assert.ok(process.argv.includes('--remote'));
const mode = process.argv.find(x => ['--verify-and-prepare','--cold-and-cleanup'].includes(x)); assert.ok(mode);
const plan = await readPlan(), c = await client(), differences = [];
let lastResponse;
function same(actual, expected, field) {
  if (hash(actual) !== hash(expected)) {
    differences.push({ field, expectedHash:hash(expected), actualHash:hash(actual) });
    throw Error('Restored data mismatch; private diagnostic preserved');
  }
}
async function api(path) { const r = await c.rest(path); lastResponse = { path, ...r }; assert.equal(r.status,200,'Native read failed'); return r.body; }
const record = p => ({ id:p.id, slug:p.slug, status:p.status, title:p.title?.raw, content:p.content?.raw });
async function verifyOriginal() {
  for (const item of plan.expected.metadata) {
    const endpoint = item.type === 'page' ? 'pages' : item.type === 'post' ? 'posts' : 'media';
    assert.ok(['page','post','attachment'].includes(item.type));
    const actual = await api(endpoint+'/'+item.id+'?context=edit');
    for (const key of ['id','type','slug','status']) same(actual[key],item[key],item.type+'.'+item.id+'.'+key);
    same(actual.title.raw,item.title,item.type+'.'+item.id+'.title');
    same(item.type === 'attachment' ? actual.description.raw : actual.content.raw,item.content,item.type+'.'+item.id+'.content');
    if (Object.hasOwn(actual,'parent')) same(actual.parent,item.parent,item.type+'.'+item.id+'.parent');
    if (actual.guid?.raw !== undefined) same(actual.guid.raw,item.guid,item.type+'.'+item.id+'.guid');
  }
  const parts = await api('template-parts?context=edit&per_page=100');
  const tables = plan.expected.postsTable;
  for (const item of tables.filter(x=>x.post_type==='wp_template_part')) {
    const actual=parts.find(x=>x.wp_id===Number(item.ID));assert.ok(actual);
    same(actual.content.raw,item.post_content,'template-part.'+item.ID+'.content');same(actual.title.raw,item.post_title,'template-part.'+item.ID+'.title');
  }
  for(const item of tables.filter(x=>x.post_type==='wp_navigation')){
    const actual=await api('navigation/'+item.ID+'?context=edit');same(actual.content.raw,item.post_content,'navigation.'+item.ID+'.content');same(actual.slug,item.post_name,'navigation.'+item.ID+'.slug');
  }
  const themes=await api('themes?context=edit'),theme=themes.find(x=>x.stylesheet==='lets-play');assert.ok(theme);same(theme.version,plan.expected.theme,'theme.version');
  const styleId=theme._links['wp:user-global-styles'][0].href.split('/').at(-1),style=await api('global-styles/'+styleId+'?context=edit');
  const styleRow=tables.find(x=>x.ID===styleId);assert.ok(styleRow);const expected=JSON.parse(styleRow.post_content);
  // Pinned WP controller lines 345/349 emits stdClass for empty styles/settings;
  // stored JSON's empty [] is preserved separately in the final byte comparison.
  const restObject=value=>value===undefined||(Array.isArray(value)&&value.length===0)?{}:value;
  same(style.styles,restObject(expected.styles),'global-styles.styles');same(style.settings,restObject(expected.settings),'global-styles.settings');
  const me=await api('users/me?context=edit');same(me.locale,'zh_TW','admin.locale');assert.ok(me.roles.includes('administrator'));
  let nativeRevisions=0;
  for (const parent of plan.expected.metadata.filter(x=>x.type==='page'||x.type==='post')) {
    const expectedRows=tables.filter(x=>x.post_type==='revision'&&Number(x.post_parent)===parent.id);if(!expectedRows.length)continue;
    const rows=await api((parent.type==='page'?'pages':'posts')+'/'+parent.id+'/revisions?context=edit&per_page=100');
    for(const row of expectedRows){const actual=rows.find(x=>x.id===Number(row.ID));assert.ok(actual);same(actual.content.raw,row.post_content,'revision.'+row.ID+'.content');same(actual.title.raw,row.post_title,'revision.'+row.ID+'.title');nativeRevisions++;}
  }
  return { markdownRecords:plan.expected.metadata.length, templateParts:tables.filter(x=>x.post_type==='wp_template_part').length, navigation:tables.filter(x=>x.post_type==='wp_navigation').length, nativeRevisions, archivedHistoryRows:tables.filter(x=>x.post_type==='revision').length };
}
async function verifyAssetsAndPages() {
  for(const item of plan.expected.uploads){const r=await c.request('/wp-content/uploads/'+item.path,{},true);assert.equal(r.status,200);assert.equal(r.headers.get('x-wp-codebox-static'),'r2-upload');same(sha(Buffer.from(await r.arrayBuffer())),item.sha256,'media.'+item.path);}
  const pages=[];
  const lineLinks=[...new Set([...plan.expected.metadata.map(x=>x.content),...plan.expected.postsTable.map(x=>x.post_content)].flatMap(x=>x.match(/https?:\/\/(?:line\.me|lin\.ee)\/[^"'<>\s]+/g)||[]))];assert.ok(lineLinks.length>0);
  for(const slug of ['', 'about','class','coaches','locations','partner']){const r=await c.request('/'+(slug?slug+'/':''),{},true);assert.equal(r.status,200);const html=await r.text();assert.ok(lineLinks.some(link=>html.includes(link)));pages.push({slug:slug||'home',status:r.status,lineLinkMatchesBackup:true});}
  const privateDraft=plan.expected.metadata.find(x=>x.type==='post'&&x.id===6);assert.equal(privateDraft.status,'draft');
  assert.equal((await c.request('/?p=6',{},true)).status,404);assert.equal((await c.request('/wp-json/wp/v2/posts/6?context=edit',{},true)).status,401);
  return { mediaVerified:plan.expected.uploads.length,pages,anonymousDraftPageStatus:404,anonymousDraftEditStatus:401 };
}
const ownedPath=prefix+'owned-private.json';
try {
  assert.equal((await c.control()).state,'paused');await c.login();
  const verification=await verifyOriginal();
  if(mode==='--verify-and-prepare'){
    let exists=false;try{await readFile(ownedPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false,'Owned fixture already exists; inspect it instead of replaying creation');
    const visual=await verifyAssetsAndPages();
    await report('native-verification',{result:'pass',scope:'Authenticated native content/history reads, theme/language, direct media hashes and six HTTP page responses; embedded original content URLs intentionally unchanged; no browser acceptance',...verification,...visual,checks:c.checks});
    const marker='PLAYTT_PIN_RESTORE_'+randomUUID(),content='<!-- wp:paragraph -->\n<p>獨立還原後的繁中保存測試。'+marker+'</p>\n<!-- /wp:paragraph -->\n \t\n';
    const owned={origin,marker,content,stage:'before-create',cleanupComplete:false};await save(ownedPath,owned);
    const created=await c.rest('pages',{title:marker,status:'draft',content:'獨立還原後建立的自有草稿。'});lastResponse=created;assert.equal(created.status,201);owned.id=created.body.id;owned.created=record(created.body);owned.stage='created';await save(ownedPath,owned);
    assert.ok(BigInt(owned.id)>BigInt(plan.expected.sequence.sequences.wp_posts));
    const updated=await c.rest('pages/'+owned.id,{content});lastResponse=updated;assert.equal(updated.status,200);same(updated.body.content.raw,content,'owned.saved-content');owned.expected=record(updated.body);owned.stage='saved';await save(ownedPath,owned);
    same(record(await api('pages/'+owned.id+'?context=edit')),owned.expected,'owned.exact-readback');
    for(const id of [181,182])assert.equal((await c.rest('pages/'+id,{content:'stale restore ID probe'})).status,404);
    owned.prepared=true;owned.state=(await c.operator('operator-fence-status')).state;await save(ownedPath,owned);
    await report('native-prepared',{result:'pass',ownedId:owned.id,backupHighWater:182,exactTrailingWhitespace:true,staleIdsRejected:[181,182],version:owned.state.version,publisher:'paused',checks:c.checks});
  } else {
    const owned=await load(ownedPath);assert.equal(owned.origin,origin);assert.equal(owned.prepared,true);assert.equal(owned.cleanupComplete,false);assert.equal(owned.stage,'saved');
    same(record(await api('pages/'+owned.id+'?context=edit')),owned.expected,'owned.cold-readback');
    const r=await c.request('/__playtt-backup-pins',{headers:c.auth});assert.equal(r.status,200);const pins=await r.json();assert.equal(pins.generation,21);
    let removed=await c.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');lastResponse=removed;assert.equal(removed.status,200);assert.equal(removed.body.deleted,true);owned.firstRemoved=true;owned.stage='first-removed';await save(ownedPath,owned);
    const next=await c.rest('pages',{title:owned.marker+'_after_delete',status:'draft',content:''});lastResponse=next;assert.equal(next.status,201);owned.nextId=next.body.id;owned.next=record(next.body);owned.stage='second-created';await save(ownedPath,owned);assert.ok(owned.nextId>owned.id);
    assert.equal((await c.rest('pages/'+owned.id,{content:'stale owned restore probe'})).status,404);same(record(await api('pages/'+owned.nextId+'?context=edit')),owned.next,'owned.second-identity');
    removed=await c.rest('pages/'+owned.nextId+'?force=true',undefined,'DELETE');lastResponse=removed;assert.equal(removed.status,200);assert.equal(removed.body.deleted,true);owned.stage='removed';owned.cleanupComplete=true;await save(ownedPath,owned);
    assert.equal((await c.rest('pages/'+owned.id+'?context=edit')).status,404);assert.equal((await c.rest('pages/'+owned.nextId+'?context=edit')).status,404);
    const status=await c.operator('operator-fence-status');assert.equal(status.coherent,true);assert.equal(status.fence.active,false);assert.equal((await c.control()).state,'paused');
    const sc=await client(source),ss=await sc.operator('operator-fence-status');assert.equal(ss.coherent,true);assert.equal(ss.state.version,309);assert.equal(ss.state.pointer.revision,plan.revision);assert.equal((await sc.control()).state,'paused');
    await report('native-cold',{result:'pass',scope:'Fresh-login original native data and owned exact content after redeployment, monotonic IDs and identity-guarded cleanup; source unchanged',...verification,firstId:owned.id,nextId:owned.nextId,cleanupComplete:true,exactTrailingWhitespace:true,pinsRetained:21,state:status.state,sourceVersion:ss.state.version,checks:c.checks});
  }
} catch(error) {
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  await save(prefix+'native-diagnostic-'+stamp+'-private.json',{mode,lastResponse});
  await report('native-failure-'+mode.slice(2)+'-'+stamp,{result:'fail',errorName:error.name,differences,checks:c.checks});process.exitCode=1;
}
