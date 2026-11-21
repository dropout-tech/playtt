# 舊版回退採用程序與故障模型

2026-11-21，繼續全Cloudflare免費後台研究；正式Pages與原視覺不變。新增的是採用程序與本機記憶體模型，**未提供可用的遠端採用／上傳介面**，未部署、未操作Cloudflare。完整目標active、PR4 draft。

## 問題與程序

既有operator-adopt只更新資料協調器與提交紀錄，不寫R2的sites/default/markdown/current.json。既有operator-fence-status的coherent核對協調器／receipt／manifest／內容，沒有讀取並比對這份R2 pointer。因此不能用一次成功回應或coherent=true宣稱兩邊切換完成。

prepareLegacyAdoption先用外部信任錨讀取原壓縮備份及已轉換plain content-v1備份，逐檔比較完全相同，要求沿用相同完整base、新identity及版本177→178，建立固定物件／SHA／大小／pointer與plan digest。Digest用來偵測既定計畫變動，不是授權簽章。程式沒有網路client，不會自行部署或清除資料。

executeLegacyAdoption要求transport實際執行持有fence、寫入計帳、條件式物件與pointer操作。它獨立核對協調器state、精確提交receipt及R2 pointer；未知第三種狀態拒絕變更。原備份pin必須已存在，既有pin不能消失或改寫。先以不覆寫條件上傳缺少的原始替換物件，最後上傳目標manifest，逐項讀回hash。既有物件hash不同就停止，沒有用本機資料覆蓋。

上傳後登記目標pin，並另行驗證當前完整base與替換物件，不能用既有pin登記代替現在的資料核對。journal成功寫入操作意圖後才採用新版本；採用回應不明時讀回state與receipt，不盲目重送。協調器已178、R2仍177是明確可辨識的中間狀態；接續時只做對原pointer的條件式更新，不倒退版本。pointer回應遺失也先讀回。兩邊精確相同後回傳，呼叫者再關窗／封存並解除自己的fence。錯誤路徑不在finally擅自解除fence。

每次操作檢查fence、剩餘位元／操作數及window admission；關閉或到期視窗不能開始寫入或採用。這不能讓跨系統步驟變成原子交易，操作中仍可能中斷，所以必須保留中間狀態與接續方式。

## 驗證與未決限制

17個測試通過：正常／重複驗證、不明R2寫入、已settled後client回應遺失、pin失敗、採用前失敗、採用成功後回應遺失、採用後pointer尚未更新、pointer成功後回應遺失、pointer條件競爭、計畫／預算／原pin錯誤、fence到期、journal失敗、既有不可變物件損壞、外來receipt、既有pin但base已損壞，以及視窗關閉。使用實際WordPressStateCoordinator、PlayttBackupPins、PlayttStorageBudget與withPlayttStorageCapacity類別；底層R2與Durable Storage是記憶體模型，**不是workerd或provider故障演練**。

同一程序另套實際已驗證的177→plain content-v1備份跑四個獨立模型。正常、已settled後client回應遺失、協調器採用後pointer失敗再接續，三者皆精確完成178；每個432,931bytes／7puts，pending0／closed／sealed，重建actor及再次核對不重複採用或上傳。各模型起始只有原snapshot＋base共2個fixture pins，結束3個；不能冒充遠端14個pin已實測。

第四個模型在R2已寫入196bytes後丟出不明結果，實際容量實作保留charged196／pending1。原版本及R2 pointer均177，未採用。重新建立actor、甚至已能讀到物件都不會清掉pending；視窗能關閉，但drain不能封存。**這是正確停止的證據，不是已完成錯誤復原。** 現有遠端control沒有針對這次操作提供可安全確認完成／結清ticket的介面。不得自動退款、移除pending、重開視窗或以物件存在當作完成證明。

下一步必須建立限本專案／持有fence／有界計帳的上傳與操作receipt入口，讓「storage已確認、client未收到」和「storage本身未知」可被權威紀錄區分；只有具備完成證據的自有ticket才能結清。先在本機測試真正的端點與中斷，再考慮私人部署。本輪程序尚不能直接用於雲端採用，沒有為了通過測試降低既有保護。

## 交接與保留紀錄

首輪模型缺少R2 head介面而在寫入前失敗；補齊介面後12/14通過，兩項測試原先錯以為不明R2結果可直接續跑。實際guard保留pending，故修正為必須停止，並另外測試確實已settled的client回應遺失。最終17項通過；早期log留在私人workspace。最後新增window admission檢查後，以全新window-check模型重做四情境，工具SHA在執行前後一致；原模型owner、plan及結果保留。

三個script：playtt-legacy-adoption.mjs（準備與執行程序）、playtt-adoption-model.mjs（記憶體故障transport）、playtt-legacy-adoption-recorded.mjs --offline（固定私人備份模型）；--offline --window-check只允許在原模型完成後建立另一個固定guard的新模型。兩個test/helper檔提供合成fixture，無需私人備份即可重現17測試。已完成owner不要重跑或刪guard；未決模型只是已結束Node程序中的模擬狀態，並非雲端有pending1。

接續legacy-content組裝，install-local-tools.py --runtime <新runtime目錄> --apply先核對84前置SHA再新增3script＋2test/helper；原81來源與20設定不變，重套在改檔前拒絕。前輪108＋tsc未重跑，沒有重做原生WordPress／Chrome流程。未使用的scheduled-helper差異繼續保留。

最新owner為artifacts/playtt-legacy-adoption-window-owned-private.json，phase verified-models-with-unknown-write-stop；其目錄保留4份私人coordinator／budget／journal紀錄，沒有保存R2私人物件內容到公開repo。模型程序已結束，0Cloudflare請求。雲端仍是14:24:49.947Z舊讀值177／pin14／af985705／餘1,083,839，本輪未刷新。前輪native181與本輪模型178皆不是遠端起點。無付款、加額度、退款、歷史或pin刪除。

證據：[計畫](../../../docs/verification/cloudflare-legacy-adoption-plan.json)、[四模型與journal](../../../docs/verification/cloudflare-legacy-adoption-summary.json)、[17測試](../../../docs/verification/cloudflare-legacy-adoption-tests.log)。
