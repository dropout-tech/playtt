# Cloudflare WordPress 候選測試

這是可重現的實驗，不是正式後台部署。不得將此資料夾內公開的本機測試密碼部署到網際網路。

目前應使用 [security-update/README.md](security-update/README.md) 的WordPress7.1.4／PHP8.3.36候選與對應patch／鎖定檔；下方舊版本流程保留作歷史驗證與比較。舊釘選版本不作正式後台基準。

上游：Automattic/wp-codebox，commit `9764022156a61ba7d2b4d8a2196b01ccb33b82b5`，`packages/runtime-cloudflare` 0.12.27；WordPress 7.0.2、PHP-WASM 8.5.8、Wrangler 4.127.1。主題另以 WordPress 7.1.4 / PHP 8.3 驗證，兩者證據分開保存。

## 最新進度：2026-11-17 12:02

Chrome已完成原生視覺段落編輯、Save200、Page updated及重新載入；重新部署切回原分區後仍保留。短效測試入口到期會404，需在另一分頁重新驗證資格，保留編輯頁後再儲存；這不是WordPress權限繞過。內建瀏覽器的blob畫布未渲染，Chrome可用。核心靜態資產透過原有R2/雜湊驗證在DO佇列外讀取；六個代表資產並行3.17秒、bytes/SHA256與匿名404通過，並非全編輯器載入時間。

全空遠端與獨立還原皆已通過。操作順序是：先在原分區執行`playtt-cms-backup.mjs --remote`；另建`playtt-wordpress-restore-probe`，以`playtt-cms-provision.mjs --remote --restore-target`只預置核心；部署`wrangler.playtt-cms-restore.jsonc`；以`playtt-cms-restore.mjs --check-empty`確認pointer=null/version=0，執行`playtt-cms-check.mjs <remote-origin> --fresh-remote`測首次初始化；以`playtt-cms-restore.mjs --upload-backup`從本機備份複製去重後210物件，再執行`--restore`與`playtt-cms-theme-check.mjs <remote-origin> --verify-restart --restored-backup`。還原腳本必須取得`X-Playtt-Probe-State: restore-v1`才可重設合成測試分區；原分區不變。備份時間點不含其後視覺測試標記，還原有明確檢查。

完成後已部署回`wrangler.playtt-cms.jsonc`原分區。`playtt-cms-editor-check.mjs`另驗證視覺修改與兩筆修訂紀錄、兩筆並行獨立草稿，以及未加品牌標記的1100×937圖片產生原生縮圖、原檔／縮圖SHA256；create與`--verify-restart`實際重部署後保存皆已通過，最後驗證部署06361624-ed24-4784-98a1-3335dbb2da0c。這不證明同頁同欄位自動合併，也不代替原生修訂還原介面驗收。

Workers介面再次確認Free/$0/Current plan，R2顯示當期$0；細節與讀取延遲在`cloudflare-r2-current-usage.json`。正式官網仍為Pages，網站編輯器、原生修訂回復、正式CMS配置與發布整合仍未交付。

## 前次進度：2026-11-17 03:30

目前候選使用 PHP-WASM 8.3.32（`@php-wasm/web-8-3@3.1.46`）。在下方原本依賴安裝完成後，執行 `npm install --no-save --package-lock=false --workspaces=false --ignore-scripts --no-audit --no-fund @php-wasm/web-8-3@3.1.46`，再執行 `node scripts/apply-development-patch.mjs`。新加入的 `playtt-php-compat.ts`、`playtt-probe-access.ts` 放入上游 `src/`；所有 `.mjs` 放 `scripts/`；jsonc仍放套件根目錄。套用新版 `upstream-playtt.patch`。

品牌遠端已通過：0.2.3真實ZIP安裝與啟用、六頁／十四張品牌媒體匯入、編輯、再次匯入不覆寫不重複、六頁與R2圖片／CSS讀取，以及實際重新部署後保存。`cloudflare-cms-theme-remote-import.json` 是 `--resume-installed --optimized-starter` 流程，沿用前次已成功安裝的主題；不是在該次報告重複上傳ZIP。重部署證據 `cloudflare-cms-theme-remote-after-redeploy.json`。此前失敗紀錄保留，不能與最新結果混用。

