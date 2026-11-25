## 最新：本機 Chrome 原生回應遺失／重試／冷重載（2026-11-21）

新增5個**不可部署**的local-only工具：兩個獨立attempt的server／control，以及離線audit。它們只供Browser技能操作真實編輯器，並未將故障注入加入runtime。`playtt-response-loss-ui.mjs`及`playtt-response-loss-ui-retry.mjs`都監聽127.0.0.1:9448、限900秒、禁止Worker外連；必須先確認第一個server terminal，再啟動第二個，不能同時使用。每個attempt的既有owner檔會使新啟動拒絕，避免覆寫證據；不要刪guard來重播。

依下方local HTTP工具準備相同已驗證備份／私人owner／資產／憑證，從runtime目錄執行 `node --import tsx scripts/playtt-response-loss-ui.mjs --local`。Chrome原生登入後開自有草稿193，使用實際可見控制項輸入owner檔的expectedContent。儲存前執行 `node scripts/playtt-response-loss-ui-control.mjs before --local`；原生保存故障出現後用`fault`捕捉精確提交。`status`只讀已觀察receipt。如果畫面已禁用儲存，記錄矛盾並finish，不用DOM注入強迫重試。第二個attempt使用帶`-retry`的server/control檔；在仍可用的原生儲存按鈕按一次重試，確認成功後執行`retry`，關閉分頁再執行`restart`，新分頁以同session冷讀、核對原生程式碼欄全文，最後關閉分頁並`finish`。control逾時須查同一server/command，不能重送。

Browser操作／畫面證據獨立保存，不能用API結果假填UI通過旗標。`playtt-response-loss-ui-audit.mjs`離線核對兩輪私人快照及實際browser報告，限定自有修訂201、edit-lock72、命令偏好21、單調計數與草稿日期；其他檔／rows與所有既有修訂一致。稽核通過證據見`docs/verification/cloudflare-response-ui-audit.json`。第二輪重試／冷重載通過；第一輪「已儲存」與舊JSON錯誤並存仍待修。未做provider故障或Free限制驗收；74來源／20設定不變，組裝78輔助檔。以下local HTTP與歷史內容保留。

## 最新：本機成功回應本文遺失與冷重試（2026-11-21）

`playtt-response-loss-local.mjs`只供本機驗證，**不可部署**：它打包現有真實執行器，使用無驗證的loopback測試匯入入口，複製私人canonical118備份至新暫存R2／DO。後端成功提交後故意令回應本文失效，停止並重建workerd，再以原生REST讀回／重試；實際200空本文引發JSON錯誤，內容保留，沒有重複頁面或修訂。每次重試仍寫約2.3MB完整包。詳見`docs/verification/cloudflare-response-loss-summary.json`；不代表瀏覽器或Cloudflare驗收。

需先依REBUILD.md準備固定資產及8階段候選，並在私人工作區提供已核驗的`artifacts/playtt-canvas-backup-owned-private.json`、其independent備份、`artifacts/playtt-canvas-ui-owned-private.json`、既有`../../../playtt-cms-secrets.json`。這些檔案不得放Git或偽造信任錨點。從runtime目錄執行 `node --import tsx scripts/playtt-response-loss-local.mjs --local`。只監聽127.0.0.1:9447、禁止Worker外連、自動dispose；既有程序占用端口時應先查明，不停掉不明程序。每次建立新本機副本，不寫雲端、不讀OAuth、不重新部署。報告含本機HTTP時間與限制；備份含私人資料，留在私有暫存目錄。

這次只有新增驗證工具，74來源及20設定未改；重組有73輔助檔。雲端仍118／8pins／封存、餘10,232,130bytes。以下原生編輯鎖與畫布診斷為先前驗證。

# Native editor lock hydration backport


## Subsequent canvas diagnosis (2026-11-21)

The current state is **canonical118 / eight pins / sealed**, remaining **10,232,130 bytes**. Deployment remains2353ff34. A view-only comparison displayed all four draft193 paragraphs in Chrome, while the in-app canvas stayed gray. A synthetic localhost fixture, without WordPress/Cloudflare, isolated the following behavior:

