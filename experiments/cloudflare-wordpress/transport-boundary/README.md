# 取消請求的傳輸邊界與固定版本來源核對

本階段把本機 WordPress 的取消例外縮小到可獨立控制的條件：**只有被取消請求在觀測區間內，仍重現一筆 `Network connection lost.`；前後正常請求、登出與所有原資料／備份精確。** 這支持本輪受控取消的歸因，沒有修復 runtime，也沒有替歷史瀏覽器例外補上不存在的 request ID。

正式 Pages、原站視覺、私人 Cloudflare WordPress、發布狀態與額度均未操作。中央來源／config 不變，無付費或部署。下一個主要工作回到免費記憶體驗收；不能用本輪取消結果跳過原本的原生 UI 穩定性驗收。

## 先排除代理旗標的單一原因

固定依賴為 Miniflare `5.20260828.0-alpha`、workerd `1.20260828.1`、Windows x64／Node `24.18.0`。實際 binary 回報 `workerd 2026-08-28`，SHA `afe9fe8024bcac3a8f5e7209c350840251e65cb0140001e463cdb16065ba047c`，97,783,296 bytes；未設定替代 binary 路徑。

安裝版 Miniflare 的入口 Worker 使用2025-03-17相容日期，沒有 `enable_request_signal`，再以 service binding 轉送。我們的測試 Worker 已啟用旗標，因此原先推測代理設定可能讓 signal 消失。直接 socket 的比較否定了「只因代理缺旗標」：跳過入口、只回傳一個字元，也會重現。

| 控制 | 正常／取消數 | 結果 |
| --- | --- | --- |
| 原始24案例：proxy／direct × plain／DO × 前正常／取消／後正常 × 2輪反轉順序 | 16正常、8取消 | 正常200／`1`；每次取消各1筆例外；無abort event |
| 最終36案例：再加入串流中取消 | 24正常、12取消 | 正常回應完整；每次取消各1筆例外；無abort或body-cancel event |

plain／DO 在執行層讀完測試 body、尚未送標頭時取消；串流則等客戶端收到第一個chunk才取消。每輪先proxy再direct，第二輪反轉順序。最終串流觀測保留2000ms，所有該案事件／例外均落在下一案例開始前。沒有 PHP、WordPress、R2 或內容寫入，也沒有外連；全部程序exit0。

這些結果只描述本機固定版本。Debugger已啟用對所有例外暫停，但0次pause；inspector中的例外均無frame。這不提供原生C++ throw instruction。初次串流觀測只等1100ms，短於兩段750ms串流延遲，3案事件跨到後續案例、最後一案尚未記到尾端就dispose；保留36案例／11例外原紀錄，**不接受它的逐案歸屬或0例外推論**。

## 原始碼能證明的邊界

用GitHub來源工具固定tag到commit `8ea63498c7aa107995f9b2ffee7789631707e09f`，五個來源以Git blob SHA重算驗證，完整來源僅留本機核對。不是用最新版原始碼推論舊binary。

- [jsg/util.c++](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/jsg/util.c%2B%2B#L328) 將一類底層斷線轉成通用的JS錯誤文字，因此同文字不代表同一原因。
- [worker-entrypoint.c++](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/io/worker-entrypoint.c%2B%2B#L431) 的abort分支排除已記錄例外的情況；[同檔logging boundary](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/io/worker-entrypoint.c%2B%2B#L495) 以REQUEST_HANDLER分類記錄這條處理路徑。
- [io-context.c++](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/io/io-context.c%2B%2B#L444)、[worker.c++](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/io/worker.c%2B%2B#L2596) 連接native例外與inspector；[enum](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/util/uncaught-exception-source.h#L28) 將REQUEST_HANDLER顯示為`Uncaught (in response)`，與詳細日誌一致。

這組來源證據支持所觀測的logging boundary，**不是實際C++ stack trace**，不能斷言捕捉到確切throw位置。官方[Request文件](https://developers.cloudflare.com/workers/runtime-apis/request/)描述斷線時的signal意圖，但本機控制沒有觀測到abort；沒有為了通過測試而吞掉例外或自行增加取消修補。

## 真正 WordPress 的單一請求控制

使用原六模組 JS `fbc6506c323feed4199b8273ea9a595171092910eb1161289be6f1c6c28ef877`，從cloud181獨立備份建立新的本機空R2／DO。publisher暫停、外連禁止、固定600秒／1,881,041bytes／96ops視窗。沿用已修正cookie到期處理的HTTP控制，從真實post.php取得當下nonce與編輯鎖。

取消ID14前已觀測到execution entry、尚未送標頭。客戶端close已確認且未收到response；兩層之後仍記錄200／aborted=false。這次會等例外出現及額外250ms觀測完成，才發出下一個編輯頁請求；整個區間沒有其他request ID。詳細日誌只有一筆`Uncaught (in response)`斷線，前後正常unlock均200／`1`、登出302、沒有HTTP錯誤。

最終LOCAL189、399,675bytes／24puts、closed／sealed／pending0、程序exit0。原文章與修訂、全部usermeta及session、媒體、主題和其他內容精確；新的登入session已由登出移除。只變動專屬edit lock與wp_options自增數，未編輯文章／建立revision。304物件／298檔獨立匯出匯入與full materialization一致。中央82TS、20configs、五個實際二進位模組不變。

## 交付與接續

接在request-lifecycle組裝後，`install-local-tools.py --runtime <runtime> --apply`核對192個前置檔、新增4個工具，保留738個舊檔（共742）；重套拒絕且無變更。需既有固定依賴與私人證據，不建立任何雲端資源。

```powershell
node --import tsx scripts/playtt-transport-audit.mjs --local --check
```

三個harness現有owner都已完成，不得重播；使用離線audit。最終stream工具指向v2，初次短觀測工具副本保留在其private executed-harness。WordPress的實際輸入四檔與SHA亦保留。提交只含工具、雜湊、摘要與來源連結；原始runtime logs、stack、HTML、密碼與備份payload不提交。

本輪不新增記憶體數據：前輪約147.5／160.9MiB的觀測組成不是provider尖峰；免費記憶體／CPU、首次繁中初始化、長期免費、實體IME／手機與A01–A20仍待完成。後續處理已量測的FS.lookupPath/getattr/writeStat暫存配置，同時保留歷史network-loss未歸因狀態；若原生流程再出現例外，使用現在的有界診斷記錄其請求。

0 provider請求／部署／計費刷新。最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、歷史餘62,344bytes、publisher暫停；此數字不是現在的計費查詢。無增額、退款、清unknown、刪history／pin或替代雲端額度。PR4保持draft，全案active。

證據：[來源、控制及WordPress資料稽核](../../../docs/verification/cloudflare-transport-audit.json)、[實際binary](../../../docs/verification/cloudflare-transport-binary-proof.json)。
