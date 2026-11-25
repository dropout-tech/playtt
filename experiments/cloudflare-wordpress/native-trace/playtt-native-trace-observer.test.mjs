import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {readFile,unlink} from 'node:fs/promises';
import {startPlayttProviderObserver} from '../scripts/playtt-native-trace-observer.mjs';
const version='11111111-1111-4111-8111-111111111111';
async function fixture(onSleep){
 const prefix='artifacts/playtt-observer-test-'+randomUUID(),child=new EventEmitter();
 Object.assign(child,{stdout:new PassThrough(),stderr:new PassThrough(),exitCode:null,signalCode:null,killed:false,kill(){this.killed=true;setImmediate(()=>{this.signalCode='SIGTERM';this.emit('close',null);});}});
 let now=1000000;
 const observer=await startPlayttProviderObserver({expectedVersion:version,prefix,spawnProcess:(_exe,args)=>{assert.deepEqual(args,['node_modules/wrangler/bin/wrangler.js','tail','--config','wrangler.playtt-session-audit.jsonc','--format','json']);return child;},now:()=>now,sleep:async ms=>{now+=ms;if(onSleep)await onSleep({now,child});}});
 const emit=(v=version)=>{const raw=JSON.stringify({eventTimestamp:now,outcome:'ok',scriptVersion:{id:v},event:{request:{url:'https://private.invalid/?phase=operator-fence-status&secret=must-not-leak',method:'GET',headers:{authorization:'must-not-leak'}}},logs:[]});child.stdout.write(raw.slice(0,30));child.stdout.write(raw.slice(30));};
 return{child,observer,emit,prefix,advance:n=>now+=n,async cleanup(){await observer.stop();for(const suffix of ['-ready.json','-observation.jsonl'])try{await unlink(prefix+suffix);}catch(e){if(e.code!=='ENOENT')throw e;}}};
}
test('matching streamed event is required; request secrets are excluded',async()=>{
 const f=await fixture();try{assert.equal(await f.observer.ready(),false);assert.throws(()=>f.observer.assertLive());f.emit('22222222-2222-4222-8222-222222222222');assert.equal(await f.observer.ready(),false);f.emit();assert.equal(await f.observer.ready(),true);assert.equal(f.observer.assertLive(540000).live,true);const raw=await readFile(f.prefix+'-observation.jsonl','utf8');assert.equal(raw.includes('must-not-leak'),false);assert.equal(raw.includes('private.invalid'),false);}finally{await f.cleanup();}
});
test('historical ready file cannot authorize work after process termination',async()=>{
 const f=await fixture();try{f.emit();assert.equal(await f.observer.ready(),true);f.child.exitCode=1;f.child.emit('close',1);assert.equal(JSON.parse(await readFile(f.prefix+'-ready.json','utf8')).operatorEventObserved,true);assert.throws(()=>f.observer.assertLive(90000),/not live/);}finally{await f.cleanup();}
});
test('readiness does not extend an observer deadline',async()=>{
 const f=await fixture();try{f.emit();await f.observer.ready();f.advance(600000);assert.throws(()=>f.observer.assertLive(90000),/deadline/);assert.equal(f.observer.assertLive(30000).live,true);f.advance(60000);assert.throws(()=>f.observer.assertLive(0),/deadline/);}finally{await f.cleanup();}
});
test('stop marks handle non-live and drains the final event before returning',async()=>{
 const f=await fixture();try{f.emit();const result=await f.observer.stop();assert.equal(result.ended,true);assert.equal(result.ready,true);assert.throws(()=>f.observer.assertLive(),/not live/);assert.equal(JSON.parse((await readFile(f.prefix+'-observation.jsonl','utf8')).trim()).request.category,'operator');}finally{await f.cleanup();}
});

test('HTTP result and owned path kinds are retained without URLs, nonce or body',async()=>{
 const f=await fixture();try{
  const send=(url,status,extra={})=>f.child.stdout.write(JSON.stringify({eventTimestamp:1000001,outcome:'ok',scriptVersion:{id:version},event:{request:{url,method:'POST',headers:{cookie:'must-not-leak'},body:'must-not-leak'},response:{status}},logs:[],...extra}));
  f.emit();await f.observer.ready();
  send('https://private.invalid/wp-json/wp/v2/pages/193/autosaves?_wpnonce=must-not-leak',200);
  send('https://private.invalid/wp-json/wp/v2/pages/193?secret=must-not-leak',200);
  send('https://private.invalid/wp-login.php?action=logout&_wpnonce=must-not-leak',302);
  send('https://private.invalid/wp-admin/admin-ajax.php?action=arbitrary-private',400);
  send('https://private.invalid/wp-json/wp/v2/pages/9999?secret=must-not-leak',503,{scriptVersion:{id:'must-not-leak'}});
  await f.observer.ready();const text=await readFile(f.prefix+'-observation.jsonl','utf8'),rows=text.trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.slice(1).map(r=>[r.request.kind||null,r.status]),[['owned-autosave',200],['owned-page',200],['logout',302],[null,400],['other-page',503]]);
  for(const needle of ['must-not-leak','private.invalid','arbitrary-private','9999','_wpnonce'])assert.equal(text.includes(needle),false);
  assert.equal(await f.observer.observedVersion(version),true);const second='33333333-3333-4333-8333-333333333333';assert.equal(await f.observer.observedVersion(second),false);f.emit(second);assert.equal(await f.observer.observedVersion(second),true);
 }finally{await f.cleanup();}
});

