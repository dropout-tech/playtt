# 壓縮清單位元組轉換候選

`decodeCanonicalManifestBytes` 原本以 `Uint8Array.from(atob結果, mapper)` 產生壓縮位元組；原生配置取樣在此路徑記錄到字串 iterator 中間配置。候選改成依長度配置 Uint8Array，再按索引填入。Base64 round-trip、外層欄位、大小上限、壓縮／解壓 SHA、gzip 長度、解壓後內容及內外 identity 驗證完全保留，序列化函式也未改動。

此處僅轉換標準 `atob` 的 Latin-1 回傳字串，不是一般 Unicode 轉換 API。規範依據：[HTML atob](https://html.spec.whatwg.org/multipage/webappapis.html#dom-atob-dev) 的每字元一位元組語意，以及 [TypedArray.from](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-%typedarray%.from) 的 iterable 處理。效能結論來自本機實測，不由規範推定。

**隔離研究候選：中央來源、Cloudflare、正式 Pages 及原站視覺未變；尚未採用或部署。**

## 相容性與配置量測

58 組原版／新版比較通過，包含全部 256 種壓縮位元組、空／一般／大型清單、非標準 Base64 padding、錯誤欄位／SHA／長度、gzip CRC 損壞／截斷、解壓上限、非法 UTF-8／JSON、巢狀 envelope、錯誤檔案路徑。另驗證序列化位元組相同、非同步期間修改 caller 輸入不影響結果、stream cancellation、arrayBuffer 及大型舊 plain-manifest 分支。既有 25 項 envelope 整合回歸以實際候選替換原模組後通過，包含 worker 保存／讀取、備份、還原及旗標關閉的相容路徑。

六個全新本機 workerd 以 baseline/candidate/candidate/baseline/baseline/candidate 順序，解碼同一份獨立備份中的真實清單：23,503 wire bytes、74,029 logical bytes，各重複 20 次。比較包含完整格式／雜湊驗證與解壓；輸出 logical SHA 完全一致。備份 304 物件及六份原始 profile 經唯讀工具重算。

| 累計 sampled JS self bytes | 三個副本 |
| --- | --- |
| baseline | 22,328,320 / 22,683,016 / 22,813,284 |
| candidate | 9,763,788 / 9,836,304 / 9,139,100 |

32,768-byte sampling 包含已回收物件；這是該組解碼工作累積配置降低，**不是整體後台尖峰降低比例**。20 次用於放大量測，不代表每次儲存的實際呼叫次數；`next` 配置亦包含其他 iterator，不能全部歸因單一函式。沒有 PHP／網站寫入，也沒有強制 GC 取得通過數字。

## 完整建置與原生資料流程

候選 SHA `c81f37e3ab4399efc98fcb5688d1e62fc3dd114fc8e3e28c9edb0a2fdef76e99`。在已驗證 owned-paths v2 上替換一個來源，83 TS／206 輸入完整型別檢查與 Wrangler dry-run 通過；71 個載入來源核對，五個二進位模組不變。實際 JS `fbc6506c323feed4199b8273ea9a595171092910eb1161289be6f1c6c28ef877` 相對 b30c55a6…逐字只有一處轉換改成配置與 loop，未加入診斷分支。

實際六模組由 cloud181 獨立備份建立空的本機 R2/DO，600 秒／1,881,041 bytes／96 ops，publisher 暫停且禁止外連。原生登入、專屬草稿繁中段落編輯、單次保存 1,875 bytes、完整 workerd 關閉／新 instance／同資料同視窗重啟、新分頁讀回十段內容與 11 筆修訂、原生登出通過。第一個編輯分頁在重啟前關閉；啟動時曾誤開命令選擇區，已關閉並循觀測到的頁面清單網址操作，這些順序保留在 UI 證據。

新增 revision209 與草稿內容精確；原文章／修訂／全部 usermeta 及 session／媒體／主題相同，差異只限專屬草稿、edit lock、新 revision 與自增資料。304 物件／298 檔獨立備份及 full materialization 核對通過。最終 LOCAL190、450,182 bytes／27 puts、closed/sealed/pending0、外連0、程序 exit0。未另外用使用者介面還原 materialized 輸出，也不是實體 IME／手機驗收。

225 個 HTTP 結果中，第一次未通過測試入口的登入 GET404 與實際 `Not found` 及固定 gate 來源一致；一個 global-styles GET403 有精確 route／`rest_forbidden_context`，符合測試編輯者權限，未放寬權限。沒有未分類 HTTP 錯誤。但重啟後**再次捕捉一筆 `Uncaught Error: Network connection lost.`**，沒有 frame；原生登出及資料通過不能證明此例外無影響。它與前輪例外的原因都仍未證明，不能倒推為取消請求或宣稱修復。

重啟前／後最大觀測組成合計 **154,661,309／168,735,007 bytes（約 147.5／160.9 MiB）**。組成為相同 generation 的 CDP used+backing+最近 PHP HEAP；存在非同步邊界與觀測開銷，並非 provider peak、RSS、billed CPU。本機不強制 Cloudflare admission，**未通過免費記憶體驗收，也未觀測到整體尖峰改善**。原生配置視窗含不同數量的背景請求與互動時間，不能與前輪總數直接估算效能比例。

## 重現及保留紀錄

接在 `owned-paths` 組裝後套用 `install-local-tools.py --runtime <runtime> --apply`：核對 170 個前置檔，加入 13 個工具；重套必須拒絕且不改檔。需要既有固定依賴及私人備份，無新套件安裝或雲端資源。

```powershell
node scripts/playtt-manifest-bytes-check.mjs --local --check
node --import tsx scripts/playtt-manifest-bytes-allocation-check.mjs --local --check
node scripts/playtt-manifest-bytes-regression.mjs --local --check
python scripts/playtt-manifest-bytes-build.py --local --build <manifest-bytes-build> --check
node --import tsx scripts/playtt-manifest-bytes-native-audit.mjs --local --check
python scripts/playtt-manifest-bytes-native-allocation-audit.py --runtime . --local --check
```

`build-prepare.py --local --previous <owned-paths-build-v2> --target <new-build>` 產生完整 206 輸入；使用既有依賴執行 TypeScript 及 **dry-run**。配置量測已完成的 owner 為 `allocation-2`；原生 owner 為 `native`，不得重播。初次沙箱阻擋 localhost connect（EACCES）已 terminal/disposed，失敗 owner 與當時腳本保留；第二次明確取得本機權限才執行。另保留 junction 未建立造成的 module-not-found 建置日誌，再取得本機權限完成建置。不是放寬資料／容量限制。

下一步釐清反覆出現的 network-loss：需要實際 request abort／response stream／stack 證據，不能從登出時間推論。記憶體仍應依 FS.lookupPath/getattr/writeStat 等已測 stack 處理；不可刪驗證、共用可變 Date、強制 GC 或增加額度來取得通過結果。

本輪 0 provider 請求／部署／計費刷新。最後雲端確認仍 2026-11-21T16:52:39.597Z、canonical181、餘62,344 bytes、publisher 暫停；此歷史數字不是目前計費查詢。無 cap 增加、退款、清 unknown、刪 pin／歷史、替代雲端資源或付費升級。目標 active，PR4 draft；A01–A20、provider 記憶體／CPU、首次繁中初始化、長期免費與實機驗收仍須完成。

證據：[語意比較](../../../docs/verification/cloudflare-manifest-bytes-check.json)、[配置控制](../../../docs/verification/cloudflare-manifest-bytes-allocation-summary.json)、[配置重算](../../../docs/verification/cloudflare-manifest-bytes-allocation-check.json)、[整合回歸](../../../docs/verification/cloudflare-manifest-bytes-regression.json)、[建置](../../../docs/verification/cloudflare-manifest-bytes-build-proof.json)、[原生資料與例外](../../../docs/verification/cloudflare-manifest-bytes-native-audit.json)、[原生配置](../../../docs/verification/cloudflare-manifest-bytes-native-allocation-audit.json)。
