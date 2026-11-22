// Experimental owned decoded-core cache. No runtime integration or deployment.
// Count unique backing buffers, including unused capacity of retained views.
export function createDecodedCoreCache({mode,limitBytes,maxEntries=2048}){
 if(!['single','lru'].includes(mode)||!Number.isSafeInteger(limitBytes)||limitBytes<0||!Number.isSafeInteger(maxEntries)||maxEntries<1||maxEntries>2048)throw Error('Invalid cache policy');
 const entries=new Map(),buffers=new Map();let bytes=0;
 function remove(key){const entry=entries.get(key);if(!entry)return false;entries.delete(key);const buffer=entry.buffer,count=buffers.get(buffer);if(count===1){buffers.delete(buffer);bytes-=buffer.byteLength;}else buffers.set(buffer,count-1);return true;}
 function clear(){entries.clear();buffers.clear();bytes=0;}
 return{
  get(key){const value=entries.get(key);if(value&&mode==='lru'){entries.delete(key);entries.set(key,value);}return value;},
  set(key,value){
   if(!key||typeof key!=='object'||!(value instanceof Uint8Array))throw Error('Expected owned record and byte view');
   if(mode==='single')clear();else remove(key);
   const buffer=value.buffer;if(limitBytes===0||buffer.byteLength>limitBytes)return false;
   while(entries.size>=maxEntries||bytes+(buffers.has(buffer)?0:buffer.byteLength)>limitBytes)remove(entries.keys().next().value);
   entries.set(key,value);const refs=buffers.get(buffer)||0;buffers.set(buffer,refs+1);if(!refs)bytes+=buffer.byteLength;return true;
  },delete:remove,clear,
  get bytes(){return bytes;},get size(){return entries.size;},
  memory(){return{bytes,entries:entries.size,buffers:buffers.size,limit:limitBytes,maxEntries};}
 };
}
