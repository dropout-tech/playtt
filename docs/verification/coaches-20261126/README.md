# 2026-11-26 教練官網更新

使用者指定 `D:\Downloads\.pptx` 並確認全檔皆現役、要求更新官網。23頁依原序整理；第6、7頁皆李承翰但履歷不同，已詢問使用者，暫緩兩頁，先發布21位。王泳程按最新現役名單納入。完整來源與取捨見 [查核紀錄](../../COACH_REFERENCE_20261126.md)，店家剩餘需求見 [可轉傳訊息](../../OWNER_CONTENT_REQUEST_20261126.md)。

## 發布與回復範圍

- 正式 `cloudflare/public` 只替換 `coaches/index.html` 的 main，增加21張照片。原頁首、頁尾、CSS及另外五頁原始 bytes 不變；[雜湊清單](production-stage.json)保留所有原檔與候選指紋。
- 正式基準提交 `591da3cdfaf851d8ef48553565c73d6823da57a7`。可從該提交回復教練HTML並部署；新增且未引用的圖片不影響回退。另存本機 `outputs/coach-reference-20261126/coaches-before.html`。
- 主題0.3.4保留原生 WordPress 區塊，來源 `wordpress/content/coaches.json`，兩頁待釐清者以 `pendingIdentity` 排除。舊React素材整理工具只在缺少名單時建立種子，不覆寫新版人工整理資料。
- 21張 WebP 共1,295,100 bytes；來源映射與指紋見 `wordpress/content/coach-photo-assets.json`。原PPTX未改；沒有臉部辨識或生成照片。
- 完整品牌匯出僅更新預覽分支。沒有私人Worker、Supabase或帳本寫入；PR4仍草稿。

## 本機驗收

- Node24.18.0；匿名WordPress匯出六頁／65檔。正式混合候選六頁／69檔通過靜態連結、圖片尺寸與檔案檢查。
- 瀏覽器1440×1000、768×1024、375×812均無橫向溢出；21張照片捲動後全部載入。
- 21個經歷以點擊展開、Enter關閉；最後0個展開。手機選單開關通過；檢查時console warning/error為0。
- [桌面畫面](desktop.jpg)／[手機畫面](mobile.jpg)。桌面與手機都是瀏覽器模擬尺寸，未宣稱實體手機驗收。
- 0.3.4安裝ZIP：63檔，2,199,824 bytes，SHA256 `2eb15d1f36ba713aee4b71f13a84ca296eaa73e39741086f17cbc4ae6eac0c96`。

本輪未重做效能跑分或原生視覺編輯完整驗收。年資、證照與成績依使用者提供資料整理，不代表獨立查證；Peggy照片為簡報比賽場景，可日後替換更清楚個人照。

0.3.4 本機 WordPress 整合檢查9項通過：ZIP安裝、六頁及35張素材匯入、重複匯入保留人工修改、未登入權限、內容與修訂還原、草稿隔離、媒體下載、重啟保存與獨立備份還原。詳見 [原始結果](local-integration.json)。這是本機測試，不代表 Cloudflare 後台驗收。
