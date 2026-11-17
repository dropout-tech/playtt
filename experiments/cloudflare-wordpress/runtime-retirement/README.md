# 已保存請求之間釋放執行器

私人研究候選。正式playtt.tw仍為Pages；依使用者決策繼續全Cloudflare免費後台研究，暫不切換。

## 問題與做法

前一候選修正初始化資料重複保留與核心檔案容量後，已通過七筆發布批次及繁中原生樣式儲存／重新部署／還原；但長時間遠端讀取在386次後發生記憶體超限。固定PHP web WASM初始配置為67,108,864 bytes，上游400次請求的hot swap會先建立新執行器，再複製原檔案系統；兩份WASM與網站檔案同時存活不適合目前記憶體條件。遠端失敗發生在此邊界附近，沒有成功記錄第2代。舊結果與限制完整保留於memory-lifetime/。

本候選用原生request.end事件計算完成的PHP請求。達96次，或WASM配置達76MiB，在序列化的HTTP／發布工作完整返回後釋放已快取的PHPRequestHandler，下一次請求從已提交R2版本建立新執行器。上游400次保護保留；沒有改共享node_modules。

原生GET也可能建立auto-draft或主題關聯。在即將釋放的GET結束前，使用原本仍持有的canonical lease核對完整有限資料清單；有變更才提交指標，再釋放快取。這些讀取初始化不產生內容發布工作。正常POST仍走原本的寫入、發布工作與原子提交流程。

WeakMap與事件監聽器只保留計數資料；釋放後的舊promise不跨越下一次啟動。發布alarm亦只在工作完成後檢查釋放條件。下一次冷啟動可能增加數秒到數十秒延遲，需要以遠端實測決定實際操作體驗。

## 重現與驗證界線

先依既有文件套用security-update、automatic-publication、memory-investigation/tracked-allocator、publication-batching、memory-lifetime及runtime-rotation補丁，再套本目錄runtime-retirement-candidate.patch。scripts檔放入runtime-cloudflare/scripts，在固定相依套件與既有隔離資料上執行。

- TypeScript通過；固定PHP web WASM事件測試確認重複註冊不重複計數，第95次不釋放、第96次應釋放。
- `playtt-retirement-draft-check.mjs --local`透過原生新增頁面GET建立空白auto-draft，210次混合後台讀取跨過兩次釋放，檢查原頁面／樣式雜湊、同一草稿編號及內容，最後僅刪除本次建立且身份相符的空草稿。
- `playtt-retirement-draft-inspector.mjs --label=retirement-preserve`執行上述本機流程並記錄數值記憶體及釋放事件，沒有強制GC。
- `playtt-retirement-read-check.mjs --remote`僅允許固定私人restore-v1，410次循序讀取，遇錯即停止；不應把請求數或本機通過等同遠端記憶體已通過。

第一版本機210次讀取與兩次釋放成功，但空白auto-draft重新載入時404。追查固定MDI來源確認INSERT寫入引擎與storage兩處刻意跳過auto-draft；因此只在釋放前提交完整檔案清單仍不夠。該失敗證據保留為cloudflare-retirement-draft-before-policy-local.json，不列為功能通過。

目前候選針對固定MDI來源的兩個唯一比對位置修補，保留auto-draft原生狀態／內容／權限；不將它自動發布或改為一般草稿。啟動時若固定來源不符會拒絕套用。未來營運仍須驗證既有WordPress舊自動草稿清理排程。

修正後相同本機流程通過210次讀取、兩次釋放、三次建立；原草稿仍存在、原頁面與樣式不變，最後只刪除本次空草稿。另在草稿仍存在時以未登入請求確認頁面404、編輯REST 401。七筆發布批次亦再次通過，合併發布22.090秒，清理結束exit 0。證據見cloudflare-retirement-draft-local.json、cloudflare-retirement-draft-anonymous-local.json、cloudflare-retirement-local-memory.json與cloudflare-retirement-batch-local.json。

私人遠端a33083f3-7fb1-4fae-8ee8-f53d824427db已通過`playtt-retirement-draft-check.mjs --remote --long`的410次混合讀取，跨過前版386次失敗點。原生GET建立的同一auto-draft跨重建保留，原頁面／樣式雜湊不變；匿名頁面404、編輯REST 401，最後只刪除本次草稿。後續七筆發布批次通過65.513秒，內容、狀態與頁尾均已還原。

Chrome原生繁中網站編輯器讀回通過，保留原站主視覺、LINE入口與「已儲存」狀態。09:02–09:22 UTC的tail觀測到1,280個事件封裝、全部ok且無例外，明確記錄四次釋放和六次建立；部分標記未被tail收錄，不能當成完整請求或釋放計數。最大觀測WASM配置75,956,224 bytes，不等於整個isolate用量。

單輪410次REST讀取的回應標頭等待時間中位數927ms、p95為1,570ms、最長11,010ms；其中七次超過兩秒、一次超過五秒。冷啟動仍可被使用者察覺，這不是瀏覽器互動延遲或正式SLA。

新的私人備份有295個索引項目，逐檔雜湊核對通過。這份備份的獨立還原、更長時間原生編輯、故障回復及舊自動草稿清理仍待驗。證據見`docs/verification/cloudflare-retirement-*`；正式Pages與原主要資料區未變，私人發布器paused，未開通付費方案。
