# 新版視覺編輯雲端實測準備

2026-11-25：固定最新2e9819b0候選已完成本機Chrome原生畫布修改、一次保存、完整workerd停止重啟、新分頁讀回及登出。新的私人雲端試驗已準備，**尚未取得這一次授權，也尚未部署或開啟寫入窗口**。

## 已取得的證據

- [本機結果](../../../docs/verification/cloudflare-visual-next-rehearsal.json)：LOCAL201→216，600秒／1,050,000bytes／96puts上限內實際747,221bytes／45puts；新增revision210。完整重啟保持資料、帳本及同一窗口精確，沒有重新匯入或開窗。
- 原修訂、其他文章、媒體、主題及使用者精確；原生登出移除本輪session。304物件／298檔獨立備份與完整快照精確，closed／sealed／pending0，程序exit0，9580／9581關閉。
- [瀏覽器紀錄](../../../docs/verification/cloudflare-visual-next-browser.json)：原生視覺段落與重啟後內容可見。本輪沒有另讀console，不能聲稱瀏覽器零錯誤。329個server觀測樣本例外0；不是provider整體尖峰記憶體或CPU。
- [雲端唯讀核對](../../../docs/verification/cloudflare-visual-next-preflight.json)：canonical201、17pins、原9377b040 reader、152,000,000bytes上限、餘1,067,374bytes；六模組與bindings、兩個pointer及receipt精確。closed／sealed／pending0、fence inactive、publisher paused。初次401及OAuth正常更新紀錄保留；更新後8個GET皆200。
- [方案可見用量](../../../docs/verification/cloudflare-visual-next-free-before.json)：Workers Free、R2本期$0.00／2.34GB。帳務可能延遲，這是整個帳號的當下顯示，不是長期免費保證。
- [候選與回退檢查](../../../docs/verification/cloudflare-visual-next-check.json)：Wrangler4.127.1兩次dry-run，兩組各六模組SHA精確，controller check無遠端操作。
- [後續備份與資料核對準備](../../../docs/verification/cloudflare-visual-next-recovery-check.json)：真實canonical201與LOCAL216備份的14項離線測試全通過，含內容、修訂、session、使用者權限、媒體、設定與序列的拒絕案例。Node24.18.0，約2.23秒，測試程序最高RSS171,696KiB；這不是Cloudflare記憶體量測。三次先前配置失敗及一次測試路徑錯誤皆保留雜湊，沒有覆蓋原始紀錄。

本機帳本從備份匯入後起算，沒有模擬全部雲端歷史帳本；雲端計畫保留既有完整帳本。品牌網站的靜態預覽另見[0.3.3發布](../../../docs/verification/theme-0.3.3/README.md)。

## 待授權的固定範圍

[公開計畫摘要](../../../docs/verification/cloudflare-visual-next-plan.json)：只操作既有 `playtt-wp-free-session-audit`，固定候選JS `2e9819b0c9602eb937b2819196242a047877923b2d79a27ebdcd821d294074c1`。應用程式累計上限維持152,000,000bytes，不增加；單次窗口600秒、最多1,050,000bytes、96次put，試驗將永久消耗帳本額度。

在Chrome原生編輯器修改既有私人草稿193末段，保存一次、重新部署相同候選、新分頁讀回、原生登出。保留所有舊備份與pins；結束後關閉窗口、等待pending0、封存，回復原相容reader的六模組／bindings，再獨立下載備份核對內容及session。必要的備份保留登記只能新增本輪anchor，不刪舊pin。沒有付費升級、新資源、正式站修改或後台切換。

失敗也要執行關窗、封存及回退；不清除未知pending，不重置帳本，不為失敗自動加額度或開第二個窗口。若未成功登出，記錄本輪session是否仍在私人封存備份，不宣稱驗收成功。

## 工具與操作界線

本層十二個工具和十個直接前置來源的hash在 [manifest.json](tools/manifest.json)。以既有 [bootstrap-locale](../bootstrap-locale/README.md) 組裝runtime及其私人canonical201備份為前提；逐一核對前置與新工具hash後，將本層工具複製到 `scripts/`，目標已存在時必須先確認同hash，不能覆寫未知來源。原有runtime來源、設定、owner與備份不覆寫。私人計畫含fixture帳密，只留本機，不提交Git。

前置來源的 `bytes`／`sha256` 統一指UTF-8正規化LF後的內容，`observedBytes`／`observedSha256` 則指本機原始bytes。本輪修正兩項舊長度誤填CRLF大小的標示；原始與正規化hash均未變，沒有更換前置程式。

準備命令已執行，不能重播已存在的plan或rehearsal owner。`playtt-visual-cloud-next-ui.mjs check`只核對固定模組與dry-run輸出；它不部署。

