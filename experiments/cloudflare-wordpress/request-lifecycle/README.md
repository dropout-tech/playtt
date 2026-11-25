# 本機請求生命週期與取消控制

前輪原生編輯流程在重啟後兩次記錄 `Uncaught Error: Network connection lost.`，沒有 stack 或 request ID。本階段加入只供本機使用的請求診斷，跨 outer Worker／WordPress execution 記錄相同 ID、開始、回應標頭、abort 與有限 Ajax 欄位；原六個實際模組完全不改。

**兩輪原生保存／重啟資料檢查通過；兩輪刻意中斷 HTTP 請求均出現相同例外文字，最後一輪全部資料檢查通過。這不是錯誤修復，也不能回推歷史瀏覽器例外的原因。** 正式 Pages、原站視覺、私人雲端後台、額度與發布狀態均未操作。

## 診斷範圍

helper 限制 4,096 events，路徑只分成固定類別，Ajax 最多讀 8 KiB；公開紀錄不含 URL query、cookie、nonce、原 body 或欄位值。例外原文與 stack 另存本機私人檔。`x-playtt-local-client-case` 僅允許三個固定控制名稱。最新版 16 項檢查驗證原 response／body／error／cancel reason、編碼回應與非目標路徑、abort listener、欄位白名單、事件上限及轉送不等待 Ajax 分析。這是診斷行為檢查，不是原生功能或 provider 驗收。

實際 JS 仍為 `fbc6506c323feed4199b8273ea9a595171092910eb1161289be6f1c6c28ef877`；中央 82 TS、20 config 與五個二進位模組不變。每輪從 cloud181 獨立備份建立本機空 R2／DO，固定 600 秒／1,881,041 bytes／96 operations，publisher 暫停且拒絕外連。版本及用量全為本機記帳，不是雲端消耗。

## 原生瀏覽器流程

兩輪皆使用真實登入、同一專屬草稿繁中編輯、一次 Save Draft、第一分頁關閉、完整 workerd 關閉與新 instance、同資料同視窗重啟、新分頁讀回十段內容／11 修訂、原生登出。精確保存 1,875 bytes／revision209；其他原文、修訂、全部 usermeta／session、媒體及主題精確。304 物件／298 檔獨立備份與 full materialization 通過。

| 本機輪次 | 診斷方式 | 重啟後釋放鎖 | 記帳結果 |
| --- | --- | --- | --- |
| native v2 | 先完成 Ajax 分類，包裝 login／Ajax response stream | logout302 標頭先完成；unlock400、一位元組 body、兩層無 abort | LOCAL188；350,002 bytes／21 puts |
| native v3 | 轉送與分類並行，保留原 response object／stream | unlock200 標頭先完成，接著 logout302；兩層無 abort | LOCAL189；400,083 bytes／24 puts |

兩輪皆零 runtime 例外，但 request 順序、診斷開銷及瀏覽器資產快取不同，不是配對效能／因果比較。v2 的 400 仍列為未分類 HTTP 錯誤：已知 action 與 body 長度，未擷取 body 值或當下認證身分，不能由登出時間推成權限拒絕。v3 無 HTTP 錯誤。兩輪皆 closed／sealed／pending0、程序 exit0。各輪實際 helper／harness 舊版本與雜湊另存 executed-inputs，不以目前 helper 代替當時來源。

## 實際 WordPress 取消控制

HTTP 控制登入同一備份的測試編輯者，從真正 post.php HTML 讀取當下 unlockNonce／activePostLock，送原生 multipart `wp-remove-post-lock`。順序為正常控制 → 執行層已收到但尚未回應標頭時關閉客戶端連線 → 正常控制 → 原生登出。取消由 inspector 中觀測到的 execution-start 觸發，不是任意延遲猜測。

最終 cancel v3：請求 ID14 的客戶端先關閉且未收到 response，兩層之後仍回傳 200，`aborted=false`，沒有 abort event；9ms 後 inspector 記錄一筆相同 `Network connection lost.`，無 stack／request ID。前後正常控制皆 200／`1`，登出 302，無 HTTP 錯誤。前一個失敗資料驗證的 v2 也有相同控制序列及一筆例外，間隔為 7ms。

