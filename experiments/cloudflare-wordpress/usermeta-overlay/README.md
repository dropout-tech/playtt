# User session and editor preference snapshots — optional v2

WordPress sign-ins and editor preferences were forcing a full approximately 2.3 MB restore ZIP on the private Free target. In the stopped two-editor exercise, five usermeta/counter-only commits wrote 11,477,138 bytes of full packs. This optional source candidate preserves those changes in bounded overlays. It is not deployed or enabled in any configuration; production Pages and the original visual remain unchanged.

## Format and scope

`playtt/canonical-metadata-overlay/v2` references one exact full base manifest by identity, SHA-256 and length. It permits the existing native post-lock/counter maintenance plus changes to `session_tokens` and `wp_persisted_preferences` in `_tables/usermeta.json`. The account table, roles, credentials, other metadata, content, media, theme and tombstones must remain unchanged. Any ordinary change outside this scope falls back to a complete pack. Invalid or corrupt dependencies fail closed.

The full usermeta table remains canonical: row IDs, ownership, key names and opaque PHP-serialized values are retained without JavaScript deserialization. Existing rows cannot move to another user/key. New IDs must exceed the immediate predecessor and full-base high-water values; deleted IDs cannot be reused. User references must exist in the unchanged account table. Duplicate session/preference keys, counter rollback and missing keys are rejected from the fast path. Counter arithmetic remains signed-64-bit exact.

Limits are 256 KiB manifest, 256 KiB combined postmeta/usermeta/counters/accounts metadata, 4,096 rows per metadata/account table and an 8 MiB compressed/decoded full base. Every overlay points directly to a full base; chains are rejected. Subsequent content saving reconstructs the latest usermeta/locks and writes a full pack. No native writes, authentication checks, lock semantics or canonical commit steps are skipped.

The v1 module and its tests are byte-for-byte unchanged. `playtt-maintenance-overlay.ts` dispatches reads and validation by schema, while the writer requires explicit `PLAYTT_METADATA_OVERLAY=v2`. Existing v1 configurations continue to emit v1. New compatible readers with the writer set to v1 materialize full packs after v2; old v1-only readers reject v2. This is fail-closed compatibility, **not a proven mixed-version rollback deployment**. A real rollback must retain a compatible reader or first materialize and verify a complete snapshot.

Worker restoration, pin registration, local pin verification, portable snapshot bundles and the offline reference-coverage evaluator use the dispatcher. Historic one-shot window helpers retain their fixed old-baseline guards and must not be replayed against v2. No delete/refund/reset/retirement path was added.

## Evidence

- 70 related tests pass, including eight v2 cases: exact restoration; session deletion/recreation; v1-to-v2 transition; rejecting role/credential/owner/key changes; duplicate/orphan IDs; signed-64-bit counters; corrupt/missing/chained dependencies; pin/export/import; and full content saving after v2. The eight cases include multiple negative scenarios.
- The independent canonical57 bundle was replayed with the exact pinned core `WP_Session_Tokens` and `WP_User_Meta_Session_Tokens` classes, real MDI writer/loader, and PDO SQLite across two fresh PHP-WASM instances. Forty writer and 17 cold checks passed: exact rows/accounts, eight counter tables, restored valid session, wrong-user/wrong-token rejection, logout invalidation, expiry and Chinese preferences. The SQL metadata/filter adapter is narrow; this is **not full WordPress HTTP, browser login or competing-editor acceptance**.
- All 298 files were compared. Only usermeta changed; 297 files remained byte-identical. An independent local export/import and a materialized full archive verified the complete graph. Private session/credential data remain outside Git.
- For this one native local replay, estimated object writes are **95,760 bytes versus 2,391,769 bytes**, about **96.00% less**. This includes changed loose objects, manifest, pointer and optional full ZIP. It excludes read/operation costs and retries; it is not measured provider savings or proof of long-term free usage.
- TypeScript and a local Wrangler v2 dry-run pass. Gzip size is 7,604.79 KiB; upstream generated-loader direct-eval and duplicate-constant warnings remain. No deployment was performed.
- Clean assembly compares 72 source files and 38 helpers, with all 19 configurations unchanged. The new assembler prepares normalized LF sources in a temporary tree before applying, since earlier stages contain mixed CRLF/LF files. Reapplication is rejected before target source mutation.

Reports: [PHP replay](../../../docs/verification/cloudflare-usermeta-overlay-php.json), [tests](../../../docs/verification/cloudflare-usermeta-overlay-tests.json), [assembly](../../../docs/verification/cloudflare-usermeta-overlay-reassembly.json), [current summary](../../../docs/verification/cloudflare-usermeta-overlay-summary.json).

## Reproduce

Use the parent pinned-source `rebuild-candidate.py` and apply, in order, `metadata-overlay`, `snapshot-bundle`, `write-window`, and `window-provider` to a fresh output directory. Then:

```text
python experiments/cloudflare-wordpress/usermeta-overlay/apply-local-candidate.py --runtime <output>/packages/runtime-cloudflare
python experiments/cloudflare-wordpress/usermeta-overlay/apply-local-candidate.py --runtime <output>/packages/runtime-cloudflare --apply
```

The default command verifies every prerequisite and prepares outputs without changing target source files. Apply is opt-in, rejects mismatched/already-patched files, and does not change configuration or deploy. Reuse the already pinned dependencies/loader/assets through the existing preparation process; source assembly does not install them.

From that runtime, use `node --import tsx --test tests/playtt-usermeta-overlay.test.ts` and the related commands in the reports. The native PHP replay is `node --import tsx scripts/playtt-usermeta-overlay-php-check.mjs`; it requires the existing private canonical57 independent backup-location guard. It creates only local artifacts and requires no network.

## Next provider gate

Fresh read-only status still shows canonical57 / 34a7df5f, eight pins, pending0, window closed, write-sealed, fence released and publisher paused. Remaining payload allowance is 3,821,814 bytes. Do not reset/refund accounting, delete recovery history, raise the cap automatically, or replay the earlier 20 MiB window.

Prepare an adequately bounded provider run using this exact candidate and retained editor2. Verify native login/session/preference writes, actual object costs, cold restore, pin/backup and memory/latency before repeating competing-editor takeover, lost-lock notification, save and reload. One content edit plus autosave can require multiple full packs, so the local 96% maintenance reduction does not establish enough headroom for that entire flow. Sustainable retention, post-commit acknowledgement loss, whole-isolate memory, devices/IME, long-term Free usage and final handoff remain open. PR #4 stays draft and the goal active.
