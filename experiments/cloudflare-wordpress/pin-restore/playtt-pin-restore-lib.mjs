import assert from 'node:assert/strict';
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import YAML from 'yaml';
import { decodeCanonicalRestorePack } from '../src/canonical-restore-pack.ts';

export const bucket = 'playtt-wordpress-pin-restore-audit';
export const worker = 'playtt-wp-free-pin-restore-audit';
export const origin = 'https://' + worker + '.muzhi-garden-platform.workers.dev';
export const source = 'https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
export const configName = 'wrangler.playtt-pin-restore-audit.jsonc';
export const prefix = 'artifacts/playtt-pin-restore-';
export const revision = 'c0ba467c-c422-41e8-861c-64926c69e1fb';
export const archiveSha = '54bde7a44ea53b1ccd36bbe964afc0ddeb3045c6ba62a90682bbcf7b3b1eb61e';
export const sha = value => createHash('sha256').update(value).digest('hex');
export const hash = value => sha(JSON.stringify(value));
export const load = async path => JSON.parse(await readFile(path, 'utf8'));
export const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2));
export async function report(name, value) { const result = { at: new Date().toISOString(), bucket, ...value }; await save(prefix + name + '.json', result); console.log(JSON.stringify(result)); return result; }

export async function validateConfig() {
  const c = await load(configName);
  assert.equal(c.name, worker); assert.equal(c.account_id, '3baadbd4abd9fd63c7f7e51664b26f67');
  assert.deepEqual(c.r2_buckets, [{ binding: 'WORDPRESS_STATE_BUCKET', bucket_name: bucket }]);
  assert.equal(c.vars.PLAYTT_R2_CAPACITY_SCOPE, bucket); assert.equal(c.vars.PLAYTT_R2_CAPACITY_LIMIT_BYTES, '300000000');
  assert.equal(c.vars.PLAYTT_PROBE_GATE, 'true'); assert.equal(c.vars.PLAYTT_STATE_PARTITION, 'restore-v1');
  assert.deepEqual(JSON.parse(c.vars.WORDPRESS_SITE_CONTEXTS), [{ id: 'default', hostname: new URL(origin).hostname, origin }]);
  assert.deepEqual(c.triggers.crons, []); assert.ok(!c.routes && !c.services && !c.vars.PLAYTT_MAINTENANCE_CRON);
  assert.ok(c.durable_objects.bindings.length === 3 && c.durable_objects.bindings.every(x => !x.script_name));
}

