# Cloudflare WordPress 本機候選測試

這是可重現的實驗，不是正式後台部署。不得將此資料夾內公開的本機測試密碼部署到網際網路。

上游：Automattic/wp-codebox，commit `9764022156a61ba7d2b4d8a2196b01ccb33b82b5`，`packages/runtime-cloudflare` 0.12.27；WordPress 7.0.2、PHP-WASM 8.5.8、Wrangler 4.127.1。主題另以 WordPress 7.1.4 / PHP 8.3 驗證，兩者證據分開保存。

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
