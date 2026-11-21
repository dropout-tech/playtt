接續：[合併候選的原生保存／完整重啟資料驗收](../cleanup-native/README.md)通過；一筆Ajax400未分類，完整記憶體問題仍開放，中央及雲端未切換。

# WordPress 啟動失敗清理與重試

2026-11-22（台北）。補齊預配置解壓的損壞 ZIP／I/O 保護測試後，發現固定版 WordPress boot API 在建立 handler 之後、初始化失敗時沒有明確 dispose。這次提供一個**隔離候選修正**：取得 handler 後擁有失敗清理責任；成功時仍交給既有 runtime cache 管理。中央來源與 Cloudflare 均未採用，正式 Pages／原站視覺維持現況。

## 修改與責任範圍

`playtt-boot-cleanup-candidate.ts` 使用固定套件公開的 `bootRequestHandler` 與 `bootWordPress`，把 WordPress 初始化和呼叫端的版本檢查／compaction 放在同一個失敗清理範圍。初始化或後續驗證失敗會 await handler 的 asyncDispose，然後拋回原錯誤；清理本身失敗時，以 AggregateError 保留兩個錯誤和原 cause。

`worker-boot-cleanup.patch` 是由完整原來源產生的整合差異；準備工具核對舊版205輸入後，複製至新目錄並加入 helper。沒有換掉原生 WordPress 功能、放寬驗證或把錯誤轉成成功。**公開 bootRequestHandler 尚未回傳之前的 dependency 建構失敗不在此 helper 的 ownership 範圍**。這也不是立即 GC／RSS 下降的保證。

## 實際 PHP 測試

固定 PHP8.3.36/WASM、WordPress7.1.4，使用既有 loader38231012…與 materializer 候選fd63abb0…。每個檔案／ZIP案例用新 PHP instance，觀察檔案、descriptor、暫存清理後退出。

| 組別 | 數量 | 結果 |
| --- | ---: | --- |
| baseline／candidate ZIP corpus | 18 | 兩個有效控制成功；損壞格式、截斷目錄、額外／缺少檔案、大小／路徑／壓縮方式錯誤拒絕 |
| candidate filesystem／I/O 故障 | 5 | 目錄衝突、ftruncate、短寫後失敗、讀取失敗全部拒絕 |
| baseline／candidate 前置 guard | 12 | bucket、物件大小、archive SHA、重複／越界路徑及檔案額度錯誤全部拒絕 |

合計35例：2個有效控制、32個拒絕、1個原版特有接受結果。CRC故障 fixture 刻意修改 ZIP 並重算受信任 archive SHA；原版 extractTo 接受其 entry，串流候選拒絕。**這不是一般未通過 archive SHA 的攻擊，也不表示實作已加入逐檔 manifest SHA 驗證。** 短寫 fixture 只複製7bytes後失敗，即使預配置檔案已長65,539bytes仍正確拒絕。失敗 PHP 中可以留下部分檔案，因此不能只看最終檔案大小判定成功。

另6個實際 handler 生命週期案例通過：原版 bad ZIP 拋錯後仍有已配置 PHP heap／檔案（測試最後手動 dispose）；候選 bad ZIP、後置驗證失敗均 dispose 並保留原錯誤；成功保留 caller ownership；清理錯誤保留兩個 error；runtime factory 在配置前拋錯保留原錯誤且無 PHP allocation。

先前未通過的測試也保留：CRC原版接受結果打破了初版測試假設；ftruncate實際呼叫FS.doTruncate而不是FS.truncate；生命週期初版用了錯誤getter，且 liveness PHP request 觸發 runtime rotation，讓原 disposed flag 不可靠。該初版只有 terminal Node exit1能證明最終釋放，不能宣稱明確 php.exit。修正後的v4測試只讀 heap／檔案，不再以執行 PHP 判斷存活。

## 完整建置與 workerd 重試

新目錄包含83個TS來源、206個完整輸入。TypeScript與Wrangler dry-run exit0；71個metafile來源核對，完整編譯差異僅為 helper、新的boot ownership和相關scope名稱變更。五個二進位模組不變。實際無觀測程式的JS SHA：

