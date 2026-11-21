// One bounded real WordPress HTTP/heartbeat attempt on the isolated target.
// No automatic retry, fixture deletion, publication or original-target write.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev',prefix='artifacts/playtt-window-native-';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const sha=v=>createHash('sha256').update(v).digest('hex');
const secrets=await load('../../../playtt-cms-secrets.json'),previous=await load('artifacts/playtt-window-provider-guard-private.json');
assert.equal(previous.phase,'sealed-after-expiry');
try{await access(prefix+'owned-private.json');throw Error('Existing native attempt must be inspected; do not replay');}catch(e){if(e.code!=='ENOENT')throw e;}
const cookies=new Map(),checks=[];let nonce,stage='preflight',failed=false;
const auth={authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN};
async function request(path,options={}){
  assert.ok(path.startsWith('/')&&!path.startsWith('//'));const at=Date.now(),headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
  const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(45000)});
  checks.push({stage,method:options.method||'GET',status:r.status,wallMs:Date.now()-at});
  for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}return r;
}
async function control(path,body){const r=await request(path,{method:body?'POST':'GET',headers:{...auth,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,stage+': HTTP '+r.status);return r.json();}
const capacity=body=>control('/__playtt-capacity',body),operator=(phase,body)=>control('/?phase=operator-'+phase,body);
const state=async()=>{const s=await operator('fence-status');assert.equal(s.coherent,true);return s;};
const pick=p=>({id:p.id,status:p.status,slug:p.slug,title:p.title.raw,content:p.content.raw});
async function rest(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.ok(r.status===200||r.status===201,stage+': HTTP '+r.status);return r.json();}
const before=await state(),initial=await capacity();assert.equal(before.state.version,1);assert.equal(before.fence.active,false);assert.equal(initial.writeTracking.sealed,true);assert.equal(initial.writeTracking.pending,0);assert.ok(initial.remainingBytes>20*1024*1024);
assert.equal((await control('/__playtt-publishing')).state,'paused');
const owner={origin,marker:'playtt-window-'+randomUUID(),id:null,cleanupComplete:false,windowToken:randomUUID(),previousWindowToken:previous.windowToken,drainToken:previous.drainToken,phase:'preparing'};
await save(prefix+'owned-private.json',owner);
const report={at:new Date().toISOString(),result:'pending',scope:'One sequential real authenticated WordPress HTTP attempt on new private target; no browser or concurrency acceptance',checks,heartbeat:[]};
try{
  const fence=await operator('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);
  const armed=await capacity({action:'arm-write-window',fenceToken:fence.token,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,durationSeconds:120,maxBytes:20*1024*1024,maxOperations:128});
  owner.expiresAt=armed.writeTracking.window.expiresAt;owner.phase='armed';await save(prefix+'owned-private.json',owner);
  await capacity({action:'release-write-drain',fenceToken:fence.token,drainToken:owner.drainToken});owner.sealReleased=true;await save(prefix+'owned-private.json',owner);
  await operator('fence-release',{token:fence.token});owner.fenceReleased=true;await save(prefix+'owned-private.json',owner);
  stage='login-form';let r=await request('/wp-login.php');assert.equal(r.status,200);await r.body?.cancel();
  stage='login';r=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).origin,origin);await r.body?.cancel();
  stage='dashboard';r=await request('/wp-admin/');assert.equal(r.status,200);const html=await r.text();assert.ok(html.includes('lang="zh-TW"'));nonce=html.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  report.traditionalChineseDashboard=true;
  stage='original-home';const home=pick(await rest('pages/24?context=edit'));owner.homeHash=sha(JSON.stringify(home));
  owner.content='<!-- wp:paragraph -->\n<p>全 Cloudflare 免費後台的限時保存驗證：'+owner.marker+'。</p>\n<!-- /wp:paragraph -->\n \t\n';await save(prefix+'owned-private.json',owner);
  stage='create-draft';const created=await rest('pages',{slug:owner.marker,title:owner.marker,status:'draft',content:owner.content});owner.id=created.id;owner.expected=pick(created);assert.equal(owner.expected.content,owner.content);assert.equal(owner.expected.slug,owner.marker);assert.equal(owner.expected.status,'draft');owner.phase='created';await save(prefix+'owned-private.json',owner);
  stage='editor-load';r=await request('/wp-admin/post.php?post='+owner.id+'&action=edit');assert.equal(r.status,200);const editor=await r.text(),settings=editor.match(/var heartbeatSettings\s*=\s*(\{[^;]+\});/);assert.ok(settings);const heartbeatNonce=JSON.parse(settings[1]).nonce;assert.ok(heartbeatNonce);
  for(let i=0;i<2;i++){
    stage='heartbeat-'+i;const s1=await state(),b1=await capacity();
    const body=new URLSearchParams({action:'heartbeat',_nonce:heartbeatNonce,screen_id:'page',has_focus:'true',interval:'10','data[wp-refresh-post-lock][post_id]':String(owner.id)});
    r=await request('/wp-admin/admin-ajax.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});assert.equal(r.status,200);const beat=await r.json();assert.match(beat['wp-refresh-post-lock']?.new_lock||'',/^\d+:\d+$/);assert.ok(!beat.nonces_expired&&!beat.error);
    const s2=await state(),b2=await capacity();report.heartbeat.push({index:i,versionBefore:s1.state.version,versionAfter:s2.state.version,chargedBytes:b2.chargedBytes-b1.chargedBytes,operations:b2.writeTracking.window.operations-b1.writeTracking.window.operations,lockRefreshed:true,pointer:s2.state.pointer});
  }
  stage='edit-draft';owner.edited=owner.content.replace('限時保存驗證','限時編輯與重讀驗證');await save(prefix+'owned-private.json',owner);
  const edited=pick(await rest('pages/'+owner.id,{content:owner.edited}));assert.equal(edited.content,owner.edited);assert.equal(edited.status,'draft');assert.equal(edited.slug,owner.marker);owner.expected=edited;owner.phase='saved';await save(prefix+'owned-private.json',owner);
  stage='readback';assert.deepEqual(pick(await rest('pages/'+owner.id+'?context=edit')),owner.expected);assert.equal(sha(JSON.stringify(pick(await rest('pages/24?context=edit')))),owner.homeHash);
  Object.assign(report,{result:'pass',ownedId:owner.id,createdSavedReadBack:true,exactWhitespaceRetained:true,homepageUnchanged:true,nativeEditorHtmlLoaded:true,cleanupComplete:false});
}catch(e){failed=true;Object.assign(report,{result:'fail',failedStage:stage,errorName:e.name});process.exitCode=1;}
finally{
  stage='close-admission';
  try{
    await capacity({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;await save(prefix+'owned-private.json',owner);
    const current=await capacity();assert.equal(current.writeTracking.pending,0,'Unknown R2 writes are retained; cannot claim sealed');
    const s=await state();let fence;
    if(s.fence.active){assert.equal(owner.fenceReleased,false);fence={token:owner.fenceToken};}else fence=await operator('fence-acquire',{ttlSeconds:600});
    owner.fenceToken=fence.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);
    const sealed=await capacity({action:'acquire-write-drain',fenceToken:fence.token,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);assert.equal(sealed.writeTracking.pending,0);owner.sealReleased=false;owner.phase=failed?'failed-sealed':'passed-sealed';await save(prefix+'owned-private.json',owner);
    await operator('fence-release',{token:fence.token});owner.fenceReleased=true;await save(prefix+'owned-private.json',owner);
    report.finalBudget=sealed;report.finalState=(await state()).state;report.publisher=(await control('/__playtt-publishing')).state;report.windowClosed=true;report.writeSealed=true;report.fenceReleased=true;
  }catch(e){report.containment={result:'incomplete',stage,errorName:e.name,deadline:owner.expiresAt};process.exitCode=1;}
  await save(prefix+'result.json',report);console.log(JSON.stringify(report));
}
