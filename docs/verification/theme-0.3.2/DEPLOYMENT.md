# 0.3.2 品牌預覽發布

2026-11-25：[新版預覽](https://8d3afc93.playtt-brand-preview.pages.dev/)已發布成功。來源 `06edf21b461db777c9a1536697731a17774e669a`，獨立預覽分支 `codex/playtt-brand-manual-preview` 的靜態提交 `132910d4a0102266f7c078c7ce60c38546296f32`。

Cloudflare deployment `8d3afc93-9e2e-4520-861c-283ef2438852`，環境 Preview、狀態 Success，建置23秒。六頁／51檔靜態驗證通過，49個公開檔案發布；8新上傳、41重用，2個redirect及3個header規則，沒有Functions。[Dashboard可見紀錄](deployment-dashboard.txt)。既有Wrangler設定未用於Pages的警告保留在紀錄中。

- [預覽HTTP檢查](preview-http.json)：49檔逐位元相符，404及301規則通過。
- [正式站HTTP檢查](production-http.json)：46檔仍與原發布內容相符。正式 `playtt.tw` 保持0.2.3。
- [Chrome檢查](preview-browser.json)：首頁375與1440px無水平溢出；六個原始品牌圖案、CTA白字藍底及兩個據點地圖正確。手機五個選單項高60.75px，Escape關閉並回到開啟選單按鈕，console warn/error為空。

這是靜態預覽及模擬視窗檢查；不是實體手機或雲端WordPress驗收。0.3.0的PSI分數仍只屬於0.3.0，本輪未重測0.3.2效能分數。完整原生編輯證據仍屬0.3.1。

正式Pages的production branch仍是 `codex/playtt-wordpress-cloudflare`；其 `cloudflare/public` 沒有改動。品牌PDF留在docs；沒有複製到公開網站。私人WordPress維持封存、暫停發布，沒有後台切換。

![手機預覽](preview-375.jpg)

![桌機預覽](preview-1440.jpg)
