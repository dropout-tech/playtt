"""Apply the private recovery pointer/HTTP transport after all source/config hashes pass. No network or deployment."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,required=True);p.add_argument('--apply',action='store_true');args=p.parse_args()
r=args.runtime.resolve();here=Path(__file__).resolve().parent
norm=lambda p:p.read_text(encoding='utf-8-sig').encode();sha=lambda b:hashlib.sha256(b).hexdigest()
plan=json.loads((here/'candidate-files.json').read_text());assert plan['schema']=='playtt/recovery-adoption-candidate/v1' and plan['deployed'] is False
for e in plan['prerequisites']:
    target=r/e['path'];assert target.resolve().is_relative_to(r);assert sha(norm(target))==e['sha256'],e['path']
prepared={}
for e in plan['files']:
    path=PurePosixPath(e['path']);assert not path.is_absolute() and '..' not in path.parts
    target=r/e['path'];assert target.resolve().is_relative_to(r)
    if 'beforeSha256' in e:assert sha(norm(target))==e['beforeSha256'],e['path']
    else:assert not target.exists(),e['path']
    assert Path(e['source']).name==e['source'];data=norm(here/e['source']);assert sha(data)==e['afterSha256'];prepared[e['path']]=data
if args.apply:
    for path,data in prepared.items():
        target=r/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
print(json.dumps({'result':'pass','files':len(prepared),'prerequisites':len(plan['prerequisites']),'applied':args.apply,'deployed':False,'configsChanged':False}))