這是**明確取消條件下重現同文字**的證據；exception 本身沒有 ID，接續 editor read 也已排隊，不能宣稱已直接定位內部 throw site，更不能把歷史瀏覽器例外全部視為無害取消。此本機 Miniflare HTTP proxy 路徑並不等於 provider／瀏覽器。不能把 server200 當作客戶端已收到結果，也不能據此吞掉所有連線錯誤或實作尚未驗證的 signal 修正。

最終 LOCAL189、399,725 bytes／24 puts；closed／sealed／pending0、程序 exit0。原文章、所有修訂、全部原 usermeta 與 sessions、媒體與主題精確，新 session 已登出移除。差異只有 owned `_edit_lock` 與 `wp_options` 自增數；304 物件／298 檔獨立與 materialized 備份一致。這輪不編輯文章或建立新修訂，也不替代上面的原生 UI 流程。

## 失敗與資料復原保留

- 首次 native 啟動漏註冊 helper module，terminal exit1、未 seed／未開寫入視窗。原 owner 的 disposed=false 保留；外部 Windows TCP 表已驗證無 listener，未改寫成 dispose 成功。
- 首次取消 harness 只接受雙引號登出 href，實際為單引號／`&#038;`；在發出取消前失敗，closed／sealed／disposed，未宣稱 session 清理驗證完成。
- cancel v2 已完成控制但資料斷言失敗。封閉後只讀開啟**同一份**本機 state，沒有 rearm／reseed／使用者請求重播，前後 budget 與 state 完全相同；匯出與 full materialization 304／298。差異包含測試 user2 新增的兩筆介面設定，所有原列及 sessions 精確。HTTP jar 忽略 Expires／Max-Age，將到期 cookie 的 `deleted` 值送回 WordPress；原失敗 owner 保留，不能寫成全部資料通過。只讀工具首次因 CRLF 解析在啟動前停止，修正後 exit0。
- cancel v3 修正 cookie 到期處理，丟棄20個到期 cookie（其中5個測試者 settings cookie），最終沒有新增 usermeta。v2 用量399,774／24 puts 與失敗快照均保留；沒有藉重跑改掉原資料證據。

## 重現與後續

接在 `manifest-bytes` 組裝後套用 `install-local-tools.py --runtime <runtime> --apply`；核對183個前置檔、新增9個本機工具、保留729個舊組裝檔。重套必須拒絕且不改檔。需既有固定依賴與私人備份，不建立任何新雲端資源。

```powershell
node scripts/playtt-request-lifecycle-check.mjs --local --check
node --import tsx scripts/playtt-request-lifecycle-audit.mjs --local --variant=2 --check
node --import tsx scripts/playtt-request-lifecycle-audit.mjs --local --variant=3 --check
node --import tsx scripts/playtt-request-cancel-audit.mjs --local --check
```

目前 native owner 是 v3、cancel owner 是 v3，已完成，harness 必須拒絕重播。取消 v2 recovery 也只能執行一次；其後用離線 audit。各輪舊工具放在私人 executed-inputs 供來源核對；提交內容不含 HTML、cookie、密碼、backup payload 或原始 stack。

下一步要隔離 HTTP proxy／worker response 傳回路徑並取得 throw site，確認 abort 訊號在哪一層未傳遞，保留前後正常控制與資料比對。記憶體工作仍須處理既有量測 stack；本輪沒有量測或聲稱尖峰改善。provider 記憶體／CPU、首次繁中初始化、長期免費、實體 IME／手機及 A01–A20 仍開放。

本輪0 provider請求／部署／計費刷新。最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、歷史餘額62,344bytes、publisher暫停；這不是目前計費查詢。沒有增額、退款、清 unknown、刪 history／pin、替代雲端額度或付費升級。PR4 保持 draft，全案 active。

證據：[helper檢查](../../../docs/verification/cloudflare-request-lifecycle-check.json)、[native v2](../../../docs/verification/cloudflare-request-lifecycle-native-v2-audit.json)、[native v3](../../../docs/verification/cloudflare-request-lifecycle-native-v3-audit.json)、[取消與資料稽核](../../../docs/verification/cloudflare-request-cancel-audit.json)。
