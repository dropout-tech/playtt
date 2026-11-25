import assert from 'node:assert/strict';
import {readFile,writeFile,rename,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const action=process.argv[2],label=process.argv[3];assert.ok(['status','mark','saved','restart','cold','finish'].includes(action));assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-core-lru-editor-',load=async p=>JSON.parse(await readFile(p,'utf8')),owner=await load(prefix+'owned-private.json');assert.equal(owner.phase,'browser-ready');assert.ok(Date.now()<owner.expiresAt);
const cmd={id:randomUUID(),action,...(action==='mark'?{label}:{})};await access(prefix+'command-private.json').then(()=>{throw Error('Pending command: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const temp=prefix+'command-'+cmd.id+'-private.json';await writeFile(temp,JSON.stringify(cmd),{flag:'wx'});await rename(temp,prefix+'command-private.json');
const deadline=Date.now()+55000;while(Date.now()<deadline){let r;try{r=await load(prefix+'reply-private.json');}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}if(r?.id===cmd.id){assert.equal(r.ok,true,r.error?.message);console.log(JSON.stringify(r.value));process.exit(0);}await new Promise(r=>setTimeout(r,250));}throw Error('Controller timeout: inspect same process and command, never replay');
