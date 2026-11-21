"""Prepare isolated manifest decoding candidate atop verified ownership-paths inputs."""
from pathlib import Path
import argparse,hashlib,json
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--local',action='store_true',required=True)
p.add_argument('--previous',type=Path,required=True)
p.add_argument('--target',type=Path,required=True)
a=p.parse_args();rt=Path.cwd().resolve();previous=a.previous.resolve();target=a.target.resolve()
assert target!=rt and not rt.is_relative_to(target) and not target.exists()
sha=lambda b:hashlib.sha256(b).hexdigest()
inputs=json.loads((previous/'build-inputs.json').read_text(encoding='utf8'))
files={}
for item in inputs['files']:
    path=(previous/item['path']).resolve();assert path.is_relative_to(previous)
    data=path.read_bytes();assert sha(data)==item['sha256'];files[item['path']]=data
assert len(files)==206 and inputs['sourceCount']==83
original=files['src/playtt-manifest-envelope.ts'];assert sha(original)=='f8a7c6e175297f2e8422f1d4c2704fce094f49af0d3b8a48b09e68a472925795'
candidate=(rt/'scripts/playtt-manifest-bytes-candidate.ts').read_text(encoding='utf8').encode();assert sha(candidate)=='c81f37e3ab4399efc98fcb5688d1e62fc3dd114fc8e3e28c9edb0a2fdef76e99'
assert sha(files['src/wp-content-persistence.ts'])=='b95446e9faeb1813fb25083421923f553fa45b83772733bce083f92b1c066198'
assert sha(files['src/worker.ts'])=='d720192f15ca3a456de4732f0945c1bef83f3cda164da4b345ad9405558d02f6'
files['src/playtt-manifest-envelope.ts']=candidate
for name,data in files.items():
    path=target/name;assert path.resolve().is_relative_to(target);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
report={'schema':'playtt/manifest-bytes-build-inputs/v1','sourceCount':83,'files':[{'path':k,'sha256':sha(v)}for k,v in sorted(files.items())],
        'originalSourceSha256':sha(original),'candidateSourceSha256':sha(candidate),'changedInputs':['src/playtt-manifest-envelope.ts'],'centralSourceChanged':False,'cloudRequests':0}
(target/'build-inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({'result':'prepared','sourceCount':83,'inputs':206,'cloudRequests':0}))
