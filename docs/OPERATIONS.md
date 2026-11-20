# WordPress 與 Cloudflare 操作手冊

## 私有測試寫入期限與額度，本機驗證通過（2026-11-21）

新增第三個選用候選 `write-window`，處理瀏覽器中斷後背景請求仍持續寫入的問題。期限、每輪嘗試寫入量與操作次數存於 Durable Object；排隊請求開始、發布重試／alarm，以及每次 R2 mutation 前均檢查。到期拒絕新操作，已送出的 R2 呼叫仍依實際結果結清；不明寫入不會自動過期。到期不等於已取得維護封存，也不代表全部在途請求已完成。

啟動須具備 operator 身分、canonical fence、本人持有的寫入封存及 pending0。相同 token 重試不延長期限、不歸零額度、不重新開啟；換一輪需前任 token 且仍受原總額度限制。狀態升為 tracking v2，移除設定旗標或舊版呼叫仍無法繞過寫入檢查；前版 validator 明確拒絕 v2，因此正式回滾還須保留相容讀取器，不能只退程式或重設 ledger。

128 項相關測試通過，其中 22 項期限／額度與 4 項實際 execution queue／publisher 驗證；後者替換 PHP 呼叫，非完整 WordPress HTTP。另以真實本機 workerd＋SQLite DO＋本機 R2，完成寫入、結束執行器、重啟、到期拒絕讀取准入／寫入／刪除、原物件不變、明確換輪及封存，零外連，所有執行器已結束。TypeScript 與完整 Worker dry-run 通過（gzip 7,603.39 KiB，仍有既有 loader direct-eval／重複常數警告）。這些不是 Cloudflare 正式部署或免費方案驗收。

25 段已採用 patch 加 3 段選用 patch 可乾淨重組，70 個非產生來源檔與 20 個候選輔助／fixture 檔一致，18 份 Wrangler 設定均未開啟候選旗標。預設組裝不含選用候選。本輪沒有 Cloudflare 讀寫、部署、擴容、刪除、ledger 重設／退額；正式 Pages 與原站品牌視覺維持現況。

私人站僅沿用上次核對結果：dc9704f3／canonical62、25 pins、pending0、寫入封存、publisher paused，草稿192保留，餘額 2,141,868 bytes；本輪未重新查雲端。下一步先查目前帳號／免費額度與獨立測試空間，再安排有期限和額度的私有遠端驗證。原生編輯器、競爭 heartbeat、遠端還原／pin／coordinator、記憶體／延遲、實機／輸入法、版本切換和長期免費運作仍待。目標 active、PR #4 draft，暫不切換正式後台。

詳見 `experiments/cloudflare-wordpress/write-window/README.md` 與 `docs/verification/cloudflare-write-window-*`。以下保留前階段紀錄。

## 小型快照的備份／還原與保留工具，本機通過（2026-11-21）

新增選用工具支援完整快照及 metadata overlay：以獨立提供的 pin 身分校驗精確 manifest／基底／ZIP，匯出目前與基底的全部內容物件，複製到全新本機目錄後重新驗證；來源停止供應時仍可還原。轉回完整快照會建立新版本身分並保留原始 overlay，不改寫舊 manifest，也不自動登錄遠端 pin。準備好的 Cloudflare 下載器僅 GET、限兩個私人 playtt 桶、最多 5 次請求；本輪僅以本機回應驗證，沒有雲端讀寫。

真實 canonical62 備份及上一輪本機模擬 overlay 各重建 296 個檔案。完整／overlay 相依圖分別為 295／298 個唯一物件（內容定址去重），複製後所有雜湊一致。轉回完整格式的 296 檔及 tombstones 一致。兩個全新 PHP-WASM 實例使用實際 MDI／SQLite，49 筆 metadata 與 ID、8 張表的高水位、15 組附件關聯均保留；仍為窄版 driver 測試，非完整 HTTP 或雙瀏覽器驗收。

盤點新增精確 raw manifest 證據。引用與離線保留規則會保護 overlay 的完整基底，即使基底很舊且未單獨 pin；提交紀錄及過期 lease 的 base 也保留。缺漏、hash／pin 不符、增量鏈與尚未支援的 publication／import 參照會拒絕。提案仍 safeToApply=false，沒有刪除功能；本機還原圖的模擬 coordinator／registry 整合保留兩個版本，沒有提出可刪項，不能當遠端桶清理結果。

97 項相關 JavaScript／TypeScript、4 項 Python 盤點及 17 項保留規則測試通過，TypeScript 通過。25 段既有 patch 加 2 段選用 patch 乾淨重組，68 來源檔與 16 輔助檔一致。新工具與 writer 皆未採用／啟用／部署；本輪只改離線工具，未重複宣稱新的 Wrangler dry-run。

最後核對的私人站仍 dc9704f3／canonical62、25 pins、pending0、寫入封存、publisher paused，草稿192保留；剩餘 2,141,868 bytes 少於完整 pack。本輪未重新查詢雲端狀態，正式 Pages 與原視覺維持現況。下一步準備獨立強制的寫入期限及足夠測試空間，再實測遠端還原／pin／coordinator、原生 heartbeat 與錯誤恢復。版本切換、記憶體／延遲、實機／輸入法及長期免費運作仍待，PR #4 draft、目標 active。

詳見 `experiments/cloudflare-wordpress/snapshot-bundle/README.md` 與 `docs/verification/cloudflare-snapshot-bundle-*`、`cloudflare-snapshot-retention-*`。以下為先前階段紀錄。

## 小型鎖定快照候選，本機通過、尚未啟用（2026-11-21）

新增 opt-in metadata overlay：只有原生 `_edit_lock` 與單調遞增計數可走新格式，完整內容清單仍保存，透過原 coordinator 提交；每版指向同一份精確雜湊的完整基底，不形成增量鏈。內容、附件或其他欄位變更仍產生完整快照。保留原 meta ID、鎖擁有者及刪除後的 ID 高水位，新增 ID 不可重用舊號。

80 項相關檢查通過，含 13 項新案例、提交回應遺失後重啟與本機備份重建。真實 canonical62 備份模擬一次鎖／計數更新，296 檔完整重建，294 檔位元組不變；估計寫入量 2,379,610 → 85,821 bytes（減少 96.39%），僅此本機案例，尚非遠端效能或長期免費證明。固定版本 PHP-WASM 執行原生鎖函式，透過實際 MDI／SQLite 在第二個 PHP 實例保留 49 筆 metadata、8 張表高水位及鎖擁有者；使用窄版 SQL／使用者介接，非完整 heartbeat HTTP 或雙瀏覽器驗收。

TypeScript、Wrangler dry-run 通過；25 段既有 patch 加 1 段選用候選可乾淨重組，68 來源檔及 4 輔助檔一致。打包仍有上游 loader 警告，dry-run 不代表 Cloudflare 免費方案接受。功能旗標未設定，預設重組流程未納入，沒有部署或本輪遠端讀寫。

一般備份下載與保留／引用工具尚未支援新格式，舊 reader 會拒絕；需先補齊相依檔保護、獨立還原與版本切換，才能採用。最後核對的私人站仍 dc9704f3／canonical62、25 pins、pending0、寫入封存、發布暫停，草稿192保留；剩餘 2,141,868 bytes 少於完整 pack，不能直接解除封存。正式 Pages、原視覺及暫不切換後台的決策維持現況。下一步補齊工具與有限期限的驗證流程；原生 UI、實機／輸入法、記憶體及長期免費運作仍未驗收，PR #4 維持 draft、目標 active。

