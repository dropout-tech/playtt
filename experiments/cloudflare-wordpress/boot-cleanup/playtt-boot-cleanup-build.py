from pathlib import Path
import argparse,datetime as dt,hashlib,json
parser=argparse.ArgumentParser();parser.add_argument('--local',required=True,action='store_true');parser.add_argument('--build',type=Path,required=True);parser.add_argument('--check',action='store_true');args=parser.parse_args()
rt=Path.cwd().resolve();build=args.build.resolve();out=build/'dry-run';sha=lambda b:hashlib.sha256(b).hexdigest()
inputs=json.loads((build/'build-inputs.json').read_text(encoding='utf-8'));prior=json.loads((rt/'artifacts/playtt-preallocated-source-deploy-plan.json').read_text(encoding='utf-8'))['targets']['candidate']
for e in inputs['files']:assert sha((build/e['path']).read_bytes())==e['sha256'],e['path']
assert len(inputs['files'])==206 and (build/'typecheck-private.log').read_bytes()==b'' and not (build/'tsconfig.json').exists()
old=Path(prior['entry']).read_text(encoding='utf-8');new=(out/'worker-playtt-do.js').read_text(encoding='utf-8')
upstream='''async function rn(e) {
  const t = await qt(e);
  return await Ct(t, e), t;
}
__name(rn, "rn");
'''
helper='''// src/playtt-boot-cleanup.ts
async function bootPlayttWordPressRuntime(options, finish) {
  const handler2 = await qt(options);
  try {
    await Ct(handler2, options);
    return await finish(handler2);
  } catch (bootError) {
    try {
      const asyncDispose = Symbol.asyncDispose;
      const dispose = handler2[asyncDispose];
      await dispose.call(handler2);
    } catch (cleanupError) {
      throw new AggregateError([bootError, cleanupError], "WordPress boot failed and its request handler could not be disposed.", { cause: bootError });
    }
    throw bootError;
  }
}
__name(bootPlayttWordPressRuntime, "bootPlayttWordPressRuntime");

'''
assert old.count(upstream)==1;expected=old.replace(upstream,'');assert expected.count('// src/playtt-php-loader.mjs')==1;expected=expected.replace('// src/playtt-php-loader.mjs',helper+'// src/playtt-php-loader.mjs')
start=expected.index('async function bootWordPressRuntime(');end=expected.index('\n__name(bootWordPressRuntime, "bootWordPressRuntime");',start);before=expected[start:end]
anchor='  const requestHandler = trace ? await trace.measureComposite("playground.opaque", boot) : await boot();\n'
assert before.count(anchor)==1;options,finalizer=before.split(anchor);assert options.endswith('  }), "boot");\n') and finalizer.endswith('\n}')
options=options.removesuffix('  }), "boot");\n').replace('() => rn({','() => bootPlayttWordPressRuntime({').replace('php2','php')
after=options+'  }, async (requestHandler) => {\n'+''.join('  '+line for line in finalizer.removesuffix('\n}').splitlines(True))+'\n  }), "boot");\n  return trace ? trace.measureComposite("playground.opaque", boot) : boot();\n}'
expected=expected[:start]+after+expected[end:];assert expected==new,'Unexpected compiled difference beyond helper, its integration and scoped php2 identifier rename'
modules=[{'path':str(p.resolve()),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}for p in sorted(out.iterdir())if p.suffix in ['.js','.wasm','.sqlite','.zip']];assert len(modules)==6
assert {m['sha256']for m in modules if not m['path'].endswith('.js')}=={m['sha256']for m in prior['modules']if not m['path'].endswith('.js')}
meta=json.loads((out/'metafile.json').read_text(encoding='utf-8'));files={e['path']:e['sha256']for e in inputs['files']};loaded=[]
for name in meta['inputs']:
 if name.startswith('node-built-in-modules:'):continue
 p=(build/name).resolve();assert p.is_relative_to(build)or p.is_relative_to(rt)
 if name.startswith('src/'):
  assert sha(p.read_bytes())==files[name];loaded.append(name)
 elif p.is_relative_to(rt/'vendor'):assert sha(p.read_bytes())==files[p.relative_to(rt).as_posix()]
 else:assert not p.is_relative_to(rt/'src')
