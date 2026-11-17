# WordPress / Cloudflare 可行性紀錄

## 目前結論（2026-11-17 14:21）

正式playtt.tw六頁與LINE入口再次唯讀確認正常，仍由Pages服務，原創視覺保留。全Cloudflare WordPress候選尚未通過穩定度驗收：小幅WASM記憶體擴充仍在原生樣式儲存後重置，不將成功的較小測試推論為完整可用。詳細證據與可重現候選見experiments/cloudflare-wordpress/memory-investigation/。

私人還原區已保存294個索引項目的獨立一致性備份；R2確認77個語言檔、管理員zh_TW、初始化外掛已移除、全域樣式覆寫已清空。然而HTTP操作回應失敗，語系及編輯流程不算完整通過。測試發布器目前paused以免重試；這不是暫停整體目標，正式站及原主要資料區未更動。

已提出零新增費用的架構選擇：先交付本機WordPress＋Cloudflare官網，或保留官網並繼續雲端後台研究。尚未收到選擇，不擅自更換架構或啟用付費。一般Workers付費方案也有128MB記憶體限制，不能當成已驗證解方。官方來源：https://developers.cloudflare.com/workers/platform/limits/#memory 。


查核日：2026-11-17。區分本專案實測與第三方成果。

## 最新結果（2026-11-17 13:14）

WordPress 儲存到 R2，再由 SQLite DO alarm 產生完整發布版本的流程已在本機與遠端還原分區通過。頁面修改、草稿撤回、重新發布及共用頁尾六頁同步均有實測；本機故障注入證明失敗保留前版、修復重試可恢復。公開讀取 Worker 沒有 PHP 或後台憑證；六頁及20引用資產通過網址與 MIME 檢查。正式網站仍為 Pages，這些是候選驗收，正式配置與營運交付仍待。

