# 免費配額與快照保留分析

最新：本文件記錄較早的唯讀盤點；後續已在私人 rebuild 啟用容量預留與拒寫，見 [容量保護](../storage-capacity/README.md)。清理仍未啟用，下列舊版物件候選必須重新盤點，不能直接執行。`read-inventory.py --list-only` 只產生總量所需物件表、不讀 metadata roots，不可作保留分析。

2026-11-20：完成帳號用量核對、私人桶完整物件盤點與離線保留分析。**尚未啟用清理、寫入容量限制或新排程**，沒有部署程式、刪除物件、升級方案或切換正式後台。私人 Worker 仍為 `ef56ff0b-92b8-4969-9463-80f7dfaee1c9`；正式 Pages 與原品牌視覺保持現況。

## 實際用量

已登入 Cloudflare 控制台顯示 Workers **Free / $0 / Current plan**。R2 當期 October 25–November 25 的費用仍為 **$0.00**，Class A 約 5.21k、Class B 約 51.1k、總儲存 1.61 GB。REST 帳號總量為 1,613,497,073 bytes（含 metadata），四個 playtt 桶的延遲指標合計 1,454,925,316 bytes。帳號總量包含其他專案，沒有操作其他專案資源。

Workers 當日計數為 587 / 100,000（UTC 日）。Durable Objects 控制台同一帳期顯示 1.79k GB-sec、14.32k requests、299.01 kB SQL、12.28k rows read、9.48k rows written、0 B KV。這是畫面顯示的帳期統計，不能當成精確的當日配額讀數。舊測試部署的錯誤仍在歷史統計內；本輪沒有重新測試 runtime 穩定性。

