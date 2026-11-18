# 私人後台維護操作

適用 `playtt-wp-free-restore-audit`／`restore-v1`。正式 `playtt.tw` 仍由 Pages 提供，發布器保持 paused。本文件供維運者使用；維護指令不建立測試資料，也不要求登入 WordPress 管理帳號。

## 執行條件

從既有 `runtime-cloudflare` 工作目錄執行，使用已固定的 Node 24 與相依套件。本目錄 `playtt-maintenance-operator.mjs` 放到 runtime 的 `scripts/`；憑證由本機私有檔案讀取，不貼進命令列、文件或 Git。所有 Wrangler 指令先設定本專案 `XDG_CONFIG_HOME`，不可使用其他工作的共用登入設定。

| 指令 | 行為 |
| --- | --- |
| `node scripts/playtt-maintenance-operator.mjs status` | 唯讀核對 paused、一致性及備份 fence；所列 cron 來自本機設定，不能當作執行證明 |
| `node scripts/playtt-maintenance-operator.mjs preview` | 查看符合清理條件的數量；不刪除，但可能提交先前尚未保存的 GET 狀態 |
| `node scripts/playtt-maintenance-operator.mjs run` | 明確執行一批，最多20筆，只處理原生規則認定超過七天的 auto-draft；普通 draft 不受影響 |

工具固定目的地及分區，不接受網址、ID、日期、PHP 或 hook 參數；要求發布器 paused，只輸出計數與提交版本，不輸出內容或憑證。HTTP 409／500 或網路逾時會停止，不自動重試。逾時可能已提交，先查狀態與 preview，不能直接假設沒有執行。

## 每日排程

部署設定 `PLAYTT_MAINTENANCE_CRON` 與 `triggers.crons` 均為 `35 18 * * *`，即台灣每日02:35。只派送一批，若 remainingEligible 大於零，留到後續批次。空批次仍可能提交既有 canonical 狀態，不是零成本的讀取。

使用 Cloudflare Cron Events 或短期 tail 核對真實事件。成功記錄 schema 是 `playtt/scheduled-auto-draft-maintenance/v1`，應有 `outcome=completed`、排程時間、數量、revision 與 version；部署成功及 HTTP 200 都不能單獨證明排程已清理。檢查 exception、CPU／記憶體錯誤及 remainingEligible。監看腳本只保存數值摘要，查完須停止，不當作永久監控服務。

若要停用，從私人 audit 設定刪除 `PLAYTT_MAINTENANCE_CRON` 並設 `triggers.crons=[]`，再部署相同私人 Worker。未設定 env 時，即使舊 trigger 在傳播期間送達也不清理。不要停用時順便換回不保存自增序列的歷史程式。

## 備份與復原

`node scripts/playtt-snapshot-audit-backup.mjs --remote` 取得短期 fence，下載目前完整 manifest／restore pack，逐項解碼並驗證 SHA256，finally 釋放 fence；完成前不更新最新備份位置。原始資料只存本機私有備份資料夾。備份下載失敗須先核對 fence 狀態及逾期時間，再決定是否重試。

這是備份完整性檢查；真正復原必須先在另一個隔離 R2／DO 環境驗證。歷史獨立還原流程見 `../runtime-retirement/RESTORE-AUDIT.md`。恢復舊快照會回到那個時間點，較新的編輯與 ID 高水位不在其中，不能把任意歷史回滾當作無損復原。

不要把 `*-prepare` 測試腳本當日常維護指令。這些腳本會建立自有 fixture；遇中斷要先核對 `*-owned-private.json`，不得盲目重跑或刪除不屬於本輪測試的資料。
