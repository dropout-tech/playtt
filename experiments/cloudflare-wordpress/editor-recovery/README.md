# Native editor recovery attempt and snapshot-growth finding

The attempt did **not** complete the native error-display/retry acceptance. The independent private recovery target remains write-sealed at canonical62 with owned draft192 retained. Production Pages and source rebuild canonical309 were unchanged. No runtime deployment, paid plan, capacity increase, historical-object deletion, ledger reset or refund occurred.

## Observed behavior

The guarded fixture was created as draft192 with a single Traditional Chinese paragraph. Preparation ended at canonical24. Browser sign-in succeeded and Gutenberg loaded the draft with its native “已儲存” state. No paragraph edit or save click was performed before the browser call lost its continuation and session bindings. On reconnection, the tab was discoverable but accessibility and close actions timed out at the browser's focus command. The close is unconfirmed; no replacement screenshot or completed UI result is claimed.

Background requests continued during that interruption. The operator seal was acquired only afterward, at canonical62. The guard is therefore containment, not evidence of a bounded browser test. A future run needs an independently running deadline/seal watchdog before navigation, so an agent/browser interruption cannot leave a writer active indefinitely.

The finite sanitized capture contains798 platform events, all platform outcome `ok`, but includes9 application request-failure records and9 incomplete traces at `persistence.manifest.write`. There are45 snapshot events:44 `admin-ajax` and one editor GET. Some early background requests were about10 seconds apart; the final adjacent successful lock updates were120 seconds apart. This is not a continuous ten-hour latency sample. Maximum sampled WASM heap75,038,720 bytes is not whole-isolate memory. The observer ended and a narrow process query found zero matching orphan tails.

The conservative payload bound rose from202,464,917 to297,858,132 /300,000,000 bytes, leaving2,141,868 bytes. A full pack is about2,293,896 bytes, so normal login/save/cleanup cannot safely be resumed within that remaining bound. Failed attempts can still charge small object writes before pack persistence is rejected. Charges were preserved; pending tickets are zero. Raising the guard would not fix the underlying growth.

## Snapshot evidence

Prepared canonical24 and frozen canonical62 were downloaded and fully decoded. Their content, media and theme are identical. Only `_tables/postmeta.json`, `_tables/usermeta.json` and `_runtime/playtt-auto-increment.json` differ: the editor adds `_edit_lock`, browser login changes session tokens, and counters advance. Posts and historical revision rows are unchanged.

An exact adjacent comparison of versions61/62 narrows the background change further: one `_edit_lock` row's timestamp changes, with the same owner; `wp_options` high-water advances581→583. All other manifest entries, postmeta fields, media and theme entries match. Yet two different complete ZIPs of2,293,894 and2,293,896 bytes were produced. This demonstrates lock/counter write amplification; it does not prove every intermediate revision changed for the same reason.

The first adjacent-delta assertion expected only postmeta and failed because the counter file also changed. The completed bounded resume reused the four verified existing downloads and fetched only the two counter files. The final evidence includes both changes; no completed download was restarted or mismatch ignored.

Canonical62 is fully backed up:296 indexed content files plus manifest/ZIP,4,430,300 decoded bytes,2,293,896-byte archive, SHA-256 `89a94538333e7d93179818b8dbcaea38f4fdcea80a363b5b1759a9fdbb58b9ba`. Backup pin25 is acknowledged and all24 prior pins match. This is an inspection backup containing the owned draft, not a cleaned final delivery. Its temporary canonical fence was released; the independent R2 write seal remains active under the locally saved owner token.

## Required fix and acceptance

Do not disable native heartbeat, ignore `_edit_lock`, drop internal postmeta, or reset counters. Existing no-op reconciliation correctly notices real metadata changes; skipping them would break editing locks or deleted-ID continuity.

The next implementation should persist these small maintenance changes through the existing serialized durable coordinator, without rebuilding a whole WordPress pack for each lock refresh. It must bind to the exact canonical base, retain original meta IDs and monotonic counters, participate in cold hydration and backup/restore, and handle uncertain commits and mixed deployments. Arbitrary content/attachment/plugin metadata changes must still use the full canonical path. A narrow eligible-change classifier alone is not enough to deploy this behavior.

Acceptance needs actual PHP heartbeat with two competing editors, lock renewal/release/takeover, warm/cold/redeployment continuity, unchanged content and attachment bytes, counter non-reuse, bounded storage growth, interrupted-write recovery and full backup reconstruction. Then repeat native error/retry UI acceptance and physical-device/IME testing. Browser observation must have an independent bounded watchdog and adequate verified headroom.

Until safe recovery is prepared, retain the seal and draft guard. Do not replay `--prepare`, the completed snapshot script or the first delta download. The original audit helper's verify/cleanup modes are intentionally gated on a completed edit/retry and are not currently applicable. Before any future unseal, verify the available capacity and resolve the still-open browser state. No unsafe historical cleanup proposal has been applied.

Evidence is in `docs/verification/cloudflare-editor-recovery-*`. Private guards, credentials, registry and full archives remain local. The four scripts are preserved for review; they are one-off guarded procedures, not general automation commands. The goal remains active and PR #4 remains draft.
