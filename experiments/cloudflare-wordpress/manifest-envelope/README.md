# 完整清單壓縮接入：本機保存與還原通過

上一輪完整原生流程能保存與重開，但離開編輯器及登出因容量不足收到503；18份完整清單佔charged bytes約71.7%。本階段以明確新格式 `playtt/canonical-manifest-envelope/v1` 壓縮完整JSON清單，保留所有原始路徑、大小、SHA、時間及內容資訊。

只有 `PLAYTT_MANIFEST_ENCODING=gzip-v1` 配合 `PLAYTT_CONTENT_OVERLAY=content-gzip-v1` 才寫新格式；20份既有設定不變。讀取不依賴旗標，讓停用新寫入後仍能開啟舊快照。完整base保持原JSON，沒有新增base鏈。gzip或封套沒有節省時保留原JSON。

封套綁定外層與解碼後 revision／manifestKey／persistedAt，驗證精確長度及兩層SHA。實體清單與解碼清單各上限256KiB，gzip上限192KiB，base64需標準形式；串流解壓超過宣告長度即取消。未知schema、非完整compressed-content資料或身分不一致拒絕。這是新格式界限；既有較大plain manifest的runtime讀取路徑仍沿用原本驗證，沒有宣稱限制整個PHP isolate的記憶體。

保存端在寫入gzip差異前完成清單編碼，再依序保存gzip、manifest，最後由既有coordinator提交pointer。快取保留解碼後的邏輯清單；核對前一版本時先解碼實際保存物件。冷讀、圖片及主題資產讀取、備份圖、server pin、composite pin都已接入。備份信任錨仍是實體物件SHA，獨立副本保存實體封套及完整raw資產，轉舊完整格式時輸出plain manifest。未改retention，不可用它刪新格式歷史或pins。

## 驗證與量測

108項相關檢查與TypeScript通過，其中25項是新格式檢查：損壞／未知資料、兩層SHA、解壓炸彈、大小邊界、無壓縮效益fallback、快取身分、圖片／主題GET與HEAD、備份pin、獨立匯入、完整materialize及實際Worker函式的寫入失敗。

新的一次性本機副本從已獨立驗證的備份161啟動。真正WordPress登入162、REST保存163；刻意遺失成功回應後完全重啟workerd，繁中正文精確讀回；同內容重試164沒有多建修訂。圖片、主題、其他頁面與既有修訂核對一致。獨立備份及完整格式還原通過；關封套旗標後165保存plain compressed-content，再關content writer後166轉full-pack，兩者均完成冷讀。來源7檔於測試前後SHA一致；runtime外連0，程序關閉，127.0.0.1:9471已無listener。

這次清單由74,029降為23,511bytes，節省50,518bytes、約68.2%。gzip內容差異24,868bytes，兩物件共48,379bytes，未包含pointer／coordinator及其他流程寫入。這是實際native HTTP保存，不是整段瀏覽器容量通過。上一輪logout容量失敗紀錄仍有效；新格式尚未做完整browser／gate／budget、provider CPU／記憶體／延遲或長期Free驗收。

測試中的不可壓縮樣本起初仍有淨節省，錯誤預期plain格式；改用確實超過192KiB的隨機JSON字串驗證fallback後通過，未放寬限制。

## 重建及下一步

接續 `compressed-budget` 階段執行 `python manifest-envelope/apply-local-candidate.py --runtime <runtime-cloudflare> --apply`。先核對10個prerequisite、6個變更檔及3個新檔；暫存套patch並核對全部SHA後才寫入。重複套用會在改檔前拒絕。81個來源檔均與測試runtime相同，20設定不變；先前未使用的scheduled helper差異繼續保留並記錄，沒有宣稱全部歷史helper完全一致。

`scripts/playtt-manifest-envelope-local.mjs --local` 是已finished/disposed的一次性測試；不得刪owner guard重送。先前已完成的UI工具直接解析plain manifest，保留作歷史證據，下一輪需建立新工具與owner並使用相容reader。

下一步在新本機Chrome副本跑完整登入、偏好、自動儲存、手動保存、完全重啟、重開、登出及封存。沿用600秒／1,881,041bytes／96操作，量測完整帳本與結束餘額；通過後才評估一次私人provider驗證。舊source實際rollback、實機／IME及完整A01–A20仍待驗收。

本輪零Cloudflare請求、零部署、未付費；正式Pages及現有視覺不變、PR4 draft。最後雲端仍為06:28:14Z的161／pin13／餘1,881,041bytes，未刷新。目標active。

證據：[摘要](../../../docs/verification/cloudflare-manifest-envelope-summary.json)、[原生HTTP](../../../docs/verification/cloudflare-manifest-envelope-native.json)、[測試](../../../docs/verification/cloudflare-manifest-envelope-tests.log)。
