import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {decodeCanonicalRestorePack,createCanonicalRestorePack} from '../src/canonical-restore-pack.ts';
assert.ok(process.argv.includes('--prepare'));
const prefix='artifacts/playtt-history-origin-';
try{await access(prefix+'plan-private.json');assert.fail('Existing plan must not be overwritten');}catch(e){if(e.code!=='ENOENT')throw e;}
const sha=x=>createHash('sha256').update(x).digest('hex');
const oldOrigin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
const expected=[[35,34,1],[36,34,1],[50,34,1],[51,34,1],[52,34,1],[53,34,1],[63,61,5],[64,62,2],[65,62,2],[66,61,5],[79,34,1],[80,34,1],[83,34,1],[84,34,1],[100,34,1],[101,34,1],[104,34,1],[105,34,1]];
const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-after-body-diagnostics-location-private.json','utf8'));
const report=JSON.parse(await readFile(directory+'/verification.json','utf8'));assert.equal(report.result,'pass');assert.equal(report.bucket,'playtt-wordpress-rebuild-audit');assert.equal(report.revision,'4e46e92b-788c-4ede-a2d0-7695153ea4e2');
const state=JSON.parse(await readFile(directory+'/state.json','utf8'));assert.equal(state.coherent,true);assert.equal(state.state.version,138);
const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));assert.equal(manifest.revision,report.revision);
const packed=await readFile(directory+'/restore.zip');assert.equal(sha(packed),report.archiveSha256);
const contents=await decodeCanonicalRestorePack(manifest.restorePack,'sites/default',{markdown:manifest.files,uploads:manifest.uploads,wpContent:manifest.wpContent,wpContentDeleted:manifest.wpContentDeleted},packed);
const entry=contents.markdown.find(f=>f.path==='_tables/posts.json');assert.ok(entry);
const before=JSON.parse(new TextDecoder().decode(entry.bytes));assert.equal(before.length,68);
const observed=before.filter(r=>r.post_content.includes(oldOrigin)).map(r=>[Number(r.ID),Number(r.post_parent),r.post_content.split(oldOrigin).length-1]);assert.deepEqual(observed,expected);
const changes=[];const after=before.map(row=>{
 if(!row.post_content.includes(oldOrigin))return row;
 assert.equal(row.post_type,'revision');
 for(const part of row.post_content.split(oldOrigin).slice(1))assert.ok(part.startsWith('/'),'Only exact origin plus path is in scope');
 const content=row.post_content.split(oldOrigin).join(origin);assert.ok(!content.includes(oldOrigin));
 changes.push({id:Number(row.ID),parent:Number(row.post_parent),references:row.post_content.split(oldOrigin).length-1,beforeHash:sha(row.post_content),afterHash:sha(content)});
 return {...row,post_content:content};
});
for(let i=0;i<before.length;i++){const restored={...after[i],post_content:before[i].post_content};assert.deepEqual(restored,before[i],'IDs, GUIDs, dates and every other field unchanged');}
const replacement=new TextEncoder().encode(JSON.stringify(after,null,2));
const revision=randomUUID(),pointer={revision,manifestKey:'sites/default/markdown/revisions/'+revision+'.json',persistedAt:new Date().toISOString()};
const files=manifest.files.map(f=>f.path===entry.path?{...f,sha256:sha(replacement),size:replacement.length,objectKey:f.objectKey.slice(0,f.objectKey.lastIndexOf('/')+1)+sha(replacement)}:f);
const repaired={...contents,markdown:contents.markdown.map(f=>f.path===entry.path?{path:f.path,bytes:replacement}:f)};
const pack=await createCanonicalRestorePack('sites/default',repaired);
const candidate={...manifest,...pointer,files,restorePack:pack.metadata};
const decoded=await decodeCanonicalRestorePack(candidate.restorePack,'sites/default',{markdown:candidate.files,uploads:candidate.uploads,wpContent:candidate.wpContent,wpContentDeleted:candidate.wpContentDeleted},pack.bytes);
assert.equal(decoded.markdown.length,contents.markdown.length);
for(const f of decoded.markdown){const prior=contents.markdown.find(p=>p.path===f.path);assert.ok(prior);assert.equal(sha(f.bytes),sha(f.path===entry.path?replacement:prior.bytes));}
for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(candidate[key],manifest[key]);
const output=resolve('../../../../outputs/backups/cloudflare-wordpress-history-origin/'+revision);await mkdir(output+'/objects',{recursive:true});
const changed=files.find(f=>f.path===entry.path);const uploads=[{key:changed.objectKey,file:'objects/'+changed.sha256,bytes:replacement},{key:pack.metadata.objectKey,file:'restore.zip',bytes:pack.bytes},{key:pointer.manifestKey,file:'manifest.json',bytes:Buffer.from(JSON.stringify(candidate))}];
const uploadObjects=[];for(const f of uploads){await writeFile(output+'/'+f.file,f.bytes);uploadObjects.push({key:f.key,file:f.file,size:f.bytes.length,sha256:sha(f.bytes)});}
const plan={at:new Date().toISOString(),origin,oldOrigin,bucket:report.bucket,baseVersion:138,basePointer:state.state.pointer,pointer,output,directory,changes,changedPaths:[entry.path],uploadObjects,applied:false};
await writeFile(prefix+'plan-private.json',JSON.stringify(plan,null,2));
const publicReport={at:plan.at,result:'pass',scope:'Local complete-backup transformation; only revision post_content exact-origin references change. No remote mutation.',baseRevision:report.revision,candidateRevision:revision,rows:68,revisions:18,references:28,changedPaths:plan.changedPaths,changes,allOtherFieldsAndFilesUnchanged:true,uploadObjects:uploadObjects.map(({key,size,sha256})=>({key,size,sha256}))};
await writeFile(prefix+'plan.json',JSON.stringify(publicReport,null,2));console.log(JSON.stringify({result:'pass',revisions:18,references:28,changedPaths:plan.changedPaths,candidateRevision:revision}));
