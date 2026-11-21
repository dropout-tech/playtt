# WordPress 與 Cloudflare 操作手冊

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

## 心跳政策整合（2026-11-21）

新增 editor-heartbeat 選用階段，接在 markdown-write 後。若需要 background-write 本機診斷，須先安裝其工具再套 editor-heartbeat，因前者鎖定舊 worker prerequisite。旗標 PLAYTT_EDITOR_HEARTBEAT 僅精確值 native-30s-v1 啟用，其餘關閉；本輪 20 份設定均未加入。不要將 30 秒當寫入額度保證，connectNow 保留立即連線能力。未部署、零雲端請求；未來 provider 工作仍接既有 161／pin13 owner，禁止提高 cap、退款或刪歷史。詳見 experiments/cloudflare-wordpress/editor-heartbeat/README.md。

## 本機背景寫入診斷（2026-11-21）

background-write/ 為本機工具包，先依 REBUILD 組裝到 markdown-write，再用 install-local-tools.py 加入九個工具。來源與 20 份設定不變；範例政策只注入本機 bundle，不可視為已部署選項。現存診斷 owner 都已結束，切勿刪 guard 重跑。

本輪未查詢或修改 Cloudflare。下一個雲端窗口仍須接 markdown-provider-cold-ui owner 與 verified markdown-provider-cold-backup（161／pin13）；剩餘 1881041 bytes 是前輪 06:28:14Z 讀值，不能提高 cap、退款或刪除歷史。正式 Pages／視覺與 draft PR 維持現況。30 秒政策的 runtime 旗標整合、背景／斷線邊界及 provider 驗證仍待；詳見 experiments/cloudflare-wordpress/background-write/README.md。

## 最新私人狀態：161／pin13，全部封存（2026-11-21）

最終Worker為9f5aa2c1-3348-4e5f-ae61-776a1b3cd51a，來源67dd308有界讀寫，實際content/readback旗標皆移除。06:28:14Z只讀確認canonical161／3021e7bd-a125-439d-9027-11005ea71316、13pins、剩1881041bytes、closed/sealed、pending0、fence解除、publisher paused。所有觀察／測試程序與自有瀏覽器分頁結束。正式Pages／原視覺維持。

下一窗口必須接 `artifacts/playtt-markdown-provider-cold-ui-owned-private.json`，完整備份接 `artifacts/playtt-markdown-provider-cold-backup-owned-private.json`（verified，161）。不要重用130或154owner，勿移除guards重跑。這輪兩個窗口合計4054689bytes／106puts，總額度150000000未改、歷史與13pins保留。第一窗口重開因容量不足被拒，第二窗口只接續重開登出；原生核心清掉過期autosave204／footnotes75，正式修訂205保留。本次session登出、登入前5個session精確保留。

先在本機研究背景快照寫入，不再直接重複provider流程。新的observer工具由同一程序持有真實tail handle，challenge查詢每次檢查存活和deadline，並收尾關窗封存；4項工具測試通過。第一個256KiB headroom門檻不足以保證整個重開流程，接續工具增加1MiB及12操作預留，但這也不是全面成本預測。runtime與20設定未再改，77來源／131輔助檔一致。詳見 `experiments/cloudflare-wordpress/markdown-write/README.md`。以下為歷史狀態。

## 本機候選新增 Markdown 有界寫入，雲端仍130／pin11（2026-11-21）

第12階段 `experiments/cloudflare-wordpress/markdown-write/` 已完成本機HTTP恢復與Chrome原生編輯／保存／重啟驗證，尚未部署。77來源／119輔助檔可重建，20設定不變；既有雲端版本仍1c55f0fa／來源bbe6a4d。05:41:13Z只讀確認130／pin11、剩5935730bytes、pending0、closed/sealed、fence解除、publisher paused。不要把本機134或UI149當雲端版本。

下一次provider必須使用新候選來源guard與新owner，接下方content-io-provider-cold owner及verified備份130；不要改舊工具guard來重跑。原生瀏覽器有登入、heartbeat、偏好等額外寫入，窗口規劃須全部計入，保持既有額度與pins。observer與原生操作須共同協調並確認剩餘期限；只見ready檔不代表仍在觀察。全新候選先在私人環境驗證並完整備份／封存，正式Pages與原視覺維持。以下為歷史狀態。

