接續：[原生編輯器保留記憶體與PHP buffer歸屬核對](../retained-native/README.md)；仍保留一個未分類例外，雲端181未變。

# 原生命令選單的 REST403 已以路由與權限核對

2026-11-22（台北），從雲端181的獨立備份啟動新的本機副本，使用相同97a92c8固定模組。編輯者登入控制台後開啟原生命令選單，重現單一403：

`GET /wp-json/wp/v2/global-styles/:id?context=edit` → `rest_forbidden_context`。

備份中的使用者2確實是editor，具有edit_pages／edit_others_pages、沒有edit_theme_options；administrator具有該權限，角色定義沒有修改。核對已驗雜湊的WordPress7.1.4三個核心檔案：global-styles controller在edit context檢查更新權限；其父類別透過edit_post判斷；wp_global_styles的編輯能力對應edit_theme_options。行為也符合[官方方法說明](https://developer.wordpress.org/reference/classes/wp_rest_global_styles_controller/get_item_permissions_check/)。

這次回應符合原生權限限制。沒有放寬帳號權限、略過驗證、隱藏錯誤或修改核心程式。上一輪的單筆403缺少路由及錯誤碼；相同操作已可重現相同類型的拒絕，但對上一輪那一筆的歸因仍是推論，不能倒補成當時已捕捉到的證據。

## 實際使用影響

原生命令選單搜尋「課程」仍顯示「課程資訊與收費 編輯」，點選後可進入真正的Gutenberg畫布，顯示課程區塊及六筆既有修訂；接著draft193的畫布顯示原十段與已儲存狀態。最後使用原生連結登出。本次沒有修改正文、儲存、發佈或測試IME，不因此重簽完整A06。

觀測224請求：213個200、9個302、1個303及上述1個403，捕捉到的workerd exception為0。路由數字／slug遮蔽；只保留context的edit/view/embed與最多8192bytes錯誤回應中的code。未保存請求body、Cookie、nonce、任意查詢值或錯誤message。未啟用heap／CPU profiler，數據也不作延遲A/B比較。

## 封存與資料完整性

600秒／1,881,041bytes／96ops的本機窗口實際使用465,316bytes／27ops，final **LOCAL190**，closed／sealed／pending0，所有程序結束。從封存資料匯出，再獨立匯入305物件／298檔精確一致。原session逐項一致，本次新增session已移除。

所有正文、修訂、圖片、主題與其他Markdown精確。列明實際差異，不把未按儲存誤寫成零寫入：

- draft193既有_edit_lock，以及課程26新增_edit_lock（meta77）。
- 使用者2的最近使用命令新增page-26及更新時間；其餘偏好／usermeta精確。
- wp_options序列784→794、wp_postmeta序列76→77；其他序列不變。
- page/class.md新增__playtt_content完整性標記。移除該行後與原檔逐位元相同；正文10,479bytes及SHA與標記精確，原生解碼結果未變。

最初離線稽核誤將頁面26當作_tables/posts.json列，因頁面儲存在Markdown而停止；修正為核對實際page/class.md與既有內容框架後通過。原生流程本身一次完成，未重開窗口、重播登入或重做任何雲端操作。檢查用的原生DOM及私人備份留在本機，不放入PR。

## 交付與下一步

Cloudflare請求／部署0；82來源、20設定與相容reader固定模組未改。5個本機工具增量安裝核對86前置SHA、拒絕覆寫；沒有新抓上游。正式Pages與原視覺不變。

雲端最後驗證仍為2026-11-21T16:52:39.597Z的181／pin16／餘62,344、aa595610相容reader、closed／sealed／pending0、publisher paused。LOCAL190不能替代雲端181。本機獨立診斷額度不代表增加雲端上限；不可重跑已完成owner或換bucket繞過餘額。

403已具體分類，可轉向受控的PHP耗時與保留記憶體分析，以及唯讀Free／DO用量查核。仍不能宣稱整體isolate／計費CPU、持續Free、實機／IME或A01–A20完成。完整目標active，PR4 draft，正式後台暫不切換。

證據：[資料與UI稽核](../../../docs/verification/cloudflare-rest-route-audit.json)、[固定核心來源](../../../docs/verification/cloudflare-rest-route-core-audit.json)、[觀測](../../../docs/verification/cloudflare-rest-route-observation.jsonl)、[組裝](../../../docs/verification/cloudflare-rest-route-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-rest-route-review.json)。
