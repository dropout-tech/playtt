# PLAYTT 執行進度

## PHP 路徑掃描候選（2026-11-22）

將 lookupPath 的 split/filter 暫存陣列改成 indexOf 掃描。兩版各3,893個真實PHP案例、11,179次節點查找精確；六個全新workerd控制平均累計JS配置少12.77%，量測時間增加6.04%，不是整體尖峰或billed CPU。206輸入完整建置的差異只在lookupPath，五個二進位模組不變。

原生繁中保存1,875bytes、revision209、完整重啟與新分頁讀回、登出及304物件298檔備份精確。LOCAL191／500,288bytes／30puts、closed／sealed／pending0、exit0；0 runtime例外，初始gate404及一個global-styles權限403已分類。觀測組件合計約145.7／137.8MiB，仍未通過免費記憶體驗收；原生取樣涵蓋周邊請求，未宣稱整體效能改善。候選未採用，中央及正式官網不變，0雲端操作。詳見[實作與限制](../experiments/cloudflare-wordpress/path-scan/README.md)。


## 取消請求傳輸邊界（2026-11-22）

24及36案例本機校準確認proxy與direct、簡單回應與DO、標頭前與串流中取消均可重現相同文字，排除「只因Miniflare入口缺旗標」。固定workerd五個Git blob與實際binary已核對；詳細日誌分類為REQUEST_HANDLER，仍沒有確切C++ throw stack，不能回推歷史瀏覽器例外。

真實WordPress取消ID14的觀測區間內只有該請求；兩層200／aborted=false後出現一筆斷線例外，前後正常unlock及登出通過。全部原內容、修訂、usermeta／session、媒體、主題與304物件298檔備份精確；LOCAL189／399,675bytes／24puts，closed／sealed／pending0、exit0。初次串流觀測不足的紀錄保留、未算逐案通過。正式站與中央來源不變、0雲端操作；下一步回到免費記憶體工作。詳見[實作與限制](../experiments/cloudflare-wordpress/transport-boundary/README.md)。


## 請求生命週期與取消控制（2026-11-22）

本機兩輪原生繁中保存／完整重啟／登出與304物件298檔備份精確，皆無runtime例外；其中一輪的unlock400仍未證明原因。新增16項有界診斷檢查。兩輪明確取消實際WordPress釋放鎖請求後皆記錄同文字Network connection lost；客戶端已關閉，兩層仍200／aborted=false。例外本身無stack或request ID，歷史瀏覽器例外仍不能回推。

最終取消控制修正本機cookie到期處理，原內容、修訂、全部usermeta／session、媒體、主題及獨立備份精確，LOCAL189／399,725bytes／24puts，closed／sealed／pending0、exit0。前一輪失敗資料與同state只讀復原保留，兩筆額外介面設定未改寫成通過。中央與正式官網不變、0雲端請求／部署；記憶體與完整免費後台驗收仍開放。詳見[實作與限制](../experiments/cloudflare-wordpress/request-lifecycle/README.md)。


## 壓縮清單位元組轉換候選（2026-11-22）

保留所有清單格式、大小、SHA、解壓與 identity 驗證，改用預配置位元組陣列取代字串 iterator 中間配置。58 組比較、25 項既有整合回歸、83來源完整建置通過；六個 workerd 控制對同一真實清單各解碼20次，累積 sampled JS 配置由22–23MB降至9–10MB，不能推算整體尖峰。

原生單次保存、完整重啟、新分頁讀回、登出與304物件／298檔獨立備份精確；LOCAL190、450,182bytes／27puts、closed/sealed/pending0、程序exit0。重啟後再次有一筆無frame的Network connection lost，原因未證明；本輪觀測約147.5／160.9MiB，免費記憶體驗收仍未通過，也未觀測到整體尖峰改善。中央及正式官網維持現況，0雲端請求／部署。詳見[實作與限制](../experiments/cloudflare-wordpress/manifest-bytes/README.md)。


## 系統檔案清單預先驗證候選（2026-11-22）

最終候選以primitive string驗證、複製／凍結及私有WeakSet標記系統清單，省去逐檔重建；一般可變或偽造清單仍完整驗證。1,049一般比較／945prepared比較、六個workerd配置控制與83來源完整建置通過。受控驗證工作累計JS配置約減半，非整體尖峰改善比例。

最終原生保存／完整重啟／登出／304物件298檔獨立備份精確，LOCAL190、450,079bytes／27puts、closed/sealed/pending0。重啟後一筆無frame的Network connection lost仍未歸因，初次零例外稽核失敗保留；資料流程通過不代表整體穩定。觀測約144.4／144.8MiB仍未通過免費記憶體驗收。中央及正式站不變、0雲端請求／部署。詳見[實作與限制](../experiments/cloudflare-wordpress/owned-paths/README.md)。


## 編輯器位元組修補候選（2026-11-22）

原生配置 stack 定位到 editor.min.js 修補的完整字串副本。隔離候選改用位元組尋找／複製，保留輸入／輸出 SHA；9項測試、83來源完整建置及原生保存／重啟／登出／獨立備份均通過。六個控制副本中 baseline 函式各3,149,500累計 sampled bytes，candidate無達尺度配置；輸出完全相同，這不代表零配置或整體尖峰通過。

兩個原生流程為LOCAL195／191，均closed／sealed／pending0、exit0，內容／revision209／原session／媒體／主題與備份精確；候選有1個已分類global-styles403，無未分類HTTP錯誤。整體觀測仍約144–153MiB，不能通過Cloudflare128MiB驗收。中央來源／正式Pages不變、0雲端請求或部署；接續保存路徑與清單重複配置。詳見[實作與證據](../experiments/cloudflare-wordpress/editor-byte/README.md)。


## Ajax權限控制與heap持有分析（2026-11-22）

本機原生multipart釋放文章鎖已捕捉到200／1，隨後登出302；明確未登入控制同動作400／0，heartbeat200／wp-auth-check:false，固定核心來源支持該權限邊界。11個有界分類器案例通過，不輸出nonce／cookie／原body。舊400缺action／auth證據仍未倒推歸因。三個副本資料／原session／媒體／主題精確，只允許owned edit lock與wp_options序列差異，均closed／sealed／pending0、exit0。

兩份私人workerd heap約25MB，各有一個74,907,648bytes WASM、約31.43MB檔案backing；啟動資料陣列持有為0。snapshot self約123MB已含PHP，不能再次加上，也不能把可能GC後的數字當provider峰值。前輪143.5／145.6MiB完整編輯觀測仍未解；下一步定位操作期間短暫配置。中央來源及正式站不變、0雲端請求／部署，全案active。詳見experiments/cloudflare-wordpress/ajax-retained/README.md。


## 合併清理候選：原生保存／重啟資料通過，Ajax400與記憶體仍開放（2026-11-22）

真正cb9302a8…六模組完成繁中原生編輯與單次保存（1,875bytes）、整個workerd關閉重啟、新分頁重讀及原生登出。十段內容／revision209精確，原usermeta／session、媒體與主題保留，獨立304物件／298檔及full materialization精確。最終LOCAL190、charged450,169／27puts、closed／sealed／pending0、外連0、exit0；正式站及cloud181不變。

1,445samples／226requests、runtime例外0。global-styles403已分類；logout附近另有Ajax POST400，缺action／回應證據，原因與功能影響未證明，不能當成全部HTTP正常。離線audit保留首次失敗並縮明其證據範圍為資料流程。最大觀測組成約143.5／145.6MiB，仍未證明免費記憶體可行；本機不強制Cloudflare限制，非provider尖峰或配對效能結論。

接續有界Ajax400診斷與完整編輯配置定位。中央來源未採用候選、0provider請求／部署、全案goal active。詳見experiments/cloudflare-wordpress/cleanup-native/README.md。


## 啟動失敗清理候選與同容器重試（2026-11-22）

預配置解壓補齊35個實際PHP損壞ZIP／I/O／guard案例。發現固定WordPress boot API取得handler後失敗未明確dispose，新增隔離helper與worker整合，6個生命週期案例通過。成功仍由caller持有，失敗dispose後保留原error，清理失敗保留兩個error；handler回傳前的dependency建構失敗不在此責任範圍。

83來源／206輸入完整建置與型別檢查通過，無診斷程式bundle cb9302a8…，中央82來源未變。workerd觀測副本在同一個處理容器以損壞首次讀取500 → 舊PHP退出 → 完整讀取200恢復。LOCAL190／全部網站內容／301物件精確，charged0、closed／sealed／pending0、外連0、程序exit0。原失敗測試保留並修正證據解讀，沒有冒稱立即GC或provider記憶體下降。

合併cleanup的候選尚待原生保存／重啟驗收，前輪完整編輯記憶體141–143MiB仍未解決。0雲端請求／部署，正式Pages／原視覺不變，全案目標保持active。詳見experiments/cloudflare-wordpress/boot-cleanup/README.md。


## 預配置候選已完成完整來源與原生保存驗收（2026-11-22）

冷啟動候選已從82來源／109vendor／9assets重新建置，型別檢查及Wrangler dry-run exit0。實際bundle39ea2670…逐字只含兩處預期修改，五個二進位模組精確，未混入診斷barrier。初次tsconfig造成的額外輸出差異已隔離並保留；第二次匹配原設定建置通過。

實際繁中原生編輯／單次儲存草稿／完整workerd關閉重啟／新分頁重讀／登出通過。十段內容及新增修訂精確，原session／usermeta、媒體與主題不變；獨立備份304物件／298檔及full materialization核對精確。最終LOCAL190、charged450,147／27puts、closed／sealed／pending0、程序exit0，cloud仍181。

runtime例外0。捕捉一筆global-styles GET403／rest_forbidden_context，對應固定核心edit-context權限分支，未放寬權限或歸因以前的未知錯誤。完整原生流程的最大觀測組成合計約141.1／142.5MiB，仍不能證明Cloudflare128MiB可用；本機不強制此限額，數字也不是provider尖峰。中央候選未採用、0雲端請求／部署，正式Pages／原視覺不變。

接續損壞ZIP／串流失敗保護與完整編輯流程記憶體定位。全案A01–A20、長期免費、providerCPU／記憶體、實體IME等保持未完成。詳見experiments/cloudflare-wordpress/preallocated-native/README.md。


## 冷啟動記憶體候選已有實測（2026-11-22）

用獨立LOCAL191備份只請求登入頁，七點量測定位ZIP雜湊的約6MB副本，以及縮檔先複製18.2MB再減少8.6MB容量的行為。隔離候選改為預配置檔案後串流解壓及直接對view算SHA；真正PHP8.3.36核對2,154核心檔案及8邊界檔的SHA／大小／mode完全一致，4個digest view案例也通過。

完整冷啟動原版／候選七點最大可觀測合計152,670,619→126,015,978bytes（約145.6→120.2MiB）。兩副本皆登入GET200、301物件與全部網站內容精確、charged0、LOCAL191、closed／sealed／pending0／程序結束。這是有診斷停頓的本機單一配對，不是連續雲端尖峰、穩定加速或編輯器驗收。

候選只在診斷bundle與交付patch，中央82來源／20設定／loader未改，0 provider請求／部署，正式Pages及原視覺不變。保留2次Inspector診斷500及工具檢查失敗；沒有放寬權限。接續完整來源建置，再驗原生繁中編輯／保存／重啟後評估採用。雲端最後181／pin16／餘62,344未刷新；完整目標active、PR4 draft。詳見experiments/cloudflare-wordpress/cold-boot-preallocation/README.md。


## 本機記憶體限制及量測校正（2026-11-22）

固定workerd來源與4組最小實驗確認本機允許160MiB，old-space128參數不等同Cloudflare整體限制；CDP backing欄位計入一般ArrayBuffer，卻漏掉受控WASM配置。沒有強制GC、沒有WordPress或provider請求，所有程序結束。首次Inspector timeout與交付版清理失敗路徑尚未注入驗證均保留說明。

依此離線重算3份既有原生觀測，最大可觀測組成合計158,375,959／160,263,121／156,250,858bytes，並非provider精確尖峰。獨立還原首個已分類asset前已見153,273,865bytes；下一步優先量測冷啟動解壓及compaction前後。舊117MiB快照已包含PHP，不能再加；39.5%累計JS分配下降未解決記憶體驗收。

只新增3工具及分析證據，82來源／20設定／已採用研究loader未變，正式Pages及原視覺不變。雲端最後仍181／pin16／餘62,344，未刷新；0部署、無付費。功能保存／還原證據保留，免費可行性／provider資源／實機及完整驗收仍開放，目標active、PR4 draft。詳見experiments/cloudflare-wordpress/local-memory-limits/README.md。


## 獨立原生還原通過，路徑優化納入研究建置（2026-11-22）

從前輪LOCAL191 materialized full pack建立全新空環境，原生登入、十段繁中草稿、11筆修訂及209差異畫面可用；原生登出後全部原session／正文／修訂／媒體／主題精確。最終LOCAL198、301物件／298檔，198,548bytes／21puts、closed／sealed／pending0／程序結束，只變edit_lock與options序列802→812。

另以同一bundle的固定只讀core JS，在未執行PHP／未載入網站資料下，主動取消在途請求重現「Network connection lost.」；前後完整下載SHA精確。這證明可由客戶端取消觸發，不能倒補先前8筆的原因。自然跳轉原生流程exception0，但保留1筆未捕捉路由的REST403，沒有隱藏或放寬權限。

中央研究generator及產物正式採用已驗證的單行路徑優化，完整SHA等於前輪測試候選；check不改檔、未知產物拒絕、歷史generator／12個凍結模組可回復。82來源與20設定不變，雲端／正式Pages不部署。接續記憶體峰值與繁中初始化收斂；provider／長期免費／實體IME及完整驗收仍開放，目標active、PR4 draft。詳見experiments/cloudflare-wordpress/materialized-native/README.md。


## 候選原生儲存、完整重啟與資料核對（2026-11-22）

單行路徑候選已由原生Gutenberg修改繁中段落並儲存：1869bytes精確、草稿狀態；dispose整個workerd、確認連接埠關閉後，以同一持久資料與寫窗重啟。state／正文／預算精確，新instance已確認；原生冷重開仍有修改內容、已儲存及11筆修訂。原生登出後原session全保留、新session移除。

封存後核對因WordPress正常浮動草稿日期更新觸發過嚴assertion；已對照固定核心5356–5371行，唯讀匯出後離線精確驗證。LOCAL191、304物件／298檔獨立import與full materialization一致，500,144bytes／30puts、closed／sealed／pending0、程序結束。只有指定草稿、revision209、edit_lock及序列更新，其餘資料精確。

