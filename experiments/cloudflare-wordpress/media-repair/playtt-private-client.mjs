import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

export const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
export async function privateClient(){
 const config=JSON.parse(await readFile('wrangler.playtt-rebuild-audit.jsonc','utf8'));assert.equal(config.name,'playtt-wp-free-rebuild-audit');assert.equal(config.r2_buckets[0].bucket_name,'playtt-wordpress-rebuild-audit');assert.ok(!config.routes&&!config.services);assert.deepEqual(config.triggers.crons,[]);
 const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')),cookies=new Map(),checks=[];let nonce;
 async function request(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));const at=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-at});for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}return r;}
 async function operator(phase){const r=await request('/?phase='+phase,{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);return r.json();}
 async function paused(){const r=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
 async function login(){
  assert.equal((await request('/wp-login.php')).status,200);const r=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).origin,origin);
  const page=await request('/wp-admin/');assert.equal(page.status,200);const text=await page.text();assert.ok(text.includes('lang="zh-TW"'));nonce=text.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 }
 async function rest(path,body,method=body?'POST':'GET'){const r=await request('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
 return {request,operator,paused,login,rest,checks};
}
