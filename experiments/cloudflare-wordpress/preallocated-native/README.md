# 預配置候選完整建置與原生保存驗收

2026-11-22（台北）。前輪[冷啟動候選](../cold-boot-preallocation/README.md)現在已完成**完整來源重新建置、繁中原生區塊編輯／保存、完整workerd重啟、登出及獨立備份核對**。正式Pages與原站視覺維持現況；中央runtime仍未採用此候選，雲端未部署。

## 實際建置產物

從固定82個runtime來源、109個vendor檔、9個assets重新組合，只替換已交付的`wordpress-runtime-artifact.candidate.ts`（fd63abb0…），既有研究loader38231012…及WASM不變。205個建置輸入的SHA全部核對；使用既有已安裝套件的junction，**沒有重新安裝依賴**。

TypeScript檢查exit0。Wrangler以`--dry-run`產生真正`src/worker-playtt-do.ts`入口：6模組，五個二進位模組與原版精確一致，JS SHA為`39ea267024d092c5d9f5e11ddfce89d4d4cce946b42f993e1c4640118e308928`。完整JS逐字等於824e974b…原bundle套用兩處已測修改，不含冷啟動barrier、測試gate或觀測wrapper。metafile核對70個實際載入來源，包含候選TS；套件解析沒有偷用中央原TS。

第一次dry-run因同目錄`tsconfig.json`影響編譯輸出，產生額外stdin pump名稱／var差異；保留該產物與log，沒有拿它做原生測試。將同一設定獨立命名`tsconfig.typecheck.json`，讓打包沿用原版設定，第二次dry-run exit0且只剩兩處預期差異。這是編譯設定修正，不是忽略產物差異。型別檢查設定內容未變。

## 原生介面與保存

使用新建的本機R2／DO副本，從既有cloud181獨立備份載入；不請求或修改雲端。本機寫窗600秒／1,881,041bytes／96ops，與先前同類驗收相同；啟用content-gzip-v1、gzip-v1、native-30s-v1及memory diagnostics，**雲端選項仍關閉**。

在實際瀏覽器登入編輯者B，開啟owned草稿193，以原生contenteditable修改第十段繁中內容，點「儲存草稿」。畫面顯示「已儲存」「草稿已儲存」；實際POST回應200、draft、1,875bytes、完整content SHA精確。只收到一次原生保存receipt，版本LOCAL186；保存後快照LOCAL187。這些LOCAL版本不代表雲端已變更。

關閉測試分頁後，停止觀測器並dispose整個Miniflare/workerd；兩個port均證明已關閉，再以相同persist目錄啟動新程序。不重新seed、不重開寫窗，新instance ID不同，全部內容、canonical state及預算逐項相同。新瀏覽器分頁重新開啟原生編輯器，十段內容、已儲存／草稿狀態均正確，修訂由10增為11；冷讀LOCAL188。隨後透過原生登出連結完成登出。

最終LOCAL190、1筆新revision209。原有posts／revisions精確，只有草稿內容、該草稿edit lock、posts新增修訂與自動序號四個資料檔變更。浮動草稿的date隨保存更新，是固定WordPress核心的既有行為；仍要求date=modified、zero date_gmt及其他欄位不變。**全部usermeta回到原值，原登入session保留、這次新增session已移除**。媒體與主題不變。

獨立匯出／匯入304物件、298網站檔案，完整materialization再開啟核對全部內容精確。這還不是把新full-pack交給另一套使用者後台再驗收。charged450,147bytes／27puts、closed／sealed／pending0、外連0、程序exit0；9503／9504已釋放，測試分頁已關閉。

## 錯誤與記憶體界線

兩段觀測共1,711筆sample、226個有記錄的request，runtime exception0、observer error0。初次未經gate的兩個404保留。另捕捉一筆GET `/wp-json/wp/v2/global-styles/42` →403，**error code為rest_forbidden_context**。固定核心`class-wp-rest-global-styles-controller.php:172–176`在edit context且update permission失敗時回傳這個code；這次已能精確分類為該權限分支，沒有放寬權限，草稿仍保存成功。沒有倒推以前未分類的403或連線例外都是同一原因。

| 階段 | samples | 最大可觀測組成合計 | 最大已觀測PHP heap |
| --- | ---: | ---: | ---: |
| 完整重啟前 | 1,174 | 148,001,160bytes（約141.1MiB） | 75,956,224bytes |
| 完整重啟後 | 537 | 149,469,974bytes（約142.5MiB） | 73,400,320bytes |

計算為Runtime.getHeapUsage的usedSize＋backingStorageSize＋同generation最後觀測到的HEAPU8大小；generation／retirement間未知值不補算，也不重加embedder。觀測器每100ms取樣、部分欄位非同步、有取樣開銷，**不是連續尖峰、provider計費CPU／RSS或Cloudflare admission**。本機workerd不強制128MiB限制。完整編輯流程的組成數字仍高於134,217,728bytes，因此不能把前輪單頁冷啟動120.2MiB當成完整免費後台已通過。這輪也沒有和舊版進行同一完整操作路徑的配對，不能宣稱例外已修復或穩定加速。

## 工具與接續

在cold-boot-preallocation組裝後，執行`python install-local-tools.py --runtime <runtime> --apply`加入6工具；核對118個前置工具SHA，不修改中央82來源、20設定或loader。組裝、重套拒絕及新建置準備工具205輸入重算皆已驗證。工具需要既有私人備份／pin／owner，不將它們放進repo。

從runtime目錄準備全新來源目錄：

```powershell
python scripts/playtt-preallocated-build-prepare.py --local --target <new-directory> --candidate <candidate-ts>
```

使用既有鎖定依賴連結後，在新目錄執行`tsc -p tsconfig.typecheck.json --noEmit`及`wrangler deploy --dry-run --config wrangler.playtt-session-audit.jsonc --outdir dry-run-matched --metafile dry-run-matched/metafile.json`，保留typecheck-private.log與退出碼，關閉telemetry。**這是dry-run，不是雲端部署**。驗證工具逐字比較6模組及來源hash，已有plan／proof時只能`--check`：

```powershell
python scripts/playtt-preallocated-build-verify.py --local --build <built-directory> --check
node --import tsx scripts/playtt-preallocated-native-audit.mjs --local --check
```

本機owned run已完成，`playtt-preallocated-native.mjs --local`遇到現有owner會拒絕重跑。請保留原owner／備份／預算，後續不同實驗另立可辨識紀錄。固定native harness以9503／9504執行；control只接受status／mark／saved／restart／cold／finish。介面操作由瀏覽器完成，控制工具不直接改草稿。未公開密碼、nonce、cookie或私人資料包。

中央候選採用仍暫緩：先補損壞ZIP／串流失敗保護案例，定位完整編輯流程剩餘配置並檢查冷啟動後的初始化。不得放寬hash／path／budget guard或以改CMS取代使用者決策。這輪0 provider請求／部署；雲端最後確認仍2026-11-21T16:52:39.597Z、181／pin16／餘62,344bytes，未刷新帳戶計費。沒有提高額度、退款、清unknown、刪pin／歷史、換雲端資源繞過或付費。

完整免費可行性、provider記憶體／CPU、長期使用、實體IME／裝置及全案A01–A20仍未完成，goal active、PR4 draft。證據：[完整來源建置](../../../docs/verification/cloudflare-preallocated-source-build.json)、[原生保存與數字稽核](../../../docs/verification/cloudflare-preallocated-native-audit.json)、[工具組裝](../../../docs/verification/cloudflare-preallocated-native-rebuild.json)、[交付檢查](../../../docs/verification/cloudflare-preallocated-native-review.json)。
