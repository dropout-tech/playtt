接續：[冷啟動配置定位與預配置解壓候選](../cold-boot-preallocation/README.md)。候選尚未套用中央runtime或部署雲端。

# 本機記憶體限制與觀測欄位校正

2026-11-22（台北）。本機原生保存／重啟／獨立還原的功能證據仍有效，但不能據此驗收Cloudflare的記憶體限制。本輪固定來源與4組最小實驗證明：**目前本機workerd允許160MiB配置；`Runtime.getHeapUsage.backingStorageSize`會計入一般ArrayBuffer，卻不計入這組WASM記憶體。** 這是量測邊界的發現，沒有修改或部署WordPress runtime。

## 平台來源與最小實驗

實際安裝workerd1.20260828.1、Miniflare5.20260828.0-alpha、Wrangler4.127.1，原生執行檔回報2026-08-28；安裝的workerd.capnp完整Git blob與官方固定版本一致。官方tag解析至commit `8ea63498c7aa107995f9b2ffee7789631707e09f`。

[固定server.c++](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/server/server.c%2B%2B#L3247)的NullIsolateLimitEnforcer沒有設定isolate限制，heap超限判斷回false；4552起的request enforcer也未執行限制，5643實際建立該enforcer。ActorCacheSharedLru的128MiB與Miniflare QuickJS helper的memoryLimitBytes均非Cloudflare整體isolate限制。

只使用loopback的獨立小Worker，沒有WordPress、R2、DO或網站資料。每組新程序先讀空狀態，再配置並每4096bytes寫入一byte，最後另一HTTP請求核對原instance、全部160MiB長度與checksum；這不是宣稱逐byte填滿或量到160MiB RSS。

| V8參數 | 配置種類 | 跨請求保存 | backingStorageSize增量 |
| --- | --- | --- | ---: |
| 預設 | ArrayBuffer | 160MiB、40,960個頁面標記精確 | 167,772,160bytes |
| 預設 | WebAssembly.Memory | 同上 | 0 |
| --max-old-space-size=128 | ArrayBuffer | 同上 | 167,772,160bytes |
| --max-old-space-size=128 | WebAssembly.Memory | 同上 | 0 |

4組皆HTTP200／同instance／例外0、無外連。old-space參數不能代替整體JS＋WASM限制。沒有強制GC；部分usedSize下降是觀測值，不改成0或省略。

首次工具在Inspector timeout前完成0組，訊息沒有記錄命令名稱，不能精確指定哪條命令逾時；原設計包含強制GC。保留失敗owner／log，確認程序exit1與連接埠釋放後，v2移除強制GC並以全新程序完成4組。v2程序exit0、環境參數恢復、9499／9500無監聽。交付版另外修正finally的dispose失敗時不能誤記disposed=true；此失敗路徑只做程式／語法核對，沒有重跑已完成owner，也沒有宣稱注入驗證。

## 重新解讀既有原生觀測

校正只適用這組固定版本。從既有3份觀測的同一generation，以最近已收到的`HEAPU8.byteLength`配對CDP樣本，計算：

`usedSize + backingStorageSize + last-known HEAPU8.byteLength`

這是**可觀測組成合計**，不是精確同時尖峰、RSS、provider記憶體或計費值。沒有加embedderHeap。事件是主機接收時間，PHP數值可能較舊，啟動期間亦有未配對樣本；保留每筆最大值的原始組成、時間差、輸入SHA及排除數量。三份皆只有generation1、沒有retirement、已停止且採樣錯誤0。

| 原生流程 | 全部樣本／可配對 | 最大觀測合計bytes | 當時標籤 | 8請求抽樣窗內最大合計bytes |
| --- | ---: | ---: | --- | ---: |
| 路徑原版 | 940／845 | 158,375,959 | login | 138,599,680 |
| 路徑候選 | 976／902 | 160,263,121 | login | 135,350,438 |
| 獨立完整還原 | 1,248／1,141 | 156,250,858 | gate-natural | 未執行allocation window |

三者約151.0／152.8／149.0MiB。兩次8請求窗口的類別／method／status／version已在前輪核對，但只是固定順序單一配對，不據此宣稱穩定峰值改善。先前39.5%累計JS分配下降，也不能替代記憶體驗收。128MiB（134,217,728bytes）僅作本機診斷參考線；官方文件使用128MB字樣，且本機並未執行該限制。

**舊HeapProfiler保留快照約117MiB已包含PHP backing，絕不可再加一次PHP。** 這次校正的是Runtime.getHeapUsage的特定欄位；兩種工具結果不可混用。

## 冷啟動的下一個辨識點

獨立還原在第一個已分類asset request-start前53ms，已有一個樣本：JS17,538,096＋backing68,626,905＋已知PHP67,108,864＝153,273,865bytes（約146.2MiB）。因此大型配置在觀測到靜態資源請求前就已出現，不能只以瀏覽器並行載入解釋；主機事件順序仍非精確伺服器時間軸。

該次實際compaction紀錄：489個核心檔案縮短，容量31,102,303→22,527,346bytes，減少8,574,957bytes。固定程式`playtt-core-memory.ts:21`會建立縮短後的副本，`worker.ts:2599`在boot後呼叫；舊buffer何時被GC不受此函式保證。ZIP擷取也經過archive與MEMFS buffer。這些是具體待量測配置點，**尚未證明任何一項就是全部暫存用量的原因**，也尚未修改其行為。

下一輪可做一次不載入瀏覽器資產的有界冷啟動，在解壓與compaction前後量測buffer持有關係及配置；要求核心／主題／網站資料逐位元不變，再評估候選。不要為相同平台限制盲目重跑原生編輯或強制GC後宣稱雲端可用。

## 重建、範圍與未驗收項

在已完成materialized-native的研究組裝上，以`python install-local-tools.py --runtime <runtime> --apply`新增3個本機工具，前置來源與新檔SHA逐項核對，重套用拒絕。這是增量工具組裝，沒有重新安裝全部相依套件。

原始私人觀測存在時，在runtime目錄執行`python scripts/playtt-local-memory-accounting.py --local --check`可重新計算並與既有報告精確比較，不改檔、不發網站請求。報告公開選取後的數字及來源SHA；完整原始採樣與私人紀錄沒有隨PR公開，外部讀者可核算表中組成，不能只靠摘要獨立驗證所有樣本的最大值。

最小能力工具以`node scripts/playtt-local-limit-proof.mjs --local`執行；已存在owner即拒絕，不刪除owner重試。Inspector僅連自有loopback Worker，非瀏覽器CDP。沒有新增WordPress請求。82個runtime來源、20設定、研究generator及已採用loader不變；既有95測試／tsc屬先前未變的TypeScript，沒有為這次分析重跑。

本輪0 provider請求／部署，正式Pages與原視覺不變。最後雲端GET仍2026-11-21T16:52:39.597Z：canonical181、pin16、餘62,344bytes、closed／sealed／pending0、publisher paused。未刷新帳單或DO用量；不加額度／退款／清unknown／刪pin歷史／換雲端資源繞過。免費可行性、provider整體記憶體／CPU、繁中初始化、長期使用、實體IME及全A01–A20仍開放；目標active、PR4 draft。

[Cloudflare Workers限制](https://developers.cloudflare.com/workers/platform/limits/#memory)描述每isolate128MB、包含JS與WASM；[DO限制](https://developers.cloudflare.com/durable-objects/platform/limits/)另說明DO的CPU時限。這是平台文件，非本帳號當期用量證據。

證據：[固定來源](../../../docs/verification/cloudflare-local-limit-source.json)、[4組校正](../../../docs/verification/cloudflare-local-limit-proof.json)、[既有樣本重算](../../../docs/verification/cloudflare-local-limit-accounting.json)、[增量組裝](../../../docs/verification/cloudflare-local-limit-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-local-limit-review.json)。
