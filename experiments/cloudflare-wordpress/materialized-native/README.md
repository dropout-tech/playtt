接續：[本機記憶體限制、WASM觀測校正及冷啟動線索](../local-memory-limits/README.md)。功能證據保留，未驗收provider記憶體。

# 獨立完整備份原生還原、取消請求定位與研究版採用

2026-11-22（台北）。以原生儲存／完整重啟測試產生的LOCAL191備份，完成另一個全新空環境的原生登入、草稿、修訂及登出。另以完全不含網站資料的固定靜態資源實驗，重現取消請求時的connection-loss訊息。經語義、原生保存與獨立還原核對，將單行路徑優化納入**中央研究runtime的loader generator及產物**；沒有部署到Cloudflare或正式Pages。

## 真正從獨立完整備份啟動

來源是前輪獨立import後materialized full pack，不是直接沿用原本DO／R2目錄。先核對materialization-provenance來源anchor及全部內容，再把完整備份匯入新建空目錄；新R2原先物件數0、建立新的coordinator191。固定候選6個模組SHA與82個來源逐項核對，發布器paused，600秒／1,881,041bytes／96ops寫窗不變。

編輯者2從入口自然跳轉登入；還原後Gutenberg顯示十段、前輪新增繁中文句、已儲存、草稿及11筆修訂。點入原生修訂畫面，最新為209，差異畫面明確顯示新增文句。這輪只檢視修訂，沒有點「還原」或再改正文。原生登出成功。

最終**LOCAL198**，新匯出的301物件／298檔獨立備份精確；正文1869bytes及全部posts／revision／usermeta／媒體／主題一致。全部原session保留、新session移除；僅既有edit_lock72與options序列802→812改變。198,548bytes／21puts、closed／sealed／pending0，程序及自有分頁均結束。這補上前輪只有離線materialization、尚未原生開啟獨立還原的缺口；不擴張為完整編輯發布或實體IME驗收。

## 取消請求的可重現證據

前輪8筆例外集中在登入GET之後的靜態資源載入；當時工具在入口303之後又立即goto登入頁。這輪自然跳轉有23個資產請求，Runtime.exceptionThrown為0；之後重複導覽也為0，但其資產請求數0，已有瀏覽器快取，兩者不是快取條件相同的因果對照。

因此另開**全新、只讀靜態副本**：同一候選bundle，只seed固定WordPress static corpus，不含WordPress網站資料、不配置PHP execution DO；路由只允許一個公開core JS與4個測試case，R2寫入方法由本機wrapper明確拒絕。實際請求使用Node HTTP本機用戶端，不使用瀏覽器cookie／內部狀態。

| 操作 | 實際結果 |
|---|---|
| 完整下載control-before | HTTP200、3,821,298bytes、SHA精確、例外0 |
| 收到headers後取消 | 主動關閉連線，例外0 |
| 觀測到request-start、尚未觀測到headers時取消 | 用戶端ECONNRESET；worker產生一筆`Uncaught Error: Network connection lost.`，無stack |
| 完整下載control-after | HTTP200、相同bytes／SHA、沒有新增例外 |

第三組取消後，wrapper仍記錄即將回200，接著workerd外層產生例外；沒有PHP／generation事件、沒有wrapper throw，也沒有Request.signal abort事件。**因此不能把沒有signal事件當成沒有取消。** 這證明同一訊息能由在途客戶端取消造成，且不需要PHP／資料庫錯誤；先前8筆沒有取消／request關聯，仍只能作因果推論，不能倒補歷史證據或宣稱全部已修復。更早缺細節的例外也仍保留未分類。不在runtime隱藏例外、不放寬權限。

靜態副本R2前後只有同一物件、size／etag不變、無外連，程序結束。首次工具漏配固定容量namespace且用了未允許的scope，第一個control GET即500，沒有進行取消測試；失敗owner／兩筆容量例外保留。補齊真正namespace、固定允許scope後使用全新v2副本完成4組，沒有降低guard或重新使用失敗資料。

## HTTP與觀測限制

獨立還原流程218個已完成請求：203×200、12×302、2×303、1×403。Runtime.exceptionThrown、wrapper throw及abort signal均0。該403是編輯／修訂階段REST GET，工具未保存路由；畫布、最新修訂與新增文句正常顯示。不能直接當成以前已分類的global-styles權限回應，也不能說全部HTTP無錯。離線audit初次以HTTP全成功判斷失敗，後續明列唯一403與限制，沒有重跑原生副本或抹掉事件。

## 把通過的候選納入重建流程

中央`playtt-prepare-small-heap-loader.mjs`現在從固定@php-wasm/web-8-3 3.1.64產生原本1MiB heap growth，再做已驗證的normalized-component append。產生前核對整份baseline SHA9eee1c4…、唯一替換點，完成後要求整份候選SHA38231012…；與前輪1,876個PHP語義案例、配對原生讀取、正文保存／重啟及本次獨立還原使用的loader逐位元相同。沒有新的PHP或WASM二進位、節點快取或權限改動。

若現有產物不是固定baseline或candidate即拒絕覆寫。`--check`只讀。以實際固定package.json與PHP loader建立小型產生器測試目錄：新產物精確、check不改檔、未知手動檔案拒絕且原樣保留；歷史generator仍能產生精確9eee1c4…baseline。這不是完整依賴重裝。82個TypeScript來源未改，固定candidate及fallback共12個模組SHA保持原樣。

交付6個本機工具與獨立generator套用步驟：先在既有path-save組裝上執行`install-local-tools.py --runtime <runtime> --apply`，再`apply-research-loader.py --runtime <runtime> --apply`，最後在runtime目錄執行`node scripts/playtt-prepare-small-heap-loader.mjs`。套用工具要求原generator完整SHA，只變明確檔案，已套用會拒絕。新的generator可重複產生同一份已識別產物；兩者語義不同。

歷史回復使用`memory-investigation/playtt-prepare-small-heap-loader.mjs`及固定fallback artifact，不能把新generator覆寫到歷史回復套件。中央research loader已採用；雲端仍是aa595610／相容97a92c8，並未部署此候選。

## 下一步與完整目標

這輪Cloudflare請求／部署0、沒有新增付費。最後雲端讀值仍2026-11-21T16:52:39.597Z的181／pin16／剩62,344，closed／sealed／pending0、publisher paused，未刷新計費。正式Pages與原品牌視覺維持現況。

接續應使用已採用的研究generator評估原生工作負載的記憶體峰值與繁中初始化限制，必要時補上具路由與錯誤code的REST403觀測；不要為缺歷史route反覆重跑已完成副本。實際provider記憶體／CPU、長期免費、實體裝置／IME、整體A01–A20仍開放。沒有開新雲端寫窗、加額度／退款／清unknown／刪pin歷史／換雲端資源繞過。目標active、PR4 draft。

證據：[原生還原及取消稽核](../../../docs/verification/cloudflare-materialized-native-audit.json)、[控制取消](../../../docs/verification/cloudflare-materialized-static-disconnect.json)、[研究版採用](../../../docs/verification/cloudflare-materialized-loader-adoption.json)、[交付組裝](../../../docs/verification/cloudflare-materialized-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-materialized-review.json)。
