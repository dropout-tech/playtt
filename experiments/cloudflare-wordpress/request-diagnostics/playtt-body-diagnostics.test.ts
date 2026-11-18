import assert from 'node:assert/strict';
import test from 'node:test';
import {RequestBodyReadError,toPHPRequest} from '../src/request-translation.js';
import {CloudflarePhaseTrace,enablePlayttPhaseDiagnostics,logPlayttRequestFailure} from '../src/phase-trace.js';

const request=(body:ReadableStream<Uint8Array>,signal?:AbortSignal)=>new Request('https://private.invalid/wp-admin/admin-ajax.php?private-query',{method:'POST',body,signal,duplex:'half'} as RequestInit);
const failed=async(r:Request)=>{try{await toPHPRequest(r);assert.fail('Expected request read to fail');}catch(e){assert.ok(e instanceof RequestBodyReadError);return e;}};

test('a network stream interrupted while reading differs from an already-used body',async()=>{
 let controller!:ReadableStreamDefaultController<Uint8Array>;
 const r=request(new ReadableStream({start(c){controller=c;}}));
 const pending=failed(r);controller.enqueue(new TextEncoder().encode('private-prefix'));controller.error(new Error('Network connection lost: private-detail'));
 const e=await pending;
 assert.deepEqual(e.evidence,{usedBefore:false,lockedBefore:false,abortedBefore:false,abortedAfter:false,reason:'disconnected'});
 assert.equal(r.bodyUsed,true);assert.equal(e.cause,undefined);assert.equal(String(e),'RequestBodyReadError: Request body could not be read.');
 assert.ok(!JSON.stringify(e).includes('private'));assert.equal(Object.isFrozen(e.evidence),true);
});

test('a second read is diagnosed as used before the failed read starts',async()=>{
 const r=new Request('https://private.invalid/',{method:'POST',body:'private-content'});await r.text();
 const e=await failed(r);assert.equal(e.evidence?.reason,'already-used');assert.equal(e.evidence?.usedBefore,true);
});

test('an unread locked stream is distinct from a consumed stream',async()=>{
 const r=request(new ReadableStream({start(c){c.enqueue(new Uint8Array([1]));c.close();}}));
 const reader=r.body!.getReader();try{const e=await failed(r);assert.equal(e.evidence?.reason,'locked');assert.equal(e.evidence?.usedBefore,false);assert.equal(e.evidence?.lockedBefore,true);}finally{reader.releaseLock();}
});

test('abort before and during read are separately recorded without its reason',async()=>{
 for(const early of [false,true]){
  const abort=new AbortController();let stream!:ReadableStreamDefaultController<Uint8Array>;
  const r=request(new ReadableStream({start(c){stream=c;}}),abort.signal);
  if(early)abort.abort('private-abort');
  const pending=failed(r);if(!early)abort.abort('private-abort');stream.error(new Error('private-stream'));
  const e=await pending;assert.equal(e.evidence?.reason,'aborted');assert.equal(e.evidence?.abortedBefore,early);assert.equal(e.evidence?.abortedAfter,true);assert.ok(!JSON.stringify(e).includes('private'));
 }
});

test('context ownership, type errors and unknown errors remain bounded categories',async()=>{
 const hostile=new Error();Object.defineProperty(hostile,'message',{get(){throw Error('private-getter')}});
 for(const [error,reason] of [[new Error('Cannot perform I/O on behalf of a different request: private-host'),'context-mismatch'],[new TypeError('private-detail'),'type'],[new Error('private-other'),'other'],[hostile,'other']] as const){
  const e=await failed(request(new ReadableStream({start(c){c.error(error);}})));assert.equal(e.evidence?.reason,reason);assert.ok(!JSON.stringify(e).includes('private'));
 }
});

test('phase failure output has only closed diagnostic fields, never request or cause contents',async()=>{
 const e=await failed(request(new ReadableStream({start(c){c.error(new Error('Network connection lost: private-cookie'));}})));
 enablePlayttPhaseDiagnostics();const original=console.log,lines:string[]=[];console.log=x=>lines.push(String(x));
 try{
  const trace=new CloudflarePhaseTrace();await assert.rejects(trace.measure('request.translate',async()=>{throw e}));
  const r=new Request('https://private.invalid/wp-admin/admin-ajax.php?private-query',{method:'POST',headers:{cookie:'private-cookie'},body:'private-content'});
  logPlayttRequestFailure(e,r,trace.complete('mutation','not-used','not-applicable',false),false);
  const line=lines.find(x=>x.includes('playtt-request-failure/v1'))!;assert.ok(line);assert.ok(!line.includes('private'));const logged=JSON.parse(line);
  assert.equal(logged.category,'request-body-unavailable');assert.deepEqual(logged.bodyRead,e.evidence);assert.equal(logged.phase,'request.translate');assert.equal(logged.runtime,'not-used');
 }finally{console.log=original;}
});
