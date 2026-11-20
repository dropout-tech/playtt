import assert from 'node:assert/strict';

const ROOT='sites/default/', MANIFESTS=ROOT+'markdown/revisions/';
export function checkReferenceCoverage(roots, inventory, registry) {
  assert.equal(roots.schema,'playtt/coordinator-reference-roots/v1'); assert.equal(roots.siteId,'default');
  assert.equal(roots.completeCommitListing,true); assert.equal(roots.safeToApply,false);
  assert.equal(inventory.schema,'playtt/private-capacity-inventory/v1'); assert.equal(inventory.bucket,'playtt-wordpress-pin-restore-audit');
  assert.equal(inventory.completeListing,true); assert.equal(inventory.metadataIncluded,true); assert.equal(inventory.metadataProfile,'references-v1');
  assert.equal(registry.schema,'playtt/backup-pins/v1'); assert.equal(registry.generation,registry.pins.length);
  const objects=new Map(inventory.objects.map(o=>[o.key,o])); assert.equal(objects.size,inventory.objects.length);
  const manifests=new Map(), records=inventory.records, reasons=new Map();
  // This evaluator deliberately refuses configurations with publication work or
  // import artifacts until their full lifecycle references can be inspected.
  // It cannot silently label them absent by looking only at current.json.
  const unsupported=inventory.objects.filter(o=>o.key.startsWith(ROOT+'publications/')||o.key.startsWith(ROOT+'import-artifacts/'));
  assert.equal(unsupported.length,0,'Publication/import roots require a dedicated lifecycle audit');
  const expectedRecords=inventory.objects.filter(o=>o.key===ROOT+'markdown/current.json'||o.key.startsWith(MANIFESTS)).map(o=>o.key).sort();
  assert.deepEqual(Object.keys(records).sort(),expectedRecords,'Metadata catalog is incomplete');
  for(const [key,m] of Object.entries(records)) if(key.startsWith(MANIFESTS)) {
    assert.match(m.revision,/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/);
    assert.equal(key,MANIFESTS+m.revision+'.json'); assert.equal(m.manifestKey,key); assert.ok(!manifests.has(m.revision));
    manifests.set(m.revision,m);
  }
  const requirePointer=(p,reason)=>{
    assert.ok(p&&manifests.has(p.revision),'A coordinator/backup root references a missing manifest');
    const m=manifests.get(p.revision);
    for(const key of ['revision','manifestKey','persistedAt'])assert.equal(p[key],m[key],'Reference pointer differs from manifest');
    if(!reasons.has(p.revision))reasons.set(p.revision,new Set());reasons.get(p.revision).add(reason);
  };
  requirePointer(roots.pointer,'coordinator-current'); requirePointer(records[ROOT+'markdown/current.json'],'r2-current');
  assert.deepEqual(roots.pointer,records[ROOT+'markdown/current.json']);
  const versions=new Set();
  for(const receipt of roots.commitReceipts){assert.ok(Number.isSafeInteger(receipt.version)&&receipt.version>0&&!versions.has(receipt.version));versions.add(receipt.version);requirePointer(receipt.pointer,'commit-receipt');}
  assert.ok(roots.commitReceipts.some(r=>r.version===roots.version&&JSON.stringify(r.pointer)===JSON.stringify(roots.pointer)));
  if(roots.lease?.base)requirePointer(roots.lease.base,'lease-base-including-expired');
  const pinned=new Set();
  for(const pin of registry.pins){assert.ok(!pinned.has(pin.revision));pinned.add(pin.revision);requirePointer(pin,'durable-backup-pin');
    const pack=manifests.get(pin.revision).restorePack;assert.equal(pin.packKey,pack.objectKey);assert.equal(pin.packSha256,pack.sha256);assert.equal(pin.packBytes,pack.size);}
  for(const key of objects.keys())if(key.startsWith(ROOT+'pages/')){
    const revision=key.split('/')[3];assert.ok(manifests.has(revision));requirePointer(manifests.get(revision),'cached-page');
  }
  const dependencies=new Set();
  for(const revision of reasons.keys()){
    const m=manifests.get(revision), pack=m.restorePack;assert.match(pack.sha256,/^[a-f0-9]{64}$/);assert.equal(pack.objectKey,ROOT+'restore-packs/'+pack.sha256+'.zip');
    assert.equal(objects.get(pack.objectKey)?.size,pack.size,'Referenced ZIP missing or size differs');dependencies.add(pack.objectKey);dependencies.add(m.manifestKey);
    for(const [field,domain]of [['files','markdown'],['uploads','uploads'],['wpContent','wp-content']])for(const f of m[field]??[]){
      assert.match(f.sha256,/^[a-f0-9]{64}$/);assert.equal(f.objectKey,ROOT+domain+'/objects/'+f.sha256);
      assert.equal(objects.get(f.objectKey)?.size,f.size,'Referenced content object missing or size differs');dependencies.add(f.objectKey);
    }
  }
  const outside={};
  for(const object of inventory.objects)if(!dependencies.has(object.key)){
    const category=object.key===ROOT+'markdown/current.json'?'current-pointer':object.key.startsWith('runtime/')?'runtime-artifact':object.key.startsWith(ROOT+'pages/')?'cached-page':object.key.startsWith(ROOT+'markdown/objects/')?'other-canonical-content':object.key.startsWith(ROOT+'uploads/objects/')?'other-upload':object.key.startsWith(ROOT+'wp-content/objects/')?'other-wp-content':'unclassified';
    const group=outside[category]??={objects:0,bytes:0};group.objects++;group.bytes+=object.size;
  }
  return {result:'pass',scope:'Conservative coordinator-receipt/lease/current/pin/cache reference coverage for this private target with no publication or import objects; object presence/size, not new content hash or restore verification',
    safeToApply:false,manifests:manifests.size,commitReceipts:roots.commitReceipts.length,protectedPins:pinned.size,
    referencedRevisions:reasons.size,unpinnedCommitRevisions:new Set(roots.commitReceipts.filter(r=>!pinned.has(r.pointer.revision)).map(r=>r.pointer.revision)).size,
    uniqueReferencedObjects:dependencies.size,leaseBaseIncluded:!!roots.lease?.base,publicationAndImportObjects:0,
    outsideReferenceSet:outside,outsideReferenceSetDeletable:false,
    referenced: [...reasons].map(([revision,why])=>({revision,reasons:[...why].sort()})).sort((a,b)=>a.revision.localeCompare(b.revision))};
}
