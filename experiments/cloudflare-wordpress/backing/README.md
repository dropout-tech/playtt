# 檔案緩衝區容量診斷

固定12MiB快取之後，以唯讀數字盤點檢查剩餘backing來源。13次完整掃描顯示，一般檔案沒有共用buffer或view背後更大的容量；原本按view長度統計沒有漏掉大量檔案backing。一般檔案實際容量最高8,992,512bytes，核心壓縮資料5,212,074bytes，含核心解壓快取的結構合計最高26,774,768bytes。其他backing仍未歸因；沒有因此宣稱免費限制通過。

## 變更與邊界

只替換隔離建置的`playtt-memory-diagnostics.ts`並新增診斷模組／型別宣告。完整JS SHA為`0ba3efadc2345c2c9bd87113a7c978e9cf98cca7ee0a03ec9d7999ef339bf796`；213個輸入中210個前版輸入不變，75個來源實際載入，5個二進位模組相同。編譯前後prefix/suffix證明差異只在診斷區塊，TypeScript與dry-run通過。核心快取、資料格式、權限與保存邏輯不變，中央runtime與正式站未採用。

盤點先peek壓縮節點，避免讀取會解壓的contents accessor。一般ArrayBuffer view依整個buffer容量去重；PHP heap aliases分開，JS arrays不冒充backing。最多16,384節點／8,192個buffer，超過標記不完整；輸出只有數字、固定分類與最多8筆最大容量，不返回內容、節點、路徑或buffer參照。暫存Map/Set於函式返回後不保留。七項合約涵蓋共用view、跨分類、heap alias、壓縮getter、循環、未知格式、JS陣列、used長度與上限。

第一版建置缺`.d.mts`，TypeScript拒絕；保留該目錄與執行來源，新v2建置補齊宣告後通過。沒有把失敗建置當成已測候選。

## 實際盤點

| 階段 | 完整掃描 | 一般檔案backing | 檔案與核心快取合計 | 檔案已配置但未使用容量 |
| --- | ---: | ---: | ---: | ---: |
| 重啟前 | 9 | 7,950,529–8,992,512 B | 13,162,603–26,774,768 B | 432,956–1,051,452 B |
| 重啟後 | 4 | 7,953,669–8,992,436 B | 13,165,743–26,528,625 B | 432,956–1,063,740 B |

所有掃描complete，unknown／invalid used長度／JS arrays／heap aliases／shared buffers／跨分類共享均0。一般view長度總和等於唯一buffer容量；1450個核心檔維持壓縮。熱機一般檔案中，語言檔約2.50MB、外掛與主題約2.34MB、runtime約1.54MB、temporary約1.38MB、uploads約0.65MB、canonical約0.49MB，其餘未壓縮核心約0.09MB。最大的普通buffer為temporary的1,376,256bytes，沒有數十MB的隱藏capacity。

Observer原本嘗試在掃描事件後追加getHeapUsage，但當時既有週期取樣尚在等待，追加取樣全被busy guard略過。第一版offline audit因沒有這種配對而失敗，失敗來源保留。修正只重新分析既有資料，明確使用掃描後1000ms內第一筆週期樣本，沒有重跑owner或宣稱同步取樣。

13次掃描中11次有符合時間範圍的週期樣本，重啟前延遲4–25ms、重啟後13–16ms；其他兩次保留為未配對。扣除已盤點檔案與快取後，未歸因backing範圍為2,040,445–16,301,558bytes與15,655,807–34,038,187bytes。這個差額包含其他backing及取樣時序，**不是已證明的存活物件、洩漏、垃圾或某個序列化函式**。診斷本身也增加暫存配置與輸出。

整體JS＋backing＋最近PHP的最大非同步組件合計為145,118,601／158,988,274bytes。前者PHP樣本年齡11,068ms，後者455ms；它們不是同步尖峰、RSS或provider限制。瀏覽器時序與前輪不同，不以變小的數字聲稱改善，也不以本機成功推論Cloudflare Free可用。

## 原生保存與恢復

既有cloud181獨立備份的全新本機副本；600秒／1,881,041bytes／96operations，publisher暫停、外連封鎖。限定草稿193原生儲存1,875bytes，SHA `93f8e21c8def8c2d5a6ec9b54d91990b8ef41dadcd847ba4d274da51ba01f39b`，receipt187。LOCAL188／349,973bytes時完整關閉workerd再啟動，資料、預算與同一窗口精確，不重新seed/rearm。

新分頁顯示已儲存、相同文字與11筆修訂；離開編輯器後multipart解鎖兩層200，原生登出302且顯示完成。最終LOCAL191／500,118bytes／30puts，closed／sealed／pending0，terminal39992 exit0，兩埠9568/9569關閉，分頁0。原posts、usermeta、sessions、媒體與主題精確；僅新增revision209和預期draft／lock／sequence差異。304物件／298檔獨立export/import/full materialization核對相同，外連0、runtime exceptions0。

導覽時曾輸入不存在的本機`/__playtt-login`，登入前回404，隨後使用正確入口。命令選單在導覽時開啟，有一筆global-styles/42 GET403／rest_forbidden_context；明確分類保留，其他HTTP錯誤0。沒有放寬權限或宣稱命令選單／歷史Network connection lost已修復。

## 重建與後續

接續core-lru的286項工具前置雜湊，加入8個診斷檔。乾淨組裝840檔，其中832舊檔不變，重套拒絕。既有完成owner不可重播。

```powershell
node scripts/playtt-backing-build.mjs --local --check
node --import tsx scripts/playtt-backing-editor-audit.mjs --local --check
```

新隔離建置用build工具`--local`，固定依賴下執行`tsc -p tsconfig.typecheck.json --noEmit`及`wrangler deploy --dry-run --config wrangler.playtt-session-audit.jsonc --outdir dry-run --metafile dry-run/bundle-meta.json`，輸出存typecheck-private.log／dry-run-private.log，再`--check`。本機原生工具有新owner與固定上限；不部署此診斷版。

下一步檢查請求期間readFileAsBuffer、R2 body、hash及壓縮資料的副本生命週期，先以現有profile與精確來源限定觀測位置，再加有界數字計數。已排除普通檔案隱藏容量，不重跑相同盤點、不盲目放大快取或壓縮其他可寫檔案。manifest256KiB／delta frame1.25MiB的單項上限不等於整個操作的配置上限。

本輪0雲端請求／部署／帳務刷新。正式Pages、原視覺、雲端後台與郵件/DNS設定維持現況；歷史cloud181讀值未刷新。首次繁中初始化、provider記憶體／CPU與長期免費、實機IME／手機、歷史網路例外、A01–A20及交接仍未完成，PR #4保持draft，goal active。

證據：[原生與容量](../../../docs/verification/cloudflare-backing-native.json)、[建置](../../../docs/verification/cloudflare-backing-build.json)、[合約](../../../docs/verification/cloudflare-backing-contract.json)、[組裝](../../../docs/verification/cloudflare-backing-rebuild.json)。
