// Challenge the currently running controller. A stale reply/ready file cannot
// authorize a browser step: every command has a new ID and waits for its reply.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const action=process.argv[2];assert.ok(['guard','saved','cold','status','finish'].includes(action));assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-markdown-provider-ui-',load=async p=>JSON.parse(await readFile(p,'utf8'));
const owner=await load(prefix+'owned-private.json');assert.equal(owner.phase,'browser-ready');assert.ok(Date.now()<owner.expiresAt);
const cmd={id:randomUUID(),action};await writeFile(prefix+'command-private.json',JSON.stringify(cmd),{flag:'wx'});
const deadline=Date.now()+55000;while(Date.now()<deadline){let r;try{r=await load(prefix+'reply-private.json');}catch(e){if(e.code!=='ENOENT')throw e;}if(r?.id===cmd.id){assert.equal(r.ok,true,r.error?.message);console.log(JSON.stringify(r.value));process.exit(0);}await delay(250);}
throw Error('Live controller challenge timed out; inspect same process and command, never replay');
