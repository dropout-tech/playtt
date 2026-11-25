import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanonicalRestorePack } from '../src/canonical-restore-pack.js';
import { verifyRetainedManifest, checkCoverage, sha, BUCKET } from '../scripts/playtt-verify-retained-packs.mjs';

async function fixture(attachment: 'none' | 'complete' | 'missing' = 'none') {
  const encode = (s: string) => new TextEncoder().encode(s);
  const contents = {
    markdown: [
      { path: 'posts/example.md', bytes: encode('---\nwordpress:\n  id: 1\n---\n繁體中文，尾端空白。\n \t\n') },
      { path: '_tables/posts.json', bytes: encode(JSON.stringify([{ ID: 7, post_type: 'revision' }])) },
      { path: '_tables/postmeta.json', bytes: encode(JSON.stringify([{ meta_id: 3, post_id: 1, meta_key: '_thumbnail_id', meta_value: '10' }])) },
    ],
    uploads: [{ path: '2026/11/fixture.bin', bytes: new Uint8Array([0, 1, 255]) }],
    wpContent: [{ path: 'themes/playtt/style.css', bytes: encode('body { color: blue; }') }],
    wpContentDeleted: [],
  };
  if (attachment !== 'none') contents.markdown[0].bytes = encode('---\nwordpress:\n  id: 1\n  type: attachment\n---\nFixture\n');
  if (attachment === 'complete') contents.markdown[2].bytes = encode(JSON.stringify([{ meta_id: 3, post_id: 1, meta_key: '_wp_attached_file', meta_value: '2026/11/fixture.bin' }]));
  const archive = await createCanonicalRestorePack('sites/default', contents);
  const files = (entries: typeof contents.markdown, domain: string) => entries.map(f => ({ path: f.path, objectKey: `sites/default/${domain}/objects/${sha(f.bytes)}`, sha256: sha(f.bytes), size: f.bytes.length }));
  const revision = '12345678-1234-4234-8234-123456789abc';
  const manifest = { revision, manifestKey: `sites/default/markdown/revisions/${revision}.json`, persistedAt: '2026-11-20T00:00:00Z', files: files(contents.markdown, 'markdown'), uploads: files(contents.uploads, 'uploads'), wpContent: files(contents.wpContent, 'wp-content'), wpContentDeleted: [], restorePack: archive.metadata };
  const raw = encode(JSON.stringify(manifest));
  const pin = { revision, manifestKey: manifest.manifestKey, persistedAt: manifest.persistedAt, manifestSha256: sha(raw), packKey: archive.metadata.objectKey, packSha256: archive.metadata.sha256, packBytes: archive.bytes.length };
  return { manifest, raw, pack: archive.bytes, pin, encode };
}

test('full verification checks compressed and decoded bytes, Unicode content, media, tables and a durable pin', async () => {
  const f = await fixture(); const receipt = await verifyRetainedManifest(f.raw, f.pack, f.manifest, f.pin);
  assert.equal(receipt.result, 'pass'); assert.equal(receipt.indexedFiles, 5); assert.equal(receipt.markdownRecords, 1);
  assert.equal(receipt.historyRows, 1); assert.equal(receipt.postmetaRows, 1); assert.equal(receipt.uploads, 1); assert.equal(receipt.wpContent, 1); assert.equal(receipt.pinned, true);
});

test('compressed corruption fails even when the listed object size is unchanged', async () => {
  const f = await fixture(); const broken = f.pack.slice(); broken[30] ^= 1;
  await assert.rejects(verifyRetainedManifest(f.raw, broken, f.manifest), /compressed integrity/);
});

test('a valid whole ZIP hash does not excuse a mismatched content index', async () => {
  const f = await fixture(); const m = structuredClone(f.manifest); m.files[0].sha256 = 'a'.repeat(64); m.files[0].objectKey = 'sites/default/markdown/objects/' + m.files[0].sha256;
  await assert.rejects(verifyRetainedManifest(f.encode(JSON.stringify(m)), f.pack, m), /integrity validation/);
});

