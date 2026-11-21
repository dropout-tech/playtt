import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import YAML from 'yaml';
import { decodeCanonicalRestorePack } from '../src/canonical-restore-pack.ts';

export const BUCKET='playtt-wordpress-rebuild-audit';
const ROOT='sites/default',UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/,HASH=/^[a-f0-9]{64}$/;
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function checkCoverage(plan,index,fingerprints,summary){
 assert.equal(index.schema,'playtt/retained-pack-download/v1');assert.equal(index.bucket,BUCKET);
 assert.equal(index.result,'downloaded');assert.equal(index.safeToApply,false);assert.deepEqual(index.failures,[]);
 assert.deepEqual(index.inputs,fingerprints,'Download input fingerprint changed');
 const retained=Object.keys(plan.retained).sort();assert.ok(retained.length>0&&retained.length<=128);
 assert.equal(summary.retainedRevisions,retained.length);assert.equal(index.expectedRevisions,retained.length);
 assert.ok(Array.isArray(index.rows));assert.equal(index.rows.length,retained.length);
 assert.deepEqual(index.rows.map(r=>r.revision).sort(),retained,'Retained coverage is incomplete or duplicated');
 for(const row of index.rows){
  assert.ok(UUID.test(row.revision)&&HASH.test(row.manifestSha256)&&HASH.test(row.packSha256));
  assert.equal(row.manifestFile,'manifests/'+row.revision+'.json');assert.equal(row.packFile,'packs/'+row.packSha256+'.zip');
 }
 assert.equal(new Set(index.rows.map(r=>r.packSha256)).size,index.uniquePacks);
 return index.rows;
}

export async function verifyRetainedManifest(raw,pack,expected,pin){
 assert.ok(raw.byteLength>0&&raw.byteLength<=256*1024);assert.ok(pack.byteLength>0&&pack.byteLength<=8*1024*1024);
 const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
 assert.ok(isDeepStrictEqual(manifest,expected),'Manifest differs from inventoried content');
 assert.ok(UUID.test(manifest.revision));assert.equal(manifest.manifestKey,ROOT+'/markdown/revisions/'+manifest.revision+'.json');
 assert.ok(Number.isFinite(Date.parse(manifest.persistedAt)));
 const metadata=manifest.restorePack;assert.ok(metadata&&HASH.test(metadata.sha256));assert.equal(metadata.objectKey,ROOT+'/restore-packs/'+metadata.sha256+'.zip');
 assert.ok(Number.isSafeInteger(metadata.decodedBytes)&&metadata.decodedBytes>=0&&metadata.decodedBytes<=32*1024*1024);
 const groups=[['files','markdown'],['uploads','uploads'],['wpContent','wp-content']];
 for(const [field,domain]of groups){
  const entries=manifest[field]??[];assert.ok(Array.isArray(entries)&&entries.length<=10000);
  const paths=new Set();
  for(const file of entries){
   assert.equal(typeof file.path,'string');assert.ok(file.path.length>0&&file.path.length<=2048&&!/^[\/]|[\\:\x00-\x1f]/.test(file.path));
   assert.ok(file.path.split('/').every(p=>p!==''&&p!=='.'&&p!=='..'),'Unsafe archive path');
   assert.ok(!paths.has(file.path),'Duplicate manifest path');paths.add(file.path);
   assert.ok(HASH.test(file.sha256)&&Number.isSafeInteger(file.size)&&file.size>=0);
   assert.equal(file.objectKey,ROOT+'/'+domain+'/objects/'+file.sha256);
  }
 }
 if(pin){
  for(const field of ['revision','manifestKey','persistedAt'])assert.equal(manifest[field],pin[field]);
  assert.equal(sha(raw),pin.manifestSha256,'Protected manifest digest changed');
  assert.equal(metadata.sha256,pin.packSha256);assert.equal(metadata.objectKey,pin.packKey);assert.equal(metadata.size,pin.packBytes);
 }
 const decoded=await decodeCanonicalRestorePack(metadata,ROOT,{markdown:manifest.files,uploads:manifest.uploads??[],wpContent:manifest.wpContent??[],wpContentDeleted:manifest.wpContentDeleted??[]},pack);
 let tableFiles=0,historyRows=null,postmetaRows=null,postmeta=[],postmetaLayout='legacy-unmarked';const attachments=[];
 for(const file of decoded.markdown){
  const text=new TextDecoder('utf-8',{fatal:true}).decode(file.bytes);
  if(/^_(tables|runtime)\/[^/]+\.json$/.test(file.path)){
   const data=JSON.parse(text);tableFiles++;
   if(file.path==='_tables/posts.json'&&Array.isArray(data))historyRows=data.filter(x=>x?.post_type==='revision').length;
   if(file.path==='_tables/postmeta.json'&&Array.isArray(data)){postmetaRows=data.length;postmeta=data;}
   if(file.path==='_runtime/playtt-postmeta-layout.json')postmetaLayout=data&&Object.keys(data).length===1&&data.schema==='playtt/postmeta-table/v1'?'full-table-v1':'unrecognized';
  }
  if(file.path.endsWith('.md')){
   const front=text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);assert.ok(front,'Canonical Markdown frontmatter is missing');
   const data=YAML.parse(front[1]);
   if(data?.wordpress?.type==='attachment'){const id=Number(data.wordpress.id);assert.ok(Number.isSafeInteger(id)&&id>0);attachments.push(id);}
  }
 }
 const uploadedPaths=new Set(decoded.uploads.map(f=>f.path));
 const linked=attachments.filter(id=>postmeta.some(row=>Number(row.post_id)===id&&row.meta_key==='_wp_attached_file'&&typeof row.meta_value==='string'&&uploadedPaths.has(row.meta_value))).length;
 return {revision:manifest.revision,persistedAt:manifest.persistedAt,manifestSha256:sha(raw),packSha256:sha(pack),packBytes:pack.byteLength,
  decodedBytes:metadata.decodedBytes,indexedFiles:metadata.fileCount,markdownFiles:decoded.markdown.length,
  markdownRecords:decoded.markdown.filter(f=>f.path.endsWith('.md')).length,uploads:decoded.uploads.length,wpContent:decoded.wpContent.length,
  jsonTablesParsed:tableFiles,historyRows,postmetaRows,postmetaLayout,attachmentRecords:attachments.length,linkedAttachmentFiles:linked,
  missingAttachmentFileLinks:attachments.length-linked,perRevisionPhpRestoreTested:false,pinned:!!pin,result:'pass'};
}

