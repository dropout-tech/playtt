# Draft response-loss readback experiment

When a native draft save commits but its response body is unavailable, the editor can report an invalid JSON response. Its saved-state button and error notice have separate update paths. In pinned WordPress 7.1.4, a successful autosave returns no success-notice arguments, while an explicit successful save replaces `editor-save`. This explains a possible stale-notice path; it does not establish which background request caused the earlier observed contradiction.

This ninth optional stage adds a narrowly scoped recovery candidate. **All twenty checked-in deployment configurations omit the flag. A bounded private provider exercise temporarily enabled it with a CLI override, then redeployed the original configuration and verified the actual flag was absent.** Production Pages and its existing visual remain unchanged; PR #4 stays draft.

## Behavior and boundaries

The existing runtime-owned mu-plugin uses WordPress's block-editor enqueue hook and [api-fetch middleware](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-api-fetch/). Installation requires an editable existing draft page. The explicit runtime flag is `PLAYTT_EDITOR_READBACK=draft-readback-v1`; only local test bindings currently set it.

The middleware considers only that page's PUT/POST with a string content field and optional id, title, excerpt and draft status. It captures values before awaiting the request. Unknown fields (including metadata, dates and media), create, autosave, publish, delete, other origins, endpoint overrides and raw-response callers retain native behavior. No content is normalized, trimmed or replaced by rendered HTML.

A successful HTTP 200 whose body cannot be parsed, or an ambiguous native `fetch_error`, can trigger **one GET** with the existing authentication/nonce, a unique cache-busting query, no method-override/body, and a ten-second deadline. Definite HTTP failures, cancellation, mismatches, unsupported payloads and failed readback preserve the original save error. The middleware never replays a write and never directly dismisses notices. Native api-fetch's unrelated nonce behavior remains native.

The dedicated GET holds the normal coordinator lease and reads from a newly hydrated durable snapshot. It supplies version/revision headers plus `x-playtt-draft-readback: canonical-v1`, disposes its runtime and releases the lease without promoting native incidental changes or retirement inventory. The client requires those headers and exact id, page type, draft status and every outgoing supported raw field before returning the actual record to the native save flow.

A warm runtime may contain an auto-draft created by an intervening native GET. A clean marker is set only when a mutation's runtime is promoted after persistence; every PHP consumer clears it. If the current warm view is unsettled, readback returns 409 and preserves that runtime. It does not discard native transient inventory merely to clear a save error. The coordinator guard and marker invalidation are exercised using the actual runtime functions in deterministic tests; the bounded native two-tab scenario below now also passes; broader concurrent-editor acceptance remains open.

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

Evidence: [summary](../../../docs/verification/cloudflare-readback-summary.json), [exact audit](../../../docs/verification/cloudflare-readback-audit.json), [reassembly](../../../docs/verification/cloudflare-readback-reassembly.json). Actual provider disconnects/native-browser recovery, broader concurrent native editors, unsupported-edit UX, representative latency/whole-isolate memory, full-pack cost, physical devices/IME and long-term free operation remain open. Use the existing quota; do not reset accounting, increase its cap, prune history or enable production to make a test pass.

## Negative native scenarios, 2026-11-21

Two fresh local copies exercise the final scalar-lifetime source without changing runtime code or deployment configurations. A third failed harness attempt is retained privately and excluded from the passing results. All three bounded servers and eight owned tabs are closed; Worker egress attempts are zero.

**Uncommitted save:** `playtt-readback-uncommitted-ui.mjs` binds127.0.0.1:9450 and withholds a body before invoking the exact native page mutation. One cold readback returns the old content, so the original invalid-JSON error remains and the native textarea preserves the new content exactly. After explicit local write release, one native retry saves it. Full workerd replacement and same-session reopening preserve exact bytes. Versions121→128→128→129→134; fault/readback canonical files match, and revision201 appears only on retry.37/37 traces complete, one2,294,490-byte pack, read trace2344ms locally.

