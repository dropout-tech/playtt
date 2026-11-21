# 記憶體調查：追蹤分配器候選，未切換正式站

此候選建立在automatic-publication基準之上，僅用於私人restore-v1測試區。不要把此實驗部署成正式後台。

## 後續結果補充

發布合併候選0400c6ab在遠端建立頁面時仍發生記憶體重置，兩次重置前WASM配置分別約72.2MB與68.2MB；以下較小工作負載的通過不代表整體問題已解決。原內容已核對還原，發布器paused。詳見../publication-batching/README.md。

## 2026-11-17 新候選：追蹤系統分配器

使用者已選擇繼續全Cloudflare免費後台研究。正式Pages維持現況，暫不切換後台。

固定本機25請求涵蓋登入、編輯器HTML、頁面／導覽／版型REST，以及兩輪全域樣式儲存與還原：

| PHP設定 | 最大WASM配置 | 結果與界線 |
| --- | ---: | --- |
| 原Zend分配器＋1MiB擴充 | 115,408,896 bytes | 本機通過；先前遠端仍超限 |
| USE_ZEND_ALLOC=0 | 67,108,864 bytes | 計量歸零，不採用此單獨設定 |
| USE_ZEND_ALLOC=0、USE_TRACKED_ALLOC=1 | 74,842,112 bytes | 本機通過，計量非零；進入私人遠端驗證 |

檔案配置約35.7MB，與WASM heap無共用buffer；核心檔案容量約28.3MB。這是配置容量，仍非精確的isolate實際用量。相同binary的獨立測試連續60個包含循環參考的請求維持64MiB heap；16MiB PHP上限拒絕32MiB配置，後續1MiB請求成功，證明此固定版本仍有請求清理與上限保護。

PHP8.3.36官方來源提供tracked_malloc／tracked_free、tracked_free_all及限制檢查：[zend_alloc.c](https://github.com/php/php-src/blob/php-8.3.36/Zend/zend_alloc.c)。分配器差異與WASM碎片相關是目前推論，尚未以完整分配追蹤證實根因。

候選部署755bdb73-82ca-4607-9937-017970a2ed3e，僅私人restore-v1。遠端同一25請求測試及繁中後台重部署讀回通過；瀏覽器確認控制台與網站編輯器已為繁中。原生導覽已經過修改、儲存、重載及還原後再重載。發布回歸首次在開始前等待舊工作清空360秒逾時，未進入新的頁面編輯測試；觀察期共有758個事件，結果{"ok": 752, "canceled": 6}，沒有記憶體例外；最大WASM配置76,218,368 bytes。累積發布工作的追趕速度仍需處理，不能據此宣布營運穩定。後續手動完整發布回傳409，沒有更新公開指標：匿名GET先讀既有公開快照，並不保證產生目前canonical版本的頁面。已保留失敗證據；不可把這次刷新當成成功。

重現時在security-update＋automatic-publication基準上，改套`tracked-allocator-candidate.patch`，不要再疊上舊`diagnostic-candidate.patch`；兩者是互斥候選。複製本目錄mjs到scripts，執行`playtt-prepare-small-heap-loader.mjs`產生loader。新增腳本：

- `playtt-memory-workload.mjs`：固定25請求，限定本機或私人restore-v1；樣式還原，發布器保持paused。
- `playtt-tracked-allocator-check.mjs`：相同固定WASM在Node中驗證循環參考清理、上限拒絕及下一請求恢復，不代表遠端驗收。
- `playtt-tail-sanitized.mjs --label=tracked-allocator`：只保存事件狀態、版本、記憶體數值，不保存請求標頭、cookies或內容。

## 先前失敗的縮小擴充候選


診斷以已釘選PHP-WASM3.1.64執行器的內部heap與MEMFS容量，輸出數值而不記錄內容。這些是配置容量，不代表精確的整個isolate實體記憶體總量。d223c010觀察到WASM heap115,998,720 bytes，檔案容量約35.6MB；接著發生Cloudflare記憶體重置。

嘗試將Emscripten20%幾何擴充改成1MiB線性擴充，不更換PHP8.3.36與WASM二進位。fc2b88ef觀察到heap111,214,592 bytes，仍在全域樣式儲存後發生記憶體重置。TypeScript和16項權限／發布檢查通過不能取代這個實際失敗。

重現：先準備security-update與automatic-publication，套用diagnostic-candidate.patch；將本目錄兩個mjs複製到套件scripts/，執行node scripts/playtt-prepare-small-heap-loader.mjs產生src/playtt-php-loader.mjs。僅在私人測試設定啟用PLAYTT_MEMORY_DIAGNOSTICS=true。產生的loader源自GPL-2.0-or-later的WordPress Playground固定版本；建置程式保留完整來源並記錄SHA256，不修改共享node_modules。

遠端語言檔與管理員zh_TW設定已進入R2；初始化外掛已移除，樣式覆寫已清空，但HTTP儲存回應仍失敗。因此不能說整個語系／編輯流程通過。最新私人狀態另有294項校驗備份；正式Pages官網未變更。

已將測試發布器暫停（只停實驗alarm，並非暫停整體使用者目標），以免在已知限制上持續重試。使用者於2026-11-17選擇繼續全Cloudflare免費後台研究；正式站維持現況，暫不切換後台。

後續Cloudflare CLI必須使用本專案獨立的XDG_CONFIG_HOME，避免其他工作改動共用登入範圍。私有登入目錄、token及內容備份不進儲存庫。
