import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source=await readFile(new URL('../lets-play/assets/legacy-links.js',import.meta.url),'utf8');
function page(href,base='/'){
  let current=new URL(href);const listeners={};
  const location={get hash(){return current.hash},get search(){return current.search},get pathname(){return current.pathname},get origin(){return current.origin},replace(href){current=new URL(href)}};
  const window={location,letsPlayBase:base,history:{replaceState(_state,_title,href){current=new URL(href)}},addEventListener(name,listener){listeners[name]=listener}};
  runInNewContext(source,{window,URL});
  return {url:()=>current.href,hash(hash){current.hash=hash;listeners.hashchange?.()}};
}
test('historic class landing preserves a query containing a question mark',()=>{
  assert.equal(page('https://playtt.tw/#/class?ref=why?now').url(),'https://playtt.tw/class/?ref=why?now');
});
test('changing the hash on an already open home page navigates',()=>{
  const p=page('https://preview.example/');p.hash('/class?utm_source=existing-page');
  assert.equal(p.url(),'https://preview.example/class/?utm_source=existing-page');
});
test('partner route and WordPress subdirectory retain their path',()=>{
  assert.equal(page('https://playtt.tw/site/#/partner/','/site/').url(),'https://playtt.tw/site/partner/');
});
test('historic home removes its fragment without losing search',()=>{
  assert.equal(page('https://playtt.tw/?ref=line#/').url(),'https://playtt.tw/?ref=line');
});
test('ordinary anchors and unknown routes remain intact',()=>{
  for(const hash of ['faq','/unknown','//untrusted.example']){
    const p=page('https://playtt.tw/');p.hash(hash);assert.equal(p.url(),'https://playtt.tw/#'+hash);
  }
});
