# Retained snapshot verification

This is a read-only audit of the original private `playtt-wordpress-rebuild-audit` bucket. It adds no runtime patch, deployment, deletion, unpin, restoration or capacity refund. Production Pages and the selected backend remain unchanged. The separate write-tracked recovery target is not operated by this audit.

## Result, 2026-11-20

The fresh complete inventory contains 1,110 objects / 640,239,740 payload bytes and 222 revision manifests. The offline plan retains 72 revisions, including all 21 authenticated immutable pins and the 21 revisions represented by 23 existing local archives. The plan now includes the SHA-256 of the exact private plan bytes as well as the inventory and registry hashes.

All 72 retained manifests and 72 unique ZIPs were fetched directly from the source bucket: 144 GETs / 170,385,283 response bytes, zero cache hits and zero download failures. The real runtime decoder verified each complete ZIP hash and every indexed content file: 165,118,461 compressed bytes, 318,766,645 decoded bytes across revisions and 21,293 content-file entries. This extends previous pinned-archive coverage by 51 unpinned retained revisions. ZIP tombstone metadata and the outer manifest/ZIP themselves are not included in the content-file count.

**Archive integrity passed for all 72. That does not certify every version as a ready WordPress rollback target.** Attachment frontmatter IDs were checked against `_wp_attached_file` rows and actual archived upload paths. Five historical versions have 15 missing file relationships each: two legacy unmarked postmeta snapshots and three snapshots after full-table persistence was enabled but before the historical media repair. Four of these versions are pinned. Their original bytes and pins remain unchanged. All other 67 versions pass this specific relationship check; this does not verify all WordPress semantic relationships or PHP boot for each version.

| Historical revision | Pinned | Postmeta layout | Missing file relationships |
| --- | --- | --- | --- |
| `29f20b62-9dfe-4576-8926-933f820a2725` | No | Legacy unmarked | 15 |
| `98751c70-7fc3-4202-8222-13879468b3ec` | Yes | Legacy unmarked | 15 |
| `1a990cab-192c-45f5-9483-3e474027e655` | Yes | Full-table v1, before media repair | 15 |
| `825b7d5b-fe47-4746-8b12-b146a1a4bca4` | Yes | Full-table v1, before media repair | 15 |
| `edf7bf71-b84e-444e-a6d9-1cce10366841` | Yes | Full-table v1, before media repair | 15 |

Do not select these five for an unqualified full-site rollback. If historical content is needed, restore to an isolated target with compatible code and verify/repair the missing relationships separately. Pinning proves preservation, not application completeness. Context: `../postmeta/README.md` and `../media-repair/README.md`.

The current source `c0ba467c-c422-41e8-861c-64926c69e1fb`, canonical version 309, has the full-table marker, 48 postmeta rows, 15/15 linked attachments, 15 uploads, 27 Markdown records and 61 historical revision rows. Its 295 indexed content files total 4,427,214 decoded bytes. The 2,292,624-byte ZIP SHA is `54bde7a44ea53b1ccd36bbe964afc0ddeb3045c6ba62a90682bbcf7b3b1eb61e`. No per-version PHP boots were performed in this audit; independent current-content restoration has separate evidence in `../pin-restore/README.md`.

Before and after source coordinator/pointer, registry and capacity-ledger state matched exactly: version 309, 21 pins, no canonical fence and publication paused. Two complete object listings also matched by key, size, ETag, last-modified and storage class. The first post-listing returned HTTP 500 and exited; one list-only retry succeeded. The completed downloads were not repeated. These are non-atomic observations, not proof of complete in-flight roots, external-writer exclusion or a drained source bucket.

## Tools and reproducibility

- `playtt-retained-packs-state.mjs` is a guarded one-off source before/after procedure. It requires the existing private client setup and refuses to overwrite its baseline. It is not a generic production command.
- `read_retained_packs.py` downloads only the exact plan-bound retained set using authenticated Cloudflare GET. It requires explicit `--config`, `--inventory`, `--plan`, `--plan-summary`, `--registry` and private `--output` paths. It fixes the project/account/bucket, validates inventory completeness and pin coverage, caps revisions at 128, manifests at 256 KiB, ZIPs at 8 MiB, declared decoded bytes at 32 MiB and the compressed union at 512 MiB. Four bounded workers share per-pack locks. Existing private cache files are rehashed under the exact immutable input fingerprint; a different fingerprint is rejected. No token or private content is printed.
- `playtt-verify-retained-packs.mjs` uses the installed runtime's actual `decodeCanonicalRestorePack`, validates path confinement, complete retained coverage, input fingerprints, raw pin hashes, inventory equality and each decoded file. It parses UTF-8/table JSON and classifies attachment-file relationships. Public receipts contain counts/digests/identities, not content, object keys, credentials or table rows. Failure details go only to the private cache.
- `playtt-retained-packs.test.ts` passes eight meaningful tests: intact payloads, compressed corruption, mismatched index despite a valid outer digest, truncated ZIP, unsafe/duplicate/cross-site paths, protected raw-manifest changes, historical media gaps and missing/duplicate/changed-input coverage.
- The existing ten offline retention tests pass. Clean pinned-upstream assembly still applies 23 runtime patches and matches 66 source files; the two audit scripts and one test are additionally copied and compared. No dependency installation, new runtime build or deployment is claimed.

From an assembled runtime, with existing pinned dependencies, local verification uses explicit private paths:

```powershell
node --import tsx --test tests/playtt-retained-packs.test.ts
node scripts/playtt-verify-retained-packs.mjs --inventory <private-inventory.json> --plan <private-plan.json> --plan-summary <public-plan.json> --registry <private-registry.json> --download-index <private-cache/index.json> --output <public-verification.json>
```

The second verification pass added relationship classification using the already-downloaded local cache; it did not make another cloud download. The first-pass report and log remain in local artifacts. Private cache/index, manifests, ZIPs, inventory, registry and exact retirement plan stay outside Git.

## Limits and next work

`safeToApply` remains **false**. The 150 revisions / 300 manifest-and-pack objects / 355,062,939 bytes in the proposal have not been deleted, reclaimed or refunded. Fresh roots under a verified writer boundary, unresolved-write reconciliation and reviewed exact deletion scope remain prerequisites to any future cleanup. The source bucket has not been upgraded to the independent target's write journal. Matching listings and an expired lease cannot establish that older writers completed.

Native UI/IME/device acceptance, cancellation attribution, latency, practical handoff and sustained free-tier usage remain open. Archive verification is not those tests. No paid product was enabled and no future zero-cost guarantee is inferred.

Evidence: `docs/verification/cloudflare-retained-packs-summary.json`, `cloudflare-retained-packs-{plan,download,verification,inventory-comparison,state-before,state-after}.json`, test logs and assembly report in the repository's verification directory. PR #4 remains draft; the overall goal remains active.
