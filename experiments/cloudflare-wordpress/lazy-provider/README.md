# 壓縮核心候選的私人 Cloudflare 登入實測

固定候選 `19f8bc17966c12b82518961dc550a95672a0c859b2017577bb82fc04c44b0b0d` 在既有私人 Worker 完成一次 WordPress 登入表單 GET：HTTP 200、3,234 ms、8,555 bytes。受限窗口消耗 **0 bytes／0 puts**，已關閉及封存。這是單次未登入的表單讀取成功；完整免費後台仍未驗收。

## 範圍與結果

執行前透過 API 核對目前部署、全部設定、canonical181、兩個 pointer／commit receipt、16 pins、發布暫停、closed／sealed／pending0，以及獨立備份 manifest。線上六個模組與原本凍結的相容 reader 逐檔 bytes／SHA 相同。訂閱 API 回應 403，沒有擴權；既有登入的 Cloudflare 方案頁確認 Free／$0／Current plan。R2 本期 October25–November25，測試前後都顯示 billable $0.00／2.33GB，ClassA7.3k→7.31k、ClassB60.52k→60.53k。畫面可能有帳務延遲，未刷新 DO 詳細用量。

先以目前雲端相同 flags 的本機副本測試 120 秒／1 byte／1 operation。登入200／2,210ms，內部 cold trace 2,194ms，canonical 全部內容一致、零資料寫入、exceptions／outbound皆0，程序與9576/9577關閉。第一次本機啟動被沙箱 localhost EACCES 擋住；第二次在不支援的 observer mark 停止，沒有原生登入請求，已封存／退出。第三次只修正診斷標記，完成測試；前兩次失敗保留，沒有覆寫完成 owner。

候選六個模組先經 `--no-bundle --dry-run` 核對，再部署至既有 `playtt-wp-free-session-audit`，版本 `79819421-b3ab-44f9-94ce-96013f151248`。回讀六個模組、所有 bindings／namespace ID、compatibility 與 usage model 均相符；不新增 bucket、namespace、route、排程或付費方案，optional writer flags維持關閉，publisher仍暫停。

只有一次 `/wp-login.php` GET，沒有 WordPress 帳密登入、編輯器、儲存或發布。窗口為120秒／1byte／1operation；控制命令可寫入 window／fence 狀態，但 canonical、R2 chargedBytes及chargedPuts沒有變動。原生讀取前未呼叫會完整解碼備份的 fence-status，避免該診斷污染啟動。

## 觀測缺口

live observer在請求前取得相同版本的operator事件，於原生請求與收尾時持續存活。捕捉10事件、outcome皆ok、exceptions0，含1個login GET200。**沒有 PHP phase trace 或 memory sample**。工具看到第一個外層login事件便停止，可能漏掉延後送達的 Durable Object 紀錄；這是下輪應先修正的具體缺口。

重新部署後才開始原生請求、且來源中的登入路徑不使用公開頁面／靜態資產快取，因此可合理推測觸發了冷載入；雲端沒有直接捕捉 hydration trace。不可把本機的cold trace當成雲端證據，也不能由HTTP成功推論整個isolate尖峰、billedCPU或穩定效能改善。Cloudflare 官方[記憶體限制](https://developers.cloudflare.com/workers/platform/limits/)涵蓋JS與WASM；目前仍缺完整原生編輯器及持續使用的驗收。

## 回復與接續

測試後恢復原相容reader六個模組，現在版本 `8e03e9a0-b660-4a45-8384-08f01318d031`。全部模組及設定再次逐項核對；canonical181／revision `9e732918-4430-4381-8275-fee800f414cb`、16 pins、兩個pointer／receipt完全一致，remaining62,344bytes、closed／sealed／pending0、fence inactive、publisher paused。恢復工具仍關閉。這輪共2次私人程式部署，正式Pages及原視覺未改，不切換後台、PR4保持draft。

最新雲端 window／drain owner 是 `artifacts/playtt-lazy-provider-cold-owned-private.json`；它只擁有控制窗口，不含新資料備份。資料備份仍用 `artifacts/playtt-old-provider-owned-private.json` 的181 anchor。下輪必須使用新window的身份，不能拿舊native owner重新arm。

下一步先修正觀測生命週期，等待可辨識的DO native完成訊號或明確記錄缺失，再考慮新的有限讀取試驗。62,344bytes不足以再跑已量測的完整編輯保存／登出流程；不得重設或退款cap、清未知ticket、刪pin／歷史或建立替代資源繞過。繁中首次初始化、Gutenberg、實體IME／手機、持續免費用量與A01–A20保持未完成，完整目標active。

## 重建與證據

接續[lazy-core](../lazy-core/README.md)的325個工具雜湊，增量加入9個工具。已完成owner及write-once evidence不得重播。`--remote`工具涉及既有私人資源與短暫控制窗口，這些不是可任意循環執行的測試。

本機離線證據重算：

```powershell
node scripts/playtt-lazy-provider-audit.mjs --offline --check
```

證據：[獨立實測審核](../../../docs/verification/cloudflare-lazy-provider-audit.json)、[執行前核對](../../../docs/verification/cloudflare-lazy-provider-preflight.json)、[候選回讀](../../../docs/verification/cloudflare-lazy-provider-deployed.json)、[原生GET與窗口](../../../docs/verification/cloudflare-lazy-provider-cold.json)、[回復模組](../../../docs/verification/cloudflare-lazy-provider-restored.json)、[最終資料狀態](../../../docs/verification/cloudflare-lazy-provider-final.json)。公開檔案不含operator token、OAuth、原始登入HTML、cookies或私人canonical內容。
