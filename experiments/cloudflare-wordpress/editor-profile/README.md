接續：[相同原生命令流程重現403並核對全域樣式權限](../rest-route/README.md)；本機證據，雲端181未變。

# 最新備份的原生繁中編輯器本機量測

2026-11-22（台北），使用雲端181獨立備份與97a92c8相容reader的固定6模組，在本機workerd完成編輯者登入、draft193首次及再次載入、登出、管理員登入、網站編輯器與登出。兩次頁面畫布都顯示原10段、10筆修訂，網站編輯器顯示原主視覺及首頁區塊。未編輯或發佈內容。

正式Pages／視覺及雲端後台未變，Cloudflare請求0。這是本機診斷，並非雲端128MiB限制、完整瀏覽器效能或持續免費的驗收。

## 結果與讀法

| 觀測 | 本次數值 |
|---|---:|
| 首次登入頁HTTP（包含冷啟動） |2817ms |
| 頁面編輯器HTML：首次／再次訪問 |1345／1339ms |
| 網站編輯器HTML |1153ms |
| PHP Wasm heap最高 |76,021,760bytes（72.5MiB） |
| PHP檔案儲存抽樣最高 |31,677,463bytes |
| CDP usedSize／backingStorageSize各自最高 |36,482,336／68,038,455bytes |
| CDP樣本／事件 |1531／1439；採樣錯誤0 |
| 原生請求＋資產＋本機控制請求 |244：225個200、17個302、1個303、1個403 |
| 本機寫入窗實際消耗 |496,779bytes／30operations |

首次訪問頁面編輯器前已登入、開控制台及頁面清單，因此標記post-cold**不代表冷Worker**；HTTP時間也不是畫布完成可互動的時間。所有數值來自一次含100ms CDP抽樣及CPU profiler的流程，不是改善前後A/B，沒有據此聲稱效能改善。117個PHP記憶體事件；檔案盤點僅首請求及保存後，沒有把舊盤點值沿用為新樣本。

各記憶體欄位用途不同，不能把獨立峰值相加，或用72.5MiB判定整個Worker符合限制。CDP將backingStorageSize定義為array buffers與external strings的儲存大小；本次未驗證它與PHP Wasm heap的完整對應，也未量測整個isolate/RSS。參考[CDP Runtime](https://chromedevtools.github.io/devtools-protocol/v8/Runtime/)與[Cloudflare記憶體量測說明](https://developers.cloudflare.com/workers/observability/dev-tools/memory-usage/)。

phase紀錄中request.php累計35,336ms最多；wp-content inventory1166ms、canonical還原808ms、WordPress解壓670ms。CPU抽樣含idle／原生等待及工具開銷，不能解讀為Cloudflare計費CPU。後續應核對PHP請求及整體保留記憶體，而非重做已修好的初始化副本問題。

編輯者登入後有一筆REST GET403（591ms）。工具只記錄類別，未保存路由或錯誤碼，**原因仍未定位**，不能稱為預期權限拒絕或忽略。UI載入成功也不能推出零HTTP錯誤。本次未重現可見OOM，但未證明雲端不存在OOM。

## 資料與失敗紀錄

本機最終191，封窗／sealed／pending0／程序結束，獨立匯出再匯入304物件／298檔完全一致。這不是雲端版本；雲端最後已驗181保持原狀。

所有posts／修訂、媒體、主題與其他Markdown精確一致。只變動draft193的_edit_lock、管理員session_tokens、wp_options序列784→794。管理員原60個session保留31個；移除29個全部早於本次開始即已過期，保留者逐項精確。編輯者原5個session全保留；兩次本次登入均無新session殘留，所有usermeta／postmeta列集合未變。

原流程先因「全部session逐位元不變」這個過嚴驗證而失敗，失敗owner與私人log保留。之後只讀封存fixture，核對所有被移除session的expiration並重新獨立備份，沒有重新開窗或重做登入。最早一份fixture在PHP及寫入窗啟動前因inspector ws/http協定處理失敗，亦保留。唯讀finalizer首輪缺少假auth bindings得到503，補齊後重讀成功；離線audit最初誤用不存在的options表路徑，修正為核對實際全檔清單後通過。沒有把上述工具失敗改寫成第一次全過。

## 封裝與接續

82個runtime來源與20設定未改。5個本機工具以incremental installer交付，核對86前置檔案SHA、拒絕覆蓋已有工具；不包私人備份、密碼、cookie、DOM或raw CPU profile。這不是新抓上游重建。

本機候選旗標為content-gzip-v1、gzip-v1、native-30s-v1與記憶體診斷；雲端額外旗標仍關閉。Miniflare的空storageClass只在本機轉Standard，其他未知值拒絕；保留真實寫入保護，600秒／1,881,041bytes／96ops。本機獨立研究配額不代表增加雲端配額，也不可直接拿此流程重跑雲端。

最後雲端GET仍是2026-11-21T16:52:39.597Z：181／pin16／餘62,344、closed／sealed／pending0、publisher paused，aa595610相容reader。這輪沒有刷新雲端、帳單或DO用量。餘量不足完整原生寫入，不加上限／退款／清unknown／刪pin／換bucket繞過。

下一步：本機記錄403的白名單路由與WP錯誤碼、核對原生權限；使用相同現行程式和已驗備份做受控保留記憶體／PHP耗時分析。另可唯讀刷新Free與DO用量。手機／IME、完整A01–A20、長期Free、正式後台切換仍未驗收；目標active、PR4 draft。

證據：[結果](../../../docs/verification/cloudflare-editor-profile-result.json)、[離線差異](../../../docs/verification/cloudflare-editor-profile-audit.json)、[數字樣本](../../../docs/verification/cloudflare-editor-profile-samples.jsonl)、[組裝](../../../docs/verification/cloudflare-editor-profile-rebuild.json)、[審核](../../../docs/verification/cloudflare-editor-profile-review.json)。
