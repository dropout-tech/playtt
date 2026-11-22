// Experimental pinned MEMFS adapter. Not imported by the runtime or deployed.
// Read operations delegate to the original MEMFS ops with decoded contents;
// writes and direct contents access restore the ordinary writable node first.
import {deflateRawSync,inflateRawSync} from 'node:zlib';
const records=new WeakMap(),installed=new WeakMap();
export function compressedCoreNodeMemory(node){const r=records.get(node);return r?{logicalBytes:r.length,compressedBytes:r.encoded.byteLength}:undefined;}
export function compressedCoreCacheMemory(php){return installed.get(php)?.cacheMemory()??{bytes:0,limit:0};}
export function compressCoreFiles(php,{cacheBytes=512*1024,minBytes=512,minSaving=128}={}){
 if(installed.has(php))throw Error('Compressed core adapter already installed');
 for(const n of [cacheBytes,minBytes,minSaving])if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid compression bound');
 const key=Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use'),module=key?php[key]:undefined,fs=module?.FS,memfs=fs?.filesystems?.MEMFS,root=fs?.root?.contents?.wordpress;
 if(!root||!memfs?.ops_table?.file||!module.HEAPU8)throw Error('Pinned PHP MEMFS unavailable');
 const originalNode=memfs.ops_table.file.node,originalStream=memfs.ops_table.file.stream;
 for(const key of ['read','write','mmap','msync','llseek'])if(typeof originalStream[key]!=='function')throw Error('Missing pinned file operation');
 const open=new Set((fs.streams||[]).filter(Boolean).map(s=>s.node));let cache;
 const stats={inspectedFiles:0,compressedFiles:0,originalBytes:0,compressedBytes:0,retainedCapacitySavings:0,skippedOpenFiles:0,decodedCacheLimit:cacheBytes};
 // info:true uses the synchronous stream engine, avoiding pinned workerd's
 // one-shot output-buffer growth bug while retaining the exact output limit.
 function decoded(r){if(cache?.record===r)return cache.bytes;const output=inflateRawSync(r.encoded,{maxOutputLength:r.length,info:true,chunkSize:r.length+1}).buffer;if(output.length!==r.length)throw Error('Compressed core length mismatch');const bytes=new Uint8Array(output.buffer,output.byteOffset,output.byteLength);if(bytes.buffer.byteLength<=cacheBytes)cache={record:r,bytes};else cache=undefined;return bytes;}
 function restore(node,bytes){const r=records.get(node);if(!r)return node.contents;records.delete(node);if(cache?.record===r)cache=undefined;Object.defineProperty(node,'contents',{...r.descriptor,value:bytes});node.node_ops=originalNode;node.stream_ops=originalStream;return bytes;}
 function materialize(node){const r=records.get(node);return r?restore(node,decoded(r)):node.contents;}
 function shadow(stream,bytes){const node=Object.create(stream.node,{contents:{value:bytes}});return Object.create(stream,{node:{value:node}});}
 const streamOps={...originalStream,
  read(stream,buffer,offset,length,position){const r=records.get(stream.node);if(!r)return originalStream.read.call(this,stream,buffer,offset,length,position);const bytes=position>=r.length||length===0?null:decoded(r);return originalStream.read.call(this,shadow(stream,bytes),buffer,offset,length,position);},
  write(stream,buffer,offset,length,position,canOwn){if(length)materialize(stream.node);return originalStream.write.call(this,stream,buffer,offset,length,position,canOwn);},
  mmap(stream,length,position,prot,flags){const r=records.get(stream.node);return originalStream.mmap.call(this,r?shadow(stream,decoded(r)):stream,length,position,prot,flags);},
  msync(stream,buffer,offset,length,flags){materialize(stream.node);return originalStream.msync.call(this,stream,buffer,offset,length,flags);}
 };
 const nodeOps={...originalNode,setattr(node,attr){const r=records.get(node);if(r&&attr.size!==undefined&&attr.size!==node.usedBytes){if(attr.size===0)restore(node,null);else materialize(node);}return originalNode.setattr.call(this,node,attr);}};
 const seen=new Set();
 function visit(node,path){
  if(!node||seen.has(node)||path==='/wordpress/wp-content')return;seen.add(node);
  if(fs.isDir(node.mode)){if(node.mount?.type!==memfs||node.mounted)return;for(const [name,child]of Object.entries(node.contents))visit(child,path+'/'+name);return;}
  if(!fs.isFile(node.mode)||node.node_ops!==originalNode||node.stream_ops!==originalStream)return;
  stats.inspectedFiles++;if(open.has(node)){stats.skippedOpenFiles++;return;}
  const descriptor=Object.getOwnPropertyDescriptor(node,'contents'),bytes=descriptor?.value,length=node.usedBytes;
  if(!descriptor?.configurable||!descriptor.writable||!(bytes instanceof Uint8Array)||bytes.buffer===module.HEAPU8.buffer||!Number.isSafeInteger(length)||length<minBytes||length>8*1024*1024||length!==bytes.byteLength)return;
  const encoded=Uint8Array.from(deflateRawSync(bytes,{level:6}));if(encoded.byteLength+minSaving>=length)return;
  const record={encoded,length,descriptor:{configurable:descriptor.configurable,enumerable:descriptor.enumerable,writable:descriptor.writable}};
  records.set(node,record);node.node_ops=nodeOps;node.stream_ops=streamOps;
  Object.defineProperty(node,'contents',{configurable:true,enumerable:descriptor.enumerable,get(){return materialize(this);},set(value){restore(this,value);}});
  stats.compressedFiles++;stats.originalBytes+=length;stats.compressedBytes+=encoded.byteLength;
 }
 visit(root,'/wordpress');stats.retainedCapacitySavings=stats.originalBytes-stats.compressedBytes;
 const controller={stats,cacheMemory:()=>({bytes:cache?.bytes.buffer.byteLength||0,limit:cacheBytes}),clearCache:()=>{cache=undefined;}};installed.set(php,controller);return controller;
}
