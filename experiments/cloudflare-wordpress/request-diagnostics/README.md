# 請求中斷診斷與正常儲存驗證

先前原生編輯觀測有一筆 `admin-ajax POST / request-body-unavailable`，但當時把所有body讀取錯誤都包成同一類，`bodyUsed=true`也只是失敗後讀值。這不能區分重複讀取、stream被鎖定或連線中斷。新增診斷現在保留讀取**之前**的used／locked／aborted布林值，以及固定原因類別；原始錯誤、cause、請求內容、URL、headers及憑證都不保留。

私人重建站部署為 `42b9023d-9df6-4b30-88b2-b76149440617`。相容日期維持2026-07-18，只為這個私人設定啟用 `enable_request_signal`。依[Cloudflare相容設定](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#enable-requestsignal-for-incoming-requests)，舊日期未啟用此旗標時，`signalAborted=false`不能排除連線中斷。沒有開啟signal passthrough、修改串行執行、增加自動重試或改變持久化協定。正式Pages與daily來源版本不變，publisher維持paused。

## 已證實的受控案例

1. 宣告2048bytes、只送21bytes的無登入heartbeat，5秒後主動斷線。版本／pointer不變，後續登入頁200；tail沒有捕捉到執行層body失敗，因此只算傳輸中斷與資料不變，不推論其進入PHP的路徑。
2. 完整21bytes無登入heartbeat與一個正常登入頁讀取重疊，700ms後主動斷線。新版本實際記錄 `reason=aborted`、`usedBefore=false`、`lockedBefore=false`、`abortedBefore=true`、`abortedAfter=true`；失敗trace只有request.translate、runtime not-used，未取得lease或執行PHP。重疊讀取及恢復讀取200，該區間3筆讀取runtime均warm；版本133／pointer `c79f3f55-93b6-4bbf-9ec6-3fb0462d5cfc`不變。

第二例重現相同錯誤類別，證明**此受控案例**是連線已中止而不是重複讀取。不能倒推先前缺乏診斷的事件一定同因。Cloudflare也說明[取消可以跨服務傳遞](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/http/#handle-canceled-requests)，多層取消事件不代表多次使用者操作或可由計數判定起因。

接續正常原生WordPress HTTP流程：登入、建立自有草稿138、修改繁中內容、另一個新登入讀回完整內容、核對原首頁不變，再身分／內容檢查後刪除草稿及其修訂，REST404。此輪是原生HTTP驗證；瀏覽器儲存／重開證據仍屬上一輪，沒有冒稱這次重跑UI。

## 驗證與備份

- 11項測試通過：multipart／JSON位元組、GET／HEAD／空POST、讀取中stream失敗、已用body、未讀但locked、前後abort、I/O context錯誤、未知／惡意getter例外及診斷不洩漏內容。TypeScript及私人dry-run通過。
- 最後完整備份 `4e46e92b-788c-4ede-a2d0-7695153ea4e2`：297索引，archive 2,292,899bytes，SHA `a51b3d53f52166aa8a2137f7364ad9c888807a9c8eb4ab65a3509d4929d96200`。27個原Markdown、10個完整資料表逐位元不變，15個上傳檔／wp-content相同，48筆metadata完整，草稿138／修訂／metadata已移除。使用者表不變，登入session及自增高水位允許正常前進，wp_posts保留139。
- 最後重建站version138、daily來源version174，一致、無fence、paused；未具probe身分的後台、REST與媒體404。完整備份校驗不等同再做一次空環境還原。
- 143觀測事件：141ok、2canceled、0例外。唯一未完成trace／body失敗就是受控的完整heartbeat斷線；正常編輯期間沒有新增失敗紀錄。最大觀測WASM73,924,608bytes不等於整個isolate用量或長期保證。觀測程序已停止，沒有殘留tail。
- 第15段patch可與前14段從固定上游重建，60個來源完全一致；4個工具、1個測試及私人設定亦一致。這次沒有重裝相同依賴或重生核心資產。

## 操作與限制

`request-diagnostics-candidate.patch` 套在media-repair之後；重建器已納入此順序。它只更改request-translation及phase-trace，另外覆蓋私人設定與sanitized tail工具。不要把`bodyUsed`失敗後值當成已被讀取的根因。

`playtt-body-diagnostics-remote.mjs` 使用capture → disconnect → queued-disconnect → normal-cycle四個明確模式，固定私人網址、paused及已知備份基準。normal-cycle的自有狀態已存在且已清理，**不可刪狀態檔重跑**。完整備份以 `playtt-rebuild-ui-backup.mjs --label=after-body-diagnostics --remote` 保存，最後用 `playtt-body-diagnostics-final-check.mjs --remote` 比對。所有私人狀態、原始表與憑證留在本機，不進Git。

後續優先處理18個歷史修訂的28處舊origin網址，再收斂原生操作延遲、其他後台流程與手機／交接／持續免費用量。歷史取消事件的確切原因仍未證實；目前只證實受控中斷不會進入PHP或破壞已提交資料。PR #4維持draft，整體目標active，正式後台不切換。

主證據：[總表](../../../docs/verification/cloudflare-request-diagnostics-summary.json)、`playtt-body-diagnostics-observation.json`、`playtt-body-diagnostics-final.json`與本目錄測試／部署紀錄。
