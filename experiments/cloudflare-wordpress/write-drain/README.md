# R2 寫入排空與持久封存

2026-11-20：私人還原目標 `playtt-wp-free-pin-restore-audit` 已部署 `ec71d3b3-9052-4a7f-a8ec-a80a8685552f`，在既有容量帳本增加未完成操作追蹤。來源 rebuild 仍為 `8536d0cf-cfbf-4133-9764-ae4bbfdd2c45`／version 309；正式 Pages、原視覺、daily 來源與付費設定維持現況。

## 要解決的問題

原本的 lease 到期會拒絕舊工作提交 canonical，但不會取消已經送到 R2 的請求。本機測試讓 put 延遲、令 lease 到期，再取得 fence；舊 put 仍可完成，舊 commit 則被拒絕。這證明「已有 fence」不能單獨證明所有儲存請求排空，不是已觀察到正式內容遺失。Promise.all 的其中一項先失敗時，其他寫入也可能繼續。

## 實作

以 `PLAYTT_R2_WRITE_TRACKING=v1` 明確啟用。現有容量 DO 在同一筆 transaction 中預留 put bytes 並持久加入隨機 ticket，才回傳版本化證明。應用核對 schema、操作類型、ticket、bytes 與有效上限後才送 R2。delete 也要 ticket，但不增加 payload 或 put 計數；未知 streams／multipart 仍拒絕。主程式、PHP execution 與 coordinator 的 bucket wrapper 使用同一個帳本。

R2 確認成功或 conditional miss 後才結清 ticket。R2 拒絕／回應不明、reservation 回應遺失、程序中斷都不靠時間清除 ticket。若 R2 已確認成功，後續結清回應失敗不把已寫入的 current pointer 人為變成失敗；保留原成功結果、記錄去敏診斷，而可能仍開啟的 ticket 繼續阻擋清理。重送同一 ticket 的結清不影響其他操作。

封存取得與 reservation 走容量 DO 同一條序列佇列。只有 pending 為0才能封存，之後新的 put／delete reservation 一律拒絕。封存**沒有 TTL**，重新部署或 coordinator fence 到期也不自行開放寫入，須持有人明確解除。同一 drain token 重送取得為冪等，錯誤持有人解除為409。status 不輸出 drain token 或未完成 ticket 身分。

每個帳本最多128個未結清操作；達上限即拒絕新增，避免 journal 無界成長。沒有 force-clear、時間到自動結清、帳本重置或退款。已啟用的持久標記會拒絕舊協定，即使新程式漏設 flag 也不能退回未追蹤 put／delete。此保護不能控制外部 R2 CLI、其他綁定客戶端或真正的舊程式；不可直接降版到未追蹤版本。

## 私人部署與驗證

啟用前核對這個新建、僅本任務操作的目標仍為 version10、22pins，容量 bytes／52次put與上一輪最終報告相同。全部已知上傳、原生操作與觀測均有完成證據，無殘留觀測程序；在 execution 序列佇列取得 fence 後再部署、核對 `trackingConfigured:true`、初始化 journal，才解除 fence。`legacyWritersDrained:true` 是此遷移的明確操作前提，不是程式能替任意舊桶自動證明的事；單靠 lease 到期不足以升級。

新版本以自有草稿186保存繁中與尾端空白。取得封存後刻意解除 coordinator fence，再嘗試更新：實際 HTTP503／`playtt_storage_capacity_unavailable`，完整 canonical pointer/version13 與容量帳本不變。這次拒寫由 R2 seal 生效，不是一般 fence 提早擋下。

保持 seal 重新部署後，pending仍0、seal仍存在；原 token 重送取得不改資料，錯誤 token 解除409。正確解除後全新登入，原草稿內容精確相同，恢復保存成功，再核對身分清除186及子修訂。最後 version16、coherent、無fence、未封存、pending0、publisher paused。原生 DELETE 清理是 WordPress 資料操作；延遲的原始 R2 delete 排空情境在本機測試，不宣稱遠端注入過。

完整備份 `8a06b16e-fe6c-428f-9785-3caf79d056a6` 校驗297索引、4,428,372 decoded bytes、2,292,918 ZIP bytes，SHA-256 `61e24cb340793ae8e50bd66e05942a46f1d0bc7ddeda3f9c0ddc7ebee189d24a`。新的第23個pin登錄成功，原22個pin的不可變身分仍全數保留。只有登入 session metadata 與自增計數改變；166個其他原索引檔、27筆Markdown、61筆歷史、48postmeta、15媒體與主題清單比對一致。外部 gate 仍404/noindex。

本機16項排空／13容量／10pin／3coordinator，共42項通過，涵蓋延遲put/delete、重啟、回應遺失、平行寫入先失敗、舊協定／壞證明拒絕、上限rollback、conditional miss與毀損狀態。TypeScript、dry-run與23段patch／66來源檔／6附加檔重組通過。沒有重新安裝依賴或宣稱整個上游suite全過。

有限觀察226平台事件全outcome ok、0exception、0結清回應失敗。包含刻意503的一次 request failure 與一次未完成trace；不是零失敗聲明。最高sampled WASM heap為71,958,528bytes，非whole-isolate memory。觀測已停止且無匹配的殘留tail。延遲與回應遺失故障是在本機注入，遠端驗證封存拒寫、持久化與恢復。

兩次遠端內容保存為7390／6968ms，只有兩個不同冷暖條件的樣本，不宣稱穩定改善。每次成功R2操作增加一個結清DO呼叫，需持續評估延遲與操作額度。最終payload帳本為149,591,427 baseline + 37,709,294 charged =187,300,721／300,000,000bytes，83次put。這不是共享帳號費用上限，亦無退款或回收空間。

## 操作與仍需完成的條件

端點沿用私有 `POST /__playtt-capacity`，須 operator 身分與目前有效的 `fenceToken`。actions為 `initialize-write-tracking`、`acquire-write-drain`、`release-write-drain`；後兩者還需先在private guard保存的UUID `drainToken`。初始化另需明確確認legacy writers已排空。端點不暴露內部 ticket settle／force-clear。

正式清理流程仍未實作。本輪只補齊受追蹤R2寫入的排空與封存條件；清理還需完整roots、保留快照內容、所有外部writers邊界、確切刪除清單及安全帳本重整。現有planner仍 `safeToApply=false`；沒有刪除R2舊快照。journal、seal與容量ledger不在WordPress restore pack內，復原時不得拿舊ledger覆蓋新桶。

如果出現未結清操作，保持拒絕清理並先核對實際結果，不能清空journal或等待TTL。可驗證的故障對帳／恢復工具仍待實作。初始化只適用已證實排空的升級窗口，或全新且明確完成bootstrap的目標；不可對任意線上舊桶聲稱安全。已完成的audit與備份腳本均有private guard，不可盲目重播。

下一步核對所有保留pack與完整引用，再完善未結清操作對帳；原生UI錯誤提示、取消歸因、冷啟動與保存延遲、實機／IME及長期免費驗收仍待。正式官網維持現況，目標active、PR #4 draft。證據在 `docs/verification/cloudflare-write-drain-*`。
