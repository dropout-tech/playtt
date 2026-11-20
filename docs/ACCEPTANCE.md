# Let’s Play 驗收狀態

## 雙帳號編輯鎖觀察到，接管驗收未完成；找到快照寫入成本（2026-11-21）

使用獨立Chrome管理員1與in-app測試編輯者2開啟草稿193。第二帳號確實顯示「已有其他人接管」並指名admin，原管理員仍可編輯；但同時出現暫停儲存提示，結束編輯器未完成導頁。本輪沒有輸入新文字，也沒有成功接管／由第二人保存，不能列為多人編輯驗收通過。

本輪600秒／20MiB／256操作窗口使用20,925,969bytes／81操作，剩45,551bytes後已提前封存。這是本專案自行設定的測試寫入額度，不是Cloudflare免費方案用盡的證明。唯讀比較39–57版19份清單，18次提交含8份完整快照、10份小型overlay；完整包合計18,364,040bytes。其中5次只變更usermeta及計數，變更檔合計104,742bytes，卻寫入11,477,138bytes完整包。這指出優化方向，尚未實作或量測節省。

獨立備份確認草稿193的內容與中繼資料完全未變，原有帳號／修訂、圖片與主題一致。新測試編輯者2登入控制台時自動建立空白快速草稿197，另有作者2、內容與原稿相同的autosave198及其空白footnotes欄位。初次比對因此拒絕，確認固定識別、作者與內容後限定放行，重驗既有本機備份成功；未重跑UI、未新增物件下載。保留原7個pin並新增第8個，298邏輯檔／300依賴物件，164個其餘Markdown檔不變。

目前仍053fa18f，canonical57／34a7df5f、8pins、pending0、關窗及寫入封存、fence解除、publisher paused。payload上界146,178,186／150,000,000bytes，僅餘3,821,814；不得重播舊窗口、重置／退款計量或自動提高上限。測試帳號2及草稿197、自動修訂198保留，這不是乾淨交付備份。正式Pages、原視覺、暫不切換後台與免費方案不變。

488平台事件含480 ok／8 canceled；46份trace有38完成、8未完成。6筆generic persistence failure與不足的測試額度一致；另2筆明確記錄request body在翻譯前已abort，不能一律歸因額度。沒有觀察到平台exception；管理員瀏覽器仍有1則viewport transition error及1則樣式警告，第二瀏覽器捕捉到的console清單為空。最高sampled WASM heap76,283,904bytes不是whole-isolate量測。兩個自建分頁、限時觀察及本輪工具均已結束。

新增4個操作／備份／成本分析工具；語法與乾淨重組通過，70來源／36輔助檔一致，來源與19設定皆未變，本輪沒有部署執行器。下一步先做獨立版本的usermeta/session/preferences小型快照，在本機證明精確還原與舊版拒絕，再用現有帳號重測真實接管與保存。歷史保留、回應遺失、記憶體／延遲、實機與長期免費仍待。目標active，PR #4 draft。

證據：`docs/verification/cloudflare-window-lock-summary.json`、`cloudflare-window-lock-cost.json`、`window-lock-editor-b-blocked.jpg`。以下保留前階段當時紀錄。

## 原生保存被拒絕後重試通過（2026-11-21）

私人測試草稿193在短暫維護鎖定期間，原生編輯器顯示保存錯誤並保留新增繁中文字；穩定畫面仍可按「儲存草稿」。鎖定期間canonical32與寫入量完全不變。解除本次鎖定後手動重試出現「草稿已儲存」，重新載入仍有全部三段內容。這是進入PHP前拒絕保存的測試，尚不涵蓋寫入成功但回應遺失、斷網或競爭編輯。

完整備份經獨立重建後確認只改自有草稿、新修訂196、編輯鎖、session及計數；其餘165個Markdown檔、圖片、主題與既有修訂一致。新增第7個保留pin。300秒／16MiB／128操作窗口使用6,027,238bytes／45操作，已提前關閉並封存。最新canonical39／b1423cbd、7pins、pending0、fence解除、publisher paused；保守payload上界125,252,217／150,000,000bytes，餘24,747,783。草稿192/193及修訂195/196仍保留，這不是乾淨交付備份。

樣式警告與WordPress核心／Gutenberg #76082的已知誤判吻合。已核對固定7.1.4核心掛載點、核心按鈕尺寸預設與實際外層樣式。上游修正#77340已合併，另依賴#86049補足比例變數；本輪保留原樣式，未修改主題掛載方式或隱藏警告。工具沒有暴露iframe內部DOM，畫布所有preset的計算值仍待驗證，不以此宣稱樣式不存在。

平台333事件含326 ok／7 canceled；27份trace中19完成，另8份在刻意持有的鎖定期間於lease.acquire拒絕，未進PHP，沒有觀察到平台exception。初次導航曾有10秒工具逾時；瀏覽器另有1則viewport transition InvalidStateError與2則樣式警告，尚非零錯誤驗收。取消事件仍待完整歸因。最高sampled WASM heap77,594,624bytes不代表整個isolate記憶體。分頁、限時觀察與所有本輪工具程序均已關閉。

新增兩個有明確版本／所有權檢查的測試工具；語法與乾淨重組通過，70來源／32輔助檔一致，70來源及19設定與前次部署來源相同。本輪未重新部署執行器、未改正式Pages與原視覺、未切換後台、未變更付費方案。下一步驗證不同使用者／session的競爭編輯鎖，再處理保存回應遺失、歷史保留與清楚的繁中重試訊息。目標active，PR #4仍為draft。

證據：`docs/verification/cloudflare-window-retry-summary.json`、`cloudflare-window-retry-style-diagnosis.json`及`window-retry-editor-retry-reloaded.jpg`。以下保留前階段當時紀錄。

