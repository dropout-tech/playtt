# 清單的原生 Base64 編碼候選

將清單壓縮結果的 Base64 編碼改成可選用 `Uint8Array.prototype.toBase64`，執行環境不支援時沿用原函式。已在固定 workerd 驗證原生路徑與 fallback，完整建置及 25 項既有回歸測試通過。**尚未完成此新建置的原生編輯流程或免費記憶體驗收。**

候選只存在隔離建置與這份研究工具；中央 runtime、正式 Pages、原站視覺、雲端 Worker、DNS 及發布狀態均不變。0 Cloudflare 請求／部署／帳務刷新，無新增費用。

## 改動與語意驗證

私有 `base64` helper 原本先把位元組展開成字元參數、累積 binary string，再呼叫 `btoa`。候選檢查原生 encoder 是否存在，使用原生方法直接編碼該 Uint8Array view；舊路徑完整保留。呼叫端提供 gzip 產生的標準 Uint8Array，沒有擴張成接受任意 array／自訂 iterator 的公開 API。序列化時點、壓縮、解碼驗證、雜湊、容量限制、cache、保存順序與指標均未改動。

實際固定 `workerd 1.20260828.1`、compatibility date `2026-07-18`、既有兩個 flags（nodejs_compat／enable_request_signal）提供原生方法，不需增加 flag。Node 24.18.0 此次沒有該方法，因此 Node candidate 測的是 fallback。

兩個 runtime 各測 baseline／candidate／強制 fallback 三版：每版 279 組位元組長度／offset，18 組清單案例（11 成功、7 拒絕）。獨立 Node Buffer 編碼比對一致，所有 view 輸入未變、輸出不受其後修改影響；清單實體 bytes、解碼後內容與拒絕結果在三版及兩個 runtime 完全相同。同步擷取 metadata 後再修改輸入的案例也保留原內容。

其中真實清單來自前輪 LOCAL191 的獨立備份，74,029 bytes；離線 audit 重新開啟備份、核對清單與實體物件，並重算觀測檔、fixture、編譯產物及原始 profile 的雜湊，未重跑已完成 owner。

## 六組實際 workerd 配置控制

每組新開 workerd，順序 B、C、C、B、B、C。資料載入在量測之前；每組先做 100 次實際壓縮 payload 編碼，再做 10 次完整清單序列化及解碼。所有輸出長度及 SHA 精確，沒有外連或強制 GC，完成後全部關閉。

| 控制窗口 | 原版平均累計 sampled JS | 候選平均累計 sampled JS | 配置量減少 | 原版／候選平均本機時間 |
| --- | ---: | ---: | ---: | ---: |
| 100 次編碼 | 71,369,012 bytes | 2,384,048 bytes | 96.66% | 87.57／5.96 ms |
| 10 次序列化＋解碼 | 16,957,406.67 bytes | 9,484,212 bytes | 44.07% | 73.51／64.67 ms |

完整 roundtrip 窗口接在編碼窗口之後，並非各自冷啟動。控制刻意放大目標作業，次數不代表每個 WordPress 請求；累計配置包含已回收物件及結果雜湊。這些數值不能當作同時持有量、尖峰、RSS、計費 CPU 或整個後台效能。roundtrip 本機時間少 12.02%，也不是 provider 速度承諾。

## 完整建置與回歸

以先前完整候選的 208 個輸入建置，只改 `src/playtt-manifest-envelope.ts`；83 個 TS 來源、1 個 declaration、實際載入 72 來源。TypeScript 與 Wrangler dry-run 通過；產物逐字差異只多原生 encoder 的檢查及呼叫，五個二進位模組完全相同。

- 原來源 SHA：`c81f37e3ab4399efc98fcb5688d1e62fc3dd114fc8e3e28c9edb0a2fdef76e99`
- 候選來源 SHA：`ba0e87ca6848224b0a14aad15d605587d2f2ff9bfddea78c9db22d1e7f296150`
- 完整 JS SHA：`0f9d3340e3e66f7cc6242bf31cc26d4d76ad9c78dfa7f87a17adca214206b025`

25 項未修改的原測試在完整候選來源通過，涵蓋 envelope／保存順序、資料損毀與解壓限制拒絕、備份／匯入與 pin、公共內容讀取、失敗不提升指標及 default-off 等；Node 在這輪走 fallback。真正原生編碼另由上面的 workerd 比較驗證，不將兩者混稱為 25 項 workerd 測試。

## 可重建交付與下一步

接續 [boot-zip-native 組裝](../boot-zip-native/README.md)，安裝器核對 223 個前置工具，加入 7 個工具、保留先前 769 檔，共 776 檔。新工具不包含原始文章、備份內容、profile、cookie／nonce 或登入資料；完成 owner 及 feature 觀測均拒絕重播。

```powershell
node --import tsx scripts/playtt-base64-native-audit.mjs --local --check
node scripts/playtt-base64-native-build.mjs --local --check
```

前版 `abc3045e` 已通過原生編輯、保存、完整重啟、新分頁讀回、登出與備份；其觀測組件合計仍約 144.3／142.9 MiB，不能套用為本候選的量測。下一步是固定本候選 `0f9d3340e` 做完整原生流程與有界記憶體觀測。歷史連線例外的原因未證明；第一次繁中初始化、provider 記憶體／CPU、長期免費使用、實體 IME／手機與 A01–A20 仍開放，PR #4 維持 draft，全案 active。

最後雲端確認仍是 2026-11-21T16:52:39.597Z、canonical181、pin16（保留原15）、歷史剩餘 62,344 bytes、publisher 暫停；本輪沒有刷新，並非目前帳務狀態。

證據：[綜合離線稽核](../../../docs/verification/cloudflare-base64-native-audit.json)、[行為比較](../../../docs/verification/cloudflare-base64-native-semantic.json)、[配置控制](../../../docs/verification/cloudflare-base64-native-allocation.json)、[完整建置](../../../docs/verification/cloudflare-base64-native-build-proof.json)、[既有回歸](../../../docs/verification/cloudflare-base64-native-regression.json)。
