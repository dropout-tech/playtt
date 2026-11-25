// Local extension of the verified buffered ZIP reader to two owned boot assets.
// The remote component importer and all validation remain unchanged.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import ts from 'typescript';
import {build} from 'esbuild';
import {sources as bufferedSources,sha} from './playtt-buffered-zip-common.mjs';
export {sha};
export const previous=resolve('../../../playtt-buffered-zip-build');
export async function sources(){
 const manifest=JSON.parse(await readFile(resolve(previous,'build-inputs.json'),'utf8'));
 assert.equal(manifest.files.length,208);
 const file=async path=>{const bytes=await readFile(resolve(previous,path));assert.equal(sha(bytes),manifest.files.find(f=>f.path===path)?.sha256,path);return bytes;};
 const original=(await file('src/worker.ts')).toString('utf8');
 const zip=await bufferedSources();assert.equal(sha(await file('src/playtt-buffered-zip.mjs')),zip.moduleSha256);
 const replacements=[
  ['import { decodeZip } from "@php-wasm/stream-compression"','import { decodeZip } from "@php-wasm/stream-compression"\nimport { decodeZipFromBytes } from "./playtt-buffered-zip.mjs"'],
  ['decodeZip(new Blob([canonicalMarkdownSeed]).stream())','decodeZipFromBytes(new Uint8Array(canonicalMarkdownSeed))'],
  ['decodeZip(new Blob([markdownDatabaseIntegrationRuntime]).stream())','decodeZipFromBytes(new Uint8Array(markdownDatabaseIntegrationRuntime))'],
 ];
 let candidate=original;for(const [from,to]of replacements){assert.equal(candidate.split(from).length,2);candidate=candidate.replace(from,to);}
 const declaration='export function decodeZipFromBytes(input: Uint8Array): ReadableStream<File> & AsyncIterable<File>;\n';
 const assets={};for(const name of ['markdown-database-integration-canonical-seed.zip','markdown-database-integration-canonical-seed.json','markdown-database-integration-runtime.zip'])assets[name]=await file('assets/'+name);
 const extraction=text=>{
  const parsed=ts.createSourceFile('worker.ts',text,ts.ScriptTarget.Latest,true),names=['packagedCanonicalMarkdownSeed','sha256Hex','materializeMarkdownDatabaseIntegration'];
  const functions=names.map(name=>{const nodes=parsed.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.equal(nodes.length,1);return nodes[0].getText(parsed);});
  const revision=text.match(/const MARKDOWN_DATABASE_INTEGRATION_REVISION = "([a-f0-9]+)"/);assert.ok(revision);
  return `import {decodeZip} from '@php-wasm/stream-compression';\nimport {decodeZipFromBytes} from './playtt-buffered-zip.mjs';\nlet canonicalMarkdownSeed, canonicalMarkdownSeedManifest, markdownDatabaseIntegrationRuntime;\nconst MARKDOWN_DATABASE_INTEGRATION_REVISION=${JSON.stringify(revision[1])};\n`+functions.join('\n')+`\nexport async function seed(bytes,manifest){canonicalMarkdownSeed=bytes;canonicalMarkdownSeedManifest=manifest;return packagedCanonicalMarkdownSeed();}\nexport async function mdi(php,bytes){markdownDatabaseIntegrationRuntime=bytes;return materializeMarkdownDatabaseIntegration(php);}\n`;
 };
 return {original,candidate,declaration,replacements,assets,module:zip.module,moduleSha256:zip.moduleSha256,upstreamSha256:zip.upstreamSha256,originalSha256:sha(original),candidateSha256:sha(candidate),baselineFixture:extraction(original),candidateFixture:extraction(candidate)};
}
export async function compile(variant,entry){
 assert.ok(['baseline','candidate'].includes(variant));const input=await sources();
 const module=variant==='baseline'?input.baselineFixture:input.candidateFixture;
 return build({stdin:{contents:entry??module,sourcefile:'boot-zip-fixture.ts',resolveDir:resolve('src'),loader:'ts'},bundle:true,write:false,format:'esm',target:'es2022',keepNames:true,logLevel:'error',plugins:[{name:'boot-zip-owned-assets',setup(b){
  b.onResolve({filter:/^boot-zip-module$/},()=>({path:'boot-zip',namespace:'boot-zip'}));b.onLoad({filter:/.*/,namespace:'boot-zip'},()=>({contents:module,loader:'ts',resolveDir:resolve('src')}));
  b.onResolve({filter:/playtt-buffered-zip\.mjs$/},()=>({path:'zip',namespace:'buffered-zip'}));b.onLoad({filter:/.*/,namespace:'buffered-zip'},()=>({contents:input.module,loader:'js'}));
 }}]});
}
export async function api(variant){const result=await compile(variant);return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}
