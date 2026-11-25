# 備份版本的持久化保護紀錄

2026-11-20：私人 WordPress 已把需要保留的備份版本登錄到現有 state coordinator 的 SQLite Durable Object。正式 Pages、原站視覺、daily-source 程式與 publisher paused 狀態維持現況；沒有新增資源、付費方案、排程、後台切換或快照刪除。

最終私人 Worker 為 `8536d0cf-cfbf-4133-9764-ae4bbfdd2c45`。登錄前後 canonical 仍是 version 309／`c0ba467c-c422-41e8-861c-64926c69e1fb`；R2 容量帳本的預留 bytes／put 次數沒有改變。保護紀錄存在 DO，不是新 R2 物件。

## 保護如何生效

`GET /__playtt-backup-pins` 回傳 generation 與已登錄版本；POST 需要 operator 身分和自有 mutation fence。僅啟用於本私人 rebuild 範圍，其他網站／未啟用容量保護的設定不提供此能力。

登錄在 coordinator 同一條序列佇列內完成：確認 fence，核對固定命名空間、revision、manifest key／時間／SHA-256，以及完整 ZIP 的 key／長度／SHA-256，然後再確認 fence 未過期，最後持久化紀錄。fence release 會等正在執行的登錄完成。遠端實際讀取 manifest 與 ZIP 的 bytes 計算雜湊，不只看物件 metadata；本機另外完整解碼每一份 ZIP、比對內容索引。

同一版本只能對應一組不可變的備份資料。回應遺失後重送同一組資料，會回傳既有紀錄、不增加 generation；不同資料不能覆蓋已有紀錄。registry 遺失 schema／毀損、物件缺失／hash 不符、鎖過期或跨站 key 都拒絕。沒有刪除、解除保護或修改 pin 的 API。

新備份流程在完整解碼校驗後登錄，遠端確認成功才寫入 `verification.json` 的 pass 結果與 `pinRegistered: true`，並保存 `retention-pin.json`。若登錄失敗，保留本機 archive 等待檢查；不能把只有 ZIP 檔當成已完成備份。舊報告沒有重寫，另補登記 receipt。

## 驗證結果

- 最初 22 份本機備份重新解碼、逐項校驗，對應 21 個不同版本；全部成功登錄。之後透過修改後的流程新增一份備份，所以現在是 **23 份已完成 archive／21 個受保護版本**。搜尋本專案 `outputs/backups` 的 `verification.json`，本桶的 23 份報告全部在已盤點範圍內；不能因此宣稱知道外部或未記錄的副本。
- 實際重送第一筆，generation 仍為 21；錯誤 fence 回傳 409，registry 不變。同程式重新部署後，21 筆完整紀錄仍與部署前一致。這是跨部署讀回與本機 restart 測試，不宣稱這輪跑過 PHP 冷啟動。
- 新備份的 manifest 與 ZIP 和前一份逐位元組相同；297 索引、4,427,214 decoded bytes、2,292,624 ZIP bytes，SHA-256 `54bde7a44ea53b1ccd36bbe964afc0ddeb3045c6ba62a90682bbcf7b3b1eb61e`。已有 pin 的新備份登錄走冪等回應。原生內容、媒體與帳號資料沒有改動。
- 私人 gate 外的新端點／admin／media／upload 均 404/noindex；通過 gate 但沒有 operator 身分為 401，不支援的方法 405，超過 8 KiB 的輸入為 413。沒有以未知 URL 或未核對的網站做測試。
- 10 項 pin、11 項容量、3 項 coordinator 與 10 項 retention 測試通過，共 34 項；TypeScript、dry-run、實際部署通過。這不是整個上游 suite 全過。初次本機執行遇到 Node strip-only 不支援 parameter property，已改為明確欄位初始化後，真實備份校驗與遠端流程均通過。
- 21 段 patch／65 份來源從 pinned archive 重組無差異；本目錄的來源、測試與腳本也逐份比對。有限觀察共 155 平台事件，outcome 全 ok，沒有記錄到 exception／request failure／未完成 trace；預期的 409／401／405／413 不代表這些 API 請求成功。觀察已停止，無匹配的殘留 tail。其後唯讀 export 另有成功報告，不列入這 155 事件。

## 保留分析與操作

`capacity/plan_retention.py` 現在強制要求已認證匯出的 registry。除了本機 pins，所有遠端 pins 都會保護對應 manifest／pack；即使本機副本搬走也保留。缺 registry、generation 不符、重複 pin、未知／錯配版本、時間異常，或本機已驗證備份未登錄時均拒絕產生分析。工具仍無 network／apply／delete 模式，`safeToApply` 永遠 false。

這次在自有 fence 期間重新列舉 1,110 物件、640,239,740 bytes、222 份完整快照。分析保留 72 個版本，列出 150 個舊 manifest 及未共用 ZIP，共 300 物件／355,062,939 bytes 為候選；**沒有刪除、沒有宣稱回收空間或費用**。分頁不是原子快照；目前 fence 並不證明所有過期 lease 的延遲寫入、其他 client 或出版工作都已排空。

在已重組 runtime 的根目錄，用既有專案憑證執行唯讀匯出：

```powershell
node scripts/playtt-backup-pins-export.mjs --remote
```

輸出 `artifacts/playtt-backup-pins-export-private.json` 與只含數量／hash 的 public report。私人檔不進 Git。從 repository root 執行離線分析時，將下列 registry 參數加到原有命令；物件 inventory 也必須重新產生，不能使用 `--list-only`：

```powershell
--registry ../playtt-delivery-rebuild/packages/runtime-cloudflare/artifacts/playtt-backup-pins-export-private.json
```

`playtt-backup-pins-audit.mjs` 是這次固定 version 309／自有 fence 的證據流程；已完成且已解除鎖，不能重播建立與解除步驟。新的研究需新 guard／報告，遇到回應遺失先查 registry，再以同一備份身分重送，不要換 revision 規避衝突。

## 尚未完成的條件

目前私人登錄每個 ZIP 最多 8 MiB、manifest 最多 256 KiB；registry 最多 128 個版本且序列化不超過 64 KiB，先達到任一上限即拒絕。這是目前有限資料的實驗範圍，大型備份仍需有界串流 hash／分頁 registry 等設計，不能據此交付成通用 WordPress 備份系統。

registry 本身不在 WordPress 的 R2 restore pack 中。完整匯出與各 archive receipt 保留本機；災難還原後，在考慮清理前必須重新登錄／核對全部保留根。尚無跨目標自動還原 pin，也不能把本機 23 份清單當成所有外部副本的完整證明。

下一步需完成執行中工作排空與完整引用盤點、核對保留快照內容，並在獨立目標還原最新內容與 pin 登錄，再評估具體清理清單及安全帳本重整。仍未實作自動 GC／退款／解除 pin；沒有新增獨立還原或 UI 操作。原生錯誤提示、取消事件歸因、記憶體、冷啟動／保存延遲、實機與交接仍待驗收，PR #4 draft、目標 active。

公開證據：`docs/verification/cloudflare-backup-pins-*.json`、測試紀錄與去敏觀察。完整 registry、備份內容、物件 key 清單、cookies、tokens、fence guard 都不進 Git。
