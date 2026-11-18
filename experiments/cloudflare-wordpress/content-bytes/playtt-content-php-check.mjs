import {patchPlayttContentPersistence} from '../src/playtt-content-policy.ts';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';

const source=await readFile('src/playtt-php-loader.mjs','utf8');
assert.match(source,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-history-whitespace-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+source.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-history-whitespace-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
const plugin='/wordpress/wp-content/plugins/markdown-database-integration/';
const entries=[];
for await(const entry of decodeZip(new Blob([await readFile('assets/markdown-database-integration-runtime.zip')]).stream())){
 if(entry.name.endsWith('.php'))entries.push({path:plugin+entry.name,bytes:new Uint8Array(await entry.arrayBuffer())});
}
const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
try{
 for(const entry of entries){php.mkdir(entry.path.slice(0,entry.path.lastIndexOf('/')));php.writeFile(entry.path,entry.bytes);}
 patchPlayttContentPersistence(php);
 let writes=0;assert.throws(()=>patchPlayttContentPersistence({readFileAsBuffer:p=>php.readFileAsBuffer(p),writeFile:()=>{writes++;}}),/anchor is not unique/);assert.equal(writes,0);
 const result=await php.run({code:String.raw`<?php
define('ABSPATH','/wordpress/');
require '${plugin}inc/class-wp-markdown-frontmatter-profiles.php';
require '${plugin}inc/class-wp-markdown-storage.php';
$cases=['plain'=>"Body",'one-newline'=>"Body\n",'two-newlines'=>"Body\n\n",'trailing-space-tab'=>"Body \t",'leading-blank'=>"\nBody",'whitespace-only'=>" \t\n",'empty'=>'','crlf'=>"Body\r\n",'unicode'=>"繁體中文 <p>還原 &amp; 保存</p>\n",'leading-trailing'=>"\n\nBody\n\n",'nul'=>"Body\0"];$checks=0;$roundtrips=[];
function ok($value,$label){global $checks;if(!$value)throw new RuntimeException($label);$checks++;}
foreach(['native','okf']as$profile){foreach($cases as$name=>$body){
 $root='/tmp/content-'.$profile.'-'.$name;$writer=new WP_Markdown_Storage($root);$writer->set_frontmatter_profile($profile);$post=(object)['ID'=>140,'post_title'=>'Content fixture','post_content'=>$body,'post_status'=>'draft','post_type'=>'page','post_name'=>'fixture'];
 $file=$writer->write_post($post);ok(is_string($file),'export');$raw=file_get_contents($file);ok(str_ends_with($raw,$body."\n"),'export bytes');ok(str_contains($raw,'__playtt_content:'),'marker');
 $reader=new WP_Markdown_Storage($root);$posts=array_values($reader->get_all_posts(false));ok(count($posts)===1,'full count');ok($posts[0]->post_content===$body,'full exact bytes');ok($reader->read_content_from_file($file)===$body,'lazy exact bytes');
 $metaReader=new WP_Markdown_Storage($root);$meta=array_values($metaReader->get_all_posts(true));ok(count($meta)===1&&$meta[0]->post_content===''&&$meta[0]->ID===140,'metadata lazy import');
 $legacy=preg_replace('/^__playtt_content:.*\n/m','',$raw);ok($legacy!==$raw,'legacy marker removed');file_put_contents($file,$legacy);$legacyReader=new WP_Markdown_Storage($root);$legacyPosts=array_values($legacyReader->get_all_posts(false));ok($legacyPosts[0]->post_content===rtrim($body),'legacy full semantics');ok($legacyReader->read_content_from_file($file)===rtrim($body),'legacy lazy semantics');
 $roundtrips[]=['profile'=>$profile,'case'=>$name,'bytes'=>strlen($body),'fullExact'=>true,'lazyExact'=>true,'legacyUnchanged'=>true];
}}
// Both loading paths must reject corruption instead of silently trimming it.
$root='/tmp/content-corrupt';$writer=new WP_Markdown_Storage($root);$file=$writer->write_post((object)['ID'=>141,'post_title'=>'Corruption fixture','post_content'=>"Body\n",'post_status'=>'draft','post_type'=>'page','post_name'=>'corrupt']);$raw=file_get_contents($file);
$bad=['missing-frame-lf'=>substr($raw,0,-1),'body-changed'=>str_replace("Body\n","Bodz\n",$raw),'extra-whitespace'=>$raw." ",'wrong-length'=>str_replace('v1:5:','v1:4:',$raw),'unknown-version'=>str_replace('v1:5:','v2:5:',$raw)];
foreach($bad as$name=>$value){ok($value!==$raw,'fixture changed');file_put_contents($file,$value);foreach(['full','lazy']as$mode){$reader=new WP_Markdown_Storage($root);$failed=false;try{if($mode==='full')$reader->get_all_posts(false);else$reader->read_content_from_file($file);}catch(RuntimeException $e){$failed=str_contains($e->getMessage(),'PLAYTT content');}ok($failed,'reject '.$name.' '.$mode);}}
echo json_encode(['checks'=>$checks,'roundtrips'=>$roundtrips,'corruptionCases'=>count($bad)],JSON_THROW_ON_ERROR);`});
 assert.equal(result.exitCode,0,result.errors);const detail=JSON.parse(result.text);assert.equal(detail.roundtrips.length,22);assert.equal(detail.corruptionCases,5);
 const report={at:new Date().toISOString(),result:'pass',scope:'Actual pinned PHP-WASM/MDI byte-exact full and lazy reads, unchanged unmarked legacy semantics, and corruption rejection for marked new writes; no remote mutation.',...detail};
 await writeFile('artifacts/playtt-content-php-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'pass',checks:detail.checks,roundtrips:22,corruptionCases:5,atomicAnchorGuard:true}));
}finally{php.exit();}
