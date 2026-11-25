import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const origin='http://127.0.0.1:9429',draft=JSON.parse(await readFile('artifacts/playtt-retirement-created-draft-private-local.json','utf8'));
assert.equal(draft.status,'auto-draft');assert.equal(draft.content.raw,'');assert.ok(Number.isSafeInteger(draft.id));
const page=await fetch(origin+'/?page_id='+draft.id,{redirect:'manual',signal:AbortSignal.timeout(90000)});assert.equal(page.status,404);await page.arrayBuffer();
const rest=await fetch(origin+'/wp-json/wp/v2/pages/'+draft.id+'?context=edit',{redirect:'manual',signal:AbortSignal.timeout(90000)});assert.equal(rest.status,401);await rest.arrayBuffer();
const report={at:new Date().toISOString(),result:'pass',scope:'Local anonymous requests while owned auto-draft exists, without WordPress cookie or nonce',id:draft.id,pageStatus:page.status,editStatus:rest.status};
await writeFile('artifacts/playtt-retirement-draft-anonymous-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