227個完成請求沒有HTTP錯誤，但登入階段捕捉8筆「Network connection lost.」，無stack，原因與先前未分類例外關係仍未證明。中央runtime／正式官網／雲端未變，Cloudflare請求與部署0；未宣稱provider記憶體／持續免費／實體IME驗收。下一步定位例外及獨立還原讀回；目標active、PR4 draft。詳見experiments/cloudflare-wordpress/path-save/README.md。


## 路徑處理單行候選與原生配對量測（2026-11-22）

從JS分配樣本定位FS.lookupPath每段重做正規化；候選只改成已處理片段的字串串接，不快取節點、不改檔案權限或PHP/WASM。固定PHP的1,876案例逐項與原版一致，涵蓋symlink／mount／cwd／改名刪除及PHP繁中讀寫。完整來源兩次dry-run輸出只差1條statement、5二進位模組相同。

兩份新本機181備份各完成三次原生畫布與登出；採樣窗8請求順序／method／status／version精確相同。累計JS抽樣歸屬103,185,812→62,450,276bytes（約少39.5%），不是整體記憶體／雲端尖峰或穩定加速結論。配對副本各LOCAL190、304物件／298檔精確、closed／sealed／pending0／程序結束；只變edit_lock及options序列。原例外未重現，仍未分類。

中央runtime／正式Pages／原視覺不變，0Cloudflare請求／部署；原型只在獨立候選。下一步驗證候選正文儲存與完整重啟重讀再評估採用。雲端最後仍181／pin16／餘62,344，不重開完整雲端寫入。全目標active、PR4 draft。詳見experiments/cloudflare-wordpress/path-join/README.md。


## 原生編輯器保留記憶體已核對（2026-11-22）

同雲端181／97a92c8固定模組，本機同程序原生draft193三次畫布皆十段及已儲存；首／第三次快照self_size為116.92／117.03MiB，backing增量0、self增113,668bytes。實際物件關係證明70.875MiB PHP buffer已計入快照，不可重複相加；CDP backing單值亦不可當整體用量。快照可能GC，不是provider尖峰、128MiB或長期免費驗收。

LOCAL189、399,692bytes／24puts，closed／sealed／pending0／程序結束，獨立304物件／298檔精確。只變既有edit_lock及options序列，其餘內容／修訂／原session／媒體／主題精確、新session移除。209請求皆低於400，但保留1個未分類workerd例外；工具未捕捉細節，不能宣稱零例外，亦未做保存／IME。

82來源／20設定不變、Cloudflare請求／部署0；正式Pages／原視覺不變。雲端仍是最後16:52:39.597Z讀值181／pin16／餘62,344。下一步補足私人例外觀測並分析PHP期間分配；完整目標active、PR4 draft。詳見experiments/cloudflare-wordpress/retained-native/README.md。


## 原生命令選單REST403已定位（2026-11-22）

同雲端181備份／97a92c8固定程式的新本機副本：編輯者開命令選單後global-styles/:id?context=edit回403／rest_forbidden_context。實際editor角色無edit_theme_options，三個固定核心檔案及官方權限判斷吻合；不放寬權限或隱藏回應。課程搜尋與真實課程畫布、draft193十段及登出均通過。上一輪缺路由的403只能據此推論，未倒補原證據。

LOCAL190、465,316bytes／27ops，closed／sealed／pending0／程序結束；305物件／298檔獨立備份精確，全部原session保留、新session移除。正文／修訂／媒體／主題未變；列明正常編輯鎖、命令偏好、兩項序列和class.md完整性標記變更。224請求含1個已分類403，捕捉exception0，無內容保存／IME驗收。

Cloudflare請求／部署0，82來源／20設定未改。正式Pages／原視覺不變，雲端仍是最後16:52:39.597Z讀值181／pin16／餘62,344。接續受控PHP／保留記憶體與唯讀用量分析；全目標active、PR4 draft。詳見experiments/cloudflare-wordpress/rest-route/README.md。


## 原生繁中編輯器本機記憶體／延遲量測（2026-11-22）

以雲端181獨立備份與固定97a92c8模組，完成真實Gutenberg兩次載入、管理員網站編輯器及兩帳號登出。原10段／10修訂可見；PHP heap最高72.5MiB，編輯器HTML1345／1339ms、網站編輯器1153ms。這些是本機單次樣本，不是整體isolate、雲端CPU或畫布就緒效能驗收；保留1筆未定位REST403。

本機191／304物件／298檔獨立備份精確，496,779bytes／30ops、closed／sealed／pending0／程序結束。內容／修訂／媒體／主題不變；只變edit_lock、過期管理員session及options序列。29筆移除session全部已過期，未過期原session精確保留、兩次新登入移除。原過嚴session相等檢查失敗及後續唯讀稽核紀錄全部保留。

Cloudflare請求0、82來源／20設定未改，正式Pages／視覺不變。雲端最後讀值仍是16:52:39.597Z的181／pin16／餘62,344，不可拿本機191替代；不得新開完整雲端寫入或加額度。下一步定位403及受控PHP／保留記憶體分析，整體Free／實機／IME仍未驗收。詳見experiments/cloudflare-wordpress/editor-profile/README.md；目標active、PR4 draft。


## 私人雲端舊碼回復／原生冷讀已通過（2026-11-22）

以固定67dd308模組實際部署私人Worker：登入179／保存180／再次部署與cold REST讀回180／原生登出181；588,564bytes／13puts，原15pins保留、新增第16pin，API獨立備份303物件／298檔精確。原session及內容／媒體／主題一致；比本機多49bytes已核對為revision208的雲端GUID較長。

最後16:52:39.597Z讀回181、revision9e732918-4430-4381-8275-fee800f414cb、餘62,344、closed／sealed／pending0／fence釋放／publisher paused，Worker aa595610已回相容reader、額外旗標全關。172觀測事件outcome ok／無exception，保留2個404；PHP heap64–68.25MiB不是整體isolate或CPU。正式Pages／原視覺不變，未增加總額度或付費。

剩餘額度低於已量測登出成本，不能重跑完整雲端寫入。接續最新181備份做本機繁中初始化／Gutenberg記憶體及延遲分析、唯讀用量觀測；長期Free／實機／IME等完整驗收仍開放。詳見experiments/cloudflare-wordpress/old-provider-native/README.md。目標active、PR4 draft；以下保留歷史。


## 真正舊版部署套件已建置及本機驗證（2026-11-22）

舊source67dd308的77來源／109vendor／9資產核對後，以真實production entry完成Wrangler dry-run；新輸出沒有localhost gate。對這份輸出再驗原生登入179、保存180、完整程序重啟讀回180、登出181，588,515bytes／13puts，原內容／session與獨立303物件備份一致。全為本機、外連0，closed／sealed／pending0及程序結束；未部署舊碼。

雲端維持前述178／pin15／餘650,908及8c615f36相容reader，不能拿本機181替代。來源82／設定20未改，新增建置／本機驗證工具，PR4 draft。下一步刷新現況後準備受限provider原生流程；效能／初始化／實機／長期免費尚未驗收。詳見experiments/cloudflare-wordpress/old-provider-artifact/README.md；以下保留歷史。


## 私人Cloudflare復原177→178完成並封存（2026-11-22）

實際provider HTTP採用通過：432,931bytes／7puts，含獨立備份與封存70,992ms；原14pins保留，新增目標第15pin。API獨立下載8相依物件／2,802,244bytes，再匯入303物件／298檔，原內容／媒體／主題完全相同。觀測164事件皆outcome ok、無exception，保留160個200／4個404；未測PHP編輯與provider故障注入。

最後16:22:24.269Z核對coordinator178／commit receipt／R2 current.json精確一致，餘650,908、closed／sealed／pending0、fence解除、publisher paused。最後私人Worker版本8c615f36-9771-4798-834e-df40df63fdf9，臨時recovery及其他optional writer旗標都關；相容reader保留。Workers Free/$0與R2本期$0.00已在登入管理頁確認，帳單可能延遲、DO詳細用量未刷新。

本輪82來源／20設定不改、沿用95測試，新增3工具＋source-plan與provider證據；最初OAuth401已正常refresh，失敗log保留，未新增權限。僅兩次私人部署，正式Pages與視覺不變，無加總額度／付費／退款／刪歷史pin。新起點是178／pin15／餘650,908，勿重跑177採用。下一步準備真正舊source相容部署及受限原生流程；效能／初始化／長期免費／實機完整驗收仍開放。詳見experiments/cloudflare-wordpress/recovery-provider/README.md；完整目標active、PR4 draft。以下保留歷史。

## 完整HTTP復原採用已在實際本機Worker驗證（2026-11-22）

新增operator有界讀取與pointer CAS：核對owned fence、協調器目標版本、來源／目標receipt及pins，再以精確來源與ETag條件更新；第三方值不覆寫。client持久記錄固定operationId與plan binding，保存完成後才送HTTP，foreign receipt不能結清；unknown仍保留pending。功能預設關閉、20設定不變。

95項（93回歸＋2client）與tsc通過。實際177備份在5個新本機HTTP副本／5次完整程序重啟，驗證正常、採用後未送pointer、pointer回應遺失、結清失敗及R2未知。各432,931bytes／7puts；前4個closed／sealed／pending0，最後1個雖DO與R2都178仍pending1、拒封存。303目標物件驗證、2原fixture pins保留並新增第3個；非live14pins/provider故障。所有程序結束、外連0。

本輪2個runtime檔修改、總82來源；正式Pages／原視覺不變、未部署／退款／放寬雲端額度／刪pin。PR4 draft、完整目標active。下一步刷新私人Cloudflare狀態及Free餘量，再評估受限provider採用／回退驗證與後台效能測量。最後雲端177／pin14／餘1,083,839仍為11/21 14:24:49Z舊讀值，不能拿本機178代替。詳見experiments/cloudflare-wordpress/recovery-adoption/README.md；以下保留歷史。

## 復原上傳端點已接入，本機 workerd 中斷／重啟通過（2026-11-21）

新增預設關閉、僅限 private session-audit／restore-v1／default 的 operator 端點。固定 operationId 綁定 key／size／SHA；reservation 與 receipt 同交易保存，R2 確認後再以同交易結清自有 ticket。相同 ID 不重送；reserved／confirmed 才可接續，dispatching／unknown 保留 pending。只接受有界不可變物件，不更新 pointer；既有額度、窗口、封存與保守扣帳不變。

17 新測試加既有共85項與 tsc 通過。實際 outer Worker＋coordinator＋SQLite Budget＋本機 R2 完成5情境／5次完整程序重啟：已結清後回應遺失、confirmed後結清失敗、未dispatch可接續；R2結果未知／完成紀錄未保存仍pending1，拒絕封存。兩個pending1僅是已停止本機副本，非雲端；所有程序結束、外連0。這是本機邊界例外注入，不是provider故障保證。

2來源修改／1新增，現82來源；20設定不變，功能未開、未部署。正式Pages／原視覺不變、PR4 draft、完整目標active。最後雲端177／pin14／餘1,083,839仍是14:24:49Z舊讀值。尚缺pointer CAS端點及整段採用transport，下一步先本機整合；延遲／初始化／整體記憶體CPU／長期免費與實機驗收繼續。詳見experiments/cloudflare-wordpress/recovery-uploads/README.md；以下保留歷史。

## 採用程序與故障模型完成，未知R2寫入仍須權威完成證據（2026-11-21）

新增固定plan／hash、fence／window／budget檢查、原pin保留、目標依賴重驗、不可變物件不覆寫及條件式pointer程序。分別核對協調器、提交receipt、R2 current.json；既有coherent狀態不比對R2 pointer。回應遺失先讀回，協調器已178但R2仍177可只續pointer，不重送採用或倒退版本。

17合成測試通過，並以實際177備份做4個記憶體模型；使用實際coordinator／pin／budget類別，底層非workerd/provider。三個完成模型各432,931bytes／7puts、pending0／closed／sealed，兩個原fixture pin保留、新增第三個。第四個R2已寫196bytes但結果不明，保留charged196／pending1、原177不變；關窗成功但不能封存，不因物件存在或actor重建就清pending。這是停止保護通過，未知寫入復原未完成。

尚缺真正遠端有界上傳／操作receipt與安全結清自有ticket入口。下一步先實作本機端點與中斷驗證；不把模型當雲端採用完成。81來源／20設定不變，0Cloudflare請求／部署，正式Pages／視覺不變、PR4 draft、完整目標active。最後雲端177／pin14／餘1,083,839仍是14:24:49Z舊讀值。本機模型178不可當遠端起點。詳見experiments/cloudflare-wordpress/legacy-adoption/README.md；以下歷史。

## 較小的舊版相容回退與受限原生流程通過（2026-11-21）

新增離線compressed→plain content-v1轉換，沿用完整base、產生新identity、保留298檔原始內容；5項測試及303物件獨立匯入通過。轉換集合推算432,931bytes／7puts，較完整回退2,729,308小，未操作雲端。

實際舊67dd308在新本機副本／真正gate與650,908bytes窗口，登入179、單次保存180、完全重啟讀回180、登出181通過。含封存18,715ms、588,515bytes／13puts，餘62,393，closed／sealed／pending0。第十段繁中及修訂208精確，原207、其他內容／媒體／主題與全部原usermeta／5個session逐位元保留，本次session移除；無前輪cookie偏好差異。最終正文metadata／SHA、單調序列、獨立備份與實際舊pin reader冪等核對通過。程序結束、外連0。

推算轉換＋實測native共1,021,446bytes／20puts，餘量僅62,393；兩者不是同一雲端測量，不保證遠端採用。下一步準備有界採用與失敗保留原pointer程序，並繼續後台效能／記憶體／CPU、長期Free及實機研究。81來源／20設定不變，0Cloudflare請求／部署，正式Pages與視覺不變、PR4 draft、完整目標active。雲端177／pin14／餘1,083,839仍為14:24:49Z舊讀值，本機181不能當遠端起點。詳見experiments/cloudflare-wordpress/legacy-content/README.md；以下為歷史。

## 舊來源本機回退／再升版通過，保留工具差異（2026-11-21）

舊67dd308直接讀壓縮清單時登入與operator皆500；相容reader下以fence採用完整快照，沿用177拒409、前進178通過且298檔精確。舊來源單次保存180、完全重啟讀回及登出181，再升b5eec65原生讀回／登出183。新增繁中第十段及修訂208精確，原207／其他內容／媒體／主題及原5個session保留；本次session移除。最終299物件／298檔獨立備份精確。

工具曾漏認單引號登出連結，第一份180保留新session、未重送保存。第二份HTTP工具重送過期cookie造成兩筆本機偏好39／40，已定位與保留，不宣稱全部usermeta精確。新版接續改用到期cookie處理；原生流程只有wp_options序列789→797，其餘181檔案精確。早期工具／平台預檢失敗全部保留；2個既有logout parser測試通過。

