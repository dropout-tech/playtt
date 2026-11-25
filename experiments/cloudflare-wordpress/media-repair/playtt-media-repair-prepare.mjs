import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
import {bootWordPressAndRequestHandler} from '@wp-playground/wordpress';
import {decodeCanonicalRestorePack,createCanonicalRestorePack} from '../src/canonical-restore-pack.ts';
import {PLAYTT_STARTER_MEDIA_POLICY,installPlayttOpaqueIds} from '../src/playtt-php-compat.ts';

assert.ok(process.argv.includes('--prepare'),'This script only prepares a local repair candidate; it never connects remotely.');
const prefix='artifacts/playtt-media-repair-';
let exists=false;try{await readFile(prefix+'plan-private.json');exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!exists,'Existing repair plan must not be overwritten');
const sha=x=>createHash('sha256').update(x).digest('hex');
const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-postmeta-cleanup-location-private.json','utf8'));
const backup=JSON.parse(await readFile(directory+'/verification.json','utf8'));assert.equal(backup.result,'pass');assert.equal(backup.bucket,'playtt-wordpress-rebuild-audit');assert.equal(backup.revision,'edf7bf71-b84e-444e-a6d9-1cce10366841');
const state=JSON.parse(await readFile(directory+'/state.json','utf8'));assert.equal(state.state.version,85);assert.equal(state.coherent,true);
const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));assert.equal(manifest.revision,backup.revision);
const packed=await readFile(directory+'/restore.zip');assert.equal(sha(packed),backup.archiveSha256);
const contents=await decodeCanonicalRestorePack(manifest.restorePack,'sites/default',{markdown:manifest.files,uploads:manifest.uploads||[],wpContent:manifest.wpContent||[],wpContentDeleted:manifest.wpContentDeleted||[]},packed);
const canonical=path=>{const file=contents.markdown.find(f=>f.path===path);assert.ok(file);return JSON.parse(new TextDecoder().decode(file.bytes));};
assert.deepEqual(canonical('_runtime/playtt-postmeta-layout.json'),{schema:'playtt/postmeta-table/v1'});
const beforeRows=canonical('_tables/postmeta.json'),beforeSequences=canonical('_runtime/playtt-auto-increment.json');assert.equal(beforeRows.length,4);assert.equal(beforeSequences.sequences.wp_postmeta,'20');
const attachments=contents.markdown.filter(f=>f.path.startsWith('attachment/')&&f.path.endsWith('.md'));assert.equal(attachments.length,15);assert.equal(contents.uploads.length,15);
const inventory=[];
for(const item of attachments){
 const raw=new TextDecoder().decode(item.bytes);const id=Number(raw.match(/^  id: (\d+)$/m)?.[1]),slug=raw.match(/^  slug: ([a-z0-9-]+)$/m)?.[1],mime=raw.match(/^  mime_type: (image\/(?:webp|png))$/m)?.[1];
 assert.ok(Number.isSafeInteger(id)&&id>0&&slug&&mime);assert.equal(item.path,'attachment/'+slug+'.md');assert.match(raw,/^  type: attachment$/m);assert.match(raw,/^  status: inherit$/m);
 const extension=mime==='image/webp'?'webp':'png',path='2026/11/'+slug+'.'+extension;
 const upload=contents.uploads.find(f=>f.path===path);assert.ok(upload);const entry=manifest.uploads.find(f=>f.path===path);assert.equal(sha(upload.bytes),entry.sha256);
 const brand=mime==='image/webp';if(brand){assert.ok(id>=10&&id<=23);assert.equal(sha(await readFile('../../../playtt/wordpress/lets-play/assets/images/'+slug+'.webp')),entry.sha256);}else{assert.equal(id,7);assert.equal(slug,'playtt-do-probe');assert.ok(raw.includes('/wp-content/uploads/'+path));}
 assert.equal(beforeRows.some(r=>Number(r.post_id)===id),false,'Repair requires no existing metadata on this attachment');
 inventory.push({id,slug,mime,path,brand,size:entry.size,sha256:entry.sha256,markdownPath:item.path,markdownSha256:sha(item.bytes)});
}
assert.equal(inventory.filter(x=>x.brand).length,14);assert.equal(new Set(inventory.map(x=>x.id)).size,15);inventory.sort((a,b)=>a.id-b.id);
const loaderSource=await readFile('src/playtt-php-loader.mjs','utf8');assert.match(loaderSource,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile(prefix+'php-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+loaderSource.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve(prefix+'php-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
async function artifact(name,file){const m=JSON.parse(await readFile('assets/'+name+'.json','utf8'));const bytes=await readFile('artifacts/'+file);assert.equal(sha(bytes),m.archive.sha256);assert.equal(bytes.length,m.archive.size);return {bytes,manifest:m};}
const core=await artifact('wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip');assert.equal(core.manifest.source.version,'7.1.4');
const sqlite=await artifact('sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip');
const seed=await readFile('assets/wordpress-install-seed.sqlite');
const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
const handler=await bootWordPressAndRequestHandler({
 createPhpRuntime:()=>loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}),
 phpIniEntries:{'opcache.enable':'0','opcache.enable_cli':'0'},
 constants:{AUTOMATIC_UPDATER_DISABLED:true,DISABLE_WP_CRON:true,WP_HTTP_BLOCK_EXTERNAL:true,FS_METHOD:'direct'},
 dataSqlPath:'/wordpress/wp-content/database/.ht.sqlite',cookieStore:false,maxPhpInstances:1,phpVersion:'8.3',siteUrl:origin,wordpressInstallMode:'do-not-attempt-installing',
 sqliteIntegrationPluginZip:new File([sqlite.bytes],'sqlite.zip'),
 hooks:{beforeWordPressFiles:async php=>{
  for await(const entry of decodeZip(new Blob([core.bytes]).stream())){if(entry.name.endsWith('/'))continue;const path='/'+entry.name;php.mkdir(path.slice(0,path.lastIndexOf('/')));php.writeFile(path,new Uint8Array(await entry.arrayBuffer()));}
  installPlayttOpaqueIds(php);
  for(const item of contents.uploads){const path='/wordpress/wp-content/uploads/'+item.path;php.mkdir(path.slice(0,path.lastIndexOf('/')));php.writeFile(path,item.bytes);}
  php.writeFile('/tmp/repair-inventory.json',JSON.stringify(inventory));
  php.mkdir('/wordpress/wp-content/mu-plugins');php.writeFile('/wordpress/wp-content/mu-plugins/playtt-local-media-policy.php','<?php\n'+PLAYTT_STARTER_MEDIA_POLICY);
 },beforeDatabaseSetup:php=>{php.mkdir('/wordpress/wp-content/database');php.writeFile('/wordpress/wp-content/database/.ht.sqlite',seed);}},
});
const php=await handler.getPrimaryPhp();let generated;
try{
 const result=await php.run({code:String.raw`<?php
require '/wordpress/wp-load.php';require_once ABSPATH.'wp-admin/includes/image.php';
$inventory=json_decode(file_get_contents('/tmp/repair-inventory.json'),true,512,JSON_THROW_ON_ERROR);$result=[];
foreach($inventory as$item){
 $id=$item['id'];$path=WP_CONTENT_DIR.'/uploads/'.$item['path'];
 if(get_post($id))throw new RuntimeException('Local fixture ID already exists.');
 if(hash_file('sha256',$path)!==$item['sha256'])throw new RuntimeException('Image digest changed.');
 $created=wp_insert_attachment(['import_id'=>$id,'post_title'=>$item['slug'],'post_name'=>$item['slug'],'post_mime_type'=>$item['mime'],'post_status'=>'inherit'],$path,0,true);
 if(is_wp_error($created)||$created!==$id)throw new RuntimeException('Local attachment identity failed.');
 if($item['brand'])update_post_meta($id,'_lets_play_asset',basename($path));
 $metadata=wp_generate_attachment_metadata($id,$path);
 if(!is_array($metadata)||($metadata['file']??null)!==$item['path']||($metadata['filesize']??null)!==$item['size']||empty($metadata['width'])||empty($metadata['height'])||!empty($metadata['sizes']))throw new RuntimeException('Unexpected generated image metadata.');
 wp_update_attachment_metadata($id,$metadata);
 $values=['_wp_attached_file'=>get_post_meta($id,'_wp_attached_file',true),'_wp_attachment_metadata'=>maybe_serialize(wp_get_attachment_metadata($id))];
 if($item['brand'])$values['_lets_play_asset']=get_post_meta($id,'_lets_play_asset',true);
 if($values['_wp_attached_file']!==$item['path']||wp_get_attachment_url($id)!==home_url('/wp-content/uploads/'.$item['path']))throw new RuntimeException('Native path mapping failed.');
 $result[]=['id'=>$id,'values'=>$values,'metadata'=>$metadata,'source_url'=>wp_get_attachment_url($id)];
}
echo json_encode(['wordpress'=>$wp_version,'generated'=>$result],JSON_THROW_ON_ERROR);`});
 assert.equal(result.exitCode,0,result.errors);generated=JSON.parse(result.text);assert.equal(generated.wordpress,'7.1.4');assert.equal(generated.generated.length,15);
}finally{php.exit();}
let nextId=BigInt(beforeSequences.sequences.wp_postmeta);const added=[];
for(const item of generated.generated)for(const [key,value]of Object.entries(item.values)){
 assert.equal(typeof value,'string');added.push({meta_id:String(++nextId),post_id:String(item.id),meta_key:key,meta_value:value});
}
assert.equal(added.length,44);const afterRows=[...beforeRows,...added],afterSequences=structuredClone(beforeSequences);afterSequences.sequences.wp_postmeta=String(nextId);assert.equal(nextId,64n);
const replacements=new Map([['_tables/postmeta.json',new TextEncoder().encode(JSON.stringify(afterRows,null,2))],['_runtime/playtt-auto-increment.json',new TextEncoder().encode(JSON.stringify(afterSequences))]]);
const repaired={...contents,markdown:contents.markdown.map(f=>replacements.has(f.path)?{path:f.path,bytes:replacements.get(f.path)}:f)};
const revision=randomUUID(),pointer={revision,manifestKey:'sites/default/markdown/revisions/'+revision+'.json',persistedAt:new Date().toISOString()};
// Derive the existing object namespace from the verified manifest rather than
// assuming an alternate prefix. Exactly two existing canonical files change.
const files=manifest.files.map(e=>replacements.has(e.path)?{...e,sha256:sha(replacements.get(e.path)),size:replacements.get(e.path).length,objectKey:e.objectKey.slice(0,e.objectKey.lastIndexOf('/')+1)+sha(replacements.get(e.path))}:e);
assert.equal(files.filter((f,i)=>f.sha256!==manifest.files[i].sha256).length,2);
assert.equal(pointer.manifestKey.slice(0,pointer.manifestKey.lastIndexOf('/')),manifest.manifestKey.slice(0,manifest.manifestKey.lastIndexOf('/')));
const candidatePack=await createCanonicalRestorePack('sites/default',repaired);
const candidate={...manifest,...pointer,files,restorePack:candidatePack.metadata};
const verified=await decodeCanonicalRestorePack(candidate.restorePack,'sites/default',{markdown:candidate.files,uploads:candidate.uploads,wpContent:candidate.wpContent||[],wpContentDeleted:candidate.wpContentDeleted||[]},candidatePack.bytes);
assert.equal(verified.markdown.length,contents.markdown.length);assert.deepEqual(candidate.uploads,manifest.uploads);assert.deepEqual(candidate.wpContent,manifest.wpContent);
const output=resolve('../../../../outputs/backups/cloudflare-wordpress-media-repair/'+revision);await mkdir(output,{recursive:true});await mkdir(output+'/objects');
const uploadObjects=[];for(const f of files.filter((f,i)=>f.sha256!==manifest.files[i].sha256)){await writeFile(output+'/objects/'+f.sha256,replacements.get(f.path));uploadObjects.push({key:f.objectKey,file:'objects/'+f.sha256,size:f.size,sha256:f.sha256});}
await writeFile(output+'/restore.zip',candidatePack.bytes);uploadObjects.push({key:candidate.restorePack.objectKey,file:'restore.zip',size:candidatePack.bytes.length,sha256:sha(candidatePack.bytes)});
const manifestBytes=Buffer.from(JSON.stringify(candidate));await writeFile(output+'/manifest.json',manifestBytes);uploadObjects.push({key:pointer.manifestKey,file:'manifest.json',size:manifestBytes.length,sha256:sha(manifestBytes)});
const plan={at:new Date().toISOString(),origin,bucket:'playtt-wordpress-rebuild-audit',basePointer:state.state.pointer,baseVersion:state.state.version,pointer,output,inventory,generated:generated.generated,added,uploadObjects,changedPaths:[...replacements.keys()],applied:false};
await writeFile(prefix+'plan-private.json',JSON.stringify(plan,null,2));
const report={at:plan.at,result:'pass',scope:'Local hash-verified repair candidate; native WordPress 7.1.4 regenerated metadata from exact original bytes in a disposable SQLite/PHP-WASM runtime. No remote mutation.',baseRevision:backup.revision,candidateRevision:revision,attachments:inventory.map(i=>({...i,width:generated.generated.find(g=>g.id===i.id).metadata.width,height:generated.generated.find(g=>g.id===i.id).metadata.height})),brandAssets:14,legacyProbeAssets:1,addedRows:44,unchangedRows:beforeRows.length,postmetaHighWaterBefore:'20',postmetaHighWaterAfter:'64',changedPaths:plan.changedPaths,uploadObjects:uploadObjects.map(({key,size,sha256})=>({key,size,sha256})),allOtherCanonicalFilesUnchanged:true,allUploadsUnchanged:true};
await writeFile(prefix+'plan.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,attachments:15,brandAssets:14,addedRows:44,changedPaths:plan.changedPaths,candidateRevision:revision}));
