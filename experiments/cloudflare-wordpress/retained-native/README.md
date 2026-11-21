# 原生編輯器的保留記憶體與 PHP 緩衝區核對

2026-11-22（台北），以最後已驗證的雲端181獨立備份、固定97a92c8的6個部署模組，在新的本機workerd程序中完成編輯者登入、三次開啟draft193及原生登出。三次原生Gutenberg畫布均顯示原十段內容與已儲存狀態，沒有編輯正文。第一與第三次開啟後各取一份私人heap snapshot；兩份期間都沒有新請求／PHP事件插入。

## 量測結果

| 量測 | 第一次 | 第三次 |
|---|---:|---:|
| 快照所有節點的self_size總和 |122,600,794bytes（116.92MiB）|122,714,462bytes（117.03MiB）|
| JSArrayBufferData總和 |106,872,515bytes|106,872,515bytes|
| 已核對的PHP Wasm backing |74,317,824bytes（70.875MiB）|74,317,824bytes|
| 快照後CDP backingStorageSize |33,459,809bytes|33,459,809bytes|
| 舊初始化陣列的保留buffer |0bytes|0bytes|

快照self_size增加113,668bytes（0.1084MiB），ArrayBuffer backing增量0。整段只有一個PHP generation、沒有retirement；因此這組數字沒有混入第二份PHP runtime。三次短期訪問並不能證明長時間沒有洩漏。

這次透過**實際物件關係**證明PHP buffer歸屬：loader的wasmMemory context指向Memory instance，該instance的prototype是WebAssembly.Memory，再經ArrayBuffer與backing_store連到74,317,824bytes的節點。不是只依相同大小猜測；也沒有把WebAssembly.Memory prototype或constructor誤算為實例。

PHP buffer已包含在快照self_size與ArrayBufferData總和內，不能再次加總。這份本機數據中的CDP backingStorageSize單獨值小於已證實的PHP buffer，不能拿它作整個Worker的上限判定。這不表示所有V8版本／實作都採同一種計帳，亦未證明兩者差值全部來自特定分類。[CDP欄位定義](https://chromium.googlesource.com/v8/v8.git/+/refs/heads/13.8.193/include/js_protocol.pdl)供欄位解讀，實際包含關係以上述heap graph為準。

快照可能觸發GC；沒有另送collectGarbage。它測的是當時仍保留的物件，不是請求尖峰、RSS、整體provider計帳或128MiB驗收。不得把128減117當作可用上線餘裕。[Cloudflare官方說明](https://developers.cloudflare.com/workers/observability/dev-tools/memory-usage/)亦區分快照的保留記憶體與分配profile，並說明本機可能無法重現production行為。

## 例外與驗證範圍

1134個CDP樣本、276事件，採樣錯誤0。209個請求：198個200、10個302、1個303，沒有HTTP400以上；但在login標記期間捕捉到**1個尚未分類的Runtime.exceptionThrown**。當時工具只記時間與階段，沒有保存type／message／stack，無法事後可靠還原原因。它發生於第一份快照前；UI成功不能把它抹去，這不是零例外或完整後台穩定性驗收。未修改runtime或放寬權限來掩蓋事件。

本輪未做內容保存、發佈、IME、實體手機、provider CPU或長期Free驗收。100ms取樣與快照本身會干擾流程，不做延遲改善A/B聲明。

## 封存、完整性與工具修正

最終**LOCAL189**，實際399,692bytes／24puts，600秒／1,881,041bytes／96ops的本機窗口已closed／sealed／pending0；程序結束，9487／9488無listener。獨立匯出／匯入304物件、298檔精確一致。除draft193的既有edit_lock與wp_options序列784→794外，全部Markdown、posts／修訂、usermeta／原session、媒體及主題逐位元一致；本次新增session已移除。

離線稽核曾把edit_lock視為本次新建時間而失敗；核對固定核心wp_ajax_wp_remove_post_lock後確認原生釋放可將時間回推150−5秒。實際修改仍只限meta72、page193、user2，沒有增加meta列。核對改為允許原生釋放的時間範圍，保留初次失敗記錄；未重開窗口或重播原生流程。Snapshot分析也修正Windows文字編碼，以及Memory實例和WebAssembly.Memory prototype的區分。這些都是離線工具修正，非PHP／WordPress程式變更。

## 交付與接續

5個本機工具以86前置SHA增量安裝，沿用上一份rest-route組裝；82來源、20設定與6個部署模組未改，沒有重新抓取上游。安裝器拒絕覆蓋；已完成owner不可重播。原始heap snapshot、DOM、私人備份、登入資料及完整程序log僅保留本機；PR只含工具、數字及白名單事件。Snapshot限本機127.0.0.1:9488指定workerd target，檔案上限128MiB，禁止連到Chrome或雲端inspector。

Cloudflare請求／部署0，正式Pages與原視覺不變。最後雲端讀值仍是2026-11-21T16:52:39.597Z：181／pin16／餘62,344、Worker aa595610、closed／sealed／pending0、publisher paused、額外旗標關閉。LOCAL189不可取代雲端181；本機診斷窗口不增加雲端上限。餘額低於已量測登出成本，不能重跑完整雲端原生寫入，也不能加額度、退款、清unknown、刪pin或換資源繞過。

下一步先改善本機例外的私人觀測，再在相同備份與固定來源上核對PHP請求期間的分配／短暫副本，找出可驗證的改善點；不重做已完成的啟動副本釋放。可另外唯讀刷新Free／DO用量。本輪只釐清記憶體計算及短期保留量，完整A01–A20仍未完成，目標active、PR4 draft，正式後台不切換。

證據：[快照數字與物件關係](../../../docs/verification/cloudflare-retained-native-snapshots.json)、[資料稽核](../../../docs/verification/cloudflare-retained-native-audit.json)、[白名單事件](../../../docs/verification/cloudflare-retained-native-events.jsonl)、[組裝](../../../docs/verification/cloudflare-retained-native-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-retained-native-review.json)。
