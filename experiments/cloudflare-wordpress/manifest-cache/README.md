# 已驗證資料清單的 runtime 快取

## 重用同版資料清單，減少 R2 讀取（2026-11-20）

私人 Worker `ef56ff0b-92b8-4969-9463-80f7dfaee1c9` 採用目前runtime的一份已驗證清單快取；完整站點／revision／manifestKey／persistedAt相符才重用，序列化超過256KiB就回到R2，實際初始清單72,949bytes。metadata複製並凍結，新清單只在完整快照與manifest寫入R2後保留，提交前不符合舊pointer。runtime本身也以完整pointer決定是否重建。所有內容／媒體／主題核對、SHA、完整快照與lease仍保留；operator／備份／冷啟動照常讀R2。正式Pages、原視覺、daily來源程式、後台選擇與付費方案未改。

22項快取／快照檢查、TypeScript、dry-run與19段patch／63來源重建通過。基準10次都重新讀清單，候選10次都重用；每輪三次文章鎖及三次內容更新各提交一版，空白請求保持pointer/version。全新登入與相同程式重新部署後的cold讀回精確內容（含尾空白／LF），原首頁不變。warm空白中位數2248→2361ms，沒有穩定改善；warm鎖6031ms（3次）→5465ms（2次），warm內容7030ms（3次）→6499ms（2次），另兩次cold約9.8／9.9秒。樣本少且冷暖不同，不宣稱穩定加速；確定收益是省去每次重複的R2清單讀取。

自有174及子修訂已清理；完整備份 `c48150e9-0e75-4399-93e4-d94e7c908e2b` 校驗297索引，37原canonical檔、15上傳檔、48 metadata及歷史修訂保持一致。副本303／來源175，coherent、無fence、paused；私人閘門保持404/noindex。545個平台事件，outcomes `{"ok": 545}`；0例外、0失敗、0未完成trace。觀測已停，0殘留tail；不是長時間／瀏覽器／全isolate記憶體驗收。

下一步優先核對免費額度、快照儲存成長與保留條件，再接續原生操作、取消診斷及實際交接。這輪沒有UI／實機／新空環境還原，也沒有解決冷啟動延遲。PR #4仍draft、目標active。詳見 `docs/verification/cloudflare-manifest-cache-summary.json` 與 `experiments/cloudflare-wordpress/manifest-cache/README.md`。驗收範圍與限制如下。

## 正確性界線

快取位於現有Runtime物件，僅保留metadata；runtime退休／重建後不依賴舊快取。完整pointer與站點命名空間必須相同。取得canonical lease仍是每次操作的前提，getRuntime也由只比較revision改成比較完整pointer。

冷啟動保留已從R2驗證並用來還原的manifest；保存時照常完整核對canonical／uploads／wp-content與刪除清單。新pack與manifest都已完成寫入後，才把新metadata記入快取。這時runtime.pointer仍是舊值，因此即使提交失敗，也無法以舊pointer取得新metadata；既有錯誤處置會丟棄runtime。提交後cacheRuntime正常提升pointer。超過256KiB會清除舊entry並退回原讀取路徑。

快取內的JSON副本遞迴凍結，避免呼叫端修改來源或取得的巢狀陣列污染比對。7項新檢查涵蓋完整身份、跨站、舊pointer／未提交新pointer、單份替換、UTF-8容量、可變來源／巢狀內容與不同runtime。另15項既有快照測試涵蓋變更／新增／刪除、損毀或缺失R2物件、runtime bytes不符、跨站及完整archive，並非宣稱這些測試涵蓋所有worker分支。

R2本身是強一致；同一key可被有權限的外部操作者覆寫或刪除。本系統每次修訂產生新key，快取依賴這個應用規則，並不會在warm每一請求重新偵測同key的外部變動。冷啟動、operator驗證、備份與還原仍直接讀R2。[R2一致性文件](https://developers.cloudflare.com/r2/reference/consistency/)。未新增永久快取或修改Cloudflare CDN策略。

256KiB是保留的序列化metadata限制，不是全JS物件／暫存序列化配置的精確heap上限。WASM與檔案buffer的診斷也不是全isolate記憶體。執行期時鐘受I/O影響，不能把某個phase時長當成純CPU或R2等待。[Workers時鐘文件](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)。

## 遠端證據與限制

基準與候選各先一個空白暖機，再交替三組空白心跳／原生文章鎖／內容更新，最後全新登入逐位元核對。每次以完整pointer/version驗證該提交才提交，沒有停用原生heartbeat或文章鎖。平台與本機時鐘約差一秒，分類器允許兩秒的下界偏差、依請求種類及順序找唯一trace；若零或多個符合就拒絕，不猜測。每個樣本保留實際event時間及偏差。

十個候選請求都記錄 `canonical.manifest.current.reuse`，沒有重複的 `current.read`；兩個cold請求仍先從R2讀manifest/pack再boot。候選第一次版本7ecc797d-f042-4c5b-a8a1-0a112aa78fab；相同程式再次部署為ef56ff0b-92b8-4969-9463-80f7dfaee1c9後，tail證明第一個原生登入頁為cold，完整草稿與首頁讀回一致。沒有把另一個新帳號／空R2環境還原冒稱為這輪成果。

完整清理後備份解碼4426635bytes、壓縮2292478bytes，SHA `576d5942a9eca892356975143bb994cae4d0fed2526195bccc3779f21c7aae38`。現有原稿、歷史、圖片和metadata均保留，高水位正常上升。私密完整備份、owned guard、cookies、nonce及token不進Git；JSONL只有固定欄位／數值。

新腳本的174已清理，不能刪guard重跑prepare；固定初始版本278與備份revision用來避免誤操作。新的實測必須另建fixture。19段patch／63來源與5工具可從固定upstream重組；之前並行寫入候選仍未採用。這輪沒有重新安裝所有依賴或宣稱全套測試通過。載入器原有direct-eval／重複常數bundler警告未改。

減少R2讀取不能保證未來零費用。快照隨版本累積，下一步需要直接核對專案用量與保留條件；不自行刪除有效備份或啟用付費。仍保留正式站現況，目標active、PR draft。
