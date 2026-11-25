# 歷史修訂網址搬移與原生還原

原有18筆歷史修訂仍包含28處已停用測試origin，還原時可能重新帶入舊網址。這次只在私人rebuild站處理：從完整校驗備份 `4e46e92b-788c-4ede-a2d0-7695153ea4e2` 建立候選，僅變更 `_tables/posts.json` 中18筆revision的post_content，68筆資料的ID、GUID、日期、其他欄位及其餘所有檔案不變。

三個不可變物件上傳後逐一下載驗SHA，再於寫入fence內核對原pointer／version138，單調採用version139、revision `b2184d10-2c66-4036-aebe-a7ca86cc0f49`。沒有重設資料或切換正式站；publisher維持paused。

原生REST讀回頁首、頁尾與導覽選單的全部23筆修訂，內容、標題、父層及數字修訂ID與候選一致。18筆網址已搬移，其餘5筆保持不變。最初驗證器誤把版型的字串id當成數字修訂ID；固定版本核心的template revisions controller使用wp_id，修正驗證器後通過，沒有重套資料。初次失敗紀錄保留。版型API不提供GUID，因此GUID由完整資料表比對驗證。

## 原生還原揭露的保存缺陷

自有草稿140使用已搬移的歷史頁尾內容，原生revision.php頁面提供nonce，透過原生POST還原修訂141。首次新登入讀回少了末尾一個LF，驗收立即停止，未把差異忽略。完整失敗備份 `deae93bb-ba08-4c29-a333-53490ec1d6e4` 保留了原LF，證明資料有寫入備份。

固定PHP-WASM／MDI的7案例重現：full parse及lazy read的rtrim刪掉末尾換行、空白、Tab。原生WordPress修訂表與Markdown輸出仍保留字元。這是內容讀取缺陷；修正與重新驗收見 [內容位元組保存](../content-bytes/README.md)。不將原始失敗改寫成成功。

`playtt-history-origin-prepare.mjs`只做本機候選；`playtt-history-origin-remote.mjs`分upload／apply／verify，固定私人目標及原版本。已套用的plan不可刪除重跑。`playtt-history-native-restore.mjs`保留最初自有草稿測試；它的guard禁止重建同一試驗。後續由content-bytes的恢復工具接續同一草稿，不重做原始資料搬移。

最後完整備份、原資料保持不變及自有資料清理結果見 `playtt-history-origin-final.json` 與 [總驗證](../../../docs/verification/cloudflare-history-content-summary.json)。本輪是原生HTTP與資料驗證，不宣稱重跑瀏覽器UI或手機驗收。
