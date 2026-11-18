# WordPress 與 Cloudflare 操作手冊

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