`cb9302a8b57c9bc3db16304cb3ad995b793eab543a759a4f7b9bfdb4800e0de5`

另外產生可逆的數字生命週期觀測副本（535d4502…），移除一處觀測插入即可逐字回復上述 bundle。它多一次 getPrimaryPhp await／listener，**不作效能或記憶體數據證據**。

workerd測試以先前獨立備份的LOCAL190 full materialization建立新的本機R2／DO。180秒／131,072bytes／8ops界線不放寬，publisher暫停，執行端R2寫入與外連禁止。只在第一次 core ZIP get 的回傳記憶體改1byte，R2本體和受信任manifest不變。兩次login GET依序：

1. archive SHA失敗 → HTTP500；handler1 created → exited，live回0。
2. 同一個處理容器讀取完整ZIP → 新handler2 created；HTTP200，登入欄位存在。

兩次core讀取的容器ID相同，沒有reseed／rearm。觀測到的4次exception事件均為同一個預期SHA錯誤，不代表4個請求；其他例外0。初版曾錯誤要求整個fixture只能有一個constructor event；第二版改為比對實際兩次讀取的容器ID，保留初版失敗紀錄，不猜測額外constructor的原因。

最後仍LOCAL190、301個R2物件key／size／etag及全部網站內容精確；charged0／puts0、closed／sealed／pending0、外連0。程序exit0且9505／9506釋放。成功的handler2由cache持有至整個workerd關閉；失敗handler1已在重試前明確退出。

## 重建及後續

接在[前一階段](../preallocated-native/README.md)組裝後，執行本目錄 `install-local-tools.py --runtime <runtime> --apply`，核對124個前置工具並加入8個工具。重套會拒絕且不改檔案。這只安裝測試／準備工具，**不修改中央82來源或20設定**，需要既有私人backup／artifact／owner及固定依賴，不包含私人資料。

從runtime目錄執行：

```powershell
python scripts/playtt-boot-cleanup-build-prepare.py --local --previous <preallocated-source-build> --target <new-build>
```

準備工具拒絕既有target。206輸入已在另一全新目錄重建並逐一hash核對。沿用鎖定的已安裝依賴，在新目錄執行 `tsc -p tsconfig.typecheck.json --noEmit`（保存typecheck-private.log）和關閉telemetry的 `wrangler deploy --dry-run --config wrangler.playtt-session-audit.jsonc --outdir dry-run --metafile dry-run/metafile.json`。沒有重新安裝依賴或部署。完成的build與audit用唯讀模式重算：

```powershell
python scripts/playtt-boot-cleanup-build.py --local --build <built-directory> --check
python scripts/playtt-boot-cleanup-audit.py --local --check
```

新工具的owned run皆已完成，fault／lifetime／local工具遇現有owner會拒絕。保留失敗／成功owner與原預算；不同實驗另立可辨識紀錄，不覆寫或刪除以重跑。

**合併cleanup的這個新候選尚未做原生編輯／保存／重啟驗收。** 前輪原生驗收只涵蓋materializer候選，當時完整流程最大觀測組成仍約141–143MiB；本輪不是免費記憶體可行性證明。下一步先在本機驗收合併候選，再定位完整編輯流程的配置。provider記憶體／CPU、繁中首次初始化、長期免費、實體IME與全案A01–A20仍未完成。

本輪0 provider請求／部署，最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、餘62,344bytes，未刷新帳戶計費。沒有新增費用、提高cap、退款、清unknown或刪pin／歷史。PR4維持draft，goal active。

證據：[35例故障](../../../docs/verification/cloudflare-preallocated-fault-proof.json)、[6例生命週期](../../../docs/verification/cloudflare-boot-cleanup-lifetime-proof.json)、[建置](../../../docs/verification/cloudflare-boot-cleanup-build.json)、[統合稽核](../../../docs/verification/cloudflare-boot-cleanup-audit.json)、[工具組裝](../../../docs/verification/cloudflare-boot-cleanup-rebuild.json)、[交付檢查](../../../docs/verification/cloudflare-boot-cleanup-review.json)。
