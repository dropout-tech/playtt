# Private session/preference provider validation

The bounded v2 candidate now has native WordPress HTTP evidence on Cloudflare Free. It is enabled only in the new `playtt-wp-free-session-audit` Worker and Standard `playtt-wordpress-session-audit` bucket. **Apply the following [logout-persistence stage](../logout-persistence/README.md) before using this candidate.** This stage alone still classifies native GET logout as a read; warm rejection is insufficient.

Production Pages, original artwork and backend routing remain unchanged. The user requested continued free backend research, with no production cutover. Existing 19 configurations and the old sealed target remain unchanged; the single new configuration uses SQLite Durable Objects, no cron, external services, custom routes or paid CPU setting. Cloudflare's visible plan page showed Free.

## Imported data and bounded operations

The source is the independently verified canonical57 graph, not the synthetic local v2 replay. Its exact selected pin is retained; older historical pins remain on their original target. Three pinned runtime assets plus the complete selected graph total 303 objects / 100,738,428 bytes. Every uploaded object was downloaded and SHA-256 checked. Upload inspection refuses mismatches and resumes only an interrupted verified plan.

The new application payload ledger is 150,000,000 bytes. Initialization establishes the actual imported baseline; it does not refund or reset the old ledger. The old window-audit remains canonical57, eight pins, sealed and unchanged, with only 3,821,814 bytes left. Account-level read-only usage was checked before creating the new isolated target. This test ledger is not an account spending cap.

Bootstrap used a 30-second / 1 MiB / eight-operation window. Expiry rejected PHP/admin/REST/restore requests without changing canonical identity or accounting. A wrong owner could not close the window. It was then closed, sealed and unfenced with publishing paused. Native tests each used a new owned 300-second / 8 MiB / 128-operation window and closed early.

## Findings and limits

- Native login, traditional-Chinese profile, editor preferences and cold restoration of the same session succeeded. Each independent v2 export downloads at most six unique dependencies and verifies all 298 logical files. Existing download scopes retain their five-request limit; all scopes retain GET-only, no-redirect, 8 MiB/object and 10 MiB total bounds.
- The first two native attempts stopped at a test-only parser error: WordPress emits a single-quoted logout link with `&#038;`, while the original pattern required double quotes. Both attempts closed and sealed. The parser now handles both quote styles and ampersand encodings, rejects a different origin and requires the native nonce. The original reports and helpers are retained as historical evidence.
- The third report's `result: pass` covered warm logout only. Its zero logout writes and identical persisted session rows proved that it did **not** establish durable revocation. The follow-up audit explicitly supersedes that interpretation. The required next stage fixes and verifies this behavior.
- Provisioning first encountered an expired existing OAuth token, then a deployment followed by a workers.dev API error. Existing approved credentials were refreshed; a bounded enable/readback completed without broadening access. The first deployed source omitted this exact new bucket from the capacity allowlist, producing closed control failures before any import. The exact scope and actual-config test were added before bootstrap. No uncertainty was resolved by overwriting unknown remote objects.
- The final successor run used 460,017 bytes / 17 puts in its window. Login, preference saving and logout each wrote about 96 KB without another full approximately 2.3 MB ZIP. These are measured writes, not a controlled provider savings percentage, latency guarantee or long-term Free acceptance.

Current complete status and telemetry are in [cloudflare-session-summary.json](../../../docs/verification/cloudflare-session-summary.json). As of that observation, the new target is canonical15 / `506f29fb-c3a5-4139-a0e9-2f4c0a3ccc97`, five pins, no pending writes, sealed, window closed, fence released and publisher paused. All five pin identities survive. Its payload bound is 101,754,104 / 150,000,000 bytes, leaving 48,245,896. Existing test accounts, drafts, revisions and earlier sessions remain private; this is not clean handoff data.

The 312-event final observation contains 311 ok and one canceled event, with 13 completed traces and no platform exception. The cancellation is not fully attributed. Maximum sampled WASM heap is 71,565,312 bytes, not whole-isolate memory. No browser UI or competing-editor acceptance was performed in this stage. Actual devices/IME, response-loss recovery, long-term usage, sustainable retention and final delivery remain open.

## Rebuild and operation

Use the pinned `rebuild-candidate.py`, followed in order by `metadata-overlay`, `snapshot-bundle`, `write-window`, `window-provider` and `usermeta-overlay`. Then run:

```text
python experiments/cloudflare-wordpress/session-provider/apply-local-candidate.py --runtime <output>/packages/runtime-cloudflare
python experiments/cloudflare-wordpress/session-provider/apply-local-candidate.py --runtime <output>/packages/runtime-cloudflare --apply
python experiments/cloudflare-wordpress/logout-persistence/apply-local-candidate.py --runtime <output>/packages/runtime-cloudflare --apply
```

Assembly checks exact source identities, prepares normalized temporary files, verifies output hashes and refuses reapplication before mutation. It neither installs dependencies nor deploys. Stage six compares 72 sources / 49 helpers; the complete stage-seven result compares 73 / 53 and all 20 configurations. Default assembly does not silently include optional stages.

`playtt-session-provider.mjs prepare|preflight|create|secrets|upload|bootstrap|expiry` and all native helpers are completed **one-shot historical procedures with fixed identity guards**. Do not replay them or delete their owner files. `playtt-session-enable.mjs` is bound to the initial deployment, so it is also historical. Read-only status remains available through `playtt-session-provider.mjs status --remote` and the next stage's final-status helper. Use `node --import tsx` for helpers importing runtime TypeScript. Never print the private guards, cookie jars, HTML or full backup content.

For the next accepted test, inspect current state and account usage, reuse retained editor2, and prepare a new bounded owner/window from canonical15/pin5. Do not reset/refund the ledger, delete history, raise its cap automatically or reopen old windows. Retention remains `safeToApply=false`. Before any downgrade, retain a v2-compatible reader and the logout fix, or independently verify an appropriate full snapshot; old v1-only readers reject v2.

The account's observed R2 payload is about 2.18 GB, with analytics delay and other projects included. This is not invoice or monthly-peak proof. Official references: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [R2](https://developers.cloudflare.com/r2/pricing/), [Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/). No paid upgrade was performed.
