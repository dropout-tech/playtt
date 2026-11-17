# 初始化副本與核心檔案容量

私人restore-v1候選，正式playtt.tw仍為Pages。依使用者決策繼續全Cloudflare免費後台研究，暫不切換後台。

## 已定位的保留來源

V8快照顯示，Playground保存的`recreateRuntime`函式透過同一個JavaScript閉包環境，保留`bootWordPressRuntime`的`markdownFiles`、`uploadFiles`與`wpContentFiles`。這些內容已複製進MEMFS，原本的291個buffer仍保留4,571,615 bytes。修正將工廠函式建立在獨立範圍，仍保留診斷與執行器輪替能力；新快照中這三組初始化buffer保留量為零。

固定Emscripten版本在解壓檔案時會擴充預留容量。只壓縮`/wordpress`核心檔案的多餘容量，保留實際使用的每一個byte，不動wp-content、上傳、資料庫或與WASM共用的buffer。本機489個核心檔案的配置容量由31,102,303降為22,527,346 bytes，差8,574,957 bytes。

| 本機快照 | Snapshot self bytes | 初始化內容副本 |
| --- | ---: | ---: |
| 原閉包（串流備份實驗） | 132,925,692 | 4,571,615 |
| 分離工廠函式 | 128,332,259 | 0 |
| 加上核心容量整理 | 119,824,615 | 0 |

這是相同七筆編輯工作負載後的有限本機觀察，資料修訂數會增加；不是遠端RSS、峰值上限或正式穩定度保證。保留路徑消失已由快照直接確認。原始快照可能包含內容與設定，只留在私人work，公開證據僅有類型與數量摘要。

## 驗證與重現

先完成security-update、automatic-publication、memory-investigation/tracked-allocator-candidate.patch、publication-batching/publication-batch-candidate.patch，再依序套本目錄memory-lifetime-candidate.patch與runtime-rotation-candidate.patch。不要套未採用的串流備份候選。

- TypeScript通過。
- `playtt-core-memory-check.mjs`使用相同固定PHP8.3.36 web WASM，驗證整理前後雜湊一致、PHP讀回、後續追加內容仍能擴充，wp-content與暫存檔的原buffer不變。
- 相同七筆WordPress編輯、建立後撤回、再發布、六頁共用頁尾與還原在本機通過。
- `playtt-inspector-memory.mjs`在本機9429網站與9444 inspector收集數值；不強制GC。需要runtime的Node與ws套件。原始bootstrap、樣式與內容資料不寫入數值報告。
- `playtt-local-heap-snapshot.mjs --label=compact-core`僅擷取本機快照；不要提交`.heapsnapshot`原始檔。數值摘要見`docs/verification/cloudflare-heap-*.json`。

私人遠端部署959ecd6b-e951-4b9a-b683-497c6bb21e10已通過先前失敗的建立頁面／七筆發布批次，合併發布68,647ms；原內容、狀態、頁尾均還原並讀回驗證。25個樣式與編輯器請求、兩輪樣式儲存／讀回／還原亦通過。

Chrome繁中原生樣式面板實際將連結由品牌藍改為墨色，確認「網站已更新」後重新部署相同候選c972b58e-e6be-41e2-a8c8-ffd066c86db1。重載後原生色票仍選中墨色，REST亦讀回；接著原生重設、儲存，REST逐值確認styles回到原始空物件，六頁預覽共同完成還原。這不是只測REST的結論。

上述兩個部署合計681個tail事件（含重複的Worker與DO封裝，非681個獨立請求），679 ok、2 canceled、無例外。最大觀測WASM配置76,546,048 bytes。有限工作負載通過，不代表長時間使用或所有外掛均可用。證據見cloudflare-memory-lifetime-batch-remote.json、cloudflare-memory-lifetime-workload-remote.json、cloudflare-memory-lifetime-native-style.json及cloudflare-memory-lifetime-tail.json。

`python summarize-playtt-heap.py compact-core /absolute/path/to/runtime-cloudflare/artifacts`從指定私人快照產生數值摘要；不需要複製原始快照至公開程式庫。

## 400次請求後的執行器輪替

新增的邊界檢查確認：原本工廠會在第401次PHP請求重新使用已complete的CloudflarePhaseTrace，因此在建立新執行器前拋錯。runtime-rotation-candidate.patch將診斷限定在首次建立，隨後清除其參照；仍在獨立函式範圍建立回呼，保留前述記憶體修正。

在固定PHP8.3.36 web WASM上，舊候選精確重現400次成功、第401次失敗；新候選完成805次、實際建立3代執行器，每次都讀回遞增檔案及追蹤配置環境值。執行命令為`node --experimental-transform-types scripts/playtt-runtime-rotation-check.mjs`，檔案需放在runtime的scripts目錄；證據cloudflare-runtime-rotation-local.json。這項檢查本身不含完整WordPress負載。

補丁已部署至私人7e59a586-67c1-4938-af2d-265d923460f4。計畫410次的遠端完整WordPress循序讀取在完成386次後收到HTTP500，立即停止。tail證實一次DO記憶體超限重置，兩個例外封裝；此前WASM配置83,296,256 bytes，僅觀測到第1代，未成功記錄第2代。失敗發生在接近預期400次PHP重建的邊界，仍須區分新WASM建立與檔案複製的峰值。**遠端長時間使用未通過**，不能用前面的短期通過宣稱整體穩定。

重置後獨立讀回通過：繁中、原始樣式、關於／課程原文與狀態、頁尾完全一致。該輪只做讀取，未新增頁面或更改樣式；發布器保持paused。證據cloudflare-rotation-remote.json、cloudflare-rotation-tail.json及cloudflare-rotation-failure-readback.json。

後續研究方向為在已完成持久化的請求邊界釋放整個快取執行器，下一個請求由已提交版本重新建立，避免舊WASM、全份MEMFS與新WASM同時存活。上游400次自動保護仍保留，不靠關閉它宣稱穩定；這個下一候選尚未部署或驗證。

## 未採用的分批備份

`not-adopted-streamed-pack/`保留另一個獨立候選。它以最多四個R2讀取建立相同v1 ZIP；逐byte相同、完整還原、損壞／缺漏物件拒絕等檢查通過，但本機backing storage峰值未見改善，因此沒有部署。

原流程與分批流程的取樣起始狀態不同（前者暖機，後者新啟動），數值只作診斷，不當成嚴格的效能比較。第一版量測遇到workerd未回覆`HeapProfiler.collectGarbage`；後續已移除強制GC並先保存數值。兩個候選不可混合成一個已驗證結論。

記憶體診斷方法參考[Cloudflare官方記憶體分析文件](https://developers.cloudflare.com/workers/observability/dev-tools/memory-usage/)，實際判斷以本專案工作負載、快照與遠端結果為準。
