# PHP 檔案路徑掃描候選

這一輪針對已量測到的 `FS.lookupPath` 暫存陣列配置，改用 `indexOf` 與路徑片段掃描。六個全新本機 workerd 的控制中，平均累計 sampled JS 配置少 **12.77%**，量測時間增加 **6.04%**。原生編輯、繁中保存、完整服務重啟、新分頁讀回、登出及獨立備份均通過；**仍未通過 Cloudflare Free 記憶體驗收，也未採用或部署這個候選**。

正式 Pages 與原站視覺維持現況。中央 loader、82 個 TS 來源、20 份設定、既有雲端 Worker、發布狀態與額度均未修改；0 provider 請求、部署或計費刷新。

## 改動與行為核對

一般字串省去 `split('/').filter(...)` 兩個陣列，保留實際節點查找、權限、errno、`.`／`..`、symlink、mount、parent／follow／noent 選項。絕對路徑的 boxed/custom object 保留原本 split/filter fallback。沒有節點快取、共用 Date、PHP/WASM 二進位變更或安全檢查移除。

- 固定 PHP 8.3.36 WASM；baseline loader `382310127a494ab04b7324823230f3e119e6928330575a3089cd84566da6150f`，candidate `280d74443122ff048049d12fb033cb28cd85e84ca4ae3ee1d390b1df5189de81`。
- 兩版各 3,893 個真實 PHP MEMFS 案例、11,179 次實際節點查找；回傳路徑、節點、errno、選項修改與查找次數精確相同。包含繁中、emoji、組合字元、空路徑、超長斜線、相對路徑、權限、symlink 深度、mount 及非字串輸入。
- 實際 PHP 的繁中檔案寫入、讀取、重新命名與刪除通過；語意輸出 SHA 為 `aa0935c0eaaabe945ac0e14bba7d51a1cb7a4ee7e9104a7bff00a8245107051a`。
- 206 個完整建置輸入、83 份 TS、71 個載入來源通過 typecheck／Wrangler dry-run；編譯差異嚴格限於 `lookupPath`，五個二進位模組精確相同。JS bundle：`efe592948f9141231be34db0258f7275f779832b9bba44676e85d56c89735f96`。

## 配置量控制與限制

順序為 baseline／candidate／candidate／baseline／baseline／candidate。每個全新 workerd 載入真實 PHP/WASM 與 MEMFS，確認 PHP 檔案讀取後，各做 30,000 次混合路徑查詢。checksum／錯誤數一致、外連封鎖。

| 指標 | baseline | candidate |
| --- | ---: | ---: |
| 平均累計 sampled JS bytes | 16,034,496 | 13,987,139 |
| 累計配置範圍 | 15,771,280–16,394,496 | 13,440,800–14,358,884 |
| 平均本機量測時間 | 84.79 ms | 89.91 ms |

這是放大單一熱點的控制，包含已被 GC 回收的配置；不是 WordPress 呼叫頻率、同時存活 bytes、RSS、provider 尖峰或 billed CPU。沒有把少 12.77% 說成整體記憶體下降比例。

初版逐字掃描的語意也通過，但時間約增加四分之一，未採用；原工具與證據留在 private owner。第一次配置 harness 在 bundler 解析 Node builtins 時失敗，尚未啟動量測；修正工具後才產生有效比較。未刪除或覆寫舊紀錄。

## 原生保存、重啟與資料

從 cloud181 的既有離線備份建立隔離的本機 R2／DO，固定 600 秒、1,881,041 bytes、96 ops 視窗，publisher 暫停。瀏覽器以原生段落編輯及儲存按鈕保存 1,875 bytes，SHA `93f8e21c8def8c2d5a6ec9b54d91990b8ef41dadcd847ba4d274da51ba01f39b`；既有 revisions 精確，新增 revision209。這是 DOM 輸入，尚未涵蓋實體 IME／手機。

完整 dispose 舊 workerd、確認兩個埠關閉，再啟動新 instance；沒有重新播種或重開視窗，state、資料與 budget 精確。新分頁顯示相同段落、已儲存及 11 筆修訂；離開編輯器後原生登出成功。原 usermeta／session、媒體、主題與其他內容精確，304 物件／298 檔獨立匯出匯入及 full materialization 一致。

最後 LOCAL191、500,288 bytes／30 puts，closed／sealed／pending0、程序 exit0。這次流程 0 runtime exceptions；1 個初始 gate404，以及 1 個 `/wp-json/wp/v2/global-styles/42` 的 `rest_forbidden_context`403，符合原有編輯權限邊界，沒有放寬權限。不能因此宣稱歷史 network-loss 已修好。

觀測組件合計最高為重啟前 152,741,987 bytes（約145.7 MiB）、重啟後144,502,296 bytes（約137.8 MiB）；仍高於128 MiB。此合計由同一 runtime generation 的 JS usedSize、backingStorageSize 與最近 PHP heap 樣本組成，具有非同步與 observer 開銷，**不是 provider 尖峰或 admission**。

render 取樣包含頁面清單、編輯器與周邊請求；save 取樣也包含 Ajax／控制請求。本輪取樣時間與前輪不同，不能用這兩輪的總量或最大值宣稱整體效能改善。下一步應縮小完整保存流程中的大配置來源，並持續衡量 CPU 代價；首次繁中初始化、長期免費、實體裝置與 A01–A20 驗收仍開放。

## 重建與檢查

接在 `transport-boundary` 的工具組裝之後，執行本目錄 `install-local-tools.py --runtime <runtime> --apply`。核對 196 個前置檔、新增 8 個工具，保留742個舊檔，共750；重套會拒絕且不改動。需要已固定的依賴與私人測試證據，不建立雲端資源。

```powershell
node --import tsx scripts/playtt-path-scan-audit.mjs --local --check
node scripts/playtt-path-scan-build.mjs --local --check
```

已完成的 semantic／allocation／native owner 不可重播。建立新候選需新的 owner、隔離本機資源與實際輸入 SHA。原始 profiles、登入資訊、文章內容與備份 payload 留在私人資料夾，未提交。

證據：[整合稽核](../../../docs/verification/cloudflare-path-scan-audit.json)、[語意比較](../../../docs/verification/cloudflare-path-scan-semantic.json)、[六次配置控制](../../../docs/verification/cloudflare-path-scan-allocation.json)、[完整建置](../../../docs/verification/cloudflare-path-scan-build-proof.json)。

最後雲端確認仍為2026-11-21T16:52:39.597Z、canonical181、歷史餘額62,344bytes、publisher暫停；並非目前帳務讀值。無增額、退款、清 unknown、刪 history／pin 或建立替代雲端資源。PR4 維持 draft，全案 active。
