# 記憶體調查：未通過正式驗收

此候選建立在automatic-publication基準之上，僅用於私人restore-v1測試區。不要把此實驗部署成正式後台。

診斷以已釘選PHP-WASM3.1.64執行器的內部heap與MEMFS容量，輸出數值而不記錄內容。這些是配置容量，不代表精確的整個isolate實體記憶體總量。d223c010觀察到WASM heap115,998,720 bytes，檔案容量約35.6MB；接著發生Cloudflare記憶體重置。

嘗試將Emscripten20%幾何擴充改成1MiB線性擴充，不更換PHP8.3.36與WASM二進位。fc2b88ef觀察到heap111,214,592 bytes，仍在全域樣式儲存後發生記憶體重置。TypeScript和16項權限／發布檢查通過不能取代這個實際失敗。

重現：先準備security-update與automatic-publication，套用diagnostic-candidate.patch；將本目錄兩個mjs複製到套件scripts/，執行node scripts/playtt-prepare-small-heap-loader.mjs產生src/playtt-php-loader.mjs。僅在私人測試設定啟用PLAYTT_MEMORY_DIAGNOSTICS=true。產生的loader源自GPL-2.0-or-later的WordPress Playground固定版本；建置程式保留完整來源並記錄SHA256，不修改共享node_modules。

遠端語言檔與管理員zh_TW設定已進入R2；初始化外掛已移除，樣式覆寫已清空，但HTTP儲存回應仍失敗。因此不能說整個語系／編輯流程通過。最新私人狀態另有294項校驗備份；正式Pages官網未變更。

已將測試發布器暫停（只停實驗alarm，並非暫停整體使用者目標），以免在已知限制上持續重試。待使用者決定先採本機WordPress編輯／Cloudflare發布，或繼續全Cloudflare後台研究。

後續Cloudflare CLI必須使用本專案獨立的XDG_CONFIG_HOME，避免其他工作改動共用登入範圍。私有登入目錄、token及內容備份不進儲存庫。
