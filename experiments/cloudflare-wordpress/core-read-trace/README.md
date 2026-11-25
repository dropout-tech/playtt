# WordPress 實際核心讀取與解壓追蹤

本輪確認單檔快取幾乎沒有重用：兩個程序階段共有 **16,903 次解壓入口呼叫、36 次命中、16,867 次實際解壓，累計輸出 374,018,140 bytes**。這是累計工作量，不是同時占用的記憶體。完整原生保存、重啟、登出與備份資料核對通過；另有兩次未釐清的 runtime 網路例外，免費後台仍未驗收。正式官網及中央 runtime 不變。

## 精確版本與追蹤界限

隔離完整建置 `71e610a9f86da6eafd338d35afc95690014aabd87bb6079f5d848f05f22a2bdc`；模組 `5d10dc74a250f4d3a26685216debb9d54c8799c8ebce7bca4a54329a13f15c19`。前輪 210 項輸入只替換壓縮模組，209 項不變；73 個來源、5 個二進位模組及編譯差異核對，TypeScript、dry-run 和 22 組真正 PHP/MEMFS 比較通過。解碼選項、精確輸出長度、單檔 512 KiB 快取與讀寫行為保持原有語意。

診斷只記錄核心檔名、長度、命中、解壓次數、操作種類及有序 run-length 序列；不記錄檔案內容、密碼或請求資料。最多 2,048 個 512 字元路徑、65,536 段順序，固定 typed arrays 共 458,752 bytes；超限明確標示，不清空重算。邊界合約測試涵蓋壓縮順序、原因、累計值、快照獨立副本及兩種截斷。每個程序只安裝一次，兩份實際紀錄均未截斷；直方圖、序列及原單檔快取的逐次重播完全一致。所有實際入口均為 read，未發生 mmap/materialize。

| 階段 | 使用核心檔 | 呼叫／命中 | 實際解壓 | 累計解壓輸出 | 唯一原文量 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 重啟前 | 575 | 10,779／22 | 10,757 | 238,505,641 B | 12,843,176 B |
| 重啟後 | 550 | 6,124／14 | 6,110 | 135,512,499 B | 12,370,409 B |

讀取以整批核心循環為主。重啟前 formatting.php 被解壓 21 次、blocks/blocks-json.php 32 次，並非單一檔案在同一次讀取內反覆命中。詳細檔名、區段邊界與離線模擬見[追蹤分析](../../../docs/verification/cloudflare-core-read-trace-analysis.json)。

## 同一實際序列的快取假設

離線模擬 LRU，依實測每檔 backing capacity 計費；超大檔略過、materialize 移除該項。這沒有執行新的快取實作，不能當作效能、相容性或 provider 記憶體結果。

| 假設快取上限 | 重啟前仍需解壓 | 重啟後仍需解壓 |
| --- | ---: | ---: |
| 512 KiB | 236,134,729 B | 133,997,467 B |
| 8 MiB | 236,123,699 B | 133,991,952 B |
| 12 MiB | 12,915,404 B | 12,370,409 B |

從 512 KiB 到 8 MiB 幾乎沒有額外效果，與單檔原版相比也只少解壓約 1%。12 MiB 才跨過這批請求的重用工作集合，但會增加保留的解壓資料。下一步用這兩份實際順序，做原單檔、同容量 LRU 與固定 12 MiB LRU 的隔離 workerd 控制，核對完全相同的解碼內容、容量、配置與觀測值。必須實測保留量與暫存量的取捨，不能把離線減少解壓比例當成整個後台改善率。

## 原生資料與未解決項

沿用 cloud181 獨立備份、600 秒／1,881,041 bytes／96 operations 的本機窗口。繁中原生保存 1,875 bytes，receipt187，完整 disposal 後同一窗口、資料及預算精確；新分頁顯示相同內容、11 筆修訂。最終 LOCAL191／500,108 bytes／30 puts，closed、sealed、pending0、程序 exit0。原 posts、usermeta/session、媒體與主題不變，新增 revision209；304 物件／298 檔獨立匯出、匯入、完整 materialization 相同。

兩次 multipart 解除鎖定均 outer/execution200；原生登出 outer/execution302，UI 顯示完成登出，原 session 保留、新 session 移除。無 HTTP 錯誤，但重啟後登出標籤附近出現 **兩次 `Uncaught Error: Network connection lost.`**，沒有 stack frame 或對應 request ID。不能據此斷言來自關閉分頁、可忽略或已修好；零例外條件仍不通過。初版稽核的零例外斷言失敗已保留，修訂後的報告明確區分資料核對與例外，不改資料斷言。

本輪仍有 JS＋backing＋最近 PHP 的非同步合計觀測 **183,014,837／184,781,752 bytes**，不是同步尖峰、RSS 或 provider admission。追蹤 typed arrays、Inspector 讀回與瀏覽器時序都有額外成本，不能與前輪數字作受控改善比較。命令選單／先前403、全新繁中初始化、實體 IME／手機、長期免費與 A01–A20 仍開放。

第一次追蹤收集器未指定 workerd execution context，於控制台標記失敗。該次只登入／登出，保留 5,611 次呼叫的部分紀錄；本機窗口先關閉封存（pending0、LOCAL185／199,837 bytes），再只停止已核對的三個程序，terminal exit1。不是完成原生驗收，也沒有重播原 owner。修正 contextId 後用不同 owner／ports9562–9563 執行上述完整流程；原失敗 inputs、紀錄與停止證據均保留。

## 重建與交付

接續 `core-sized-editor` 的 260 個工具前置條件，新增 13 個本機工具。`install-local-tools.py --runtime <runtime> --apply` 驗證雜湊後安裝；已存在的 owner 或目錄一律拒絕重播／覆寫。所有實驗均已終止。唯讀重算：

```powershell
node scripts/playtt-core-read-trace-build.mjs --local --check
node --import tsx scripts/playtt-core-read-trace-editor-v2-audit.mjs --local --check
node scripts/playtt-core-read-trace-analysis.mjs --local --check
```

新建置準備使用 build 工具 `--local`，連結既有固定依賴，再執行 `tsc -p tsconfig.typecheck.json --noEmit` 和 `wrangler deploy --dry-run --config wrangler.playtt-session-audit.jsonc --outdir dry-run --metafile dry-run/bundle-meta.json`，分別將輸出存入 `typecheck-private.log`、`dry-run-private.log`，最後執行 `--check`。只允許 dry-run；此診斷版本沒有部署意義。

0 Cloudflare 專案請求、部署或帳務刷新。最後雲端讀值仍為 2026-11-21T16:52:39.597Z、canonical181／pin16、原15 pins 保留、歷史餘62,344 bytes、publisher 暫停；不是本輪重新讀取。PR #4 維持 draft，整體 goal active。

證據：[原生資料／例外稽核](../../../docs/verification/cloudflare-core-read-trace-native.json)、[完整建置](../../../docs/verification/cloudflare-core-read-trace-build.json)、[追蹤界限合約](../../../docs/verification/cloudflare-core-read-trace-contract.json)、[稽核例外修訂](../../../docs/verification/cloudflare-core-read-trace-exception-review.json)、[重建](../../../docs/verification/cloudflare-core-read-trace-rebuild.json)。
