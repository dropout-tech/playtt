import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, open, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { build, transform } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import * as lock from '../src/playtt-editor-lock.js';
import { wordpressStaticArchivePath, wordpressStaticContentType } from '../src/wordpress-runtime-corpus.js';

const manifest = JSON.parse(await readFile('assets/wordpress-static-artifact.json', 'utf8'));
const entry = manifest.files.find(f => f.path === 'wordpress' + lock.PLAYTT_EDITOR_LOCK_PATH);
const handle = await open('artifacts/cloudflare-wordpress-static-corpus.bin', 'r');
const original = new Uint8Array(entry.size);
try { assert.equal((await handle.read(original, 0, entry.size, entry.offset)).bytesRead, entry.size); } finally { await handle.close(); }
const hash = b => createHash('sha256').update(b).digest('hex');
assert.equal(hash(original), entry.sha256);
const patched = await lock.patchPlayttEditorLock(original);

// Runs the actual minified PostLockedModal from the pinned core. React render /
// effect scheduling and WordPress hook/server APIs are narrowly simulated.
// This is a deterministic hydration regression, not a browser acceptance test.
function modal(bytes) {
  const source = new TextDecoder().decode(bytes);
  const start = source.indexOf('function sEe()'), end = source.indexOf('var aEe=sEe;', start);
  assert.ok(start > 0 && end > start);
  const actions = new Map(), listeners = new Map(), beacons = [], updates = [];
  let saves = 0, deps, cleanup;
  const state = { isCollaborationEnabled: false, isLocked: false, isTakeover: false, user: {name: 'owner'}, postId: 193,
    postLockUtils: {ajaxUrl: '/wp-admin/admin-ajax.php', nonce: 'test-nonce', unlockNonce: 'test-unlock'}, activePostLock: 'first:1', postType: {slug: 'page'} };
  const dispatch = {autosave: () => { saves++; }, updatePostLock: value => {updates.push(value); Object.assign(state, value);} };
  const jsx = (type, props) => ({type, props});
  const sandbox = { I: {}, nEe: 'Notice', iEe: {useInstanceId: () => 1}, gP: {useDispatch: () => dispatch, useSelect: () => state},
    hP: {useEffect: (effect, next) => { if (!deps || next.some((d,i) => !Object.is(d,deps[i]))) {cleanup?.(); deps=[...next]; cleanup=effect();} }, createInterpolateElement: t => t},
    DS: {addAction: (name, id, fn) => {assert.ok(!actions.has(name)); actions.set(name,fn);}, removeAction: name => actions.delete(name)},
    window: {FormData, navigator: {sendBeacon: (url, form) => beacons.push({url, form: Object.fromEntries(form)})}, addEventListener: (n,f) => listeners.set(n,f), removeEventListener: n => listeners.delete(n)},
    Jr: {jsx, jsxs: jsx, Fragment: 'Fragment'}, mu: {}, li: {__: t => t, sprintf: (t, name) => t.replace('%s',name)}, oq: {addQueryArgs: p => p} };
  const render = vm.runInNewContext('('+source.slice(start,end)+')', sandbox);
  const heartbeat = error => {const data={};actions.get('heartbeat.send')(data); if (data['wp-refresh-post-lock']) actions.get('heartbeat.tick')({'wp-refresh-post-lock':error?{lock_error:{name:'owner'}}:{new_lock:'renewed:1'}}); render();return data;};
  return {state,render,heartbeat,actions,listeners,beacons,updates,unmount:()=>cleanup?.(),get saves(){return saves;}};
}

test('exact pinned patch changes only the upstream effect dependency array and refuses drift', async () => {
  assert.equal(hash(patched), lock.PLAYTT_EDITOR_LOCK_PATCH_SHA);
  assert.equal(patched.length, original.length + 13);
  assert.equal(new TextDecoder().decode(patched).replace('[t,i,d,c,u,r,o]),!i||n)return null;', '[]),!i||n)return null;'), new TextDecoder().decode(original));
  const bad=original.slice(); bad[1]^=1;
  await assert.rejects(lock.patchPlayttEditorLock(bad), /Unsupported/);
  await assert.rejects(lock.patchPlayttEditorLock(patched), /Unsupported/);
  await assert.rejects(lock.patchPlayttEditorLock(original.subarray(1)), /Unsupported/);
});

