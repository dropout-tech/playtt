from pathlib import Path
import datetime as dt, hashlib, json

import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--workspace',required=True,type=Path)
root=parser.parse_args().workspace.resolve()
runtime=root/'work/playtt-delivery-rebuild/packages/runtime-cloudflare'
prior=root/'work/playtt-markdown-write-assembly/packages/runtime-cloudflare'
target=root/'work/playtt-old-provider-build'
assert not target.exists(), 'Inspect existing artifact; never replace it.'
plan=json.loads((runtime/'artifacts/playtt-old-source-rollback-plan.json').read_text(encoding='utf8'))
assert plan['oldSourceCommit']=='67dd308' and len(plan['sources'])==77 and len(plan['vendor'])==109
sha=lambda b:hashlib.sha256(b).hexdigest()
norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
prepared={}
for entry in plan['sources']:
    data=norm(prior/entry['path'])
    assert sha(data)==entry['sha256'],entry['path']
    prepared[entry['path']]=data
for entry in plan['assets']:
    p=runtime/entry['path']
    data=norm(p) if p.suffix=='.json' else p.read_bytes()
    assert sha(data)==entry['sha256'],entry['path']
    prepared[entry['path']]=data
for entry in plan['vendor']:
    assert sha(norm(prior/entry['path']))==entry['sha256'],entry['path']
    assert sha(norm(runtime/entry['path']))==entry['sha256'],entry['path']
for name,digest in [('src/playtt-php-loader.mjs',plan['generatedPhpLoaderSha256']),('package-lock.json',plan['packageLockSha256'])]:
    data=norm(runtime/name)
    assert sha(data)==digest,name
    prepared[name]=data
prepared['package.json']=norm(runtime/'package.json')
config=json.loads((runtime/'wrangler.playtt-session-audit.jsonc').read_text(encoding='utf8'))
assert config['name']=='playtt-wp-free-session-audit' and config['account_id']=='3baadbd4abd9fd63c7f7e51664b26f67'
assert config['vars']['PLAYTT_R2_CAPACITY_LIMIT_BYTES']=='150000000'
assert config.get('routes') is None and config['triggers']=={'crons':[]}
assert config['main']=='src/worker-playtt-do.ts'
config['vars']['PLAYTT_CONTENT_OVERLAY']='content-v1'
prepared['wrangler.playtt-old-provider.jsonc']=(json.dumps(config,indent=2)+'\n').encode()
wasm=runtime/'node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'
for path,data in prepared.items():
    out=target/path
    out.parent.mkdir(parents=True,exist_ok=True)
    with out.open('xb') as f:f.write(data)
report={'schema':'playtt/old-provider-build-inputs/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'sourceCommit':'67dd308','sourceCount':77,'vendorCount':109,'assets':plan['assets'],'sources':plan['sources'],'generatedPhpLoaderSha256':plan['generatedPhpLoaderSha256'],'packageLockSha256':plan['packageLockSha256'],'wasm':{'path':str(wasm.relative_to(runtime)).replace('\\','/'),'sha256':sha(wasm.read_bytes()),'bytes':wasm.stat().st_size},'files':[{'path':p,'sha256':sha(d)} for p,d in sorted(prepared.items())],'productionEntrypoint':'src/worker-playtt-do.ts','localHarnessIncluded':False,'dependencyResolution':'Existing pinned runtime node_modules; no install or fresh dependency rebuild','currentProviderSourceCommit':'97a92c8a32cd58931d57fa5f17434b943976331e','networkCalls':0,'deployments':0}
(target/'build-inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({'result':'prepared','sources':77,'vendor':109,'files':len(prepared),'wasmBytes':wasm.stat().st_size,'cloudRequests':0}))
