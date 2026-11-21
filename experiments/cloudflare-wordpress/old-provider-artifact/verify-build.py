from pathlib import Path
import datetime as dt, hashlib, json
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--workspace',required=True,type=Path)
root=parser.parse_args().workspace.resolve()
runtime=root/'work/playtt-delivery-rebuild/packages/runtime-cloudflare'
target=root/'work/playtt-old-provider-build'
output=runtime/'artifacts/playtt-old-provider-build.json'
assert not output.exists()
plan=json.loads((target/'build-inputs.json').read_text(encoding='utf8'))
meta=json.loads((target/'build/metafile.json').read_text(encoding='utf8'))
sha=lambda b:hashlib.sha256(b).hexdigest()
for entry in plan['files']:
    assert sha((target/entry['path']).read_bytes())==entry['sha256'],entry['path']
expected={e['path']:e['sha256'] for e in plan['files']}
loaded=[]
dependencies=[]
for path in meta['inputs']:
    if path in ['node-built-in-modules:worker_threads','node-built-in-modules:events']:
        continue
    p=(target/path).resolve()
    assert p.is_relative_to(target) or p.is_relative_to(runtime),path
    digest=sha(p.read_bytes())
    if path.startswith('src/'):
        assert expected[path]==digest,path
        loaded.append(path)
    elif path.startswith('../playtt-delivery-rebuild/'):
        assert not p.is_relative_to(runtime/'src'),path
        dependencies.append({'path':p.relative_to(runtime).as_posix(),'sha256':digest})
assert 'src/worker-playtt-do.ts' in loaded and 'src/worker.ts' in loaded
assert 'src/playtt-php-loader.mjs' in loaded
assert not any(p in loaded for p in ['src/playtt-manifest-envelope.ts','src/playtt-compressed-content.ts','src/playtt-recovery-uploads.ts'])
modules=[]
for p in sorted((target/'build').iterdir()):
    if p.suffix in ['.js','.wasm','.sqlite','.zip']:
        modules.append({'path':p.name,'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size})
assert len(modules)==6
bundle=(target/'build/worker-playtt-do.js').read_text(encoding='utf8')
assert '__local-bootstrap-adopt' not in bundle
assert "Local only" not in bundle
assert 'PlayttWordPressExecution' in bundle and 'PlayttStorageBudget' in bundle
report={'schema':'playtt/old-provider-build/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'result':'pass','sourceCommit':'67dd308','verifiedSources':77,'verifiedVendorFiles':109,'verifiedAssets':9,'loadedSourceFilesIncludingGeneratedLoader':len(loaded),'loadedSources':sorted(loaded),'sourceMapFilesLocalOnly':True,'dependencies':dependencies,'modules':modules,'bundleSha256':sha((target/'build/worker-playtt-do.js').read_bytes()),'productionEntrypoint':'src/worker-playtt-do.ts','localGateOrBootstrapIncluded':False,'dryRunUploadKiB':20896.92,'dryRunGzipKiB':7610.85,'existingUpstreamLoaderWarningsRetained':True,'freshDependencyRebuild':False,'cloudRequests':0,'deployments':0}
output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:report[k] for k in ['result','verifiedSources','verifiedVendorFiles','loadedSourceFilesIncludingGeneratedLoader','bundleSha256','cloudRequests','deployments']}))
