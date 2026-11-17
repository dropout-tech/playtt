import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('node_modules/@php-wasm/web-8-3/package.json', root), 'utf8'));
assert.equal(pkg.version, '3.1.64');
const file = new URL('node_modules/@php-wasm/web-8-3/asyncify/php_8_3.js', root);
const original = "const dependencyFilename = new URL('./8_3_36/php_8_3.wasm', import.meta.url)\n\t.href;";
const replacement = "import dependencyFilename from './8_3_36/php_8_3.wasm';";
const source = (await readFile(file, 'utf8')).replaceAll('\r\n', '\n');
if (source.startsWith(replacement)) console.log('PHP 8.3.36 compiled-WASM import already prepared.');
else {
  assert.ok(source.startsWith(original), 'Pinned PHP loader changed; review before updating.');
  await writeFile(file, replacement + source.slice(original.length));
  console.log('PHP 8.3.36 prepared for the Workers compiled-WASM binding.');
}