## 小型快照遠端冷還原與原生瀏覽器保存通過（2026-11-21）

同一私人Free測試站完成小型快照→完整快照的遞增版本切換，保留全部歷史與pins，沒有reset／刪除。兩次登入頁均由新的PHP環境重建；實際平台trace分別含metadata-overlay restore及完整pack還原。繁中登入後精確讀回草稿193的兩個版本與尾空白，原首頁一致。180秒／16MiB窗口使用4,775,239bytes；回復完整內容後獨立備份297檔、登錄第5個pin，僅session與計數改變。

桌面Chrome原生區塊編輯器新增測試段落，出現「草稿已儲存」，重新載入後原段落與新繁中段落均保留，仍為草稿。5分鐘／16MiB／128operations窗口實用6,113,401bytes／47operations，分頁關閉後提前關窗封存。最後備份是metadata overlay，含297邏輯檔／298唯一物件；獨立重建確認只改自有頁面、修訂195、編輯鎖、session與計數，165個其餘Markdown檔、圖片與主題不變。已保留原5個pin並新增第6個。

目前053fa18f／canonical26／f56f11b1、6pins、pending0、窗口關閉、寫入封存、fence解除、publisher paused。保守payload上界119,224,979／150,000,000bytes，餘30,775,021。測試草稿193、修訂195及匯入192仍保留，不是乾淨交付備份。正式Pages、原視覺、舊私人站與暫不切換後台的決策不變，本輪沒有重新部署或付費變更。

原生UI有2則global-styles編輯器iframe樣式警告、未觀察到console error。UI平台276事件中270 ok／6 canceled，18份trace均完成、無觀察到例外或request failure；部分canceled仍包含完成的mutation。它們接近重載／關頁時間，尚非完整原因證明。最高sampled WASM heap77,660,160bytes不是whole-isolate量測。冷還原完整流程另有163個ok事件／10份完成trace。所有限時觀察已結束。

前置測試停點均保留：最初本機誤讀raw posts表；第一次遠端還原被持有中的seal正確擋下；第二次已冷啟動成功，但測試錯誤要求一般回應有server-timing。修正工具後才完成流程，未改執行器。UI備份初次因測試草稿日期更新而拒絕，核對固定WordPress核心wp_update_post的零GMT草稿規則後，限定此草稿日期例外，重驗既有獨立備份才登錄pin，未重跑UI或盲目放寬其他資料。

本輪新增5個操作／驗證工具；語法與乾淨重組通過，70來源／30輔助檔一致，70來源和19設定均與上輪部署來源相同。未重複宣稱新跑51項測試、TypeScript、dry-run或部署。下一步修正iframe樣式警告，再驗證儲存錯誤與重試、競爭編輯鎖。取消歸因、記憶體／延遲、歷史保留、版本回退、實機／輸入法、長期免費與交接仍待；有限私人窗口不等於正式後台可無限制營運。目標active，PR #4 draft。

證據：`docs/verification/cloudflare-window-restore-ui-summary.json`；原生畫面：`docs/verification/window-native-editor-reloaded.jpg`。以下保留前階段當時紀錄。

## 獨立免費測試站：期限、原生 HTTP 保存與快照備份通過（2026-11-21）

新建私人 `playtt-wp-free-window-audit`／獨立 Standard R2 桶，僅此設定啟用小型鎖定快照與寫入窗口。實際 Free 帳號接受部署，目前版本053fa18f；既有私人站維持封存，正式 Pages、原視覺及暫不切換後台的決策不變。測試前儀表板顯示 Workers Free／$0、當期R2計費用量$0；這是有時間戳的讀值，不是未來費用保證。

匯入已校驗canonical62，共298物件／100,637,598bytes，全部從遠端下載核對雜湊；僅選定此快照，未搬全部歷史pins。初次上傳在282物件後回401，核對原OAuth狀態後只續傳16個未完成物件；原因未確定，未盲目覆寫既有物件。30秒bootstrap窗口到期後，admin／REST／還原均回503，version1與183bytes／1operation不增加，錯誤持有人無法關閉窗口。

120秒／20MiB／128次操作內，真實WordPress HTTP完成繁中登入、草稿193建立、編輯器HTML、兩次原生heartbeat鎖更新、保存及精確讀回尾空白，原首頁內容不變。兩次heartbeat各寫88,478bytes／3operations，共用同一完整基底；內容變更仍產生完整快照。單次保存7,257ms，尚非延遲改善或瀏覽器UI驗收。實用7,698,558bytes／26operations後明確關閉並封存。

兩份遠端overlay與最後完整快照各完整重建297檔、複製到獨立目錄並重新驗證；遠端pin登錄也重新校驗相依檔，保留原pin後共4筆。這證明匯出、本機獨立重建與遠端pin，不等於overlay遠端還原及PHP冷啟動已驗收。最終canonical7／9beba823、pending0、窗口關閉、寫入封存、fence解除、publisher paused；保守payload上界108,336,339／150,000,000bytes，餘41,663,661。保留自有草稿193及匯入的192，不是乾淨交付備份。

51項相關測試、TypeScript、dry-run通過；25段既有patch加4段選用patch乾淨重組，70來源／25輔助檔一致，18份原設定不變。144個平台事件中9個trace完成，沒有觀察到例外或request failure；觀察已結束，非故障注入或whole-isolate記憶體量測。舊私人站已唯讀重查canonical62／25pins／sealed／餘2,141,868bytes，未寫入、擴額、退額或刪除歷史。

接續用新目標的有限窗口驗證overlay遠端還原與PHP冷讀，再做原生瀏覽器保存／重載、競爭編輯與錯誤恢復。版本回退、記憶體／延遲、實機／輸入法、長期免費用量及維運交接仍待。目標active、PR #4 draft。細節見 `experiments/cloudflare-wordpress/window-provider/README.md` 與 `docs/verification/cloudflare-window-provider-summary.json`；以下保留前階段當時紀錄。

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

