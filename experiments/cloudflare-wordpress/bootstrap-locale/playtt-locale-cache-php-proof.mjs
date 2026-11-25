// Pinned PHP and real WordPress locale/cache functions; only option storage and hook plumbing are fixture substitutes.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const sha=b=>createHash('sha256').update(b).digest('hex'),directory=await mkdtemp(resolve('artifacts/locale-cache-proof-'));
async function unzip(path){const result={};for await(const e of decodeZip(new Blob([await readFile(path)]).stream()))result[e.name]=new Uint8Array(await e.arrayBuffer());return result;}
const core=await unzip('artifacts/cloudflare-wordpress-runtime-corpus.zip'),oldZip=await unzip('../../../playtt-zh-tw-installer.zip'),fixedZip=await unzip('../../../playtt-zh-tw-initializer-1.0.1.zip');
const loader=(await readFile('../../../playtt-base64-native-build/src/playtt-php-loader.mjs','utf8')).replaceAll('\r\n','\n');assert.equal(sha(loader),'280d74443122ff048049d12fb033cb28cd85e84ca4ae3ee1d390b1df5189de81');
const loaderPath=join(directory,'php-node.mjs');await writeFile(loaderPath,"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);\n"+loader.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm');assert.equal(sha(wasmBytes),'5b1787681568c62c37cf44f3a73d979540b5439c0c79d960cbbaf5d22a467854');const wasm=await WebAssembly.compile(wasmBytes),{init,dependenciesTotalSize}=await import(pathToFileURL(loaderPath));
const outcomes=[];let php;
try{for(const variant of ['original','fixed']){
 php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
 for(const name of ['l10n.php','formatting.php','class-wp-textdomain-registry.php','cache.php','class-wp-object-cache.php']){php.mkdir('/wordpress/wp-includes');php.writeFile('/wordpress/wp-includes/'+name,core['wordpress/wp-includes/'+name]);}
 for(const [path,bytes]of Object.entries(variant==='original'?oldZip:fixedZip)){if(path.endsWith('/'))continue;const dest='/plugin/'+path;php.mkdir(dest.slice(0,dest.lastIndexOf('/')));php.writeFile(dest,bytes);}
 const response=await php.run({code:`<?php
 define('ABSPATH','/wordpress/');define('WPINC','wp-includes');define('WP_LANG_DIR','/wordpress/wp-content/languages');define('HOUR_IN_SECONDS',3600);
 $wp_version='7.1.4';$options=[];$meta=[];
 function apply_filters($name,$value,...$args){return $value;}function is_multisite(){return false;}function wp_suspend_cache_addition(){return false;}
 function get_option($name){return $GLOBALS['options'][$name]??false;}
 function update_option($name,$value){$value=sanitize_option($name,$value);if(get_option($name)===$value)return false;$GLOBALS['options'][$name]=$value;return true;}
 function update_user_meta($id,$key,$value){$GLOBALS['meta'][$key]=$value;}function get_current_user_id(){return 1;}
 function wp_mkdir_p($dir){return is_dir($dir)||mkdir($dir,0777,true);}function wp_die($text){throw new RuntimeException($text);}
 function register_activation_hook($file,$callback){$GLOBALS['activate']=$callback;}
 require ABSPATH.WPINC.'/class-wp-object-cache.php';require ABSPATH.WPINC.'/cache.php';wp_cache_init();
 require ABSPATH.WPINC.'/class-wp-textdomain-registry.php';require ABSPATH.WPINC.'/l10n.php';require ABSPATH.WPINC.'/formatting.php';
 $wp_textdomain_registry=new WP_Textdomain_Registry();wp_mkdir_p(WP_LANG_DIR);
 $before=get_available_languages();wp_cache_set('untouched','keep','other-group');
 require '/plugin/playtt-zh-tw/playtt-zh-tw.php';$activate();
 $first=['siteLocale'=>get_option('WPLANG'),'userLocale'=>$meta['locale'],'available'=>get_available_languages(),'files'=>count(glob(WP_LANG_DIR.'/*')),'unrelatedCache'=>wp_cache_get('untouched','other-group')];
 $activate();echo json_encode(['before'=>$before,'first'=>$first,'repeatSiteLocale'=>get_option('WPLANG')],JSON_THROW_ON_ERROR);
 `});assert.equal(response.exitCode,0,response.errors);assert.equal(response.errors,'');const result=JSON.parse(response.text);assert.deepEqual(result.before,[]);assert.equal(result.first.userLocale,'zh_TW');assert.equal(result.first.files,77);assert.equal(result.first.unrelatedCache,'keep');assert.equal(result.first.siteLocale,variant==='original'?false:'zh_TW');assert.equal(result.repeatSiteLocale,variant==='original'?false:'zh_TW');outcomes.push({variant,...result});php.exit();php=undefined;
}}finally{php?.exit();}
const report={schema:'playtt/locale-cache-proof/v1',result:'pass',scope:'Pinned real WordPress locale sanitization and translation registry under PHP WASM; stubbed option storage, not native persistence acceptance',outcomes,coreFiles:['l10n.php','formatting.php','class-wp-textdomain-registry.php','cache.php','class-wp-object-cache.php'].map(path=>({path,sha256:sha(core['wordpress/wp-includes/'+path])})),originalPluginSha256:sha(oldZip['playtt-zh-tw/playtt-zh-tw.php']),fixedPluginSha256:sha(fixedZip['playtt-zh-tw/playtt-zh-tw.php']),cloudRequests:0,phpExited:true};
await writeFile('artifacts/playtt-locale-cache-php-proof.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
