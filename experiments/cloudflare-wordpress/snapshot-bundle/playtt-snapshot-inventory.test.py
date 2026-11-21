"""GET-only collector contract tests; all HTTP responses are local fixtures."""
import base64
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.parse

spec=importlib.util.spec_from_file_location('snapshot_inventory',Path('scripts/playtt-read-snapshot-inventory.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class InventoryTests(unittest.TestCase):
    def run_collector(self,mode='normal'):
        parent=Path('artifacts').resolve();parent.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='inventory-unit-',dir=parent) as directory:
            target=Path(directory).resolve();self.assertTrue(target.is_relative_to(parent))
            config=target/'oauth.toml';config.write_text('oauth_token = "synthetic-test-token"\n',encoding='utf-8')
            output=target/'result.json'
            manifest_key='sites/default/markdown/revisions/12345678-1234-4234-8234-123456789012.json'
            raw=' { "revision" : "12345678-1234-4234-8234-123456789012", "title" : "繁體中文" } \n'.encode('utf-8')
            current=b'{"revision":"12345678-1234-4234-8234-123456789012"}'
            payloads={manifest_key:raw,'sites/default/markdown/current.json':current}
            objects=[{'key':key,'size':len(value)} for key,value in payloads.items()]
            if mode=='size':objects[0]['size']+=1
            if mode=='duplicate':objects.append(objects[0])
            requests=[]
            def urlopen(request,timeout):
                requests.append(request);self.assertEqual(request.method,'GET');self.assertEqual(timeout,45)
                self.assertEqual(urllib.parse.urlsplit(request.full_url).hostname,'api.cloudflare.com')
                self.assertEqual(request.headers.get('Authorization'),'Bearer synthetic-test-token')
                if '?' in request.full_url:
                    return contextlib.closing(io.BytesIO(json.dumps({'success':True,'result':objects,'result_info':{'is_truncated':False}}).encode()))
                key=urllib.parse.unquote(request.full_url.split('/objects/')[1])
                return contextlib.closing(io.BytesIO(payloads[key]))
            argv=['collector','--config',str(config),'--output',str(output),'--bucket','playtt-wordpress-pin-restore-audit','--all-publication-metadata','--include-raw-manifests']
            if mode=='list-only':argv.append('--list-only')
            with patch('sys.argv',argv),patch.object(module.urllib.request,'urlopen',side_effect=urlopen),contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()):
                if mode in ['size','duplicate']:
                    with self.assertRaises(ValueError):module.main()
                    self.assertFalse(output.exists());return
                if mode=='list-only':
                    with self.assertRaises(SystemExit):module.main()
                    self.assertEqual(requests,[]);return
                module.main()
            result=json.loads(output.read_text(encoding='utf-8'))
            self.assertEqual(result['metadataProfile'],'references-overlay-v1')
            self.assertEqual(set(result['rawManifestBytes']),{manifest_key})
            self.assertEqual(base64.b64decode(result['rawManifestBytes'][manifest_key]),raw)
            self.assertEqual(result['records'][manifest_key],json.loads(raw))
            self.assertEqual(len(requests),3);self.assertFalse(result['atomicSnapshot'])
            self.assertNotIn('synthetic-test-token',output.read_text(encoding='utf-8'))
    def test_exact_raw_unicode_and_whitespace(self):self.run_collector()
    def test_changed_metadata_size(self):self.run_collector('size')
    def test_duplicate_listing(self):self.run_collector('duplicate')
    def test_list_only_refused_before_network(self):self.run_collector('list-only')

if __name__=='__main__':unittest.main()
