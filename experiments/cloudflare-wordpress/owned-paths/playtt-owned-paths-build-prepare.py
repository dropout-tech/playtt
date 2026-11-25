"""Prepare an isolated prepared-paths candidate from verified editor-byte inputs."""
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
original=files['src/wp-content-persistence.ts'];assert sha(original)=='0f67fe2b2e198b9665c0d9d1858d7557ab552d877b5165b89c47c9e719546a5d'
candidate=(rt/'scripts/playtt-owned-paths-candidate.ts').read_text(encoding='utf8').encode()
assert sha(candidate)=='b95446e9faeb1813fb25083421923f553fa45b83772733bce083f92b1c066198'
files['src/wp-content-persistence.ts']=candidate
before=files['src/worker.ts'].decode();assert sha(before.encode())=='fe584c3a1a2f722c5b28f789fbc15986467c36462b52fce377dac5b3b0b885f7'
worker=before;needle='import { isCanonicalWpContentPath, MAX_WP_CONTENT_FILES,';assert worker.count(needle)==1
worker=worker.replace(needle,'import { prepareRuntimeOwnedWpContentPaths, isCanonicalWpContentPath, MAX_WP_CONTENT_FILES,')
needle='const WEBSITE_IMPORTER_OWNED_WP_CONTENT_PATHS = runtimeArchiveComponentOwnedWpContentPaths(WEBSITE_IMPORTER_COMPONENT)'
assert worker.count(needle)==1;worker=worker.replace(needle,'const WEBSITE_IMPORTER_OWNED_WP_CONTENT_PATHS = prepareRuntimeOwnedWpContentPaths(runtimeArchiveComponentOwnedWpContentPaths(WEBSITE_IMPORTER_COMPONENT))')
assert sha(worker.encode())=='d720192f15ca3a456de4732f0945c1bef83f3cda164da4b345ad9405558d02f6'
files['src/worker.ts']=worker.encode()
for name,data in files.items():
    path=target/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
report={'schema':'playtt/owned-paths-build-inputs/v1','sourceCount':83,'files':[{'path':k,'sha256':sha(v)}for k,v in sorted(files.items())],
        'originalSourceSha256':sha(original),'candidateSourceSha256':sha(candidate),
        'originalWorkerSha256':sha(before.encode()),'candidateWorkerSha256':sha(worker.encode()),
        'changesFromEditorByteBuild':['src/wp-content-persistence.ts','src/worker.ts'],'centralSourceChanged':False,'cloudRequests':0}
(target/'build-inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({'result':'prepared','sourceCount':83,'inputs':206,'cloudRequests':0}))
