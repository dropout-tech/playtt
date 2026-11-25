// Isolated optional native Uint8Array Base64 encoding; retain the exact fallback.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const previous=resolve('../../../playtt-boot-zip-build');
export const sourceSha256='c81f37e3ab4399efc98fcb5688d1e62fc3dd114fc8e3e28c9edb0a2fdef76e99';
export async function sources(){
 const original=(await readFile(join(previous,'src/playtt-manifest-envelope.ts'),'utf8')).replaceAll('\r\n','\n');assert.equal(sha(original),sourceSha256);
 const old="function base64(b:Uint8Array):string{let text='';for(let i=0;i<b.length;i+=16384)text+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(text);}";
 const native="const native=(Uint8Array.prototype as Uint8Array & {toBase64?:()=>string}).toBase64;";
 const replacement=`function base64(b:Uint8Array):string{\n  // Use the built-in encoder when present; older runtimes retain the exact path.\n  ${native}\n  if(typeof native==='function')return native.call(b);\n  let text='';for(let i=0;i<b.length;i+=16384)text+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(text);\n}`;
 assert.equal(original.split(old).length,2);const candidate=original.replace(old,replacement),fallback=candidate.replace(native,'const native:undefined=undefined;');
 return {original,candidate,fallback,old,replacement,sourceSha256,candidateSha256:sha(candidate)};
}
export async function compile(variant,entry,options={}){
 assert.ok(['baseline','candidate','fallback','combined'].includes(variant));const input=await sources(),module=v=>(v==='baseline'?input.original:v==='candidate'?input.candidate:input.fallback)+'\nexport {base64 as encodeBase64};\n';
 return build({stdin:{contents:entry??module(variant),loader:'ts',sourcefile:'base64-native-fixture.ts',resolveDir:join(previous,'src')},bundle:true,write:false,format:'esm',target:'es2022',keepNames:true,logLevel:'error',...options,plugins:[{name:'native-base64-candidate',setup(b){b.onResolve({filter:/^base64-native-(module|baseline|candidate|fallback)$/},args=>({path:args.path==='base64-native-module'?variant:args.path.slice('base64-native-'.length),namespace:'native-base64'}));b.onLoad({filter:/.*/,namespace:'native-base64'},args=>({contents:module(args.path),loader:'ts',resolveDir:join(previous,'src')}));}}]});
}
export async function api(variant){const result=await compile(variant);return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}