新的使用者明確授權到達後，才可建立本機 `artifacts/playtt-visual-cloud-next-authorization-private.json`，記錄 `authorized:true`、本次 `userReply`、固定 `planSha256`、`controllerSha256`，以及scope `one-private-visual-trial-600s-1050000bytes-96puts`。目前此檔不存在，run在任何遠端操作及owner建立前會拒絕。

執行前若唯讀核對或免費用量超過一小時，先用新attempt名稱保存新的GET-only紀錄，再用 `--preflight=artifacts/playtt-visual-cloud-next-<attempt>-preflight-state-private.json` 及 `--free=artifacts/playtt-visual-cloud-next-<attempt>-free.json` 指向新證據；不覆寫先前結果、不改固定計畫。任何資料／容量／部署漂移均先停下檢查。

獲准後的單次controller是 `node scripts/playtt-visual-cloud-next-ui.mjs run --remote`；Windows子程序固定現有專案Wrangler設定，隱藏視窗、不開遙測。原生操作透過Browser技能，控制器以 `guard`／`saved`／`restart`／`cold`／`finish` 命令收尾。guard至少留650,000bytes，restart至少留350,000bytes及180秒；不得為通過而刪除護欄。控制逾時只查同一命令，不重送。

控制器完成只表示封存與回退。後續使用下列新工具；[native-approved](../native-approved/README.md) 的舊工具有固定owner／版本／pin數，不得直接重播。實測未完成前，不能把此準備結果標為免費雲端完整後台通過。

## 單次雲端試驗之後的備份與核對

以下命令在既有runtime目錄執行，`node`使用已驗證的24.18.0。新雲端試驗尚未獲准，所以三個命令尚未執行；目前只完成語法檢查，不能據此聲稱遠端備份／pin通過。原來六個工具、固定plan與controller皆未改動。

1. controller已關窗、pending0、封存並回復原reader後，執行 `node --import tsx scripts/playtt-visual-cloud-next-backup.mjs --remote`。此工具只GET指定私人Worker與bucket，下載量最多10MiB／67次物件請求，建立新的export及independent副本。即使原生試驗失敗，只要已封存回退，也可保留其資料；備份成功本身不等於編輯驗收成功。
2. 從實際Chrome操作留下 `artifacts/playtt-visual-cloud-next-browser-notes-private.json`。不得預先建立通過紀錄，也不能以REST回應代替畫布。根欄位是 `origin`、`draftId:193`、`browser:"Chrome"`、`events`。三種事件各一筆：`native-visual-saved`、`native-visual-cold-readback`、`native-logout`，各附實際ISO時間 `at`。前兩筆須有 `iframe:"editor-canvas"`、固定editedText的 `expectedParagraphSha256`、`expectedParagraphVisible:true` 和 `saveIndicator:"已儲存"`；重啟讀回另須 `newTab:true`。登出須實際看到登入表單與 `logoutMessage:"你已完成登出。"`。若任一觀察不成立，照實保留失敗，不能填入通過值。
3. 執行 `node --import tsx scripts/playtt-visual-cloud-next-audit.mjs --offline`。核對完整備份、只修改草稿193及其修訂、原session與其他使用者不變、本次session移除、完整歷史帳本及上限；同時要求Chrome紀錄與指定初始／重新部署版本的保存、編輯頁讀回及完成的cold trace。只有完整通過才產生新的audit檔，仍固定標示 `fullBackendAccepted:false`。
4. 同一單次授權涵蓋的最後收尾，才執行 `node --import tsx scripts/playtt-visual-cloud-next-final.mjs --remote`。先驗證本次授權、固定plan／controller及備份anchor一致，再於短期fence內新增一個保留pin，保留所有舊pin並釋放fence；之後GET核對回退版本、六模組、bindings、兩個pointer、receipt、帳本、封存與publisher paused。這一步會寫入pin及fence狀態，不能當作唯讀指令。

每個步驟使用獨立的新owner／結果檔且拒絕重播。逾時或中斷時先查同一程序與owner、fence及pin狀態，不刪檔重試。未通過內容與原生UI核對時，不執行成功收尾pin工具。操作紀錄與備份可能包含私人資料，只提交去識別摘要。

離線資料核對測試：`node --import tsx --test --test-reporter=tap scripts/playtt-visual-cloud-next-integrity.test.mjs`。須具備canonical201與已完成本機rehearsal216的私人備份；repo不含這些資料。測試只讀備份，在記憶體建立異常副本，不啟動WordPress或呼叫Cloudflare。核對函式將檔案索引建一次並共用唯讀byte view，避免每次查檔重複複製整份markdown；測試異常副本也只替換被修改的檔案。先前配置失敗的唯一根因未作受控比較證明，不能把本次通過當成主機或雲端記憶體問題全面解決。
