# 壓縮後原生流程：保存與重開成功，登出容量不足

最新[清單壓縮整合候選](../manifest-envelope/README.md)已通過本機原生HTTP保存、冷讀及還原，完整browser容量仍待重測。以下為前階段歷史。

使用 5505c7e 的實際 runtime，從獨立驗證的私人備份 161 啟動新本機副本。Chrome 經原生私人入口與繁中登入，切換程式碼／視覺模式，等待兩次 autosave，按一次手動保存，再完全重啟 workerd、重新開啟九段內容並嘗試登出。啟用原本 outer Worker、SQLite coordinator、容量帳本、寫入追蹤與限時窗口；publisher paused。沒有再注入儲存或 PHP 政策。

**手動保存及冷重開通過，但完整流程仍未通過：離開編輯器的 AJAX 和登出各收到一次 503。** 窗口沿用 600 秒／1,881,041 bytes／96 操作；實際用 458,824ms、1,858,811 bytes／56 puts，餘 22,230 bytes，closed／sealed／pending0。未提高上限、退款、刪歷史或 pins。這段時間包含 agent 操作延遲，並非最快使用者流程下限，也不能推論所有更快流程必然失敗。

## 原生內容與獨立還原

本機 161→179 的 18 次提交連續，兩次 autosave 成功；176 手動儲存的正文與修訂207逐位元組精確。完全重啟後，畫面九段皆與預期一致；178 的 WordPress 原生初始化移除已過時 autosave206及其 footnotes76，保留207。其他頁面、既有修訂、媒體及主題完全一致；日期欄位、edit lock、偏好 _modified 與單調 ID 都依原生行為保留。

原有五個 session 完整保留；本次新 session 仍留在已停止的本機副本，登出未提交。不得將畫面導航或已嘗試登出當成成功。沒有重送手動保存，沒有第二次寫入窗口。

最後 compressed-content 備份圖有 304 物件／298 檔，包含 gzip 與 raw 資產副本；在獨立目錄重新開啟逐檔核對，再轉舊完整格式並再次開啟仍精確。原始資料、封存收據與失敗日誌都保留。runtime 外連0、程序關閉、自有瀏覽器分頁關閉；未接觸 provider。

## 下一個寫入來源

18 份完整清單各 74,029 bytes，合計 **1,332,522 bytes，占全部 charged bytes 約71.7%**；已提交 gzip 差異合計470,642 bytes。兩者未涵蓋 pointer 及失敗嘗試，不能當總帳本。

最後一份清單的 Node gzip level6 離線樣本由74,029→17,266 bytes，解壓完全相同；若以base64裝進JSON則payload本身為23,024 bytes，另需封套欄位。**這只是離線樣本，尚無新的 manifest 格式或 runtime 寫入實作。** 不能假設直接壓縮原本 JSON 後，既有 `.json()` 讀取、快取與備份工具會繼續相容。

下一步建立明確且有界的清單格式，處理實體物件 SHA 與解碼後清單、前一版本快取、cold reader、pin／下載／備份／還原及舊程式回退；保留完整原始清單與所有原生更新。完成後再跑整段原生流程，留足登出與封存餘額。這次尚不足以消耗剩餘 provider allowance 做同樣重測。

## 工具與重建

接續 compressed-runtime 後，執行 `python compressed-budget/install-local-tools.py --runtime <runtime-cloudflare> --apply`，先核對8個 prerequisite，再新增4個診斷工具。runtime來源與20設定不變；重複安裝在任何變更前拒絕。

`playtt-compressed-budget-ui.mjs --local` 使用127.0.0.1:9463；本輪 owner 已 finished/disposed，不得刪guard重跑。控制器支援 status／diagnostic／before／saved／cold／restart／finish；history 讀取完整 snapshot graph，能核對沒有 raw Markdown replica 的壓縮快照，輸出欄位名稱而不輸出 session 值。`playtt-compressed-budget-final.mjs --offline` 只讀停止後資料及備份，可以重驗。

啟動時 owner 尚未建立；確認同一程序存活後等到 ready，未重啟或重送。離線 verifier 起初把伺服器收到心跳的間距硬限在29.9秒以上而失敗；實測約29.804～30.220秒。修正為驗證原生設定字串30並原樣報告間距，保留「非嚴格速率限制」結論，沒有改寫原始紀錄。Miniflare 空storageClass的Standard fixture延用前輪，正式validator不變。

證據：[總結](../../../docs/verification/cloudflare-compressed-budget-summary.json)、[逐次變更](../../../docs/verification/cloudflare-compressed-budget-history.json)、[瀏覽器結果](../../../docs/verification/cloudflare-compressed-budget-browser.json)。本輪零Cloudflare請求、零部署、未付費；最後雲端仍是06:28:14Z的161／pin13／餘1,881,041bytes，未刷新。正式Pages／視覺不變，PR4 draft，完整目標active。