完整回退ZIP2,296,404bytes，集合推算含新增原始物件與pointer共2,729,308bytes／8puts，超過最後雲端餘1,083,839。這不是遠端inventory／實際計帳；0Cloudflare請求，未部署／加額度／付費／清歷史。雲端177／pin14／af985705仍是14:24:49Z舊讀值，未刷新。本機183不可當雲端起點；相容reader保留。81來源／20設定不變，正式Pages與視覺不變、PR4 draft、完整目標active。下一步離線研究較小的plain content-v1相容回退，尚未實作。詳見experiments/cloudflare-wordpress/old-source-rollback/README.md。以下是歷史。

## 私人免費 Cloudflare 完整保存／跨部署／登出與獨立還原通過（2026-11-21）

在既有audit Worker完成兩次autosave、單次保存檢查點175、重新部署後九段原文精確讀回176、原生登出177。353,048ms用797,202bytes／48puts，餘1,083,839；closed／sealed／pending0、fence解除、publisher paused。獨立304物件／298檔備份與轉完整格式再讀逐檔一致；修訂207及其他頁面／媒體／主題精確，原5個session完整保留、本次session移除；保留13pins並新增第14個。

登出後一筆PHP AJAX400、3個canceled事件及部署期間外層首頁404全部保留。未捕捉到記憶體／CPU exception，但不能宣稱零HTTP錯誤、整體isolate／CPU量測或長期免費完成。controller client曾讀到半寫入reply；檢查同command成功封存後繼續，未重送。client修正及2測試通過，另5項observer測試通過。

三次部署只限私人Worker；最後af985705於14:24:49Z核對新writer／heartbeat旗標已關、資料177／pin14／餘1,083,839不變，保留新格式相容reader，不能直接回舊67dd308。Workers Free與R2當期$0已查閱；無付費／加額度／清歷史。正式Pages與現有視覺不變，PR4 draft、完整目標active。81來源／20設定未改，108+tsc是前輪證據。下一步離線定位登出後事件與驗證舊來源實際回退；詳見experiments/cloudflare-wordpress/envelope-provider/README.md。以下是歷史。

## 壓縮清單完整本機流程完成，登出後解鎖400已獨立重現（2026-11-21）

b5eec65實際runtime／gate／budget的新Chrome副本，完成兩次autosave、單次保存175、完全重啟後九段精確重讀與原生登出178；原有5個session保留，本次session移除。含封存／備份307,281ms用847,368bytes／51puts，餘1,033,673，closed／sealed／pending0。其他內容／修訂／媒體／主題及304物件／298檔獨立備份、轉舊完整格式再讀均精確。17份清單399,591bytes，相同JSON共1,258,493bytes。

完整流程登出後有一筆other AJAX400且沒有新版本；獨立短流程明確捕捉wp-remove-post-lock400在登出後到達，全部原usermeta/session精確恢復、正文不變，固定SHA的WordPress core也支持無匿名handler回400。原完整流程action仍是推論，兩筆400保留，不宣稱零HTTP錯誤。第一份本機副本因agent操作耗時先到期，餘784,245bytes，未完成登出；其expired／封存狀態及證據保留，後續使用全新副本，未重開舊窗口。

10個本機工具及證據已交付，runtime來源／20設定不變，前輪108檢查與tsc未重跑。所有程序／自有分頁關閉、外連0。下一步刷新私人Cloudflare狀態並評估一次同限制完整provider驗證；本機不能證明provider記憶體／CPU／長期免費。正式官網與視覺不變，未部署／付費／加額度／清歷史；雲端161／pin13／餘1,881,041仍是06:28:14Z舊讀值。PR4 draft、完整目標active。詳見experiments/cloudflare-wordpress/manifest-workflow/README.md。以下保留歷史。

## 完整清單壓縮已接入，本機WordPress保存與還原通過（2026-11-21）

新增有界gzip-base64清單格式，保存端、兩個冷reader、圖片／主題、前版cache核對及備份／pins已接入。封套旗標預設關閉，20設定不變；完整base保留plain，信任錨使用實體清單SHA。108項相關檢查（25新格式）及TypeScript通過。

新本機原生HTTP流程162→166：保存163後刻意遺失回應，完整重啟讀回精確，重試164沒有額外修訂；獨立備份、轉完整格式、停用封套後plain保存165與停用content writer後full保存166均冷讀通過，其他原始資料／媒體／主題一致。清單74,029→23,511bytes，內容gzip24,868，兩物件合計48,379bytes；不含pointer／coordinator，不代表整段容量。程序已關閉、外連0。

上一輪完整browser流程登出容量失敗仍有效。下一步以新owner／相容工具跑完整Chrome／gate／budget，確認登出與封存餘額；尚未做新版整段流程、provider CPU／記憶體／長期Free或實際舊source回退。正式官網與視覺不變，未部署／付費／加額度／清歷史。雲端161／pin13／餘1,881,041仍是06:28:14Z舊讀值，未刷新。PR4 draft、完整目標active。詳見experiments/cloudflare-wordpress/manifest-envelope/README.md。以下保留歷史。

## 壓縮後原生保存與重開通過，登出容量不足（2026-11-21）

新的本機 Chrome 副本使用實際 gate／budget，600秒／1,881,041bytes／96操作不變。兩次 autosave、一次手動保存176及完整重啟後九段內容讀回通過；離開編輯器 AJAX 與登出各503，完整流程未通過。458,824ms用1,858,811bytes／56puts，餘22,230，closed／sealed／pending0；沒有重送、加額度、退款或清歷史。

本機161→179，正文／修訂207精確，原生冷啟動移除autosave206與footnotes76；其他資料與原有5個session精確，本次新session仍留在停止的本機副本。304物件／298檔完整備份、獨立開啟與轉舊完整格式再核對精確。程序與自有分頁關閉，runtime外連0。這次包含agent操作延遲，不能推論所有更快使用者流程必敗。

18份完整清單佔charged bytes約71.7%，成為下一個寫入來源。74,029bytes清單離線gzip可到17,266bytes，但尚未實作相容格式；接下來驗證有界清單編碼與所有reader／cache／backup／pin／rollback，再測完整流程。78項整合測試屬前輪，這輪來源未改、沒有重跑。未做provider或正式切換，雲端161／pin13／餘1,881,041仍是06:28:14Z舊讀值。詳見experiments/cloudflare-wordpress/compressed-budget/README.md；完整目標active。以下是歷史。

## 壓縮快照已接入本機候選，原生 HTTP 與還原通過（2026-11-21）

Reader／writer、metadata-only Markdown、完整 fallback、備份圖／pins／下載器已接入；精確旗標 content-gzip-v1 預設關閉，20 設定不變。78 項測試（19 新整合）與 TypeScript 通過。gzip／manifest 失敗不回傳新 pointer；無變更不寫入，原始媒體／主題副本保留，retention 仍拒絕新格式。

新私人本機副本：登入 162、真實 WordPress REST 保存 163，成功回應刻意遺失後完整重啟讀回繁中；同內容重試 164 無額外修訂。獨立備份、完整舊格式 materialize、停用 writer 後 165 完整 fallback 與冷讀均通過；外連 0，程序關閉。單次 gzip 24,866＋manifest 74,029＝98,895 bytes，不含 pointer／coordinator，尚非整段瀏覽器／gate／budget 或長期免費驗收。

下一步以新本機瀏覽器副本驗證完整登入、自動／手動保存、重啟、登出及封存，量測真實 gate／budget 總額。上一輪完整瀏覽器容量失敗仍是有效紀錄，不能以本輪單次縮小宣稱已解。未做 provider 部署、付費或正式切換；雲端 161／pin13／剩 1,881,041 bytes 仍是 06:28:14Z 舊讀值。PR #4 draft，完整目標 active。詳見 experiments/cloudflare-wordpress/compressed-runtime/README.md。以下是歷史紀錄。

## 壓縮快照原型與獨立還原通過，尚未接入（2026-11-21）

新增未接線的compressed-content模組；原有78來源、20設定不變。明確新schema與獨立gzip物件，保留原始清單／時間／鎖／session／修訂／ID；有界1MiB／64項差異、8MiB完整base與final，解壓超過精確長度即拒絕。24項測試與TypeScript通過；先複製再hash回歸防止呼叫端重用buffer影響已核對資料。

真實停止後175資料的5檔差異359,284bytes→26,225bytes，manifest另74,029bytes。四依賴物件獨立副本逐項還原298檔，並轉現有完整包、獨立匯入精確；原頁不變、autosave206精確。最終本機workerd冷讀／重新壓縮／重讀通過且壓縮包SHA與獨立備份相同；2MiB超量輸出被360,087bytes上限拒絕。沒有WordPress原生編輯流程使用此格式，也不是全流程節省、CPU或whole-isolate驗收。

下一步整合reader／writer、完整fallback、raw資產副本、備份／pins與回退，再量測完整原生流程。舊讀取器及pin拒絕新schema，不能直接啟用。0雲端請求、未部署／未付費，正式Pages與視覺不變；雲端161／pin13／餘1,881,041bytes仍是06:28:14Z舊讀值。PR4 draft、完整目標active。詳見experiments/cloudflare-wordpress/compressed-content/README.md及INTEGRATION.md。以下為歷史。

## 完整本機瀏覽器流程遇到容量保護（2026-11-21）

實際d754dacd心跳選項搭配外層私人gate、真實容量計帳與1,881,041bytes窗口，原生繁中登入、偏好切換與兩次autosave成功，但單次手動儲存503，稍後autosave也503；未重送，未完成重開或登出。253秒後封存，本機161→175、1,860,844bytes／49puts、餘20,197bytes、pending0。五個心跳間隔約30秒，仍不足以在最後確認的provider剩餘量內完成此流程。

離線確認原頁面未覆蓋、autosave206完整保存新文字、失敗手動revision207不存在；其他內容／修訂／媒體／主題一致，原5個session完整保留，本次本機session仍在。第二次autosave僅改日期仍寫322,462bytes posts表加73,740bytes清單。四檔gzip樣本逐位元可逆，posts表縮為19,405bytes；這尚未實作為runtime格式，不能當完整流程節省或CPU／記憶體驗收。

不安排同方案provider重跑。下一步研究有界無損儲存與相容讀回／備份／還原，保留原生時間、鎖、修訂及ID。所有程序與自有分頁結束；78來源、20設定未變，本輪0Cloudflare請求。最後雲端仍是06:28:14Z的161／pin13／餘1,881,041bytes，未刷新；正式Pages／視覺不變、PR4 draft、完整目標active。詳見 experiments/cloudflare-wordpress/heartbeat-budget/README.md 與 cloudflare-heartbeat-budget-summary.json。以下為歷史。

## 原生心跳政策接入 runtime，本機整合通過（2026-11-21）

新增預設關閉的 PLAYTT_EDITOR_HEARTBEAT=native-30s-v1，政策內容與前輪原生 UI 候選完全相同；只在 post.php／post-new.php 設定至少 30 秒並保留較高既有值。冷啟動與初始建站路徑均傳遞設定。暖啟動切換只重寫 runtime 自有的政策檔，不丟棄 PHP，避免遺失已回傳 ID、但尚未提交的新草稿。

完整 pinned Heartbeat 核心的 9 項測試，加讀回／快取 19 項，共 28 項通過；24 個真實 PHP hook fixture 情境通過。原生 WordPress HTTP 通過預設停用、未知旗標停用、既有／新編輯頁啟用、個人頁不受影響、同 PHP 切換設定、新草稿 206 保留與既有正文精確、登出；另一個獨立冷啟動從第一個請求即啟用也通過。不是本輪瀏覽器／provider 驗收。

保留測試失敗紀錄：首輪工具誤讀區塊編輯器 ID 格式；次輪到達精確讀回後未辨識單引號與實體編碼的登出連結；修正後第三個本機副本通過。既有 getRuntime 測試補齊新增依賴並新增防丟稿回歸測試。所有程序結束，外連 0。

核心 connectNow 仍能立即連線及排下一次立即請求；因此 30 秒不是硬性限流或容量保證。背景分頁仍採核心 120 秒排程，模擬測試不等於真實 OS 暫停／斷線驗收。原有寫入窗口不可移除。

TypeScript、dry-run、25 個已採用階段加 13 個選用階段重新組裝通過，78 來源／142 輔助檔一致、20 份交付設定不變且無新旗標。初次封裝把額外未交付的 local config 也算入 20 份而中止；修正為精確比較交付清單後，在新目錄完成重建。未部署、零 Cloudflare 請求；前輪雲端 161／pin13／餘1881041 bytes 是 06:28:14Z 讀值，未刷新。正式 Pages／視覺不變、PR4 draft、完整 A01–A20 active。詳見 experiments/cloudflare-wordpress/editor-heartbeat/README.md 與 docs/verification/cloudflare-editor-heartbeat-summary.json。

## 本機定位背景快照，30 秒原生心跳候選通過（2026-11-21）

使用已驗證備份 161，只在本機登入、開草稿與停留，確認五次連續心跳各僅改 postmeta 72 的編輯鎖，每次 14775 bytes 資料表加 73740 bytes manifest；間隔約 10 秒。另兩次只增加 wp_options ID 計數，尚未追到 SQL 來源，未略過保存。本機結果不能反推所有歷史 provider 單物件事件。

只在本機 bundle 注入原生 heartbeat_settings minimalInterval 30 秒；五個穩定間隔為 30001–30027 ms。Chrome 原生編輯新增第九段、保存一次到 168；完整重啟後全文／區塊碼精確。另一個瀏覽器的 admin 被原生鎖阻擋，接管後舊編輯者收到保護對話框，兩者登出後本機 187。修訂 206、接管 autosave 207 與 footnotes 76 皆正確，其他內容／媒體／主題一致。admin 的 28 個過期 session 由核心清除，32 個有效 session 與使用者 2 的 5 個原有 session 精確保留；本次登入 session 已移除。

第一次候選測試把核心輸出的字串「30」錯判為未生效，編輯前中止並確認本機埠關閉；後續 scope helper 確認設定並完成驗證。這是測試型別假設錯誤，證據保留。背景鎖定／nonce 通知較原 10 秒慢，未改到期規則或保存路徑；兩流程時長與操作不同，不宣稱整體容量或速度固定改善比例。