export async function prepare() {
  await validateConfig();
  let exists = false; try { await readFile(prefix + 'plan-private.json'); exists = true; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  assert.equal(exists, false, 'Do not overwrite an existing restoration plan');
  const root = await realpath('../../../../outputs/backups/cloudflare-wordpress-rebuild-ui');
  const catalog = await load('artifacts/playtt-backup-pins-catalog-private.json');
  const registryBytes = await readFile('artifacts/playtt-backup-pins-export-private.json'), registry = JSON.parse(registryBytes);
  assert.equal(registry.generation, 21); assert.equal(registry.pins.length, 21);
  const latest = await load('artifacts/playtt-rebuild-ui-backup-after-backup-pins-location-private.json');
  const directories = [...new Set([...catalog.backups.map(x => x.directory), latest.directory])];
  const objects = new Map(), pins = new Map(); let latestManifest, latestDecoded;
  for (const directory of directories) {
    assert.ok((await realpath(directory)).startsWith(root + sep));
    const verification = await load(directory + '/verification.json'); assert.equal(verification.result, 'pass'); assert.equal(verification.bucket, 'playtt-wordpress-rebuild-audit');
    const manifestBytes = await readFile(directory + '/manifest.json'), manifest = JSON.parse(manifestBytes);
    const pack = await readFile(directory + '/restore.zip'); assert.equal(sha(pack), verification.archiveSha256);
    const decoded = await decodeCanonicalRestorePack(manifest.restorePack, 'sites/default', { markdown: manifest.files, uploads: manifest.uploads || [], wpContent: manifest.wpContent || [], wpContentDeleted: manifest.wpContentDeleted || [] }, pack);
    const pin = registry.pins.find(p => p.revision === manifest.revision); assert.ok(pin);
    assert.equal(pin.manifestSha256, sha(manifestBytes)); assert.equal(pin.packSha256, sha(pack)); assert.equal(pin.packBytes, pack.length);
    pins.set(pin.revision, pin);
    for (const item of await load(directory + '/object-inventory.json')) {
      assert.ok(/^(objects\/[a-f0-9]{64}|manifest\.json|restore\.zip)$/.test(item.file));
      assert.ok(item.key.startsWith('sites/default/') && !item.key.includes('..') && !item.key.endsWith('/current.json'));
      const file = resolve(directory, item.file), bytes = await readFile(file);
      assert.equal(bytes.length, item.size); assert.equal(sha(bytes), item.sha256);
      const normalized = { key: item.key, size: item.size, sha256: item.sha256, file };
      if (objects.has(item.key)) { assert.equal(objects.get(item.key).sha256, item.sha256); assert.equal(objects.get(item.key).size, item.size); }
      else objects.set(item.key, normalized);
    }
    if (directory === latest.directory) { latestManifest = manifest; latestDecoded = decoded; assert.equal(manifest.revision, revision); assert.equal(sha(pack), archiveSha); }
  }
  assert.equal(pins.size, registry.pins.length);
  for (const [name, file] of [['wordpress-runtime-artifact', 'cloudflare-wordpress-runtime-corpus.zip'], ['wordpress-static-artifact', 'cloudflare-wordpress-static-corpus.bin'], ['sqlite-database-integration-artifact', 'cloudflare-sqlite-database-integration.zip']]) {
    const m = await load('assets/' + name + '.json'), expected = m.archive || m.blob, path = resolve('artifacts/' + file), bytes = await readFile(path);
    assert.ok(m.key.startsWith('runtime/')); assert.equal(bytes.length, expected.size); assert.equal(sha(bytes), expected.sha256);
    assert.ok(!objects.has(m.key)); objects.set(m.key, { key: m.key, file: path, size: bytes.length, sha256: expected.sha256 });
  }
  const metadata = [];
  for (const item of latestDecoded.markdown.filter(x => x.path.endsWith('.md'))) {
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(item.bytes), match = raw.match(/^---\n(.+?)\n---\n\n?(.*)/s); assert.ok(match);
    const front = YAML.parse(match[1]); const wp = front.wordpress; assert.ok(wp?.id && wp.type);
    let content = match[2];
    if (front.__playtt_content !== undefined) {
      const marker = front.__playtt_content.match(/^v1:(0|[1-9][0-9]*):([a-f0-9]{64})$/); assert.ok(marker && content.endsWith('\n'));
      content = content.slice(0, -1); assert.equal(Buffer.byteLength(content), Number(marker[1])); assert.equal(sha(content), marker[2]);
    } else content = content.replace(/[ \t\n\r\0\x0b]+$/g, '');
    metadata.push({ path: item.path, id: Number(wp.id), type: wp.type, slug: wp.slug, status: wp.status, parent: Number(wp.parent || 0), title: front.title || '', content, guid: wp.guid });
  }
  const table = path => JSON.parse(new TextDecoder().decode(latestDecoded.markdown.find(x => x.path === path).bytes));
  const sequence = table('_runtime/playtt-auto-increment.json'); assert.equal(sequence.sequences.wp_posts, '182');
  const all = [...objects.values()]; assert.ok(all.length < 1000); const totalBytes = all.reduce((n, x) => n + x.size, 0); assert.ok(totalBytes < 200000000);
  const plan = { schema: 'playtt/pin-restore-plan/v1', bucket, worker, origin, source, revision, archiveSha, latestDirectory: latest.directory,
    pointer: { revision, manifestKey: latestManifest.manifestKey, persistedAt: latestManifest.persistedAt },
    sourceRegistrySha256: sha(registryBytes), pins: [...pins.values()], objects: all, totalBytes,
    expected: { metadata, postsTable: table('_tables/posts.json'), postmeta: table('_tables/postmeta.json'), sequence, uploads: latestManifest.uploads, theme: '0.2.3' } };
  const raw = JSON.stringify(plan, null, 2); await writeFile(prefix + 'plan-private.json', raw);
  await report('preflight', { result: 'pass', scope: 'Offline complete union of all registered backup objects and pinned core assets; no target resources yet created',
    archivesDecoded: directories.length, protectedVersions: pins.size, uniqueObjects: all.length, payloadBytes: totalBytes, latestRevision: revision, sourceRegistrySha256: sha(registryBytes), privatePlanSha256: sha(raw), originalMarkdown: metadata.length, originalHistoryRows: plan.expected.postsTable.filter(x => x.post_type === 'revision').length });
}

export async function readPlan() {
  await validateConfig(); const bytes = await readFile(prefix + 'plan-private.json');
  const preflight = await load(prefix + 'preflight.json'); assert.equal(sha(bytes), preflight.privatePlanSha256);
  const p = JSON.parse(bytes); assert.equal(p.bucket, bucket); assert.equal(p.origin, origin); assert.equal(p.revision, revision); return p;
}

export function cli(args, input) {
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], { stdio: ['pipe', 'ignore', 'ignore'], env: { ...process.env, XDG_CONFIG_HOME: resolve('../../../playtt-wrangler-config') } });
    child.on('error', fail); child.on('exit', code => code === 0 ? done() : fail(Error('Scoped Wrangler operation failed with code ' + code)));
    child.stdin.end(input);
  });
}

