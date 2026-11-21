# Bounded content snapshots — optional, local-only candidate

A native draft edit previously wrote a new complete archive even when only a few canonical files changed. This tenth optional stage reuses one exact full base and stores bounded file replacements through the existing lease, immutable-object and canonical-commit path. It is not adopted by the default assembler or deployed. The current production Pages visual and private publisher remain unchanged.

## Format and limits

`playtt/canonical-content-overlay/v1` keeps the entire current inventory and binds the exact full-base manifest by revision, key, timestamp, SHA-256 and length. It supports exact additions, replacements and removals across canonical Markdown/database files, media and wp-content, plus deterministic tombstones. Empty files are real hash-verified objects. No WordPress content, IDs, sequence values, sessions or serialized fields are normalized or skipped. This storage format does not authorize mutations; the existing canonical adapter and WordPress still determine allowed changes.

All generations reference a full base, never another overlay. Limits: 256 KiB manifest; 8 MiB compressed and decoded base, 8 MiB final decoded inventory; 1 MiB cumulative replacement bytes and 64 cumulative changed/deleted entries, including tombstone changes. The immediate delta is bounded too. An unsupported size/count returns to full-pack persistence. Invalid identities, hashes, missing objects or unsupported chains fail closed. Reverting exactly to the base inventory is valid.

The writer requires `PLAYTT_CONTENT_OVERLAY=content-v1`, taking precedence over the earlier metadata writer when explicitly enabled. All 20 assembled configurations omit it. The old v1 and v2 classifiers are byte-for-byte unchanged; the shared reader dispatches by a separate schema. Warm saves recheck the exact committed manifest, base manifest and every cumulative replacement. They do not download the full base ZIP on every save; cold restore, pin registration and backup verify that archive and every recovered file.

## Recovery and downgrade

The compatible reader reconstructs the complete inventory and restores deleted assets/tombstones correctly. Server pins and complete bundle export/import verify all dependencies. The composite backup client now handles media, wp-content and zero-byte objects too. Export includes both base-only and current objects; an independent copy remains complete without its source.

Old v1/v2 readers reject the new descriptor. Disabling the writer keeps the new reader available but does not itself rewrite the current pointer. A subsequent native save with this writer disabled materializes a full snapshot; alternatively the existing offline materialization tool produces a new independently verified full bundle. Only then can an old-source rollback be considered. Local full decoding is verified; mixed-version provider rollout/restore remains untested.

The legacy retention proposal explicitly rejects this new format. No cleanup, deletion, ledger reset, budget increase or pin removal is part of this candidate. Keep every referenced base/archive/object. Sustainable long-term retention remains open.

## Local evidence, 2026-11-21

105 distinct relevant checks pass: 10 content-format cases, 21 existing v1/v2 cases and 74 snapshot, bundle, pin, readback and write-window regressions. They cover twenty flattened saves, exact reversion, assets/empty files/tombstones, corruption, streamed size bounds, limits, pin refusal, independent import, full materialization, disabled flags and the legacy retention refusal. TypeScript and Wrangler dry-run pass; bundle 20892.11 KiB / gzip 7609.38 KiB. Upstream generated-loader eval/duplicate-key warnings remain.

The native local harness imports verified private backup122 into new emulated R2/SQLite DO state and runs real WordPress7.1.4/PHP. Admin login reaches123, saving retained draft193 reaches124. After the committed response is deliberately lost, the entire workerd process restarts; cold read returns the exact Traditional Chinese body. Same-content retry reaches125 with no extra revision. Only expected revision202 is added, all older revision rows and unrelated files remain exact, and media/theme are unchanged. No complete ZIP is added while the writer is enabled. Independent export/import and full materialization match the full inventory.

The same harness then disables only the local content writer, restarts and saves again. Canonical126 is a full snapshot; another process restart reads the exact body. Ten runtime traces complete. Both successful local runners and the initial sandbox-denied attempt terminate; all Worker egress is forbidden and observed attempts are zero. This is native HTTP, not browser/IME or provider acceptance. The deliberate response loss is a local post-commit stream failure, not a real TCP disconnect.

For the single save, changed objects317,165 + overlay manifest73,740 = **390,905 bytes**, versus changed objects317,165 + full manifest73,713 + archive2,294,697 = **2,685,575 bytes**. The application-payload reduction is **85.44%**. This excludes pointer/coordinator writes, deduplication and provider billing; it is not a cloud latency/cost estimate. Full-pack materialization after disabling the writer is a separate intentional write.

A new read-only cloud check confirms canonical122, 9pins, closed/sealed, pending0, fence released, publisher paused and7,271,788bytes remaining. No remote writes or deployment occurred. Existing Worker1075e061 still runs the earlier source, with readback disabled.

## Reproduce

Assemble the25adopted patches and the preceding nine optional stages in order, as described in [REBUILD](../REBUILD.md). With the pinned7.1.4static manifest and exact prerequisites:

```text
python experiments/cloudflare-wordpress/content-overlay/apply-local-candidate.py --runtime <new-output>/packages/runtime-cloudflare
python experiments/cloudflare-wordpress/content-overlay/apply-local-candidate.py --runtime <new-output>/packages/runtime-cloudflare --apply
node --import tsx --test tests/playtt-content-overlay.test.ts
```

The applier checks all eight changed/new file identities before mutation, refuses reapplication and never enables a flag. Fresh default assembly still excludes optional stages. Use the established dependency/core preparation; assembling source does not regenerate binaries.

`playtt-content-overlay-local.mjs --local` requires the existing private verified backup122 and owner files; it always creates a fresh local copy, binds only127.0.0.1:9451 and rejects remote mode. It contains a LOCAL ONLY fault wrapper which must never be deployed. `playtt-content-overlay-status.mjs --remote-read-only` is limited to four operator GETs on the existing project and asserts the current122/pin9 baseline. Neither helper bypasses changed-state guards.

Evidence: `docs/verification/cloudflare-content-overlay-{summary,native,remote-status,reassembly,review}.json`. Next: bounded private provider validation with complete backup/restore proof, plus native UI, whole-isolate memory, concurrent editing, physical-device/IME and sustainable Free usage acceptance. The overall goal remains active; PR4 stays draft.
