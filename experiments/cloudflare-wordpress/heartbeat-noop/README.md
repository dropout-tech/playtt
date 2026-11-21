# 原生未變更請求省略重複提交

採用於私人 Worker `e33e2afb-7d40-4a36-b06e-674eac707f44`。原生HTTP請求執行PHP後仍完整比對所有canonical、圖片、主題檔與刪除清單；只有完整pointer（revision、manifestKey、persistedAt）相同，且沒有待提交的publication job時，改為釋放既有lease，不新增版本／receipt或重寫R2 pointer。其他情況仍走原commit。匯入、維護及其他路徑不適用這個捷徑，publication job仍取得所需下一版receipt。失敗仍進原有abort／runtime處置流程。

沒有把heartbeat直接當成唯讀，沒有停用、調慢或省略文章鎖。核心7.1.4的原生心跳會驗證nonce並執行hooks；刷新文章鎖可能寫入postmeta，冷啟動也可能產生canonical變化，因此必須先實際執行及完整核對。[WordPress心跳](https://developer.wordpress.org/reference/functions/wp_ajax_heartbeat/)、[文章鎖刷新](https://developer.wordpress.org/reference/functions/wp_refresh_post_lock/)。本機固定核心zip的對應來源也已檢查。

## 有界量測與驗證

在自有草稿171，原版先做一次不列入比較的空白暖機，再交替三次空白與三次文章鎖刷新。暖機與其中一個warm空白請求的pointer沒變，version仍各加1；另外兩個空白請求為cold，pointer真的有變。warm空白3226ms，兩個cold空白9521／9770ms；三個warm文章鎖6004／5320／5624ms。

修正後，四個warm空白（含一次暖機）都完整保持pointer與version，tail均記錄 `lease.release.unchanged`；非暖機三次約2073／2077／2070ms。兩次原生文章鎖仍回new_lock、pointer改變且version各加1，耗時9538ms（cold）／6159ms（warm）。隨後真正更新草稿，version加1；全新登入逐位元讀回繁中、ampersand與末尾空白／LF。原首頁SHA不變。

樣本少、沒有隨機次序、冷暖分布不同，原版只有一個非暖機warm空白樣本；不能換算穩定加速百分比或代表整個後台。內容更新仍需11185ms，互動等待尚未解決。這次確定改善是**不再為未變的資料建立無效版本及R2 pointer寫入**。

18項既有phase／snapshot相關測試、TypeScript、dry-run通過。新分支的直接證據是遠端原生pointer/version與內容核對，沒有把既有測試冒稱為完整分支測試。18段patch可在固定upstream重新組裝，62來源完全一致；此目錄patch已納入重建序列，先前write-latency的並行寫入候選仍未採用。

## 回收與完整性

清理前先核對ID／slug／title／status及完整內容，只刪除自有171及子修訂。完整備份 `6f899847-85b0-415c-b253-f7a1cb1dccf7` 的297索引與每個解碼內容均通過SHA，4,433,441解碼bytes、2,294,085壓縮bytes；SHA `3e261fd34ec1371ad8064ac70bbe77197f496e25498666baf1668bda79f47a4d`。

與手機驗收後備份比較：27 Markdown＋10完整表共37檔逐位元一致，15上傳檔、48 metadata及原歷史修訂保留。自有頁面與子修訂無殘留，高水位posts172保留。副本version251／daily來源174，coherent、無fence、paused。未具私人身分的admin／REST／media仍404/noindex。正式Pages、原品牌視覺與daily來源程式未改，也未切後台或新增付費方案。

382個有限觀測事件全部ok（原版180、修正202），無記錄到例外、request failure或未完成trace；四個noop release。事件數不是唯一HTTP請求數。最大WASM74,448,896bytes／檔案buffer31,655,695bytes不是全isolate記憶體。觀測已停止，0殘留tail。

## 界線與下一步

這輪是原生CLI HTTP，沒有瀏覽器UI重跑；前輪13個取消事件原因仍未證實，不能用本輪零取消宣稱已修復。冷啟動、鎖刷新及保存延遲仍待處理，接續以瀏覽器同一流程觀測新版本，再做實際交接／實機觸控與鍵盤及持續免費用量驗收。本輪沒有新空環境還原。

Cloudflare官方2026-10-01說明新增DO pending I/O的存活語意；目前相容日期仍2026-07-18，這輪未加flag，不能據此推定先前取消原因。[官方變更](https://developers.cloudflare.com/changelog/post/2026-10-01-pending-io-keep-alive/)

工具需要固定runtime依賴、既有private-client、私人設定、憑證、完整備份與owned guard，不能直接當成可重跑批次。171已清理，不能刪guard再重用。測試有固定初始版本232／243，新的驗證須另立fixture與證據。完整備份、cookie、nonce及私密內容均未入Git；只保留已去識別的JSONL。總表：`docs/verification/cloudflare-heartbeat-noop-summary.json`。PR #4仍draft，目標active。
