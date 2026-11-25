// GET-only deployed source comparison against the frozen six-module fallback.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {basename} from 'node:path';
assert.deepEqual(process.argv.slice(2),['--remote']);
const output='artifacts/playtt-native-next-code.json',load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
await access(output).then(()=>{throw Error('Evidence already exists');},e=>{if(e.code!=='ENOENT')throw e;});
const preflight=await load('artifacts/playtt-native-next-preflight.json');assert.equal(preflight.result,'pass');assert.ok(Date.now()-Date.parse(preflight.at)<3600000);
const plan=(await load('artifacts/playtt-old-provider-deploy-plan.json')).targets.fallback,token=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(token);
const root='https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/workers/scripts/playtt-wp-free-session-audit',headers={authorization:'Bearer '+token};
const r=await fetch(root+'/content/v2',{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^multipart\//);
const reader=r.body.getReader(),chunks=[];let size=0;try{while(true){const n=await reader.read();if(n.done)break;size+=n.value.length;assert.ok(size<=25000000);chunks.push(n.value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
const form=await new Response(Buffer.concat(chunks),{headers:{'content-type':r.headers.get('content-type')}}).formData(),modules=[];
for(const [name,value]of form){assert.ok(value instanceof Blob);const bytes=new Uint8Array(await value.arrayBuffer());modules.push({name,bytes:bytes.length,sha256:sha(bytes)});}
const expected=plan.modules.map(m=>({name:basename(m.path),bytes:m.bytes,sha256:m.sha256}));assert.deepEqual(modules.sort((a,b)=>a.name.localeCompare(b.name)),expected.sort((a,b)=>a.name.localeCompare(b.name)));
const d=await fetch(root+'/deployments',{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(d.status,200);const body=await d.json();assert.equal(body.success,true);assert.deepEqual(body.result.deployments[0].versions,[{version_id:preflight.version,percentage:100}]);
const report={schema:'playtt/native-trace-code/v1',at:new Date().toISOString(),result:'pass',version:preflight.version,modules,allSixModuleBytesExact:true,fallbackSourceCommit:plan.sourceCommit,requests:2,remoteMutations:0,productionChanged:false};await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:report.result,version:report.version,allSixModuleBytesExact:true,requests:2}));
