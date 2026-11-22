# 固定 12 MiB 核心快取候選

實際讀取順序的 workerd 控制支持測試多檔 LRU：固定 12 MiB 能減少反覆解壓，同容量 512 KiB LRU 幾乎沒有改善。新候選已完成 23 組真正 PHP/MEMFS 比較、完整建置及原生儲存／重啟／登出／備份資料核對。然而完整流程仍觀測到 **177,831,430／155,996,857 bytes** 的非同步記憶體組件合計，免費後台仍未驗收。中央 runtime、正式 Pages 與原站視覺不變。

## 有依據的固定上限

前輪未截斷追蹤顯示，每程序常用核心原文約12–13MB，512KiB到8MiB LRU 均只減少約1%的解壓輸出，12MiB 才跨過這批請求的重用工作集合。新快取固定 **12,582,912 bytes／2,048 entries**，不自動擴大；按最近使用順序淘汰，超大檔略過，直接 contents／寫入／resize 仍恢復普通節點並移除該項。

容量以唯一 ArrayBuffer 的完整 byteLength 計費，共用 backing 使用 reference count，不只加總 view 長度。10組合約檢查涵蓋共用 backing、淘汰順序、替換、超大檔、清空、項目上限、單檔參考行為、view容量、零上限及非法輸入。23組真正PHP比較包含既有22組與新增多檔快取失效檢查，原版與候選結果精確；兩個PHP實例均退出。沒有放寬解壓 maxOutputLength、資料格式或編輯權限。

## 相同內容與實際順序的控制

以固定WordPress archive及實際runtime source轉換重建啟動後檔案：opaque-ID修正、wp-settings、theme-json及SDK複製的wp-config。**1,450個檔案的路徑／原文長度／壓縮長度都符合兩份實際追蹤**，壓縮payload共5,212,074bytes。每個測試核對首次解碼的每檔SHA、整條返回內容SHA、原輸入SHA及容量。

原追蹤沒有保留當時每檔SHA，因此這是來源重建且metadata一致的fixture，不是對舊live heap的直接內容雜湊比較。初版準備以字串切函式時遇到PHP模板內的括號而失敗；失敗owner與source保留，改用TypeScript AST的新準備owner完成，沒有重播或覆寫舊owner。

共12個全新 workerd1.20260828.1；兩個trace階段各測原單檔、512KiB LRU、12MiB LRU，每種2個實例，順序交錯。每個實例只跑一遍完整順序、不強制GC；原單檔使用原本record/bytes儲存方式，避免以多檔管理成本冒充baseline。

| 階段／策略 | 平均累計sampled JS | 平均JS＋backing觀測最大值 | 平均本機wall |
| --- | ---: | ---: | ---: |
| 重啟前／原單檔 | 17,001,650 B | 255,890,538 B | 2,161.5 ms |
| 重啟前／512KiB LRU | 18,637,324 B | 253,516,651 B | 2,183 ms |
| 重啟前／12MiB LRU | 1,916,232 B | 23,303,250 B | 1,400.5 ms |
| 重啟後／原單檔 | 10,855,312 B | 150,653,667 B | 1,262 ms |
| 重啟後／512KiB LRU | 10,893,230 B | 149,260,442 B | 1,263 ms |
| 重啟後／12MiB LRU | 2,080,884 B | 22,512,561 B | 846 ms |

實測命中／解壓量符合前輪模擬；12MiB策略分別只解壓12,915,404／12,370,409bytes，最多保留12,579,944／12,370,959bytes。這些同步控制沒有PHP、瀏覽器請求間隔或資料寫入，尚未證明整個後台改善比例。取樣包含已回收物件、SHA／Inspector共同成本；未強制GC不代表取樣捕捉到同步迴圈內真正最高值，更不是provider CPU、RSS或限制驗收。

## 精確建置與完整原生流程