test('an incomplete ZIP with recomputed outer digest still fails full decode', async () => {
  const f = await fixture(); const broken = f.pack.slice(0, Math.floor(f.pack.length / 2)); const m = structuredClone(f.manifest);
  m.restorePack.sha256 = sha(broken); m.restorePack.objectKey = 'sites/default/restore-packs/' + m.restorePack.sha256 + '.zip'; m.restorePack.size = broken.length;
  await assert.rejects(verifyRetainedManifest(f.encode(JSON.stringify(m)), broken, m));
});

test('duplicate or traversal paths and cross-site object keys are rejected before restoration', async () => {
  for (const mode of ['duplicate', 'traversal', 'cross-site']) {
    const f = await fixture(); const m = structuredClone(f.manifest);
    if (mode === 'duplicate') m.files.push({ ...m.files[0] });
    if (mode === 'traversal') m.files[0].path = '../outside';
    if (mode === 'cross-site') m.files[0].objectKey = m.files[0].objectKey.replace('sites/default/', 'sites/other/');
    await assert.rejects(verifyRetainedManifest(f.encode(JSON.stringify(m)), f.pack, m));
  }
});

test('an altered protected manifest is rejected despite equivalent parsed JSON and valid ZIP', async () => {
  const f = await fixture(); const changed = f.encode(JSON.stringify(f.manifest, null, 2));
  await assert.rejects(verifyRetainedManifest(changed, f.pack, f.manifest, f.pin), /Protected manifest digest changed/);
});

test('archive integrity does not hide an older missing attachment relationship or claim PHP restore acceptance', async () => {
  for (const mode of ['complete', 'missing'] as const) {
    const f = await fixture(mode); const receipt = await verifyRetainedManifest(f.raw, f.pack, f.manifest, f.pin);
    assert.equal(receipt.result, 'pass'); assert.equal(receipt.attachmentRecords, 1);
    assert.equal(receipt.missingAttachmentFileLinks, mode === 'missing' ? 1 : 0);
    assert.equal(receipt.linkedAttachmentFiles, mode === 'complete' ? 1 : 0);
    assert.equal(receipt.perRevisionPhpRestoreTested, false);
  }
});

test('coverage binds every retained revision and the complete immutable input fingerprint', () => {
  const revision = '12345678-1234-4234-8234-123456789abc', digest = 'a'.repeat(64);
  const plan = { retained: { [revision]: ['current'] } }, inputs = { inventory: 'inventory-hash', plan: 'plan-hash', plan_summary: 'summary-hash', registry: 'registry-hash' };
  const index = { schema: 'playtt/retained-pack-download/v1', bucket: BUCKET, result: 'downloaded', safeToApply: false, failures: [], inputs, expectedRevisions: 1, uniquePacks: 1,
    rows: [{ revision, manifestSha256: digest, packSha256: digest, manifestFile: `manifests/${revision}.json`, packFile: `packs/${digest}.zip` }] };
  assert.equal(checkCoverage(plan, index, inputs, { retainedRevisions: 1 }).length, 1);
  for (const mode of ['missing', 'duplicate', 'fingerprint', 'cache-path', 'wrong-bucket', 'incomplete']) {
    const broken = structuredClone(index);
    if (mode === 'missing') broken.rows = [];
    if (mode === 'duplicate') broken.rows.push({ ...broken.rows[0] });
    if (mode === 'fingerprint') broken.inputs.inventory = 'different';
    if (mode === 'cache-path') broken.rows[0].packFile = '../../secret';
    if (mode === 'wrong-bucket') broken.bucket = 'another-project';
    if (mode === 'incomplete') broken.result = 'fail';
    assert.throws(() => checkCoverage(plan, broken, inputs, { retainedRevisions: 1 }));
  }
});