test('original bundle reproduces repeated autosave after hydration; backport keeps takeover available', () => {
  const old=modal(original);old.render();old.state.isLocked=true;old.render();
  for(let i=0;i<3;i++)old.heartbeat(true);
  assert.equal(old.saves,3);assert.equal(old.state.isTakeover,true);old.unmount();
  const fixed=modal(patched);fixed.render();fixed.state.isLocked=true;fixed.render();
  for(let i=0;i<3;i++)assert.equal(fixed.heartbeat(true)['wp-refresh-post-lock'],undefined);
  assert.equal(fixed.saves,0);assert.equal(fixed.state.isTakeover,false);
  fixed.listeners.get('beforeunload')();assert.equal(fixed.beacons.length,0);
  fixed.unmount();assert.equal(fixed.actions.size,0);assert.equal(fixed.listeners.size,0);
});

test('real owner refreshes newest lock; losing ownership autosaves once then stops refreshing', () => {
  const f=modal(patched);f.render();
  assert.equal(f.heartbeat(false)['wp-refresh-post-lock'].lock,'first:1');
  assert.equal(f.heartbeat(false)['wp-refresh-post-lock'].lock,'renewed:1');
  f.heartbeat(true);assert.equal(f.saves,1);assert.equal(f.state.isLocked,true);assert.equal(f.state.isTakeover,true);
  for(let i=0;i<3;i++)assert.equal(f.heartbeat(true)['wp-refresh-post-lock'],undefined);
  assert.equal(f.saves,1);f.unmount();
});

test('unload releases only current owned lock with current post/nonce and cleans old listeners', () => {
  const f=modal(patched);f.render();f.state.postId=201;f.state.activePostLock='last:2';
  f.state.postLockUtils={ajaxUrl:'/new-ajax',unlockNonce:'new-unlock'};f.render();
  assert.equal(f.actions.size,2);assert.equal(f.listeners.size,1);
  f.listeners.get('beforeunload')();
  assert.deepEqual(f.beacons,[{url:'/new-ajax',form:{action:'wp-remove-post-lock',_wpnonce:'new-unlock',post_ID:'201',active_post_lock:'last:2'}}]);
  f.unmount();assert.equal(f.actions.size,0);assert.equal(f.listeners.size,0);
});

test('versioned URL preserves queries and only targets exact same-origin editor script', () => {
  const base='https://private.invalid/wp-admin/post.php?post=193';
  const result=new URL(lock.playttEditorVersionedUrl('/wp-includes/js/dist/editor.min.js?ver=core#fragment',base));
  assert.equal(result.searchParams.get('ver'),'core');assert.equal(result.hash,'#fragment');
  assert.equal(result.searchParams.get(lock.PLAYTT_EDITOR_LOCK_QUERY),lock.PLAYTT_EDITOR_LOCK_PATCH_SHA);
  for(const value of ['https://third.invalid'+lock.PLAYTT_EDITOR_LOCK_PATH,'/wp-content/editor.min.js','/wp-includes/js/dist/editor.js','javascript:alert(1)','https://a:b@private.invalid'+lock.PLAYTT_EDITOR_LOCK_PATH])assert.equal(lock.playttEditorVersionedUrl(value,base),null);
});

test('actual static handler isolates old/new cache variants and serves correct GET/HEAD integrity metadata', async () => {
  const source=await readFile('src/worker.ts','utf8');
  const start=source.indexOf('export async function serveWordPressStaticAsset('),end=source.indexOf('\nfunction createPhpRuntime()',start);
  const {code}=await transform(source.slice(start,end).replace('export async','async'),{loader:'ts',target:'es2022'});
  const cache=new Map();let reads=0,corrupt=false;
  const sandbox={...lock,patchPlayttEditorLock:lock.patchPlayttEditorLock,Request,Response,URL,Uint8Array,sha256Hex:async b=>hash(b),wordpressStaticArchivePath,wordpressStaticContentType,wordpressStaticArtifact:manifest,wordpressStaticFiles:new Map(manifest.files.map(f=>[f.path,f])),caches:{default:{match:async r=>cache.get(r.url)?.clone(),put:async(r,v)=>cache.set(r.url,v)}}};
  const serve=vm.runInNewContext(code+';serveWordPressStaticAsset',sandbox);
  const bucket={get:async(key,options)=>{reads++;assert.equal(key,manifest.key);assert.equal(options.range.offset,entry.offset);assert.equal(options.range.length,entry.size);const b=original.slice();if(corrupt)b[0]^=1;return{arrayBuffer:async()=>b.buffer};}};
  const url='https://private.invalid'+lock.PLAYTT_EDITOR_LOCK_PATH+'?ver=unchanged';
  let response=await serve(new Request(url),bucket);assert.equal(hash(new Uint8Array(await response.arrayBuffer())),entry.sha256);
  response=await serve(new Request(url),bucket,true);assert.equal(hash(new Uint8Array(await response.arrayBuffer())),lock.PLAYTT_EDITOR_LOCK_PATCH_SHA);
  assert.equal(response.headers.get('etag'),'"'+lock.PLAYTT_EDITOR_LOCK_PATCH_SHA+'"');assert.equal(response.headers.get('content-length'),String(patched.length));
  assert.equal(cache.size,2);assert.equal(reads,2);
  response=await serve(new Request(url),bucket,true);assert.equal(hash(new Uint8Array(await response.arrayBuffer())),lock.PLAYTT_EDITOR_LOCK_PATCH_SHA);assert.equal(reads,2);
  response=await serve(new Request(url,{method:'HEAD'}),bucket,true);assert.equal((await response.arrayBuffer()).byteLength,0);assert.equal(response.headers.get('content-length'),String(patched.length));
  cache.clear();corrupt=true;response=await serve(new Request(url),bucket,true);assert.equal(response.status,502);assert.equal(cache.size,0);
  assert.equal(await serve(new Request(url,{method:'POST'}),bucket,true),null);
});