## 附件保存缺陷與原生跨部署驗證（2026-11-19）

繁中原生編輯器能開啟，但私人副本首頁七張圖片無法載入。完整備份另確認15個原附件遺失檔案路徑／圖片metadata；先前15個檔案SHA通過只證明檔案存在，不等於媒體庫關聯完整。本輪沒有修改正式官網、原品牌視覺或來源每日維護Worker，發布器仍paused。

已修正MDI只保存部分欄位且不保留meta_id的缺陷，改以完整postmeta表與版本標記保存。實際PHP-WASM／MDI／PDO測試中，舊版10筆重載後剩4筆並重新分配編號；修正版10筆完整相同，17項檢查通過，TypeScript與dry-run通過。舊無標記備份相容；新格式不可交由舊程式繼續編輯。

私人副本原生上傳附件128、修改繁中標題與替代文字，再以相同程式重新部署為 `643a81da-b010-4748-95e2-f22732d9e5e7`，原生讀回與圖片SHA一致。兩份完整備份的三筆欄位18／19／20完全相同。測試附件已清理，媒體／檔案404；清理備份 `edf7bf71-b84e-444e-a6d9-1cce10366841` 內27個既有Markdown及15個原圖片檔逐位元不變，原JSON欄位不變，自增高水位保留。副本version85、來源version174均一致、無fence、paused。

有限觀測502事件：499ok、3canceled，取消均發生在修正前admin-ajax POST，原因未證實；無記錄到的例外、未完成trace或request-failure。最大觀測WASM76,873,728bytes，不代表整個isolate用量。觀測已停止。14段patch重新組裝，60個來源檔一致。

**仍待完成：**原有15張品牌附件的歷史關聯尚未修復；舊內嵌網址規劃被媒體檢查擋下，未套用。下一步以已驗證素材修復關聯，再遷移內嵌網址、驗收瀏覽器圖片及原生編輯／重新載入。新的保存修正不能當作已恢復舊資料。詳細見 `experiments/cloudflare-wordpress/postmeta/README.md` 及 `docs/verification/cloudflare-postmeta-summary.json`。PR #4仍draft，目標active。以下較早紀錄保留其當時範圍。

## 最新備份獨立還原與空白代稱修正（2026-11-19）

正式官網仍維持 Cloudflare Pages、Let’s Play 原品牌視覺與 LINE 入口，未切換後台。本輪以全新安裝依賴及重新產生的核心資產，另建私人 `playtt-wp-free-rebuild-audit`／`playtt-wordpress-rebuild-audit`，使用獨立 DO、無正式路由及 cron。296個已校驗物件複製完成，目標 pointer=null／version=0 時還原最新備份 `359644be-2af8-491c-b178-86c2a98f8f4e`。

7個已發布頁面、兩個共用版型、兩組導覽、樣式、繁中管理員與15個媒體SHA256核對通過，六個品牌頁及LINE入口可讀；未登入WordPress的私人草稿404／編輯REST401。沒有probe身分時，後台、REST與媒體均404。

首次相同程式重新部署揭露保存缺陷：草稿126的空白slug被MDI改成檔名126，標題／內容／狀態／ID不變，驗證在刪除前停止。修正現在區分內建native／OKF profile的明確空值與缺欄位；實際PHP-WASM／MDI舊版重現及修正版各68項檢查、TypeScript通過。修正也讓私人草稿6回到備份明寫的空白slug；僅此欄位與舊錯誤讀回不同，原基準與差異保留，已發布頁面完全相同。

修正版再次相同部署為 `1ca938eb-4984-440b-b6f0-a500d9c20f7d` 後，126完整讀回；刪除後新ID127，向124／125／126的過期寫入均404，新草稿未被誤改。兩份自有資料清理完成，副本version17／revision `6bbcb7b6-5daf-46f2-89a5-360520cc1cf2` 一致、無fence且paused。來源每日維護Worker仍為 `53980fce-97d4-47b9-bc56-6c3b065027cc`，沒有部署此修正；來源只因登入保存session而推進至version174，亦一致、無fence、paused。

有限觀測486個事件：484ok、2canceled，沒有記錄到的例外、未完成trace或request failure；兩筆canceled沒有內部trace，原因未證實。最大觀測WASM73,728,000bytes，不是整個isolate用量或長期保證。更新後13段patch可從固定上游重新組裝，59個來源檔與候選一致。首次部署子網域10007及受限網路fetch失敗均另有保留紀錄，未當作成功。

詳細證據見 `experiments/cloudflare-wordpress/independent-restore/README.md`、`empty-slug/README.md` 及 `docs/verification/cloudflare-rebuild-restore-summary.json`。資料內嵌網址未遷移；本輪HTTP驗收不包含新網域的瀏覽器視覺與完整原生編輯操作。後續集中在原生操作體驗、交接流程與持續免費用量；PR #4維持draft，目標active。下方是較早階段的歷史範圍。

## 全新依賴與核心資產重建（2026-11-19）

已補完上一節來源重建的依賴缺口：另一個新目錄以Node24.18.0／npm11.16.0從鎖定檔安裝116個套件，沒有共用node_modules；官方核心資產重新產生後，三份manifest及ZIP／blob與現候選逐位元一致。TypeScript與dry-run通過，五個binary模組完全相同；JavaScript僅替換已知建置根路徑前綴後完全相同。重建工具／指令與證據已交付。

這不代表重新初始化一套WordPress資料或再次遠端還原。私人daily維護／清理後備份已完成，正式官網保持Pages與原視覺，publisher paused。後續集中在原生操作體驗、實際交接及持續免費用量；整體目標active。詳細見 `experiments/cloudflare-wordpress/REBUILD.md` 及 `docs/verification/cloudflare-clean-install.json`。

