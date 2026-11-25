# 獨立還原內容與備份保護紀錄

2026-11-20：新建私人 Worker `playtt-wp-free-pin-restore-audit` 與 R2 `playtt-wordpress-pin-restore-audit`，從已驗證備份恢復資料並重新登錄全部保護版本。正式 Pages／原站視覺維持現況；來源 rebuild Worker 仍為 `8536d0cf-cfbf-4133-9764-ae4bbfdd2c45`、canonical 309。本輪只將擴充的 scope 程式部署到新目標，未部署來源後台。

## 已驗證範圍

建立前透過 Cloudflare API 確認目標 Worker／bucket 均不存在。空目標 canonical version 0、無 pointer、pins 0、容量帳本未初始化；publisher paused。23 份完整 archive 全部重新解碼，21 個獨立版本與 registry 一致；所有索引物件及三份核心資產聯集為 396 物件、149,591,427 payload bytes。核心資產上傳後完整下載並驗證 SHA。這是獨立資料／DO／R2 還原，重用了已釘選依賴與核心產物，並非重新安裝依賴。

bootstrap fence 期間列舉新桶並初始化自己的容量帳本，上限 300,000,000 bytes；不複製來源帳本。21 筆 pin 逐筆核對遠端 manifest 與 ZIP SHA 後重新登錄。不可變備份身分相同，registeredAt 是新目標登錄時間；來源 registry 的 hash 保留為來源證據，不能宣稱整份含時間的 JSON 相同。fence 解除後向已核對的空 pointer 還原最新備份 c0ba467c-c422-41e8-861c-64926c69e1fb。

原生 HTTP／REST 比對通過：27 筆 Markdown 內容、2 組 template parts、2 組 navigation、啟用主題 0.2.3、zh_TW 使用者語系、21 筆可由原生 revisions API 讀取的歷史及 15 個媒體 SHA。六頁 HTTP 200 且原 LINE 連結符合備份；匿名草稿頁 404、編輯 API 401。全部 61 筆 archived revision rows 另以最終 archive 逐位元組比對，不把 21 筆 REST 回應當成全歷史數量。

自有草稿 183 使用繁中及尾端換行／空白保存成功。重新部署為 `4c78457f-79a5-4ac6-88f7-9d1ea33f1348` 後，全新登入精確讀回同一內容與原資料；tail 記錄 php.runtime.create。舊編號 181／182 的更新拒絕。核對身分後刪除 183，再建立 185 確認編號不回退；舊 183 更新仍 404。185 與其自有內容也清除，最終完整表比對確認無本輪草稿／子修訂殘留。

最終備份 a5973edf-b478-4a18-b1a0-d26a91c27011：297 索引、4,427,986 decoded bytes、2,292,819 ZIP bytes，SHA-256 `fe598664e7dc2e17c888bf26f0f024d90a76cb5a75f5d619ac17023f7c7cae87`。完整解碼與新 pin 登錄成功，目標共有 22 pins（原 21 + 新 1）。除了登入 session 的 usermeta 與自增計數，166 個原索引檔及 uploads／wpContent 清單完全相同；原 27 Markdown、61 歷史 rows、48 postmeta、15 uploads 均保留。版本 10、來源 309，雙方 coherent／無 fence／paused。外部 admin、media、pins、upload 均 404/noindex。

最終帳本 baseline 149,591,427 + 52 次預留 22,546,616 = 172,138,043 bytes；上限內剩餘 127,861,957。這是該桶應用 put 的保守 payload 上界，不是帳號費用上限；metadata、請求、外部寫入及其他資源另計。沒有退款、重整、刪除舊快照或付費升級。

## 程式與驗證

容量 allowlist 現在只包括來源及新目標的兩個明確 scope，讀寫帳本必須匹配當前 scope；null 毀損狀態不能被初始化覆蓋。pin 端點須啟用有效容量設定。13 容量、10 pin、3 coordinator 測試通過（26），TypeScript 與 dry-run 通過。22 段 patch／65 來源檔及本輪 10 個附加設定／腳本／套件檔重組一致；未重跑整個上游 suite。

直接宣告 yaml 2.9.1，與原已安裝的 transitive 版本相同。離線 lock 更新使用 npm 11.6.2，因宣告要求 npm >=11.16.0 有 engine warning；無關 peer/libc metadata 變動已回復，lock 最終只有根節點直接依賴新增，無版本／integrity 改動。不宣稱新依賴安裝通過。

有限觀察共 848 平台事件，全 outcome ok、0 recorded exception／request failure／未完成 trace。136 traces、282 記憶體樣本，最高 sampled WASM heap 74,842,112 bytes，不代表整個 isolate 記憶體。觀察已停止且無匹配的殘留 tail。HTTP 預期 401／404 拒絕另有證據；平台 ok 不等於每個 HTTP 請求都成功。

## 保留的失敗與修正

第一次原內容比對遇到 stored global styles [] 對 API {}：已讀取隨附 WordPress 核心 REST controller 第 345／349 行，確認其空值轉 stdClass；只修正 REST 比對正規化，archive 原 bytes 未放寬。第二次測試錯猜 LINE 使用 lin.ee，實際備份與 HTML 為 line.me；改成從備份取出精確連結。這兩次尚未建立自有草稿，登入 session 已按正常流程保存；原失敗報告保留。

首次最後備份的 Wrangler 下載退出 1；原 wrapper 忽略 stderr，沒有完整 provider 錯誤。當時已解除 fence，資料夾僅 state、空 objects 與零位元組 manifest。CLI 補上明確的本專案 XDG_CONFIG_HOME。第一次 guarded resume 因零位元組 manifest 存在而被拒絕，另記錄 Node UV_HANDLE_CLOSING 結束訊息；沒有新鎖／寫入，也無殘留程序。最終 resume 嚴格核對舊鎖已解除、canonical 相同、objects 空與 manifest 未完成，保存零位元組失敗檔後繼續，備份成功。既有 guard／失敗紀錄未刪除。

## 操作與限制

這些是固定來源、版本及資源的已完成演練腳本，不能盲目重跑 bootstrap／native create／final backup。先讀各 private guard、實際 canonical／registry 與報告；完成的 owned guard 為 cleanupComplete，最後 fence 為 released。`--resume-before-download` 只支援已核對的首次下載前失敗，不是通用重試；已完成備份會被拒絕。只有未完成的原同一狀態可續接，不可換 guard 迴避檢查。

registry 位於 DO，不包含在 WordPress pack；本輪以獨立匯出與每份已解碼 archive 恢復不可變 pin 身分。私人 export／plan／cookies／tokens／備份內容不進 Git。來源內容內嵌網址刻意保持原 bytes，本次六頁是 HTML／連結檢查，非新目標瀏覽器視覺與所有內嵌資產來源驗收。

來源保留分析仍只提出 300 物件／355,062,939 bytes，safeToApply=false。還需核對所有保留快照、過期 lease 延遲寫入／執行中工作排空與完整根引用，才可評估具體回收。原生 UI／錯誤提示、取消歸因、冷啟動與保存延遲、實機／IME、交接與長期免費運作仍未完成。PR #4 draft、目標 active；正式官網維持現況。

公開證據：`docs/verification/cloudflare-pin-restore-summary.json` 及同前綴報告／去敏觀察。實作透過 `rebuild-candidate.py` 第 22 段 patch 組裝；來源主環境尚未部署此段。
