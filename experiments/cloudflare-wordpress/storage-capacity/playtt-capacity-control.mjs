import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--fence','--initialize','--release','--status','--cold-fence','--cold-release'].includes(x));assert.ok(mode);
const c=await privateClient(),secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const path=mode.startsWith('--cold')?'artifacts/playtt-capacity-cold-fence-private.json':'artifacts/playtt-capacity-fence-private.json';
async function post(path,body){const r=await c.request(path,{method:'POST',headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();}
await c.paused();
if(mode==='--fence'||mode==='--cold-fence'){
 const state=await c.operator('operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
 if(mode==='--fence'){assert.equal(state.state.version,303);assert.equal(state.state.pointer.revision,'c48150e9-0e75-4399-93e4-d94e7c908e2b');}
 else {const r=JSON.parse(await readFile('artifacts/playtt-capacity-recovery.json','utf8'));assert.equal(r.recovery.status,200);assert.deepEqual(state.state,r.recovered);}
 let exists=false;try{await readFile(path);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false);
 const fence=await post('/?phase=operator-fence-acquire',{ttlSeconds:600});await writeFile(path,JSON.stringify({...fence,released:false}));console.log(JSON.stringify({mode,result:'pass',fenceActive:true,canonicalVersion:state.state.version}));
}else if(mode==='--initialize'){
 const fence=JSON.parse(await readFile(path,'utf8'));assert.equal(fence.released,false);
 const status=await post('/__playtt-capacity',{action:'initialize',fenceToken:fence.token});assert.equal(status.initialized,true);assert.equal(status.limitBytes,1000000000);assert.equal(status.baselineBytes,625679206);assert.equal(status.baselineObjects,1086);assert.equal(status.chargedBytes,0);assert.equal(status.chargedPuts,0);
 await writeFile('artifacts/playtt-capacity-initialized.json',JSON.stringify({at:new Date().toISOString(),result:'pass',status},null,2));console.log(JSON.stringify(status));
}else if(mode==='--release'||mode==='--cold-release'){
 const fence=JSON.parse(await readFile(path,'utf8'));assert.equal(fence.released,false);await post('/?phase=operator-fence-release',{token:fence.token});fence.released=true;await writeFile(path,JSON.stringify(fence));const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);console.log(JSON.stringify({mode,result:'pass',fenceActive:false,version:s.state.version}));
}else{
 const r=await c.request('/__playtt-capacity',{headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);console.log(JSON.stringify(await r.json()));
}