候選與限制見 `experiments/cloudflare-wordpress/metadata-overlay/README.md`，證據見 `docs/verification/cloudflare-metadata-overlay-*`。以下保留先前階段紀錄。

## 編輯器背景快照增長，恢復驗收未完成（2026-11-20）

私人草稿192載入原生編輯器後，瀏覽器連線中斷；尚未輸入新文字或測試儲存重試。背景文章鎖更新仍產生完整快照：版本61／62只變更一筆 `_edit_lock` 時間及 `wp_options` 編號高水位581→583，卻各寫入約2.3MB ZIP。完整比對準備版24與目前62，文章、圖片、主題一致；另有登入session與計數變更。

容量保守上界297,858,132／300,000,000bytes，只剩2,141,868bytes，少於一次完整pack。維持寫入封存、pending0、publisher paused；沒有提高上限、退款或刪除歷史快照。草稿192仍保留，瀏覽器分頁關閉未獲確認，不能直接解除封存重跑。完整檢查備份已校驗296內容檔、4,430,300 decoded bytes並登錄第25個pin，前24個身分均保留；canonical fence已解除。

798個平台事件雖均outcome ok，仍有9個應用失敗／未完成trace，不能當全通過。觀察已停止、0殘留程序。正式Pages與來源309不變，本輪沒有部署。下一步處理小型鎖定／計數資料的持久化，保留原生鎖與編號語意，並在再次瀏覽器驗證前加入獨立期限封存保護。UI錯誤恢復、實機與長期免費運作仍未驗收，PR #4維持draft、目標active。

## 已確認寫入的帳本重試（2026-11-20）

私人還原Worker更新為dc9704f3，R2已回覆成功後的帳本確認最多三次，失敗間隔100／200ms；只重送同一ticket，不重送R2、不重複計費預留，正常路徑仍一次。耗盡重試仍保留已確認成功，未結清ticket繼續阻擋清理；未知R2結果、遺失的reservation不會被自動結清。這是次數上限，沒有新增單次fetch的獨立期限。

新故障檢查原版2/10、候選10/10，連同既有排空／容量／coordinator共42項通過，TypeScript、dry-run與兩次私人部署通過。自有草稿189繁中與尾空白保存、重新部署後全新登入精確讀回、再次保存及清除成功，原首頁不變。兩次保存6435／6628ms，樣本不足以判定穩定加速；遠端未注入故障，原生瀏覽器UI仍待驗收。

新備份b2a27e47完整校驗297物件索引（295內容檔＋manifest／ZIP）、4,428,758decoded bytes，登錄第24個pin並保留前23個身分。166個原檔、27內容、61歷史修訂、48postmeta、15媒體及主題一致，只有session metadata與自增計數改變。目標version22、pending0、無seal／fence、publisher paused；payload保守上界202,464,917／300,000,000bytes。本輪增加15,164,196預留bytes／31puts，沒有退款或歷史R2清除。

184個平台觀察事件全outcome ok，0例外／request failure／未完成trace／確認失敗或恢復事件；無實際故障時0恢復屬正常，不能當遠端故障注入證據。最高sampled WASM heap71,827,456bytes非whole-isolate。觀察已停止、0殘留tail。25段patch／67來源檔與4附加檔重組一致。正式Pages、原視覺、來源8536d0cf／version309及暫不切換後台的決策維持現況。

接續原生編輯器未保存／錯誤提示與恢復，並收斂歷史保留、未知操作恢復、延遲／記憶體、取消原因、實機與交接。來源300物件候選仍safeToApply=false，PR #4維持draft，目標active。證據見[驗證報告](verification/cloudflare-write-ack-summary.json)及[操作說明](../experiments/cloudflare-wordpress/write-ack-retry/README.md)。以下保留先前階段當時紀錄。

## 私人提交引用盤點（2026-11-20 13:28 UTC+8）

私人還原Worker更新為1b8f1869，新增受保護的唯讀引用清單，讀取目前pointer、包含過期lease的base及全部歷史提交紀錄。查詢走coordinator原序列佇列，不清除lease、不初始化或改寫資料；128筆分頁、最多2048筆／512KiB，缺漏或錯誤拒絕。正式Pages、原視覺與暫不切換後台的決策維持現況；來源rebuild仍8536d0cf／version309。

遠端在canonical fence與R2 seal內核對16筆提交、23個pin，共36個引用版本，其中13個提交版本未有pin。462物件／186,685,844bytes前後清單一致，451個manifest／pack／內容依賴的存在與大小通過；另保留3個核心資產、current pointer與7個快取頁。這是metadata核對，沒有重新逐包解碼或PHP還原。實際部署綁定與版本已核對，該目標沒有publication／import物件或D1／Queue／service／workflow綁定。

32項相關測試、TypeScript、dry-run與部署通過，24段patch／67來源檔及5附加檔重組一致。查詢未登入404、缺operator401、錯方法405。封存與fence均已解除，目標仍version16、23pins、pending0、publisher paused，容量帳本上界187,300,721／300,000,000bytes未增加。沒有內容編輯、R2刪除、退款、新備份或UI驗收。

這次採全部commit receipts保守保護，尚非可持續的清理規則；來源300物件候選仍safeToApply=false。未知寫入不能以HEAD／404／時間到結清；v1 ticket資訊不足以獨立證明終止，本輪未新增force-clear。接續處理提交紀錄退役與可驗證的故障恢復，並完成原生UI、延遲／記憶體、取消原因、實機與交接。PR #4維持draft，目標active。證據見[報告](verification/cloudflare-reference-roots-summary.json)與[操作說明](../experiments/cloudflare-wordpress/reference-roots/README.md)。以下為先前階段當時紀錄。

## 保留快照完整驗證（2026-11-20 13:10 UTC+8）

私人來源桶保留的72份快照已全數從Cloudflare讀回，完整ZIP與21,293個內容檔索引校驗通過，涵蓋21個pin及先前未逐份解碼的51個保留版本。共144次GET／170,385,283bytes；壓縮包165,118,461bytes，跨版本解碼318,766,645bytes。前後1,110物件／640,239,740bytes及來源pointer、保護清單、容量帳本一致；來源version309、21pins、無fence、publisher paused。列舉曾回500，單獨重試一次成功。

檔案完整不等於可直接回復完整WordPress。5份早期版本（其中4份有pin）各缺15筆附件檔案關聯，屬既有media修復前資料，保留原檔及保護。其餘67份通過此項關聯檢查；目前c0ba467c有full-table-v1、48postmeta與15/15附件連結。沒有逐版PHP啟動或本輪獨立還原，不能把所有舊版寫成已全面驗收。

8項完整性／關聯測試及10項保留規則測試通過；乾淨重組23段patch／66來源檔與3個新增工具／測試檔一致。本輪僅唯讀盤點、下載與本機解碼，沒有雲端修改或新部署。正式Pages、原站視覺及暫不切換後台的決策維持現況；獨立追蹤寫入目標未操作。私密備份、完整清單與registry不進Git。

