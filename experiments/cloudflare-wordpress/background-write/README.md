# 背景寫入來源與原生心跳頻率：本機驗證

後續已將相同 PHP 政策接成 [預設停用的 runtime 選項](../editor-heartbeat/README.md)，仍未部署。以下為前輪本機 UI 證據；要安裝本診斷工具，須在套用 editor-heartbeat 階段之前執行。

本輪從已獨立驗證的私人備份 161 啟動本機 Miniflare，找出背景快照的實際資料變化。正式 Pages、目前視覺、私人部署、77 個 runtime 來源與 20 份設定均未修改；沒有 Cloudflare 請求。這是診斷工具包，不是新的部署階段。

## 實測結果

基準流程只登入、開啟既有草稿 193、停留與登出，沒有編輯或儲存。版本由 161 到 171：五次連續心跳僅修改 postmeta 72 的 `_edit_lock`，每次寫入 14775 bytes 資料表及 73740 bytes manifest。四個穩定間隔為 10009、9999、10020、9987 ms。另有兩次只寫 196 bytes 的 ID 計數檔，增加 `wp_options` 計數，但沒有選項資料列變化；其 SQL 來源尚未定位，未略過計數保存。不能把本機檔名直接套用到前輪每個 provider 事件。

候選使用核心既有 `heartbeat_settings` hook，在 `post.php`／`post-new.php` 設定 `minimalInterval` 至少 30 秒，保留其他設定、原生鎖、nonce refresh、autosave 與手動保存路徑。若已有更大的下限則保留。實作只透過 esbuild onLoad 注入本機 bundle，未修改 runtime 來源或部署設定。背景鎖定／nonce 通知相對原本 10 秒會較慢，不能把這當作完全沒有行為取捨。

Chrome 繁中原生編輯器新增第九段、按一次儲存，版本 168；完整停止並重啟 workerd 後，九段文字和程式碼逐字一致。另一個 in-app browser 以 admin 登入後收到編輯鎖提示；接管後，原 Chrome 編輯者收到已被接管的原生保護對話框。兩個帳號均原生登出，最終本機 187。

分開計算未跨重啟／接管的持鎖期間，五個穩定間隔為 30010、30003、30027、30005、30001 ms。初始化與另一個瀏覽器的無變化心跳另記於完整紀錄。這不是等長、等操作量的完整流程容量／延遲／CPU／記憶體比較，沒有宣稱整體用量降低固定比例。

完整離線比對通過：手動修訂 206 與接管觸發的 autosave 207 都包含精確內容；207 的 footnotes 76 保留。頁面自手動保存後 bytes 未再改變，其他原始頁面、修訂、資料列、媒體、主題一致。ID 計數單調增加。admin 原有 60 個 session 中 28 個已過期，被核心登入流程清除，其他 32 個逐項精確保留；使用者 2 的 5 個既有 session 全部保留，本輪兩個 session 都已移除。沒有清除雲端 session。

## 證據與限制

- [完整比對摘要](../../../docs/verification/cloudflare-background-write-summary.json)
- [未修改基準的逐次清單](../../../docs/verification/cloudflare-background-write-baseline.json)
- [候選的逐次清單](../../../docs/verification/cloudflare-background-write-candidate.json)
- [原生瀏覽器證據](../../../docs/verification/cloudflare-background-write-native.json)

第一次 `heartbeat-rate-ui` 在編輯前被測試拒絕：WordPress 將設定輸出為字串 `"30"`，測試錯誤地只接受數字。該程序已中止並確認埠關閉；沒有內容保存。後續 `heartbeat-scope-ui` 顯示設定確實存在，原生核心會 `parseInt`，完成上述流程。交付版 rate helper 修正型別判斷，只做語法檢查；成功的瀏覽器證據來自 scope helper，未重跑第一次流程。

原生 core 參考為 pinned static corpus 中的 `wordpress/wp-includes/js/heartbeat.js`，SHA256 `ba7e1f3a28b3ecc38a76b07bb7f32f3118f9a3d23353b520e705d4dd2f4621ad`；原生初始化及重設間隔皆套用 minimalInterval，沒有替換核心 JavaScript。原生鎖的到期規則未改。尚未驗證這個候選的 provider、長期容量、整個 isolate 記憶體、實機／IME、背景分頁與斷線的完整邊界。

## 重建與操作

先按 [REBUILD](../REBUILD.md) 組裝到 `markdown-write` 階段，再執行：

```powershell
python background-write/install-local-tools.py --runtime <runtime-cloudflare> --apply
```

工具先驗證四個 prerequisite 及九個新增工具的精確雜湊，再寫檔；任何目標已存在就拒絕。不修改來源、設定，也不連網或部署。需要本機已有的私人備份 owner 與登入資料；這些不在 Git。

`playtt-background-write-ui.mjs --local` 使用 9455，僅做背景診斷；`playtt-heartbeat-scope-ui.mjs --local` 使用 9457，為已通過的候選診斷。各自 control helper 支援本機檔案指令；scope 的 `diagnostic` 回傳白名單設定，`saved` 必須已觀察到精確草稿保存才可捕捉，`restart` 只允許在保存後一次，`finish` 捕捉完整比對並關閉。20 分鐘到期、所有對外請求阻擋、owner 已存在即拒絕。現存 owner 都是已結束的證據，不得刪 guard 重跑。`playtt-background-write-final.mjs --offline` 核對本輪固定備份及結果，不送網站請求。

最後雲端讀取仍是前輪 2026-11-21 06:28:14Z：161／pin13、餘 1881041 bytes、closed/sealed、pending0、publisher paused。本輪未更新該讀值。下一步可將已驗證的 30 秒政策接成預設關閉的明確選項，補新／既有編輯頁與背景分頁邊界，再決定是否足以在剩餘額度內做一個完整 provider 窗口；不得提高 cap、退款、刪歷史或 pins。完整 A01–A20 目標持續 active，PR #4 保持 draft。
