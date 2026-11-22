# 核心壓縮的完整後台驗證

固定原型已接入隔離完整建置 `ed725b8e4a79b26af5b3f22351dd5e2bc850ce9bfbf440ec0f9fff8a7a9b864a`。繁中原生保存、完整 workerd 重啟、新分頁讀回、登出及獨立備份通過；核心檔案維持壓縮，但整體記憶體觀測仍過高。**此候選未採用至中央 runtime、未部署，免費驗收仍未通過。**

正式 Pages 與原視覺、雲端 Worker、DNS 及 publisher 維持現況，沒有新增費用。全案目標 active，PR #4 保持 draft。

## 完整整合

沿用已驗證的原生 Base64 建置 0f9d3340e 的208項輸入，只更動 worker 啟動點及記憶體診斷兩個檔案，新增原型模組與型別宣告，共210項。原型 SHA 保持 `3a72305b1edfa3e222644084777d018e3727b2d7f5730acd930182400b24a93a`，保留上一輪22組 PHP 語意及16組 workerd 解壓邊界證據。

壓縮接在 WordPress 啟動修補及核心容量整理之後。診斷掃描先讀壓縮 metadata，避免直接 contents 存取觸發解壓；檔案容量與 decoded cache 分列。Inspector 的 backing 已包含兩者，不能再把診斷值加上去。快取上限512KiB。

TypeScript 與 Wrangler dry-run 通過，實際載入73個來源，5個二進位模組不變，中央82個來源不變。首次本機建置因 sandbox 拒絕建立依賴 junction 而未啟動 TypeScript；保留環境失敗紀錄後，在授權的本機權限下建置成功。沒有發布雲端版本。

## 診斷與真正檔案系統

9組新整合檢查涵蓋原有普通檔案／WASM alias／循環／未知節點行為、真正 PHP corpus、壓縮計數、重複掃描、首次與未取樣請求、after-persist 掃描及直接存取後的還原計數。全部2,154檔讀回 SHA／長度一致。

此 corpus 尚未套完整 boot patches；其1,449壓縮檔數與原型證據相符。以下完整後台則在 boot patches 後有1,858個核心檔案，其中1,450個可壓縮，不能混用兩組計數。

## 真正原生保存與恢復

沿用前輪有界 harness，只替換候選身份、獨立本機連接埠9554／9555與artifact名稱，observer另加有界數值欄位。啟動前保存實際執行工具的SHA。複製既有cloud181備份，publisher暫停、對外連線封鎖，固定600秒／1,881,041bytes／96次操作，無放大額度或重新開窗。

瀏覽器以既有 editor 登入，原生區塊編輯器保存1,875bytes繁中內容，HTTP200與snapshot186收據相符。離開編輯器後完整停止workerd，核對兩個埠已關閉；新實例在LOCAL189／400,149charged bytes繼續使用相同資料與額度，沒有reseed或rearm。新分頁顯示相同內容、已儲存及11筆修訂；snapshot190精確。

原生登出完成，最終 **LOCAL192／550,306bytes／33puts**，closed／sealed／pending0，程序exit0。相較前輪多一個heartbeat保存版本；未把不同操作時間的額度當作效能比較。原文章／修訂、完整usermeta與原有session、媒體及主題均精確；只新增revision209與預期的草稿／鎖定／序號變化。304物件／298檔的獨立匯出、匯入與完整materialization一致。

Runtime exception為0，兩次編輯鎖釋放在outer／execution都回200，登出302。Lifecycle共769／116事件，沒有診斷截斷或錯誤。

另記錄一筆 editor 讀取 `/wp-json/wp/v2/global-styles/42` 的403 `rest_forbidden_context`，發生於命令選單出現後。固定核心controller確認該錯誤來自未獲准的edit context；沒有修改權限，也未證明瀏覽器initiator或完整命令選單可用性。最初離線稽核因本次比前輪多一筆HTTP錯誤而停止，原稽核保留；調整後明確驗證並呈現403，沒有重跑或更改原生觀測。另一筆404為登入前的預期gate回應。

## 記憶體結果：候選未達標

重啟前／後各壓縮一次，耗時505／489ms（本機wall time，非billed CPU）。1,450個壓縮檔共5,212,074bytes；加普通核心檔，核心file backing為 **5,302,562bytes**。17次完整診斷掃描與保存讀回均維持壓縮，最大觀測decoded cache154,227bytes，未超過512KiB。

但相同generation內，JS usedSize＋backingStorageSize＋最近PHP的組件合計最高為：

| 流程 | JS | backing | 最近PHP | 合計 | PHP觀測相隔 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 重啟前 | 33,060,876 | 158,065,921 | 71,958,528 | **263,085,325bytes（約250.9MiB）** | 3ms |
| 重啟後 | 31,475,932 | 110,144,214 | 74,776,576 | **216,396,722bytes（約206.4MiB）** | 9ms |

184／67筆sample中，有144／57筆可配到PHP觀測。這些仍非精確同時尖峰、RSS或provider admission，本機runtime不實施provider限制。讀值已足以說明：核心檔案的結構容量節省，沒有解決本次完整流程的記憶體問題。正式免費運行未驗收，不能宣稱優化完成。

Render／save累計sampled JS為23,083,020／26,894,184bytes，包含已回收物件與周邊請求，不是retained size。Backing在流程後會下降，但不能僅憑下降判定GC原因或哪些解壓buffer被保留。原生 zlib info stream path、單檔快取與重複讀取是後續調查對象；目前未隔離其因果。此次有額外命令選單讀取、profile頁與不同heartbeat時間，不是與前輪的受控效能比較。

## 重建、證據與下一步

接續 compressed-core 組裝，核對243個前置工具，新增6個工具，789個舊檔不變，共795檔。完整建置及離線稽核指令：

```powershell
node scripts/playtt-core-integrated-build.mjs --local --check
node --import tsx scripts/playtt-core-integrated-editor-audit.mjs --local --check
```

新環境先以build工具的 `--local` 建立隔離輸入，再在該目錄沿用固定依賴執行 `tsc -p tsconfig.typecheck.json --noEmit` 與 `wrangler deploy --dry-run --config wrangler.playtt-session-audit.jsonc --outdir dry-run --metafile dry-run/bundle-meta.json`，將結果保存於對應private logs。這裡的dry-run不發布。

目前owner已完成、sealed、disposed，不可重播。下一步先用有界的實際workerd控制，隔離重複解壓／stream暫存與快取行為，再選擇是否改解碼器或快取。維持精確位元組、長度與超長拒絕測試，不能為了通過而改動資料保存或放寬權限。不要在未變更程式與假設前重跑相同完整UI流程。

本輪0雲端專案請求、0部署、沒有刷新帳務。最後雲端觀測仍2026-11-21T16:52:39.597Z：canonical181、pin16且原15保留、歷史餘62,344bytes、publisher暫停。第一次繁中初始化、provider記憶體／CPU、長期免費、實體IME／手機及A01–A20仍開放。

證據：[完整建置](../../../docs/verification/cloudflare-core-integrated-build.json)、[診斷比較](../../../docs/verification/cloudflare-core-integrated-diagnostics.json)、[原生資料／記憶體稽核](../../../docs/verification/cloudflare-core-integrated-editor-audit.json)、[原型與固定解壓來源](../compressed-core/README.md)。
