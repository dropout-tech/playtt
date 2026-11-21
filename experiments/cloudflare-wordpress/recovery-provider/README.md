# 私人 Cloudflare 完整復原採用：177 → 178

2026-11-22（台北），已在既有私人 `playtt-wp-free-session-audit` 完成實際 HTTP 復原採用、獨立備份及封存；正式 Pages／原站視覺維持現況。這輪不是模型，也沒有測試 native PHP 編輯流程或部署舊碼。完整目標仍 active，PR4 draft。

## 實際結果

| 項目 | 結果 |
|---|---|
| 來源 | 177／84fea105-9e00-41ad-abba-23ba958cc215，compressed content/envelope |
| 目標 | 178／b331752f-d210-4b7c-9c98-2424d97e9ebe，plain content-v1 |
| 受限窗口 | 600秒／432,931 bytes／7 operations |
| 實際計帳 | 432,931 bytes／7 puts；整段含獨立備份與封存70,992ms |
| 額度 | 總額度150,000,000不變；餘1,083,839 → 650,908 |
| 備份 pins | 原14個逐項保留，新目標第15個 |
| 獨立備份 | API重新下載8個相依物件／2,802,244 bytes，再獨立匯入303物件／298檔，所有原內容、媒體、主題精確一致 |
| 最終狀態 | closed／sealed／pending0，fence解除，publisher paused |

前置驗證於2026-11-21 16:12:56.813Z讀回原177／pin14／餘1,083,839／af985705，manifest物理SHA與已驗證獨立備份一致。先核對82個來源SHA、固定account／worker／bucket、總額度／無正式routes／無cron，再通過Wrangler dry-run。沒有重新執行前輪95項測試，runtime82來源與20設定均未改；它們是來源一致的前輪證據。

部署候選至既有私人Worker，僅暫開PLAYTT_RECOVERY_UPLOADS=v1，版本 `c7c46433-a876-4cd1-900f-a5dd532dda56`。讀回所有binding及版本精確、原狀態仍177後，先等live tail看到相同版本的operator事件才開窗口。持有fence，以固定plan／operation registry走實際HTTP，驗證缺少物件、pin、相依資料、採用、pointer CAS與兩邊版本；每個journal階段核對觀測程序仍活著。

採用後先關窗／封存，再從Cloudflare API另行下載並獨立匯入，不用上傳前的本機內容冒充遠端備份。原14pins與新目標核對後解除fence。最後重新部署同一相容reader、關閉臨時復原旗標；最後版本為 `8c615f36-9771-4798-834e-df40df63fdf9`。

**16:22:24.269Z 最終GET驗證**：coordinator178、其commit receipt及直接API讀取的R2 current.json三者完全相同；pin15、原14pins保留、餘650,908、closed／sealed／pending0、fence不活動、publisher paused。所有optional writer／heartbeat／readback／recovery旗標皆關，復原端點回404。沒有用coherent=true代替獨立R2 pointer核對。

## 費用與觀測的範圍

登入info@dropout.tw的管理頁確認Workers當前方案Free／$0；起始每日requests顯示1,337／100,000。R2本期October25–November25於測試前顯示$0.00／2.33GB／ClassA7.27k／ClassB60.06k，完成後重新整理仍$0.00／2.33GB，ClassA7.28k／ClassB60.25k。帳單可能延遲，這不是長期免費或所有用量都已完整量測。Durable Objects詳細用量尚未刷新；R2 payload帳本不是帳單。

觀測程序實際結束，164個事件outcome皆ok、沒有捕捉到exception；狀態碼200共160、404共4。404保留在證據，與程序先查詢缺少物件的步驟相符，但tail只保留封閉分類，沒有完整URL，不能逐一指認。沒有故意注入provider故障；也沒有因此宣稱whole-isolate記憶體／CPU或PHP初始化已驗收。

第一個唯讀預檢遇到過期OAuth：settings回401，舊Promise.all提前結束讓Windows Node在未完成的fetch中退出。透過Wrangler正常更新既有登入後，確認info@dropout.tw；未加scope、未建立新token。預檢改為等待全部請求settle，再用新log重新執行成功；原401／Node斷言log保留。沒有把失敗預檢描述為成功。

無付款、總額度變更、退款、pending強制清除、歷史／pin刪除或正式後台切換。兩次部署都只限這個已授權私人Worker。既有公用Pages的視覺、CMS入口與正式路由未變。

## 交付與接續

三個工具：preflight --remote只讀固定原177；provider check離線核對、run --remote --version=…執行一次已審閱採用；final --remote --version=…只讀關閉旗標後的最後178。附82來源的source-plan。所有已完成guard／owner必須保留，**現在已是178，不能重跑177工具**。

最新owner：`artifacts/playtt-recovery-provider-owned-private.json`，phase verified-closed-sealed，記錄anchor178、private備份目錄、新windowToken及原drainToken。source177與其14pins、早期失敗／本機模型都保留。遠端沒有pending1；先前pending1只存在停止的本機故障副本。

接續recovery-adoption組裝，install-local-tools.py --runtime <新目錄> --apply先核對88項SHA，再加3scripts＋source-plan；82來源／20設定不變。重套在改檔前拒絕，仍是增量重建，非重新下載全部上游依賴。已有controller/transport的95測試沿用，這輪驗證重點是實際provider流程。

下一步以178／pin15／餘650,908為新起點，準備實際舊67dd308相容部署與受限原生登入／保存／重啟重讀／登出。舊碼本機完整流程曾用588,515 bytes，約有62,393餘量；不是雲端保證。需核對精確舊來源、生成loader與依賴，不直接把僅限localhost的舊測試bundle拿去部署；保留當前相容reader回退能力。不得沿用舊177起點或重開已完成window。

後台延遲、繁中初始化、整體isolate／CPU、長期Free、實機／IME與A01–A20仍未完成。正式官網維持現況。

證據：[前檢](../../../docs/verification/cloudflare-recovery-provider-preflight-result.json)、[實測](../../../docs/verification/cloudflare-recovery-provider-result.json)、[最後讀回](../../../docs/verification/cloudflare-recovery-provider-final.json)、[觀測摘要](../../../docs/verification/cloudflare-recovery-provider-observation-summary.json)、[觀測事件](../../../docs/verification/cloudflare-recovery-provider-observation.jsonl)、[費用觀察](../../../docs/verification/cloudflare-recovery-provider-free-after.json)、[重建](../../../docs/verification/cloudflare-recovery-provider-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-recovery-provider-review.json)。
