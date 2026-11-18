# 每日自動草稿維護候選

## 每日維護與來源重建驗證（2026-11-19）

私人 audit 版本 `53980fce-97d4-47b9-bc56-6c3b065027cc` 的每日排程已真正觸發：台灣02:35／UTC18:35，cron `35 18 * * *`，處理一份本輪自有過期 auto-draft 124，清理1、剩餘0、跳過0，canonical version 167。以 Cloudflare scheduled 事件及成功提交紀錄為證，再以 WordPress 登入讀回確認404；新草稿125高於舊ID，舊ID寫入404，新內容不變，自有資料已清理，原已發布頁面雜湊一致。發布器仍paused，正式官網維持Pages與原品牌視覺，未切換後台。

遠端混合編輯與清理也通過：普通草稿存檔及另一過期草稿清理可並行提交；同一過期auto-draft的兩輪測試分別觀察到先升為draft而保留、先清理而後續存檔404。相同程式重新部署後內容與刪除狀態保持，新ID123，所有自有fixture清理完畢。派送順序不保證提交順序。

清理後R2備份 `359644be-2af8-491c-b178-86c2a98f8f4e` 完整解碼及SHA256校驗通過，296個索引、2285530壓縮bytes，8表序列，wp_posts高水位125。完整Markdown/JSON盤點只剩原有auto-draft93，metadata與先前一致。這輪驗證備份內容與重建，不是另一次全空遠端還原。最後狀態一致、fence已解除、publisher paused。

有限觀測234事件，outcomes={'ok': 233, 'canceled': 1}，無記錄到的例外／未完成trace／request failure；最大觀測WASM 74,842,112 bytes，不等於isolate總用量或長期穩定保證。只驗證一個真實daily事件，不宣稱多日排程可靠性。

從固定上游全新提取後，12段採用patch可依序組裝，57個來源與候選相同，TypeScript與dry-run通過。修正CRLF/LF交接問題，補上重建工具及維運CLI；本輪沿用既有固定依賴及核心manifest，未重新npm安裝或從零初始化。Cloudflare畫面再確認Workers Free/$0、R2當期$0.00，帳號總量約1GB；讀值有延遲，不是長期費用保證。

日常維護見 `experiments/cloudflare-wordpress/scheduled-maintenance/OPERATIONS.md`，重建見 `experiments/cloudflare-wordpress/REBUILD.md`。原生操作延遲、從零安裝交接與長期用量仍需收斂；PR #4保持draft，整體目標active。下方為歷史紀錄，當時的「未啟用cron」不代表目前狀態。

2026-11-19：本機、私人遠端混合編輯重建及一個真正每日觸發已驗證；未聲稱正式後台完成。正式官網仍為 Pages 與原品牌視覺，publisher 保持 paused。

## 行為與免費界線

`PLAYTT_MAINTENANCE_CRON` 未設定即關閉，只接受一個固定每日 UTC 表達式。私人 audit 候選設定為 `35 18 * * *`，台灣每日 02:35；不改其他 Worker 或正式網域。舊 cron 在設定傳播期間若仍送達，因不符合現值而忽略。

`scheduled()` 只產生一個固定 run 請求，使用該站 operator 憑證，經既有 binding 送進同一個 WordPress 執行 DO；PHP 不在排程 caller 啟動。清理與編輯共用序列佇列、lease、R2 快照提交及最多20筆規則，沒有一般 WP-Cron 派發或程式內重試／清空 backlog 迴圈。平台可能重送事件，仍走同一套狀態與鎖檢查。備份 fence 或寫入錯誤使排程 invocation 失敗，不能記成成功清理。

成功須取得有效維護結果及 canonical commit receipt；數字化記錄包含排程時間、清理／剩餘／跳過數和版本，不包含內容、憑證或文章 ID。preview 的提交行為與七天判定沿用 maintenance/README.md。

2026-11-19 查閱官方限制：Workers Free 有5個帳號級cron、Cron CPU 10ms、每次最長15分鐘；等待DO不計CPU，故重工作留在原執行DO。這不等於已證明長期不超額。[免費限制](https://developers.cloudflare.com/workers/platform/limits/)

Cron以UTC執行，設定傳播最多可能15分鐘；設定成功不等於已執行，須等待真正事件。Wrangler管理的trigger由設定檔維護。[Cron文件](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

## 已驗證

- 七項排程邊界測試與TypeScript：預設關閉、每日格式、忽略舊trigger、明確單一網站、網站專屬token、一次派發、鎖／錯誤／無效結果不得報成功。
- 完整本機WordPress混合編輯：獨立草稿編輯與清理同時成功；兩次auto-draft轉draft皆先於清理提交，因此保留。派送順序不代表提交順序。冷重建後保留內容一致，刪除ID回404，新ID257高於先前所有fixture；自有資料已清理。
- 實際本機scheduled入口：關閉時指標不變、錯誤cron忽略、備份fence回失敗且不提交；解除fence後清理自有auto-draft258，空批次可再跑。冷重建後新ID259，舊ID寫入404，原頁面雜湊一致，publisher paused。故意的fence失敗記為exception，不能宣稱本機全部事件ok。

## 重現

先套用maintenance候選，再套本目錄patch，三個檔案雜湊見reproduction JSON。mjs放runtime/scripts，測試ts放runtime/tests，local jsonc放runtime根目錄。固定現有依賴，不升級共用node_modules。

1. `node node_modules/tsx/dist/cli.mjs --test tests/playtt-maintenance-schedule.test.ts`，再 `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`。
2. 原正常本機設定9429／相同persist-to、publisher paused：`playtt-maintenance-mixed.mjs --local --mode=prepare`，停止重啟後`--mode=verify`。
3. 正常本機設定未開排程：`playtt-scheduled-local.mjs --local --mode=prepare`。停止，使用`wrangler.playtt-scheduled-local.jsonc`與相同persist-to重啟，再`--mode=fire`。停止，改回正常設定重啟，`--mode=verify`。local scheduled是明確單次測試，不會自動按時執行。
4. 混合腳本的`--remote`固定私人audit origin／restore-v1；不要修改成正式站。每輪先核對無不相關過期auto-draft，所有fixture寫入private owned指標；中途失敗先核對指標，不能盲目重跑prepare。

## 尚待

一個真實daily事件、遠端混合重建及清理後新備份已通過。詳見最新驗收與[操作手冊](OPERATIONS.md)。長期用量、原生操作延遲與完整交接仍待。停用時應同時移除`PLAYTT_MAINTENANCE_CRON`及將`triggers.crons`設為空陣列後部署私人audit；未設定env的程式即使收到舊trigger也不工作。正式後台切換仍暫緩。
