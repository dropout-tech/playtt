// Offline receipts and sanitized tail inspection. No provider calls or writes.
import assert from 'node:assert/strict';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
assert.deepEqual(process.argv.slice(2), ['--offline']);
const prefix = 'artifacts/playtt-content-io-provider-', load = async p => JSON.parse(await readFile(p, 'utf8'));
const lines = async p => (await readFile(p, 'utf8')).trim().split('\n').filter(Boolean).map(x => JSON.parse(x));
const run = await load(prefix + 'result.json'), owner = await load(prefix + 'owned-private.json');
const backup = await load(prefix + 'backup-result.json'), copy = await load(prefix + 'backup-inspection.json');
const cold = await load(prefix + 'cold-result.json'), latestOwner = await load(prefix + 'cold-owned-private.json');
const version = await load(prefix + 'final-version-private.json'), prior = await load('artifacts/playtt-content-provider-result.json');
const primary = await lines('artifacts/playtt-session-provider-content-io-observation.jsonl');
const afterDeploy = await lines('artifacts/playtt-session-provider-content-io-cold-observation.jsonl');
const ready = await load('artifacts/playtt-session-provider-content-io-ready.json'), coldReady = await load('artifacts/playtt-session-provider-content-io-cold-ready.json');
assert.equal(run.result, 'pass'); assert.equal(run.contained, true); assert.equal(run.nativeRequests, 8); assert.equal(run.nativeEditorPolicyExact, true);
assert.equal(run.reconciled, true); assert.equal(run.coldReadContentExact, true); assert.equal(run.nativeLogoutCompleted, true);
assert.deepEqual(run.transportAttempts.map(r => r.method), ['POST', 'GET']);
const [save, read] = run.transportCalls; assert.equal(save.version, 129); assert.equal(read.version, 129); assert.equal(save.revision, read.revision);
assert.equal(read.contentSha256, run.committed.contentSha256); assert.equal(run.after.state.version, 130);
assert.equal(owner.phase, 'closed-sealed'); assert.equal(latestOwner.phase, 'closed-sealed');
assert.equal(backup.result, 'pass'); assert.equal(backup.finalPins, 11); assert.equal(backup.canonicalVersion, 130);
assert.equal(backup.independentCopyVerified, true); assert.equal(backup.sessionsPreferencesAccountsExact, true); assert.equal(backup.otherRevisionsExact, true);
assert.equal(backup.mediaAndThemeExact, true); assert.equal(copy.fullMaterializationExact, true); assert.equal(copy.baseUnchanged, true);
assert.equal(copy.remoteGets, 8); assert.equal(copy.files, 298); assert.equal(copy.objects, 303);
assert.equal(cold.result, 'pass'); assert.equal(cold.contained, true); assert.equal(cold.stateAndAccountingUnchanged, true); assert.equal(cold.httpStatus, 200);
const final = cold.after; assert.equal(final.state.version, 130); assert.equal(final.state.pointer.revision, backup.anchor.revision);
assert.equal(final.pins, 11); assert.equal(final.budget.remainingBytes, 5935730); assert.equal(final.budget.writeTracking.pending, 0);
assert.equal(final.budget.writeTracking.sealed, true); assert.equal(final.budget.writeTracking.window.closed, true); assert.equal(final.fenceActive, false); assert.equal(final.publisher, 'paused');
assert.equal(final.budget.writeTracking.window.usedBytes, 0); assert.equal(final.budget.writeTracking.window.operations, 0);
assert.equal(version.id, '1c55f0fa-5b78-4f39-917d-9a0b03e7d1ab');
const bindings = version.resources.bindings.map(b => b.name); assert.ok(!bindings.includes('PLAYTT_CONTENT_OVERLAY')); assert.ok(!bindings.includes('PLAYTT_EDITOR_READBACK'));
assert.equal(ready.version, 'bf3d6b4e-4070-4b9e-8e35-20ee9d94c733'); assert.equal(ready.operatorEventObserved, true);
assert.equal(coldReady.version, version.id); assert.equal(coldReady.operatorEventObserved, true);
assert.ok(Date.parse(ready.at) < Date.parse(run.at)); assert.ok(Date.parse(coldReady.at) < Date.parse(cold.at));
for (const [path, expected] of Object.entries(run.sourceHashes)) assert.equal(createHash('sha256').update((await readFile(path, 'utf8')).replaceAll('\r\n', '\n')).digest('hex'), expected);
for (const events of [primary, afterDeploy]) {
  assert.ok(events.every(e => e.outcome === 'ok')); assert.equal(events.flatMap(e => e.exceptions).length, 0);
  assert.equal(events.flatMap(e => e.requestFailures || []).length, 0);
}
const traces = primary.flatMap(e => e.traces); assert.equal(traces.length, 7); assert.ok(traces.every(t => t.completed));
const saved = traces.find(t => t.operation === 'mutation' && t.totalMs === 4865); assert.ok(saved);
const recovered = traces[traces.indexOf(saved) + 1], ordinary = traces[traces.indexOf(saved) + 2];
for (const t of [recovered, ordinary]) { assert.equal(t.operation, 'read'); assert.equal(t.runtime, 'cold'); assert.ok(t.phases.some(p => p.name === 'canonical.metadata-overlay.restore')); }
assert.equal(recovered.phases.some(p => /commit|retirement.persist|canonical.persist|canonical.changes.collect/.test(p.name)), false);
assert.equal(primary.flatMap(e => e.snapshotPhases).filter(p => p.stage === 'encode-and-upload').length, 0);
const postNative = afterDeploy.filter(e => e.request?.category === 'wp-login'); assert.equal(postNative.length, 0);
assert.equal(afterDeploy.flatMap(e => e.traces).length, 0);
for (const p of [prefix + 'tail-private.log', prefix + 'cold-tail-private.log']) assert.ok((await readFile(p, 'utf8')).trim().endsWith('{"tailEnded":null}'));
// Readiness was real, but the bounded second observer expired before the
// native request began. File mtime is the locally recorded terminal log time.
const coldObserverEndedAt = (await stat(prefix + 'cold-tail-private.log')).mtime;
assert.ok(coldObserverEndedAt.getTime() < Date.parse(cold.at));
for (const [p, id] of [['enable-deploy.log', ready.version], ['disabled-deploy.log', version.id]]) assert.ok((await readFile(prefix + p, 'utf8')).includes('Current Version ID: ' + id));
const phase = (t, name) => t.phases.find(p => p.name === name)?.durationMs;
const summary = {
  at: new Date().toISOString(), result: 'pass-with-observation-gap', scope: 'Existing private provider bounded content-object reads, exact save/recovery/backup; final login read succeeds but its observer ended early; production unchanged', sourceHashes: run.sourceHashes,
  deployments: { temporaryEnabled: ready.version, finalCompatibleFlagsDisabled: version.id, actualFlagsAbsent: true, configsChanged: 0, productionChanged: false },
  native: { requests: 8, writeAttempts: 1, readbackAttempts: 1, saveVersion: 129, readbackVersion: 129, finalVersion: 130, contentExact: true, sameSessionColdReadExact: true, nativeLogoutCompleted: true, saveWallMs: save.wallMs, readbackWallMs: read.wallMs, workflowMs: run.clientWorkflowMs },
  comparison: { priorSaveWallMs: prior.transportCalls[0].wallMs, priorReadbackWallMs: prior.transportCalls[1].wallMs, priorWorkflowMs: prior.clientWorkflowMs, currentSaveTraceMs: saved.totalMs, currentMarkdownWriteMs: phase(saved, 'persistence.markdown.write'), currentManifestWriteMs: phase(saved, 'persistence.manifest.write'), scope: 'One sequential run per source, different paragraph and larger accumulated content. Network variation and unchanged Markdown work also affect latency. No stable speedup or causal percentage claimed.' },
  telemetry: { mainEvents: primary.length, completedTraces: traces.length, traces: traces.length, allCapturedCompleted: true, observedExceptions: 0, observedRequestFailures: 0, readbackColdTraceMs: recovered.totalMs, subsequentColdReadTraceMs: ordinary.totalMs, fullPackWritesObserved: 0, maximumSampledWasmHeapBytes: Math.max(...primary.flatMap(e => e.memory).map(m => m.heapBytes || 0)), wholeIsolateMemoryMeasured: false, tailReadyBeforeNativeCalls: true, mainSeconds: 330, coldSeconds: 90, allObserversEnded: true, initialLoginPhpTraceMissing: true },
  accounting: { actualBytes: run.chargedBytes, actualPuts: run.chargedPuts, windowSeconds: 180, maxBytes: run.limits.maxBytes, maxOperations: run.limits.maxOperations, chargedBytes: final.budget.chargedBytes, chargedPuts: final.budget.chargedPuts, remainingBytes: final.budget.remainingBytes, appendedContentBytes: Buffer.byteLength(owner.expectedContent) - Buffer.byteLength(owner.expectedBefore.content), noCapIncreaseOrRefundOrPruning: true },
  backup: { version: 130, revision: backup.anchor.revision, manifestSha256: backup.anchor.manifestSha256, files: 298, objects: 303, pins: 11, remoteGets: copy.remoteGets, downloadedBytes: copy.downloadedBytes, basePackBytes: backup.anchor.packBytes, basePackUnchanged: true, expectedAddedRevision: '203', otherRowsFilesMediaThemeExact: true, independentCopyExact: true, fullMaterializationExact: true, oldPinsRetained: true },
  postRedeploy: { login200: true, wallMs: cold.wallMs, bodyBytes: cold.bodyBytes, zeroWriteWindow: true, actualBytes: 0, actualOperations: 0, coherentStateUnchanged: true, events: afterDeploy.length, phpTraces: 0, nativeOuterEvents: 0, tailHadPreviouslyBecomeReady: true, observerEndedAt: coldObserverEndedAt.toISOString(), nativeWindowStartedAt: cold.at, observerEndedBeforeNativeWindow: true, coldHydrationDirectlyObserved: false, serverTimingCount: cold.serverTiming.length, timingHeaderScope: 'worker.ts attaches Server-Timing only for health/probe routes; empty native-login timing does not diagnose failure', sourceRouteAudit: 'Login is excluded from page/publication caching; wrapper dispatches it to PHP DO. Source route and HTTP200 are not a captured cold trace.' },
  final: { version: 130, revision: backup.anchor.revision, pins: 11, remainingBytes: final.budget.remainingBytes, sealed: true, closed: true, pending: 0, fenceActive: false, publisher: 'paused' },
  limitations: ['Provider UI/browser/IME, physical devices and real disconnects remain untested for this candidate.', 'One save was4677ms versus prior6031ms; subsequent ordinary cold read was slower. Do not claim stable latency improvement.', 'Whole-isolate memory is unmeasured. WASM samples do not prove peak memory safety.', 'The90second final observer became ready but ended before the native request. Its11events contain no native request; readiness alone is insufficient. Future exercise and observation must share orchestration and an active-deadline guard. Initial-login PHP trace in the main run is also missing, while authenticated cold content reads were directly captured.', 'Serial Markdown writes, sustainable Free history, concurrency and mixed-version provider restore remain open. Old-source rollback still requires verified full materialization.'],
};
await writeFile(prefix + 'inspection.json', JSON.stringify(summary, null, 2) + '\n'); console.log(JSON.stringify(summary));
