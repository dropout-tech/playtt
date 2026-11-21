import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>x.startsWith('--mode='))?.slice(7);assert.ok(['capture','reads','verify','cleanup'].includes(mode));
const round=process.argv.find(x=>x.startsWith('--round='))?.slice(8)||'1';assert.ok(['1','2','3'].includes(round));
const origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const title='PLAYTT_NATIVE_CONTINUITY_20261117_1045';
const paragraphs=['連續編輯第一版：保留原站品牌視覺與 LINE 預約。','連續編輯第二版：測試自動儲存跨過執行器重建。','連續編輯第三版：重載後仍能繼續修改並儲存。'];
const allowed=paragraphs.map(x=>'<!-- wp:paragraph -->\n<p>'+x+'</p>\n<!-- /wp:paragraph -->');
const secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const cookies=new Map(),checks=[];let nonce,error,owned,evidence={};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function req(path,options={}){const headers=new Headers(options.headers);headers.set('x-playtt-probe',secret.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));const start=Date.now();const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}checks.push({path,status:r.status,wallMs:Date.now()-start});return r;}
async function api(path,method='GET'){const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);return r.json();}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
async function publishedHash(){return hash((await api('pages?context=edit&per_page=100')).map(p=>({id:p.id,content:p.content.raw,status:p.status,title:p.title.raw})).sort((a,b)=>a.id-b.id));}
const originalHash='a6f6163dbd1a918e42298c9a57af027059aaa689a43dcfa4214fab2f01ecc3a7';
try{
 await paused();assert.equal((await req('/wp-login.php')).status,200);assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secret.WORDPRESS_ADMIN_PASSWORD,testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
 const admin=await req('/wp-admin/');assert.equal(admin.status,200);const html=await admin.text();assert.ok(html.includes('lang="zh-TW"'));nonce=html.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 const list=await api('pages?context=edit&status=draft&per_page=100&search='+encodeURIComponent(title));const matches=list.filter(p=>p.title.raw===title);assert.equal(matches.length,1);owned=matches[0];assert.equal(owned.status,'draft');assert.ok(allowed.includes(owned.content.raw));assert.equal(await publishedHash(),originalHash);
 if(mode==='capture')await writeFile('artifacts/playtt-native-continuity-owned-private.json',JSON.stringify({id:owned.id,title,allowed}));
 else{const saved=JSON.parse(await readFile('artifacts/playtt-native-continuity-owned-private.json','utf8'));assert.equal(owned.id,saved.id);assert.equal(owned.title.raw,saved.title);assert.deepEqual(allowed,saved.allowed);}
 evidence={id:owned.id,initialVersion:allowed.indexOf(owned.content.raw)+1,readCount:0,observedSavedVersions:[],observedAutosaveVersions:[]};
 if(mode==='reads'){
  const endpoints=['pages?context=edit&per_page=20','template-parts?context=edit','navigation?context=edit','users/me?context=edit'];
  for(let i=0;i<120;i++){
   await api(endpoints[i%endpoints.length]);evidence.readCount++;
   if(i%20===19){const p=await api('pages/'+owned.id+'?context=edit');assert.equal(p.title.raw,title);assert.equal(p.status,'draft');assert.ok(allowed.includes(p.content.raw));evidence.observedSavedVersions.push(allowed.indexOf(p.content.raw)+1);const autosaves=await api('pages/'+owned.id+'/autosaves?context=edit');evidence.observedAutosaveVersions.push(...autosaves.map(a=>allowed.indexOf(a.content.raw)+1));console.log(JSON.stringify({reads:evidence.readCount,savedVersion:evidence.observedSavedVersions.at(-1),autosaveVersions:evidence.observedAutosaveVersions}));}
  }
 }
 const final=await api('pages/'+owned.id+'?context=edit');assert.equal(final.title.raw,title);assert.equal(final.status,'draft');assert.ok(allowed.includes(final.content.raw));evidence.finalVersion=allowed.indexOf(final.content.raw)+1;evidence.contentHash=hash(final.content.raw);
 if(mode==='verify')assert.equal(evidence.finalVersion,Number(round));
 if(mode==='cleanup'){const gone=await api('pages/'+owned.id+'?force=true','DELETE');assert.equal(gone.deleted,true);evidence.ownedDraftRemoved=true;}
 assert.equal(await publishedHash(),originalHash);evidence.originalPagesUnchanged=true;await paused();
}catch(e){error=String(e);}
const report={at:new Date().toISOString(),mode,round,result:error?'fail':'pass',scope:'Private audit native UI-owned draft with 120 bounded REST reads while editor remains open; tail and UI separately prove saves and runtime retirements',evidence,checks,...(error?{error}:{})};await writeFile('artifacts/playtt-native-continuity-'+mode+'-'+round+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,round,result:report.result,evidence,error}));if(error)process.exitCode=1;
