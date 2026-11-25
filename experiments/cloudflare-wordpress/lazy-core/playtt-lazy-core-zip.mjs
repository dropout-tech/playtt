// Narrow, bounded ZIP reader for the pinned, content-addressed runtime corpus.
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
const fail=message=>{throw Error('Core archive: '+message);};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const safePath=p=>typeof p==='string'&&p.length<=1024&&p.startsWith('wordpress/')&&!p.includes('\\')&&!p.includes('\0')&&!p.split('/').some(x=>!x||x==='.'||x==='..')&&/^[\x20-\x7e]+$/.test(p);
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let bit=0;bit<8;bit++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
export function crc32(bytes){let crc=0xffffffff;for(let i=0;i<bytes.length;i++)crc=(crc>>>8)^crcTable[(crc^bytes[i])&255];return(crc^0xffffffff)>>>0;}
export function decodeCoreZipEntry(entry){
 let output;try{output=inflateRawSync(entry.encoded,{info:true,maxOutputLength:Math.max(1,entry.size),chunkSize:Math.max(64,entry.size+1)}).buffer;}catch(error){throw new Error('Core archive: deflate decoding failed',{cause:error});}
 if(output.byteLength!==entry.size||crc32(output)!==entry.crc32||sha(output)!==entry.sha256)fail('decoded entry integrity mismatch');
 return new Uint8Array(output.buffer,output.byteOffset,output.byteLength);
}
export function readTrustedCoreZip(bytes,manifest){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<22||bytes.byteLength>8*1024*1024)fail('archive size outside budget');
 if(manifest?.schema!=='wp-codebox/wordpress-runtime-artifact/v1'||!Number.isSafeInteger(manifest.archive?.size)||manifest.archive.size!==bytes.byteLength||!/^[a-f0-9]{64}$/.test(manifest.archive.sha256??'')||manifest.key!=='runtime/wordpress/'+manifest.archive.sha256+'.zip')fail('manifest archive identity');
 if(!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.length>2200)fail('manifest file count');
 const expected=new Map();let total=0;
 for(const f of manifest.files){if(!safePath(f.path)||expected.has(f.path)||!Number.isSafeInteger(f.size)||f.size<0||f.size>8*1024*1024||!/^[a-f0-9]{64}$/.test(f.sha256??''))fail('manifest entry');expected.set(f.path,f);total+=f.size;}
 if(total>24*1024*1024)fail('expanded size outside budget');
 if(sha(bytes)!==manifest.archive.sha256)fail('archive hash mismatch');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),end=bytes.byteLength-22;
 const range=(offset,length)=>{if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||offset+length>bytes.byteLength)fail('truncated structure');};
 const u16=o=>{range(o,2);return v.getUint16(o,true);},u32=o=>{range(o,4);return v.getUint32(o,true);};
 if(u32(end)!==0x06054b50||u16(end+4)!==0||u16(end+6)!==0||u16(end+8)!==expected.size||u16(end+10)!==expected.size||u16(end+20)!==0)fail('unsupported end record');
 const centralStart=u32(end+16),centralLength=u32(end+12);if(centralStart+centralLength!==end)fail('central bounds');
 let cursor=centralStart,localCursor=0;const entries=[],seen=new Set();
 for(let i=0;i<expected.size;i++){
  range(cursor,46);if(u32(cursor)!==0x02014b50)fail('central signature');
  const flags=u16(cursor+8),method=u16(cursor+10),crc=u32(cursor+16),compressed=u32(cursor+20),size=u32(cursor+24),nameLength=u16(cursor+28),extra=u16(cursor+30),comment=u16(cursor+32),disk=u16(cursor+34),local=u32(cursor+42);
  if(flags!==0||method!==8||extra!==0||comment!==0||disk!==0||compressed===0xffffffff||size===0xffffffff||local===0xffffffff)fail('unsupported entry format');
  if(nameLength>1024)fail('entry name length');range(cursor+46,nameLength);const nameBytes=bytes.subarray(cursor+46,cursor+46+nameLength);if(nameBytes.some(b=>b<0x20||b>0x7e))fail('entry name encoding');const path=String.fromCharCode(...nameBytes),expectedFile=expected.get(path);
  if(!safePath(path)||!expectedFile||seen.has(path)||expectedFile.size!==size)fail('entry differs from manifest');seen.add(path);
  if(local!==localCursor||local>=centralStart)fail('local record ordering');range(local,30);
  if(u32(local)!==0x04034b50||u16(local+6)!==flags||u16(local+8)!==method||u32(local+14)!==crc||u32(local+18)!==compressed||u32(local+22)!==size||u16(local+26)!==nameLength||u16(local+28)!==0)fail('local/central mismatch');
  range(local+30,nameLength);for(let k=0;k<nameLength;k++)if(bytes[local+30+k]!==nameBytes[k])fail('local name mismatch');
  const payload=local+30+nameLength;range(payload,compressed);if(payload+compressed>centralStart)fail('payload overlaps directory');localCursor=payload+compressed;
  entries.push({path,size,sha256:expectedFile.sha256,crc32:crc,encoded:bytes.subarray(payload,localCursor)});cursor+=46+nameLength;
 }
 if(cursor!==end||localCursor!==centralStart||seen.size!==expected.size)fail('unaccounted archive bytes');
 for(const path of ['wordpress/index.php','wordpress/wp-load.php','wordpress/wp-includes/version.php','wordpress/wp-settings.php'])if(!seen.has(path))fail('required core file missing');
 return{entries,materializedFiles:entries.length,materializedBytes:total,archiveBytes:bytes.byteLength};
}
