import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
import {patchPlayttPostmetaPersistence} from '../src/playtt-postmeta-policy.ts';
import {patchPlayttIdSequences} from '../src/playtt-id-sequences.ts';

export async function createSnapshotPhpVerifier(){
 const source=await readFile('src/playtt-php-loader.mjs','utf8');assert.match(source,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
 await writeFile('artifacts/playtt-snapshot-bundle-loader.mjs',"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);\n"+source.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
 const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-snapshot-bundle-loader.mjs')));
 const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'),wasm=await WebAssembly.compile(wasmBytes);
 const mdiBytes=await readFile('assets/markdown-database-integration-runtime.zip'),seed=await readFile('assets/wordpress-install-seed.sqlite');
 const plugin='/wordpress/wp-content/plugins/markdown-database-integration/',entries=[];
 for await(const entry of decodeZip(new Blob([mdiBytes]).stream()))if(entry.name.endsWith('.php'))entries.push({path:plugin+entry.name,bytes:new Uint8Array(await entry.arrayBuffer())});
 const hash=b=>createHash('sha256').update(b).digest('hex');
 return {assets:{wasmSha256:hash(wasmBytes),mdiSha256:hash(mdiBytes),seedSha256:hash(seed)},async verify(contents){
  const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
  try{
   for(const entry of entries){php.mkdir(entry.path.slice(0,entry.path.lastIndexOf('/')));php.writeFile(entry.path,entry.bytes);}
   php.writeFile('/tmp/seed.sqlite',seed);patchPlayttIdSequences(php);patchPlayttPostmetaPersistence(php);
   for(const item of contents.markdown){const path='/tmp/state/'+item.path;php.mkdir(path.slice(0,path.lastIndexOf('/')));php.writeFile(path,item.bytes);}
   const result=await php.run({code:String.raw`<?php
define('ABSPATH','/wordpress/');
function apply_filters($name,$value,...$args){return $value;}
require '${plugin}vendor/autoload.php';
require '${plugin}inc/class-wp-markdown-frontmatter-profiles.php';
require '${plugin}inc/class-wp-markdown-storage.php';
require '${plugin}inc/class-wp-markdown-loader.php';
require '${plugin}inc/playtt-id-sequences.php';
class WP_SQLite_Driver {
 public $pdo;function __construct($p){$this->pdo=$p;}
 function get_connection(){return $this;}function get_pdo(){return $this->pdo;}
 function get_insert_id(){return $this->pdo->lastInsertId();}
 function query($q){return $this->pdo->query($q)->fetchAll(PDO::FETCH_OBJ);}
}
function invoke($o,$name,...$args){$m=new ReflectionMethod($o,$name);$m->setAccessible(true);return $m->invoke($o,...$args);}
function ok($v,$name){if(!$v)throw new RuntimeException($name);}
copy('/tmp/seed.sqlite','/tmp/fresh.sqlite');$p=new PDO('sqlite:/tmp/fresh.sqlite');
$p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$p->setAttribute(PDO::ATTR_STRINGIFY_FETCHES,true);
$p->exec('DELETE FROM wp_postmeta');$p->exec('DELETE FROM wp_posts');$p->exec("DELETE FROM sqlite_sequence WHERE name IN ('wp_posts','wp_postmeta')");
$root='/tmp/state';$s=new WP_Markdown_Storage($root);$l=new WP_Markdown_Loader($root,new WP_SQLite_Driver($p),$s,'wp_',$root);$l->prepare_existing_cache();
invoke($l,'load_posts');invoke($l,'load_frontmatter_meta');invoke($l,'load_table_from_json','postmeta');playtt_restore_sequences($p,$root);
$expected=json_decode(file_get_contents($root.'/_tables/postmeta.json'),true);usort($expected,fn($a,$b)=>(int)$a['meta_id']<=>(int)$b['meta_id']);
$actual=$p->query('SELECT * FROM wp_postmeta ORDER BY meta_id')->fetchAll(PDO::FETCH_ASSOC);ok($actual===$expected,'Exact metadata rows/IDs differ');
$sequences=playtt_read_sequences($root);foreach($sequences as$name=>$value){$q=$p->prepare('SELECT CAST(seq AS TEXT) FROM sqlite_sequence WHERE name=?');$q->execute([$name]);ok($q->fetchColumn()===$value,'Sequence high-water differs');}
$attachments=0;foreach($actual as$row)if($row['meta_key']==='_wp_attached_file'){$attachments++;$q=$p->prepare("SELECT 1 FROM wp_posts WHERE ID=? AND post_type='attachment'");$q->execute([$row['post_id']]);ok($q->fetchColumn()!==false,'Attachment metadata has no hydrated parent');}
echo json_encode(['result'=>'pass','metadataRows'=>count($actual),'sequenceTables'=>count($sequences),'attachmentRelationships'=>$attachments,'metadataRowsSha256'=>hash('sha256',json_encode($actual))]);
`});
   assert.equal(result.exitCode,0,'Fresh PHP hydration failed');return JSON.parse(result.text);
  }finally{php.exit();}
 }};
}
