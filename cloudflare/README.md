# Let’s Play 靜態發布

此目錄只發布 WordPress 產生的公開頁面，不提供線上 wp-admin。部署設定沒有動態 Worker、R2、D1 或付費綁定。

本機或 Pages 建置只需 Node：

```sh
node verify-static.mjs
```

已建立免費 Cloudflare Pages 專案 `playtt-brand-preview`，公開預覽：https://playtt-brand-preview.pages.dev 。GitHub 來源限定 `dropout-tech/playtt`，production branch 暫用 `codex/playtt-wordpress-cloudflare`，根目錄 `cloudflare`，建置 `node verify-static.mjs`，輸出 `public`，環境變數 `SKIP_DEPENDENCY_INSTALL=1`。建置只使用 Node 內建模組，避免根目錄舊站 Yarn lock 影響發布。

現有 `wrangler.jsonc` 是可選 Workers 靜態資產部署設定；Pages 會略過它，使用上述儀表板設定。CLI Workers 部署仍需另外授權，未部署動態 WordPress Worker。

部署後比對遠端檔案：

```sh
node verify-http.mjs https://實際預覽網址
```

比對所有公開檔案 SHA256、404 頁與 `/home/` 的 301。手機選單、舊 `#/class` 與 `#/partner` 必須另外用真實瀏覽器測試。

更新 `public/` 前，先執行 WordPress 匿名匯出並檢查 `test-results/export.json`。它目前以 starter 內容建站；生產編輯資料同步仍待完整後台架構定案，不能用 starter 覆寫尚未備份的編輯內容。

[完整操作手冊](../docs/OPERATIONS.md)
