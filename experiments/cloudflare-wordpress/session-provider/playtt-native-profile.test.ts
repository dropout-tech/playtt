import assert from 'node:assert/strict';
import test from 'node:test';
import {nativeLogoutPath} from '../scripts/playtt-native-profile.mjs';
const origin='https://private.example',nonce='1234abcdef';
test('WordPress single/double quoted escaped logout links retain exact nonce',()=>{
 for(const quote of ["'",'"'])for(const amp of ['&amp;','&#038;','&#x26;','&']){
  const html=`<a href="https://elsewhere.example/">Other</a><a class='ab-item' href=${quote}${origin}/wp-login.php?action=logout${amp}_wpnonce=${nonce}${quote}>登出</a>`;
  assert.equal(nativeLogoutPath(html,origin),'/wp-login.php?action=logout&_wpnonce='+nonce);
 }
});
test('native logout parser rejects absent, incomplete and cross-origin links',()=>{
 assert.throws(()=>nativeLogoutPath('<a href="/wp-login.php">登入</a>',origin),/missing-logout-link/);
 assert.throws(()=>nativeLogoutPath('<a href="/wp-login.php?action=logout">登出</a>',origin),/missing-logout-nonce/);
 assert.throws(()=>nativeLogoutPath(`<a href='https://other.example/wp-login.php?action=logout&amp;_wpnonce=${nonce}'>登出</a>`,origin),/cross-origin-logout/);
});
