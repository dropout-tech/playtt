# Confirmed R2 write acknowledgement recovery

The tracked private runtime now retries a failed settlement acknowledgement up to three total attempts, always using the same ticket. This handles a request lost before the budget DO receives it and a response lost after the DO has already settled. It never retries the reservation or R2 mutation.

## Behavior

Only a resolved R2 put/delete, including a conditional put miss, enters this path. Healthy writes still make one settlement call. Failures wait 100 ms and then 200 ms before the remaining attempts. Each response must match the settlement schema, success flag and exact ticket. Error response bodies are canceled before retry. Transient transport errors, bad JSON/proofs and error statuses all remain bounded by the same three-attempt limit.

Success after a retry emits a numeric `playtt/r2-write-ack-recovered/v1` event. Exhaustion emits one `playtt/r2-write-ack-failure/v1` event with attempts=3. Neither includes a ticket, object key, content, exception message or credentials. Exhaustion preserves confirmed R2 success so the current pointer and coordinator commit can remain coherent; a ticket that still exists continues to prevent maintenance. A lost response may mean the ticket was already settled, so an acknowledgement warning alone cannot prove it remains pending.

An R2 rejection with unknown outcome never calls settlement. A lost reservation response is not retried or cleared. No refund, force-clear, TTL, HEAD-based inference, parallel resend or automatic background retry was added. The attempt count is bounded; this does not impose a separate wall-clock deadline on a fetch that has not returned. Normal operations add no timer or extra DO call.

## Tests

The ten new fault tests first ran against the previous implementation: 2 passed and 8 did not meet the new acknowledgement-recovery expectations. The candidate passes all ten plus the existing 16 drain, 13 capacity and 3 coordinator tests: **42/42**. TypeScript and Wrangler dry-run also pass.

Tests cover one/two lost requests, responses lost after durable settlement, malformed JSON, transient503, budget restart, wrong-ticket proofs, three-attempt exhaustion, conditional misses and deletes. They assert one reservation and one R2 mutation, exact same-ticket retries, conservative charges, preserved confirmed current.json/DO commit, and that another ambiguous operation is never cleared. Unknown R2 put/delete outcomes and lost reservation responses keep maintenance blocked. Faults are injected locally through the actual wrapper and budget DO implementation, not into the remote provider.

## Private remote validation — 2026-11-20

First deployment: `673d1217-4a10-4a41-9a35-955c19da5f38`. The same code was redeployed as `dc9704f3-cbcf-4f11-af8e-3cf37e8bc6d5` on `playtt-wp-free-pin-restore-audit`. Configuration remains the existing private bucket, write-tracking v1, three DO bindings and 300,000,000-byte payload bound. Source rebuild remains `8536d0cf-cfbf-4133-9764-ae4bbfdd2c45` / canonical309. Production Pages, visual design and the decision to postpone backend cutover remain unchanged.

Owned draft189 saved Traditional Chinese text and exact trailing whitespace. Fresh login after redeployment read exactly that content; a second save succeeded. The original front page compared exactly before and after. The owned draft and its child revisions were deleted only after identity/content checks. Final target state is canonical22, coherent, pending0, unsealed/unfenced and publication paused. HTTP/REST was used; this is not a new Gutenberg browser or physical-device/IME acceptance cycle.

Two content saves took6435 and6628ms. They are limited samples, not evidence of stable performance improvement. Both remote flows were healthy; they do not substitute for the local lost-request/response tests.

Complete backup `b2a27e47-33bd-4b4e-a2be-0e4fb46bf4bc` contains295 content files plus manifest/ZIP (297 inventory entries), 4,428,758 decoded bytes and a2,293,012-byte ZIP with SHA-256 `75cdf9478ff3ebfc37462b769d3a223b8a273e3f86c4567870d0295998ca5d1b`. Full decode verifies every indexed file. Its pin is acknowledged, bringing the target to24 pins; all23 previous immutable identities remain preserved. Outside session usermeta and monotonic counters,166 original indexed files,27 Markdown records,61 historical revision rows,48postmeta,15uploads and theme lists remain identical. The highest post ID is191 and owned content is absent.

The ledger is149,591,427 baseline +52,873,490 charged bytes over114 puts =202,464,917 /300,000,000 bytes. This cycle added15,164,196 charged bytes over31 puts; no refund or reclaimed capacity is claimed. The payload ledger is not a shared-account cost cap.

Finite sanitized observation recorded184 platform events (77 first deployment /107 final deployment), all outcome ok, with0 recorded exceptions, request failures, incomplete traces, acknowledgement failures or acknowledgement recoveries. These are events, not unique HTTP requests, and zero recoveries is expected without a real injected failure. Maximum sampled WASM heap was71,827,456bytes, not whole-isolate memory. The observer exited and an explicit process check found0 matching orphan tails. The first sandboxed CIM lookup was denied; the same restricted read-only lookup succeeded with elevated tool permissions.

## Delivery and remaining acceptance

Clean pinned-upstream reconstruction applies25 patches, matches67 source files and the four added tests/helpers. Existing dependencies and core assets were reused. The one-off native/backup scripts have private identity/phase guards and must not be blindly replayed. Their completed owned guard, released backup fence and final state reports are retained locally.

This improves immediate recovery only while the caller still has proof of R2 completion and its ticket. An exhausted acknowledgement, interrupted caller or ambiguous R2 request still needs a verified recovery design. The v1 journal alone lacks enough object/terminal-result evidence for an independent automatic settlement; retain its fail-closed behavior. Receipt-retirement rules, source-wide reference/writer boundaries and safe snapshot retention remain open. The earlier300-object source proposal stays `safeToApply=false`; no historical R2 object was deleted.

Next, verify native-editor unsaved/error display and recovery, alongside latency/memory, cancellation attribution, physical-device/IME use, handoff and sustained free-tier operation. No paid plan or new service was enabled. Goal active; PR #4 remains draft and unmerged.

Evidence: `docs/verification/cloudflare-write-ack-{summary,preflight,saved,cold,final-backup,final-comparison,final-status,observation-summary,observer-stopped,platform,assembly,review}.json` and test/deployment logs. Private credentials, cookies, guards, registries and archives stay outside Git.
