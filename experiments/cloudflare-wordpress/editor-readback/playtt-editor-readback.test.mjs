import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile, open} from 'node:fs/promises';
import {createHash, webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {transform} from 'esbuild';
import {PLAYTT_EDITOR_READBACK_SCRIPT,isPlayttDraftReadbackRequest} from '../src/playtt-editor-readback.ts';

// Actual pinned api-fetch and URL packages; the server transport and i18n are
// controlled here. Native editor/PHP/browser acceptance is a separate exercise.
const manifest = JSON.parse(await readFile('assets/wordpress-static-artifact.json', 'utf8'));
async function source(name) {
  const item = manifest.files.find(f => f.path === 'wordpress/wp-includes/js/dist/' + name + '.js');
  const file = await open('artifacts/cloudflare-wordpress-static-corpus.bin', 'r');
  const bytes = Buffer.alloc(item.size);
  try { assert.equal((await file.read(bytes, 0, item.size, item.offset)).bytesRead, item.size); } finally { await file.close(); }
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
  return bytes.toString('utf8');
}
const apiSource = await source('api-fetch'), urlSource = await source('url');
const origin = 'https://private.invalid', path = '/wp/v2/pages/193';
const desired = {id:193, content:'<!-- wp:paragraph -->\n<p>繁體中文；尾端空白　</p>\n<!-- /wp:paragraph -->\n', title:'Draft', excerpt:''};
const saved = (data=desired) => ({id:193, type:'page', status:'draft', content:{raw:data.content}, title:{raw:data.title}, excerpt:{raw:data.excerpt}});
const canonicalHeaders = {'x-playtt-draft-readback':'canonical-v1','x-wp-codebox-canonical-version':'120','x-wp-codebox-canonical-revision':'11111111-2222-4333-8444-555555555555'};
const read = (data=saved(), headers=canonicalHeaders) => Response.json(data,{headers});
function setup(transport, {installEarly=false, deadline=10000}={}) {
  const calls=[];
  const sandbox={Response, Headers, URL, URLSearchParams, AbortController, crypto:webcrypto, navigator:{onLine:true},
    setTimeout:(fn,ms)=>setTimeout(fn,ms===10000?deadline:ms), clearTimeout,
    fetch:async (url,options)=>{calls.push({url,options});return transport(url,options,calls.length);},
    window:{location:{origin,href:origin+'/wp-admin/post.php?post=193'}, wp:{i18n:{__:s=>s},privateApis:{__dangerousOptInToUnstableAPIsOnlyForCoreModules:()=>({lock:()=>{},unlock:()=>{}})}}}};
  const context=vm.createContext(sandbox);vm.runInContext(urlSource,context);vm.runInContext(apiSource,context);
  const api=sandbox.window.wp.apiFetch;
  const install=()=>vm.runInContext('('+PLAYTT_EDITOR_READBACK_SCRIPT+')('+JSON.stringify({id:193,origin})+')',context);
  if(installEarly)install();
  api.use(api.createRootURLMiddleware(origin+'/wp-json/'));
  api.use(api.createNonceMiddleware('synthetic-nonce'));
  if(!installEarly)install();
  api.use(api.createPreloadingMiddleware({[path+'?context=edit']:{body:saved(),headers:{}}}));
  return {api,calls};
}
const request = overrides => ({path,method:'PUT',data:{...desired},...overrides});

for (const installEarly of [false,true]) test('200 with lost JSON: authenticated fresh read, exact raw bytes, no write replay; early='+installEarly, async()=>{
  const s=setup((url,options,n)=>n===1?new Response('',{status:200}):read(),{installEarly});
  assert.deepEqual(await s.api(request()),saved());
  assert.equal(s.calls.length,2);const [write,get]=s.calls;
  assert.equal(write.options.method,'POST');assert.equal(write.options.headers['X-HTTP-Method-Override'],'PUT');
  assert.equal(get.options.method,'GET');assert.equal(get.options.body,undefined);
  assert.equal(new Headers(get.options.headers).get('x-http-method-override'),null);
  assert.equal(new Headers(get.options.headers).get('x-wp-nonce'),'synthetic-nonce');
  const url=new URL(get.url);assert.equal(url.origin,origin);assert.equal(url.searchParams.get('context'),'edit');
  assert.ok(url.searchParams.has('_playtt_readback'));assert.equal(get.options.cache,'no-store');
});
test('normal native success and definite HTTP errors preserve behavior without a read',async()=>{
  for(const [response,error]of [[read(),null],[Response.json({code:'rest_forbidden',message:'Denied'},{status:403}),'rest_forbidden'],[new Response('capacity',{status:507}),'invalid_json']]){
    const s=setup(()=>response);if(error)await assert.rejects(s.api(request()),e=>e.code===error);else assert.deepEqual(await s.api(request()),saved());assert.equal(s.calls.length,1);
  }
});
test('transport ambiguity may reconcile but aborts remain failures',async()=>{
  const s=setup((url,opt,n)=>{if(n===1)throw new TypeError('connection lost');return read();});
  assert.deepEqual(await s.api(request()),saved());assert.equal(s.calls.length,2);
  const aborted=setup(()=>{throw new DOMException('aborted','AbortError');});
  await assert.rejects(aborted.api(request()),e=>e.name==='AbortError');assert.equal(aborted.calls.length,1);
});
test('every requested raw field, exact status/type/id and canonical headers are required',async()=>{
  const variants=[{...saved(),id:194},{...saved(),type:'post'},{...saved(),status:'publish'},
    {...saved(),content:{raw:desired.content.trimEnd()}},{...saved(),content:{raw:desired.content.replace('繁體','简体')}},
    {...saved(),title:{raw:'other editor title'}},{...saved(),excerpt:{raw:'other editor excerpt'}},
    {...saved(),content:{rendered:desired.content}}];
  for(const record of variants){const s=setup((u,o,n)=>n===1?new Response('broken'):read(record));await assert.rejects(s.api(request()),e=>e.code==='invalid_json');assert.equal(s.calls.length,2);}
  for(const headers of [{},{...canonicalHeaders,'x-wp-codebox-canonical-version':'0'},{...canonicalHeaders,'x-wp-codebox-canonical-revision':'unknown'}]){
    const s=setup((u,o,n)=>n===1?new Response('broken'):read(saved(),headers));await assert.rejects(s.api(request()),e=>e.code==='invalid_json');assert.equal(s.calls.length,2);
  }
});
test('unsupported mutations, endpoint overrides, raw responses and foreign origins never reconcile',async()=>{
  const cases=[{path:'/wp/v2/pages'},{path:path+'/autosaves'},{path:'/wp/v2/pages/194'},
    {path:path+'?context=edit'},{url:'https://other.invalid/wp-json'+path},
    {data:{...desired,status:'publish'}},{data:{...desired,meta:{footnotes:''}}},{data:{...desired,date:null}},
    {data:{title:'only title'}},{data:{...desired,id:194}},{method:'DELETE'},{method:'PATCH'},
    {namespace:'wp/v2',endpoint:'pages/194'},{headers:{'X-HTTP-Method-Override':'DELETE'}},{body:'{}'}];
  for(const opts of cases){const s=setup(()=>new Response('broken'));await assert.rejects(s.api(request(opts)),e=>e.code==='invalid_json');assert.equal(s.calls.length,1,JSON.stringify(opts));}
  const raw=setup(()=>new Response('broken'));assert.ok(await raw.api(request({parse:false})) instanceof Response);assert.equal(raw.calls.length,1);
});
test('read failures, nonce expiry, mismatch and bounded timeout preserve the original error',async()=>{
  for(const behavior of [()=>Response.json({code:'rest_cookie_invalid_nonce'},{status:403}),()=>new Response('bad JSON'),()=>{throw new TypeError('read lost');},()=>new Promise(()=>{})]){
    const s=setup((u,o,n)=>n===1?new Response('broken'):behavior(),{deadline:25});
    await assert.rejects(s.api(request()),e=>e.code==='invalid_json');assert.equal(s.calls.length,2);assert.equal(s.calls[1].options.signal.aborted,true);
  }
});
test('payload is captured before network settles and an abort during read cannot report success',async()=>{
  let release;const s=setup((u,o,n)=>n===1?new Promise(r=>{release=r;}):read());const data={...desired};
  const promise=s.api(request({data}));data.content='new in-memory edit';release(new Response('broken'));
  assert.deepEqual(await promise,saved());assert.equal(s.calls.length,2);
  const controller=new AbortController();const a=setup((u,o,n)=>{if(n===1)return new Response('broken');controller.abort();return read();});
  await assert.rejects(a.api(request({signal:controller.signal})),e=>e.code==='invalid_json');assert.equal(a.calls.length,2);
});
test('dedicated cold read requires the exact authenticated GET shape',()=>{
  const good=origin+'/wp-json'+path+'?context=edit&_playtt_readback=11111111-2222-4333-8444-555555555555';
  const headers={'x-wp-nonce':'synthetic','cookie':'synthetic=test'};
  assert.equal(isPlayttDraftReadbackRequest(new Request(good,{headers})),true);
  assert.equal(isPlayttDraftReadbackRequest(new Request(good+'&_locale=user',{headers})),true);
  for(const url of [good+'&context=view',good+'&unknown=1',good.replace('context=edit','context=view'),good.replace('pages/193','pages/193/autosaves'),good.replace('11111111-2222-4333-8444-555555555555','short')])assert.equal(isPlayttDraftReadbackRequest(new Request(url,{headers})),false);
  for(const options of [{},{headers:{'cookie':'synthetic=test'}},{headers:{'x-wp-nonce':'synthetic'}},{headers,method:'POST'}])assert.equal(isPlayttDraftReadbackRequest(new Request(good,options)),false);
});
test('actual request coordinator retains unsettled native inventory and releases its lease',async()=>{
  const source=await readFile('src/worker.ts','utf8');
  const start=source.indexOf('async function runCoordinatedWordPressRequest('),end=source.indexOf('\nfunction isCacheableWordPressPageRequest',start);
  const {code}=await transform(source.slice(start,end),{loader:'ts',target:'es2022'});
  const pointer={revision:'11111111-2222-4333-8444-555555555555',manifestKey:'saved',persistedAt:'2026-11-21'};
  for(const readbackClean of [false,undefined]){
    const native={unpersistedAutoDraft:'owned unsaved native inventory'},cached={basePointer:pointer,promise:Promise.resolve(native),state:'ready',readbackClean};
    const cachedRuntimes=new Map([['default',cached]]);let releases=0,disposed=0,phpCalls=0;
    class Trace {async measure(n,f){return f();}complete(){return{};}}
    const sandbox={Response,CloudflarePhaseTrace:Trace,isMutation:()=>false,PLAYTT_EDITOR_READBACK_FLAG:'draft-readback-v1',isPlayttDraftReadbackRequest:()=>true,
      isCacheableWordPressPageRequest:()=>false,toPHPRequest:async()=>({}),acquireLease:async()=>({pointer,version:120}),
      matchWordPressPageCache:async()=>null,releaseLease:async()=>{releases++;},samePointer:(a,b)=>a.revision===b.revision,cachedRuntimes,
      discardCachedRuntime:async()=>{disposed++;},getRuntime:async()=>{phpCalls++;throw Error('Should not boot');},logPhaseTrace:()=>{}};
    const run=vm.runInNewContext(code+';runCoordinatedWordPressRequest',sandbox);
    const response=await run(new Request(origin+'/wp-json'+path+'?context=edit'),{PLAYTT_EDITOR_READBACK:'draft-readback-v1'}, {},{id:'default'},'wordpress');
    assert.equal(response.status,409);assert.equal((await response.json()).code,'playtt_readback_unsettled');
    assert.equal(releases,1);assert.equal(disposed,0);assert.equal(phpCalls,0);assert.equal(cachedRuntimes.get('default'),cached);assert.equal(await cached.promise,native);
  }
});
test('actual warm-runtime lookup invalidates its clean marker for every PHP consumer',async()=>{
  const source=await readFile('src/worker.ts','utf8');const start=source.indexOf('async function getRuntime('),end=source.indexOf('\nfunction cacheRuntime',start);
  const {code}=await transform(source.slice(start,end),{loader:'ts',target:'es2022'});
  const pointer={revision:'saved'},runtime={native:true},cached={basePointer:pointer,promise:Promise.resolve(runtime),state:'ready',readbackClean:true};
  const map=new Map([['default',cached]]),get=vm.runInNewContext(code+';getRuntime',{cachedRuntimes:map,samePointer:()=>true});
  assert.equal(await get({},pointer,{id:'default'}),runtime);assert.equal(cached.readbackClean,false);
});
