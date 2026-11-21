// Differential validation of real baseline/candidate exports. No PHP or network.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const check=process.argv.includes('--check'),sha=b=>createHash('sha256').update(b).digest('hex');
const baselineSource=(await readFile('src/wp-content-persistence.ts','utf8')).replaceAll('\r\n','\n');
const candidateSource=(await readFile('scripts/playtt-owned-paths-candidate.ts','utf8')).replaceAll('\r\n','\n');
assert.equal(sha(baselineSource),'0f67fe2b2e198b9665c0d9d1858d7557ab552d877b5165b89c47c9e719546a5d');
assert.equal(sha(candidateSource),'b95446e9faeb1813fb25083421923f553fa45b83772733bce083f92b1c066198');
async function compile(source){const result=await build({stdin:{contents:source,loader:'ts',sourcefile:'wp-content-persistence.ts',resolveDir:resolve('src')},bundle:true,write:false,format:'esm',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}
const original=await compile(baselineSource),candidate=await compile(candidateSource);
const resultOf=fn=>{try{return{ok:true,value:fn()};}catch(e){return{ok:false,name:e.name,message:e.message};}};
let comparisons=0,preparedComparisons=0;const cases={};
function same(name,fn,args){const a=resultOf(()=>original[fn](...args)),b=resultOf(()=>candidate[fn](...args));assert.deepEqual(b,a,name);comparisons++;cases[name]=(cases[name]||0)+1;return a;}
const ownLists=[[],['plugins/example-runtime/'],['mu-plugins/owned.php'],['plugins/example-runtime','plugins/example-runtime/','plugins/example-runtime'],['plugins/繁體/','mu-plugins/空 白.php']];
const paths=['','plugins/','themes/','languages/','mu-plugins/','uploads/a.png','/themes/a.css','themes/a.css/','themes//a.css','themes/./a.css','themes/../a.css','themes/a\\b.css','themes/繁體/空 白.css','plugins/example-runtime','plugins/example-runtime/a.php','plugins/example-runtime-other/a.php','mu-plugins/owned.php','mu-plugins/owned.php/child','mu-plugins/owned.php.bak','plugins/markdown-database-integration/owned.php','plugins/sqlite-database-integration/owned.php','mu-plugins/wp-codebox-cloudflare-canonical-changes.php','themes/a\0b.css'];
for(const root of ['plugins','themes','languages','mu-plugins','outside'])for(const mid of ['one','..','.','','繁中','a b','a\\b'])for(const tail of ['file.php','','.','..'])paths.push(`${root}/${mid}/${tail}`);
for(const additional of ownLists){
 const normalized=original.runtimeOwnedWpContentPaths(additional),prepared=candidate.prepareRuntimeOwnedWpContentPaths(additional);
 assert.deepEqual(prepared,normalized);assert.ok(Object.isFrozen(prepared));assert.notEqual(prepared,additional);
 for(const path of paths){
  same('path-unprepared','isCanonicalWpContentPath',[path,additional]);
  assert.deepEqual(resultOf(()=>candidate.isCanonicalWpContentPath(path,prepared)),resultOf(()=>original.isCanonicalWpContentPath(path,additional)));preparedComparisons++;
 }
}
const invalidOwned=['','plugins/','mu-plugins/','themes/a/','languages/a','/plugins/a','plugins/../a','plugins/./a','plugins/a//','plugins/a\\b','plugins//a'];
for(const path of invalidOwned){
 const owned=[path];assert.throws(()=>candidate.prepareRuntimeOwnedWpContentPaths(owned));
 for(const frozen of [owned,Object.freeze([...owned])]){
  same('invalid-owned','isCanonicalWpContentPath',['themes/good.css',frozen]);
  same('invalid-canonical-short-circuit','isCanonicalWpContentPath',['../outside',frozen]);
  same('empty-metadata-short-circuit','validateWpContentMetadata',[[],frozen]);
  same('empty-tombstone-short-circuit','validateWpContentDeletedPaths',[[],frozen]);
 }
}
// Ordinary callers remain mutable; preparation is an explicit independent snapshot.
const mutable=['plugins/first/'];const prepared=candidate.prepareRuntimeOwnedWpContentPaths(mutable);
for(const entry of ['plugins/second/','plugins/../invalid','plugins/final/']){
 mutable[0]=entry;
 for(const path of ['plugins/first/file.php','plugins/second/file.php','themes/file.css'])same('mutated-owned','isCanonicalWpContentPath',[path,mutable]);
 assert.equal(candidate.isCanonicalWpContentPath('plugins/first/file.php',prepared),false);
}
assert.throws(()=>prepared.push('plugins/new/'),TypeError);assert.throws(()=>{prepared[0]='themes/new/';},TypeError);assert.throws(()=>Object.setPrototypeOf(prepared,[]),TypeError);
const fresh=candidate.runtimeOwnedWpContentPaths(['plugins/x/']);fresh.push('themes/invalid/');same('returned-array-not-trusted','isCanonicalWpContentPath',['themes/good.css',fresh]);
const cloned=[...prepared];cloned.push('themes/invalid/');same('cloned-array-not-trusted','isCanonicalWpContentPath',['themes/good.css',Object.freeze(cloned)]);
const forged=Object.freeze(['themes/invalid/']);same('frozen-array-not-trusted','isCanonicalWpContentPath',['themes/good.css',forged]);
// Unprepared iterables/getters keep the original iteration and validation path.
for(const fn of ['isCanonicalWpContentPath','runtimeOwnedWpContentPaths']){
 const execute=api=>{const events=[];const values=['plugins/a/','plugins/b/'];const input={*[Symbol.iterator](){for(const v of values){events.push(v);yield v;}}};const value=resultOf(()=>fn==='isCanonicalWpContentPath'?api[fn]('themes/a.css',input):api[fn](input));return{events,value};};
 assert.deepEqual(execute(candidate),execute(original));comparisons++;cases['unprepared-custom-iterator']=(cases['unprepared-custom-iterator']||0)+1;
}
const hash='a'.repeat(64),site={id:'fixture',hostname:'fixture.invalid',origin:'https://fixture.invalid'};
const valid={path:'themes/fixture/style.css',size:1,sha256:hash,objectKey:`sites/fixture/wp-content/objects/${hash}`};
const metadata=[[],[valid],[null],{},[{path:'themes/a',size:-1}],[{path:'themes/a',size:1.5}],[{path:'themes/a',size:NaN}],[{path:'themes/a',size:8*1024*1024+1}],[valid,valid],[{...valid,path:'plugins/example-runtime/a.php'}],Array.from({length:5001},(_,i)=>({path:`themes/t/${i}`,size:0})),Array.from({length:9},(_,i)=>({path:`themes/t/${i}`,size:8*1024*1024}))];
const tombstones=[[],['themes/a.css'],['themes/a.css','themes/b.css'],['themes/z','themes/a'],['themes/a','themes/a'],['plugins/example-runtime/a.php'],[null],{},Array.from({length:5001},(_,i)=>`themes/${String(i).padStart(5,'0')}`)];
for(const owned of ownLists){
 const prepared=candidate.prepareRuntimeOwnedWpContentPaths(owned);
 for(const value of metadata){
  same('metadata','validateWpContentMetadata',[value,owned]);
  assert.deepEqual(resultOf(()=>candidate.validateWpContentMetadata(value,prepared)),resultOf(()=>original.validateWpContentMetadata(value,owned)));preparedComparisons++;
 }
 for(const value of tombstones){
  same('tombstone','validateWpContentDeletedPaths',[value,owned]);
  assert.deepEqual(resultOf(()=>candidate.validateWpContentDeletedPaths(value,prepared)),resultOf(()=>original.validateWpContentDeletedPaths(value,owned)));preparedComparisons++;
 }
 for(const value of [[valid],[{...valid,sha256:'bad'}],[{...valid,objectKey:`sites/other/wp-content/objects/${hash}`}],[{...valid,objectKey:`sites/fixture/uploads/objects/${hash}`}],[]]){
  same('manifest','validateWpContentManifestFiles',[value,site,owned]);
  assert.deepEqual(resultOf(()=>candidate.validateWpContentManifestFiles(value,site,prepared)),resultOf(()=>original.validateWpContentManifestFiles(value,site,owned)));preparedComparisons++;
 }
}
// A frozen array alone does not make mutable string-like objects safe.
const impostor={toString:()=> 'plugins/spoofed/',includes:()=>false,split:()=>['plugins','spoofed',''],endsWith:()=>true};
for(const value of [impostor,new String('plugins/boxed/')]){
 same('ordinary-string-like-compatibility','isCanonicalWpContentPath',['themes/a.css',[value]]);
 assert.throws(()=>candidate.prepareRuntimeOwnedWpContentPaths([value]),{name:'TypeError',message:'Prepared runtime-owned paths must contain strings.'});
}
const report={schema:'playtt/owned-paths-check/v1',result:'pass',baselineSha256:sha(baselineSource),candidateSha256:sha(candidateSource),comparisons,preparedComparisons,cases,preparedSnapshotImmutable:true,preparedElementsMustBePrimitiveStrings:true,stringLikeObjectsRejected:2,unpreparedMutableAndUntrustedInputsRevalidated:true,ordinaryApiReturnsFreshMutableArray:true,validationLimitsUnchanged:true,cloudRequests:0,centralSourceChanged:false};
const path='artifacts/playtt-owned-paths-check-v2.json',serialized=JSON.stringify(report,null,2)+'\n';
if(check)assert.equal(await readFile(path,'utf8'),serialized);else await writeFile(path,serialized,{flag:'wx'});
console.log(JSON.stringify(report));
