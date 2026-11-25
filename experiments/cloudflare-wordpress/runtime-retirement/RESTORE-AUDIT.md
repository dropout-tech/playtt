# 最新候選的獨立還原驗證

本次使用與a33083f3相同的執行器來源，部署至另一個私人Worker `playtt-wp-free-restore-audit`。它有自己的SQLite DO命名空間與R2桶 `playtt-wordpress-retirement-audit`，沒有正式網域路由，也沒有指向原Worker的DO綁定。正式playtt.tw、主要WordPress資料區與既有私人研究站均未重設。

## 固定輸入與重現

使用2026-11-17 09:22 UTC的私人校驗備份，revision `9ab986fc-ac85-4fe5-85e4-0279bccaea03`，ZIP SHA256 `85594bc9bd0c478390a892415a9edb3715a2cb8526b262dc0f6bf40c4aa98268`。295個備份索引去重為292個物件，另外提供三個與固定runtime manifest相符的核心物件。

1. 將本目錄`playtt-retirement-restore-audit.mjs`放入runtime的scripts，設定檔放在runtime根目錄。先套用README所列全部候選補丁。
2. 本機`artifacts/playtt-retirement-restore-input-private.json`提供`directory`，指向`outputs/backups/cloudflare-wordpress-restore-probe/`內的已驗證備份。秘密沿用本機`work/playtt-cms-secrets.json`，不提交到Git。補齊artifacts中三個核心物件；腳本會逐個核對SHA256。
3. 以獨立的playtt Wrangler登入設定執行`node scripts/playtt-retirement-restore-audit.mjs --remote --preflight`。它只檢查本機檔案與固定目的地，並不呼叫網路。
4. `--capture-source`先確認來源仍是備份revision，保存私有的內容比對基準。登入可能提交session紀錄，原品牌內容不變，發布器維持paused。
5. 建立設定中唯一的新私人桶及Worker，使用既有的專案秘密保護入口。`--upload`必須確認目標DO為pointer=null、version=0，再上傳295個已校驗的核心／備份物件。
6. `--restore`再次確認空白DO與paused狀態，才提交備份指標。沒有reset操作，拒絕覆蓋已存在的資料。
7. `--verify`登入新站，比對七個已發布頁面（六個品牌頁面加備份原有測試頁）、範本部件、導覽、全域樣式、繁中管理員和既有私人草稿；逐檔讀取所有媒體並核對雜湊，再檢查六頁、CSS及匿名草稿404／編輯REST 401。

所有測試都有固定目的地及逾時，失敗不自動重試。內容比對使用SHA256，報告不輸出原始私人內容。備份中的文章內嵌網址保持原字串；這次驗收證明獨立資料還原，並未宣稱已完成改網域所需的內容網址遷移。

## 最新結果

2026-11-17 09:37 UTC，全部步驟通過。實際運行版本19c92e3e-678e-4196-8d83-0a4ed6370c58（設定秘密後產生的新版本），與來源a33083f3使用相同runtime程式。七頁／兩個範本部件／兩組導覽／樣式內容雜湊一致，15個媒體檔SHA256相符，繁中管理員與匿名草稿權限通過。125個觀測tail事件封裝全部ok且無例外，非完整請求數；登入頁約10.2秒、登入提交約33.8秒，效能仍待改善。報告見`docs/verification/cloudflare-retirement-restore-*`。私人發布器維持paused，沒有切換正式官網或開通付費方案。

## 本機故障回復

`playtt-retirement-job-recovery-local.mjs`只接受固定127.0.0.1模擬器與`--local` R2操作。它暫時以不合法的工作資料測試發布失敗，確認完整前版仍可瀏覽；恢復工作後明確重試、確認新內容發布，再還原原文並暫停發布器。這次以最新候選執行完成exit 0，故障與恢復證據另存`cloudflare-retirement-job-recovery-local.json`。它不包含遠端故障注入或長期穩定度保證。
