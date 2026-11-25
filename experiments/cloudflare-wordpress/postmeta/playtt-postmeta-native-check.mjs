import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {PNG} from 'pngjs';

const mode=process.argv.find(v=>['--upload','--cold','--cleanup','--backup-compare'].includes(v));assert.ok(mode);
const prefix='artifacts/playtt-postmeta-native-',ownedPath=prefix+'owned-private.json';
const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function backup(label){
 const report=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-'+label+'.json','utf8'));assert.equal(report.result,'pass');assert.equal(report.bucket,'playtt-wordpress-rebuild-audit');
 const {directory}=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-'+label+'-location-private.json','utf8'));
 const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));assert.equal(manifest.revision,report.revision);
 async function object(path){const entry=manifest.files.find(e=>e.path===path);assert.ok(entry,'Missing canonical file '+path);const bytes=await readFile(directory+'/objects/'+entry.sha256);assert.equal(hash(bytes),entry.sha256);return JSON.parse(bytes);}
 return {report,manifest,object};
}
if(mode==='--backup-compare'){
 const owned=JSON.parse(await readFile(ownedPath,'utf8'));assert.equal(owned.origin,origin);assert.ok(owned.id&&owned.coldVerified);
 const a=await backup('postmeta-upload'),b=await backup('postmeta-cold');
 assert.deepEqual(await a.object('_runtime/playtt-postmeta-layout.json'),{schema:'playtt/postmeta-table/v1'});
 assert.deepEqual(await b.object('_runtime/playtt-postmeta-layout.json'),{schema:'playtt/postmeta-table/v1'});
 const select=rows=>rows.filter(r=>Number(r.post_id)===owned.id).sort((x,y)=>x.meta_id-y.meta_id);
 const before=select(await a.object('_tables/postmeta.json')),after=select(await b.object('_tables/postmeta.json'));
 assert.deepEqual(after,before);assert.ok(before.length>=3);assert.ok(before.every(r=>/^[1-9][0-9]*$/.test(String(r.meta_id))&&BigInt(r.meta_id)>0n));
 assert.equal(before.find(r=>r.meta_key==='_wp_attached_file')?.meta_value,owned.expected.media_details.file);
 assert.equal(before.find(r=>r.meta_key==='_wp_attachment_image_alt')?.meta_value,owned.expected.alt_text);
 assert.ok(before.find(r=>r.meta_key==='_wp_attachment_metadata')?.meta_value.includes(owned.expected.media_details.file));
 const upload=b.manifest.uploads.find(f=>f.path===owned.expected.media_details.file);assert.equal(upload.sha256,owned.fileHash);
 const report={at:new Date().toISOString(),result:'pass',scope:'Two independently decoded/hash-verified remote backups around deployment; all owned attachment rows including meta_id identical',id:owned.id,rows:before.length,rowIds:before.map(r=>r.meta_id),keys:before.map(r=>r.meta_key),beforeRevision:a.report.revision,afterRevision:b.report.revision,fileHash:owned.fileHash};
 await writeFile(prefix+'backup-comparison.json',JSON.stringify(report,null,2));owned.backupCompared=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));console.log(JSON.stringify(report));process.exit(0);
}
assert.ok(process.argv.includes('--remote'));
const config=JSON.parse(await readFile('wrangler.playtt-rebuild-audit.jsonc','utf8'));assert.equal(config.name,'playtt-wp-free-rebuild-audit');assert.equal(config.r2_buckets[0].bucket_name,'playtt-wordpress-rebuild-audit');assert.deepEqual(config.triggers.crons,[]);assert.ok(!config.routes&&!config.services);
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const cookies=new Map(),checks=[];let nonce;
async function req(path,options={}){
 assert.ok(path.startsWith('/')&&!path.startsWith('//'));
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const started=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});
 assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-started});
 for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}return r;
}
async function operator(phase){const r=await req('/?phase='+phase,{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);return r.json();}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
async function login(){
 assert.equal((await req('/wp-login.php')).status,200);
 const r=await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).origin,origin);
 const page=await req('/wp-admin/');assert.equal(page.status,200);const text=await page.text();assert.ok(text.includes('lang="zh-TW"'));nonce=text.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
}
async function api(path,options={}){const headers=new Headers(options.headers);headers.set('x-wp-nonce',nonce);return req('/wp-json/wp/v2/'+path,{...options,headers});}
const pick=item=>({id:item.id,slug:item.slug,status:item.status,source_url:item.source_url,alt_text:item.alt_text,title:item.title.raw,guid:item.guid.raw,media_details:item.media_details,mime_type:item.mime_type});
async function verify(owned){
 const r=await api('media/'+owned.id+'?context=edit');assert.equal(r.status,200);assert.deepEqual(pick(await r.json()),owned.expected);
 const url=new URL(owned.expected.source_url);assert.equal(url.origin,origin);assert.equal(url.pathname,'/wp-content/uploads/'+owned.expected.media_details.file);
 const bytes=await req(url.pathname);assert.equal(bytes.status,200);assert.equal(hash(Buffer.from(await bytes.arrayBuffer())),owned.fileHash);
}
async function report(name,data){const value={at:new Date().toISOString(),origin,...data,checks};await writeFile(prefix+name+'.json',JSON.stringify(value,null,2));console.log(JSON.stringify(value));}
try{
 await paused();const start=await operator('operator-fence-status');assert.equal(start.coherent,true);assert.equal(start.fence.active,false);
 if(mode==='--upload'){
  let exists=false;try{await readFile(ownedPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!exists,'Do not overwrite or recreate an existing fixture');
  const previous=await backup('before-postmeta');assert.ok(previous.report.revision);
  const marker='playtt-postmeta-'+randomUUID();const png=new PNG({width:16,height:16});for(let i=0;i<png.data.length;i+=4){png.data[i]=20;png.data[i+1]=150;png.data[i+2]=80;png.data[i+3]=255;}const bytes=PNG.sync.write(png);
  const owned={at:new Date().toISOString(),origin,marker,filename:marker+'.png',fileHash:hash(bytes),id:null,cleanupComplete:false};await writeFile(ownedPath,JSON.stringify(owned,null,2));
  await login();const uploaded=await api('media',{method:'POST',headers:{'content-type':'image/png','content-disposition':'attachment; filename="'+owned.filename+'"'},body:bytes});assert.equal(uploaded.status,201);const item=await uploaded.json();owned.id=item.id;owned.expected=pick(item);await writeFile(ownedPath,JSON.stringify(owned,null,2));assert.ok(Number.isSafeInteger(item.id)&&item.id>127);assert.equal(item.media_details.width,16);assert.equal(item.media_details.height,16);
  const edited=await api('media/'+owned.id,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({alt_text:'附件保存驗證 '+marker,title:'附件保存驗證 '+marker})});assert.equal(edited.status,200);owned.expected=pick(await edited.json());await writeFile(ownedPath,JSON.stringify(owned,null,2));
  await verify(owned);await paused();owned.uploadVerified=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));await report('upload',{result:'pass',scope:'Native WordPress REST image upload, alt/title edit, fresh media readback and original file SHA-256',id:owned.id,dimensions:[16,16],fileHash:owned.fileHash,publisher:'paused'});
 }else{
  const owned=JSON.parse(await readFile(ownedPath,'utf8'));assert.equal(owned.origin,origin);assert.ok(owned.id&&owned.uploadVerified&&!owned.cleanupComplete);await login();await verify(owned);
  if(mode==='--cold'){
   owned.coldVerified=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));await paused();await report('cold',{result:'pass',scope:'Fresh native WordPress session after independent deployment; attachment fields and image bytes unchanged; deployment evidence retained separately',id:owned.id,fileHash:owned.fileHash,publisher:'paused'});
  }else{
   assert.ok(owned.coldVerified&&owned.backupCompared);assert.equal(owned.expected.slug,owned.marker);assert.equal(owned.expected.title,'附件保存驗證 '+owned.marker);
   const deleted=await api('media/'+owned.id+'?force=true',{method:'DELETE'});assert.equal(deleted.status,200);const data=await deleted.json();assert.equal(data.deleted,true);assert.equal(data.previous.id,owned.id);
   assert.equal((await api('media/'+owned.id+'?context=edit')).status,404);assert.equal((await req('/wp-content/uploads/'+owned.expected.media_details.file)).status,404);
   owned.cleanupComplete=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));await paused();await report('cleanup',{result:'pass',scope:'Deleted only the owned test attachment after exact identity/content checks; native media and image URL now 404',id:owned.id,publisher:'paused'});
  }
 }
}catch(error){await report('failure-'+mode.slice(2),{result:'fail',error:String(error)});process.exitCode=1;}
