接續：[獨立原生還原、取消請求定位與中央研究generator採用](../materialized-native/README.md)；雲端未部署，歷史產物保持不變。

# 路徑候選：原生繁中儲存與完整重啟

2026-11-22（台北）。固定候選bundle SHA `824e974b27bf37302cc6607a840985f56b89fedc19e899e3e6140d8ac66cb2fa`，沿用[上一輪完整來源建置](../path-join/README.md)。這輪補上候選的真實Gutenberg編輯與儲存、完整workerd程序重啟、原生登出及備份核對。中央runtime與雲端仍未採用此候選，正式Pages／原視覺維持現況。

## 實際原生流程

從雲端181的固定獨立備份建立新本機副本。以編輯者2登入，在draft193的第十個原生段落透過contenteditable fill新增繁中文句，點「儲存草稿」。未呼叫瀏覽器內部WordPress store，也未用REST代替UI儲存。

唯一原生POST回200、draft，正文1869bytes，SHA與預先指定正文精確一致；原生回應canonical186，完成背景維護後讀值187。接著離開編輯器停止心跳，以同一個控制程序dispose整個Miniflare/workerd，驗證兩個連接埠均已關閉，再使用相同持久目錄重啟。沒有重新seed、arm或重設額度。

控制器驗證新instance ID、重啟前後完整state／內容／預算精確相等：LOCAL188、charged350,033bytes，同一寫窗及deadline。再由瀏覽器重新開原生草稿，十段均存在、新文句可見、已儲存、草稿狀態，修訂10→11。冷讀canonical189。最後原生登出成功，全部原session精確保留，只移除此輪新增session。

重啟的成功控制器回覆已在本次工具執行中觀察，後補保存於`cloudflare-path-save-restart.json`；其來源明列為工具回覆轉存，不冒稱獨立原始server log。交付runner已補上日後即時保存restart proof，但沒有為此重播已完成副本。

## 日期核對與獨立備份

原runner完成封存後的嚴格核對，因草稿`date`更新而停止；這不是正文遺失。固定WordPress corpus的`wp-includes/post.php:5356–5371`明確規定：draft／pending／auto-draft、未edit_date且date_gmt為零時，儲存將date改為current_time。另以封存後唯讀重掛，同一份持久資料做匯出、獨立import與full materialization，沒有WordPress請求、seed、arm或帳本變化。

後續離線核對要求狀態仍draft、GMT仍零、date等於modified且落在此次儲存時間內；其餘frontmatter精確。舊78個posts-table列完全保留，只新增revision209、parent193、author2、inherit，正文與預期一致。其他頁面／媒體／主題／usermeta完全相同。差異僅為指定草稿正文／日期、該草稿edit_lock、posts新增修訂、options序列784→802及posts序列208→209。

最終為**LOCAL191**，304物件／298檔獨立備份與materialized full pack精確相等，500,144bytes／30puts，closed／sealed／pending0，程序／自有分頁皆結束。此證據包括原生重啟讀回與離線完整轉存；還沒有在另一個空環境由materialized備份跑完整使用者還原驗收。

## 例外與工具失敗紀錄

原生流程227個完成請求：218×200、8×302、1×303，沒有HTTP400以上。但登入階段捕捉8個`Uncaught Error: Network connection lost.`，最多8筆私人細節分支本輪已實際觸發。訊息沒有可用stack；原因及與更早未分類例外的關係均未證明。完整重啟後例外0，不把這個數字當成修復結論。

正式原生測試前有兩次本機工具準備失敗：v1在module global呼叫randomUUID，workerd於啟動前拒絕；v2遇Windows文字編碼問題，沒有完成預定工具修正，已在任何登入／編輯前封存並終止。保留兩次owner與log，未重播。v3實際原生流程完成，原日期assertion失敗及唯讀補驗全部保留。交付native runner修正惰性instance標記、日期驗證及即時restart checkpoint；日期核對由獨立離線audit實測通過，未再跑native owner。

## 使用及界線

5個新工具依`tool-files.json`與97個已固定來源／工具組裝。需先完成path-join的候選完整建置及私人cloud181備份，沿用前輪模組計畫；不是新上游／依賴安裝。`install-local-tools.py --runtime <隔離runtime> --apply`只加入這些本機工具。已完成owner存在時拒絕原生runner，不能重開或刪除owner來重播。`playtt-path-save-recover.mjs`僅讀已封存且符合特定日期assertion的資料；已匯出會拒絕。`playtt-path-save-audit.mjs`為離線查核。

Cloudflare請求／部署0、付費0、中央82來源／原loader／20設定不變。雲端最後實測仍是2026-11-21T16:52:39.597Z的181／pin16／剩62,344，publisher paused、closed／sealed／pending0，未刷新本期計費。這輪沒有擴大寫入額度、清除unknown、刪pin／歷史或改資源繞過。

下一步先定位connection-loss觸發條件，再完成獨立materialized還原的原生讀回，評估是否把已驗證的單行loader改動納入研究建置。仍須provider整體記憶體／CPU、持續免費、實體裝置／IME與完整A01–A20驗收；本輪fill並不等於真實輸入法。目標active、PR4 draft，正式站不切換。

證據：[資料稽核](../../../docs/verification/cloudflare-path-save-audit.json)、[重啟控制器回覆](../../../docs/verification/cloudflare-path-save-restart.json)、[交付組裝](../../../docs/verification/cloudflare-path-save-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-path-save-review.json)。原始DOM、例外細節、持久資料、憑證與logs不進PR。
