import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { privateClient } from './playtt-private-client.mjs';
import { verifiedBackupPin, registerBackupPin } from './playtt-backup-pin-client.mjs';
const mode = process.argv.find(x => ['--prepare', '--fence', '--register', '--cold', '--release'].includes(x)); assert.ok(mode);
const prefix = 'artifacts/playtt-backup-pins-';
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const save = (path, data) => writeFile(path, JSON.stringify(data, null, 2));
if (mode === '--prepare') {
  let exists = false; try { await readFile(prefix + 'catalog-private.json'); exists = true; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  assert.equal(exists, false, 'Existing verified catalog must not be overwritten');
  const root = resolve('../../../../outputs/backups/cloudflare-wordpress-rebuild-ui');
  const backups = [];
  for (const name of (await readdir(root)).sort()) {
    const directory = root + '/' + name; const report = await load(directory + '/verification.json');
    assert.equal(report.bucket, 'playtt-wordpress-rebuild-audit'); assert.equal(report.result, 'pass');
    const verified = await verifiedBackupPin(directory);
    assert.equal(verified.pin.revision, report.revision); assert.equal(verified.pin.packSha256, report.archiveSha256);
    assert.equal(verified.pin.packBytes, report.archiveBytes); assert.equal(verified.objects, report.objects);
    backups.push({ directory, pin: verified.pin, objects: verified.objects });
  }
  assert.ok(backups.length >= 22);
  const unique = new Map();
  for (const b of backups) { if (unique.has(b.pin.revision)) assert.deepEqual(unique.get(b.pin.revision), b.pin); unique.set(b.pin.revision, b.pin); }
  const at = new Date().toISOString();
  await save(prefix + 'catalog-private.json', { at, backups, pins: [...unique.values()] });
  await save(prefix + 'local.json', { at, result: 'pass', scope: 'All completed backups in the project rebuild UI backup directory, not an attestation about unknown external copies', archives: backups.length, uniqueRevisions: unique.size,
    archiveBytes: backups.reduce((n, b) => n + b.pin.packBytes, 0), allArchivesDecodedAndVerified: true });
  console.log(JSON.stringify({ result: 'pass', archives: backups.length, uniqueRevisions: unique.size }));
  process.exit(0);
}
assert.ok(process.argv.includes('--remote'));
const c = await privateClient(), secrets = await load('../../../playtt-cms-secrets.json'); await c.paused();
async function post(phase, body) {
  const r = await c.request('/?phase=' + phase, { method: 'POST', headers: { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal(r.status, 200); return r.json();
}
async function registry() {
  const r = await c.request('/__playtt-backup-pins', { headers: { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN } });
  assert.equal(r.status, 200); const value = await r.json(); assert.equal(value.schema, 'playtt/backup-pins/v1'); return value;
}
if (mode === '--fence') {
  let exists = false; try { await readFile(prefix + 'fence-private.json'); exists = true; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  assert.equal(exists, false);
  const before = await c.operator('operator-fence-status'); assert.equal(before.coherent, true); assert.equal(before.fence.active, false);
  assert.equal(before.state.version, 309); assert.equal(before.state.pointer.revision, 'c0ba467c-c422-41e8-861c-64926c69e1fb');
  const capacityResponse = await c.request('/__playtt-capacity', { headers: { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN } });
  assert.equal(capacityResponse.status, 200); const capacity = await capacityResponse.json();
  assert.equal(capacity.reservationSchema, 'playtt/r2-capacity-reservation/v1'); assert.equal(capacity.limitBytes, 1000000000);
  const fence = await post('operator-fence-acquire', { ttlSeconds: 600 });
  await save(prefix + 'fence-private.json', { ...fence, released: false, before: before.state, capacity });
  console.log(JSON.stringify({ result: 'pass', mode, fenceActive: true, version: before.state.version }));
} else {
  const owned = await load(prefix + 'fence-private.json'); assert.equal(owned.released, false);
  await post('operator-fence-renew', { token: owned.token, ttlSeconds: 600 });
  if (mode === '--register') {
    const catalog = await load(prefix + 'catalog-private.json');
    const first = await registry(); assert.ok(first.generation <= catalog.pins.length);
    let receipt;
    for (const pin of catalog.pins) {
      await post('operator-fence-renew', { token: owned.token, ttlSeconds: 600 });
      receipt = await registerBackupPin(c.request, secrets.WORDPRESS_OPERATOR_TOKEN, owned.token, pin);
      for (const backup of catalog.backups.filter(b => b.pin.revision === pin.revision)) await save(backup.directory + '/retention-pin.json', receipt);
      await save(prefix + 'progress-private.json', { lastRevision: pin.revision, generation: receipt.generation });
      console.log(JSON.stringify({ registered: receipt.generation, created: receipt.created }));
    }
    const final = await registry(); assert.equal(final.generation, catalog.pins.length);
    for (const pin of catalog.pins) assert.deepEqual(Object.fromEntries(Object.keys(pin).map(key => [key, final.pins.find(p => p.revision === pin.revision)[key]])), pin);
    const retry = await registerBackupPin(c.request, secrets.WORDPRESS_OPERATOR_TOKEN, owned.token, catalog.pins[0]); assert.equal(retry.created, false); assert.equal(retry.generation, final.generation);
    const bad = await c.request('/__playtt-backup-pins', { method: 'POST', headers: { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify({ pin: catalog.pins[0], fenceToken: 'invalid-owned-fence-test' }) });
    assert.equal(bad.status, 409); assert.deepEqual(await registry(), final);
    await save(prefix + 'registry-private.json', final);
    await save(prefix + 'registered.json', { at: new Date().toISOString(), result: 'pass', archives: catalog.backups.length, uniquePins: final.pins.length, generation: final.generation,
      duplicateRegistrationIdempotent: true, wrongFenceStatus: bad.status, checks: c.checks });
  } else if (mode === '--cold') {
    const before = await load(prefix + 'registry-private.json'); assert.deepEqual(await registry(), before);
    const state = await c.operator('operator-fence-status'); assert.equal(state.coherent, true); assert.deepEqual(state.state, owned.before);
    const budgetResponse = await c.request('/__playtt-capacity', { headers: { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN } }); assert.equal(budgetResponse.status, 200);
    assert.deepEqual(await budgetResponse.json(), owned.capacity);
    await save(prefix + 'cold.json', { at: new Date().toISOString(), result: 'pass', pins: before.pins.length, generation: before.generation,
      canonicalUnchanged: true, capacityLedgerUnchanged: true, registrySurvivedRedeployment: true, checks: c.checks });
  } else {
    assert.equal(mode, '--release');
    await post('operator-fence-release', { token: owned.token }); owned.released = true; await save(prefix + 'fence-private.json', owned);
    const state = await c.operator('operator-fence-status'); assert.equal(state.coherent, true); assert.equal(state.fence.active, false); assert.deepEqual(state.state, owned.before);
    await save(prefix + 'released.json', { at: new Date().toISOString(), result: 'pass', version: state.state.version, fenceActive: false, publisher: 'paused', canonicalUnchanged: true });
  }
  console.log(JSON.stringify({ result: 'pass', mode }));
}
