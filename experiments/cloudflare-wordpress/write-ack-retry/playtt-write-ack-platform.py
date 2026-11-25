from pathlib import Path
import argparse
import datetime as dt
import json
import tomllib
import urllib.request

parser=argparse.ArgumentParser(description='Read-only expected deployed versions and binding boundary; no secret values emitted')
parser.add_argument('--runtime',type=Path,required=True)
parser.add_argument('--config',type=Path,required=True)
args=parser.parse_args()
runtime=args.runtime.resolve()
token=tomllib.loads(args.config.read_text(encoding='utf-8'))['oauth_token']
account='3baadbd4abd9fd63c7f7e51664b26f67'
target='playtt-wp-free-pin-restore-audit'
source='playtt-wp-free-rebuild-audit'
def get(worker,path):
    request=urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{account}/workers/scripts/{worker}/{path}',headers={'Authorization':'Bearer '+token},method='GET')
    with urllib.request.urlopen(request,timeout=45) as response: result=json.loads(response.read(2*1024*1024))
    assert result['success'] is True
    return result['result']
settings=get(target,'settings')
config=json.loads((runtime/'wrangler.playtt-pin-restore-audit.jsonc').read_text(encoding='utf-8'))
bindings=settings['bindings']
allowed={'plain_text','secret_text','r2_bucket','durable_object_namespace'}
assert {b['type'] for b in bindings}<=allowed
assert [(b['name'],b['bucket_name']) for b in bindings if b['type']=='r2_bucket']==[('WORDPRESS_STATE_BUCKET','playtt-wordpress-pin-restore-audit')]
assert sorted(b['name'] for b in bindings if b['type']=='durable_object_namespace')==['PLAYTT_EXECUTION','PLAYTT_STORAGE_BUDGET','WORDPRESS_STATE']
for name,value in config['vars'].items():
    found=next(b for b in bindings if b['name']==name)
    assert found['type']=='plain_text' and found['text']==value
versions={}
for worker,expected in [(target,'dc9704f3-cbcf-4f11-af8e-3cf37e8bc6d5'),(source,'8536d0cf-cfbf-4133-9764-ae4bbfdd2c45')]:
    deployment=get(worker,'deployments')['deployments'][0]
    assert deployment['versions']==[{'version_id':expected,'percentage':100}]
    versions[worker]={'version':expected,'percentage':100}
report={'at':dt.datetime.now(dt.timezone.utc).isoformat(),'result':'pass','versions':versions,
        'targetBindingTypes':sorted({b['type'] for b in bindings}),'targetNonSecretBindings':[{'name':b['name'],'type':b['type']} for b in bindings if b['type']!='secret_text'],
        'configuredVarsMatch':True,'r2Buckets':['playtt-wordpress-pin-restore-audit'],'d1QueueServiceWorkflowBindings':False,
        'scope':'Cloudflare current deployment percentages and target deployed bindings; no claim about external API clients or inactive older versions'}
(runtime/'artifacts/playtt-write-ack-platform.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':'pass','targetVersion':versions[target]['version'],'sourceVersion':versions[source]['version'],'deployedBindingsMatch':True}))
