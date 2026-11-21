# 有界 Markdown 寫入候選

## 私人 provider 後續驗證（2026-11-21）

來源67dd308暫部署fdc7f590。Chrome原生繁中編輯器進入程式碼模式輸入一段、切回視覺模式按一次儲存，顯示成功；原生autosave204與正式修訂205都含完整內容。第一個420秒／3MiB／96操作窗口實用3109160bytes／82puts，首次重開被容量保護拒絕。兩個manifest持久化請求失敗；即使保存後guard還有652969bytes，也不足以保證重開加上背景請求全部完成。沒有提高額度或重送保存，先關窗封存並完成備份154／pin12。

第二個180秒／1.5MiB／48操作窗口從154接續，只做原生重開、逐段比對八段可見文字和登出；實用945529bytes／24puts，結束161。備份正文與區塊碼逐字核對，沒有在瀏覽器重開程式碼編輯器或再次保存。核心既有autosave清理規則刪除過期204及footnotes75，明確修訂205保留。登出移除本次session，登入前130備份的5個session精確保留；最初pin helper誤設全部session應為空，本機即拒絕、尚未送出provider註冊，修正為精確比較後通過。

兩份完整備份均為298檔／303物件，各8GET下載2802378／2799511bytes；獨立匯入和離線完整包轉換一致。已新增pin12與13，保留前11份。最終9f5aa2c1-3348-4e5f-ae61-776a1b3cd51a保留相容來源，實際content/readback旗標移除；06:28:14Z只讀確認161／13pins／餘1881041bytes、closed/sealed、pending0、fence解除、publisher paused。沒有在最後停用旗標部署後再做原生內容請求，不把operator狀態查詢當成此項驗收。

新的observer與窗口由同一程序管理，操作前經新ID challenge確認真實tail仍活著和期限足夠；歷史ready檔不能授權下一步。4項工具測試涵蓋串流解析、來源版本、關閉後舊ready、期限及停止前寫出完成。主流程396事件、33/35trace完成、2個canceled、2個持久化失敗；接續144事件、11/11完成、1個canceled，皆未觀察到exception。檔案副本峰值366280、追蹤含response1239624、WASM取樣76152832bytes，均非whole-isolate峰值。事件封包可能含多個請求的trace，不將其直接歸成唯一的手動保存耗時或加速比例。

此輪12個新工具及測試後，可重建77來源／131輔助檔，20設定不變；runtime來源未改，不重跑已通過的125項來源檢查。新helper、完整資料、cookies及owner分開存放；只交付允許欄位的診斷與比較結果。最新證據 `docs/verification/cloudflare-markdown-provider-*`，總結明列 `save-and-resumed-native-read-pass-with-budget-exhaustion`。

下一步先本機定位背景快照放大：36次Markdown持久化中25次只有一個物件PUT，尚不能推定檔名或跳過ID／鎖／session資料。任何優化須保留原生內容、修訂、autosave、session和單調ID語意。剩餘provider額度1881041bytes不能靠提高cap、退款或清除歷史補足。下一窗口接 `playtt-markdown-provider-cold-ui-owned-private.json`，verified備份接 `playtt-markdown-provider-cold-backup-owned-private.json`；舊130／154工具均不可重跑。正式Pages、原視覺、draft PR和完整目標不變。以下本機數據為前輪歷史。

第 12 個選用階段。目的是處理上一輪私人 provider 保存中約 2356 ms 的逐項 Markdown 寫入；目前只有本機驗證，尚未部署，不能宣稱雲端延遲或免費方案記憶體問題已解決。

在 canonical lease 持有 PHP runtime 時，先用 PHP `filesize` 一次取得大小清單。保留 5000 檔、單檔 16 MiB、總計 64 MiB 限制；此檢查在 Markdown 複製與寫入之前，其他檔案群組可能已先處理。最多同時 4 個檔案，小檔案合計最多 1 MiB；超過 1 MiB 的檔案單獨處理。沿用原始 bytes、SHA256、檔案順序與 unchanged 判斷，沒有修改儲存格式、manifest 或提交規則。

