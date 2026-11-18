# 有界自動草稿維護候選

2026-11-19：本機完整 WordPress 驗證通過，尚未部署這份維護入口到遠端。正式 playtt.tw 保留 Pages 與原品牌視覺，私人發布器維持 paused；沒有啟用 cron 或付費。

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

## 尚待

私人 audit Worker 的有界遠端驗證、清理後備份／序列核對，以及操作交付。排程尚未實作／啟用，仍須另驗證免費限制與故障恢復。正式後台切換依使用者決定維持暫緩，整體目標 active。
