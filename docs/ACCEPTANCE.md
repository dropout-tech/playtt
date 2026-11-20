# Let’s Play 驗收狀態

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
