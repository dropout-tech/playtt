import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
import {patchPlayttEmptySlugPersistence} from '../src/playtt-slug-policy.ts';
import {patchPlayttAutoDraftPersistence} from '../src/playtt-auto-draft-policy.ts';

const source=await readFile('src/playtt-php-loader.mjs','utf8');
assert.match(source,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-slug-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+source.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-slug-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
const plugin='/wordpress/wp-content/plugins/markdown-database-integration/';
const entries=[];
for await(const entry of decodeZip(new Blob([await readFile('assets/markdown-database-integration-runtime.zip')]).stream())){
 if(entry.name.endsWith('.php'))entries.push({path:plugin+entry.name,bytes:new Uint8Array(await entry.arrayBuffer())});
}
const reports=[];
for(const patched of [false,true]){
 const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
 try{
  for(const entry of entries){php.mkdir(entry.path.slice(0,entry.path.lastIndexOf('/')));php.writeFile(entry.path,entry.bytes);}
  patchPlayttAutoDraftPersistence(php);
  if(patched){
   const file=plugin+'inc/class-wp-markdown-storage.php',original=php.readFileAsBuffer(file).slice();
   php.writeFile(file,new TextDecoder().decode(original).replace("if ( '' === $post->post_name && '' !== $file_path ) {","if ( false ) {"));
   let writes=0;assert.throws(()=>patchPlayttEmptySlugPersistence({readFileAsBuffer:p=>php.readFileAsBuffer(p),writeFile:()=>{writes++;}}),/anchor is not unique/);assert.equal(writes,0);
   php.writeFile(file,original);patchPlayttEmptySlugPersistence(php);
  }
  const result=await php.run({code:String.raw`<?php
define('ABSPATH','/wordpress/');
require '${plugin}inc/class-wp-markdown-frontmatter-profiles.php';
require '${plugin}inc/class-wp-markdown-storage.php';
$patched=${patched?'true':'false'};$checks=[];
function ok($condition,$label){global $checks;if(!$condition)throw new RuntimeException($label);$checks[]=$label;}
$root='/tmp/slug-check';mkdir($root);$store=new WP_Markdown_Storage($root);
$parse=new ReflectionMethod(WP_Markdown_Storage::class,'parse_file');$parse->setAccessible(true);
foreach(['native','okf']as$profile){
 foreach(['draft','auto-draft']as$status){
  foreach(['','explicit-slug','0']as$slug){
   $case=$profile.'-'.$status.'-'.($slug===''?'empty':$slug);$dir=$root.'/'.$case;mkdir($dir);
   $fm=$profile==='native'?"id: 126\ntitle: Test\nstatus: $status\ntype: page\nslug: \"$slug\"":"type: document\ntitle: Test\nwordpress:\n  id: 126\n  status: $status\n  type: page\n  slug: \"$slug\"";
   $file=$dir.'/126.md';file_put_contents($file,"---\n$fm\n---\n\nTest content");
   foreach([false,true]as$metadata){$post=$parse->invoke($store,$file,$metadata);$expected=$slug===''&&!$patched?'126':$slug;ok($post->post_name===$expected,$case.($metadata?' metadata':' full'));ok($post->ID===126&&$post->post_status===$status,$case.' identity');}
  }
 }
 foreach(['my-topic.md','parent/index.md']as$name){
  $dir=$root.'/'.$profile.'-missing';if(!is_dir($dir))mkdir($dir);if(str_contains($name,'/'))mkdir($dir.'/parent');
  $fm=$profile==='native'?"id: 201\ntitle: Dropped":"type: document\ntitle: Dropped\nwordpress:\n  id: 201";
  $file=$dir.'/'.$name;file_put_contents($file,"---\n$fm\n---\n\nBody");$post=$parse->invoke($store,$file,false);ok($post->post_name===(str_contains($name,'/')?'parent':'my-topic'),$profile.' omitted slug derives '.$name);
 }
}
// Public export -> new storage object -> full and metadata-only import.
foreach(['draft','auto-draft']as$status){
 $dir='/tmp/roundtrip-'.$status;$writer=new WP_Markdown_Storage($dir);$original=(object)['ID'=>126,'post_title'=>'Unsaved slug','post_content'=>'Round trip','post_status'=>$status,'post_type'=>'page','post_name'=>''];
 $file=$writer->write_post($original);ok(is_string($file),'public export '.$status);
 foreach([false,true]as$metadata){$reader=new WP_Markdown_Storage($dir);$posts=$reader->get_all_posts($metadata);ok(count($posts)===1,'public import count '.$status);$post=array_values($posts)[0];ok($post->post_name===($patched?'':'126'),'public roundtrip empty slug '.$status.($metadata?' metadata':' full'));ok($post->ID===126&&$post->post_status===$status,'public roundtrip identity '.$status);if(!$metadata)ok($post->post_content==='Round trip','public roundtrip content '.$status);}
}
echo json_encode(['patched'=>$patched,'result'=>'pass','checks'=>$checks]);`});
  assert.equal(result.exitCode,0,result.errors+' '+result.text);reports.push(JSON.parse(result.text));
 }finally{php.exit();}
}
const report={at:new Date().toISOString(),result:'pass',scope:'Actual pinned PHP-WASM and MDI: baseline reproduces empty slug changing to filename; fixed native/OKF parse and public storage roundtrips preserve empty values and retain omitted-slug fallback. No remote changes.',reports};
await writeFile('artifacts/playtt-slug-php.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({at:report.at,result:report.result,checks:reports.map(r=>({patched:r.patched,count:r.checks.length}))}));
