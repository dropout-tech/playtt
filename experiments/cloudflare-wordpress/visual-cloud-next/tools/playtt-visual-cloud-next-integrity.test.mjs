// Real frozen snapshots are read locally; negative cases mutate in-memory copies only.
import test,{after as afterTests} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {verifyVisualTrialData} from './playtt-visual-cloud-next-integrity.mjs';
const load=async path=>JSON.parse(await readFile(path,'utf8'));
const cloud=await load('artifacts/playtt-native-approved-backup-owned-private.json'),local=await load('artifacts/playtt-visual-cloud-rehearsal-owned-private.json'),summary=await load('artifacts/playtt-visual-cloud-rehearsal-summary.json');
assert.equal(local.phase,'verified');assert.equal(local.localProcessesDisposed,true);assert.equal(local.sealed,true);assert.equal(summary.result,'pass');
const before=(await openSnapshotBundle(cloud.directory+'/independent',cloud.anchor)).graph,after=(await openSnapshotBundle(local.directory+'/independent',local.finalAnchor)).graph;
console.log(JSON.stringify({stage:'snapshots-opened',node:process.version,baselineObjects:before.objects.length,finalObjects:after.objects.length,files:['markdown','uploads','wpContent'].reduce((n,g)=>n+after.contents[g].length,0),rss:process.memoryUsage().rss}));
afterTests(()=>console.log(JSON.stringify({stage:'tests-finished',node:process.version,maxRSSKiB:process.resourceUsage().maxRSS,remoteCalls:0})));
const fixture={id:193,user:{id:2},draftPath:local.draftPath,lastText:local.lastText,editedText:local.editedText,expectedContent:local.expectedContent,expectedSha:local.expectedSha},args={before,after,fixture,openedAt:summary.initialBudget.writeTracking.window.openedAt,finishedAt:Date.parse(summary.at)};
const file=(graph,path)=>graph.contents.markdown.find(f=>f.path===path),changeTable=(graph,path,fn)=>{const f=file(graph,path),rows=JSON.parse(Buffer.from(f.bytes));fn(rows);f.bytes=Buffer.from(JSON.stringify(rows));};
test('accept the independently verified native visual edit, restart and logout snapshot',()=>{
 const result=verifyVisualTrialData(args);assert.equal(result.result,'data-integrity-pass');assert.deepEqual(result.addedRevisionIds,[210]);assert.equal(result.files,298);assert.equal(result.originalSessionsExactNewSessionRemoved,true);
});
// Every mutation below replaces the selected file's bytes; unrelated payloads
// can be shared read-only without cloning the entire media/theme snapshot.
const negative=(name,mutate)=>test(name,()=>{const copy={contents:{...after.contents,...Object.fromEntries(['markdown','uploads','wpContent'].map(group=>[group,after.contents[group].map(f=>({...f}))]))}};mutate(copy);assert.throws(()=>verifyVisualTrialData({...args,after:copy}));});
negative('reject a draft body whose integrity marker was not updated',g=>{const f=file(g,fixture.draftPath);f.bytes=Buffer.from(Buffer.from(f.bytes).toString().replace(fixture.editedText,'Unexpected content'));});
negative('reject changing an original revision',g=>changeTable(g,'_tables/posts.json',rows=>{rows.find(r=>r.ID!=='210').post_title='Tampered';}));
negative('reject a revision attached to another page',g=>changeTable(g,'_tables/posts.json',rows=>{rows.find(r=>r.ID==='210').post_parent='194';}));
negative('reject a retained new login session',g=>changeTable(g,'_tables/usermeta.json',rows=>rows.push({umeta_id:'999999',user_id:'2',meta_key:'session_tokens',meta_value:'test-only-not-a-token'})));
negative('reject an unrelated user capability change',g=>changeTable(g,'_tables/usermeta.json',rows=>{const r=rows.find(r=>r.user_id!=='2');assert.ok(r);r.meta_value+='tampered';}));
negative('reject changed media/theme bytes',g=>{const group=['uploads','wpContent'].find(k=>g.contents[k].length>0);assert.ok(group);g.contents[group][0].bytes=Buffer.from('changed-asset');});
negative('reject a regressed option sequence',g=>changeTable(g,'_runtime/playtt-auto-increment.json',data=>{data.sequences.wp_options='0';}));
negative('reject an unrelated option file change',g=>{const f=file(g,'_options/siteurl.json');assert.ok(f,'Real snapshot must contain the site URL option');f.bytes=Buffer.from('"https://unrelated.invalid"');});
negative('reject publishing the private draft',g=>{const f=file(g,fixture.draftPath);f.bytes=Buffer.from(Buffer.from(f.bytes).toString().replace('  status: draft','  status: publish'));});
negative('reject preferences beyond editor mode and modification time',g=>changeTable(g,'_tables/usermeta.json',rows=>{rows.find(r=>r.user_id==='2'&&r.meta_key==='wp_persisted_preferences').meta_value+='tampered';}));
negative('reject duplicate revision identity',g=>changeTable(g,'_tables/posts.json',rows=>rows.push({...rows.find(r=>r.ID==='210')})));
negative('reject a modification time outside the trial',g=>{const f=file(g,fixture.draftPath);f.bytes=Buffer.from(Buffer.from(f.bytes).toString().replace(/^  modified_gmt: "[^"\n]+"$/m,'  modified_gmt: "2000-01-01 00:00:00"'));});
test('reject an unchanged baseline masquerading as a successful save',()=>assert.throws(()=>verifyVisualTrialData({...args,after:before})));