function native(child,{at=1000000,internal=false,v=version,url='https://private.invalid/wp-login.php?nonce=must-not-leak',completed=true,outcome='ok',truncated=false}={}){
 const trace={schema:'wp-codebox/cloudflare-runtime-phase-trace/v1',operation:'read',runtime:'cold',completed,totalMs:123,phases:[{name:'canonical.metadata-overlay.restore',durationMs:23},{name:'request.php',durationMs:100}]};
 const event={eventTimestamp:at,outcome,truncated,executionModel:internal?'durableObject':'stateless',entrypoint:internal?'PlayttWordPressExecution':undefined,scriptVersion:{id:v},event:{request:{url,method:'GET',headers:{cookie:'must-not-leak'}},response:{status:200}},logs:internal?[{message:[JSON.stringify(trace)]}]:[]};
 const text=JSON.stringify(event);child.stdout.write(text.slice(0,43));child.stdout.write(text.slice(43));
}
test('outer event alone waits to the explicit deadline and reports missing PHP trace',async()=>{
 const f=await fixture();try{f.emit();await f.observer.ready();const cursor=f.observer.markNativeStart();native(f.child);const r=await f.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:5000,settleMs:1000});assert.equal(r.status,'internal-trace-missing');assert.equal(r.waitedMs,5000);assert.equal(r.outerEvents,1);assert.equal(r.internalEvents,0);assert.equal(f.observer.assertLive().live,true);}finally{await f.cleanup();}
});
test('delayed inner completion is drained after the outer response',async()=>{
 let delivered=false;const f=await fixture(({now,child})=>{if(now>=1002000&&!delivered){delivered=true;native(child,{at:now,internal:true});}});
 try{f.emit();await f.observer.ready();const cursor=f.observer.markNativeStart();native(f.child);const r=await f.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:5000,settleMs:1000});assert.equal(r.status,'complete');assert.equal(r.waitedMs,3000);assert.equal(r.outerEvents,1);assert.equal(r.internalEvents,1);assert.equal(r.coldInternalEvents,1);const raw=await readFile(f.prefix+'-observation.jsonl','utf8');assert.equal(raw.includes('must-not-leak'),false);assert.equal(raw.includes('private.invalid'),false);}finally{await f.cleanup();}
});
test('old events, other versions, other routes and incomplete traces do not satisfy native completion',async()=>{
 const f=await fixture();try{f.emit();await f.observer.ready();native(f.child,{internal:true});await f.observer.ready();const cursor=f.observer.markNativeStart();native(f.child);native(f.child,{internal:true,v:'22222222-2222-4222-8222-222222222222'});native(f.child,{internal:true,url:'https://private.invalid/wp-admin/profile.php'});native(f.child,{internal:true,completed:false});const r=await f.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:3000,settleMs:500});assert.equal(r.status,'internal-trace-missing');assert.equal(r.internalEvents,0);}finally{await f.cleanup();}
});
test('late failure after a complete trace is retained during the drain interval',async()=>{
 let delivered=false;const f=await fixture(({now,child})=>{if(now>=1000500&&!delivered){delivered=true;native(child,{at:now,internal:true,outcome:'exceededMemory'});}});
 try{f.emit();await f.observer.ready();const cursor=f.observer.markNativeStart();native(f.child);native(f.child,{internal:true});const r=await f.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:5000,settleMs:1000});assert.equal(r.status,'native-failure');assert.equal(r.nativeFailureEvents,1);assert.equal(r.waitedMs,1500);}finally{await f.cleanup();}
});
test('missing outer event and truncated native events are not a complete observation',async()=>{
 const f=await fixture();try{f.emit();await f.observer.ready();let cursor=f.observer.markNativeStart();native(f.child,{internal:true});let r=await f.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:2000,settleMs:500});assert.equal(r.status,'outer-event-missing');cursor=f.observer.markNativeStart();native(f.child);native(f.child,{internal:true,truncated:true});r=await f.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:2000,settleMs:500});assert.equal(r.status,'truncated');assert.equal(r.truncatedNativeEvents,1);}finally{await f.cleanup();}
});
test('observer termination and deadline do not get relabeled as a completed native trace',async()=>{
 let closed=false;const f=await fixture(({child})=>{if(!closed){closed=true;child.exitCode=1;child.emit('close',1);}});
 try{f.emit();await f.observer.ready();const cursor=f.observer.markNativeStart();native(f.child);await assert.rejects(f.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:3000,settleMs:500}),/not live/);}finally{await f.cleanup();}
 const g=await fixture();try{g.emit();await g.observer.ready();const cursor=g.observer.markNativeStart();g.advance(650000);await assert.rejects(g.observer.waitForNativeTrace({afterSequence:cursor,timeoutMs:45000,settleMs:5000}),/deadline/);}finally{await g.cleanup();}
});
