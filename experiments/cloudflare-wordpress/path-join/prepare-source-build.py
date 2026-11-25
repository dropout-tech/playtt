from pathlib import Path
import hashlib,json
import argparse
p=argparse.ArgumentParser();p.add_argument('--workspace',type=Path,required=True);root=p.parse_args().workspace.resolve();rt=root/'work/playtt-delivery-rebuild/packages/runtime-cloudflare';target=root/'work/playtt-path-join-build'
assert not target.exists()
sha=lambda b:hashlib.sha256(b).hexdigest();norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
source=json.loads((rt/'artifacts/playtt-recovery-provider-source-plan.json').read_text(encoding='utf8'))
old=json.loads((rt/'artifacts/playtt-old-source-rollback-plan.json').read_text(encoding='utf8'))
proof=json.loads((rt/'artifacts/playtt-path-join-proof.json').read_text(encoding='utf8'))
owner=json.loads((rt/'artifacts/playtt-path-join-proof-owned-private.json').read_text(encoding='utf8'))
assert proof['result']=='pass' and owner['phase']=='verified'
prepared={}
for entry in source['sources']+old['vendor']+old['assets']:
 p=rt/entry['path'];data=norm(p)if p.suffix in ['.ts','.mjs','.js','.json']else p.read_bytes()
 assert sha(data)==entry['sha256'],entry['path'];prepared[entry['path']]=data
assert sha(norm(rt/'src/playtt-php-loader.mjs'))==proof['baselineSha256']
candidate=norm(Path(owner['directory'])/'candidate-source.mjs');assert sha(candidate)==proof['candidateSha256']
prepared['src/playtt-php-loader.mjs']=candidate
for name in ['package.json','package-lock.json','wrangler.playtt-session-audit.jsonc']:prepared[name]=norm(rt/name)
for name,data in prepared.items():
 p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
report={'scope':'Isolated full-source build of one generated-loader statement; baseline runtime unchanged','sources':len(source['sources']),'vendor':len(old['vendor']),'assets':len(old['assets']),'generatedLoaderBaseline':proof['baselineSha256'],'generatedLoaderCandidate':proof['candidateSha256'],'files':[{'path':p,'sha256':sha(d)}for p,d in sorted(prepared.items())],'cloudRequests':0,'deployed':False}
(target/'build-inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:report[k]for k in ['sources','vendor','assets','generatedLoaderCandidate','deployed']}))
