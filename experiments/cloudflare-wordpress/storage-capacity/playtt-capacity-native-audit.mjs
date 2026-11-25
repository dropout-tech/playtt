import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {createInterface} from 'node:readline';
import {privateClient,origin} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const c=await privateClient(),secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const ownedPath='artifacts/playtt-capacity-owned-private.json',reportPath='artifacts/playtt-capacity-native.json';
const pick=p=>({id:p.id,slug:p.slug,title:p.title.raw,status:p.status,content:p.content.raw});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const input=createInterface({input:process.stdin,terminal:false})[Symbol.asyncIterator]();
async function wait(stage){console.log(JSON.stringify({waitingFor:stage}));const next=await Promise.race([input.next(),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Audit input timed out')),600000);t.unref();})]);assert.equal(next.value,stage);}
async function state(){const r=await c.operator('operator-fence-status');assert.equal(r.coherent,true);assert.equal(r.fence.active,false);return r.state;}
async function capacity(){const r=await c.request('/__playtt-capacity',{headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);return r.json();}
const report={at:new Date().toISOString(),result:'pending',checks:c.checks};
async function save(){await writeFile(reportPath,JSON.stringify(report,null,2));}
try{
 await c.paused();assert.equal((await state()).version,303);await c.login();
 let exists=false;try{await readFile(ownedPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false);
 const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);
 const marker='playtt-capacity-'+randomUUID(),owned={origin,marker,id:null,homeHash:hash(pick(home.body)),expected:null,cleanupComplete:false};await writeFile(ownedPath,JSON.stringify(owned,null,2));
 const content='<!-- wp:paragraph -->\n<p>容量驗收：原始保存。</p>\n<!-- /wp:paragraph --> \n';
 const created=await c.rest('pages',{slug:marker,title:marker,status:'draft',content});assert.equal(created.status,201);owned.id=created.body.id;owned.expected=pick(created.body);await writeFile(ownedPath,JSON.stringify(owned,null,2));
 const before=await state(),budgetBefore=await capacity();assert.equal(budgetBefore.limitBytes,1000000000);
 Object.assign(report,{ownedId:owned.id,before,budgetBefore});await save();
 await wait('deny');
 const deniedBudget=await capacity();assert.equal(deniedBudget.limitBytes,1);assert.equal(deniedBudget.chargedBytes,budgetBefore.chargedBytes);assert.equal(deniedBudget.chargedPuts,budgetBefore.chargedPuts);
 const update='<!-- wp:paragraph -->\n<p>容量驗收：超限後恢復繁中 &amp; bytes。</p>\n<!-- /wp:paragraph --> \n';
 const failed=await c.rest('pages/'+owned.id,{content:update});assert.equal(failed.status,507);assert.equal(failed.body.code,'playtt_storage_capacity');assert.deepEqual(await state(),before);
 const original=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(original.status,200);assert.deepEqual(pick(original.body),owned.expected);
 const afterDenial=await capacity();assert.equal(afterDenial.chargedBytes,budgetBefore.chargedBytes);assert.equal(afterDenial.chargedPuts,budgetBefore.chargedPuts);
 Object.assign(report,{denial:{status:507,pointerAndVersionUnchanged:true,exactOldContent:true,chargedBytesUnchanged:true,chargedPutsUnchanged:true}});await save();
 await wait('recover');
 const restoredBudget=await capacity();report.recoveryBudgetObserved=restoredBudget;await save();assert.equal(restoredBudget.limitBytes,1000000000);assert.equal(restoredBudget.chargedBytes,budgetBefore.chargedBytes);
 const changed=await c.rest('pages/'+owned.id,{content:update});assert.equal(changed.status,200);assert.equal(changed.body.content.raw,update);owned.expected=pick(changed.body);await writeFile(ownedPath,JSON.stringify(owned,null,2));
 const recovered=await state();assert.equal(recovered.version,before.version+1);const budgetRecovered=await capacity();assert.ok(budgetRecovered.chargedBytes>budgetBefore.chargedBytes);assert.ok(budgetRecovered.chargedPuts>budgetBefore.chargedPuts);
 Object.assign(report,{recovery:{status:200,versionDelta:1,exactContent:true},recovered,budgetRecovered});await save();
 await wait('cold');
 const budgetCold=await capacity();assert.equal(budgetCold.chargedBytes,budgetRecovered.chargedBytes);assert.equal(budgetCold.chargedPuts,budgetRecovered.chargedPuts);
 const fresh=await privateClient();await fresh.login();const read=await fresh.rest('pages/'+owned.id+'?context=edit');assert.equal(read.status,200);assert.deepEqual(pick(read.body),owned.expected);
 const h=await fresh.rest('pages/24?context=edit');assert.equal(h.status,200);assert.equal(hash(pick(h.body)),owned.homeHash);
 const removed=await fresh.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(removed.status,200);assert.equal(removed.body.deleted,true);assert.equal(removed.body.previous.id,owned.id);assert.equal((await fresh.rest('pages/'+owned.id+'?context=edit')).status,404);
 owned.cleanupComplete=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));report.checks.push(...fresh.checks);
 Object.assign(report,{result:'pass',coldExactReadback:true,ledgerSurvivedRedeployment:true,homepageUnchanged:true,cleanupComplete:true,final:await state(),budgetFinal:await capacity()});await c.paused();await save();console.log(JSON.stringify(report));
}catch(error){report.result='fail';report.errorName=error.name;await save();console.log(JSON.stringify(report));process.exitCode=1;}
finally{process.stdin.destroy();}
