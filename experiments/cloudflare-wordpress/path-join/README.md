# 檔案路徑重複正規化：本機候選與原生配對量測

2026-11-22（台北）。正式Pages與原視覺維持現況，免費WordPress仍為私人研究。這次從原生編輯器的JavaScript分配樣本找到一個可具體驗證的改善點，完成單行候選、真實PHP檔案語義測試及兩份完整來源建置的原生流程比較。尚未採用到中央runtime或雲端，未把短期樣本當作整體上線驗收。

## 改動與理由

Emscripten的FS.lookupPath已將路徑拆成非空片段，並在每個片段前處理「.」與「..」。current_path從根目錄開始，已是正規化的絕對路徑；一般片段不含斜線。原本每加入一個片段又呼叫PATH.join2→normalize，重複split/filter/join整條路徑。

候選將這一條改成根目錄分支加字串串接，保留每次真正的節點查找、權限、symlink、mount、parent/noent及錯誤判斷。沒有快取檔案節點、內容或查找結果，也沒有改PHP/WASM二進位。

固定產生的loader SHA為9eee1c4…，候選為38231012…。`apply-loader-candidate.py`核對完整SHA及唯一替換位置，預設只檢查，`--apply`才寫入；不同版本／已套用會拒絕覆寫。此步驟需在既有`playtt-prepare-small-heap-loader.mjs`之後，以獨立候選目錄執行。舊generator與歷史回復套件保留原樣。

## 定位與例外限制

先以雲端181備份及固定相容套件跑新本機副本。三次原生Gutenberg皆顯示十段與已儲存；兩次暖重開的21,317ms抽樣包含8個請求。3128個allocation samples、830個profile nodes，node selfSize歸屬總量106,061,820bytes，其中split／lookupPath／join合計45,125,328bytes。實際呼叫堆疊連到固定bundle的lookupPath，來源宣告與SHA已核對。

本次補上最多8筆、有限字串／20個frame的私人例外細節紀錄。但這輪沒有捕捉到Runtime.exceptionThrown，所以**上一輪未分類例外仍未解決**，新的細節捕捉分支也未被真實例外觸發。初次未經gate直接開根網址的404有保留；登入後流程正常。LOCAL190使用449,660bytes／27puts，封存／資料核對通過。