300物件／355,062,939bytes仍只是候選，safeToApply=false，沒有刪除、回補或節省容量。兩次一致的非原子清單不能證明完整roots或寫入排空；接續完整引用與不明寫入對帳，並保留原生UI、取消歸因、記憶體／延遲、實機與交接缺口。PR #4維持draft，目標active。詳見 [驗證報告](verification/cloudflare-retained-packs-summary.json)及[操作說明](../experiments/cloudflare-wordpress/retained-packs/README.md)。以下保留先前階段當時紀錄。

## 私人R2寫入排空保護（2026-11-20 12:45 UTC+8）

私人還原目標已部署ec71d3b3，現有容量DO在每次put／delete前持久登記ticket，R2確認後才結清。pending不為0就拒絕封存；封存不靠TTL自動解除，重新部署後仍阻擋寫入。回應不明保留ticket；已確認的R2成功不因結清回應遺失而被人為改成失敗。最多128個pending，無force-clear／自動到期／退款。來源rebuild仍為8536d0cf／version309，正式Pages與原視覺維持現況。

已先核對此owner-only目標的已知舊操作全數完成，才在fence內啟用追蹤；不能把這個前提套用到任意舊桶。遠端自有草稿186在一般fence解除、R2seal仍生效時更新回503，完整pointer/version13與ledger不變。跨部署後seal保留、錯誤持有人解除409；正確解除後繁中與尾空白讀回、保存及清理成功。目標最後version16、pending0、無seal／fence、paused。

完整備份8a06b16e-fe6c-428f-9785-3caf79d056a6校驗297索引，登錄第23個pin，原22筆保護身分仍保留。除session與自增計數，166個原索引檔、27筆內容、61筆歷史、48postmeta、15媒體與主題皆一致。payload保守上界187,300,721／300,000,000bytes，不是帳號費用上限。

42項相關測試、TypeScript／dry-run、23段patch／66來源檔與6附加檔重組通過。226個平台事件全outcome ok、0exception／結清失敗；其中1次預期503對應request failure／未完成trace，並非零錯誤。兩次保存7390／6968ms，樣本不足以判定效能。觀測已停、無殘留tail。本輪不是瀏覽器UI、遠端延遲故障注入或長期免費驗收。

詳見 `experiments/cloudflare-wordpress/write-drain/README.md` 與 `docs/verification/cloudflare-write-drain-summary.json`。仍無R2快照清理；下一步驗證保留pack／完整roots及未結清操作對帳，不能force-clear或直接降版。UI／取消歸因、記憶體／延遲、實機與交接仍待。目標active、PR #4 draft。以下為先前階段當時紀錄。

## 獨立還原內容與保護版本（2026-11-20 12:23 UTC+8）

新增私人目標 `playtt-wp-free-pin-restore-audit`／`playtt-wordpress-pin-restore-audit`，確認全空後匯入23份已解碼備份的396個聯集物件（149,591,427bytes）及重新登錄21個保護版本。來源rebuild仍為8536d0cf／canonical309；本輪只有新目標部署擴充scope程式。正式Pages／原站視覺、daily來源、免費條件與暫不切換後台的決策維持現況。

27筆原內容、2組template parts、2組navigation、zh_TW／主題0.2.3、21筆原生API歷史、15個媒體SHA及六頁LINE入口比對通過。自有183草稿保存後，在4c78457f重新部署／全新登入仍精確讀回繁中與尾空白；刪除後新編號185遞增，舊ID寫入拒絕。兩筆及子修訂都已清除。

完整備份a5973edf-b478-4a18-b1a0-d26a91c27011驗證297索引、4,427,986decoded bytes、ZIP 2,292,819bytes，已登錄第22個pin。除了登入session與自增計數，166個原索引檔及媒體／主題清單不變，含61筆歷史、48postmeta與15uploads。目標version10、來源309，coherent／無fence／paused。新帳本payload保守上界172,138,043／300,000,000bytes；不是共享帳號費用上限。

26項相關測試、TypeScript／dry-run、22段patch／65來源檔及10附加檔重組通過；沒有重新安裝依賴。848個有限觀察事件全outcome ok，無記錄到exception／request failure／未完成trace；已停止且無殘留tail。原空樣式／LINE測試預期錯誤及備份命令列／guard失敗均保留並修正，未放寬最終內容bytes比對。

詳見 `experiments/cloudflare-wordpress/pin-restore/README.md`、`docs/verification/cloudflare-pin-restore-summary.json`。本輪是原生HTTP與獨立資料恢復，沒有新瀏覽器／實機或長期免費驗收。已完成腳本與guard不可盲目重播。下一步核對其他保留快照、過期lease延遲寫入與執行中工作排空；仍沒有快照刪除、退款或自動回收。原生UI／取消歸因、記憶體／延遲、實機與交接待驗收。目標active、PR #4 draft。下方為各先前階段當時紀錄。

## 備份版本保護登錄（2026-11-20 11:49 UTC+8）

私人 Worker `8536d0cf-cfbf-4133-9764-ae4bbfdd2c45` 已把備份保護紀錄寫入現有 coordinator DO。登錄核對遠端 manifest 與整份 ZIP 的 SHA，與 fence release 共用序列佇列；只允許新增，同一身分重送不重複計入，錯誤身分／鎖／hash 不覆蓋既有紀錄。新備份在校驗與遠端登錄成功後才標示 pass。正式 Pages、原站視覺、daily-source 程式與發布暫停狀態保持現況。

最初 22 份 archive 已全部重新解碼，21 個版本完成登錄；修改後流程再產生一份校驗成功的備份，現有 23 份完成報告都對應到這 21 筆保護紀錄。重新部署後完整讀回，錯誤 fence 被拒絕、重送冪等。最新備份的 manifest／ZIP 與前一份逐位元組相同，canonical 仍為 309、來源 175，容量帳本不變，無 fence。沒有 PHP／內容修改、快照刪除或新增獨立還原。

34 項 pin／容量／coordinator／retention 測試、TypeScript、dry-run 與實際部署通過；21 段 patch／65 份來源重組一致。新端點的未認證、錯誤方法與超大輸入分別拒絕；外層私人 gate 維持404/noindex。155 個有限觀察事件 outcome 全 ok、無已記錄 exception／request failure／未完成 trace；預期的 409／401／405／413 另有 HTTP 證據，不能當作成功請求。觀察已停止，無殘留 tail。

保留分析現在必須輸入遠端 registry，會保護沒有本機副本的已登錄版本。最新分析保留72版，300個物件／355,062,939bytes仍只是候選，`safeToApply=false`。登錄目前限8MiB ZIP、256KiB manifest、128 pins與64KiB registry；未提供自動解除保護、清理或額度回補。registry 在DO、未包含於WordPress restore pack；已保存本機匯出與每份receipt，還原流程仍須核對。

下一步核對保留快照、在獨立目標還原內容與保護紀錄，並處理過期lease延遲寫入等完整工作排空條件，再評估安全回收。原生UI、記憶體／延遲、取消歸因、實機與交接仍待驗收。目標active、PR #4 draft。詳見 `experiments/cloudflare-wordpress/backup-pins/README.md` 與 `docs/verification/cloudflare-backup-pins-summary.json`；下方段落為歷史紀錄。

## 私人容量保護與恢復驗證（2026-11-20 11:26 UTC+8）

