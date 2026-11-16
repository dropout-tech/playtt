# WordPress / Cloudflare 可行性紀錄

查核日：2026-11-16。區分本專案實測與第三方成果。

本專案 WordPress 7.1.4、PHP 8.3、官方 Playground CLI 3.1.64 本機 9 項整合測試通過，包含編輯、草稿、媒體、重啟、修訂和備份還原。本機 SQLite／磁碟保存不等於 Cloudflare 持久化。

另外，2026-11-16 已對 wp-codebox commit `9764022156a61ba7d2b4d8a2196b01ccb33b82b5` 實測本機 workerd + 模擬 R2 + SQLite Durable Object。WordPress 7.0.2 / PHP 8.5.8 原生登入、文章發布、媒體 SHA256、匿名草稿／後台限制與 Worker 停止後重啟保存通過。其後真實上傳並啟用 Let’s Play 0.2.1 ZIP，匯入六頁／十四張品牌媒體，測試修改、重複匯入不覆寫及重啟後主題 CSS、頁面、媒體保留，均通過。瀏覽器亦載入原生區塊編輯器、修改標題並顯示 Page updated（標題是在 code editor 模式輸入，未改動 HTML）；切回 visual editor 可正常顯示原生內容區塊。未做遠端實測，不能據此判定免費可用。

上游 TypeScript 和 Wrangler dry-run 通過，未壓縮約 23MB。可選 website importer 1.3.6 的能力宣告與來源契約不符，生成命令在該步失敗；此次只配置已驗證的三個核心套件，沒有略過匯入器安全檢查。重現指引：`experiments/cloudflare-wordpress/README.md`；證據：`docs/verification/cloudflare-wordpress-local.json`。

| 路徑 | 查核結果 |
| --- | --- |
| Containers PHP/MySQL | 官方要求 Workers Paid；不符合免費條件，排除 |
| WordPress 靜態匯出到 Pages/Workers | 可先恢復官網；不提供線上 wp-admin，不算完整搬遷完成 |
| HostlessWP | 作者 early preview 使用 PHP-WASM、Hyperdrive 接外部 MySQL、S3/R2；宣稱免費 Worker 可運行，但外部 MySQL 不符合全部 Cloudflare，本專案未實測 |
| Automattic wp-codebox runtime-cloudflare | PR #1886 已合併並記錄登入、編輯、媒體、持久化測試；現行設定 cpu_ms=300000、R2、DO/D1。全 Cloudflare 有技術候選，免費上限仍待本帳號實測 |

2026-11-13 更新的 Workers 限制：Free 每日 100,000 動態請求、CPU 10ms、128MB 記憶體、64MiB 未壓縮 Worker 上限。不能沿用舊有免費 3MB 說法。SQLite Durable Objects 現在有免費方案。R2 免費額度不等於零付費風險，不得新增扣款授權。

19:13 更新：指定帳號 Workers plan 已核對為 Free。另建同版本上游啟動探針，唯讀打包核心檔案，分別在 Worker 與 SQLite DO 測 PHP、核心展開及完整 WordPress boot，本機均成功，dry-run 未壓縮 28,997.06 KiB。DO 官方 CPU 限制與一般 Worker 不同，應分別遠端實測；不能由一般 Worker 的 10ms 直接斷定所有全 Cloudflare 路徑失敗。探針不做 R2／使用者資料保存，尚未遠端部署。

Cloudflare CLI 已登入指定帳號，但 Workers subdomain API 回 10000。追加 OAuth Scripts/Routes/Tail 權限遭自動核准審查拒絕，已停止並詢問使用者僅 Scripts Write / Routes Write 的必要授權，等待回覆。這是權限阻礙，不是免費 CPU 失敗證據，也不代表架構已選定。

下一個遠端驗收需測登入、區塊編輯發布、媒體上傳、匿名權限、冷啟動、重部署、備份還原與並行修改，記錄版本、免費方案及 CPU／記憶體結果。若明確要求付費，停下該路徑而不升級，提供證據與具體取捨。

來源：

- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/containers/platform/pricing/
- https://developers.cloudflare.com/pages/how-to/deploy-a-wordpress-site/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://github.com/hostlesswp/hostlesswp
- https://github.com/Automattic/wp-codebox/pull/1886
- https://github.com/Automattic/wp-codebox/blob/main/packages/runtime-cloudflare/README.md
- https://github.com/Automattic/wp-codebox/blob/main/packages/runtime-cloudflare/wrangler.jsonc
