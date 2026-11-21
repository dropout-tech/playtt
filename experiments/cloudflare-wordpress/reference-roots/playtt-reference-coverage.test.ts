import assert from 'node:assert/strict';
import test from 'node:test';
import { checkReferenceCoverage } from '../scripts/playtt-reference-coverage.mjs';

function fixture() {
  const pointer = (n: number) => ({revision:`12345678-1234-4234-8234-${String(n).padStart(12,'0')}`,manifestKey:`sites/default/markdown/revisions/12345678-1234-4234-8234-${String(n).padStart(12,'0')}.json`,persistedAt:'2026-11-20T00:00:00Z'});
  const records: Record<string,any>={}, objects: any[]=[];
  for(const n of [1,2]){
    const p=pointer(n), digest=String(n).repeat(64), key='sites/default/restore-packs/'+digest+'.zip';
    records[p.manifestKey]={...p,restorePack:{objectKey:key,sha256:digest,size:10},files:[],uploads:[],wpContent:[]};
    objects.push({key:p.manifestKey,size:100},{key,size:10});
  }
  records['sites/default/markdown/current.json']=pointer(2);objects.push({key:'sites/default/markdown/current.json',size:100});
  const roots={schema:'playtt/coordinator-reference-roots/v1',siteId:'default',version:2,pointer:pointer(2),lease:null as any,completeCommitListing:true,safeToApply:false,
    commitReceipts:[{version:1,pointer:pointer(1)},{version:2,pointer:pointer(2)}]};
  const inventory={schema:'playtt/private-capacity-inventory/v1',bucket:'playtt-wordpress-pin-restore-audit',completeListing:true,metadataIncluded:true,metadataProfile:'references-v1',objects,records};
  const pack=records[pointer(2).manifestKey].restorePack;
  const registry={schema:'playtt/backup-pins/v1',generation:1,pins:[{...pointer(2),packKey:pack.objectKey,packSha256:pack.sha256,packBytes:pack.size}]};
  return {roots,inventory,registry,pointer};
}
test('an unpinned historical commit remains a conservative reference even when current and backup agree',()=>{
  const f=fixture(), result=checkReferenceCoverage(f.roots,f.inventory,f.registry);
  assert.equal(result.referencedRevisions,2);assert.equal(result.unpinnedCommitRevisions,1);assert.equal(result.safeToApply,false);
  assert.ok(result.referenced.find(r=>r.revision===f.pointer(1).revision)?.reasons.includes('commit-receipt'));
});
test('missing historical manifest or ZIP is not hidden by intact current content',()=>{
  for(const mode of ['manifest','pack','wrong-pack-size']){
    const f=fixture(), manifest=f.inventory.records[f.pointer(1).manifestKey];
    if(mode==='manifest'){delete f.inventory.records[f.pointer(1).manifestKey];f.inventory.objects=f.inventory.objects.filter(o=>o.key!==f.pointer(1).manifestKey);}
    if(mode==='pack')f.inventory.objects=f.inventory.objects.filter(o=>o.key!==manifest.restorePack.objectKey);
    if(mode==='wrong-pack-size')f.inventory.objects.find(o=>o.key===manifest.restorePack.objectKey).size++;
    assert.throws(()=>checkReferenceCoverage(f.roots,f.inventory,f.registry));
  }
});
test('expired lease bases are checked and never discarded as proof of completed writes',()=>{
  const f=fixture();f.roots.lease={active:false,expiresAt:1,base:f.pointer(1)};
  assert.equal(checkReferenceCoverage(f.roots,f.inventory,f.registry).leaseBaseIncluded,true);
  f.roots.lease.base=f.pointer(3);assert.throws(()=>checkReferenceCoverage(f.roots,f.inventory,f.registry));
});
test('incomplete inventory, publication/import objects and divergent current or protected pointers fail closed',()=>{
  for(const mode of ['incomplete','metadata-omitted','publication','import','current','pin','receipt-duplicate']){
    const f=fixture();
    if(mode==='incomplete')f.inventory.completeListing=false;
    if(mode==='metadata-omitted')delete f.inventory.records[f.pointer(1).manifestKey];
    if(mode==='publication')f.inventory.objects.push({key:'sites/default/publications/job-progress/unknown.json',size:20});
    if(mode==='import')f.inventory.objects.push({key:'sites/default/import-artifacts/unknown.json',size:20});
    if(mode==='current')f.inventory.records['sites/default/markdown/current.json']=f.pointer(1);
    if(mode==='pin')f.registry.pins[0].persistedAt='2026-11-19T00:00:00Z';
    if(mode==='receipt-duplicate')f.roots.commitReceipts.push(f.roots.commitReceipts[0]);
    assert.throws(()=>checkReferenceCoverage(f.roots,f.inventory,f.registry));
  }
});
test('referenced content objects require exact namespace and listed size',()=>{
  for(const mode of ['missing','cross-site','wrong-size']){
    const f=fixture(),digest='a'.repeat(64),key='sites/default/markdown/objects/'+digest;
    f.inventory.records[f.pointer(1).manifestKey].files=[{path:'page.md',sha256:digest,objectKey:key,size:4}];
    if(mode!=='missing')f.inventory.objects.push({key,size:mode==='wrong-size'?5:4});
    if(mode==='cross-site')f.inventory.records[f.pointer(1).manifestKey].files[0].objectKey=key.replace('default','other');
    assert.throws(()=>checkReferenceCoverage(f.roots,f.inventory,f.registry));
  }
});
