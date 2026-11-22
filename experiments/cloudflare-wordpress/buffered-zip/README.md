# 已載入還原包的 ZIP 標頭讀取候選

本輪把已完整載入記憶體的還原包，改由固定游標讀取標頭、檔名及附加欄位，省去每個欄位重建串流的開銷。**六個全新 workerd 的控制中，平均累計 sampled JS 配置少51.49%，本機量測時間少50.00%。** 原生繁中保存、完整重啟、新分頁讀回、登出及獨立備份精確；整體免費記憶體與執行穩定性仍未通過驗收。

正式 Pages、原站視覺、中央runtime、私人雲端Worker、發布狀態與額度均未修改，無付費或部署。候選只留在隔離的本機完整建置與草稿PR。

## 來源與改動邊界

前輪原生save配置profile可定位到 `@php-wasm/stream-compression` 的 `collectBytes`／`pull`／ZIP local及central header讀取。根部的V8 API配置沒有可用呼叫者，未將全部配置歸因給ZIP。

固定套件為 WordPress contributors 的 `@php-wasm/stream-compression` 3.1.45，授權GPL-2.0-or-later，原始index.js SHA `4d495f20e873d23fee4f012fbff2d30e3700b1f46637ef0346a13d377626fd81`。生成器只在雜湊符合時產生衍生模組；生成來源保留作者及授權標示，沒有修改node_modules。

- 保留原本ZIP parser、解壓／CRC路徑、File建構、一般串流collector及既有不完整輸入行為。
- 新入口同步複製輸入，與原Blob的快照點相同。私有WeakMap將自有byte stream對應至游標；僅針對未鎖定、已登記、0–65535bytes的指定欄位讀取省略中間串流。
- 每個欄位仍回傳獨立陣列；短輸入的剩餘部分保持原collector的零填入行為。其他情況回到原collector，不共用可變輸出。
- 只替換 `canonical-restore-pack.ts` 的解碼入口，全部pack／manifest／逐檔大小與SHA、名稱、重複檔案、墓碑、總量及完整性檢查不變。worker內其餘ZIP使用點尚未替換。

生成模組SHA `d0131db93fc46c0d97b9984922f26dfc4133e92774049ddfe426abbd63ae49c9`；候選canonical來源SHA `cc0d32926ec33b942d3b13700067a958780e9dd62fdc7449426acec9d0dd9d9b`。這不是ZIP格式或安全驗證重寫。

## 行為與既有回歸

39組原版／候選比較得到相同內容或相同錯誤：16組成功、23組拒絕。涵蓋空內容、繁中／emoji、二進位、不同檔案數、偏移typed-array view、截短、欄位改動、錯誤雜湊／大小／清單／墓碑，以及完成後的buffer獨立性。包含實際2,295,783bytes還原包，298檔解碼共4,439,736bytes；pack SHA `4916d283087db435aa553c125ac7197df6becb3a554e7135787a6606515fb8fa`。

完成59項既有回歸：canonical還原包1項、compressed-content24項、snapshot-source15項、compressed integration19項。分別核對確定性、損毀／路徑／重複檔案拒絕、完整base、差異上限、取消、獨立備份／pin、materialization與保留規劃。不修改既有測試內容。

隔離目錄起初缺少snapshot-bundle、backup-pin-client、content-snapshot-source三個測試helper，以及一個retention planner；對應失敗日誌保留。補入原始檔並核對SHA後，只補跑未完成的整合或最後一項，未把失敗執行改記為全通過。先前腳本語法錯誤在owner建立前修正，沒有重播已完成的owner。

完整建置來自前輪206輸入，僅修改canonical來源及新增衍生模組／型別宣告，共208輸入、83份TS加1份宣告、72個載入來源；TypeScript及Wrangler dry-run通過。五個二進位模組不變，JS SHA `dbb723cf7cd709de306646440b2a6a39297b7b178feee8a74c0a1ce4b25d74ee`。中央82TS、20configs及研究loader/generator不變。

