import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));const mode=process.argv.find(v=>['--restore','--verify-cleanup'].includes(v));assert.ok(mode);
const ownedPath='artifacts/playtt-history-native-owned-private.json',owned=JSON.parse(await readFile(ownedPath,'utf8'));
assert.equal(owned.origin,origin);assert.equal(owned.id,140);assert.equal(owned.revisionId,141);assert.equal(owned.cleanupComplete,false);assert.ok(owned.marker.startsWith('playtt-history-restore-'));assert.ok(owned.target.endsWith('\n')&&!owned.target.endsWith('\n\n'));
const sha=x=>createHash('sha256').update(x).digest('hex'),c=await privateClient(),route='pages/'+owned.id;
const homeHash=JSON.parse(await readFile('artifacts/playtt-body-diagnostics-normal-cycle.json','utf8')).homeHash;
async function save(phase){owned.phase=phase;await writeFile(ownedPath,JSON.stringify(owned,null,2));}
async function check(client,expected){const r=await client.rest(route+'?context=edit');assert.equal(r.status,200);assert.equal(r.body.slug,owned.marker);assert.equal(r.body.title.raw,owned.marker);assert.equal(r.body.status,'draft');assert.equal(sha(r.body.content.raw),sha(expected));const h=await client.rest('pages/24?context=edit');assert.equal(h.status,200);assert.equal(sha(h.body.content.raw),homeHash);return r.body;}
try{
 await c.paused();await c.login();
 if(mode==='--restore'){
  assert.equal(owned.phase,'native-restored');await check(c,owned.target.slice(0,-1));
  // The pre-fix remote backup proves the original LF survived export; the
  // baseline readers, rather than native revision data, stripped it on load.
  const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-history-native-failure-location-private.json','utf8'));
  const m=JSON.parse(await readFile(directory+'/manifest.json','utf8')),entry=m.files.find(f=>f.path==='page/'+owned.marker+'.md');assert.ok(entry);const raw=await readFile(directory+'/objects/'+entry.sha256);assert.equal(sha(raw),entry.sha256);assert.ok(raw.toString('utf8').endsWith(owned.target+'\n'));assert.ok(!raw.toString('utf8').includes('__playtt_content:'));
  const revision=await c.rest(route+'/revisions/'+owned.revisionId+'?context=edit');assert.equal(revision.status,200);assert.equal(revision.body.parent,owned.id);assert.equal(sha(revision.body.content.raw),sha(owned.target));
  const r=await c.request('/wp-admin/revision.php?revision='+owned.revisionId);assert.equal(r.status,200);const html=await r.text();const settings=JSON.parse(html.match(/var _wpRevisionsSettings = ([^\r\n]+);/)[1]);const item=settings.revisionData.find(x=>x.id===owned.revisionId);assert.ok(item?.restoreUrl);
  const url=new URL(item.restoreUrl,origin);assert.equal(url.origin,origin);assert.equal(url.pathname,'/wp-admin/revision.php');assert.equal(url.searchParams.get('action'),'restore');assert.equal(url.searchParams.get('revision'),String(owned.revisionId));assert.ok(url.searchParams.get('_wpnonce'));
  const restored=await c.request(url.pathname,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:url.searchParams});assert.equal(restored.status,302);const location=new URL(restored.headers.get('location'),origin);assert.equal(location.origin,origin);assert.equal(location.searchParams.get('post'),String(owned.id));assert.equal(location.searchParams.get('message'),'5');await save('fixed-restored');
  const fresh=await privateClient();await fresh.login();await check(fresh,owned.target);await save('fixed-fresh-session-verified');await fresh.paused();
  const report={at:new Date().toISOString(),result:'pass',scope:'Replayed native restore action on the existing owned revision after a byte-preserving reader/writer fix; fresh-session content exact including final LF; originals unchanged. No browser UI claim.',id:owned.id,revisionId:owned.revisionId,targetHash:sha(owned.target),targetBytes:Buffer.byteLength(owned.target),preFixLostBytes:1,preFixBackupRetainedBytes:true,homeHash,cleanupComplete:false,publisher:'paused',checks:[...c.checks,...fresh.checks]};
  await writeFile('artifacts/playtt-content-restore.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }
 if(mode==='--verify-cleanup'){
  assert.equal(owned.phase,'fixed-fresh-session-verified');await check(c,owned.target);
  const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-content-native-restored-location-private.json','utf8'));const m=JSON.parse(await readFile(directory+'/manifest.json','utf8'));const entry=m.files.find(f=>f.path==='page/'+owned.marker+'.md');assert.ok(entry);const raw=await readFile(directory+'/objects/'+entry.sha256);assert.equal(sha(raw),entry.sha256);assert.ok(raw.toString('utf8').includes('__playtt_content:'));assert.ok(raw.toString('utf8').endsWith(owned.target+'\n'));
  const removed=await c.rest(route+'?force=true',undefined,'DELETE');assert.equal(removed.status,200);assert.equal(removed.body.deleted,true);assert.equal(removed.body.previous.id,owned.id);assert.equal(removed.body.previous.slug,owned.marker);assert.equal((await c.rest(route+'?context=edit')).status,404);owned.cleanupComplete=true;await save('cleaned-after-fixed-restore');await c.paused();
  const report={at:new Date().toISOString(),result:'pass',scope:'Fresh native login/readback after identical-code redeploy; marked full backup preserves exact bytes; identity-checked owned page cleanup. Complete original-table comparison follows separately.',id:owned.id,revisionId:owned.revisionId,targetHash:sha(owned.target),homeHash,cleanupComplete:true,publisher:'paused',checks:c.checks};await writeFile('artifacts/playtt-content-cleanup.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }
}catch(error){await writeFile('artifacts/playtt-content-failure-'+mode.slice(2)+'.json',JSON.stringify({at:new Date().toISOString(),result:'fail',errorName:error.name,phase:owned.phase,id:owned.id,checks:c.checks},null,2));throw error;}
