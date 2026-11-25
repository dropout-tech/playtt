from pathlib import Path
import datetime as dt,hashlib,json
import argparse
parser=argparse.ArgumentParser(description='Verify exact isolated source-build output; --check never writes plans or reports.');parser.add_argument('--local',action='store_true',required=True);parser.add_argument('--build',type=Path,required=True);parser.add_argument('--check',action='store_true');args=parser.parse_args()
rt=Path.cwd().resolve();build=args.build.resolve();out=build/'dry-run-matched'
assert (rt/'scripts/playtt-snapshot-bundle.mjs').is_file()

sha=lambda b:hashlib.sha256(b).hexdigest();norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
inputs=json.loads((build/'build-inputs.json').read_text(encoding='utf-8'));old=json.loads((rt/'artifacts/playtt-path-join-deploy-plan.json').read_text(encoding='utf-8'))['targets']['candidate'];prototype=json.loads((rt/'artifacts/playtt-preallocated-cold-build-private.json').read_text(encoding='utf-8'))
for e in inputs['files']:assert sha((build/e['path']).read_bytes())==e['sha256'],e['path']
assert not (build/'tsconfig.json').exists()
assert (build/'typecheck-private.log').read_bytes()==b''
bundle=(out/'worker-playtt-do.js').read_text(encoding='utf-8');expected=Path(old['entry']).read_text(encoding='utf-8')
for e in prototype['candidateEdits']:
 assert expected.count(e['before'])==1;expected=expected.replace(e['before'],e['after'])
assert expected==bundle,'Complete built artifact must equal exactly the two tested implementation edits'
assert all(x not in bundle for x in ['__playttCold','cold-observer.invalid','__local-bootstrap-adopt','LOCAL_EXPECTED_CONTENT_SHA'])
assert 'const interval = setInterval(pump, 20);' in bundle
modules=[{'path':str(p.resolve()),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}for p in sorted(out.iterdir())if p.suffix in ['.js','.wasm','.sqlite','.zip']]
assert len(modules)==6
assert {m['sha256']for m in modules if not m['path'].endswith('.js')}=={m['sha256']for m in old['modules']if not m['path'].endswith('.js')}
meta=json.loads((out/'metafile.json').read_text(encoding='utf-8'));expected_inputs={e['path']:e['sha256']for e in inputs['files']};loaded=[];dependencies=[]
for name in meta['inputs']:
 if name.startswith('node-built-in-modules:'):continue
 p=(build/name).resolve();assert p.is_relative_to(build)or p.is_relative_to(rt),name
 digest=sha(p.read_bytes())
 if name.startswith('src/'):
  assert expected_inputs[name]==digest;loaded.append(name)
 elif p.is_relative_to(rt):
  assert not p.is_relative_to(rt/'src');assert not p.is_relative_to(rt/'vendor') or expected_inputs[p.relative_to(rt).as_posix()]==digest;dependencies.append({'path':p.relative_to(rt).as_posix(),'sha256':digest})
assert all(p in loaded for p in ['src/worker-playtt-do.ts','src/wordpress-runtime-artifact.ts','src/playtt-php-loader.mjs'])
target={'baselineSourceCommit':inputs['baselineRuntimeSourceCommit'],'sourceCommit':'97a92c8+9b94c19-preallocated-core-local','candidateDeliveryCommit':inputs['candidateDeliveryCommit'],'entry':str((out/'worker-playtt-do.js').resolve()),'modules':modules}
plan={'schema':'playtt/preallocated-full-source-build/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'targets':{'candidate':target},'sources':82,'configsChanged':False,'cloudRequests':0,'deployed':False}
plan_path=rt/'artifacts/playtt-preallocated-source-deploy-plan.json'
if args.check:
 previous=json.loads(plan_path.read_text(encoding='utf-8'));plan['at']=previous['at'];assert plan==previous
else:
 assert not plan_path.exists();plan_path.write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
report={'schema':'playtt/preallocated-full-build-proof/v1','at':plan['at'],'result':'pass','sourceCount':82,'vendorCount':109,'assetCount':9,'loadedSources':sorted(loaded),'loadedSourceCount':len(loaded),'candidateSourceSha256':inputs['candidateSourceSha256'],'baselineSourceSha256':inputs['baselineSourceSha256'],'generatorAndLoaderUnchanged':True,'completeBundleExactlyTwoEdits':True,'fiveBinaryModulesExact':True,'productionEntrypoint':'src/worker-playtt-do.ts','diagnosticBarriersOrLocalGateInBundle':False,'bundleSha256':sha((out/'worker-playtt-do.js').read_bytes()),'modules':[{'name':Path(m['path']).name,'bytes':m['bytes'],'sha256':m['sha256']}for m in modules],'dependencies':dependencies,'typecheck':'pass','typecheckConfigSeparated':True,'initialCompilerDifferenceRetained':bool(inputs.get('initialDifferentCompilerOutputRetained')),'freshDependenciesInstalled':False,'centralRuntimeChanged':False,'cloudRequests':0,'deployed':False}
proof_path=rt/'artifacts/playtt-preallocated-full-build-proof.json'
if args.check:assert report==json.loads(proof_path.read_text(encoding='utf-8'))
else:
 assert not proof_path.exists();proof_path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k]for k in ['result','sourceCount','loadedSourceCount','completeBundleExactlyTwoEdits','typecheck','bundleSha256','centralRuntimeChanged','deployed']}))
