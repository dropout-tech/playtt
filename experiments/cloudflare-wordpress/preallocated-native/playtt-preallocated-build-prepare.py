"""Prepare an isolated full-source materializer candidate; no install, runtime edit or deployment."""
from pathlib import Path
import hashlib,json
import argparse
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--local',action='store_true',required=True);parser.add_argument('--target',type=Path,required=True);parser.add_argument('--candidate',type=Path,required=True);args=parser.parse_args()
rt=Path.cwd().resolve();target=args.target.resolve();candidate=args.candidate.resolve()
assert (rt/'scripts/playtt-snapshot-bundle.mjs').is_file()
assert target!=rt and not rt.is_relative_to(target)

assert not target.exists()
sha=lambda b:hashlib.sha256(b).hexdigest();norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
source=json.loads((rt/'artifacts/playtt-recovery-provider-source-plan.json').read_text(encoding='utf-8'))
old=json.loads((rt/'artifacts/playtt-old-source-rollback-plan.json').read_text(encoding='utf-8'))
proof=json.loads((rt/'artifacts/playtt-preallocated-corpus-v2-proof.json').read_text(encoding='utf-8'));assert proof['result']=='pass'
assert sha(norm(candidate))==proof['candidateSourceSha256']
prepared={}
for e in source['sources']+old['vendor']+old['assets']:
 assert not Path(e['path']).is_absolute() and '..' not in Path(e['path']).parts
 p=rt/e['path'];data=norm(p)if p.suffix in ['.ts','.mjs','.js','.json']else p.read_bytes()
 assert sha(data)==e['sha256'],e['path'];prepared[e['path']]=data
assert len(source['sources'])==82 and len(old['vendor'])==109 and len(old['assets'])==9
assert sha(prepared['src/wordpress-runtime-artifact.ts'])==proof['baselineSourceSha256']
prepared['src/wordpress-runtime-artifact.ts']=norm(candidate)
loader=norm(rt/'src/playtt-php-loader.mjs');assert sha(loader)==proof['loaderSha256'];prepared['src/playtt-php-loader.mjs']=loader
for name in ['package.json','package-lock.json','wrangler.playtt-session-audit.jsonc']:prepared[name]=norm(rt/name)
prepared['tsconfig.typecheck.json']=norm(rt/'tsconfig.json')
for name,data in prepared.items():
 p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
report={'schema':'playtt/preallocated-source-build-inputs/v1','scope':'Full existing82-source runtime plus one tested TypeScript materializer replacement; shared installed dependencies, no diagnostic barriers or wrapper','baselineRuntimeSourceCommit':source['sourceCommit'],'candidateDeliveryCommit':'9b94c19599402da083b44ad86704fc8724005ddb','sources':82,'vendor':109,'assets':9,'changedSource':'src/wordpress-runtime-artifact.ts','baselineSourceSha256':proof['baselineSourceSha256'],'candidateSourceSha256':proof['candidateSourceSha256'],'generatedLoaderSha256':sha(loader),'files':[{'path':name,'sha256':sha(data)}for name,data in sorted(prepared.items())],'cloudRequests':0,'deployed':False,'centralRuntimeChanged':False}
(target/'build-inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:report[k]for k in ['sources','vendor','assets','candidateSourceSha256','centralRuntimeChanged','deployed']}))
