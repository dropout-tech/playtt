# 區分原生操作與備份檢查的記憶體量測

暖機後出現的第二次完整 ZIP 解壓，來自測試工具的完整一致性檢查。原生儲存完成時，ZIP 次數仍為 1；工具的 `saved -> snapshot -> op(fence-status)` 呼叫會透過 `cutoverStatus -> readCanonicalRevision` 重新解壓完整備份。這項檢查必須保留，但不能混在原生儲存的 allocation profile 裡當成保存成本。

同一個診斷 bundle 的第二輪流程先停止原生操作採樣，再做完整一致性檢查；工具也會拒絕在 allocation sampling 中呼叫 fence-status。原生載入與儲存窗口各有 7／5 個完整數字快照，ZIP 增量皆為 0，operator-status 請求皆為 0。資料保存與獨立還原仍通過。中央 runtime、私人 Worker、正式 Pages 與原視覺均未變更。

## 診斷程式

42 個固定位置、46 個 AST callsite 改動，觀測 PHP 讀檔、R2 body、雜湊、ZIP 與 gzip 的位元組量。計數器只保留固定名稱和數字，回傳原始輸入物件，不保留內容或路徑；有 96 個標籤上限、格式／型別／溢位檢查。六組邊界測試通過。這是流量計數，**不是配置量、唯一位元組量、存活容量或尖峰**；read、digest、codec 可能重複計算同一資料，不能加總。

完整建置 SHA `922ab37887c40d579bd2d383cdc4453a9f50f78c2501703b76a648d21f01ccc0`。214 輸入、201 個既有輸入不變、10 改動／3 新增、76 載入來源；5 個二進位模組相同。TypeScript、dry-run 和 AST transform 核對通過。基底為既有 12 MiB LRU；儲存格式、讀寫結果、權限與完整性驗證不變。診斷程式本身仍有觀測成本。

## 分離後的觀測

| 原生儲存位置 | 呼叫增量 | 位元組量 |
| --- | ---: | ---: |
| Markdown 雜湊輸入 | 171 | 491,681 |
| persistRuntime PHP 讀取（含差異 frame 讀取） | 176 | 856,657 |
| 差異內容 gzip 輸入 | 1 | 365,779 |
| 差異內容 gzip 輸出 | 1 | 26,379 |
| 清單 gzip 輸入 | 1 | 74,029 |
| 完整 canonical ZIP 解壓 | 0 | 0 |
| persistRuntimeObjects PHP 內容讀取 | 0 | 0 |

上述數值是窗口首尾快照差；`maxObservedCallBytes` 是該 isolate 累計到窗口末的最大單次觀測，並非窗口內最大值。載入窗口另有 50 次靜態資產 body／digest 共 5,252,608 bytes；兩個位置觀測同一批資料，不可相加。未變更媒體及主題在內容讀取前就會略過，不能把其總容量視為每次保存都複製。

首次完整檢查前的 71 個有效週期樣本，最大非同步組件合計 129,189,887 bytes；載入窗口 27 樣本同值，儲存窗口 12 樣本最大 121,295,221 bytes。兩個最大值的 PHP 觀測距離皆 13 ms。這些是 Inspector JS＋backing＋同 generation 最近 PHP 的合計；不是同步尖峰、RSS、provider 限制或 billed CPU。取樣可能漏掉冷啟動／暫存尖峰，低於 128 MiB 的本機合計也不能代表免費環境接受，餘裕仍小。

分離後整輪合計仍有 150,580,172／157,621,676 bytes，因完整驗證仍照常執行。重啟後觀測前也做了完整檢查，因此該段不納入原生專屬 prefix。第一輪混合窗口的 144,803,437／157,729,044 bytes 同樣保留；這些不同時間的數字不構成效能改善或前後受控比較。

## 原生資料與還原

兩輪均以 cloud181 獨立備份建立新的本機副本，固定 600 秒／1,881,041 bytes／96 operations，publisher 暫停、外連封鎖。沒有重播完成 owner、調大上限或重設窗口。

| 流程 | 保存 receipt | 最終本機版次 | 寫入 bytes／puts | 完整重啟時 bytes |
| --- | ---: | ---: | ---: | ---: |
| 原始量測 | 187 | 191 | 500,146／30 | 349,997 |
| 分離原生量測 | 186 | 191 | 500,219／30 | 350,074 |

兩輪保存內容皆 1,875 bytes，SHA `93f8e21c8def8c2d5a6ec9b54d91990b8ef41dadcd847ba4d274da51ba01f39b`。新分頁讀回相同內容與 11 筆修訂；原生解鎖兩層 200、登出 302 並顯示登出完成。原有 posts、usermeta、session、媒體與主題精確，只增加預期修訂 209 及 draft／lock／sequence 變動。304 物件／298 檔獨立 export/import/full materialization 相同。runtime exception、HTTP error、外連皆 0；closed／sealed／pending0，兩輪 terminal exit0，9570–9573 與分頁均已關閉。

## 離線核對與下一步

接續 backing 的 294 個前置工具雜湊，新增 11 個工具；乾淨組裝 851 檔、840 舊檔不變，重套拒絕。原始執行檔、私有 observation、profile、owner 與控制命令留在工作區，不包含在 PR。公開報告只有固定標籤、數字、來源雜湊與核對結果。

```powershell
node scripts/playtt-byte-volume-build.mjs --local --check
node --import tsx scripts/playtt-byte-volume-editor-audit.mjs --local --check
node --import tsx scripts/playtt-byte-volume-editor-audit.mjs --local --isolated --check
node scripts/playtt-byte-native-analysis.mjs --local --check
```

下一步以已分離的 native profile 查看 PHP 檔案系統呼叫、靜態資產及冷啟動暫存，並規劃有足夠資料預算的私人免費 provider 驗證。完整一致性檢查的記憶體成本仍需獨立處理，不能刪除檢查或改用輕量狀態冒充完整驗證。正式站維持現況；免費記憶體／CPU、繁中首次初始化、實體 IME／手機、長期流量與 A01–A20 仍開放。PR #4 保持 draft，不合併或切換後台。

證據：[建置](../../../docs/verification/cloudflare-byte-volume-build.json)、[原始量測](../../../docs/verification/cloudflare-byte-volume-native.json)、[分離量測](../../../docs/verification/cloudflare-byte-volume-isolated.json)、[觀測範圍](../../../docs/verification/cloudflare-byte-volume-analysis.json)、[計數器合約](../../../docs/verification/cloudflare-byte-volume-contract.json)。
