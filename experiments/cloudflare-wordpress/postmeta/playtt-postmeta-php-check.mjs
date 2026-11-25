import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
import {patchPlayttPostmetaPersistence} from '../src/playtt-postmeta-policy.ts';
import {patchPlayttIdSequences} from '../src/playtt-id-sequences.ts';

const source=await readFile('src/playtt-php-loader.mjs','utf8');
assert.match(source,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-postmeta-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+source.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-postmeta-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
const plugin='/wordpress/wp-content/plugins/markdown-database-integration/';
const entries=[];
for await(const entry of decodeZip(new Blob([await readFile('assets/markdown-database-integration-runtime.zip')]).stream())){
 if(entry.name.endsWith('.php'))entries.push({path:plugin+entry.name,bytes:new Uint8Array(await entry.arrayBuffer())});
}
const seed=await readFile('assets/wordpress-install-seed.sqlite');
const reports=[];
for(const patched of [false,true]){
 const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
 try{
  for(const entry of entries){php.mkdir(entry.path.slice(0,entry.path.lastIndexOf('/')));php.writeFile(entry.path,entry.bytes);}
  php.writeFile('/tmp/seed.sqlite',seed);patchPlayttIdSequences(php);
  if(patched){
   const file=plugin+'inc/class-wp-markdown-loader.php',original=php.readFileAsBuffer(file).slice();
   php.writeFile(file,new TextDecoder().decode(original).replace('WHERE post_id IN ({$id_list})','WHERE unknown IN ({$id_list})'));
   let writes=0;assert.throws(()=>patchPlayttPostmetaPersistence({readFileAsBuffer:p=>php.readFileAsBuffer(p),writeFile:()=>{writes++;}}),/anchor is not unique/);assert.equal(writes,0);
   php.writeFile(file,original);patchPlayttPostmetaPersistence(php);
  }
  const result=await php.run({code:String.raw`<?php
define('ABSPATH','/wordpress/');
function apply_filters($name,$value,...$args){return $value;}
require '${plugin}vendor/autoload.php';
require '${plugin}inc/class-wp-markdown-frontmatter-profiles.php';
require '${plugin}inc/class-wp-markdown-storage.php';
require '${plugin}inc/class-wp-markdown-write-engine.php';
require '${plugin}inc/class-wp-markdown-loader.php';
// A narrow query adapter: real pinned MDI methods run on the actual PHP PDO
// SQLite database/schema. This is not a full WordPress HTTP acceptance test.
class WP_SQLite_Driver {
 public $pdo;function __construct($p){$this->pdo=$p;}
 function get_connection(){return $this;}function get_pdo(){return $this->pdo;}
 function get_insert_id(){return $this->pdo->lastInsertId();}
 function query($q){return $this->pdo->query($q)->fetchAll(PDO::FETCH_OBJ);}
}
$patched=${patched?'true':'false'};$checks=[];
function ok($v,$label){global $checks;if(!$v)throw new RuntimeException($label);$checks[]=$label;}
function invoke($o,$name,...$args){$m=new ReflectionMethod($o,$name);$m->setAccessible(true);return $m->invoke($o,...$args);}
function db($name){copy('/tmp/seed.sqlite','/tmp/'.$name.'.sqlite');$p=new PDO('sqlite:/tmp/'.$name.'.sqlite');$p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$p->exec('DELETE FROM wp_postmeta');$p->exec('DELETE FROM wp_posts');$p->exec("DELETE FROM sqlite_sequence WHERE name IN ('wp_posts','wp_postmeta')");return $p;}
function rows($p){return $p->query('SELECT * FROM wp_postmeta ORDER BY meta_id')->fetchAll(PDO::FETCH_ASSOC);}
function loader($p,$root){$s=new WP_Markdown_Storage($root);$l=new WP_Markdown_Loader($root,new WP_SQLite_Driver($p),$s,'wp_',$root);$l->prepare_existing_cache();return $l;}
function hydrate($p,$root){$l=loader($p,$root);invoke($l,'load_posts');invoke($l,'load_frontmatter_meta');invoke($l,'load_table_from_json','postmeta');return $l;}
$root='/tmp/state';mkdir($root);$p=db('writer');
$p->exec("INSERT INTO wp_posts(ID,post_title,post_content,post_name,post_status,post_type,post_mime_type,post_excerpt,to_ping,pinged,post_content_filtered) VALUES(10,'Brand image','Body','brand-image','inherit','attachment','image/webp','','','',''),(20,'Revision','','','inherit','revision','','','','','')");
$metadata=serialize(['width'=>40,'height'=>30,'file'=>'2026/11/brand-image.webp','sizes'=>[],'image_meta'=>['title'=>'繁體中文','keywords'=>['原始','完整']]]);
$fixture=[[41,10,'_wp_attached_file','2026/11/brand-image.webp'],[43,10,'_wp_attachment_metadata',$metadata],[48,10,'_wp_attachment_image_alt','品牌照片'],[50,10,'_lets_play_asset','brand-image'],[51,10,'_thumbnail_id','10'],[55,10,'repeat','same'],[56,10,'repeat','same'],[61,10,'','empty-key'],[62,10,'nullable',null],[90,20,'origin','legacy-revision']];
$ins=$p->prepare('INSERT INTO wp_postmeta(meta_id,post_id,meta_key,meta_value) VALUES(?,?,?,?)');foreach($fixture as$r)$ins->execute($r);$expected=rows($p);
$s=new WP_Markdown_Storage($root);$s->set_frontmatter_profile('okf');$s->set_meta_resolver(fn($id)=>$p->query('SELECT meta_key,meta_value FROM wp_postmeta WHERE post_id='.(int)$id.' ORDER BY meta_id')->fetchAll(PDO::FETCH_OBJ));
$driver=new WP_SQLite_Driver($p);$writer=new WP_Markdown_Write_Engine($root,$s,$driver,'wp_',$root);
$writer->persist_write('UPDATE wp_postmeta SET meta_value=meta_value WHERE post_id=10','wp_postmeta','UPDATE');$changes=$writer->flush_dirty(true);
ok(is_file($root.'/_tables/postmeta.json'),'real write engine exported postmeta snapshot');
$cold=db('cold');$l=hydrate($cold,$root);$actual=rows($cold);
if(!$patched){
 ok(!$cold->query("SELECT 1 FROM wp_postmeta WHERE meta_key='_wp_attached_file'")->fetchColumn(),'baseline reproduces attachment path loss');
 ok(!$cold->query("SELECT 1 FROM wp_postmeta WHERE meta_key='_wp_attachment_metadata'")->fetchColumn(),'baseline reproduces serialized attachment metadata loss');
 $id=$cold->query("SELECT meta_id FROM wp_postmeta WHERE meta_key='_thumbnail_id'")->fetchColumn();ok($id!==false&&(int)$id!==51,'baseline reproduces metadata identity reassignment');
 ok(count($actual)<count($expected),'baseline loses rows on cold hydration');
}else{
 ok($actual===$expected,'cold hydration preserves every original row and ID');
 ok(playtt_full_postmeta($root),'versioned full-table layout recognized');
 ok(in_array('_runtime/playtt-postmeta-layout.json',array_merge($changes['created'],$changes['changed']),true),'layout marker tracked in canonical changes');
 ok(unserialize($cold->query("SELECT meta_value FROM wp_postmeta WHERE meta_id=43")->fetchColumn())['image_meta']['title']==='繁體中文','serialized attachment data stays byte-valid');
 invoke($l,'insert_post_meta_and_terms',$cold,(object)['ID'=>10,'_frontmatter_meta'=>['_wp_attached_file'=>'WRONG','repeat'=>['stale','stale']]]);ok(rows($cold)===$expected,'stale Markdown frontmatter cannot overwrite or duplicate canonical metadata');
 // Mutations addressed only by meta_id must persist even without a post_id in
 // the SQL WHERE clause. This includes deleting one of two identical rows.
 $p->exec("UPDATE wp_postmeta SET meta_value='更新後' WHERE meta_id=48");$writer->persist_write("UPDATE wp_postmeta SET meta_value='更新後' WHERE meta_id=48",'wp_postmeta','UPDATE');
 $p->exec('DELETE FROM wp_postmeta WHERE meta_id=55');$writer->persist_write('DELETE FROM wp_postmeta WHERE meta_id=55','wp_postmeta','DELETE');$writer->flush_dirty(true);$updated=rows($p);
 invoke($l,'sync_json_tables');ok(rows($cold)===$updated,'warm full-table sync preserves update and deletion by meta_id');
 $cold2=db('cold2');hydrate($cold2,$root);ok(rows($cold2)===$updated,'second cold hydration preserves duplicate-row deletion');
 // A changed Markdown post must not clear its metadata after JSON hydration.
 $file=glob($root.'/attachment/*.md')[0];file_put_contents($file,file_get_contents($file)."\nChanged body");clearstatcache();invoke($l,'sync_markdown_posts');ok(rows($cold)===$updated,'changed Markdown keeps canonical metadata and IDs');
 // Delete-all snapshots must remain authoritative even with stale frontmatter.
 $p->exec('DELETE FROM wp_postmeta');$writer->persist_write('DELETE FROM wp_postmeta','wp_postmeta','DELETE');$writer->flush_dirty(true);invoke($l,'sync_json_tables');ok(rows($cold)===[],'warm delete-all is an authoritative empty table');
 $empty=db('empty');hydrate($empty,$root);ok(rows($empty)===[],'cold empty table does not resurrect stale frontmatter');
 // Unknown/corrupt layout must fail before load_all changes the database.
 $marker=$root.'/_runtime/playtt-postmeta-layout.json';$valid=file_get_contents($marker);
 foreach(['{}','{"schema":"unknown"}',str_repeat('x',257)]as$bad){file_put_contents($marker,$bad);clearstatcache();$rejected=false;try{$l->load_all();}catch(Throwable$e){$rejected=true;}ok($rejected&&rows($cold)===[],'invalid layout fails before hydration');}
 file_put_contents($marker,$valid);$snapshot=file_get_contents($root.'/_tables/postmeta.json');unlink($root.'/_tables/postmeta.json');clearstatcache();$rejected=false;try{$l->sync_incremental();}catch(Throwable$e){$rejected=true;}ok($rejected,'missing authoritative table is rejected');file_put_contents($root.'/_tables/postmeta.json',$snapshot);
 // Legacy layout still reads allowed frontmatter until the first full write.
 unlink($marker);clearstatcache();$legacy=db('legacy');hydrate($legacy,$root);ok((int)$legacy->query("SELECT COUNT(*) FROM wp_postmeta WHERE meta_key='repeat'")->fetchColumn()===2,'legacy Markdown remains readable without new marker');
 // Restore full mode and prove malformed streamed JSON rolls back replacements.
 file_put_contents($marker,$valid);file_put_contents($root.'/_tables/postmeta.json','[{"meta_id":99,"post_id":10,"meta_key":"x","meta_value":"partial"},broken]');
 $before=rows($legacy);$brokenLoader=loader($legacy,$root);$rejected=false;try{invoke($brokenLoader,'sync_json_tables');}catch(Throwable$e){$rejected=true;}ok($rejected&&rows($legacy)===$before,'malformed table rolls back destructive warm replacement');
}
echo json_encode(['patched'=>$patched,'result'=>'pass','checks'=>$checks,'originalRows'=>count($expected),'firstColdRows'=>count($actual)]);`});
  assert.equal(result.exitCode,0,result.errors+' '+result.text);reports.push(JSON.parse(result.text));
 }finally{php.exit();}
}
const report={at:new Date().toISOString(),result:'pass',scope:'Pinned PHP-WASM, real MDI storage/write-engine/loader and PDO SQLite; narrow driver adapter, not full WordPress HTTP',reports};
await writeFile('artifacts/playtt-postmeta-php.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({at:report.at,result:report.result,reports:reports.map(r=>({patched:r.patched,checks:r.checks.length,originalRows:r.originalRows,firstColdRows:r.firstColdRows}))}));
