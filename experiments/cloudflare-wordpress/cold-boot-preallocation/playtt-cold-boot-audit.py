"""Read-only cold-boot/preallocation audit; emit public numeric evidence without tokens/paths."""
from pathlib import Path
import argparse, hashlib, json
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--local',action='store_true',required=True);p.add_argument('--check',action='store_true');a=p.parse_args()
rt=Path.cwd();load=lambda path:json.loads(path.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest();norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
names=['playtt-cold-boot-v4','playtt-preallocated-cold'];runs=[]
expected=['before-archive','archive-read','archive-verified','archive-written','archive-extracted','before-compaction','after-compaction']
for name in names:
 owner=load(rt/'artifacts'/(name+'-owned-private.json'));assert owner['phase']=='verified' and owner['sealed'] and owner['localProcessesDisposed']
 path=rt/'artifacts'/(name+'-summary.json');d=load(path)
 assert d['result']=='pass' and d['localOnly'] and d['cloudRequests']==0 and d['wordPressRequests']==1
 assert d['httpStatus']==200 and d['loginFieldsPresent'] and not d['browserUsed'] and d['assetRequests']==0
 assert d['originalSiteDataExact'] and d['r2InventoryUnchanged'] and d['canonicalVersion']==191 and d['r2ObjectCount']==301
 assert d['chargedBytes']==0 and d['outboundAttempts']==0 and d['localProcessesDisposed']
 budget=d['finalBudget'];assert budget['writeTracking']['sealed'] and budget['writeTracking']['window']['closed'] and budget['writeTracking']['pending']==0
 o=d['observation'];assert not o['errors'] and o['exceptionCount']==0 and not o['forcedGc']
 assert [e['generation'] for e in o['events'] if e['kind']=='generation']==[1]
 assert [s['stage'] for s in o['stages']]==expected
 for s in o['stages']:
  inv=s['inventory'];assert inv['unknownFileBuffers']==0 and inv['heapAliasedViews']==0
  assert inv['wasmBytes']==67108864
  assert s['observedComponentSumBytes']==s['heap']['usedSize']+s['heap']['backingStorageSize']+inv['wasmBytes']
 last=next(e for e in reversed(o['events']) if e['kind']=='php');assert last['heapBytes']==67108864
 after=d['afterUsage'];after_sum=after['usedSize']+after['backingStorageSize']+last['heapBytes']
 runs.append({'fixture':name,'summarySha256':sha(path.read_bytes()),'diagnosticBundleSha256':d['diagnosticBundleSha256'],
              'httpStatus':200,'loginFieldsPresent':True,'wallMs':d['wallMs'],'localCanonicalVersion':191,'r2Objects':301,
              'originalSiteDataExact':True,'r2InventoryUnchanged':True,'chargedBytes':0,'closed':True,'sealed':True,'pending':0,
              'exceptions':0,'stages':o['stages'],'afterResponse':{'heap':after,'lastKnownWasmBytes':last['heapBytes'],'observedComponentSumBytes':after_sum},
              'largestStageComponentSumBytes':max(s['observedComponentSumBytes'] for s in o['stages'])})
baseline,candidate=runs
rows=[{'stage':before['stage'],'baselineBytes':before['observedComponentSumBytes'],'candidateBytes':after['observedComponentSumBytes'],
       'differenceBytes':before['observedComponentSumBytes']-after['observedComponentSumBytes']}
      for before,after in zip(baseline['stages'],candidate['stages'])]
base_verified=baseline['stages'][2]['heap']['backingStorageSize']-baseline['stages'][1]['heap']['backingStorageSize']
candidate_verified=candidate['stages'][2]['heap']['backingStorageSize']-candidate['stages'][1]['heap']['backingStorageSize']
assert base_verified==5975824 and candidate_verified==32
assert baseline['stages'][-1]['extra']['copiedUsedBytes']==18196499
assert baseline['stages'][-1]['extra']['releasedCapacityBytes']==8574957
assert candidate['stages'][-1]['extra']['files']==0
proof_path=rt/'artifacts/playtt-preallocated-corpus-v2-proof.json';proof=load(proof_path);assert proof['result']=='pass'
assert proof['digestViewCases']==4 and proof['digestInputsUnchanged']
assert [c['files'] for c in proof['comparisons']]==[2154,8]
assert all(c['allFileBytesSizeAndModesEqual'] for c in proof['comparisons'])
for r in proof['results']:
 assert r['allFileHashesExact'] and r['archiveTemporaryFileRemoved']
 if r['label']=='candidate':assert r['unusedCapacityBytes']==0 and r['oversizedFiles']==0 and r['compaction']['files']==0
# Verify the executable prototype differs from the common diagnostic baseline by only the two recorded implementation edits.
plan=load(rt/'artifacts/playtt-preallocated-cold-build-private.json')
base_plan=load(rt/'artifacts/playtt-cold-boot-build-v2-private.json')
code=Path(plan['entry']).read_text(encoding='utf-8')
for e in reversed(plan['candidateEdits']):
 assert code.count(e['after'])==1
 code=code.replace(e['after'],e['before'])
assert code==Path(base_plan['entry']).read_text(encoding='utf-8')
assert len(plan['candidateEdits'])==2
for current in [plan,base_plan]:
 for module in current['modules']:assert sha(Path(module['path']).read_bytes())==module['sha256']
base_modules={Path(m['path']).name:m['sha256'] for m in base_plan['modules']}
assert sum(m['sha256']==base_modules[Path(m['path']).name] for m in plan['modules'])==5
for e in load(rt/'artifacts/playtt-recovery-provider-source-plan.json')['sources']:assert sha(norm(rt/e['path']))==e['sha256']
report={'schema':'playtt/cold-boot-preallocation-audit/v1','result':'pass','runs':runs,'stageComparison':rows,
        'semanticProofSha256':sha(proof_path.read_bytes()),'baselineSourceSha256':proof['baselineSourceSha256'],
        'candidateSourceSha256':proof['candidateSourceSha256'],'candidateImplementationEdits':2,'fiveBinaryModulesExact':True,
        'diagnosticCandidateReversePatchExact':True,'digestStageBackingIncreaseBytes':{'baseline':base_verified,'candidate':candidate_verified,'avoidedCopyBytes':5975792},
        'sourceChangesAdoptedCentrally':False,'freshFullSourceCandidateBuild':False,'providerRequests':0,'providerDeployments':0,
        'successfulLoginGets':2,'failedDiagnosticLoginGets':2,'browserUsed':False,'productionChanged':False,
        'failureHistory':[{'attempt':'v1','result':'sandbox EACCES on loopback before arming; exited1/disposed, no WordPress request'},
                          {'attempt':'v2','result':'first diagnostic barrier timed out/HTTP500; protocol cause not captured; closed/sealed/pending0/disposed/exit1'},
                          {'attempt':'v3','result':'first sample obtained, Runtime.evaluate Cannot find default execution context; HTTP500; closed/sealed/pending0/disposed/exit1'},
                          {'attempt':'semantic-v1','result':'full2154-file pair passed; verifier treated valid empty MEMFS contents=null as bytes and failed before finishing edge fixtures; all PHP exited; corrected verifier in newv2'}],
        'next':'Build the single candidate TypeScript module through the complete source pipeline; then verify native Chinese editor/save/restart with the full artifact before adopting into central research. No cloud cutover.',
        'limitations':['Seven async service-binding measurement barriers and FS inventories alter scheduling/GC and add memory. These are observed component sums, not continuous or cloud peaks.',
                       'Single fixed-order pair, local Windows workerd;2525/2517ms are diagnostic wall samples, not a stable latency improvement.',
                       'Candidate stage samples below diagnostic128MiB do not establish provider memory admission, editor/Chinese initialization stability or sustained Free.',
                       'Both changes tested together in the cold flow; the isolated digest-stage delta supports that copy attribution, not a complete attribution of every allocation.',
                       'Node semantic cases cover actual pinned core bytes/sizes/modes and8edge files; malformed ZIP/failure-injection and full candidate-source rebuild remain outside this evidence.',
                       'No changes to original snapshots, current central TypeScript/loader, cloud state, budgets or pins. Local191 is not cloud181.']}
out=rt/'artifacts/playtt-cold-boot-preallocation-audit.json'
if a.check:assert load(out)==report
else:
 with out.open('x',encoding='utf-8')as f:f.write(json.dumps(report,indent=2)+'\n')
print(json.dumps({'result':'pass','checkOnly':a.check,'stageMaxima':[r['largestStageComponentSumBytes'] for r in runs],'postResponseSums':[r['afterResponse']['observedComponentSumBytes']for r in runs],'sourceAdopted':False,'providerRequests':0}))
