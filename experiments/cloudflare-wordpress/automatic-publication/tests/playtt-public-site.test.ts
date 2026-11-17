import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { rewritePlayttOrigins } from '../src/worker-playtt-public.js';
import { PUBLISHED_PAGE_SCHEMA, PUBLISHED_REVISION_SCHEMA, publishedPageObjectKey } from '../src/published-reader.js';
import { siteStorageKeys } from '../src/site-context.js';

async function fixture() {
  const site={id:'default',hostname:'cms.example',origin:'https://cms.example'};
  const canonicalRevision='11111111-1111-4111-8111-111111111111',revision='22222222-2222-4222-8222-222222222222';
  const objectKey=await publishedPageObjectKey(canonicalRevision,'/about/',site);
  const publication={schema:PUBLISHED_REVISION_SCHEMA,state:'complete',revision,canonicalRevision,canonicalVersion:8,publishedAt:new Date().toISOString(),routes:[{route:'/about/',objectKey,canonicalRevision}]};
  const objects=new Map([
    [siteStorageKeys(site).publishedCurrent,JSON.stringify(publication)],
    [objectKey,JSON.stringify({schema:PUBLISHED_PAGE_SCHEMA,canonicalRevision,route:'/about/',status:200,statusText:'OK',headers:[['content-type','text/html']],body:'<link rel="canonical" href="https://cms.example/about/"><img src="https://cms.example/wp-content/uploads/x.webp"><script>var home="https:\\/\\/cms.example\\/"</script>'})],
  ]);
  const env={WORDPRESS_STATE_BUCKET:{async get(key:string){const v=objects.get(key);return v===undefined?null:{size:Buffer.byteLength(v),text:async()=>v,json:async()=>JSON.parse(v)};}},PLAYTT_PUBLIC_HOST:'public.example',PLAYTT_PUBLIC_ORIGIN:'https://public.example',PLAYTT_CMS_ORIGIN:site.origin};
  const fetch=(path:string,init?:RequestInit)=>worker.fetch(new Request('https://public.example'+path,init),env as never);
  return {fetch,env,revision};
}
test('public site rewrites canonical, media and escaped JSON while serving cookies and tracking URLs statically',async()=>{
  const {fetch,revision}=await fixture();const r=await fetch('/about/?utm_source=line',{headers:{cookie:'visitor=1',authorization:'Bearer irrelevant'}});
  assert.equal(r.status,200);const text=await r.text();assert.ok(!text.includes('cms.example'));assert.ok(text.includes('https://public.example/about/'));assert.ok(text.includes('https:\\/\\/public.example\\/'));
  assert.equal(r.headers.get('x-wp-codebox-publication-revision'),revision);assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');
});
test('public boundary rejects writes and dynamic requests and preserves legacy redirects',async()=>{
  const {fetch,env}=await fixture();
  for(const path of ['/?phase=r2-state','/?preview=true','/wp-json/wp/v2/pages','/xmlrpc.php','/__playtt-publishing']) assert.equal((await fetch(path)).status,404,path);
  assert.equal((await fetch('/about/',{method:'POST',body:'x'})).status,405);
  assert.equal((await worker.fetch(new Request('https://other.example/'),env as never)).status,421);
  assert.equal((await fetch('/home?utm_source=line')).headers.get('location'),'https://public.example/?utm_source=line');
  assert.equal((await fetch('/about')).headers.get('location'),'https://public.example/about/');
  assert.equal((await fetch('/wp-admin/')).headers.get('location'),'https://cms.example/wp-admin/');
});
test('sitemap follows the complete publication and HEAD has no response body',async()=>{
  const {fetch}=await fixture();const xml=await (await fetch('/sitemap.xml')).text();assert.ok(xml.includes('<loc>https://public.example/about/</loc>'));assert.ok(!xml.includes('cms.example'));
  assert.equal(await (await fetch('/about/',{method:'HEAD'})).text(),'');assert.equal((await fetch('/missing/')).status,404);
});
test('publication removes unavailable API discovery and rewrites percent-encoded origins',()=>{
  const html='<link rel="alternate" type="text/xml+oembed" href="https://cms.example/wp-json?url=https%3A%2F%2Fcms.example%2F"><link rel="canonical" href="https://cms.example/"><a href="/?next=https%3A%2F%2Fcms.example%2F">Continue</a>';
  const result=rewritePlayttOrigins(html,'https://cms.example','https://public.example');
  assert.ok(!result.includes('cms.example'));assert.ok(!result.includes('oembed'));assert.ok(result.includes('rel="canonical"'));assert.ok(result.includes('https%3A%2F%2Fpublic.example%2F'));
});
