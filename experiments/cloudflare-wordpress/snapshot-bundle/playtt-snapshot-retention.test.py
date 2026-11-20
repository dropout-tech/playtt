import base64,copy,hashlib,importlib.util,json,sys,unittest
from pathlib import Path

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
capacity=Path('../../../playtt/experiments/cloudflare-wordpress/capacity').resolve();sys.path.insert(0,str(capacity))
legacy=load('legacy_snapshot_retention_tests',capacity/'test_retention.py')
candidate=load('snapshot_retention_candidate',Path('scripts/playtt-plan-snapshot-retention.py'))
ROOT,MANIFESTS=legacy.ROOT,legacy.MANIFESTS
def roots_for(inv):
    pointer=copy.deepcopy(inv['records'].get(ROOT+'markdown/current.json',{}))
    return {'schema':'playtt/coordinator-reference-roots/v1','siteId':'default','version':1,'pointer':pointer,'lease':None,'completeCommitListing':True,'safeToApply':False,'commitReceipts':[{'version':1,'pointer':pointer}]}
def with_roots(inv,pins,now,registry=None):return candidate.plan(inv,pins,now,registry,roots_for(inv))
legacy.plan_with_registry=with_roots
class FullPackRegressionTests(legacy.RetentionTests):pass

def fixture(overlay_index=-1):
    inv,revs=legacy.fixture();base=inv['records'][MANIFESTS+revs[0]+'.json'];overlay=inv['records'][MANIFESTS+revs[overlay_index]+'.json']
    def content(path,value):
        raw=json.dumps(value,separators=(',',':')).encode();digest=hashlib.sha256(raw).hexdigest();key=ROOT+'markdown/objects/'+digest
        if not any(x['key']==key for x in inv['objects']):inv['objects'].append({'key':key,'size':len(raw)})
        return {'path':path,'sha256':digest,'size':len(raw),'objectKey':key}
    base['files']=[content('_runtime/playtt-postmeta-layout.json',{'schema':'playtt/postmeta-table/v1'}),content('_tables/postmeta.json',[{'meta_id':'1','post_id':'2','meta_key':'_edit_lock','meta_value':'1795200000:1'}]),content('_runtime/playtt-auto-increment.json',{'schema':'playtt/auto-increment/v1','sequences':{'wp_postmeta':'1'}})]
    base['restorePack'].update(schema='wp-codebox/cloudflare-canonical-restore-pack/v1',fileCount=3,decodedBytes=sum(x['size'] for x in base['files']))
    inv['objects']=[o for o in inv['objects'] if o['key']!=overlay['restorePack']['objectKey']]
    inv['rawManifestBytes']={};inv['metadataProfile']='references-overlay-v1'
    def raw(m):
        data=json.dumps(m,separators=(',',':')).encode();inv['rawManifestBytes'][m['manifestKey']]=base64.b64encode(data).decode()
        next(x for x in inv['objects'] if x['key']==m['manifestKey'])['size']=len(data);return data
    base_raw=raw(base);overlay['files']=copy.deepcopy(base['files']);overlay['files'][1]=content('_tables/postmeta.json',[{'meta_id':'1','post_id':'2','meta_key':'_edit_lock','meta_value':'1795200120:2'}])
    overlay['restorePack']={'schema':'playtt/canonical-metadata-overlay/v1','base':{k:base[k] for k in ['revision','manifestKey','persistedAt']}}
    overlay['restorePack']['base'].update(sha256=hashlib.sha256(base_raw).hexdigest(),size=len(base_raw));raw(overlay)
    return inv,revs,base,overlay,raw
def registry(inv,manifest,pack):
    pin={k:manifest[k] for k in ['revision','manifestKey','persistedAt']}
    pin.update(manifestSha256=hashlib.sha256(base64.b64decode(inv['rawManifestBytes'][manifest['manifestKey']])).hexdigest(),packKey=pack['objectKey'],packSha256=pack['sha256'],packBytes=pack['size'],registeredAt=legacy.NOW.isoformat())
    return {'schema':'playtt/backup-pins/v1','generation':1,'pins':[pin]}
empty_registry={'schema':'playtt/backup-pins/v1','generation':0,'pins':[]}

