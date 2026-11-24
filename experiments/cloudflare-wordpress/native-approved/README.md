# 核准的私人 WordPress 編輯測試

2026-11-24：使用者明確授權一次600秒／1,881,041bytes／96puts的私人測試，將應用程式累計payload上限150,000,000調為152,000,000 bytes並保留完整帳本。此上限不是Cloudflare方案或免費額度。

## 已確認的結果

- 原生登入、繁中草稿193保存、重新部署後全文讀回、11筆修訂與原生登出通過；新增revision209。**視覺化編輯畫布空白，實際使用原生程式碼編輯模式，不能宣稱視覺編輯通過。**
- 只有一個實際編輯窗口，994,970bytes／60puts，canonical181→201。窗口已關閉並封存，剩餘累計容量1,067,374bytes；不退款、不重置、不刪歷史。
- 四個遠端GET下載2,419,045bytes，獨立複製後驗證304物件／298檔。原文章、媒體與主題完全相同；新增一筆修訂、自己的edit_lock及自增序列更新。使用者2偏好由visual改text，登出清除其session列；其他使用者、偏好及設定列精確。
- 復原相容reader `9377b040-3509-4cde-8adc-be4f7c2deb73`，六模組bytes與全部bindings／namespace精確；保留152MB上限。17個備份pin包含原16個，兩個pointer與receipt精確。pending0、closed／sealed、fence inactive、publisher paused。
- Workers仍Free；刷新後R2本期顯示2.33GB、Class A7.39k、Class B60.84k、$0.00。帳務可能延遲，未核對完整DO詳細帳務，不代表可長期零成本。
- 正式Pages、原視覺與DNS沒有變更；沒有付費升級或新資源；PR4維持draft／未合併。

## 觀測限制

373個觀測事件有371個ok、2個admin-ajax canceled，沒有捕捉到runtime exception或截斷事件。28個完整PHP trace包含4 cold／24 warm與8 read／20 mutation。76個WASM採樣最大72MiB；這不是整個isolate的尖峰，也不是billed CPU。

保留一個404及兩個rest-users403；外層與內部事件可能重複，不能把事件數當成HTTP請求數。canceled出現在關閉編輯分頁附近，但未獨立證明原因。編輯畫布空白的根因未定位；修訂側欄顯示11筆，內容正確另由全文讀回與獨立備份驗證。

原始登出備註搜尋「已登出」而回傳false，實際畫面是「你已完成登出。」且已回到登入表單；備份亦確認測試使用者的session資料移除。保留原始備註，離線audit記錄此文字比對限制。

## 控制工具修正與歷史嘗試

第一個controller在sealed狀態呼叫會被窗口擋下的r2-state，尚未開窗或部署；獨立清理確認原資料、帳本與fence正確。修正工具後用6項測試驗證三種狀態讀取：邊界完整檢查、原生窗口的即時coordinator、持有fence且sealed時的保留狀態加R2 pointer精確比對；未修改runtime。

第二次在152MB設定尚未傳遞到capacity DO的45秒期限內停止，未開窗、0資料寫入，已復原。只讀核對確認上限到位後才進入v3；這次才開啟唯一窗口。全部共5次私人程式部署，失敗證據分開保留。最初遺漏TypeScript loader的備份命令在任何網路操作前停止，正確命令使用`node --import tsx`。

## 增量重建及續作

在已完成[native-next](../native-next/README.md)的隔離組裝目錄安裝本目錄工具：

```powershell
python install-local-tools.py --runtime <assembled-runtime> --apply
```

核對347個前置工具hash後新增15個工具，總計362個hash／908個組裝檔案，原893檔完全不變。中央82個runtime sources與20個config不變。安裝器沒有網路或部署操作。

`playtt-native-approved-ui`與`v2-ui`為保留的歷史嘗試；實際成功窗口由`v3-ui`控制。**所有遠端owner都已完成，不得重播。** 最新窗口／drain控制身分在本機`artifacts/playtt-native-approved-v3-ui-owned-private.json`；資料anchor在`artifacts/playtt-native-approved-backup-owned-private.json`；備份保留fence已由`final-owned-private.json`釋放。這些身分與備份含私人資料，沒有收入儲存庫。

接下來可先離線定位空白畫布及補足自動驗證。新的雲端寫入窗口須另定範圍，本次單次授權已用完；不提高上限、不清帳本、不刪備份，也不切換正式後台。首次繁中初始化、實體IME／手機、持續免費用量、整體尖峰及A01–A20仍未驗收。

證據：[資料與觀測audit](../../../docs/verification/cloudflare-native-approved-audit.json)、[獨立備份](../../../docs/verification/cloudflare-native-approved-backup-result.json)、[最終程式與封存狀態](../../../docs/verification/cloudflare-native-approved-final.json)、[嘗試與交付統計](../../../docs/verification/cloudflare-native-approved-delivery.json)、[交付檢查](../../../docs/verification/cloudflare-native-approved-review.json)。
