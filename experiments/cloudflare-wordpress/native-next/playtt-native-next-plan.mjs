// Prepare one bounded private editor trial. No remote calls or source edits.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.deepEqual(process.argv.slice(2),['--prepare']);
const prefix='artifacts/playtt-native-next-',load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
await access(prefix+'plan-private.json').then(()=>{throw Error('Plan exists');},e=>{if(e.code!=='ENOENT')throw e;});
const config=await load('wrangler.playtt-session-audit.jsonc'),fresh=await load(prefix+'preflight-state-private.json'),code=await load(prefix+'code.json'),free=await load(prefix+'free-before.json');
assert.ok(Date.now()-Date.parse(fresh.at)<3600000);assert.ok(Date.now()-Date.parse(free.at)<3600000);assert.equal(free.workers.plan,'Free');assert.equal(free.r2.billableUsd,0);assert.ok(free.r2.storageGb<3);assert.equal(code.allSixModuleBytesExact,true);
assert.equal(config.vars.PLAYTT_R2_CAPACITY_LIMIT_BYTES,'150000000');assert.equal(fresh.budget.remainingBytes,62344);assert.equal(fresh.state.version,181);assert.equal(fresh.budget.chargedBytes,49199228);assert.equal(fresh.budget.chargedPuts,618);
const data=await load('artifacts/playtt-old-provider-owned-private.json'),control=await load('artifacts/playtt-native-trace-cold-owned-private.json'),fixture=await load('artifacts/playtt-lazy-core-editor-owned-private.json');
assert.equal(data.phase,'verified-closed-sealed-compatible-reader');assert.equal(control.phase,'closed-sealed');assert.ok(control.windowClosed&&control.fenceReleased&&!control.sealReleased);assert.equal(fixture.user.id,2);
const baseline=await openSnapshotBundle(data.directory+'/independent',data.anchor);const draft=baseline.graph.contents.markdown.find(x=>x.path===fixture.draftPath);assert.ok(draft);const framed=Buffer.from(draft.bytes).toString().match(/^---\n(.+?)\n---\n\n?(.*)$/s);assert.ok(framed&&framed[2].endsWith('\n'));const original=framed[2].slice(0,-1);assert.equal(original,data.expectedContent);assert.equal(original.split('<p>'+fixture.lastText+'</p>').length,2);
const editedText=fixture.lastText+' 私人 Cloudflare 原生編輯器測試：保存後重新部署，仍保留繁體中文。';const expectedContent=original.replace('<p>'+fixture.lastText+'</p>','<p>'+editedText+'</p>');
const candidate=await load('artifacts/playtt-lazy-core-build-private.json'),fallback=(await load('artifacts/playtt-old-provider-deploy-plan.json')).targets.fallback;
const variants={candidate:{modules:candidate.productionModules,entry:candidate.entry,vars:{PLAYTT_CONTENT_OVERLAY:'content-gzip-v1',PLAYTT_MANIFEST_ENCODING:'gzip-v1',PLAYTT_EDITOR_HEARTBEAT:'native-30s-v1'}},fallback:{modules:fallback.modules,entry:fallback.modules.find(x=>x.path.endsWith('.js')).path,vars:{}}};
for(const [name,v]of Object.entries(variants)){
 assert.equal(v.modules.length,6);for(const m of v.modules){const bytes=await readFile(m.path);assert.equal(bytes.length,m.bytes);assert.equal(sha(bytes),m.sha256);}
 v.config=prefix+name+'.jsonc';const cfg={...config,main:resolve(v.entry),vars:{...config.vars,PLAYTT_R2_CAPACITY_LIMIT_BYTES:'152000000',...v.vars}};v.expectedVars=cfg.vars;await writeFile(v.config,JSON.stringify(cfg,null,2)+'\n',{flag:'wx'});v.configSha256=sha(await readFile(v.config));
}
const plan={schema:'playtt/native-next-plan/v1',at:new Date().toISOString(),account:config.account_id,worker:config.name,bucket:'playtt-wordpress-session-audit',baselineVersion:181,baseline:data.anchor,baselineDirectory:data.directory+'/independent',previousOwner:'artifacts/playtt-native-trace-cold-owned-private.json',oldLimitBytes:150000000,newLimitBytes:152000000,additionalAllowanceBytes:2000000,projectedRemainingBytes:2062344,limits:{durationSeconds:600,maxBytes:1881041,maxOperations:96,observerSeconds:660},variants,fixture:{id:193,user:fixture.user,draftPath:fixture.draftPath,lastText:fixture.lastText,editedText,expectedContent,expectedSha:sha(expectedContent)},preserveEntireLedger:true,deleteObjects:false,newResources:false,paidUpgrade:false,productionChanged:false};
assert.ok(plan.limits.maxBytes<plan.projectedRemainingBytes);await writeFile(prefix+'plan-private.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:'prepared',baseline:181,oldLimit:plan.oldLimitBytes,newLimit:plan.newLimitBytes,remaining:plan.projectedRemainingBytes,limits:plan.limits,sixModulesEachExact:true,networkCalls:0}));
