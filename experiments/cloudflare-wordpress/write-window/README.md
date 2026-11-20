# Bounded private write window — optional, local candidate

An interrupted browser session previously kept generating snapshots until an operator acquired the write seal. This candidate makes the private backend check a persisted deadline, byte allowance and operation allowance before admitting new work. It is not adopted or deployed. Production Pages and the original brand visuals remain unchanged. The existing nearly-full private target must remain sealed.

Apply this optional patch after `metadata-overlay` and `snapshot-bundle`. The default assembler excludes all three candidates. No existing Wrangler config enables `PLAYTT_R2_WRITE_WINDOW` or `PLAYTT_METADATA_OVERLAY`.

## Enforcement and accounting

`PLAYTT_R2_WRITE_WINDOW=v1` requires the existing capacity guard and write tracking. A configured but unarmed backend fails closed. The budget Durable Object stores a random public window ID, private owner identity, opening/deadline times, allowance, baseline charge and operation count. Maximum bounds are 15 minutes, 32 MiB of attempted payload and 512 operations; an operator must choose smaller limits within verified overall headroom. These maximums are implementation bounds, not available Free-plan allocations.

Reservations atomically verify the deadline and both allowances, open a durable ticket, charge attempted payload and increment operations. Deletes and zero-byte puts count as operations. Rejected reservations change neither tickets nor charges. Failed, conditional or overwritten writes retain their charge. Once the byte allowance is exhausted, zero-byte mutations also stop.

The caller validates the window-aware reservation and checks its deadline immediately before dispatching R2. An already expired valid proof cannot authorize a put/delete. The caller may acknowledge that ticket only when it knows R2 was never dispatched; the charge and operation count remain. Lost/malformed proofs and ambiguous R2 failures remain pending. A failed no-dispatch acknowledgement likewise retains the ticket. Settlement retries do not repeat R2 or reserve another allowance.

Already dispatched R2 calls may finish after expiry and settle according to their actual result. Expiry does not cancel such calls, expire unknown tickets, acquire a write seal, release a canonical lease or prove all work drained. There is no automatic refund, clear, rearm or ledger reset.

The execution queue checks admission when each queued request starts, before PHP/publication work. Publication resume/retry and alarms also check it. Pause/status and the exact canonical fence routes remain reachable; real runtime fence authentication is unchanged. No new alarm is scheduled when an expired/closed window blocks a publisher alarm. A request admitted just before expiry can continue executing PHP; every subsequent R2 mutation still needs a valid reservation. Static reads/control traffic, storage reads, CPU, DO requests and other clients' writes are not bounded by this payload mechanism. It is not an account spending cap or a full request-rate limiter.

## Ownership, restart and rollback

Arming requires authenticated operator access, a renewed canonical fence, the exact owner-held R2 seal and zero pending operations. It does not release either barrier. Replacing a window additionally requires its previous private owner identity. Retrying the same identity and bounds returns the original window without extending its deadline, resetting allowance or reopening it, including after closure or expiry.

An authenticated operator can close admission with the private window token even while writes are pending; close does not claim those writes have drained. A stale owner cannot close a later window. Status omits owner tokens and ticket identities.

Arming upgrades durable write tracking from `playtt/r2-write-tracking/v1` to `v2`. New code enforces stored v2 even if the config flag is removed; an older caller's reservation is refused. The exact previous validator rejects v2. Consequently, a code-only rollback is fail-closed and can make control APIs unavailable. Recovery/downgrade must retain a compatible tracking reader. Full operational rollback and mixed-version Cloudflare deployment are still pending acceptance; do not erase or downgrade the ledger to bypass this boundary.

Future private operator sequence, after verified capacity and backup preparation:

1. Keep publishing paused. Acquire the canonical fence, confirm the previous writes have settled, then acquire the exact owned R2 seal.
2. Send `arm-write-window` to the authenticated capacity endpoint with `fenceToken`, `drainToken`, a new `windowToken`, `previousWindowToken` (null for the first window), and explicit `durationSeconds`, `maxBytes`, `maxOperations`.
3. Read back the window and allowances; release the R2 seal and canonical fence separately before any editor navigation. Arming starts the deadline immediately, including preparation time.
4. Let expiry reject new work, or use `close-write-window` with the current owner token. Verify pending operations, acquire the canonical fence and owned seal, and verify/register a complete backup. Unknown operations must remain pending for reconciliation.

This sequence is documentation, not an instruction to unseal the current target. No new operator runner, remote resource, window or capacity increase was created in this stage.

## Reproduction and evidence

Run the default pinned upstream assembler into a new directory, apply `metadata-overlay`, then `snapshot-bundle`, then this directory's `apply-local-candidate.py --runtime <runtime> --apply`. The script verifies 20 prerequisite identities, three exact baseline files and five added files. It does not install dependencies, enable flags, authenticate or deploy. Reapplying is rejected before mutation.

Run with the already pinned dependency installation:

```text
node --import tsx --test tests/playtt-write-window.test.ts tests/playtt-write-window-execution.test.mjs tests/playtt-write-drain.test.ts tests/playtt-write-ack-retry.test.ts tests/playtt-storage-capacity.test.ts tests/playtt-reference-roots.test.ts tests/playtt-reference-coverage.test.ts tests/playtt-backup-pins.test.ts tests/playtt-metadata-overlay.test.ts tests/playtt-snapshot-bundle.test.ts tests/playtt-snapshot-source.test.ts
node scripts/playtt-write-window-local.mjs
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

- **128 related tests pass**, including 22 window/accounting cases and four execution queue/publisher cases. The queue test bundles the actual execution class but replaces the PHP/runtime calls with spies; it does not test real operator HTTP authentication or WordPress behavior.
- The legacy fixture is the exact previous write-tracking module, SHA-256 `973f5ce6cc749ad7e5bc377a16b0331179dff60ec4e9074c07844318e799f49f`. Its validator rejects armed v2 state while accepting v1.
- The local harness runs actual workerd, a SQLite Durable Object and local R2. After disposing and restarting the instance, the original object, deadline and charge persist. At expiry admission/put/delete are denied and the object is unchanged. Exact retry keeps the deadline; a separately owned new window works; stale close is rejected. Final pending count is zero and the local ledger is sealed. Both instances are disposed.
- This harness is deliberately unauthenticated and **must never be deployed**. It binds loopback, disables telemetry/CF lookup, blocks outbound requests and recorded zero outbound attempts. Only synthetic state is persisted, using short temporary paths for Windows SQLite compatibility. The installed Miniflare 5 alpha uses `convertV4MiniflareOptions` plus its current resource persistence paths; older `r2Persist`/`durableObjectsPersist` options did not retain state in the initial attempt. The final restart test passes.
- TypeScript and full Worker Wrangler dry-run pass. Dry-run reports 7,603.39 KiB gzip and existing loader direct-eval/duplicate-constant warnings. This is not proof of provider deployment or Free-plan acceptance.
- Clean assembly applies 25 adopted patches plus three optional patches, matches 70 non-generated source files and 20 optional helper/fixture files, and checks all 18 Wrangler configs leave the flags absent. The generated PHP loader is excluded under the same rule as the default assembler.

Reports are `docs/verification/cloudflare-write-window-*`. No Cloudflare request, mutation, deployment, pin registration, cleanup, history deletion, capacity increase or ledger reset/refund occurred in this stage. Cloud state was not freshly queried: the last verified target remains dc9704f3 / canonical62, 25 pins, pending0, write-sealed and publisher-paused, with draft192 retained and 2,141,868 bytes of headroom. Do not confuse these historical readings with this local harness.

Next verify current account/Free-plan conditions and private test headroom, prepare an isolated capped provider run, and validate window enforcement together with real restore/pins/coordinator and native editor heartbeat/error/retry. Whole-isolate memory, cold/save latency, concurrent editors, devices/IME, operational rollback and sustained free usage remain open. PR #4 remains draft and the goal active.
