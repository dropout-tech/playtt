// Read-only recovery of the disposed LOCAL trial. Never starts WordPress or opens a write window.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {openSnapshotBundle,exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {decodeCanonicalManifestBytes} from '../src/playtt-manifest-envelope.ts';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load('artifacts/playtt-canvas-native-local-owned-private.json');
assert.equal(owner.phase,'failed');assert.equal(owner.sealed,true);assert.equal(owner.localProcessesDisposed,true);
const out=join(owner.directory,'post-failure');await mkdir(out);
const cloud=await load('artifacts/playtt-native-approved-backup-owned-private.json');
const before=(await openSnapshotBundle(join(cloud.directory,'independent'),cloud.anchor)).graph;
let external=0,mf;
try{
 mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-canvas-native-local-local',modules:true,script:'export default {fetch(){return new Response("No HTTP routes",{status:404})}}',host:'127.0.0.1',port:0,compatibilityDate:'2026-07-18',cf:false,log:new Log(LogLevel.ERROR),resourcePersistencePath:join(owner.stateDirectory,'r'),isolatedResourcePersistencePath:join(owner.stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},outboundService:()=>{external++;throw Error('No external network');}}));
 await mf.ready;const bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');
 const pointer=await(await bucket.get('sites/default/markdown/current.json')).json();
 const raw=new Uint8Array(await(await bucket.get(pointer.manifestKey)).arrayBuffer()),manifest=await decodeCanonicalManifestBytes(raw,'sites/default');
 const base=isMetadataOverlay(manifest.restorePack)?await decodeCanonicalManifestBytes(new Uint8Array(await(await bucket.get(manifest.restorePack.base.manifestKey)).arrayBuffer()),'sites/default'):manifest;
 const anchor={...pointer,manifestSha256:sha(raw),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size};
 await exportSnapshotBundle(bucket,anchor,join(out,'export'));
 const after=(await importSnapshotBundle(join(out,'export'),anchor,join(out,'independent'))).graph;
 const changes=[];let unchanged=0;
 for(const group of ['markdown','uploads','wpContent']){
  const a=new Map(before.contents[group].map(x=>[x.path,x.bytes])),b=new Map(after.contents[group].map(x=>[x.path,x.bytes]));
  for(const path of new Set([...a.keys(),...b.keys()])){
   if(a.has(path)&&b.has(path)&&Buffer.from(a.get(path)).equals(Buffer.from(b.get(path)))){unchanged++;continue;}
   const item={group,path,beforeSha:a.has(path)?sha(a.get(path)):null,afterSha:b.has(path)?sha(b.get(path)):null};changes.push(item);
   if(group==='markdown')await writeFile(join(out,'change-'+changes.length+'-private.json'),JSON.stringify({path,before:a.has(path)?Buffer.from(a.get(path)).toString():null,after:b.has(path)?Buffer.from(b.get(path)).toString():null},null,2));
  }
 }
 const note=await load('artifacts/playtt-canvas-native-local-browser-notes.json');
 const telemetry=await load(join(owner.directory,'before-restart/exception-allocation-observation.json'));
 const requests=telemetry.events.filter(x=>x.kind==='request'),autosaves=requests.filter(x=>x.restRoute==='/wp-json/wp/v2/pages/193/autosaves'&&x.method==='POST');
 assert.equal(external,0);assert.deepEqual(after.contents.wpContentDeleted,before.contents.wpContentDeleted);
 const main=after.contents.markdown.find(x=>x.path===owner.draftPath),old=before.contents.markdown.find(x=>x.path===owner.draftPath);
 const report={schema:'playtt/canvas-local-failure-audit/v1',at:new Date().toISOString(),scope:'Local canonical201 clone; read-only R2 export after sealing/disposal; no remote operations',result:'incomplete-native-acceptance',anchor,independentObjects:after.objects.length,files:after.contents.markdown.length+after.contents.uploads.length+after.contents.wpContent.length,unchanged,changes,mainDraftBytesExact:Buffer.from(main.bytes).equals(Buffer.from(old.bytes)),mainDraftContainsAttemptText:Buffer.from(main.bytes).toString().includes(owner.editedText),nativeSaveReceipts:telemetry.events.filter(x=>x.kind==='native-save').length,autosaves:autosaves.map(x=>({status:x.status,version:x.version})),maxObservedVersion:Math.max(...requests.map(x=>x.version||0)),exceptions:telemetry.events.filter(x=>x.kind==='exception').length,observationErrors:telemetry.errors.length,observerStopped:telemetry.stopped,visualCanvasRendered:note.visualCanvasRendered,typedTextVisible:note.typedTextVisible,saveButtonDisabled:note.saveButtonDisabled,restartCompleted:false,logoutCompleted:false,outboundAttempts:external};
 await writeFile(join(out,'audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(report,null,2));
}finally{if(mf)await mf.dispose();}
