import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));assert.ok(process.argv.includes('--exercise'));
const prefix='artifacts/playtt-history-native-',ownedPath=prefix+'owned-private.json';
try{await access(ownedPath);assert.fail('Owned state already exists; inspect it instead of replaying');}catch(e){if(e.code!=='ENOENT')throw e;}
const plan=JSON.parse(await readFile('artifacts/playtt-history-origin-plan-private.json','utf8'));assert.equal(plan.origin,origin);assert.equal(plan.applied,true);
const verified=JSON.parse(await readFile('artifacts/playtt-history-origin-verification.json','utf8'));assert.equal(verified.result,'pass');assert.equal(verified.migratedRevisions,18);
const m=JSON.parse(await readFile(plan.output+'/manifest.json','utf8'));
const decoded=await decodeCanonicalRestorePack(m.restorePack,'sites/default',{markdown:m.files,uploads:m.uploads,wpContent:m.wpContent,wpContentDeleted:m.wpContentDeleted},await readFile(plan.output+'/restore.zip'));
const rows=JSON.parse(new TextDecoder().decode(decoded.markdown.find(f=>f.path==='_tables/posts.json').bytes));const historical=rows.find(r=>r.ID==='35');assert.equal(historical.post_type,'revision');assert.ok(!historical.post_content.includes(plan.oldOrigin));assert.ok(historical.post_content.includes(origin+'/'));
const sha=x=>createHash('sha256').update(x).digest('hex');
const marker='playtt-history-restore-'+randomUUID();
const initial='<!-- wp:paragraph --><p>'+marker+' 初稿</p><!-- /wp:paragraph -->';
const target='<!-- wp:paragraph --><p>'+marker+' 修訂還原基準</p><!-- /wp:paragraph -->'+historical.post_content;
const current='<!-- wp:paragraph --><p>'+marker+' 還原前的新內容</p><!-- /wp:paragraph -->';
const owned={origin,marker,id:null,revisionId:null,initial,target,current,cleanupComplete:false,phase:'prepared'};await writeFile(ownedPath,JSON.stringify(owned,null,2));
const c=await privateClient();let homeHash;
async function save(phase){owned.phase=phase;await writeFile(ownedPath,JSON.stringify(owned,null,2));}
try{
 await c.paused();await c.login();const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);homeHash=sha(home.body.content.raw);
 const created=await c.rest('pages',{slug:marker,title:marker,status:'draft',content:initial});assert.equal(created.status,201);assert.ok(created.body.id>139);owned.id=created.body.id;await save('created');
 const route='pages/'+owned.id;for(const [phase,content]of [['target-saved',target],['current-saved',current]]){const r=await c.rest(route,{content});assert.equal(r.status,200);assert.equal(r.body.content.raw,content);await save(phase);}
 const revisions=await c.rest(route+'/revisions?context=edit&per_page=100');assert.equal(revisions.status,200);assert.ok(Array.isArray(revisions.body)&&revisions.body.length<100);
 const candidates=revisions.body.filter(r=>r.parent===owned.id&&r.content.raw===target);assert.equal(candidates.length,1);owned.revisionId=candidates[0].id;await save('revision-selected');
 const screen=await c.request('/wp-admin/revision.php?revision='+owned.revisionId);assert.equal(screen.status,200);const html=await screen.text();
 const raw=html.match(/var _wpRevisionsSettings = ([^\r\n]+);/)?.[1];assert.ok(raw,'Native revision settings must be present');
 const settings=JSON.parse(raw),revision=settings.revisionData.find(r=>r.id===owned.revisionId);assert.ok(revision?.restoreUrl);
 const url=new URL(revision.restoreUrl,origin);assert.equal(url.origin,origin);assert.equal(url.pathname,'/wp-admin/revision.php');assert.equal(url.searchParams.get('action'),'restore');assert.equal(url.searchParams.get('revision'),String(owned.revisionId));assert.ok(url.searchParams.get('_wpnonce'));
 // Use the native admin action and its freshly served nonce. POST keeps the
 // nonce out of URL-based diagnostics; no custom restore endpoint is added.
 const restore=await c.request(url.pathname,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:url.searchParams});assert.equal(restore.status,302);
 const redirect=new URL(restore.headers.get('location'),origin);assert.equal(redirect.origin,origin);assert.equal(redirect.searchParams.get('post'),String(owned.id));assert.equal(redirect.searchParams.get('message'),'5');await save('native-restored');
 const fresh=await privateClient();await fresh.login();const read=await fresh.rest(route+'?context=edit');assert.equal(read.status,200);assert.equal(read.body.slug,marker);assert.equal(read.body.status,'draft');assert.equal(read.body.title.raw,marker);assert.equal(read.body.content.raw,target);assert.ok(!read.body.content.raw.includes(plan.oldOrigin));
 const original=await fresh.rest('pages/24?context=edit');assert.equal(original.status,200);assert.equal(sha(original.body.content.raw),homeHash);await save('fresh-session-verified');
 const removed=await fresh.rest(route+'?force=true',undefined,'DELETE');assert.equal(removed.status,200);assert.equal(removed.body.deleted,true);assert.equal(removed.body.previous.id,owned.id);assert.equal(removed.body.previous.slug,marker);
 assert.equal((await fresh.rest(route+'?context=edit')).status,404);owned.cleanupComplete=true;await save('cleaned');await fresh.paused();
 const report={at:new Date().toISOString(),result:'pass',scope:'Native WordPress revision admin screen/action exercised through authenticated HTTP, on an owned draft containing migrated historical footer content; no original parent restored and no browser UI claim',id:owned.id,revisionId:owned.revisionId,targetHash:sha(target),homeHash,restoredInNewSession:true,cleanupComplete:true,publisher:'paused',checks:[...c.checks,...fresh.checks]};
 await writeFile(prefix+'restore.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await writeFile(prefix+'failure.json',JSON.stringify({at:new Date().toISOString(),result:'fail',phase:owned.phase,id:owned.id,revisionId:owned.revisionId,errorName:error.name,checks:c.checks},null,2));throw error;}