相容性處理僅釘選核心19處與MDI暫存檔3處`uniqid()`，使用128/192bit加密亂數且保留前綴；PHP原生函式、第三方外掛與WordPress原生密碼雜湊不替換。函式數量不合即停止，更新核心需重審。`FS_METHOD=direct`、opcode關閉、空站初始化合併為一次PHP請求；品牌素材已有最佳化，僅對`_lets_play_asset`略過多餘縮圖，一般媒體上傳仍維持WordPress原生行為。逐行PHP診斷已移除。`playtt-php-compat-check.mjs`需本專案`wordpress`工具依賴，測20,000個ID，結果是本機PHP8.3.36而非遠端PHP8.3.32。

全新本機狀態使用`wrangler.playtt-cms-fresh-local.jsonc`、port9429、`../../../cf-cms-fresh-state`，先以`playtt-cms-local-prepare.mjs --fresh`預置，測試指令指定`http://127.0.0.1:9429 --optimized-starter`。這不替代全空遠端初始化驗收。

受保護的瀏覽器入口為`/__playtt-probe-access`，以私有operator碼換30分鐘host-bound HMAC cookie（Secure、HttpOnly、SameSite Strict）；cookie不含operator secret，也不授權operator API，後台仍須WordPress登入。入口只供驗收，不作正式營運帳號設計。`playtt-probe-access-check.mjs`驗證未登入、錯誤碼、跨站表單、篡改及跨host拒絕。`playtt-cms-backup.mjs --remote`取得短期一致性鎖，下載manifest與restore pack並逐項驗證215物件，備份僅在本機outputs，不能提交；尚須獨立還原驗收。

## 前次進度：2026-11-17 02:50

使用者已授權 Scripts Write / Routes Write，原有權限阻礙解除。`playtt-wp-free-boot-probe` 已遠端測試：一般Worker完整WordPress boot遇503資源上限，SQLite DO同核心boot成功；匿名404。指定帳號方案再次確認為Free。下方2026-11-16的「未遠端部署」文字是歷史基準，不代表現在狀態。

`worker-playtt-do.ts` 將完整 `createCloudflareRuntime` 放入 `PlayttWordPressExecution` SQLite DO，使用獨立 `WordPressStateCoordinator` 維持上游租約協定。各站執行佇列依序處理，入口只轉送；沒有排程或正式網域路由。四項後台/操作密鑰不齊時回503，所有回應含noindex。

新候選已通過TypeScript、dry-run，以及本機9428的登入、發文、上傳、草稿/後台匿名限制和真正程序重啟保存。狀態目錄為 `../../../cf-cms-state`；不與先前9426基準混用。將 `worker-playtt-do.ts` 放上游 `src/`，三個 `playtt-cms-*.mjs` 放 `scripts/`，兩份 `wrangler.playtt-cms*.jsonc` 放套件根目錄。執行 `node scripts/playtt-cms-local-prepare.mjs`，再執行 `wrangler dev --local --config wrangler.playtt-cms-local.jsonc --ip 127.0.0.1 --port 9428 --persist-to ../../../cf-cms-state`；用 `node scripts/playtt-cms-check.mjs` 測試，重啟後加 `--verify-restart`。

遠端隔離資源為 `playtt-wp-free-cms-probe`、私有標準R2桶 `playtt-wordpress-probe`、兩個SQLite DO類別。預置三個核心物件總量限制70MiB，先核對SHA256，再以 `node scripts/playtt-cms-provision.mjs --remote` 上傳。沒有可選website importer。

02:37 遠端原生登入、發文、草稿、媒體與匿名 WordPress 權限測試通過；02:40 重新部署後再次登入、讀取原文章與媒體 SHA256、草稿及後台限制通過。證據 `cloudflare-cms-do-remote-create.json`、`cloudflare-cms-do-remote-after-redeploy.json`。成功版本依序為 `7537919b-1fe8-49d8-b0b2-303c60c7ef45` 與 `9c32513b-05bd-4662-8b12-3cabd0ee3d85`。這些是隔離候選驗收，不是正式品牌後台已上線。

起初完整候選曾觸及 DO CPU 與記憶體限制。Free API 明確拒絕 `cpu_ms:60000`（100328），已移除此設定，沒有付費升級。上游 patch 關閉 PHP-WASM 檔案型 opcode 快取，避免在記憶體檔案系統累積編譯副本；密碼雜湊與驗證方式保持 WordPress 原生。暫時 R2 階段診斷寫入已移除，成功版本僅記錄不含請求資料的階段名稱。新的全空站初始化仍需單獨驗證，因目前成功樣本沿用已提交的初始化資料。