自動工作使用 [Durable Object alarms](https://developers.cloudflare.com/durable-objects/api/alarms/)，沒有閒置 Cron；另外保存失敗次數，六次無進展停止，避免依賴無限重試。DO 不支援實測中的原快取刪除呼叫，改用發布版本隔離快取。重現檔案及限制見 `experiments/cloudflare-wordpress/automatic-publication/README.md`。

## 前次結果（2026-11-17，安全更新驗收）

經典原生修訂還原已通過UI與REST讀回；共用頁尾在原生網站編輯器修改、儲存、重載通過。它們有獨立瀏覽器證據，不以API紀錄代替UI操作。新版修訂面板、導覽與全域樣式仍需完整複核。

上游釘選的舊核心已落後於[WordPress7.1.4安全更新](https://wordpress.org/news/2026/10/wordpress-7-1-4/)及[PHP8.3.36安全更新](https://www.php.net/releases/8_3_36.php)。候選已升級到這兩個版本與Playground3.1.64；本機全空啟動／品牌匯入通過，隔離遠端health回報確切新版本，舊備份六頁／主題／圖片核對通過。主要分區升級前已做224項備份，12:39實際重部署後的修訂還原、頁尾、新草稿與圖片／縮圖保存驗收通過。

更新所需的釘選套件、WASM匯入調整、核心資產產生方式與完整patch保存在 `experiments/cloudflare-wordpress/security-update/`。正式後台發布整合仍未完成；不把更新成功等同完整架構交付。

## 前次結果（2026-11-17 12:02）

免費候選已通過Chrome原生視覺段落修改、儲存與重載、全空遠端初始化，以及從本機備份恢復到另一私有R2桶／獨立DO分區。還原後六頁、主題與品牌圖片雜湊一致，且保留備份時間點（沒有備份後新增的測試文字）；原分區資料未重設。證據 `cloudflare-cms-visual-editor.json`、`cloudflare-cms-remote-fresh-create.json`、`cloudflare-cms-independent-restore.json`、`cloudflare-cms-theme-independent-restore.json`。

修訂紀錄、兩筆並行獨立草稿、一般1100×937圖片上傳與原生縮圖已通過；12:03在部署06361624-ed24-4784-98a1-3335dbb2da0c後再次通過保存檢查。它們不代表同頁自動合併或原生修訂還原介面已驗收。Workers介面仍為Free，R2當期顯示$0；沒有新增付費方案。核心靜態資產已改在DO佇列外讀取，六個代表檔案並行驗證約3.17秒；WordPress登入／寫入仍以數秒至數十秒計，不能聲稱後台效能等同一般主機。

架構仍是候選；正式後台配置、網站編輯器、維護更新與編輯到正式官網發布仍待。正式公開站保持Pages。

## 前次品牌後台結果（2026-11-17 03:30）

Let’s Play 0.2.3 已在 Free 隔離 DO 原生安裝並啟用；六頁、十四張品牌圖片、標題修改、重複匯入保護及重新部署後保存通過。匯入證據版本 `9942691e-59ab-478b-b714-5508e2f30f1e`，重部署版本 `4eb9bdca-1ea5-43aa-953d-c689168f5e9c`。`cloudflare-cms-theme-remote-import.json` 的成功流程沿用前次已成功安裝的 ZIP，並非在同一次報告重新上傳。

先前上傳頁失敗不應單憑記憶體錯誤推論 WordPress 完全無法執行。[Cloudflare 的時鐘限制](https://developers.cloudflare.com/workers/reference/security-model/) 與 [PHP 8.3 uniqid 實作](https://raw.githubusercontent.com/php/php-src/PHP-8.3/ext/standard/uniqid.c) 顯示同步輪詢時間存在相容性衝突。遠端設定 `FS_METHOD=direct` 後上傳頁從500恢復200；再將釘選核心19處 `uniqid` 改成保留前綴的128/192bit加密亂數識別碼後，ZIP安裝與啟用通過。MDI儲存介面3處暫存檔命名也納入同樣處理。原生 PHP `uniqid`、任意外掛與 WordPress 密碼雜湊未覆寫；未將此變更宣稱為所有外掛相容。

使用官方 PHP-WASM 8.3.32、關閉檔案 opcode 快取、合併空站初始化的密碼／網址設定為一次 WordPress 載入。品牌匯入曾在PHP完成後、R2圖片保存階段超出記憶體；候選僅對已優化的品牌素材略過未使用的縮圖生成，一般上傳不受這個條件影響。新候選在本機全新站與遠端成功匯入，且成功版本已移除臨時PHP逐行診斷。

03:29遠端備份一致性與還原包所有檔案SHA256通過；獨立還原仍待。完整遠端視覺編輯、修訂、全空站啟動、並行修改與編輯到正式站發布尚未驗收，不能稱為完整目標完成。

## 前次遠端結果（2026-11-17 02:50）

使用者已授權 Wrangler 必要的 Scripts Write / Routes Write，限定 info 帳號且僅操作 playtt；先前審查阻礙已解除。帳號方案重新確認仍為 Free / $0 / Current plan。

已實際部署隔離 `playtt-wp-free-boot-probe`（約28,997 KiB未壓縮，版本 bc78e4a1-6e45-4da5-a2b0-d538127290ca），設定隨機密鑰後執行八個請求。匿名404、授權health200；一般Worker及SQLite DO的PHP與核心展開均成功。一般Worker完整WordPress boot回503「Worker exceeded resource limits」，相同WordPress 7.0.2/PHP8.5.8在SQLite DO完整boot成功。證據 `docs/verification/cloudflare-boot-remote.json`，保留CF Ray。這裡記錄的是wall time，沒有把它當成CPU量測，也不把503逕自細分為CPU或記憶體原因。

後續已建立私有 R2 桶 `playtt-wordpress-probe` 與完整 DO 候選 `playtt-wp-free-cms-probe`。本機登入、發文、媒體、匿名權限與程序重啟保存通過；遠端最初登入頁 500，tail 明確記錄 DO CPU 超時。嘗試指定 60 秒 CPU 上限時，Cloudflare API 回 `100328: CPU limits are not supported for the Free plan`；設定已移除，沒有升級。證據 `cloudflare-cms-cpu-diagnostic.json`。

階段診斷進一步觀察到：初始化已寫入 R2 並提交協調器，隨後 DO 觸及記憶體上限。下一次冷啟動在 2026-11-17 02:34 成功載入原生登入表單（HTTP 200、CF Ray `a5b894d0dd9714cc-SJC`）；84.9 秒經過時間包含協調器等待及暫時診斷寫入，不能當成正常速度或 CPU 數值。這只證明初始化狀態可讀回，仍未完成遠端登入、文章、媒體與還原驗收。

02:37 關閉 PHP-WASM 檔案型 opcode 快取後，遠端完整登入、發文、草稿、媒體與匿名 WordPress 權限通過；02:40 重新部署後原文章與圖片 SHA256 保存通過。成功版本未做額外 R2 階段診斷寫入，仍為 Free、無 CPU override。登入頁約6.7秒、登入POST11.6秒、發文13秒、媒體12.1秒，均為經過時間，不能當CPU用量。證據 `cloudflare-cms-do-remote-create.json`、`cloudflare-cms-do-remote-after-redeploy.json`。

測試入口需額外探針密鑰，未持有者回404。匿名 WordPress 權限測試指持有探針存取資格但沒有 WP cookie，不能混淆這兩層權限。正式站仍為 Pages，未導向此候選。下一步為遠端主題、視覺編輯、修訂、全空站初始化、獨立備份還原及並行寫入。

02:46 主題驗收發現新的限制：雖然0.2.3本機DO安裝與六頁內容測試通過，遠端原生主題上傳頁在兩次測試均回500。tail明確顯示 `request.php` 階段 `Durable Object's isolate exceeded its memory limit and was reset.`，並非ZIP或品牌內容已上傳後的錯誤。基本CMS成功與完整品牌後台未通過需分開記錄；正比較官方PHP 8.3 WASM的記憶體需求，不升級付費。

## 先前本機與來源查核（2026-11-16）

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
