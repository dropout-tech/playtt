# 自動發布候選（2026-11-17）

這是安全更新基準之上的候選。正式 playtt.tw 仍為 Pages；本目錄的遠端設定只綁定私人還原測試區與 noindex 預覽。

## 已驗證的流程

WordPress 原生寫入先提交 R2／協調器，產生不可變的發布工作。SQLite Durable Object alarm 每次產生一個頁面，全部完成才以 ETag 條件更新公開版本指標。訪客 Worker 只讀完整版本，不載入 PHP，也沒有後台憑證或修改綁定。

- 本機及遠端：修改頁面、撤回為草稿、重新發布、共用頁尾更新至六頁，通過。
- 本機故障演練：暫停發布後，僅在隔離emulator將已提交的發布工作改成無效格式；恢復發布確認失敗時公開版本維持原版，再還原工作並重試成功。新版共用執行器可能已載入核心，因此不再以移除核心ZIP作為新版故障測試。
- 四項 alarm 測試驗證跨實例續跑、維護暫停、六次失敗停止、程序中斷的已記錄次數。閒置時沒有 Cron 或輪詢工作。
- 公開讀取預覽的六頁、20 個引用資產及 38 次 HTTP 檢查通過：網址轉換、CSS／JS MIME、追蹤參數與 Cookie、舊網址、sitemap、草稿／管理路徑與 PHP 原始碼阻擋。
- 實測發現 DO 不支援原套件的快取刪除；改用發布版本作快取鍵，避免 R2 已切換卻回報失敗。canonical 資產沒有 HTTP metadata，公開讀取改以已驗證路徑決定 MIME，保留 nosniff。

## 重現與部署

1. 先完成相鄰 `security-update/README.md` 的固定版本、套件和核心資產準備。
2. 在上游根目錄套用本目錄 `after-security-update.patch`，再將此目錄的 `src/`、`scripts/`、`tests/` 及 jsonc 覆蓋對應套件路徑。
3. 執行 TypeScript，及 `tsx --test tests/playtt-cms-access.test.ts tests/playtt-publication-alarm.test.ts tests/playtt-public-site.test.ts tests/cloudflare-public-reader.test.ts`。
4. 本機 CMS port9429、讀取服務 port9428，共用獨立 `../../../cf-cms-publish-state`。先執行一般發布測試，再執行 playtt-publication-job-recovery-check.mjs；後者硬性固定本機 emulator，不可改成遠端刪除測試。
5. 遠端 CMS 使用 `wrangler.playtt-cms-publish-restore.jsonc`，只用既有 restore-v1 分區。`playtt-publication-remote-check.mjs` 每個回應都檢查分區；使用本機私有憑證檔，不將密鑰寫入程式庫。
6. 公開讀取預覽使用 `wrangler.playtt-public-preview.jsonc`，沒有正式網域路由與後台憑證。`PLAYTT_PUBLIC_INDEXABLE=false` 禁止搜尋索引。

操作端點 `/__playtt-publishing` 需要測試入口資格及 operator Bearer token。GET 讀狀態；POST JSON action 可為 `pause`、`resume`、`retry`。blocked 不會因一般訪客或登入自動清除；修復根因後才能由操作者重試。

## 界線與後續

發布頁面的原始內容仍存於 WordPress；完整 R2 版本與媒體是還原來源，公開快取不是備份。六頁品牌官網是本次驗收範圍，不保證任意動態外掛、購物車、會員或所有文章彙整頁。

正式後台網域、乾淨內容、登入交付、編輯到正式 playtt.tw 的端到端驗收、正式備份與回滾仍待完成。不可把這份預覽標為全部遷移完成。

證據在 `docs/verification/cloudflare-publication-*.json` 與 `cloudflare-public-reader-remote.json`。未新增付費方案或正式網域路由。

## 最新驗收限制

全域樣式初始化於GET的theme關聯已改用完整canonical inventory保存。原生樣式儲存、重載、重新部署後讀回通過；隨後還原操作與語言包上傳發生遠端記憶體重置。雖然8bb81124版本的316事件及完整發布套件通過，這仍不足以宣稱穩定營運。候選進一步移除請求函式對已dispose的舊PHP promise引用，7b13e109遠端複驗仍在語言初始化與停用時發生記憶體重置，尚未達到正式營運驗收。

PLAYTT_CMS_MODE=production會啟用額外請求邊界，封鎖診斷、內部資料路徑，維運端點需operator資格；目前仍是私人probe配置，尚未正式切換。繁中初始化來源與建置程式位於localization/，本機已驗證，遠端仍待。
