from pathlib import Path
from collections import Counter
import json,sys,datetime
if len(sys.argv)!=3:
 raise SystemExit('Usage: python summarize-playtt-heap.py LABEL /absolute/path/to/runtime-cloudflare/artifacts')
label=sys.argv[1]
assert all(c.isalnum() or c=='-' for c in label)
root=Path(sys.argv[2]).expanduser().resolve(strict=True)
p=json.loads((root/('playtt-'+label+'-private.heapsnapshot')).read_text(encoding='utf-8'))
meta=p['snapshot']['meta']; nodes=p['nodes']; edges=p['edges']; strings=p['strings']; fields=meta['node_fields']; width=len(fields); kinds=meta['node_types'][0]; ekinds=meta['edge_types'][0]
offset={name:fields.index(name) for name in fields}; ew=len(meta['edge_fields']); adjacency={}; roots=[]; totals=Counter(); buffers={}; ei=0
for src in range(0,len(nodes),width):
 kind=kinds[nodes[src+offset['type']]]; name=strings[nodes[src+offset['name']]]; totals[kind]+=nodes[src+offset['self_size']]
 if kind=='native' and name=='system / JSArrayBufferData':buffers[src]=nodes[src+offset['self_size']]
 selected=[]
 for _ in range(nodes[src+offset['edge_count']]):
  typ=ekinds[edges[ei]]; key=str(edges[ei+1]) if typ in ('element','hidden') else strings[edges[ei+1]]; target=edges[ei+2];ei+=ew
  if typ=='context' and key in ('markdownFiles','uploadFiles','wpContentFiles'):roots.append((key,target))
  if (kind=='object' and name=='Array' and typ=='element') or (kind=='object' and name=='Object' and key=='bytes') or (kind=='object' and name in ('Uint8Array','Int8Array') and key=='buffer') or (kind=='object' and name=='ArrayBuffer' and key=='backing_store'):selected.append(target)
 if selected:adjacency[src]=selected
def collect(src,seen=None):
 seen=set() if seen is None else seen
 if src in seen:return set()
 if src in buffers:return {src}
 seen.add(src);out=set()
 for target in adjacency.get(src,[]):out|=collect(target,seen)
 return out
groups={}
for name,src in roots:groups.setdefault(name,set()).update(collect(src))
retained=set().union(*groups.values()) if groups else set()
report=dict(at=datetime.datetime.now(datetime.timezone.utc).isoformat(),label=label,scope='Sanitized V8 heap snapshot summary; raw heap and content strings remain private',snapshotSelfBytes=sum(totals.values()),selfBytesByType=dict(totals),arrayBufferBackingBytes=sum(buffers.values()),bootArrays={key:{'buffers':len(value),'bytes':sum(buffers[v] for v in value)} for key,value in groups.items()},bootArraysRetainedBytes=sum(buffers[v] for v in retained))
(root/('playtt-heap-summary-'+label+'.json')).write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
