# 附件欄位與原始編號保存

繁中原生編輯器能開啟，但新私人副本的首頁七張圖片都沒有載入。先前 HTTP 還原驗收只證明 15 個上傳檔案存在且雜湊正確，沒有證明 WordPress 媒體庫的檔案關聯完整。這輪只改私人 `playtt-wp-free-rebuild-audit`；正式 Pages、原品牌視覺與來源每日維護 Worker 沒有更動，發布器維持 paused。

## 發現與修正

備份顯示原有 15 個附件的 Markdown 沒有 `_wp_attached_file`／`_wp_attachment_metadata`，舊 `_tables/postmeta.json` 也只保留兩筆非 Markdown 內容的 `origin`。固定 MDI 的可攜 Markdown 匯出會略過大多數底線開頭的內部欄位，剩下欄位也只存 key/value，沒有 `meta_id`。把這種匯出直接當成完整資料庫，會在重建時遺失欄位、重新分配編號。

`playtt-postmeta-policy.ts` 改用完整的 `_tables/postmeta.json`，保留每筆原始欄位，包括編號、保護欄位、重複值、空 key 與 null。第一次 metadata 寫入後，連同 `_runtime/playtt-postmeta-layout.json` 的 `playtt/postmeta-table/v1` 標記一起經既有 canonical 提交機制保存。

有標記時，冷啟動與檔案增量同步以完整 JSON 表為準，不再用 Markdown frontmatter 重建或覆蓋 metadata；暖同步使用既有串流讀取與 SQLite transaction，損壞 JSON 的替換會回滾。無標記的舊備份仍可讀；標記損壞或完整表缺失會拒絕載入。所有固定來源接點先核對，任何接點不唯一時不寫入 PHP 檔案。

**格式相容界線：**新標記的備份必須配合第14段修正或更新的程式使用。不可直接退回舊程式繼續編輯。若需要回到舊格式，必須使用已校驗的修正前備份並另行處理其後編輯；本輪沒有執行資料回滾。修正本身不會猜測或補回歷史上已遺失的資料。

## 驗證

- 實際固定 PHP-WASM、MDI storage/write-engine/loader 與 PDO SQLite：舊版5項重現檢查，10筆原始資料重載後剩4筆，保留欄位的編號也被重新分配。修正版17項檢查全部通過，10筆完整相同；涵蓋冷／暖重載、按 meta_id 更新／刪除相同值其中一筆、Markdown 變更、空表、舊格式、損壞標記／表。測試使用窄型 driver adapter，不冒充完整 WordPress HTTP 測試。
- TypeScript 與私人 Worker dry-run 通過。固定 PHP loader 原有 direct-eval／重複鍵警告保留在 log。
- 原生 WordPress REST 上傳自有16×16 PNG附件128，修改繁中標題與替代文字，重新讀回及檔案 SHA-256 通過。
- 相同程式從 `95da984e-2b04-42d9-b366-9cf094bf6477` 重新部署為 `643a81da-b010-4748-95e2-f22732d9e5e7`，新登入後附件的網址、尺寸、metadata、標題、GUID、替代文字與圖片位元組相同。
- 部署前後兩份完整 R2 備份各自解碼及雜湊校驗。附件128的三筆 metadata 編號18／19／20與值完全一致。這次是完整表欄位驗收，補足先前只查圖片位元組的缺口。
- 僅清除自有附件128，REST與原圖片網址均404。清理後備份 `edf7bf71-b84e-444e-a6d9-1cce10366841` 內，27個原有 Markdown 及15個圖片檔完全不變；原有兩筆 JSON metadata 不變，兩筆原 frontmatter 的頁面範本欄位已移入完整表，合計4筆。新附件資料已移除，`wp_postmeta` 高水位20、`wp_posts` 高水位128保留。
- 最後私人副本 version85、來源 version174，一致、無 fence、paused；未具備 probe 身分的後台、REST、媒體請求404。
- 14段 patch 可從固定上游重新組裝，60個來源檔與候選完全一致。這輪沒有重新安裝依賴或重新產生未變的核心資產。

本輪502個觀測事件中499 ok、3 canceled；3筆均是修正部署前的 `admin-ajax POST`，取消原因尚未證實，其中一筆帶有完成的 mutation trace。沒有記錄到的例外、未完成 trace 或 request-failure。最大觀測 WASM 76,873,728 bytes，不等於整個 isolate 用量或長期穩定保證。觀測程序已停止。分類只保留封閉名稱與 HTTP method，不保留 URL、query、headers 或 body。

## 重現與檔案

在已組裝、安裝固定依賴並完成核心準備的 runtime 根目錄執行：

```powershell
node scripts/playtt-postmeta-php-check.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/playtt-origin-migration.mjs --self-test
```

原生驗收由 `playtt-postmeta-native-check.mjs` 的 upload／cold／backup-compare／cleanup 階段完成，備份工具為 `playtt-rebuild-ui-backup.mjs`，最後核對為 `playtt-postmeta-final-check.mjs`。遠端階段必須有 `--remote`，只允許固定私人 Worker／R2；所有自有狀態檔及完整備份留在本機，不進 Git。現有附件128已清理，不要重跑或改寫既有自有狀態來跳過保護。

主證據在本目錄 `playtt-postmeta-php.json`、`playtt-postmeta-native-*.json`、`playtt-postmeta-final.json`，總表在 `docs/verification/cloudflare-postmeta-summary.json`。

## 尚未完成

原有15張品牌圖片的檔案仍在，但歷史附件關聯尚未修復。應從已驗證的原素材與備份建立有界修復計畫；不能宣稱新的保存規則已恢復舊資料，也不能猜測沒有來源的歷史 metadata。

`playtt-origin-migration.mjs` 僅完成14項本機邊界測試及遠端唯讀規劃；規劃因媒體 source_url 仍指向舊站而停止，沒有套用或回滾內容。它只處理現有可編輯欄位，不處理歷史 revisions。先修復附件，再重新規劃／備份、修改內嵌網址，驗證實際瀏覽器圖片和原生編輯／重新載入。依 [WordPress 遷移文件](https://developer.wordpress.org/advanced-administration/upgrade/migrating/)，GUID維持身份用途，不做網址替換。

仍需實際操作體驗、交接、持續免費用量及後續版本整合。PR #4維持 draft，整體目標 active。
