import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { privateClient, origin } from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const beforeLocation = await load('artifacts/playtt-rebuild-ui-backup-after-capacity-audit-location-private.json');
const afterLocation = await load('artifacts/playtt-rebuild-ui-backup-after-backup-pins-location-private.json');
const before = await load(beforeLocation.directory + '/verification.json'), after = await load(afterLocation.directory + '/verification.json');
assert.equal(after.result, 'pass'); assert.equal(after.pinRegistered, true); assert.equal(after.pinGeneration, 21);
assert.equal(after.archiveSha256, before.archiveSha256);
for (const filename of ['manifest.json', 'restore.zip']) assert.equal(hash(await readFile(beforeLocation.directory + '/' + filename)), hash(await readFile(afterLocation.directory + '/' + filename)));
const receipt = await load(afterLocation.directory + '/retention-pin.json'); assert.equal(receipt.created, false);
const owned = await load('artifacts/playtt-backup-pins-fence-private.json'); assert.equal(owned.released, true);
const secrets = await load('../../../playtt-cms-secrets.json'), c = await privateClient(); await c.paused();
const headers = { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN };
const s = await c.operator('operator-fence-status'); assert.equal(s.coherent, true); assert.equal(s.fence.active, false); assert.deepEqual(s.state, owned.before);
const pinsResponse = await c.request('/__playtt-backup-pins', { headers }); assert.equal(pinsResponse.status, 200);
assert.equal(pinsResponse.headers.get('cache-control'), 'no-store');
const pins = await pinsResponse.json(); assert.deepEqual(pins, await load('artifacts/playtt-backup-pins-registry-private.json'));
const capacityResponse = await c.request('/__playtt-capacity', { headers }); assert.equal(capacityResponse.status, 200);
assert.deepEqual(await capacityResponse.json(), owned.capacity);
const accessChecks = [];
for (const [options, expected] of [[{}, 401], [{ method: 'DELETE', headers }, 405], [{ method: 'POST', headers, body: 'x'.repeat(8193) }, 413]]) {
  const r = await c.request('/__playtt-backup-pins', options); assert.equal(r.status, expected); accessChecks.push({ method: options.method || 'GET', authenticated: !!options.headers, status: r.status }); await r.arrayBuffer();
}
const gateChecks = [];
for (const path of ['/__playtt-backup-pins', '/wp-admin/', '/wp-json/wp/v2/media', '/wp-content/uploads/2026/11/logo.webp']) {
  const r = await fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(30000) }); assert.equal(r.status, 404);
  assert.ok(r.headers.get('x-robots-tag')?.includes('noindex')); await r.arrayBuffer(); gateChecks.push({ path, status: r.status });
}
const source = 'https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
async function sourceGet(path) {
  const r = await fetch(source + path, { headers: { ...headers, 'X-Playtt-Probe': secrets.WORDPRESS_OPERATOR_TOKEN }, signal: AbortSignal.timeout(60000) });
  assert.equal(r.status, 200); return r.json();
}
const ss = await sourceGet('/?phase=operator-fence-status'); assert.equal(ss.coherent, true); assert.equal(ss.fence.active, false); assert.equal(ss.state.version, 175);
assert.equal((await sourceGet('/__playtt-publishing')).state, 'paused');
const report = { at: new Date().toISOString(), result: 'pass', scope: 'Append-only backup registry; no PHP/content mutation or independent restore',
  pins: pins.pins.length, generation: pins.generation, newBackupPinIdempotent: true, manifestAndArchiveByteIdentical: true,
  canonicalUnchanged: true, capacityLedgerUnchanged: true, fenceActive: false, publisher: 'paused',
  states: [{ target: 'rebuild', version: s.state.version, revision: s.state.pointer.revision }, { target: 'daily-source', version: ss.state.version, revision: ss.state.pointer.revision }],
  accessChecks, gateChecks, backup: after };
await writeFile('artifacts/playtt-backup-pins-final.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
