# 啟動 ZIP 候選的原生編輯驗證

同一份完整建置 `abc3045e3e01dd1b8454be9ffd709519bf016a5b6b16f8f3d6efdaab65d4befb` 已完成原生繁中編輯、單次儲存、完整workerd關閉重啟、新分頁讀回、登出與獨立備份。這輪無runtime例外，資料精確；**免費記憶體與全案驗收仍未完成**。

正式Pages、原站視覺、中央runtime、雲端Worker與發布狀態均不變，沒有部署或付費。本輪只新增本機驗證工具，未再修改候選程式。

## 執行邊界與原生操作

使用固定cloud181獨立備份播種本機副本、測試編輯者2與指定草稿193，publisher暫停，外連封鎖。固定600秒／1,881,041bytes／96ops視窗，沒有增額、退款、重開視窗或重播完成owner。

六個正式建置模組逐一核對SHA。只在本機wrapper沿用既有兩層request lifecycle診斷：response body不包裝，Ajax只記錄有界分類／布林欄位，不記nonce、cookie或正文。實際執行的三個新工具及兩個既有診斷helper皆在啟動前留存副本與SHA；中央82來源不變。

瀏覽器由存取入口及WordPress登入，從頁面清單進入指定草稿，修改第10個段落並按原生「儲存草稿」。回應200，精確1,875bytes及內容SHA，receipt版本186；隨後快照187也保有該內容。未按發佈。

離開編輯器後完整dispose舊workerd，確認9547／9548埠關閉，再啟動新instance。版本188／charged350,096bytes、全部資料及budget前後相同，未重新播種或重開視窗。新分頁顯示相同內容、已儲存與11筆修訂；快照189核對相同內容。由DOM中原生登出連結退出，畫面確認已登出。

## 資料及診斷結果

最終LOCAL191、charged500,252bytes／30puts，closed／sealed／pending0，terminal exit0。原文章／修訂、完整usermeta及原session、媒體、主題與其他內容精確；只新增revision209及預期草稿／鎖／序列差異。新增的測試session已移除。

獨立匯出／匯入與完整materialization核對304物件／298檔，逐檔內容一致。離線audit另行重讀兩份備份、檢查原postmeta／序列、內容marker與SHA，不只採信summary通過旗標。

重啟前688、重啟後91筆有界lifecycle事件，無截斷或診斷錯誤。兩次原生multipart釋放文章鎖，在outer及execution均200且aborted=false；登出兩層均302。runtime例外0。唯一HTTP錯誤是刻意先查看未通過gate的根路徑404，發生於登入前；其餘HTTP錯誤0。

這輪零例外不能回推先前 `Network connection lost` 的原因，也不代表已修好傳輸問題。未加錯誤吞除或放寬權限。

## 記憶體與配置證據

| 階段 | 全部／可配對樣本 | 最大觀測組件合計 | 最大觀測PHP heap |
| --- | ---: | ---: | ---: |
| 重啟前 | 178／123 | 151,276,543bytes（約144.3MiB） | 74,055,680bytes |
| 重啟後 | 50／42 | 149,875,632bytes（約142.9MiB） | 73,400,320bytes |

這些值仍高於128MiB診斷參考線。組件合計是同generation的JS usedSize、backingStorageSize與最近PHP heap樣本，有非同步及觀測開銷；本機workerd不強制雲端限制，數字不能作為provider精確尖峰、RSS或通過證明。

render窗口累計sampled JS33,661,456bytes，save窗口48,327,064bytes，包含周邊請求及診斷控制。原始profile的SHA、函式／呼叫者與編譯行號均留有證據。render可定位getattr／writeStat、lookupPath及js_fd_read；save仍見ZIP的E2、base64與next等。根部V8 API的9,575,380bytes缺少呼叫者，不能歸因給某一功能。

累計配置包含已回收物件，不是同時持有量；不同瀏覽器時序不能用來宣稱整體尖峰或耗時改善。下一步先釐清PHP stat路徑的暫存屬性／Date轉換，保留公開FS.stat／fstat回傳、時間、mode、errno、掛載、symlink與stream自訂getattr語意；也可對清單編碼的iterator暫存提出獨立假設。尚未實作或宣稱這些方向能解決尖峰。

## 交付與驗收限制

接續boot-zip組裝，安裝器核對219前置工具，新增4工具，保留765檔，共769；重套及完成native owner重播均拒絕且不變更檔案。

```powershell
node --import tsx scripts/playtt-boot-zip-native-audit.mjs --local --check
node scripts/playtt-boot-zip-build.mjs --local --check
```

原始profile、文章、登入資訊、cookies／nonce與備份payload不提交。這是DOM編輯驗證，尚非實體IME或手機驗收；第一次繁中初始化、provider記憶體／CPU、長期免費及A01–A20仍開放。

本輪0 Cloudflare請求／部署／帳務刷新。最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、pin16（保留原15）、歷史餘62,344bytes、publisher暫停；不是目前帳務查詢。PR4維持draft，全案active。

證據：[原生資料與配置稽核](../../../docs/verification/cloudflare-boot-zip-native-audit.json)、[前輪完整建置與行為比較](../boot-zip/README.md)。
