# 原生編輯器心跳選項

第 13 個選用階段，預設停用。將前輪已通過原生 UI 的相同 PHP 政策接入 runtime：只有 `PLAYTT_EDITOR_HEARTBEAT=native-30s-v1` 才載入，在後台 `post.php`／`post-new.php` 設定 `minimalInterval` 至少 30 秒，保留更高的既有值及其他設定。沒有替換核心 JavaScript、鎖到期規則、nonce refresh、autosave、手動保存或寫入窗口。

20 份交付設定均未加入新旗標，尚未部署，正式 Pages 與目前視覺不變。本輪沒有 Cloudflare 請求。

## 快取切換與資料保存

政策由 canonical boot 與初始建站路徑傳遞到 runtime 自有的 canonical adapter。後者只有接線檢查，沒有另建一個新站驗收。

當同一個暖 PHP runtime 收到不同心跳選項，僅重寫這個下一次 PHP 請求會載入的政策檔，保留 runtime 和原生資料。不能為了換選項就丟棄快取：新增頁面 GET 可能已回傳新草稿 ID，而該資料尚未提交。回歸測試與真實 WordPress 流程均確認新草稿 206 在切換後仍可編輯及讀回。這個 runtime 自有檔案不納入 canonical wp-content；格式、ID 計數及快照提交協定不變。

## 驗證

- **9 項完整 pinned Heartbeat 核心測試**：一般／fast 排程、字串型別設定、較高既有下限、背景 120 秒與回到前景、nonce／鎖回呼、伺服器要求 fast、連線失敗／恢復、立即連線、pagehide／bfcache。DOM、jQuery、時間與傳輸為模擬，核心原碼完整執行且雜湊核對；不是實際 OS 節流或真實斷網驗收。
- **19 項讀回／快取回歸**：包含實際 getRuntime 函式的旗標切換防丟稿。首次既有測試未帶新增旗標常數而失敗，補齊依賴與新增回歸後全部通過。合計為 28 個不同 JS 檢查。
- **24 個真實 PHP hook fixture**：啟用／停用、既有與新增編輯頁、前台及其他後台頁、較高下限、nonce／suspension／其他資料保存。這部分模擬 WordPress hook 註冊介面，實際 PHP 執行候選與生成 adapter。
- **真實本機 WordPress HTTP**：由 verified backup161 複製啟動，預設停用／未知值停用、既有及新增編輯頁啟用、個人資料頁不變、同 PHP 切換保留新草稿與原有正文、登出通過。另一份獨立副本從第一個請求就啟用，冷啟動編輯頁、正文與登出通過。使用真實 PHP／WordPress／SQLite coordinator／模擬 R2，直接 runtime entry 不含外層私人 gate／budget，也不是本輪新的瀏覽器操作驗收。
- **建置與重建**：TypeScript、Wrangler dry-run 通過。從固定上游重新組裝 25 個已採用階段及 13 個選用階段，加入前輪 9 個診斷工具後為 78 來源／142 輔助檔，20 設定完全一致。重複套用在改檔前拒絕。dry-run 的 upload/gzip 大小不代表 provider 執行記憶體。

原生整合工具第一輪誤以為區塊編輯器有 classic 的 hidden post_ID；第二輪已通過精確讀回，但未辨識單引號與 `&#038;` 的登出連結。修正解析後第三個獨立副本完成，所有失敗紀錄與 owner 都保留，程序均已結束。未刪 guard、未操作雲端。既有 broad suite 的 29/32 歷史結果未重跑，兩個 baseline regex 及缺 PHP CLI 限制不變，沒有全套皆綠的聲稱。

## 30 秒設定的實際限制

原生 `connectNow()` 會立即連線，連線進行中呼叫也能安排完成後立即再送。這是保留的核心行為，**30 秒不是硬性限流或整個流程的容量保證**。背景分頁原有 120 秒排程也保留；實際裝置休眠可能更久，不能保證永久持鎖。

一般背景鎖定／nonce 通知會比原本約 10 秒慢。前輪原生 UI 已驗證雙帳號接管，本輪原碼相同且回呼／錯誤路徑通過；實體裝置與更完整斷線情境仍待。政策未降低單次快照大小，也未清除歷史、工作階段、autosave 或修訂。

## 套用及操作

先完成 `markdown-write`。若需要 `background-write` 診斷工具，**先安裝那些工具，再套本階段**，因其 prerequisite 鎖定舊 worker。

```powershell
python editor-heartbeat/apply-local-candidate.py --runtime <runtime-cloudflare> --apply
```

兩個修改檔與三個新增檔均核對 before／after 雜湊；所有 patch 先在暫存目錄驗證，再寫入目標。此命令不部署、不存取憑證、不變更設定。

測試使用既有專案 Node 與 tsx。單元檢查為 `tests/playtt-editor-heartbeat.test.mjs`、`tests/playtt-editor-readback.test.mjs`、`tests/playtt-runtime-manifest-cache.test.ts`。`scripts/playtt-heartbeat-policy-local.mjs --local` 使用 127.0.0.1:9458，從私人 verified161 備份建立本機副本並阻擋所有外連；`--cold-enabled` 是獨立冷啟動情境。前兩次失敗與第三次結果用獨立 owner 保存，不能刪除或覆寫它們重跑。完整私人備份、HTML、cookies、owner 不在 Git。

證據：[總結](../../../docs/verification/cloudflare-editor-heartbeat-summary.json)、[原生整合](../../../docs/verification/cloudflare-editor-heartbeat-native.json)、[獨立冷啟動](../../../docs/verification/cloudflare-editor-heartbeat-cold.json)、[重建](../../../docs/verification/cloudflare-editor-heartbeat-rebuild.json)。

下一步在本機評估完整瀏覽器流程的嘗試寫入量與必要收尾餘額，包含立即心跳、偏好、autosave、重開及登出；不能只按 30 秒估算。確認能容納後才安排既有私人 provider 的一次有界驗證。最後雲端讀值仍是 2026-11-21 06:28:14Z：161／pin13／餘1881041 bytes、closed/sealed、pending0、publisher paused。本輪未刷新；最新 owner 仍是 markdown-provider-cold-ui 與 verified markdown-provider-cold-backup，不是本機 206 草稿。不得提高 cap、退款或刪歷史／pins。整個 isolate 記憶體、長期免費、混合版本復原、實機／IME 及完整 A01–A20 尚未完成，PR4 保持 draft，目標 active。
