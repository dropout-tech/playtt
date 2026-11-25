接續：[完整來源建置與原生繁中保存／重啟驗收](../preallocated-native/README.md)已通過；完整編輯記憶體仍待改善，中央候選及雲端未切換。

# 冷啟動配置定位與預配置解壓候選

2026-11-22（台北）。以獨立LOCAL191完整備份和先前實測的路徑候選bundle，完成**不載入瀏覽器資產的單次登入頁**冷啟動量測。找到核心ZIP雜湊複製與事後縮檔複製兩個具體配置點；隔離候選改成預配置已知檔案長度後串流解壓，並直接對原Uint8Array view計算雜湊。

候選已通過固定PHP8.3.36的完整核心逐檔檢查及本機冷啟動。**尚未套用中央runtime、未完成候選的完整來源建置／原生編輯保存驗證，也未部署雲端。** 正式Pages及原視覺維持現況。

## 先找出配置來源

固定六模組中的JS建立診斷副本，六個唯一位置的插入形成七個量測點；五個二進位模組完全相同。FS inventory只保留數字，不保留被取代的buffer；縮檔時逐byte比對新舊有效內容。不使用heap snapshot或強制GC。

每個點透過**本機Miniflare service binding**暫停，主機以自有loopback workerd Inspector讀Runtime.getHeapUsage後回覆。這不使用瀏覽器、Cloudflare、外部HTTP或Runtime.evaluate；讀值方法沿用前輪固定版本校正。所有PHP heap均64MiB，inventory沒有未知file buffer或WASM別名。

原版紀錄顯示：ZIP大小5,975,792bytes；雜湊步驟backing增加5,975,824bytes。核心縮檔489個，將容量31,102,303降為22,527,346bytes，但過程新複製18,196,499bytes，再讓舊26,771,456bytes具備GC資格。**減少保留容量不代表執行當下沒有額外配置。**

## 候選的兩個修改

1. 完整保留原archive SHA、manifest路徑／大小／數量／總量限制與ZIP目錄核對。逐項用ZipArchive::getStream取得內容，建立目標檔案，以ftruncate配置已知大小，再stream_copy_to_stream。最多讀size+1並要求實際複製量、flush及最終大小精確；輸入／輸出串流均在finally關閉，原ZIP及暫存檔清理保留。這樣MEMFS不必在寫入途中反覆擴張，也不需要再複製縮減容量。
2. SHA-256直接接受原Uint8Array view，移除Uint8Array.from產生的完整副本；沒有跳過SHA或改變檢查內容。