## 最新私人狀態：並行相容讀取器，130／pin11（2026-11-21）

最終Worker版本1c55f0fa-5b78-4f39-917d-9a0b03e7d1ab含bbe6a4d並行讀取器，content/readback實際bindings停用。canonical130／566e44a3-c953-423e-adde-2b0124ece358、11pins、剩5,935,730bytes，pending0、closed/sealed、fence解除、publisher paused。最後1byte窗口0bytes／0操作，所有程序結束。正式Pages不變。

下一次窗口必須接 `artifacts/playtt-content-io-provider-cold-owned-private.json`，完整備份用 `playtt-content-io-provider-backup-owned-private.json`（verified）。前content-provider-cold／126owner已過期；新helper固定130來源／狀態，不得重跑舊一次性操作或移除guards。保留歷史／pins／額度。部署後登入200，但90秒observer先結束，冷路徑證據不足；下次觀察與操作須在同一程序協調並在原生呼叫前確認診斷未到期。已完成的窗口不要只為補trace而重跑。詳見 `experiments/cloudflare-wordpress/content-io/README.md`。以下為歷史。

## 最新本機候選：content-io；雲端仍126／pin10（2026-11-21）

第11選用階段僅調整content-v1替換物件讀取為最多4個並行，出錯停止排新工作並等已開始工作結束；格式、writer旗標與20設定不變。115項檢查及備份126的真實本機WordPress重啟／備份／完整包回退通過，尚未部署。03:30:27Z只讀核對雲端126／pin10／餘6,604,978bytes，仍closed/sealed、pending0、publisher paused。現有eb809ce8仍含逐項讀取程式，勿把本機改進當已上線。

新候選工具與重建方法見 `experiments/cloudflare-wordpress/content-io/README.md`。本機故障包裝器只能使用新副本；provider舊工具固定來源雜湊／基準，不能移除guards重跑。下一次有界provider測試需新工具，接最新content-provider-cold owner及verified備份126；任何變更後必須保存完整備份並重新封存，保留既有pins／歷史與額度。正式Pages不變。下方均為各階段歷史狀態。

## 最新私人狀態：差異保存126／pin10，旗標已停用（2026-11-21）

Worker `playtt-wp-free-session-audit` 最終版本eb809ce8-c6e9-4dce-9a5d-d0fceb54896c保留content-v1相容讀取器，實際bindings無PLAYTT_CONTENT_OVERLAY／PLAYTT_EDITOR_READBACK。canonical126／c7933a7c-c54e-4dc7-8a01-7888418761e8、10pins、pending0、closed/sealed、publisher paused、餘6,604,978bytes。不得直接回退到不支援新格式的舊程式；離線materialized完整副本已驗證，但未切換雲端pointer。

下一次寫入／關窗須接最新 `artifacts/playtt-content-provider-cold-owned-private.json`；其1byte窗口已關閉、0bytes／0操作。備份owner為 `playtt-content-provider-backup-owned-private.json`（verified），主完整包仍4916d283。先前content-provider或readback-provider窗口owner均不是目前窗口，不能用舊token重開。一次性exercise／backup／pin已完成，不重跑、不移除guards。封存會在PHP前擋所有原生入口，包含登入GET；不要據此誤判資料還原失敗。provider後續原生登入200但缺DO trace，僅宣稱可讀；未改任何正式Pages。

## 最新本機候選：content-overlay，雲端未啟用（2026-11-21）

`PLAYTT_CONTENT_OVERLAY=content-v1`僅在本機Miniflare與dry-run參數測試，20份組裝設定未改。來源增加相容讀取器，但目前雲端1075e061仍是舊來源，canonical122／9pins／餘7,271,788bytes。任何後續私人測試須從最新readback-provider owner／備份122接續，不重跑已完成的118一次性工具；目前仍closed、sealed、pending0、publisher paused。

新格式保留完整清單並直接引用完整base；既有v1/v2讀取器不支援。先用相容程式停用寫入旗標並保存成完整快照、核對備份與冷啟動，再考慮降版；單純關旗標或部署舊程式不等於資料已轉回。離線materialization只建立新的本機完整bundle，不變更雲端pointer。既有retention proposal對此格式會拒絕，不可跳過檢查、刪base或清除pin。runbook：`experiments/cloudflare-wordpress/content-overlay/README.md`；本機工具只能對新副本執行，不能部署fault wrapper。

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