觀察到錯誤就停止安排新工作，等待全部已開始工作結束再拒絕。已完成的不可變物件可能保留並計入額度，不刪除、不退款、不提交部分 manifest。持有檔案副本的計數不包含 crypto、provider、WASM、檔案系統與整個 isolate 的記憶體。

## 重建

先使用上一階段 [content-io](../content-io/README.md) 的完整組裝順序與最新工具，再執行：

```powershell
python markdown-write/apply-local-candidate.py --runtime <組裝後的runtime-cloudflare> --apply
```

所有 prerequisite、四個既有檔案與七個新增檔案均檢查精確雜湊；重複套用會先拒絕。預設 assembler 沒有自動加入這個候選。20 份設定不變，這個命令不部署、不存取憑證。新副本組裝結果為 77 個來源、119 個輔助檔一致；官方核心資產仍按既有流程產生。

## 驗證結果與範圍

- 新排程器 10 項、既有相關 115 項，共 125 個不同檢查於本輪各次執行通過。兩個等待邊界測試先因 event-loop 次數太短失敗，改成有界 5 秒等待後，各自整份 10 項通過。TypeScript 與 dry-run 通過。
- 額外的廣泛 runtime suite 為 29/32：兩個文字 regex 在雜湊鎖定的舊 worker 也失敗；seed generator 缺 PHP CLI（`spawn php ENOENT`）。沒有宣稱整套測試全綠。
- 真實 PHP 的引號、美元字元、Unicode、換行、反斜線檔名與檔案更新後大小均通過。真實本機 WordPress 由備份 130 啟動，保存 132、回應遺失後完整重啟讀回、重試 133、完整包回退 134 和再冷啟動均逐字一致。只新增預期修訂 204，獨立備份及完整包轉換通過。
- Chrome 原生繁中後台：程式碼編輯器輸入一段，視覺化編輯器按一次儲存；完整重啟 workerd 後，八段內容及程式碼逐字一致。儲存版本 142，結束時 149；登入、heartbeat 和偏好保存也推進版本，不能把一次內容保存當作整個流程只有一次寫入。修訂只新增 204，其他內容、媒體、主題和非預期資料列一致。這不是實體 IME／手機驗收。
- HTTP 10/10、UI 32/32 trace 完成；HTTP/UI 的 Markdown 檔案副本峰值分別 363758/363767 bytes、最多 4 檔。UI 包含 response 的已追蹤持有峰值 1207098 bytes。這些不是整個 isolate 的峰值。所有本機程序結束，外連 0；沒有新增完整 ZIP。

本機 helpers 使用私有備份，綁定 `127.0.0.1`。UI helper 20 分鐘到期，拒絕覆寫既有 owner；不要刪 guard 重跑。測後移除未使用的舊 readback/fault 狀態欄位與 API helper，save/restart 路徑不變；只做語法檢查，沒有再跑一次已完成的 UI。

證據位於 `docs/verification/cloudflare-markdown-write-*`。05:41:13Z 四個 GET 核對私人環境仍 130／pin11、closed/sealed、pending0、publisher paused、餘 5935730 bytes。部署仍是前輪的 `1c55f0fa`，不是這輪來源。

下一步是在原額度內做原生瀏覽器 provider 驗證，同一協調程序必須檢查診斷存活與窗口剩餘期限；不能靠舊 ready 檔。窗口接 `playtt-content-io-provider-cold-owned-private.json`，完整備份接 `playtt-content-io-provider-backup-owned-private.json`。舊一次性 provider helpers 固定舊來源及狀態，不能移除 guard 重跑。維持完整 WordPress 目標、正式 Pages／原視覺與 draft PR；完整記憶體、並行、混合版本還原、實機 IME 與長期免費仍未完成。
