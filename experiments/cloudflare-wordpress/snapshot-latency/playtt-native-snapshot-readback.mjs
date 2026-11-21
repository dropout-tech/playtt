import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>x.startsWith('--mode='))?.slice(7);assert.ok(['capture','verify','cleanup'].includes(mode));
const origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const title='PLAYTT_NATIVE_SNAPSHOT_20261117_1025';
const expected='私人編輯驗證第二版：重新部署後仍須保留這段繁體中文。';
const secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const cookies=new Map(),checks=[];let nonce;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function req(path,options={}){const headers=new Headers(options.headers);headers.set('x-playtt-probe',secret.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));const start=Date.now();const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}checks.push({path,status:r.status,wallMs:Date.now()-start});return r;}
async function api(path,method='GET'){const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);return r.json();}
const state=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN}});assert.equal((await state.json()).state,'paused');
assert.equal((await req('/wp-login.php')).status,200);
assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secret.WORDPRESS_ADMIN_PASSWORD,testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
const admin=await req('/wp-admin/');assert.equal(admin.status,200);const html=await admin.text();assert.ok(html.includes('lang="zh-TW"'));nonce=html.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
const list=await api('pages?context=edit&status=draft&per_page=100&search='+encodeURIComponent(title));const owned=list.filter(p=>p.title.raw===title);assert.equal(owned.length,1);const page=owned[0];assert.equal(page.status,'draft');assert.equal(page.content.raw,'<!-- wp:paragraph -->\n<p>'+expected+'</p>\n<!-- /wp:paragraph -->');
const publishedHash=async()=>hash((await api('pages?context=edit&per_page=100')).map(p=>({id:p.id,content:p.content.raw,status:p.status,title:p.title.raw})).sort((a,b)=>a.id-b.id));
assert.equal(await publishedHash(),'a6f6163dbd1a918e42298c9a57af027059aaa689a43dcfa4214fab2f01ecc3a7');
const evidence={id:page.id,status:page.status,titleHash:hash(page.title.raw),contentHash:hash(page.content.raw),publishedPagesUnchanged:true};
if(mode==='capture')await writeFile('artifacts/playtt-native-snapshot-expected-private.json',JSON.stringify(evidence));
else assert.deepEqual(evidence,JSON.parse(await readFile('artifacts/playtt-native-snapshot-expected-private.json','utf8')));
// Pass the research ingress gate but supply no WordPress cookie or nonce.
// Fully anonymous REST is hidden at the outer gate with 404.
for(const [path,status]of [['/?page_id='+page.id,404],['/wp-json/wp/v2/pages/'+page.id+'?context=edit',401]]){const r=await fetch(origin+path,{headers:{'x-playtt-probe':secret.WORDPRESS_OPERATOR_TOKEN},signal:AbortSignal.timeout(120000)});assert.equal(r.status,status);await r.arrayBuffer();}
evidence.wordpressAnonymousPageStatus=404;evidence.wordpressAnonymousEditStatus=401;
if(mode==='cleanup'){const gone=await api('pages/'+page.id+'?force=true','DELETE');assert.equal(gone.deleted,true);assert.equal(await publishedHash(),'a6f6163dbd1a918e42298c9a57af027059aaa689a43dcfa4214fab2f01ecc3a7');evidence.ownedDraftRemoved=true;}
const final=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN}});assert.equal((await final.json()).state,'paused');
const report={at:new Date().toISOString(),mode,result:'pass',scope:'Exact readback of UI-authored private draft, unchanged published pages and anonymous refusal; audit Worker only',evidence,checks};await writeFile('artifacts/playtt-native-snapshot-'+mode+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
