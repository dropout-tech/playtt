import { boot, php, root } from './boot.mjs';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const sitePath = path.resolve(process.argv[2] || path.join(root,'.runtime/test-'+Date.now()+'/wordpress'));
const zipPath = path.resolve(process.argv[3] || path.join(root,'dist/lets-play.zip'));
const report = { scope:'Local WordPress/PHP-WASM/SQLite only; NOT Cloudflare backend acceptance', at:new Date().toISOString(), checks:[] };
await mkdir(path.join(root,'test-results'),{recursive:true});
let server;
async function check(name, fn) { const value=await fn(); report.checks.push({name,status:'pass',evidence:value}); console.log('PASS '+name); return value; }
async function json(code) { return JSON.parse(await php(server, code)); }
try {
  if (!process.argv[2]) {
    await mkdir(path.dirname(sitePath),{recursive:true});
    execFileSync('tar',['-xf',path.join(root,'.runtime/wordpress.zip'),'-C',path.dirname(sitePath)]);
  }
  server=await boot(9421,{sitePath,login:false,seed:false,mountTheme:false});
  await server.playground.writeFile('/tmp/lets-play.zip',new Uint8Array(await readFile(zipPath)));
  await check('ZIP installation using WordPress Theme_Upgrader and activation',async()=>{
    const r=await json(`wp_set_current_user(1); define('FS_METHOD','direct'); require_once ABSPATH.'wp-admin/includes/admin.php'; require_once ABSPATH.'wp-admin/includes/class-wp-upgrader.php'; $u=new Theme_Upgrader(new Automatic_Upgrader_Skin()); $r=$u->install('/tmp/lets-play.zip'); if(is_wp_error($r)){throw new Exception($r->get_error_message());} switch_theme('lets-play'); echo wp_json_encode(array('installed'=>$r,'theme'=>wp_get_theme()->get('Name'),'version'=>get_bloginfo('version')));`);
    assert.equal(r.installed,true); assert.match(r.theme,/Play/); return r;
  });
  const initial=await check('Import six editable pages and fourteen media files',async()=>{
    const r=await json(`wp_set_current_user(1); update_option('WPLANG','zh_TW'); update_option('permalink_structure','/%postname%/'); update_option('blog_public',0); $r=lets_play_import_starter(); if(is_wp_error($r)){throw new Exception($r->get_error_message());} flush_rewrite_rules(false); echo wp_json_encode(array('pages'=>$r,'media'=>count(get_posts(array('post_type'=>'attachment','posts_per_page'=>-1)))));`);
    assert.equal(Object.keys(r.pages).length,6); assert.equal(r.media,14); return r;
  });
  const page=initial.pages.about;
  const saved=await json(`$p=get_post(${page}); echo wp_json_encode(array('title'=>$p->post_title,'content'=>$p->post_content));`);
  await check('Editor changes survive importer rerun; media is not duplicated',async()=>{
    const r=await json(`wp_set_current_user(1); wp_update_post(array('ID'=>${page},'post_title'=>'保存驗證：關於我們')); $a=lets_play_import_starter(); echo wp_json_encode(array('created'=>$a,'title'=>get_the_title(${page}),'media'=>count(get_posts(array('post_type'=>'attachment','posts_per_page'=>-1)))));`);
    assert.equal(Object.keys(r.created).length,0); assert.equal(r.title,'保存驗證：關於我們'); assert.equal(r.media,14); return r;
  });
  await check('Unauthenticated importer is denied',async()=>{
    const r=await json(`wp_set_current_user(0); $r=lets_play_import_starter(); echo wp_json_encode(array('error'=>is_wp_error($r)?$r->get_error_code():null));`); assert.equal(r.error,'forbidden'); return r;
  });
  await check('Content edit and WordPress revision restore',async()=>{
    const r=await json(`wp_set_current_user(1); wp_save_post_revision(${page}); $revisions=wp_get_post_revisions(${page}); $rev=array_key_first($revisions); if(!$rev){throw new Exception('No saved revision');} wp_update_post(array('ID'=>${page},'post_content'=>'<!-- wp:paragraph --><p>Temporary revision check</p><!-- /wp:paragraph -->')); $restored=wp_restore_post_revision($rev); if(!$restored || is_wp_error($restored)){throw new Exception('Revision restore failed');} echo wp_json_encode(array('revision'=>$rev,'content'=>get_post(${page})->post_content));`);
    assert.equal(r.content,saved.content); return {revision:r.revision,contentRestored:true};
  });
  const draft=await json(`wp_set_current_user(1); $id=wp_insert_post(array('post_type'=>'page','post_status'=>'draft','post_title'=>'Private verification draft','post_name'=>'private-verification-draft','post_content'=>'PLAYTT_PRIVATE_DRAFT_783f')); echo wp_json_encode(array('id'=>$id));`);
  await check('Anonymous requests cannot see draft or edit admin',async()=>{
    const response=await fetch('http://127.0.0.1:9421/?page_id='+draft.id);const html=await response.text();assert.equal(response.status,404);assert.ok(!html.includes('PLAYTT_PRIVATE_DRAFT_783f'));
    const admin=await fetch('http://127.0.0.1:9421/wp-admin/',{redirect:'manual'});assert.equal(admin.status,302);assert.match(admin.headers.get('location'),/wp-login/);return {draft:404,admin:302};
  });
  const media=await json(`$a=get_posts(array('post_type'=>'attachment','posts_per_page'=>1))[0]; echo wp_json_encode(array('id'=>$a->ID,'url'=>wp_get_attachment_url($a->ID),'sha'=>hash_file('sha256',get_attached_file($a->ID))));`);
  await check('Media Library file can be downloaded anonymously',async()=>{
    const url=new URL(media.url); const response=await fetch('http://127.0.0.1:9421'+url.pathname);assert.equal(response.status,200);const hash=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');assert.equal(hash,media.sha);return {status:200,sha256:hash};
  });
  await server[Symbol.asyncDispose]();server=undefined;
  const backupPath=sitePath+'-verified-backup-'+Date.now();
  await cp(sitePath,backupPath,{recursive:true});
  server=await boot(9421,{sitePath,login:false,seed:false,mountTheme:false});
  await check('Restart preserves edited page and uploaded media',async()=>{
    const r=await json(`echo wp_json_encode(array('title'=>get_the_title(${page}),'sha'=>hash_file('sha256',get_attached_file(${media.id}))));`);assert.equal(r.title,'保存驗證：關於我們');assert.equal(r.sha,media.sha);return r;
  });
  await php(server,`wp_set_current_user(1); wp_update_post(array('ID'=>${page},'post_title'=>'After backup change'));`);
  await server[Symbol.asyncDispose]();server=undefined;
  // Restore to a separate directory: no destructive replacement of the source or backup.
  const restoredPath=sitePath+'-restored-'+Date.now();await cp(backupPath,restoredPath,{recursive:true});
  server=await boot(9421,{sitePath:restoredPath,login:false,seed:false,mountTheme:false});
  await check('Independent backup restore recovers content and media',async()=>{
    const r=await json(`echo wp_json_encode(array('title'=>get_the_title(${page}),'sha'=>hash_file('sha256',get_attached_file(${media.id}))));`);assert.equal(r.title,'保存驗證：關於我們');assert.equal(r.sha,media.sha);return {restored:true,...r};
  });
  report.result='pass';
} catch(error) {report.result='fail';report.error=error.stack;console.error(error.message.slice(0,2400));process.exitCode=1;}
finally {if(server) await server[Symbol.asyncDispose]();await writeFile(path.join(root,'test-results/integration.json'),JSON.stringify(report,null,2)+'\n');}
