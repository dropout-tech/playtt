"""Verify a full source build differs only in the Latin-1 manifest decoding loop."""
from pathlib import Path
import argparse, hashlib, json, datetime as dt
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--local', action='store_true', required=True)
p.add_argument('--build', type=Path, required=True)
p.add_argument('--check', action='store_true')
a = p.parse_args(); rt = Path.cwd().resolve(); build = a.build.resolve()
sha = lambda b: hashlib.sha256(b).hexdigest()
load = lambda p: json.loads(p.read_text(encoding='utf8'))
inputs = load(build / 'build-inputs.json')
assert inputs['sourceCount'] == 83 and len(inputs['files']) == 206
for item in inputs['files']:
    assert sha((build / item['path']).read_bytes()) == item['sha256'], item['path']
assert (build / 'typecheck-private.log').read_bytes() == b''
assert '--dry-run: exiting now.' in (build / 'dry-run-private.log').read_text(encoding='utf8')
prior = load(rt / 'artifacts/playtt-owned-paths-build-v2-private.json')
old_entry = next(m for m in prior['productionModules'] if m['path'].endswith('.js'))
old = Path(old_entry['path']).read_text(encoding='utf8')
assert sha(old.encode()) == prior['productionBundleSha256']
new = (build / 'dry-run/worker-playtt-do.js').read_text(encoding='utf8')
before = '  const compressed = Uint8Array.from(text3, (c5) => c5.charCodeAt(0));'
after = '  const compressed = new Uint8Array(text3.length);\n  for (let i = 0; i < text3.length; i++) compressed[i] = text3.charCodeAt(i);'
assert old.count(before) == 1
assert old.replace(before,after) == new, 'Unexpected compiled change outside manifest byte conversion'
modules = [{'path': str(p.resolve()), 'bytes': p.stat().st_size, 'sha256': sha(p.read_bytes())}
           for p in sorted((build / 'dry-run').iterdir()) if p.suffix in ['.js', '.wasm', '.sqlite', '.zip']]
assert len(modules) == 6
assert {m['sha256'] for m in modules if not m['path'].endswith('.js')} == {m['sha256'] for m in prior['productionModules'] if not m['path'].endswith('.js')}
meta = load(build / 'dry-run/bundle-meta.json'); expected = {e['path']: e['sha256'] for e in inputs['files']}; loaded = []
for name in meta['inputs']:
    if name.startswith('node-built-in-modules:'): continue
    path = (build / name).resolve()
    assert path.is_relative_to(build) or path.is_relative_to(rt)
    if name.startswith('src/'):
        assert sha(path.read_bytes()) == expected[name]; loaded.append(name)
    elif path.is_relative_to(rt / 'vendor'):
        assert sha(path.read_bytes()) == expected[path.relative_to(rt).as_posix()]
    else: assert not path.is_relative_to(rt / 'src')
assert 'src/playtt-manifest-envelope.ts' in loaded and 'src/worker.ts' in loaded
assert all(s not in new for s in ['__playttBootOwnership', '__local-bootstrap-adopt', 'LOCAL_EXPECTED_CONTENT_SHA'])
source = load(rt / 'artifacts/playtt-recovery-provider-source-plan.json')
for e in source['sources']:
    assert sha(Path(e['path']).read_text(encoding='utf8').encode()) == e['sha256']
plan_path = rt / 'artifacts/playtt-manifest-bytes-build-private.json'
proof_path = rt / 'artifacts/playtt-manifest-bytes-build-proof.json'
at = load(plan_path)['at'] if a.check else dt.datetime.now(dt.timezone.utc).isoformat()
plan = {'schema': 'playtt/manifest-bytes-build/v1', 'at': at, 'productionModules': modules,
        'productionBundleSha256': sha(new.encode()), 'entry': next(m['path'] for m in modules if m['path'].endswith('.js'))}
proof = {'schema': 'playtt/manifest-bytes-build-proof/v1', 'at': at, 'result': 'pass', 'sourceCount': 83,
         'sourceInputs': 206, 'loadedSourceCount': len(loaded), 'candidateSha256': inputs['candidateSourceSha256'],
         'baselineBundleSha256': prior['productionBundleSha256'], 'bundleSha256': sha(new.encode()),
         'typecheck': 'pass', 'wranglerDryRun': 'pass', 'exactScopedCompiledChanges': True,
         'unchangedBinaryModules': 5, 'centralRuntimeChanged': False, 'cloudRequests': 0, 'deployed': False}
for path, obj in [(plan_path, plan), (proof_path, proof)]:
    if a.check: assert load(path) == obj
    else:
        with path.open('x', encoding='utf8', newline='\n') as f: f.write(json.dumps(obj, indent=2)+'\n')
print(json.dumps(proof))
