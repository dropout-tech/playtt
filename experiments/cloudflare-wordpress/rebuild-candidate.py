from pathlib import Path,PurePosixPath
import json,hashlib,tarfile,shutil,subprocess,datetime
import argparse
parser=argparse.ArgumentParser(description='Assemble the adopted playtt candidate from the pinned upstream archive. No network, dependency installation or deployment.')
parser.add_argument('--archive',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--reference',type=Path,help='Optional current runtime source to compare without modifying it')
args=parser.parse_args()
exp=Path(__file__).resolve().parent
archive=args.archive.resolve();target=args.output.resolve();runtime=target/'packages/runtime-cloudflare'
live=args.reference.resolve() if args.reference else None
expected_archive='af0cf70a31bb32ec1259a78cd7cf2e9c60a306b91a711026c69aab9e8e6627e7'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==expected_archive,'Pinned upstream archive mismatch; review before using a different archive.'
assert not target.exists(),'Use a new clean target; do not overwrite evidence.'
target.mkdir()
prefix='wp-codebox-9764022156a61ba7d2b4d8a2196b01ccb33b82b5/'
count=0
with tarfile.open(archive,'r:gz') as tar:
 for member in tar:
  if not member.name.startswith(prefix+'packages/runtime-cloudflare/'):continue
  # The security candidate deliberately uses package-lock.json, not the old shrinkwrap.
  if member.name==prefix+'packages/runtime-cloudflare/npm-shrinkwrap.json':continue
  relative=PurePosixPath(member.name[len(prefix):]);assert '..' not in relative.parts and not relative.is_absolute()
  destination=target/str(relative)
  assert destination.resolve().is_relative_to(target.resolve())
  if member.isdir():destination.mkdir(parents=True,exist_ok=True);continue
  assert member.isfile(),'No symlinks or device entries allowed'
  destination.parent.mkdir(parents=True,exist_ok=True)
  with tar.extractfile(member) as source,destination.open('wb') as out:shutil.copyfileobj(source,out)
  count+=1
steps=[]
def patch(relative,base=target):
 p=exp/relative
 normalized=target/('step-'+str(len(steps))+'.patch')
 normalized.write_bytes(p.read_text(encoding='utf-8-sig').encode('utf-8'))
 result=subprocess.run(['git','apply','--check',str(normalized)],cwd=base,text=True,capture_output=True)
 if result.returncode:
  (target/'failed-step.json').write_text(json.dumps({'patch':relative,'base':str(base.relative_to(target)),'stderr':result.stderr},indent=2))
  raise RuntimeError(relative+': '+result.stderr)
 subprocess.run(['git','apply',str(normalized)],cwd=base,check=True,capture_output=True)
 steps.append({'patch':relative,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'base':str(base.relative_to(target))})
def extras(directory):
 for source in directory.iterdir():
  if not source.is_file():continue
  if source.name.endswith('.test.ts'):destination=runtime/'tests'/source.name
  elif source.suffix=='.ts':destination=runtime/'src'/source.name
  elif source.suffix=='.mjs':destination=runtime/'scripts'/source.name
  elif source.suffix=='.jsonc' or source.name in ['package.json','package-lock.json']:destination=runtime/source.name
  else:continue
  destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(source.read_text(encoding='utf-8-sig').encode('utf-8'))
patch('security-update/upstream-playtt-secure.patch');extras(exp);extras(exp/'security-update')
patch('automatic-publication/after-security-update.patch');extras(exp/'automatic-publication')
for directory in ['src','scripts','tests']:
 for source in (exp/'automatic-publication'/directory).iterdir():
  if source.is_file():(runtime/directory/source.name).write_bytes(source.read_text(encoding='utf-8-sig').encode('utf-8'))
for relative in ['memory-investigation/tracked-allocator-candidate.patch','publication-batching/publication-batch-candidate.patch','memory-lifetime/memory-lifetime-candidate.patch','memory-lifetime/runtime-rotation-candidate.patch','runtime-retirement/runtime-retirement-candidate.patch']:
 patch(relative)
extras(exp/'memory-investigation');extras(exp/'publication-batching');extras(exp/'memory-lifetime');extras(exp/'runtime-retirement')
for directory,relative in [('snapshot-latency','snapshot-source-candidate.patch'),('request-body','request-body-candidate.patch'),('id-sequence','id-sequence-candidate.patch'),('maintenance','maintenance-candidate.patch'),('scheduled-maintenance','scheduled-maintenance-candidate.patch'),('empty-slug','empty-slug-candidate.patch')]:
 patch(directory+'/'+relative,runtime);extras(exp/directory)
extras(exp/'independent-restore')
patch('postmeta/postmeta-candidate.patch',runtime);extras(exp/'postmeta')
extras(exp/'media-repair')
differences=[];files=[]
for source in ((live or runtime)/'src').iterdir():
 if not source.is_file() or source.suffix not in ['.ts','.mjs']:continue
 rebuilt=runtime/'src'/source.name
 if source.name=='playtt-php-loader.mjs':continue # generated from the pinned dependency in the next step
 if not rebuilt.exists():differences.append({'path':'src/'+source.name,'kind':'missing'});continue
 actual=hashlib.sha256(rebuilt.read_text(encoding='utf-8-sig').encode()).hexdigest()
 expected=hashlib.sha256(source.read_text(encoding='utf-8-sig').encode()).hexdigest()
 files.append({'path':'src/'+source.name,'normalizedSha256':actual})
 if actual!=expected:differences.append({'path':'src/'+source.name,'kind':'differs','expected':expected,'actual':actual})
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Clean pinned upstream archive plus documented adopted patches and checked-in extra files; dependencies not yet installed or rebuilt','referenceChecked':live is not None,'legacyShrinkwrapOmitted':True,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'upstreamFiles':count,'steps':steps,'files':files,'differences':differences}
(target/'assembly.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'upstreamFiles':count,'patchesApplied':len(steps),'sourceFilesCompared':len(files),'differences':differences}))
