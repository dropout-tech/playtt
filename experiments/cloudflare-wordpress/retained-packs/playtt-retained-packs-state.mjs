import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { client, source, load, save, hash } from './playtt-pin-restore-lib.mjs';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--before','--after'].includes(x));assert.ok(mode);
const prefix='artifacts/playtt-retained-packs-',c=await client(source);
const current=await c.operator('operator-fence-status');assert.equal(current.coherent,true);assert.equal(current.fence.active,false);
assert.equal(current.state.version,309);assert.equal(current.state.pointer.revision,'c0ba467c-c422-41e8-861c-64926c69e1fb');assert.equal((await c.control()).state,'paused');
const pr=await c.request('/__playtt-backup-pins',{headers:c.auth});assert.equal(pr.status,200);const registry=await pr.json();assert.equal(registry.generation,21);
const br=await c.request('/__playtt-capacity',{headers:c.auth});assert.equal(br.status,200);const budget=await br.json();assert.equal(budget.scope,'playtt-wordpress-rebuild-audit');
const record={state:current.state,registry,budget};
if(mode==='--before'){
 let exists=false;try{await readFile(prefix+'before-private.json');exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false,'Do not overwrite the initial comparison state');
 await save(prefix+'before-private.json',record);await save(prefix+'registry-private.json',registry);
}else{
 const before=await load(prefix+'before-private.json');assert.equal(hash(record),hash(before));
}
const report={at:new Date().toISOString(),result:'pass',mode:mode.slice(2),scope:'Read-only source coordinator, immutable backup registry and payload ledger comparison; not an atomic snapshot or a drain proof',version:current.state.version,revision:current.state.pointer.revision,registryGeneration:registry.generation,registrySha256:hash(registry),fenceActive:false,publisher:'paused',chargedBytes:budget.chargedBytes,chargedPuts:budget.chargedPuts,checks:c.checks};
await save(prefix+mode.slice(2)+'.json',report);console.log(JSON.stringify({result:'pass',mode:mode.slice(2),version:current.state.version,pins:registry.generation}));
