# 解壓區塊候選的完整原生驗證

精確建置 **14cada693be821b6d4eac703d85422f10a33a1a0dde540ba3c4e31c9a92141e7** 完成繁中原生編輯保存、完整workerd重啟、新分頁讀回、登出及獨立備份。資料驗證通過，但記憶體組件合計觀測仍約197.4／176.0MiB，**免費條件未驗收，候選未採用或部署**。

正式Pages、原視覺、中央runtime、雲端Worker與DNS維持現況，publisher仍暫停，0雲端專案操作，沒有新增費用。全案active、PR #4維持draft。

## 版本與執行邊界

本建置僅替解壓呼叫增加chunkSize，原本精確maxOutputLength、最後長度檢查及512KiB單檔cache上限不變。前輪已核對210項完整輸入、73個載入來源、5個相同二進位模組，編譯JavaScript只有一項選項差異。

本輪沿用前輪原生harness／observer／control，只更換候選、獨立owner／artifact與9558／9559連接埠；另將舊sourceCount欄位更正為真實210項build inputs及73項loaded sources。所有執行工具在啟動前留存SHA，原資料／額度／重啟／恢復斷言保留。

來源為既有cloud181獨立備份的本機複本；publisher暫停、對外連線封鎖，使用固定600秒／1,881,041bytes／96次操作的window，無放大額度、重置帳目、reseed或rearm。

## 原生資料與備份

繁中區塊編輯器單次保存1,875bytes，HTTP200收據與snapshot186的內容SHA一致。離開編輯器釋放鎖後，完整停止workerd並確認兩個埠關閉；新實例於LOCAL188／350,067charged bytes保持相同資料、state與budget。新瀏覽器分頁顯示相同段落、已儲存及11筆修訂；snapshot189一致。

原生登出完成，最終 **LOCAL191／500,211bytes／30puts**，closed／sealed／pending0，程序exit0。原有文章與修訂、完整usermeta／session、媒體、主題及其他內容一致；僅新增revision209及預期草稿／鎖定／序號變化。獨立export／import與完整materialization核對 **304物件／298檔** 精確。

Runtime exception為0，兩次multipart編輯鎖釋放在outer／execution都回200，登出302；lifecycle共708／98事件，沒有截斷或診斷錯誤。HTTP僅一筆登入前預期gate404，其餘沒有錯誤。

本輪依已觀察的頁面清單網址導覽，沒有操作命令選單。前輪global-style403路徑未重測；本輪未出現403不代表權限問題或命令選單已修好，editor權限沒有放寬。

## 記憶體仍未達標

重啟前後各一次壓縮，wall time491／498ms，不是billed CPU。1,450個核心檔案在16次完整診斷掃描中維持壓縮；compressed backing5,212,074bytes，加普通核心檔共5,302,562bytes。最大觀測decoded cache154,228bytes，低於512KiB上限。

| 流程 | JS usedSize | backing | 最近PHP | 合計 | PHP觀測相隔 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 重啟前 |24,559,828|108,362,938|74,055,680|**206,978,446bytes（約197.4MiB）**|5ms|
| 重啟後 |25,175,128|84,631,432|74,776,576|**184,583,136bytes（約176.0MiB）**|6,966ms|

重啟前130筆sample有107筆可配到PHP，重啟後51筆有42筆。合計為同一generation中的非同步組件觀測，不是精確同時尖峰、RSS或provider admission；本機runtime不實施provider限制。不能把這些數字或控制測試的16.83%當成正式免費驗收。

Render／save累計sampled JS為31,319,032／26,024,356bytes，含已回收物件與周邊請求。與前輪的導覽、命令選單、profile頁及heartbeat時機不同，沒有受控的整體改善比例。壓縮檔案持有容量降低，也不代表解壓暫存或其他backing已受控。

## 後續調查與交付

接著需要量出實際核心檔案讀取／decode cache miss的工作集合，包含檔名、次數與位元組數，使用有界本機診斷並標示額外成本。先取得證據再選cache策略或替代解碼器；不能以較小的局部數值宣稱整體記憶體已達標。

另查固定原生one-shot來源：雖然讀取並驗證chunkSize，建立GrowableBuffer時仍使用固定常數，因此不能直接把本候選的chunkSize選項搬過去，就認為避開既知容量增長問題。這是來源檢查，未做新runtime測試或放寬output limit。[固定原始碼](https://github.com/cloudflare/workerd/blob/8ea63498c7aa107995f9b2ffee7789631707e09f/src/workerd/api/node/zlib-util.c%2B%2B#L767)。

接續core-sized組裝：256個前置工具，新增4個，802個舊檔不變，共806檔。程序、Inspector與瀏覽器分頁均已關閉；owner已完成不可重播。只讀重算：

```powershell
node --import tsx scripts/playtt-core-sized-editor-audit.mjs --local --check
node scripts/playtt-core-sized-build.mjs --local --check
```

最後雲端觀測仍2026-11-21T16:52:39.597Z、canonical181、pin16且原15保留、歷史餘62,344bytes、publisher暫停；本輪沒有刷新帳務。第一次繁中初始化、provider記憶體／CPU、長期免費、實體IME／手機、命令選單可用性及原始A01–A20仍開放。

證據：[原生資料／記憶體稽核](../../../docs/verification/cloudflare-core-sized-editor-audit.json)、[工具差異與執行來源](../../../docs/verification/cloudflare-core-sized-editor-adaptation.json)、[原生one-shot來源檢查](../../../docs/verification/cloudflare-core-sized-editor-source-followup.json)、[建置與受控測試](../core-sized/README.md)。