## 每日維護與來源重建驗證（2026-11-19）

私人 audit 版本 `53980fce-97d4-47b9-bc56-6c3b065027cc` 的每日排程已真正觸發：台灣02:35／UTC18:35，cron `35 18 * * *`，處理一份本輪自有過期 auto-draft 124，清理1、剩餘0、跳過0，canonical version 167。以 Cloudflare scheduled 事件及成功提交紀錄為證，再以 WordPress 登入讀回確認404；新草稿125高於舊ID，舊ID寫入404，新內容不變，自有資料已清理，原已發布頁面雜湊一致。發布器仍paused，正式官網維持Pages與原品牌視覺，未切換後台。

遠端混合編輯與清理也通過：普通草稿存檔及另一過期草稿清理可並行提交；同一過期auto-draft的兩輪測試分別觀察到先升為draft而保留、先清理而後續存檔404。相同程式重新部署後內容與刪除狀態保持，新ID123，所有自有fixture清理完畢。派送順序不保證提交順序。

清理後R2備份 `359644be-2af8-491c-b178-86c2a98f8f4e` 完整解碼及SHA256校驗通過，296個索引、2285530壓縮bytes，8表序列，wp_posts高水位125。完整Markdown/JSON盤點只剩原有auto-draft93，metadata與先前一致。這輪驗證備份內容與重建，不是另一次全空遠端還原。最後狀態一致、fence已解除、publisher paused。

有限觀測234事件，outcomes={'ok': 233, 'canceled': 1}，無記錄到的例外／未完成trace／request failure；最大觀測WASM 74,842,112 bytes，不等於isolate總用量或長期穩定保證。只驗證一個真實daily事件，不宣稱多日排程可靠性。

從固定上游全新提取後，12段採用patch可依序組裝，57個來源與候選相同，TypeScript與dry-run通過。修正CRLF/LF交接問題，補上重建工具及維運CLI；本輪沿用既有固定依賴及核心manifest，未重新npm安裝或從零初始化。Cloudflare畫面再確認Workers Free/$0、R2當期$0.00，帳號總量約1GB；讀值有延遲，不是長期費用保證。

日常維護見 `experiments/cloudflare-wordpress/scheduled-maintenance/OPERATIONS.md`，重建見 `experiments/cloudflare-wordpress/REBUILD.md`。原生操作延遲、從零安裝交接與長期用量仍需收斂；PR #4保持draft，整體目標active。下方為歷史紀錄，當時的「未啟用cron」不代表目前狀態。

## 自動草稿維護私人遠端驗證（2026-11-19 01:51）

僅私人audit更新為`34b6db29-d13d-4263-911b-5767bdf23b72`，正式官網仍維持Pages與原品牌視覺，沒有後台切換、cron或付費變更。手動維護只處理超過七天的auto-draft，每次最多20筆；本機已驗證保留規則、並行清理、備份鎖及manifest寫入失敗復原。

遠端四種拒絕請求未改canonical狀態；只有本次自有過期auto-draft 115被清理，近期auto-draft、舊普通草稿與舊已發布頁面完整保留。相同程式重新部署後資料一致，新草稿取得116，向舊ID寫入404，新草稿不變。各自有fixture已清理，原已發布頁面雜湊一致、發布器paused。

清理後新R2備份`0f007ee5-099a-4ba1-955c-7940bbc4e5fb`逐項解碼與雜湊校驗通過，共296個索引，2285343壓縮bytes；8表序列保留，wp_posts=116。首次下載因503「Loopback unavailable」未完成，保留失敗並確認釋放fence後重試成功；不能據此判定是哪一層服務造成503。Markdown/JSON完整盤點只剩原有auto-draft 93，其日期／類型不變且未達清理年齡。這輪是重新部署重建及備份校驗，不是另一個全空環境還原。

有限觀測239事件皆ok，無例外／未完成trace；最大觀測WASM 73,990,144bytes，不是整個isolate用量或長期保證。preview不刪除但可能提交先前待保存的GET狀態。排程仍未啟用，混合編輯／清理併發、操作交付與原生體驗收斂仍待；PR #4保持draft，目標active。重現與界線見 `experiments/cloudflare-wordpress/maintenance/README.md`。

## 自動草稿維護本機驗證（2026-11-19 01:37）

有界手動維護入口只接受 preview/run，沿用原生七天 auto-draft 規則、每次最多20筆及既有 DO/R2 提交；未部署遠端，未啟用 cron，正式官網保持現況。8項邊界測試、TypeScript與完整 WordPress 清理／保留／重啟驗證通過：刪除226後新草稿為227，舊ID寫入404。21份自有auto-draft的兩次同時清理分別處理20、1筆，沒有重複；備份fence回409且指標不變。故意讓本機manifest寫入失敗後，指標仍舊，冷啟動可完整讀回249，正常重試才刪除。各輪自有資料已清理、原已發布頁面雜湊不變、發布器paused。

初版串流轉送500的證據保留，接收端改成驗證／收完小輸入再轉送。preview不刪除，但可能一併提交既有待保存GET狀態，不是唯讀API。這輪是本機證據，遠端維護、清理後備份、混合編輯併發與排程仍待；詳見 `experiments/cloudflare-wordpress/maintenance/README.md`。PR #4維持draft，目標active，沒有付費或後台切換。

## 自增編號保存修正（2026-11-19 01:11）

正式官網保留目前Pages與原品牌視覺，後台仍不切換。序列修正僅部署獨立私人audit Worker，最新版本`568bf784-6bbb-4f53-a13b-07e0f38e657a`；原來源Worker不變、發布器paused，未新增付費。

