// Four GET-only operator requests; never opens a window or changes state.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
assert.deepEqual(process.argv.slice(2), ['--remote-read-only']);
const secrets = JSON.parse(await readFile('../../../playtt-cms-secrets.json', 'utf8'));
const origin = 'https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
async function get(path) {
  const r = await fetch(origin + path, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(45000), headers: { authorization: 'Bearer ' + secrets.WORDPRESS_OPERATOR_TOKEN, 'X-Playtt-Probe': secrets.WORDPRESS_OPERATOR_TOKEN } });
  assert.equal(r.status, 200, 'Operator read failed'); return r.json();
}
const outcomes = await Promise.allSettled(['/?phase=operator-fence-status', '/__playtt-capacity', '/__playtt-backup-pins', '/__playtt-publishing'].map(get));
const failed = outcomes.find(r => r.status === 'rejected'); if (failed) throw failed.reason;
const [s, budget, pins, publisher] = outcomes.map(r => r.value);
assert.equal(s.coherent, true); assert.equal(s.state.version, 130); assert.equal(s.state.pointer.revision, '566e44a3-c953-423e-adde-2b0124ece358');
assert.equal(s.fence.active, false); assert.equal(budget.writeTracking.pending, 0); assert.equal(budget.writeTracking.sealed, true); assert.equal(budget.writeTracking.window.closed, true);
assert.equal(budget.remainingBytes, 5935730); assert.equal(pins.generation, 11); assert.equal(publisher.state, 'paused');
const report = { at: new Date().toISOString(), result: 'pass', scope: 'Four GET-only existing-private-project status requests', canonicalVersion: s.state.version, revision: s.state.pointer.revision, pins: pins.generation, coherent: s.coherent, fenceActive: s.fence.active, pending: budget.writeTracking.pending, sealed: budget.writeTracking.sealed, windowClosed: budget.writeTracking.window.closed, publisher: publisher.state, remainingBytes: budget.remainingBytes, mutatingRequests: 0, productionRequests: 0 };
await writeFile('artifacts/playtt-markdown-write-status.json', JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report));
