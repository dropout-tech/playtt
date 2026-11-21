// Local filesystem control for the owned, time-bounded emulator only.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const action=process.argv[2];assert.ok(['status','diagnostic','before','saved','cold','restart','finish'].includes(action));
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const owner=await load('artifacts/playtt-manifest-complete-ui-owned-private.json');assert.equal(owner.phase,'ready');assert.equal(owner.origin,'http://127.0.0.1:9475');assert.ok(Date.parse(owner.expiresAt)>Date.now());
const cmd={id:randomUUID(),action};await writeFile('artifacts/playtt-manifest-complete-ui-command-private.json',JSON.stringify(cmd),{flag:'wx'});
for(let i=0;i<180;i++){
 let reply;try{reply=await load('artifacts/playtt-manifest-complete-ui-reply-private.json');}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
 if(reply?.id===cmd.id){assert.equal(reply.ok,true,reply.error?.message);const value=reply.value; if(value.budget)value.budget={chargedBytes:value.budget.chargedBytes,chargedPuts:value.budget.chargedPuts,pending:value.budget.writeTracking.pending,sealed:value.budget.writeTracking.sealed,window:Object.fromEntries(['closed','openedAt','expiresAt','maxBytes','maxOperations','chargedBytes','chargedPuts','remainingBytes','remainingOperations'].map(k=>[k,value.budget.writeTracking.window[k]]))}; console.log(JSON.stringify(value));process.exit(0);}
 await new Promise(r=>setTimeout(r,250));
}
throw Error('Observation timed out; inspect the live server and same command, do not resend');