test('real workerd HTMLRewriter versions script/preload, keeps CSP and excludes other pages/responses', {timeout:30000}, async () => {
  const html='<html><head><link rel="preload" as="script" href="/wp-includes/js/dist/editor.min.js?ver=core&amp;test=1"><script id="wp-editor-js" src="/wp-includes/js/dist/editor.min.js?ver=core" integrity="sha256-old" nonce="synthetic"></script><script src="https://third.invalid/wp-includes/js/dist/editor.min.js"></script><script src="/wp-content/theme.js"></script></head><body>private fixture</body></html>';
  const fixture=`import {versionPlayttEditorAssets} from './src/playtt-editor-lock.ts';export default {fetch(request){const u=new URL(request.url);const response=new Response(${JSON.stringify(html)},{status:u.searchParams.has('error')?403:200,headers:{'content-type':u.searchParams.has('json')?'application/json':'text/html; charset=UTF-8','etag':'old-etag','content-length':String(${html.length}),'content-security-policy':"script-src 'nonce-synthetic'",'cache-control':'private, no-store'}});return versionPlayttEditorAssets(request,response,!u.searchParams.has('disabled'));}};`;
  const built=await build({stdin:{contents:fixture,resolveDir:process.cwd(),sourcefile:'lock-fixture.ts',loader:'ts'},bundle:true,write:false,format:'esm',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-07-18'}));
  try {
    const response=await mf.dispatchFetch('http://private.invalid/wp-admin/post.php?post=193');const text=await response.text();
    const version=lock.PLAYTT_EDITOR_LOCK_QUERY+'='+lock.PLAYTT_EDITOR_LOCK_PATCH_SHA;
    assert.equal(text.split(version).length-1,2);assert.match(text,/ver=core/);assert.match(text,/test=1/);
    assert.ok(text.includes('integrity="sha256-'+Buffer.from(lock.PLAYTT_EDITOR_LOCK_PATCH_SHA,'hex').toString('base64')+'"'));
    assert.match(text,/nonce="synthetic"/);assert.match(text,/src="https:\/\/third.invalid\/wp-includes\/js\/dist\/editor.min.js"/);
    assert.equal(response.headers.get('content-security-policy'),"script-src 'nonce-synthetic'");assert.equal(response.headers.get('etag'),null);
    assert.equal(response.headers.get('cache-control'),'private, no-store');
    for(const path of ['/wp-admin/edit.php','/wp-admin/post.php?disabled','/wp-admin/post.php?error','/wp-admin/post.php?json']){
      const r=await mf.dispatchFetch('http://private.invalid'+path);assert.equal(await r.text(),html);assert.equal(r.headers.get('x-playtt-core-editor-lock'),null);
    }
  } finally {await mf.dispose();}
});

test('backport flag is enabled only in existing isolated session configuration', async () => {
  const configs=(await readdir('.')).filter(n=>/^wrangler.*\.jsonc$/.test(n));
  const enabled=[];for(const name of configs){const text=await readFile(name,'utf8');if(text.includes('PLAYTT_CORE_EDITOR_LOCK'))enabled.push(name);}
  assert.deepEqual(enabled,['wrangler.playtt-session-audit.jsonc']);
  const config=JSON.parse(await readFile(enabled[0],'utf8'));assert.equal(config.vars.PLAYTT_CORE_EDITOR_LOCK,lock.PLAYTT_EDITOR_LOCK_FLAG);
  assert.equal(config.vars.PLAYTT_PROBE_GATE,'true');assert.equal(config.vars.PLAYTT_R2_CAPACITY_LIMIT_BYTES,'150000000');assert.equal(config.routes,undefined);
});
