# 原生編輯器受限測試：已準備，尚未執行

2026-11-24 已重新核對既有私人 Worker 的六模組、設定、canonical181、16 pins、備份與寫入封存。Workers 仍是 Free，R2 當期畫面顯示 $0.00／2.33 GB、Class A 7.32k、Class B 60.59k；帳務可能延遲。正式 Pages 與原視覺不變。

現有累計 payload 上限 150,000,000 bytes，剩餘 62,344 bytes。先前完整本機原生保存／重啟／登出流程使用 500,273 bytes，無法容納在現有餘額。這份準備案只操作既有私人 Worker／bucket／namespace，不啟用付費產品、不刪除資料或重設帳本。

## 待確認的具體操作

- 將專案自設上限提高 2,000,000 bytes 至 152,000,000 bytes；基準、累計已預留 bytes／puts 與全部 pins 保留。這不是 Cloudflare 方案或實際免費配額的變更。
- 固定壓縮核心候選 `19f8bc17`，短暫啟用已在本機驗證的壓縮內容／清單與原生 heartbeat。先持有 fence／seal，部署後核對六模組、全部 bindings／namespace、容量帳本及 canonical；通過才放行。
- 一次 600 秒／1,881,041 bytes／96 次寫入的窗口，僅既有自有草稿 193：原生登入、繁中段落修改、保存、重新部署、讀回與修訂、登出。
- live observer 全程觀測；控制查詢用輕量 state，不在原生量測期間完整解碼 canonical。新命令 ID 與原子回覆檔避免把過期檔案當成仍存活的控制器。
- 結束或失敗後關閉窗口、等待 pending 歸零、封存寫入，恢復相容 reader `95caf86b` 並逐模組及設定回讀。新修訂與所有嘗試的寫入仍保留並計帳；**恢復程式不會撤銷資料寫入，也保留 152 MB 上限**。未知 ticket 不清除。
- 雲端結果須再經獨立內容／備份核對，才能標為保存成功；CLI 或單次瀏覽器成功不能代表完整後台驗收。

自動核准審查拒絕執行，理由是既有研究授權未明確涵蓋這次持久上限增加，以及最多 1.88 MB／96 次不可退款的帳本寫入和編輯變更。已向使用者提出具體確認。**遠端 controller 尚未啟動；沒有 owner、沒有部署、沒有開啟窗口，雲端上限仍為 150 MB。不得以其他工具間接執行以繞過拒絕。**

## 已完成的準備驗證

候選與回復配置都經 Wrangler `--no-bundle --dry-run`，各六個模組 bytes／SHA 與固定來源相符；兩個方案的 namespace、bucket、routes 與 cron 範圍維持原配置。controller 的語法與本機前置檢查通過。這不是遠端 controller 的完整成功證據，該驗證仍未執行。

接續 [native-trace](../native-trace/README.md) 的 342 個工具雜湊，加入 5 個 helper，合計 347。增量組裝 893 檔，原 888 檔不變；82 份中央 runtime 與原有 20 個設定不變。臨時部署配置、身分守衛、原始備份內容與憑證不加入 Git。

證據：[準備範圍及拒絕狀態](../../../docs/verification/cloudflare-native-next-prepared.json)、[最新只讀檢查](../../../docs/verification/cloudflare-native-next-preflight.json)、[線上六模組比較](../../../docs/verification/cloudflare-native-next-code.json)、[當前用量](../../../docs/verification/cloudflare-native-next-free-before.json)。已完成且不可重播的冷啟動實測見 [native-trace](../native-trace/README.md)。
