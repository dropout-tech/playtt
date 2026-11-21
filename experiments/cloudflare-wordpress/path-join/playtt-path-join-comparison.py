"""Compare the completed native baseline/candidate allocation samples, without private payloads."""
from pathlib import Path
from collections import Counter
import argparse,datetime as dt,hashlib,json,re
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,required=True);rt=p.parse_args().runtime.resolve()
sha=lambda b:hashlib.sha256(b).hexdigest();plan=json.loads((rt/'artifacts/playtt-path-join-deploy-plan.json').read_text(encoding='utf8'));runs=[]
for variant in ['baseline','candidate']:
 owner=json.loads((rt/f'artifacts/playtt-path-join-{variant}-native-owned-private.json').read_text(encoding='utf8'));assert owner['phase']=='verified' and owner['sealed'] and owner['localProcessesDisposed']
 directory=Path(owner['directory']);obs=json.loads((directory/'exception-allocation-observation.json').read_text(encoding='utf8'));a=obs['allocation'];raw=(directory/'allocation-private.json').read_bytes();assert len(raw)==a['bytes'] and sha(raw)==a['sha256'];profile=json.loads(raw)
 stack=[profile['head']];totals=Counter();nodes=0
 while stack:
  n=stack.pop();nodes+=1;stack.extend(n['children']);name=n['callFrame']['functionName']or'(anonymous)';name=name if re.fullmatch(r'[A-Za-z0-9_$ .:<>()[\]/-]{1,140}',name)else'other';totals[name]+=n['selfSize']
 req=[e for e in obs['events']if e['kind']=='request'and a['startedAt']<=e['at']<=a['finishedAt']]
 assert len(req)==8 and not any(e['status']>=400 for e in req)
 assert not obs['errors'] and not any(e['kind']=='exception'for e in obs['events'])
 bundle=next(e for e in plan['targets'][variant]['modules']if e['path'].endswith('.js'));assert sha(Path(bundle['path']).read_bytes())==bundle['sha256']
 runs.append({'variant':variant,'bundleSha256':bundle['sha256'],'profileSha256':sha(raw),'options':a['options'],'samplingElapsedMs':a['finishedAt']-a['startedAt'],'nodes':nodes,'samples':len(profile['samples']),'nodeAttributedSelfBytes':sum(totals.values()),'pathFunctionsAttributedSelfBytes':sum(totals[k]for k in ['split','lookupPath','join']),'topFunctions':[{'function':k,'attributedSelfBytes':v}for k,v in totals.most_common(20)],'requestMix':[{'category':e['category'],'method':e['method'],'status':e['status'],'version':e.get('version')}for e in req],'editorHtmlWallMs':[e['wallMs']for e in req if e['category']=='post-editor'],'phpHeapPeakObserved':max(e.get('heapBytes',0)for e in obs['events']),'exceptions':0})
assert runs[0]['options']==runs[1]['options'];assert runs[0]['requestMix']==runs[1]['requestMix']
before=Path(plan['targets']['baseline']['entry']).read_text(encoding='utf8');after=Path(plan['targets']['candidate']['entry']).read_text(encoding='utf8')
old='current_path = PATH.join2(current_path, parts[i]);';new='current_path = current_path === "/" ? "/" + parts[i] : current_path + "/" + parts[i];';assert before.count(old)==1 and before.replace(old,new)==after
report={'schema':'playtt/path-join-native-comparison/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'result':'local-candidate-supported','runs':runs,'changedBundleStatements':1,'requestMixAndVersionsExact':True,'nodeAttributedSelfBytesReduction':runs[0]['nodeAttributedSelfBytes']-runs[1]['nodeAttributedSelfBytes'],'nodeAttributedSelfBytesReductionPercent':100*(1-runs[1]['nodeAttributedSelfBytes']/runs[0]['nodeAttributedSelfBytes']),'pathFunctionReductionPercent':100*(1-runs[1]['pathFunctionsAttributedSelfBytes']/runs[0]['pathFunctionsAttributedSelfBytes']),'limits':['One fixed-order local pair; statistical allocation sampling, different observation durations and initial browser asset caches.','Both sampled windows contain the same8 request categories/methods/statuses/versions, no assets; three native canvases checked independently per run.','Cumulative sampled JS allocation is not retained/peak memory, PHP allocations, provider CPU or128MiB acceptance.','No candidate content edit/save, cross-process reload, IME or provider deployment in this pair.','Earlier unclassified retained-native exception was not reproduced; no claim it is fixed.'],'productionChanged':False,'cloudRequests':0}
(rt/'artifacts/playtt-path-join-comparison.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:report[k]for k in ['result','changedBundleStatements','requestMixAndVersionsExact','nodeAttributedSelfBytesReduction','nodeAttributedSelfBytesReductionPercent','pathFunctionReductionPercent']}))
