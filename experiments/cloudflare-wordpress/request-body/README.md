# 未完成請求與原生連續編輯

私人研究候選，部署於獨立 audit Worker `playtt-wp-free-restore-audit`，版本 `f7cc0a9b-5772-45ff-8bda-09daab55312a`。正式 playtt.tw 保持 Pages，原來源 Worker 仍為 a33083f3；不切換後台，不增加費用。

## 已證實的本機問題

上輪原生驗收留下了一筆 mutation 未完成、丟棄執行器，之後同一 tail 事件封裝出現冷讀取。事件封裝可包含多次操作，不能據此斷定它們是同一個 HTTP 請求或自動重試。原紀錄沒有錯誤類別，因此歷史遠端根因仍未證實。

本輪將 `request.translate` 與 `request.php` 分開觀測。本機對 admin-ajax 發出宣告 2048 bytes、只傳部分內容的 POST，1.2秒後斷線。舊順序先取得 canonical lease、沿用 PHP 執行器、清空變更追蹤，才等待 body；body 接收失敗便 abort lease 並丟棄執行器，下一次正常讀取冷啟動。PHP 其實尚未執行。

修正為先接收完整請求，再取得 canonical lease、初始化變更追蹤及執行 PHP。body 讀取失敗轉為不含原始錯誤／內容的 `RequestBodyReadError`，回傳400及no-store。既有執行器與已提交資料不受觸碰。完整 multipart、JSON、二進位 payload 保持原 bytes，GET/HEAD 不讀 body，空 POST 保留零長度 payload。正常 PHP／持久化錯誤仍走原本清理並拋錯，沒有一般性的自動重試或忽略保存失敗。

固定類別診斷只記錄 endpoint 類別、HTTP method、失敗階段、runtime狀態及布林值；不寫出 URL、headers、cookies、PHP錯誤全文或內容。更新的 sanitized tail 腳本擷取這些欄位。

## 驗證結果與限制

- 八項單元測試及 TypeScript 通過，涵蓋傳輸位元組一致、未完成 stream 不可回傳部分內容、GET/HEAD/空POST語意，以及診斷隱私與階段辨識。
- 正常本機七筆發布批次通過，合併發布21.970秒；原頁面與共用頁尾還原、測試頁刪除、發布器paused，整體程序exit0。
- 本機斷線前後紀錄顯示：修正前 lease abort／runtime dispose，修正後在request.translate失敗、runtime not-used、未取得lease，下一次讀取開始時runtime warm。然而兩次故意斷線都讓既有Wrangler本機工具以Network connection lost退出，未完成最後讀回，所以**不是完整本機斷線回歸通過**。保留 `cloudflare-request-body-local-interruption.json`。
- 私人遠端一次未完成 heartbeat 斷線後，canonical指標／版本完全一致，接續登入頁200，發布器paused。但該次tail未捕捉request-body-unavailable，可能未進入PHP Worker；本次僅證明有限傳輸中斷沒有改資料，**不能宣稱重現了歷史遠端中止**。後續原生操作的固定類別紀錄可提供更直接證據。

## 重現方式

先套用既有候選至 `snapshot-latency/snapshot-source-candidate.patch`，再套用本目錄 `request-body-candidate.patch`。三個來源檔重建雜湊見 `cloudflare-request-body-reproduction.json`。測試放入runtime/tests，腳本放入runtime/scripts；保持固定相依版本及共享node_modules不變。

`playtt-aborted-body-local.mjs --local --label=<標記>` 只允許127.0.0.1:9429；預期目前本機工具仍可能退出，需保留有限證據，不能自行重試直到得到想要的結果。`playtt-aborted-body-remote.mjs --remote` 只允許私人audit網址，僅一筆部分heartbeat，要求發布器paused，不登入WordPress、不改文章，核對canonical狀態不變。私密入口token僅來自本機秘密檔。

`playtt-native-continuity.mjs --remote --mode=capture|reads|verify|cleanup --round=1|2|3` 只接受本輪原生UI草稿的固定獨有標題及三份已知段落。capture保存本機身份基準，reads進行120次有限REST讀取並定期檢查同草稿及autosaves，verify核對指定版本，cleanup僅刪除ID／標題／內容皆相符的本次草稿。每步核對原七個已發布頁面雜湊及paused，不把REST讀取本身當成原生自動儲存證明；需另有UI及tail證據。

本輪仍不代表長期營運驗收；歷史遠端中止根因、舊auto-draft清理、舊編輯分頁操作與交付仍需釐清；後續ID重用修正見id-sequence目錄。未將有限通過等同免費WordPress已可正式切換。

## 連續原生編輯結果

2026-11-17 完成：原生繁中建立草稿106、第一版手動儲存、第二版不點儲存而由WordPress自動儲存、第三版於重建後手動儲存，再重載同一草稿顯示第三版與兩筆修訂。保持編輯器開啟時的120次REST讀取全部完成，定期讀回版本序列為2、2、3、3、3、3；autosaves API回傳空清單，但草稿主內容確實更新，且UI曾顯示正在自動儲存及已儲存。不能將沒有獨立autosave列解讀為沒保存。

完整觀測區間有955事件封裝，954ok、1canceled，無exceptions、無未完成phase、無request-failure類別；捕捉三次釋放，每次98個PHP request.end，最大觀測WASM 78,905,344bytes，非isolate總記憶體。事件區間也包含受控斷線；不宣稱每筆取消的原因已知。原七頁雜湊不變，測試草稿清理完成，publisher paused。

另一本機測試確認冷啟動重用已刪除ID，詳見../id-sequence/README.md。這是當時新發現的保存缺陷；後續修正與本機／遠端回歸詳見id-sequence/README.md。整體WordPress後台仍不可視為驗收完成。
