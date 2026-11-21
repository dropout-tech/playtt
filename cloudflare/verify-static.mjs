import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
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