重現時先在上游 checkout 根目錄套用 `upstream-playtt.patch`（包含 boot probe export、受控階段日誌與 opcode 設定），再依上述路徑放入探針檔案。設定 `PLAYTT_PROBE_GATE=true` 的遠端入口必須攜帶私有 `X-Playtt-Probe`；未持有者404，該標頭會在傳進 WordPress 前移除。匿名權限測試指持有探針存取資格、但沒有 WordPress 登入 cookie 的請求。額外探針保護不替代 WordPress 權限。

`playtt-cms-theme-check.mjs` 測 0.2.3 真實 ZIP 上傳／啟用、六頁與十四張品牌媒體、編輯、再次匯入不覆寫及六頁輸出。預設本機9428，加遠端origin才測雲端；重部署後加 `--verify-restart`。ZIP來自交付 `outputs/lets-play-theme-0.2.3.zip`，以固定SHA256校驗。02:41 本機安裝通過；遠端兩次在原生 `theme-install.php?tab=upload` 回500，尚未上傳主題。02:46 tail確認 `request.php` 階段觸及DO記憶體上限，即使opcode關閉仍未通過。證據 `cloudflare-cms-theme-remote-failure.json`。不能把基本CMS通過視為完整品牌後台驗收。

遠端四項隨機Secret只存本機 `work/playtt-cms-secrets.json` 與Worker Secrets，絕不提交。`wrangler.playtt-cms.jsonc`不含密碼；入口在配置Secrets前保持503。`node scripts/playtt-cms-check.mjs https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev` 才讀私有檔測試。正式網域仍由Pages提供，不指向這個探針。R2沿用帳號既有啟用狀態與免費額度，建立前用量158.57MB、當期0美元，未新增扣款或升級；最終仍需記錄測試後用量與清理策略。

## 重現方式

1. 在隔離工作資料夾 clone 該 commit，取出 `packages/runtime-cloudflare`。在該套件資料夾執行 `npm ci --workspaces=false --ignore-scripts --no-audit --no-fund`，再執行 `node scripts/apply-development-patch.mjs`。
2. 執行 `npm run build`、`npm run dry-run`。此處 dry-run 不建立遠端資源；原始設定不是免費方案設定。
3. 執行 `npm run generate:wordpress-runtime-corpus`。目前在 website importer 1.3.6 的能力宣告檢查失敗：`Runtime package profile does not declare component ability: static-site-importer/import`。前面三個 WordPress／靜態／SQLite 套件已寫入。不要略過匯入器安全檢查後宣稱完整套件可用。
4. 將這個資料夾的兩個 `.mjs` 複製到候選的 `scripts/`，將 `wrangler.free-local.jsonc` 複製到候選套件根目錄。一般 WordPress 啟動不需要可選網站匯入器，因此本實驗只配置那三個已核對大小和 SHA256 的套件。
5. 執行 `node scripts/playtt-local-prepare.mjs`。它強制 `r2 object put --local`，在候選根目錄的 `../../../cf-state` 保存本機狀態。Windows 路徑應保持短，避免 SQLite 暫存檔超過平台路徑限制。
6. 執行 `node node_modules/wrangler/bin/wrangler.js dev --local --config wrangler.free-local.jsonc --ip 127.0.0.1 --port 9426 --persist-to ../../../cf-state`。
7. 另一個 shell 執行 `node scripts/playtt-local-check.mjs`。它建立測試文章、草稿及 PNG，驗證登入、匿名限制、文章可見及 R2 媒體 SHA256，報告寫到 `artifacts/`。
8. 停止 Worker，再用第 6 步相同狀態目錄重啟，執行 `node scripts/playtt-local-check.mjs --verify-restart`。

## 2026-11-16 結果

- TypeScript、Wrangler dry-run 通過；未壓縮打包 23,364.67 KiB，gzip 8,386.02 KiB。
- 一般完整啟動探針成功；瀏覽器成功登入原生後台，重啟後載入原生區塊編輯器及保存文章。Let’s Play 主題與瀏覽器標題儲存的後續結果見下方。
- HTTP 測試建立與重啟驗證均通過：文章、媒體 SHA256、匿名草稿 404、匿名後台轉登入。
- 冷登入頁約 2,637ms、登入 POST 約 1,025ms、後台約 614ms，均為本機**經過時間**，不是 Cloudflare CPU 用量。
- 設定雖為 `cpu_ms: 10`，本機 workerd 成功不能證明遠端 Free CPU／記憶體限制可通過。未建立遠端 R2、DO 或動態 Worker；也未驗證遠端備份還原及費用上限。
- 可選網站匯入器契約錯誤仍未解決；它不影響此次有限範圍測試，但不可視為完整上游驗收。

