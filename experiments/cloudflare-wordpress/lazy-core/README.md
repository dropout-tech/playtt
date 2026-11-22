後續：[私人Cloudflare單次登入測試](../lazy-provider/README.md)已完成並回復原程式；以下是原本機候選紀錄。

# 直接安裝可信 ZIP 的壓縮核心內容

隔離候選已把 WordPress 核心改為從既有 runtime ZIP 直接安裝壓縮內容。核心在讀取時才解壓，寫入時恢復一般可寫節點；wp-content 與較小／不適合壓縮的檔案照常載入。避免先把整批核心展開，再於啟動後重新壓縮。未新增雲端資源或 archive 格式，也沒有切換正式官網。

## 完整性與檔案行為

入口沿用原始 manifest 驗證並核對整包 SHA-256，parser 再檢查固定 ZIP 格式、central/local 一致、非重複安全路徑、連續 payload、檔案數、大小預算與必要檔案。此實作刻意限於目前可信 corpus：無加密／extra／comment／ZIP64，deflate method8、ASCII 路徑；不宣稱支援任意 ZIP。首次解壓核對精確長度、CRC32 及 manifest 的 SHA-256，然後使用原有 12 MiB／2,048-entry LRU。

每個壓縮核心 entry 複製到自己精確大小的 Uint8Array，避免小 view 持有整包 ZIP。測試在安裝後把原 ZIP 全部覆寫為零，所有 2,154 個檔案仍讀回原始大小與雜湊。零長度與 EOF 讀取不解壓；改寫與截斷恢復原始 MEMFS 節點，mmap／權限／alias 規則沿用前版。

安裝時直接保留 **1,449 核心檔案／5,210,374 壓縮 bytes／22,432,492 邏輯 bytes**，其餘 705 個檔案正常載入。此時未解壓這些核心檔、快取為 0，也沒有 deflate 重壓。完整讀回後再 finalize，在未做 boot 修改的 corpus 控制中仍重壓 0 次。

13 項 fault 檢查分為 **12 項安裝前結構／雜湊拒絕**與 **1 項解碼時 payload 完整性拒絕**。首次 proof 因原生 zlib 錯誤沒有統一為 archive 錯誤而失敗，保留該 source／owner／錯誤；新增錯誤封裝後通過。之後把報告中的拒絕階段分開列示並重新生成 proof，未把延後解碼的 CRC/SHA 檢查冒充安裝前全部展開驗證。整包 archive SHA 始終先驗證。

三組實際 pinned PHP/MEMFS 25 項比對相同，涵蓋讀取邊界、不同 buffer、權限錯誤、寫入／截斷、rename/unlink、mmap/msync、alias 與 PHP 執行。另以原本 PHP ZipArchive extractor 與新 installer 比對 **2,154 檔案、371 目錄**：內容雜湊、mode、size、nlink、uid/gid、rdev、block 與目錄列表完全相同。實際時間戳因執行時間不同而排除，Date 回傳行為由既有 PHP 比對涵蓋。

## 完整啟動整合

beforeWordPressFiles 使用新 installer，後續 opaque IDs、MDI、canonical content、policy patches 與資料庫設定保持原流程。compaction 先辨識已壓縮節點並略過，避免讀取 contents accessor 導致整批展開；finalize 只補壓啟動期間變成一般節點的核心。原生兩次 boot 最終皆為 **1,450 壓縮檔案／5,212,074 bytes／22,436,858 邏輯 bytes**，與前版一致，並在全部掃描中維持。

完整 bundle SHA `19f8bc17966c12b82518961dc550a95672a0c859b2017577bb82fc04c44b0b0d`。215 輸入、209 個前版輸入不變、5 改動／1 新增、77 載入來源、5 二進位模組不變。TypeScript、dry-run、逐項輸入與來源轉換核對通過；中央 82 個 runtime sources 未修改。既有 byte counters 與「原生採樣先於完整備份檢查」規則保留。

## 原生保存與還原

cloud181 的新本機副本，固定 600 秒／1,881,041 bytes／96 operations，publisher 暫停、外連禁止。繁中原生保存 1,875 bytes，receipt186；完整重啟時 LOCAL188／350,114 bytes，資料、預算及同一窗口精確，不 seed/rearm。新分頁顯示已儲存、相同內容與 11 筆修訂；解鎖兩層 200，登出 302 並顯示完成。

最終 LOCAL191／500,273 bytes／30 puts，closed／sealed／pending0／exit0。原 posts、usermeta、sessions、媒體及主題精確；只增加 revision209 與預期 draft／lock／sequence。**304 物件／298 檔**獨立 export/import/full materialization 相同。HTTP error、runtime exception、外連皆 0；9576/9577 與分頁已關閉。

## 記憶體與限制

首次完整檢查前 85 個匹配樣本的最大非同步組件合計為 **131,124,084 bytes**，位於 render 窗口（JS20,785,012＋backing36,348,928＋最近 PHP73,990,144，PHP 年齡1,111 ms）。save 窗口14樣本最大122,879,523 bytes，PHP 年齡12 ms。整輪包含完整驗證時仍有143,867,640／133,524,158 bytes。

postboot finalize 兩次 wall time 均42 ms；前版完整 deflate 記錄為497 ms。程式結構已避開整批重壓，但這兩次瀏覽器與啟動時序不同，**不做效能改善百分比或 billed CPU 的推論**。組件合計不是同步尖峰、RSS 或 provider 限制，取樣可漏掉冷啟動暫存。即使本機觀測低於128 MiB，餘裕仍小，免費環境尚未驗收。完整備份檢查的額外用量仍是實際需求。

下一步先核對既有私人 Cloudflare 的當前設定與剩餘資料預算，規劃不增加資料寫入的冷啟動／讀取驗證；若需要保存流程，必須先有足夠的既有預算。不得重設／退款 cap、清掉未知 ticket、刪除 pin／歷史或新增替代資源。繁中首次初始化、實體 IME／手機、長期免費用量與 A01–A20 持續開放。

## 重建與證據

接續 core-direct 的314個工具雜湊，新增11工具；乾淨組裝871檔／860舊檔不變。完成 owner 不可重播；失敗與被取代的本機 proof 都保留。公開證據不含原始內容、credentials、profile 或控制命令。

```powershell
node scripts/playtt-lazy-core-build.mjs --local --check
node --import tsx scripts/playtt-lazy-core-editor-audit.mjs --local --check
node scripts/playtt-lazy-core-analysis.mjs --local --check
```

證據：[ZIP 與 corpus](../../../docs/verification/cloudflare-lazy-core-prototype.json)、[檔案屬性比對](../../../docs/verification/cloudflare-lazy-core-corpus.json)、[PHP 行為](../../../docs/verification/cloudflare-lazy-core-php.json)、[原生還原](../../../docs/verification/cloudflare-lazy-core-native.json)、[觀測範圍](../../../docs/verification/cloudflare-lazy-core-analysis.json)、[完整建置](../../../docs/verification/cloudflare-lazy-core-build.json)。正式 Pages 與原視覺不變，PR #4 保持 draft，沒有部署、付費或後台切換。
