# 私人復原上傳與持久操作紀錄

上傳已成功但回應遺失時，重送整份資料會消耗額度；儲存結果本身不明時，從物件存在不能推論原操作已結束。本候選新增固定操作編號、持久完成紀錄及僅限自有 ticket 的結清端點，區分兩者。**只在本機驗證，尚未部署；正式 Pages 與原視覺不變。**

## 啟用範圍與端點

新旗標 `PLAYTT_RECOVERY_UPLOADS=v1` 預設關閉，全部 20 個既有設定未變。還必須同時符合 probe gate=true、restore-v1 分區、playtt-wordpress-session-audit 容量 scope、tracking/window=v1、default site，以及真實 operator 授權。寫入／結清請求續租既有擁有者 fence，再由外層建立內部 proof；使用者傳入的 proof 不會轉送。Budget 不反向呼叫 coordinator，避免互相等待。

- POST `/__playtt-recovery/object`：operationId、key、sha256、size、base64、fenceToken。只接受 default 的不可變 raw object 或 revision manifest；永不覆寫既有 key。
- GET `/__playtt-recovery/status?operationId=…`：讀取操作紀錄，不改寫、不續租，也不回傳內部 ticket。
- POST `/__playtt-recovery/reconcile`：operationId、fenceToken。只處理有本地持久證據的自有操作；不接收任意 ticket 或成功斷言。

原始物件上限 1 MiB、manifest 上限 256 KiB；JSON 逐塊讀取，上限 1,400,000 bytes。base64 必須 canonical、長度與 SHA-256 精確。最多保留 128 筆操作 metadata，不留 payload，不自動刪除紀錄。滿額會停止，不是永續無限收據系統。只有不可變物件暫存，沒有 R2 pointer CAS 或採用動作。

## 完成證據與計帳

Budget 的同一 durable transaction 同時寫入 reservation、pending ticket、扣帳及 reserved receipt；沿用泛用寫入的同一額度／窗口／封存邏輯。實際 R2 呼叫前必須先保存 dispatching。R2 promise 回傳 object 或條件不符 null 後，先保存 confirmed outcome，再以同一 transaction 結清 ticket 並改成 settled。到期發生在 dispatch marker 寫入期間，且尚未呼叫 R2，會保存 not-dispatched；已扣的保守額度不退還。

重啟後 reserved 可以證明尚未 dispatch；confirmed 可以證明 storage 已回覆。這兩種才可結清。dispatching／unknown 一律保留 pending，禁止新復原上傳及封存；timeout、物件讀回、actor 重建都不是完成證據。曾開始但結果未留下紀錄的 R2 操作仍未解決。每次操作 ID 綁定精確 key／size／hash，不能換資料；重送已存在 ID 只讀回紀錄，不會再 put，也不會隱式結清。conditional miss 明確回報 precondition-failed，不能當作內容正確，採用程序仍須 hash 讀回。

依據 Cloudflare 的 [R2 API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)，put promise 成功時回傳物件，條件不符時回傳 null；[SQLite Durable Storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) 提供交易式一致儲存。本機例外注入不是 provider crash／儲存故障保證。

## 驗證

17 個新情境通過；連同既有容量、tracking、window、採用模型共 **85 項**，TypeScript 通過。包括相同 ID 並行／重送、預留交易回滾、完成紀錄前後中斷、結清交易失敗、未送出的操作、結果不明、條件衝突、授權／scope／fence、關窗／封存／額度、chunked 超大 body 與 1 MiB 邊界。

實際編譯 outer Worker、coordinator、SQLite Budget 與本機 R2 的 5 個 HTTP 情境，每個都完整停止／重啟 workerd：

| 中斷位置 | 重啟紀錄 | 結果 |
|---|---|---|
| settled 後將成功回應改為 502 | settled | 同 ID 不再 put，可封存 |
| 結清交易寫入失敗 | confirmed | 關窗後仍可完成自有 ticket，無重送 |
| dispatch marker 保存前失敗 | reserved | 結清為 not-dispatched，保留扣帳 |
| R2 完成但 confirmed 保存前失敗 | dispatching | pending=1，不因物件存在而結清 |
| R2 完成後 wrapper 丟出未知結果 | unknown | pending=1，關窗但拒絕封存 |

各情境只計帳一次，原生 R2 bytes 讀回精確。兩份 pending=1 是已停止的獨立本機副本，不是遠端狀態。程式 wrapper 只在本機注入例外／替換回應；沒有模擬 provider 真正斷電，沒有重跑 PHP 編輯器。Miniflare inventory 空 storageClass 只轉為 Standard；其餘 guard 不改。所有程序結束、外連 0、Cloudflare 請求／部署 0。

首輪合成 fixture 的時鐘 hook 把 undefined 誤判為注入點，造成 13 個失敗；修正 fixture 後 17/17、最終 85/85。首輪 workerd 被 sandbox 擋住 loopback（EACCES），保留失敗 owner，後續以新的 owner 跑成功；未刪除或重用完成 guard。

## 重建與下一步

先完成 legacy-adoption 交付鏈，再執行 `python apply-local-candidate.py --runtime <runtime> --apply`。所有既有來源／設定 SHA 先驗證，準備全部 6 檔後才改寫；2 個既有 runtime 檔更新、1 個 runtime 新增，合計 82 來源，20 設定不變。完整替代來源及 diff 都有交付。重套在任何改檔前拒絕。這是既有已固定依賴的增量組裝，不是 fresh upstream rebuild。

測試：`node --import tsx --test tests/playtt-recovery-uploads.test.ts tests/playtt-storage-capacity.test.ts tests/playtt-write-drain.test.ts tests/playtt-write-window.test.ts tests/playtt-legacy-adoption.test.ts`。本機端點：`node scripts/playtt-recovery-uploads-local.mjs --local <新的run-tag>`；保留每個 owner 和 state。已完成 owner 不得重跑。Script 不讀正式密碼，僅產生一次性本機憑證。

下一步接入 transport 的 operationId／receipt 狀態，建立同樣有界的 R2 pointer CAS 與部分採用接續，再於新本機副本做完整採用。先更新私人雲端讀值與核對允許額度，才評估已授權範圍內的私人部署；目前沒有可直接使用的遠端採用 adapter。勿清除原有 pending、退款、放寬額度或刪 pin／歷史。一般 PHP 寫入仍使用原有 guard，本端點不替它們補造完成證據。

最後雲端讀值仍為 2026-11-21 14:24:49.947Z 的 177／pin14／餘 1,083,839，closed／sealed／pending0，publisher paused；本輪未刷新。後台延遲、繁中初始化、整體 isolate／CPU、長期 Free、實機與完整驗收仍開放。

證據：[workerd](../../../docs/verification/cloudflare-recovery-uploads-workerd.json)、[85 項測試](../../../docs/verification/cloudflare-recovery-uploads-tests.log)、[重建](../../../docs/verification/cloudflare-recovery-uploads-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-recovery-uploads-review.json)。