export async function client(host = origin) {
  assert.ok([origin, source].includes(host)); const secrets = await load('../../../playtt-cms-secrets.json'), cookies = new Map(), checks = []; let nonce;
  const auth = { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN };
  async function request(path, options = {}, anonymous = false) {
    assert.ok(path.startsWith('/') && !path.startsWith('//')); const headers = new Headers(options.headers); headers.set('X-Playtt-Probe', secrets.WORDPRESS_OPERATOR_TOKEN);
    if (!anonymous) headers.set('cookie', [...cookies.values()].join('; '));
    const start = Date.now(), r = await fetch(host + path, { ...options, headers, redirect: 'manual', signal: AbortSignal.timeout(120000) });
    assert.equal(r.headers.get('x-playtt-probe-state'), 'restore-v1'); checks.push({ target: host === origin ? 'restore' : 'source', path, method: options.method || 'GET', status: r.status, wallMs: Date.now() - start });
    for (const raw of r.headers.getSetCookie()) { const value = raw.split(';')[0]; cookies.set(value.split('=')[0], value); } return r;
  }
  async function operator(phase, body) { const r = await request('/?phase=' + phase, { method: body ? 'POST' : 'GET', headers: { ...auth, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); assert.equal(r.status, 200, phase + ' status ' + r.status); return r.json(); }
  async function control(action) { const r = await request('/__playtt-publishing', { method: action ? 'POST' : 'GET', headers: { ...auth, 'content-type': 'application/json' }, body: action ? JSON.stringify({ action }) : undefined }); assert.equal(r.status, 200); return r.json(); }
  async function login() {
    assert.equal((await request('/wp-login.php')).status, 200);
    const r = await request('/wp-login.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ log: 'admin', pwd: secrets.WORDPRESS_ADMIN_PASSWORD, testcookie: '1', 'wp-submit': 'Log In', redirect_to: host + '/wp-admin/' }) });
    assert.equal(r.status, 302); assert.equal(new URL(r.headers.get('location'), host).origin, host);
    const page = await request('/wp-admin/'); assert.equal(page.status, 200); const html = await page.text(); assert.ok(html.includes('lang="zh-TW"')); nonce = html.match(/"nonce":"([^"]+)"/)?.[1]; assert.ok(nonce);
  }
  async function rest(path, body, method = body ? 'POST' : 'GET') { const r = await request('/wp-json/wp/v2/' + path, { method, headers: { 'x-wp-nonce': nonce, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json() }; }
  return { request, operator, control, login, rest, auth, checks };
}
