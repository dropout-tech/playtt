import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {privateClient,origin} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const c=await privateClient(),secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const ownedPath='artifacts/playtt-capacity-owned-private.json',reportPath='artifacts/playtt-capacity-recovery.json';
const owned=JSON.parse(await readFile(ownedPath,'utf8')),earlier=JSON.parse(await readFile('artifacts/playtt-capacity-native.json','utf8'));
assert.equal(owned.origin,origin);assert.equal(owned.id,181);assert.equal(owned.cleanupComplete,false);assert.equal(earlier.result,'fail');assert.equal(earlier.denial?.status,507);assert.ok(!owned.recoveryComplete);
const pick=p=>({id:p.id,slug:p.slug,title:p.title.raw,status:p.status,content:p.content.raw});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function state(){const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);return s.state;}
async function capacity(){const r=await c.request('/__playtt-capacity',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);return r.json();}
const input=createInterface({input:process.stdin,terminal:false})[Symbol.asyncIterator]();
const report={at:new Date().toISOString(),result:'pending',resumesOwnedId:181,priorFailurePreserved:true,checks:c.checks};
async function save(){await writeFile(reportPath,JSON.stringify(report,null,2));}
try{
 await c.paused();const before=await state();assert.deepEqual(before,earlier.before);
 const firstBudget=await capacity();report.firstBudget=firstBudget;await save();assert.equal(firstBudget.limitBytes,1000000000);assert.equal(firstBudget.chargedBytes,earlier.budgetBefore.chargedBytes);assert.equal(firstBudget.chargedPuts,earlier.budgetBefore.chargedPuts);
 await c.login();const original=await c.rest('pages/181?context=edit');assert.equal(original.status,200);assert.deepEqual(pick(original.body),owned.expected);
 const beforeUpdate=await state(),budgetBeforeUpdate=await capacity();
 const content='<!-- wp:paragraph -->\n<p>容量驗收：超限後恢復繁中 &amp; bytes。</p>\n<!-- /wp:paragraph --> \n';
 const updated=await c.rest('pages/181',{content});assert.equal(updated.status,200);assert.equal(updated.body.content.raw,content);owned.expected=pick(updated.body);owned.recoveryComplete=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));
 const recovered=await state(),budgetRecovered=await capacity();assert.equal(recovered.version,beforeUpdate.version+1);assert.ok(budgetRecovered.chargedBytes>budgetBeforeUpdate.chargedBytes);
 Object.assign(report,{before,beforeUpdate,budgetBeforeUpdate,recovered,budgetRecovered,recovery:{status:200,versionDelta:1,exactContent:true}});await save();
 console.log(JSON.stringify({waitingFor:'cold',ownedId:181}));
 const next=await Promise.race([input.next(),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Audit input timed out')),600000);t.unref();})]);assert.equal(next.value,'cold');
 const budgetCold=await capacity();report.budgetCold=budgetCold;await save();assert.equal(budgetCold.chargedBytes,budgetRecovered.chargedBytes);assert.equal(budgetCold.chargedPuts,budgetRecovered.chargedPuts);
 const fresh=await privateClient();await fresh.login();const read=await fresh.rest('pages/181?context=edit');assert.equal(read.status,200);assert.deepEqual(pick(read.body),owned.expected);
 const home=await fresh.rest('pages/24?context=edit');assert.equal(home.status,200);assert.equal(hash(pick(home.body)),owned.homeHash);
 const removed=await fresh.rest('pages/181?force=true',undefined,'DELETE');assert.equal(removed.status,200);assert.equal(removed.body.deleted,true);assert.equal(removed.body.previous.id,181);assert.equal((await fresh.rest('pages/181?context=edit')).status,404);
 owned.cleanupComplete=true;await writeFile(ownedPath,JSON.stringify(owned,null,2));report.checks.push(...fresh.checks);
 Object.assign(report,{result:'pass',coldExactReadback:true,ledgerSurvivedRedeployment:true,homepageUnchanged:true,cleanupComplete:true,final:await state(),budgetFinal:await capacity()});await c.paused();await save();console.log(JSON.stringify(report));
}catch(error){report.result='fail';report.errorName=error.name;report.assertion=typeof error.actual==='number'&&typeof error.expected==='number'?{actual:error.actual,expected:error.expected}:undefined;await save();console.log(JSON.stringify(report));process.exitCode=1;}
finally{process.stdin.destroy();}
