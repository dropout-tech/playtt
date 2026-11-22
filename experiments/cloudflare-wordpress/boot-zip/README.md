# WordPress 啟動 ZIP 讀取候選

把上一輪已驗證的自有位元組 ZIP 讀取器，延伸到初始內容與 Markdown Database Integration（MDI）套件。六個 workerd 控制中，這兩包的累計 sampled JS 配置平均減少59.91%，本機量測時間減少65.80%。完整 WordPress 登入頁冷啟動與原資料核對通過，**完整編輯器與 Cloudflare Free 驗收仍未完成**。

候選僅在隔離目錄，正式 Pages、原站視覺、中央來源、雲端 Worker、帳務及發布狀態不變。沒有部署、付費或雲端請求。

## 變更範圍

以 buffered-zip 階段208個固定輸入為基礎，只修改 `worker.ts` 的兩個解碼呼叫，並將讀取器的型別宣告補齊為 `ReadableStream<File> & AsyncIterable<File>`，使 MDI 原有的 `getReader()` 迴圈可被型別檢查。

- `packagedCanonicalMarkdownSeed`：原始 provenance、整包SHA、逐檔名稱／大小／SHA、檔案數及排序均不變；仍在雜湊驗證完成後快照輸入。
- `materializeMarkdownDatabaseIntegration`：仍逐檔 mkdir／writeFile，保留 `db.php` 的額外目的路徑及失敗時的部分寫入行為。輸入的同步快照與原 Blob 時點一致。
- 原本 ZIP parser、解壓／CRC、短讀行為與私有buffer ownership保留。固定衍生模組出自 WordPress contributors 的 GPL-2.0-or-later 套件；未修改 node_modules。
- 網站匯入器的實際固定13MB ZIP在本機尚未找到，因此 `materializeRuntimeArchiveComponent` 維持原狀。沒有把改法延伸到未檢查的網路串流。

原worker SHA `d720192f15ca3a456de4732f0945c1bef83f3cda164da4b345ad9405558d02f6`，候選 `7ea9f96252eeb847da0f579aa45016717d8e79f6c4da5d2907b7534091511251`；共用ZIP模組仍為 `d0131db93fc46c0d97b9984922f26dfc4133e92774049ddfe426abbd63ae49c9`。

## 精確比較與完整建置

26組原版／候選比較得到11組相同成功及15組相同拒絕。使用真正PHP8.3.36／WASM檔案系統，比較檔案內容、mode、寫入順序、錯誤以及中途mkdir／writeFile失敗留下的部分檔案。覆蓋繁中、emoji、空檔、70KB二進位、空ZIP、截短、manifest錯誤及輸入立即修改後的快照獨立性。

真實初始包55,902bytes／134檔、MDI包93,269bytes／40檔，全部輸出與獨立Python zipfile讀取的大小及SHA精確；MDI多寫的一份db.php也相同。這些測試保留原始驗證邏輯與既有缺口，不是ZIP安全驗證重寫。

208輸入、83TS加1宣告的TypeScript與Wrangler dry-run通過。完整JS產物逐字核對，差異恰為兩個呼叫，五個二進位模組不變。JS SHA `abc3045e3e01dd1b8454be9ffd709519bf016a5b6b16f8f3d6efdaab65d4befb`。第一次離線差異檢查誤用編譯前名稱而失敗；核對真實產物名稱後修正檢查器，沒有修改產物來迎合檢查。

## 配置控制

六個全新workerd依序baseline／candidate／candidate／baseline／baseline／candidate。每次執行原worker抽出的兩個函式，各解碼一次真實包，包含原驗證與輸出SHA。MDI寫入使用記憶體adapter；真正PHP寫檔行為由上述比較另行驗證。

| 指標 | 原版 | 候選 |
| --- | ---: | ---: |
| 平均累計sampled JS bytes | 16,303,379 | 6,536,487 |
| 配置範圍 | 15,721,912–16,626,880 | 6,080,976–6,805,232 |
| 平均本機量測時間 | 325.57ms | 111.36ms |

這包含已回收物件，不是存活尖峰、RSS或billed CPU。初始內容只在初始化使用，MDI則在canonical boot使用，兩者總和不能當成每個請求的節省。

## 完整登入頁冷啟動

原版與候選各一次，使用前輪已驗證的完整離線備份LOCAL193。正式建置的六模組未加diagnostic barrier，wrapper只允許登入GET及必要控制，禁止內容R2寫入與外連；publisher暫停，固定180秒／131,072bytes／8ops窗口。

兩版皆登入頁200且包含帳號密碼欄位，301物件／298內容檔／版本193精確，charged0、closed／sealed／pending0、程序皆已關閉，觀測到的runtime例外為0。

| 觀測 | 原版 | 候選 |
| --- | ---: | ---: |
| 單次登入GET本機時間 | 2,194ms | 2,074ms |
| trace中的MDI解壓 | 96ms | 40ms |
| 累計sampled JS配置 | 61,812,408bytes | 61,306,272bytes |
| 可配對的記憶體樣本／全部樣本 | 3／5 | 3／5 |
| 最大觀測組件合計 | 123,495,690bytes | 122,163,599bytes |

只有一組控制且取樣稀疏，不能宣稱整體穩定加速、尖峰降低或低於Cloudflare128MiB。組件合計由JS usedSize、backingStorageSize和同generation最近的PHP heap配對，有非同步與觀測開銷，沒有涵蓋完整編輯器或繁中首次初始化。

原版完成全部驗證、summary落檔與dispose後，最後console行因區域變數引用錯誤以exit1結束；原執行腳本及結果保留，沒有重播owner。候選只修正該輸出行後執行，exit0。離線稽核核對兩份腳本只差這一行，沒有把原版記為exit0。

## 交付與接續

接續buffered-zip組裝，安裝器核對212前置工具，新增7工具，保留758舊檔，總共765。完成的proof、allocation與兩個cold owner拒絕重播；原始ZIP內容、profile、登入／備份資料留在本機。

```powershell
node --import tsx scripts/playtt-boot-zip-audit.mjs --local --check
node scripts/playtt-boot-zip-build.mjs --local --check
```

下一步對這份完整產物跑原生繁中編輯、儲存、完整重啟、讀回、登出與獨立備份；保留已有的有界請求診斷。先前原生流程的Network connection lost尚未歸因，不能用本輪單一登入頁的零例外視為修復。免費記憶體／CPU、首次繁中初始化、長期免費、實體IME／手機及A01–A20仍開放。

本輪0 provider請求／部署／帳務刷新。最後雲端確認仍2026-11-21T16:52:39.597Z，canonical181、歷史餘62,344bytes、publisher暫停；不是目前帳務查詢。未增額、退款、清unknown、刪歷史／pin或新增替代雲端資源。PR4維持draft，全案active。

證據：[整合稽核](../../../docs/verification/cloudflare-boot-zip-audit.json)、[語意比較](../../../docs/verification/cloudflare-boot-zip-semantic.json)、[配置控制](../../../docs/verification/cloudflare-boot-zip-allocation.json)、[完整建置](../../../docs/verification/cloudflare-boot-zip-build-proof.json)、[冷啟動摘要](../../../docs/verification/cloudflare-boot-zip-cold.json)。
