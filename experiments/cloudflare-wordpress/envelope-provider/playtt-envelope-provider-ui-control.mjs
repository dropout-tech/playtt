// Challenge the currently running controller. A stale reply/ready file cannot
// authorize a browser step: every command has a new ID and waits for its reply.
import assert from 'node:assert/strict';
import {readFile,writeFile,rename,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const action=process.argv[2];assert.ok(['guard','saved','cold-begin','cold-end','cold','status','finish'].includes(action));assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-envelope-provider-ui-',load=async p=>JSON.parse(await readFile(p,'utf8'));
const owner=await load(prefix+'owned-private.json');assert.equal(owner.phase,'browser-ready');assert.ok(Date.now()<owner.expiresAt);
const version=process.argv.find(a=>a.startsWith('--version='))?.slice(10);if(action==='cold-end')assert.match(version||'',/^[a-f0-9-]{36}$/);
const cmd={id:randomUUID(),action,...(version?{version}:{})};
await access(prefix+'command-private.json').then(()=>{throw Error('A command is pending; never overwrite or replay');},e=>{if(e.code!=='ENOENT')throw e;});
const temporary=prefix+'command-'+cmd.id+'-private.json';await writeFile(temporary,JSON.stringify(cmd),{flag:'wx'});await rename(temporary,prefix+'command-private.json');
const deadline=Date.now()+55000;while(Date.now()<deadline){let r;try{r=await load(prefix+'reply-private.json');}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}if(r?.id===cmd.id){assert.equal(r.ok,true,r.error?.message);console.log(JSON.stringify(r.value));process.exit(0);}await delay(250);}
throw Error('Live controller challenge timed out; inspect same process and command, never replay');
