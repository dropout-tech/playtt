import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { classifyAjax } from './playtt-ajax-classifier.mjs';
assert.ok(process.argv.includes('--local') && !process.argv.includes('--remote'));
const make = body => new Request('http://127.0.0.1/wp-admin/admin-ajax.php', { method: 'POST', body });
const secret = 'owned-test-value-that-must-not-be-reported';
const form = (entries, multipart) => { const f = multipart ? new FormData() : new URLSearchParams(); for (const [k,v] of entries) f.append(k,v); return f; };
const cases = [
  ['urlencoded-unlock',make(form([['action','wp-remove-post-lock'],['_wpnonce',secret],['post_ID','193'],['active_post_lock',secret]],false)),'wp-remove-post-lock','urlencoded'],
  ['multipart-unlock',make(form([['action','wp-remove-post-lock'],['_wpnonce',secret],['post_ID','193'],['active_post_lock',secret]],true)),'wp-remove-post-lock','multipart'],
  ['multipart-heartbeat',make(form([['action','heartbeat'],['_nonce',secret]],true)),'heartbeat','multipart'],
  ['duplicate',make(form([['action','heartbeat'],['action','autosave']],true)),'duplicate','multipart'],
  ['missing',make(form([['_wpnonce',secret]],true)),'missing','multipart'],
  ['unsupported',make(secret),'unsupported-content-type','unsupported'],
  ['urlencoded-oversize',make(form([['action','heartbeat'],['payload','x'.repeat(9000)]],false)),'over-bound','urlencoded'],
  ['multipart-oversize',make(form([['action','heartbeat'],['payload','x'.repeat(9000)]],true)),'over-bound','multipart'],
  ['file-action',make(form([['action',new Blob(['heartbeat'])]],true)),'invalid-action-type','multipart'],
  ['malformed-multipart',new Request('http://127.0.0.1/',{method:'POST',headers:{'content-type':'multipart/form-data; boundary=owned'},body:'broken'}),'parse-failed','multipart'],
  ['unknown-action',make(form([['action',secret]],false)),'other','urlencoded'],
];
const results=[];
for(const[name,request,action,encoding]of cases){
  const before=await request.clone().text(),result=await classifyAjax(request);
  assert.equal(result.action,action);assert.equal(result.encoding,encoding);
  assert.equal(await request.text(),before,'Classifier must not consume the original request');
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.ok(Object.keys(result).every(k=>['action','encoding','formBytes','hasPostId','hasActiveLock'].includes(k)));
  results.push({name,action,encoding,originalBodyPreserved:true,noSensitiveValueReturned:true});
}
const source=(await readFile('scripts/playtt-ajax-classifier.mjs','utf8')).replaceAll('\r\n','\n');
const report={schema:'playtt/ajax-classifier-check/v1',result:'pass',sourceSha256:createHash('sha256').update(source).digest('hex'),cases:results.length,boundBytes:8192,results,cloudRequests:0};
const path='artifacts/playtt-ajax-classifier-check.json',text=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(await readFile(path,'utf8'),text);else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({result:'pass',cases:results.length,boundBytes:8192,sourceSha256:report.sourceSha256}));
