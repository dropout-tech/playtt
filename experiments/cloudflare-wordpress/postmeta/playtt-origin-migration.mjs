import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
const previousOrigin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const prefix='artifacts/playtt-origin-migration-';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function rebase(value){
 return value.replaceAll(previousOrigin,(match,offset)=>{
  const next=value[offset+match.length];
  return next===undefined||'/#?\"\'<> \t\r\n'.includes(next)?origin:match;
 });
}
const mode=process.argv.find(v=>['--self-test','--plan','--apply','--verify','--rollback'].includes(v));assert.ok(mode,'Explicit mode required');
if(mode==='--self-test'){
 for(const suffix of ['', '/', '/wp-content/uploads/a.webp','/class/?x=1#top','?x=1','#top'])assert.equal(rebase(previousOrigin+suffix),origin+suffix);
 for(const suffix of ['.evil/path','-other/path','0/path'])assert.equal(rebase(previousOrigin+suffix),previousOrigin+suffix);
 for(const value of ['https://line.me/R/ti/p/@869usyqy','/class/',origin+'/class/'])assert.equal(rebase(value),value);
 const block='<!-- wp:image {"url":"'+previousOrigin+'/image.webp"} --><img src="'+previousOrigin+'/image.webp" alt="品牌">';
 assert.equal(rebase(block),block.replaceAll(previousOrigin,origin));assert.equal(rebase(rebase(block)),rebase(block));
 console.log(JSON.stringify({result:'pass',checks:14,scope:'Exact-origin boundary, path/query/fragment preservation, unchanged external/relative URLs and idempotence; no network'}));process.exit(0);
}
assert.ok(process.argv.includes('--remote'),'Explicit remote scope required');
const config=JSON.parse(await readFile('wrangler.playtt-rebuild-audit.jsonc','utf8'));
assert.equal(config.name,'playtt-wp-free-rebuild-audit');assert.equal(config.r2_buckets[0].bucket_name,'playtt-wordpress-rebuild-audit');assert.deepEqual(config.triggers.crons,[]);assert.ok(!config.routes&&!config.services);assert.ok(config.durable_objects.bindings.every(b=>!b.script_name));
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const cookies=new Map(),checks=[];let nonce;
async function request(path,options={}){
 assert.ok(path.startsWith('/')&&!path.startsWith('//'));
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const started=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});
 assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-started});
 for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}return r;
}
async function operator(phase){const r=await request('/?phase='+phase,{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);return r.json();}
async function paused(){const r=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);const s=await r.json();assert.equal(s.state,'paused');}
async function login(){
 assert.equal((await request('/wp-login.php')).status,200);
 const r=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).origin,origin);
 const page=await request('/wp-admin/');assert.equal(page.status,200);const text=await page.text();assert.ok(text.includes('lang="zh-TW"'));nonce=text.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
}
async function api(path,body){
 const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,'REST '+path);
 if(!body&&path.includes('per_page='))assert.ok(Number(r.headers.get('x-wp-totalpages'))<=1,'Pagination must be handled before expanding this bounded migration');
 return r.json();
}
function record(item,type){
 const fields={};for(const key of ['content','excerpt','caption','description'])if(item[key]&&typeof item[key].raw==='string')fields[key]=item[key].raw;
 const guid=item.guid?.raw??item.guid?.rendered;
 return {type,id:item.id,slug:item.slug,status:item.status,title:item.title?.raw,fields,...(guid===undefined?{}:{guid}),...(item.source_url?{source_url:item.source_url}:{}),...(item.media_details?{media_details:item.media_details}:{})};
}
async function capture(){
 const entities=[];
 for(const type of ['pages','posts','navigation','templates','template-parts','media']){
  const status=['pages','posts','navigation'].includes(type)?'&status=publish,draft,pending,private,future':'';
  const items=await api(type+'?context=edit&per_page=100'+status);assert.ok(Array.isArray(items)&&items.length<100);
  for(const item of items)entities.push(record(item,type));
 }
 const theme=(await api('themes?context=edit')).find(t=>t.stylesheet==='lets-play');assert.equal(theme.version,'0.2.3');
 const stylesId=theme._links['wp:user-global-styles'][0].href.split('/').at(-1);
 const styles=await api('global-styles/'+stylesId+'?context=edit'),settings=await api('settings');
 return {entities:entities.sort((a,b)=>(a.type+'/'+a.id).localeCompare(b.type+'/'+b.id)),styles:{id:styles.id,styles:styles.styles,settings:styles.settings},settings};
}
function route(entity){
 assert.ok(['pages','posts','navigation','templates','template-parts','media'].includes(entity.type));
 if(typeof entity.id==='number'){assert.ok(Number.isSafeInteger(entity.id)&&entity.id>0);return entity.type+'/'+entity.id;}
 assert.ok(['templates','template-parts'].includes(entity.type));assert.match(entity.id,/^lets-play\/\/[a-z0-9_-]+$/);return entity.type+'/'+entity.id;
}
async function report(name,data){const result={at:new Date().toISOString(),origin,previousOrigin,...data};await writeFile(prefix+name+'.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
try{
 await paused();const initial=await operator('operator-fence-status');assert.equal(initial.coherent,true);assert.equal(initial.fence.active,false);
 if(mode==='--plan'){
  let existing=false;try{await readFile(prefix+'plan-private.json');existing=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!existing,'Inspect existing plan instead of overwriting evidence');
  await login();const before=await capture(),after=structuredClone(before),changes=[];
  for(const entity of after.entities){
   const original=before.entities.find(e=>e.type===entity.type&&e.id===entity.id);const patch={};
   for(const [key,value]of Object.entries(entity.fields)){const next=rebase(value);if(next!==value){patch[key]=next;entity.fields[key]=next;}}
   if(Object.keys(patch).length)changes.push({route:route(entity),type:entity.type,id:entity.id,before:original,after:entity,patch});
  }
  assert.ok(changes.length>0&&changes.length<=20);
  assert.ok(!JSON.stringify(before.styles).includes(previousOrigin),'Styles require a separate structured migration');assert.ok(!JSON.stringify(before.settings).includes(previousOrigin),'Settings require a separate reviewed migration');
  for(const media of before.entities.filter(e=>e.type==='media')){assert.ok(!media.source_url?.startsWith(previousOrigin));assert.ok(!JSON.stringify(media.media_details).includes(previousOrigin));}
  const plan={at:new Date().toISOString(),origin,previousOrigin,before,after,changes,completed:[],rolledBack:[]};await writeFile(prefix+'plan-private.json',JSON.stringify(plan));
  await report('plan',{result:'pass',scope:'Read-only bounded plan across current editable REST content; GUIDs and historical revisions preserved; login may save a session',entities:before.entities.length,changes:changes.map(c=>({route:c.route,fields:Object.keys(c.patch),beforeHash:hash(c.before),afterHash:hash(c.after),references:Object.values(c.before.fields).reduce((n,v)=>n+v.split(previousOrigin).length-1,0)})),beforeHash:hash(before),afterHash:hash(after),checks});
 }
 if(mode==='--apply'||mode==='--rollback'){
  const plan=JSON.parse(await readFile(prefix+'plan-private.json','utf8'));assert.equal(plan.origin,origin);assert.equal(plan.previousOrigin,previousOrigin);
  const backup=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-before-origin.json','utf8'));assert.equal(backup.result,'pass');assert.equal(backup.bucket,config.r2_buckets[0].bucket_name);
  if(mode==='--apply'&&!plan.completed.length)assert.equal(initial.state.pointer.revision,backup.revision,'Take backup after plan and before first apply');
  await login();
  const rollback=mode==='--rollback';assert.ok(!rollback||!plan.verifiedAfterNativeEdit,'Do not roll back over later native edits');
  for(const change of rollback?[...plan.changes].reverse():plan.changes){
   await paused();const current=record(await api(change.route+'?context=edit'),change.type),wanted=rollback?change.before:change.after,expected=rollback?change.after:change.before;
   if(hash(current)!==hash(wanted)){assert.equal(hash(current),hash(expected),'Concurrent or unexpected content changed at '+change.route);const body=rollback?Object.fromEntries(Object.keys(change.patch).map(k=>[k,change.before.fields[k]])):change.patch;const saved=record(await api(change.route,body),change.type);assert.equal(hash(saved),hash(wanted),'REST readback differs at '+change.route);}
   const progress=rollback?plan.rolledBack:plan.completed;if(!progress.includes(change.route))progress.push(change.route);await writeFile(prefix+'plan-private.json',JSON.stringify(plan));
  }
  const actual=await capture();assert.equal(hash(actual),hash(rollback?plan.before:plan.after),'Full active editable content and metadata must match expected state');await paused();
  await report(rollback?'rollback':'apply',{result:'pass',scope:rollback?'Restored only planned REST fields after exact conflict checks':'Rebased only planned editable REST fields; original text, GUIDs, media metadata, external URLs and other state preserved by full expected-state equality',changes:plan.changes.length,stateHash:hash(actual),backupRevision:backup.revision,publisher:'paused',checks});
 }
 if(mode==='--verify'){
  const plan=JSON.parse(await readFile(prefix+'plan-private.json','utf8'));assert.equal(plan.origin,origin);assert.equal(plan.completed.length,plan.changes.length);assert.equal(plan.rolledBack.length,0);await login();const actual=await capture();assert.equal(hash(actual),hash(plan.after));await paused();const status=await operator('operator-fence-status');assert.equal(status.coherent,true);assert.equal(status.fence.active,false);
  await report('verification',{result:'pass',scope:'Fresh authenticated active-content readback after origin migration; excludes historical revisions and preserves GUIDs',stateHash:hash(actual),version:status.state.version,revision:status.state.pointer.revision,publisher:'paused',checks});
 }
}catch(error){await report('failure-'+mode.slice(2),{result:'fail',error:String(error),checks});process.exitCode=1;}