分配採樣依[固定V8協定](https://chromium.googlesource.com/v8/v8.git/+/refs/heads/13.8.193/include/js_protocol.pdl)啟用32KiB間隔及major/minor GC已回收物件紀錄。數字是抽樣歸屬的累計分配，不是同時存活的記憶體、PHP allocator、RSS、雲端尖峰或計費CPU。node selfSize與sample size是不同欄位，不把兩者相加或強求數值一致。

## 固定PHP/WASM的語義對照

同一PHP8.3.36 web WASM及追蹤配置環境，原loader與單行候選各執行1,876個查找案例，所有回傳path/node摘要及errno完全一致，結果SHA相同。涵蓋空字串、根、重複斜線、dot/dotdot、不同cwd、中文空白路徑、檔案中間節點、parent/follow/follow_mount/noent、相對／絕對／失效／循環symlink、mount/unmount、改名、刪除及重建。另以真正PHP讀寫／改名／刪除繁中檔案核對。

每版另跑5次20,000個查找的Node診斷：原版約60.6–66.7ms、候選17.6–24.8ms。這是固定先後順序的局部操作，不能換算為整個WordPress或provider的加速比。首次工具把generated loader誤放到82個TypeScript來源清單查找，於執行前停止；已改核對它獨立保存的SHA，未重播任何雲端操作。

## 完整來源建置與原生比較

以82來源、109 vendor檔及9資產建立獨立工作目錄，沿用已安裝的固定依賴，沒有重新下載。候選與原版在同一目錄各做一次Wrangler dry-run；兩份輸出的5個二進位模組相同，JS輸出逐字比較只差上述一條statement。原凍結套件與這次重建有依賴路徑標籤／局部變數名稱差異，因此配對量測改用**同一次建置條件的新基準與候選**，沒有假稱原凍結bundle逐位元相同。

兩版各從相同181獨立備份啟動全新本機workerd，完成編輯者登入、三次開draft193及原生登出。每次畫布均有原十段與已儲存狀態。第一輪後開始採樣，第二、三輪後停止；兩個採樣窗的8個請求順序、類別、method、HTTP status及canonical version精確相同，均為2個編輯器HTML、2個AJAX、2個REST及2個302請求，沒有資產請求。

| 採樣欄位 | 新基準 | 單行候選 |
|---|---:|---:|
| node selfSize歸屬總量 |103,185,812bytes|62,450,276bytes|
| split／lookupPath／join歸屬總量 |57,252,016bytes|14,000,700bytes|
| 編輯器HTML HTTP時間 |1269／1262ms|1244／1232ms|
| 採樣窗長度 |28,557ms|22,413ms|

這一次配對中，累計抽樣歸屬總量少40,735,536bytes（約39.5%），上述路徑函式少約75.5%。這支持減少重複配置的方向，**不是**整體記憶體下降39.5%、雲端CPU改善或穩定延遲結論。順序固定、視窗長度不同、首次瀏覽器資產快取不同；兩份樣本不能證明統計顯著或長期行為。沒有為了改善數字調整原生心跳或做強制GC。

## 資料、交付及下一步

兩份配對副本最終都是獨立的LOCAL190；各304物件／298檔備份精確，全部原session保留、新session移除。只變既有edit_lock與options序列784→794，其他內容／修訂／媒體／主題／usermeta精確。各27puts，原版449,653bytes、候選449,684bytes；這些不是儲存節省指標。兩版HTTP400以上與捕捉exception均0；初始載入資產快取造成整段請求數210／44不同，不拿全段請求總量作改善比較。三個本機研究副本均closed／sealed／pending0、程序與自有分頁已結束。

11個診斷工具、明確的loader套用步驟及兩個建置準備工具以增量方式交付。`prepare-source-build.py --workspace …`及`prepare-native-plan.py --workspace …`依既有私人備份／固定計畫準備新的本機建置與模組計畫；已完成目錄／owner會拒絕重播。完整建置命令為`node node_modules/wrangler/bin/wrangler.js deploy --dry-run --config wrangler.playtt-session-audit.jsonc --outdir dry-run`，不是部署授權。Windows依賴junction只指向既有固定node_modules；首次建立因OS權限拒絕，後續以工作區內明確來源建立成功，沒有新增套件或付費。

本輪中央runtime的82來源、原generated loader與20設定未改；只有獨立候選generated loader改一條。交付組裝也從固定loader套用同一候選並核對SHA；原生測量使用完整建置，不是直接改bundle。私人profile、DOM、備份、憑證與程序log不放PR。

下一步是候選的原生內容保存、完整程序重啟重讀及必要回復驗證，之後才評估採用至研究runtime。這輪沒有正文儲存、發佈或IME；不以原生唯讀畫布取代完整編輯驗收。原例外仍保留未分類。長期免費、整體provider記憶體／CPU、實體裝置與A01–A20仍開放。

Cloudflare請求／部署0；雲端最後驗證仍為2026-11-21T16:52:39.597Z的181／pin16／餘62,344、aa595610相容reader、closed／sealed／pending0、publisher paused。額度低於已量測登出成本，不開完整雲端寫窗、不加額度／退款／清unknown／刪pin／換資源繞過。正式官網與原視覺不變，目標active、PR4 draft。

證據：[配對比較](../../../docs/verification/cloudflare-path-join-comparison.json)、[PHP語義](../../../docs/verification/cloudflare-path-join-semantic-proof.json)、[完整建置](../../../docs/verification/cloudflare-path-join-build.json)、[基準資料](../../../docs/verification/cloudflare-path-join-baseline-data.json)、[候選資料](../../../docs/verification/cloudflare-path-join-candidate-data.json)、[初始分配樣本](../../../docs/verification/cloudflare-path-join-discovery-allocations.json)、[交付審核](../../../docs/verification/cloudflare-path-join-review.json)。
