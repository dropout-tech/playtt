// Local prototype: install trusted deflated core entries before WordPress boot.
import {deflateRawSync,inflateRawSync} from 'node:zlib';
import {createDecodedCoreCache} from './playtt-core-lru-cache.mjs';
import {readTrustedCoreZip,decodeCoreZipEntry} from './playtt-lazy-core-zip.mjs';
const records=new WeakMap(),installed=new WeakMap();
export function compressedCoreNodeMemory(node){const r=records.get(node);return r?{logicalBytes:r.length,compressedBytes:r.encoded.byteLength}:undefined;}
export function compressedCoreCacheMemory(php){return installed.get(php)?.public.cacheMemory()??{bytes:0,limit:0};}
function createAdapter(php,{cacheBytes=12*1024*1024,minBytes=512,minSaving=128}={}){
 if(installed.has(php))throw Error('Compressed core adapter already installed');
 for(const n of [cacheBytes,minBytes,minSaving])if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid compression bound');
 const key=Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use'),module=key?php[key]:undefined,fs=module?.FS,memfs=fs?.filesystems?.MEMFS,root=fs?.root?.contents?.wordpress;
 if(!root||!memfs?.ops_table?.file||!module.HEAPU8)throw Error('Pinned PHP MEMFS unavailable');
 const originalNode=memfs.ops_table.file.node,originalStream=memfs.ops_table.file.stream;
 for(const name of ['read','write','mmap','msync','llseek'])if(typeof originalStream[name]!=='function')throw Error('Missing pinned file operation');
 const cache=createDecodedCoreCache({mode:'lru',limitBytes:cacheBytes}),stats={inspectedFiles:0,compressedFiles:0,originalBytes:0,compressedBytes:0,retainedCapacitySavings:0,skippedOpenFiles:0,decodedCacheLimit:cacheBytes};
 const activity={archiveCompressedInstalls:0,archiveOrdinaryInstalls:0,archiveCompressedBytes:0,archiveLogicalBytes:0,firstDecodeChecks:0,materializations:0,postBootCompressions:0};
 function decoded(r){
  const hit=cache.get(r);if(hit)return hit;let bytes;
  if(r.archive&&!r.checked){bytes=decodeCoreZipEntry({encoded:r.encoded,size:r.length,crc32:r.archive.crc32,sha256:r.archive.sha256});r.checked=true;activity.firstDecodeChecks++;}
  else{const output=inflateRawSync(r.encoded,{maxOutputLength:r.length,info:true,chunkSize:r.length+1}).buffer;if(output.length!==r.length)throw Error('Compressed core length mismatch');bytes=new Uint8Array(output.buffer,output.byteOffset,output.byteLength);}
  cache.set(r,bytes);return bytes;
 }
 function restore(node,bytes){const r=records.get(node);if(!r)return node.contents;records.delete(node);cache.delete(r);Object.defineProperty(node,'contents',{...r.descriptor,value:bytes});node.node_ops=originalNode;node.stream_ops=originalStream;activity.materializations++;return bytes;}
 function materialize(node){const r=records.get(node);return r?restore(node,decoded(r)):node.contents;}
 function shadow(stream,bytes){const node=Object.create(stream.node,{contents:{value:bytes}});return Object.create(stream,{node:{value:node}});}
 const streamOps={...originalStream,
  read(stream,buffer,offset,length,position){const r=records.get(stream.node);if(!r)return originalStream.read.call(this,stream,buffer,offset,length,position);const contents=position>=r.length||length===0?null:decoded(r),usedBytes=stream.node.usedBytes;if(position>=usedBytes)return 0;const size=Math.min(usedBytes-position,length);if(size>8&&contents.subarray)buffer.set(contents.subarray(position,position+size),offset);else for(let i=0;i<size;i++)buffer[offset+i]=contents[position+i];return size;},
  write(stream,buffer,offset,length,position,canOwn){if(length)materialize(stream.node);return originalStream.write.call(this,stream,buffer,offset,length,position,canOwn);},
  mmap(stream,length,position,prot,flags){const r=records.get(stream.node);return originalStream.mmap.call(this,r?shadow(stream,decoded(r)):stream,length,position,prot,flags);},
  msync(stream,buffer,offset,length,flags){materialize(stream.node);return originalStream.msync.call(this,stream,buffer,offset,length,flags);}
 };
 const nodeOps={...originalNode,setattr(node,attr){const r=records.get(node);if(r&&attr.size!==undefined&&attr.size!==node.usedBytes){if(attr.size===0)restore(node,null);else materialize(node);}return originalNode.setattr.call(this,node,attr);}};
 function attach(node,encoded,length,descriptor,archive){
  if(records.has(node))throw Error('Node already compressed');
  // Own an exact copy. A small encoded view must never retain the full ZIP.
  const record={encoded:Uint8Array.from(encoded),length,descriptor:{configurable:descriptor.configurable,enumerable:descriptor.enumerable,writable:descriptor.writable},archive,checked:!archive};
  records.set(node,record);node.node_ops=nodeOps;node.stream_ops=streamOps;
  Object.defineProperty(node,'contents',{configurable:true,enumerable:descriptor.enumerable,get(){return materialize(this);},set(value){restore(this,value);}});
  return record;
 }
 function scan(){
  Object.assign(stats,{inspectedFiles:0,compressedFiles:0,originalBytes:0,compressedBytes:0,retainedCapacitySavings:0,skippedOpenFiles:0});
  const open=new Set((fs.streams||[]).filter(Boolean).map(s=>s.node)),seen=new Set();
  const count=r=>{stats.compressedFiles++;stats.originalBytes+=r.length;stats.compressedBytes+=r.encoded.byteLength;};
  function visit(node,path){
   if(!node||seen.has(node)||path==='/wordpress/wp-content')return;seen.add(node);
   if(fs.isDir(node.mode)){if(node.mount?.type!==memfs||node.mounted)return;for(const[name,child]of Object.entries(node.contents))visit(child,path+'/'+name);return;}
   const existing=records.get(node);if(existing){stats.inspectedFiles++;count(existing);return;}
   if(!fs.isFile(node.mode)||node.node_ops!==originalNode||node.stream_ops!==originalStream)return;
   stats.inspectedFiles++;if(open.has(node)){stats.skippedOpenFiles++;return;}
   const descriptor=Object.getOwnPropertyDescriptor(node,'contents'),bytes=descriptor?.value,length=node.usedBytes;
   if(!descriptor?.configurable||!descriptor.writable||!(bytes instanceof Uint8Array)||bytes.buffer===module.HEAPU8.buffer||!Number.isSafeInteger(length)||length<minBytes||length>8*1024*1024||length!==bytes.byteLength)return;
   const encoded=deflateRawSync(bytes,{level:6});if(encoded.byteLength+minSaving>=length)return;
   count(attach(node,encoded,length,descriptor));activity.postBootCompressions++;
  }
  visit(root,'/wordpress');stats.retainedCapacitySavings=stats.originalBytes-stats.compressedBytes;return publicController;
 }
 function install(entries){
  for(const entry of entries){
   const path='/'+entry.path;php.mkdir(path.slice(0,path.lastIndexOf('/')));
   const useCompressed=!path.startsWith('/wordpress/wp-content/')&&entry.size>=minBytes&&entry.encoded.byteLength+minSaving<entry.size;
   if(!useCompressed){php.writeFile(path,decodeCoreZipEntry(entry));activity.archiveOrdinaryInstalls++;continue;}
   if(php.fileExists(path))throw Error('Refuse archive core collision');
   php.writeFile(path,new Uint8Array(0));const node=fs.lookupPath(path).node,descriptor=Object.getOwnPropertyDescriptor(node,'contents');
   if(node.node_ops!==originalNode||node.stream_ops!==originalStream||!descriptor?.configurable||!descriptor.writable)throw Error('Archive destination is not owned MEMFS');
   node.usedBytes=entry.size;attach(node,entry.encoded,entry.size,descriptor,{crc32:entry.crc32,sha256:entry.sha256});activity.archiveCompressedInstalls++;activity.archiveCompressedBytes+=entry.encoded.byteLength;activity.archiveLogicalBytes+=entry.size;
  }
 }
 const publicController={stats,cacheMemory:()=>({bytes:cache.bytes,limit:cacheBytes}),clearCache:()=>cache.clear(),activity:()=>({...activity})},controller={public:publicController,scan,install};installed.set(php,controller);return controller;
}
export function compressCoreFiles(php,options){const controller=createAdapter(php,options);return controller.scan();}
export function materializeCompressedCoreArchive(php,bytes,manifest,options){
 const archive=readTrustedCoreZip(bytes,manifest);php.mkdir('/wordpress');const controller=createAdapter(php,options);controller.install(archive.entries);
 return{materializedFiles:archive.materializedFiles,materializedBytes:archive.materializedBytes,...controller.public.activity()};
}
export function finalizeCompressedCoreFiles(php){const controller=installed.get(php);if(!controller)throw Error('No preinstalled compressed archive');return controller.scan();}
