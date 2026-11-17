import assert from 'node:assert/strict';
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';

assert.ok(process.argv.includes('--remote'),'Explicit remote scope required');
const mode=process.argv.find(v=>['--preflight','--capture-source','--upload','--restore','--verify'].includes(v));assert.ok(mode);
const configName='wrangler.playtt-retirement-restore-audit.jsonc';
const bucket='playtt-wordpress-retirement-audit';
const origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const sourceOrigin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const prefix='artifacts/playtt-retirement-restore-';
const config=JSON.parse(await readFile(configName,'utf8'));
assert.equal(config.name,'playtt-wp-free-restore-audit');assert.equal(config.account_id,'3baadbd4abd9fd63c7f7e51664b26f67');
assert.equal(config.r2_buckets.length,1);assert.equal(config.r2_buckets[0].bucket_name,bucket);assert.equal(config.vars.PLAYTT_STATE_PARTITION,'restore-v1');
assert.deepEqual(JSON.parse(config.vars.WORDPRESS_SITE_CONTEXTS),[{id:'default',hostname:new URL(origin).hostname,origin}]);
assert.ok(!config.routes&&!config.services);assert.ok(config.durable_objects.bindings.every(b=>!b.script_name));
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const {directory}=JSON.parse(await readFile(prefix+'input-private.json','utf8'));
assert.ok((await realpath(directory)).startsWith((await realpath('../../../../outputs/backups/cloudflare-wordpress-restore-probe'))+sep));
const backup=JSON.parse(await readFile(directory+'/verification.json','utf8'));
assert.equal(backup.result,'pass');assert.equal(backup.archiveSha256,'85594bc9bd0c478390a892415a9edb3715a2cb8526b262dc0f6bf40c4aa98268');
assert.equal(backup.revision,'9ab986fc-ac85-4fe5-85e4-0279bccaea03');
const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));
const sourceState=JSON.parse(await readFile(directory+'/state.json','utf8'));
const inventory=JSON.parse(await readFile(directory+'/object-inventory.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const hash=x=>sha(JSON.stringify(x));
const checks=[];
async function report(name,data){const result={at:new Date().toISOString(),bucket,backupRevision:backup.revision,...data};await writeFile(prefix+name+'.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));return result;}
async function preflight(){
 assert.equal(manifest.revision,backup.revision);assert.equal(sourceState.state.pointer.revision,backup.revision);
 const pack=await readFile(directory+'/restore.zip');assert.equal(sha(pack),backup.archiveSha256);
 const decoded=await decodeCanonicalRestorePack(manifest.restorePack,'sites/default',{markdown:manifest.files,uploads:manifest.uploads||[],wpContent:manifest.wpContent||[],wpContentDeleted:manifest.wpContentDeleted||[]},pack);
 const objects=[...new Map(inventory.map(o=>[o.key,o])).values()];assert.ok(objects.length>0&&objects.length<1000);
 for(const item of objects){assert.ok(item.key.startsWith('sites/default/')&&!item.key.includes('..'));assert.ok(/^(objects\/[a-f0-9]{64}|manifest\.json|restore\.zip)$/.test(item.file));const bytes=await readFile(resolve(directory,item.file));assert.equal(bytes.length,item.size);assert.equal(sha(bytes),item.sha256);}
 const core=[];
 for(const [name,file]of [['wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'],['wordpress-static-artifact','cloudflare-wordpress-static-corpus.bin'],['sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip']]){
  const m=JSON.parse(await readFile('assets/'+name+'.json','utf8')),expected=m.archive||m.blob,bytes=await readFile('artifacts/'+file);assert.equal(bytes.length,expected.size);assert.equal(sha(bytes),expected.sha256);core.push({key:m.key,file:resolve('artifacts/'+file),size:bytes.length,sha256:expected.sha256});
 }
 assert.ok(core.reduce((s,v)=>s+v.size,0)<96*1024*1024);
 return {objects,core,decoded};
}
function client(host){
 assert.ok([origin,sourceOrigin].includes(host));const cookies=new Map();let nonce;
 async function request(path,options={},anonymous=false){
  assert.ok(path.startsWith('/')&&!path.startsWith('//'));
  const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);if(!anonymous)headers.set('cookie',[...cookies.values()].join('; '));
  const started=Date.now(),r=await fetch(host+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});
  assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');checks.push({target:host===origin?'audit':'source',path,method:options.method||'GET',status:r.status,wallMs:Date.now()-started});
  for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}return r;
 }
 async function operator(phase,body){const r=await request('/?phase='+phase,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,'Operator '+phase);return r.json();}
 async function control(action){const r=await request('/__playtt-publishing',{method:action?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:action?JSON.stringify({action}):undefined});assert.equal(r.status,200);return r.json();}
 async function login(){
  assert.equal((await request('/wp-login.php')).status,200);
  const login=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:host+'/wp-admin/'})});assert.equal(login.status,302);assert.equal(new URL(login.headers.get('location'),host).origin,host);
  const page=await request('/wp-admin/');assert.equal(page.status,200);const text=await page.text();assert.ok(text.includes('lang="zh-TW"'));nonce=text.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 }
 async function api(path){const r=await request('/wp-json/wp/v2/'+path,{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200,'API '+path);return r.json();}
 return {request,operator,control,login,api};
}
const record=p=>({id:p.id,slug:p.slug,status:p.status,title:p.title?.raw,content:p.content?.raw});
async function content(c){
 const pages=(await c.api('pages?context=edit&per_page=100')).map(record).sort((a,b)=>a.id-b.id);
 const parts=(await c.api('template-parts?context=edit&per_page=100')).map(record).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const navigation=(await c.api('navigation?context=edit&per_page=100')).map(record).sort((a,b)=>a.id-b.id);
 const theme=(await c.api('themes?context=edit')).find(t=>t.stylesheet==='lets-play');assert.ok(theme);assert.equal(theme.version,'0.2.3');
 const styleId=theme._links['wp:user-global-styles'][0].href.split('/').at(-1),style=await c.api('global-styles/'+styleId+'?context=edit');
 const me=await c.api('users/me?context=edit');assert.equal(me.locale,'zh_TW');assert.ok(me.roles.includes('administrator'));
 const privatePost=record(await c.api('posts/6?context=edit'));assert.equal(privatePost.status,'draft');
 return {pages,parts,navigation,styles:style.styles,settings:style.settings,privatePost,locale:me.locale,theme:theme.version};
}
try{
 const verified=await preflight();
 if(mode==='--preflight')await report('preflight',{result:'pass',scope:'Offline latest backup and all destination bindings validated; no remote state changed',uniqueObjects:verified.objects.length,coreObjects:verified.core.length,archiveSha256:backup.archiveSha256});
 if(mode==='--capture-source'){
  const c=client(sourceOrigin),before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.state.pointer.revision,backup.revision);assert.equal((await c.control()).state,'paused');
  await c.login();const expected=await content(c);await writeFile(prefix+'expected-private.json',JSON.stringify(expected));await report('source',{result:'pass',scope:'Source semantic reference captured after exact backup revision check; login may persist a session, publisher remains paused',contentHash:hash(expected),pageCount:expected.pages.length,checks});
 }
 if(mode==='--upload'){
  const c=client(origin),empty=await c.operator('operator-fence-status');assert.equal(empty.coherent,true);assert.equal(empty.state.pointer,null);assert.equal(empty.state.version,0);assert.equal((await c.control('pause')).state,'paused');
  const queue=[...verified.core,...verified.objects.map(o=>({...o,file:resolve(directory,o.file)}))];const total=queue.length;let uploaded=0;
  const runner=async()=>{while(queue.length){const item=queue.shift();await new Promise((done,fail)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','put',bucket+'/'+item.key,'--file',item.file,'--remote','--config',configName],{stdio:'ignore'});child.on('error',fail);child.on('exit',code=>code===0?done():fail(Error('Audit upload failed for verified object')));});uploaded++;if(uploaded%25===0)console.log(JSON.stringify({uploaded,total}));}};
  await Promise.all(Array.from({length:4},runner));await report('upload',{result:'pass',scope:'Verified backup copied into separate private R2 audit bucket; fresh target DO remains empty',uploaded,coreObjects:verified.core.length,archiveSha256:backup.archiveSha256});
 }
 if(mode==='--restore'){
  const upload=JSON.parse(await readFile(prefix+'upload.json','utf8'));assert.equal(upload.result,'pass');assert.equal(upload.bucket,bucket);assert.equal(upload.archiveSha256,backup.archiveSha256);
  const c=client(origin),before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.state.pointer,null);assert.equal(before.state.version,0);assert.equal((await c.control()).state,'paused');
  const restored=await c.operator('operator-restore',sourceState.state.pointer);assert.equal(restored.restored,true);const after=await c.operator('operator-fence-status');assert.equal(after.coherent,true);assert.deepEqual(after.state.pointer,sourceState.state.pointer);
  await report('adopt',{result:'pass',scope:'Latest backup pointer restored into independent empty DO/R2; source was not reset',initialVersion:before.state.version,restoredVersion:after.state.version,checks});
 }
 if(mode==='--verify'){
  const c=client(origin);assert.equal((await c.control()).state,'paused');await c.login();const actual=await content(c),expected=JSON.parse(await readFile(prefix+'expected-private.json','utf8'));assert.equal(hash(actual),hash(expected),'Restored semantic content hash must exactly match source');
  const media=[];for(const item of manifest.uploads||[]){const r=await c.request('/wp-content/uploads/'+item.path,{},true);assert.equal(r.status,200);assert.equal(r.headers.get('x-wp-codebox-static'),'r2-upload');assert.equal(sha(Buffer.from(await r.arrayBuffer())),item.sha256);media.push({path:item.path,sha256:item.sha256});}
  const pages=[];for(const path of ['/','/about/','/class/','/coaches/','/locations/','/partner/']){const r=await c.request(path,{},true);assert.equal(r.status,200);assert.ok(r.headers.get('x-robots-tag')?.includes('noindex'));const text=await r.text();assert.ok(text.includes('line.me/R/ti/p/@869usyqy'));assert.ok(!text.includes('id="wpadminbar"'));pages.push(path);}
  const css=await c.request('/wp-content/themes/lets-play/style.css',{},true);assert.equal(css.status,200);assert.ok((await css.text()).includes('Version: 0.2.3'));
  const hidden=await c.request('/?p=6',{},true);assert.equal(hidden.status,404);await hidden.arrayBuffer();const edit=await c.request('/wp-json/wp/v2/posts/6?context=edit',{},true);assert.equal(edit.status,401);await edit.arrayBuffer();
  assert.equal((await c.control()).state,'paused');await report('verification',{result:'pass',scope:'Independent latest-candidate backup restore: semantic source equality, all uploaded media hashes, six pages, theme, zh_TW admin and anonymous draft rejection; embedded content origins intentionally unchanged',contentHash:hash(actual),pageCount:actual.pages.length,templateParts:actual.parts.length,navigation:actual.navigation.length,mediaVerified:media.length,media,pages,anonymousDraftPageStatus:404,anonymousDraftEditStatus:401,publisher:'paused',checks});
 }
}catch(error){await report('failure-'+mode.slice(2),{result:'fail',error:String(error),checks});process.exitCode=1;}
