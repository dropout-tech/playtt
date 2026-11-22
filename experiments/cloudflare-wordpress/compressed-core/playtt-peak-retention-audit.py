"""Recompute existing native samples and a compressed-core size feasibility bound.
No new PHP, workerd, browser or provider requests; do not infer retained sizes from samples.
"""
from pathlib import Path
import argparse,hashlib,json,zipfile,zlib
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--local',action='store_true',required=True);p.add_argument('--check',action='store_true');args=p.parse_args();rt=Path.cwd();load=lambda p:json.loads(p.read_text(encoding='utf8'));sha=lambda b:hashlib.sha256(b).hexdigest()
owner=load(rt/'artifacts/playtt-base64-editor-owned-private.json');assert owner['phase']=='verified'and owner['sealed']and owner['localProcessesDisposed'];audit=load(rt/'artifacts/playtt-base64-editor-audit.json');phases=[]
for name in ['before-restart','after-restart']:
 path=Path(owner['directory'])/name/'exception-allocation-observation.json';raw=path.read_bytes();ob=load(path);assert ob['stopped']and not ob['errors'];events=sorted(ob['events'],key=lambda e:e['at']);transitions=[e for e in events if e['kind']in ['generation','retirement','php']];i=0;generation=None;php=None;rows=[]
 for sample in ob['samples']:
  while i<len(transitions)and transitions[i]['at']<=sample['at']:
   e=transitions[i];i+=1
   if e['kind']=='generation':generation=e['generation'];php=None
   elif e['kind']=='retirement':generation=None;php=None
   elif generation is not None:php=e
  if php is not None:rows.append({'at':sample['at'],'label':sample['label'],'generation':generation,'jsBytes':sample['usedSize'],'backingBytes':sample['backingStorageSize'],'lastPhpBytes':php['heapBytes'],'phpObservationAgeMs':sample['at']-php['at'],'sumBytes':sample['usedSize']+sample['backingStorageSize']+php['heapBytes']})
 maximum=max(rows,key=lambda s:s['sumBytes']);prior=next(x for x in audit['memory']['phases']if x['phase']==name);assert len(rows)==prior['matchedSamples']and maximum['sumBytes']==prior['maxObservedComponentSum'];min_back=min(rows,key=lambda s:s['backingBytes']);later=[s for s in rows if s['at']>maximum['at']];post_min=min(later,key=lambda s:s['backingBytes'])if later else None
 nearby=[]
 for e in events:
  if abs(e['at']-maximum['at'])<=3000 and e['kind']in ['request','php','generation','trace']:
   nearby.append({k:v for k,v in e.items()if k in ['at','kind','category','method','status','operation','runtime','totalMs','heapBytes','stage']})
 phases.append({'phase':name,'inputSha256':sha(raw),'samples':len(ob['samples']),'matched':len(rows),'maximum':maximum,'minimumBacking':min_back,'laterMinimumBacking':post_min,'backingRangeBytes':max(s['backingBytes']for s in rows)-min_back['backingBytes'],'nearbyEvents':nearby,'newMeasurements':False})
archive=rt/'artifacts/cloudflare-wordpress-runtime-corpus.zip';manifest=load(rt/'assets/wordpress-runtime-artifact.json');assert sha(archive.read_bytes())==manifest['archive']['sha256'];metadata={f['path']:f for f in manifest['files']};records=[]
with zipfile.ZipFile(archive)as z:
 for info in z.infolist():
  if info.is_dir()or info.filename.startswith('wordpress/wp-content/'):continue
  raw=z.read(info);expected=metadata[info.filename];assert len(raw)==expected['size']and sha(raw)==expected['sha256'];encoded=zlib.compress(raw,6,wbits=-15);assert zlib.decompress(encoded,wbits=-15)==raw;records.append({'bytes':len(raw),'encodedBytes':len(encoded)})
original=sum(r['bytes']for r in records);compressed=sum(r['encodedBytes']for r in records)
report={'schema':'playtt/peak-retention-audit/v1','result':'offline-component-and-core-byte-feasibility-evidence; no memory acceptance','candidateBundleSha256':audit['bundleSha256'],'calibration':'docs/verification/cloudflare-local-memory-accounting.json','phases':phases,'coreCorpus':{'files':len(records),'archiveSha256':manifest['archive']['sha256'],'bytes':original,'deflatedBytes':compressed,'byteDifference':original-compressed,'largestFileBytes':max(r['bytes']for r in records),'allSourceAndRoundtripBytesExact':True,'appliesTo':'pinned core archive before boot patches; offline Python zlib size estimate'} ,'newWordpressRequests':0,'newWorkerdRequests':0,'cloudRequests':0,'productionChanged':False,'limitations':['Observed JS/backing/last-PHP sums are asynchronous and calibrated for this workerd; not retained sizes, exact peaks, RSS or cloud admission.','Falling backing samples alone do not prove GC or the responsible objects. Nearby events use host receipt times and do not establish allocation causation.','Earlier retained snapshots identify core file backing but use another build; their retained counts cannot be transferred to this candidate.','Compression size savings do not establish runtime memory savings: adapter metadata, decoded cache, native compression buffers, promotion and GC must be measured.','No core compression is installed in the runtime. Filesystem semantics, native execution/performance and provider acceptance remain required.'],'sources':['https://developers.cloudflare.com/workers/platform/limits/','https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/server/server.c%2B%2B']}
target=rt/'artifacts/playtt-peak-retention-audit.json';serialized=json.dumps(report,indent=2)+'\n'
if args.check:assert target.read_text(encoding='utf8')==serialized
else:
 with target.open('x',encoding='utf8')as f:f.write(serialized)
print(json.dumps({'result':report['result'],'maxima':[r['maximum']for r in phases],'coreCorpus':report['coreCorpus']}))
