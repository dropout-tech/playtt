# WordPress 安全更新候選（2026-11-17）

這份候選替代上一層實驗的舊核心版本。正式官網仍為 Pages；它尚不是已交付的正式後台。

## 版本與必要修改

- WordPress 7.1.4；PHP 8.3.36；Playground universal/wordpress/web-8-3 3.1.64。
- [WordPress 官方安全更新](https://wordpress.org/news/2026/10/wordpress-7-1-4/)及 [PHP 8.3.36 安全版本](https://www.php.net/releases/8_3_36.php)是升級依據。不要將之前的 7.0.2／8.3.32 實驗基準直接用作正式後台。
- 保留原生密碼雜湊、釘選的 opaque ID 相容處理、已優化品牌圖片的縮圖政策。
- 新 PHP loader 使用 `new URL(..., import.meta.url)`，在 Workers bundle 啟動時失敗；`playtt-runtime-prepare.mjs` 僅對釘選版本改用編譯 WASM 靜態匯入，與先前官方 loader 的方式一致。
- 移除舊 `@php-wasm/util` override 與未使用的 web-8-5。保留 override 會使 npm 11.6.2 與 11.16.0 反覆替換套件而無法完成；附鎖定檔已成功安裝並通過 TypeScript。
- 核心靜態檔、主題資產與媒體都沿用原有路徑／manifest／SHA256 檢查，在 PHP 執行佇列外讀取。WordPress 動態請求仍序列執行，避免同一 WASM runtime 並行寫入。

## 重現

1. 使用上一層 README 指定的 Automattic/wp-codebox commit。從乾淨 checkout 套用本目錄 `upstream-playtt-secure.patch`；不要同時套用舊 patch。
2. 將上一層新增的 `.ts` 放進上游 `src/`、`.mjs` 放 `scripts/`、jsonc 放套件根目錄，再以本目錄同名檔覆蓋。此目錄的 `package.json`、`package-lock.json` 覆蓋套件設定；移走舊的 npm-shrinkwrap.json，避免優先使用舊鎖定檔。
3. 在 `packages/runtime-cloudflare` 執行 `npm ci --workspaces=false --ignore-scripts --no-audit --no-fund`，再執行 `node scripts/apply-development-patch.mjs` 與 `node scripts/playtt-runtime-prepare.mjs`。建議使用既有 WordPress 工具鏈的 Node >=24.18 / npm >=11.16。
4. 設定 `WORDPRESS_RUNTIME_ARCHIVE_URL=https://downloads.wordpress.org/release/wordpress-7.1.4.zip`、`WORDPRESS_RUNTIME_VERSION=7.1.4`，執行 `npm run generate:wordpress-runtime-corpus -- --playtt-core-only`。這只產生本案實際使用的 WordPress、核心靜態檔與 SQLite 三個資產；未略過可選網站匯入器的安全檢查後使用它。
5. 執行 `npm run build`。本機 `playtt-cms-local-prepare.mjs --fresh` 使用獨立 `../../../cf-cms-secure-state`；啟動 `wrangler.playtt-cms-fresh-local.jsonc`，port9429。執行 basic check 與 theme check（URL 指向9429，安裝加 `--optimized-starter`）。
6. 遠端仍只操作 playtt 私有資源。先備份，再預置新資產，先部署 restore config 驗證舊備份相容，最後才回 primary config；不要重設原分區。

核心三個資產合計 93,840,455 bytes；腳本設96 MiB上限。R2資料不嵌入Worker。沒有新增付費方案、Cron或正式網域路由。

## 驗收界線

本機全空啟動、登入、文章／草稿／媒體、原生ZIP安裝、六頁／十四張品牌圖匯入與重載通過。隔離遠端實際 health 回報7.1.4／8.3.36，舊備份的六頁、主題和品牌圖通過；六個編輯器資產符合新manifest大小／雜湊且匿名仍404。

主要分區另以 `playtt-cms-editor-check.mjs --native-revision-restored` 核對原生修訂還原後的關於頁與頁尾標記，並測試草稿與一般圖片；實際重部署後加 `--verify-restart`。測試標記只在私人後台，不在正式官網。

網站導覽／全域樣式、後台到正式公開站的自動發布與最終營運交付仍須完成。完整實測證據以 `docs/verification/cloudflare-secure-*.json` 為準。