R2 Standard 免費額度為每月 10 GB-month、100 萬 Class A、1,000 萬 Class B；儲存按帳期每日峰值平均計算，不能把瞬間低於 10 GB 當作零費用保證。Infrequent Access 不適用免費額度，未切換儲存類別。[官方 R2 計費](https://developers.cloudflare.com/r2/pricing/)。Workers Free 每日 100,000 requests；SQLite Durable Objects Free 的每日配額為 100,000 requests、13,000 GB-s、500 萬 rows read、100,000 rows written，SQL 總量 5 GB，超額操作會失敗。[Workers](https://developers.cloudflare.com/workers/platform/pricing/)、[Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/)。

R2 指標有延遲：GraphQL 的 rebuild 桶樣本時間為 02:10 UTC，顯示 936 物件、521,514,722 bytes（含 metadata）。02:59 UTC 的實際 REST 分頁列舉取得 **1,086 物件、625,679,206 payload bytes**。後者包含 216 個完整快照、495,454,100 bytes，占 payload 約 79.2%；不是儀表板漏算或費用增加的直接證據。所有列出的物件均為 Standard。

| 類別 | 物件數 | payload bytes |
| --- | ---: | ---: |
| 完整快照 ZIP | 216 | 495,454,100 |
| canonical manifests | 216 | 15,796,842 |
| canonical content objects | 517 | 16,151,976 |
| uploads | 16 | 653,662 |
| wp-content | 111 | 3,310,045 |
| runtime archives、pages、current pointer | 10 | 94,312,581 |

最新快照為 2,292,478 bytes。若假設每小時 60 次或 240 次真正的 canonical 變更，且每次維持這個大小，單計 ZIP 就新增約 137.5 或 550.2 MB／小時；每天一小時、持續 30 天且不清理，期末新增約 4.13 或 16.51 GB。這是情境計算，**不是實測編輯頻率、GB-month 或費用估算**，尚未計入新內容／媒體／manifest。原生文章鎖更新會變更資料；不能用停用鎖或略過保存來解決容量。

## 離線保留候選

`plan_retention.py` 沒有網路、刪除或 apply 模式，永遠輸出 `safeToApply: false`。候選規則為：保護目前完整 pointer、publication／job 引用、快取頁面所屬 revision、已校驗的本機備份；另保留最近 24 小時全部修訂、最新 20 版及最近 7 個 UTC 日每天最新一版。

本次重新核對本機 21 份備份 ZIP（20 個不同 revision）的 SHA 與報告及遠端 manifest 相符。候選保留 66 版，將 150 個舊 manifest 與各自未共用的 ZIP 列為**待審查範圍**，共 300 物件、355,062,939 bytes。沒有列入 content objects、圖片、主題、runtime 或 publication artifact，也沒有執行刪除。實施後被退休的整站版本將不能再直接使用，原生文章歷史需由保留的完整快照維持，須在真正清理前做還原驗證。

這份清單不能直接餵給刪除工具：20 個本機備份不代表完整 pin 登錄；分頁與 JSON 讀取不是原子快照，也沒有取得所有 DO 執行中工作的引用。未找到 publication／job 物件只描述本次私人桶，不能推論未來不會出現。完整物件大小檢查不等於全部 R2 ZIP 的內容 SHA 校驗。

真正清理前需先完成持久化的寫入容量預留及拒寫處理，再以可續期 fence 排空執行中工作、核對全部 references／pins、重新列舉並確認 current pointer，驗證保留快照及獨立還原，產生確切清單。未知 schema、遺失的 metadata／pack、跨站引用、重複物件或不明 pack 都拒絕產生候選。共用 pack 只要被一個保留版引用就留下。不能套用「所有 ZIP 超過 N 天就過期」的桶規則，因為目前版本可能長期沒有編輯。

下一步優先實作私人測試範圍的容量預留／超限拒寫，驗證失敗與中斷不破壞上次提交。帳號其他專案仍會共享免費額度，延遲的帳號指標與 Budget Alert 不能冒稱即時硬上限；清理舊物件也不能退回已產生的當日峰值。沒有啟用新通知或付費控制。

## 重跑與證據

從 repository root 執行，Python 3.11+；先由既有 Wrangler 登入刷新 OAuth。憑證檔只作輸入，不印出、不進 Git。完整盤點與候選 keys 保存在 repository 外。

```powershell
python experiments/cloudflare-wordpress/capacity/read-usage.py --config ../playtt-wrangler-config/.wrangler/config/default.toml --output docs/verification/cloudflare-capacity-usage.json --start 2026-10-25T00:00:00Z
python experiments/cloudflare-wordpress/capacity/read-inventory.py --config ../playtt-wrangler-config/.wrangler/config/default.toml --output ../playtt-capacity-private-inventory.json
python experiments/cloudflare-wordpress/capacity/plan_retention.py --inventory ../playtt-capacity-private-inventory.json --backup-root ../../outputs/backups/cloudflare-wordpress-rebuild-ui --summary docs/verification/cloudflare-capacity-retention.json --private-plan ../playtt-capacity-private-plan.json
python -m unittest discover -s experiments/cloudflare-wordpress/capacity -p 'test_*.py' -v
```

查詢開始日期必須在最近 31 天內，跨帳期重跑時須更新；不是永久固定參數。GraphQL 只輸出帳號合計及 playtt 桶，未分類 operation 不被擅自歸入免費計費類別。[官方 metrics](https://developers.cloudflare.com/r2/platform/metrics-analytics/)、[REST 物件列舉與分頁](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/list/)。實際最後一頁省略 result_info，以少於 1,000 筆且無 result_info 判斷結束；有 truncated 卻無 cursor 一律失敗。

8 項測試涵蓋保留根、舊備份、共用 pack、最近／每日保留點，以及缺失清單、重複 key、跨桶、跨站、錯誤大小與隱藏 job。沒有部署 runtime，因此不重跑與本次無關的 PHP 或前台測試。完成後唯讀檢查副本 303／來源 175 均 coherent、無 fence、publisher paused；本輪沒有新 UI 編輯、空環境還原或冷啟動驗收。Python urllib 的私人狀態請求曾被拒絕 403，改用既有 Node 私人 client 後成功，未改權限。

公開摘要：`docs/verification/cloudflare-capacity-{usage,dashboard,retention,state}.json`。完整備份、物件名稱清單、cookies、nonce、tokens 不進 Git。整體目標 active，PR #4 維持 draft。
