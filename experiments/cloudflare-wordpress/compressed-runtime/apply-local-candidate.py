"""Optional compressed snapshot persistence and recovery experiment; all existing configurations remain disabled. No network, credentials or deployment."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,subprocess,tempfile

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--runtime',type=Path,required=True)
parser.add_argument('--apply',action='store_true',help='Apply after checking every exact source identity; default checks only')
args=parser.parse_args();runtime=args.runtime.resolve();here=Path(__file__).resolve().parent
assert runtime.is_dir()
normalize=lambda p:p.read_text(encoding='utf-8-sig').encode()
sha=lambda b:hashlib.sha256(b).hexdigest()
plan=json.loads((here/'candidate-files.json').read_text(encoding='utf-8'))
assert plan['schema']=='playtt/local-candidate-files/v1' and plan['adopted'] is False
patch=here/'compressed-runtime-candidate.patch';assert sha(normalize(patch))==plan['patchSha256']
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
# Earlier stages contain both CRLF and LF files. Prepare the complete patch in
# a normalized temporary tree and verify every output before touching sources.
prepared={}
with tempfile.TemporaryDirectory(prefix='playtt-compressed-runtime-') as temporary:
 stage=Path(temporary).resolve()
 for entry in plan['files']:
  if 'beforeSha256' in entry:
   target=stage/entry['path'];target.parent.mkdir(parents=True,exist_ok=True)
   target.write_bytes(normalize(runtime/entry['path']))
 normalized_patch=stage/'candidate.patch';normalized_patch.write_bytes(normalize(patch))
 checked=subprocess.run(['git','apply','--check',str(normalized_patch)],cwd=stage,capture_output=True,text=True)
 assert checked.returncode==0,checked.stderr
 subprocess.run(['git','apply',str(normalized_patch)],cwd=stage,check=True,capture_output=True)
 for entry in plan['files']:
  data=normalize(here/entry['source']) if 'source' in entry else normalize(stage/entry['path'])
  assert sha(data)==entry['afterSha256'],f'Prepared mismatch: {entry["path"]}'
  prepared[entry['path']]=data
if args.apply:
 for entry in plan['files']:
  target=runtime/entry['path'];target.parent.mkdir(parents=True,exist_ok=True)
  target.write_bytes(prepared[entry['path']])
  assert sha(normalize(target))==entry['afterSha256'],f'Applied mismatch: {entry["path"]}'
print(json.dumps({'result':'pass','filesChecked':len(plan['files']),'applied':args.apply,'newIsolatedConfigFlagsEnabled':False,'existingConfigsChanged':False,'deployedByThisCommand':False}))
