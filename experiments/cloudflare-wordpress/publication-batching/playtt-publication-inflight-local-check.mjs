import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const origin='http://127.0.0.1:9429', operator='playtt-cms-local-only-operator';
assert.ok(!process.argv.includes('--remote'),'This mutation test is local only');
const cookies=new Map(),checks=[],jobs=[],observations=[];
let nonce,original,created,injected=false,lastRenderedEvent;
async function request(path,options={}){
 const headers=new Headers(options.headers);
 if(!options.anonymous)headers.set('cookie',[...cookies.values()].join('; '));
 const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 if(!options.anonymous)for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}
 checks.push({path,method:options.method||'GET',status:r.status});
 if(r.headers.has('x-wp-codebox-publication-job'))jobs.push(r.headers.get('x-wp-codebox-publication-job'));
 return r;
}
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.ok(r.ok,'REST '+path+' '+r.status);return r.json();}
async function control(action){const r=await request('/__playtt-publishing',{anonymous:true,method:action?'POST':'GET',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:action?JSON.stringify({action}):undefined});assert.equal(r.status,200);return r.json();}
async function idle(observe){const start=Date.now();while(Date.now()-start<180000){const s=await control();assert.notEqual(s.state,'blocked',JSON.stringify(s));if(observe)await observe(s);if(s.state==='idle')return;await new Promise(r=>setTimeout(r,700));}throw Error('Batch drain exceeded 180 seconds');}
const paragraph=marker=>'\n<!-- wp:paragraph --><p>'+marker+'</p><!-- /wp:paragraph -->';
try{
 await control('resume');await idle();
 assert.equal((await request('/wp-login.php')).status,200);
 assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
 nonce=(await (await request('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 const pages=await api('pages?context=edit&per_page=100'),parts=await api('template-parts?context=edit&per_page=100');
 original={about:pages.find(p=>p.slug==='about'),course:pages.find(p=>p.slug==='class'),footer:parts.find(p=>p.slug==='footer')};
 assert.ok(original.about&&original.course&&original.footer);
 await writeFile('artifacts/playtt-inflight-original-private.json',JSON.stringify(original));
 const before=await request('/__playtt-published/about/',{anonymous:true});assert.equal(before.status,200);const beforeRevision=before.headers.get('x-wp-codebox-publication-revision');
 await control('pause');jobs.length=0;
 const suffix=Date.now(),a='PLAYTT_BATCH_FIRST_'+suffix,b='PLAYTT_BATCH_FINAL_'+suffix,c='PLAYTT_BATCH_COURSE_'+suffix,f='PLAYTT_BATCH_FOOTER_'+suffix;
 await api('pages/'+original.about.id,{content:original.about.content.raw+paragraph(a)});
 await api('pages/'+original.course.id,{content:original.course.content.raw+paragraph(c)});
 created=await api('pages',{title:'Local disposable publication batch test',slug:'playtt-batch-'+suffix,status:'publish',content:paragraph(a)});
 await api('pages/'+created.id,{status:'draft'});
 await api('pages/'+original.about.id,{status:'draft'});
 await api('pages/'+original.about.id,{status:'publish',content:original.about.content.raw+paragraph(b)});
 await api('template-parts/'+encodeURIComponent(original.footer.id),{content:original.footer.content.raw+paragraph(f)});
 const queued=[...new Set(jobs)];let latest=queued.at(-1);const firstTarget=latest;assert.ok(queued.length>=7);const started=Date.now();
 await control('resume');let sawOld=false;
 await idle(async s=>{
  observations.push(s);
  const eventKey=JSON.stringify([s.at,s.jobKey,s.route]);
  if(s.result==='rendered'&&eventKey!==lastRenderedEvent){
   lastRenderedEvent=eventKey;
   // pause/resume preserves the previous result but updates the status time.
   // Both known targets are valid observations; final content proves that the
   // newer edit superseded the partially built target.
   assert.ok([firstTarget,latest].includes(s.jobKey),'Observed an unrelated snapshot');
   if(!injected){
    await control('pause');
    const old=await request('/__playtt-published/about/',{anonymous:true});assert.equal(old.headers.get('x-wp-codebox-publication-revision'),beforeRevision,'Old batch promoted before injection');
    await api('pages/'+original.course.id,{content:original.course.content.raw+paragraph(c)+paragraph('PLAYTT_INFLIGHT_FINAL')});
    latest=jobs.at(-1);injected=true;await control('resume');
   }
  }
  const r=await request('/__playtt-published/about/',{anonymous:true});assert.equal(r.status,200);const html=await r.text();assert.ok(!html.includes(a),'Intermediate revision became public');
  if(r.headers.get('x-wp-codebox-publication-revision')===beforeRevision)sawOld=true;
  else assert.ok(html.includes(b)&&html.includes(f),'Partial new batch became public');
 });
 assert.ok(injected,'Must inject an edit while the previous batch is partially rendered');
 assert.ok(sawOld,'Previous complete revision must remain visible during the build');
 const revisions=new Set();for(const route of ['/','/about/','/class/','/coaches/','/locations/','/partner/']){
  const r=await request('/__playtt-published'+route,{anonymous:true});assert.equal(r.status,200);const html=await r.text();assert.ok(html.includes(f));if(route==='/about/')assert.ok(html.includes(b)&&!html.includes(a));if(route==='/class/')assert.ok(html.includes(c)&&html.includes('PLAYTT_INFLIGHT_FINAL'));revisions.add(r.headers.get('x-wp-codebox-publication-revision'));
 }
 assert.equal(revisions.size,1);assert.ok(!revisions.has(beforeRevision));
 assert.equal((await request('/__playtt-published/'+created.slug+'/',{anonymous:true})).status,404,'New page withdrawn in the batch must stay absent');
 const report={at:new Date().toISOString(),result:'pass',scope:'Local real WordPress: supersede a partially rendered seven-edit batch with a new committed edit, preserve independent changes and withdrawal/republish order, expose no intermediate/partial revision, shared footer on six pages',queuedJobs:queued.length,drainMs:Date.now()-started,renderedJobKeys:[...new Set(observations.filter(s=>s.result==='rendered').map(s=>s.jobKey))],latestJob:latest,previousVisibleDuringBuild:sawOld,checks};
 await writeFile('artifacts/playtt-publication-inflight-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,queuedJobs:report.queuedJobs,drainMs:report.drainMs}));
}catch(error){process.exitCode=1;console.error(error);await writeFile('artifacts/playtt-publication-inflight-local-failure.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks,observations},null,2));}
finally{
 if(original&&nonce){
  await control('pause');
  for(const page of [original.about,original.course])await api('pages/'+page.id,{status:page.status,content:page.content.raw});
  await api('template-parts/'+encodeURIComponent(original.footer.id),{content:original.footer.content.raw});
  if(created){const r=await request('/wp-json/wp/v2/pages/'+created.id+'?force=true',{method:'DELETE',headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);}
  await control('resume');await idle();
 }
 await control('pause');
}
