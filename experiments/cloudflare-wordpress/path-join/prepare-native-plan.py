from pathlib import Path
import datetime as dt,hashlib,json
import argparse
p=argparse.ArgumentParser();p.add_argument('--workspace',type=Path,required=True);root=p.parse_args().workspace.resolve();rt=root/'work/playtt-delivery-rebuild/packages/runtime-cloudflare';build=root/'work/playtt-path-join-build'
sha=lambda b:hashlib.sha256(b).hexdigest();norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
inputs=json.loads((build/'build-inputs.json').read_text(encoding='utf8'))
for e in inputs['files']:assert sha(norm(build/e['path'])if (build/e['path']).suffix in ['.ts','.js','.mjs','.json','.jsonc']else(build/e['path']).read_bytes())==e['sha256'],e['path']
a=(build/'dry-run-baseline/worker-playtt-do.js').read_text(encoding='utf8');b=(build/'dry-run/worker-playtt-do.js').read_text(encoding='utf8')
old='current_path = PATH.join2(current_path, parts[i]);';new='current_path = current_path === "/" ? "/" + parts[i] : current_path + "/" + parts[i];'
assert a.count(old)==1 and a.replace(old,new)==b
previous=json.loads((rt/'artifacts/playtt-old-provider-deploy-plan.json').read_text(encoding='utf8'))['targets']['fallback']
binary_hashes={e['sha256']for e in previous['modules']if not e['path'].endswith('.js')}
plan={'schema':'playtt/path-join-local-build/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'scope':'Two full-source dry runs, same isolated directory and dependencies; exactly one emitted statement differs','targets':{},'sources':82,'configsChanged':False,'cloudRequests':0,'deployed':False}
for variant,directory in [('baseline',build/'dry-run-baseline'),('candidate',build/'dry-run')]:
 modules=[{'path':str(p.resolve()),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size}for p in sorted(directory.iterdir())if p.suffix in ['.js','.wasm','.sqlite','.zip']]
 assert len(modules)==6;assert{e['sha256']for e in modules if not e['path'].endswith('.js')}==binary_hashes
 plan['targets'][variant]={'baselineSourceCommit':'97a92c8a32cd58931d57fa5f17434b943976331e','sourceCommit':'97a92c8+'+variant+'-path-join-local','entry':str((directory/'worker-playtt-do.js').resolve()),'modules':modules}
p=rt/'artifacts/playtt-path-join-deploy-plan.json';assert not p.exists();p.write_text(json.dumps(plan,indent=2)+'\n',encoding='utf8')
print(json.dumps({'result':'prepared','targets':list(plan['targets']),'deployed':False}))
