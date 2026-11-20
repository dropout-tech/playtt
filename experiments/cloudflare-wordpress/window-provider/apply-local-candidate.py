"""Opt-in local patch and enabled isolated config only. No network, credentials or deployment."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,subprocess

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--runtime',type=Path,required=True)
parser.add_argument('--apply',action='store_true',help='Apply after checking every exact source identity; default checks only')
args=parser.parse_args();runtime=args.runtime.resolve();here=Path(__file__).resolve().parent
assert runtime.is_dir()
normalize=lambda p:p.read_text(encoding='utf-8-sig').encode()
sha=lambda b:hashlib.sha256(b).hexdigest()
plan=json.loads((here/'candidate-files.json').read_text(encoding='utf-8'))
assert plan['schema']=='playtt/local-candidate-files/v1' and plan['adopted'] is False
patch=here/'window-provider-candidate.patch';assert sha(normalize(patch))==plan['patchSha256']
for item in plan['prerequisites']:
    target=runtime/item['path'];assert target.resolve().is_relative_to(runtime)
    assert sha(normalize(target))==item['sha256'],f'Earlier optional candidate prerequisite differs: {item["path"]}'
for entry in plan['files']:
 relative=PurePosixPath(entry['path']);assert not relative.is_absolute() and '..' not in relative.parts
 target=runtime/entry['path'];assert target.resolve().is_relative_to(runtime)
 if 'beforeSha256' in entry:assert sha(normalize(target))==entry['beforeSha256'],f'Baseline mismatch: {relative}'
 else:
  assert not target.exists(),f'Candidate source already exists: {relative}'
  assert Path(entry['source']).name==entry['source']
  assert sha(normalize(here/entry['source']))==entry['afterSha256']
checked=subprocess.run(['git','apply','--check',str(patch)],cwd=runtime,capture_output=True,text=True)
assert checked.returncode==0,checked.stderr
if args.apply:
 subprocess.run(['git','apply',str(patch)],cwd=runtime,check=True,capture_output=True)
 for entry in plan['files']:
  target=runtime/entry['path']
  if 'source' in entry:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(normalize(here/entry['source']))
  assert sha(normalize(target))==entry['afterSha256'],f'Applied mismatch: {entry["path"]}'
print(json.dumps({'result':'pass','filesChecked':len(plan['files']),'applied':args.apply,'newIsolatedConfigFlagsEnabled':True,'existingConfigsChanged':False,'deployedByThisCommand':False}))
