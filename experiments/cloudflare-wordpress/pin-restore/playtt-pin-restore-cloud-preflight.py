"""Read only the two explicit new restore resource names. Never emit tokens."""
import json, pathlib, tomllib, urllib.request, urllib.error, datetime

account = '3baadbd4abd9fd63c7f7e51664b26f67'
worker = 'playtt-wp-free-pin-restore-audit'
bucket = 'playtt-wordpress-pin-restore-audit'
token = tomllib.loads(pathlib.Path('../../../playtt-wrangler-config/.wrangler/config/default.toml').read_text(encoding='utf-8'))['oauth_token']
results = []
for kind, path in [('bucket', f'r2/buckets/{bucket}'), ('worker', f'workers/scripts/{worker}/settings')]:
    request = urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{account}/{path}', headers={'Authorization':'Bearer '+token}, method='GET')
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            status = response.status
    except urllib.error.HTTPError as e:
        status = e.code
    if status != 404:
        raise RuntimeError(f'{kind}: expected an absent resource, received HTTP {status}; inspect ownership before doing anything')
    results.append({'kind':kind,'name':bucket if kind == 'bucket' else worker,'status':status,'absent':True})
report = {'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'result':'pass','scope':'Read-only exact destination resource lookup before creation','resources':results}
pathlib.Path('artifacts/playtt-pin-restore-cloud-preflight.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
