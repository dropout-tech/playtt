# Bounded content-object reads — private validation

Content snapshots reduced bytes written, but the private provider save still took about six seconds. Each cumulative replacement was read and verified serially. This eleventh optional stage limits that verification and cold-restore loading to **four concurrent objects**, including body consumption and SHA-256 verification. Only `src/playtt-content-overlay.ts` changes. Storage schema, full-base identity, exact bytes, limits, flags, canonical commits and existing v1/v2 readers are unchanged.

The complete replacement set is already limited to 1 MiB and 64 entries before any replacement reads start. The writer discards each verified buffer. The reader retains at most the existing cumulative replacement allowance alongside the decoded base and emits files in manifest order, regardless of completion order. These are application byte bounds, not a measurement of total isolate memory or JavaScript overhead.

On a missing object, body error or hash mismatch, the pool stops scheduling work as soon as the error is observed and waits for all started reads before rejecting. It never returns an incomplete descriptor or restored inventory. The existing lease owner therefore does not see a detached read after this function returns. The full archive is still verified before replacement loading on restore; saves still recheck the committed/base manifests. Zero-file and zero-byte cases retain their semantics.

## Validation

- 10 new public-path tests cover four-read limits through body consumption, reverse completion, write/read failures during GET/body/hash verification, draining before rejection, exactly 64 replacements / 1 MiB, and an empty delta. Ten content-format checks and 95 related overlay/backup/readback/window regressions pass: **115 distinct checks**.
- TypeScript and the existing session-audit dry-run pass: 20892.99 KiB / gzip 7609.56 KiB. Existing generated-loader eval/duplicate-key warnings remain.
- Real local WordPress7.1.4 starts from the independently verified backup126. Login127 → save128 → complete workerd restart and exact readback → same-content retry129. Only expected revision203 is added; the retry adds none. Existing content, relationships, sessions, media and theme retain the previously tested exactness invariants. No complete ZIP is created while the writer is enabled.
- Independent bundle import and full materialization match. Disabling the writer locally makes the next native save130 use a full snapshot, which reads exactly after another complete restart. All10native traces complete, all local runtimes are disposed, and external requests remain0.

The fixed-backup comparison runs both the hash-pinned serial module and candidate with identical bytes and GET counts, alternating order. It uses three samples per variant and operation at each injected delay:

| Synthetic delay per GET | Operation | Serial median | Four-read median |
| --- | --- | --- | --- |
| 0 ms | Verify replacements | 5.11 ms | 4.84 ms |
| 0 ms | Restore snapshot | 303.22 ms | 304.08 ms |
| 25 ms | Verify replacements | 223.79 ms | 124.08 ms |
| 25 ms | Restore snapshot | 514.92 ms | 433.87 ms |

This supports reduced serial waiting when object latency exists. It is **not Cloudflare latency, a billing improvement, or a whole-isolate memory result**. Markdown persistence is still serial, and actual provider save time remains unverified for this candidate.

## Reproduce

Apply the25adopted patches and preceding10optional stages using [REBUILD](../REBUILD.md), then:

```text
python experiments/cloudflare-wordpress/content-io/apply-local-candidate.py --runtime <fresh-output>/packages/runtime-cloudflare
python experiments/cloudflare-wordpress/content-io/apply-local-candidate.py --runtime <fresh-output>/packages/runtime-cloudflare --apply
node --import tsx --test tests/playtt-content-io.test.ts tests/playtt-content-overlay.test.ts
```

The applier checks all prerequisites and prepares all eleven changed/new files before touching the target; reapplication refuses before mutation. Fresh reconstruction matches76runtime sources /112helpers and prerequisites. All20configs are unchanged, with content/readback flags absent. Default assembly excludes optional stages.

`playtt-content-io-local.mjs --local` makes a new private local copy of verified backup126, listens only on127.0.0.1:9452 and rejects outbound requests. It requires the local backup/owner/credential files; never deploy its fault wrapper. `playtt-content-io-benchmark.mjs --local` requires that backup and the prior provider assembly at its sibling path; it pins the serial source hash before comparing it. `playtt-content-io-status.mjs --remote-read-only` preserves its historical126/pin10guard and will refuse the current130state; it never opens a window. The new provider helper's `status --remote` reads the current state without mutation.

