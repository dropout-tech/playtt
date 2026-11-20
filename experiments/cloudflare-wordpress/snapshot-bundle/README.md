# Snapshot backup, local recovery and dependency protection — optional candidate

Current status (2026-11-21): this candidate was enabled and tested only on a new isolated private target in [window-provider](../window-provider/README.md). It remains outside default assembly and production. The local-only statements below describe the earlier stage.

The metadata-overlay writer changes the snapshot dependency graph. A backup or retention tool that assumes one manifest always contains one complete ZIP cannot safely handle that format. This extension supports complete snapshots and overlays while retaining original identities, full-base dependencies and every content-addressed object needed for subsequent writes.

This is **local research, not an adopted or deployed runtime**. Apply it only after the optional metadata-overlay candidate. Neither optional candidate is in the default rebuild, and no Wrangler configuration enables the writer. Production Pages and the original visual design remain unchanged.

## Export and independent local recovery

`playtt-snapshot-bundle.mjs` requires an independently supplied pin identity: exact pointer, manifest SHA-256 and full-base pack identity. The bundle's own index is not its trust anchor. It validates the current manifest, an overlay's exact full base, the complete archive, replacement hashes and the overlay's allowed metadata semantics.

The export contains the exact current/base manifests, original full archive and all current **and base** loose content objects. Objects use SHA-256 local filenames with a canonical-key index; shared keys/identical bytes are deduplicated. Limits are 256 KiB per manifest, 8 MiB compressed/decoded full base, 20,004 object entries and 32 MiB indexed payload. Every copied object is checked, including empty files and loose files that are also present in the ZIP. Missing, corrupt, extra, cross-site or unsafe entries are rejected. Existing directories and symbolic-link bundle directories/files are refused.

`importSnapshotBundle()` writes a new local object-store directory and re-reads it independently, with no fallback to the original source. It does not initialize a remote coordinator or write `current.json`. `materializeFullSnapshotBundle()` produces a complete archive with a **new** revision/manifest identity, preserving the original overlay and recording provenance. The old full-pack decoder can read the materialized result; that alone does not prove a safe live downgrade.

`playtt-export-snapshot-bundle.mjs` is a prepared GET-only provider adapter. It is restricted to the two existing private playtt buckets, uses the existing local OAuth configuration, rejects redirects, has a 45-second request timeout and permits at most five object requests. It bounds individual response bodies at 8 MiB and stops when observed aggregate bytes exceed 10 MiB; a received stream chunk can cross the limit before cancellation. HTTP errors omit response bodies and credentials. Provider behavior was exercised with injected local responses, **not a new live download**. It never acquires/releases a fence, registers a pin, uploads an object or changes a pointer.

```text
node --import tsx scripts/playtt-export-snapshot-bundle.mjs --remote --bucket playtt-wordpress-pin-restore-audit --anchor <trusted-pin.json> --oauth-config <existing-private-wrangler-config> --output <new-private-directory>
```

This command is a future procedure, not a request to replay already completed downloads. Export success is distinct from remote pin acknowledgement and provider restore. The module's open/import/materialize functions use the same supplied pin identity; newly materialized identities need separate durable protection if ever uploaded.

## References and retention

The optional inventory collector adds `references-overlay-v1` and exact base64-encoded manifest bytes when invoked with `--all-publication-metadata --include-raw-manifests`. Raw bytes are necessary because reserializing JSON cannot verify the anchored base hash. Fetches must match listed byte lengths, and retained raw manifests have a 64 MiB aggregate bound. Inventory and raw metadata remain private. Listing and reads are not atomic.

The updated reference evaluator follows current, receipt, lease, pin and cache roots into the full overlay base, retaining its manifest, ZIP and loose objects. It checks exact raw base hashes and pinned overlay hashes, not ZIP/content semantics. It refuses incomplete raw evidence, missing dependencies, chains and unimplemented publication/import roots.

