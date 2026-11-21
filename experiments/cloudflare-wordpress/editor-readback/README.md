# Draft response-loss readback experiment

When a native draft save commits but its response body is unavailable, the editor can report an invalid JSON response. Its saved-state button and error notice have separate update paths. In pinned WordPress 7.1.4, a successful autosave returns no success-notice arguments, while an explicit successful save replaces `editor-save`. This explains a possible stale-notice path; it does not establish which background request caused the earlier observed contradiction.

This ninth optional stage adds a narrowly scoped recovery candidate. **All twenty deployment configurations remain unchanged and the feature is disabled in all of them. No deployment or cloud write was performed.** Production Pages and its existing visual remain unchanged; PR #4 stays draft.

## Behavior and boundaries

The existing runtime-owned mu-plugin uses WordPress's block-editor enqueue hook and [api-fetch middleware](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-api-fetch/). Installation requires an editable existing draft page. The explicit runtime flag is `PLAYTT_EDITOR_READBACK=draft-readback-v1`; only local test bindings currently set it.

The middleware considers only that page's PUT/POST with a string content field and optional id, title, excerpt and draft status. It captures values before awaiting the request. Unknown fields (including metadata, dates and media), create, autosave, publish, delete, other origins, endpoint overrides and raw-response callers retain native behavior. No content is normalized, trimmed or replaced by rendered HTML.

A successful HTTP 200 whose body cannot be parsed, or an ambiguous native `fetch_error`, can trigger **one GET** with the existing authentication/nonce, a unique cache-busting query, no method-override/body, and a ten-second deadline. Definite HTTP failures, cancellation, mismatches, unsupported payloads and failed readback preserve the original save error. The middleware never replays a write and never directly dismisses notices. Native api-fetch's unrelated nonce behavior remains native.

The dedicated GET holds the normal coordinator lease and reads from a newly hydrated durable snapshot. It supplies version/revision headers plus `x-playtt-draft-readback: canonical-v1`, disposes its runtime and releases the lease without promoting native incidental changes or retirement inventory. The client requires those headers and exact id, page type, draft status and every outgoing supported raw field before returning the actual record to the native save flow.

A warm runtime may contain an auto-draft created by an intervening native GET. A clean marker is set only when a mutation's runtime is promoted after persistence; every PHP consumer clears it. If the current warm view is unsettled, readback returns 409 and preserves that runtime. It does not discard native transient inventory merely to clear a save error. The coordinator guard and marker invalidation are exercised using the actual runtime functions in deterministic tests; multi-tab native acceptance remains open.

Readback establishes that the requested fields exist in a durable snapshot at the read time. It is not an operation receipt proving which actor wrote them or that arbitrary third-party plugin side effects ran exactly once. Broader payloads are deliberately unsupported in this experiment.

## Local evidence, 2026-11-21

The initial attempt correctly refused recovery because ordinary native GET responses lack canonical headers. Its error stayed visible and no save was replayed. A second candidate added fresh durable reads and passed the native workflow. The final candidate additionally protects unsettled warm inventory and was exercised again with a new independent local backup copy.

Final Chrome flow: login, open owned draft193, append one Traditional Chinese paragraph, click Save draft once, lose the successful body after actual commit, observe native `草稿已儲存。` with no error, close the tab, fully replace workerd, reopen with the same session, and compare the native code-editor textarea with the exact expected content. No retry was clicked. Five paragraphs remain. Both final tabs and the bounded emulator are closed.

Final local versions: before122 → committed125 → readback125 → final134. There is exactly one matching readback and no matching save retry. The fault and readback snapshots have identical canonical files, including the same revision. The read trace is cold, takes2241ms locally and has no commit phase. Across this run,33/33 traces complete without a recorded request failure; one full pack is2,294,484bytes. These are local observations, not provider latency, free-tier memory or billing measurements. Existing native global-styles warnings remain.

Exact audit permits only owned draft193/content metadata, revision201, edit-lock72, administrator native preferences21 and monotonic counters. Prior revisions194/195/196/200, other rows/files, accounts/sessions, media and theme are preserved. The captured comparison begins after login, so it does not claim the login itself made no session write. There is no extra page or revision from readback/reload.

Twenty-five focused/regression tests, TypeScript and private-config dry-run pass. The final bundle is20882.03KiB/gzip7608.11KiB before any provider enablement; generated PHP loader eval/duplicate-key warnings remain. Source-only reassembly compares75 sources and82 helpers/prerequisites through25 adopted and9 optional stages; all20 configs remain identical. Dependencies/core binaries were not regenerated this round. After the browser run, the cache guard was refactored to retain only a boolean across disposal; the11 focused checks, TypeScript, dry-run and full source reconstruction were rerun. No browser actions were replayed for that scalar-lifetime change.

Read-only cloud status at00:26:55Z remains canonical118 / `207cc3ef-5e65-463d-857c-b8e4c2ad3e89`,8 pins, pending0, window closed/expired, sealed, fence released and publisher paused. Remaining allowance is10,232,130bytes; deployed version remains2353ff34. The feature is not enabled remotely.

## Reproduction

Apply after the preceding eight optional stages and the exact WordPress7.1.4 static manifest described in [REBUILD.md](../REBUILD.md). The apply tool validates every input and prepared output before modifying files, and refuses reapplication. It does not enable a flag or deploy.

```powershell
python apply-local-candidate.py --runtime <runtime-cloudflare>
python apply-local-candidate.py --runtime <runtime-cloudflare> --apply
node --import tsx --test tests/playtt-editor-readback.test.mjs tests/playtt-editor-lock.test.mjs tests/playtt-write-window-execution.test.mjs tests/playtt-session-provider-config.test.ts
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

The delivered server is **local-only, never deployable**: it has an unauthenticated local import control, binds127.0.0.1:9449, forbids Worker egress and stops after900seconds. Prepare the hash-verified canonical118 backup, three core assets and private owner/credential files used by the preceding stage. Existing attempt owner files refuse a restart; do not delete guards or replay completed operations. Confirm the old server's command is terminal before using its port.

Run `node --import tsx scripts/playtt-readback-guard-ui.mjs --local`. With the Browser skill, log in and open the owned draft. Run `node scripts/playtt-readback-guard-ui-control.mjs before --local`, then enter the owner file's expectedContent and click the native save once. `status` only observes receipts. After native success, capture `fault` and `readback`, close the tab, issue `restart` once, reopen and check the native textarea, close it, then `finish`. A control timeout is a reason to inspect the same command/server, not resend it. Run `node scripts/playtt-readback-ui-audit.mjs` only after actual browser evidence is saved; do not fabricate browser flags from HTTP success.

The first helper-generation attempt stopped on Windows text decoding before creating a server; UTF-8 was made explicit. A browser observation preceded the final server's owner-file creation; readiness was checked without restarting. A sandboxed remote status lookup failed DNS, then the same read-only query succeeded with network permission. These are retained as tool failures, not counted as successful tests.

Evidence: [summary](../../../docs/verification/cloudflare-readback-summary.json), [exact audit](../../../docs/verification/cloudflare-readback-audit.json), [reassembly](../../../docs/verification/cloudflare-readback-reassembly.json). Provider response loss, concurrent native editors, unsupported-edit UX, representative latency/whole-isolate memory, full-pack cost, physical devices/IME and long-term free operation remain open. Use the existing quota; do not reset accounting, increase its cap, prune history or enable production to make a test pass.
