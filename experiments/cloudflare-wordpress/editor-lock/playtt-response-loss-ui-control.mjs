// Local filesystem control for the owned, time-bounded emulator only.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const action=process.argv[2];assert.ok(['status','before','fault','retry','restart','finish'].includes(action));
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const owner=await load('artifacts/playtt-response-loss-ui-owned-private.json');assert.equal(owner.phase,'ready');assert.equal(owner.origin,'http://127.0.0.1:9448');assert.ok(Date.parse(owner.expiresAt)>Date.now());
const cmd={id:randomUUID(),action};await writeFile('artifacts/playtt-response-loss-ui-command-private.json',JSON.stringify(cmd),{flag:'wx'});
for(let i=0;i<180;i++){
 let reply;try{reply=await load('artifacts/playtt-response-loss-ui-reply-private.json');}catch(e){if(e.code!=='ENOENT')throw e;}
 if(reply?.id===cmd.id){assert.equal(reply.ok,true,reply.error?.message);console.log(JSON.stringify(reply.value));process.exit(0);}
 await new Promise(r=>setTimeout(r,250));
}
throw Error('Observation timed out; inspect the live server and same command, do not resend');
