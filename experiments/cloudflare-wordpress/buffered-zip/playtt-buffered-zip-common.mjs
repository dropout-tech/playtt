// Isolated experiment on pinned GPL-2.0-or-later WordPress Playground code.
// Generated module is not installed into node_modules or the central runtime.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {build} from 'esbuild';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const upstreamSha256='4d495f20e873d23fee4f012fbff2d30e3700b1f46637ef0346a13d377626fd81';
export const canonicalSha256='e14138243ebb1d650a62897a23234e35a0dc94af70b758cd4305a4594c4d9f0f';
export async function sources(){
 const upstream=await readFile('node_modules/@php-wasm/stream-compression/index.js','utf8');assert.equal(sha(upstream),upstreamSha256);
 const original=(await readFile('src/canonical-restore-pack.ts','utf8')).replaceAll('\r\n','\n');assert.equal(sha(original),canonicalSha256);
 const from='async function u(e, n) {\n  return n !== void 0 && (e = b(e, n)), await e.pipeThrough(D(n)).getReader().read().then(({ value: t }) => t);\n}';assert.equal(upstream.split(from).length,2);
 const to=`async function u(e, n) {
  const cursor = playttBufferedInputs.get(e);
  // Header/path/extra/comment reads are bounded uint16-sized fields. Keep the
  // generic path for every other stream, unspecified length or locked stream.
  if (cursor && !e.locked && Number.isInteger(n) && n >= 0 && n <= 65535) {
    const result = new Uint8Array(n);
    const count = Math.min(n, cursor.bytes.length - cursor.offset);
    result.set(cursor.bytes.subarray(cursor.offset, cursor.offset + count));
    cursor.offset += count;
    // Match the pinned collector's zero-filled remainder on short input.
    return result;
  }
  return n !== void 0 && (e = b(e, n)), await e.pipeThrough(D(n)).getReader().read().then(({ value: t }) => t);
}`;
 const prefix='// Derived from @php-wasm/stream-compression 3.1.45, WordPress contributors. GPL-2.0-or-later.\nconst playttBufferedInputs = new WeakMap();\n';
 const suffix=`
// Snapshot the same bytes that Blob previously copied. The existing ZIP parser,
// decompression/CRC path, File construction and generic collector stay intact.
export function decodeZipFromBytes(input) {
  const bytes = new Uint8Array(input.byteLength); bytes.set(input);
  const cursor = { bytes, offset: 0 };
  const stream = new ReadableStream({
    type: 'bytes',
    pull(controller) {
      const remaining = cursor.bytes.length - cursor.offset;
      if (remaining === 0) {
        controller.close(); controller.byobRequest?.respond(0); return;
      }
      const request = controller.byobRequest;
      if (request) {
        const view = request.view, count = Math.min(view.byteLength, remaining);
        new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set(cursor.bytes.subarray(cursor.offset, cursor.offset + count));
        cursor.offset += count; request.respond(count);
      } else {
        const count = Math.min(65536, remaining), chunk = cursor.bytes.slice(cursor.offset, cursor.offset + count);
        cursor.offset += count; controller.enqueue(chunk);
      }
    },
    cancel() { cursor.offset = cursor.bytes.length; }
  });
  playttBufferedInputs.set(stream, cursor);
  return y(stream);
}
`;
 const module=prefix+upstream.replace(from,to)+suffix;
 const call='decodeZip(new Blob([bytes as Uint8Array<ArrayBuffer>]).stream())';assert.equal(original.split(call).length,2);
 const candidate=original.replace('import { decodeZip, encodeZip } from "@php-wasm/stream-compression"','import { encodeZip } from "@php-wasm/stream-compression"\nimport { decodeZipFromBytes } from "./playtt-buffered-zip.mjs"').replace(call,'decodeZipFromBytes(bytes)');
 return {upstream,original,module,candidate,upstreamSha256,canonicalSha256,moduleSha256:sha(module),candidateSha256:sha(candidate)};
}
export async function compile(variant,entry){
 assert.ok(['baseline','candidate'].includes(variant));const input=await sources();
 return build({stdin:{contents:entry??(variant==='baseline'?input.original:input.candidate),sourcefile:'buffered-zip-fixture.ts',resolveDir:resolve('src'),loader:'ts'},bundle:true,write:false,format:'esm',target:'es2022',keepNames:true,logLevel:'error',plugins:[{name:'buffered-zip-candidate',setup(b){
  b.onResolve({filter:/^canonical-restore-module$/},()=>({path:'canonical',namespace:'canonical'}));b.onLoad({filter:/.*/,namespace:'canonical'},()=>({contents:variant==='baseline'?input.original:input.candidate,loader:'ts',resolveDir:resolve('src')}));
  b.onResolve({filter:/playtt-buffered-zip\.mjs$/},()=>({path:'zip',namespace:'buffered-zip'}));b.onLoad({filter:/.*/,namespace:'buffered-zip'},()=>({contents:input.module,loader:'js'}));
 } }]});
}
export async function api(variant){const result=await compile(variant);return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}
