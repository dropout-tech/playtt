import assert from 'node:assert/strict';
import {readFile,writeFile,rename,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const action=process.argv[2];assert.ok(['status','finish'].includes(action));assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-locale-complete-',load=async p=>JSON.parse(await readFile(p,'utf8')),owner=await load(prefix+'owned-private.json');assert.equal(owner.phase,'browser-ready');assert.ok(Date.now()<owner.expiresAt);
await access(prefix+'command-private.json').then(()=>{throw Error('Pending command; do not replay');},e=>{if(e.code!=='ENOENT')throw e;});const cmd={id:randomUUID(),action},temp=prefix+cmd.id+'-private.json';await writeFile(temp,JSON.stringify(cmd),{flag:'wx'});await rename(temp,prefix+'command-private.json');
const deadline=Date.now()+55000;while(Date.now()<deadline){let reply;try{reply=await load(prefix+'reply-private.json');}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}if(reply?.id===cmd.id){assert.equal(reply.ok,true);console.log(JSON.stringify(reply.value));process.exit(0);}await new Promise(r=>setTimeout(r,250));}throw Error('Timeout: inspect the same process and command without retry');