私人 Worker `3bd8c3de-8206-4bf2-82c9-f3be936affaf` 已啟用持久化 R2 payload 預留，上限 1,000,000,000 bytes。每次 put 先計入帳本，失敗、覆寫、刪除均不退款；無法確認預留時拒寫。這不是共享帳號的費用上限，metadata、請求次數、其他桶及外部直接寫入不在保護內。正式 Pages、原站視覺與 daily-source 程式維持現況，publisher paused，沒有新增付費方案或清理歷史快照。

超限保存回傳 507，舊內容與完整 pointer/version 不變。恢復上限後首次狀態 assertion 失敗的報告已保留；平台紀錄顯示新舊 Worker／容量 DO 短暫並存，不能把部署完成視為所有元件已切換。已增加預留協定、雙方取較小上限及有效回應核對，最終部署在 fence 內確認協定與設定後才放行。交錯版本以本機測試覆蓋；遠端強制拒寫是加固前版本，最終版本另驗證 cold login、精確讀回與清除。

36 項本機檢查、TypeScript 與實際部署通過；20 段 patch／64 份來源重組無差異。事後 R2 列舉 1,110 物件／640,239,740 bytes，低於帳本保守上界 640,546,904 bytes。31 次預留累計 14,867,698 bytes，上限內剩餘 359,453,096 bytes。原生恢復保存單次 7,495 ms，不能推論穩定延遲。211 個平台事件全 outcome ok、0 exception，但含 1 次預期 507 failure／未完成 trace；觀察已停止、無殘留 tail。

自有草稿 181 與子修訂已移除，最終副本 309／來源 175 coherent、無 fence、paused。備份 `c0ba467c-c422-41e8-861c-64926c69e1fb` 驗證 297 索引與所有 decoded bytes；原有 37 canonical 檔、15 uploads、48 postmeta 與歷史保留。這輪沒有新增 UI 操作或獨立空環境還原。

下一步完成備份 pin 登錄、fence 下完整引用盤點、保留版本驗證與獨立還原，再評估安全回收；退款、帳本重整與自動刪除尚未實作。原生錯誤提示、取消事件、冷啟動／保存延遲、實機與交接仍待驗收。目標 active、PR #4 draft。最新實作與限制見 `experiments/cloudflare-wordpress/storage-capacity/README.md`，證據見 `docs/verification/cloudflare-storage-capacity-summary.json`。下方容量盤點與舊版本敘述保留為歷史紀錄。

## 免費配額與快照保留盤點（2026-11-20）

Cloudflare 控制台仍為 Workers Free／$0，R2 當期顯示 $0.00、5.21k Class A／51.1k Class B、帳號儲存1.61GB。這些是延遲的當期數字，不能保證未來零費用。實際唯讀列舉私人 rebuild 桶為1086物件／625,679,206bytes；216份完整快照占495,454,100bytes，約79.2%。GraphQL較早樣本仍只有936物件，不能把它當即時容量。

新增可重跑的唯讀用量／物件盤點及離線保留分析，沒有部署runtime或清理雲端物件。候選規則保護current、publication/job、cache與備份引用，加上最近24小時全部／最新20版／7個UTC日每日版本。本機21份備份ZIP（20個不同revision）的SHA與報告、遠端manifest一致；候選保留66版、將150版共300物件／355,062,939bytes列為待審查範圍。這不是已刪除或已節省的容量，`safeToApply`固定false。8項相關檢查通過；完整keys及私密備份不進Git。

副本303／來源175仍coherent、無fence、publisher paused。正式Pages、原視覺、Worker版本與19段patch／63來源重建內容未改。下一步先實作可驗證的寫入容量預留／超限拒寫，之後才處理執行中工作、完整備份pin、fence與實際還原條件下的清理；單靠TTL或Budget Alert不能當零費用硬上限。原生UI／取消歸因、冷啟動與保存延遲、實機和交接仍開放。目標active、PR #4 draft。詳見 `experiments/cloudflare-wordpress/capacity/README.md` 及 `docs/verification/cloudflare-capacity-*.json`。

## 重用同版資料清單，減少 R2 讀取（2026-11-20）

私人 Worker `ef56ff0b-92b8-4969-9463-80f7dfaee1c9` 採用目前runtime的一份已驗證清單快取；完整站點／revision／manifestKey／persistedAt相符才重用，序列化超過256KiB就回到R2，實際初始清單72,949bytes。metadata複製並凍結，新清單只在完整快照與manifest寫入R2後保留，提交前不符合舊pointer。runtime本身也以完整pointer決定是否重建。所有內容／媒體／主題核對、SHA、完整快照與lease仍保留；operator／備份／冷啟動照常讀R2。正式Pages、原視覺、daily來源程式、後台選擇與付費方案未改。

22項快取／快照檢查、TypeScript、dry-run與19段patch／63來源重建通過。基準10次都重新讀清單，候選10次都重用；每輪三次文章鎖及三次內容更新各提交一版，空白請求保持pointer/version。全新登入與相同程式重新部署後的cold讀回精確內容（含尾空白／LF），原首頁不變。warm空白中位數2248→2361ms，沒有穩定改善；warm鎖6031ms（3次）→5465ms（2次），warm內容7030ms（3次）→6499ms（2次），另兩次cold約9.8／9.9秒。樣本少且冷暖不同，不宣稱穩定加速；確定收益是省去每次重複的R2清單讀取。

自有174及子修訂已清理；完整備份 `c48150e9-0e75-4399-93e4-d94e7c908e2b` 校驗297索引，37原canonical檔、15上傳檔、48 metadata及歷史修訂保持一致。副本303／來源175，coherent、無fence、paused；私人閘門保持404/noindex。545個平台事件，outcomes `{"ok": 545}`；0例外、0失敗、0未完成trace。觀測已停，0殘留tail；不是長時間／瀏覽器／全isolate記憶體驗收。

下一步優先核對免費額度、快照儲存成長與保留條件，再接續原生操作、取消診斷及實際交接。這輪沒有UI／實機／新空環境還原，也沒有解決冷啟動延遲。PR #4仍draft、目標active。詳見 `docs/verification/cloudflare-manifest-cache-summary.json` 與 `experiments/cloudflare-wordpress/manifest-cache/README.md`。以下保留各較早階段的當時結果。

## 新版本手機寬度原生保存與重開（2026-11-20）

私人 Worker `e33e2afb-7d40-4a36-b06e-674eac707f44` 在 Chrome 375×812 完成繁中登入、首頁副本173的指定段落修改、保存及離開列表後重開。全新登入的REST核對完整內容，只有計畫段落與已核對的Gutenberg序列化差異；原首頁逐位元一致。原生畫面已顯示「已儲存」。正式Pages、原視覺、daily來源程式與後台選擇未改，沒有新部署或付費。

儲存點擊曾在瀏覽器控制層逾時，後續看到正在自動儲存及已儲存；不能把操作時間差當成保存速度。工具連線中斷，未取得完整瀏覽器網路觀測，先前13個取消事件原因仍未證實。兩段已留存平台觀測共1242事件，outcomes `{"ok": 1238, "canceled": 4}`；UI到清理視窗為230事件、`{"ok": 226, "canceled": 4}`。記錄到0例外、0 request failure、0未完成trace；閒置與中斷期間不能當連續壓測，事件也不是唯一HTTP數。