原缺陷是SQLite重建只載入現有資料，沒有保存已刪除資料曾用過的自增編號。現在把各表序列以有上限的十進位字串存入canonical JSON，隨R2快照提交；一般WordPress的wpdb啟動與匯入用storage runtime都恢復序列，僅提高、不降低。第一版漏接一般wpdb，完整本機測試仍失敗；該失敗保留後才補齊接點。

實際PHP/WASM/SQLite 30項檢查及TypeScript通過，涵蓋六種資料表、最高編號刪除、空表、大整數、壞metadata與實際wpdb冷／暖接點。完整WordPress：本機REST刪除209後取得210；本機原生auto-draft刪除221後取得222；遠端REST刪除107後取得108；遠端原生auto-draft刪除110後取得111。四輪舊ID寫入皆404，新草稿不變、自有資料清理完成、原頁面雜湊不變。原生auto-draft是HTTP請求WordPress新增頁面的實際建立流程，這輪未操作舊瀏覽器分頁。七筆本機發布回歸21.991秒，復原流程exit0。

最新R2備份`c1423c9b-b818-4410-92f7-dff11ccb8d15`逐項解碼及雜湊驗證，含8個表的序列，wp_posts高水位111在刪除測試資料後仍保留。這輪證明重新部署重建及備份內容完整，沒有另建第三個空白遠端環境還原本次備份。兩段有限tail合計197事件，中間沒有連續觀測，outcomes={'ok': 197}，無例外／未完成phase；最大觀測WASM74,776,576bytes，不是isolate總用量或長期保證。

舊快照沒有序列時，只能以尚存資料建立起點，無法反推已刪除的歷史ID；刻意還原更舊備份亦會回到當時序列。不可宣稱追溯修復或跨任意回滾永不重用。下一步：清點舊auto-draft來源與保留規則、驗證清理後編號不回退、補足操作交付與有限原生體驗驗收。PR #4維持draft，整體目標active。

## 連續編輯與新發現的保存問題（2026-11-17 18:58）

正式官網與原品牌視覺保持現況，暫不切換後台。私人audit版本f7cc0a9b先完整接收請求，再取得資料鎖及執行PHP，避免尚未執行的中斷請求丟棄已載入執行器。8項測試、TypeScript與正常本機七筆發布回歸（21.970秒，清理exit0）通過。本機故意斷線仍使Wrangler工具退出，有限前後紀錄已保留；遠端單次斷線後canonical指標不變，但未捕捉內部body失敗，因此歷史中止根因仍未證實。

繁中原生編輯器完成三版內容：第一版手動儲存，第二版原生自動儲存，第三版於重建後手動儲存，再重載確認第三版及兩筆修訂。保持編輯器開啟的120次REST讀取完成，讀回序列2、2、3、3、3、3。整段觀測955事件、954ok及1canceled，無例外／未完成phase；捕捉3次執行器釋放，非完整請求或isolate用量保證。原公開頁面不變，本次草稿106已清理，publisher paused。

**新發現、未修正：刪除後冷啟動會重用文章ID。** 本機刪除草稿205後重新啟動，新草稿再取得205；用舊ID修改內容會改到新草稿。這是受控REST驗證，尚未做舊瀏覽器分頁測試。測試只涉及本次建立的草稿，已全部清理，原頁面雜湊不變。此缺陷必須修正並回歸，不能宣稱正式後台驗收完成。

下一步優先持久保存自增編號紀錄，驗證冷啟動、刪除與原生auto-draft；再完成舊自動草稿清理及操作交付。程式／有限證據見experiments/cloudflare-wordpress/request-body/及id-sequence/；PR #4維持draft，目標active，未新增付費。

## 快照延遲與原生編輯驗證（2026-11-17 18:30）

正式官網保持現況，暫不切換後台。新候選只部署於獨立私人 audit Worker；原來源 Worker 仍為 a33083f3，發布器均維持 paused。

每次保存原本重讀約 300 個 R2 物件；目前對未變內容重新核對已提交 manifest 與執行器位元組雜湊，變更內容仍從 R2 讀回，完整快照寫入後才提交。五次寫入的中位等待由原候選 18.937 秒降為 11.720 秒，約少 38%；這是有限樣本，並非統計試驗或操作 SLA。15 項完整性測試、本機七筆發布批次及遠端草稿讀回／清理通過。

Chrome 繁中原生區塊編輯器完成新建草稿、兩次段落儲存。重新部署為 1c5f289a-2262-4493-a7f2-b6d84b9fac19 後，同一草稿 ID109 及第二版內容雜湊不變，畫面顯示已儲存與兩筆修訂。原七個已發布頁面雜湊不變，未登入 WordPress 的草稿頁面404／編輯REST401。最後只刪除本次身份已核對草稿；發布器仍paused。

新 R2 備份 revision d74e41e3-a3fa-43b3-be46-cc5c849ea821，296個索引、4,351,650解碼bytes、2,285,300壓縮bytes，逐檔校驗通過。此輪證明備份解碼與原Worker重新部署保存；沒有另建第三個空白遠端環境還原這份新備份。前輪獨立還原證據另保留。

原生流程觀測 273 個事件封裝，outcomes為 {"ok": 269, "canceled": 4}，例外 0 筆；另有一次mutation trace未完成，記錄lease abort／runtime dispose，隨後同一事件的冷讀取完成。缺少錯誤類別，根因仍待釐清，不能與正常完成等同。第一次重新開啟編輯器遇瀏覽器工具10秒導覽逾時，留下canceled事件，重試後載入成功；不可宣稱這輪全部ok或毫無等待。最大觀測WASM配置 76,808,192 bytes，不等於整個isolate用量。

程式與可重現證據見 experiments/cloudflare-wordpress/snapshot-latency/。較長原生編輯跨釋放、冷啟動／導覽等待、舊auto-draft清理及操作交付仍待；PR #4保持draft，研究目標active，未啟用付費方案。

