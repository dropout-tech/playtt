import assert from 'node:assert/strict';
import test from 'node:test';
import {isWordPressLogoutMutation} from '../src/playtt-request-mutation.js';
test('native logout URL is a persistence candidate regardless of HTTP method or nonce validity',()=>{
 for(const method of ['GET','HEAD','OPTIONS','POST'])for(const query of ['action=logout','action=logout&_wpnonce=invalid','_wpnonce=1234abcdef&action=logout','action=login&action=logout','action=logout&action=login','%61ction=logout']){
  assert.equal(isWordPressLogoutMutation(new Request('https://private.invalid/wp-login.php?'+query,{method})),true);
 }
 // PHP alone validates the nonce and authorization; classification cannot bypass it.
});
test('ordinary login and unrelated action parameters do not acquire new mutation behavior',()=>{
 for(const path of ['/wp-login.php','/wp-login.php?action=login','/wp-login.php?action=lostpassword','/wp-login.php?redirect_to=logout','/wp-login.php?action=logout-other','/wp-login.php/extra?action=logout','/content?action=logout']){
  assert.equal(isWordPressLogoutMutation(new Request('https://private.invalid'+path)),false);
 }
});
