# 預先驗證系統檔案清單的候選

保存配置 stack 顯示，每次驗證 wp-content 檔案都重新建立相同的 Set、清單與路徑檢查。本候選在 worker 啟動時建立系統清單快照：沿用原去重／路徑驗證、確認每項為 primitive string、複製後凍結，再以模組私有 WeakSet 標記。只有此函式產出的不可變快照可省去重複清單驗證。一般可變陣列、外部凍結陣列、複本、反序列化輸入仍走原檢查；原 `runtimeOwnedWpContentPaths` 仍回傳新的可變陣列。每個網站檔案本身的路徑、重複、大小、總量、雜湊／object key 與 tombstone 檢查均保留。

**中央來源、Cloudflare、正式 Pages 與原視覺不變；這是隔離研究候選，尚未採用或部署。**

## 語意與配置證據

最終版本通過1,049次一般輸入 differential comparison及945次prepared comparison，涵蓋一般／邊界路徑、可變清單、無效／偽造凍結清單、custom iterator、空集合短路、file/total/count上限、重複、雜湊與object key、tombstone順序。新增的constructor明確拒絕可變string-like object及boxed String，防止淺凍結誤當內容不可變。普通API對這些非標準輸入仍與原版相同。

六個全新本機workerd副本以baseline/candidate/candidate/baseline/baseline/candidate順序，對固定核心素材的413個檔案、414個路徑各重複20次同一組驗證。快照建立於取樣前，對應worker模組初始化；沒有PHP或網站狀態。三個素材manifest、109vendor檔與重建payload SHA精確，六份私人profile由唯讀工具重算。

| 累計 sampled JS self bytes | 三個副本 |
| --- | --- |
| baseline | 28,131,076 / 27,576,240 / 29,483,840 |
| 最終candidate | 13,535,276 / 13,066,004 / 13,216,952 |

這是該組受控驗證工作的配置減少，**不是完整保存尖峰減半**。32,768-byte取樣包含已回收物件；20次重複用於放大量測，並不代表每次原生保存呼叫20次。三個candidate的`runtimeOwnedWpContentPaths`在取樣期間無sampled self bytes，因清單已於初始化建立；仍有其他驗證配置、初始化與native成本。

## 完整建置與原生流程

最終來源SHA `b95446e9faeb1813fb25083421923f553fa45b83772733bce083f92b1c066198`。83來源／206輸入完整TypeScript與Wrangler dry-run通過，71個metafile來源核對。最終JS `b30c55a65ce4a33aa6e6c7e7894bfa0643d64a59f748c3f3fa125bf5d1930af3` 相對d3a78fa4…逐字只含快照helper、查詢分支與worker初始化；五個二進位模組精確。沿用既有固定依賴，沒有重新安裝。中央82來源／20設定不變。

最終v2由cloud181獨立備份建立空的本機R2/DO，600秒／1,881,041bytes／96ops，publisher暫停、禁止外連。原生繁中編輯器單次保存1,875bytes，完整關閉workerd並以同資料目錄及同視窗重啟，新分頁讀回十段內容／11筆修訂，再原生登出。

新增revision209精確，原文章／修訂／全部usermeta及session／媒體／主題不變；允許差異只在owned草稿、edit lock、新revision與自增資料。獨立304物件／298檔與full materialization精確。最終LOCAL190、450,079bytes／27puts、closed/sealed/pending0、outbound0、terminal exit0。這不是雲端變更、實體IME／裝置驗收，也沒有額外以使用者介面還原materialized輸出。

213個HTTP結果無錯誤；重啟後捕捉**一筆 `Uncaught Error: Network connection lost.`**，沒有frame可歸因。它發生於登出附近，資料及原生登出訊息均通過，但原因與影響仍未證明，不能用時間接近或過去取消請求實驗倒推。第一次離線稽核因預期0例外而失敗；保留失敗及原觀測，最終稽核明列1個未解runtime exception，並只判定資料流程通過。

載入取樣33,527ms／979samples／34,124,272累計bytes，包含1個Ajax；保存20,928ms／508samples／17,612,496bytes，沒有Ajax。與先前視窗的時間及背景工作不同，不能以累計總數估計整體改善比例。

重啟前／後最大觀測組成合計151,416,393／151,862,326bytes（約144.4／144.8MiB），仍高於128MiB。組成為相同generation的CDP used+backing+最近PHP HEAP；有取樣開銷與非同步邊界，本機workerd不強制provider限額。這不是精確provider peak、RSS或billed CPU，**免費後台記憶體仍未驗收**。

## 審查修正與保留紀錄

首版ee569073…只凍結陣列，未在constructor確認元素為primitive string。審查指出string-like object仍可變，因此補型別防護與兩個反例，重新完成最終建置、六個控制及原生流程。首版aafffb7d…曾完成LOCAL191資料／備份驗證（500,207bytes／30puts、0例外）；它不是最終候選驗收。首版native及allocation owner的`executed-v1-inputs/`保存原工具，所有原profile、建置與owner保留；沒有覆寫／重播已完成實驗。最終例外也未隱藏或拿首版0例外替代。

## 重現與後續

接在editor-byte組裝後，`install-local-tools.py --runtime <runtime> --apply`核對159個前置項目、加入11個工具；重套拒絕不改檔。`playtt-owned-paths-build-prepare.py --local --previous <editor-byte-build> --target <new-build>`準備206輸入，連接既有依賴後執行型別檢查與**dry-run**，再用build verifier核對。需要既有私人備份及固定依賴，不呼叫雲端。現行工具使用v2 owner；完成owner必須檢查，不可重播。

```powershell
node scripts/playtt-owned-paths-check.mjs --local --check
node scripts/playtt-owned-paths-allocation-check.mjs --local --check
python scripts/playtt-owned-paths-build.py --local --build <owned-paths-build-v2> --check
node --import tsx scripts/playtt-owned-paths-native-audit.mjs --local --check
python scripts/playtt-owned-paths-native-allocation-audit.py --local --runtime . --check
```

下一步依保存stack檢查filesystem stat/path與manifest編碼的短暫配置，保留完整語意與限制；不得用強制GC或放寬驗證換取數字。同時保留本次network-loss未歸因狀態，未取得request/stack證據前不宣稱已修復。

本輪0provider請求／部署／計費刷新。最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、餘62,344bytes、publisher暫停。無cap增加、退款、清unknown、刪pin／歷史或替代雲端資源。全案goal active、PR4 draft；provider記憶體／CPU、繁中首次初始化、長期免費、實機及A01–A20仍開放。

證據：[語意比較](../../../docs/verification/cloudflare-owned-paths-check.json)、[六個控制](../../../docs/verification/cloudflare-owned-paths-allocation-summary.json)、[控制重算](../../../docs/verification/cloudflare-owned-paths-allocation-check.json)、[完整建置](../../../docs/verification/cloudflare-owned-paths-build-proof.json)、[最終原生資料與例外](../../../docs/verification/cloudflare-owned-paths-native-audit.json)、[原生配置](../../../docs/verification/cloudflare-owned-paths-native-allocation-audit.json)、[首次稽核失敗](../../../docs/verification/cloudflare-owned-paths-initial-audit-failure.json)、[首版資料紀錄](../../../docs/verification/cloudflare-owned-paths-v1-native-audit.json)。
