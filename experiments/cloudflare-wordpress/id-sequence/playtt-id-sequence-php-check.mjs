import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {PLAYTT_ID_SEQUENCES_PHP,patchPlayttIdSequences} from '../src/playtt-id-sequences.ts';
import {decodeZip} from '@php-wasm/stream-compression';
const source=await readFile('src/playtt-php-loader.mjs','utf8');
assert.match(source,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-id-sequence-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+source.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-id-sequence-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
try{
 const plugin='/wordpress/wp-content/plugins/markdown-database-integration/';
 for await(const entry of decodeZip(new Blob([await readFile('assets/markdown-database-integration-runtime.zip')]).stream())){
  if(!entry.name.endsWith('.php'))continue;const path=plugin+entry.name;php.mkdir(path.slice(0,path.lastIndexOf('/')));php.writeFile(path,new Uint8Array(await entry.arrayBuffer()));
 }
 // Validate all pinned anchors before changing any file, including the last one.
 const mismatch=plugin+'inc/class-wp-markdown-write-engine.php',original=php.readFileAsBuffer(mismatch).slice();
 php.writeFile(mismatch,new TextDecoder().decode(original).replace('public function flush_dirty(', 'public function changed_flush_dirty('));
 let writes=0;assert.throws(()=>patchPlayttIdSequences({readFileAsBuffer:p=>php.readFileAsBuffer(p),writeFile:()=>{writes++;}}),/patch count mismatch/);assert.equal(writes,0);
 php.writeFile(mismatch,original);patchPlayttIdSequences(php);
 php.writeFile('/tmp/playtt-id-sequences.php',PLAYTT_ID_SEQUENCES_PHP);
 const code=String.raw`<?php
 require '/wordpress/wp-content/plugins/markdown-database-integration/inc/playtt-id-sequences.php';
 $tests=[];function ok($condition,$name){global $tests;if(!$condition)throw new RuntimeException($name);$tests[]=$name;}
 function database(){ $p=new PDO('sqlite::memory:');$p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);foreach(['wp_posts','wp_users','wp_comments','wp_terms','wp_postmeta','plugin_records']as$t)$p->exec('CREATE TABLE '.$t.'(id INTEGER PRIMARY KEY AUTOINCREMENT,value TEXT)');return $p; }
 $root='/tmp/state';mkdir($root);$p=database();playtt_restore_sequences($p,$root);ok(playtt_read_sequences($root)===[],'legacy missing metadata permits current-state baseline');
 foreach(['wp_posts','wp_users','wp_comments','wp_terms','wp_postmeta','plugin_records']as$t){$p->exec("INSERT INTO $t(id,value) VALUES (100,'A'),(101,'B')");$p->exec("DELETE FROM $t WHERE id=101");}
 playtt_save_sequences($p,$root);$saved=playtt_read_sequences($root);ok(count($saved)===6&&count(array_filter($saved,fn($v)=>$v==='101'))===6,'deleted highest IDs captured for six tables');
 $cold=database();foreach(array_keys($saved)as$t)$cold->exec("INSERT INTO $t(id,value) VALUES (100,'A')");playtt_restore_sequences($cold,$root);
 foreach(array_keys($saved)as$t){$cold->exec("INSERT INTO $t(value) VALUES ('C')");ok((int)$cold->lastInsertId()===102,'cold restoration advances '.$t);}
 playtt_save_sequences($cold,$root);ok(playtt_read_sequences($root)['wp_posts']==='102','later saves advance high-water');
 $empty=database();playtt_restore_sequences($empty,$root);$empty->exec("INSERT INTO wp_posts(value) VALUES ('empty')");ok((int)$empty->lastInsertId()===103,'empty restored table preserves deleted history');
 $higher=database();$higher->exec("INSERT INTO wp_posts(id,value) VALUES (900,'higher')");playtt_restore_sequences($higher,$root);$higher->exec("INSERT INTO wp_posts(value) VALUES ('higher-next')");ok((int)$higher->lastInsertId()===901,'restore never lowers a newer live sequence');
 $stable=file_get_contents(playtt_sequence_file($root));playtt_save_sequences($cold,$root);ok(file_get_contents(playtt_sequence_file($root))===$stable,'unchanged metadata remains byte-identical');
 foreach(['-1','01','1.5','9223372036854775808',1.5,[]]as$bad){$rejected=false;try{playtt_sequence_value($bad);}catch(Throwable $e){$rejected=true;}ok($rejected,'invalid sequence value rejected');}
 ok(playtt_sequence_value('9007199254740993')==='9007199254740993','above-JavaScript-safe integer retained as decimal string');
 $large=['schema'=>'playtt/auto-increment/v1','sequences'=>(object)['wp_posts'=>'9007199254740993']];file_put_contents(playtt_sequence_file($root),json_encode($large));$big=database();playtt_restore_sequences($big,$root);ok($big->query("SELECT CAST(seq AS TEXT) FROM sqlite_sequence WHERE name='wp_posts'")->fetchColumn()==='9007199254740993','large integer restored without rounding');
 $invalid=['{}','{"schema":"wrong","sequences":{}}','{"schema":"playtt/auto-increment/v1","sequences":[]}','{"schema":"playtt/auto-increment/v1","sequences":{"../bad":"3"}}','{"schema":"playtt/auto-increment/v1","sequences":{"wp_posts":"-1"}}',str_repeat('x',131073)];
 foreach($invalid as$raw){file_put_contents(playtt_sequence_file($root),$raw);$before=playtt_live_sequences($big);$rejected=false;try{playtt_restore_sequences($big,$root);}catch(Throwable$e){$rejected=true;}ok($rejected&&playtt_live_sequences($big)===$before,'invalid metadata rejected before changing SQLite');}
 file_put_contents(playtt_sequence_file($root),$stable);$broken='/tmp/broken';mkdir($broken);file_put_contents($broken.'/_runtime','not a directory');$rejected=false;try{playtt_save_sequences($cold,$broken);}catch(Throwable$e){$rejected=true;}ok($rejected,'unwritable metadata location fails closed');
 // Execute the actual patched wpdb loader method with a minimal connection,
 // so bypassing this entry point cannot be hidden by helper-only tests.
 define('ABSPATH','/wordpress/');define('MARKDOWN_DB_STATE_DIR',$root);
 class WP_SQLite_DB { public $dbh; }
 require '/wordpress/wp-content/plugins/markdown-database-integration/inc/class-wp-markdown-db.php';
 $db=new WP_Markdown_DB();$native=database();
 $db->dbh=new class($native){private $pdo;function __construct($p){$this->pdo=$p;}function get_connection(){return $this;}function get_pdo(){return $this->pdo;}};
 $loader=new class{public $calls=[];function load_all(){$this->calls[]='cold';}function sync_incremental(){$this->calls[]='warm';}};
 $property=new ReflectionProperty(WP_Markdown_DB::class,'loader');$property->setAccessible(true);$property->setValue($db,$loader);
 $method=new ReflectionMethod(WP_Markdown_DB::class,'run_primary_loader_action');$method->setAccessible(true);
 $method->invoke($db,'load_all');$native->exec("INSERT INTO wp_posts(value) VALUES ('normal-cold')");ok((int)$native->lastInsertId()===103,'actual wpdb cold entry point restores sequence');
 $native->exec("UPDATE sqlite_sequence SET seq=90 WHERE name='wp_posts'");$method->invoke($db,'sync_incremental');ok(playtt_live_sequences($native)['wp_posts']==='102'&&$loader->calls===['cold','warm'],'actual wpdb warm entry point restores sequence');
 file_put_contents(playtt_sequence_file($root),'{}');$rejected=false;try{$method->invoke($db,'load_all');}catch(Throwable$e){$rejected=true;}ok($rejected,'actual wpdb entry point rejects corrupt sequence metadata');
 echo json_encode(['result'=>'pass','checks'=>$tests]);`;
 const result=await php.run({code});assert.equal(result.exitCode,0,result.errors);const report={at:new Date().toISOString(),scope:'Actual pinned PHP web WASM/PDO SQLite; metadata validation, monotonic restored sequences, empty tables, large integer precision and write failure',...JSON.parse(result.text)};await writeFile('artifacts/playtt-id-sequence-php.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{php.exit();}
