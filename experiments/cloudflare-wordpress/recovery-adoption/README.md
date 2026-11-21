# 復原 pointer 條件更新與完整 HTTP 採用

協調器已採用新版時，R2 current.json 仍可能停在舊版。本候選新增有界讀取與條件式 pointer 更新，將既有採用程序接到實際 HTTP 端點；用真實 177 備份在獨立本機副本完成 177→178 復原。**尚未部署 Cloudflare，正式 Pages／原視覺維持現況。**

## Server 行為

沿用預設關閉的 PLAYTT_RECOVERY_UPLOADS=v1，以及 session-audit scope、restore-v1 分區、default site、probe gate、operator、tracking/window。全部 20 個設定不變。

- GET `/__playtt-recovery/read?key=…&maxBytes=…` 僅讀 default 的已知 snapshot 路徑。raw/base pack 最大 8 MiB、manifest 256 KiB、current.json 1 KiB；在讀流中再次檢查宣告大小與實際長度。回傳原始 bytes 與 ETag，不接受其他 site、runtime、任意路徑。
- POST `/__playtt-recovery/pointer` 接受 operationId、fenceToken、transition。transition 綁定來源／目標 pointer、相鄰版本及原 ETag；目標必須是新 revision。外層續租擁有者 fence，核對當前協調器恰為目標、兩個版本的 commit receipt 精確、兩份 pin 皆存在，再續租後送 Budget。client proof 一律丟棄；Budget 不反向呼叫 coordinator。
- Budget 先確認 R2 current 恰為來源且 ETag 一致，再共用持久 receipt／reservation 流程，以 `onlyIf.etagMatches` 寫入。期間出現第三方更新，R2 拒絕覆寫並留下已計帳的 precondition-failed。已有 ID 只讀回，不重送，也不能改換 ETag／版本／內容。

Server 的 pin 檢查證明 registry 中有這兩個身分，不代替當前相依檔案驗證。完整 client 程序在採用前另走實際 HTTP 讀取，以外部 anchor 驗證完整 base、替換物件與所有內容；現有 pin 不能跳過這一步。協調器與 R2 並非原子交易，partial state 仍須保留與接續，不能宣稱分散式原子切換。

## HTTP transport 與操作紀錄

`createRecoveryHttpTransport` 要求明確 origin、operator、fence 及 loadOperations/saveOperations callbacks，不自行找密碼、開窗、加額度、部署或解除鎖。所有請求固定 origin、不跟隨重新導向；本機只能 http://127.0.0.1，其他需 HTTPS。

先持久保存 planDigest、穩定 operationId、精確 binding 與 identity hash，才送出 HTTP；不把上傳 payload 存入 registry。重啟時驗證 registry 與原 plan 一致，查 receipt 時再核對 key／size／SHA／transition。只有屬於該 registry 且證據一致的 reserved／confirmed 操作才可結清；資料不同就停止。confirmed 可補完成，unknown／dispatching 保留 pending；已確認 not-dispatched 也不偷偷換 ID 重送，需明確新 attempt／window。

正常、已保存但回應遺失與結清失敗可由 receipt 接續。協調器已178、R2仍177時，接續只寫 pointer；已完整178時只驗證，不再採用或寫入。兩邊相同且 pending0 才關窗／封存，最後才解除自己的 fence。保守扣帳不退，歷史／pin 不刪。

## 驗證範圍

93項回歸（包含8個新 pointer/read 情境及17個既有 upload 情境）＋2項 client registry/receipt 測試共 **95項** 通過；TypeScript 通過。新增測試涵蓋來源與目標 receipt/pin、錯誤與倒退版本、假 proof、ETag／R2條件競爭、關窗後結清、unknown保留、跨site讀取拒絕、read stream overrun取消、journal保存失敗不送HTTP及foreign receipt不結清。

實際 outer Worker／coordinator／SQLite Budget／本機 R2，以已驗證的177獨立備份與plain content-v1目標跑5個全新副本。每個都走HTTP transport，並完整停止／重啟 workerd 與重新載入 client registry：

| 情境 | 首輪／接續行為 | 結束 |
|---|---|---|
| 正常採用 | 177→178；重啟後只驗證 | closed／sealed／pending0 |
| 採用後、pointer送出前中斷 | DO178／R2仍177；重啟只續pointer | closed／sealed／pending0 |
| pointer成功回應被換成502 | 讀操作receipt，無重送 | closed／sealed／pending0 |
| pointer完成、結清交易失敗 | confirmed receipt補完成 | closed／sealed／pending0 |
| R2完成後丟出未知結果 | DO及R2皆178仍不能推論結束 | closed／pending1／拒封存 |

**五個副本各432,931 bytes／7 puts**，都保留來源及base兩個fixture pins，新增目標第三個；303目標物件獨立驗證完成。這次是同一完整本機HTTP程序的實測計帳，已取代只有transfer model的證據；仍不是Cloudflare provider成本保證。此數字是容量帳本的R2 payload嘗試計帳，不含SQLite讀寫、R2 metadata與read用量，不等於免費額度或帳單驗證。前四個解除fence，未知結果副本保留待處理狀態後停止程序。此pending1只在本機，不是雲端。

窗口600秒／1,083,839 bytes／96operations，沿用150,000,000總額度設定，但僅是新本機fixture。初始seed不計入本次採用窗口。每個副本只有2→3 pins，沒有宣稱測過live14 pins；本機wrapper在指定邊界丟出例外或替換HTTP回應，不是provider斷電／故障保證。未啟動PHP編輯或驗證native-save後的延遲、整體isolate／CPU。

所有程序結束、外連0、Cloudflare請求／部署0。失敗與成功狀態均保留；未退款、清pending、加雲端額度或刪歷史。

## 重建與接續

接續 recovery-uploads 的已驗證組裝，執行 `python apply-local-candidate.py --runtime <runtime> --apply`。先核對102個既有來源／設定SHA及所有待換檔；本輪2個runtime檔修改、總來源仍82，20設定不變。7個交付檔含helper／tests／scripts。重套於任何改動前拒絕。仍是固定依賴增量重建，非fresh upstream build。

單元測試：前輪85項加 `tests/playtt-recovery-pointer.test.ts` 與 `tests/playtt-recovery-http.test.ts`。全HTTP本機腳本：`node --import tsx scripts/playtt-recovery-adoption-local.mjs --local <新的run-tag>`；需既有private177／converted owners與備份。成功owner為artifacts/playtt-recovery-adoption-first-owned-private.json，勿刪guard或重跑同owner。

下一步先刷新私人Cloudflare的版本、鎖、pins、餘量與Free使用；評估現有授權內僅私有audit Worker的受限部署，完成真正provider的採用／回退驗證，再回到後台延遲與初始化測量。舊碼67dd308不能直接讀目前壓縮清單，必須先用相容reader完成驗證與前進版本採用。雲端最後讀值仍是2026-11-21 14:24:49.947Z：177／pin14／餘1,083,839／closed／sealed／pending0，publisher paused；本輪未刷新，不將本機178當遠端起點。

證據：[完整HTTP本機](../../../docs/verification/cloudflare-recovery-adoption-workerd.json)、[93回歸](../../../docs/verification/cloudflare-recovery-adoption-tests.log)、[2 client測試](../../../docs/verification/cloudflare-recovery-http-tests.log)、[重建](../../../docs/verification/cloudflare-recovery-adoption-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-recovery-adoption-review.json)。完整A01–A20、效能／繁中初始化、長期免費與實機驗收仍未完成。
