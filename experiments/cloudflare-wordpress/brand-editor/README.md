# 品牌主題的原生編輯與重啟驗證

2026-11-25，修正主題 0.3.0 的圖片區塊格式，以 **0.3.1** 在固定 `2e9819b0` runtime 的隔離本機 workerd 完成安裝、匯入、實際 Chrome 編輯保存、完整停止／重啟、匿名首頁讀回與登出。沒有部署 Worker、修改雲端資料或正式官網。

## 修正

六個聲音圖形在原生編輯器顯示「區塊包含未預期或無效的內容」。產生器直接把 `width`／`height` 寫在 SVG 的圖片標籤，卻沒有對應 core/image 的調整尺寸設定。0.3.1 移除這些額外標籤屬性，依原始 SVG viewBox 和既有 CSS 保留尺寸與比例；共用頁首、頁尾字標同步修正。不是重畫品牌圖形。

公開靜態預覽仍是 [0.3.0 品牌版面](https://d344e4ab.playtt-brand-preview.pages.dev/)，正式 `playtt.tw` 仍是既有內容。這次更新可安裝主題與編輯驗證，沒有重發靜態預覽。0.3.0 的前台驗證可作歷史證據，不能繼續當作圖片區塊全部可編輯的證明。

## 已完成的原生流程

1. 由已驗證的本機繁中備份建立全新隔離 R2／DO，預置固定資產；Worker 外連禁止。
2. 經原生 HTTP 表單上傳及啟用 ZIP，匯入六個品牌頁面；42 個主題檔與 ZIP 精確，77 個語言檔保留。
3. Chrome 原生登入，在「設定 → 閱讀」選取「Let’s Play 桌球聯盟」作首頁，再到首頁區塊畫布輸入「一起來打球。」並按「儲存」。沒有用 REST POST 或內部 JS store 代替文字編輯。
4. 獨立備份核對完整頁面，只允許四種已逐項確認的 WordPress 序列化差異：區塊間換行、預設 heading level 2、省略 CSS class 尾端空白、該段英文的 `&amp;` 編碼。文字、圖片、連結、標題與樣式的六項故意變更均會被比對拒絕。
5. 關閉編輯分頁、dispose 舊 workerd、確認兩個端口關閉，再以同一持久化目錄啟動新實例。所有資料與帳本精確，沒有重匯入資料或重新開窗。
6. 新分頁畫布、匿名根網址與獨立備份讀回成功；重啟後內容逐位元一致，其他頁面、所有安裝後媒體／主題／語言檔不變，原帳戶與原有內容不變。
7. 原生登出，確認所有 session 已移除；封存窗口、pending 0、所有程序退出。

成功輪 LOCAL27，310 個備份物件／298 檔，13,010,228 bytes／108 puts，均為本機帳本。42 檔 ZIP 為 897,926 bytes，SHA-256 `af64c988eca9213b81090bfde24585fe082b315ea2eff9ca9381fd3e29a69f06`。

匯入器會保留既有首頁設定。若原本已有首頁，必須在原生「閱讀」設定主動選取新首頁；單純匯入會先建立 `/home/`，不會悄悄替換原入口。此為預期行為。

## 保留的失敗與限制

先前四輪均保留原始 owner、執行輸入、快照及帳本，沒有重播或刪除失敗資料。依序為：測試工具誤設 1,024 次操作被既有 512 上限拒絕（未開窗）；0.3.0 圖片區塊無效；0.3.1 保存成功但過度嚴格的逐位元測試拒絕正常序列化；讀回誤把保留的舊首頁當新首頁。後兩項修正的是驗收工具／流程，不是降低資料正確性要求。

0.3.0 輪瀏覽器分頁消失，未完成登出；一筆本機 session 留在已封存的離線備份。後續各輪正常登出。全部試驗服務已退出，已開窗口皆 sealed／closed／pending 0；未開窗輪保留其初始化狀態。

成功輪兩段 server observer 共194個樣本，例外0；樣本不是 provider 尖峰記憶體或計費 CPU。瀏覽器無區塊驗證錯誤，但保留 WordPress iframe 樣式警告及登出時一筆 `ViewTransition ... invalid state` 錯誤。其原因未證明，登出、session 清除及保存讀回已分別核對，不能宣稱所有 console 完全無錯。

這不是 Cloudflare 免費環境驗收，也不涵蓋實體手機、繁中 IME 或長期營運。本輪沒有重讀雲端帳務／狀態。前次單次雲端寫入授權已用完；152MB 自設上限、封存與 paused publisher 維持原狀，不因本機結果而切換後台。

## 重建

先完成 [bootstrap-locale](../bootstrap-locale/README.md) 的固定 runtime、工具與本機繁中初始化。此層只新增4個工具，校驗384項前置工具；不改 runtime 或設定。需既有私人 assets、建置計畫、canvas wrapper、locale-complete 封存備份與測試帳號，以及固定 0.3.1 ZIP。這些私人資料不隨 Git 提交。

```powershell
python install-local-tools.py --runtime <runtime-cloudflare> --apply
# 在 runtime-cloudflare 執行；同名 owner 已存在會拒絕，不能直接重播。
node --import tsx scripts/playtt-brand-editor-complete-local.mjs --local
```

看到 browser-ready 後，透過原生 UI 登入、選擇品牌首頁、編輯指定段落並儲存；憑證只由私人 owner 讀取，不放進命令列或 Git。依序執行：

```powershell
node scripts/playtt-brand-editor-complete-control.mjs saved --local
# 關閉編輯分頁，停止心跳。
node scripts/playtt-brand-editor-complete-control.mjs restart --local
# 新分頁核對編輯內容。
node scripts/playtt-brand-editor-complete-control.mjs cold --local
# 原生登出、關閉分頁後封存。
node scripts/playtt-brand-editor-complete-control.mjs finish --local
node --import tsx scripts/playtt-brand-editor-offline-audit.mjs --local
```

每輪限600秒／32MiB／512 puts，僅127.0.0.1:9582／9583。控制命令逾時先查同一命令及程序，不重送。離線 audit 會另外查核此輪保留的四次前置嘗試，需要對應私人證據；沒有前置證據不能冒稱完成相同稽核。

證據：[獨立稽核](../../../docs/verification/theme-0.3.1/local-runtime-audit.json)、[封裝](../../../docs/verification/theme-0.3.1/package.json)、[安裝工具檢查](../../../docs/verification/theme-0.3.1/tool-install.json)、[畫面](../../../docs/verification/theme-0.3.1/README.md)。
