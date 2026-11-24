# Let’s Play 目前交付與剩餘驗收

更新：2026-11-25（Asia/Taipei）。這份表整合 A01–A20 的現況；其他文件的早期「通過」紀錄，仍只適用於各自記載的版本、環境及操作。整體目標尚未完成，PR #4 維持草稿。正式官網維持 Pages，私人 WordPress 後台暫不切換。

## 目前三個版本

| 用途 | 已交付／觀測到的狀態 | 證據界線 |
| --- | --- | --- |
| [正式官網](https://playtt.tw/) | 0.2.3；既有視覺與內容持續提供服務 | 正式發布分支是 `codex/playtt-wordpress-cloudflare`，不是 `master`。本輪沒有改動 `cloudflare/public`。 |
| [品牌預覽](https://1bb1c274.playtt-brand-preview.pages.dev/) | 0.3.3；依指定品牌 PDF 改版，六頁、兩個營業據點、課程與七題 QA | 來源 `4bb8d025`、預覽 commit `50c9bbc0`。預覽保留 noindex；北投未公布，教練履歷與營業規則仍待確認。 |
| 私人免費 WordPress | 最後雲端讀回為 canonical201、既有相容 reader、封存／pending0／publisher paused | 固定候選 `2e9819b0` 的原生 Chrome 編輯、重啟與登出已在本機通過，尚未部署到 provider。當前完整雲端流程不能宣稱通過。 |

[0.3.3 主題包清單](verification/theme-0.3.3/package.json)：42 檔、898,631 bytes，SHA-256 `30b2ed9e167c43e771df4544e6533bc8a4fef4e7f51fef64baba9c58e93cc4e9`。本機交付檔為 `outputs/lets-play-0.3.3.zip`。更新主題不會覆寫既有 WordPress 頁面，內容更新方式見[編輯手冊](EDITOR_GUIDE.md)。

## A01–A20 現況

「已驗證」僅指該列列出的範圍；本機、私人雲端、靜態預覽及正式網站的證據不能互相替代。

| 項目 | 目前結論 | 證據及仍缺的部分 |
| --- | --- | --- |
| A01 帳號與資源 | 搬遷所需帳號及權限已核對 | 原遷移已完成 Cloudflare／Gandi／本專案 Zeabur 核對；既有授權不等於新的受限寫入試驗已獲授權。右側 Supabase 已登入，而連接工具對該專案無權限，兩者須分開判斷。 |
| A02 備份 | 原站與設定備份已保存，本輪檔案檢查通過 | 原始 Git bundle 完整歷史驗證通過；[本輪檔案盤點](verification/release-readiness-artifacts-20261125.json)核對 12 項、4 個 ZIP CRC，最新主題 42 檔與包裝清單精確。完整 Gandi zone／Cloudflare 設定／Zeabur 模板原檔保留本機，不把公開 DNS 當完整備份。 |
| A03 官網可用 | 正式站及品牌預覽已驗證 | 本日正式 46 檔、預覽 49 檔核對通過；[最新抽查](verification/release-readiness-http-20261125.json)確認正式首頁、預覽首頁／課程仍 200、內容精確。抽查不是再跑一遍全站測試。 |
| A04 免費 WordPress | 部分實測通過；完整雲端營運未驗收 | 既有私人試驗有保存／重部署／還原證據；目前候選的完整雲端視覺流程、首次繁中初始化、冷啟動體驗與持續使用仍未完成。[下一次受限試驗](../experiments/cloudflare-wordpress/visual-cloud-next/README.md)已準備，等待明確授權。 |
| A05 可安裝主題 | 主題與安裝證據已交付，版本範圍明確 | [0.3.1](verification/theme-0.3.1/README.md)原生安裝／啟用與重啟通過；[0.3.3](verification/theme-0.3.3/README.md)完成匿名匯出、42 檔包裝、內容與版面檢查。0.3.3 是後續文案／區塊組合調整，未另重跑完整原生編輯流程。 |
| A06 編輯與發布 | 本機內容及共用組件編輯通過；正式後台尚未交付 | [0.3.1 原生編輯](verification/theme-0.3.1/NATIVE_EDITOR.md)覆蓋五個內容頁、共用頁首頁尾、保存／重載／還原；既有雲端發布試驗保留。最新候選與正式 Pages 的完整編輯發布流程尚未驗收。 |
| A07 保存、草稿與還原 | 既有私人雲端及本機還原有證據；最新候選未完成雲端整輪 | [既有獨立還原](../experiments/cloudflare-wordpress/runtime-retirement/RESTORE-AUDIT.md)核對內容／媒體及匿名草稿隔離；canonical201→LOCAL216 副本通過完整性核對。新備份、Chrome 證據 audit 與收尾工具[本機 14 項測試](verification/cloudflare-visual-next-recovery-check.json)通過，不代表遠端流程已執行。 |
| A08 內容對照 | 已整理；營業資料待老闆確認 | [內容查核](CONTENT_REVIEW_20261125.md)區分使用者確認、粉專／網路來源、Supabase 內部資料及待補項。現行兩店、移除王泳程已反映候選；不擅自公開未核定價格、特定班型、檢定級數或教練履歷。 |
| A09 聯絡入口 | 網頁連結已驗證；據點分流仍待確認 | 保留原 LINE、使用者確認的兩支電話與地圖；無假表單。網路出現不同 LINE 短網址，尚未直接替換。未替使用者發訊息、寄信或預約。 |
| A10 響應式 | Chrome 指定尺寸已驗證 | 0.3.1 六頁×375／768／1440 共 18 組；0.3.3 首頁／課程／據點共 9 組及 QA 操作通過。這是瀏覽器模擬尺寸，實體裝置與輸入法操作未完成。 |
| A11 可及性 | 主要檢查通過；完整輔助技術驗收仍待 | 既有鍵盤、選單焦點、alt、語言與 reduced-motion 證據保留；[0.3.2](verification/theme-0.3.2/README.md)修正頁尾小字對比至 4.94，地圖按鈕含據點名；0.3.3 七題 QA 鍵盤操作通過。未宣稱全站所有圖中文字或完整螢幕閱讀器皆已驗收。 |
| A12 SEO | 各版靜態設定及讀回已驗證 | [0.3.3 匯出／遠端讀回](verification/theme-0.3.3/README.md)涵蓋頁面標題、描述與靜態設定。最新 HTTP 讀回確認正式首頁沒有 noindex、兩個預覽頁有 noindex；預覽 SEO 分數不能當正式站分數。 |
| A13 舊網址 | 舊網址處理已有回歸證據 | `#/class`／`#/partner` 的[客戶端處理測試](../wordpress/scripts/legacy-links.test.mjs)及既有正式瀏覽器結果保留；最新 `/home/` 301 通過。本輪沒有重跑 hashchange 瀏覽器試驗。 |
| A14 頁面與資產 | 最新品牌預覽及原正式靜態檔已核對 | [0.3.3 驗證](verification/theme-0.3.3/README.md)含 49／46 檔、404／301、9 組畫面及 console 檢查；本機額外 favicon.ico 404 已記錄，不列為必要內容失效。這不包含私人後台完整網路流程。 |
| A15 行動效能 | 有實測及修正，分數只屬所測版本 | 正式 0.2.3 歷史首頁94／課程99；[品牌預覽 0.3.0 PSI](verification/theme-0.3.2/pagespeed-preview-0.3.0.json)首頁99／課程100、LCP約0.9秒、CLS0。0.3.3 沒有新 PSI 分數；不能將舊分數改標成新版成績。 |
| A16 DNS、TLS、郵件 | 設定、公開 DNS 及 HTTPS 已驗證 | [最新 DNS](verification/release-readiness-dns-fixed-20261125.json)確認兩個 Cloudflare NS、12／12 原郵件紀錄；DS／DMARC 維持原本未設定。HTTP／www 保留路徑及 query 轉向 HTTPS。原完整 zone 備份仍在，未做信箱實際寄收或本輪 Dashboard 全區重新匯出。 |
| A17 自動發布 | GitHub→Pages 靜態流程已驗證 | 整合限本 repo，預覽與正式分支分開；沒有新增付費方案。私人後台發布器最後確認 paused；最新候選的全雲端發布與持續免費使用不能由 Git push 成功推論。 |
| A18 回滾 | Cloudflare 靜態回滾已實際驗證 | [0.2.2→0.2.1→0.2.2 演練](verification/cloudflare-rollback.json)與 0.2.3 獨立 ZIP 保留，無須 Zeabur；私人資料還原另見 A07。0.3.3 尚未正式採用，沒有宣稱其正式切換與回滾已完成。 |
| A19 Zeabur 清除 | 本專案已清除且有紀錄 | [11月17日清除證據](verification/zeabur-removal.json)：使用者刪除唯一 playtt 服務所屬 LetsPlayWebsite 專案，無資料卷，其他專案未受影響。清除後網站驗證通過，本輪正式站仍可用。沒有再次執行刪除。 |
| A20 交付 | 成果及操作文件已交付，完整營運交接未完成 | 主題、[原始 PDF／品牌依據](brand/README.md)、程式碼／PR、[編輯手冊](EDITOR_GUIDE.md)、[操作手冊](OPERATIONS.md)、證據及內容待補表俱在。完整免費後台、實體操作、內容核定與最終正式採用仍開放。 |

## 這次新增的查核

- [公開 HTTP](verification/release-readiness-http-20261125.json)：3 個指定頁面及 3 個轉址，全部通過；沒有呼叫私人 Worker。
- [公開 DNS](verification/release-readiness-dns-fixed-20261125.json)：12 筆郵件紀錄與兩個 NS 符合原遷移基準。第一次查核因 PowerShell `switch` 改變 `$_` 而取不到欄位，屬驗證器錯誤；[原失敗輸出](verification/release-readiness-dns-20261125.json)保留，未當成 DNS 變更或刪除。
- [交付檔案](verification/release-readiness-artifacts-20261125.json)：12 項存在並留下雜湊；4 個 ZIP CRC 通過；0.3.3 主題42檔與既有清單精確；PDF 與 Zeabur 模板符合既有指紋。這是檔案核對，不是新的 WordPress 還原演練。

以上均未改動雲端資料、DNS、正式靜態檔或品牌候選，也沒有重複執行已通過的完整後台測試。

## 下一步及必要條件

1. **私人雲端視覺試驗**：候選、回退、受限 controller、備份與稽核工具已完成本機準備。前一題單次 600 秒／1,050,000 bytes／96 puts、保留 152 MB 上限的授權仍待答覆；沒有授權檔或 run owner。先前那次受限試驗的同意已使用完，不能重複使用。
2. **營業內容**：將[七項待補清單](CONTENT_REVIEW_20261125.md#給老闆的精簡待補清單)交由店家核對。Supabase 缺地址／電話／履歷／照片與教案範本；公開舊活動不能代替現行招生及合作條件。
3. **實際操作交接**：在可用後台及確定內容上完成實體裝置／繁中輸入與編輯者驗收；保留目前延遲、初始化及持續用量未驗收的限制。
4. **正式採用**：依使用者目前決定維持正式站。待上述證據和內容具體齊備，再處理正式採用及回退安排；本表不是切換授權，也不把預覽完成當作全案完成。