設計依據為PHP官方的[getStream](https://www.php.net/manual/en/ziparchive.getstream.php)、[ftruncate](https://www.php.net/manual/en/function.ftruncate.php)與[stream_copy_to_stream](https://www.php.net/manual/en/function.stream-copy-to-stream.php)；實際相容性由固定8.3.36執行驗證，沒有把目前文件的新版PHP當成本案runtime。

## 真正PHP檔案語義驗證

採用既有研究loader38231012…及原WASM，分別在全新PHP instance跑原版／候選。

| 案例 | 比較結果 |
| --- | --- |
| 真正WordPress runtime ZIP的2,154個檔案 | 每檔SHA、大小、mode完全相同；壓縮暫存檔均移除 |
| 8個邊界fixture | 含0byte、65,539bytes、不整齊大檔、繁中目錄／檔名；每檔SHA／大小／mode精確 |
| 雜湊view的4案例 | 空陣列、一般bytes、有offset子視圖、空子視圖；與獨立Node SHA一致且輸入未改 |
| 原版與候選縮檔後再驗SHA | 所有檔案仍與manifest精確 |

核心有效內容均23,714,640bytes。原版配置33,170,064bytes，其中9,455,424bytes多餘；候選配置正好23,714,640bytes，超額配置檔案0，後續compaction複製檔案0。這是單獨擷取階段；完整WordPress啟動會再加插件／主題／設定檔，不能把這個數字當完整後台用量。

交付原始候選[wordpress-runtime-artifact.candidate.ts](./wordpress-runtime-artifact.candidate.ts)及[兩處修改patch](./materializer-candidate.patch)。source SHA由2a334550…變為fd63abb0…。檔案保留原runtime相對import，供下一輪獨立完整來源建置使用，不是在本目錄直接執行的獨立程式。中央原檔未改。

## 完整冷啟動對照

相同獨立完整備份、來源loader、七個觀測點與131,072bytes／8ops／180秒本機寫窗；執行DO另外明確拒絕R2修改。僅允許登入GET及本機初始化／封存控制。兩個新副本都登入頁200、欄位存在，無瀏覽器／asset請求、例外0、外連0。最終各LOCAL191、301物件，完整網站內容及R2 key／size／etag均不變；charged0、closed／sealed／pending0，程序exit0與9501／9502釋放已確認。

| 觀測點 | 原版組成合計bytes | 候選組成合計bytes |
| --- | ---: | ---: |
| ZIP之前 | 87,871,167 | 87,855,463 |
| ZIP讀入 | 94,534,671 | 94,518,495 |
| ZIP驗證 | 100,527,491 | 94,535,347 |
| ZIP寫入MEMFS | 106,519,527 | 100,527,383 |
| ZIP擷取完成 | 152,670,619 | 126,015,978 |
| 縮檔之前 | 134,702,247 | 123,741,057 |
| 縮檔之後 | 149,911,721 | 125,161,977 |
| HTTP回應完成後 | 150,353,111 | 124,166,759 |

七點最大值約145.6→120.2MiB。ZIP驗證backing增量原版5,975,824、候選32，差額等於ZIP大小；候選完整boot的compaction複製檔案數0。這提供具體配置差異，**不是連續尖峰、穩定17.5%整體改善、provider admission或完整編輯器驗收**。2525／2517ms只是有觀測停頓的單次wall時間，不宣稱加速。

組成合計是usedSize＋backingStorageSize＋當點HEAPU8.byteLength，不加embedder；七個async觀測點及遍歷本身會配置記憶體並改變GC時序。Runtime.getHeapUsage校正只適用本次固定版本；舊約117MiB HeapProfiler快照已包含PHP，不能再加。候選取樣點低於診斷128MiB不代表雲端可用。

## 工具失敗與證據界線

第一次受sandbox EACCES擋住loopback，未開寫窗／未請求WordPress，exit1／程序結束。v2透過Inspector接續的第一個觀測點逾時而500，當時未保存protocol錯誤。v3保存到第一個記憶體數字，明確捕捉Runtime.evaluate「Cannot find default execution context」，再500；兩者均封存／pending0／程序exit1。v3不能倒補v2的確切原因。

改用已由安裝Miniflare型別確認的本機service binding後，v4完成七點。未放寬資料寫入或外連限制，所有失敗owner／log保留。語義驗證第一輪的2,154核心檔案已通過，但檢查器把合法空檔案的MEMFS contents=null當成陣列，未完成fixture；修正僅限檢查器，使用新的v2完成全部，原失敗紀錄保留。候選build的digest變數名guard也曾在產物建立前拒絕錯誤needle，改成實際digest2後通過。

候選執行檔是在相同診斷bundle上做兩個已驗證的唯一修改；反向patch逐字等於診斷原版，五個二進位模組相同。**這還不是完整來源重新建置。** 尚未做格式損壞ZIP／串流中斷故障注入或候選原生編輯保存。沒有修改中央82來源、20設定、loader或既有凍結部署檔。

## 重建與接續

以local-memory-limits既有組裝執行`python install-local-tools.py --runtime <runtime> --apply`只加6個本機研究工具，驗證112個前置工具SHA；不套用候選TS。新owner／產物若已存在就拒絕重跑。`python scripts/playtt-cold-boot-audit.py --local --check`可唯讀重算公開報告，需本機私人輸入。

下一步把單一候選TS放進新的完整來源建置，核對實際產物，再驗原生繁中編輯／保存／重啟與資料一致性，通過後才評估中央研究採用。這輪4次WordPress GET（2診斷失敗、2成功），全部本機；0 provider請求／部署。雲端最後仍2026-11-21T16:52:39.597Z的181／pin16／餘62,344，未刷新計費。沒有加額度、退款、清unknown、刪歷史pin、換雲端資源繞過或付費。

完整免費可行性、provider整體記憶體／CPU、繁中初始化、長期使用、實體IME及A01–A20仍開放，目標active、PR4 draft。證據：[核心語義](../../../docs/verification/cloudflare-cold-boot-semantic-proof.json)、[量測／來源稽核](../../../docs/verification/cloudflare-cold-boot-audit.json)、[組裝](../../../docs/verification/cloudflare-cold-boot-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-cold-boot-review.json)。
