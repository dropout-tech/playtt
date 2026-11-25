import assert from 'node:assert/strict';
import test from 'node:test';
import {RequestBodyReadError,toPHPRequest} from '../src/request-translation.js';
test('translation preserves multipart and JSON bytes without decoding or normalizing',async()=>{
 for(const type of ['multipart/form-data; boundary=ABC','application/json']){
  const bytes=new Uint8Array([0,13,10,128,255,39,34,38]);
  const r=new Request('https://test.invalid/wp-json/wp/v2/media?context=edit',{method:'POST',headers:{'content-type':type,'x-wp-nonce':'test-nonce'},body:bytes});
  const p=await toPHPRequest(r);assert.equal(p.method,'POST');assert.equal(p.url,'/wp-json/wp/v2/media?context=edit');assert.equal(p.headers?.['content-type'],type);assert.equal(p.headers?.['x-wp-nonce'],'test-nonce');assert.deepEqual(p.body,bytes);
 }
});
test('truncated stream reports a content-free typed failure and never returns partial bytes',async()=>{
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('private-prefix'));c.error(new Error('private-failure'));}});
 const r=new Request('https://test.invalid/wp-admin/admin-ajax.php',{method:'POST',body,duplex:'half'} as RequestInit);
 await assert.rejects(toPHPRequest(r),e=>e instanceof RequestBodyReadError&&e.message==='Request body could not be read.'&&!String(e).includes('private'));
});
test('GET/HEAD omit body and empty POST retains zero-length byte payload',async()=>{
 for(const method of ['GET','HEAD'])assert.ok(!('body' in await toPHPRequest(new Request('https://test.invalid/',{method}))));
 assert.deepEqual((await toPHPRequest(new Request('https://test.invalid/',{method:'POST'}))).body,new Uint8Array());
});
