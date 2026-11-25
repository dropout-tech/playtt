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
 const result=await php.run({code:String.raw`<?php
define('ABSPATH','/wordpress/');
require '${plugin}inc/class-wp-markdown-frontmatter-profiles.php';
require '${plugin}inc/class-wp-markdown-storage.php';
$cases=['plain'=>"Body",'one-newline'=>"Body\n",'two-newlines'=>"Body\n\n",'trailing-space-tab'=>"Body \t",'leading-blank'=>"\nBody",'whitespace-only'=>" \t\n",'empty'=>''];$out=[];
foreach($cases as$name=>$body){
 $root='/tmp/whitespace-'.$name;$writer=new WP_Markdown_Storage($root);$post=(object)['ID'=>140,'post_title'=>'Whitespace fixture','post_content'=>$body,'post_status'=>'draft','post_type'=>'page','post_name'=>'fixture'];
 $file=$writer->write_post($post);if(!is_string($file))throw new RuntimeException('Export failed');
 $raw=file_get_contents($file);if(!str_ends_with($raw,$body."\n"))throw new RuntimeException('Source bytes did not survive export');
 $reader=new WP_Markdown_Storage($root);$posts=array_values($reader->get_all_posts(false));if(count($posts)!==1)throw new RuntimeException('Import count mismatch');
 $full=$posts[0]->post_content;$lazy=$reader->read_content_from_file($file);
 if($full!==rtrim($body)||$lazy!==rtrim($body))throw new RuntimeException('Unexpected behavior beyond pinned rtrim');
 $out[]=['case'=>$name,'inputBytes'=>strlen($body),'fullBytes'=>strlen($full),'lazyBytes'=>strlen($lazy),'equal'=>$full===$body&&$lazy===$body,'trailingBytesLost'=>strlen($body)-strlen($full),'exportBytesPreserved'=>true];
}
echo json_encode($out,JSON_THROW_ON_ERROR);`});
 assert.equal(result.exitCode,0,result.errors);const cases=JSON.parse(result.text);assert.equal(cases.filter(x=>!x.equal).length,4);
 const report={at:new Date().toISOString(),result:'reproduced',scope:'Actual pinned PHP-WASM/MDI baseline: write_post retains bytes in Markdown, both full parse and lazy content read rtrim trailing whitespace. No code fix or remote mutation.',cases};
 await writeFile('artifacts/playtt-history-whitespace-reproduction.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{php.exit();}
