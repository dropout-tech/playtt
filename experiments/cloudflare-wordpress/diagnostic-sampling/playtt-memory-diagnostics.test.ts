import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import type { PHP } from '@php-wasm/universal';
import { collectPlayttFileMemory, playttRuntimeMemoryEvidence } from '../src/playtt-memory-diagnostics.ts';

const dir = (contents: Record<string, unknown>) => ({ mode: 0x41ff, contents });
const file = (contents: unknown) => ({ mode: 0x81b6, contents });

test('counts buffer capacity and heap aliases without changing live files', () => {
 const heap = new Uint8Array(40), core = new Uint8Array(12), canonical = heap.subarray(2, 7);
 const root = dir({ wordpress: dir({ 'index.php': file(core), 'wp-content': dir({ markdown: dir({ 'home.md': file(canonical) }), uploads: dir({ 'photo.png': file(new Uint8Array(3)) }) }) }) });
 assert.deepEqual(collectPlayttFileMemory(root, heap.buffer), { fileBytes:20, files:3, heapAliasedFileBytes:5, unknownFileBuffers:0, categories:{'wordpress-core':12,canonical:5,uploads:3} });
 assert.equal(root.contents.wordpress.contents['index.php'].contents,core);assert.equal(canonical.buffer,heap.buffer);
});

test('cross-realm views and byte arrays are file buffers, never recursive entries', () => {
 const foreign = vm.runInNewContext('new Uint8Array(7)');assert.equal(foreign instanceof Uint8Array,false);
 const bytes = new Array(1000000);Object.defineProperty(bytes,0,{get(){throw Error('File elements must not be enumerated');},enumerable:true});
 const r=collectPlayttFileMemory(dir({ a:file(foreign),b:file(bytes),c:file(new DataView(new ArrayBuffer(9))) }));
 assert.equal(r.files,3);assert.equal(r.fileBytes,1000016);assert.equal(r.unknownFileBuffers,0);
});

test('cycles, non-directory nodes and unknown file formats do not recurse', () => {
 const root=dir({});root.contents.loop=root;root.contents.bad=file({get accidental(){throw Error('Do not inspect unknown file data');}});root.contents.device={mode:0x2000,contents:root};
 const r=collectPlayttFileMemory(root);assert.equal(r.files,0);assert.equal(r.fileBytes,0);assert.equal(r.unknownFileBuffers,1);
});

test('warm request diagnostics read heap without traversing files; persistence resamples', () => {
 const root=dir({a:file(new Uint8Array(8))}),module={HEAPU8:new Uint8Array(16),FS:{root}};
 const php={[Symbol('__private__dont__use')]:module} as unknown as PHP;
 assert.equal(playttRuntimeMemoryEvidence(php,'before-request').fileBytes,8);
 Object.defineProperty(root,'contents',{get(){throw Error('Warm read must not scan files');},configurable:true});
 module.HEAPU8=new Uint8Array(32);
 for(const stage of ['after-request','before-request'])assert.deepEqual(playttRuntimeMemoryEvidence(php,stage),{heapBytes:32,fileScanPerformed:false});
 Object.defineProperty(root,'contents',{value:{a:file(new Uint8Array(11))},configurable:true});
 assert.equal(playttRuntimeMemoryEvidence(php,'after-persist').fileBytes,11);
 const fresh={[Symbol('__private__dont__use')]:module} as unknown as PHP;assert.equal(playttRuntimeMemoryEvidence(fresh,'before-request').fileScanPerformed,true);
});

test('missing runtime evidence remains unavailable rather than fabricated', () => {
 assert.deepEqual(playttRuntimeMemoryEvidence({} as PHP,'before-request'),{heapBytes:0,fileScanPerformed:false});
});