## Private provider validation, 2026-11-21

The previously local candidate is now validated on the existing session-audit Worker. Runtime source remains commitbbe6a4d; this follow-up adds six guarded provider/backup/pin/observation/inspection helpers, with no additional runtime or config changes. Temporary deploymentbf3d6b4e enabled content/readback flags for one bounded exercise.

Eight native HTTP requests complete editor2 login, native editor HTML with exact middleware, save129, client-side response suppression followed by one exact authenticated readback, an ordinary cold same-session read and native logout130. The client uses pinned api-fetch in a Node VM; this is not browser UI or a real network disconnection. Save4677ms, readback3118ms, workflow7801ms; prior values6031/3784/9822ms. This is one run per source with a different paragraph and growing content. Network variance affects unchanged Markdown work too; the following ordinary cold trace is slower than before. Do not claim a stable speedup or causal percentage.

Main330-second observation captures149events and7completed traces, with0observed exceptions/request failures. The save trace is4865ms, including2356msMarkdown writes and1659msmanifest persistence. Authenticated readback is cold1538ms; subsequent ordinary read is cold3861ms. No full ZIP write is observed. Sampled WASM heap peaks at73,400,320bytes; whole-isolate memory is unmeasured. The initial login's PHP trace is absent even though a matching operator event proved the observer ready.

The180-second/2MiB/64-operation window consumes669,248bytes/17puts, then closes/seals. Complete backup downloads8objects/2,796,862bytes; independent import verifies298files/303objects and full materialization is exact. Only owned193 content/date, expected revision203, lock72 and counters change from126; prior revisions, accounts/session/preferences, media/theme remain exact. Server verification adds **pin11**, retaining the prior10pins, without changing canonical state or R2 accounting.

Final compatible deployment **1c55f0fa-5b78-4f39-917d-9a0b03e7d1ab** retains the bounded reader; actual bindings omit both experimental flags. A separate90-second/1-byte/1-operation window returns native login200 in3271ms and records **0bytes/0operations**, then reseals. Its observer had become ready but ended at03:55:52.688Z, before the native window started at03:56:06.520Z. Its11events contain no native request or PHP trace. This is a diagnostic scheduling failure, not evidence of cold hydration or a WordPress failure. Native routes do not emit Server-Timing by design; source dispatch excludes login from page caching, but source inference cannot replace a provider trace. Future observation and exercise must share orchestration with an active-deadline guard; do not repeat this completed one-shot solely to improve logs.

Current state: **canonical130 /566e44a3-c953-423e-adde-2b0124ece358**,11pins, pending0, closed/sealed, fence released, publisher paused, **5,935,730bytes remaining**. Last1bytewindow used0. All observers/tests/deployments ended. The account UI before testing showed Workers Free and R2$0.00,2.32GB,7.14kClassA/59kClassB (displays may lag). No cap increase, refund, pruning or paid change.

The latest window owner is now `artifacts/playtt-content-io-provider-cold-owned-private.json`, and complete verified backup is `playtt-content-io-provider-backup-owned-private.json`. Earlier window tokens and126baselines are stale. Preserve prior helpers and their guards; future mutations require a new guarded one-shot helper. Current data is content-v1, so legacy-reader rollback still requires full materialization.

25+11stages reconstruct76sources/112helpers;20configs unchanged, reapplication refuses. The prior115runtime checks remain applicable because this follow-up does not alter runtime source. Helpers pass syntax/preflight and actual provider checks; offline inspection explicitly returns `pass-with-observation-gap`.

Next reduce serial Markdown persistence, while keeping immutable hashes, byte limits, failure draining and commit/lease behavior. Actual browser/IME, whole-isolate memory, concurrent requests, sustainable Free history, mixed-version provider restore and physical devices remain open. Production Pages/current visual stay unchanged, PR4 stays draft and the goal remains active. New evidence: `docs/verification/cloudflare-content-io-provider-*`.
