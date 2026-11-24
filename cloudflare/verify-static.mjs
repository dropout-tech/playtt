import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)),'public'));
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=await walk(root);
assert.ok(files.length>30);
for(const file of files){
  assert.ok(!/\.(php|sqlite|sql|zip|env|toml|ya?ml)$/i.test(file),'Private/server file: '+file);
  if(!/\.(html|css|js|xml|txt)$/.test(file))continue;
  const text=await readFile(file,'utf8');
  assert.ok(!text.includes('127.0.0.1:')&&!text.includes('localhost:'),'Local address: '+file);
  if(!file.endsWith('.html'))continue;
  assert.ok(!text.includes('id="wpadminbar"'),'Admin session content');
  assert.ok(!text.includes('PLAYTT_PRIVATE_DRAFT'),'Draft leak');
  for (const image of text.matchAll(/<img\b[^>]*>/g)) {
    const src=image[0].match(/\bsrc="([^"]+)"/)?.[1];
    // Native core/image SVG blocks use the artwork's intrinsic viewBox ratio.
    // Raster images still require both explicit dimensions.
    if (src?.startsWith('/') && /\.svg(?:\?|$)/.test(src) && !/\b(?:width|height)=/.test(image[0])) {
      const svgPath=path.resolve(root,decodeURIComponent(new URL(src,'https://playtt.tw').pathname).slice(1));
      assert.ok(svgPath.startsWith(root+path.sep), 'SVG outside publication');
      const svg=await readFile(svgPath,'utf8');
      const viewBox=svg.match(/\bviewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/).map(Number);
      assert.ok(viewBox?.length===4 && viewBox.every(Number.isFinite) && viewBox[2]>0 && viewBox[3]>0, 'SVG intrinsic dimensions missing: '+src);
      continue;
    }
    assert.match(image[0], /\bwidth="[1-9]\d*"/, 'Image width missing: '+file);
    assert.match(image[0], /\bheight="[1-9]\d*"/, 'Image height missing: '+file);
  }
  for(const match of text.matchAll(/(?:src|href)=["'](\/[^"']*)["']/g)){
    const url=new URL(match[1],'https://playtt.tw');
    const relative=decodeURIComponent(url.pathname).replace(/^\//,'');
    const resolved=path.resolve(root,relative);assert.ok(resolved===root||resolved.startsWith(root+path.sep));
    const target=await stat(resolved);if(target.isDirectory())await stat(path.join(resolved,'index.html'));
  }
}
for(const slug of ['','about/','class/','coaches/','locations/','partner/']){
  const html=await readFile(path.join(root,slug,'index.html'),'utf8');
  assert.match(html,/<html lang="zh-TW"/);
  assert.match(html,/name="description"/);
  assert.ok(html.includes('https://playtt.tw'+('/'+slug)), 'Canonical');
  assert.ok(!/name=['"]robots['"][^>]*noindex/.test(html));
  assert.ok(html.includes('line.me/R/ti/p/@869usyqy'));
}
console.log(JSON.stringify({result:'pass',pages:6,files:files.length,scope:'Static publication integrity'}));
