import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
import {patchPlayttPostmetaPersistence} from '../src/playtt-postmeta-policy.ts';
import {patchPlayttIdSequences} from '../src/playtt-id-sequences.ts';
import {decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';
import {createMetadataOverlay,readMetadataOverlay} from '../src/playtt-metadata-overlay.ts';

const sha=b=>createHash('sha256').update(b).digest('hex');
const location=JSON.parse(await readFile('artifacts/playtt-editor-recovery-inspection-backup-location-private.json','utf8'));
const baseBytes=await readFile(location.directory+'/manifest.json'),base=JSON.parse(baseBytes),zip=await readFile(location.directory+'/restore.zip');
const original=await decodeCanonicalRestorePack(base.restorePack,'sites/default',{markdown:base.files,uploads:base.uploads,wpContent:base.wpContent,wpContentDeleted:base.wpContentDeleted},zip);
const data=new Map([[base.manifestKey,baseBytes],[base.restorePack.objectKey,zip]]);
for(const group of ['markdown','uploads','wpContent'])for(const file of original[group]){const descriptor=(group==='markdown'?base.files:base[group]).find(x=>x.path===file.path);data.set(descriptor.objectKey,file.bytes);}
const bucket={async get(key){const b=data.get(key);return b?{size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer}:null;}};

const loaderSource=await readFile('src/playtt-php-loader.mjs','utf8');
assert.match(loaderSource,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-metadata-overlay-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+loaderSource.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-metadata-overlay-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
const plugin='/wordpress/wp-content/plugins/markdown-database-integration/',entries=[];
for await(const entry of decodeZip(new Blob([await readFile('assets/markdown-database-integration-runtime.zip')]).stream()))if(entry.name.endsWith('.php'))entries.push({path:plugin+entry.name,bytes:new Uint8Array(await entry.arrayBuffer())});
let corePost;
for await(const entry of decodeZip(new Blob([await readFile('artifacts/cloudflare-wordpress-runtime-corpus.zip')]).stream()))if(entry.name==='wordpress/wp-admin/includes/post.php')corePost=new TextDecoder().decode(await entry.arrayBuffer());
assert.ok(corePost);
const nativeFunctions=['wp_check_post_lock','wp_set_post_lock'].map(name=>{const matches=[...corePost.matchAll(new RegExp('function '+name+'\\([^]*?\\n\\}','g'))];assert.equal(matches.length,1);return matches[0][0];}).join('\n');
const seed=await readFile('assets/wordpress-install-seed.sqlite');
const prelude=String.raw`<?php
define('ABSPATH','/wordpress/');
function apply_filters($name,$value,...$args){return $value;}
require '${plugin}vendor/autoload.php';
require '${plugin}inc/class-wp-markdown-frontmatter-profiles.php';
require '${plugin}inc/class-wp-markdown-storage.php';
require '${plugin}inc/class-wp-markdown-write-engine.php';
require '${plugin}inc/class-wp-markdown-loader.php';
require '${plugin}inc/playtt-id-sequences.php';
class WP_SQLite_Driver {
 public $pdo;function __construct($p){$this->pdo=$p;}
 function get_connection(){return $this;}function get_pdo(){return $this->pdo;}
 function get_insert_id(){return $this->pdo->lastInsertId();}
 function query($q){return $this->pdo->query($q)->fetchAll(PDO::FETCH_OBJ);}
}
$checks=[];function ok($v,$label){global $checks;if(!$v)throw new RuntimeException($label);$checks[]=$label;}
function invoke($o,$name,...$args){$m=new ReflectionMethod($o,$name);$m->setAccessible(true);return $m->invoke($o,...$args);}
copy('/tmp/seed.sqlite','/tmp/database.sqlite');
$p=new PDO('sqlite:/tmp/database.sqlite');$p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
// Exact setting used by the pinned SQLite integration driver; SQL adapter is narrow.
$p->setAttribute(PDO::ATTR_STRINGIFY_FETCHES,true);
$p->exec('DELETE FROM wp_postmeta');$p->exec('DELETE FROM wp_posts');
$p->exec("DELETE FROM sqlite_sequence WHERE name IN ('wp_posts','wp_postmeta')");
$root='/tmp/state';$s=new WP_Markdown_Storage($root);$driver=new WP_SQLite_Driver($p);
$l=new WP_Markdown_Loader($root,$driver,$s,'wp_',$root);$l->prepare_existing_cache();
invoke($l,'load_posts');invoke($l,'load_frontmatter_meta');invoke($l,'load_table_from_json','postmeta');
playtt_restore_sequences($p,$root);
function rows(){global $p;return $p->query('SELECT * FROM wp_postmeta ORDER BY meta_id')->fetchAll(PDO::FETCH_ASSOC);}
function get_post($id){global $p;return $p->query('SELECT * FROM wp_posts WHERE ID='.(int)$id)->fetch(PDO::FETCH_OBJ);}
function get_post_meta($id,$key,$single){global $p;$q=$p->prepare('SELECT meta_value FROM wp_postmeta WHERE post_id=? AND meta_key=? ORDER BY meta_id');$q->execute([$id,$key]);return $q->fetchColumn();}
function get_userdata($id){return in_array((int)$id,[1,2],true)?(object)['ID'=>(int)$id]:false;}
$currentUser=1;function get_current_user_id(){global $currentUser;return $currentUser;}
function update_post_meta($id,$key,$value){global $p,$writer;$q=$p->prepare('UPDATE wp_postmeta SET meta_value=? WHERE post_id=? AND meta_key=?');$q->execute([$value,$id,$key]);$writer->persist_write('UPDATE wp_postmeta SET meta_value=meta_value WHERE post_id='.(int)$id,'wp_postmeta','UPDATE');return true;}
${nativeFunctions}
`;
async function runtime(contents){
 const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
 for(const entry of entries){php.mkdir(entry.path.slice(0,entry.path.lastIndexOf('/')));php.writeFile(entry.path,entry.bytes);}
 php.writeFile('/tmp/seed.sqlite',seed);patchPlayttIdSequences(php);patchPlayttPostmetaPersistence(php);
 for(const file of contents.markdown){const path='/tmp/state/'+file.path;php.mkdir(path.slice(0,path.lastIndexOf('/')));php.writeFile(path,file.bytes);}
 return php;
}
let writerReport,restored,next=structuredClone(base);
const writerPhp=await runtime(original);
try{
 assert.equal(sha(writerPhp.readFileAsBuffer('/tmp/seed.sqlite')),sha(seed));console.log('Native writer instance ready');
 const result=await writerPhp.run({code:prelude+String.raw`
$before=rows();$id=192;ok((bool)get_post($id),'recorded owned draft hydrated');
$s->set_frontmatter_profile('okf');$s->set_meta_resolver(fn($id)=>$p->query('SELECT meta_key,meta_value FROM wp_postmeta WHERE post_id='.(int)$id.' ORDER BY meta_id')->fetchAll(PDO::FETCH_OBJ));
$writer=new WP_Markdown_Write_Engine($root,$s,$driver,'wp_',$root);
$first=wp_set_post_lock($id);ok($first[1]===1,'core sets current editor lock');
ok(wp_check_post_lock($id)===false,'core allows owner to continue');
$currentUser=2;ok(wp_check_post_lock($id)===1,'core detects another editor');
$second=wp_set_post_lock($id);ok($second[1]===2,'core sets explicit takeover owner');
$currentUser=1;ok(wp_check_post_lock($id)===2,'core observes takeover');
$writer->flush_dirty(true);$after=rows();
ok(count($before)===count($after),'native lock update preserves metadata count');
foreach($before as$i=>$r){if($r['post_id']===(string)$id&&$r['meta_key']==='_edit_lock'){ok($r['meta_id']===$after[$i]['meta_id'],'native lock retains metadata ID');continue;}ok($r===$after[$i],'unrelated metadata row remains exact');}
echo json_encode(['result'=>'pass','checks'=>$checks,'rows'=>$after,'sequences'=>json_decode(file_get_contents($root.'/_runtime/playtt-auto-increment.json'),true)]);
`});
 assert.equal(result.exitCode,0,result.errors+' '+result.text);writerReport=JSON.parse(result.text);
 const revision=randomUUID();Object.assign(next,{revision,manifestKey:`sites/default/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString()});delete next.restorePack;
 for(const path of ['_tables/postmeta.json','_runtime/playtt-auto-increment.json']){const bytes=writerPhp.readFileAsBuffer('/tmp/state/'+path).slice(),f=next.files.find(x=>x.path===path);f.sha256=sha(bytes);f.size=bytes.length;f.objectKey=`sites/default/markdown/objects/${f.sha256}`;data.set(f.objectKey,bytes);}
 next.restorePack=await createMetadataOverlay(bucket,'sites/default',next,base);assert.ok(next.restorePack,'actual PHP-produced metadata must be eligible');
 restored=await readMetadataOverlay(bucket,'sites/default',next);
}finally{writerPhp.exit();}
const coldPhp=await runtime(restored.contents);let coldReport;
try{
 assert.equal(sha(coldPhp.readFileAsBuffer('/tmp/seed.sqlite')),sha(seed));console.log('Independent cold instance ready');
 coldPhp.writeFile('/tmp/expected.json',JSON.stringify({rows:writerReport.rows,sequences:writerReport.sequences}));
 const result=await coldPhp.run({code:prelude+String.raw`
$expected=json_decode(file_get_contents('/tmp/expected.json'),true);
ok(rows()===$expected['rows'],'second PHP instance preserves every metadata ID and byte');
foreach($expected['sequences']['sequences']as$name=>$seq){$q=$p->prepare('SELECT CAST(seq AS TEXT) FROM sqlite_sequence WHERE name=?');$q->execute([$name]);ok($q->fetchColumn()===$seq,'second PHP instance preserves sequence high-water');}
$currentUser=1;ok(wp_check_post_lock(192)===2,'core sees restored other-editor lock');
$currentUser=2;ok(wp_check_post_lock(192)===false,'core recognizes restored lock owner');
$p->exec("UPDATE wp_postmeta SET meta_value='1:2' WHERE post_id=192 AND meta_key='_edit_lock'");
$currentUser=1;ok(wp_check_post_lock(192)===false,'core expires stale locks');
echo json_encode(['result'=>'pass','checks'=>$checks]);
`});
 assert.equal(result.exitCode,0,result.errors+' '+result.text);coldReport=JSON.parse(result.text);
}finally{coldPhp.exit();}
const report={at:new Date().toISOString(),result:'pass',scope:'Offline pinned PHP-WASM; exact core wp_set_post_lock/wp_check_post_lock; real MDI writer/loader and PDO SQLite across two fresh PHP instances. Narrow SQL/user adapter; not full WordPress HTTP, nonce, heartbeat or browser acceptance.',coreFunctionsSha256:sha(nativeFunctions),baseRevision:base.revision,writerChecks:writerReport.checks.length,coldChecks:coldReport.checks.length,metadataRows:writerReport.rows.length,sequenceTables:Object.keys(writerReport.sequences.sequences).length,nativeMetadataEligible:true,changedFiles:restored.changed,remoteObjectsWritten:0,featureFlagEnabled:false};
await writeFile('artifacts/playtt-metadata-overlay-php.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
