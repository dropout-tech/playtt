// Isolated loader candidate, actual pinned PHP WASM. No deployed/runtime source edits.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
await access('artifacts/playtt-path-join-proof-owned-private.json').then(()=>{throw Error('Completed attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=(await readFile('src/playtt-php-loader.mjs','utf8')).replaceAll('\r\n','\n');
// Generated loader is separately pinned; it is not in the TypeScript source list.
const plan=JSON.parse(await readFile('artifacts/playtt-old-source-rollback-plan.json','utf8'));
assert.equal(sha(source),plan.generatedPhpLoaderSha256);
const old='current_path = PATH.join2(current_path, parts[i]);';
assert.equal(source.split(old).length,2);
const replacement="current_path = current_path === '/' ? '/' + parts[i] : current_path + '/' + parts[i];";
const candidate=source.replace(old,replacement),directory=await mkdtemp(resolve('artifacts/path-join-proof-'));
await writeFile(join(directory,'baseline-source.mjs'),source,{flag:'wx'});
await writeFile(join(directory,'candidate-source.mjs'),candidate,{flag:'wx'});
const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm');
const deployed=JSON.parse(await readFile('artifacts/playtt-old-provider-deploy-plan.json','utf8'));
assert.ok(deployed.targets.fallback.modules.some(x=>x.sha256===sha(wasmBytes)));
const wasm=await WebAssembly.compile(wasmBytes),observations=[];
async function run(label,text){
 assert.match(text,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
 const nodeSource="import {createRequire} from 'node:module';const require=createRequire(import.meta.url);\n"+text.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';");
 const path=join(directory,label+'-node.mjs');await writeFile(path,nodeSource,{flag:'wx'});
 const {init,dependenciesTotalSize}=await import(pathToFileURL(path));
 const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
 const module=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')],fs=module.FS;
 const out=[];
 const capture=(phase,path,opts)=>{
  try{const x=fs.lookupPath(path,{...opts});out.push({phase,input:path,opts,path:x.path,node:x.node?{name:x.node.name,mode:x.node.mode,size:x.node.usedBytes??null,link:x.node.link??null}:null});}
  catch(e){out.push({phase,input:path,opts,error:{name:e.name,errno:e.errno??null}});}
 };
 try{
  php.mkdir('/spec/a/b');php.mkdir('/spec/c');php.mkdir('/spec/空 白/子');php.mkdir('/spec/mount');
  php.writeFile('/spec/a/file','one');php.writeFile('/spec/c/two','two');php.writeFile('/spec/空 白/子/檔案.txt','繁體中文');
  fs.symlink('../c','/spec/a/relative');fs.symlink('/spec/c','/spec/absolute');fs.symlink('/spec/loop','/spec/loop');fs.symlink('/missing','/spec/broken');
  fs.mount(fs.filesystems.MEMFS,{},'/spec/mount');fs.writeFile('/spec/mount/inside',new Uint8Array([1,2,3]));fs.symlink('/spec/a','/spec/mount/link');
  const base=['','/','.','..','////','/spec','/spec/a','/spec/a/file','/spec/a/file/child','/spec/a/b/../file','/spec/a/relative/two','/spec/a/relative/../a/file','/spec/absolute/two','/spec/broken','/spec/broken/child','/spec/loop','/spec/mount','/spec/mount/inside','/spec/mount/link/file','/spec/空 白/子/檔案.txt','/spec/missing','/../../spec/a/file','/spec/a/./b/../../c/two'];
  const paths=[...new Set(base.flatMap(p=>[p,p+'/',p.replaceAll('/','//'),p.replaceAll('/','/./')]))];
  const options=[{}, {follow:true},{parent:true},{noent_okay:true},{follow_mount:false},{follow:true,noent_okay:true},{parent:true,follow_mount:false}];
  for(const cwd of ['/','/spec/a','/spec/mount']){
   fs.chdir(cwd);for(const path of paths)for(const opts of options)capture('initial:'+cwd,path,opts);
   for(const path of ['file','../c/two','relative/two','b/../file','../../spec/a/file'])for(const opts of options)capture('relative:'+cwd,path,opts);
  }
  fs.chdir('/');
  fs.rename('/spec/c/two','/spec/c/renamed');
  for(const p of ['/spec/a/relative/two','/spec/a/relative/renamed','/spec/absolute/renamed'])capture('rename',p,{follow:true});
  fs.unlink('/spec/absolute');fs.symlink('/spec/a','/spec/absolute');capture('retarget','/spec/absolute/file',{follow:true});
  fs.unlink('/spec/a/file');capture('unlink','/spec/absolute/file',{follow:true});
  fs.writeFile('/spec/a/file',new Uint8Array([9,8,7,6]));capture('recreate','/spec/absolute/file',{follow:true});
  fs.unmount('/spec/mount');capture('unmount','/spec/mount/inside',{});
  const result=await php.run({code:"<?php chdir('/spec/a'); file_put_contents('b/live.txt','繁中測試'); rename('b/live.txt','b/changed.txt'); echo json_encode([file_get_contents('b/changed.txt'),file_exists('../c/renamed'),readlink('../absolute'),realpath('b/../b/changed.txt')],JSON_UNESCAPED_UNICODE); unlink('b/changed.txt');"});
  assert.equal(result.exitCode,0);const native=JSON.parse(result.text);
  assert.deepEqual(native,['繁中測試',true,'/spec/a','/spec/a/b/changed.txt']);
  const pathsBench=['/spec/a/b','/spec/c/renamed','/spec/空 白/子/檔案.txt','/spec/absolute/file'];
  for(let i=0;i<1000;i++)fs.lookupPath(pathsBench[i%pathsBench.length],{follow:true});
  const times=[];for(let run=0;run<5;run++){const start=performance.now();for(let i=0;i<20000;i++)fs.lookupPath(pathsBench[i%pathsBench.length],{follow:true});times.push(performance.now()-start);}
  observations.push({label,cases:out.length,resultSha256:sha(JSON.stringify(out)),native,lookupBenchmark:{runs:5,lookupsPerRun:20000,wallMs:times,scope:'Local Node diagnostic only; fixed order, no provider/whole-request performance claim'}});
  return out;
 }finally{php.exit();}
}
const a=await run('baseline',source),b=await run('candidate',candidate);
assert.deepEqual(b,a);
const report={schema:'playtt/path-join-proof/v1',at:new Date().toISOString(),result:'pass',scope:'Isolated single-line lookupPath candidate against actual pinned PHP web WASM; source runtime unchanged, no WordPress/browser/provider candidate run yet',baselineSha256:sha(source),candidateSha256:sha(candidate),wasmSha256:sha(wasmBytes),changedStatements:1,observations,semanticCasesExact:true,cloudRequests:0,productionChanged:false};
await writeFile('artifacts/playtt-path-join-proof.json',JSON.stringify(report,null,2)+'\n');
await writeFile('artifacts/playtt-path-join-proof-owned-private.json',JSON.stringify({directory,baselineSha256:sha(source),candidateSha256:sha(candidate),phase:'verified'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report));
