# Persist native logout before returning its redirect


## Latest observation (2026-11-21)

The following logout regression remains valid historical evidence. A subsequent native two-browser test did **not** complete takeover: editor2 briefly showed Take over, then changed to lost-lock without a successful click. No text was typed. The native Gutenberg empty-dependency lock effect matches upstream issue #79976 and merged PR #79997; a backport is still pending. Seven full packs only changed autosave198 dates; no usermeta-only full packs occurred. See [current evidence](../../../docs/verification/cloudflare-session-lock-summary.json).

The private session target is now canonical43 / six pins, sealed, pending0, publisher paused, with 27,281,232 bytes remaining. The complete independent backup preserves original content/accounts/media/theme. All six added lock observation helpers are bounded or one-shot; `playtt-session-lock-control.mjs status --remote` is the current read-only status command. Old `playtt-session-final-status.mjs` deliberately expects historical15/pin5 and will reject the new state. The cost audit was completed before pin6 and also cannot be replayed against current state. Never remove these guards to repeat a completed mutation. The new helpers do not change deployed source or configuration. Latest reconstruction compares 73 source files and 59 helpers with all 20 configs unchanged.

WordPress's nonce-checked `GET /wp-login.php?action=logout` deletes its session token. The candidate previously classified this URL as a read, so logout rejected the cookie in the current PHP runtime but did not commit the deletion. A cold restoration could recover the old session.

This optional seventh stage recognizes that native logout URL as a mutation in both the canonical runtime and Durable Object publication prearm. It leaves WordPress responsible for authentication and nonce validation. The classification also covers HEAD/OPTIONS if those methods reach PHP; only GET was provider-tested. Duplicate `action` values are checked conservatively: any logout value admits persistence, avoiding JavaScript first-value versus PHP last-value parsing differences. No unrelated login or content URL receives this new behavior.

## Provider regression

The isolated Worker was updated to `8f4b111b-a4f6-4e35-9f64-6d01cb273116`; production is unchanged. The previous target remains sealed. Starting from canonical8/pin3, the test:

1. Logs in as the retained editor2, saves preferences and verifies a complete v2 backup.
2. Under an owned fence, forward-adopts the same snapshot with a monotonic coordinator version to discard runtime cache. The original cookie still authenticates and preferences remain exact.
3. Restores the original preferences. A wrong logout nonce returns 403 while the same user remains authenticated, with zero canonical or payload change.
4. Performs native logout. Canonical13 advances to14, with 96,225 bytes / three charged writes.
5. Discards runtime cache again through fenced same-pointer adoption to15. The saved old cookie and nonce return 403 / `rest_cookie_invalid_nonce` from a confirmed cold runtime.
6. Independently reconstructs the final backup, verifies the exact token hash is absent, preferences bytes equal the original baseline, and all unrelated users/accounts/content/media/theme remain unchanged. Of 298 files, only usermeta and auto-increment counters differ.

Both REST recoveries have matching completed cold traces containing `canonical.metadata-overlay.restore`. The previous warm-only report is retained with an explicit superseding audit: its before/after persisted session rows were equal, and logout wrote nothing. It must not be cited as durable logout acceptance.

The last 8 MiB / 300-second window consumed 460,017 bytes / 17 operations and is now closed and sealed. All five pins are retained; no pending writes, fence released, publisher paused. Existing fixtures and earlier test sessions are intentionally retained, so this is not clean delivery data. Native browser takeover/save, physical devices, long-term Free behavior and other acceptance remain open.

Evidence: [regression](../../../docs/verification/cloudflare-session-logout-result.json), [cross-check](../../../docs/verification/cloudflare-session-audit.json), [status](../../../docs/verification/cloudflare-session-final-status.json), [reassembly](../../../docs/verification/cloudflare-logout-persistence-reassembly.json), [tests](../../../docs/verification/cloudflare-session-tests.json).

The final deployment is `c914a8a0-1ef3-49a9-b66c-4b937f4d6e74`, adding only duplicate-action hardening after the complete ordinary-native regression on `8f4b111b`. Both classifier cases were rerun locally with duplicate/encoded query coverage. Read-only cloud checks verified unchanged canonical15, five pins and seals after deployment. PHP was not reopened for an additional duplicate-query provider case.

## Reproduce and maintain

Apply after the six preceding optional stages, as described in [session-provider](../session-provider/README.md). The exact-hash assembler checks by default and changes source only with `--apply`. All 20 configurations remain unchanged by this stage. Complete reconstruction compares 73 source files and 53 helpers; reapplication refuses before source mutation. TypeScript and ten relevant mutation/v2 tests pass; four earlier provider/parser cases plus twelve snapshot cases are recorded separately, totaling 26 distinct executed tests.

`playtt-session-logout.mjs --remote` is a completed one-shot regression bound to canonical8/pin3 and an existing private owner. Do not replay or remove its owner guard. `playtt-session-final-status.mjs --remote` reads only and verifies the current/old sealed states and five pin identities. `playtt-session-audit.mjs` is offline, reopening independent bundles and correlating sanitized traces; it never outputs credentials or session content. Run with `node --import tsx`.

Never roll back to the intermediate stage-six deployment for active editing: it lacks this persistence fix. Preserve the compatible snapshot reader and logout behavior during future changes. Saved session cookies, source snapshots, HTML and ownership tokens stay outside Git. Do not publish backup graphs or reset retention/accounting to repeat a test.
