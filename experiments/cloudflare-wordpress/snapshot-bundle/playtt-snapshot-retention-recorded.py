"""Offline planner integration on the previously verified local restored bundle.

The inventory, coordinator version and registry below describe a local mirror,
not the live bucket. No cloud request, deletion or pin registration occurs.
"""
from pathlib import Path
import base64,datetime as dt,hashlib,importlib.util,json

location=json.loads(Path('artifacts/playtt-snapshot-bundle-location-private.json').read_text(encoding='utf-8'))
directory=Path(location['directory']);bundle=directory/'overlay-independent'
index=json.loads((bundle/'bundle.json').read_text(encoding='utf-8'));anchor=location['overlayAnchor']
assert index['schema']=='playtt/snapshot-bundle/v1' and index['anchor']==anchor
result=json.loads((directory/'result.json').read_text(encoding='utf-8'));assert result['result']=='pass'
records={};raw_manifests={}
for item in index['objects']:
    if item['key'].startswith('sites/default/markdown/revisions/'):
        assert item['file']=='objects/'+item['sha256']
        raw=(bundle/item['file']).read_bytes();assert len(raw)==item['size'] and hashlib.sha256(raw).hexdigest()==item['sha256']
        records[item['key']]=json.loads(raw);raw_manifests[item['key']]=base64.b64encode(raw).decode()
assert hashlib.sha256(base64.b64decode(raw_manifests[anchor['manifestKey']])).hexdigest()==anchor['manifestSha256']
pointer={k:anchor[k] for k in ['revision','manifestKey','persistedAt']};records['sites/default/markdown/current.json']=pointer
objects=[{k:x[k] for k in ['key','size']} for x in index['objects']]+[{'key':'sites/default/markdown/current.json','size':len(json.dumps(pointer,separators=(',',':')).encode())}]
now=dt.datetime.now(dt.timezone.utc)
inventory={'schema':'playtt/private-capacity-inventory/v1','bucket':'playtt-wordpress-pin-restore-audit','at':now.isoformat(),'completeListing':True,'metadataIncluded':True,'metadataProfile':'references-overlay-v1','objects':objects,'records':records,'rawManifestBytes':raw_manifests,'scope':'Local restored dependency graph only; not a provider inventory'}
registry={'schema':'playtt/backup-pins/v1','generation':1,'pins':[{**anchor,'registeredAt':now.isoformat()}]}
roots={'schema':'playtt/coordinator-reference-roots/v1','siteId':'default','version':1,'pointer':pointer,'lease':None,'completeCommitListing':True,'safeToApply':False,'commitReceipts':[{'version':1,'pointer':pointer}]}
spec=importlib.util.spec_from_file_location('retention_candidate','scripts/playtt-plan-snapshot-retention.py');planner=importlib.util.module_from_spec(spec);spec.loader.exec_module(planner)
summary,plan=planner.plan(inventory,[],now,registry,roots)
assert summary['overlayRevisions']==1 and summary['retainedOverlayBases']==1 and summary['retainedRevisions']==2
assert summary['safeToApply'] is False and plan['proposedKeys']==[]
private=directory/'retention-local';private.mkdir()
for name,value in [('inventory',inventory),('registry',registry),('roots',roots),('plan',plan)]:
    (private/(name+'.json')).write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
report={'at':now.isoformat(),'result':'pass','scope':'Offline integration using the verified local overlay object store; simulated local coordinator/registry, not a live deletion proposal or remote restore',
        'summary':summary,'completeLocalDependencyGraphPreserved':True,'actualCloudInventoryUsed':False,'cloudflareRequests':0,'cloudflareMutations':0,'remotePinsRegistered':0}
Path('artifacts/playtt-snapshot-retention-recorded.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
