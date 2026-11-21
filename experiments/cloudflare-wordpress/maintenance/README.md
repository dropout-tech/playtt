# 有界自動草稿維護候選

2026-11-19 01:51：本機與私人 audit 維護驗證通過，最新私人版本 `34b6db29-d13d-4263-911b-5767bdf23b72`。正式 playtt.tw 保留 Pages 與原品牌視覺，私人發布器維持 paused；沒有啟用 cron 或付費。

## 行為

新增 `POST /?phase=operator-auto-draft-maintenance`，沿用網站專屬 operator Bearer 驗證，只接受不超過 256 bytes 的 JSON `{"action":"preview"}` 或 `{"action":"run"}`。拒絕自訂 ID、日期、年齡及其他 hook。接收端先驗證並收完輸入，再傳入既有執行 DO 佇列；runtime 仍再次驗證。初版直接轉送請求串流曾在不合法輸入測試出現 500，原始失敗摘要保留，不能解讀成所有歷史中斷根因皆已確認。

清理只依固定核心的 `post_status = auto-draft` 與 `post_date` 超過七天規則，最多選取 20 筆，按 ID 排序。以短暫 query filter 將原生 `wp_delete_auto_drafts()` 的固定選取限制在該批；核心再核對狀態／日期並執行正常刪除 hooks。函式回傳後核對攔截次數和刪除結果；核心或外掛改版需重新驗證固定查詢，不承諾任意外掛相容。[WordPress 官方函式](https://developer.wordpress.org/reference/functions/wp_delete_auto_drafts/)

維護沿用 canonical lease、R2 完整快照與提交協定，失敗則丟棄未提交 runtime。沒有已初始化資料時回 409，不藉維護初始化網站。拒絕的請求不預先喚醒發布器；成功提交若產生發布工作，既有 paused 狀態仍有效。

`preview` 不刪除任何草稿，但沿用提交流程，可能將暖執行器先前由 GET 建立、尚未保存的資料一併保存；它不是完全唯讀 API。普通草稿即使很舊也不屬清理對象。並未開放通用 cron、排程或任意 PHP 執行。

## 本機實測

- 8 項輸入／輸出邊界測試與 TypeScript 通過，含串流超限取消、破損輸入、只接受固定 action，以及刪除 ID 不得超出批次。
- 過期原生 auto-draft 226 被移除；近期 auto-draft、舊普通草稿、舊已發布頁面完整保留。重啟後新草稿 ID 227，舊 ID 寫入回 404，新草稿不變。所有自有測試資料清理完成，原已發布頁面雜湊相同。
- 21 份原生 auto-draft 228–248：預覽只選 20 筆；兩次同時 run 由 DO 依序提交版本 332、333，刪除數為 20、1，沒有重複或越界。備份 fence 使 run 回 409，canonical 指標不變；21 筆皆確認 404，再跑空批次成功。
- 本機專用故障入口令 canonical manifest 的 R2 put 拋錯，run 回 500 並含精確故障標記，canonical 指標不變。切回正常入口並冷啟動後，auto-draft 249 的身份、日期及內容仍一致；重試才成功刪除，原已發布頁面不變。這是單一 manifest 寫入失敗，不代表所有斷線、儲存故障或外部 hook 副作用均已驗證。

證據在 `docs/verification/cloudflare-maintenance-*`；私人憑證、原始備份與 owned 指標不提交。

## 重現

依既有候選順序套用至 `id-sequence/id-sequence-candidate.patch`，再套用 `maintenance-candidate.patch`；五個來源檔的雜湊及套用證據見 reproduction JSON。將本目錄 mjs 放入 runtime/scripts，測試 ts 放入 runtime/tests，故障 jsonc 放到 runtime 根目錄。保持固定依賴，不更新共用 node_modules。

1. `node node_modules/tsx/dist/cli.mjs --test tests/playtt-maintenance.test.ts`，再 `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`。
2. 正常本機入口用既有 `wrangler.playtt-cms-fresh-local.jsonc`、9429、相同 persist-to。發布器必須已 paused。`playtt-maintenance-local.mjs --local --mode=prepare`，停止並重啟同狀態後 `--mode=verify`。
3. `playtt-maintenance-batch-local.mjs --local` 驗證上限、並行清理與 fence。只有起始預覽為零筆到期資料才建立自有 fixture；中途失敗先核對 owned 指標，不可直接重跑 prepare。
4. `playtt-maintenance-failure-local.mjs --local --mode=prepare`，停止正常入口，再以 **同名本機 Worker／同 persist-to** 啟動 `wrangler.playtt-maintenance-fault-local.jsonc`，執行 `--mode=fail`。停止故障入口，改回正常設定重啟，再 `--mode=verify`。不得部署故障入口；它另以固定本機 origin 與本機 token 拒絕其他環境。

各資料指標在 artifacts 的 `*-owned-private.json`。清理前必須逐筆核對，遠端不能用本機腳本。並行清理的通過不等於編輯與清理混合併發已驗收。

## 私人遠端驗證與備份

`playtt-maintenance-remote-preflight.mjs --remote`先核對paused、無fence、無正式route/cron及現行指標與既有完整備份一致。部署正常入口後執行`playtt-maintenance-remote.mjs --remote --mode=prepare`；只有初始過期集合為零才建立四份自有資料。遠端拒絕/保留/清理通過，重新部署完全相同來源，再`--mode=verify`核對重建、舊ID404及身份核對後清理。

清理115，重建後新ID116；原頁面雜湊相同，發布器paused。遠端沒有注入故障或21筆批次；那些證據是本機測試。固定遠端腳本只允許私人audit網址及restore-v1，憑證由本機秘密檔讀入，不可改成正式網域。early拒絕回應可能在外層返回，只有非400/401/405回應要求partition標頭；有效維護回應仍核對分區。

使用既有`scripts/playtt-snapshot-audit-backup.mjs --remote`取得一致性備份，再`playtt-maintenance-backup-check.mjs --offline`完整解碼／雜湊與序列核對。最新revision `0f007ee5-099a-4ba1-955c-7940bbc4e5fb`、296索引、壓縮SHA256 `5a3b599ce5a05c90be14d10d9a4c05e7280d22f9d0e4cbe1dc1c76410272227a`，wp_posts高水位116。離線Markdown/JSON盤點確認原有auto-draft93保留；沒有新建第三個環境完整還原本次備份。

有限Worker觀測239事件皆ok，無例外或未完成trace；最大WASM配置73,990,144bytes。不是獨立請求數、isolate總記憶體或長期穩定性保證。另一次R2下載在Wrangler介面回503「Loopback unavailable」，當次備份未完成；確認fence已釋放後重試成功，故不能把Worker的ok觀測當成整個備份流程從未失敗。來源層級尚不確定。備份、序列、盤點、下載失敗及觀測摘要皆在`docs/verification/cloudflare-maintenance-*`。

## 尚待

混合編輯與清理的併發驗證，以及操作交付。排程尚未實作／啟用，仍須另驗證免費限制與故障恢復。正式後台切換依使用者決定維持暫緩，整體目標 active。
