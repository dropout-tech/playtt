# 私人 WordPress 冷啟動紀錄補全

2026-11-22 的一次私人 Cloudflare 登入表單 GET 成功，HTTP 200／3,728 ms；這次同時捕捉外層回應與 Durable Object 的完整 PHP 冷啟動紀錄。2026-11-24 整理交付。完整登入、原生編輯器保存及持續免費使用仍待驗收，正式 Pages 與原視覺維持現況。

## 變更及驗證

先前觀測工具收到外層回應便結束，可能漏掉延後到達的 PHP 紀錄。新工具只接受本次起點後、相同部署版本與登入 GET 路徑的事件；需要外層 HTTP 與內層完成紀錄，並等最後相符事件後 5 秒。缺失、截斷、遲到錯誤、程序死亡及期限到期都有明確結果。11 項測試通過；既有觀測工具及 runtime 未修改。

固定候選 `19f8bc17` 暫時部署至既有 `playtt-wp-free-session-audit`，版本 `fe97f532-377a-4f07-98d3-223f1b428a74`。使用 120 秒／1 byte／1 operation 的窗口，只讀一次未登入的 WordPress 表單。資料寫入為 **0 bytes／0 puts**。請求前未呼叫完整 canonical 解碼檢查。

27 個觀測事件皆 outcome ok，例外 0。原生外層及內層各 1 個，內層為 cold／completed，總時間 2,858 ms；停止時間距最後相符事件 5,027 ms。兩次 WASM heap 採樣均為 64 MiB。這不是整個 isolate 的尖峰量測，也沒有 billed CPU 證據。平台 phase 時間受 I/O 時鐘影響；PHP phase 顯示 0 不代表零 CPU，lease-release 的 1,620 ms 不能全歸因給 lease 工作。

## 收尾與目前界線

已恢復原相容 reader，部署版本 `1a0405bc-79cb-4123-afaa-13448207f3e0`，6 個模組與全部 bindings／namespace ID 均精確回讀。canonical 181、16 pins、兩個 pointer／receipt 不變，剩餘專案寫入保護額度 62,344 bytes。窗口關閉、寫入封存、pending 0、fence inactive、publisher paused，optional writer／recovery flags 關閉。這輪共 2 次私人部署；正式站、DNS、付費方案均未變更。

最新控制 owner 是 `artifacts/playtt-native-trace-cold-owned-private.json`；資料備份仍是 `artifacts/playtt-old-provider-owned-private.json` 的 181 anchor。已完成 owner 不可重播。舊的 outer-only 證據保留，不能用新結果改寫舊測試。

目前可證明這一次登入表單的冷啟動成功。下一個有意義的驗證是相同候選的雲端原生編輯、保存、重新部署後讀回、修訂及登出；不能拿這次 GET 當作完整後台成功。現有 62,344 bytes 不足以執行先前本機約 500 KB 的完整流程。150 MB 是專案自行設定的保守 payload 累計上限，並非 Cloudflare 免費配額或費用上限；後續若調整，須先核對免費用量、持有 fence／seal、保留完整帳本及備份，再依[容量部署規則](../storage-capacity/README.md)逐項回讀。不得退款／重設帳本、清未知 ticket、刪 pin／歷史或新建替代資源來繞過保護。

## 重建與證據

接續 [lazy-provider](../lazy-provider/README.md) 的 334 個工具雜湊，新增 8 個工具，合計 342；組裝 888 檔，原 880 檔完全不變。中央 82 份 runtime 來源與 20 個設定未改。`install-local-tools.py --runtime <path> --apply` 只在前置雜湊完全相符且新檔不存在時安裝診斷工具，不部署。

離線審核：`node scripts/playtt-native-trace-audit.mjs --offline --check`。遠端 helpers 是本次固定 identity 的證據程序，不是可任意循環重播的維運指令。

證據：[實測審核](../../../docs/verification/cloudflare-native-trace-audit.json)、[觀測契約測試](../../../docs/verification/cloudflare-native-trace-tests.json)、[原生 GET](../../../docs/verification/cloudflare-native-trace-cold-result.json)、[回復模組](../../../docs/verification/cloudflare-native-trace-restored.json)、[最終狀態](../../../docs/verification/cloudflare-native-trace-final.json)、[組裝](../../../docs/verification/cloudflare-native-trace-assembly.json)。憑證、原始登入 HTML、cookies、私人 canonical 內容和原始 tail 留在 Git 外。