候選模組`51ada8f92a11d39d146f169aa532d29d211d431ef9d95436263ca62b95433958`，快取模組`9c3044fdaf897ebca5ca661756596a2c75a6cae477641bd3eddc179f52a73982`。完整JS **`a600faf90967a07bfeac1f1ef849d0688b453c4e3046828a70a5754378bae8b1`**：211輸入，209個前版輸入不變，只替換適配器並新增快取；74個載入來源核對、5個二進位模組相同，編譯差異限於適配器與快取，TypeScript／dry-run通過。

沿用cloud181備份、本機600秒／1,881,041bytes／96operations窗口，publisher暫停、外連封鎖。原生繁中保存1,875bytes、receipt186；完整workerd disposal／新實例保持同一窗口、全部資料與預算，LOCAL188／350,074bytes。新分頁顯示相同內容／11筆修訂；登出後原session保留、新session移除。

最終 **LOCAL191／500,231bytes／30puts**，closed／sealed／pending0／exit0；原posts、usermeta、媒體與主題精確，只有revision209與預期draft／lock／sequence差異。304物件／298檔的獨立export、import、full materialization相同。兩次multipart解鎖outer/execution200，登出302；本輪runtime exceptions和HTTP errors均0。沒有重測命令選單403；本輪零例外也不能證明前輪兩次Network connection lost的原因或修復。

1,450個檔案在15次掃描維持壓縮，core backing5,302,562bytes；快取觀測最高12,573,119／12,370,959bytes。它減少重複解壓，但會長期保留更多解壓資料。

| 原生階段最高組件合計 | JS | backing | 最近PHP | 合計／PHP資料年齡 |
| --- | ---: | ---: | ---: | --- |
| 重啟前、save-stop | 34,729,232 | 69,046,518 | 74,055,680 | 177,831,430 B／879ms |
| 重啟後、bootstrap | 22,837,756 | 59,758,781 | 73,400,320 | 155,996,857 B／64ms |

約169.6／148.8MiB，仍不能判為免費達標。這些是同一generation內的非同步組件合計，不是同步尖峰；本機workerd不執行provider限制。與前輪不同瀏覽器時序及取樣，不宣稱受控整體改善百分比。render/save累計sampled JS為19,833,860／47,370,892bytes；後者有9,936,004bytes落在無上層歸屬的V8 API，不能由此斷言是某項保留資料或某個函式造成。

下一步以此精確候選釐清保存／冷啟動時的其他backing和序列化暫存生命週期，先檢查現有profile與實際來源，再加有界數字診斷；避免重跑未變更的原生流程或繼續任意放大快取。未採用至中央或雲端。

## 重建與未完成項

接續core-read-trace的273個工具前置條件，加入13工具，832檔組裝中的819舊檔不變。安裝器先比對雜湊，重套及已完成owner重播拒絕。唯讀重算：

```powershell
node scripts/playtt-core-lru-audit.mjs --local --check
node scripts/playtt-core-lru-build.mjs --local --check
node --import tsx scripts/playtt-core-lru-editor-audit.mjs --local --check
```

全新隔離建置用build工具`--local`，連接既有固定依賴，執行`tsc -p tsconfig.typecheck.json --noEmit`、`wrangler deploy --dry-run --config wrangler.playtt-session-audit.jsonc --outdir dry-run --metafile dry-run/bundle-meta.json`，將輸出分別存成typecheck-private.log／dry-run-private.log後再`--check`。不部署此研究版。

本輪0 Cloudflare專案請求／部署／帳務刷新。最後cloud讀值仍2026-11-21T16:52:39.597Z、canonical181／pin16、原15保留、歷史餘62,344bytes、publisher暫停。首次繁中初始化、provider記憶體／CPU、長期免費、原生網路例外、實體IME／手機、命令選單及A01–A20仍開放。PR #4維持draft，goal active。

證據：[控制與PHP](../../../docs/verification/cloudflare-core-lru-audit.json)、[原生資料與記憶體](../../../docs/verification/cloudflare-core-lru-native.json)、[建置](../../../docs/verification/cloudflare-core-lru-build.json)、[fixture來源](../../../docs/verification/cloudflare-core-lru-fixture.json)、[快取合約](../../../docs/verification/cloudflare-core-lru-contract.json)、[組裝](../../../docs/verification/cloudflare-core-lru-rebuild.json)。
