# 私人 Cloudflare：壓縮清單完整原生流程

最新[舊來源本機回退驗證](../old-source-rollback/README.md)已完成原生保存／重啟／登出及再升版，保留工具偏好差異與容量限制；正式站不變。以下是前階段歷史。

2026-11-21，在 info@dropout.tw 的既有 `playtt-wp-free-session-audit`／`playtt-wordpress-session-audit` 完成一次原生繁中登入、模式切換、兩次自動儲存、單次手動保存、重新部署後九段正文重讀與原生登出。正式 Pages 與現有視覺維持現況，沒有切換後台或啟用付費方案。這是私人驗證進展，完整目標仍 active。

## 實際結果

- 原 canonical161 → 保存檢查點175 → 重新部署後176 → 最終177；保存修訂207精確，其他頁面／既有修訂／媒體／主題不變。此輪新session已移除、原有5個session逐位元相同；偏好僅原生_modified改變，序列保持單調。
- 同一600秒／1,881,041bytes／96操作窗口，至封存353,048ms（含agent操作及部署等待），使用797,202bytes／48puts，餘1,083,839bytes。closed／sealed／pending0，fence解除，publisher paused。不是Cloudflare整體免費額度，也沒有加上限、退款或刪歷史。
- 新備份304物件／298檔，4個GET共2,419,124bytes。獨立目錄及轉完整格式後再次開啟逐檔一致；保留舊13個pin，新增第14個。實體清單23,495bytes，SHA見摘要；沒有以邏輯JSON的SHA冒充實體物件信任錨。
- 310個安全化tail事件，39個PHP執行事件；沒有捕捉到exception／記憶體或CPU限制錯誤。最大觀測PHP heap75,497,472bytes不是whole-isolate記憶體，也不是長期Free或CPU耗時驗收。

## 保留的異常與限制

原生登出302之後，一筆PHP AJAX400（外層也記一筆）及3個canceled tail事件；另有重新部署期間外層front-page404。全部原始安全化事件保留，沒有宣稱零HTTP錯誤。最終資料、原有session、pending0及帳本不再增加已核對；但tail未取得AJAX action，不能把本機wp-remove-post-lock重現當成這次action已證實。取消事件的發起者亦未證實。DO序列佇列的log可能附在相鄰事件，不能直接把trace附件解讀為該HTTP請求精確耗時。

`cold-begin` controller已完成時，client剛好讀到未寫完的reply而JSON解析失敗。檢查同一command的成功結果、held fence/drain與原pointer後繼續，沒有重送。client已改為暫存檔rename發布command，並僅在等待原ID時容忍部分reply；2個實際子程序測試確認partial／stale reply與既有command不會造成誤完成或覆寫。5個observer測試另於部署前通過。runtime81來源與20設定不變，前輪108測試及tsc沒有重跑。

第一次只讀preflight的OAuth過期回401；其並行其他讀取完成數未知，過程沒有寫入。用既有Wrangler授權刷新後，新的7個GET核對成功。不要宣稱本輪只有7個Cloudflare請求；其後有原生流量、觀測、3次私人部署、窗口操作、備份與pin。尚待舊來源實際回退、全isolate／CPU／原生延遲、長期免費用量與實機／IME驗收。

## 最終雲端狀態及操作

來源仍為 `b5eec65`。三次私人部署依序：啟用 `08b91921-060d-4358-89e3-08884f9ca2f4`、冷重啟 `71bcd451-db1b-442e-b944-f18b0af49109`、關閉可選writer／heartbeat旗標 `af985705-1cb2-403e-962e-5af3e29ff5ff`。最後14:24:49Z只讀核對canonical177、revision `84fea105-9e00-41ad-abba-23ba958cc215`、pin14、餘1,083,839bytes、關窗封存／pending0／publisher paused。停旗標仍保留相容reader；**不能直接回退不認新格式的67dd308舊來源**。

帳號可見控制台確認Workers Free／$0；R2 October25–November25顯示2.33GB、ClassA7.22k、ClassB59.86k、billable$0.00，是可能延遲的當時帳號總量。Cloudflare官方[Workers限制](https://developers.cloudflare.com/workers/platform/limits/)與[SQLite DO Free用量](https://developers.cloudflare.com/durable-objects/platform/pricing/)不能替代本帳號實測；PHP在SQLite DO內，不把外層Worker的10ms直接當PHP CPU量測。沒有購買、改費率或開新服務。

完成的owner為 `artifacts/playtt-envelope-provider-ui-owned-private.json`（closed-sealed）與 `artifacts/playtt-envelope-provider-backup-owned-private.json`（verified177）；不重跑、不刪guard、不用本機178／166當雲端起點。備份owner.directory包含export／independent／materialized。Controller、tail及自有分頁均已結束。資料與憑證只在私人workspace，不放入PR。

接續manifest-workflow，在新組裝目錄使用 `python envelope-provider/install-local-tools.py --runtime <runtime-cloudflare> --apply`。先核對85項前置SHA，再新增8個工具、2個測試及來源計畫；安裝器不連網或部署，重複套用在改檔前拒絕。預檢、部署核對、UI窗口、備份與pin工具都固定既有私人專案且要求--remote及owner檢查，已完成的實際owner不可重新執行。`playtt-envelope-provider-final.mjs --offline`可重新核對已完成備份與事件。先前未使用的scheduled helper差異繼續記錄，未更動或執行。

下一步先用本輪已保存事件及本機副本定位取消／400，並驗證轉完整包後舊來源實際冷啟動。沒有證據支持前，不追加同樣的雲端重跑、提高帳本上限或切換正式站。

證據：[摘要](../../../docs/verification/cloudflare-envelope-provider-summary.json)、[事件](../../../docs/verification/cloudflare-envelope-provider-observation.jsonl)、[備份](../../../docs/verification/cloudflare-envelope-provider-backup.json)、[最終部署](../../../docs/verification/cloudflare-envelope-provider-deployment-disabled.json)、[用量](../../../docs/verification/cloudflare-envelope-provider-billing.json)。
