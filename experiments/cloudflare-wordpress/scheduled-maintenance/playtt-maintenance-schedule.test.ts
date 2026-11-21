import test from 'node:test';
import assert from 'node:assert/strict';
import {runPlayttScheduledMaintenance} from '../src/playtt-maintenance-schedule.js';
import {deriveSiteCredential} from '../src/wordpress-auth.js';
const event={cron:'17 19 * * *',scheduledTime:1795020000000};
const env={PLAYTT_MAINTENANCE_CRON:event.cron,WORDPRESS_OPERATOR_TOKEN:'local-test-secret',WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'test.invalid',origin:'https://test.invalid'}])};
const result={schema:'playtt/auto-draft-maintenance/v1',action:'run',batchLimit:20,eligibleBefore:2,selectedIds:[3,4],deletedIds:[3],remainingEligible:1,skippedIds:[4]};
const headers={'x-wp-codebox-canonical-revision':'12345678-1234-1234-1234-123456789abc','x-wp-codebox-canonical-version':'5'};
const never=async()=>{throw Error('Dispatch must not occur');};
test('absent schedule is disabled without touching any binding or secret',async()=>{
 assert.equal((await runPlayttScheduledMaintenance(event,{},never)).outcome,'disabled');
});
test('only a single fixed daily schedule is accepted',async()=>{
 let calls=0;const dispatch=async()=>{calls++;return Response.json(result,{headers});};
 for(const cron of ['*/5 * * * *','60 19 * * *','17 24 * * *','17 19 1 * *','17 19 * * 1','17 19 * * *\n','17 19 * * *; other'])await assert.rejects(runPlayttScheduledMaintenance({...event,cron},{...env,PLAYTT_MAINTENANCE_CRON:cron},dispatch));
 assert.equal(calls,0);
 for(const cron of ['0 0 * * *','59 23 * * *'])assert.equal((await runPlayttScheduledMaintenance(event,{...env,PLAYTT_MAINTENANCE_CRON:cron},never)).outcome,'ignored-cron');
});
test('obsolete cron triggers are ignored before dispatch',async()=>{
 assert.equal((await runPlayttScheduledMaintenance({...event,cron:'18 19 * * *'},env,never)).outcome,'ignored-cron');
});
test('invalid event or ambiguous site configuration cannot dispatch',async()=>{
 let calls=0;const dispatch=async()=>{calls++;return Response.json(result,{headers});};
 for(const scheduledTime of [NaN,-1,1.5,Number.MAX_SAFE_INTEGER])await assert.rejects(runPlayttScheduledMaintenance({...event,scheduledTime},env,dispatch));
 for(const change of [{WORDPRESS_OPERATOR_TOKEN:''},{WORDPRESS_SITE_CONTEXTS:''},{WORDPRESS_SITE_CONTEXTS:'[]'},{WORDPRESS_SITE_CONTEXTS:'not-json'},{WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'a',hostname:'a.invalid',origin:'https://a.invalid'},{id:'b',hostname:'b.invalid',origin:'https://b.invalid'}])}])await assert.rejects(runPlayttScheduledMaintenance(event,{...env,...change},dispatch));
 assert.equal(calls,0);
});
test('one private dispatch uses fixed action and site-scoped credentials',async()=>{
 let calls=0;
 const scoped={...env,WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'brand',hostname:'brand.invalid',origin:'https://brand.invalid'}])};
 const report=await runPlayttScheduledMaintenance(event,scoped,async request=>{
  calls++;assert.equal(request.url,'https://brand.invalid/?phase=operator-auto-draft-maintenance');assert.equal(request.method,'POST');assert.deepEqual(await request.json(),{action:'run'});
  const token=await deriveSiteCredential(env.WORDPRESS_OPERATOR_TOKEN,'brand','operator-token');assert.notEqual(token,env.WORDPRESS_OPERATOR_TOKEN);assert.equal(request.headers.get('authorization'),'Bearer '+token);
  return Response.json(result,{headers});
 });
 assert.equal(calls,1);assert.equal(report.outcome,'completed');assert.equal(report.deleted,1);assert.equal(report.remainingEligible,1);assert.equal(report.skipped,1);
 assert.equal(JSON.stringify(report).includes(env.WORDPRESS_OPERATOR_TOKEN),false);assert.equal('deletedIds' in report,false);
});
test('locks and write failures fail the invocation without automatic replay',async()=>{
 for(const status of [401,409,500]){
  let calls=0,canceled=false;
  await assert.rejects(runPlayttScheduledMaintenance(event,env,async()=>{calls++;return new Response(new ReadableStream({cancel(){canceled=true;}}),{status});}),new RegExp('HTTP '+status));
  assert.equal(calls,1);assert.equal(canceled,true);
 }
 let calls=0;await assert.rejects(runPlayttScheduledMaintenance(event,env,async()=>{calls++;throw Error('private upstream text');}),/^Error: Scheduled maintenance dispatch failed\.$/);assert.equal(calls,1);
});
test('success requires validated maintenance data and a commit receipt',async()=>{
 for(const body of [null,{...result,deletedIds:[9]},{...result,action:'preview'}])await assert.rejects(runPlayttScheduledMaintenance(event,env,async()=>Response.json(body,{headers})));
 for(const h of [{},{...headers,'x-wp-codebox-canonical-version':'0'},{...headers,'x-wp-codebox-canonical-revision':'bad'}])await assert.rejects(runPlayttScheduledMaintenance(event,env,async()=>Response.json(result,{headers:h})));
});
