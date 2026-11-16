# Let’s Play 靜態發布

此目錄只發布 WordPress 產生的公開頁面，不提供線上 wp-admin。部署設定沒有動態 Worker、R2、D1 或付費綁定。

```sh
npm ci
npm run build
npm run deploy
```

CLI 部署需要指定 Cloudflare 帳號的授權；尚未登入時不能宣稱部署成功。GitHub 建置使用根目錄 `cloudflare`，建置 `npm run build`，部署 `npx wrangler deploy`，預覽 Worker `playtt-brand-preview`。

部署後比對遠端檔案：

```sh
node verify-http.mjs https://實際預覽網址
```

比對所有公開檔案 SHA256、404 頁與 `/home/` 的 301。手機選單、舊 `#/class` 與 `#/partner` 必須另外用真實瀏覽器測試。

更新 `public/` 前，先執行 WordPress 匿名匯出並檢查 `test-results/export.json`。它目前以 starter 內容建站；生產編輯資料同步仍待完整後台架構定案，不能用 starter 覆寫尚未備份的編輯內容。

[完整操作手冊](../docs/OPERATIONS.md)
