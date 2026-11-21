"""Read-only bounded download of the exact retained set. Private payloads stay local.

GET is the only cloud method. No deletion, restore, deployment or apply mode.
Resume uses the same immutable input fingerprint and rechecks cached bytes.
"""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
import threading
import tomllib
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ACCOUNT = '3baadbd4abd9fd63c7f7e51664b26f67'
BUCKET = 'playtt-wordpress-rebuild-audit'
ROOT = 'sites/default/'
UUID = re.compile(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}')
HASH = re.compile(r'[a-f0-9]{64}')
MAX_MANIFEST = 256 * 1024
MAX_PACK = 8 * 1024 * 1024
MAX_DECODED = 32 * 1024 * 1024


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['config', 'inventory', 'plan', 'plan-summary', 'registry', 'output']:
        parser.add_argument('--' + name, type=pathlib.Path, required=True)
    args = parser.parse_args()
    input_bytes = {k: getattr(args, k).read_bytes() for k in ['inventory', 'plan', 'plan_summary', 'registry']}
    values = {k: json.loads(v) for k, v in input_bytes.items()}
    inv, plan, summary, registry = (values[k] for k in ['inventory', 'plan', 'plan_summary', 'registry'])
    require(summary['safeToApply'] is False and summary['bucket'] == inv['bucket'] == BUCKET, 'Wrong scope or executable proposal')
    require(inv.get('completeListing') is True and inv.get('metadataIncluded') is True, 'Complete metadata inventory required')
    for field, key in [('privateInventorySha256', 'inventory'), ('privatePlanSha256', 'plan'), ('privateRegistrySha256', 'registry')]:
        require(summary[field] == sha(input_bytes[key]), 'Input fingerprint differs from the proposal')
    retained = sorted(plan['retained'])
    require(len(retained) == summary['retainedRevisions'] and 0 < len(retained) <= 128, 'Retained set exceeds this audit scope')
    pins = {p['revision']: p for p in registry['pins']}
    require(registry['schema'] == 'playtt/backup-pins/v1' and len(pins) == len(registry['pins']) == registry['generation'], 'Invalid pin registry')
    require(set(pins) <= set(retained), 'Protected version omitted')
    objects = {o['key']: o for o in inv['objects']}
    require(len(objects) == len(inv['objects']), 'Duplicate inventory key')
    manifests, pack_sizes = {}, {}
    for revision in retained:
        require(UUID.fullmatch(revision), 'Invalid retained identity')
        key = ROOT + 'markdown/revisions/' + revision + '.json'
        m = inv['records'][key]
        require(m['revision'] == revision and m['manifestKey'] == key and 0 < objects[key]['size'] <= MAX_MANIFEST, 'Invalid manifest identity or size')
        pack = m['restorePack']
        require(HASH.fullmatch(pack['sha256']) and pack['objectKey'] == ROOT + 'restore-packs/' + pack['sha256'] + '.zip', 'Invalid pack identity')
        require(0 < pack['size'] <= MAX_PACK and pack['size'] == objects[pack['objectKey']]['size'] and 0 <= pack['decodedBytes'] <= MAX_DECODED, 'Pack exceeds audit bounds or inventory differs')
        if revision in pins:
            pin = pins[revision]
            require(pin['packKey'] == pack['objectKey'] and pin['packSha256'] == pack['sha256'] and pin['packBytes'] == pack['size'], 'Pinned pack differs')
        manifests[revision] = m
        pack_sizes[pack['sha256']] = pack['size']
    require(sum(pack_sizes.values()) <= 512 * 1024 * 1024, 'Download union exceeds audit budget')
    target = args.output.resolve()
    target.mkdir(parents=True, exist_ok=True)
    fingerprint = {'schema': 'playtt/retained-pack-download/v1', 'bucket': BUCKET,
                   'inputs': {k: sha(v) for k, v in input_bytes.items()}}
    guard = target / 'inputs.json'
    if guard.exists():
        require(json.loads(guard.read_text(encoding='utf-8')) == fingerprint, 'Existing cache belongs to different inputs')
    else:
        require(not list(target.iterdir()), 'Use an empty output directory')
        save(guard, fingerprint)
    (target / 'manifests').mkdir(exist_ok=True)
    (target / 'packs').mkdir(exist_ok=True)
    token = tomllib.loads(args.config.read_text(encoding='utf-8'))['oauth_token']
    base = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects/'
    locks = {digest: threading.Lock() for digest in pack_sizes}
    counters = {'gets': 0, 'bytes': 0, 'cacheHits': 0}
    counter_lock = threading.Lock()

    def read(key, maximum):
        request = urllib.request.Request(base + urllib.parse.quote(key, safe=''), headers={'Authorization': 'Bearer ' + token}, method='GET')
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = response.read(maximum + 1)
        require(len(payload) <= maximum, 'Remote response exceeded bounded size')
        with counter_lock:
            counters['gets'] += 1
            counters['bytes'] += len(payload)
        return payload

    def fetch_revision(revision):
        m = manifests[revision]
        manifest_file = 'manifests/' + revision + '.json'
        path = target / manifest_file
        if path.exists():
            raw = path.read_bytes()
            with counter_lock: counters['cacheHits'] += 1
        else:
            raw = read(m['manifestKey'], MAX_MANIFEST)
        require(len(raw) == objects[m['manifestKey']]['size'] and json.loads(raw) == m, 'Remote manifest differs from inventoried content')
        if revision in pins:
            require(sha(raw) == pins[revision]['manifestSha256'], 'Protected manifest digest differs')
        if not path.exists():
            with path.open('xb') as file: file.write(raw)
        pack = m['restorePack']
        pack_file = 'packs/' + pack['sha256'] + '.zip'
        with locks[pack['sha256']]:
            path = target / pack_file
            if path.exists():
                payload = path.read_bytes()
                with counter_lock: counters['cacheHits'] += 1
            else:
                payload = read(pack['objectKey'], MAX_PACK)
            require(len(payload) == pack['size'] and sha(payload) == pack['sha256'], 'Remote pack digest or size differs')
            if not path.exists():
                with path.open('xb') as file: file.write(payload)
        return {'revision': revision, 'manifestFile': manifest_file, 'manifestSha256': sha(raw), 'manifestBytes': len(raw),
                'packFile': pack_file, 'packSha256': pack['sha256'], 'packBytes': pack['size'], 'pinned': revision in pins}

    rows, failures = [], []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch_revision, r): r for r in retained}
        for future in as_completed(futures):
            try:
                rows.append(future.result())
            except Exception as error:
                failures.append({'revision': futures[future], 'errorType': type(error).__name__, 'httpStatus': error.code if isinstance(error, urllib.error.HTTPError) else None})
            if (len(rows) + len(failures)) % 12 == 0:
                print(json.dumps({'verifiedDownloads': len(rows), 'failed': len(failures), 'total': len(retained)}), flush=True)
    index = {**fingerprint, 'at': dt.datetime.now(dt.timezone.utc).isoformat(), 'result': 'fail' if failures else 'downloaded',
             'scope': 'Authenticated remote bytes and compressed hashes only; full ZIP decode is a separate required step',
             'expectedRevisions': len(retained), 'uniquePacks': len(pack_sizes), 'rows': sorted(rows, key=lambda r: r['revision']),
             'failures': failures, 'requests': counters, 'safeToApply': False}
    save(target / 'index.json', index)
    print(json.dumps({'result': index['result'], 'revisions': len(rows), 'uniquePacks': len(pack_sizes), 'requests': counters, 'failed': len(failures)}))
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
