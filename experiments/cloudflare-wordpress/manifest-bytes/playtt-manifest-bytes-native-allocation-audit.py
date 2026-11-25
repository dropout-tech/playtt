"""Offline numerical analysis of two bounded native-editor allocation windows."""
from pathlib import Path
from collections import Counter
import argparse, hashlib, json, re

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--runtime', type=Path, required=True)
p.add_argument('--local', action='store_true', required=True)
p.add_argument('--check', action='store_true')
a = p.parse_args()
rt = a.runtime.resolve()
load = lambda path: json.loads(path.read_text(encoding='utf8'))
sha = lambda b: hashlib.sha256(b).hexdigest()
prefix = 'playtt-manifest-bytes-native-'
owner = load(rt / ('artifacts/' + prefix + 'owned-private.json'))
run = load(rt / ('artifacts/' + prefix + 'summary.json'))
assert owner['phase'] == 'verified' and owner['sealed'] and owner['localProcessesDisposed']
assert run['result'] == 'pass' and run['cloudRequests'] == run['outboundAttempts'] == 0
plan = load(rt / 'artifacts/playtt-manifest-bytes-build-private.json')
entry = next(m for m in plan['productionModules'] if m['path'].endswith('.js'))
bundle = Path(entry['path']).read_bytes()
assert sha(bundle) == entry['sha256'] == run['bundleSha256']
lines = bundle.decode().splitlines()
directory = Path(owner['directory']) / 'before-restart'
obs = load(directory / 'exception-allocation-observation.json')
assert obs['stopped'] and not obs['errors']
assert not any(e['kind'] == 'exception' for e in obs['events'])
assert [x['name'] for x in obs['allocations']] == ['render', 'save']
safe = lambda s: s if re.fullmatch(r'[A-Za-z0-9_$ .:<>()[\]/-]{0,140}', s) else '<other>'
windows = []
for allocation in obs['allocations']:
    raw = (directory / (allocation['name'] + '-allocation-private.json')).read_bytes()
    assert len(raw) == allocation['bytes'] <= 8 * 1024 * 1024
    assert sha(raw) == allocation['sha256']
    assert allocation['options'] == {'samplingInterval': 32768, 'includeObjectsCollectedByMajorGC': True, 'includeObjectsCollectedByMinorGC': True}
    profile = json.loads(raw)
    stack = [(profile['head'], [])]
    by_name, by_location = Counter(), Counter()
    callsites = []
    nodes = 0
    while stack:
        n, parents = stack.pop()
        nodes += 1
        f = n['callFrame']
        name = safe(f['functionName']) or '(anonymous)'
        size = n['selfSize']
        assert size >= 0
        by_name[name] += size
        source = 'production-bundle' if f['url'] == 'worker-playtt-do.js' or f['url'].endswith('/worker-playtt-do.js') else 'runtime-or-wrapper'
        line, column = f['lineNumber'] + 1, f['columnNumber'] + 1
        if source == 'production-bundle':
            assert 1 <= line <= len(lines)
        by_location[(name, source, line, column)] += size
        if size:
            callsites.append({'function': name, 'source': source, 'line': line, 'column': column,
                              'attributedSelfBytes': size, 'ancestors': parents[-10:]})
        stack.extend((child, parents + [name]) for child in n['children'])
    events = [e for e in obs['events'] if allocation['startedAt'] <= e['at'] <= allocation['finishedAt']]
    requests = [e for e in events if e['kind'] == 'request']
    receipts = [e for e in events if e['kind'] == 'native-save']
    if allocation['name'] == 'render':
        assert sum(e['category'] == 'post-editor' for e in requests) == 1 and not receipts
    else:
        assert len(receipts) == 1 and receipts[0]['contentExact'] and receipts[0]['status'] == 200
    windows.append({
        'name': allocation['name'], 'elapsedMs': allocation['finishedAt'] - allocation['startedAt'],
        'profileBytes': len(raw), 'profileSha256': sha(raw), 'options': allocation['options'],
        'profileNodes': nodes, 'samples': len(profile['samples']),
        'nodeAttributedSelfBytes': sum(by_name.values()),
        'sampleAttributedSizeSum': sum(x['size'] for x in profile['samples']),
        'topFunctions': [{'function': k, 'attributedSelfBytes': v} for k, v in by_name.most_common(25)],
        'topLocations': [{'function': k[0], 'source': k[1], 'line': k[2], 'column': k[3], 'attributedSelfBytes': v}
                         for k, v in by_location.most_common(30)],
        'topCallsites': sorted(callsites, key=lambda x: x['attributedSelfBytes'], reverse=True)[:30],
        'requestsDuringSampling': len(requests), 'nativeSaveReceipts': len(receipts),
        'requestCategories': dict(sorted(Counter(e['category'] for e in requests).items())),
        'requestStatusCounts': dict(sorted(Counter(str(e['status']) for e in requests).items())),
    })
report = {
    'schema': 'playtt/transient-allocation-audit/v1', 'at': run['at'], 'result': 'analyzed',
    'bundleSha256': entry['sha256'], 'windows': windows,
    'scope': 'Separate native-editor render and save windows on the same local workerd instance.',
    'limitations': [
        'Sampling includes collected objects. Cumulative sampled JS allocations are not simultaneous retained bytes, WASM allocator usage, RSS, provider peak or billed CPU.',
        'Node selfSize and sample sizes are distinct outputs and must not be added together.',
        'Windows contain surrounding requests as enumerated; elapsed time includes browser interaction and control overhead.',
        'The local fixture does not enforce Cloudflare admission. No cloud write or deployment occurred.',
    ],
    'cloudRequests': 0, 'centralSourceChanged': False, 'rawProfilesPrivate': True,
}
serialized = json.dumps(report, indent=2) + '\n'
output = rt / 'artifacts/playtt-manifest-bytes-native-allocation-audit.json'
if a.check:
    assert output.read_text(encoding='utf8') == serialized
else:
    with output.open('x', encoding='utf8', newline='\n') as f:
        f.write(serialized)
print(json.dumps({'result':'analyzed','windows':[{'name':w['name'],'samples':w['samples'],'nodeAttributedSelfBytes':w['nodeAttributedSelfBytes'],'elapsedMs':w['elapsedMs']}for w in windows]}))
