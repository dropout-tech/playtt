# 0.3.3 課程與營業內容整理

[公開預覽](https://1bb1c274.playtt-brand-preview.pages.dev/class/)已發布，deployment1bb1c274-c2dd-4aa4-ac47-40ed0e216bc7，Preview分支commit50c9bbc02515bce64a080fa0729d2efc0d5ea25a，來源4bb8d0254b4bc01fad96bc9d6950ae06e937bc9c。[遠端49檔](preview-http.json)／[正式46檔原樣](production-http.json)／[遠端QA與SEO讀回](preview-browser.json)均通過；404與301相符。

2026-11-25，對照[內容查核](../../CONTENT_REVIEW_20261125.md)發現0.3.2候選仍顯示舊價目、未核定L1–L12及客服時間，並把待確認是否相同的菁英／選手班合併。0.3.3保留歷史內容於內部文件，候選頁面改為洽詢現行安排。

- 六個入口：兒童／成人小班、個人教學、菁英培訓洽詢、租桌、營隊及包班。
- 課程流程保留資料庫已有的暖身、球感、動作練習與互動挑戰；新增學習安排與檢定洽詢，不編造學期課綱、測驗級數或通過標準。
- 七題QA涵蓋初學、預約、教學內容、親子／不同年齡需求、體驗費用、球具及請假補課退費。未確認的規則引導報名前洽詢，沒有宣稱特殊班型已開或體驗免費。
- 新匯入課程頁標題及description同步更新。正式Pages內容與私人後台維持現況。

## 驗證

本輪使用專案附帶Node24.18.0。匿名WordPress匯出六頁／51檔，靜態驗證通過；[匯出清單](export.json)。本機第一次匯出因沙箱阻擋loopback而失敗，程序已退出；允許本機連線後以新副本成功。靜態預覽第一次同樣無法從Chrome連線，停止後重新開啟已授權的loopback服務，沒有重用仍在執行的程序。

[Chrome版面與操作](local-browser.json)：首頁、課程與據點各375／768／1440px共9組，實際寬度相符、無水平溢出、單一h1、已載入圖片無壞圖；七題QA逐一點擊開啟，Enter關閉，答案讀回正確。console warn/error為空。開啟本機頁面時瀏覽器額外請求favicon.ico得到404，不影響課程／QA功能，未列為必要資產。

三張截圖為本機靜態呈現；FAQ截圖記錄列表關閉狀態，展開／鍵盤結果以JSON紀錄為準。viewport已reset、自有分頁關閉、9422與9435無監聽。測試服務為主動停止，未當作自行正常退出。

[主題ZIP](package.json)為42檔，與Git index逐檔一致。這是文案及區塊組合調整，沒有重跑完整原生編輯器保存試驗；既有完整原生證據屬0.3.1。手機為Chrome模擬尺寸，尚非實體裝置驗收；後續補做的同版本PSI量測見下節。

## 0.3.3 手機效能實測

2026-11-25 03:39（Asia/Taipei）對本頁所列固定0.3.3部署各啟動一次PageSpeed Insights，兩個工作皆完成，未重跑挑選較高分數。環境為模擬Moto G Power、慢速4G、Lighthouse13.6.0、HeadlessChromium157.0.8103.38。之前0.3.0分數仍留在原紀錄，不改標版本。

| 頁面 | 效能 | 自動無障礙 | 最佳做法 | SEO | FCP／LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [首頁報告](https://pagespeed.web.dev/analysis/https-1bb1c274-playtt-brand-preview-pages-dev/8c5tkc7p07qixhb2jwotq7?form_factor=mobile) | 100 | 100 | 100 | 69 | 902／902ms | 0ms | 0 |
| [課程報告](https://pagespeed.web.dev/analysis/https-1bb1c274-playtt-brand-preview-pages-dev-class/g4ypociulip57crtes1i8x?form_factor=mobile) | 100 | 100 | 100 | 69 | 901／901ms | 0ms | 0 |

[結構化摘要](pagespeed-preview-0.3.3.json)／[首頁原始可見報告](pagespeed-home-033.txt)／[課程原始可見報告](pagespeed-class-033.txt)。精確毫秒值來自各報告可見的計算機連結；頁面指標顯示四捨五入的0.9秒。僅保存手機結果，未將DOM內另載的桌機指標混入。

兩頁的SEO扣分為預覽封鎖索引，保留noindex。圖片尺寸診斷展開後列的是頁首／頁尾兩張原SVG字標；既有viewBox／CSS比例及[0.3.1延遲載入測試](../theme-0.3.1/svg-layout.json)保留，本輪也未觀察到位移。報告仍列阻擋算繪估計400／410ms、快取估計344／16KiB、首頁圖片估計232KiB可改善；這些估計不是實際退步。沒有為清除未計分提示而修改已驗證的原生圖片區塊，亦未延長可編輯靜態檔的快取期限。

這兩次單頁實驗沒有顯示新版效能退步，但不是控制其他條件後的因果比較。[Lighthouse官方說明](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)指出分數會隨底層條件變動。兩頁都沒有實際使用者資料；依[Web Vitals說明](https://web.dev/articles/vitals)，不能用這兩筆實驗代替第75百分位實際使用者LCP／INP／CLS驗收。自動無障礙100也不代表螢幕閱讀器、繁中輸入法或實體手機皆通過。

沒有新的部署、私人Worker請求或資料寫入；只新增量測證據。兩個量測分頁已關閉。

![桌機課程頁](class-1440.jpg)

![手機課程頁](class-375.jpg)

![手機QA列表](faq-375.jpg)
