# Let’s Play WordPress

最新可安裝主題為 **0.3.1**，修正品牌 SVG 在原生編輯器顯示無效區塊的問題；已用本機 workerd 完成實際 Chrome 編輯、完整重啟與保存讀回。[修正與驗證](../docs/verification/theme-0.3.1/README.md)。靜態預覽仍為下述0.3.0，正式站未切換。若匯入到已有首頁的網站，請在「設定 → 閱讀」選取「Let’s Play 桌球聯盟」；匯入器會保留原首頁設定。

原生區塊主題在 `lets-play/`。0.3.0依使用者指定的31頁品牌PDF採用原始向量字標、六組聲音圖案與數位配色，六頁由一般WordPress頁面與媒體庫維護。[PDF與資產來源](../docs/brand/README.md)、[0.3.0畫面與驗證](../docs/verification/theme-0.3.0/README.md)、[營業資料查核](../docs/CONTENT_REVIEW_20261125.md)。

- [品牌與內容對照](../docs/BRAND_AND_CONTENT.md)
- [安裝、編輯、部署與備份](../docs/OPERATIONS.md)
- [Cloudflare 免費完整後台研究](../docs/WORDPRESS_CLOUDFLARE_FINDINGS.md)
- [最新進度與限制](../docs/PLAYTT_PROGRESS.md)

工具版本鎖定於 package-lock.json。Node >=24.18、npm >=11.16；`npm ci` 後執行 scripts。`.runtime`、`dist`、`node_modules` 與測試暫存不可進公開部署。

主題已在 WordPress 7.1.4 / PHP 8.3 / Playground SQLite 本機測試。這不代表完整 WordPress 已在 Cloudflare 免費方案驗收。此分支的 `../cloudflare/public/` 保持0.2.3正式內容；0.3.0靜態候選另走 `codex/playtt-brand-manual-preview` 預覽分支。安裝新版主題不會自動覆寫已編輯頁面。
