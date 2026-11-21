# 壓縮快照接入：本機原生 HTTP 通過，未部署

最新[完整瀏覽器容量結果](../compressed-budget/README.md)：保存及冷重開成功，登出容量不足；完整流程尚未通過。以下保留上一階段證據。

這個可選階段接續 compressed-content 原型，將新格式接進 Worker 的一般冷讀、保存、完整 fallback、備份圖、pin 與下載工具。只有精確旗標 `PLAYTT_CONTENT_OVERLAY=content-gzip-v1` 才啟用寫入；20 份既有設定完全不變。正式 Pages、目前視覺、雲端私人 Worker 均未變更，PR #4 維持 draft。

Markdown 先做完整有界清單與 hash，不先寫 raw 再多寫 gzip。新快照直接引用同一份完整 base；每次保存核對實際已保存的前一份 manifest，累積差異超限就轉完整快照。圖片及主題 raw 物件仍照原流程寫入。壓縮包必須先成功保存，再保存 manifest，最後才由既有 coordinator 提交 pointer；失敗不回傳新 pointer、不記住未完成 manifest，不退還任何已嘗試用量。

超限或停用 writer 後的下一次有變更保存，會先重建缺少的 Markdown raw 物件並逐檔核對，再使用原本完整 ZIP 流程。既有 raw 物件大小或 hash 不符時拒絕。單純關旗標不會改寫既有 snapshot；舊程式回退仍需完整 materialize、獨立驗證、採用新 pointer 與舊程式驗收。

備份圖包含 current manifest、gzip、base manifest、base ZIP，以及重建的全部 raw Markdown／uploads／wp-content，供現有資產路徑獨立運作。匯入無來源回退；server pin 驗證壓縮依賴與完整 base；composite 本機 pin 使用 `manifest.json`、`base-manifest.json`、`restore.zip`、`delta.gz`。下載器僅增加同一帳號／bucket／site 的 gzip GET，單一 gzip 上限 1,376,256 bytes、整體原 10MiB／67 次限制不變。既有 retention planner 仍拒絕新格式，不能據此刪除歷史或 pin。

## 驗證

78 項測試全部通過（19 項新增整合檢查）及 TypeScript 通過。包含 v1／v2／content／compressed 轉換、同一 full base、錯誤快取與依賴、超量 fallback、metadata-only、真正 Worker 函式的 gzip／manifest PUT 失敗與順序、無變更不寫入、獨立備份／pin／完整舊格式還原，以及 bounded downloader／retention 拒絕。

新本機副本從已驗證私人備份 161 啟動，使用實際 WordPress／PHP／SQLite DO／R2 emulator：登入後 162，原生 REST 儲存 163，刻意遺失成功回應後完全重啟仍讀回完整繁中內容；同內容重試 164 沒有多建修訂。原有其他頁面、修訂、媒體與主題逐項核對。獨立備份、完整格式 materialize、關 writer 後 165 的完整 fallback 及再次冷讀皆通過，外連 0、程序已關閉。

這次儲存的 gzip 為 24,866 bytes、完整 manifest 為 74,029 bytes，合計 98,895 bytes。這是單次內容包與清單，不包含 pointer／coordinator，也不是完整瀏覽器流程或長期免費使用量。沒有真實 gate／budget 的整段瀏覽器重測、provider CPU／記憶體／延遲驗收。PUT 失敗為實際 Worker 函式的本機注入；provider 未做故障操作。

## 重建與後續

完成原型階段後執行 `python compressed-runtime/apply-local-candidate.py --runtime <runtime-cloudflare> --apply`。先核對 9 個 prerequisite、8 個既有檔與 3 個新增檔；全部 patch 結果在暫存目錄核對後才寫入。重複套用必須拒絕且不改檔。

`scripts/playtt-compressed-write-local.mjs --local` 是已完成的一次性私人本機流程，其 owner 已 finished/disposed；不得刪除 guard 或重送。歷史原型腳本仍保留當時舊 reader 拒絕的證據，接入後不可拿它當新整合測試重跑。新整合測試使用 `tests/playtt-compressed-integration.test.ts`。

下一步：新的本機瀏覽器副本跑完整登入、偏好、自動保存、手動保存、重啟重開、登出及封存；使用實際 gate／budget 與未增加的剩餘額度，記錄總 bytes／puts 並保留結束餘額。通過後才評估是否足夠做一次私人 provider 驗證。之後補舊程式 rollback、繁中／IME／實機與完整驗收。

本輪零 Cloudflare 請求、零部署、未付費。最後雲端讀值仍為 2026-11-21 06:28:14Z 的 161／pin13／剩 1,881,041 bytes，未刷新。完整 A01–A20 目標 active。

證據：[整合摘要](../../../docs/verification/cloudflare-compressed-runtime-summary.json)、[原生 HTTP](../../../docs/verification/cloudflare-compressed-runtime-native.json)、[測試](../../../docs/verification/cloudflare-compressed-runtime-tests.log)。
