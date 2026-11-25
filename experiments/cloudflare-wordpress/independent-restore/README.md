# 全新建置與最新備份的獨立還原

此輪把 [REBUILD.md](../REBUILD.md) 的全新依賴／核心資產產物，部署到另一個私人 Worker，再還原每日維護完成後的備份。正式 `playtt.tw` 維持 Cloudflare Pages 與原品牌視覺，沒有後台切換或付費方案變更。

## 本輪結果（2026-11-19）

最新備份從空DO狀態還原成功；7個已發布頁面、版型／導覽／樣式與15個媒體SHA256核對通過。首次相同部署發現下方所述的空白slug缺陷，修正後再相同部署至 `1ca938eb-4984-440b-b6f0-a500d9c20f7d`，草稿126完整保存、刪除後新ID127，124／125／126的過期寫入均被拒絕，兩份自有草稿已清理。原私人草稿6的slug依備份原文恢復空值，已發布內容不變。

最終副本version17／來源version174均一致、無fence、發布器paused。486個有限事件為484ok、2canceled；無記錄到的例外、未完成trace或request failure，兩筆取消原因未證實。最大觀測WASM73,728,000bytes。來源程式版本53980fce未變，正式官網保持現況。完整逐步報告、失敗與安全觀測見 `docs/verification/cloudflare-rebuild-restore-*.json`／`.jsonl`。

## 固定範圍

| 項目 | 值 |
| --- | --- |
| 來源 | `playtt-wp-free-restore-audit`，每日維護候選 |
| 目標 | `playtt-wp-free-rebuild-audit` |
| 新 R2 桶 | `playtt-wordpress-rebuild-audit` |
| DO | 新 Worker 自有的兩個 SQLite DO binding，沒有跨 Worker binding |
| 備份 revision | `359644be-2af8-491c-b178-86c2a98f8f4e` |
| 備份 archive SHA256 | `fa6974d69b826982573ba9320e529d157faf3e849544d1fffd5bffda19e8cad6` |
| 來源高水位 | `wp_posts=125`，來源測試草稿已刪除 |

目標沒有正式 routes、services 或 cron；probe gate 啟用、搜尋引擎 noindex，發布器先暫停再上傳及還原。來源既有每日維護排程不因本輪而修改。原始備份包含帳號與私有內容，只留在本機，不能放入 Git。

## 重現程序與中斷處理

這是鎖定本輪備份及目標的驗收腳本，不是可對任意網站執行的覆寫工具。已使用的目標不再是空白；不要清空它以重跑，也不要對正式站更換此設定。另一輪演練需要另一個明確隔離的目標，並重新核對設定、備份與證據。

1. 依上層重建指南完成全新來源、獨立依賴及核心產物。將本目錄的設定放到 runtime 根目錄、兩個 `.mjs` 放到 `scripts/`。
2. 使用本專案的 Wrangler 登入設定；本機 `../../../playtt-cms-secrets.json` 由既有安全交付取得，不在指令列或紀錄顯示值。`artifacts/playtt-rebuild-restore-input-private.json` 只包含 `directory`，指向已校驗備份所在資料夾。
3. `node scripts/playtt-rebuild-restore-audit.mjs --remote --preflight`：離線解碼 restore pack、核對全部索引物件及三個固定核心產物的長度與 SHA256，也核對目標 binding 和序列。
4. `--capture-source`：先確認來源指標恰為該備份 revision 且發布器 paused，再登入取得頁面／版型／導覽／樣式／私人草稿／語系的比較基準。登入本身可能保存 session、推進來源 revision，因此成功後不可盲目重跑此步。
5. 建立隔離 R2／Worker，設定既有四個 playtt secrets。確認目標無跨 Worker binding、無 cron／正式路由。`--upload` 會再次要求 `pointer=null`、`version=0`，暫停發布器，再上傳 293 個去重備份物件及 3 個核心物件。
6. `--restore`：要求完整上傳報告、目標仍空白且 paused，才採用備份指標；不重設來源。`--verify`：逐項比對語意內容、15 個上傳媒體 SHA256、六個品牌頁與 LINE 入口、主題版本和匿名草稿拒絕。
7. `--sequence-prepare`：建立本輪專屬草稿，確認新 ID 高於備份高水位，向已刪除 ID 124／125 寫入均404；保存自有資料身分後，才重新部署相同程式至同一目標。
8. `--sequence-verify`：讀回完全相同草稿，檢查舊 ID 仍拒絕寫入；僅刪除本輪身分已核對的草稿，再新建以確認 ID 持續遞增，最後清理本輪資料。`--final-status` 唯讀核對來源／目標一致、沒有備份 fence、發布器 paused，及無 probe 身分不能讀取目標後台／REST／媒體。

本輪在第8步發現空白slug被舊loader補成檔名，故先停止，使用 `--inspect-sequence` 記錄每欄雜湊、再完成 [empty-slug 修正](../empty-slug/README.md) 的本機與私人部署驗證。修正後私人草稿6也恢復備份原本空值；`--record-slug-correction` 只在本機以已校驗archive及完整內容比對，要求**唯一差異恰為此欄位**，才另記修正後基準。原基準、失敗與差異均保留。這個專用步驟不是一般可放寬驗收的選項，不得拿來接受任意資料差異。

執行模式範例：

```powershell
$env:XDG_CONFIG_HOME='<本機既有 playtt Wrangler 設定目錄>'
node scripts/playtt-rebuild-restore-audit.mjs --remote --verify
```

每步寫入獨立 JSON 報告，沒有自動網路重試。發生逾時或工具 handle 遺失時，先讀既有報告、指標及 `owned-private.json` 的步驟狀態，不直接再次建立或刪除資料。`sequence-prepare` 拒絕既有自有狀態；`sequence-verify` 若在中途失敗，需要按已完成的刪除／建立進度處理。

`playtt-tail-rebuild-sanitized.mjs --label=<短標籤>` 只收數字階段、記憶體與錯誤類別，不收原始例外訊息、請求內容或 token。驗收結束後停止觀測，不把有限觀測當成長期監控。

## 已保留的非成功步驟

第一次部署已上傳 Worker 版本，但設定 workers.dev 子網域時 Cloudflare 回10007「Worker does not exist」。先讀 deployments 確認版本存在，再用 `wrangler triggers deploy` 完成 URL 設定，沒有重建資源或重傳程式來掩蓋失敗；無法僅憑此判定平台內部原因。

第一次還原呼叫在本機網路受限環境出現 `fetch failed`，沒有完成任何遠端檢查或寫入。使用既有授權網路後再次確認目標仍空白，才完成還原。失敗報告與成功報告分開保留。

第一次相同程式重新部署後，草稿126的空白slug變成檔名；完整比對失敗時尚未刪除任何測試草稿。這是本輪發現並修正的保存缺陷，不能把原版本描述成已通過全部重新部署驗收。

## 驗收界線

本輪是相同內容的獨立災難還原與編號保存驗證。資料中的嵌入網址保留原字串，不能據此宣稱改網域後的圖片、連結與瀏覽器畫面已驗收。HTTP 登入／頁面讀取也不等同完整原生編輯器操作、行動裝置驗收或長期可靠性。來源登入可能改 session，但沒有改品牌內容。

舊備份會回到該備份的序列；無序列的更舊快照無法還原已刪除歷史 ID。有限 WASM heap 數值不是整個 Worker isolate 的記憶體用量。免費方案沒有變更，但仍須持續留意帳號實際用量。
