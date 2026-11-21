# 較小的舊版相容回退：plain content-v1

最新[採用程序與故障模型](../legacy-adoption/README.md)完成17測試與4個實際備份模型；未知R2寫入會停止，遠端完成／ticket介面仍待，尚非雲端採用。以下保留前輪證據。

2026-11-21，本輪依使用者決策繼續免費後台研究，正式Pages與現有視覺不變。未向Cloudflare送出請求、未部署或切換後台。完整目標active，PR4仍draft。

## 已驗證結果

新增離線轉換器：以外部信任錨重新開啟壓縮備份，沿用其原本完整base，透過既有content-v1的64項／1MiB累積差異與8MiB完整內容限制，核對每一份原始替換物件，再產生新的plain manifest identity。原壓縮備份不變，不沿用原revision、不直接修改pointer，也不新增runtime格式或改讀取器。匯出／獨立匯入逐檔核對包含零位元檔、刪除／tombstone、修訂與session。5個測試全部通過，涵蓋錯誤信任錨、損壞獨立物件、禁止覆寫、無來源fallback及1MiB界線。

實際私人備份177轉出303物件／298檔，全部內容逐位元相等。以已存在完整base原始副本與壓縮依賴的集合模型推算，轉換需432,931bytes／7puts，對照前輪完整路線2,729,308bytes／8puts。這是**本機集合推算**，不是遠端inventory、實際上傳或Cloudflare計帳。

接著在新的本機副本執行實際舊67dd308 bundle（77來源已核對）。保持原生PHP／WordPress、SQLite DO、真正capacity／tracking／window與content-v1 writer，限制600秒／650,908bytes／96操作，即最後雲端餘1,083,839減去轉換推算432,931。Miniflare缺漏的storageClass空字串只補Standard；其餘guard源碼未改。初始化完整副本與轉換成本不在這個native window內，沒有假裝測過端到端雲端採用。

原生登入179、單次保存180、完全重啟精確讀回180、原生登出181全部通過。含封存18,715ms，實際窗口計帳588,515bytes／13puts、餘62,393，closed／sealed／pending0、fence已解除、publisher paused。原九段及新增第十段繁中精確，修訂208與原207及其他修訂精確；所有原有usermeta／5個session逐位元相同，本次session移除。其他頁面、媒體、主題不變，沒有前輪測試cookie造成的兩筆偏好。本輪cookie處理會移除到期／Max-Age清除項；這是固定原生HTTP工具，非完整RFC瀏覽器cookie jar。

最終正文、字數／SHA標記與其他metadata已離線再次核對，僅保留核心正常修改日期。序列wp_posts207→208、wp_options773→784，未倒退或重設。獨立備份再次開啟精確。另以原77來源中的7個實際舊pin reader模組重新bundle，接受轉換後及最終兩份備份，重建pin物件後重複註冊不新增；這是本機mock持久storage上的格式／冪等檢查，不是遠端pin註冊或實際DO重新部署。

## 可推論範圍與尚待

轉換集合推算432,931＋native窗口實測588,515＝1,021,446bytes／20puts，低於最後確認餘1,083,839約62,393bytes。兩部分測量方式不同，**不能稱為全流程雲端實測或保證**。未知遠端歷史物件、實際採用／額外請求、provider資源限制及操作時間均未在本輪驗證；餘量也很小。不要因算術通過就直接回退私人Worker或上線正式後台。

此結果解除「回退一定得重新上傳大ZIP」的假設，提供相容且可驗證的較小選項。下一步可先準備有固定物件、SHA、pointer、fence、pin與容量保護的實際採用程序，離線驗證中斷／失敗保持原pointer；原生後台延遲、繁中初始化／整體isolate記憶體／CPU、長期Free及實機／IME仍待。不要反覆執行本輪已完成owner或只為擴充紀錄重跑同一流程。

雲端仍是14:24:49.947Z的177／pin14／af985705／餘1,083,839，**本輪未刷新**。本機181與此不同，不能當遠端起點。相容新reader保留、可選writer旗標仍以最後讀值為關；無付款、加上限、退款、清歷史或刪pin。上一輪provider晚到AJAX400／取消事件仍是尚未完整定位的歷史。

## 工具、復現與交接

四個工具：playtt-legacy-content-bundle.mjs（可重用離線函式）、recorded --offline（固定177私人備份一次轉換）、native --local（新本機受限原生流程）、final --offline（完成資料與舊pin reader核對）。實際owner為artifacts/playtt-legacy-content-owned-private.json（converted）與playtt-legacy-content-native-owned-private.json（verified181、sealed、程序結束）；保留全部私人資料與短路徑狀態，不重跑或移除guard。轉換副本有legacy／independent；native副本有export／independent。原本兩份回退調查副本也保留。

接續old-source-rollback組裝，在新的runtime目錄套用install-local-tools.py --runtime <runtime> --apply，先核對84前置SHA再新增4工具＋1測試。安裝器不連網、不部署，重套在任何修改前拒絕。81來源／20設定不變；舊bundle直接沿用前輪已核對的實際產物，不冒稱全新依賴／核心重建。既有108＋TypeScript不重跑；本輪只有5項新增轉換測試、實際原生流程及離線備份／舊pin驗證。原先unused scheduled-helper差異繼續保留、未執行。

證據：[轉換](../../../docs/verification/cloudflare-legacy-content-conversion.json)、[native window](../../../docs/verification/cloudflare-legacy-content-native.json)、[最終核對](../../../docs/verification/cloudflare-legacy-content-final.json)、[5項測試](../../../docs/verification/cloudflare-legacy-content-tests.log)。
