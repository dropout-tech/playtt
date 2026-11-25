import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=source=>createHash('sha256').update(source).digest('hex');
const baselineSha='9eee1c4bf010ff84741d82c5143689e76c2d06cd0c877dc919c6ecd202b9b666';
const candidateSha='382310127a494ab04b7324823230f3e119e6928330575a3089cd84566da6150f';
assert.ok(process.argv.slice(2).every(x=>x==='--check'),'Unknown loader preparation option');
const sourcePath='node_modules/@php-wasm/web-8-3/asyncify/php_8_3.js';
const pkg=JSON.parse(await readFile('node_modules/@php-wasm/web-8-3/package.json','utf8'));assert.equal(pkg.version,'3.1.64');
const source=(await readFile(sourcePath,'utf8')).replaceAll('\r\n','\n');
const grow='var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);';
assert.equal(source.split(grow).length,2,'Review the pinned Emscripten loader before changing heap policy.');
assert.ok(source.startsWith("import dependencyFilename from './8_3_36/php_8_3.wasm';"));
const baseline=source.replace("from './8_3_36/php_8_3.wasm'","from '../node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'").replace(grow,'var overGrownHeapSize = oldSize + 1048576 / cutDown;');
assert.equal(sha(baseline),baselineSha,'Pinned baseline loader changed; review before regenerating.');
// FS.lookupPath has already filtered empty components, handled dot/dotdot,
// and maintained an absolute normalized path. Preserve actual node lookups,
// permission/error handling, symlinks and mounts; avoid re-normalizing it.
// Exact output matches the PHP semantic and native save/restore candidate.
const join='current_path = PATH.join2(current_path, parts[i]);';
assert.equal(baseline.split(join).length,2,'Review lookupPath before changing path assembly.');
const output=baseline.replace(join,"current_path = current_path === '/' ? '/' + parts[i] : current_path + '/' + parts[i];");
assert.equal(sha(output),candidateSha,'Generated candidate differs from validated loader.');
let existing;
try{existing=sha((await readFile('src/playtt-php-loader.mjs','utf8')).replaceAll('\r\n','\n'));}catch(error){if(error.code!=='ENOENT')throw error;}
assert.ok(existing===undefined||[baselineSha,candidateSha].includes(existing),'Refuse to overwrite an unrecognized generated loader.');
const checkOnly=process.argv.includes('--check');
if(!checkOnly)await writeFile('src/playtt-php-loader.mjs',output);
console.log(JSON.stringify({package:pkg.version,sourceSha256:sha(source),baselineSha256:baselineSha,outputSha256:sha(output),priorOutputSha256:existing,checkOnly,written:!checkOnly,change:'One MiB linear heap growth plus normalized-component path append; exact tested loader; PHP/WASM binary unchanged; no filesystem cache',deployed:false}));
