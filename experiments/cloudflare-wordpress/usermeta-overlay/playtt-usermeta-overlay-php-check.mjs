// Offline canonical57 replay with the pinned core session classes. No network.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
import {patchPlayttPostmetaPersistence} from '../src/playtt-postmeta-policy.ts';
import {patchPlayttIdSequences} from '../src/playtt-id-sequences.ts';
import {createCanonicalRestorePack,decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';
import {createUsermetaOverlay,readUsermetaOverlay} from '../src/playtt-usermeta-overlay.ts';
import {readMetadataOverlay as legacyRead} from '../src/playtt-metadata-overlay.ts';
import {openSnapshotBundle,exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex'),json=b=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
const enc=v=>new TextEncoder().encode(JSON.stringify(v)),load=async p=>json(await readFile(p));
const location=await load('artifacts/playtt-window-lock-backup-owned-private.json');assert.equal(location.phase,'verified');assert.equal(location.anchor.revision,'34a7df5f-087f-4d50-925d-05a748c1d66e');
const baseline=await openSnapshotBundle(location.directory+'/independent',location.anchor),base=baseline.graph.manifest,original=baseline.graph.contents;
const data=new Map(baseline.graph.objects.map(o=>[o.key,o.bytes]));
const bucket={async get(key){const b=data.get(key);return b?{size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer}:null;}};
const loaderSource=await readFile('src/playtt-php-loader.mjs','utf8');assert.match(loaderSource,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-usermeta-overlay-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+loaderSource.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-usermeta-overlay-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
const plugin='/wordpress/wp-content/plugins/markdown-database-integration/',entries=[],core=[];
for await(const e of decodeZip(new Blob([await readFile('assets/markdown-database-integration-runtime.zip')]).stream()))if(e.name.endsWith('.php'))entries.push({path:plugin+e.name,bytes:new Uint8Array(await e.arrayBuffer())});
const names=['class-wp-session-tokens.php','class-wp-user-meta-session-tokens.php'];
for await(const e of decodeZip(new Blob([await readFile('artifacts/cloudflare-wordpress-runtime-corpus.zip')]).stream()))if(names.some(n=>e.name==='wordpress/wp-includes/'+n))core.push({path:'/'+e.name,bytes:new Uint8Array(await e.arrayBuffer())});
assert.equal(core.length,2);const seed=await readFile('assets/wordpress-install-seed.sqlite');
const prelude=String.raw`<?php
define('ABSPATH','/wordpress/');
function apply_filters($name,$value,...$args){return $value;}
require '${plugin}vendor/autoload.php';
require '${plugin}inc/class-wp-markdown-frontmatter-profiles.php';
require '${plugin}inc/class-wp-markdown-storage.php';
require '${plugin}inc/class-wp-markdown-write-engine.php';
require '${plugin}inc/class-wp-markdown-loader.php';
require '${plugin}inc/playtt-id-sequences.php';
require '/wordpress/wp-includes/class-wp-session-tokens.php';
require '/wordpress/wp-includes/class-wp-user-meta-session-tokens.php';
class WP_SQLite_Driver {
 public $pdo;function __construct($p){$this->pdo=$p;}
 function get_connection(){return $this;}function get_pdo(){return $this->pdo;}
 function get_insert_id(){return $this->pdo->lastInsertId();}
 function query($q){return $this->pdo->query($q)->fetchAll(PDO::FETCH_OBJ);}
}
$checks=[];function ok($v,$label){global $checks;if(!$v)throw new RuntimeException($label);$checks[]=$label;}
function invoke($o,$name,...$args){$m=new ReflectionMethod($o,$name);$m->setAccessible(true);return $m->invoke($o,...$args);}
copy('/tmp/seed.sqlite','/tmp/database.sqlite');
$p=new PDO('sqlite:/tmp/database.sqlite');$p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$p->setAttribute(PDO::ATTR_STRINGIFY_FETCHES,true);
foreach(['wp_users','wp_usermeta']as$table)$p->exec('DELETE FROM '.$table);
$p->exec("DELETE FROM sqlite_sequence WHERE name IN ('wp_users','wp_usermeta')");
$root='/tmp/state';$s=new WP_Markdown_Storage($root);$driver=new WP_SQLite_Driver($p);
$l=new WP_Markdown_Loader($root,$driver,$s,'wp_',$root);$l->prepare_existing_cache();
invoke($l,'load_table_from_json','users');invoke($l,'load_table_from_json','usermeta');playtt_restore_sequences($p,$root);
$writer=new WP_Markdown_Write_Engine($root,$s,$driver,'wp_',$root);
function rows(){global $p;return $p->query('SELECT * FROM wp_usermeta ORDER BY umeta_id')->fetchAll(PDO::FETCH_ASSOC);}
function get_user_meta($id,$key,$single){global $p;$q=$p->prepare('SELECT meta_value FROM wp_usermeta WHERE user_id=? AND meta_key=? ORDER BY umeta_id');$q->execute([$id,$key]);$v=$q->fetchColumn();return $v===false?'':unserialize($v,['allowed_classes'=>false]);}
function update_user_meta($id,$key,$value){global $p,$writer;$q=$p->prepare('SELECT umeta_id FROM wp_usermeta WHERE user_id=? AND meta_key=?');$q->execute([$id,$key]);$found=$q->fetchColumn();
 if($found===false){$q=$p->prepare('INSERT INTO wp_usermeta(user_id,meta_key,meta_value)VALUES(?,?,?)');$q->execute([$id,$key,serialize($value)]);$verb='INSERT';}
 else{$q=$p->prepare('UPDATE wp_usermeta SET meta_value=? WHERE umeta_id=?');$q->execute([serialize($value),$found]);$verb='UPDATE';}
 $writer->persist_write($verb.' wp_usermeta','wp_usermeta',$verb);return true;
}
function delete_user_meta($id,$key){global $p,$writer;$q=$p->prepare('DELETE FROM wp_usermeta WHERE user_id=? AND meta_key=?');$q->execute([$id,$key]);$writer->persist_write('DELETE FROM wp_usermeta','wp_usermeta','DELETE');return true;}
`;
async function runtime(contents){
 const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
 for(const e of [...entries,...core]){php.mkdir(e.path.slice(0,e.path.lastIndexOf('/')));php.writeFile(e.path,e.bytes);}
 php.writeFile('/tmp/seed.sqlite',seed);patchPlayttIdSequences(php);patchPlayttPostmetaPersistence(php);
 for(const f of contents.markdown){const p='/tmp/state/'+f.path;php.mkdir(p.slice(0,p.lastIndexOf('/')));php.writeFile(p,f.bytes);}
 return php;
}
let writerReport,restored,next=structuredClone(base),changed=[];const writerPhp=await runtime(original);
try{
 assert.equal(sha(writerPhp.readFileAsBuffer('/tmp/seed.sqlite')),sha(seed));
 const result=await writerPhp.run({code:prelude+String.raw`
$before=rows();$accounts=$p->query('SELECT * FROM wp_users ORDER BY ID')->fetchAll(PDO::FETCH_ASSOC);
ok(count($accounts)===2,'both recorded accounts hydrated');$manager=WP_Session_Tokens::get_instance(2);
$token=bin2hex(random_bytes(32));$session=['expiration'=>time()+3600,'login'=>time(),'ua'=>'PLAYTT local-only test'];
$manager->update($token,$session);ok($manager->verify($token),'native core session is valid');
ok(!WP_Session_Tokens::get_instance(1)->verify($token),'token is bound to editor2');
$prefs=['core/edit-post'=>['welcomeGuide'=>false,'label'=>'繁體中文設定']];update_user_meta(2,'wp_persisted_preferences',$prefs);
$writer->flush_dirty(true);$after=rows();
foreach($before as$r){if($r['user_id']==='2'&&in_array($r['meta_key'],['session_tokens','wp_persisted_preferences'],true))continue;$same=array_values(array_filter($after,fn($v)=>$v['umeta_id']===$r['umeta_id']));ok(count($same)===1&&$same[0]===$r,'unrelated user metadata remains exact');}
ok($p->query('SELECT * FROM wp_users ORDER BY ID')->fetchAll(PDO::FETCH_ASSOC)===$accounts,'roles and credential account records preserved');
echo json_encode(['checks'=>$checks,'rows'=>$after,'accounts'=>$accounts,'token'=>$token,'session'=>$session,'prefs'=>$prefs,'sequences'=>json_decode(file_get_contents($root.'/_runtime/playtt-auto-increment.json'),true)]);
`});
 assert.equal(result.exitCode,0,'Pinned PHP writer failed: '+result.errors);writerReport=JSON.parse(result.text);
 const revision=randomUUID();Object.assign(next,{revision,manifestKey:`sites/default/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString()});delete next.restorePack;
 for(const path of ['_tables/usermeta.json','_runtime/playtt-auto-increment.json']){const bytes=writerPhp.readFileAsBuffer('/tmp/state/'+path).slice(),f=next.files.find(x=>x.path===path);if(sha(bytes)!==f.sha256)changed.push({path,size:bytes.length});f.sha256=sha(bytes);f.size=bytes.length;f.objectKey=`sites/default/markdown/objects/${f.sha256}`;data.set(f.objectKey,bytes);}
 next.restorePack=await createUsermetaOverlay(bucket,'sites/default',next,base);assert.ok(next.restorePack,'native MDI usermeta output must be eligible');data.set(next.manifestKey,enc(next));
 restored=await readUsermetaOverlay(bucket,'sites/default',next);await assert.rejects(legacyRead(bucket,'sites/default',next));
}finally{writerPhp.exit();}
let unchanged=0;for(const group of ['markdown','uploads','wpContent'])for(const f of original[group]){const actual=restored.contents[group].find(x=>x.path===f.path);assert.ok(actual);if(group==='markdown'&&changed.some(x=>x.path===f.path))continue;assert.equal(sha(actual.bytes),sha(f.bytes));unchanged++;}
assert.deepEqual(restored.contents.wpContentDeleted,original.wpContentDeleted);
const coldPhp=await runtime(restored.contents);let coldReport;
try{
 assert.equal(sha(coldPhp.readFileAsBuffer('/tmp/seed.sqlite')),sha(seed));coldPhp.writeFile('/tmp/expected.json',JSON.stringify(writerReport));
 const result=await coldPhp.run({code:prelude+String.raw`
$expected=json_decode(file_get_contents('/tmp/expected.json'),true);
ok(rows()===$expected['rows'],'cold PHP retains every usermeta ID and byte');
ok($p->query('SELECT * FROM wp_users ORDER BY ID')->fetchAll(PDO::FETCH_ASSOC)===$expected['accounts'],'cold PHP retains exact account and credential rows');
foreach($expected['sequences']['sequences']as$name=>$seq){$q=$p->prepare('SELECT CAST(seq AS TEXT) FROM sqlite_sequence WHERE name=?');$q->execute([$name]);ok($q->fetchColumn()===$seq,'cold PHP retains counter high water');}
$m=WP_Session_Tokens::get_instance(2);$token=$expected['token'];ok($m->verify($token),'core validates restored session');ok($m->get($token)===$expected['session'],'restored session payload exact');
ok(!WP_Session_Tokens::get_instance(1)->verify($token),'restored session is not another user');ok(!$m->verify('wrong-token'),'wrong token rejected');
ok(get_user_meta(2,'wp_persisted_preferences',true)===$expected['prefs'],'PHP restores Chinese preferences');
$m->destroy($token);ok(!$m->verify($token),'core logout invalidates restored session');
$m->update($token,['expiration'=>time()-100]);ok(!$m->verify($token),'core rejects expired session');
echo json_encode(['checks'=>$checks]);
`});
 assert.equal(result.exitCode,0,'Pinned PHP cold restore failed: '+result.errors);coldReport=JSON.parse(result.text);
}finally{coldPhp.exit();}
const output=resolve('../../../../outputs/backups/cloudflare-wordpress-usermeta-local/'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(output,{recursive:true});
const anchor={revision:next.revision,manifestKey:next.manifestKey,persistedAt:next.persistedAt,manifestSha256:sha(enc(next)),packKey:restored.base.restorePack.objectKey,packSha256:restored.base.restorePack.sha256,packBytes:restored.base.restorePack.size};
await exportSnapshotBundle(bucket,anchor,output+'/export');const independent=await importSnapshotBundle(output+'/export',anchor,output+'/independent');
const full=await createCanonicalRestorePack('sites/default',independent.graph.contents);await decodeCanonicalRestorePack(full.metadata,'sites/default',{markdown:next.files,uploads:next.uploads,wpContent:next.wpContent,wpContentDeleted:next.wpContentDeleted},full.bytes);await writeFile(output+'/materialized.zip',full.bytes);
const pointerBytes=enc({revision:next.revision,manifestKey:next.manifestKey,persistedAt:next.persistedAt}).length;
const commonBytes=changed.reduce((n,x)=>n+x.size,0)+pointerBytes,overlayWriteBytes=commonBytes+enc(next).length,fullWriteBytes=commonBytes+full.bytes.length+enc({...next,restorePack:full.metadata}).length;
const report={at:new Date().toISOString(),result:'pass',scope:'Offline canonical57 with exact pinned core WP_Session_Tokens/WP_User_Meta_Session_Tokens, real MDI writer/loader and PDO SQLite in two fresh PHP instances. SQL metadata/filter adapter is narrow; not full WordPress HTTP/login/browser acceptance.',baselineVersion:57,baselineRevision:base.revision,fullBaseRevision:restored.base.revision,coreClasses:core.map(x=>({name:x.path.split('/').pop(),sha256:sha(x.bytes)})),writerChecks:writerReport.checks.length,coldChecks:coldReport.checks.length,userMetadataRows:writerReport.rows.length,accounts:writerReport.accounts.length,sequenceTables:Object.keys(writerReport.sequences.sequences).length,filesCompared:unchanged+changed.length,unchangedFiles:unchanged,changedFiles:changed,coreSessionValidatedAfterColdRestore:true,coreWrongUserAndExpiryAndLogoutChecks:true,chinesePreferencesExact:true,oldV1ReaderRejected:true,independentBundleVerified:true,materializedFullPackVerified:true,materializedFullPackBytes:full.bytes.length,overlayWriteBytes,fullWriteBytes,avoidedWriteBytes:fullWriteBytes-overlayWriteBytes,estimatedObjectPayloadReductionPercent:100*(1-overlayWriteBytes/fullWriteBytes),costScope:'One local replay estimate: changed loose objects, new manifest, pointer and optional full pack. Excludes operation cost, reads and retries; not measured provider savings.',remoteObjectsWritten:0,featureFlagEnabled:false};
await writeFile('artifacts/playtt-usermeta-overlay-local-private.json',JSON.stringify({directory:output,anchor},null,2)+'\n');await writeFile('artifacts/playtt-usermeta-overlay-php.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
