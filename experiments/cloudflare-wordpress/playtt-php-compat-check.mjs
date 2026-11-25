import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { PLAYTT_OPAQUE_ID_PHP } from '../src/playtt-php-compat.ts';
const requirePlayground = createRequire(new URL('../../../../playtt/wordpress/package.json', import.meta.url));
const { loadNodeRuntime } = await import(pathToFileURL(requirePlayground.resolve('@php-wasm/node')));
const { PHP } = await import(pathToFileURL(requirePlayground.resolve('@php-wasm/universal')));
const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }));
try {
  const response = await php.run({ code: `<?php
${PLAYTT_OPAQUE_ID_PHP}
$ids = array(); $normal = true; $entropy = true;
for ($i = 0; $i < 10000; $i++) {
    $a = wp_codebox_uniqid('prefix-'); $b = wp_codebox_uniqid('entropy-', true);
    $normal = $normal && preg_match('/^prefix-[a-f0-9]{32}$/D', $a);
    $entropy = $entropy && preg_match('/^entropy-[a-f0-9]{48}$/D', $b);
    $ids[] = $a; $ids[] = $b;
}
echo json_encode(array('php'=>PHP_VERSION, 'count'=>count($ids), 'unique'=>count(array_unique($ids)), 'prefixAndFormat'=>$normal && $entropy, 'nativeBuiltinUnchanged'=>(new ReflectionFunction('uniqid'))->isInternal()));
` });
  assert.equal(response.exitCode, 0, response.errors);
  const result = JSON.parse(response.text);
  assert.equal(result.count, 20000); assert.equal(result.unique, 20000);
  assert.equal(result.prefixAndFormat, true); assert.equal(result.nativeBuiltinUnchanged, true);
  const report={at:new Date().toISOString(),scope:'Local PHP opaque ID helper; not remote timing acceptance',result:'pass',...result};
  await writeFile('artifacts/playtt-php-compat-check.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally { php.exit(); }
