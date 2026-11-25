"""Offline accounting of fixed local observations, calibrated against the same installed workerd.

No Worker, browser, WordPress, provider or network request. Never sums PHP into heap snapshots.
--check recomputes the report and compares an existing output without rewriting it.
"""
from pathlib import Path
import argparse, hashlib, json, re

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--local', action='store_true', required=True)
p.add_argument('--check', action='store_true')
a = p.parse_args()
rt = Path.cwd()
load = lambda path: json.loads(path.read_text(encoding='utf-8'))
sha = lambda data: hashlib.sha256(data).hexdigest()
norm = lambda path: path.read_text(encoding='utf-8-sig').encode()
proof_path = rt / 'artifacts/playtt-local-limit-v2-proof.json'
proof = load(proof_path)
assert proof['schema'] == 'playtt/local-limit-capability-proof/v1'
assert proof['localOnly'] and proof['cloudRequests'] == 0 and proof['outboundAttempts'] == 0
assert proof['localProcessesDisposed'] and proof['environmentRestored']
assert len(proof['cases']) == 4
assert proof['versions']['workerd'] == '1.20260828.1'
for name, version in proof['versions'].items():
    assert load(rt / 'node_modules' / name / 'package.json')['version'] == version
assert {(tuple(c['v8Flags']), c['kind']) for c in proof['cases']} == {
    (flags, kind) for flags in [(), ('--max-old-space-size=128',)]
    for kind in ['array-buffer', 'wasm-memory']}
for c in proof['cases']:
    assert c['allocatedBytes'] == 160 * 1024 * 1024 and c['touchedPages'] == 40960
    assert c['allocationHttp200'] and c['sameInstance'] and c['separateRequestRetainedExact']
    assert c['exceptions'] == [] and c['forcedGc'] is False
    expected = c['allocatedBytes'] if c['kind'] == 'array-buffer' else 0
    assert c['usageAfter']['backingStorageSize'] - c['usageBefore']['backingStorageSize'] == expected

memory_source = rt / 'src/playtt-memory-diagnostics.ts'
assert 'heapBytes: module?.HEAPU8?.byteLength || 0' in memory_source.read_text(encoding='utf-8')
threshold = 128 * 1024 * 1024  # Diagnostic reference only; docs say 128MB, not a local enforced limit.
summaries = []
for name in ['playtt-path-join-baseline-native', 'playtt-path-join-candidate-native', 'playtt-materialized-native']:
    owner = load(rt / 'artifacts' / (name + '-owned-private.json'))
    directory = Path(owner['directory']).resolve()
    assert directory.is_relative_to((rt / 'artifacts').resolve())
    profile_path = directory / 'exception-allocation-observation.json'
    data = load(profile_path)
    assert data['schema'] == 'playtt/local-exception-allocation/v1'
    assert data['stopped'] and not data['errors']
    events = sorted(data['events'], key=lambda e: e['at'])
    assert [e['generation'] for e in events if e['kind'] == 'generation'] == [1]
    assert not any(e['kind'] == 'retirement' for e in events)
    samples = sorted(data['samples'], key=lambda s: s['at'])
    cursor = 0
    generation = None
    php = None
    rows = []
    for sample in samples:
        for key in ['at', 'usedSize', 'backingStorageSize']:
            assert isinstance(sample[key], int) and sample[key] >= 0
        while cursor < len(events) and events[cursor]['at'] <= sample['at']:
            event = events[cursor]
            cursor += 1
            if event['kind'] == 'generation':
                generation, php = event['generation'], None
            elif event['kind'] == 'retirement':
                generation, php = None, None
            elif event['kind'] == 'php':
                assert generation is not None and event['heapBytes'] > 0
                assert php is None or event['heapBytes'] >= php['heapBytes']
                php = event
        if php is None:
            continue
        rows.append({
            'at': sample['at'], 'label': sample['label'], 'generation': generation,
            'usedSize': sample['usedSize'], 'backingStorageSize': sample['backingStorageSize'],
            'lastKnownWasmBytes': php['heapBytes'], 'phpObservedAt': php['at'],
            'wasmObservationAgeMs': sample['at'] - php['at'],
            'observedComponentSumBytes': sample['usedSize'] + sample['backingStorageSize'] + php['heapBytes'],
        })
    assert rows
    maximum = lambda group: max(group, key=lambda r: r['observedComponentSumBytes'])
    phases = []
    for label in dict.fromkeys(r['label'] for r in rows):
        group = [r for r in rows if r['label'] == label]
        phases.append({'label': label, 'matchedSamples': len(group), 'maximumObserved': maximum(group)})
    allocation = data.get('allocation')
    window = None
    if allocation:
        group = [r for r in rows if allocation['startedAt'] <= r['at'] <= allocation['finishedAt']]
        assert group
        requests = [e for e in events if e['kind'] == 'request' and allocation['startedAt'] <= e['at'] <= allocation['finishedAt']]
        assert len(requests) == 8 and all(e['category'] != 'asset' for e in requests)
        window = {'startedAt': allocation['startedAt'], 'finishedAt': allocation['finishedAt'],
                  'matchedSamples': len(group), 'completedRequests': len(requests),
                  'maximumObserved': maximum(group), 'comparativePeakImprovementClaimed': False}
    before_assets = None
    if name == 'playtt-materialized-native':
        first_asset = next(e for e in events if e['kind'] == 'request-lifecycle' and e.get('category') == 'asset' and e.get('stage') == 'start')
        group = [r for r in rows if r['at'] < first_asset['at']]
        assert len(group) == 1
        before_assets = {'firstObservedClassifiedAssetStartAt': first_asset['at'],
                         'sample': group[0], 'hostTimestampLeadMs': first_asset['at'] - group[0]['at'],
                         'interpretation': 'Large backing usage was already observed before the first classified asset start. This narrows attribution to include cold boot; host receipt order is not an exact server trace.'}
    summaries.append({'fixture': name, 'inputSha256': sha(profile_path.read_bytes()),
                      'inputSchema': data['schema'], 'sampleCount': len(samples), 'matchedSampleCount': len(rows),
                      'unmatchedBeforeKnownWasm': len(samples) - len(rows), 'generations': 1, 'retirements': 0,
                      'maximumObserved': maximum(rows), 'samplesAboveDiagnostic128MiB': sum(r['observedComponentSumBytes'] > threshold for r in rows),
                      'byObserverLabel': phases, 'allocationWindow': window, 'beforeAssets': before_assets})

