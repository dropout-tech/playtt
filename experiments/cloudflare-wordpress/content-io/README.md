# Bounded content-object reads — local candidate

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

The applier checks all prerequisites and prepares all five changed/new files before touching the target; reapplication refuses before mutation. Fresh reconstruction matches76runtime sources /106helpers and prerequisites. All20configs are unchanged, with content/readback flags absent. Default assembly excludes optional stages.

`playtt-content-io-local.mjs --local` makes a new private local copy of verified backup126, listens only on127.0.0.1:9452 and rejects outbound requests. It requires the local backup/owner/credential files; never deploy its fault wrapper. `playtt-content-io-benchmark.mjs --local` requires that backup and the prior provider assembly at its sibling path; it pins the serial source hash before comparing it. `playtt-content-io-status.mjs --remote-read-only` permits exactly four operator GETs on the existing private target and verifies126/pin10 without opening a window.

## Cloud state and remaining work

No deployment or cloud mutation occurred in this stage. At03:30:27Z on2026-11-21, four GETs verified canonical126 /c7933a7c-c54e-4dc7-8a01-7888418761e8,10pins, pending0, closed/sealed, fence released, publisher paused and6,604,978bytes remaining. Last verified deployed source remains the serial compatible reader ineb809ce8; the content-io candidate is local only.

Future private mutation must chain from `playtt-content-provider-cold-owned-private.json` and verified content-provider backup126, using a newly bounded one-shot helper. Earlier provider helpers pin old sources/baselines and must not be replayed or have guards bypassed. Preserve pins/history and existing caps. An old-reader rollback still needs full materialization because current cloud data is content-v1. The preceding post-redeploy read's missing PHP trace remains an explicit evidence gap.

Next measure this candidate on the existing private provider within remaining allowance, then investigate serial Markdown writes and broader native UI/memory/concurrency/long-term Free/device/IME acceptance. Production Pages and its visual remain unchanged; no backend cutover, paid change, merge or completion claim. Evidence: `docs/verification/cloudflare-content-io-*`.