## Workerd配置控制

順序baseline／candidate／candidate／baseline／baseline／candidate。每個新實例對相同真實還原包解碼兩次，包含完整性驗證及輸出逐檔雜湊彙整，結果精確，無外連、PHP或WordPress寫入。

| 指標 | baseline | candidate |
| --- | ---: | ---: |
| 平均累計sampled JS bytes | 74,302,435 | 36,047,563 |
| 配置範圍 | 73,331,008–75,464,068 | 34,045,224–38,276,536 |
| 平均本機量測時間 | 1,475.27ms | 737.61ms |

配置包含已回收物件；兩次解碼是放大目標工作的控制，不是實際每個WordPress請求次數。這些數據不是同時存活bytes、provider尖峰、RSS或billed CPU。

## 原生流程與尚未通過的條件

以cloud181離線備份播種本機R2／DO，publisher暫停，外連封鎖；固定600秒、1,881,041bytes、96ops視窗。瀏覽器原生編輯及保存1,875bytes繁中草稿，新增revision209，原文章與修訂精確。

完整dispose舊workerd並確認兩個埠關閉後，啟動新instance；未重新播種或重開視窗，state、資料及budget精確。新分頁讀回同一內容、已儲存及11筆修訂，再由原生登出移除本輪session。全部原usermeta／session、媒體、主題與其他資料精確；304物件／298檔獨立匯出匯入及full materialization相同。

最後LOCAL193、600,328bytes／36puts，closed／sealed／pending0、程序exit0，無HTTP錯誤。但重啟前離開編輯器時，有一筆 `Uncaught Error: Network connection lost.`，無frame或request ID；附近Ajax200與例外相隔10ms不能證明因果，未宣稱已修好或視為無影響。

觀測組件合計最高為重啟前153,560,065bytes（約146.4MiB）、重啟後143,421,564bytes（約136.8MiB），仍高於128MiB診斷參考線。組件由同一generation的JS usedSize、backingStorageSize與最近PHP heap樣本配對，存在非同步與觀測開銷，不能代替provider驗收。

原生render／save窗口包括周邊請求，與前輪瀏覽器時序不同，未宣稱整個後台的尖峰或延遲改善。DOM填入不代表實體IME／手機驗收。首次繁中初始化、provider記憶體／CPU、長期免費與A01–A20仍開放。

## 交付及接續

接續path-scan組裝，`install-local-tools.py --runtime <runtime> --apply`核對204個前置檔，新增8工具，保留750舊檔，共758；重套拒絕且無修改。需要固定依賴與私人證據，不建立雲端資源。

```powershell
node --import tsx scripts/playtt-buffered-zip-audit.mjs --local --check
node scripts/playtt-buffered-zip-build.mjs --local --check
```

proof／allocation／native的owner皆已完成，不可重播。原始profile、文章／ZIP內容、登入資訊與備份payload只保留本機，未提交。

下一步檢查worker中仍使用原解碼器的MDI、seed及runtime component等已持有bytes的ZIP路徑，先核對實際輸入型別及完整性檢查；不要直接擴大到任意遠端串流。繼續區分冷啟動暫存與必要持有記憶體，並在再現瀏覽器例外時使用已有的有界請求診斷，不用通用取消控制補推歷史原因。

本輪0 provider請求／部署／帳務刷新。最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、歷史餘額62,344bytes、publisher暫停；此數字不是目前帳務查詢。無增額、退款、清unknown、刪history／pin或替代雲端資源。PR4維持draft，全案active。

證據：[整合稽核](../../../docs/verification/cloudflare-buffered-zip-audit.json)、[語意比較](../../../docs/verification/cloudflare-buffered-zip-semantic.json)、[配置控制](../../../docs/verification/cloudflare-buffered-zip-allocation.json)、[完整建置](../../../docs/verification/cloudflare-buffered-zip-build-proof.json)。
