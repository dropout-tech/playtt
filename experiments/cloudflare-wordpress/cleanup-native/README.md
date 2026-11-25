接續：[Ajax權限控制與私人heap持有分析](../ajax-retained/README.md)已取得證據；舊400未倒推歸因，完整編輯記憶體仍待定位。

# 合併啟動清理候選的原生保存驗收

2026-11-22（台北）。[boot-cleanup候選](../boot-cleanup/README.md)已完成實際繁中區塊編輯、保存、完整workerd關閉重啟、新分頁重讀與登出；獨立備份及完整materialization逐項核對。**內容保存／重啟資料驗收通過，但一筆Ajax400尚未解釋，完整編輯記憶體也未符合免費可行性驗收。** 正式Pages／原視覺不變，中央來源未採用候選，雲端未部署。

## 實際執行與保存

使用上一階段83來源／206輸入、型別檢查與dry-run通過的真正六模組產物。JS SHA為`cb9302a8b57c9bc3db16304cb3ad995b793eab543a759a4f7b9bfdb4800e0de5`，與五個二進位模組在前後核對均相同。**沒有使用535d4502…生命週期觀測副本**。外層本機wrapper只處理驗收入口、數字receipt／request紀錄及本機R2 storageClass適配，沒有改內部WordPress bundle。

從既有cloud181獨立備份建立新本機R2／DO；不是修改cloud181。600秒／1,881,041bytes／96ops界線與前輪相同，啟用本機gzip／heartbeat／memory診斷選項，publisher暫停、外連禁止。

實際Browser登入編輯者B，開啟owned草稿193，在原生iframe的第十段contenteditable填入繁中內容，點一次「儲存草稿」。畫面顯示「草稿已儲存」，實際POST200、draft、1,875bytes和完整SHA相同，receipt LOCAL186、保存快照LOCAL187。

關閉原分頁後dispose整個Miniflare/workerd，核對9507／9508關閉，再從相同persist目錄啟動不同instance。canonical state、全部網站資料、預算精確，沿用同一寫窗，沒有reseed／rearm。新分頁冷讀十段內容、已儲存／草稿狀態及11筆修訂，LOCAL188。最後透過DOM中的原生登出連結登出，畫面顯示「你已完成登出。」。

最終LOCAL190，新增revision209；只有owned草稿、其edit lock、posts新增修訂與auto-increment共4個檔案變更。原有posts／revisions、全部usermeta／session、媒體、主題及其他內容精確。此次新增session已移除。獨立匯出／匯入304物件、298網站檔案，full materialization重新開啟比較精確；仍未另以另一套使用者後台驗收這份full-pack還原。

charged450,169bytes／27puts，closed／sealed／pending0、外連0。程序terminal exit0，兩個port釋放，測試分頁均關閉。沒有增加額度、清理未知ticket或刪原紀錄。

## 錯誤與記憶體

觀測共1,445筆samples、226個request，runtime例外0、observer錯誤0；這不表示所有HTTP皆正常：

- 一筆GET `/wp-json/wp/v2/global-styles/42` →403／`rest_forbidden_context`，對應固定核心edit-context更新權限分支，未放寬權限。
- 一筆logout階段Ajax POST→400。原紀錄沒有action／回應code，**原因及功能影響尚未證明**。不能只憑發生時間就歸因heartbeat、登出競態或視為可忽略。下一次聚焦診斷須只捕捉有界action分類與error code，不記nonce／cookie／完整request body。

| 階段 | samples | 最大可觀測組成合計 | 最大觀測PHP heap |
| --- | ---: | ---: | ---: |
| 重啟前 | 950 | 150,431,007bytes（約143.5MiB） | 75,956,224bytes |
| 重啟後 | 495 | 152,684,767bytes（約145.6MiB） | 73,400,320bytes |

合計方式仍為CDP usedSize＋backingStorageSize＋同generation最後觀測HEAPU8；未知generation區間略過，不重加embedder。100ms取樣有開銷且欄位非同步，本機workerd沒有強制Cloudflare128MiB限制。數字不是連續／provider尖峰、RSS、計費CPU或admission，也不是與前輪嚴格配對的效能結論。**啟動清理修正未解決完整編輯記憶體問題**；下一步仍需定位live JS／ArrayBuffer配置及PHP heap，而非提高上限或移除CMS功能。

## 失敗紀錄與交付界線

第一個本機啟動在browser-ready之前出現`fetch failed`，terminal exit1且程序已dispose；當時沒有捕捉cause，不能宣稱已證明sandbox是原因。保留原owner／輸入／log。第二次使用允許本機程序與loopback連線的執行權限，加入初始化stage／cause診斷後完成上述流程，未重跑第一個owner。

第一版離線audit預期只有403／gate404，因實際Ajax400而失敗；原audit與失敗紀錄保留。修正版明確要求並報告該一筆未解釋400，**只判定資料流程通過，沒有改成所有HTTP健康**。登出文字parser初版只接受其他繁中措辭，已用新DOM讀取核對實際「你已完成登出。」並保留初版false紀錄。

工具接在boot-cleanup組裝後，以 `install-local-tools.py --runtime <runtime> --apply` 加入4個local工具，核對132個前置工具hash。678個既有檔案不變，重套拒絕且不改檔。中央82來源、20設定、loader及generator均不變。這是既有鎖定依賴與私人資料的重現流程，沒有重新安裝依賴。

從runtime目錄唯讀重算：

```powershell
node --import tsx scripts/playtt-cleanup-native-audit.mjs --local --check
python scripts/playtt-boot-cleanup-build.py --local --build <boot-cleanup-build> --check
```

本次v2 owner已完成，native runner遇現有owner會拒絕。control只接受status／mark／saved／restart／cold／finish；不直接修改草稿。保留原成功／失敗owner與預算；不同實驗使用新的可辨識紀錄。

本輪0 provider請求／部署／帳戶計費刷新；最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、餘62,344bytes、publisher暫停。不得由LOCAL190推論cloud已改變。無付費、cap增加、退款、unknown clearing、pin／歷史刪除或替代雲端資源繞過。

全案A01–A20、provider記憶體／CPU、繁中首次初始化、長期免費與實體IME／裝置仍未完成。PR4維持draft，goal active。證據：[資料與記憶體稽核](../../../docs/verification/cloudflare-cleanup-native-audit.json)、[保留的失敗與更正](../../../docs/verification/cloudflare-cleanup-native-failures.json)、[工具組裝](../../../docs/verification/cloudflare-cleanup-native-rebuild.json)、[交付檢查](../../../docs/verification/cloudflare-cleanup-native-review.json)。
