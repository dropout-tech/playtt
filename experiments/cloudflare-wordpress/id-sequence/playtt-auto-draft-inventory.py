"""Read-only inventory of the latest verified private audit backup. Requires PyYAML."""
from pathlib import Path
import json,hashlib,datetime,re,yaml
runtime=Path(__file__).resolve().parent.parent
location=json.loads((runtime/'../../../playtt-snapshot-audit-backup-location.json').read_text(encoding='utf-8'))
directory=Path(location['directory']).resolve();allowed=(runtime/'../../../../outputs/backups/cloudflare-wordpress-snapshot-audit').resolve()
assert directory.is_relative_to(allowed)
verification=json.loads((directory/'verification.json').read_text(encoding='utf-8'));assert verification['result']=='pass'
manifest=json.loads((directory/'manifest.json').read_text(encoding='utf-8'));assert manifest['revision']==verification['revision']
def content(entry):
 data=(directory/'objects'/entry['sha256']).read_bytes();assert len(data)==entry['size'];assert hashlib.sha256(data).hexdigest()==entry['sha256'];return data.decode('utf-8')
auto=[];markdown_count=0;table_count=0;cron=False
for entry in manifest['files']:
 path=entry['path']
 if path.endswith('.md'):
  raw=content(entry);assert raw.startswith('---\n');end=raw.index('\n---',4);meta=yaml.safe_load(raw[4:end]);wp=meta['wordpress'];markdown_count+=1
  if wp['status']=='auto-draft':auto.append({'id':wp['id'],'type':wp['type'],'date':str(wp['date']),'dateGmt':str(wp['date_gmt']),'modified':str(wp['modified']),'storage':'markdown','bodyBytes':len(raw[end+5:].encode('utf-8'))})
 elif path=='_tables/posts.json':
  rows=json.loads(content(entry));table_count=len(rows)
  for row in rows:
   if row['post_status']=='auto-draft':auto.append({'id':int(row['ID']),'type':row['post_type'],'date':row['post_date'],'dateGmt':row['post_date_gmt'],'modified':row['post_modified'],'storage':'json-table','bodyBytes':len(row['post_content'].encode('utf-8'))})
 elif path=='_options/cron.json':
  option=json.loads(content(entry));assert isinstance(option['option_value'],str);cron='wp_scheduled_auto_draft_delete' in option['option_value']
assert len({row['id']for row in auto})==len(auto)
config=json.loads((runtime/'wrangler.playtt-retirement-restore-audit.jsonc').read_text(encoding='utf-8'))
wrapper=(runtime/'src/worker-playtt-do.ts').read_text(encoding='utf-8');worker=(runtime/'src/worker.ts').read_text(encoding='utf-8')
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'backupRevision':manifest['revision'],'scope':'Read-only offline verified backup inventory across Markdown and JSON post storage; static source/config inspection, not a live scheduler execution test','markdownPostFiles':markdown_count,'jsonPostRows':table_count,'autoDrafts':auto,'autoDraftCleanupHookPresent':cron,'auditConfigCronTriggers':config.get('triggers',{}).get('crons',[]),'wrapperScheduledMethodPresent':bool(re.search(r'\bscheduled\s*\(',wrapper)),'upstreamRuntimeScheduledMethodPresent':bool(re.search(r'\bscheduled\s*\(',worker)),'wordpressAutomaticCronDisabled':'DISABLE_WP_CRON: true' in worker,'remoteChanged':False,'deletions':0}
(runtime/'artifacts/playtt-auto-draft-inventory.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report))
