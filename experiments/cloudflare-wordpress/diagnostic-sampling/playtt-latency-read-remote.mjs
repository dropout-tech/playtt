import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));const label=process.argv.find(x=>x.startsWith('--label='))?.slice(8);assert.ok(['baseline','sampled'].includes(label));
const output='artifacts/playtt-latency-read-'+label+'.json';try{await access(output);assert.fail('Do not overwrite a completed baseline');}catch(e){if(e.code!=='ENOENT')throw e;}
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.fence.active,false);
const reads=[];for(let i=0;i<7;i++){const started=performance.now(),r=await c.request('/wp-login.php');assert.equal(r.status,200);assert.ok((await r.text()).includes('wp-submit'));reads.push({index:i,wallMs:Math.round((performance.now()-started)*1000)/1000,status:r.status,warmup:i===0});}
const after=await c.operator('operator-fence-status');assert.deepEqual(after.state,before.state);assert.equal(after.coherent,true);assert.equal(after.fence.active,false);await c.paused();
const values=reads.slice(1).map(x=>x.wallMs).sort((a,b)=>a-b);const report={at:new Date().toISOString(),result:'pass',label,scope:'One warmup followed by six sequential private login-page reads, without CPU capture; whole-response client wall time, not CPU or general backend performance.',reads,medianMs:(values[2]+values[3])/2,minMs:values[0],maxMs:values.at(-1),canonicalUnchanged:true,version:after.state.version,revision:after.state.pointer.revision,publisher:'paused'};await writeFile(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
