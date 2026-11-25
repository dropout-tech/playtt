import assert from 'node:assert/strict';
import {readFile,writeFile,rename,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const action=process.argv[2];assert.ok(['guard','saved','restart','cold','finish'].includes(action));assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-native-next-ui-',load=async p=>JSON.parse(await readFile(p,'utf8')),owner=await load(prefix+'owned-private.json');assert.equal(owner.phase,'browser-ready');assert.ok(Date.now()<owner.expiresAt);
await access(prefix+'command-private.json').then(()=>{throw Error('Command pending');},e=>{if(e.code!=='ENOENT')throw e;});const cmd={id:randomUUID(),action},tmp=prefix+'command-'+cmd.id+'-private.json';await writeFile(tmp,JSON.stringify(cmd),{flag:'wx'});await rename(tmp,prefix+'command-private.json');
const until=Date.now()+(action==='restart'?150000:55000);while(Date.now()<until){let r;try{r=await load(prefix+'reply-private.json');}catch(e){if(e.code!=='ENOENT')throw e;}if(r?.id===cmd.id){assert.equal(r.ok,true,r.error?.message);console.log(JSON.stringify(r.value));process.exit(0);}await delay(250);}throw Error('Live controller challenge timed out; never replay');
