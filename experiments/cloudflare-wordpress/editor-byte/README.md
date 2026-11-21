# 編輯器短暫配置與位元組修補候選

原生載入配置取樣把 `patchPlayttEditorLock` 定位為單一大額 JS 配置來源：它為 1,574,731-byte 編輯器建立完整解碼與重組字串。本候選在完整輸入 SHA 檢查之後，以 ASCII 位元組尋找同一個 effect、預先配置輸出並複製三段，保留唯一匹配與完整輸出 SHA。輸出仍為原本的 1,574,744 bytes、`ec1e9dc9…`，鎖定行為與資產版本不變。**候選只存在隔離研究建置；中央來源、Cloudflare 與正式 Pages／原視覺不變。**

## 配置證據

先以真正 cb9302a8… 六模組，分別量測原生載入及單次保存。載入 18,041ms／578 samples／累計 node selfSize 23,013,676 bytes，其中修補函式 3,149,500 bytes；保存 20,917ms／873 samples／30,536,920 bytes。這是包含已回收物件的抽樣累計，不是同時記憶體或 PHP 配置。

六個全新本機 workerd 副本採 baseline/candidate/candidate/baseline/baseline/candidate 順序，只執行一次修補，原始檔於取樣前載入。三次 baseline 的函式 selfSize 都是 3,149,500 bytes；三次 candidate 都是 0 sampled bytes。每次輸出 SHA 完全相同。**0 sampled 不代表零配置**：仍需輸出 buffer、雜湊與小型物件；32,768-byte 取樣不會完整描述 native／ArrayBuffer 配置或實際峰值。六份原始 profile 留私人檔案，唯讀工具重算精確。

候選原生載入 21,461ms／619 samples／21,463,916 累計 bytes；保存 52,084ms／1,235 samples／43,534,140 bytes，含兩個 Ajax，而 baseline 保存含一個。操作時間、背景請求與 GC 不同，**不能拿兩個總數宣稱整體改善百分比**。單一函式的六個受控副本是配置改善證據；完整流程用來驗證資料行為與辨識仍未解的記憶體問題。

## 建置與功能

- 83 TypeScript 來源／206 個固定輸入完整型別檢查與 Wrangler dry-run 通過，71 個 metafile source input 核對。候選 JS `d3a78fa46ba73861129bd9596b18ef93e1e545476e6d3471ac2a8f345b783e1a` 與 cb9302a8… 逐字只差這段函式；五個二進位模組精確，沒有診斷 hook。
- 9 項測試通過：原始鎖定問題與修補行為、接管、最新鎖釋放、listener 清理、同來源版本 URL、真實 static handler GET/HEAD／快取／損壞拒絕、workerd HTMLRewriter／CSP，以及非零 offset view、sentinel、重複／並行輸出與輸入不變。型別檢查包含真正整合來源。
- baseline 與 candidate 各由 cloud181 獨立備份建立空的本機 R2／DO，維持 600秒／1,881,041bytes／96ops。各以原生繁中編輯器單次儲存相同 1,875-byte 草稿，完整關閉 workerd 後以同資料目錄與同寫入視窗重新啟動，新分頁重讀十段內容／11筆修訂，再原生登出。
- 兩次均新增精確 revision209，原文章／修訂／全部 usermeta 與 session／媒體／主題不變；只允許 owned 草稿、edit lock、revision row 與自增資料差異。獨立304物件／298檔及 full materialization 精確。這不是實體 IME／裝置驗收，也沒有額外以使用者介面還原 materialized 輸出。

| 本機流程 | 最後版本 | charged bytes / puts | HTTP / runtime |
| --- | ---: | ---: | --- |
| baseline 配置流程 | LOCAL195 | 700,452 / 42 | 221 requests，無 HTTP 錯誤／例外 |
| byte candidate | LOCAL191 | 500,105 / 30 | 224 requests，1 個已分類 global-styles403，無未分類錯誤／例外 |

403 的精確路徑為 `/wp-json/wp/v2/global-styles/42`、code `rest_forbidden_context`，與固定核心 edit-context 更新權限拒絕一致；未放寬權限。這兩次不解釋歷史未分類400。兩次均 closed／sealed／pending0、outbound0、terminal exit0；程序與測試分頁關閉。

## 尚未通過的記憶體條件

相同 generation 的 CDP used + backing + 最近觀測 PHP HEAP 組成合計，baseline 重啟前／後最大 160,327,100／157,848,266 bytes，candidate 為151,406,909／157,688,237 bytes。這些有觀測開銷與非同步邊界的數字仍超過128MiB；本機 workerd 不強制 Cloudflare 限額，不能當 provider peak、RSS、billed CPU 或通過證明。沒有強制 GC 或提高限額。

保存取樣仍顯示 FS.lookupPath/getattr/stat、manifest 編碼與反覆產生的 runtime-owned 路徑清單。下一步從這些實際 stack 檢查重複工作，保留路徑／大小／完整性／權限驗證與 WordPress 功能；先驗證具體候選，再評估整體記憶體。

## 重現與交付

接在 ajax-retained 組裝後執行 `install-local-tools.py --runtime <runtime> --apply`，核對145個前置工具、加入14個工具；重套拒絕不改檔。既有固定依賴與私人備份必須已備妥；不重新安裝或呼叫雲端。`playtt-editor-byte-build-prepare.py --local --previous <boot-cleanup-build> --target <new-build>` 可重建206輸入，連接既有 node_modules 後執行 tsc 與 Wrangler **dry-run**（metafile 預設 `bundle-meta.json`），再由 build 工具核對。所有 owner 為單次使用，已完成者必須檢查，不可直接重播。

```powershell
python scripts/playtt-transient-allocation-audit.py --runtime . --local --check
python scripts/playtt-transient-allocation-audit.py --runtime . --local --candidate --check
node --import tsx scripts/playtt-native-allocation-data-audit.mjs --local --check
node --import tsx scripts/playtt-native-allocation-data-audit.mjs --local --candidate --check
python scripts/playtt-editor-byte-allocation-check.py --runtime . --local
python scripts/playtt-editor-byte-build.py --local --build <editor-byte-build> --check
```

保留的工具準備失敗：最初 junction 相對目標無效、受限環境拒絕建立，改用已解析的絕對路徑與本機權限後完成；metafile 名稱、稽核縮排及準備器檔名錯誤在任何候選 native run 前修正，未重播已完成 owner。第一版配置分析將裸檔名誤標為 wrapper，已保留原報告並修正為經 SHA 核對的 production bundle，數值不變。

本輪0 provider請求／部署／計費刷新。最後雲端確認仍2026-11-21T16:52:39.597Z、canonical181、餘62,344bytes、publisher暫停；沒有 cap增加、退款、清unknown、刪pin／歷史或替代雲端資源。全案goal active、PR4 draft；provider記憶體／CPU、繁中首次初始化、長期免費、實機與A01–A20仍未完成。

證據：[baseline資料](../../../docs/verification/cloudflare-transient-native-audit.json)、[baseline配置](../../../docs/verification/cloudflare-transient-allocation-audit.json)、[候選資料](../../../docs/verification/cloudflare-editor-byte-native-audit.json)、[候選配置](../../../docs/verification/cloudflare-editor-byte-allocation-audit.json)、[六個控制](../../../docs/verification/cloudflare-editor-byte-allocation-summary.json)、[完整建置](../../../docs/verification/cloudflare-editor-byte-build-proof.json)。