## 最新研究驗收（2026-11-17 17:40）

正式playtt.tw依使用者決策保持Cloudflare Pages，原站視覺及LINE入口不變；全Cloudflare免費後台繼續研究，暫不切換，目標active。

最新執行器候選已通過410次混合讀取、原生auto-draft跨重建保存、匿名草稿拒絕及後續七筆發布批次（65.513秒）；Chrome繁中原生編輯器的品牌畫布與儲存狀態亦正常。完整前輪證據及範圍保留如下。

同一份來源另部署於私人playtt-wp-free-restore-audit，使用獨立SQLite DO命名空間及playtt-wordpress-retirement-audit桶，沒有正式路由或跨Worker綁定。295筆備份索引去重292物件，加三個固定核心物件，上傳前均核對雜湊。目標pointer=null/version=0時還原9ab986fc備份，沒有重設來源或主要資料區。

獨立還原驗收通過：七個原有已發布頁面（含六個品牌頁）、兩個範本部件、兩組導覽、全域樣式、既有私人草稿及繁中管理員與來源內容雜湊一致；15個媒體檔逐一從新桶讀回核對SHA256。六個品牌頁及主題CSS可讀，無管理列且noindex；匿名草稿404、編輯REST 401。原資料內嵌網址保持原字串，這次未驗證改網域的內容網址遷移。副本發布器paused。

還原觀測125個tail事件封裝全部ok，沒有例外；最大觀測WASM配置71,827,456 bytes。這些不是獨立請求數或isolate總用量。新環境第一次登入頁約10.2秒、登入提交約33.8秒，顯示操作延遲仍需改善，不能將資料還原成功等同正式操作體驗已合格。

最新版另在本機模擬器通過故障回復：損壞的發布工作被拒絕，完整前版仍可讀；恢復工作後明確retry成功發布，最後還原原文並paused，流程exit 0。沒有對遠端物件注入故障。重現方式見experiments/cloudflare-wordpress/runtime-retirement/RESTORE-AUDIT.md。

下一步為較長原生編輯流程跨重建、冷啟動／登入延遲、舊auto-draft清理及操作交付。正式後台切換保持暫緩；不把有限通過、先前失敗或尚未驗證的行為混為完整營運保證。PR #4維持草稿，未啟用付費方案。

## 最新研究驗收（2026-11-17 17:23）

依使用者決策繼續全Cloudflare免費後台研究；正式playtt.tw保持Pages，原站視覺與LINE入口保留，暫不切換後台。整體目標active，未宣稱營運交付完成。

新私人候選a33083f3在完整保存的請求之間釋放執行器，再從已提交R2版本重建，避免上游hot swap同時保留兩份至少64MiB的WASM。原400次保護保留。實測另外發現MDI刻意忽略auto-draft；已修正固定來源的兩個唯一比對位置，保留原生狀態／內容／權限，並在即將釋放的GET仍持有lease時保存讀取初始化資料。

本機原生空白草稿經210次讀取、兩次釋放仍存在；未登入頁面404、編輯REST 401，原內容與樣式不變，已刪除本次草稿。七筆發布批次再次通過22.090秒。第一次草稿404的失敗證據仍保留，未以新通過覆蓋。

遠端完成410次混合後台讀取，跨過先前386次失敗點；原生GET建立的同一auto-draft、既有頁面及樣式完整，匿名頁面404、編輯REST 401，本次草稿已刪除。後續七筆編輯／建頁／撤回／重發／共用頁尾批次亦通過，合併發布65.513秒，原內容與狀態已讀回還原。

最新版另以Chrome登入繁中原生網站編輯器，確認原站主視覺、LINE入口及停用的「已儲存」按鈕；這次畫面讀回沒有編輯內容。410次讀取的回應標頭等待時間中位數927ms、p95為1,570ms，最長11,010ms；這是單輪REST量測，並非瀏覽器互動延遲或正式服務保證。

這段tail觀測到1280個事件封裝、結果{'ok': 1280}，無例外；明確記錄4次釋放及6次建立，最大觀測WASM配置75,956,224 bytes。tail只代表觀測到的事件，非完整請求計數或總isolate記憶體。有限回歸通過仍不等同長期營運保證；下一步為更長時間原生編輯、目前候選的獨立還原與故障回復、冷啟動體驗及自動草稿清理驗收。

私人發布器paused，正式六頁及LINE正常，原主要資料區不變。最新還原區備份295個索引項目逐檔校驗通過，SHA256 85594bc9bd0c478390a892415a9edb3715a2cb8526b262dc0f6bf40c4aa98268；這份新備份尚未另做還原演練。完整候選與證據見experiments/cloudflare-wordpress/runtime-retirement/及docs/verification/cloudflare-retirement-*；PR #4保持草稿。

## 最新研究驗收（2026-11-17 16:32）

依使用者決策持續研究全Cloudflare免費後台，正式playtt.tw維持Pages、暫不切換後台。原站視覺與LINE入口保留，整體目標active。

已定位並修正兩個記憶體保留來源：初始化回呼額外保留4,571,615 bytes內容副本；核心MEMFS檔案預留容量另減少8,574,957 bytes。本機V8快照self size由132,925,692降至119,824,615 bytes，原始初始化副本已無保留路徑。這是有限本機快照，不是遠端總記憶體或峰值保證。分批R2備份實驗未改善所測峰值，未採用。