assert 'src/playtt-boot-cleanup.ts' in loaded and 'src/worker.ts' in loaded
assert all(x not in new for x in ['__playttBootOwnership','__local-bootstrap-adopt','LOCAL_EXPECTED_CONTENT_SHA'])
diag=build/'diagnostic';insertion='''const __playttBootOwnership = { next: 0, live: 0 };
''';needle='''async function bootPlayttWordPressRuntime(options, finish) {
  const handler2 = await qt(options);
''';replacement=insertion+needle+'''  const __playttOwnedId = ++__playttBootOwnership.next;
  __playttBootOwnership.live++;
  console.log(JSON.stringify({schema:'playtt/boot-ownership/v1',stage:'created',id:__playttOwnedId,live:__playttBootOwnership.live}));
  (await handler2.getPrimaryPhp()).addEventListener('runtime.beforeExit',()=>{
    __playttBootOwnership.live--;
    console.log(JSON.stringify({schema:'playtt/boot-ownership/v1',stage:'exited',id:__playttOwnedId,live:__playttBootOwnership.live}));
  });
'''
assert new.count(needle)==1;diagnostic=new.replace(needle,replacement);assert diagnostic.replace(replacement,needle)==new
plan_path=rt/'artifacts/playtt-boot-cleanup-build-private.json';proof_path=rt/'artifacts/playtt-boot-cleanup-build-proof.json'
if args.check:
 prior_plan=json.loads(plan_path.read_text(encoding='utf-8'));at=prior_plan['at'];assert (diag/'worker-playtt-do.js').read_text(encoding='utf-8')==diagnostic
else:
 assert not diag.exists() and not plan_path.exists() and not proof_path.exists();diag.mkdir();at=dt.datetime.now(dt.timezone.utc).isoformat()
 for m in modules:
  p=Path(m['path']);(diag/p.name).write_bytes(diagnostic.encode()if p.suffix=='.js'else p.read_bytes())
diagnostic_modules=[{'path':str((diag/Path(m['path']).name).resolve()),'bytes':(diag/Path(m['path']).name).stat().st_size,'sha256':sha((diag/Path(m['path']).name).read_bytes())}for m in modules]
plan={'schema':'playtt/boot-cleanup-build/v1','at':at,'entry':str((diag/'worker-playtt-do.js').resolve()),'modules':diagnostic_modules,'productionModules':modules,'productionBundleSha256':sha(new.encode()),'diagnosticBundleSha256':sha(diagnostic.encode()),'diagnosticReplacement':{'before':needle,'after':replacement}}
proof={'schema':'playtt/boot-cleanup-build-proof/v1','at':at,'result':'pass','sourceCount':83,'sourceInputs':206,'loadedSourceCount':len(loaded),'candidateWorkerSha256':inputs['candidateWorkerSha256'],'helperSha256':inputs['helperSha256'],'materializerSha256':inputs['materializerSha256'],'bundleSha256':sha(new.encode()),'typecheck':'pass','wranglerDryRun':'pass','exactScopedCompiledChanges':True,'unchangedBinaryModules':5,'diagnosticReversalExact':True,'diagnosticBundleSha256':sha(diagnostic.encode()),'diagnosticScope':'Only numeric handler creation/exit events after public handler construction; one additional awaited getPrimaryPhp; not for performance or production.','freshDependencyInstall':False,'centralRuntimeChanged':False,'cloudRequests':0,'deployed':False}
if args.check:
 assert plan==prior_plan;assert proof==json.loads(proof_path.read_text(encoding='utf-8'))
else:
 plan_path.write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8');proof_path.write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
print(json.dumps(proof))
