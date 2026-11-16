import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const base=new URL(process.argv[2]||'http://127.0.0.1:9423');
const results=[];
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
for(const file of await walk(path.join(root,'public'))){
  const relative=path.relative(path.join(root,'public'),file).replaceAll('\\','/');
  if(relative.startsWith('_'))continue;
  const response=await fetch(new URL('/'+relative,base),{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,relative);
  const body=Buffer.from(await response.arrayBuffer());
  const expected=await readFile(file);
  assert.equal(createHash('sha256').update(body).digest('hex'),createHash('sha256').update(expected).digest('hex'),'Published bytes '+relative);
  results.push({path:relative,status:response.status,bytes:body.length,match:true});
}
const missing=await fetch(new URL('/missing-acceptance-fb4d7c/',base));
assert.equal(missing.status,404);assert.match(await missing.text(),/這一球，出界了/);
const oldHome=await fetch(new URL('/home/',base),{redirect:'manual'});
assert.equal(oldHome.status,301);assert.equal(new URL(oldHome.headers.get('location'),base).pathname,'/');
const report={at:new Date().toISOString(),base:base.origin,result:'pass',files:results,missingStatus:404,homeRedirect:301};
await mkdir(path.join(root,'test-results'),{recursive:true});
await writeFile(path.join(root,'test-results/http.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:'pass',files:results.length,missingStatus:404,homeRedirect:301}));
