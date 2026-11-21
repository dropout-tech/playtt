import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,readdir,unlink,rmdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const client=resolve('scripts/playtt-envelope-provider-ui-control.mjs');
async function fixture(){const root=resolve('artifacts/control-test-'+randomUUID()),directory=root+'/artifacts',prefix=directory+'/playtt-envelope-provider-ui-';await mkdir(directory,{recursive:true});await writeFile(prefix+'owned-private.json',JSON.stringify({phase:'browser-ready',expiresAt:Date.now()+60000}));return{root,directory,prefix,async cleanup(){assert.ok(root.startsWith(resolve('artifacts')+'/')||root.startsWith(resolve('artifacts')+'\\'));for(const name of await readdir(directory))await unlink(directory+'/'+name);await rmdir(directory);await rmdir(root);}};}
function run(f){const child=spawn(process.execPath,[client,'cold-begin','--remote'],{cwd:f.root,stdio:['ignore','pipe','pipe']});let out='',error='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>error+=b);const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve({code,out,error}));});return{child,done};}
test('partial and stale replies do not replay a command or satisfy a fresh ID',async()=>{
 const f=await fixture(),p=run(f);try{
  let command;const until=Date.now()+5000;while(!command){try{command=JSON.parse(await readFile(f.prefix+'command-private.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(Date.now()<until);if(!command)await delay(20);}
  assert.equal(command.action,'cold-begin');assert.match(command.id,/^[a-f0-9-]{36}$/);
  await writeFile(f.prefix+'reply-private.json','');await delay(350);
  assert.equal(p.child.exitCode,null,'Partial reply must not terminate client');
  await writeFile(f.prefix+'reply-private.json',JSON.stringify({id:randomUUID(),ok:true,value:{wrong:true}}));await delay(350);assert.equal(p.child.exitCode,null,'Stale ID must not complete client');
  await writeFile(f.prefix+'reply-private.json',JSON.stringify({id:command.id,ok:true,value:{result:'live',action:'cold-begin'}}));
  const result=await p.done;assert.equal(result.code,0,result.error);assert.deepEqual(JSON.parse(result.out),{result:'live',action:'cold-begin'});assert.deepEqual(JSON.parse(await readFile(f.prefix+'command-private.json','utf8')),command);assert.equal((await readdir(f.directory)).filter(n=>/command-.*-private/.test(n)).length,0);
 }finally{if(p.child.exitCode===null)p.child.kill();await p.done;await f.cleanup();}
});
test('an existing command is rejected without overwriting its identity',async()=>{
 const f=await fixture();try{const pending=JSON.stringify({id:randomUUID(),action:'finish'});await writeFile(f.prefix+'command-private.json',pending);const result=await run(f).done;assert.notEqual(result.code,0);assert.match(result.error,/command is pending/);assert.equal(await readFile(f.prefix+'command-private.json','utf8'),pending);}finally{await f.cleanup();}
});
