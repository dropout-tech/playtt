# 保存延遲調查：並行寫入候選未採用

結論：本輪沒有證實穩定的整體保存改善，因此候選只留作研究證據，**未加入 `rebuild-candidate.py`，不是第18段採用patch**。私人站已回到原循序實作，Worker `f6ac6526-2016-445d-b510-2b887369c7c2`；62個TypeScript來源與 `c9ec130` 的17段組裝逐位元一致（UTF-8/LF正規化）。正式Pages、原品牌視覺、daily來源程式、後台選擇及付費方案未改。

## 方法與結果

原程式逐一等待變更canonical檔寫入。候選最多同時三筆不可變物件寫入，排隊buffer共1 MiB，較大檔案先排空佇列後單獨寫入；下一個讀入檔可能與佇列並存，故峰值界線是一個檔案加1 MiB，不是只有1 MiB。失敗會停止新增工作並等待所有已開始的寫入收束；完整物件、備份包、manifest完成後才交給原coordinator提交。沒有改保存格式、削減校驗或延後資料耐久性。

| 比較 | 原循序中位數 | 並行候選中位數 | 限制 |
| --- | --- | --- | --- |
| 第一輪各三次 | 6866.247 ms | 6858.846 ms | 幾乎相同，約0.108%差異 |
| 固定各六次複驗 | 7684.4505 ms | 6887.3415 ms | 約797.109 ms／10.373%差異；循序版本本身較首輪移動818.2035 ms |

這是同一份自有草稿146的單段文字更新，先登入／暖機後量測完整回應；兩種版本都開啟相同sanitized tail，計時時沒有CPU capture。次序未隨機、網路與時間會變動，修訂歷史逐次增加且文字長度稍有不同。較大樣本有正向點估計，但首輪不一致、差距與基準自身波動相近；不是統計證明，也不能說並行永遠無效。現階段不足以增加維護複雜度，故保留原實作。

remote phase紀錄只能視為I/O邊界之間的間隔，不能將 `request.php=0` 或下一階段讀值當作純PHP／純R2耗時。[Cloudflare計時規則](https://developers.cloudflare.com/workers/runtime-apis/performance/)

一次25秒CPU capture先回10393「無近期執行」，只暖機重試一次後成功，期間對同一自有頁面做兩次更新。3,427樣本的value合計3.427秒，**其中包括0.342秒idle**；不能直接與兩次HTTP牆鐘相減推算I/O。`playtt-write-latency-cpu-analysis.json` 只公開去除路徑／labels／raw stacks的摘要。[官方profile文件](https://developers.cloudflare.com/workers/observability/profiling-in-production/)

## 正確性與收尾

- 23項聚焦檢查通過：8項佇列／失敗／buffer／獨立完整restore pack，15項既有snapshot source驗證；TypeScript與dry-run通過。
- 另一組較廣測試是36／39通過。原版32項用同一環境重跑為29／32通過，失敗相同：一個CRLF敏感的來源字串斷言、一個仍預期舊變數名稱的來源斷言，以及缺少native `php`（ENOENT）。沒有宣稱全套測試通過，未為了這次效能候選放寬斷言。詳見 `local-validation.json`。
- 候選部署 `b5398964-ce89-470f-91f7-fa154936a06d` 能跨部署讀回既有資料、保存新內容並在全新登入讀回末尾空白／LF。回到原循序程式後同樣讀回候選寫入內容，未回退內容格式。
- 結束時再以新登入核對ID／slug／title／status／精確內容SHA及原首頁，才清理自有146與22筆修訂147–168。原首頁SHA一直不變。
- 完整備份revision `ebcc8669-0433-45ad-9a8f-3a0f83d91da8`，297索引、4,431,594解碼bytes、2,293,662壓縮bytes；SHA `e0b46d7cef617a574320a4ecb1cd2a76a503fd6a166a30563b17fa4201a1b277`。全部解碼／SHA通過。
- 27 Markdown＋10完整表共37個canonical檔與實驗前逐位元一致；15上傳檔、48 metadata及原歷史修訂保留。自有頁面／所有修訂無殘留，session及ID高水位正常前進（posts=168）。
- 副本version189、daily來源174，均coherent／無fence／paused。未具probe身分的後台、REST、媒體404/noindex。
- 有限觀測355事件全部ok，0例外、0request failure、0未完成trace。觀測已停止，確認0殘留tail程序。最大觀測WASM73,924,608 bytes／檔案buffer31,675,339 bytes；均不是全isolate記憶體，事件數也不是請求數。

## 證據與重現界線

依上層重建規則，先將patch及三個目標檔正規化為UTF-8/LF；直接對混合CRLF/LF套用會失敗。獨立scratch重建後五個檔與實際跑過的候選完全一致，見 `candidate-reconstruction.json`。

`not-adopted-canonical-writes.patch` 僅是未採用候選，兩個 `.candidate.ts` 檔需手動對應至 `src/playtt-canonical-writes.ts`、`tests/playtt-canonical-writes.test.ts` 才能在另外的研究checkout測試。不要套到交付組裝、正式站或覆蓋目前已接受程式。候選在記憶體保留公式增加佇列容量，不能沿用原先單檔峰值宣稱。

本目錄九個工具是當時有限實驗／回收流程，不是可反覆執行的維運批次。它們需要上層組裝的固定依賴、原有private-client、已授權的私人設定與本機私密狀態。原有草稿guard、canonical版本及既有報告會阻止重跑；不得刪除guard來重用146，也不得將新實驗偽裝成舊結果。`playtt-write-latency-pprof.py` 只讀本機保留的retry profile；原始profile、完整備份、憑證、cookie和自有內容狀態沒有放進Git。

本輪沒有重跑瀏覽器／手機UI或獨立空環境還原。下一步優先補原生手機操作與實際交接，同時保留保存延遲為未完成項；若再研究效能，應先以新的可分辨瓶頸證據選擇方向，不重做相同樣本。PR #4維持draft，目標active。彙總見 `docs/verification/cloudflare-write-latency-summary.json`。
