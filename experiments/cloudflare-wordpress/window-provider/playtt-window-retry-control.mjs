// One native-editor admission failure and explicit retry; no content API calls.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {parse as yaml} from 'yaml';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
const mode=process.argv[2];
assert.ok(['prepare','arm','fail','verify-failed','resume','status','close'].includes(mode));
const prefix='artifacts/playtt-window-retry-',origin='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const sha=v=>createHash('sha256').update(v).digest('hex');
if(mode==='prepare'){
 const location=await load('artifacts/playtt-window-ui-backup-owned-private.json');
 assert.equal(location.phase,'verified');assert.equal(location.anchor.revision,'f56f11b1-4553-434d-940c-02255fd5c816');
 const bundle=await openSnapshotBundle(location.directory+'/independent',location.anchor);
 const previous=await load('artifacts/playtt-window-ui-owned-private.json');assert.equal(previous.phase,'closed-sealed');
 const path='page/'+previous.expectedBefore.slug+'.md',bytes=bundle.graph.contents.markdown.find(f=>f.path===path)?.bytes;assert.ok(bytes);
 const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes),end=raw.indexOf('\n---\n',4),meta=yaml(raw.slice(4,end));
 const match=/^v1:(\d+):([a-f0-9]{64})$/.exec(meta.__playtt_content);assert.ok(match);assert.equal(bytes.at(-1),10);
 const contentBytes=bytes.subarray(bytes.length-1-Number(match[1]),bytes.length-1);assert.equal(sha(contentBytes),match[2]);assert.equal(meta.wordpress.status,'draft');
 const content=new TextDecoder('utf-8',{fatal:true}).decode(contentBytes);assert.ok(content.includes(previous.testText));
 const marker='playtt-retry-'+randomUUID();
 await writeFile(prefix+'prepared-private.json',JSON.stringify({origin,id:193,baseline:location.anchor,expectedBefore:{...previous.expectedBefore,content},marker,testText:'保存失敗後重新嘗試：內容保留、成功保存並重新載入。 '+marker},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({result:'prepared',ownedId:193,baselineRevision:location.anchor.revision,baselineFiles:bundle.graph.contents.markdown.length}));process.exit(0);
}
assert.ok(process.argv.includes('--remote'));
const secrets=await load('../../../playtt-cms-secrets.json');
async function json(path,body){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path+': HTTP '+r.status);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body),capacity=body=>json('/__playtt-capacity',body);
async function snapshot(){const state=await op('fence-status'),budget=await capacity(),pins=await json('/__playtt-backup-pins'),publisher=await json('/__playtt-publishing');assert.equal(state.coherent,true);assert.equal(publisher.state,'paused');return {state:state.state,fenceActive:state.fence.active,budget,pins:pins.generation,publisher:publisher.state};}
async function faultUnchanged(owner){assert.equal(owner.phase,'fault-held');assert.equal(owner.fenceReleased,false);const now=await snapshot();assert.equal(now.fenceActive,true);assert.deepEqual(now.state,owner.faultBefore.state);assert.deepEqual(now.budget,owner.faultBefore.budget);assert.equal(now.pins,6);return now;}
if(mode==='arm'){
 try{await access(prefix+'owned-private.json');throw Error('Existing retry attempt: inspect rather than replay');}catch(e){if(e.code!=='ENOENT')throw e;}
 const prepared=await load(prefix+'prepared-private.json'),previous=await load('artifacts/playtt-window-ui-owned-private.json'),backup=await load('artifacts/playtt-window-ui-backup-result.json');
 assert.equal(backup.result,'pass');assert.equal(backup.canonicalVersion,26);assert.equal(backup.finalPins,6);assert.equal(previous.phase,'closed-sealed');
 const before=await snapshot();assert.equal(before.state.version,26);assert.equal(before.state.pointer.revision,prepared.baseline.revision);assert.equal(before.fenceActive,false);assert.equal(before.budget.writeTracking.pending,0);assert.equal(before.budget.writeTracking.sealed,true);assert.equal(before.budget.writeTracking.window.closed,true);assert.equal(before.pins,6);assert.ok(before.budget.remainingBytes>16*1024*1024);
 const owner={...prepared,phase:'preparing',windowToken:randomUUID(),previousWindowToken:previous.windowToken,drainToken:previous.drainToken,fenceReleased:true,sealReleased:false};
 await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
 const fence=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);
 const armed=await capacity({action:'arm-write-window',fenceToken:fence.token,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,durationSeconds:300,maxBytes:16*1024*1024,maxOperations:128});owner.expiresAt=armed.writeTracking.window.expiresAt;owner.phase='armed';await save(prefix+'owned-private.json',owner);
 await capacity({action:'release-write-drain',fenceToken:fence.token,drainToken:owner.drainToken});owner.sealReleased=true;await save(prefix+'owned-private.json',owner);await op('fence-release',{token:fence.token});owner.fenceReleased=true;await save(prefix+'owned-private.json',owner);
 const report={at:new Date().toISOString(),result:'armed',ownedDraft:193,seconds:300,maxBytes:16*1024*1024,maxOperations:128,expiresAt:owner.expiresAt,before};await save(prefix+'arm.json',report);console.log(JSON.stringify({result:'armed',expiresAt:owner.expiresAt,ownedDraft:193}));
}else if(mode==='fail'){
 const owner=await load(prefix+'owned-private.json');assert.equal(owner.phase,'armed');assert.equal(owner.fenceReleased,true);assert.ok(owner.expiresAt-Date.now()>90000);
 const fence=await op('fence-acquire',{ttlSeconds:120});owner.fenceToken=fence.token;owner.fenceReleased=false;owner.phase='fault-held';await save(prefix+'owned-private.json',owner);
 const before=await snapshot();assert.equal(before.fenceActive,true);assert.equal(before.budget.writeTracking.pending,0);assert.equal(before.budget.writeTracking.window.expired,false);owner.faultBefore=before;owner.faultAt=new Date().toISOString();await save(prefix+'owned-private.json',owner);
 console.log(JSON.stringify({result:'fault-held',canonicalVersion:before.state.version,fenceSeconds:120}));
}else if(mode==='verify-failed'||mode==='resume'){
 const owner=await load(prefix+'owned-private.json'),now=await faultUnchanged(owner);
 const report={at:new Date().toISOString(),result:'pass',canonicalUnchanged:true,capacityUnchanged:true,pending:now.budget.writeTracking.pending,canonicalVersion:now.state.version};
 if(mode==='resume'){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;owner.phase='retry-enabled';await save(prefix+'owned-private.json',owner);report.fenceReleased=true;}
 await save(prefix+mode+'.json',report);console.log(JSON.stringify(report));
}else if(mode==='close'){
 const owner=await load(prefix+'owned-private.json');await capacity({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;await save(prefix+'owned-private.json',owner);
 const b=await capacity();assert.equal(b.writeTracking.pending,0,'Unknown writes retained; do not force clear');const s=await op('fence-status');let fence;if(s.fence.active){assert.equal(owner.fenceReleased,false);fence={token:owner.fenceToken};}else fence=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);
 const sealed=await capacity({action:'acquire-write-drain',fenceToken:fence.token,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);assert.equal(sealed.writeTracking.pending,0);owner.sealReleased=false;owner.phase='closed-sealed';await save(prefix+'owned-private.json',owner);await op('fence-release',{token:fence.token});owner.fenceReleased=true;await save(prefix+'owned-private.json',owner);
 const report={at:new Date().toISOString(),result:'sealed',...await snapshot()};await save(prefix+'closed.json',report);console.log(JSON.stringify(report));
}else{const report={at:new Date().toISOString(),...await snapshot()};await save(prefix+'status.json',report);console.log(JSON.stringify(report));}
