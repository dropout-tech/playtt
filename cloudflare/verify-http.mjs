import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import https from 'node:https';
const root=path.dirname(fileURLToPath(import.meta.url));
const base=new URL(process.argv[2]||'http://127.0.0.1:9423');
const edge=process.env.PLAYTT_EDGE_IP;
// During NS propagation, optionally verify the authoritative edge while keeping
// the real hostname/SNI and certificate validation. Report this separately from
// a normal public-DNS check; it does not prove every resolver has updated.
async function request(url,options={}){
  if(!edge)return fetch(url,options);
  assert.equal(url.protocol,'https:');
  return new Promise((accept,reject)=>{
    const req=https.request(url,{method:'GET',lookup:(_host,_opts,done)=>done(null,[{address:edge,family:4}])},res=>{
      const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('error',reject);
      res.on('end',async()=>{
        const headers=new Headers();for(const [k,v]of Object.entries(res.headers)){if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v);}
        if(res.statusCode>=300&&res.statusCode<400&&headers.has('location')&&options.redirect!=='manual'){
          const target=new URL(headers.get('location'),url);assert.equal(target.origin,base.origin,'Unexpected redirect origin');
          try{accept(await request(target,{...options,redirect:'manual'}));}catch(error){reject(error);}return;
        }
        accept(new Response(Buffer.concat(chunks),{status:res.statusCode,headers}));
      });
    });req.on('error',reject);req.setTimeout(20000,()=>req.destroy(new Error('Edge request timeout')));req.end();
  });
}
const results=[];
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=await walk(path.join(root,'public'));
// Request the same versioned asset URLs as the published page. A bare CSS URL
// can legitimately retain the prior version in a browser/CDN cache for its TTL.
const assetUrls=new Map();
for(const file of files.filter(file=>file.endsWith('.html'))){
  for(const match of (await readFile(file,'utf8')).matchAll(/(?:src|href)=["'](\/[^"']*)["']/g)){
    const url=new URL(match[1].replaceAll('&amp;','&'),base);
    if(url.origin!==base.origin||!url.search)continue;
    const key=decodeURIComponent(url.pathname).replace(/^\//,'');
    assert.ok(!assetUrls.has(key)||assetUrls.get(key).href===url.href,'Conflicting asset versions: '+key);
    assetUrls.set(key,url);
  }
}
for(const file of files){
  const relative=path.relative(path.join(root,'public'),file).replaceAll('\\','/');
  if(relative.startsWith('_'))continue;
  const requestUrl=assetUrls.get(relative)||new URL('/'+relative,base);
  const response=await request(requestUrl,{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,relative);
  const body=Buffer.from(await response.arrayBuffer());
  const expected=await readFile(file);
  let compared=body,cloudflareAnalyticsScripts=0;
  if(relative.endsWith('.html')){
    // The custom zone may inject its own Cloudflare Web Analytics beacon. Allow
    // only the observed vendor URL/attribute format, record the transformation,
    // and require every remaining byte to match the exported WordPress page.
    const html=body.toString().replace(/<script type="module" src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js\/[a-z0-9]+" integrity="sha512-[A-Za-z0-9+/=]+" data-cf-beacon='[^']+' crossorigin="anonymous"><\/script>\n/g,()=>{cloudflareAnalyticsScripts++;return '';});
    assert.ok(cloudflareAnalyticsScripts<=1,'Unexpected repeated analytics injection');
    compared=Buffer.from(html);
  }
  assert.equal(createHash('sha256').update(compared).digest('hex'),createHash('sha256').update(expected).digest('hex'),'Published bytes '+relative);
  results.push({path:relative,requestPath:requestUrl.pathname+requestUrl.search,status:response.status,bytes:body.length,match:true,matchMode:cloudflareAnalyticsScripts?'content-exact-after-recorded-cloudflare-beacon-removal':'byte-exact',cloudflareAnalyticsScripts});
}
const missing=await request(new URL('/missing-acceptance-fb4d7c/',base));
assert.equal(missing.status,404);assert.match(await missing.text(),/這一球，出界了/);
const oldHome=await request(new URL('/home/',base),{redirect:'manual'});
assert.equal(oldHome.status,301);assert.equal(new URL(oldHome.headers.get('location'),base).pathname,'/');
const report={at:new Date().toISOString(),base:base.origin,resolver:edge?{kind:'authoritative-edge-override',ip:edge,tlsCertificateVerified:true}:{kind:'system-public-dns'},result:'pass',files:results,missingStatus:404,homeRedirect:301};
await mkdir(path.join(root,'test-results'),{recursive:true});
await writeFile(path.join(root,'test-results/http.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:'pass',files:results.length,missingStatus:404,homeRedirect:301}));
