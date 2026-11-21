# Let’s Play WordPress

原生區塊主題在 `lets-play/`，保留原站原創 Logo、幾何主視覺及品牌配色。六頁由一般 WordPress 頁面與媒體庫維護。

- [品牌與內容對照](../docs/BRAND_AND_CONTENT.md)
- [安裝、編輯、部署與備份](../docs/OPERATIONS.md)
- [Cloudflare 免費完整後台研究](../docs/WORDPRESS_CLOUDFLARE_FINDINGS.md)
- [最新進度與限制](../docs/PLAYTT_PROGRESS.md)

工具版本鎖定於 package-lock.json。Node >=24.18、npm >=11.16；`npm ci` 後執行 scripts。`.runtime`、`dist`、`node_modules` 與測試暫存不可進公開部署。

主題已在 WordPress 7.1.4 / PHP 8.3 / Playground SQLite 本機測試。這不代表完整 WordPress 已在 Cloudflare 免費方案驗收；靜態發布檔在 `../cloudflare/public/`。