| Frame source | Chrome | In-app browser |
| --- | --- | --- |
| ordinary same-origin URL | loaded, content visible | loaded, content visible |
| srcdoc | loaded, content visible | loaded, content visible |
| blob URL | one load, parent content inserted | zero loads, empty |

The in-app fixture logged two MutationObserver errors although its source never uses that API; the error origin was not identified. This supports an environment-specific blob-frame limitation, not a change to WordPress or its theme. Native visual validation can continue in Chrome while retaining the in-app limitation. The restricted DOM evaluation API does not expose iframe cross-document properties; missing properties were not used as runtime-origin evidence.

Run the delivered `scripts/playtt-canvas-fixture.mjs` locally, then open `http://127.0.0.1:9446/` in each browser. It binds only loopback, serves two fixed routes, and stops after600seconds; `stop` on an open stdin or SIGINT also closes it. The copied HTML matches the exercised fixture. The actual session's stdin was closed, so only its command-identified process was stopped and the original command handle was checked terminal. No cloud route was added.

The300second/6MiB window used4,721,431bytes/76operations. A complete independent backup has298files/300objects,295unchanged. Native editor navigation cleaned stale owned autosave198 and metadata73, matching pinned core cleanup; all page content, other revisions, accounts/sessions/preferences/media/theme are exact. The previous seven pins retain the prior data and pin8 protects current state. This is not manual history pruning. Telemetry has394events/42completed traces, no observed platform exception or request failure, two unattributed cancellations.

The six diagnostic/helper files add no runtime/config changes or deployment. Latest reconstruction compares74sources/72helpers, with all20configs unchanged from the preceding deployment. `playtt-canvas-ui-control.mjs status --remote` is the current read-only status command. Its arm/backup/pin operations already completed; do not replay them. See [diagnosis](../../../docs/verification/cloudflare-canvas-summary.json), [fixture](../../../docs/verification/cloudflare-canvas-fixture.json), and [backup](../../../docs/verification/cloudflare-canvas-backup-result.json). Earlier94/pin7 statements below are historical.

