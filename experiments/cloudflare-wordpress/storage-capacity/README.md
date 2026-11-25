# 私人 WordPress 寫入容量保護

2026-11-20：私人 rebuild Worker 已加入持久化容量預留。正式 Pages、原站視覺、daily-source 程式與發布狀態保持現況；沒有切換後台、升級方案或清理歷史快照。PR #4 仍為 draft，整體目標尚未完成。

## 寫入規則

新增 SQLite Durable Object `PlayttStorageBudget`，只在明確設定的 `playtt-wordpress-rebuild-audit` 範圍啟用。初始化前取得既有可續期 mutation fence；逐頁列舉現存 R2 payload 得到基準，再開放寫入。未初始化、設定錯誤、帳本毀損或無法取得有效預留證明時，寫入前回傳 503。私人設定上限為 1,000,000,000 bytes；超限回傳 507 與 WordPress JSON 錯誤，明確表示變更尚未保存。

每次 R2 put 都先在帳本交易中計入完整 payload bytes。覆寫、條件不成立、寫入失敗、回應遺失、中斷與刪除都不退款；因此已知基準加上所有寫入嘗試是保守上界。沒有重設或自動重新盤點 API。Worker、PHP execution DO 與 state coordinator 都使用包裝後的 bucket；目前範圍只允許 `sites/default/` 與 `runtime/`。未知長度串流及 multipart 上傳拒絕執行，不把它們整份緩衝進 PHP isolate。

這是單一私人桶的 **payload 寫入上限，不是帳號費用上限**。R2 metadata、Class A/B 次數、DO 請求、其他桶及直接使用 CLI/API 寫入不在此保護內；外部寫入會使原上界失效。每次 put 額外需要一次 DO 預留，長期用量與延遲仍須測量。不能從這份限制推論永久免費。

## 部署交接

初次超限測試成功後，恢復上限的腳本曾在第一次狀態檢查失敗，尚未送出恢復保存。保留原始失敗報告，沒有當作全程一次成功。平台紀錄顯示 03:20:05 UTC 的前端 Worker 已是 `4f6c9fe6`，容量 DO 仍是 `45e14d25`；03:20:23 容量 DO 才出現新版本。最初 assertion 沒有記錄 actual/expected，不能補造當時的回傳值。

因此增加 `playtt/r2-capacity-reservation/v1` 協定：呼叫端傳入自身上限，DO 使用兩者較小值；成功回應必須包含協定、已預留標記、相符 bytes 與不高於呼叫端的有效上限。舊協定、缺欄位、不同 bytes 或過寬上限均拒寫。DO 也拒絕沒有上限的新請求。這些交錯版本情境有本機測試。

日後改程式或調整上限應先取得並維持 mutation fence、排空既有工作，再部署。部署命令成功不足以放行：以私有狀態端點確認容量 DO 協定與預期上限、帳本數值，以及 canonical pointer 均正確後，才解除自己持有的 fence。仍在飛行中的舊版本可能使用先前設定，不能只憑新 Worker 版本號宣稱已完全切換。這次最終加固部署按此流程執行。

`playtt-capacity-control.mjs`、native audit 與 recover 腳本保留的是這次固定 fixture／pointer 的證據流程，**不是可任意重播的維運指令**。草稿 181 已清除，兩個自有 fence 都已解除；不要重跑已完成的建立、恢復或清除步驟。`--status --remote` 是唯讀狀態檢查。新的實驗需新 identity guard 與獨立報告，不得覆蓋本次證據。

## 實測

- 本機 36 項通過：11 項容量、3 項 coordinator、7 項 manifest cache、15 項 snapshot/integrity；TypeScript 通過。涵蓋併發預留、UTF-8、重啟、模糊寫入結果、遺失回應、條件失敗、串流拒絕、分頁及交錯版本。初版 dry-run、加固版實際部署成功；既有 generated PHP loader 警告未變。不是整個上游 suite 全過。
- 私人原生 REST 對自有草稿 181 強制超限時回傳 507；完整 pointer/version 305、舊內容、charged bytes／put count 都不變，lease abort 與 runtime dispose 有紀錄。此遠端拒寫是在協定加固前的版本；最終版本沒有再做一次遠端強制超限。
- 待正常上限生效後，以 fresh login 恢復同一份修改，回傳 200 且 version 只增加一；這次保存 7,495 ms，只是單次樣本。後續加固部署版本為 `3bd8c3de-8206-4bf2-82c9-f3be936affaf`。新版本有實際 cold login trace、重新登入保存 session、精確內容讀回與草稿清除證據，帳本跨部署保留。
- 基準 1,086 物件／625,679,206 bytes；最終預留 31 次／14,867,698 bytes，保守上界 **640,546,904 bytes**，上限內剩餘 **359,453,096 bytes**。事後只讀分頁列舉為 1,110 物件／640,239,740 bytes，低於上界 307,164 bytes。分頁不是原子快照；測試已結束、發布暫停且沒有其他已知寫入。
- 自有 181 與子修訂已移除。完整備份 `c0ba467c-c422-41e8-861c-64926c69e1fb` 驗證 297 索引、4,427,214 decoded bytes、ZIP 2,292,624 bytes，SHA-256 `54bde7a44ea53b1ccd36bbe964afc0ddeb3045c6ba62a90682bbcf7b3b1eb61e`。37 份原 canonical 檔、27 篇 Markdown、15 個 uploads、48 postmeta 及原有歷史保留。這是備份與比較，這輪沒有新增獨立空環境還原。
- 最終 rebuild canonical 309，daily-source 175；兩者 coherent、無 fence、publisher paused，未認證 admin／media／upload 均 404。觀察共 211 平台事件、全部 outcome ok、0 exception；另有 **1 次預期的 507 request failure 與 1 條未完成 trace**，不能寫成零失敗。觀察已停止，沒有匹配的殘留 tail。事件不是獨立 HTTP 請求數，也不是長時間穩定性測試。
- 從 pinned archive 重組 20 段 patch／64 份來源，與實測版本差異為零。新腳本與設定亦逐份比對。沒有重新安裝 dependencies 或重建 PHP assets。

## 證據與下一步

`docs/verification/cloudflare-storage-capacity-summary.json` 彙整結果；同前綴的 native、recovery、final、initialized、assembly、tests 與 observation 保存可審查證據。最初失敗與後續成功分開保留。完整物件 key 清單、fixture guard、備份內容、cookies、nonce 與憑證都留在 Git 外。

`capacity/read-inventory.py --list-only` 可做事後總量盤點，輸出 `metadataIncluded: false`；它刻意沒有保留分析所需的 metadata roots，不能拿來執行 retention。前次離線刪除候選已是歷史狀態，需要重算。

下一步是建立完整備份 pin 登錄、排空執行中工作與重新盤點的安全流程，驗證保留版本並做獨立還原，再評估可回收容量。尚未實作退款、重整帳本或自動刪除。原生編輯器超限時的視覺提示、舊 UI 取消事件歸因、冷啟動／鎖／保存延遲、實機輸入與交接仍待驗收。正式官網繼續保持現況。