**Intervening native auto-draft:** `playtt-readback-multitab-guard-ui.mjs` binds127.0.0.1:9452. After193 commits and its body is lost, the local gate holds the readback outside the coordinator until a second native `post-new.php?post_type=page` response creates auto-draft202. The gate expires after7seconds, within the middleware's10-second deadline. Its ID is extracted from the actual pinned block editor's `initializeEditor` call. A previous legacy hidden-field assumption failed and was not counted as a pass.

The one readback returns409/`playtt_readback_unsettled`, with no PHP boot, cache disposal or commit. The first editor retains its error and is closed without retry.202 is absent from the durable snapshot at that point, yet saving its title/content through the second native editor succeeds with the same ID. After complete workerd restart, both193 and202 retain exact content and202 retains its title. Versions121→126→126→127→135;52/52 traces complete, two packs totaling4,589,742bytes. The guarded read trace is4ms; wrapper gate elapsed3025ms. Neither is a provider latency measurement.

Offline exact comparisons preserve unrelated rows/files, accounts/sessions, prior revisions, media and theme. Changes are limited to owned193 content metadata/revision201, new page202/revision203/edit-lock75, existing edit-lock72, administrator preferences21 and monotonic counters. There is no write or new revision from either readback.

These are controlled negative flows, not untouched natural scheduling: the wrappers hold background mutations until explicit release (6 and8 requests respectively). New text in the second tab is entered after conservative rejection; the evidence establishes transient native draft identity survival, not arbitrary unsaved text survival. Existing global-styles warnings and broader provider/device/IME/plugin acceptance remain open.

Use each matching `-control.mjs`: `before`, `status`, `fault`, `readback`, `release-writes`, then `retry` for uncommitted or `second` for multi-tab, `restart`, and `finish`. Capture actual browser DOM/textarea observations before running `playtt-readback-negative-audit.mjs`; do not infer browser flags from API results. For the multi-tab gate, prepare an empty second tab, submit the first edit, observe its committed receipt and immediately navigate the second tab to the native new-page URL. No direct authenticated browser fetch or WordPress store manipulation is used. These unauthenticated localhost fixtures must never be deployed. Completed owner guards refuse reuse.

The five new helpers are included in stage9's hash manifest.75 runtime sources and20 configs are unchanged from8612eae; the prior25 tests/TypeScript/dry-run results still apply, and were not redundantly rerun. Fresh source-only reconstruction and delivery review are recorded separately. The readback feature remains disabled remotely; read-only status at01:08:24Z still shows118/pin8, closed/sealed, publisher paused and10,232,130bytes remaining. Continue within that allowance.

Evidence: [negative summary](../../../docs/verification/cloudflare-readback-negative-summary.json), [exact audit](../../../docs/verification/cloudflare-readback-negative-audit.json), [reassembly](../../../docs/verification/cloudflare-readback-negative-reassembly.json).

## Bounded provider HTTP exercise, 2026-11-21

The existing private Worker temporarily ran version `b4e9f561-9606-42dd-94af-3384fde3ef44` with the exact checked-in runtime and `--var PLAYTT_EDITOR_READBACK:draft-readback-v1`. Its normal configuration, routes, resources and the official Pages site were unchanged. After sealing, redeploying without the override produced `1075e061-1180-4248-9cc0-01aed39ee191`; actual version bindings confirm the flag is absent. No localhost fixture was deployed and no server fault route was added.

`playtt-readback-provider.mjs check` verifies the source hashes, pinned api-fetch/URL bytes and independently verified118 baseline without network calls. Its one-shot `exercise --remote` requires exact118/pin8, the old closed/sealed window and10,232,130bytes remaining. It opens at most180seconds/4MiB/64put operations and makes at most14native requests. Finally it closes admission, requires pending0, seals under its owned fence and releases it. `status --remote` observes; `contain --remote` can complete the same owner's closure after inspection. Never replay `exercise` or remove its owner guard.

