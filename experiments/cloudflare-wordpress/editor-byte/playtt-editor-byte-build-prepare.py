"""Prepare an isolated editor-byte candidate from verified boot-cleanup inputs."""
from pathlib import Path
import argparse, hashlib, json
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--local',action='store_true',required=True)
p.add_argument('--previous',type=Path,required=True)
p.add_argument('--target',type=Path,required=True)
a=p.parse_args(); rt=Path.cwd().resolve(); previous=a.previous.resolve(); target=a.target.resolve()
assert target!=rt and not rt.is_relative_to(target) and not target.exists()
sha=lambda b:hashlib.sha256(b).hexdigest()
inputs=json.loads((previous/'build-inputs.json').read_text(encoding='utf8'))
files={}
for item in inputs['files']:
    data=(previous/item['path']).read_bytes();assert sha(data)==item['sha256'];files[item['path']]=data
assert len(files)==206 and inputs['sourceCount']==83
assert sha(files['src/playtt-editor-lock.ts'])=='c61e547c55400355fa19088869215480e8dd4f6b07c01f7ae086f08b4adacb82'
candidate=(rt/'scripts/playtt-editor-lock-byte-candidate.ts').read_text(encoding='utf8').encode()
assert sha(candidate)=='bd22569a66cc2aa22536d33cedaedc51ccfce94c282eadc3a1001f46b0034928'
original=files['src/playtt-editor-lock.ts'];files['src/playtt-editor-lock.ts']=candidate
for name,data in files.items():
    path=target/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
report={'schema':'playtt/editor-byte-build-inputs/v1','sourceCount':83,
        'files':[{'path':k,'sha256':sha(v)}for k,v in sorted(files.items())],
        'originalSha256':sha(original),'candidateSha256':sha(candidate),
        'originalTestsSha256':sha((rt/'tests/playtt-editor-lock.test.mjs').read_bytes()),
        'candidateTestsSha256':sha((rt/'scripts/playtt-editor-lock-byte.test.mjs').read_text(encoding='utf8').encode()),
        'changesFromBootCleanupBuild':['src/playtt-editor-lock.ts'],'centralSourceChanged':False,'cloudRequests':0}
(target/'build-inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({'result':'prepared','sourceCount':83,'inputs':206,'cloudRequests':0}))