class OverlayRetentionTests(unittest.TestCase):
    def test_retained_overlay_keeps_old_unpinned_base_and_shared_pack(self):
        inv,revs,base,overlay,_=fixture();summary,plan=candidate.plan(inv,[],legacy.NOW,registry(inv,overlay,base['restorePack']),roots_for(inv))
        self.assertIn('retained-overlay-base',plan['retained'][base['revision']]);self.assertNotIn(base['manifestKey'],plan['proposedKeys']);self.assertNotIn(base['restorePack']['objectKey'],plan['proposedKeys'])
        self.assertEqual(summary['retainedOverlayBases'],1);self.assertEqual(summary['proposedRetiredRevisions'],9);self.assertFalse(summary['safeToApply']);self.assertFalse(summary['localBackupIntegrityVerified'])
    def test_retired_overlay_cannot_remove_a_separately_pinned_base_pack(self):
        inv,revs,base,overlay,_=fixture(1);summary,plan=candidate.plan(inv,[],legacy.NOW,registry(inv,base,base['restorePack']),roots_for(inv))
        self.assertIn(overlay['manifestKey'],plan['proposedKeys']);self.assertNotIn(base['restorePack']['objectKey'],plan['proposedKeys']);self.assertNotIn(base['manifestKey'],plan['proposedKeys'])
    def test_unreferenced_old_overlay_and_base_only_propose_one_shared_pack(self):
        inv,revs,base,overlay,_=fixture(1);_,plan=candidate.plan(inv,[],legacy.NOW,empty_registry,roots_for(inv))
        self.assertIn(base['manifestKey'],plan['proposedKeys']);self.assertIn(overlay['manifestKey'],plan['proposedKeys']);self.assertEqual(plan['proposedKeys'].count(base['restorePack']['objectKey']),1)
        self.assertTrue(all(x.startswith((MANIFESTS,candidate.PACKS)) for x in plan['proposedKeys']))
    def test_corrupt_or_missing_overlay_dependencies_fail_closed(self):
        for mode in ['missing','hash','raw-missing','chain','cross-site','assets','layout','format']:
            with self.subTest(mode=mode):
                inv,revs,base,overlay,raw=fixture()
                if mode=='missing':inv['objects']=[o for o in inv['objects'] if o['key']!=base['restorePack']['objectKey']]
                if mode=='hash':overlay['restorePack']['base']['sha256']='0'*64;raw(overlay)
                if mode=='raw-missing':del inv['rawManifestBytes'][base['manifestKey']]
                if mode=='chain':base['restorePack']=copy.deepcopy(overlay['restorePack']);raw(base)
                if mode=='cross-site':overlay['restorePack']['base']['manifestKey']=base['manifestKey'].replace('default','other');raw(overlay)
                if mode=='assets':overlay['wpContentDeleted']=['themes/removed.php'];raw(overlay)
                if mode=='layout':overlay['files']=overlay['files'][1:];raw(overlay)
                if mode=='format':overlay['restorePack']['schema']='unknown';raw(overlay)
                with self.assertRaises((ValueError,KeyError)):candidate.plan(inv,[],legacy.NOW,empty_registry,roots_for(inv))
    def test_missing_or_incomplete_coordinator_evidence_never_proposes(self):
        for mode in ['none','incomplete','current','duplicate','future']:
            with self.subTest(mode=mode):
                inv,_,_,_,_=fixture();roots=roots_for(inv)
                if mode=='none':roots=None
                if mode=='incomplete':roots['completeCommitListing']=False
                if mode=='current':roots['pointer']={}
                if mode=='duplicate':roots['commitReceipts'].append(copy.deepcopy(roots['commitReceipts'][0]))
                if mode=='future':roots['commitReceipts'][0]['version']=2
                with self.assertRaises(ValueError):candidate.plan(inv,[],legacy.NOW,empty_registry,roots)
    def test_old_commit_and_expired_lease_remain_protected(self):
        inv,revs=legacy.fixture();roots=roots_for(inv);roots['version']=2;roots['commitReceipts'][0]['version']=2
        pointer=lambda rev:{k:inv['records'][MANIFESTS+rev+'.json'][k] for k in ['revision','manifestKey','persistedAt']}
        roots['commitReceipts'].append({'version':1,'pointer':pointer(revs[0])});roots['lease']={'active':False,'expiresAt':1,'base':pointer(revs[1])}
        summary,plan=candidate.plan(inv,[],legacy.NOW,empty_registry,roots)
        self.assertIn('coordinator-commit-receipt',plan['retained'][revs[0]]);self.assertIn('coordinator-lease-base-including-expired',plan['retained'][revs[1]]);self.assertTrue(summary['leaseBaseIncluded'])
    def test_unknown_lifecycle_objects_and_wrong_overlay_pin_are_rejected(self):
        for mode in ['progress','import','pin']:
            inv,_,base,overlay,_=fixture();pins=registry(inv,overlay,base['restorePack'])
            if mode=='progress':inv['objects'].append({'key':ROOT+'publications/job-progress/unknown.json','size':10})
            if mode=='import':inv['objects'].append({'key':ROOT+'import-artifacts/unknown','size':10})
            if mode=='pin':pins['pins'][0]['manifestSha256']='0'*64
            with self.assertRaises(ValueError):candidate.plan(inv,[],legacy.NOW,pins,roots_for(inv))

if __name__=='__main__':unittest.main()
