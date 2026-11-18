# 保留草稿的空白網址代稱

獨立還原演練發現：透過 WordPress REST 建立、尚未指定網址代稱的草稿126，在相同程式重新部署後，其 `slug` 從空字串變成 `126`。ID、狀態、標題與內容沒有變，但後續發布的網址可能因此不同。驗收原本比對完整欄位，所以在清理測試草稿之前就停下；失敗及修正前診斷保留，沒有略過 slug 比對。

## 原因與修改

固定版 Markdown Database Integration 正確把空白 `post_name` 存入 frontmatter，也用文章 ID 當檔名。但重新讀取時，只要 `post_name` 是空字串就會以檔名補上代稱，未區分「有明確空值」與「未提供欄位」。

`playtt-slug-policy.ts` 在固定 MDI 唯一位置加入判斷：內建 native／OKF profile 的 slug 明確為空字串時，保留空字串；缺欄位、null、其他 profile 仍沿用原 fallback。自訂或非空代稱保持原值。僅改讀取規則，不改 R2 資料、不重新命名 Markdown 檔案，也不回填猜測的歷史值。固定來源比對不唯一時會在寫檔前失敗。

`empty-slug-candidate.patch` 只有 worker 的 import 與初始化接點；由重建工具作為第13段修正依序套用。PHP patch 在載入 MDI class 前套用，涵蓋實際 WordPress 與匯入用 runtime。沒有調整原生 WordPress 的 slug 生成規則。

## 驗證

在 runtime 根目錄執行：

```powershell
node scripts/playtt-slug-php-check.mjs
node node_modules/typescript/bin/tsc --noEmit
```

測試使用固定 PHP 8.3.36 的實際 WASM 與 MDI 原始檔，先以舊程式重現，再以修正版執行相同案例。兩組各68項檢查：native／OKF、draft／auto-draft、空字串／自訂代稱／字串零、完整與metadata讀取、無slug的檔名／index fallback，以及公開 storage API 寫入後重新建立 storage object 讀回。另驗證來源接點缺失時不寫檔。TypeScript 通過。

修正僅部署到 `playtt-wp-free-rebuild-audit`，來源每日維護 Worker 及正式 Pages 未部署此變更。原測試草稿126直接從既有快照讀回空白代稱，無需修改草稿來讓測試通過。

修正也讓原私人草稿6從舊 loader 產生的 `6` 回到備份原有空白代稱。核對已驗證 archive 的 `post/6.md` 確實明寫空值，其他內容完全相同。原基準雜湊保留在 `baselineBefore`；只把此一明確符合備份的欄位作為 `baselineAfter` 記錄，不把這項變化稱為「全內容與舊讀回完全相同」。已發布頁面沒有差異。詳見 [獨立還原](../independent-restore/README.md) 與其欄位雜湊報告。

本修正無法反推已被舊程式另存成非空代稱的原始意圖；也不改寫既有來源網站。尚未驗證的原生操作、正式後台切換及長期穩定性不能由這組有限案例推論。
