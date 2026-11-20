import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {playttCapacityLimit,PlayttCapacityError} from '../src/playtt-storage-capacity.js';
import {createCloudflareSnapshotSource} from '../scripts/playtt-snapshot-download.mjs';

test('actual isolated v2 deployment config is admitted by capacity policy before provisioning',async()=>{
 const cfg=JSON.parse(await readFile('wrangler.playtt-session-audit.jsonc','utf8'));
 assert.equal(cfg.name,'playtt-wp-free-session-audit');
 assert.deepEqual(cfg.r2_buckets,[{binding:'WORDPRESS_STATE_BUCKET',bucket_name:'playtt-wordpress-session-audit'}]);
 assert.equal(cfg.vars.PLAYTT_R2_CAPACITY_SCOPE,cfg.r2_buckets[0].bucket_name);
 const env={...cfg.vars,WORDPRESS_STATE_BUCKET:{} as R2Bucket,PLAYTT_STORAGE_BUDGET:{} as DurableObjectNamespace};
 assert.equal(playttCapacityLimit(env),150000000);
 assert.equal(cfg.vars.PLAYTT_METADATA_OVERLAY,'v2');assert.equal(cfg.vars.PLAYTT_R2_WRITE_WINDOW,'v1');assert.equal(cfg.vars.PLAYTT_PROBE_GATE,'true');
 assert.deepEqual(cfg.triggers.crons,[]);assert.equal(cfg.routes,undefined);assert.equal(cfg.services,undefined);assert.equal(cfg.limits,undefined);
 const classes=cfg.durable_objects.bindings.map((b:any)=>{assert.equal(b.script_name,undefined);return b.class_name;}).sort();
 assert.deepEqual(classes,cfg.migrations.flatMap((m:any)=>m.new_sqlite_classes||[]).sort());
 assert.equal(cfg.migrations.some((m:any)=>m.new_classes?.length),false);
 for(const scope of ['production','playtt-wordpress-session-audit-typo','other-project'])assert.throws(()=>playttCapacityLimit({...env,PLAYTT_R2_CAPACITY_SCOPE:scope}),PlayttCapacityError);
});

test('v2 provider permits six bounded GETs while older scopes retain five',async()=>{
 for(const [bucketName,limit] of [['playtt-wordpress-session-audit',6],['playtt-wordpress-window-audit',5],['playtt-wordpress-pin-restore-audit',5],['playtt-wordpress-rebuild-audit',5]] as const){
  let calls=0;
  const source=createCloudflareSnapshotSource({bucketName,token:'synthetic-test-token',fetchImpl:async(url:string,options:any)=>{
   calls++;assert.ok(url.includes('/r2/buckets/'+bucketName+'/objects/'));
   assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
   return new Response(new Uint8Array([1,2,3]));
  }});
  for(let i=0;i<limit;i++)assert.equal((await source.bucket.get('sites/default/object-'+i))?.size,3);
  await assert.rejects(source.bucket.get('sites/default/over-budget'),/request count/);
  assert.equal(calls,limit);assert.equal(source.stats.requests,limit);assert.equal(source.stats.downloadedBytes,limit*3);
 }
 assert.throws(()=>createCloudflareSnapshotSource({bucketName:'playtt-wordpress-session-audit-typo',token:'synthetic-test-token'}));
});