其後 `playtt-theme-check.mjs` 已將 Let’s Play 0.2.1 ZIP 透過真正的 WordPress 上傳表單安裝並啟用。六頁／十四張品牌媒體匯入、標題修改、再次匯入不覆寫及不重複、Worker 重啟後六頁、主題 CSS 和 R2 品牌圖片 SHA256 均通過。證據為 `docs/verification/cloudflare-theme-local.json`。這項固定基準針對 0.2.1；重現時設定 `PLAYTT_THEME_ZIP` 為已交付的 0.2.1 ZIP，先執行 `node scripts/playtt-theme-check.mjs`，重啟後再加 `--verify-restart`。

瀏覽器登入後開啟原生區塊編輯器，修改標題並儲存為「關於 Let’s Play｜瀏覽器編輯驗證」，顯示 Page updated。測試使用 code editor 模式的普通標題欄位，沒有手動修改頁面 HTML；切回 visual editor 後內容區塊正常。此後如要重跑保存驗證，應把本機測試 state 的 expectedAboutTitle 改為這個已知 UI 測試值，或回復到原本測試標題。

正式採用前仍須完成免費遠端實測、完整視覺編輯操作、重部署、備份還原、併發修改及資源用量控制。

## 免費 CPU 啟動先決條件探針（19:13，尚未遠端部署）

新增 `playtt-free-probe.ts`、`playtt-probe-zip.d.ts`、`wrangler.free-probe.jsonc`、`playtt-boot-check.mjs`。把前兩檔放在上游 `src/`，設定放套件根目錄，檢查腳本放 `scripts/`；唯一上游修改是在 `src/worker.ts` 的 `runBootProbe` 函式加上 `export`。

此探針將已核對 SHA256 的 WordPress 核心 ZIP 與 SQLite 外掛 ZIP 打包為唯讀資產，以原上游 `runBootProbe` 分別在一般 Worker、SQLite Durable Object 執行 `php`、`streamed-files`、`mdi-wordpress`。它不建立 R2、不保存使用者資料、沒有正式域名路由，也不提供 WordPress 管理介面。DO 在此只比較執行環境，**不代表資料持久化驗證**。官方 DO 文件列出較長 CPU 限制，因此應實測，不能僅用一般 Worker 10ms 推斷整個 Cloudflare 不可行。

TypeScript 與 dry-run 成功，未壓縮 28,997.06 KiB。以 `wrangler dev --local --config wrangler.free-probe.jsonc --ip 127.0.0.1 --port 9427 --var PLAYTT_PROBE_TOKEN:local-boot-probe-only --persist-to ../../../cf-boot-state` 啟動，再執行 `node scripts/playtt-boot-check.mjs`：匿名 404、授權 health 200、兩種環境的三個啟動階段均成功。本機時間不能當遠端 CPU 證據。

遠端只能使用獨立產生的高熵 `PLAYTT_PROBE_TOKEN` secret，不可使用公開本機值；預設未配置 secret 時全部回 404。正式 secret 存在工作區私有暫存檔 `work/playtt-probe-secret.txt`，不可提交或交付。`playtt-boot-check.mjs <remote-url>` 才會讀此檔；目前尚未產生遠端 secret。

指定帳號的 Workers plan 已確認 Free。CLI 登入成功，但部署在讀取 workers/subdomain 時被 Cloudflare API 10000 拒絕，未建立遠端資源。追加 OAuth Scripts/Routes/Tail 權限的操作遭自動核准審查拒絕；已改為向使用者詢問僅 Scripts Write / Routes Write 必要授權，等待答覆，不繞過審查。

官方限制：[Workers](https://developers.cloudflare.com/workers/platform/limits/)、[SQLite Durable Objects](https://developers.cloudflare.com/durable-objects/platform/limits/)。此探針若通過，仍須另驗證完整後台、媒體、持久化、備份與費用控制。