自有173與子修訂已清理；備份 `6bfd0a41-07de-4e1a-9008-8f21c2231c25` 完整校驗297索引，37原canonical檔、15上傳檔、48 metadata及歷史修訂不變。副本278／來源175均coherent、無fence、paused；未登入admin／REST／media保持404/noindex。觀測已停且0殘留tail，實際測試編輯分頁已關閉、viewport已恢復；舊失聯控制台分頁無法確認手動關閉，未標記保留。

下一步仍是冷啟動／保存延遲、取消原因、其他原生流程、實機與實際交接，以及持續免費用量驗收。沒有宣稱後台已全面完成或這輪做過新空環境還原。PR #4仍draft、目標active。證據：`docs/verification/cloudflare-noop-ui-summary.json`、`experiments/cloudflare-wordpress/noop-ui/README.md` 及 `docs/verification/noop-native/`。以下保留較早階段的當時結果。

## 未變更原生請求不再重複提交（2026-11-19）

私人Worker `e33e2afb-7d40-4a36-b06e-674eac707f44` 採用小幅修正：PHP執行及完整canonical／圖片／主題核對後，只有pointer完全相同、沒有publication job的原生HTTP請求改為釋放lease；不新增無效版本或R2 pointer寫入。文章鎖、真正變更、匯入及維護仍正常提交，沒有停用心跳。正式Pages、原視覺、daily來源及後台選擇未改。

原版兩次未變的心跳仍version+1；修正後四次（含暖機）皆pointer/version不變，兩次文章鎖及內容更新各+1，全新登入精確讀回末尾空白／LF。非暖機warm空白三次約2.07秒；原版只有一個warm樣本且其他為cold，不宣稱穩定加速比。文章鎖仍約5–6秒warm／9.5秒cold，真正內容更新本次11.2秒，延遲仍開放。18項相關測試、TypeScript、dry-run及18段patch／62來源重建通過。

自有171與子修訂清理完成；完整備份 `6f899847-85b0-415c-b253-f7a1cb1dccf7` 校驗297索引，37原canonical檔、15上傳檔、48 metadata及歷史修訂不變。副本251／來源174，coherent、無fence、paused。382觀測事件全ok且沒有記錄到例外／失敗／未完成trace；觀測已停、0殘留tail。這輪沒有瀏覽器／實機／新空環境還原，前輪13取消原因仍未證實。接續新版本UI觀測、冷啟動／保存延遲及實際交接。PR #4仍draft、目標active；詳見 `docs/verification/cloudflare-heartbeat-noop-summary.json` 與 `experiments/cloudflare-wordpress/heartbeat-noop/README.md`。以下保留較早階段的當時結果。

## 手機寬度原生編輯通過，穩定性仍待驗收（2026-11-19）

私人Chrome以375×812完成繁中登入、手機選單、搜尋、首頁副本169的段落修改／儲存／離開重開，另檢視768×1024編輯器。原生REST獨立核對完整內容，原首頁逐位元不變；375px前台5個導覽入口、LINE網址及捲動後9個品牌圖片元素通過。這是視窗模擬，沒有實機觸控／鍵盤／IME或全路由驗收。正式Pages、原視覺、runtime與後台選擇未改。

儲存9831ms抽查仍在等待，其後成功；一次導航10秒控制逾時後重試成功。391事件中378ok、13canceled（11 admin-ajax／2 front-page）；未記錄例外、request failure或未完成trace，但取消原因尚未證實。登入初始英文／前台輔助標籤英文、新聞RSS限制及互動延遲保留為交接缺口。沒有宣稱長時間免費穩定或本輪新空環境還原。

草稿169與子修訂已清理。備份 `fbcb867b-df28-422c-a4e9-6ee2a3b77e34` 的297索引完整校驗，37原canonical檔、15上傳檔、48 metadata及原歷史不變；副本version232／來源174，coherent、無fence、paused。觀測已停止、0殘留tail，測試分頁關閉及viewport恢復。Worker仍 `f6ac6526-2016-445d-b510-2b887369c7c2`。下一步診斷heartbeat／取消與互動等待，補實際交接；PR #4仍draft、目標active。詳見 `docs/verification/cloudflare-mobile-native-summary.json`、`experiments/cloudflare-wordpress/mobile-native/README.md` 及圖片證據。以下保留較早階段當時結果。

## 保存延遲比較：候選未採用（2026-11-19）

本輪測試最多三筆／1 MiB佇列的並行canonical保存。首輪三次中位數6866→6859ms幾乎不變；固定六次複驗為循序7684ms／並行6887ms，但循序基準兩輪自身移動約818ms，樣本未隨機且有時間／網路差異，未證實穩定收益。候選保留為研究證據，未加入重建序列；目前私人Worker `f6ac6526-2016-445d-b510-2b887369c7c2` 已回到c9ec130的17段patch／62來源原實作。正式Pages、原視覺、daily來源與後台選擇未改。

23項聚焦檢查、TypeScript、dry-run通過；較廣測試36／39，原版相同環境29／32，三項相同失敗為兩個既有來源字串斷言及native PHP未安裝，沒有宣稱全套通過。跨兩種部署／全新登入精確讀回、首頁不變、自有146與22筆修訂清理通過。新備份 `ebcc8669-0433-45ad-9a8f-3a0f83d91da8` 的297物件完整校驗；37個原canonical檔、15上傳檔、48 metadata與原歷史修訂不變。副本version189／來源174，coherent、無fence、paused。

355觀測事件皆ok，無記錄到例外／失敗／未完成trace；觀測已停止且沒有殘留tail。本輪沒有瀏覽器／手機或新空環境還原驗收。接續原生手機流程與實際交接，保存延遲及持續免費用量仍開放；PR #4維持draft、目標active。詳見 `docs/verification/cloudflare-write-latency-summary.json`、`experiments/cloudflare-wordpress/write-latency/README.md`。以下保留較早階段當時的結果。

## 私人後台診斷取樣與延遲（2026-11-19）

私人Worker更新為 `04c50a77-d4ca-4af0-93ab-0cc3ff1963e9`；正式Pages、原品牌視覺、daily來源程式與後台選擇保持不變。CPU profile發現整個檔案掃描占這輪取樣CPU約25.6%，改成首次載入／保存後才掃描，其餘仍讀heap。首次profile回覆10393「無近期執行」，暖機後一次重試成功；不能解讀為權限／付費限制。遠端phase計時受I/O時鐘影響，不能把lease.release讀值當作鎖釋放的純耗時。

各六次暖機後登入頁完整回應中位數由2406.077降到1978.374ms（本輪約17.8%）；樣本小、有網路差異且只有修改後開著sanitized tail，不能推論整個後台。五項測試、TypeScript、dry-run及實際PHP-WASM檔案掃描通過。原生HTTP建立／修改／全新登入逐位元讀回含末尾空白與LF、自有144及145清理通過；寫入仍約6.85–8.25秒，互動體驗未完成驗收。

最後備份 `78a0d6bd-c4a3-4c7b-be37-66e03578671b` 校驗297物件；27 Markdown＋10完整表共37個canonical檔不變，15上傳檔與48 metadata保留。副本version158／來源174均一致、無fence、paused。有限觀測123事件皆ok，沒有記錄到例外／失敗／未完成trace，觀測已停止且無殘留程序。17段patch、62來源及9工具可重建。簡單本機OPCache設定未證實收益，未採用。

