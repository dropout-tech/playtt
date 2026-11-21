# 接入前必須完成的工作

以下是尚未實作的整合要求，並非通過紀錄。

1. **辨識與冷讀**：playtt-maintenance-overlay將新schema交給新reader，舊v1/v2/content-v1維持原判斷。worker的readCanonicalRevision、readMarkdownManifest及manifest cache須支援新descriptor。正常讀取與寫入旗標分開，旗標停用仍能讀既有資料。格式未知時拒絕。
2. **決定完整base**：從實際已提交manifest取得一個已驗證full base；不得建立overlay鏈結。從舊content-v1轉入時驗證base位址／bytes／hash；從新格式接續時驗證前一份實際已保存manifest與快取一致，再使用同一full base。每次累積差異必須對full base計算。
3. **避免雙份寫入**：persistPlayttMarkdownObjects目前逐檔hash後直接put。新writer必須有明確的metadata-only規劃模式，待壓縮策略確認後才寫，puts計數不能把未送出的raw寫入當實際操作。上傳與wp-content的raw物件仍供現有資產路徑使用，不能逕行省略。
4. **原子順序與fallback**：先完成壓縮包put，再manifest put，最後才由既有coordinator提交pointer。失敗不能提交、不得退還已嘗試bytes。超出差異／總量／header限制時，先保存並核對所需raw物件，再建立完整ZIP及manifest；不得讓舊full分支讀取從未寫出的raw物件。舊snapshot source重用必須保留逐檔hash驗證及lease序列。
5. **完整備份圖**：snapshot-bundle需保存新壓縮物件、base manifest與ZIP、current manifest，且重建並驗證raw upload／theme replicas供現有資產路徑使用。四物件codec副本不能當正式站可直接運作的完整還原。獨立匯入必須無來源回退；損壞任一依賴均拒絕。
6. **Pins與工具**：server pin需驗證新格式所有依賴，仍將完整base ZIP資訊與受信任current manifest SHA相連。verifiedBackupPin、備份下載／匯入及內容比對工具需同步。既有retention規劃器應繼續拒絕未知格式，不得繞過檢查或刪base／pins。
7. **回退與故障**：以現有完整格式具體materialize並核對全部raw replicas，再做新pointer採用，才可測試舊程式回退；只關壓縮旗標不算轉格式。測試包寫失敗、manifest失敗、回應遺失、完整重啟、舊新格式混合、無變更保存及已超限fallback，不重送已完成的一次性操作。
8. **原生流程與成本**：使用新的本機副本，以真實gate／budget進行登入、偏好、autosave、手動儲存、重啟重開與登出，留足封存餘額。完整manifest仍約74KB；一份累積壓縮包省下的bytes不能直接推估整段流程或長期免費。記錄實際嘗試bytes／puts及失敗，之後才判斷是否有足夠額度做一次私人provider驗證。

始終保留完整WordPress功能、原始資料和使用者的免費限制；正式Pages與目前視覺不切換。沒有新的付費、額度增加、帳本退款或歷史／pin清理授權。
