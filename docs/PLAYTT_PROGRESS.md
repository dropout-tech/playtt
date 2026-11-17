# PLAYTT 執行進度

## 目前結論（2026-11-17 14:21）

正式playtt.tw六頁與LINE入口再次唯讀確認正常，仍由Pages服務，原創視覺保留。全Cloudflare WordPress候選尚未通過穩定度驗收：小幅WASM記憶體擴充仍在原生樣式儲存後重置，不將成功的較小測試推論為完整可用。詳細證據與可重現候選見experiments/cloudflare-wordpress/memory-investigation/。

私人還原區已保存294個索引項目的獨立一致性備份；R2確認77個語言檔、管理員zh_TW、初始化外掛已移除、全域樣式覆寫已清空。然而HTTP操作回應失敗，語系及編輯流程不算完整通過。測試發布器目前paused以免重試；這不是暫停整體目標，正式站及原主要資料區未更動。

已提出零新增費用的架構選擇：先交付本機WordPress＋Cloudflare官網，或保留官網並繼續雲端後台研究。尚未收到選擇，不擅自更換架構或啟用付費。一般Workers付費方案也有128MB記憶體限制，不能當成已驗證解方。官方來源：https://developers.cloudflare.com/workers/platform/limits/#memory 。


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
