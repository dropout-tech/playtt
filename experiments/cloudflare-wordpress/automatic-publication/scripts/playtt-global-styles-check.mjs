import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const origin='http://127.0.0.1:9429', operator='playtt-cms-local-only-operator', cookies=new Map(), checks=[];
let nonce;
const routes=['/','/about/','/class/','/coaches/','/locations/','/partner/'];
async function request(path,options={}) {
  const headers=new Headers(options.headers);
  if(!options.anonymous)headers.set('cookie',[...cookies.values()].join('; '));
  const start=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
  if(!options.anonymous)for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}
  checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});
  return r;
}
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.ok(r.ok,'REST '+path+' '+r.status);return r.json();}
async function status(){const r=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+operator},anonymous:true});assert.equal(r.status,200);return r.json();}
async function published(path){return request('/__playtt-published'+path,{anonymous:true});}
async function idle(){const start=Date.now();while(Date.now()-start<120000){const s=await status();assert.notEqual(s.state,'blocked',JSON.stringify(s));if(s.state==='idle')return s;await new Promise(resolve=>setTimeout(resolve,1000));}throw Error('Publication did not finish within 120 seconds');}
try {
  assert.equal((await request('/wp-login.php')).status,200);
  assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
  nonce=(await (await request('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  async function styleId(){const theme=(await api('themes?context=edit')).find(t=>t.stylesheet==='lets-play');return theme._links['wp:user-global-styles'][0].href.split('/').at(-1);}
  const id=await styleId();
  // Reset only this script's isolated local color fixture after the prior interrupted assertion.
  await api('global-styles/'+id,{styles:{}});await idle();
  const original=await api('global-styles/'+id+'?context=edit');
  await api('global-styles/'+id,{styles:{...original.styles,elements:{...original.styles.elements,link:{color:{text:'var:preset|color|ink'}}}}});
  await idle();assert.equal(await styleId(),id,'Global styles must retain their wp_theme relationship across cold publication boots');
  const saved=await api('global-styles/'+id+'?context=edit');assert.equal(saved.styles.elements.link.color.text,'var(--wp--preset--color--ink)');
  for(const route of routes){const r=await published(route);assert.equal(r.status,200);const html=await r.text();assert.ok(/a:where\(\:not\(\.wp-element-button\)\)\{color:\s*var\(--wp--preset--color--ink\)/.test(html),'Global link color missing on '+route);}
  await api('global-styles/'+id,{styles:original.styles});await idle();
  const report={at:new Date().toISOString(),result:'pass',scope:'Global styles initialized during GET retain their theme relationship after save and cold publication; all six published pages use the saved color; original styles restored',id,checks};await writeFile('artifacts/playtt-global-styles-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,id,requests:checks.length}));
}catch(error){await writeFile('artifacts/playtt-global-styles-local-failure.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks},null,2));throw error;}
