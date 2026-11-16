# WordPress / Cloudflare 可行性紀錄

查核日：2026-11-16。區分本專案實測與第三方成果。

本專案 WordPress 7.1.4、PHP 8.3、官方 Playground CLI 3.1.64 本機 9 項整合測試通過，包含編輯、草稿、媒體、重啟、修訂和備份還原。本機 SQLite／磁碟保存不等於 Cloudflare 持久化。

| 路徑 | 查核結果 |
| --- | --- |
| Containers PHP/MySQL | 官方要求 Workers Paid；不符合免費條件，排除 |
| WordPress 靜態匯出到 Pages/Workers | 可先恢復官網；不提供線上 wp-admin，不算完整搬遷完成 |
| HostlessWP | 作者 early preview 使用 PHP-WASM、Hyperdrive 接外部 MySQL、S3/R2；宣稱免費 Worker 可運行，但外部 MySQL 不符合全部 Cloudflare，本專案未實測 |
| Automattic wp-codebox runtime-cloudflare | PR #1886 已合併並記錄登入、編輯、媒體、持久化測試；現行設定 cpu_ms=300000、R2、DO/D1。全 Cloudflare 有技術候選，免費上限仍待本帳號實測 |

2026-11-13 更新的 Workers 限制：Free 每日 100,000 動態請求、CPU 10ms、128MB 記憶體、64MiB 未壓縮 Worker 上限。不能沿用舊有免費 3MB 說法。SQLite Durable Objects 現在有免費方案。R2 免費額度不等於零付費風險，不得新增扣款授權。

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
