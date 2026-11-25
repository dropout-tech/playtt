import assert from 'node:assert/strict';
import {readFile,writeFile,access,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {openSnapshotBundle,exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {createCloudflareSnapshotSource} from './playtt-snapshot-download.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-editor-lock-backup-',origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n'),sha=b=>createHash('sha256').update(b).digest('hex');
const resume=process.argv.includes('--resume-directory');if(!resume){try{await access(prefix+'owned-private.json');throw Error('Existing backup attempt: inspect rather than replay');}catch(e){if(e.code!=='ENOENT')throw e;}}
const ui=await load('artifacts/playtt-editor-lock-ui-owned-private.json'),closed=await load('artifacts/playtt-editor-lock-ui-closed.json'),browser=await load('artifacts/playtt-editor-lock-ui-browser-private.json');
assert.equal(ui.phase,'closed-sealed');assert.equal(browser.newContentTyped,true);assert.equal(browser.secondUserSavedAndReloaded,true);assert.equal(browser.adminTabClosed,true);assert.equal(browser.editorTabClosed,true);assert.equal(closed.state.version,94);
const secrets=await load('../../../playtt-cms-secrets.json'),token=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(token);
async function json(path){assert.ok(['/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].includes(path));const r=await fetch(origin+path,{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN},signal:AbortSignal.timeout(45000),redirect:'error'});assert.equal(r.status,200);return r.json();}
async function status(){const [s,b,p,pub]=await Promise.all(['/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].map(json));assert.deepEqual(s.state,closed.state);assert.equal(s.fence.active,false);assert.equal(s.coherent,true);assert.equal(b.writeTracking.pending,0);assert.equal(b.writeTracking.sealed,true);assert.equal(b.writeTracking.window.closed,true);assert.equal(p.generation,6);assert.equal(pub.state,'paused');return {state:s.state,chargedBytes:b.chargedBytes,pins:p.generation};}
const before=await status(),owner=resume?await load(prefix+'owned-private.json'):{phase:'copying',directory:resolve('../../../../outputs/backups/cloudflare-wordpress-editor-lock/'+new Date().toISOString().replace(/[:.]/g,'-')),baselineDirectory:ui.baselineDirectory,baseline:ui.baseline};
if(resume){assert.equal(owner.phase,'copying');assert.equal(owner.anchor.revision,before.state.pointer.revision);assert.ok(resolve(owner.directory).startsWith(resolve('../../../../outputs/backups/cloudflare-wordpress-editor-lock')+'/')||resolve(owner.directory).startsWith(resolve('../../../../outputs/backups/cloudflare-wordpress-editor-lock')+'\\'));try{await access(owner.directory);throw Error('Resume only the proven absent parent directory');}catch(e){if(e.code!=='ENOENT')throw e;}}
else await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
await mkdir(owner.directory,{recursive:true});
const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-session-audit',token}),cache=new Map(),bucket={get(key){if(!cache.has(key))cache.set(key,source.bucket.get(key));return cache.get(key);}};
const raw=await bucket.get(before.state.pointer.manifestKey);assert.ok(raw);const bytes=new Uint8Array(await raw.arrayBuffer()),manifest=JSON.parse(new TextDecoder().decode(bytes));let base=manifest;
if(isMetadataOverlay(manifest.restorePack)){const b=await bucket.get(manifest.restorePack.base.manifestKey);assert.ok(b);base=JSON.parse(new TextDecoder().decode(await b.arrayBuffer()));}
const anchor=backupPinInput({...before.state.pointer,manifestSha256:sha(bytes),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});if(resume)assert.deepEqual(anchor,owner.anchor);owner.anchor=anchor;await save(prefix+'owned-private.json',owner);
await exportSnapshotBundle(bucket,anchor,owner.directory+'/export');const next=await importSnapshotBundle(owner.directory+'/export',anchor,owner.directory+'/independent'),old=await openSnapshotBundle(ui.baselineDirectory,ui.baseline);
const a=old.graph.contents,z=next.graph.contents;for(const k of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(z[k],a[k]);
const oldFiles=new Map(a.markdown.map(f=>[f.path,f.bytes])),newFiles=new Map(z.markdown.map(f=>[f.path,f.bytes]));const changed=[...newFiles].filter(([p,b])=>!oldFiles.has(p)||sha(b)!==sha(oldFiles.get(p))).map(([p])=>p),removed=[...oldFiles.keys()].filter(p=>!newFiles.has(p));
const table=(files,p)=>JSON.parse(new TextDecoder().decode(files.get(p))),tables={};
for(const [path,key]of [['_tables/posts.json','ID'],['_tables/postmeta.json','meta_id'],['_tables/usermeta.json','umeta_id'],['_tables/users.json','ID']]){
 const x=table(oldFiles,path),y=table(newFiles,path);tables[path]={added:y.filter(n=>!x.some(o=>o[key]===n[key])).map(n=>({id:n[key],parent:n.post_parent,postType:n.post_type,postId:n.post_id,userId:n.user_id,metaKey:n.meta_key,contentBytes:n.post_content?.length})),removed:x.filter(o=>!y.some(n=>n[key]===o[key])).map(o=>o[key]),changed:y.flatMap(n=>{const o=x.find(o=>o[key]===n[key]);if(!o||JSON.stringify(o)===JSON.stringify(n))return [];return [{id:n[key],parent:n.post_parent,postType:n.post_type,postId:n.post_id,userId:n.user_id,metaKey:n.meta_key,fields:Object.keys(n).filter(k=>n[k]!==o[k]),contentUnchanged:n.post_content===o.post_content}];})};
}
assert.deepEqual(await status(),before);owner.phase='independent-copy-verified-awaiting-diff';await save(prefix+'owned-private.json',owner);
const report={at:new Date().toISOString(),result:'independent-copy-verified-comparison-pending',canonicalVersion:94,anchor,changed,removed,tables,files:z.markdown.length+z.uploads.length+z.wpContent.length,objects:next.graph.objects.length,remoteGets:source.stats.requests,downloadedBytes:source.stats.downloadedBytes,mediaAndThemeExact:true,canonicalAndAccountingUnchanged:true,remoteMutations:0,pinAdded:false};await save(prefix+'inspection.json',report);console.log(JSON.stringify(report));
