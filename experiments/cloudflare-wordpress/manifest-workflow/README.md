# 壓縮清單：本機完整原生流程與登出核對

以 b5eec65 的實際runtime，啟用既有可選content-gzip與manifest-envelope寫入，在新本機Chrome副本完成原生登入、程式碼／視覺模式切換、兩次autosave、一次手動保存、完整workerd重啟、九段內容逐段重讀與原生登出。實際gate、coordinator、容量帳本與600秒／1,881,041bytes／96操作限制保留；publisher paused。沒有更動runtime或20份設定。

完整流程含封存與備份共307,281ms，使用847,368bytes／51puts，餘1,033,673bytes；最後closed／sealed／pending0。登入162，手動保存175，冷初始化177，登出178。本次session已移除、原有5個session逐一精確保留；其他頁面／既有修訂／媒體／主題精確。保存修訂207保留，冷初始化移除過時autosave206與footnotes76。偏好僅原生_modified變化，ID維持單調。

完整備份304物件／298檔；獨立目錄重新開啟逐檔精確，轉舊完整格式並再次開啟也一致。17份封套清單合計399,591bytes，等價完整JSON合計1,258,493bytes，清單表示減少858,902bytes；gzip內容包444,666bytes。這些分項不含pointer，不可當成另一個完整流程的反事實帳本，也不代表長期免費或provider記憶體／CPU驗收。

## 登出後400與明確重現

完整流程的登出GET先302並提交178；隨後一筆admin-ajax POST為400，仍指向178，沒有新版本。登入畫面顯示「你已完成登出」，獨立canonical核對確認本次session移除。原記錄將該action歸為other，**不能回頭宣稱已精確觀察到名稱**。

另一個新本機副本只做登入、開啟原始八段草稿與登出，僅把允許的動作名稱wp-remove-post-lock加入診斷清單，不記錄nonce／cookie／表單值。它重現：登出166後，離頁wp-remove-post-lock收到400、仍為166，無後續canonical寫入。全部usermeta含原session逐位元組恢復原值，正文／修訂不變；只剩原生_edit_lock與單調ID差異。127,705ms使用248,768bytes／15puts；完整備份／materialize再讀均精確。

核對已固定SHA的實際WordPress runtime archive：wp-admin/admin-ajax.php第99行列出登入後動作wp-remove-post-lock，第195行起在沒有nopriv handler時回傳400；core沒有該動作的匿名handler。這支持原生登出與離頁解鎖競態的解釋。完整流程原other的確切action仍是根據新重現的推論，並非補造原始觀察；兩次400保留，不宣稱零HTTP錯誤，也未忽略任意4xx或改變登出行為。

## 保留第一個到期嘗試

本輪第一個獨立副本先完成保存176與冷重開180，但agent在處理登出選單時窗口到期；595,239ms用1,096,796bytes／66puts，餘784,245bytes，已closed／sealed／pending0。該owner保持expired，未重新開啟、退款或加額度；最終獨立備份未完成，原本機state及before／saved／cold資料保留。這是操作時間失敗，不是儲存不足或成功登出。

後來完整流程使用另一份備份161副本、全新owner／port／相同限制。沒有把前次失敗改成成功。完整流程離線檢查初次早於server結束而無檔，等待原handle結束後續驗；其零錯誤假設被晚到400推翻，改為精確保留該觀察並補獨立重現與session／canonical核對。診斷verifier改用既有zip dependency，未新增套件。這些僅是工具驗證修正，未改runtime或原始證據。

## 工具與後續

接續manifest-envelope後執行 `python manifest-workflow/install-local-tools.py --runtime <runtime-cloudflare> --apply`，先核對12個prerequisite再新增10個工具。81份來源與20設定不變；重複安裝在改檔前拒絕。先前unused scheduled helper差異仍記錄於前輪rebuild。

manifest-budget（9473）為expired；manifest-complete（9475）及logout-action（9477）為finished/disposed。所有本機程序與自有Chrome分頁已關閉，runtime外連0。不可刪owner guard重跑。manifest-budget-final.mjs是未使用的中途草稿，不納入交付。可讀取停止資料重驗：先執行 `playtt-logout-action-final.mjs --offline`，再執行 `playtt-manifest-complete-final.mjs --offline`。

下一步評估一次私人Cloudflare provider驗證：先刷新現有161／pin13／剩餘額度與封存狀態，再以同樣完整原生流程和action-only診斷測試；不得提高上限、清除歷史、付費或切換正式後台。實際舊source rollback、whole-isolate／CPU／延遲、長期Free、實機／IME與完整A01–A20仍未完成。

本輪零Cloudflare請求、零部署，正式Pages與現有視覺不變，PR4 draft。最後雲端仍是06:28:14Z的161／pin13／餘1,881,041bytes，未刷新；目標active。前輪108項相關測試與TypeScript屬來源整合證據，本輪來源未改、沒有重跑。

證據：[完整流程](../../../docs/verification/cloudflare-manifest-workflow-summary.json)、[逐次變更](../../../docs/verification/cloudflare-manifest-workflow-history.json)、[登出動作重現](../../../docs/verification/cloudflare-manifest-logout-summary.json)、[到期嘗試](../../../docs/verification/cloudflare-manifest-expired-summary.json)。
