"""Copy local-only diagnostics after exact prerequisite validation. No runtime edit, network or deployment."""
import argparse,hashlib,json
from pathlib import Path,PurePosixPath
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--runtime',type=Path,required=True);parser.add_argument('--apply',action='store_true');args=parser.parse_args()
runtime=args.runtime.resolve();here=Path(__file__).resolve().parent
plan=json.loads((here/'tool-files.json').read_text(encoding='utf8'));assert plan['schema']=='playtt/local-diagnostic-tools/v2'
norm=lambda p:p.read_text(encoding='utf-8-sig').encode();sha=lambda b:hashlib.sha256(b).hexdigest()
assert plan['prerequisiteManifest']['path']=='../bootstrap-locale/tool-files.json'
prior_file=here/plan['prerequisiteManifest']['path'];assert sha(norm(prior_file))==plan['prerequisiteManifest']['sha256']
prior=json.loads(norm(prior_file));assert prior['schema']=='playtt/local-diagnostic-tools/v1'
for entry in prior['prerequisites']+prior['files']:
    target=runtime/entry['path'];assert target.resolve().is_relative_to(runtime);assert sha(norm(target))==entry['sha256'],entry['path']
prepared={}
for entry in plan['files']:
    path=PurePosixPath(entry['path']);assert not path.is_absolute() and '..' not in path.parts
    target=runtime/entry['path'];assert target.resolve().is_relative_to(runtime);assert not target.exists(),entry['path']
    assert Path(entry['source']).name==entry['source'];data=norm(here/entry['source']);assert sha(data)==entry['sha256'];prepared[entry['path']]=data
if args.apply:
    for path,data in prepared.items():
        target=runtime/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
print(json.dumps({'result':'pass','tools':len(prepared),'applied':args.apply,'runtimeSourcesChanged':False,'configsChanged':False,'deployed':False}))
