# 原生 Base64 候選的完整編輯流程

完整建置 `0f9d3340e3e66f7cc6242bf31cc26d4d76ad9c78dfa7f87a17adca214206b025` 已通過繁中原生編輯、單次儲存、完整 workerd 重啟、新分頁讀回、登出與獨立備份。資料精確、runtime 例外 0；**觀測記憶體仍高於 128 MiB 參考線，免費與全案驗收尚未完成。**

此輪只新增本機驗證工具，未再次修改候選實作。正式 Pages、原站視覺、中央 runtime、雲端 Worker 及發布狀態維持現況，0 Cloudflare 請求／部署／帳務刷新。

## 完整流程與資料結果

沿用固定 cloud181 獨立備份、本機編輯者 2／草稿 193、暫停 publisher、封鎖外連，以及 600 秒／1,881,041 bytes／96 operations 視窗。三個執行工具由前輪已驗證 harness 精確轉換，只改固定建置、工具／物件名稱與本機埠 9551／9552；資料、原生操作、額度、重啟及備份斷言不變。啟動前留存實際執行的三個工具與兩個診斷 helper 的副本和 SHA。

由測試入口登入 WordPress，頁面清單進入原草稿，修改第 10 個段落並按原生「儲存草稿」。回應 200、內容精確 1,875 bytes、receipt 與保存快照版本 186。離開編輯器到個人資料頁，原生程序釋放文章鎖。

完整關閉舊 workerd、確認兩埠關閉再啟動新 instance。LOCAL188／charged350,092 bytes、全部資料、狀態與 budget 前後精確，未重播、重新播種、增額或重開視窗。新分頁顯示相同繁中內容、已儲存與 11 筆修訂；快照189再次核對。使用頁面原生登出連結，確認「你已完成登出」。

最終 **LOCAL191、charged500,245 bytes／30 puts、closed／sealed／pending0、exit0**。原文章、修訂、完整 usermeta 與原 session、媒體和主題保持一致；只新增 revision209 與預期草稿／鎖／序列差異。新測試 session 已移除。獨立匯出／匯入及完整 materialization 核對 **304 物件／298 檔**，所有檔案內容精確。

離線 audit 重新讀取原備份、新備份及完整 materialization，逐筆檢查原資料、修訂、usermeta、postmeta、序列、內容 marker／SHA、額度及重啟證據，並核對實際執行工具與六個完整建置模組。

## 診斷與記憶體限制

重啟前／後共 686／91 筆有界 lifecycle 事件，沒有截斷、診斷錯誤或 runtime 例外。兩次原生 multipart 釋放鎖在 outer／execution 都回 200，aborted=false；登出兩層都回 302。唯一 HTTP 錯誤是登入前刻意查看未通過 gate 的根路徑 404，其餘錯誤 0。這只描述本次觀測，不能回推或宣稱修復歷史連線例外。

| 階段 | 全部／可配對樣本 | 最大觀測組件合計 | 最大觀測 PHP heap |
| --- | ---: | ---: | ---: |
| 重啟前 | 129／100 | 151,142,080 bytes（約144.1 MiB） | 74,055,680 bytes |
| 重啟後 | 49／40 | 153,715,365 bytes（約146.6 MiB） | 73,400,320 bytes |

組件合計使用同 generation 的 JS usedSize、backingStorageSize 與最近 PHP heap 樣本，有非同步及觀測開銷；本機 workerd 不強制 provider 限制，不能當精確雲端尖峰、RSS 或通過證明。不同瀏覽器時序不能用來宣稱全流程改善或退步。

[前一階段](../base64-native/README.md)的獨立控制確實減少序列化／解碼累計配置約44.07%，但累計包含已回收物件，與本次同時持有量不同；這項改動尚不足以證明免費後台可用。後續應依實際持有來源及尖峰階段選擇假設，不能把局部配置下降直接當成解決整體記憶體限制。

## 交付與續行

接續 base64-native 組裝，核對 230 個前置工具、加入 4 個工具、保留原776檔，共780檔。完成 owner、安裝器重套均拒絕且不修改資料；本機服務、observer 及瀏覽器分頁皆已關閉。原始 profile、文章與備份 payload、帳密、cookie／nonce 留在私有檔案。

```powershell
node --import tsx scripts/playtt-base64-editor-audit.mjs --local --check
node scripts/playtt-base64-native-build.mjs --local --check
```

第一次繁中初始化、provider 記憶體／CPU、長期免費使用、實體 IME／手機與 A01–A20 仍未驗收。最後雲端確認仍 2026-11-21T16:52:39.597Z、canonical181、pin16（保留原15）、歷史剩餘62,344 bytes、publisher暫停；不是本輪帳務查詢。PR #4 維持 draft，目標 active，正式後台暫不切換。

證據：[原生資料與配置稽核](../../../docs/verification/cloudflare-base64-editor-audit.json)、[候選實作／行為比較與完整建置](../base64-native/README.md)。
