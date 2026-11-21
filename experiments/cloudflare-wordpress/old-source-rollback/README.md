# 舊來源實際回退：本機原生 WordPress 驗證

2026-11-21，以已驗證的私人雲端177備份，實際執行舊來源67dd308的PHP／WordPress與SQLite DO。正式Pages／現有視覺維持現況，本輪沒有Cloudflare請求或部署。完整目標active，PR4維持draft。

## 結果與回退順序

直接把新壓縮清單交給舊程式，原生登入與operator-fence-status皆500。換回相容新程式後，177資料與pointer不變。必須由相容程式先處理資料格式，核對並採用舊程式可讀的快照，再換舊程式。這次實測的是完整快照路線；不能把它說成唯一可能的回退格式。

在本機持有fence，以真實operator路由採用完整快照：新identity沿用177被409拒絕且原狀不變；前進到178才通過。採用前後298檔精確。舊來源隨後啟動，圖片與themes/lets-play/style.css均200且SHA正確。

第一份副本登入179、單次保存180、完全重啟後內容精確；工具只認雙引號，漏認WordPress單引號／數字實體的登出連結，因而未送出登出。停止的180副本、尚在的本次session與獨立備份全部保留，沒有重送保存。

新獨立副本自完整178起，用既有nativeLogoutPath完成登入179、單次保存180、完全重啟讀回、登出181。原九段內容與新增第十段精確，新增修訂208、原207與其他修訂／頁面／媒體／主題精確。原有所有usermeta列與5個session精確，本次session已移除；但HTTP工具忽略cookie到期，送回wp-settings-2=deleted，核心新增了兩筆偏好設定39、40。因此**不宣稱全部usermeta逐位元相等**，也不把工具造成的偏好誤稱資料格式損壞。已保存cookie與固定核心wp_user_settings函式支持這個原因；原始資料只在私人workspace。

接續同一181，沒有重做保存。舊來源拒絕匿名edit REST（401），資產SHA仍正確。改用到期／Max-Age刪除的cookie處理，升回新來源b5eec65後原生登入182、全文精確讀回、登出183。只有wp_options序列789→797，其餘181的所有檔案完全相同；未重設序列。先前「所有檔案都不變」斷言的失敗亦保留。181與183獨立匯入／重開核對通過，最終299物件／298檔。所有程序已結束，runtime外連0。這不是Chrome／實機／IME或provider CPU／記憶體驗收。

## 容量限制

完整ZIP本身2,296,404bytes；以只先有完整base原始副本及壓縮依賴的本機桶推算，另需7物件＋pointer，合計2,729,308bytes／8puts。這是物件集合推算，**不是遠端歷史inventory或實際計帳**，也不包含隨後原生登入／保存的寫入。

最後雲端14:24:49.947Z剩1,083,839bytes，完整ZIP本身就超過它。本輪未刷新此數字；沒有上傳回退包、採用雲端pointer、部署舊程式、增加上限、退款、刪歷史或刪pin。雲端仍應以相容reader服務，不能因本機回退可行就直接部署舊來源。下一步可離線研究舊來源本來支援的plain content-v1重編碼是否更省空間；目前尚未實作／驗證。

## 來源、工具與限制

舊77來源逐檔核對25個已固定patch加12個選用階段，並與第二份舊組裝一致。esbuild舊bundle覆寫64個實際載入來源，不含新壓縮／封套／心跳模組。109個vendor檔與package-lock、已生成PHP loader核對。使用既有固定依賴與核心，並非重新npm安裝／全新上游組裝。WordPress runtime manifest是先前部署時重建的版本，與最初上游組裝不同；其archive以既有clean-install證據SHA核對，其餘8資產與舊組裝相同。

最初工具預檢曾把health-envelope誤算成新模組、沙箱loopback EACCES、過長Windows SQLite路徑導致空DB啟動失敗；皆未進行WordPress寫入。改用短路徑，保留空狀態。後續錯選PHP語系檔作靜態資產、登出link解析、cookie到期及序列斷言等失敗均保留，沒有覆寫成乾淨全過。首次recovery呼叫缺--local也在任何讀寫前拒絕。

本目錄5個script是此次**調查歷史與受guard限制的接續工具**，不是可直接用於正式環境的回退產品。早期script刻意保留當時錯誤假設；不要重跑已完成owner，也不要刪guard。最後native-report只讀已完成183並產生報告。需先有對應私人備份、owner、舊組裝與固定資產；repo不包含密碼、cookie、私人HTML、原始備份或生成bundle。

接續envelope-provider，以install-local-tools.py --runtime <新的runtime目錄> --apply核對85前置SHA並新增5個工具＋來源計畫。安裝器不連網或部署，重套在修改前拒絕。81 runtime來源／20設定不變；既有nativeLogoutPath的2個測試本輪通過，前輪108＋tsc沒有重跑。cookie修正已實際用於新版登入／讀回／登出，但不是完整RFC cookie jar或已新增單元測試的通用client。

完成owner：artifacts/playtt-old-source-native-recovery-owned-private.json（finished-with-retained-client-artifacts，183），保留first owner的180與本輪after-logout181／final183獨立備份。雲端owner仍是envelope-provider的177；**本機183不得當成雲端起點**。後續以完整目標及現有證據繼續研究，不做正式切換。

證據：[摘要與各次HTTP紀錄](../../../docs/verification/cloudflare-old-source-rollback-summary.json)、[來源計畫](playtt-old-source-rollback-plan.json)、[測試](../../../docs/verification/cloudflare-old-source-rollback-tests.json)。