私人959ecd6b通過先前失敗的七筆編輯／建頁／草稿撤回／重發／六頁共用頁尾批次，68.647秒完成合併發布；原頁面、狀態、頁尾與測試頁清理均驗證。25個編輯器與樣式請求、兩輪儲存／讀回／還原通過。Chrome繁中原生樣式實際儲存後，重新部署c972b58e仍讀到墨色色票；原生重設、儲存後REST確認styles完全恢復原值，六頁預覽同一版本且無測試標記。兩個部署合計681個觀測事件，679 ok、2 canceled、無例外；最大WASM配置76,546,048 bytes，非總isolate用量。

另重現原工廠在第401次PHP請求誤用已完成trace。補丁將診斷限於首次建立，固定WASM完成805次、兩次實際自動輪替，檔案與追蹤配置保留。最新候選7e59a586的遠端長時間讀取在完成386次後收到HTTP500，tail確認一次DO記憶體超限重置；接近預期400次PHP輪替邊界，尚未觀測到成功的第2代。重置後已獨立讀回確認原始頁面、頁尾、樣式與繁中完整。該次只做讀取，未變更頁面或樣式；此結果不列為穩定度通過。遠端tail結果{'ok': 852, 'exceededMemory': 1, 'exception': 1}，例外封裝2個；完整範圍見cloudflare-rotation-remote.json與cloudflare-rotation-tail.json。

私人發布器paused，正式六頁與LINE最新唯讀檢查通過；原主要資料區未變。樣式還原後的新備份已逐檔驗證294個索引項目，SHA256 09b1726b3db53bd5014e40b0fe79ab95442e2f4e216bf9b82a68b88eb7d35e3f；這份新備份尚未另做還原演練。程式、證據與重現步驟見experiments/cloudflare-wordpress/memory-lifetime/；PR #4維持草稿。

## 最新研究驗收（2026-11-17 15:27）

正式playtt.tw六頁及LINE再次確認正常，仍由Pages提供；依使用者決策繼續全Cloudflare免費後台研究，暫不切換。

發布合併候選0400c6ab本機通過七筆連續編輯、草稿撤回／重新發布、共用頁尾、故障保留前版／修復重試，以及建置中追加新編輯。七筆合併約22.1秒，建置中追加約28.9秒；TypeScript及22項相關檢查通過。來源與精確界線見experiments/cloudflare-wordpress/publication-batching/。

遠端先前積壓已清空，但新的完整批次驗收在建立頁面時記憶體重置；部分寫入已保存但HTTP回應失敗。兩次重置前WASM配置分別約72.2MB與68.2MB，故約75MB的先前成功工作負載不能當成整體記憶體已解決。總JS/WASM配置與回應階段仍待研究，遠端完整回歸未通過。

私人關於／課程原文與狀態已逐字讀回確認還原，頁尾未變；已清除本次自行建立的測試頁，六頁預覽無測試文字。發布器paused，並完成294個索引項目的新備份：SHA256 b788b3333d47e89265b73c5856a1bf962784ec341b634064527bc1b76b85a34e。這次備份尚未另做還原演練。原主要資料區與正式網站未變，整體目標active。

## 最新研究驗收（2026-11-17 15:10）

使用者已選擇繼續全Cloudflare免費WordPress研究；正式Pages維持現況，暫不切換後台。追蹤分配器候選755bdb73通過私人遠端25請求、兩輪全域樣式儲存／讀回／還原，繁中控制台及編輯器在重部署後正常。原生導覽「據點→上課據點」儲存重載通過，已還原「據點」並再次重載確認。

固定本機工作負載的WASM配置由115.4MB降至74.8MB；相同binary的60次循環參考清理及PHP上限拒絕後恢復通過。遠端觀察758事件，結果{"ok": 752, "canceled": 6}，無例外，最高WASM配置76,218,368 bytes。這不是整個isolate實體用量，也不是持續營運穩定度保證。

發布回歸在開始前等待舊工作清空360秒逾時，新的編輯／草稿／重發回歸尚未執行。手動完整刷新另回409，未切換預覽指標；匿名GET讀到舊快照，未建立所需目前canonical頁面。私人發布器已paused；下一步處理積壓合併與完整發布回歸。正式六頁及預覽仍200。

15:03私人還原區備份通過294個索引項目校驗，SHA256 e973ec543d3b25d50d18de3d4be1ddccb8b54b7246ec1b3a06e9c0fac1682ba4；這次新備份尚未另做還原演練。證據見docs/verification/cloudflare-tracked-*、cloudflare-navigation-tracked-native.json與cloudflare-publication-tracked-backlog-timeout.json。整體目標active，尚未完成營運交付。

## 目前結論（2026-11-17 14:21）

正式playtt.tw六頁與LINE入口再次唯讀確認正常，仍由Pages服務，原創視覺保留。全Cloudflare WordPress候選尚未通過穩定度驗收：小幅WASM記憶體擴充仍在原生樣式儲存後重置，不將成功的較小測試推論為完整可用。詳細證據與可重現候選見experiments/cloudflare-wordpress/memory-investigation/。

私人還原區已保存294個索引項目的獨立一致性備份；R2確認77個語言檔、管理員zh_TW、初始化外掛已移除、全域樣式覆寫已清空。然而HTTP操作回應失敗，語系及編輯流程不算完整通過。測試發布器目前paused以免重試；這不是暫停整體目標，正式站及原主要資料區未更動。

2026-11-17 使用者已選擇繼續研究全Cloudflare免費後台；正式官網維持目前Pages，暫不切換後台。不改採本機後台，也不啟用付費。一般Workers付費方案也有128MB記憶體限制，不能當成已驗證解方。官方來源：https://developers.cloudflare.com/workers/platform/limits/#memory 。


更新：2026-11-17（Asia/Taipei）。正式品牌官網已在 Cloudflare Pages 提供服務，Zeabur 本專案已清除；完整免費雲端 WordPress 後台尚未完成。持續目標保持 active。

