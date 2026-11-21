# 有界原生瀏覽器流程：容量不足的本機證據

由獨立驗證的備份 161 啟動本機 WordPress，採用 d754dacd 的實際心跳 runtime 選項，沒有再注入 PHP 政策。Chrome 經私人 gate、原生繁中登入及編輯器，測試偏好切換、原生 autosave、一次手動儲存。真正外層 Worker、SQLite coordinator、容量計帳、寫入追蹤與限時窗口均啟用；發布器保持 paused。

**結果：手動儲存收到 503 容量保護，完整儲存／重開／登出流程未通過。** 本機窗口設為 600 秒／1,881,041 bytes／96 操作，bytes 等於最後一次雲端確認的剩餘量。未提高雲端 150,000,000 bytes 上限，也沒有退款、刪歷史或 pins。約 253 秒後結束，實用 1,860,844 bytes／49 puts，餘 20,197 bytes；closed、sealed、pending0。此本機全域帳本的基準與雲端不同，不能當成雲端帳本讀值。

## 內容與原生行為

原生設定是字串 30，五個穩定心跳間隔為 30013、30014、30005、30011、30013 ms。兩次原生 autosave 成功；手動儲存按一次後失敗，稍後第三次 autosave 也 503。畫面保留新段落並提示暫停儲存，沒有重送手動儲存。沒有進行冷重開或登出，不能列為通過。

本機 canonical 161→175 的 14 次提交完整連續。離線逐項比對確認：原頁面 bytes 完全不變；autosave206 含完整新正文；未出現失敗手動儲存的修訂207；既有修訂、其他內容、媒體與主題精確保留。postmeta 僅編輯鎖72與autosave206的footnotes76；偏好最後只變更 _modified 時間；ID計數單調。原先5個有效session精確保留，本次新session仍在這個已停止的私人本機副本中，未聲稱登出完成。現有雲端資料未受影響。

第二次 autosave（版本173）只變更206的四個日期欄位，正文不變，仍重寫322,462 bytes整張posts表與73,740 bytes清單，合計396,202 bytes。延長心跳不能解決這個來源，不應再次用相同方案消耗provider剩餘額度。

## 無損壓縮的離線樣本

Node gzip level6：posts表322,462→19,405 bytes；postmeta14,897→1,194；usermeta19,451→4,254；計數檔196→139。四份解壓bytes逐項精確。這只是停止後的四檔樣本，**沒有接入runtime或新儲存格式，也不是完整流程節省、CPU或記憶體驗收**。下一步可研究有界無損儲存，保留原始時間、鎖、session、修訂、單調ID與完整清單；須先驗證相容讀取、備份／還原及舊格式回退，再量測完整瀏覽器流程。

## 模擬器差異與保留失敗

本機最初受loopback權限阻擋。後續容量初始化拒絕模擬器資料：所固定Miniflare的R2序列化程式省略storageClass，workerd實際回傳空字串。工具在測試用StorageBudget子類別中，僅將已觀察的空字串補為Standard，其他未知值仍拒絕；正式runtime驗證器、計帳與窗口程式未改。初始化掃描307物件／101,079,607 bytes。診斷清單與收據物件由測試工具另存，不包含於正式容量計帳。

第一次以undefined補值仍拒絕，加入欄位觀察後才確認是空字串，所有失敗日誌與暫存副本保留。控制程式曾讀到回覆寫到一半的JSON，之後讀回同一命令結果，沒有重送；交付控制程式會等待完整JSON。離線驗證第一次未允許原生偏好時間更新而拒絕，修正為只接受_modified變更，其他偏好仍精確比較。已完成工具不得刪owner重跑。全部本機程序與自有分頁已結束，外連0。

## 重建與操作

先完成editor-heartbeat階段與先前background-write工具，再執行：

```powershell
python heartbeat-budget/install-local-tools.py --runtime <runtime-cloudflare> --apply
```

安裝前驗證六個prerequisite與三個新工具的完整雜湊，任何目標已存在即拒絕，無網路／部署。playtt-heartbeat-budget-ui.mjs --local 在127.0.0.1:9459啟動新副本，需既有私人verified161備份與帳號；本輪owner已完成，不能再執行。控制器支援status／diagnostic／before／saved／cold／restart／finish；saved必須有成功且精確的原生收據，因此本次失敗流程沒有該標記。離線驗證為playtt-heartbeat-budget-final.mjs --offline。

證據：[總結](../../../docs/verification/cloudflare-heartbeat-budget-summary.json)、[逐次變更](../../../docs/verification/cloudflare-heartbeat-budget-history.json)、[瀏覽器結果](../../../docs/verification/cloudflare-heartbeat-budget-native.json)。

本輪零Cloudflare請求、零部署、未付費。最後雲端讀值仍是2026-11-21 06:28:14Z的161／pin13／餘1,881,041bytes，closed/sealed、pending0、publisher paused，未刷新。後續雲端owner仍接markdown-provider-cold-ui與verified markdown-provider-cold-backup，並非本機175。正式Pages／目前視覺不變，PR4維持draft，完整A01–A20目標active。
