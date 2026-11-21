import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlayttRuntimeManifestCache } from '../src/playtt-runtime-manifest-cache.js';

const manifest = (revision = 'a', root = 'sites/default') => ({
  revision, manifestKey: `${root}/markdown/revisions/${revision}.json`, persistedAt: '2026-11-20T00:00:00.000Z',
  files: [{ path: 'pages/home.md', sha256: 'a'.repeat(64), size: 15 }],
  uploads: [{ path: 'logo.webp', sha256: 'b'.repeat(64), size: 120 }],
  wpContentDeleted: ['themes/old/style.css'], restorePack: { sha256: 'c'.repeat(64), size: 100 },
});

test('same complete identity reuses metadata without retaining mutable caller objects', () => {
  const cache = new PlayttRuntimeManifestCache<ReturnType<typeof manifest>>(), source = manifest();
  assert.equal(cache.get('sites/default', source), undefined);
  assert.equal(cache.remember('sites/default', source, source), true);
  const cached = cache.get('sites/default', source)!;
  assert.deepEqual(cached, source); assert.notEqual(cached, source);
  source.files[0].size = 999;
  assert.equal(cached.files[0].size, 15);
  assert.throws(() => { cached.uploads[0].path = 'changed'; }, TypeError);
  assert.throws(() => { cached.wpContentDeleted.push('new'); }, TypeError);
  assert.throws(() => { cached.restorePack.size = 42; }, TypeError);
});

test('site, revision, manifest key and timestamp each prevent an incorrect hit', () => {
  const cache = new PlayttRuntimeManifestCache(), value = manifest(); cache.remember('sites/default', value, value);
  assert.equal(cache.get('sites/other', value), undefined);
  for (const [key, changed] of [['revision','b'],['manifestKey',value.manifestKey+'.other'],['persistedAt','later']]) {
    assert.equal(cache.get('sites/default', { ...value, [key]: changed }), undefined);
  }
});

test('a prepared new version cannot be read under the old uncommitted pointer', () => {
  const cache = new PlayttRuntimeManifestCache(), before = manifest(), after = manifest('b');
  cache.remember('sites/default', before, before); cache.remember('sites/default', after, after);
  assert.equal(cache.get('sites/default', before), undefined);
  assert.deepEqual(cache.get('sites/default', after), after);
});

test('replacement retains one entry and does not silently reuse history after rollback', () => {
  const cache = new PlayttRuntimeManifestCache(), first = manifest(), second = manifest('b');
  cache.remember('sites/default', first, first); cache.remember('sites/default', second, second);
  assert.equal(cache.get('sites/default', first), undefined);
  cache.remember('sites/other', manifest('c','sites/other'), manifest('c','sites/other'));
  assert.equal(cache.get('sites/default', second), undefined);
});

test('oversized UTF-8 metadata falls back to storage and discards the old entry', () => {
  const first = manifest(), budget = new TextEncoder().encode(JSON.stringify(first)).byteLength + 300;
  const cache = new PlayttRuntimeManifestCache(budget);
  assert.equal(cache.remember('sites/default', first, first), true);
  const large = { ...manifest('b'), text: '桌球'.repeat(100) };
  assert.ok(JSON.stringify(large).length < budget, 'UTF-16 character count alone would incorrectly allow this entry');
  assert.equal(cache.remember('sites/default', large, large), false);
  assert.equal(cache.get('sites/default', first), undefined); assert.equal(cache.get('sites/default', large), undefined);
});

test('a mismatched or cross-site manifest cannot replace a valid entry', () => {
  const cache = new PlayttRuntimeManifestCache(), value = manifest();
  for (const [root,pointer,data] of [['sites/default',value,manifest('b')],['sites/other',value,value],['../outside',value,value]] as const) {
    cache.remember('sites/default', value, value);
    assert.throws(() => cache.remember(root,pointer,data), /identity/);
    assert.equal(cache.get('sites/default',value), undefined);
  }
});

test('separate runtime instances share neither cached metadata nor prepared versions', () => {
  const first = new PlayttRuntimeManifestCache(), second = new PlayttRuntimeManifestCache(), value = manifest();
  first.remember('sites/default',value,value);
  assert.equal(second.get('sites/default',value),undefined);
  assert.throws(() => new PlayttRuntimeManifestCache(-1), /budget/);
});
