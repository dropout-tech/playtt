"""Offline bounded numeric interpretation of the private local allocation sample."""
from pathlib import Path
from collections import Counter
import argparse,datetime as dt,hashlib,json,re
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,required=True)
rt=p.parse_args().runtime.resolve();sha=lambda b:hashlib.sha256(b).hexdigest()
owner=json.loads((rt/'artifacts/playtt-exception-allocation-owned-private.json').read_text(encoding='utf8'))
assert owner['phase']=='verified' and owner['sealed'] and owner['localProcessesDisposed']
directory=Path(owner['directory']);obs=json.loads((directory/'exception-allocation-observation.json').read_text(encoding='utf8'));a=obs['allocation']
raw=(directory/'allocation-private.json').read_bytes();assert len(raw)==a['bytes'] and sha(raw)==a['sha256']
assert a['options']=={'samplingInterval':32768,'includeObjectsCollectedByMajorGC':True,'includeObjectsCollectedByMinorGC':True}
profile=json.loads(raw);stack=[(profile['head'],[])];by_name=Counter();locations=set();nodes=0;parents=[]
safe=lambda s:s if re.fullmatch(r'[A-Za-z0-9_$ .:<>()[\]/-]{0,140}',s)else'other'
while stack:
 n,path=stack.pop();nodes+=1;f=n['callFrame'];name=safe(f['functionName'])or'(anonymous)';size=n['selfSize'];assert size>=0
 by_name[name]+=size;stack.extend((x,path+[name])for x in n['children'])
 if name=='lookupPath':locations.add(f['lineNumber'])
 if name in ['split','lookupPath','join']and size>200000:parents.append({'function':name,'attributedSelfBytes':size,'ancestors':path[-7:]})
deploy=json.loads((rt/'artifacts/playtt-old-provider-deploy-plan.json').read_text(encoding='utf8'))['targets']['fallback']
bundle_entry=next(x for x in deploy['modules']if x['path'].endswith('.js'));bundle=(rt/bundle_entry['path']).read_bytes();assert sha(bundle)==bundle_entry['sha256']
assert locations=={18431};assert 'lookupPath(path, opts = {})' in bundle.decode().splitlines()[18431]
window=[e for e in obs['events']if a['startedAt']<=e['at']<=a['finishedAt']]
requests=[e for e in window if e['kind']=='request'];assert sum(e['category']=='post-editor'for e in requests)==2
assert not obs['errors'] and not any(e['kind']=='exception'for e in obs['events'])
report={
 'schema':'playtt/local-allocation-audit/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'result':'analyzed',
 'scope':'Sampled JS allocations across two warm native editor reloads; includes objects collected during sampling, not simultaneous heap, PHP allocator, RSS, provider peak or billed CPU',
 'profileBytes':len(raw),'profileSha256':sha(raw),'options':a['options'],'elapsedMs':a['finishedAt']-a['startedAt'],
 'profileNodes':nodes,'samples':len(profile['samples']),'nodeAttributedSelfBytes':sum(by_name.values()),
 'sampleAttributedSizeSum':sum(x['size']for x in profile['samples']),
 'metricCaveat':'Node selfSize and sample sizes are separate sampling outputs; do not add them, equate them to retained bytes, or infer exact allocation/peak from sampling.',
 'topFunctions':[{'function':k,'attributedSelfBytes':v}for k,v in by_name.most_common(25)],
 'pathFunctionsAttributedSelfBytes':sum(by_name[k]for k in ['split','lookupPath','join']),
 'pathCallsites':sorted(parents,key=lambda x:x['attributedSelfBytes'],reverse=True)[:15],
 'lookupPathSource':{'bundleSha256':bundle_entry['sha256'],'line':18432,'declarationVerified':True},
 'requestsDuringSampling':len(requests),'requestCategories':dict(Counter(e['category']for e in requests)),
 'requestStatusCounts':dict(Counter(e['status']for e in requests)),
 'capturedExceptionsThisRun':0,'priorExceptionResolved':False,
 'cloudRequests':0,'runtimeSourceChanged':False,'rawProfilePrivate':True,
}
(rt/'artifacts/playtt-allocation-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:report[k]for k in ['profileNodes','samples','elapsedMs','nodeAttributedSelfBytes','pathFunctionsAttributedSelfBytes','requestCategories']}))
