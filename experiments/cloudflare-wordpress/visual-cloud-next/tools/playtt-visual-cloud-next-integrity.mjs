// Pure, offline comparison of the owned draft trial against its canonical201 backup.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
// Build each read-only index once. Copying every payload for every path lookup
// creates quadratic external-memory churn even when the snapshot is small.
const view=value=>{assert.ok(value instanceof Uint8Array);return Buffer.from(value.buffer,value.byteOffset,value.byteLength);};
const entries=(graph,group)=>{const files=graph.contents[group],result=new Map(files.map(f=>[f.path,view(f.bytes)]));assert.equal(result.size,files.length,'Duplicate file path');return result;};
const bytes=(index,path)=>{const value=index.get(path);assert.ok(value,'Missing required data file');return value;};
const table=(index,path)=>JSON.parse(bytes(index,path));
const sameFiles=(a,b,group)=>{
 const x=entries(a,group),y=entries(b,group);assert.equal(x.size,a.contents[group].length);assert.equal(y.size,b.contents[group].length);
 assert.deepEqual([...x.keys()].sort(),[...y.keys()].sort(),group+' paths changed');
 for(const [path,value]of x)assert.ok(y.get(path).equals(value),group+' content changed');
};
function frame(graph,path){
 const match=bytes(graph,path).toString().match(/^---\n(.+?)\n---\n\n?(.*)$/s);assert.ok(match&&match[2].endsWith('\n'),'Invalid draft frame');
 const marker=match[1].match(/^__playtt_content: "v1:(\d+):([a-f0-9]{64})"$/m),content=match[2].slice(0,-1);assert.ok(marker,'Missing content integrity marker');
 assert.equal(Number(marker[1]),Buffer.byteLength(content));assert.equal(marker[2],sha(content));return{frontmatter:match[1],content};
}
function uniqueRows(rows,key){const result=new Map(rows.map(row=>[row[key],row]));assert.equal(result.size,rows.length,'Duplicate row identity');return result;}
const integer=value=>{assert.match(String(value),/^\d+$/);const n=Number(value);assert.ok(Number.isSafeInteger(n));return n;};
export function verifyVisualTrialData({before,after,fixture,openedAt,finishedAt}){
 assert.equal(fixture.id,193);assert.equal(fixture.user.id,2);assert.ok(Number.isFinite(openedAt)&&Number.isFinite(finishedAt)&&finishedAt>=openedAt);
 assert.equal(sha(fixture.expectedContent),fixture.expectedSha,'Expected content SHA does not match fixed fixture');
 const beforeIndex=entries(before,'markdown'),afterIndex=entries(after,'markdown');
 const original=frame(beforeIndex,fixture.draftPath),final=frame(afterIndex,fixture.draftPath);
 assert.equal(original.content.split('<p>'+fixture.lastText+'</p>').length,2,'Baseline must contain the owned paragraph exactly once');
 assert.equal(original.content.replace('<p>'+fixture.lastText+'</p>','<p>'+fixture.editedText+'</p>'),fixture.expectedContent,'Fixed change must affect only the owned paragraph');
 assert.equal(final.content,fixture.expectedContent,'Saved draft differs from fixed content');
 const paths=before.contents.markdown.map(f=>f.path).sort();assert.equal(new Set(paths).size,paths.length);assert.deepEqual(paths,after.contents.markdown.map(f=>f.path).sort());
 const changed=paths.filter(path=>!bytes(beforeIndex,path).equals(bytes(afterIndex,path))),allowed=new Set([fixture.draftPath,'_tables/posts.json','_tables/postmeta.json','_tables/usermeta.json','_runtime/playtt-auto-increment.json']);
 assert.ok(changed.includes(fixture.draftPath)&&changed.includes('_tables/posts.json'),'Saved draft and revision must change');
 assert.ok(changed.every(path=>allowed.has(path)),'Unrelated data changed');
 for(const f of [original.frontmatter,final.frontmatter]){assert.match(f,/^  status: draft$/m);assert.match(f,/^  date_gmt: "0000-00-00 00:00:00"$/m);}
 const stable=raw=>raw.split('\n').filter(line=>!/^(__playtt_content:|  date:|  modified:|  modified_gmt:)/.test(line)).join('\n');assert.equal(stable(final.frontmatter),stable(original.frontmatter),'Draft metadata changed');
 const date=final.frontmatter.match(/^  date: "([^"\n]+)"$/m)?.[1],modified=final.frontmatter.match(/^  modified: "([^"\n]+)"$/m)?.[1];assert.equal(date,modified,'Floating draft date and modification must agree');
 const at=Date.parse(date?.replace(' ','T')+'Z');assert.ok(at>=openedAt-1000&&at<=finishedAt,'Draft timestamp outside trial');
 const modifiedGmt=final.frontmatter.match(/^  modified_gmt: "([^"\n]+)"$/m)?.[1],gmtAt=Date.parse(modifiedGmt?.replace(' ','T')+'Z');assert.ok(gmtAt>=openedAt-1000&&gmtAt<=finishedAt,'UTC modification timestamp outside trial');
 const posts0=table(beforeIndex,'_tables/posts.json'),posts1=table(afterIndex,'_tables/posts.json'),oldPosts=uniqueRows(posts0,'ID'),newPosts=uniqueRows(posts1,'ID');
 for(const [id,row]of oldPosts)assert.deepEqual(newPosts.get(id),row,'Original post or revision changed');
 const added=posts1.filter(row=>!oldPosts.has(row.ID));assert.ok(added.length>=1&&added.length<=3,'Unexpected revision count');const previousMax=Math.max(...posts0.map(row=>integer(row.ID)));
 for(const row of added){assert.ok(integer(row.ID)>previousMax);assert.equal(row.post_parent,'193');assert.equal(row.post_type,'revision');assert.equal(row.post_status,'inherit');assert.equal(row.post_author,'2');assert.equal(row.post_content,fixture.expectedContent,'Revision content differs');}
 const meta0=table(beforeIndex,'_tables/postmeta.json'),meta1=table(afterIndex,'_tables/postmeta.json'),newMeta=uniqueRows(meta1,'meta_id');assert.equal(newMeta.size,uniqueRows(meta0,'meta_id').size);
 for(const row of meta0){const now=newMeta.get(row.meta_id);assert.ok(now);if(row.post_id==='193'&&row.meta_key==='_edit_lock'){
  assert.deepEqual({...now,meta_value:row.meta_value},row);assert.match(now.meta_value,/^\d+:2$/);const lockAt=Number(now.meta_value.split(':')[0])*1000;assert.ok(lockAt>=openedAt-1000&&lockAt<=finishedAt);
 }else assert.deepEqual(now,row,'Unrelated post metadata changed');}
 const users0=table(beforeIndex,'_tables/usermeta.json'),users1=table(afterIndex,'_tables/usermeta.json'),newUsers=uniqueRows(users1,'umeta_id');assert.equal(newUsers.size,uniqueRows(users0,'umeta_id').size,'Session or user metadata rows added/removed');
 const sessions=rows=>rows.filter(row=>row.meta_key==='session_tokens').sort((a,b)=>a.umeta_id.localeCompare(b.umeta_id));assert.deepEqual(sessions(users1),sessions(users0),'New session retained or original sessions changed');
 for(const row of users0){const now=newUsers.get(row.umeta_id);assert.ok(now);if(row.user_id==='2'&&row.meta_key==='wp_persisted_preferences'){
  assert.deepEqual({...now,meta_value:row.meta_value},row);const oldModified=row.meta_value.match(/s:9:"_modified";s:24:"([^"]+)"/),newModified=now.meta_value.match(/s:9:"_modified";s:24:"([^"]+)"/);assert.ok(oldModified&&newModified);
  if(oldModified[1]!==newModified[1]){const t=Date.parse(newModified[1]);assert.ok(t>=openedAt-1000&&t<=finishedAt,'Preference timestamp outside trial');}
  const normalized=now.meta_value.replace('s:10:"editorMode";s:6:"visual"','s:10:"editorMode";s:4:"text"').replace(newModified[0],oldModified[0]);assert.equal(normalized,row.meta_value,'Unexpected editor preference change');
 }else assert.deepEqual(now,row,'Unrelated user metadata changed');}
 const seq0=table(beforeIndex,'_runtime/playtt-auto-increment.json'),seq1=table(afterIndex,'_runtime/playtt-auto-increment.json');
 assert.equal(integer(seq1.sequences.wp_posts),Math.max(...posts1.map(row=>integer(row.ID))));assert.ok(integer(seq1.sequences.wp_options)>=integer(seq0.sequences.wp_options),'Option sequence regressed');assert.equal(integer(seq1.sequences.wp_usermeta),integer(seq0.sequences.wp_usermeta)+1,'Expected one native login session allocation');
 assert.deepEqual({...seq1,sequences:{...seq1.sequences,wp_posts:seq0.sequences.wp_posts,wp_options:seq0.sequences.wp_options,wp_usermeta:seq0.sequences.wp_usermeta}},seq0,'Unrelated sequence changed');
 for(const group of ['uploads','wpContent'])sameFiles(before,after,group);assert.deepEqual(after.contents.wpContentDeleted,before.contents.wpContentDeleted);
 return {result:'data-integrity-pass',changedFiles:changed,originalPostsAndRevisionsExact:true,addedRevisionIds:added.map(row=>Number(row.ID)),draftContentSha256:fixture.expectedSha,onlyOwnedEditLockAndEditorPreferenceMayChange:true,originalSessionsExactNewSessionRemoved:true,allOtherContentMediaThemeExact:true,files:['markdown','uploads','wpContent'].reduce((n,g)=>n+after.contents[g].length,0)};
}
