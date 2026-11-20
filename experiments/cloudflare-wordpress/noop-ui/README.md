# 原生編輯器驗證：未變更請求優化後

本輪只驗證既有私人runtime，沒有改正式站、部署新程式、切後台或新增付費。

## 新版本手機寬度原生保存與重開（2026-11-20）

私人 Worker `e33e2afb-7d40-4a36-b06e-674eac707f44` 在 Chrome 375×812 完成繁中登入、首頁副本173的指定段落修改、保存及離開列表後重開。全新登入的REST核對完整內容，只有計畫段落與已核對的Gutenberg序列化差異；原首頁逐位元一致。原生畫面已顯示「已儲存」。正式Pages、原視覺、daily來源程式與後台選擇未改，沒有新部署或付費。

儲存點擊曾在瀏覽器控制層逾時，後續看到正在自動儲存及已儲存；不能把操作時間差當成保存速度。工具連線中斷，未取得完整瀏覽器網路觀測，先前13個取消事件原因仍未證實。兩段已留存平台觀測共1242事件，outcomes `{"ok": 1238, "canceled": 4}`；UI到清理視窗為230事件、`{"ok": 226, "canceled": 4}`。記錄到0例外、0 request failure、0未完成trace；閒置與中斷期間不能當連續壓測，事件也不是唯一HTTP數。

自有173與子修訂已清理；備份 `6bfd0a41-07de-4e1a-9008-8f21c2231c25` 完整校驗297索引，37原canonical檔、15上傳檔、48 metadata及歷史修訂不變。副本278／來源175均coherent、無fence、paused；未登入admin／REST／media保持404/noindex。觀測已停且0殘留tail，實際測試編輯分頁已關閉、viewport已恢復；舊失聯控制台分頁無法確認手動關閉，未標記保留。

下一步仍是冷啟動／保存延遲、取消原因、其他原生流程、實機與實際交接，以及持續免費用量驗收。沒有宣稱後台已全面完成或這輪做過新空環境還原。PR #4仍draft、目標active。證據：`docs/verification/cloudflare-noop-ui-summary.json`、`experiments/cloudflare-wordpress/noop-ui/README.md` 及 `docs/verification/noop-native/`。以下保留較早階段的當時結果。

## 完整性與證據使用

副本173包含原首頁區塊，原生編輯只將「從孩子到大人，一起讓桌球走進生活。」替換為「新版背景請求驗收：從孩子到大人，一起讓桌球走進生活。」。保存讀回另外只允許已逐項核對的區塊邊界換行、四個class尾空格、六個預設h2屬性以及固定段落ampersand轉義；不做通用空白或HTML正規化。原首頁獨立SHA一致。

清理前核對ID、slug、title、draft狀態與完整已儲存內容，刪除後REST為404；完整備份的posts／postmeta及路徑集合確認草稿與子修訂不存在。所有原內容表、27 Markdown、15 uploads、主題檔與48 metadata保持前輪備份內容；session及高水位允許正常改變。備份解碼4424898bytes、壓縮2292055bytes，SHA `ba6d214f1588a98793b642a1787890c2932d550e5095187c58299ddfeafdb35f`。

工具連線恢復時沿用同一fixture，沒有刪除guard後重新建立。瀏覽器請求觀測未產生可驗證報告，因此保留為缺口；這輪平台觀測不能替代CDP因果證據，也不能推翻前輪13個取消。儲存點擊的控制逾時與正在自動儲存／已儲存均有觀察，並不確定該次保存由點擊或原生自動保存完成；實際持久化及重新開啟已驗證。

`playtt-noop-ui-actions.json`只保留操作名稱／時間；JSONL只保留平台允許清單欄位。沒有cookie、nonce、token、原始請求或私密完整備份入Git。截圖顯示測試副本，非正式官網改版。

這些腳本依賴固定runtime、private-client、私密設定／owned guard和本機完整備份。173已完成回收，不能刪guard或原樣重跑prepare。新一輪需新fixture及證據，正式站維持現況。測試編輯器已關閉、viewport恢復；舊失聯控制台分頁的明確關閉失敗，不將其寫成全數分頁關閉。
