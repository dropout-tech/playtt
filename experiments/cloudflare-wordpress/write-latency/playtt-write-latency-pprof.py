from pathlib import Path
import collections,datetime,gzip,hashlib,json,re

# Read the standard pprof wire format without importing or executing payloads.
# Schema reference: https://github.com/google/pprof/blob/main/proto/profile.proto
def varint(data,pos):
 value=0
 for shift in range(0,70,7):
  assert pos<len(data),'Truncated varint'
  b=data[pos];pos+=1;value|=(b&127)<<shift
  if b<128:return value,pos
 raise ValueError('Oversized varint')

def fields(data):
 out=collections.defaultdict(list);pos=0
 while pos<len(data):
  tag,pos=varint(data,pos);field,wire=tag>>3,tag&7;assert field>0
  if wire==0:value,pos=varint(data,pos)
  elif wire==2:
   length,pos=varint(data,pos);assert pos+length<=len(data);value=data[pos:pos+length];pos+=length
  elif wire in (1,5):
   size=8 if wire==1 else 4;assert pos+size<=len(data);value=data[pos:pos+size];pos+=size
  else:raise ValueError('Unsupported wire type')
  out[field].append(value)
 return out

def scalar(obj,key,default=0):return obj.get(key,[default])[0]
def packed(values):
 out=[]
 for value in values:
  if isinstance(value,int):out.append(value);continue
  pos=0
  while pos<len(value):v,pos=varint(value,pos);out.append(v)
 return out

path=Path('artifacts/playtt-write-latency-cpu-retry-private.pprof');raw=path.read_bytes();data=gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw
profile=fields(data);strings=[s.decode('utf-8')for s in profile[6]];assert strings[0]==''
types=[(strings[scalar(x,1)],strings[scalar(x,2)])for x in map(fields,profile[1])]
functions={scalar(f,1):{'name':strings[scalar(f,2)],'file':strings[scalar(f,4)]}for f in map(fields,profile[5])}
locations={scalar(loc,1):[scalar(line,1)for line in map(fields,loc.get(4,[]))]for loc in map(fields,profile[4])}
samples=[]
for s in map(fields,profile[2]):
 ids=packed(s.get(1,[]));values=packed(s.get(2,[]));assert len(values)==len(types)
 assert all(i in locations for i in ids)
 samples.append((ids,values))
cpu=[i for i,t in enumerate(types)if t[0]=='cpu'];assert len(cpu)==1;index=cpu[0];unit=types[index][1]
self_values=collections.Counter();cumulative=collections.Counter();totals=[0]*len(types)
for ids,values in samples:
 for i,v in enumerate(values):totals[i]+=v
 stack=[f for loc in ids for f in locations[loc]];assert all(f in functions for f in stack)
 self_values[stack[0] if stack else 0]+=values[index]
 for f in set(stack):cumulative[f]+=values[index]
assert sum(self_values.values())==totals[index]
def safe_name(name):
 return name if re.fullmatch(r'[A-Za-z0-9_$.:<>? ()\[\]/+*=-]{1,180}',name) and '://' not in name else '[name-redacted]'
def top(counter):
 return [{'function':safe_name(functions.get(f,{'name':'[unknown]'})['name']),'value':v,'percent':round(100*v/totals[index],3)}for f,v in counter.most_common(25)]
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'One private execution actor CPU sample capture during bounded read-only login-page requests. Includes sampled call stacks, not per-request accounting or I/O time; names only, no paths/labels/raw stacks.','profileSha256':hashlib.sha256(raw).hexdigest(),'transportGzip':raw[:2]==b'\x1f\x8b','samples':len(samples),'functions':len(functions),'locations':len(locations),'sampleTypes':[{'type':t[0],'unit':t[1],'total':totals[i]}for i,t in enumerate(types)],'durationNs':scalar(profile,10),'cpuUnit':unit,'topSelf':top(self_values),'topCumulative':top(cumulative)}

by_name=collections.Counter()
for fid,value in self_values.items():
 f=functions.get(fid,{'name':'[unknown]','file':''});by_name[(safe_name(f['name']),f['file'].split('/')[-1] if re.fullmatch(r'[a-zA-Z0-9_.-]{1,80}',f['file'].split('/')[-1]) else '[redacted]')]+=value
report['scope']='One private actor CPU sample during two owned native updates; not per-request or I/O accounting. Sanitized function names and bundle basenames only.'
report['groupedSelf']=[{'function':key[0],'file':key[1],'value':value,'percent':round(100*value/totals[index],3)}for key,value in by_name.most_common(30)]
Path('artifacts/playtt-write-latency-cpu-analysis.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['samples','durationNs','sampleTypes','groupedSelf']},indent=2))