The successful run used8native HTTP requests: login form, editor2 login, native draft editor HTML (Traditional Chinese and exact middleware verified), baseline page read, one native save, one readback, ordinary same-session cold read and native logout. Actual pinned api-fetch runs in a Node VM; its client transport consumes and verifies the successful provider save before returning an empty body to the middleware. One authenticated GET then returns the same121/a4d93d57 revision and exact fields. This tests the real server with a controlled client response loss; it is not browser UI or an actual TCP/server disconnect.

Save wall time6073ms plus readback3937ms yields10022ms for the two-step client flow. The10-second recovery deadline applies only to readback. Its provider trace is cold,2981ms and has no commit phase; the subsequent normal read is also cold,2354ms, with identical content and the same session. The bounded tail recorded143ok events and7/7completed traces, no exception/request-failure event. Maximum sampled WASM heap was73,400,320bytes; whole-isolate memory and actual CPU usage were not measured, and zero-duration phase samples do not prove zero work.

Native logout completes before closure. Total attempted R2 payload is2,960,342bytes/18puts; the single full pack is2,295,783bytes despite an appended203UTF-8-byte paragraph. The workflow total also includes login/logout and metadata. This is concrete evidence to prioritize full-pack amplification and save latency, not an estimate of universal per-edit cost or account spending.

After closure, `playtt-readback-provider-backup.mjs --remote` downloads the exact immutable graph and imports it independently; the separate pin helper refuses until the exact comparison passes.298files/300objects were verified: only owned draft193 content/date, revision201, edit-lock72 and monotonic counters change. Old revisions, all other files, accounts, session/preference rows, media and theme are exact. Pin9 retains the new122/6883819c graph alongside all eight prior pins. Download/pin do not change the canonical state or R2 accounting. `playtt-readback-provider-inspect.mjs` checks the completed run, backup audit, sanitized tail, current status and actual final bindings offline.

All associated processes ended. Final state:122 / `6883819c-8ca2-4e26-b899-433c83aa4eea`,9pins, pending0, closed/sealed, fence released, publisher paused, **7,271,788bytes remaining**. New work must use this state and the new owner chain;118 is now a retained baseline, not the current head. Do not reset the cap or erase history.

Reproduction requires the same project credentials/owner chain and a new explicitly scoped attempt; these completed one-shot scripts deliberately refuse reuse. Deployment commands were:

```powershell
node node_modules/wrangler/bin/wrangler.js deploy --config wrangler.playtt-session-audit.jsonc --var PLAYTT_EDITOR_READBACK:draft-readback-v1
# Run bounded exercise, close and seal, then remove the temporary override:
node node_modules/wrangler/bin/wrangler.js deploy --config wrangler.playtt-session-audit.jsonc
node node_modules/wrangler/bin/wrangler.js versions view 1075e061-1180-4248-9cc0-01aed39ee191 --config wrangler.playtt-session-audit.jsonc --json
```

The four new helpers join the same optional stage9.75runtime sources and20configuration files remain identical to bcbc9d9; fresh reconstruction now covers91helpers/prerequisites. This round performed a private-config dry-run and actual provider validation; it did not redundantly rerun the unchanged25unit/regression tests or regenerate core assets. The account UI before the run showed Workers Free and R2 $0.00 billable usage,2.32GB storage,7.09k Class A/58.65k Class B operations. Billing displays may lag; no upgrade or new paid authorization was made.

Evidence: [provider summary](../../../docs/verification/cloudflare-readback-provider-summary.json), [native HTTP receipts](../../../docs/verification/cloudflare-readback-provider-native.json), [independent backup](../../../docs/verification/cloudflare-readback-provider-backup.json), [final status](../../../docs/verification/cloudflare-readback-provider-status.json), [actual final bindings](../../../docs/verification/cloudflare-readback-provider-deployment.json). Broad memory/latency reliability, real provider browser recovery, natural concurrency, devices/IME, economical retained history and long-term Free operation remain open.
