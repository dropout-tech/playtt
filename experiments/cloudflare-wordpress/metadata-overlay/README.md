# Bounded metadata overlay — local candidate, disabled

Current status (2026-11-21): this candidate was enabled and tested only on a new isolated private target in [window-provider](../window-provider/README.md). It remains outside default assembly and production. The local-only statements below describe the earlier stage.

Native edit-lock refreshes previously rewrote a complete 2.3 MB WordPress ZIP even when only `_edit_lock` and a counter changed. This candidate preserves those bytes through the existing canonical commit protocol while reusing one exact full base archive. It is **not adopted, enabled or deployed**, and the standard `rebuild-candidate.py` deliberately excludes it. Production Pages and the original visual design remain unchanged.

## Format and behavior

The new `playtt/canonical-metadata-overlay/v1` descriptor anchors the full base manifest by revision, exact key, timestamp, SHA-256 and byte length. Each new manifest still lists the complete current inventory. Only `_tables/postmeta.json` and `_runtime/playtt-auto-increment.json` may differ. Full-table metadata is required; original IDs, unchanged fields, content, uploads, themes and tombstones are retained. Only native `_edit_lock` rows may change. The counter table set is fixed and signed 64-bit decimal values are monotonic. A newly added metadata ID must exceed the preceding high-water mark; deleting then recreating a lock cannot reuse its ID.

All subsequent overlays reference the same full base; chains are rejected. Content edits or other metadata changes use the existing complete-pack path, including when the preceding state was an overlay. No native heartbeat, lock semantics, canonical object writes or counters are skipped. The exact existing coordinator lease, `current.json` commit and durable receipt sequence still governs publication. No extra service or asynchronous metadata side channel is introduced.

The writer is explicitly gated by `PLAYTT_METADATA_OVERLAY === 'v1'`. No checked-in or local Wrangler configuration sets it. Cold reads validate the exact base manifest, full ZIP, each replacement object and maintenance-only semantics before exposing the reconstructed inventory. Limits are 256 KiB manifest, 256 KiB combined metadata, 4,096 metadata rows and 8 MiB compressed/decoded base. Missing/corrupt/unsupported dependencies fail closed. Unsupported size or ordinary content changes use the full path where identified before overlay construction; corrupt dependencies are errors rather than silent fallback.

Old full-pack readers reject the new schema. This is fail-closed compatibility, **not** a rolling deployment/downgrade solution. Once any overlay is committed, compatible readers and dependency-aware recovery are required.

## Backup proof

A portable composite consists of `manifest.json`, the exact `base-manifest.json`, the base `restore.zip` and changed objects named by SHA-256 under `objects/`. The updated local pin client validates all dependencies and reconstructs the entire inventory. The server pin path additionally checks the remote dependency graph before registering the current manifest hash and full base ZIP identity. Existing full-pack pin behavior remains available.

The optional [snapshot-bundle extension](../snapshot-bundle/README.md) now adds prepared download tooling, verified independent local object-store recovery, complete-snapshot materialization, raw-manifest reference coverage and dependency-aware retention proposals for both formats. Its local verification does not constitute provider restore or mixed-version rollout acceptance. The original adopted backup/retention commands still reject overlays; do not bypass them or silently substitute the optional tools. Base manifests, archives and changed objects remain protected for every current/receipt/lease/pin/cache root. Keeping all receipts is not sustainable retention.

## Local evidence

- 80 related tests pass, including 13 new overlay cases: exact restoration, 20 updates against one base, takeover/deletion/new IDs, 64-bit counters, corrupt/missing dependencies, malicious valid-hash replacements, stream bounds, pin idempotency, full-pack fallback and a coordinator restart after a lost durable-commit response. Faults are local.
- A complete previously verified canonical62 snapshot reconstructs all 296 files. A simulated next lock/counter update changes two files; the other 294 are byte-identical. Estimated application payload is 85,821 bytes versus 2,379,610 for the complete-pack path, a 96.39% reduction for this one local case. It excludes operation charges and does not establish long-term free usage, provider CPU, memory or latency.
- The actual pinned PHP-WASM runtime executes the exact core `wp_set_post_lock` and `wp_check_post_lock` functions. Real MDI writer/loader and PDO SQLite run across two fresh PHP instances. It preserves 49 metadata rows and 8 sequence high-water values; another editor, takeover, own-lock recognition and stale-lock expiry pass. There are 56 writer and 12 cold checks. The native writer's postmeta output is eligible. The SQL/user adapter is narrow: this is **not full HTTP, nonce, heartbeat, two concurrent browser sessions or UI acceptance**. The harness copies the immutable SQLite seed before writes, matching the earlier PHP harness; writing directly to that seed path initially failed and is not reported as a passing test.
- TypeScript and Wrangler dry-run pass. The dry-run reports upstream loader eval/duplicate-constant warnings and a gzip bundle of 7,601.10 KiB; it does not establish provider acceptance or free-plan eligibility. No deployment was attempted.

See `docs/verification/cloudflare-metadata-overlay-*` for exact reports. Private original archives, generated composite snapshots and materialized ZIPs stay local. The two recorded-data harnesses require the existing private canonical62 backup-location file and should not be treated as general remote commands.

## Reproduce the source candidate

First use the parent `rebuild-candidate.py` with the pinned upstream archive and a **new** output directory. Then run:

```text
python experiments/cloudflare-wordpress/metadata-overlay/apply-local-candidate.py --runtime <new-output>/packages/runtime-cloudflare
python experiments/cloudflare-wordpress/metadata-overlay/apply-local-candidate.py --runtime <new-output>/packages/runtime-cloudflare --apply
```

Both modes verify exact normalized hashes for all four baseline files and four new files. Apply is opt-in, refuses a mismatched/already-patched target and does not set a feature flag. Reuse the previously pinned dependencies/loader/assets only after their existing preparation process; the source assembler does not install dependencies. Run `node --import tsx --test tests/playtt-metadata-overlay.test.ts` and the related suite recorded in the evidence before further changes.

## Current boundary and next work

The last verified private target remains Worker `dc9704f3-cbcf-4f11-af8e-3cf37e8bc6d5`, canonical62, 25 pins, pending0, write-sealed, publisher paused, with owned draft192 retained. Its payload bound is 297,858,132 /300,000,000 bytes: 2,141,868 bytes of headroom is less than a full pack. This candidate does not clear that accounting, unseal the writer, delete historical data or close the previously inaccessible browser tab. Source Worker8536d0cf/canonical309 is unchanged.

The snapshot-bundle extension completes local dependency-aware export, retention proposal and independent recovery checks. Next establish a bounded private acceptance run with sufficient verified headroom and an independently enforced write deadline/seal watchdog, then validate actual provider recovery and pin/coordinator paths. Provider memory/CPU and real PHP heartbeat with competing editors, renewal/release/takeover across redeployments remain untested for this candidate. Native error/retry UI, physical devices/IME, sustained free usage and backend cutover remain open. PR #4 stays draft and the goal active.
