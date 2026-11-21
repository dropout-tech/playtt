import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {readFile,unlink} from 'node:fs/promises';
import {startPlayttProviderObserver} from '../scripts/playtt-provider-observer.mjs';
const version='11111111-1111-4111-8111-111111111111';
async function fixture(){
 const prefix='artifacts/playtt-observer-test-'+randomUUID(),child=new EventEmitter();
 Object.assign(child,{stdout:new PassThrough(),stderr:new PassThrough(),exitCode:null,signalCode:null,killed:false,kill(){this.killed=true;setImmediate(()=>{this.signalCode='SIGTERM';this.emit('close',null);});}});
 let now=1000000;
 const observer=await startPlayttProviderObserver({expectedVersion:version,prefix,spawnProcess:(_exe,args)=>{assert.deepEqual(args,['node_modules/wrangler/bin/wrangler.js','tail','--config','wrangler.playtt-session-audit.jsonc','--format','json']);return child;},now:()=>now});
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
