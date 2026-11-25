// Local emulator data only. Output row identities/field names, never field contents.
import assert from 'node:assert/strict';
export async function inspectBackgroundHistory(bucket,baseline){
 const records=[];let cursor;
 do{const page=await bucket.list({prefix:'__local-test/requests/',cursor});for(const item of page.objects)records.push(await(await bucket.get(item.key)).json());cursor=page.truncated?page.cursor:undefined;}while(cursor);
 records.sort((a,b)=>a.at.localeCompare(b.at));
 const versions=[...new Map(records.filter(r=>r.version>161).map(r=>[r.version,r])).values()].sort((a,b)=>a.version-b.version);
 let previous=baseline.manifest;
 const tableKeys={'_tables/usermeta.json':'umeta_id','_tables/postmeta.json':'meta_id','_tables/options.json':'option_id','_tables/posts.json':'ID'};
 const read=async f=>JSON.parse(new TextDecoder().decode(await(await bucket.get(f.objectKey)).arrayBuffer()));
 const transitions=[];
 for(const version of versions){
  const key='sites/default/markdown/revisions/'+version.revision+'.json',raw=await bucket.get(key);assert.ok(raw);
  const bytes=new Uint8Array(await raw.arrayBuffer()),current=JSON.parse(new TextDecoder().decode(bytes));
  const a=new Map(previous.files.map(f=>[f.path,f])),b=new Map(current.files.map(f=>[f.path,f]));
  const changed=[...b].filter(([p,f])=>a.get(p)?.sha256!==f.sha256).map(([p,f])=>({path:p,bytes:f.size}));
  const removed=[...a.keys()].filter(p=>!b.has(p)),tables={};
  for(const f of changed){
   const key=tableKeys[f.path];if(!key||!a.has(f.path))continue;
   const x=await read(a.get(f.path)),y=await read(b.get(f.path));
   const old=new Map(x.map(r=>[r[key],r])),next=new Map(y.map(r=>[r[key],r]));
   tables[f.path]={added:y.filter(r=>!old.has(r[key])).map(r=>({id:r[key],metaKey:r.meta_key,optionName:r.option_name,postType:r.post_type})),removed:x.filter(r=>!next.has(r[key])).map(r=>({id:r[key],metaKey:r.meta_key,optionName:r.option_name})),changed:y.flatMap(r=>{const o=old.get(r[key]);if(!o)return [];const fields=Object.keys(r).filter(k=>JSON.stringify(r[k])!==JSON.stringify(o[k]));return fields.length?[{id:r[key],metaKey:r.meta_key,optionName:r.option_name,fields}]:[]})};
  }
  let sequences;
  if(changed.some(f=>f.path==='_runtime/playtt-auto-increment.json')){
   const x=(await read(a.get('_runtime/playtt-auto-increment.json'))).sequences,y=(await read(b.get('_runtime/playtt-auto-increment.json'))).sequences;
   sequences=Object.fromEntries(Object.keys(y).filter(k=>x[k]!==y[k]).map(k=>[k,{before:x[k],after:y[k]}]));
  }
  for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(current[key],previous[key]);
  transitions.push({version:version.version,requests:records.filter(r=>r.version===version.version),changed,removed,tables,sequences,manifestBytes:bytes.length,changedLogicalBytes:changed.reduce((n,f)=>n+f.bytes,0)});
  previous=current;
 }
 return {schema:'playtt/local-background-write-history/v1',at:new Date().toISOString(),baselineVersion:161,requests:records,transitions,mediaAndThemeExact:true,scope:'Local Miniflare replay only; request attribution lists every response sharing a canonical version.'};
}
