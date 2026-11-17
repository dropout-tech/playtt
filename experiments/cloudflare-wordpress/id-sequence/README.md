# 未解決：冷啟動後重用已刪除文章 ID

這是阻止正式後台驗收的實際失敗，尚未修正。只在本機隔離資料驗證，未對正式官網或遠端其他內容做覆寫試驗。

建立有唯一標記的草稿204、205，核對身份後刪除205。停止並重新啟動同一本機runtime，再建立第三份草稿，取得205。對「先前已刪除的205」送出REST內容修改，實際改到了第三份新草稿，標題仍為新草稿。測試僅對本次自有資料操作，隨後還原並刪除兩份測試草稿；原七個公開頁面雜湊不變。這是受控REST目標重用證據，尚未操作真實舊瀏覽器分頁。

結果見cloudflare-id-sequence-prepare.json與cloudflare-id-sequence-check.json（fail且cleanup通過）。腳本先執行 `--local --mode=prepare`，停止並重開127.0.0.1:9429後執行 `--local --mode=check`。它拒絕remote，只刪除ID／唯一標題／預期內容相符的自有草稿；不要在完成cleanup後重跑check。

固定MDI目前以Markdown/JSON為canonical，SQLite為可重建快取。loader.load_all建立表並載入目前資料；冷啟動後不存在的舊ID不在現有列中。loader.compute_next_id_start使用wp_posts與_tables/posts.json最大ID指派未編號Markdown，但正常WordPress INSERT使用driver.get_insert_id，不能僅憑前者判定完整根因。

下一步須確認SQLite自增序列未被保存的位置，持久保存有上界的編號高水位，還原／冷啟動時恢復；覆蓋新增、刪除、原生auto-draft、文章／媒體／使用者等有自增鍵的範圍，以及舊快照相容與壞資料拒絕。不可改用隨機ID、隱藏刪除、跳過身份核對，或把這次失敗改寫為通過。原正式Pages保持現況。