本輪零 Cloudflare 請求，77 runtime 來源與 20 設定不變，正式 Pages／目前視覺不變。雲端 161／pin13／餘 1881041 bytes 為前輪 06:28:14Z 讀值，未刷新。新增 background-write 本機工具包與完整比對證據，來源檢查不重複跑；首次部署整合、背景／斷線邊界、whole-isolate 記憶體、長期免費與實機仍待。完整目標 active，PR4 draft。詳見 experiments/cloudflare-wordpress/background-write/README.md 與 docs/verification/cloudflare-background-write-summary.json。

## 私人原生編輯保存與接續重開通過；首次窗口容量不足，pin13（2026-11-21）

67dd308來源暫部署fdc7f590，Chrome繁中原生編輯器新增一段、按一次儲存並顯示成功。原生autosave204及正式修訂205正文皆精確，但首次重開遇到窗口容量保護；420秒／3MiB／96操作實用3109160bytes／82puts，僅餘36568bytes。不是操作次數用完，也不能將一次手動保存當成整個瀏覽器只有一次寫入。已關窗封存，獨立完整備份154／pin12通過。

以新的180秒／1.5MiB／48操作窗口接續既有資料，只重開與登出，不重送保存。八段可見文字逐段一致，原生登出成功；實用945529bytes／24puts，結束161。再次完整下載、獨立匯入與完整包轉換逐字通過，298檔／303物件，pin13保留所有舊pins。原生核心按既有規則清掉已過期autosave204及footnotes75，正式修訂205和正文不變；本次session已移除、登入前5個session精確保留。pin檢查曾誤設「全部session應為空」，在本機即停、未送註冊；修正為登入前130精確比對後通過。

診斷由同一控制程序與窗口協調，每個操作前challenge驗證真實程序仍存活與期限；4項工具測試通過。兩輪540事件，主流程35trace中33完成、2個manifest寫入失敗、2個canceled；接續11/11完成、1個canceled，皆無觀察到exception。不隱藏第一次容量失敗。檔案副本峰值366280bytes、追蹤含response峰值1239624bytes、WASM取樣76152832bytes，均非whole-isolate峰值。平台事件可能含多個請求trace，不能直接宣稱某個時間就是按鈕保存耗時或穩定加速。

最終部署9f5aa2c1保留有界寫入相容來源，實際content/readback旗標皆移除；20設定不變。06:28:14Z只讀核對161／3021e7bd、13pins、closed/sealed、pending0、fence解除、publisher paused、剩1881041bytes；沒有提高150000000總額度、退款或清除歷史。最終部署後未再做原生內容請求，這項不冒充已驗證。所有程序／自有測試分頁結束，Workers方案刷新仍Free／$0／Current plan。

新增12工具可重建77來源／131輔助檔；runtime來源未再改，125項來源測試沿用。下一步先在本機找出背景寫入放大原因：36次Markdown持久化中25次只寫一個物件，但目前沒有檔名診斷，不能推定是哪個檔案或任意跳過ID／鎖／session保存。不要重複消耗剩餘provider額度。下一窗口接 `playtt-markdown-provider-cold-ui-owned-private.json`，verified備份改接 `playtt-markdown-provider-cold-backup-owned-private.json`（161）。正式Pages及原視覺維持、PR4 draft、完整目標active；證據 `cloudflare-markdown-provider-*`。以下為歷史紀錄。

## Markdown 有界寫入與本機原生瀏覽器通過，尚未部署（2026-11-21）

第12選用候選 `markdown-write/` 先用PHP檢查完整大小清單，再最多4檔、1MiB小檔案窗口並行寫入；大檔單獨處理，保留單檔16MiB／總64MiB及原始bytes／hash，出錯等已開始工作結束。格式、提交與20設定不變。125個不同相關檢查於各次執行通過、TypeScript／dry-run通過；兩個過短等待測試修正後通過。額外廣泛suite有3個既有／環境失敗（兩個舊source regex、缺PHP CLI），沒有宣稱全綠。

備份130的真實本機WordPress保存132、回應遺失後重啟精確讀回、重試133無額外修訂、獨立備份／完整包轉換及回退134再冷啟動通過。Chrome原生繁中後台再以新副本編輯、按一次儲存、完整重啟，八段正文及區塊碼逐字一致；只新增預期204，其他內容／媒體／主題一致。UI登入、偏好與heartbeat另有寫入，結束149只屬本機；雲端仍130。HTTP10/10、UI32/32trace完成，檔案副本峰值約364KB；UI含response的追蹤峰值1207098bytes，均不是whole-isolate記憶體。所有程序結束、外連0。

05:41:13Z四個只讀查詢核對雲端130／pin11、closed/sealed、pending0、fence解除、publisher paused、剩5935730bytes。未部署、未付費；既有1c55f0fa／bbe6a4d來源仍在線。重建25+12階段、77來源／119輔助檔一致，20設定不變。下一步原生瀏覽器provider驗證須把observer存活與窗口期限一起管理，不重跑舊一次性工具補紀錄；完整記憶體、並行、混合版本還原、實機IME與長期免費仍待。正式Pages及原視覺維持、PR4 draft、完整目標active。詳見 `cloudflare-markdown-write-*`；以下為歷史紀錄。

## 物件並行讀取的私人雲端驗證通過；pin11，重新封存（2026-11-21）

候選暫時部署bf3d6b4e，8次原生HTTP完成登入、保存129、一次遺失回應讀回、一般冷讀及登出130。保存4677ms／讀回3118ms／合計7801ms，前次6031／3784／9822ms；兩次段落略異、內容累積與網路變動，不宣稱穩定改善或因果比例。主診斷149事件、7/7trace完成，0觀察到exception／request failure；保存trace4865ms，其中Markdown2356ms、manifest1659ms；讀回冷1538ms，後續一般冷讀3861ms（較前次慢）。取樣WASM73,400,320bytes不是whole-isolate記憶體。

180秒／2MiB／64操作窗口使用669,248bytes／17puts，無完整ZIP寫入，已關窗封存。8GET／2,796,862bytes完整下載，298檔／303物件獨立匯入及完整包轉換逐字通過；僅自有193正文／日期、預期修訂203、鎖72、單調計數改變，其他修訂／帳號session偏好／媒體主題一致。新增pin11，保留前10份。

最終部署1c55f0fa保留並行相容讀取器，實際content/readback旗標皆移除。另90秒／1byte／1操作窗口登入GET200／3271ms、實用0／0，已再封存。該診斷曾ready但03:55:52.688Z已結束，原生窗口03:56:06.520Z才開始，11事件沒有原生外層或PHP trace；這是診斷排程缺口，不能宣稱部署後冷啟動已直接量測。主流程兩次已驗證內容的冷讀有trace，首次登入PHP trace亦缺；一般native路徑本來不附Server-Timing。未重跑僅為補好看紀錄；之後將觀察與操作放同一程序並檢查剩餘期限。

現在130／566e44a3、11pins、closed/sealed、pending0、fence解除、publisher paused、餘5,935,730bytes。最後窗口owner改接content-io-provider-cold，verified備份改接content-io-provider130；舊owner不可重用。所有程序結束。Runtime仍bbe6a4d、無新來源改動，115檢查沿用；補6工具後重建76來源／112輔助檔、20設定不變。下一步改善Markdown逐項寫入，再補原生UI、完整記憶體、並行／混合版本還原、實機IME與長期免費。正式Pages與原視覺維持、PR4 draft、目標active。證據 `cloudflare-content-io-provider-*`，總結明列pass-with-observation-gap。以下為歷史紀錄。

## 差異快照的物件讀取改為有界並行：本機通過，尚未部署（2026-11-21）

第11個選用候選 `content-io/` 僅修改content-overlay來源：同時最多4個替換物件讀取，涵蓋body與雜湊；沿用1MiB／64項上限。觀察到錯誤即停止排新工作，等已開始的讀取結束才回傳錯誤。格式、ID、完整清單順序、舊v1/v2、worker提交與20設定未改。

115項相關檢查、TypeScript與dry-run通過。真實本機WordPress由備份126啟動，登入127、保存128，整個workerd重啟後精確讀回，同內容重試129不多產生修訂；僅新增預期203。獨立備份／完整包轉換一致；停用寫入器後保存130產生完整包，再次冷啟動精確。10/10trace完成，所有程序已結束、外連0。

同一備份的24次本機比較使用相同物件與GET數；每GET模擬25ms延遲時，驗證中位數223.79→124.08ms、還原514.92→433.87ms；無延遲還原303.22→304.08ms。這是人工延遲實驗，不是provider保存或帳單改善，也未量測whole-isolate記憶體。Markdown寫入仍逐項；實際雲端保存約6秒的問題尚未結案。

03:30:27Z四個只讀查詢核對雲端仍126／pin10、closed/sealed、pending0、fence解除、publisher paused、餘6,604,978bytes。這輪不部署／不改雲端資料；現有部署eb809ce8仍是逐項讀取的相容程式。重建76來源／106輔助檔，25+11階段，20設定不變，重複套用先拒絕不寫入。下一步在既有私人額度內驗證候選延遲與完整恢復，再處理Markdown寫入、原生UI、完整記憶體、並行、實機IME與長期免費。窗口仍接content-provider-cold owner，備份仍126；不得重跑舊一次性工具。正式Pages與原視覺維持，PR4 draft、目標active。見 `cloudflare-content-io-*`。以下為歷史紀錄。

## 私人 Cloudflare 差異保存通過，完成第 10 份備份（2026-11-21）

既有 session-audit 暫時啟用候選 b1a01c38。8 次原生 HTTP 完成登入、編輯、一次保存／遺失回應讀回及登出：保存與讀回皆 canonical125，全文一致；後續同 session 一般讀取亦冷載入。登出後126。180秒／2MiB／64操作窗口實用666,810bytes／17puts，無新增完整ZIP，之後關窗封存。相較前次同類流程2,960,342bytes少77.48%，但段落略不同，不能當成費用或效能保證。保存6031ms對前次6073ms，延遲沒有明確改善；讀回3784ms。主診斷130事件、7/7trace完成，未觀察到exception或request failure；WASM heap取樣73,400,320bytes不是whole-isolate量測。

完整下載8GET／2,794,424bytes，獨立匯入298檔／303物件及離線完整包轉換均逐字核對。只改自有193正文／日期、預期修訂202、鎖72及單調計數；舊修訂、帳號／session／偏好、媒體與主題一致。伺服器驗證後新增pin10，保留原9份。封存後部署相容讀取器eb809ce8，實際bindings確認內容／讀回旗標皆移除。最初封存登入GET回503是測試入口假設錯誤，PHP未啟動；另以90秒／1byte／1操作窗口補驗原生登入200，實際0bytes／0操作並再封存。後者只捕捉43個事件與外層請求，沒有PHP DO trace，故不宣稱已直接觀察部署後冷載入。

最終126／c7933a7c、10pins、closed/sealed、pending0、fence解除、publisher paused，餘6,604,978bytes。新下載工具與3項測試通過，既有105項來源測試未因僅新增工具而重跑；76來源、20設定不變，重建102輔助檔。所有測試／診斷程序結束。正式Pages維持、未付費或調額／刪歷史，PR4 draft、目標active。下一步改善R2逐項驗證與保存延遲，並補原生UI、完整記憶體／並行、實機IME與長期免費驗收。下一次窗口須接 `playtt-content-provider-cold-owned-private.json`，備份接content-provider126；不可重用舊window owner。證據 `docs/verification/cloudflare-content-provider-summary.json`。以下為歷史紀錄。

## 小幅內容保存的有界差異快照：本機通過，未部署（2026-11-21）

第10個選用候選 `content-overlay/` 增加獨立儲存格式：完整清單直接引用一份精確完整備份，只保存變動檔案，不串接多層差異。涵蓋內容、資料表、媒體、主題、新增／刪除與空檔；ID與原始位元組保留。累積替換最多1MiB／64個變動或刪除項，超出回到完整包；原v1/v2分類器完全未改，20份組裝設定皆未啟用新旗標。

真實本機WordPress7.1.4從備份122登入→123、保存→124、回應遺失後整個workerd重啟並逐字讀回，重試→125而不多產生修訂。啟用期間無新增完整包，僅新增預期修訂202；其他資料與媒體／主題精確保留。獨立匯入與完整快照轉換通過。停用本機新寫入器後再保存→126，確實產生完整快照並可再次冷啟動。105項相關檢查、TypeScript、dry-run通過，10/10原生trace完成。測試程序均已結束、外連0；未做此格式的雲端或瀏覽器驗收。

單次保存應用資料量390,905bytes，對照相同內容的完整包路徑2,685,575bytes，減少85.44%；不含pointer/coordinator、去重或Cloudflare計費，不能宣稱等比例帳單或延遲改善。舊讀取器拒絕新格式；降版前須先以相容程式產生完整快照。舊retention工具也拒絕此格式，未刪歷史／pin、未調高額度。02:09:40Z只讀核對雲端仍122／9pins、關窗封存、pending0、publisher paused、餘7,271,788bytes。正式Pages與原視覺維持，未部署，PR4 draft、目標active。下一步在既有私人額度內驗證provider保存／完整備份，再處理記憶體、原生UI、實機／IME與長期免費驗收。證據見 `docs/verification/cloudflare-content-overlay-summary.json`。以下為歷史紀錄。

## 私人 Cloudflare 保存讀回通過；旗標已停用並完成第9份備份（2026-11-21）

在既有私人session-audit暫時以CLI旗標啟用已通過本機測試的候選，部署b4e9f561；Cloudflare介面當時仍Workers Free、R2當期$0、2.32GB。以真實原生HTTP登入editor2、取得繁中編輯頁並逐字驗證內嵌middleware，再讓固定7.1.4 api-fetch在Node VM執行一次PUT（核心轉POST），客戶端收到且確認真實提交後才隱去成功本文。隨後一次GET讀回同canonical121／a4d93d57及完整正文，沒有重送寫入。這不是雲端瀏覽器UI或真實伺服器斷線測試。

保存客戶端6073ms、讀回3937ms、兩步合計10022ms；讀回的10秒期限只涵蓋後者。雲端讀回trace2981ms、冷載入且無commit；隨後同session的一般讀取亦冷啟動（trace2354ms），全文一致。原生登出後canonical122／6883819c。180秒／4MiB／64操作上限提前關窗封存，實用2,960,342bytes／18puts，8次原生請求；剩7,271,788bytes。330秒診斷143事件均ok、7/7trace完成、無觀察到exception或request failure；最高取樣WASM heap73,400,320bytes不是whole-isolate量測。

新增203bytes的測試段落仍產生一份2,295,783bytes完整包，保存延遲與完整包放大仍待改善。完整下載、獨立匯入及精確比較通過：298檔／300物件，只改自有193正文／日期、預期修訂201、鎖72與單調計數；其他修訂、帳號、session／偏好、媒體及主題完全相同。保留原8份歷史並新增pin9。備份／pin過程未改canonical或R2計量。

