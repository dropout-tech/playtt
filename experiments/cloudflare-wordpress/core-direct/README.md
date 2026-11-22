# 減少壓縮核心檔案讀取的臨時物件

原生 allocation profile 的 `Object.create -> compressed adapter read` 指向每次讀取都建立的 stream/node 包裝物件。候選改為直接執行相同 pinned MEMFS 位元組複製規則，保留 FS.read 的權限、檔案描述元、範圍及位置檢查。1,024 次暖機讀取從 2,048 個包裝物件降為 0，資料與錯誤行為比對相同。這是已驗證的局部精簡；冷啟動記憶體與 Cloudflare Free 完整可用性仍未通過。

## 實作與驗證範圍

只改壓縮節點的 `read`；一般節點仍呼叫原始 MEMFS，mmap 保留原有 shadow/delegation。12 MiB／2,048-entry LRU、解壓長度限制、write/msync、直接 contents 存取、metadata、materialization 與保存格式不變。大小超過 8 bytes 時使用同樣的 subarray/set，較小範圍逐位元組複製；零長度／EOF 不額外解壓。

候選模組 SHA `a453e26322320b83e46bfa95cbdcf92b66fae758402ee59a81e3a40a6790097c`。實際 pinned PHP/MEMFS 下，未壓縮基準、前版 LRU、候選三者通過 25 項一致比對：偏移／EOF／零長度／8與9 bytes、不同 typed array／一般 array、sequential read/seek、rename/unlink 開啟中檔案、截斷／增長／改寫、direct alias、mmap/msync、權限／無效參數、排除自訂與掛載節點，以及真實 PHP include/read/write。三個 PHP instance 均退出。暖機控制各讀 4,194,304 bytes，只有前版建立 2,048 個 wrapper；候選與未壓縮基準皆 0。

完整建置 SHA `c68abf7e8c0eb3a08ed02f6d7eb156e372078a6cce6808a915a4a8e742a8dc1f`。214 輸入、213 前版輸入不變、76 載入來源、5 二進位模組不變；編譯區塊之外的 prefix/suffix 完全相同。42 個 byte-volume 計數器與已修正的量測範圍不變。TypeScript 與 dry-run 通過；第一次本機依賴 junction 操作遭沙箱存取拒絕，使用工作區內同一連結完成核准後建置，沒有為此改程式或部署。

## 原生流程與配置證據

cloud181 的全新本機副本，固定 600 秒／1,881,041 bytes／96 operations，publisher 暫停、外連封鎖。繁中原生保存 1,875 bytes，receipt186；LOCAL188／350,109 bytes 完整處理程序重啟，同一預算窗口與全部資料相同，不重新 seed/rearm。新分頁讀回相同內容、已儲存與 11 筆修訂；解鎖兩層 200，登出 302 並顯示完成。

最終 LOCAL191／500,265 bytes／30 puts，closed／sealed／pending0／exit0。原 posts、usermeta、sessions、媒體與主題精確，預期新增 revision209；304 物件／298 檔獨立 export/import/full materialization 相同。runtime exception、HTTP error 與外連皆 0，9574/9575 與分頁已關閉。

原生 render/save allocation 窗口皆在完整備份一致性檢查前停止，沒有 operator-status 請求或額外完整 ZIP 解壓。依各自完整 bundle 的 adapter 編譯行範圍配對，前版 `Object.create` 直接位於 compressed read 下的採樣 self bytes 為 1,182,096／886,324，候選皆 0。這支持該配置路徑已移除，**不代表精確配置節省、整體速度或尖峰降幅**；兩次瀏覽器時序不同，不以總 profile 數字比較效能。

## 仍需解決的冷啟動用量

首次完整一致性檢查前 68 個匹配樣本，最大非同步組件合計 **144,639,256 bytes**，出現在登入 GET 完成附近：JS 20,900,740＋backing 56,629,652＋最近 PHP 67,108,864 bytes，PHP 樣本年齡 4 ms。此時核心已壓縮為 5,212,074 bytes，登入後解壓快取約 10.77 MB。取樣沒有證明其餘 backing 是存活資料或垃圾，也不能以首次 PHP heap 紀錄前未取到的樣本推論冷啟動尖峰。

render/save 窗口最大合計為 131,246,822／120,831,061 bytes，PHP 樣本年齡 1,141／14,678 ms；整輪含完整檢查為 151,975,831／154,694,569 bytes。它們不是同步尖峰、RSS、provider 限制或 billed CPU。沒有宣稱整體記憶體改善或 Free 通過。

接下來優先驗證冷啟動是否能直接載入可信 ZIP 中的壓縮核心內容，避免先展開約 22.44 MB 再重新壓縮的暫存重疊與 CPU。先檢查現有 boot lifecycle／檔案修改規則、既有嘗試及 ZIP 格式證據，再決定實作；不得弱化 archive hash、路徑、大小、寫入或完整還原驗證。完整一致性檢查仍為獨立的記憶體需求，不能刪除或用輕量狀態冒充。

## 重建

接續 byte-volume 的 305 個工具雜湊，新增 9 工具，乾淨組裝 860 檔／851 舊檔不變。完成 owner 不可重播；私有 profile、原始內容與控制命令不進 PR。

```powershell
node scripts/playtt-core-direct-build.mjs --local --check
node --import tsx scripts/playtt-core-direct-editor-audit.mjs --local --check
node scripts/playtt-core-direct-analysis.mjs --local --check
node scripts/playtt-core-direct-effect.mjs --local --check
```

中央 runtime、私人雲端 Worker、正式 Pages 與原視覺不變，沒有 Cloudflare 操作或帳務刷新。PR #4 保持 draft；provider 記憶體／CPU、繁中首次初始化、實體 IME／手機、長期免費用量與 A01–A20 仍開放。

證據：[PHP 比對](../../../docs/verification/cloudflare-core-direct-php.json)、[配置路徑](../../../docs/verification/cloudflare-core-direct-effect.json)、[原生還原](../../../docs/verification/cloudflare-core-direct-native.json)、[觀測範圍](../../../docs/verification/cloudflare-core-direct-analysis.json)、[完整建置](../../../docs/verification/cloudflare-core-direct-build.json)。
