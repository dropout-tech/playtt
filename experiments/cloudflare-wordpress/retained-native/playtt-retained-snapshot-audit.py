"""Offline numeric summaries of private workerd snapshots. Never emit heap strings."""
from pathlib import Path
from collections import Counter
import argparse,datetime as dt,hashlib,json
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,required=True);args=p.parse_args();rt=args.runtime.resolve();owner=json.loads((rt/'artifacts/playtt-retained-native-owned-private.json').read_text(encoding='utf8'));assert owner['phase']=='verified' and owner['sealed'] and owner['localProcessesDisposed'];directory=Path(owner['directory']);observation=json.loads((directory/'retained-observation.json').read_text(encoding='utf8'));summaries=[]
for checkpoint in observation['snapshots']:
 path=directory/(checkpoint['label']+'-private.heapsnapshot');raw=path.read_bytes();assert len(raw)==checkpoint['bytes'];assert hashlib.sha256(raw).hexdigest()==checkpoint['sha256'];h=json.loads(raw);m=h['snapshot']['meta'];nodes=h['nodes'];edges=h['edges'];strings=h['strings'];fields=m['node_fields'];width=len(fields);f={k:fields.index(k)for k in fields};kinds=m['node_types'][0];ekinds=m['edge_types'][0];ef=m['edge_fields'];ew=len(ef);eo={k:ef.index(k)for k in ef};totals=Counter();buffers={};adj={};roots=[];bufferOwners={};arrayBackings={};wasmLinks={};wasmContext=set();nodeInfo={};wasmMemoryNodes=0;ei=0
 for src in range(0,len(nodes),width):
  kind=kinds[nodes[src+f['type']]];name=strings[nodes[src+f['name']]];totals[kind]+=nodes[src+f['self_size']];nodeInfo[src]=(kind,name)
  if kind=='native' and name=='system / JSArrayBufferData':buffers[src]=nodes[src+f['self_size']]
  if name in ['WebAssembly.Memory','WasmMemoryObject'] and kind in ['object','hidden','native']:wasmMemoryNodes+=1
  selected=[]
  for _ in range(nodes[src+f['edge_count']]):
   typ=ekinds[edges[ei+eo['type']]];key=str(edges[ei+eo['name_or_index']])if typ in ['element','hidden']else strings[edges[ei+eo['name_or_index']]];target=edges[ei+eo['to_node']];ei+=ew
   if typ=='context'and key in ['markdownFiles','uploadFiles','wpContentFiles']:roots.append((key,target))
   if name in ['ArrayBuffer','SharedArrayBuffer']and key=='backing_store':arrayBackings[src]=target
   if typ=='context' and key=='wasmMemory':wasmContext.add(target)
   if kind=='object' and name in ['Memory','WebAssembly.Memory','WasmMemoryObject'] and typ!='weak':wasmLinks.setdefault(src,[]).append((typ,key,target))
   if key=='backing_store':bufferOwners.setdefault(target,Counter())[name if name in ['ArrayBuffer','SharedArrayBuffer','WebAssembly.Memory']else'other']+=1
   if(kind=='object'and name=='Array'and typ=='element')or(kind=='object'and name=='Object'and key=='bytes')or(kind=='object'and name in ['Uint8Array','Int8Array']and key=='buffer')or(kind=='object'and name=='ArrayBuffer'and key=='backing_store'):selected.append(target)
  if selected:adj[src]=selected
 def collect(src,seen):
  if src in seen:return set()
  if src in buffers:return{src}
  seen.add(src);result=set()
  for dst in adj.get(src,[]):result.update(collect(dst,seen))
  return result
 groups={}
 for name,src in roots:groups.setdefault(name,set()).update(collect(src,set()))
 retained=set().union(*groups.values())if groups else set()
 # V8 names the actual instance Memory; WebAssembly.Memory is its prototype.
 # Require loader context and prototype identity, then follow actual buffer edges.
 instances={src for src in wasmContext if nodeInfo.get(src)==('object','Memory') and any(typ=='property' and key=='__proto__' and nodeInfo.get(dst)==('object','WebAssembly.Memory') for typ,key,dst in wasmLinks.get(src,[]))}
 wasmBackings={arrayBackings[dst] for src in instances for typ,key,dst in wasmLinks[src] if dst in arrayBackings}
 assert len(instances)==1 and len(wasmBackings)==1 and all(n in buffers for n in wasmBackings)
 largest=sorted(buffers,key=buffers.get,reverse=True)[:8]
 summaries.append({'label':checkpoint['label'],'snapshotBytes':len(raw),'snapshotSha256':checkpoint['sha256'],'nodeCount':len(nodes)//width,'snapshotSelfBytes':sum(totals.values()),'selfBytesByType':dict(totals),'arrayBufferBackingBytes':sum(buffers.values()),'largestBackings':[{'bytes':buffers[n],'owners':dict(bufferOwners.get(n,{})),'loaderWasmMemoryLink':n in wasmBackings}for n in largest],'loaderWasmMemoryInstances':len(instances),'wasmLinkEvidence':'wasmMemory context -> Memory instance -> ArrayBuffer -> backing_store; instance prototype is WebAssembly.Memory','loaderWasmBackingBytes':sum(buffers.get(n,0)for n in wasmBackings),'bootArraysRetainedBytes':sum(buffers[n]for n in retained),'bootArrays':{k:{'buffers':len(v),'bytes':sum(buffers[n]for n in v)}for k,v in groups.items()},'cdpBefore':checkpoint['before'],'cdpAfter':checkpoint['after'],'eventsDuring':checkpoint['eventsDuring']})
assert len(summaries)==2
report={'schema':'playtt/retained-native-snapshot-audit/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'scope':'Same local workerd process, native draft after first and third visits; snapshots can collect; not provider RSS/peak or long-term leak proof','snapshots':summaries,'deltaSelfBytes':summaries[1]['snapshotSelfBytes']-summaries[0]['snapshotSelfBytes'],'deltaBackingBytes':summaries[1]['arrayBufferBackingBytes']-summaries[0]['arrayBufferBackingBytes'],'phpHeapPeak':max(e.get('heapBytes',0)for e in observation['events']),'generations':[e for e in observation['events']if e['kind']=='generation'],'retirements':[e for e in observation['events']if e['kind']=='retirement'],'exceptions':[e for e in observation['events']if e['kind']=='exception'],'samplingErrors':observation['errors'],'httpErrors':[e for e in observation['events']if e['kind']=='request'and e['status']>=400],'rawSnapshotsPrivate':True,'cloudRequests':0}
(rt/'artifacts/playtt-retained-snapshot-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');print(json.dumps({'result':'pass','snapshots':len(summaries),'deltaSelfBytes':report['deltaSelfBytes'],'deltaBackingBytes':report['deltaBackingBytes'],'wasmBytes':[x['loaderWasmBackingBytes']for x in summaries]}))
