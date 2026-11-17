import assert from 'node:assert/strict';
import test from 'node:test';
import {CloudflarePhaseTrace,enablePlayttPhaseDiagnostics,logPlayttRequestFailure,playttFailureCategory} from '../src/phase-trace.js';
test('failure categories never echo private exception data',()=>{
 const secret='private-url-cookie-token';
 for(const [error,expected]of [[new DOMException(secret,'AbortError'),'client-disconnected'],[new Error('The client disconnected: '+secret),'client-disconnected'],[new Error('Out of memory: '+secret),'memory'],[new TypeError(secret),'type'],[new Error(secret),'other'],[secret,'unknown']] as const)assert.equal(playttFailureCategory(error),expected);
 const hostile=new Error();Object.defineProperty(hostile,'message',{get(){throw Error(secret)}});assert.equal(playttFailureCategory(hostile),'unknown');
});
test('request failure uses fixed endpoint categories and failed leaf without private request data',async()=>{
 enablePlayttPhaseDiagnostics();const saved=console.log,logs:string[]=[];console.log=(s)=>{logs.push(String(s))};
 try{
  const trace=new CloudflarePhaseTrace();await assert.rejects(trace.measure('request.translate',async()=>{throw Error('private-payload')}));
  const summary=trace.complete('mutation','warm','not-applicable',false);
  const req=new Request('https://private-host/wp-admin/admin-ajax.php?private-query=private-value',{method:'POST',headers:{cookie:'private-cookie'},body:'private-content'});
  logPlayttRequestFailure(new Error('The client disconnected: private-error'),req,summary,false);
  const output=logs.find(x=>x.includes('playtt-request-failure/v1'))!;assert.ok(output);assert.ok(!output.includes('private-'));
  assert.deepEqual(JSON.parse(output),{schema:'playtt-request-failure/v1',category:'client-disconnected',endpoint:'admin-ajax',method:'POST',operation:'mutation',runtime:'warm',phase:'request.translate',signalAborted:false,bodyUsed:false,cleanupFailed:false});
 }finally{console.log=saved}
});