- 正式站：https://playtt.tw/；預覽：https://playtt-brand-preview.pages.dev/
- 主題：0.2.3，ZIP SHA256 `471aaf78e1d4a15d1357ec9500a067bcff27a9a4d803f7f8dcea48a00249a79e`
- 分支：`codex/playtt-wordpress-cloudflare`；PR https://github.com/dropout-tech/playtt/pull/4 ，尚未合併。
- 已驗證內容部署：`32e92256-f71e-4ed6-afff-291b6cca3206`，commit `55dc518`。

| 編號 | 狀態 | 證據與剩餘範圍 |
| --- | --- | --- |
| A01 帳號與資源 | 已核對 | info@dropout.tw、Free、Gandi、Zeabur 專案已核對；使用者已授權必要 Scripts/Routes 權限並完成 OAuth。 |
| A02 備份 | 已驗證 | Git 全 refs bundle、素材、完整 Gandi zone、前後 Cloudflare DNS、靜態 ZIP 及 Zeabur 匯出模板均保存。 |
| A03 官網恢復 | 已驗證 | 正式瀏覽器及一般公開 DNS 46 檔通過，根網域/www Active SSL；Zeabur 刪除後仍正常。 |
| A04 免費 WordPress 架構 | 私人候選有限驗收通過；營運待驗 | a33083f3通過410次讀取、原生草稿跨重建與七筆發布；同來源獨立R2/DO還原亦通過。仍待更長原生編輯、登入延遲改善及操作交付，正式後台暫不切換。 |
| A05 主題安裝 | 已驗證本機與隔離遠端 | 0.2.3 ZIP 真實 Theme_Upgrader 安裝、啟用；9 項本機整合測試與遠端品牌匯入通過。 |
| A06 編輯與發布 | 私人候選有限驗收通過 | 原生段落、修訂、頁尾、繁中導覽與樣式保存／重部署／還原已有驗證；新候選另通過原生GET草稿跨多次重建與遠端七筆發布，正式Pages仍維持現況。 |
| A07 資料保存還原 | 已驗證本機與隔離遠端 | 最新295索引備份去重292物件，加三個核心物件，還原至獨立R2/DO；頁面、導覽、樣式、繁中與15個媒體雜湊一致，草稿匿名404/401。既有重部署保存證據保留；未宣稱改網域網址遷移或正式後台交付。 |
| A08 內容對照 | 已整理，營運資料待核對 | 原站內容搬移；價格、教練現況、林口地址等未確認項見品牌與內容文件。 |
| A09 聯絡入口 | 已驗證連結 | LINE、電話、地圖、合作連結保留；無假表單。未發訊息或替使用者預約。 |
| A10 響應式 | 已驗證 | 基準六頁×375/768/1440共18組；0.2.3正式375px首頁與桌機主視覺複核正常。 |
| A11 可及性 | 部分 | 手機鍵盤、焦點回復與alt已查；六頁可見文字計算對比、單一h1/main、zh-TW及無缺漏alt通過；真實減少動態偏好測試通過。完整輔助技術操作與圖片內文字對比仍待。 |
| A12 SEO | 已驗證靜態設定 | 六頁標題、description、canonical、OG、sitemap、robots與結構化資料通過；兩頁Lighthouse SEO100。 |
| A13 舊網址 | 已驗證 | 初次及同頁hashchange、#/class、#/partner、query五項回歸；正式站同頁轉向通過。 |
| A14 正式頁與資產 | 已驗證主要頁面 | 46檔、404、/home/301通過；六頁載入未觀察到console error、exception、失敗請求、>=400或混合內容。 |
| A15 行動效能 | 已量測並修正主要問題 | 首頁69→94，CLS0.711→0；新版課程99、CLS0。兩頁自動無障礙/最佳做法/SEO均100。首頁LCP2.956秒，後續仍可優化圖片。 |
| A16 DNS/TLS/郵件 | 已驗證設定與公開DNS | 14筆中僅網站2筆改變，12筆郵件保留；公開MX/SPF/DKIM/SRV通過。未實際寄收信。 |
| A17 自動發布 | 私人遠端回歸通過；正式串接暫不切換 | a33083f3長時間讀取後再次通過七筆編輯／撤回／重發／共用頁尾，自動合併發布及六頁一致，測試內容還原。早期積壓／記憶體失敗不刪除。僅playtt儲存庫整合，沒有付費升級。 |
| A18 回復版本 | 已驗證靜態回滾 | 0.2.2→0.2.1→0.2.2實際演練，0.2.3獨立ZIP亦保留；非遠端資料庫還原。 |
| A19 Zeabur 清除 | 已驗證 | 使用者完成永久刪除，全新專案清單已無LetsPlayWebsite；其他專案仍在，正式站一般DNS檢查通過。 |
| A20 交付 | 部分 | 主題、品牌規範、操作手冊、PR與證據已有；私人還原已驗證。仍待長時間編輯、延遲及自動草稿清理、內容核對與操作交付，正式後台暫不切換。 |

之前 Wrangler 權限擴大遭自動核准審查拒絕；使用者已明確授權必要的 Scripts Write / Routes Write，該阻礙已解除。後續已建立本專案獨立登入，包含必要的 Tail Read 供實測診斷。探針使用隨機 Secret，不包含正式使用者資料，未設定正式網域路由。

主要證據在 `docs/verification/`：`wordpress-integration.json`、`pagespeed-baseline.json`、`pagespeed-after.json`、`production-mobile-0.2.3.json`、`production-console-0.2.3.json`、`cloudflare-apex-public-http.json`、`cloudflare-canonical.json`、`cloudflare-rollback.json`、`dns-postcutover-check.json`、`dns-mail-public-verified.json`、`cloudflare-boot-remote.json`、`zeabur-removal.json`。原始完整量測畫面文字與含設定的備份僅保留本機 outputs，未將敏感設定放入公開程式庫。