The pinned WordPress 7.1.4 editor initially rendered without hydrated lock state. Its empty React effect dependency list kept that initial state in the heartbeat listeners. A second editor briefly offered Take over, then incorrectly reported lost ownership and repeatedly autosaved. This candidate backports the dependency correction in official [Gutenberg #79997](https://github.com/WordPress/gutenberg/pull/79997), associated with [#79976](https://github.com/WordPress/gutenberg/issues/79976).

Only the exact pinned `editor.min.js` is transformed. Original size/SHA256, a unique replacement site, and final SHA256 must all match. The thirteen added bytes are the compiled dependency names `[t,i,d,c,u,r,o]`. An unexpected or already patched artifact refuses. Original R2 bytes and canonical data are not rewritten. The static handler serves the verified result with its new size/ETag and a separate edge-cache variant. On private post editor HTML, streaming HTMLRewriter versions only the exact same-origin script/preload URL, preserving other query arguments and CSP and updating any existing SRI. This also bypasses an existing browser immutable cache.

The explicit `PLAYTT_CORE_EDITOR_LOCK=gutenberg-79997-v1` flag is present only in the existing `playtt-wp-free-session-audit` configuration. Nineteen other configurations are unchanged. No production routes or plan changes are introduced. Private deployment: `2353ff34-5a75-4d0b-bf50-25b247cf35e8`. Anonymous asset access still returns404. Authenticated GET/HEAD checks verified exact patched bytes while PHP remained sealed and accounting unchanged.

## Native exercise and its limits

Chrome admin1 and the retained in-app editor2 opened owned draft193. After at least30seconds, editor2 still offered Take over. Clicking it made editor2 editable and admin1 displayed the native lost-lock dialog naming editor2. The click tool timed out, so success was established by subsequent DOM evidence without clicking again. Editor2 used the native command palette/code editor to append a unique Traditional Chinese paragraph, clicked Save draft, saw the saved notification, and reloaded. All four paragraphs remained in the native code-editor content field; status remained draft. This did not publish the page.

The in-app visual iframe appeared gray in the captured screenshots, including after returning from code mode. This is **not** acceptance of visual block editing or proof of its root cause. Chrome's first-owner canvas displayed the previous paragraphs. Navigation/tool timeouts and the incomplete request described below remain observable limitations.

The600second/16MiB/256operation window closed early after12,327,671charged bytes/165operations. Read-only comparison of52manifests (43–94) found51commits:48overlays and3full packs totaling6,886,485bytes. This is a different workload from the failed previous run, so no savings percentage is claimed. All original posts, accounts, sessions, media, theme and prior revisions/autosaves are exact in the final independent backup. Changes are strictly checked: draft193 gains the intended paragraph and date updates; new revision200 is exact; only its edit lock, editor2's native command preferences, and monotonic counters also change. No unrelated rows/files were added or removed.

Current state: canonical94 / `bc63cc39-5cd3-4849-b266-10b16e8e75d5`, seven retained pins, pending0, sealed, window closed, fence released, publisher paused. Payload bound135,046,439/150,000,000bytes; remaining14,953,561bytes. Existing test fixtures remain; this is not cleaned delivery data.

Bounded telemetry:794events (783ok/11canceled),89traces with88completed, no observed platform exception, one request-body-unavailable. Several canceled events contain completed mutations; not every cancellation has been attributed. Maximum sampled WASM heap77,594,624bytes is not whole-isolate memory. Both owned tabs and all bounded processes ended.

## Reconstruction and verification

Apply after the previous seven optional stages, including logout persistence. Before this eighth stage, generate WordPress7.1.4 assets using [REBUILD.md](../REBUILD.md); the exact generated static manifest is a prerequisite. The source archive contains7.0.2 metadata, which is deliberately rejected. This turn's source reconstruction explicitly copied the already hash-verified7.1.4 manifest; it did not regenerate core binaries or claim a new independent core build. A fresh deployment still requires all core assets and dependencies from that runbook.

```powershell
python apply-local-candidate.py --runtime <runtime-cloudflare>        # verify only
python apply-local-candidate.py --runtime <runtime-cloudflare> --apply
node --import tsx --test tests/playtt-editor-lock.test.mjs tests/playtt-write-window-execution.test.mjs tests/playtt-session-provider-config.test.ts
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
node node_modules/wrangler/bin/wrangler.js deploy --dry-run --config wrangler.playtt-session-audit.jsonc
```

Fourteen tests pass, including execution of the actual pinned minified component across hydration/heartbeat/unload, old/new cache separation in the actual static handler, real local workerd HTML rewriting, and write-window/config regression. React scheduling and WordPress server hooks in the component test are limited simulations. TypeScript/dry-run pass. Known generated PHP loader eval/duplicate-key warnings remain. The first local workerd attempt used an obsolete Miniflare constructor shape; it was corrected with the installed converter. A second attempt was blocked by local-loopback sandbox access; the same tests passed with local-network permission. These failures were not counted as passes.

Operational helpers run with `node --import tsx` and explicit `--remote`. UI control `status` is read-only and usable now; `arm`, backup and pin are completed one-shot operations and must not be replayed. The asset audit expects43/pin6 and the cost audit94/pin6, so both now deliberately reject current pin7. The cost audit first stopped on its initial GET after OAuth expiration; Wrangler refreshed the same existing authorization, then the bounded read-only audit completed. No scopes were added.

Evidence: [summary](../../../docs/verification/cloudflare-editor-lock-summary.json), [backup](../../../docs/verification/cloudflare-editor-lock-backup-result.json), [native DOM](../../../docs/verification/editor-lock-reloaded-code-dom.txt), [reconstruction](../../../docs/verification/cloudflare-editor-lock-reassembly.json). Next verify the in-app visual canvas, response-loss recovery, latency, physical devices/IME, historical retention and long-term Free operation. Production Pages and its existing visual remain unchanged; PR #4 stays draft.
