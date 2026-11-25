# 解壓輸出區塊大小候選

新候選只替固定解壓呼叫加入 `chunkSize: logicalLength + 1`。**`maxOutputLength`仍等於原始檔案長度，最後長度檢查與512KiB快取上限都不變。** 本機控制、真正PHP語意及完整建置通過；新建置尚未完成原生編輯器／重啟流程，免費驗收仍開放，中央runtime與正式站不變。

## 來源與假設

固定workerd的info同步路徑先配置輸出區塊，在區塊用盡時再配置，最後視情況合併多個區塊。迴圈也檢查原有maxOutputLength並關閉native handle；來源沒有證明JavaScript把handle關閉延後到其他事件。可由已知檔案長度配置區塊，讓有效輸出不必用盡第一塊；多的一byte是配置大小，並未允許額外輸出。[固定迴圈與關閉路徑](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/node/internal/internal_zlib_base.ts#L249)、[初始配置](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/node/internal/internal_zlib_base.ts#L445)。

這是可驗證的配置假設，尚未證明它就是前輪完整後台263,085,325／216,396,722bytes觀測的原因。沒有修改runtime版本、compatibility flags、原生codec、canonical格式或權限。

## 真正workerd與PHP比較

固定workerd1.20260828.1、原compatibility2026-07-18及既有flags，兩種區塊設定各驗證16個512bytes至8MiB邊界。輸出SHA／長度、輸入不變、上限不足及多一byte拒絕均通過，共32例。

另將pinned核心corpus中1,449個可壓縮檔以相同5,210,374bytes壓縮payload送入兩種設定；各檔SHA及長度精確，共22,432,492bytes原文。既有22組真正PHP／MEMFS比較只換候選模組及owner名稱，原版與候選觀測完全相同，兩個PHP實例均已退出。

候選模組SHA：`385e86a870bc8757af0eae5dec5aa28623add5ed9113b0b344f15f66d621fcdb`。與原型3a72305b的差異只有chunkSize選項；讀寫、mmap、直接contents還原、metadata、alias、wp-content排除及精確解壓上限不變。

## 相同工作量控制

六個全新workerd按原版／候選／候選／原版／原版／候選順序執行，使用相同fixture、相同壓縮payload，每個實例同步解完整corpus三次，共18個測量窗口。每次核對完整輸出合併SHA及輸入SHA，保留最後輸出作單檔快取；不強制GC，程序均已關閉。此工作量不是實際WordPress的讀取順序或次數。

| 每種設定的9次平均 | 原版 | 候選 | 變化 |
| --- | ---: | ---: | ---: |
| 累計sampled JS配置 | 2,578,505bytes | 2,337,233bytes | -9.36% |
| JS＋backing觀測最大值的平均 | 37,665,557bytes | 31,328,067bytes | -16.83% |
| 本機wall time | 278.09ms | 247.16ms | -11.12% |

Inspector取樣可能漏掉同步迴圈內的更高值；這些最大值不是精確尖峰。輸入載入前後的垃圾與GC時間也可能影響讀值。SHA、Inspector有共同成本；sampled配置包含已回收物件，不是retained size。沒有PHP/WASM或provider限制測量，不能套成整個後台改善比例或billed CPU。

## 完整建置與下一步

在前輪完整ed725b8e4建置的210項輸入中，只替換原型模組，其他209項精確相同。TypeScript與Wrangler dry-run通過，73個載入來源核對，5個二進位模組相同；編譯後JavaScript也確認只增加同一chunkSize選項。

新建置SHA：**`14cada693be821b6d4eac703d85422f10a33a1a0dde540ba3c4e31c9a92141e7`**。它尚未執行完整原生保存／重啟／登出／獨立備份與記憶體驗收。前輪ed725b8e4資料通過及高記憶體數字屬前輪，不是這個候選的觀測。

下一步以新建置跑一次原有有界原生流程，核對壓縮保持、檔案內容、保存與重啟、session及獨立備份，量測記憶體／CPU；依結果決定是否繼續調整。不能把控制中的16.83%扣掉舊後台數字後宣稱達標。原命令選單global-style403仍另有待驗項，不調寬editor權限。

交付接續core-integrated組裝：249個前置工具，新增7個，795個舊檔不變，共802檔。所有owner已完成，不可重播；只讀重算指令：

```powershell
node scripts/playtt-core-sized-audit.mjs --local --check
node scripts/playtt-core-sized-build.mjs --local --check
```

完整新建置準備可用build工具的`--local`，在新目錄連結固定依賴並執行既有TypeScript與Wrangler dry-run指令。新候選未採用至中央／未部署，正式Pages與原視覺不變，0雲端專案請求或帳務刷新。最後雲端觀測仍2026-11-21T16:52:39.597Z、canonical181、pin16且原15保留、歷史餘62,344bytes、publisher暫停。

第一次繁中初始化、provider記憶體／CPU、長期免費、實體IME／手機、命令選單可用性及原始A01–A20仍開放；全案active、PR #4維持draft。

證據：[完整稽核與控制](../../../docs/verification/cloudflare-core-sized-audit.json)、[codec邊界與corpus](../../../docs/verification/cloudflare-core-sized-semantic.json)、[PHP比較](../../../docs/verification/cloudflare-core-sized-php-semantic.json)、[完整建置](../../../docs/verification/cloudflare-core-sized-build.json)、[前輪完整流程](../core-integrated/README.md)。
