# 核心檔案壓縮保存原型

新增隔離的 MEMFS 核心檔案壓縮原型，降低仍被檔案節點持有的資料容量。真正 PHP 測試中，1,857 個核心檔案的 backing 容量由 **22,522,980 → 5,300,862 bytes**，差 **17,222,118 bytes**；逐一讀回全部 2,154 檔及執行 WordPress 版本 PHP 檔後仍保持壓縮。**這不是整個後台的記憶體改善或免費驗收，也尚未接入完整 WordPress 建置。**

正式 Pages、原視覺、中央 runtime、雲端 Worker、DNS 與 publisher 維持現況。本輪只讀公開文件／來源並執行本機研究，0 雲端專案操作、無新增費用。PR #4 維持 draft，全案 active。

## 為何改查仍被持有的核心檔案

離線重算前輪精確 `0f9d3340e` 的樣本：重啟前尖峰為 JS24,557,040＋backing52,529,360＋最近 PHP74,055,680＝151,142,080 bytes；重啟後為25,619,308＋54,695,737＋73,400,320＝153,715,365 bytes。PHP 觀測當時已相隔6,635／7,573ms，不能視為同時尖峰。backing 在同一流程也降回約33MB；下降本身不足以證明回收事件或是哪個物件造成。

既有固定 workerd 校正顯示 Runtime.getHeapUsage 不計這組 WASM backing；舊 heap snapshot 則已包含 WASM，兩種數字不可混加。既有 snapshot 可定位核心檔案的持有來源，但屬另一個建置，未把其持有量套用到現在。官方仍記載每 isolate 的128MB限制涵蓋 JavaScript／WASM；本機 runtime 未模擬此限制。[官方限制](https://developers.cloudflare.com/workers/platform/limits/)、[既有校正證據](../local-memory-limits/README.md)。

## 原型的行為與邊界

只處理固定 PHP loader 的普通 MEMFS 檔案，位於 `/wordpress` 且排除整個 `wp-content`。壓縮已有獨立、精確容量 Uint8Array 的檔案；跳過開啟中的檔案、自訂操作、掛載、WASM alias、容量不等於 usedBytes 等情況。小於512bytes或節省不足128bytes不壓縮，單檔最多8MiB。

read／mmap 透過暫時的 stream/node 視圖，把解壓結果交回原始 MEMFS 操作；不重寫其 seek、mmap 權限或 metadata 邏輯。保留單一最多512KiB decoded cache。write、resize、msync 或直接存取 contents 先還原普通可寫節點；保持 Uint8Array 的類型與 slice 複製語意，不把 Node Buffer 的不同 slice 行為帶回檔案節點。

原型假設安裝時核心檔案由本 runtime 擁有，不能對任意已外流的私有 buffer alias 承諾語意。未把 wp-content、使用者資料、媒體或資料庫壓縮，也未更改任何 canonical 格式、指標或保存規則。

## 真正 PHP 的22組比較

原版與候選各建一個固定 PHP8.3.36/WASM 實例，驗證完整／offset／循序／EOF／零長度讀取、seek、fresh Date metadata、symlink、目錄、rename、unlink 後的開啟 descriptor、截斷／成長／洞洞寫入、append／overwrite／canOwn、直接 contents 與 MEMFS helper alias、mmap／msync、唯讀與 errno，以及真正 PHP include／讀寫／改名。

所有觀測精確相同。直接 contents 存取後仍是普通 Uint8Array，slice 為複製；原有開啟檔、自訂 read、掛載與排除區域保留。最終模組 SHA：`3a72305b1edfa3e222644084777d018e3727b2d7f5730acd930182400b24a93a`。

## workerd 解壓邊界的發現與處理

固定 workerd1.20260828.1、既有 compatibility2026-07-18／flags 下，普通同步解壓會在部分容量邊界錯誤拋出 RangeError。第一次只留 HTTP500，不能倒推精確階段；第二次有界診斷定位 inflate；第三次實測顯示加一 byte 的舊 workaround 在40,960bytes仍失敗。三個失敗 owner、fixture及錯誤均保留，程序已關閉，沒有重播或當成通過。

固定來源的 `GrowableBuffer.addChunk` 先要求一整個 chunk，再檢查 maxCapacity，因而可能在資料仍可放入時拒絕。`internal_zlib.ts` 顯示 `info:true` 改用同步 stream engine。最終採此路徑，保留**精確原長度 maxOutputLength**，並再檢查解壓後長度，沒有以放大限制解決問題。[固定 C++ 來源](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/api/node/zlib-util.c%2B%2B#L86)、[固定呼叫分流](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/node/internal/internal_zlib.ts#L75)、[相關上游修正](https://github.com/cloudflare/workerd/pull/8642)。

實際 workerd 的16組512bytes至8MiB案例全部通過：輸出 SHA、輸入不變、容量不足拒絕、超出一 byte 拒絕。普通 one-shot 路徑在其中4組拒絕本可容納的資料；選用的 info 路徑均通過。未升級 runtime 或套用上游 patch。

## 完整核心檔案與持有容量

以原本已驗證的 materializer 將真正 pinned ZIP 解到 PHP MEMFS，核對完整清單的 SHA／大小。1,857 個核心檔案中，1,449 個壓縮，保留90,488bytes普通 backing，加5,210,374bytes壓縮 backing，共5,300,862bytes。其餘297個 wp-content 檔案的 node／buffer identity 不變；所有核心 metadata 不變。

全部2,154檔讀回精確，核心仍維持同樣壓縮數與容量；實際 PHP require版本檔得到7.1.4後也相同。讀取後 decoded cache 為65,536bytes，另列而未漏算；上限512KiB，clearCache驗證為0。單次 Node 壓縮耗時約574ms，不能當作 workerd CPU或後台延遲。

這是節點可追溯的 backing 容量，未包括 JS metadata、PHP/WASM、native codec 暫存及尚未回收的垃圾；沒有 heap snapshot 或尖峰改善證明。ZIP屬 boot patches之前的核心來源，仍需完整整合後測試。

## 重建與下一步

接續 base64-editor 組裝，核對234個前置工具，新增9個原型／診斷工具；780個舊檔不變，共789檔。所有測試 owner 已停止，原始觀測、內容與失敗細節留私有檔；公開證據只含數值、SHA及限制。

```powershell
python scripts/playtt-peak-retention-audit.py --local --check
node scripts/playtt-compressed-core-audit.mjs --local --check
```

下一步把固定原型接在完整候選 boot patches／compaction 後，並先調整 diagnostics 的 file scan：它目前直接讀 contents，會觸發全部解壓，必須使用壓縮 metadata 並另列 cache。之後做完整來源／產物核對、真正 workerd 的原生保存／重啟／登出／備份與記憶體／CPU檢查。不得用本原型的節省量扣掉舊尖峰後就宣稱過關。

最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、pin16且原15保留、歷史餘62,344bytes、publisher暫停；本輪未刷新帳務。第一次繁中初始化、provider限制、長期免費、實體IME／手機及A01–A20仍開放。

證據：[綜合稽核](../../../docs/verification/cloudflare-compressed-core-audit.json)、[完整核心結果](../../../docs/verification/cloudflare-compressed-core-corpus.json)、[PHP比較](../../../docs/verification/cloudflare-compressed-core-semantic.json)、[workerd邊界](../../../docs/verification/cloudflare-compressed-core-boundaries.json)、[尖峰組成](../../../docs/verification/cloudflare-peak-retention-audit.json)。
