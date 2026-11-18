import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));assert.ok(!process.argv.includes('--local'));
const mode=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);assert.ok(['prepare','verify'].includes(mode));
const origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev',secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const config=JSON.parse(await readFile('wrangler.playtt-retirement-restore-audit.jsonc','utf8')),cron=config.vars.PLAYTT_MAINTENANCE_CRON;
assert.equal(config.name,'playtt-wp-free-restore-audit');assert.equal(config.main,'src/worker-playtt-do.ts');assert.equal(config.vars.PLAYTT_STATE_PARTITION,'restore-v1');assert.deepEqual(config.triggers.crons,[cron]);assert.match(cron,/^(\d|[1-5]\d) (\d|1\d|2[0-3]) \* \* \*$/);
const cookies=new Map(),checks=[],file='artifacts/playtt-scheduled-remote-owned-private.json';let nonce,saved;
async function req(path,options={}){const headers=new Headers(options.headers);headers.set('x-playtt-probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));const start=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});return r;}
async function rawApi(path,body,method=body?'POST':'GET'){const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
async function api(path,body,method=body?'POST':'GET'){const r=await rawApi(path,body,method);assert.equal(r.status,method==='POST'&&path==='pages'?201:200);return r.body;}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
async function preview(){const r=await req('/?phase=operator-auto-draft-maintenance',{method:'POST',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:'{"action":"preview"}'});assert.equal(r.status,200);return {version:Number(r.headers.get('x-wp-codebox-canonical-version')),body:await r.json()};}
const record=p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw,date:p.date});
async function publishedHash(){return createHash('sha256').update(JSON.stringify((await api('pages?context=edit&status=publish&per_page=100')).map(record).sort((a,b)=>a.id-b.id))).digest('hex');}
const save=()=>writeFile(file,JSON.stringify(saved));
try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let eventEvidence;
if(mode==='verify'){
 assert.ok(saved?.prepared&&!saved.cleanupComplete);assert.equal(saved.cron,cron);
 const events=(await readFile('artifacts/playtt-scheduled-mixed-and-daily-observation.jsonl','utf8')).trim().split(/\r?\n/).map(line=>JSON.parse(line));
 // The real controller timestamp included a 2168 ms dispatch offset. Match the
 // scheduled minute, then require the platform event and handler receipt to
 // agree exactly; do not rewrite the original expected minute in the fixture.
 const inExpectedMinute=t=>Number.isSafeInteger(t)&&t>=saved.expectedScheduledTime&&t<saved.expectedScheduledTime+60000;
 const event=events.find(e=>e.scheduledEvent?.cron===cron&&inExpectedMinute(e.scheduledEvent.scheduledTime)&&e.maintenanceSchedules?.some(m=>m.outcome==='completed'&&m.scheduledTime===e.scheduledEvent.scheduledTime));
 assert.ok(event,'A genuine Cloudflare scheduled event with completion evidence is required before verification');
 assert.equal(event.outcome,'ok');assert.equal(event.exceptions.length,0);
 eventEvidence=event.maintenanceSchedules.find(m=>m.outcome==='completed'&&m.scheduledTime===event.scheduledEvent.scheduledTime);
 assert.equal(eventEvidence.eligibleBefore,1);assert.equal(eventEvidence.deleted,1);assert.equal(eventEvidence.remainingEligible,0);assert.equal(eventEvidence.skipped,0);assert.ok(eventEvidence.version>saved.beforeVersion);
}
await paused();await req('/wp-login.php');assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
if(mode==='prepare'){
 assert.ok(!saved||saved.cleanupComplete);const [minute,hour]=cron.split(' ').slice(0,2).map(Number),next=new Date();next.setUTCHours(hour,minute,0,0);if(next.getTime()<=Date.now())next.setUTCDate(next.getUTCDate()+1);
 assert.ok(next.getTime()-Date.now()>=600000&&next.getTime()-Date.now()<=5400000,'Prepare only 10–90 minutes before the next daily event');
 assert.equal((await preview()).body.eligibleBefore,0,'Refuse unrelated expired auto-drafts');
 saved={marker:'PLAYTT_DAILY_'+randomUUID(),cron,expectedScheduledTime:next.getTime(),beforeHash:await publishedHash()};await save();
 const path='pages?context=edit&status=auto-draft&per_page=100',prior=new Set((await api(path)).map(p=>p.id));
 const r=await req('/wp-admin/post-new.php?post_type=page');assert.equal(r.status,200);await r.arrayBuffer();const added=(await api(path)).filter(p=>!prior.has(p.id));assert.equal(added.length,1);
 saved.owned=record(added[0]);await save();saved.owned=record(await api('pages/'+added[0].id,{title:saved.marker,date:new Date(Date.now()-9*86400000).toISOString().slice(0,19)}));assert.equal(saved.owned.status,'auto-draft');await save();
 const plan=await preview();assert.deepEqual(plan.body.selectedIds,[saved.owned.id]);saved.beforeVersion=plan.version;saved.prepared=true;await save();await paused();
 const report={at:new Date().toISOString(),result:'prepared',scope:'One owned expired native auto-draft awaits a real daily Cloudflare event; no manual run invoked',id:saved.owned.id,cron,expectedScheduledTime:saved.expectedScheduledTime,expectedUtc:new Date(saved.expectedScheduledTime).toISOString(),beforeVersion:plan.version,checks};
 await writeFile('artifacts/playtt-scheduled-remote-prepare.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}else{
 assert.equal((await rawApi('pages/'+saved.owned.id+'?context=edit')).status,404);
 const p=record(await api('pages',{title:saved.marker+'_after_daily',content:'',status:'draft'}));saved.after=p;await save();assert.ok(p.id>saved.owned.id);
 assert.equal((await rawApi('pages/'+saved.owned.id,{content:'stale-owned-daily-test'})).status,404);assert.deepEqual(record(await api('pages/'+p.id+'?context=edit')),p);
 assert.equal((await api('pages/'+p.id+'?force=true',undefined,'DELETE')).deleted,true);assert.equal(await publishedHash(),saved.beforeHash);assert.equal((await preview()).body.eligibleBefore,0);await paused();saved.cleanupComplete=true;await save();
 const report={at:new Date().toISOString(),result:'pass',scope:'Genuine Cloudflare daily event plus authenticated WordPress readback; no manual maintenance run in this test',cron,expectedMinute:saved.expectedScheduledTime,controllerOffsetMs:eventEvidence.scheduledTime-saved.expectedScheduledTime,scheduled:eventEvidence,removedId:saved.owned.id,newId:p.id,staleIdWrite404:true,ownedDataRemoved:true,originalPublishedPagesUnchanged:true,publisherPaused:true,checks};
 await writeFile('artifacts/playtt-scheduled-remote-verify.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}
