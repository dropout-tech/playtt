import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const origin='https://playtt-publication-preview.muzhi-garden-platform.workers.dev';
const cms='playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev',checks=[],assets=new Set(),revisions=new Set();
async function request(path,options={}){const url=new URL(path,origin);assert.equal(url.origin,origin);const start=Date.now();const r=await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(60000)});checks.push({path:url.pathname,status:r.status,wallMs:Date.now()-start,contentType:r.headers.get('content-type')});return r;}
for(const route of ['/','/about/','/class/','/coaches/','/locations/','/partner/']){
  const r=await request(route);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');revisions.add(r.headers.get('x-wp-codebox-publication-revision'));
  const html=await r.text();assert.ok(!html.includes(cms),'Private origin leaked into '+route);assert.ok(html.includes('Let'));
  for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){const url=new URL(m[1].replaceAll('&amp;','&'),origin);if(url.origin===origin&&/^\/wp-(content|includes)\//.test(url.pathname))assets.add(url.href);}
}
assert.equal(revisions.size,1,'The six pages must share a complete publication');
for(const asset of assets){const r=await request(asset);assert.equal(r.status,200,asset);const mime=r.headers.get('content-type');if(new URL(asset).pathname.endsWith('.css'))assert.match(mime,/text\/css/);if(new URL(asset).pathname.endsWith('.js'))assert.match(mime,/javascript/);assert.ok(mime!=='application/octet-stream',asset);await r.arrayBuffer();}
assert.equal((await request('/about/?utm_source=line',{headers:{cookie:'visitor=1'}})).status,200);
assert.equal((await request('/home')).status,301);
assert.equal((await request('/class')).status,301);
for(const path of ['/wp-content/themes/lets-play/functions.php','/wp-content/themes/lets-play/functions.%70hp','/wp-json/wp/v2/pages','/?phase=r2-state','/?preview=true','/missing/'])assert.equal((await request(path)).status,404,path);
assert.equal((await request('/',{method:'POST',body:'x'})).status,405);
const sitemap=await request('/sitemap.xml');assert.equal(sitemap.status,200);const xml=await sitemap.text();assert.ok(xml.includes(origin+'/about/'));assert.ok(!xml.includes(cms));
assert.ok((await (await request('/robots.txt')).text()).includes('Disallow: /'));
const report={at:new Date().toISOString(),result:'pass',scope:'Remote noindex public reader, six coherent pages, all linked core/theme/media assets, origin rewrite, tracking/cookies, redirects, sitemap and private/source rejection',assets:assets.size,revision:[...revisions][0],checks};
await writeFile('artifacts/playtt-public-reader-remote.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,assets:assets.size,requests:checks.length,revision:report.revision}));
