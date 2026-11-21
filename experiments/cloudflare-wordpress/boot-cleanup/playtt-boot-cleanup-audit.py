from pathlib import Path
import argparse,hashlib,json
parser=argparse.ArgumentParser();parser.add_argument('--local',action='store_true',required=True);parser.add_argument('--check',action='store_true');args=parser.parse_args()
rt=Path.cwd();read=lambda name:json.loads((rt/name).read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest();norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
fault=read('artifacts/playtt-preallocated-fault-v3-proof.json');fault_owner=read('artifacts/playtt-preallocated-fault-v3-owned-private.json')
lifetime=read('artifacts/playtt-boot-cleanup-v4-proof.json');lifetime_owner=read('artifacts/playtt-boot-cleanup-v4-owned-private.json')
run=read('artifacts/playtt-boot-cleanup-local-v2-summary.json');owner=read('artifacts/playtt-boot-cleanup-local-v2-owned-private.json')
build=read('artifacts/playtt-boot-cleanup-build-proof.json');plan=read('artifacts/playtt-boot-cleanup-build-private.json')
for o in [fault_owner,lifetime_owner]:assert o['phase']=='verified' and o['allPhpInstancesExited']
assert owner['phase']=='verified' and owner['sealed'] and owner['localProcessesDisposed']
assert fault['result']==lifetime['result']==run['result']==build['result']=='pass'
assert fault['cases']==35 and lifetime['cases']==6
assert sum(r['result']=='rejected' for r in fault['results'])==31
for r in fault['results']:assert r['temporaryRemoved'] and r['noEscapeFile'] and r['noArchiveOrDestinationDescriptor'] and r['phpExited']
assert [r['result']for r in fault['results']if r['name']=='crc-corruption']==['trusted-archive-accepted-with-entry-hash-mismatch','corrupt-entry-rejected']
for name in ['preallocation-io-failure','partial-stream-write','stream-read-io-failure']:
 r=next(r for r in fault['results']if r['name']==name);assert r['faultHits']>0 and r['result']=='rejected'
partial=next(r for r in fault['results']if r['name']=='partial-stream-write');assert partial['shortBytes']==7 and partial['partialDestinationBytes']==65539
assert lifetime['results'][0]['baselineStillAliveAfterRejectedBoot'] and lifetime['results'][1]['disposedOnFailure']
assert lifetime['candidateHelperSha256']==build['helperSha256']
assert sha(norm(rt/'scripts/playtt-boot-cleanup-candidate.ts'))==build['helperSha256']
assert run['productionBundleSha256']==build['bundleSha256']==plan['productionBundleSha256']
assert run['diagnosticBundleSha256']==build['diagnosticBundleSha256']==plan['diagnosticBundleSha256']
for m in plan['modules']+plan['productionModules']:assert sha(Path(m['path']).read_bytes())==m['sha256']
diagnostic=Path(plan['entry']).read_text(encoding='utf-8');production=Path(next(m['path']for m in plan['productionModules']if m['path'].endswith('.js'))).read_text(encoding='utf-8');edit=plan['diagnosticReplacement'];assert diagnostic.count(edit['after'])==1 and diagnostic.replace(edit['after'],edit['before'])==production
assert run['failedStatus']==500 and run['retryStatus']==200 and run['wordPressRequests']==2
assert all(run[k] for k in ['loginFieldsPresent','sameExecutionContainer','noReseedOrRearm','failedRuntimeExplicitlyExited','retryCreatedNewRuntime','originalSiteDataExact','r2InventoryUnchanged','localProcessesDisposed'])
obs=run['observation'];assert obs['sameReadContainer'] and obs['corruptedReads']==obs['validReads']==1 and obs['otherExceptionCount']==0
assert obs['ownership']==[{'stage':'created','id':1,'live':1},{'stage':'exited','id':1,'live':0},{'stage':'created','id':2,'live':1}]
assert run['canonicalVersion']==190 and run['chargedBytes']==0 and run['outboundAttempts']==0
b=run['finalBudget'];assert b['chargedBytes']==b['chargedPuts']==0 and b['writeTracking']['pending']==0 and b['writeTracking']['sealed'] and b['writeTracking']['window']['closed']
source=read('artifacts/playtt-recovery-provider-source-plan.json');assert len(source['sources'])==82
for e in source['sources']:assert sha(norm(rt/e['path']))==e['sha256'],e['path']
failures=[]
for name in ['playtt-preallocated-fault','playtt-preallocated-fault-v2','playtt-boot-cleanup','playtt-boot-cleanup-v2','playtt-boot-cleanup-local']:
 o=read('artifacts/'+name+'-owned-private.json');assert o['phase']=='failed';assert o.get('allPhpInstancesExited')or o.get('localProcessesDisposed')
 if name.endswith('-local'):assert o['sealed']
 evidence={'attempt':name,'failureRetained':True,'processOrPhpDisposed':True}
 if name=='playtt-boot-cleanup':
  evidence.update(phpExplicitExitProven=False,terminalNodeExit=1,originalDisposedFlagReliable=False,note='The liveness PHP request rotated the runtime and removed it from the test tracking set before the getter error; only terminal Node exit proves final release for this failed attempt.')
 failures.append(evidence)
report={'schema':'playtt/boot-cleanup-audit/v1','at':run['at'],'result':'pass','faultCases':35,'positiveCorpusControls':2,'malformedOrIoOrGuardRejections':32,'trustedArchiveCrcCase':{'originalExtractToAcceptedMismatchedEntry':True,'candidateStreamRejected':True,'archiveDigestRecomputedForFixture':True,'notProofAgainstManifestAndArchiveReplacement':True},'shortWrite':{'copiedBytes':7,'preallocatedFileBytes':65539,'rejected':True},'actualPhpLifetimeCases':6,'upstreamRejectedBootKeepsAllocatedPhp':True,'candidateDisposesAfterSetupOrValidationFailure':True,'cleanupFailureRetainsBothErrors':True,'successRemainsCallerOwned':True,'helperSha256':build['helperSha256'],'fullSourceBuild':{'sources':83,'inputs':206,'bundleSha256':build['bundleSha256'],'typecheck':'pass','exactScopedCompiledChanges':True,'fiveBinaryModulesUnchanged':True,'centralSourceFilesUnchanged':82},'workerd':{'requests':2,'statuses':[500,200],'sameReadContainer':True,'constructorEventsObserved':obs['executionContainers'],'lifecycle':obs['ownership'],'corruptedInMemoryReads':1,'intactRetryReads':1,'expectedHashFailureExceptionEvents':obs['expectedHashFailureCount'],'otherExceptions':0,'loginFieldsPresent':True,'canonicalVersion':190,'r2Objects':run['r2ObjectCount'],'allDataAndInventoryExact':True,'chargedBytes':0,'chargedPuts':0,'closed':True,'sealed':True,'pending':0,'disposed':True,'outbound':0},'failuresRetained':failures,'centralRuntimeChanged':False,'cloudRequests':0,'deployed':False,'productionChanged':False,'limitations':['This repairs cleanup after a public request handler has been returned; dependency failures during handler construction remain outside its ownership contract.','The workerd probe includes numeric lifecycle instrumentation and no browser editor flow; this combined candidate has not yet passed native save/restart.','Explicit disposal is proven, not immediate GC/RSS release or provider memory acceptance.','Earlier full-editor samples141-143MiB remain unresolved; no new memory improvement claim.','All-Cloudflare Free acceptance and the full site goal remain open.']}
path=rt/'artifacts/playtt-boot-cleanup-audit.json';serialized=json.dumps(report,indent=2)+'\n'
if args.check:assert path.read_text(encoding='utf-8')==serialized
else:
 assert not path.exists();path.write_text(serialized,encoding='utf-8')
print(json.dumps({'result':'pass','faultCases':35,'lifetimeCases':6,'workerdStatuses':[500,200],'sameReadContainer':True,'chargedBytes':0,'centralRuntimeChanged':False,'readOnlyCheck':args.check}))
