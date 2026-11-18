# 內容末尾字元保存

原生修訂還原測試發現：WordPress寫入及完整備份保留末尾LF，但MDI重新載入時使用rtrim，導致讀回內容不同。新的 `playtt-content-policy.ts` 在固定MDI來源加入精確讀寫規則；第16段patch將其接入runtime初始化。

新寫入Markdown的frontmatter加入 `__playtt_content: v1:<bytes>:<sha256>`。讀取時只移除writer額外加入的一個結尾LF，並核對原內容長度及SHA。full parse及lazy read使用相同規則，錯誤標記、損壞內容、缺少格式LF或多餘空白會拒絕。補丁先確認全部來源anchor，才一次寫入檔案。

未帶標記的舊資料維持原本rtrim讀法，避免在載入時改變現有頁面語意；編輯或還原後的新寫入才使用新格式。這不是把所有歷史資料改成新的格式，也沒有恢復已不存在於備份中的字元。帶標記的備份應搭配本修正或後續相容版本；退回舊程式會再次trim，不能把只退程式視為可靠回滾。

## 驗證

- 固定PHP-WASM／MDI共235項檢查：native／OKF兩種profile，各11種內容案例，包含空字串、純空白、前後換行、CRLF、Tab、繁中與NUL。22組full／lazy讀回逐位元一致，未標記資料仍與舊讀法相同。
- 5種損壞案例在兩種載入路徑均拒絕，重複套用anchor也拒絕且不寫入。TypeScript及private dry-run通過；既有PHP loader警告保留於log。
- 在原自有草稿140重新執行原生還原修訂141，新登入讀回完整2401bytes與SHA一致，包含先前遺失的LF；原首頁SHA不變。失敗備份的原內容與新格式備份均另行保留。
- 完整備份、相同程式重新部署、清理及最後原資料比對由 `playtt-content-restore.json`、`playtt-content-cleanup.json` 及 [總驗證](../../../docs/verification/cloudflare-history-content-summary.json) 記錄。這是HTTP原生admin action驗證，不是瀏覽器視覺驗收。
- 16段patch、61來源檔及8個本輪工具從固定上游重新組裝一致；沒有重裝相同依賴或重生核心資產。

`playtt-content-remote.mjs`只接續已記錄的自有140／141，restore及verify-cleanup均有phase、身份及內容檢查。不能刪除owned state重跑。新格式的備份還原仍需使用相容程式；完整備份校驗不等於另建空環境還原。

所有部署僅在private rebuild，正式Pages、daily來源程式與原品牌視覺不變，兩個publisher均維持paused。PR仍draft；互動延遲、其他原生／手機流程、交接及持續免費用量仍需驗收。
