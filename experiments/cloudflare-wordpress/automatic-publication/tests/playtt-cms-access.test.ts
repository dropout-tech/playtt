import assert from 'node:assert/strict';
import test from 'node:test';
import { protectPlayttCms } from '../src/playtt-cms-access.js';
const check=(path:string,token?:string)=>protectPlayttCms(new Request('https://cms.example'+path,{headers:token?{authorization:'Bearer '+token}:{}}),'test-operator');
test('native WordPress authentication and editor assets remain reachable',()=>{
  for(const path of ['/wp-login.php','/wp-admin/site-editor.php','/wp-json/wp/v2/pages','/wp-content/languages/zh_TW-hash.json','/wp-content/themes/lets-play/style.css']) assert.equal(check(path),null,path);
});
test('diagnostics and internal data remain inaccessible even to WordPress sessions',()=>{
  for(const path of ['/?phase=php','/?phase=r2-mutate','/?phase=r2-state','/?coordinator=d1','/__playtt-published/','/__playtt-probe-access','/v1/sites','/xmlrpc.php','/wp-config.php','/wp-content/markdown/_tables/users.json','/wp-content/db.php','/wp-content/themes/lets-play/functions%2ephp','/wp-content%2fmarkdown/_tables/options.json','/.git/config']) assert.equal(check(path)?.status,404,path);
  assert.equal(check('/?phase=php','test-operator')?.status,404);
});
test('maintenance requires a nonempty exact operator credential',()=>{
  for(const path of ['/?phase=r2-state','/?phase=operator-restore','/__playtt-publishing']) {
    assert.equal(check(path)?.status,404);assert.equal(check(path,'incorrect')?.status,404);assert.equal(check(path,'test-operator'),null);
  }
  assert.equal(protectPlayttCms(new Request('https://cms.example/?phase=r2-state',{headers:{authorization:'Bearer '}}),'')?.status,404);
});