async function main(){
 const names=['inventory','plan','plan-summary','registry','download-index','output'];const args={};
 for(const name of names){const i=process.argv.indexOf('--'+name);assert.ok(i>=0&&process.argv[i+1],'Required explicit input: '+name);args[name]=resolve(process.argv[i+1]);}
 const input={},fingerprints={};
 for(const name of ['inventory','plan','plan-summary','registry']){const bytes=await readFile(args[name]);input[name]=JSON.parse(bytes);fingerprints[name.replace('-','_')]=sha(bytes);}
 const summary=input['plan-summary'];assert.equal(summary.bucket,BUCKET);assert.equal(summary.safeToApply,false);
 assert.equal(fingerprints.inventory,summary.privateInventorySha256);assert.equal(fingerprints.plan,summary.privatePlanSha256);assert.equal(fingerprints.registry,summary.privateRegistrySha256);
 const indexBytes=await readFile(args['download-index']),index=JSON.parse(indexBytes),rows=checkCoverage(input.plan,index,fingerprints,summary);
 const cache=await realpath(dirname(args['download-index']));
 const safeRead=async name=>{const path=await realpath(resolve(cache,name));const rel=relative(cache,path);assert.ok(rel&&!isAbsolute(rel)&&!rel.startsWith('..'));return readFile(path);};
 const pins=new Map(input.registry.pins.map(p=>[p.revision,p]));assert.equal(pins.size,input.registry.generation);
 assert.ok([...pins.keys()].every(r=>Object.hasOwn(input.plan.retained,r)));
 const receipts=[],failures=[],privateDiagnostics=[];
 for(const row of rows){
  try{
   const [raw,pack]=await Promise.all([safeRead(row.manifestFile),safeRead(row.packFile)]);
   assert.equal(raw.length,row.manifestBytes);assert.equal(sha(raw),row.manifestSha256);assert.equal(pack.length,row.packBytes);assert.equal(sha(pack),row.packSha256);
   const receipt=await verifyRetainedManifest(raw,pack,input.inventory.records[ROOT+'/markdown/revisions/'+row.revision+'.json'],pins.get(row.revision));
   receipts.push({...receipt,retentionReasons:input.plan.retained[row.revision]});
  }catch(error){failures.push({revision:row.revision,errorName:error.name});privateDiagnostics.push({revision:row.revision,errorName:error.name,message:error.message});}
  if((receipts.length+failures.length)%12===0)console.log(JSON.stringify({decoded:receipts.length,failed:failures.length,total:rows.length}));
 }
 const unique=new Map(receipts.map(r=>[r.packSha256,r.packBytes]));
 const report={at:new Date().toISOString(),schema:'playtt/retained-pack-verification/v1',result:failures.length?'fail':'pass',bucket:BUCKET,safeToApply:false,
  scope:'Every retained remote manifest and ZIP downloaded, whole ZIP SHA and each decoded entry verified against the frozen inventory; no PHP boot, object deletion or atomic snapshot claim',
  inputFingerprints:fingerprints,downloadIndexSha256:sha(indexBytes),retainedRevisions:rows.length,verifiedRevisions:receipts.length,uniquePacks:unique.size,
  compressedBytes:[...unique.values()].reduce((a,b)=>a+b,0),decodedBytesAcrossRevisions:receipts.reduce((n,r)=>n+r.decodedBytes,0),
  indexedFilesAcrossRevisions:receipts.reduce((n,r)=>n+r.indexedFiles,0),verifiedProtectedRevisions:receipts.filter(r=>r.pinned).length,
  revisionsWithMediaRelationshipGaps:receipts.filter(r=>r.missingAttachmentFileLinks>0).length,perRevisionPhpRestoreTested:false,failures,receipts};
 await writeFile(args.output,JSON.stringify(report,null,2)+'\n');
 if(privateDiagnostics.length)await writeFile(resolve(cache,'verification-failures-'+new Date().toISOString().replace(/[:.]/g,'-')+'-private.json'),JSON.stringify(privateDiagnostics,null,2)+'\n');
 console.log(JSON.stringify({result:report.result,verifiedRevisions:receipts.length,uniquePacks:unique.size,failed:failures.length}));
 if(failures.length)process.exitCode=1;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main();
