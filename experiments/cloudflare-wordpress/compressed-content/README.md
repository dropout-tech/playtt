# 壓縮差異快照原型（尚未接入 runtime）

目前進度請見[壓縮快照整合候選](../compressed-runtime/README.md)：本機原生 HTTP／備份還原已通過，完整瀏覽器容量與 provider 驗收仍待完成。以下保留原型階段的歷史要求與證據。

本機容量測試已證明，30秒心跳不足以讓既有完整瀏覽器流程放進最後確認的provider剩餘額度。本原型保留原始檔案bytes、時間、修訂、session、鎖與ID，改以明確的新格式打包累積差異；不以省略原生資料更新換取通過。

**目前只有新模組、測試與私人本機證據。Worker入口、保存、一般冷讀、備份與pin工具均未接入，20份設定未改、沒有旗標啟用或部署。** 原有78個來源檔不變，新模組是第79個來源；不得直接把原型當成可上線版本。

## 格式與限制

canonical-compressed-content/v1保留完整原始清單，直接引用一個完整base manifest及base ZIP，另引用compressed-delta-pack/v1的gzip物件。壓縮資料使用獨立delta-packs/<compressed-sha256>.gz名稱，不覆蓋原來以原始SHA命名的物件。舊讀取器及舊server pin會拒絕，不能誤認為舊ZIP或原始檔案。

差異包的確定性標頭包含group／path／size／raw SHA及tombstones，後面依序放原始bytes。讀取先核對壓縮大小與SHA，再將解壓串流寫入預先配置的精確長度buffer；超量立即拒絕並取消串流。標頭、每檔大小與SHA也必須一致。建立時先複製到自有frame再非同步hash，避免呼叫端重用buffer後改變已核對內容。

累積差異至多1MiB、64個變更（刪除與tombstone變更也計入）；manifest／frame標頭各至多256KiB，frame至多1,310,720bytes，壓縮物件至多1,376,256bytes。完整base及最終decoded inventory至多8MiB，禁止overlay鏈結。模組不寫R2、不取得lease、不更新pointer；未符合累積差異條件會回傳null供未來writer轉完整快照，無效格式直接拒絕。

## 驗證與實際數值

24項測試通過：繁中／二進位／空檔、增刪與tombstone、20份快照仍引用同一base、精確1MiB及超限、錯誤來源hash／size、缺依賴、錯誤descriptor、路徑穿越、截斷與損壞gzip、額外成員、解壓超量取消、呼叫端buffer重用、舊讀取器拒絕、轉完整ZIP。TypeScript通過。

使用前輪停止後的本機175資料，以已驗證備份161所引用的完整base建立壓縮差異。5檔原始差異359,284bytes，含標頭360,087bytes，壓縮包26,225bytes；完整manifest仍需74,029bytes，單次包加manifest為100,254bytes。**不能把26KB當整次儲存量**，也未量測完整流程／CPU／延遲／whole-isolate記憶體。

只有新manifest、新gzip、base manifest、base ZIP四個實體依賴物件的獨立副本，來源Map清除後仍逐項精確還原298檔。原頁面不變、autosave206含完整新正文、沒有失敗手動修訂207，session／時間／鎖／計數均原樣保留。再轉成現有完整格式，使用未修改的snapshot bundle匯出及獨立匯入器核對全部內容通過，尚未採用任何pointer。

四物件副本只證明資料可重建；現有圖片／主題服務會直接讀取raw loose objects，正式還原還必須建立它們。完整格式轉換已包含這些副本，但新的production backup工具尚未整合。

本機workerd冷啟動從四個R2物件讀回，再用實際CompressionStream重新編碼、第二次還原298檔一致；2MiB解壓輸出在360,087bytes預期長度上限被拒絕。首次workerd成功後，審查補上先複製再hash與第24項回歸；最終版本使用另一個owner重驗，生成的壓縮包SHA與先前獨立還原原型完全相同。兩個程序都結束、外連0。沒有執行WordPress／PHP或provider驗收。

## 重建與後續

完成editor-heartbeat與先前診斷工具後執行：

```powershell
python compressed-content/install-local-prototype.py --runtime <runtime-cloudflare> --apply
```

先驗證7個prerequisite、4個新增檔；目標已存在即拒絕。安裝僅新增未接線模組、測試與兩個本機工具。Node＋tsx執行tests/playtt-compressed-content.test.ts；playtt-compressed-content-prototype.mjs --offline及playtt-compressed-content-local.mjs --local為已完成且有owner保護的一次性流程，不得移除guard重跑。

下一步依[整合要求](INTEGRATION.md)接入相容讀取、metadata規劃／壓縮寫入、完整fallback、備份／pins及還原，再用新本機副本量測完整瀏覽器流程。不能在仍寫全部raw objects之後再多寫一份gzip並宣稱減量，也不能只關writer就直接回退舊讀取器。

證據：[總結](../../../docs/verification/cloudflare-compressed-content-summary.json)、[真實資料還原](../../../docs/verification/cloudflare-compressed-content-prototype.json)、[最終workerd](../../../docs/verification/cloudflare-compressed-content-local-final.json)。

零Cloudflare請求、零部署、未付費；最後雲端狀態仍是2026-11-21 06:28:14Z的161／pin13／餘1,881,041bytes，未刷新。正式Pages／視覺不變，PR4 draft，完整A01–A20 active。
