import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decodeCanonicalRestorePack } from '../src/canonical-restore-pack.ts';
import { backupPinInput } from '../src/playtt-backup-pins.ts';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function verifiedBackupPin(directory) {
  const bytes = await readFile(directory + '/manifest.json'), manifest = JSON.parse(bytes.toString('utf8'));
  const pack = await readFile(directory + '/restore.zip');
  const pin = backupPinInput({ revision: manifest.revision, manifestKey: manifest.manifestKey, persistedAt: manifest.persistedAt,
    manifestSha256: hash(bytes), packKey: manifest.restorePack.objectKey, packSha256: hash(pack), packBytes: pack.length });
  assert.equal(pin.packSha256, manifest.restorePack.sha256); assert.equal(pin.packBytes, manifest.restorePack.size);
  const decoded = await decodeCanonicalRestorePack(manifest.restorePack, 'sites/default',
    { markdown: manifest.files, uploads: manifest.uploads || [], wpContent: manifest.wpContent || [], wpContentDeleted: manifest.wpContentDeleted || [] }, pack);
  return { pin, objects: decoded.markdown.length + decoded.uploads.length + decoded.wpContent.length + 2 };
}

export async function registerBackupPin(request, token, fenceToken, pin) {
  const r = await request('/__playtt-backup-pins', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ pin, fenceToken }) });
  assert.equal(r.status, 200, 'Remote backup pin was not acknowledged. Keep local files and retry this same identity after inspecting state.');
  const receipt = await r.json();
  assert.equal(receipt.schema, 'playtt/backup-pins/v1'); assert.ok(Number.isSafeInteger(receipt.generation) && receipt.generation > 0);
  assert.deepEqual(backupPinInput(receipt.pin), pin);
  return receipt;
}