本輪沒有重做瀏覽器UI／手機／另一空環境還原。後續仍是互動延遲、更多原生與手機流程、實際交接及持續免費用量；PR #4保持draft、目標active。最新證據：`docs/verification/cloudflare-diagnostic-sampling-summary.json`、`experiments/cloudflare-wordpress/diagnostic-sampling/README.md`。以下是各較早階段當時的結果。

## 歷史修訂與內容完整保存（2026-11-19）

私人站18筆歷史修訂的28處舊網址已搬移，三個共用項目的23筆修訂由原生REST讀回一致；原ID／GUID／日期及其他欄位保持不變。原生還原測試進一步發現MDI在載入時rtrim末尾空白，首次草稿140還原修訂141後少一個LF，因此當時未通過。失敗備份與本機重現均保留。

修正版為新寫入加入內容長度及SHA，讀取只移除儲存格式額外的一個LF；未標記舊資料保持原讀法。235項PHP／MDI檢查、TypeScript、dry-run通過。相同自有修訂重做原生還原、新登入、完整備份及相同程式重新部署後，2401bytes逐位元相同，原首頁不變；草稿140與修訂已清理。最新私人Worker為 `b90bf162-72f3-4c7b-a3a9-e61c46c8a773`，正式Pages、原品牌視覺、daily來源程式與後台來源未切換。

最後完整備份 `4b8438b1-e89d-4d01-90d3-96d2026d6cf6` 校驗297索引；27個原Markdown、9個完整表、15個上傳檔及48筆metadata不變。posts表68筆每個欄位均與搬移候選一致；只有2格變4格JSON編碼，已用精確重編碼SHA驗證。副本version153／來源174均一致、無fence、paused。16段patch、61來源及8工具重建一致。帶新內容標記的備份須搭配此修正或後續相容程式。

本輪為原生HTTP驗證，沒有冒稱重跑瀏覽器UI、手機或另一個空環境還原。後續聚焦互動延遲、其他原生／手機流程、交接與持續免費用量；早期未充分觀測的取消原因仍未定論。PR #4維持draft、目標active。證據：`docs/verification/cloudflare-history-content-summary.json`、`experiments/cloudflare-wordpress/history-origin/README.md`、`content-bytes/README.md`。以下保留各較早階段當時結果。

## 請求中斷診斷（2026-11-19）

私人重建站更新為 `42b9023d-9df6-4b30-88b2-b76149440617`，補上body讀取前的used／locked／aborted及固定原因分類，並在原相容日期下啟用request signal。完整heartbeat在等候期間被主動中斷時，已實測記錄abortedBefore=true、usedBefore=false；未取得lease或執行PHP，資料版本不變，接續讀取正常。這只證明受控案例，不能倒推先前無足夠診斷的事件。

中斷後正常原生HTTP建立／修改／新登入讀回／清理草稿138均通過。新完整備份 `4e46e92b-788c-4ede-a2d0-7695153ea4e2` 證明27個原Markdown、10個完整表、15個圖片及48筆metadata保持不變；高水位保留。副本version138、來源version174均一致、無fence、paused。正式Pages與原視覺未改，後台未切換。

11項測試、TypeScript、dry-run及15段patch／60來源重建通過。143觀測事件中141ok、2canceled；唯一body失敗／未完成trace是受控中斷，正常編輯期間沒有新增失敗；觀測已停止。接續處理18個歷史修訂的28處舊網址，以及互動延遲、其他原生流程、手機／交接／持續免費用量。詳細見 `experiments/cloudflare-wordpress/request-diagnostics/README.md` 與 `docs/verification/cloudflare-request-diagnostics-summary.json`。PR仍draft、目標active；以下保留較早的當時結果。

## 原附件修復與原生編輯驗收（2026-11-19）

私人重建站已修復15個附件的可驗證關聯（14個品牌WebP、1個舊探針PNG），原生核心重建44筆欄位；原有ID／GUID／圖片位元組不變。現有34個內容項目中，5個欄位的30處舊測試站網址已遷移，清理後再次完整讀回一致。正式Pages、原品牌視覺與後台來源未切換，兩個私人發布器仍paused。

真實繁中原生編輯器顯示首頁七張圖片，測試草稿136修改一段文字、按儲存、返回清單後重開均通過；另以後端比對確認原首頁不變。WordPress首次儲存的區塊換行、4個class尾空白、6個預設h2屬性及1個ampersand編碼已逐項核對，不是直接忽略HTML差異。自有草稿及修訂已清除。前台桌機9個可見圖片元素在捲動後全部載入，手機未在本輪重驗。

最後備份 `c79f3f55-93b6-4bbf-9ec6-3fb0462d5cfc` 的297個索引／全部解碼內容通過SHA驗證，27個遷移後原Markdown、15個上傳檔與48筆metadata在原生測試後不變。副本version133、來源version174，一致、無fence、paused。Worker程式仍 `643a81da-b010-4748-95e2-f22732d9e5e7`；14段patch／60來源與6個工具重新組裝一致。

**尚未通過的範圍：**18個歷史修訂仍有28處舊網址，回復修訂可能重新帶入；754個觀測事件有12 canceled及1次PHP執行前的request-body-unavailable，仍需診斷，不能宣稱互動穩定。沒有記錄到例外；最大觀測WASM80,084,992bytes不是整個isolate用量。觀測程序已停止。後續還有其他原生流程、手機、交接與持續免費用量，PR #4仍draft、目標active。

詳見 `experiments/cloudflare-wordpress/media-repair/README.md`、`docs/verification/cloudflare-media-repair-summary.json` 及圖片證據。以下保留較早階段的當時結果；「15張品牌圖片」應更正為14個品牌原檔加1個舊探針。

## 最新附件格式與私人副本（2026-11-19）

目前最新私人副本版本為 `643a81da-b010-4748-95e2-f22732d9e5e7`，已包含完整postmeta表保存修正，發布器paused。清理後備份revision為 `edf7bf71-b84e-444e-a6d9-1cce10366841`，自有附件128已移除。來源每日維護Worker仍是53980fce，不可混用設定或把舊程式部署到新格式資料上。

`_runtime/playtt-postmeta-layout.json` 的 `playtt/postmeta-table/v1` 表示metadata由完整JSON表提供；不得改寫或移除標記來強行繞過檢查。新格式備份須配合第14段修正或更新程式。修正前備份仍安全保留，但本輪沒有測試把新編輯倒回舊格式；若要退回，需另外處理其後內容，不可只回退程式。

原有15個附件檔案仍完整，但歷史關聯與舊內嵌網址尚待修復，首頁瀏覽器圖片未通過驗收。處理順序為有界關聯修復、重新產生網址遷移計畫、備份、套用、瀏覽器原生編輯／重載。不要重跑已完成的附件128上傳／清理流程。工具、範圍與未完成項見 `experiments/cloudflare-wordpress/postmeta/README.md`。以下為先前各階段操作紀錄。

## 目前界線

`wordpress/lets-play` 是可安裝的 WordPress 區塊主題。`cloudflare/public` 是匿名公開頁面的靜態匯出，不包含 WordPress 後台、PHP 或資料庫。免費隔離WordPress已通過原生視覺段落編輯、重部署保存、全空初始化與獨立R2/DO備份還原；正式後台與公開站發布整合仍待，不能把靜態發布視為全部完成。

