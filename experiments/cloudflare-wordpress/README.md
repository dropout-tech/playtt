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
- 一般完整啟動探針成功；瀏覽器成功登入原生後台，重啟後載入原生區塊編輯器及保存文章。未在此候選完成 Let’s Play 主題安裝或瀏覽器編輯儲存驗收。
- HTTP 測試建立與重啟驗證均通過：文章、媒體 SHA256、匿名草稿 404、匿名後台轉登入。
- 冷登入頁約 2,637ms、登入 POST 約 1,025ms、後台約 614ms，均為本機**經過時間**，不是 Cloudflare CPU 用量。
- 設定雖為 `cpu_ms: 10`，本機 workerd 成功不能證明遠端 Free CPU／記憶體限制可通過。未建立遠端 R2、DO 或動態 Worker；也未驗證遠端備份還原及費用上限。
- 可選網站匯入器契約錯誤仍未解決；它不影響此次有限範圍測試，但不可視為完整上游驗收。

正式採用前仍須完成免費遠端實測、主題安裝、登入編輯、媒體、重部署、備份還原、併發修改及資源用量控制。