封存後以原設定重部署1075e061；實際版本bindings確認沒有PLAYTT_EDITOR_READBACK，20份設定檔始終未改，來源與bcbc9d9相同。正式Pages與原視覺維持、publisher paused、fence解除、pending0、PR #4 draft、目標active。測試、部署、備份、pin及限時診斷程序均已結束。接續優先降低內容小改的完整包寫入成本與保存延遲，再擴充雲端原生UI、記憶體、實機／IME及長期免費驗收。新增4個操作／核對工具；詳見 `docs/verification/cloudflare-readback-provider-summary.json`、`cloudflare-readback-provider-backup.json`及runbook。以下為歷史紀錄。

## 未提交儲存與多分頁保護：兩個原生負向情境通過（2026-11-21）

使用最終8612eae候選的相同來源，在全新本機副本操作原生Chrome編輯器。未提交情境在呼叫WordPress寫入前故意回傳空本文：一次讀回得到舊內容，原錯誤與可用的儲存按鈕保留，原生textarea仍逐字相同；手動重試一次成功，完整程序重啟後同session內容一致。版本121→128→128→129→134，故障與讀回快照完全相同；重試才新增唯一預期修訂201。

多分頁情境先提交193並遺失回應，測試閘門暫候另一原生分頁建立auto-draft202。一次讀回回409/playtt_readback_unsettled，沒有啟動PHP、清除暫存或提交；第一分頁仍顯示原錯誤。當時202尚未出現在canonical，隨後以原生UI輸入標題及內容、保存同一ID成功；完整程序重啟後193與202都逐字一致。版本121→126→126→127→135。這驗證新草稿暫存身分存活；文字在拒絕後才輸入，不宣稱所有多分頁未保存文字或自然競態均已驗收。

精確核對只容許193內容／日期、預期修訂201、新頁202及其修訂203／鎖75、既有鎖72、管理員偏好21與單調計數；其餘canonical檔、帳號／session、舊修訂、媒體與主題不變。兩個通過案例37/37與52/52trace完成、無記錄request failure；完整包分別1份2,294,490bytes及2份4,589,742bytes。測試包裝器暫擋6／8次背景寫入，故不視為未干預排程或provider效能。首次多分頁工具誤用舊式post_ID欄位，核對固定核心initializeEditor後改用新副本重測；失敗不計通過。3個server及8個自建分頁皆結束，Worker外連0。

新增5個本機工具並納入第9選用階段雜湊組裝；75來源與20設定未變，未重跑已通過且未變的25項來源測試，沒有部署。01:08:24Z只讀核對雲端仍118／8pins、關窗封存、pending0、publisher paused、餘10,232,130bytes。接續安排有界provider驗證、完整包寫入成本、記憶體／延遲與長期免費驗收。正式Pages與原視覺維持、暫不切換後台、PR #4 draft、目標active。證據：`docs/verification/cloudflare-readback-negative-summary.json`及`cloudflare-readback-negative-audit.json`。以下保留歷史紀錄。

## 草稿回應遺失後的持久讀回：本機通過，雲端未啟用（2026-11-21）

新增第9個選用候選 `editor-readback/`。限定既有草稿頁面的content及可選id/title/excerpt/draft狀態；成功回應遺失後只做一次有界、帶驗證的GET。只有從已保存快照冷載入且每個欄位逐字吻合，才交回原生成功流程；不重送寫入、不直接清除錯誤。未知欄位／權限拒絕／取消／逾時／不同內容均保留原錯誤。暫存若曾被其他PHP操作使用而尚未提交，回傳409並保留它，避免丟掉原生GET剛建立的auto-draft。

最終Chrome候選只按一次保存；提交後故意令本文失效，隨後原生顯示「草稿已儲存」，無舊錯誤。版本122→125→125→134；提交與讀回的canonical檔完全相同，讀回trace無commit。完整程序重啟後同session開啟，五段繁中與原生textarea逐字一致。只新增預期修訂201，沒有額外頁面／修訂；其他帳號／session／媒體／主題與既有修訂保留。最終33/33本機trace完成、1份2,294,484bytes完整包，冷讀回2241ms；不是provider延遲、費用或記憶體驗收。測試分頁與程序全部結束。

首版因普通GET缺少canonical headers而保守拒絕；第二版冷讀回通過；加入未提交暫存保護後另起新副本再次通過。25項檢查、TypeScript、dry-run及75來源／82輔助檔重建通過，20個設定完全未改，沒有啟用或部署本候選。00:26:55Z雲端只讀核對仍118／8pins、封存關窗、publisher paused、餘10,232,130bytes。正式Pages與原視覺維持、PR #4 draft、目標active。

固定核心顯示成功autosave不建立成功notice，可能導致錯誤留存；先前事件的具體背景請求仍未歸因。這個實驗只處理支援範圍內的保存回應遺失，不能宣稱所有錯誤恢復完成。下一步驗證多頁並行時的保守拒絕、未提交／不一致讀回及有界provider行為，再處理完整包成本與長期免費、實機／IME驗收。詳見 `experiments/cloudflare-wordpress/editor-readback/README.md`、`docs/verification/cloudflare-readback-summary.json`、`cloudflare-readback-audit.json`。以下為歷史紀錄。

## 本機原生錯誤、重試及冷啟動通過；提示矛盾待修（2026-11-21）

Chrome操作真實WordPress7.1.4編輯器，以canonical118的兩份獨立本機R2／SQLite DO副本驗證。自有草稿193新增第五段繁中，成功提交後由本機包裝器令回應本文失效。原生畫面顯示「更新時發生錯誤。無效的JSON回應」，五段內容仍在。第一輪稍後按鈕顯示「已儲存」且disabled，但錯誤通知仍留著；沒有觀察到相同內容的明確page-save重試receipt，背景原生寫入仍繼續，狀態變化的真正原因未定。此提示矛盾保留為待修，不能宣稱完整錯誤恢復已驗收。

第二輪在原生錯誤與儲存按鈕仍可用時點擊一次重試，確認matching提交、錯誤消失及「草稿已儲存」。關閉分頁後停止並建立全新workerd，原瀏覽器session不用再登入，重新開啟草稿仍顯示五段；原生程式碼欄位value與預期全文逐位元一致。初次點擊曾因按鈕已變已儲存而未命中；檢查DOM及null故障receipt後，僅在自有本機草稿恢復基線，再連續輸入／儲存。觀察腳本亦曾因暫存變數未定義中止；未重送保存，先讀最新畫面後才按一次可用重試。故不聲稱毫秒級立即重試或準確互動延遲。

快照精確比較：第一輪129→136→154，第二輪160→182→186→197。首次故障提交只新增預期修訂201，原修訂194/195/196/200完整保留；重試及冷讀沒有多出頁面或修訂。正文／內容SHA與長度標記完全一致；其餘變動限草稿日期、自有edit-lock72、管理員原生命令偏好21及單調計數；帳號、session與其他canonical檔／媒體／主題不變。這是本輪捕捉基線之後的比較；登入先前的session寫入不在該差異範圍。

兩輪本機trace49/49及102/102完成，無記錄request failure；各2與4份完整包，共4,588,916與9,177,441bytes，不是等量工作負載或Cloudflare費用測量。原生global-styles警告仍在；第一輪另有viewport transition InvalidStateError。兩個900秒上限的server都提前finish並dispose，三個自建分頁已關閉，Worker外連attempts0。原始私人資料與失敗證據留Git外。故障注入未加入可部署來源。

74來源、20設定與既有部署2353ff34未變。23:39:03Z雲端唯讀核對仍canonical118、8pins、關窗封存、pending0、fence解除、publisher paused，計量未增、餘10,232,130bytes。新增5個本機工具；8階段組裝有78輔助檔。正式Pages與原視覺維持、PR #4 draft、目標active。下一步處理已儲存但仍報錯的訊息及完整快照寫入成本，再做有界provider驗證、實機／IME與長期免費驗收。證據：`docs/verification/cloudflare-response-ui-summary.json`、`cloudflare-response-ui-audit.json`與3張畫面。以下保留歷史紀錄。

## 儲存回應遺失：本機原生 HTTP、冷啟動與同內容重試通過（2026-11-21）

以已驗證canonical118完整備份建立全新本機R2／SQLite DO，執行現有WordPress7.1.4與PHP。自有草稿193新增一段繁中內容，真正提交後才由本機測試包裝器令回應串流失敗；Miniflare實際交付HTTP200、0bytes本文，客戶端JSON解析失敗。這是成功本文／確認遺失的實測，不宣稱TCP斷線。整個workerd停止再建立後，原session仍能讀回完整內容；同內容原生POST重試200，草稿ID不變、只有一份頁面，修訂仍194/195/196/200/201，沒有第二份201或額外修訂。

本機登入後119、首次保存120、重試121。第一次只改自有頁面、posts表新增唯一修訂201及ID計數；重試只改同頁date／modified／modified_gmt與計數，正文／所有修訂／其他canonical檔／媒體／主題逐位元一致。已核對固定核心wp-includes/post.php 5356–5372浮動草稿日期與4789–4794更新時間規則。首次保存與重試各生成2,294,472bytes完整包，顯示重試並非零寫入；不能把「無重複頁面」說成請求完全冪等。此成本尚未包含雲端其他寫入／操作。

測試修正了本機打包shim、Miniflare v5模組格式、coordinator控制參數及profile頁nonce選取；使用原生apiFetch REST nonce後通過。最初loopback EACCES以本機測試授權解決。Worker外連被禁止，outbound attempts0；本機執行器已dispose，私人副本及失敗證據留在Git外。未測瀏覽器錯誤訊息／儲存重試UI、真正雲端故障／限制、競爭寫入或新增頁面重送；本機HTTP表頭時間不等於使用者端延遲。

現有74份執行器來源與20設定未改，沒有部署或雲端寫入。23:02:51Z唯讀確認私人環境仍canonical118／207cc3ef、8pins、pending0、關窗封存、fence解除、publisher paused，剩10,232,130bytes，計量未增加；正式Pages與原視覺維持。8階段組裝新增1個本機驗證工具（73個輔助檔），不把故障注入加入可部署執行器。PR #4保持draft，目標active。

接續先以Chrome驗證本機原生編輯器在成功本文遺失後的提示與重試，再依精確成本安排有界私人雲端測試；繼續保留策略、儲存寫入量、實機／IME與長期免費驗收。不得擴額、退款計量、刪歷史或重播既有完成窗口。證據：`docs/verification/cloudflare-response-loss-summary.json`與`cloudflare-response-loss-local.json`。以下保留歷史紀錄。

## 畫布空白已隔離至內嵌瀏覽器的 blob iframe 行為（2026-11-21）

同一私人草稿193在Chrome能顯示全部四段內容，內嵌瀏覽器畫布仍空白。獨立本機最小範例不含WordPress或Cloudflare：一般iframe及srcdoc在兩邊皆正常載入／顯示父頁插入內容；blob iframe在Chrome載入一次且顯示內容，內嵌瀏覽器載入次數0、無內容。後者出現兩筆MutationObserver錯誤，範例來源沒有使用該API，但錯誤真正來源未定。證據指向這個內嵌瀏覽器環境的blob處理限制，不以此修改WordPress核心或主題。後續原生視覺驗收使用Chrome；內嵌瀏覽器相容性限制保留，不能推論所有裝置通過。

本輪只載入畫面，未輸入、儲存或接管；執行器、設定、部署版本2353ff34、正式Pages與原視覺都未變。300秒／6MiB／128操作窗口提前關閉，實用4,721,431bytes／76操作。獨立備份298檔／300物件，295檔完全相同；所有正文、帳號、session／偏好、媒體、主題及其他修訂均一致。核心開啟編輯頁時清理了自有舊autosave198及footnotes73，另更新編輯鎖與計數。已核對其作者／父頁／內容／時間，與固定核心edit-form-blocks.php 303–310行的過期autosave清理規則一致；這不是人工歷史裁剪，前7個備份仍保留舊資料。新增第8個pin。

最新canonical118／207cc3ef、8pins、pending0、窗口關閉、寫入封存、fence解除、publisher paused。payload上界139,767,870／150,000,000bytes，餘10,232,130。330秒觀察394事件含392 ok／2 canceled，42trace均完成，未觀察平台exception或request failure；取消原因仍未完全歸因。最高sampled WASM heap75,497,472bytes不是whole-isolate量測。Chrome仍有既知的global-styles警告；未隱藏。四個自建分頁、診斷、備份與本機範例伺服器均已停止。DOM工具未暴露iframe跨文件屬性，其缺值不能當作跨來源失敗證據。

新增6個觀察／備份／最小範例檔；8階段重組74來源／72輔助檔一致，本輪來源與20設定不變。只重做相關語法／交付檢查，沒有重複宣稱新跑14項執行器測試或部署。接續處理已寫入但回應遺失的恢復、延遲、保留策略、實機／IME及長期免費用量；從canonical118／pin8與最新額度開始新窗口，不重播舊一次性工具、不擴額／退款計量／刪歷史。目標active，PR #4 draft，暫不切換正式後台。證據：`docs/verification/cloudflare-canvas-summary.json`及`cloudflare-canvas-fixture.json`。以下保留歷史紀錄。

## 私人雙人接管、原生儲存與重載通過；視覺畫布仍待驗證（2026-11-21）

