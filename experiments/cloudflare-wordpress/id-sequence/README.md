# 刪除後冷啟動的自增編號保存

私人候選已修正原本的ID重用缺陷，僅部署獨立audit Worker，最新版本`568bf784-6bbb-4f53-a13b-07e0f38e657a`。正式官網保持Cloudflare Pages與原站視覺；此處不是後台正式切換驗收。

## 問題與修正

原本建立草稿204、205，刪除205並重啟後，新草稿又得到205；對舊ID寫入會修改新草稿。原始失敗`cloudflare-id-sequence-check.json`及原始`playtt-id-sequence-local.mjs`保留。第一版只修storage-runtime啟動路徑，普通WordPress仍走wpdb而失敗；`cloudflare-id-sequence-incomplete-hook-check.json`亦保留，未用新結果覆蓋。

MDI以Markdown/JSON為canonical、SQLite為可重建快取。SQLite的AUTOINCREMENT透過sqlite_sequence保留曾用的最高編號；僅還原現有列會遺失刪除歷史，不能只修loader對未編號Markdown的compute_next_id_start。[SQLite官方說明](https://www.sqlite.org/autoinc.html)

新`playtt-id-sequences.ts`把序列存於`_runtime/playtt-auto-increment.json`，schema為`playtt/auto-increment/v1`，值使用十進位字串以保留64位整數。最多512表、128KiB，嚴格驗證表名、schema及非負整數範圍。讀取壞資料及寫入失敗會拋錯；暫存檔原子rename，未變內容不重寫。所有固定來源比對成功後才套用PHP補丁。

三個固定MDI接點：一般wpdb冷／暖loader執行後、explicit storage-runtime的兩種bootstrap後，以及write-engine flush開始時。載入完成後提高序列而不降低較新的值；空表也恢復序列，尚不存在的表保留歷史。flush在無dirty早退前保存，讓原生GET初始化的序列能隨既有完整快照協定提交。這份JSON與內容、媒體同一manifest及restore pack提交；不保存可丟棄SQLite本身。

## 已執行的驗證

- pinned PHP web WASM/PDO SQLite：30項通過，含六種自增表、最高編號刪除、空表、既有較高序列、超過JavaScript安全整數、壞資料拒絕、寫入失敗及真實wpdb冷／暖入口。另驗證來源比對失敗時沒有部分寫入。
- 本機REST刪除209後取得210；本機原生auto-draft刪除221後取得222；遠端REST刪除107後取得108；遠端原生auto-draft刪除110後取得111。各輪對舊ID的寫入均404，新草稿未改，原公開頁面雜湊相同，逐筆身份核對後刪除本次自有草稿。遠端native prepare於11月17日，check於11月19日相同程式重新部署後完成。
- TypeScript通過；完整本機七筆發布回歸21.991秒，原內容與頁尾復原、測試頁清理、publisher paused，程序exit0。
- 遠端R2備份`c1423c9b-b818-4410-92f7-dff11ccb8d15`所有項目解碼／雜湊校驗通過，包含8表的序列，wp_posts=111，即使測試草稿已刪除仍保留。這輪沒有另建第三個空白遠端環境完整還原這份備份。
- 兩段觀測合計197事件，outcomes={'ok': 197}。中間沒有連續觀測，不代表完整請求數、長期穩定性或isolate總記憶體。詳細見`cloudflare-id-sequence-observation.json`。

原生auto-draft驗證使用真正的`/wp-admin/post-new.php?post_type=page`建立流程，後續由REST比對；本輪不是瀏覽器舊分頁操作。原先完整繁中原生編輯證據在request-body目錄，證據範圍分開。

## 重現

先依既有候選順序套用至`request-body/request-body-candidate.patch`，再套用本目錄`id-sequence-candidate.patch`。兩個來源檔的精確LF雜湊見`cloudflare-id-sequence-reproduction.json`。保持固定依賴，將三個新mjs放runtime/scripts。

1. `node scripts/playtt-id-sequence-php-check.mjs`執行實際PHP/SQLite與固定wpdb入口檢查；`tsc -p tsconfig.json --noEmit`。
2. 本機執行`playtt-id-sequence-check.mjs --local --mode=prepare`，停止並重啟相同9429資料目錄後執行`--local --mode=check`。加入`--native-last`測原生auto-draft。
3. 遠端須明確`--remote`，腳本鎖定私人audit網址與restore-v1，要求發布器paused；prepare後相同audit設定重新部署，再check。不可替換成正式網址。憑證只由本機秘密檔讀取。
4. prepare的自有資料指標寫入artifacts內的`*-owned-private.json`檔；有未完成資料即拒絕另起prepare，清理須逐筆核對ID、狀態、標題、內容。完成後不可重跑check。先前失敗原始腳本僅供重現歷史，不用於現在遠端。
5. 用既有`scripts/playtt-snapshot-audit-backup.mjs --remote`取得一致性備份，再`playtt-id-sequence-backup-check.mjs --offline`核對序列與本輪最高編號。備份含私密資料，留本機outputs，不能提交Git。

## 保存與回滾限制

舊快照沒有序列紀錄時，只能從目前尚存資料開始，無法重建過去已刪除ID。這輪遠端啟用時從106重新起算，不代表曾經發出的所有測試ID已被追溯保護。若既有真實站要導入，必須從原資料庫的sqlite_sequence或可信完整來源一併遷移，不能隨意指定高起點。

刻意回復更舊備份會回到當時資料與序列；不要把本修正理解為跨任意歷史回滾永不重用。保留當前完整備份，回復後重新載入編輯分頁並驗證資料身份。不要退回不保存序列的程式後繼續寫入。自動草稿清理、操作體驗及交付仍待，整體目標active。
