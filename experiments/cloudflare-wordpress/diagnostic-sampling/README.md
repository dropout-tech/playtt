# 私人後台診斷取樣與延遲驗證

這輪只更新 `playtt-wp-free-rebuild-audit`，程式版本 `04c50a77-d4ca-4af0-93ab-0cc3ff1963e9`。正式 Pages、Let’s Play 原視覺、daily 來源程式與後台選擇保持不變，兩個私人發布器仍 paused，沒有付費變更。

## 證據與修改

遠端 `Date.now()`／`performance.now()` 只在 I/O 後前進，因此先前 phase 中的 lease.release 時間包含之前的同步 PHP／診斷工作，不能解讀成鎖釋放本身耗時。[Cloudflare 計時文件](https://developers.cloudflare.com/workers/runtime-apis/performance/)

改用官方的私人 Durable Object CPU profile：首次五秒捕捉回傳 10393／No recent executions，暖機後只重試一次，以 latest-deployed 捕捉十秒成功，沒有部署或改動 canonical 資料。這是執行個體尚未就緒的結果，不能當成權限或付費限制。[官方 profiling 操作說明](https://developers.cloudflare.com/workers/observability/profiling-in-production/)

7,300 個樣本、7.3 秒取樣 CPU 中，基準 bundle 第 49,581 行的 `logPlayttRuntimeMemory.visit` 自身合計 1.866 秒（25.562%）。分析器驗證 bundle SHA、函式名稱與位置後加總，避免把同名函式混入；使用標準 [pprof schema](https://github.com/google/pprof/blob/main/proto/profile.proto)。這是一輪 profile，未證明遠端曾發生某種特定的 typed-array 誤判。

第17段 patch 將完整檔案掃描限於 PHP 實例首次使用及 after-persist，其他請求仍讀 WASM heap。掃描依 MEMFS mode 區分目錄與一般檔案，支援跨 realm view、數字陣列與空檔案，避免遍歷檔案每個位元組。WeakSet 不保留已退休實例；未掃描時明寫 `fileScanPerformed:false` 並省略檔案總量，不沿用舊數字。`fileBytes` 是 buffer 容量，與 heap 均不等於完整 isolate 記憶體。

## 有限比較與驗證

| 項目 | 結果 |
| --- | --- |
| 登入頁暖機後六次完整回應，中位數 | 基準 2406.077 ms → 修改後 1978.374 ms，減少 427.703 ms／17.776% |
| 控制與限制 | 各排除一次暖機、循序讀取、兩輪都沒有 CPU capture；修改後一輪有 sanitized tail，基準沒有。樣本小且有網路變異，不能推論整個後台或統計顯著性 |
| 五項 Node 測試、TypeScript、dry-run | 通過；實際 PHP-WASM MEMFS 冷／暖／PHP 寫入後再掃描也通過 |
| 原生 HTTP 操作 | 建立草稿144、修改、全新登入逐位元讀回含末尾空白／LF，再按身分清理144及修訂145；原首頁SHA不變 |
| 寫入仍有延遲 | 本輪建立6850 ms、修改8247 ms；一般原生讀取約2.5–4.8秒，仍待改善 |
| 最後完整備份 | revision `78a0d6bd-c4a3-4c7b-be37-66e03578671b`，297物件，全部解碼／SHA驗證通過 |
| 原內容完整性 | 27 Markdown＋10完整表共37個canonical檔逐位元不變，15上傳檔、48 metadata及歷史修訂保留；usermeta session及ID高水位正常推進 |
| 狀態 | 副本version158／daily來源174，均coherent、無fence、paused；未通過probe身分的後台／REST／媒體404 |
| 有限觀測 | 123事件全部ok，0例外、0request failure、0未完成trace；45筆記憶體紀錄中只有首次1筆＋保存後5筆掃描。觀測已停止，無殘留tail程序 |

這輪沒有重做瀏覽器UI、手機或另一個空環境還原；上述事件數不等於請求數，也不是長期穩定保證。最大觀測 WASM heap 73,859,072 bytes、檔案buffer 31,652,392 bytes，不能直接加總當作整個isolate用量。

## 未採用的簡單 OPCache 設定

本機 pinned PHP 有 OPCache，簡單 file-cache-only 設定後兩輪都沒有 cache 檔。八次登入頁請求的後六次中位數為關閉436.564 ms／開啟434.4455 ms，未顯示有意義收益；heap由64 MiB增加到約65 MiB。本機種子不含MDI／真實內容／遠端128 MiB限制，沒有部署此設定。這只能否定這次簡單設定的效果，不能宣稱 OPCache 一概不可行；file-cache-only 下 status=false 本身也不是不支援的證據。

## 重現與交接

先依上層 `REBUILD.md` 組裝、安裝固定依賴並產生核心資產。從 `packages/runtime-cloudflare` 執行：

```powershell
node --experimental-strip-types --test tests/playtt-memory-diagnostics.test.ts
node node_modules/typescript/bin/tsc --noEmit
node scripts/playtt-latency-opcache-local.mjs --local --mode=off
node scripts/playtt-latency-opcache-local.mjs --local --mode=file-cache
node scripts/playtt-memory-diagnostics-php.mjs
```

OPCache 本機工具會產生下一個 MEMFS 檢查使用的 loader；本機報告與遠端結果必須分開。遠端工具是已執行的有界驗收紀錄，不是日常維運批次：

- `playtt-latency-profile-remote.mjs --capture --remote` 與 `--retry-warmed` 僅限指定私人actor；完成報告存在時拒絕覆寫。首次查詢API路徑／cursor處理錯誤均發生在capture之前，修正後才進行上述兩次捕捉。
- `playtt-latency-pprof.py` 只分析保留的基準 profile＋固定SHA bundle，輸出去除路徑／labels／raw stacks的摘要。原始profile、actor識別與bundle留在私人工作目錄，未入Git。這不是任意版本通用分析器。
- `playtt-latency-read-remote.mjs --remote --label=baseline` 或 `sampled` 各一暖機＋六讀取，既有報告拒絕覆寫。對新的候選應另設實驗名稱並記錄實際部署版本。
- `playtt-memory-sampling-native.mjs` 固定預期的原始canonical狀態並保留自有資料清理guard；已完成的144流程不可重跑或刪除guard。
- `playtt-rebuild-ui-backup.mjs --remote --label=after-memory-sampling` 與 `playtt-memory-sampling-final-check.mjs --remote` 保留這次備份／比對流程。完整備份含私密資料，只交付去識別摘要。
- `playtt-tail-rebuild-sanitized.mjs` 僅輸出固定診斷欄位，觀測結束必須停止；沒有背景常駐監看。

新備份仍須搭配完整postmeta及content-byte修正或後續相容程式，不可只回退舊程式。精簡總結見 `docs/verification/cloudflare-diagnostic-sampling-summary.json`；來源與工具對照見 `reassembly-verification.json`。後續優先處理互動延遲、更多原生／手機操作、交接與持續免費用量，PR #4維持draft、目標active。