已依 WordPress 官方 [Gutenberg #79997](https://github.com/WordPress/gutenberg/pull/79997) 回移鎖定 effect 的相依列表修正。只轉換固定雜湊的核心編輯器 JS、分開邊緣快取並更新私人編輯頁的資產網址，避免瀏覽器沿用舊快取；R2核心原檔未覆寫。旗標僅開在既有 session-audit，19份其他設定不變。私人部署2353ff34；正式Pages、原視覺、免費方案及暫不切換後台的決定不變。

實際 Chrome 管理員1與獨立 in-app 編輯者2開啟草稿193。等待超過30秒仍有接管按鈕，第二人點擊後可編輯，第一人正確顯示失鎖並指名第二人。點擊工具曾逾時，後續實際畫面確認成功，未重複點擊。第二人透過原生命令選單／程式碼編輯器新增繁中段落，按原生儲存草稿後出現成功通知；重載後原生內容欄仍有完整四段，維持草稿。此為接管、儲存與內容重載通過；in-app視覺iframe截圖仍是灰色，原因未定，不能當作視覺區塊編輯驗收。原管理員Chrome畫布有正常顯示舊段落。

600秒／16MiB窗口提前關閉，實用12,327,671bytes／165操作。52份清單唯讀核對顯示43–94版共有51提交：48小型快照、3份完整包共6,886,485bytes；與前次工作負載不同，不宣稱節省百分比。獨立重建298檔／300物件，293檔完全一致。只改自有草稿193的預期正文與日期、新修訂200、編輯鎖、第二人的原生命令偏好及遞增計數；其他文章、所有帳號／session、圖片、主題及既有修訂／autosave均一致。新增第7個pin並保留前6個。

最新 canonical94／bc63cc39，7pins、pending0、fence解除、publisher paused、窗口關閉、寫入封存。payload上界135,046,439／150,000,000bytes，餘14,953,561。限時觀察794事件含783 ok／11 canceled，89trace中88完成，未觀察平台exception，1個request-body-unavailable；部分取消包含完成的mutation，歸因仍未齊全。最高sampled WASM heap77,594,624bytes不代表whole-isolate。所有本輪程序及兩個自建分頁均已結束。

14項測試、TypeScript與dry-run通過；8階段重組74來源與66輔助檔一致。首次組裝正確拒絕上游7.0.2資產清單；明確提供既有雜湊已驗證7.1.4清單後通過，本輪未重新產生核心二進位資產。新環境仍須依REBUILD.md完整生成資產。OAuth到期使成本分析停在第一個GET，沿原授權更新後完成，未新增scope。初次資產檢查遇Cloudflare弱ETag，實際bytes已通過SHA；接受標準弱／強格式並要求identity編碼後完整GET/HEAD及匿名404核對通過。既有PHP loader警告保留。

下一步先釐清in-app視覺畫布，再處理保存回應遺失、延遲、歷史保留、實機／IME與長期免費用量。以canonical94／pin7及最新額度為起點；不要重播舊一次性工具、擴額、退款計量或刪歷史。測試資料仍保留，尚非乾淨交付。目標active，PR #4 draft。證據：`docs/verification/cloudflare-editor-lock-summary.json`、`cloudflare-editor-lock-backup-result.json`、`editor-lock-reloaded-code-dom.txt`；重組見 `experiments/cloudflare-wordpress/editor-lock/README.md`。以下為歷史紀錄。

## 私人雙人編輯：重現上游鎖定問題，保存完整還原點（2026-11-21）

原生 Chrome 管理員與獨立 in-app 編輯者登入同一草稿193；第二人先看到「接管」，但未成功點擊便自動變成「已有其他人接管」。第一人仍可編輯。未輸入文字、未完成接管／失鎖／保存／重載驗收。初次導頁在 autosave 期間中止，替換分頁最後被本次寫入額度擋下。

600秒／20MiB窗口實用20,964,664bytes／111操作，已關窗封存。29份清單及7份歷史文章表的唯讀雜湊核對證明：28次提交含21個小型快照、7份完整包（16,066,574bytes）；七次完整包都只改 autosave198 的四個日期欄位，正文與其他文章完全一致。usermeta-only完整包為0。此現象與官方 Gutenberg [#79976](https://github.com/WordPress/gutenberg/issues/79976)／已合併修正 [#79997](https://github.com/WordPress/gutenberg/pull/79997) 一致：空 effect 相依列表保留初始化的鎖定狀態，後續心跳誤續租並反覆 autosave。固定資產亦有相同程式；因果仍待套用及原生回歸確認。本階段尚未套用修正，執行器未改、未部署。

獨立重建298檔／300物件並新增第6個pin，保留前5個；294檔完全不變。變更限 autosave198 日期、草稿193編輯鎖、既有兩人的session及遞增計數。原草稿正文／所有帳號／其他文章／圖片／主題不變。最新 canonical43／57e3bcef、6pins、pending0、fence解除、publisher paused、窗口關閉且寫入封存；payload上界122,718,768／150,000,000bytes，餘27,281,232。舊window-audit仍封存，正式Pages、原視覺、免費方案及暫不切換後台的決定不變。

限時觀察613事件含611 ok／2 canceled；60trace中45完成，未觀察平台exception。14個generic persistence failure與幾乎耗盡的測試額度一致，另1個request-body-unavailable；尚非完整取消歸因。最高sampled WASM heap76,611,584bytes不是whole-isolate量測。兩個自建分頁與所有本輪程序已結束。7階段乾淨重組73來源／59輔助檔一致，20設定未改，重複套用先拒絕。

下一步只在私人候選回移官方 effect 修正，先驗證實際固定JS及快取更新，再從canonical43／pin6與現有剩餘額度建立新窗口，驗證等待後接管仍存在、實際接管、失鎖與保存重載。不得重播已完成的一次性工具、擴額、退款計量或刪歷史。目標active，PR #4 draft。證據：`docs/verification/cloudflare-session-lock-summary.json`、`cloudflare-session-lock-autosaves.json`、`cloudflare-session-lock-upstream.json`；以下為歷史紀錄。

## 私人免費 WordPress：工作階段冷還原及持久化登出通過（2026-11-21）

在新增的私人 `playtt-wp-free-session-audit`／Standard R2 測試環境啟用 v2，匯入原 canonical57 的完整選定備份圖：303物件、100,738,428bytes，全部下載比對 SHA256。原 window-audit 仍 canonical57／8pins／封存，用量與資料未動。僅新環境新增設定，正式 Pages、原視覺與暫不切換後台的決定不變；Cloudflare 頁面仍顯示 Free。

原生 HTTP 登入、繁中個人資料頁、偏好保存／讀回、執行器快取丟棄後的同一工作階段還原均通過。核對備份時發現原生 GET 登出原本未被分類為寫入；舊測試只證明 warm 狀態拒絕憑證，其 pass 不代表持久化登出。已修正執行器與 DO 的判斷，保留 WordPress nonce／授權檢查。新實測確認錯誤 nonce 回403但帳號仍登入、有效登出產生 canonical14、再冷還原至15後舊憑證仍回403，獨立備份亦確認該 token 已移除。偏好原始 bytes 恢復，298檔中296檔不變；只改usermeta及計數，原草稿／帳號／媒體／主題均一致。

本輪300秒／8MiB窗口實際寫入460,017bytes／17操作。登入96,614bytes、保存偏好96,444bytes、登出96,225bytes；沒有另寫約2.3MB完整包。這是本次實測寫入量，未宣稱等量工作負載的節省百分比或長期免費。新環境目前canonical15／506f29fb、5個保留pin、pending0、窗口關閉、寫入封存、fence解除、publisher paused；保守payload上界101,754,104／150,000,000bytes，餘48,245,896。既有測試帳號、草稿與歷史工作階段保留，尚非乾淨交付資料。

26項相關測試分三批通過，TypeScript通過。7個選配階段可乾淨重組73來源／53輔助檔，20設定一致，重複套用會先拒絕。完整原生回歸在8f4b111b通過；最後補上重複action參數的保守判斷，2項分類測試重驗通過後部署c914a8a0，唯讀確認資料／5pins／封存一致。重複參數尚非雲端PHP回歸案例；仍有上游產生載入器的eval／重複常數警告。限時觀察312事件含311 ok／1 canceled，13個trace均完成、未見平台exception；一次取消未完成歸因。已確認兩次REST冷還原，最高sampled WASM heap71,565,312bytes不代表whole-isolate記憶體。所有本輪程序已結束。

前兩次HTTP測試停在測試腳本解析單引號登出連結，未改偏好；失敗與封存紀錄保留。部署初期遇到workers.dev啟用傳播及缺少容量scope，均在資料匯入前修正。帳號R2唯讀觀測約2.18GB，但有分析延遲且包含其他專案，不能當作帳單／月峰值／費用保證。

下一步：重測雙編輯者原生接管、失鎖提示、保存與重載，再處理回應遺失、保留策略、實機／IME及長期用量。不得重播已完成一次性工具、重置／退款計量、刪歷史或自動提高上限。新一輪必須從canonical15／pin5、最新封存狀態和額度建立新的所有權窗口。目標active，PR #4仍draft，尚未完整後台驗收。

證據：`docs/verification/cloudflare-session-summary.json`、`cloudflare-session-audit.json`、`cloudflare-session-logout-result.json`。可重建流程見 `experiments/cloudflare-wordpress/session-provider/` 與 `logout-persistence/`。以下保留前階段當時紀錄。

## 使用者工作階段小型快照：本機驗證通過，尚未部署（2026-11-21）

新增獨立v2格式，涵蓋session_tokens及wp_persisted_preferences，保留完整usermeta原始值、ID、所屬帳號與計數高水位。既有v1程式與測試未變；角色、密碼、帳號、文章或其他欄位變動仍用完整快照。新讀取器支援v1/v2，舊v1讀取器拒絕v2；這不等於已完成跨版部署回滾。

70項相關測試、TypeScript及Wrangler本機dry-run通過。以canonical57獨立備份執行原生WordPress工作階段類別、真實MDI與PDO SQLite，兩個全新PHP實例通過40個寫入端及17個冷還原檢查：憑證驗證、錯誤使用者／錯誤token拒絕、登出失效、逾期及繁中設定均正確。SQL metadata/filter介面是有限測試替身，尚非完整HTTP登入或瀏覽器驗收。

298檔只改usermeta，其餘297檔逐位元一致；獨立匯出匯入及完整ZIP重建通過。單次本機回放估算物件寫入95,760對2,391,769bytes，約減少96.00%；未含讀取／操作費用與重試，也不是雲端實測節省。乾淨重組72來源／38輔助檔一致，19設定未改，v2未啟用。dry-run gzip7,604.79KiB，仍有上游產生載入器的eval與重複常數警告。

唯讀雲端確認仍canonical57／34a7df5f、8pins、pending0、關窗封存、fence解除、publisher paused，計量未增加，剩餘3,821,814bytes。正式Pages及原視覺維持現況；本輪沒有部署。下一步規劃額度足夠且受限的雲端驗證，先測真實登入、偏好寫入、冷還原及資源用量，再重測雙編輯者接管與保存。一次文章保存加autosave可能需要多份完整包，不能以本機96%數據推定現場額度足夠。不得重置／退款計量、刪歷史或自動提高上限。

證據：`docs/verification/cloudflare-usermeta-overlay-summary.json`、`cloudflare-usermeta-overlay-php.json`；可重組候選：`experiments/cloudflare-wordpress/usermeta-overlay/`。目標active，PR #4 draft。以下為前階段當時紀錄。

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

## 自動草稿維運盤點（2026-11-19 01:17）

序列修正已提交3a31a62並推送PR #4，維持draft。已校驗備份的27個Markdown與61列JSON文章盤點出一份auto-draft 93，2026-11-17建立，尚未滿七天；沒有遠端刪除。WordPress已有清理hook，但audit入口未接scheduled、設定無cron trigger，且自動WP-Cron停用。下一步先在本機測原生七天清理與序列保存，再處理DO內有界維護入口。具體證據及尚待驗收項見`experiments/cloudflare-wordpress/id-sequence/AUTO-DRAFT-LIFECYCLE.md`；不可把盤點當成清理完成。

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

## 研究方向與新候選（2026-11-17 14:58）

使用者已選擇繼續研究全Cloudflare免費後台；正式Pages維持現況，暫不切換。新追蹤分配器候選755bdb73將固定本機工作負載的WASM配置由115.4MB降低至74.8MB。相同WASM連續60次循環參考清理測試通過；PHP16MiB上限拒絕32MiB配置後，下一請求可正常執行。

私人restore-v1的25次請求（兩輪樣式儲存／讀回／還原）通過，繁中控制台與原生網站編輯器正常，77個語言檔及admin語系在重部署後保留。自動發布正在處理先前暫停期間累積的工作，原生導覽保存與發布回歸仍待本輪完成。這些結果不代表完整營運驗收。新舊候選、固定版本與比較證據均保存在memory-investigation目錄；正式網站沒有切換。

## 目前結論（2026-11-17 14:21）

正式playtt.tw六頁與LINE入口再次唯讀確認正常，仍由Pages服務，原創視覺保留。全Cloudflare WordPress候選尚未通過穩定度驗收：小幅WASM記憶體擴充仍在原生樣式儲存後重置，不將成功的較小測試推論為完整可用。詳細證據與可重現候選見experiments/cloudflare-wordpress/memory-investigation/。

私人還原區已保存294個索引項目的獨立一致性備份；R2確認77個語言檔、管理員zh_TW、初始化外掛已移除、全域樣式覆寫已清空。然而HTTP操作回應失敗，語系及編輯流程不算完整通過。測試發布器目前paused以免重試；這不是暫停整體目標，正式站及原主要資料區未更動。

2026-11-17 使用者已選擇繼續研究全Cloudflare免費後台；正式官網維持目前Pages，暫不切換後台。不改採本機後台，也不啟用付費。一般Workers付費方案也有128MB記憶體限制，不能當成已驗證解方。官方來源：https://developers.cloudflare.com/workers/platform/limits/#memory 。


## 最新進度（2026-11-17 14:00，原生樣式及記憶體複驗）

原生全域樣式儲存、重新載入及實際重新部署後保留已驗證，global-styles42維持墨色設定。先前資料遺失的原因是GET建立的主題關聯沒有進入最後一次請求的變更清單；提交時改為完整、有限額的canonical檔案清單，仍只上傳hash改變的檔案。

新版發布改為序列共用PHP執行器；8bb81124版本的遠端樣式與完整發布套件通過，316個觀察事件沒有例外。不過81e848e1版本進行瀏覽器／第二個登入工作交錯時，再次觀察到記憶體超限，樣式還原與遠端語言外掛上傳未完成。已移除請求函式對舊PHP promise的持有，7b13e109候選已重部署，但遠端繁中初始化與後續移除仍發生記憶體重置，尚未解決；不可將先前316事件視為營運穩定度保證。

本機官方zh_TW語言檔安裝及移除初始化外掛後保留均通過；遠端尚未通過。正式CMS請求邊界已準備並通過16項相關檢查，尚未套用正式網域。正式playtt.tw仍為Pages；原主要資料區未變更，目標active。

## 前次狀態（2026-11-17 13:14，自動發布候選）

- 本機及遠端 restore-v1 自動發布通過：頁面編輯、撤回草稿、重新發布、共用頁尾同步六頁。alarm 每次產生一頁，完整版本才切換；無閒置 Cron。
- 本機故障注入通過：隔離 emulator 的核心檔暫時不可用時，公開版本保持上一版；還原後重試成功。未刪除遠端核心物件。
- 遠端發現 DO 快取刪除不支援，已以發布版本隔離快取修正；公開資產補正 MIME 並阻擋 PHP 原始碼。遠端公開預覽六頁／20資產／38請求通過，CMS重新部署後仍讀到同一完整發布版本。
- CMS目前部署 ef8e840e-9db4-4d6c-a995-fd55ee0384a1，使用還原桶／分區。公開預覽 https://playtt-publication-preview.muzhi-garden-platform.workers.dev ，部署26d9657b-5559-44e5-8e48-64e1fadff1fe，noindex；正式 playtt.tw 仍為 Pages。主要分區資料未變更。
- 可重現來源在 `experiments/cloudflare-wordpress/automatic-publication/`，證據 `cloudflare-publication-local.json`、`cloudflare-publication-recovery-local.json`、`cloudflare-publication-remote.json`、`cloudflare-public-reader-remote.json`。
- 下一步：原生導覽／全域樣式、乾淨正式後台與登入、正式網域發布及備份回滾驗收。目標active，沒有宣稱整體完成。

## 前次狀態（2026-11-17，安全更新驗收）

- 經典原生修訂畫面成功還原關於頁到revision30；REST再讀確認測試文字移除並新增revision37。新版修訂面板曾持續載入，仍需在新版核心複核。
- 網站編輯器成功修改共用頁尾，顯示Template part updated，重新載入保留內容。證據 `cloudflare-cms-native-editor.json`；導覽與全域樣式的儲存驗收仍待。
- 官方安全版本查核後，建立獨立WordPress7.1.4 / PHP8.3.36 / Playground3.1.64候選，沒有把舊實驗版本直接設成正式後台。本機全空登入、文章／草稿／媒體、原生主題ZIP安裝、六頁與十四張品牌圖匯入、重載通過。
- 新版已在restore-v1隔離分區實際啟動；health回報新版本，舊備份六頁、主題和品牌圖一致，核心資產SHA256通過。預先備份主要分區224個索引項目後，已套用到主要測試後台，升級後的修訂還原結果、頁尾版型、新草稿與一般圖片／縮圖已通過，12:39實際重部署fc24347f-fd34-41fc-a598-647bc5e0eef6後再驗證保留。最新重現檔案見 `experiments/cloudflare-wordpress/security-update/`。
- 正式官網仍為已驗證Pages；CMS到正式站發布、營運配置與最終交付尚未完成，目標維持active。

## 前次狀態（2026-11-17 11:59）

- Chrome 原生視覺區塊編輯已通過：直接修改關於頁的段落，Save請求200、Page updated，重新載入保留修改。先前一次失敗為測試入口短效資格到期，更新資格後成功；未放寬WordPress權限。內建瀏覽器的blob畫布未顯示，Chrome可正常顯示並編輯。證據 `cloudflare-cms-visual-editor.json`，畫面保存在私有交付outputs。
- 核心編輯器靜態資產移到DO佇列外，維持原R2範圍讀取與SHA256校驗。六個代表資產並行約3.17秒全部通過，沒有探針資格仍404；不宣稱整個後台在3秒內載入。
- 全空遠端初始化通過：另建私有 `playtt-wordpress-restore-probe`，僅預置三個核心物件，獨立DO分區確認pointer=null/version=0後，第一次登入頁、登入、文章、草稿、媒體與匿名權限皆通過。首次初始化登入頁wall time 28.9秒，非CPU時間。
- 獨立還原通過：215筆備份索引去重後210個R2物件，由本機備份複製到另一桶；只重設restore-v1的合成測試資料，恢復原備份指標後一致性通過。登入、六頁、主題、品牌圖片SHA256與CSS皆通過，且不包含備份後才加入的視覺驗收標記，確認是獨立還原時間點。原分區未重設。
- 已切回原R2/DO，部署 `f2b875f8-3b84-4e17-8c7f-fbe816084cab`。原分區保留備份後的視覺修改；修訂紀錄、兩筆並行獨立草稿、一般圖片與縮圖已通過，12:03重新部署06361624-ed24-4784-98a1-3335dbb2da0c後仍完整保留。
- Workers方案再次顯示Free/$0/Current plan；R2當期billable usage $0.00。帳號總量322.05MB、A868/B8.39k是介面當時顯示且可能延遲，包含其他既有資源；沒有新增付費方案。正式官網仍為Pages，後台到公開站發布、原生修訂還原、網站編輯器與營運交付仍待。目標active。

## 前次狀態（2026-11-17 03:30）

- 免費遠端品牌主題驗收已前進：0.2.3 ZIP 原生安裝與啟用成功；六頁／十四張品牌圖片匯入、修改標題、再次匯入不覆寫或重複，以及六頁輸出通過。03:27 實際重新部署後，主題版本、修改過的內容、品牌圖片 SHA256 與 R2 靜態資產仍通過。證據 `cloudflare-cms-theme-remote-import.json`、`cloudflare-cms-theme-remote-after-redeploy.json`。
- 候選改用官方 PHP-WASM 8.3.32；關閉檔案 opcode 快取並使用 direct 檔案系統。以加密亂數識別碼替代已釘選 WordPress 核心 19 處與 MDI 儲存介面 3 處 `uniqid()`，處理 Workers 同步執行時鐘凍結的相容性；PHP 原生函式及 WordPress 密碼雜湊保留。20,000 個 ID 的本機唯一性／前綴檢查通過，任意外掛相容性仍不保證。
- 原品牌圖片已有壓縮與尺寸，僅對 `_lets_play_asset` 標記的匯入圖片略過多餘縮圖生成；一般媒體仍採原生行為。此前匯入在 R2 圖片保存階段超出記憶體，修正候選已通過。PHP 臨時逐行診斷已移除，成功版本不靠診斷 I/O 推進時鐘。
- 匯入成功版本 `9942691e-59ab-478b-b714-5508e2f30f1e`；重新部署保存版本 `4eb9bdca-1ea5-43aa-953d-c689168f5e9c`。新增僅測試用途的 30 分鐘 HttpOnly 存取入口，不替代 WordPress 登入或 operator 授權。
- 03:29 完成遠端一致性備份並驗證 215 個物件，還原包 1,447,711 bytes；尚未執行獨立還原。全空遠端初始化、瀏覽器編輯、修訂／網站編輯器、並行修改及後台到正式站發布仍待。正式官網仍為已驗證的 Pages；持續目標 active。

## 前次狀態（2026-11-17 02:50）

- 免費遠端完整CMS基本測試已通過：原生登入、發文、草稿、媒體與匿名權限。重新部署後同一份文章與圖片SHA256仍保留，登入再次成功。證據 `cloudflare-cms-do-remote-create.json`、`cloudflare-cms-do-remote-after-redeploy.json`。
- 成功候選關閉PHP-WASM檔案opcode快取，已移除額外R2診斷寫入，沒有降低密碼雜湊強度或升級方案。仍保留階段名稱日誌與探針存取密鑰。
- Let’s Play 0.2.3已在本機DO候選真實安裝、匯入六頁/十四張品牌媒體並完成編輯及重複匯入保護；遠端原生主題上傳頁兩次回500，tail確認PHP執行階段觸及DO記憶體限制，尚未上傳主題。正在比較官方PHP 8.3 WASM候選的記憶體需求；正式網域仍為Pages。上游HEAD已重新核對仍為原commit。
- 下一步：遠端品牌主題、重部署保存、視覺編輯、修訂/網站編輯器、全空站啟動、備份還原及並行寫入。完整目標仍active。

## 前次狀態（2026-11-17 02:36）

- 完整 `PlayttWordPressExecution` SQLite DO + R2 候選已完成本機登入、發文、媒體、匿名限制及真實程序重啟保存。遠端已部署，沒有正式網域路由。
- 遠端最初遇 DO CPU 超時；提高 CPU 上限的設定由 Free API 明確拒絕（100328），已移除且沒有付費升級。後續診斷確認初始化持久化成功，但同次請求觸及記憶體限制。下一次冷啟動已讀回狀態並回原生登入表單200，仍不代表完整 CMS 驗收。
- 正測試關閉 PHP-WASM 檔案型 opcode 快取的候選，減少記憶體內編譯副本。暫時的 R2 階段診斷寫入已移除；保留不含請求資料的階段名稱日誌。外部未持有探針密鑰回404，正式站不受影響。
- 六頁可見文字對比、結構語意與減少動態偏好已補驗，無已觀察到的失敗；這些不是完整螢幕閱讀器或圖片文字驗收。

## 前次狀態（2026-11-17 01:55）

- 使用者已授權僅操作 playtt 的 Workers Scripts Write / Routes Write；OAuth 限定 info@dropout.tw 帳號，六項權限為原有四項加這兩項，未加入 Tail。登入成功，先前自動核准審查阻礙已解除。
- 隔離探針 `playtt-wp-free-boot-probe` 已部署：版本 `bc78e4a1-6e45-4da5-a2b0-d538127290ca`（設定測試密鑰前的部署 ID），URL https://playtt-wp-free-boot-probe.muzhi-garden-platform.workers.dev 。無正式網域路由，隨機密鑰保存在本機與 Worker Secret，不提交程式庫；匿名回應 404。
- 遠端八項請求中，PHP、核心展開在一般 Worker 與 SQLite DO 均成功。一般 Worker 的完整 WordPress boot 回應 503「Worker exceeded resource limits」；同套核心在 SQLite DO 完整 boot 成功，WordPress 7.0.2 / PHP 8.5.8。`cloudflare-boot-remote.json` 保存狀態、CF Ray 和結果；wall time 不冒充 CPU time。此探針不含資料持久化，不能宣稱遠端後台完成。
- 下一步：把完整 runtime 的 PHP 執行放入隔離 SQLite DO，維持原生 WordPress 與協調器，先本機驗證，再測遠端登入、媒體、修訂、重部署、備份還原與並行寫入。無需改 CMS 或升級付費方案。現有公開官網保持 Pages 發布。
- 使用者完成 Zeabur 永久刪除後，已用全新登入頁確認 LetsPlayWebsite 不在專案列表；唯一 playtt 服務及其設定屬該專案，無資料卷，其他專案仍在。模板備份已本機保存且未提交。刪除後正式站以一般公開 DNS 檢查 46 檔、404、/home/301 全數通過，不再需要邊緣 IP 覆寫。
- 六個正式頁面已完成瀏覽器 console / HTTP 請求檢查，沒有觀察到 exception、console error、失敗請求、>=400 回應或混合內容。各頁 readyState complete，事件未截斷。證據 `production-console-0.2.3.json`。這是逐頁載入 smoke check，不是所有互動或輔助技術的完整驗收。
- 正式主題 0.2.3、效能首頁 94／課程 99、兩頁 CLS 0；9 項本機 WordPress 整合與公開檔案證據維持通過。目標 active，完整遠端持久化及交付仍未完成。

## 前次狀態（2026-11-16 19:29）

- 正式網站已更新主題 0.2.3，commit `55dc51845b52350f59436c2eacbece17f15edfbf`，免費 Pages 部署 `32e92256-f71e-4ed6-afff-291b6cca3206`。固定快照 https://32e92256.playtt-brand-preview.pages.dev 。完整免費 WordPress 後台仍未驗收，目標保持 active。
- PageSpeed 行動實驗室量測找到原首頁 CLS 0.711、效能 69。主題用原生圖片區塊 render filter 補上圖片真實尺寸，既有頁面不用重匯入或改寫區塊；保留原創桌機及手機主視覺。新版首頁效能 94、CLS 0、LCP 2.956 秒；課程 99、CLS 0、LCP 1.541 秒。兩頁的自動無障礙、最佳做法、SEO 均 100。沒有 CrUX 真實使用者資料，分數不是完整人工無障礙驗收。
- 0.2.3 ZIP 9 項本機 WordPress 整合測試通過；六頁、48 檔靜態檢查新增圖片尺寸檢查。正式站與預覽站 46 檔、404、/home/301 通過。HTTP 驗證器改以頁面實際引用的 `?ver=0.2.3` CSS/JS 網址查驗，避免把 TTL 內舊裸網址快取誤判為發布失敗；報告記錄 requestPath。
- 0.2.3 手機 375px：內容寬 360、scrollWidth 360、無壞圖，顯示 brand-mobile.webp；桌機 1280px 顯示 brand-desktop.webp，無溢出。保留既有 18 組版面、鍵盤與舊網址基準證據。
- 主題 ZIP SHA256 `471aaf78e1d4a15d1357ec9500a067bcff27a9a4d803f7f8dcea48a00249a79e`；靜態備份 SHA256 `b24f497ca40ad9a274534337771fd288e462fda6b671e94e047e8fd1a1aec02a`。
- Zeabur 重新核對 LetsPlayWebsite：唯一 playtt 服務仍暫停／未部署，沒有資料卷，舊根網域及 www 綁定顯示 INVALID_DNS；來源仍為本儲存庫 master，沒有啟用 InsForge。正在備妥專案移除清單及設定備份，尚未刪除。
- Wrangler 額外 Scripts Write / Routes Write 的授權問題仍待回覆；未重試遭審查拒絕的權限擴大。遠端 WordPress CPU、資料保存及還原尚無結果。

## 前次狀態（2026-11-16 19:13）

- Gandi 已重新登入；18:52 活動紀錄確認 nameservers 更新為 `karl.ns.cloudflare.com`、`mariah.ns.cloudflare.com`。切換前即時重讀完整區域檔及 DNSSEC（未啟用），與原備份一致。Cloudflare zone 已 active。
- `playtt.tw`、`www.playtt.tw` 已綁到免費 Pages，兩者 Active / SSL enabled；Universal 憑證涵蓋根網域及萬用子網域，效期至 2027-02-14。正式網址瀏覽器已呈現 0.2.2 新版，已啟用 Always Use HTTPS，www 301 至根網域並保留路徑及 query（規則 `eb8ac6c08c19418aa8f1b7150694558e`）。
- 0.2.2 已由 GitHub push 自動發布：commit `132a9de834b26855a3aea0709cf5267162686226`，部署 `97a18f78-cbbf-4072-bd79-d8ed4ed35634`。18:42 實際回滾至 0.2.1，確認公開 CSS 版本，隨後恢復 0.2.2 並逐一驗證 46 檔。這是靜態發布回滾，不是遠端資料庫還原。
- 正式根網域透過已查證 Cloudflare IP、保留真實 hostname/SNI 與 TLS 憑證驗證的 46 檔檢查通過；www 在設定 301 之前的一般公開 DNS 46 檔檢查通過。部分 Node/OS 解析仍命中舊 Zeabur IP，但瀏覽器及 1.1.1.1/8.8.8.8 已取得新版/新 DNS；不可宣稱所有解析器傳播完成。
- 根網域 HTML 有 Cloudflare 自動分析 beacon 注入；驗證明確記錄這一轉換，移除唯一符合官方 URL/屬性格式的注入後，其餘 HTML 完全一致；資產仍逐一 bytes/SHA256 比對。原預覽沒有這項轉換。公開信箱的 Email Address Obfuscation 已關閉，使 mailto 與文字不依賴解碼 JS。
- 正式站 375px 首頁與課程無水平溢出、壞圖；Enter 開選單、Escape 關閉及焦點回復正常；同頁 `/#/class?utm_source=formal-site` 正確到 `/class/?utm_source=formal-site`。桌機首頁無溢出／壞圖。完整 18 組版面基準仍是 0.2.1；0.2.2 未改 CSS。
- DNS 後核對：14 筆中僅網站兩筆改為 Pages；12 筆郵件記錄完全相同且 DNS only。公開 1.1.1.1 查詢取得 MX、SPF、三筆 DKIM、webmail、五筆 SRV；此證據不包含實際信箱寄收測試。Gandi 註冊與郵件保留。
- Workers 方案頁顯示 Free / Current plan。R2 已由帳號原本啟用，目前總量 158.57MB、當期 A 36/B 43、billable $0.00；本任務未建立遠端 R2、動態 Worker 或 DO。
- 新的 CPU 啟動先決條件探針已完成：同一上游 PHP-WASM / WordPress，分別在 Worker 與 SQLite DO 本機執行 PHP、核心檔案展開、完整 WordPress boot 均成功；28,997.06 KiB 未壓縮，TypeScript/dry-run 通過。唯讀打包核心檔案，不含資料持久化；不能當作後台完成。
- CLI OAuth 已更新為指定 info 帳號、User Read / Account Read / Workers Write / Background Access。遠端部署被 Cloudflare subdomain API 10000 拒絕。補充 Scripts/Routes/Tail 權限的操作遭自動核准審查拒絕；已停止該步，向使用者請求僅 Scripts Write / Routes Write 的必要授權，省略 Tail。等待回覆；不可繞過審查或宣稱探針已遠端執行。
- Zeabur 尚未刪除。仍待免費完整 WordPress 實測、遠端資料保存／還原、完整可及性與行動效能、內容待確認事項及最終交付驗收。目標維持 active。

## 前次狀態（2026-11-16 18:35）

- 使用者已明確授權 Cloudflare GitHub 連線，限定 `dropout-tech/playtt`。沿用既有連線，只選取本儲存庫；沒有新增其他儲存庫的權限。
- 免費 Pages 專案 `playtt-brand-preview` 已成功發布：https://playtt-brand-preview.pages.dev 。首個成功部署 `06d099af-c711-4b8f-b691-c2a752d57c3c`，來源 commit `3357a82df3ec93aee26b68e5d30af7fad757bd55`，固定快照 https://06d099af.playtt-brand-preview.pages.dev 。未合併 master。
- 設定：production branch `codex/playtt-wordpress-cloudflare`、root `cloudflare`、build `node verify-static.mjs`、output `public`、`SKIP_DEPENDENCY_INSTALL=1`。首次因舊站 Yarn lock 被新版 Yarn 解析而失敗；修正後部署成功，沒有安裝或執行舊 React 站。Pages 顯示 automatic deployments enabled。
- 公開預覽 46 個檔案 HTTP／SHA256 一致、404、/home/ 301 通過。375px 無溢出與壞圖、LINE 62px 按鈕可見，Enter 開選單、Escape 關閉及焦點回復通過。已保存靜態 ZIP 備份與 Cloudflare 固定版本，仍須正式網域及回滾實測。
- 線上同頁變更舊 hash 網址未觸發原有啟動腳本，已修正為初次載入與 hashchange 均處理，並保留含問號的查詢值。主題更新為 0.2.2，5 項路由回歸、9 項 WordPress ZIP／資料保存／還原測試及新匯出驗證通過；待本次推送觸發線上更新並驗收。
- 0.2.2 ZIP SHA256：`22ab72a918c37809af784506b7e994322ad0cb0cb559ea8186467cffcdfd7003`。Cloudflare 動態候選仍使用 0.2.1，已完成真實主題上傳啟用、六頁／十四張媒體、重複匯入不覆寫、編輯、重啟後六頁及品牌圖片／主題 CSS 保存；瀏覽器標題修改顯示 Page updated。這仍是本機 R2／DO 模擬，不是遠端免費 CPU 驗收。
- Gandi 新開分頁已回到登入頁，已請使用者重新登入，未變更 NS。Cloudflare Pages 明確要求 zone active 後才能加根網域；待 Gandi 登入與 DNS 重核後切換 NS，再完成 Pages 根網域／www 綁定、HTTPS 和郵件驗證。Zeabur 未刪除，正式站仍未恢復。

## 前次狀態（2026-11-16 18:10）

- 主題 0.2.1 延續原站原創主視覺，桌機與手機有各自的圖片區塊、共用常駐 LINE 入口；頁面標題與內容可編輯。`BRAND_AND_CONTENT.md` 記錄視覺修正與待核對內容。
- 原始 React 網站已在隔離資料夾還原供比較；沒有改動其來源或部署到正式網域。
- 0.2.1 主題九項 WordPress 整合測試全部通過，包含十四張媒體、重啟與獨立備份還原；實際安裝目錄 style.css 版本亦核對為 0.2.1。報告時間 2026-11-16T09:58:51Z，仍僅為本機驗證。ZIP SHA256：`7aa5671c6fc1ee3e78e0f753158ca4b0db90ffe6f5cfc275695bd07f648d27af`。
- 新發布檔 48 個、約 1.24MB；46 個公開檔案 HTTP 200 並逐一 SHA256 一致；404、舊 /home/ 301 正確。證據在 `docs/verification/`。
- 匯出器會消耗 Playground 開機後一次性 self redirect，接著拒絕各頁重新導向，逐頁確認 canonical 等於請求路徑；避免將錯頁存成正常頁。
- 真正量測 375／768／1440px 共十八組頁面，無水平溢出與已載入壞圖。Enter 開手機選單、Escape 關閉並回到可見焦點、Enter 導向課程成功；舊 #/class、#/partner 保留 query。尚未做完整螢幕閱讀器與效能量測。
- WordPress 與 Cloudflare 新工具依賴 audit 0 已知漏洞；原始 React 依賴僅供隔離視覺對照，未納入新部署。
- Cloudflare 14 筆 DNS 已補齊，Gandi NS 未切換；正式站仍未恢復。Cloudflare GitHub 連線需解決既有自動審核權限確認；未繞過。
- 程式已推送至 `codex/playtt-wordpress-cloudflare`，draft PR：https://github.com/dropout-tech/playtt/pull/4 。Cloudflare GitHub 單一儲存庫授權問題已送出，等待使用者回覆；在此期間繼續本機後台驗證。
- Automattic wp-codebox 候選 commit `9764022156a61ba7d2b4d8a2196b01ccb33b82b5` 已通過 TypeScript 與 Wrangler dry-run，未壓縮約 23MB。其可選 website importer 1.3.6 套件能力宣告與來源契約不符，完整生成命令失敗；一般 WordPress 啟動不載入此匯入器，因此隔離測試只配置三個已驗證的 WordPress／靜態／SQLite 套件至本機 R2 模擬。此調查不代表免費遠端可用。
- 該候選在本機 workerd + R2／SQLite DO 模擬完成登入、發布、媒體 SHA256、匿名權限與重啟保存驗證。瀏覽器已登入原生後台、載入保存文章的區塊編輯器。主題尚未安裝至此候選、遠端免費 CPU 與持久化尚未驗收；本機 wall time 不能當作 CPU 用量。可重現實驗在 `experiments/cloudflare-wordpress/`。
- 此階段沒有完成全部搬遷；免費 WordPress Worker 持久化、公開發布、DNS 切換與 Zeabur 清除均保留未完成狀態。

## 前次狀態（2026-11-16 17:40）

- 持續執行中；仍未正式切換、未部署公開 Cloudflare 預覽、未刪除 Zeabur。
- Gandi 完整區域檔已備份；Cloudflare 自動掃描漏掉 gm1/gm2/gm3._domainkey，已全部補齊為 DNS only。Cloudflare 現有 14 筆服務記錄，郵件 MX／SPF／SRV／webmail 對照一致。Gandi DNSSEC 未啟用；原 NS 未更動。
- 使用者追問「原站的視覺？」。已獨立建置原始 commit 並在 127.0.0.1:9424 還原。0.1.0 草案偏離原創幾何主視覺，0.2.0 改用原創桌機／手機主視覺，恢復桃紅延伸色與品牌標語，補回桌球檢定和賽事內容。新一輪匯出與版面驗證進行中。
- 0.1.0 六頁共 18 組響應式檢查通過；手機選單與舊 #/class query 保留通過。不得當成 0.2.0 全驗收。
- 移除不必要的 npm 開發依賴，固定工具版本並 override isomorphic-git 1.44.14、qs 6.17.1；新依賴樹 npm audit 0 漏洞。原始 React 工具鏈僅供本機對照，不在新部署中。
- 修補依賴後，0.1.0 的 9 項 WordPress 整合測試再次全部通過；0.2.0 ZIP 安裝與 14 張媒體的新測試執行中。
- 新增 `BRAND_AND_CONTENT.md`、`OPERATIONS.md`；內容待核對項、靜態匯出與完整後台的差異、免費部署參數、DNS／Zeabur 清除順序已具體列出。
- GitHub CLI 登入在網路核准後可用。Cloudflare「Continue with GitHub」仍保留先前自動審核拒絕，未繞過；本機原生檔案上傳遇到視窗擷取／座標問題，尚未上傳或發布。
- 後續：完成 0.2.0 匯出與新視覺檢查 → 提交可審閱分支／PR → 處理單一儲存庫 Cloudflare 發布授權 → 預覽／DNS 切換 → 免費 WordPress 遠端持久化實測 → Zeabur 清除與完整交付。

## 前次狀態（2026-11-16 17:15）

以下為目前狀態；後方「初始紀錄」保留建立過程，不代表最新結果。

- 目標 active；正式站仍未恢復、DNS 未切換、Zeabur 未刪除。
- 原生 WordPress 區塊主題已完成第一版：8 個版型、6 頁、8 位教練，沿用藍黃綠 Logo 與既有實景照片。
- WordPress 7.1.4 / PHP 8.3 / SQLite 本機 9 項整合驗證全部通過：ZIP 安裝啟用、6 頁與 12 張媒體匯入、重複匯入不覆寫、匿名匯入拒絕、修訂還原、草稿不公開、媒體下載、重啟保存及獨立備份還原。證據：`wordpress/test-results/integration.json`。不能視為 Cloudflare 後台驗收。
- Chrome 真實編輯器修改首頁標題、儲存、再恢復，產生 2 個修訂版本。內建預覽瀏覽器的 blob iframe 顯示空白，Chrome 編輯器正常。
- 首頁 375、768、1440px 無水平溢出；375px 原生選單可開關。尚待逐頁、鍵盤、發布版本與效能驗收。
- 匿名靜態匯出 6 頁、404、sitemap、robots 與 35 個實際資產。檢查會阻擋管理員內容、本機網址和 PHP／資料庫檔案；正在驗證語系。
- Cloudflare 帳號 info@dropout.tw 已核對；Account ID `3baadbd4abd9fd63c7f7e51664b26f67`。已新增 playtt.tw Free pending zone `9c94931060eab525473cbcd17346d8e6`，NS `karl.ns.cloudflare.com`、`mariah.ns.cloudflare.com`，未更動 Gandi NS。
- Cloudflare 掃描匯入 11 筆 DNS；webmail CNAME 已設 DNS only。Gandi DropOut 帳號已登入，playtt.tw 顯示期限 2027-11-17，正在備份完整 DNS 和核對 DNSSEC。
- Zeabur 專案 LetsPlayWebsite `6926869de253c26501bdc21a`，唯一服務 playtt `69268af7e253c26501bdc2e1`，環境 `6926869d9ded7fb3e124e339`，狀態未部署／暫停、舊部署已移除。來源 dropout-tech/playtt master，最近 3 筆部署標題與 Git 備份相符。無掛載硬碟；playtt.tw／www.playtt.tw 指向 HTTP :8080；有 PASSWORD、PORT 兩個遮蔽變數，未輸出值。
- 自動審核拒絕 Cloudflare「Continue with GitHub」，理由是可能新增 OAuth 儲存庫存取授權。未繞過，準備直接檔案上傳；自動發布權限需待具體設定可審閱後處理。
- npm audit 發現開發工具相依公告，報告在 `wordpress/test-results/npm-audit.json`。靜態網站不部署 node_modules、PHP 執行器或資料庫；仍須修正可更新依賴，記錄剩餘風險。
- Cloudflare 完整 WordPress 免費後台尚未實測。已找到 wp-codebox Worker/R2 上游持久化成果，但現行設定 cpu_ms=300000，不能以其證據宣稱免費可用；Containers 付費路徑已排除。

下一步：完成靜態版本驗收與免費預覽 → 全量 DNS 備份／核對及正式恢復 → 免費 WordPress Worker 實測與必要取捨 → GitHub 交付、操作文件及驗收 → 清除 Zeabur。

## 初始紀錄

更新日期：2026-11-16。目標 active；尚未正式搬遷。

## 工作位置

- 分支：`codex/playtt-wordpress-cloudflare`
- 原始版本：`e4b6ebf5f2bf8bcea676aec438d92136e9909240`
- 完整 Git 備份：工作目錄上一層 `playtt-before-migration.bundle`；已通過 `git bundle verify`。
- 主題與工具：`wordpress/`，不改動現有 React 站，方便復原。

## 已完成

- 克隆原始碼與所有 Git refs，建立獨立分支及完整 bundle。
- 取得原站內容、圖片與路由。辨識現有 HashRouter、LINE／Facebook 入口不一致、課程價格與據點待確認項。
- 寫入 WordPress 區塊主題的設計設定、樣式、模板、舊網址相容程式、starter 匯入功能及內容產生工具。
- 安裝 WordPress 官方 Playground 與 Wrangler；準備本機 WordPress 安裝、編輯及資料保存驗證。

## 尚未完成／驗證

- 主題尚待完成實際安裝、編輯、視覺與響應式測試。
- Cloudflare CLI 未登入；瀏覽器權限正在核對。Account ID、Zone ID 未取得。
- Gandi 完整 DNS／註冊商、Zeabur 本專案全部資源尚待權限核對。
- WordPress 全 Cloudflare 免費架構尚未證實；Containers 付費不符合需求。
- 正式站仍待恢復，沒有變更 DNS 或刪除 Zeabur。

## 下一步

產生品牌區塊版型，啟動 WordPress，測試安裝、編輯、重啟保存、媒體及匯出；完成 Cloudflare 帳號連線後建立免費預覽，再準備正式網域切換。