log_path = rt / 'artifacts/playtt-materialized-native-run-private.log'
matches = re.findall(r'\{[^\r\n]*"schema"\s*:\s*"playtt-core-compaction/v1"[^\r\n]*\}', log_path.read_text(encoding='utf-8', errors='replace'))
compactions = [json.loads(value) for value in matches]
assert len(compactions) == 1
compaction = {key: compactions[0][key] for key in ['files', 'beforeBytes', 'afterBytes', 'releasedCapacityBytes']}
assert compaction['beforeBytes'] - compaction['afterBytes'] == compaction['releasedCapacityBytes']
assert compaction == {'files': 489, 'beforeBytes': 31102303, 'afterBytes': 22527346, 'releasedCapacityBytes': 8574957}
source_paths = ['src/playtt-memory-diagnostics.ts', 'src/playtt-core-memory.ts', 'src/wordpress-runtime-artifact.ts', 'src/worker.ts']
report = {
    'schema': 'playtt/local-calibrated-memory-accounting/v1', 'result': 'pass',
    'calibrationSha256': sha(proof_path.read_bytes()), 'versions': proof['versions'],
    'sourceHashesNormalizedLf': {path: sha(norm(rt / path)) for path in source_paths},
    'formula': 'Runtime.getHeapUsage.usedSize + backingStorageSize + last preceding HEAPU8.byteLength in the same runtime generation',
    'diagnosticReferenceBytes': threshold, 'providerDocumentedLabel': '128MB per isolate including JavaScript and WebAssembly',
    'wasmBackingAbsentInControlledCalibration': True, 'embedderHeapNotAdded': True, 'heapSnapshotsNotUsed': True,
    'newWordpressRequests': 0, 'cloudRequests': 0, 'runtimeModified': False,
    'profiles': summaries,
    'coldBootCompaction': {'logSha256': sha(log_path.read_bytes()), **compaction,
        'source': 'src/playtt-core-memory.ts:21 copies shortened buffers; worker.ts:2599 calls it after boot',
        'interpretation': 'Capacity reduction is verified. Old buffers become eligible for GC; this does not prove immediate release or attribute the observed transient backing peak to compaction.'},
    'nextDiscriminator': 'Instrument bounded cold boot before/after extraction and compaction without browser assets. Compare exact content and buffer ownership before proposing a loader/materializer change; do not force GC and claim provider acceptance.',
    'limitations': [
        'Calibration applies to these installed versions and controlled cases. Prior traces use the unchanged installed toolchain; this is offline reinterpretation, not a new provider measurement.',
        'Samples and console events carry host receipt timestamps. The latest PHP heap observation may be old; growth between observations and unsampled startup are not captured. This is an observed component sum, not an exact simultaneous peak, lower bound guarantee, RSS or billable memory.',
        'Runtime.getHeapUsage is distinct from earlier HeapProfiler snapshots, whose totals already include PHP backing. Never add PHP again to those snapshots.',
        'Inspector, local worker/DO placement, cache conditions and GC affect results; cloud isolation and enforcement may differ. Exceeding the diagnostic reference does not prove a cloud request would fail.',
        'Different whole-flow samples and one fixed-order allocation pair cannot establish a stable peak-memory improvement. Lower cumulative JS allocation does not resolve the memory acceptance gap.',
        'The pre-asset sample and allocating source paths narrow investigation but do not uniquely identify a responsible allocation. Original unclassified exceptions and REST403 remain open.',
    ],
}
target = rt / 'artifacts/playtt-local-memory-accounting.json'
if a.check:
    assert load(target) == report, 'Existing audit differs; inspect without overwriting'
else:
    with target.open('x', encoding='utf-8') as f:
        f.write(json.dumps(report, indent=2) + '\n')
print(json.dumps({'result': 'pass', 'checkOnly': a.check, 'fixtures': len(summaries),
                  'maximaBytes': [s['maximumObserved']['observedComponentSumBytes'] for s in summaries],
                  'newWordpressRequests': 0, 'cloudRequests': 0}))
