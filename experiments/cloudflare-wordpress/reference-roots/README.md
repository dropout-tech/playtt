# Private coordinator reference inventory

The private recovery Worker now exposes a bounded, authenticated, read-only inventory of its current canonical pointer, lease base (including an expired lease) and all stored commit receipts. This closes an evidence gap in the previous R2-only retention analysis. It is not a deletion or unknown-write settlement API.

## Implementation

`GET /__playtt-reference-roots` uses the existing private outer gate and operator authorization. It is available only for the default site with the playtt capacity guard configured. Responses are `no-store` and `noindex`; other methods fail. No fence/lease token, content or unrelated storage fields are returned.

The coordinator runs the read on its existing serial queue. It reads the already-initialized record directly, without lazy initialization or expiry cleanup, and lists commit receipts in pages of 128 with `startAfter`. It validates canonical identities, site namespaces, timestamps, version keys and the current receipt. Missing/mismatched current receipts, incomplete pagination, malformed records, more than 2,048 receipts or a report over 512 KiB fail closed. Historical receipts above a reset coordinator's current version remain visible. The method does not mutate records or access R2.

`playtt-reference-coverage.mjs` compares the exported references with a complete private object/metadata inventory and pin registry. It conservatively includes every stored commit receipt, even when that revision is not pinned. It checks every referenced manifest, pack and content-object namespace/size; it does **not** rehash every remote object or certify that each historical snapshot restores. Expired lease bases are not silently discarded.

The existing read-inventory tool now accepts only the two explicit private playtt bucket names; its default remains the original rebuild bucket. The optional `--all-publication-metadata` profile also reads job-progress, claim and receipt JSON. It cannot be substituted for the older retention-planner profile. The current coverage evaluator refuses any publication/import objects until their lifecycle references have a dedicated audit; it does not treat unimplemented roots as absent.

## Remote result — 2026-11-20

Deployed only to `playtt-wp-free-pin-restore-audit`, version `1b8f1869-8929-4c54-8ad9-5b5cf903b7e4`. Cloudflare reported 100% on this version, one private R2 binding, the three existing DO bindings and matching configured variables, with no D1/Queue/service/workflow binding. Source rebuild remains `8536d0cf-cfbf-4133-9764-ae4bbfdd2c45` at 100%. Production Pages, the original visual design and backend-cutover decision remain unchanged. No paid product or resource was added.

The guarded audit verified target canonical version 16, 23 pins, zero pending R2 operations and paused publication, then acquired its canonical fence and durable R2 seal. Under those protections it read the new catalog, inventoried the private bucket, repeated the full object listing and read the catalog again. Both comparisons matched, as did canonical state, registry and capacity accounting. It then released the seal and fence and rechecked the final state; source canonical version 309 also stayed unchanged.

| Check | Observed result |
| --- | --- |
| Stored commit receipts | 16 |
| Immutable backup pins | 23 |
| Unique referenced canonical revisions | 36 |
| Commit revisions without a pin | 13 |
| R2 objects / payload | 462 / 186,685,844 bytes |
| Referenced manifest/pack/content objects | 451 |
| Other retained objects | 3 core artifacts, current pointer, 7 cached pages |
| Publication/import objects | 0 |
| Anonymous / missing operator / wrong method | 404 / 401 / 405 |
| Final target state | Version 16, no fence/seal, pending 0, publisher paused |
| Final payload bound | 187,300,721 / 300,000,000 bytes; unchanged |

The three core artifacts total 93,840,455 bytes; current pointer is 183 bytes; seven cached pages total 558,813 bytes. These are retained, not deletion candidates. The current target's 36 manifests all have a conservative reference. The original source bucket's separate 300-object retention proposal has **not** been upgraded by this target audit and still has `safeToApply=false`.

## Validation

32 related tests pass: 8 reference-export tests, 5 coverage tests, 16 write-drain tests and 3 coordinator tests. They exercise multi-page/numeric ordering, a queued concurrent lease mutation, zero read-side writes, token omission, expired lease preservation, malformed/missing/oversized catalogs, missing historical dependencies, divergent current/pin pointers, and publication/import roots that the evaluator cannot yet classify. The first endpoint test had an incomplete fake bucket; that failed log remains local, and the fixture was corrected to fail if the audit actually accesses R2.

TypeScript, Wrangler dry-run and deployment pass. Clean pinned-source reconstruction applies 24 patches and compares 67 source files plus the five added source/test/helper files. Existing dependencies were reused. No new PHP/UI/real-device test or continuous platform-tail observation is claimed; the HTTP result, metadata comparison and deployed-version evidence have narrower scope.

The one-off remote script has private baseline/guard files and refuses replay. Its `finally` block releases the held protections; the completed guard confirms release. If a command is interrupted, inspect its live session and private guard before any retry. Never replay older initialization or native-data audit scripts.

## Unknown writes and remaining work

An R2 read of a matching object, or a 404, does not prove that an earlier request with unknown outcome can no longer commit. Cloudflare explicitly describes this in its [consistency model](https://developers.cloudflare.com/r2/reference/consistency/#negative-reads-and-in-flight-writes). The v1 pending ticket records only kind, byte count and start time, not enough information to independently prove a terminal result. This audit therefore adds no head-based, time-based or force-clear reconciliation.

The current seal closes tracked application mutation admission, but cannot control external R2 clients or genuinely older untracked writers. Deployed binding/version checks narrow the inspected boundary; they do not prove external credentials or previously dispatched requests are absent. A matching non-atomic list is not an independent proof of those conditions.

Before any concrete cleanup, establish the source deployment's complete references and writer boundary, lifecycle rules for retiring commit receipts, and a verified protocol for unknown outcomes. Conservatively listing all receipts is temporary protection, not a sustainable retention policy. Journal/ledger/seal recovery remains separate from WordPress restore packs; do not copy old accounting into another bucket or downgrade tracked code.

No cloud snapshot was deleted, no capacity charge was refunded and no content was edited here. `safeToApply=false`; goal active and PR #4 draft. Native UI errors, cancellation attribution, memory/latency, practical handoff, real-device/IME and sustained free-tier acceptance remain open.

Evidence: `docs/verification/cloudflare-reference-roots-{summary,preflight,remote,coverage,platform,assembly,review}.json` and corresponding local-test/deployment logs. Private catalogs, inventories, guards, tokens and full registry exports remain outside Git.
