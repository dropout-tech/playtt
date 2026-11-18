# 自動草稿清理：盤點與下一個驗收缺口

2026-11-19，從已校驗私人audit備份`c1423c9b-b818-4410-92f7-dff11ccb8d15`唯讀盤點，沒有刪除或修改遠端資料。這是序列修正後的下一項維運工作，尚未實作或部署排程。

## 目前證據

盤點覆蓋27個Markdown文章檔及`_tables/posts.json`的61列。只有一份auto-draft：文章93，建立與修改時間均為2026-11-17 09:02:27，儲存在Markdown；date_gmt為零值，不能用它推算到期。它在本輪檢查時尚未滿七天，沒有現在就刪除的理由。文章ID曾在修正前重用，因此不能只憑先前測試記錄裡的ID判定所有權。

最初只讀JSON表會漏掉這份草稿。可重現腳本`playtt-auto-draft-inventory.py`會同時檢查兩種儲存格式、驗證每個讀取物件的大小與SHA256，並拒絕重複ID；輸出不含標題、內文或憑證。需要Python與PyYAML，放入runtime/scripts後從該runtime目錄執行。證據見`docs/verification/cloudflare-auto-draft-inventory.json`。

WordPress的cron option含`wp_scheduled_auto_draft_delete`，但目前audit設定沒有cron trigger，入口`src/worker-playtt-do.ts`沒有scheduled handler；只有未直接暴露的上游`src/worker.ts`含scheduled處理。另一方面`DISABLE_WP_CRON`為true，`/wp-cron.php`由上游路由回404。這是實際配置與來源檢查，沒有聲稱已成功執行清理，也沒有用單一快照證明曾經執行過排程。

[WordPress官方清理函式](https://developer.wordpress.org/reference/functions/wp_delete_auto_drafts/)與本機固定核心一致：只選取`auto-draft`且`post_date`超過七天的資料，再透過原生刪除流程處理。不能改成依序號、空白標題或「所有草稿」清除。

## 下一步驗收

1. 在本機隔離站建立可核對的自有測試資料，包含超過七天auto-draft、近期auto-draft、舊一般草稿與已發布頁面。執行原生清理，只有到期auto-draft應被移除；重啟後其他內容、身份及自增序列應保留。
2. 接線時在既有WordPress執行DO佇列內執行維護，沿用canonical lease、完整R2提交與失敗復原。不要讓入口Worker另開第二份PHP，亦不要藉維護工作恢復已暫停的發布器。
3. 先驗證有界手動維護入口的權限、並行編輯與儲存失敗行為，再核對免費限制並考慮cron trigger。驗證前不在私人遠端啟用未審核的一般cron集合，避免順帶執行不相關外掛工作。
4. 清理後取得新備份，確認刪除資料曾用的序列仍保留；更新操作手冊與驗收狀態。正式playtt.tw持續保持Pages，不切換後台。

這份清單是尚待執行的驗收，不是通過報告。整體目標維持active。
