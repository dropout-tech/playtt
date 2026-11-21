// The actual execution queue/publisher code runs here; PHP runtime calls are
// replaced by spies. This is not a WordPress, provider or operator-auth test.
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
await mkdir(join(root,'artifacts'),{recursive:true});
const directory=await mkdtemp(join(root,'artifacts','window-queue-'));
const file=join(directory,'execution.mjs');
await build({entryPoints:[join(root,'src/worker-playtt-do.ts')],outfile:file,bundle:true,platform:'node',format:'esm',target:'es2022',plugins:[{
  name:'php-runtime-spy',setup(b){
    b.onResolve({filter:/^\.\/worker\.js$/},()=>({path:'runtime-spy',namespace:'spy'}));
    b.onLoad({filter:/.*/,namespace:'spy'},()=>({contents:`
      export const createCloudflareRuntime=()=>({fetch:(request,env)=>env.testRuntime(request)});
      export const drainPlayttPublication=(env)=>env.testPublish();
      export const retirePlayttIdleRuntimes=async()=>{};
      export const isAuthorizedOperator=async()=>false;
      export const serveWordPressStaticAsset=async()=>null;
      export const serveWordPressUpload=async()=>null;
      export const serveWordPressWpContent=async()=>null;
    `,loader:'js'}));
  },
}]});
const {PlayttWordPressExecution}=await import(pathToFileURL(file).href);
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function fixture(){
  const values=new Map(),calls=[];let allowed=true,alarm=null,admissions=0;
  let handler=async request=>{calls.push(new URL(request.url).pathname);return new Response('runtime spy');};
  const env={WORDPRESS_STATE_BUCKET:{head(){},get(){},list(){},put(){},delete(){}},PLAYTT_R2_CAPACITY_SCOPE:'playtt-wordpress-pin-restore-audit',PLAYTT_R2_CAPACITY_LIMIT_BYTES:'1000000',PLAYTT_R2_WRITE_TRACKING:'v1',PLAYTT_R2_WRITE_WINDOW:'v1',PLAYTT_AUTO_PUBLISH:'true',WORDPRESS_OPERATOR_TOKEN:'local-test-only',
    WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'local.invalid'}]),
    WORDPRESS_STATE:{getByName:()=>({})},
    PLAYTT_STORAGE_BUDGET:{getByName:()=>({fetch:async()=>{admissions++;return allowed?Response.json({schema:'playtt/r2-window-admission/v1',allowed:true,windowId:'00000000-0000-0000-0000-000000000001',openedAt:Date.now()-1,expiresAt:Date.now()+60000}):new Response('closed',{status:503});}})},
    testRuntime:request=>handler(request),
    testPublish:async()=>{calls.push('publisher-step');return null;},
  };
  const storage={get:async k=>values.get(k),put:async(k,v)=>{values.set(k,v);},getAlarm:async()=>alarm,setAlarm:async t=>{alarm=t;},deleteAlarm:async()=>{alarm=null;}};
  const execution=new PlayttWordPressExecution({storage},env);
  return {env,execution,calls,values,setHandler:fn=>{handler=fn;},close:()=>{allowed=false;},get admissions(){return admissions;},get alarm(){return alarm;}};
}
const request=(path,body)=>new Request('https://local.invalid'+path,body===undefined?{}:{method:'POST',headers:{authorization:'Bearer local-test-only'},body:JSON.stringify(body)});
test('a queued request rechecks admission after the preceding runtime call completes',{timeout:5000},async()=>{
  const f=fixture(),entered=deferred(),done=deferred();
  f.setHandler(async r=>{f.calls.push(new URL(r.url).pathname);entered.resolve();await done.promise;return new Response('first');});
  const first=f.execution.fetch(request('/first'));await entered.promise;
  const second=f.execution.fetch(request('/second'));f.close();done.resolve();
  assert.equal((await first).status,200);assert.equal((await second).status,503);
  assert.deepEqual(f.calls,['/first']);assert.equal(f.admissions,2);
});
test('closed windows block all PHP/probe requests and publication resume or retry',async()=>{
  const f=fixture();f.close();
  for(const path of ['/wp-admin/','/wp-json/wp/v2/posts','/?phase=unknown','/?phase=operator-reset'])assert.equal((await f.execution.fetch(request(path,{}))).status,503);
  for(const action of ['resume','retry'])assert.equal((await f.execution.fetch(request('/__playtt-publishing',{action}))).status,503);
  assert.deepEqual(f.calls,[]);assert.equal(f.alarm,null);assert.equal(f.values.size,0);
});
test('closed windows allow pause/status and pass fence controls to runtime without waking publisher',async()=>{
  const f=fixture();f.close();
  assert.equal((await f.execution.fetch(request('/__playtt-publishing',{action:'pause'}))).status,200);
  const statusRequest=request('/__playtt-publishing');statusRequest.headers.set('authorization','Bearer local-test-only');
  assert.equal((await f.execution.fetch(statusRequest)).status,200);
  for(const action of ['status','acquire','renew','release'])assert.equal((await f.execution.fetch(request('/?phase=operator-fence-'+action,{}))).status,200);
  assert.equal(f.admissions,0);assert.equal(f.alarm,null);assert.equal(f.values.get('playtt-publication-status').state,'paused');
  assert.equal(f.calls.length,4); // The real runtime must authenticate these; it is spied here.
});
test('alarm after closure does not run publisher or schedule another alarm',async()=>{
  const f=fixture();f.close();await f.execution.alarm();assert.deepEqual(f.calls,[]);assert.equal(f.alarm,null);assert.equal(f.values.size,0);
});
