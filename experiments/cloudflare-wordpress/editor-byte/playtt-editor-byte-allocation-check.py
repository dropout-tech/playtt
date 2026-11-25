"""Recompute six existing private allocation profiles without rerunning workerd."""
from pathlib import Path
import argparse, hashlib, json
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--local',required=True,action='store_true')
p.add_argument('--runtime',type=Path,required=True);a=p.parse_args();rt=a.runtime.resolve()
load=lambda p:json.loads(p.read_text(encoding='utf8'));sha=lambda b:hashlib.sha256(b).hexdigest()
owner=load(rt/'artifacts/playtt-editor-byte-allocation-owned-private.json')
result=load(rt/'artifacts/playtt-editor-byte-allocation-summary.json')
assert owner['phase']=='verified' and owner['disposed'] and result['result']=='pass'
assert result['cloudRequests']==result['outboundAttempts']==0 and len(result['runs'])==6
for variant,path in [('baseline','src/playtt-editor-lock.ts'),('candidate','scripts/playtt-editor-lock-byte-candidate.ts')]:
    assert sha((rt/path).read_text(encoding='utf8').encode())==result['sourceHashes'][variant]
for run in result['runs']:
    raw=(Path(owner['directory'])/f"{run['index']}-{run['variant']}-profile-private.json").read_bytes()
    assert len(raw)==run['profileBytes'] and sha(raw)==run['profileSha256']
    profile=json.loads(raw);stack=[profile['head']];nodes=total=patch=0
    while stack:
        n=stack.pop();nodes+=1;total+=n['selfSize']
        if n['callFrame']['functionName']=='patchPlayttEditorLock':patch+=n['selfSize']
        stack.extend(n['children'])
    assert (nodes,total,patch)==(run['nodes'],run['selfBytes'],run['patchSelfBytes'])
    assert len(profile['samples'])==run['samples'] and sum(s['size']for s in profile['samples'])==run['sampleSizeSum']
    assert run['outputBytes']==1574744 and run['outputSha256']=='ec1e9dc9cdc33309b2b6843bd26a3bec6dffe5e7fc1db0f05f49024e56b9012e'
    assert run['options']=={'samplingInterval':32768,'includeObjectsCollectedByMajorGC':True,'includeObjectsCollectedByMinorGC':True}
assert [r['variant']for r in result['runs']]==['baseline','candidate','candidate','baseline','baseline','candidate']
print(json.dumps({'result':'profiles-recomputed-exact','runs':6,'readOnly':True,'cloudRequests':0,
    'baselinePatchSelfBytes':[r['patchSelfBytes']for r in result['runs']if r['variant']=='baseline'],
    'candidatePatchSelfBytes':[r['patchSelfBytes']for r in result['runs']if r['variant']=='candidate']}))
