# Let’s Play 驗收狀態

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
| A04 免費 WordPress 架構 | 私人候選有限驗收通過；營運待驗 | a33083f3通過410次讀取、多次釋放重建、原生auto-draft保存與匿名拒絕，後續七筆發布回歸通過；先前記憶體失敗保留。更長原生編輯、目前版本獨立還原與操作交付仍待，正式後台不切換。 |
| A05 主題安裝 | 已驗證本機與隔離遠端 | 0.2.3 ZIP 真實 Theme_Upgrader 安裝、啟用；9 項本機整合測試與遠端品牌匯入通過。 |
| A06 編輯與發布 | 私人候選有限驗收通過 | 原生段落、修訂、頁尾、繁中導覽與樣式保存／重部署／還原已有驗證；新候選另通過原生GET草稿跨多次重建與遠端七筆發布，正式Pages仍維持現況。 |
| A07 資料保存還原 | 已驗證本機與隔離遠端 | 遠端重新部署後內容／圖片／主題保留；215筆備份索引經校驗、去重210物件，從本機備份還原至另一私有R2與新DO分區；六頁、圖片SHA256、主題與備份時間點通過。正式後台配置後仍需重做最終備份。 |
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
| A20 交付 | 部分 | 主題、品牌規範、操作手冊、PR與證據已有；待完整後台架構、遠端資料驗收及內容核對。 |

之前 Wrangler 權限擴大遭自動核准審查拒絕；使用者已明確授權必要的 Scripts Write / Routes Write，該阻礙已解除。後續已建立本專案獨立登入，包含必要的 Tail Read 供實測診斷。探針使用隨機 Secret，不包含正式使用者資料，未設定正式網域路由。

主要證據在 `docs/verification/`：`wordpress-integration.json`、`pagespeed-baseline.json`、`pagespeed-after.json`、`production-mobile-0.2.3.json`、`production-console-0.2.3.json`、`cloudflare-apex-public-http.json`、`cloudflare-canonical.json`、`cloudflare-rollback.json`、`dns-postcutover-check.json`、`dns-mail-public-verified.json`、`cloudflare-boot-remote.json`、`zeabur-removal.json`。原始完整量測畫面文字與含設定的備份僅保留本機 outputs，未將敏感設定放入公開程式庫。
