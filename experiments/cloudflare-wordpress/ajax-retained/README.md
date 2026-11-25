# Ajax 權限行為與私人記憶體持有分析

2026-11-22（台北）。[前輪原生保存驗收](../cleanup-native/README.md)留下Ajax400與記憶體限制兩項未解。本輪增加受限的原生請求分類、未登入控制及兩份私人workerd heap快照。**確認新的multipart釋放文章鎖請求可正常完成，也確認未登入時會拒絕；舊400缺少action／auth證據，仍未倒推歸因。** 正式Pages／原視覺、中央來源及雲端部署均不變。

## 原生請求與權限

三個獨立本機副本都使用真正cb9302a8…六模組產物，五個二進位模組精確；沒有改WordPress核心、權限或內容。每個副本由cloud181獨立備份載入，600秒／1,881,041bytes／96ops，publisher暫停、外連禁止。操作後均closed／sealed／pending0、程序exit0、9509／9510釋放，測試分頁關閉。

第一個原生副本登入編輯者B、開啟草稿193但不編輯，取得編輯器與登出後的heap快照。重現一筆Ajax400／`0`，但初版分類器只支援urlencoded，因此action記錄為unsupported-content-type。保留這個成功執行的owner、完整輸入與觀測結果；不把它寫成已查明action。

固定WordPress7.1.4來源顯示，Gutenberg的beforeunload會以FormData／sendBeacon送`wp-remove-post-lock`。因此新增獨立分類器，支援urlencoded／multipart，最多保留8,192bytes供解析；只回傳動作白名單、編碼類型、長度與欄位存在布林，不輸出nonce、cookie、欄位值或完整body。11個案例涵蓋兩種格式、重複／缺少action、File型action、損壞multipart、未知動作及兩種超界輸入，原request body全部保留、敏感值不出現在輸出。

第二個原生副本以相同未編輯草稿流程確認：實際multipart473bytes，action為`wp-remove-post-lock`、post_ID與active_post_lock存在；回應200／`1`、LOCAL186。隨後原生登出302／LOCAL187，畫面顯示「你已完成登出。」。本次無HTTP錯誤。這個結果證明本次鎖釋放在登出之前完成；新增分類await可能影響時序，不能拿它當成舊400的因果證明。

第三個副本執行兩個明確未登入控制，不傳Cookie或HTTP Authorization：相同multipart釋放鎖動作→400／`0`；heartbeat→200且`wp-auth-check:false`。入口probe header只允許進入私人測試站，不代表WordPress登入。固定核心admin-ajax.php有nopriv heartbeat callback，沒有nopriv unlock callback，未登入未註冊動作回400／`0`。正常unlock handler仍檢查nonce與edit_post權限，成功回`1`。沒有放寬這些檢查。

| 本機副本 | 最後版本 | charged bytes／puts | 允許的資料差異 |
| --- | ---: | ---: | --- |
| 初版分類與heap快照 | LOCAL187 | 299,751／18 | owned草稿edit lock、wp_options自增序列 |
| multipart原生驗證 | LOCAL187 | 299,780／18 | 同上 |
| 明確未登入控制 | LOCAL182 | 49,916／3 | wp_options自增序列 |

三者重新開啟獨立備份核對：所有文章／修訂／頁面內容、全部原usermeta／session、媒體與主題精確；沒有保存草稿或新增修訂。只允許meta72（owned193的edit lock）與wp_options序列欄位變更，其他序列欄位不變。這些LOCAL版本不是雲端變更，也不替代前輪真正保存／完整重啟驗收。

## Heap 快照的數字與限制

快照只連本機workerd inspector，不連Chrome inspector或雲端。每份最多128MiB輸出、45秒timeout，實際約25MB，原始strings／物件圖留私人檔案。編輯器與登出後各一份，capture期間無request／generation事件；一個WASM instance、沒有runtime rotation。快照可能觸發GC，沒有額外collectGarbage指令；不能把快照後較低用量當成正常尖峰或Cloudflare免費驗收。

| 快照 | snapshot self bytes（含WASM） | WASM backing | 檔案backing | 其他非WASM／非檔案backing |
| --- | ---: | ---: | ---: | ---: |
| 原生編輯器 | 122,976,050 | 74,907,648 | 31,426,460 | 877,247 |
| 登出後 | 123,071,549 | 74,907,648 | 31,426,135 | 877,247 |

WASM由loader的wasmMemory context→Memory→ArrayBuffer→backing_store辨識；不得在snapshot self bytes上再次加PHP。FSNode.contents→typed array→buffer→backing_store辨識2,564個獨立檔案backing，沒有與WASM重疊。只輸出數值與固定分類，不公開檔名／heap strings。

編輯器快照的檔案backing：核心22,527,346bytes、語言2,500,119、外掛／主題2,344,019、runtime1,536,150、暫存1,376,425、上傳653,558、canonical488,843。先前受關注的markdownFiles／uploadFiles／wpContentFiles啟動陣列所持有buffer，在這兩份快照為0；這不是所有情境均無洩漏的證明。

第一份snapshot前CDP used19,498,656／backing34,577,281，後降為14,840,316／33,208,825；第二份同樣下降。因此快照可以協助辨識仍被持有的資料，**無法證明正常完整編輯峰值已改善**。前輪原生保存／重啟的143.5／145.6MiB觀測仍有效且未解；此輪不編輯、快照會回收，不能直接當配對效能比較。下一步針對編輯／保存期間的短暫JS／ArrayBuffer配置取得stack證據，不靠移除WordPress功能或提高配額宣稱成功。

## 重現與交付

接在cleanup-native組裝後，用本目錄`install-local-tools.py --runtime <runtime> --apply`核對136個前置工具，加入9個工具；682個既有檔案不變，重套拒絕且不改檔。需要既有固定依賴、私人備份／owner／heap檔；沒有重新安裝依賴或操作雲端。

目前local/control使用v2 owner，遇已完成owner會拒絕重跑。v1輸入保存在其owner.directory內，供核對當時格式限制；snapshot audit固定讀v1的兩份已完成heap，不重新執行瀏覽器。boundary工具也拒絕既有owner。不同實驗另立有辨識度的紀錄，保留原成功／失敗資料與預算。

從runtime目錄執行唯讀重算：

```powershell
node scripts/playtt-ajax-classifier-check.mjs --local --check
python scripts/playtt-ajax-source-audit.py --local --check
python scripts/playtt-ajax-snapshot-audit.py --local --runtime . --check
node --import tsx scripts/playtt-ajax-retained-audit.mjs --local --check
```

原始heap／backup／log及憑證不交進repo。證據：[整合稽核](../../../docs/verification/cloudflare-ajax-retained-audit.json)、[11個分類器案例](../../../docs/verification/cloudflare-ajax-classifier-check.json)、[來源核對](../../../docs/verification/cloudflare-ajax-source-audit.json)、[heap持有分析](../../../docs/verification/cloudflare-ajax-snapshot-audit.json)、[組裝](../../../docs/verification/cloudflare-ajax-retained-rebuild.json)、[交付檢查](../../../docs/verification/cloudflare-ajax-retained-review.json)。

本輪0provider請求／部署／帳戶計費刷新。最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、餘62,344bytes、publisher暫停；沒有提高cap、退款、清unknown、刪pin／歷史或使用替代雲端資源繞過。provider記憶體／CPU、繁中首次初始化、長期免費、實體IME／裝置及全案A01–A20保持未完成，goal active、PR4 draft。
