# WordPress 儲存快照延遲

私人候選，只部署於 `playtt-wp-free-restore-audit`，使用自己的 R2 與 SQLite DO。正式 playtt.tw 保持 Cloudflare Pages，既有私人來源 Worker 仍為 a33083f3。依使用者決策繼續免費後台研究，暫不切換。

## 問題與實作

對同一獨立副本量測登入、建立草稿、兩次修改、逐次讀回與刪除。原先每次快照從 R2 重新取得約 300 個內容物件，五次讀取／校驗階段的中位間隔為 12,181ms。這是 I/O 邊界的經過時間，不是 CPU 時間：Cloudflare 的計時器會在 I/O 後推進，見[官方 Performance 文件](https://developers.cloudflare.com/workers/runtime-apis/performance/)。

新候選在原有序列化操作及 canonical lease 內讀取上一份已提交 manifest。只有路徑、內容領域、大小及 SHA256 都與該 manifest 相符的未變檔案，才能從目前 PHP 檔案系統取得；仍逐檔重新計算 SHA256。新增或變更檔案須另從 R2 讀回並校驗。全部內容通過後產生完整 restore pack、完成原有上傳／校驗及 manifest 寫入，再提交 canonical 指標。其他沒有執行器 reader 的呼叫仍使用完整 R2 讀取。

這項取捨不再於每次儲存重查所有未變 loose-object 副本是否存在；它以符合已提交雜湊的執行器內容建立新的完整持久快照。沒有跳過位元組校驗，也沒有跨操作保留內容快取。路徑／跨站 key／重複項目／容量界限先驗證，最多六個讀取並行，失敗時等待已開始的工作結束再拋錯。

## 重現

先套用既有候選，包括 `runtime-retirement/runtime-retirement-candidate.patch`，再套用本目錄 `snapshot-source-candidate.patch`。重建後三個來源檔的 LF 雜湊核對見 `docs/verification/cloudflare-snapshot-source-reproduction.json`。將測試放入 runtime 的 tests，腳本放入 scripts；使用固定相依套件，不變更共享 node_modules。

- `playtt-latency-workload.mjs --remote --label=<唯一標記>`：固定獨立 audit 目的地，要求發布器 paused，建立獨有草稿、兩次修改與讀回，最後只刪除符合標題／代稱／內容的本次草稿，核對原頁面雜湊及 paused。`--local` 使用固定本機模擬器。不能同時使用兩種模式。
- `playtt-tail-latency-sanitized.mjs --label=<唯一標記>`：只記錄數值階段、執行器配置、例外類別，不保存 headers、cookies、原始內容或 URL。
- `playtt-snapshot-source.test.ts`：15 項完整性測試，涵蓋新增／變更／刪除與 tombstones、完整 pack 解碼一致性、跨領域隔離、R2 fallback／並行界限、runtime／R2 大小雜湊缺漏、異常 metadata 及等待 in-flight 工作。

秘密僅從本機 `work/playtt-cms-secrets.json` 讀取，Wrangler 使用獨立 `work/playtt-wrangler-config` 登入狀態。不要上傳私人備份、草稿比對內容或 heap snapshots。

## 有限樣本結果

| 版本 | 五次寫入最短／中位／最長 | 快照讀取校驗中位間隔 |
|---|---|---|
| 原候選 19c92e3e | 18,555 / 18,937 / 20,021 ms | 未細分 |
| 僅增加觀測 b5bfeefe | 18,449 / 19,021 / 20,702 ms | 12,181 ms |
| 新候選 1d97a7ff | 9,191 / 11,720 / 12,735 ms | 614 ms |

三輪均通過內容讀回、只刪除本次草稿、原頁面雜湊不變及發布器 paused。每輪各觀測到 52 個 tail 事件封裝，全部 ok，無例外。新候選最大觀測 WASM 配置 71,761,920 bytes；不是完整 isolate 記憶體。新候選總寫入中位數比未加觀測原候選低約 38%，但不是反覆交錯的統計試驗，網路、快取與當時負載可能影響結果。完整儲存仍需約 9–13 秒。

本機 15 項完整性測試通過，七筆編輯及合併發布 22.656 秒，清理流程 exit 0。觀測 JS usedSize 峰值 35,021,388 bytes；未強制 GC，其他記憶體計數不可直接相加推估遠端限制。

先前嘗試解壓上一個 R2 pack 取得未變內容，完整性及本機發布雖通過，但取樣 JS usedSize 峰值 68,819,776 bytes。這個版本未部署遠端，保留於 `not-adopted-pack-source.patch`，不能與目前候選同時套用。

## 驗收界線

資料完整性測試與有限遠端寫入通過不代表長時間原生編輯或正式營運已驗收。原生 UI、重新部署讀回、備份校驗的後續結果見同目錄補充與 `docs/verification/cloudflare-native-snapshot-*`。舊自動草稿清理、較長原生編輯及操作交付仍待驗；PR 保持 draft，正式後台暫緩切換。

## 原生 UI 與重新部署（2026-11-17）

Chrome 原生繁中頁面編輯器以可見控制項建立草稿109，輸入第一版段落並儲存，再修改第二版並儲存。REST 精確核對區塊原文、標題、草稿狀態及原七頁雜湊後，下載新完整快照：revision d74e41e3，296索引，ZIP SHA256 d5bdfaff0beb5b7cbf8b03155fb75279256e8c1fb4e0539867709294e68c13d1。所有解碼項目校驗通過，operator fence正常釋放。

同程式重新部署版本1c5f289a後，REST與Chrome均讀回同一草稿及第二版原文，原生畫面顯示已儲存、兩筆修訂。最後以精確標題、內容雜湊、狀態及ID確認身份，只刪除本次草稿；原七頁不變，發布器paused。script的capture/verify/cleanup只允許固定audit目的地及本次標記，預期檔僅保留本機。

第一次匿名測試漏帶私人入口憑證而收到外層404，不能用它證明WordPress的401。修正測試為通過研究入口但不帶WordPress cookie/nonce後，草稿頁面404、編輯REST401；這是測試前置條件修正，未改產品權限。原生重載也曾遇瀏覽器工具10秒Page.navigate逾時，畫面仍停about:blank；重試成功，tail取消事件保留。此輪不宣稱全部請求ok、無等待或新備份已在另一全空遠端環境還原。

原生畫面證據位於交付目錄outputs/preview/wordpress-snapshot-editor.png；精確讀回、清理、備份與數值tail報告位於docs/verification/cloudflare-native-snapshot-*及cloudflare-snapshot-audit-backup-current.json。

原生tail另保留一次未完成mutation trace（10:24:35 UTC）：lease abort與runtime dispose後，同事件的cold read完成，outcome為ok且無exception。現有數值記錄不足以判定錯誤根因；將此列為後續觀測缺口，不將它歸因於導覽取消或宣稱所有操作一次成功。
