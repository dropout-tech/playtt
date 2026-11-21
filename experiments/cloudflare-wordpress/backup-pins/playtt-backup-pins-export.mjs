import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { privateClient } from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const secrets = JSON.parse(await readFile('../../../playtt-cms-secrets.json', 'utf8')), c = await privateClient();
const r = await c.request('/__playtt-backup-pins', { headers: { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN } });
assert.equal(r.status, 200); const registry = await r.json();
assert.equal(registry.schema, 'playtt/backup-pins/v1'); assert.equal(registry.generation, registry.pins.length);
const raw = JSON.stringify(registry, null, 2);
await writeFile('artifacts/playtt-backup-pins-export-private.json', raw);
const report = { at: new Date().toISOString(), result: 'pass', scope: 'Authenticated read-only registry export; not an atomic retention snapshot',
  pins: registry.pins.length, generation: registry.generation, privateRegistrySha256: createHash('sha256').update(raw).digest('hex') };
await writeFile('artifacts/playtt-backup-pins-export.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