`playtt-plan-snapshot-retention.py` adds the same base protection to the existing 24-hour/latest20/daily7 policy. It requires complete, matching coordinator roots, keeps all commit receipts and lease bases including expired ones, and protects every durable pin. A retained overlay protects an old unpinned base. Retiring an overlay cannot propose a full pack still needed by another retained revision. Only known retired manifest/full-pack keys can be proposed; content, media, themes and runtime objects remain excluded.

The planner performs no ZIP/local-backup integrity validation and explicitly reports `localBackupIntegrityVerified=false`. Optional local protection points can only add protection and must be registered. Unknown publication progress/claim/receipt or import lifecycles are rejected. All plans remain `safeToApply=false`; there is no delete/apply/network mode, no receipt retirement and no ledger refund/reset.

```text
python scripts/playtt-read-snapshot-inventory.py --config <private-oauth-config> --bucket playtt-wordpress-pin-restore-audit --all-publication-metadata --include-raw-manifests --output <private-inventory.json>
python scripts/playtt-plan-snapshot-retention.py --inventory <private-inventory.json> --registry <authenticated-registry.json> --coordinator-roots <authenticated-complete-roots.json> --summary <summary.json> --private-plan <private-plan.json>
```

## Evidence

- 97 related JavaScript/TypeScript tests pass, including12 new bundle/provider/reference cases and5 existing reference cases. Four new Python inventory checks and17 retention checks pass, including10 existing full-pack policy regressions. TypeScript passes. HTTP and coordinator/pin failures are local simulations.
- The previously verified canonical62 full snapshot and the previous local simulated overlay each export and import after the source is intentionally made unavailable. Both reconstruct296 logical files. The full graph has295 unique canonical objects /6,797,143 bytes; the overlay graph has298 /6,882,781 bytes. These counts include manifests/archive and deduplicate content-addressed keys; they are not missing-file counts.
- A separately materialized complete snapshot retains all296 file hashes and tombstones, uses a new identity and leaves the original overlay readable. Two fresh pinned PHP-WASM instances use real MDI/PDO SQLite hydration:49 metadata rows and their IDs,8 sequence high-water marks and15 attachment relationships match. The driver adapter is narrow; this is not full WordPress HTTP, competing browser editors or provider acceptance.
- Reference coverage includes the unpinned original full base. The retention integration uses that restored local dependency graph with **simulated local coordinator/registry inputs**, retains both revisions and proposes zero keys. It is not a live bucket inventory or live deletion proposal.
- No Cloudflare request/mutation, new remote pin, runtime deployment, capacity increase, refund/reset or historical deletion occurred in this stage. No new Wrangler build is claimed because only offline tools/tests changed; the previous disabled runtime candidate's dry-run remains separate evidence.

Reports: `docs/verification/cloudflare-snapshot-bundle-*`, `cloudflare-snapshot-inventory-tests.log` and `cloudflare-snapshot-retention-*`. Complete archives, indexes, raw manifests and local plans remain outside Git.

## Source reproduction and remaining acceptance

Run the standard pinned upstream assembler into a new directory, then the metadata-overlay optional apply script, then this directory's `apply-local-candidate.py --runtime <runtime>` (check only) or add `--apply`. It checks all eight prior-candidate identities, one baseline file and eleven new files before mutation. No flags, dependencies or deployment are changed. The Python retention regression harness also uses the repository's original `capacity/test_retention.py` fixture under the existing workspace layout.

The last verified cloud target is still dc9704f3/canonical62,25 pins,pending0, write-sealed and publication-paused, with draft192 retained. Its remaining2,141,868-byte headroom is below one complete pack. Source8536d0cf/canonical309 and production remain unchanged. Cloud state was not freshly re-queried in this stage.

Next prepare an independently enforced write deadline and a private test environment with verified headroom, then validate the optional format through actual provider restore/pin/coordinator paths, cold/redeploy behavior, concurrent native heartbeat and editor error/retry UI. Resolve mixed-version rollout and materialized recovery operationally before adoption. Physical devices/IME, whole-isolate memory, latency, cancellation attribution, sustained free usage and final handoff remain open. The goal stays active and PR #4 draft.
