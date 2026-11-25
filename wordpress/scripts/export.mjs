// Export public WordPress rendering. This does not host wp-admin on Cloudflare.
import { boot, php, root } from './boot.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const output=path.join(root,'dist/static-'+Date.now());
const sitePath=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'.runtime/export-'+Date.now()+'/wordpress');
const canonical='https://playtt.tw';
const origin='http://127.0.0.1:9422';
const pages=JSON.parse(await readFile(path.join(root,'lets-play/inc/pages.json'),'utf8'));
const routes=pages.map(p=>p.slug==='home'?'/':'/'+p.slug+'/');
// A missing numeric page avoids WordPress' slug-guess canonical redirects.
const missingRoute='/?page_id=2147483647';
const assets=new Set(),manifest=[];
await mkdir(path.dirname(sitePath),{recursive:true});
await mkdir(output,{recursive:true});
if(!process.argv[2]) execFileSync('tar',['-xf',path.join(root,'.runtime/wordpress.zip'),'-C',path.dirname(sitePath)]);
let server;
function rewrite(text){return text.replaceAll(origin,'').replaceAll(origin.replaceAll('/','\\/'),'').replaceAll('http://localhost:9422','');}
async function save(relative, data){
  const full=path.resolve(output,relative);assert.ok(full.startsWith(output+path.sep));
  await mkdir(path.dirname(full),{recursive:true});await writeFile(full,data);
  manifest.push({path:relative.replaceAll('\\','/'),bytes:Buffer.byteLength(data),sha256:createHash('sha256').update(data).digest('hex')});
}
function discover(text,base='/'){
  const clean=text.replaceAll('\\/','/');
  const matches=[...clean.matchAll(/(?:https?:\/\/127\.0\.0\.1:9422)?(\/wp-(?:content|includes)\/[^\s"'<>\\)]+\.(?:css|js|mjs|webp|png|jpg|jpeg|svg|woff2?|ttf)(?:\?[^\s"'<>\\)]*)?)/g)].map(m=>m[0]);
  for(const m of clean.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g))if(!m[1].startsWith('data:'))matches.push(m[1]);
  for(const m of clean.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g))if(m[1].startsWith('.'))matches.push(m[1]);
  for(const value of matches){const url=new URL(value,origin+base);if(url.origin===origin) assets.add(url.pathname);}
}
try{
  server=await boot(9422,{sitePath,login:false});
  await php(server,`wp_set_current_user(1); update_option('blog_public',1); update_option('WPLANG','zh_TW'); update_option('default_comment_status','closed');`);
  // Playground emits a one-time self redirect after boot. Consume that startup
  // response, then reject redirects while exporting real routes.
  const warmup=await fetch(origin+'/',{redirect:'manual'});
  if(warmup.status===302) assert.equal(new URL(warmup.headers.get('location'),origin).href,origin+'/');
  else assert.equal(warmup.status,200);
  await warmup.arrayBuffer();
  for(const route of [...routes,missingRoute]){
    const response=await fetch(origin+route,{redirect:'manual'});const is404=route===missingRoute;assert.equal(response.status,is404?404:200,JSON.stringify({route,status:response.status,location:response.headers.get('location')}));
    let html=await response.text();assert.ok(!html.includes('id="wpadminbar"'),'Anonymous export must not include admin toolbar');
    if(!is404) assert.equal(html.match(/<link\s+rel=['"]canonical['"]\s+href=['"]([^'"]+)/i)?.[1],origin+route,'Canonical must match requested route');
    assert.ok(!/name=['"]robots['"][^>]*noindex/.test(html)||is404,'Public pages must be indexable');
    discover(html,route);html=rewrite(html);
    // Remove dynamic endpoints and alternate feeds unavailable in a static publication.
    html=html.replace(/<link\b[^>]*(?:api\.w\.org|application\/json|application\/rsd\+xml|application\/rss\+xml|application\/atom\+xml|wp-json|xmlrpc\.php)[^>]*>\s*/gi,'');
    html=html.replace(/<link\b[^>]*rel=['"]shortlink['"][^>]*>\s*/gi,'');
    html=html.replace(/<link\b[^>]*rel=['"]dns-prefetch['"][^>]*>\s*/gi,'');
    html=html.replace(/(<link\s+rel=["']canonical["']\s+href=["'])(\/[^"']*)/gi,'$1'+canonical+'$2');
    html=html.replace(/(<meta\s+property=["']og:(?:url|image)["']\s+content=["'])(\/[^"']*)/gi,'$1'+canonical+'$2');
    html=html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g,(_,start,json,end)=>{
      const data=JSON.parse(json);data.url=canonical+'/';return start+JSON.stringify(data)+end;
    });
    // Navigation uses WordPress' native interactive blocks and its generated import map.
    if(html.includes('127.0.0.1')||html.includes('localhost')) console.error(html.match(/.{0,90}(?:127\.0\.0\.1|localhost).{0,160}/g));
    assert.ok(!html.includes('127.0.0.1')&&!html.includes('localhost'),'No local URLs');
    await save(is404?'404.html':route==='/'?'index.html':route.slice(1)+'index.html',html.replace(/[\t ]+$/gm,''));
  }
  // Walk asset dependencies: CSS URLs and WordPress import-map/module URLs.
  const done=new Set();
  while([...assets].some(a=>!done.has(a))){
    const next=[...assets].filter(a=>!done.has(a));
    for(const file of next){
      done.add(file);assert.ok(file.startsWith('/wp-content/')||file.startsWith('/wp-includes/'));
      const response=await fetch(origin+file);assert.equal(response.status,200,'Asset '+file);
      const binary=Buffer.from(await response.arrayBuffer());
      let data=binary;
      if(/\.(css|m?js)$/.test(file)){let text=binary.toString();discover(text,file);data=rewrite(text);}
      await save(file.slice(1),data);
    }
  }
  await save('robots.txt','User-agent: *\nAllow: /\nSitemap: '+canonical+'/sitemap.xml\n');
  await save('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>'<url><loc>'+canonical+r+'</loc></url>').join('')+'</urlset>\n');
  await save('_redirects','/home / 301\n/home/ / 301\n');
  await save('_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n/wp-content/*\n  Cache-Control: public, max-age=3600\n/wp-includes/*\n  Cache-Control: public, max-age=86400\n');
  await mkdir(path.join(root,'test-results'),{recursive:true});
  await writeFile(path.join(root,'test-results/export.json'),JSON.stringify({at:new Date().toISOString(),scope:'Anonymous static publication only',output,routes,assets:done.size,manifest},null,2)+'\n');
  console.log(JSON.stringify({output,pages:routes.length,assets:done.size}));
}finally{if(server)await server[Symbol.asyncDispose]();}