## 私人環境版本與交接

最新還原副本 `playtt-wp-free-rebuild-audit` 使用新桶 `playtt-wordpress-rebuild-audit` 與自己的DO，版本 `1ca938eb-4984-440b-b6f0-a500d9c20f7d`。它已包含空白slug保存修正，無cron／正式路由，發布器paused。最新備份的全空還原、15個媒體SHA及修正後跨部署保存已通過；來源每日維護Worker維持較早版本53980fce，未套用本輪修正。兩個設定檔不可混用。

完整程序、停止點、原失敗與修正後比對見 `experiments/cloudflare-wordpress/independent-restore/README.md`。不需要重新清空目標來重跑；每輪測試必須核對備份與自有資料狀態。原始備份、登入資料及完整私有比較檔都只保存在本機。新副本資料中的嵌入網址尚未改寫，不能當作已完成網域遷移或瀏覽器畫面驗收。

## 私人後台目前狀態

目前私人 audit 版本 `53980fce-97d4-47b9-bc56-6c3b065027cc` 已部署每日有界維護，排程為台灣每日02:35。混合編輯／清理與重新部署驗證通過；第一個真正每日事件及清理後備份已驗收。發布器 paused，正式官網與原來源 Worker 不變。最新結果見 `experiments/cloudflare-wordpress/scheduled-maintenance/README.md`，維護指令與停用方式見該目錄 `OPERATIONS.md`。

自增序列已隨 R2 快照保存，普通草稿與原生 auto-draft 刪除後重建不重用 ID，舊 ID 寫入404。手動維護只清超過七天的 auto-draft、每批最多20筆，普通草稿保留；本機已測備份鎖與 manifest 寫入失敗復原。preview 不刪除，但可能提交先前尚未保存的 GET 狀態。舊無序列備份及歷史回滾限制見 id-sequence/README.md；不可回退至不保存序列的程式後繼續編輯。

先前快照候選五次寫入中位約11.7秒，屬有限樣本。冷啟動仍可能等待，原生連續操作與中斷證據見 request-body/README.md。最新完整備份位置由本機 `work/playtt-snapshot-audit-backup-location.json` 追蹤；備份含帳號資料，不可提交 Git。每次新備份的完整性校驗與較早獨立空環境還原是不同驗收，不可混稱。

來源 Worker 的較早候選曾通過410次混合讀取、原生 auto-draft 跨重建及七筆發布；其295索引備份曾在獨立 R2/DO 還原並比對15個媒體雜湊。私人[公開讀取預覽](https://playtt-publication-preview.muzhi-garden-platform.workers.dev)有 noindex，並非正式後台發布連線。

發布 pause／resume／retry 需要 operator 身分。六次無進展後停止並保留原公開版本，修復根因後才手動重試；本機故障演練不應改成遠端刪除。詳見 automatic-publication/README.md。2026-11-19已重新從 Cloudflare 帳號畫面確認 Workers Free/$0、R2 當期$0.00；帳號用量有延遲且含其他專案，不能當成未來費用保證。

## 安裝與編輯

1. 在 WordPress「外觀 → 佈景主題 → 安裝佈景主題」上傳主題 ZIP 並啟用。
2. 開啟「工具 → Let’s Play 網站內容」匯入六個品牌頁面與十四張媒體。需要管理員權限與有效 nonce。匯入器不覆寫同 slug 的既有頁面、不重複新增標記過的媒體。
3. 在「頁面」修改標題、文案、課程價格、教練、據點和圖片。圖片已進入媒體庫，不依賴保留同一個主題資料夾。
4. 在「外觀 → 編輯器」修改共用頁首、導覽與頁尾；在樣式中使用已提供的品牌色票。
5. 儲存草稿、預覽，再發布。需要回復時使用「修訂版本」。新版主題不會自動改寫已編輯頁面，更新內容時須由編輯者套用新區塊版型或手動修改。

## 第一次編輯導覽

在新安裝主題中，導覽連結先跟著頁首範本提供，尚未另存成導覽選單。因此「導覽列」總覽初次可能沒有選單，這不代表主題缺少連結。

到「外觀 → 編輯器 → 區塊版面配置 → 頁首 → 品牌頁首」，點選連結後修改右側「文字」與「連結至」。第一次修改會建立原生WordPress導覽選單；儲存確認面板應同時勾選「品牌頁首」與「選單」。完成後重新載入確認，再透過「導覽列」管理已建立的選單。網站頁面的內容則在「頁面」編輯；版型清單中的主題版型是建立頁面的來源，不是已匯入頁面的編輯入口。

此流程已在私人Cloudflare繁中原生編輯器完成修改、儲存及重載驗證；正式官網仍為獨立Pages版本。

## 本機重現

需要 Node >=24.18、npm >=11.16，及系統 `tar`。目前工具鏈在 Windows 驗證；不把開發用自動登入主機公開到網際網路。

在 `wordpress/` 安裝依賴 `npm ci`。`node` 套件可提供本專案可攜執行器，Windows 路徑為 `node_modules/node/bin/node.exe`。WordPress 官方 ZIP 放入 `.runtime/wordpress.zip`，解壓到 `.runtime/core/wordpress` 後執行 `npm run dev`。已測基準為 WordPress 7.1.4 / PHP 8.3 / Playground 3.1.64。

- `node scripts/prepare-assets.mjs`：從原站素材產生 WebP 和素材來源表。
- `node scripts/build-patterns.mjs`：由可維護內容產生八個原生區塊版型。
- 將 `lets-play/` 連同頂層資料夾壓縮成 `dist/lets-play.zip`。
- `npm test`：實際用 WordPress Theme_Upgrader 安裝 ZIP，驗證匯入、編輯、修訂、草稿權限、媒體、重啟與獨立備份還原。
- `npm run export`：從新測試站產生匿名靜態版本；輸出路徑與 SHA256 在 `test-results/export.json`。

注意：目前匯出器預設用 starter 版型建立新站。它不是已部署後台的同步器，不能拿來覆蓋未備份的編輯者內容。生產環境持久化架構定案後，需接上該資料來源並重新驗收發布流程。

## 免費 Cloudflare 靜態部署設定

固定帳號 info@dropout.tw；已部署的免費 Pages 專案 `playtt-brand-preview`，預覽 https://playtt-brand-preview.pages.dev 。這是官網恢復階段的靜態發布；免費隔離後台已通過原生編輯、修訂還原、頁尾、重部署與備份還原，正式發布整合仍待。

| 設定 | 值 |
| --- | --- |
| Git repository | dropout-tech/playtt |
| 預覽分支 | codex/playtt-wordpress-cloudflare |
| 根目錄 | cloudflare |
| 建置命令 | node verify-static.mjs |
| 發布方式 | Pages 原生 GitHub 整合，自動部署 |
| 環境變數 | SKIP_DEPENDENCY_INSTALL=1（Production 與 Preview） |
| 靜態目錄 | public |
| 執行邏輯 | 純靜態資產，沒有 Worker 程式或付費綁定 |

本機在 `cloudflare/` 執行 `node verify-static.mjs`。檢查會拒絕 PHP、資料庫、壓縮包、環境設定、本機網址、管理列、草稿標記、失效的站內相對連結及缺漏 SEO 設定。

0.2.3 起也檢查所有圖片有正整數寬高，避免主視覺載入造成版面位移。圖片尺寸由主題讀取原檔或媒體庫 metadata 後在渲染階段補上；不改寫編輯者保存的區塊內容。實際主題更新不需要重新匯入 starter。

使用者已明確授權 GitHub 串接，範圍限定本儲存庫。已沿用既有 Cloudflare GitHub 連線，僅選取 playtt 作為專案來源，沒有擴大其他儲存庫權限。Pages 建置只使用 Node 內建模組；[官方支援 SKIP_DEPENDENCY_INSTALL](https://developers.cloudflare.com/pages/configuration/build-image/#skip-dependency-install)，用來避免根目錄舊 React Yarn lock 影響這次靜態發布。

`wrangler.jsonc` 保留可選 Workers 靜態部署設定；Pages 因其未指定 pages_build_output_dir 而略過，使用儀表板設定。CLI 已登入指定 info 帳號；2026-11-17 已建立本專案獨立設定，包含使用者已授權的 Workers Scripts/Routes Write，以及必要的 Tail Read／Pages Write。以 XDG_CONFIG_HOME 指向本機 playtt 專案登入目錄，避免改動其他工作的共用登入；私有登入檔不可提交。正式官網仍為 Pages；完整動態後台未發布到正式網域。

## DNS 切換與復原

目前正式內容為主題 0.2.3；已驗證的內容快照為commit `55dc518`（後續文件提交可觸發內容相同的新部署），固定快照 https://32e92256.playtt-brand-preview.pages.dev 。主題 ZIP SHA256 `471aaf78e1d4a15d1357ec9500a067bcff27a9a4d803f7f8dcea48a00249a79e`。下方舊版快照仍可用作回滾。

2026-11-16 PageSpeed 行動量測：首頁 94、課程 99，兩頁 CLS 0；無障礙、最佳做法、SEO 自動分數均 100。這是單次實驗室結果，不是完整人工無障礙驗收或真實使用者核心指標。首頁仍有約 3 秒 LCP，後續可用響應式圖片進一步減少傳輸。詳細報告連結及比較在 `docs/verification/pagespeed-after.json`。

公開 HTTP 核對會從 HTML 取得實際資產 query（例如 CSS `?ver=0.2.3`），並把 requestPath 寫入證據。版本更新後，未帶 query 的舊 CSS 可能在原有一小時 TTL 內保留舊版本；不應把它冒充新頁面實際請求。沒有為取得較漂亮分數而使用不安全的永久快取。

Gandi 保留註冊及郵件服務。切換前完整區域檔有 14 筆服務記錄，加上 Gandi SOA；Cloudflare 已補齊自動掃描漏掉的三筆 DKIM，郵件 CNAME 均為 DNS only。DNSSEC 在 Gandi 未啟用。

新 Cloudflare NS：`karl.ns.cloudflare.com`、`mariah.ns.cloudflare.com`。舊 Gandi NS：`ns-60-a.gandi.net`、`ns-12-b.gandi.net`、`ns-90-c.gandi.net`。

2026-11-16 18:52 Gandi 已確認 nameserver 變更完成。Cloudflare zone active 後已完成根網域及 www 的 Pages 綁定，兩筆舊 Zeabur 記錄改成 `playtt-brand-preview.pages.dev` CNAME（proxied）；12 筆 MX、SPF、DKIM、郵件 SRV 和 webmail 完全保留且 DNS only。原本沒有 DMARC，沒有因搬遷新增郵件政策。兩個網域均 Active / SSL enabled，正式瀏覽器可開啟新版；仍須留意舊 DNS 快取。

已啟用 Always Use HTTPS；規則 `playtt www to canonical root` 將 `https://www.playtt.tw/*` 301 至 `https://playtt.tw/${1}`，Preserve query string 開啟。根網域及 www 的 HTTPS 轉址、query 保留已實測。Email Address Obfuscation 關閉，保留直接可讀的公開信箱與原生 mailto。

0.2.2 固定快照：https://97a18f78.playtt-brand-preview.pages.dev （commit 132a9de）。首個固定快照：https://06d099af.playtt-brand-preview.pages.dev （0.2.1，commit 3357a82）。18:42 已實際從 0.2.2 回滾到 0.2.1，讀取公開 CSS 證實，隨後恢復 0.2.2 並通過 46 檔驗證。操作入口：Pages → Deployments → 指定版本 Details → Manage deployment → Rollback to this deployment。這不回復 WordPress 資料庫。

`node cloudflare/verify-http.mjs https://playtt.tw` 檢查 46 個檔案、404 及 /home/ 轉向。若本機解析仍指舊 IP，可暫設 `PLAYTT_EDGE_IP` 為已查證的 Cloudflare 權威 A 記錄再測；報告會明示此覆寫，且仍驗證正式 hostname 的 TLS 憑證。不得把這類結果當成所有 DNS 快取已更新。正式區域若注入 Cloudflare Analytics beacon，報告會明列該轉換，其餘內容仍需完全一致。

正式切換後驗證 NS、A／CNAME、MX、TXT、DKIM 和 HTTPS，記錄傳播中的查詢差異。Cloudflare 預先保存一個可用版本，回滾用 Cloudflare 的前一部署或相同靜態備份重新部署。舊 Zeabur 已經 502，不能把切回舊 IP 當作可用服務回復。

## 資料備份

本機 Playground 關閉後，備份整個 `.runtime/.../wordpress`，包含 SQLite、uploads、主題和設定；測試已驗證複製到獨立目錄後還原內容與媒體。此資料包含登入資訊，不能提交到公開 Git 或放入 `cloudflare/public`。

先前候選的R2完整版本／協調器備份與另一分區還原已實測；以下為歷史295個索引項目的校驗備份，SHA256為85594bc9bd0c478390a892415a9edb3715a2cb8526b262dc0f6bf40c4aa98268。前版曾在386次讀取後記憶體重置；最新a33083f3已通過410次讀取及發布回歸，且這份備份已在私人playtt-wp-free-restore-audit的獨立R2/DO還原通過，頁面、導覽、樣式與15個媒體檔一致。原資料內嵌網址保持原字串；長期營運與改網域的內容網址遷移仍待驗。詳見experiments/cloudflare-wordpress/runtime-retirement/RESTORE-AUDIT.md。使用者已選擇繼續研究全Cloudflare免費後台，正式站暫不切換。生產備份與還原須依最終架構再驗收。

## Zeabur 清除順序

僅處理 LetsPlayWebsite 專案 `6926869de253c26501bdc21a`、playtt 服務 `69268af7e253c26501bdc2e1`、環境 `6926869d9ded7fb3e124e339`。已看到唯一服務、無掛載卷、舊部署已移除；PASSWORD／PORT 變數保持遮蔽，未輸出密碼。

2026-11-17 使用者已在備份、正式站和回滾驗證後完成永久刪除；重新登入專案列表已無 LetsPlayWebsite，正式站一般公開 DNS 的46檔檢查仍通過。此專案的服務與設定隨專案移除，未變更其他專案及帳號共用整合。刪除前模板保存在本機 `outputs/backups/letsplay-zeabur-template.yaml`，未提交；證據 `docs/verification/zeabur-removal.json`。舊專案不可原地還原，可利用Git/模板備份重建，但網站回滾應使用已驗證Cloudflare快照。
