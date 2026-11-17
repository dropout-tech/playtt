# WordPress 與 Cloudflare 操作手冊

## 目前界線

`wordpress/lets-play` 是可安裝的 WordPress 區塊主題。`cloudflare/public` 是匿名公開頁面的靜態匯出，不包含 WordPress 後台、PHP 或資料庫。免費隔離WordPress已通過原生視覺段落編輯、重部署保存、全空初始化與獨立R2/DO備份還原；正式後台與公開站發布整合仍待，不能把靜態發布視為全部完成。

## 自動發布候選操作界線

最新私人audit為f7cc0a9b，原生自動儲存、120次讀取跨重建與重載通過；但另在本機確認已刪除ID於冷啟動後重用，舊ID寫入可改到新草稿，尚未修正。暫不交付為正式編輯後台；依id-sequence/README.md處理自增編號保存。斷線觀測與連續編輯的界線見request-body/README.md。

獨立 audit Worker 已更新為1c5f289a，加入經雜湊校驗的快照來源重用，五次寫入中位約11.7秒。原生草稿兩次儲存、重新部署讀回與新快照備份校驗通過，仍有一次10秒導覽逾時後重試成功；尚非長期操作驗收。原來源Worker仍是下述a33083f3。新私人備份位置由本機work/playtt-snapshot-audit-backup-location.json追蹤，含帳號資料，不可提交Git。重現見experiments/cloudflare-wordpress/snapshot-latency/README.md。

私人還原區最新a33083f3已通過410次混合讀取、原生auto-draft跨重建保存及匿名拒絕，後續七筆發布批次亦通過。執行器在已保存請求之間釋放，下一請求可能有冷啟動等待；上游400次保護保留。最新295索引備份已在獨立Worker/R2/DO還原並讀回通過，15個媒體雜湊相符。新環境首次登入提交約33.8秒；長期原生編輯、延遲與舊auto-draft清理仍待。私人發布器paused，noindex預覽位於 https://playtt-publication-preview.muzhi-garden-platform.workers.dev 。正式playtt.tw依使用者決策保持Pages，暫不切換後台。

維運端點的 pause／resume／retry 需要 operator 身分，密鑰不放前端。連續六次無進展會停止並保留原公開版本；先修復根因，再手動重試。重現與測試來源見 `experiments/cloudflare-wordpress/automatic-publication/README.md`。本機故障測試只操作 emulator，不可直接改成遠端物件刪除。

## 安裝與編輯

1. 在 WordPress「外觀 → 佈景主題 → 安裝佈景主題」上傳主題 ZIP 並啟用。
2. 開啟「工具 → Let’s Play 網站內容」匯入六個品牌頁面與十四張媒體。需要管理員權限與有效 nonce。匯入器不覆寫同 slug 的既有頁面、不重複新增標記過的媒體。
3. 在「頁面」修改標題、文案、課程價格、教練、據點和圖片。圖片已進入媒體庫，不依賴保留同一個主題資料夾。
4. 在「外觀 → 編輯器」修改共用頁首、導覽與頁尾；在樣式中使用已提供的品牌色票。
5. 儲存草稿、預覽，再發布。需要回復時使用「修訂版本」。新版主題不會自動改寫已編輯頁面，更新內容時須由編輯者套用新區塊版型或手動修改。

## 第一次編輯導覽

在新安裝主題中，導覽連結先跟著頁首範本提供，尚未另存成導覽選單。因此「導覽列」總覽初次可能沒有選單，這不代表主題缺少連結。

到「外觀 → 編輯器 → 區塊版面配置 → 頁首 → 品牌頁首」，點選連結後修改右側「文字」與「連結至」。第一次修改會建立原生WordPress導覽選單；儲存確認面板應同時勾選「品牌頁首」與「選單」。完成後重新載入確認，再透過「導覽列」管理已建立的選單。網站頁面的內容則在「頁面」編輯；版型清單中的主題版型是建立頁面的來源，不是已匯入頁面的編輯入口。

此流程已在私人Cloudflare繁中原生編輯器完成修改、儲存及重載驗證；正式官網仍為獨立Pages版本。

## 本機重現

需要 Node >=24.18、npm >=11.16，及系統 `tar`。目前工具鏈在 Windows 驗證；不把開發用自動登入主機公開到網際網路。

在 `wordpress/` 安裝依賴 `npm ci`。`node` 套件可提供本專案可攜執行器，Windows 路徑為 `node_modules/node/bin/node.exe`。WordPress 官方 ZIP 放入 `.runtime/wordpress.zip`，解壓到 `.runtime/core/wordpress` 後執行 `npm run dev`。已測基準為 WordPress 7.1.4 / PHP 8.3 / Playground 3.1.64。

- `node scripts/prepare-assets.mjs`：從原站素材產生 WebP 和素材來源表。
- `node scripts/build-patterns.mjs`：由可維護內容產生八個原生區塊版型。
- 將 `lets-play/` 連同頂層資料夾壓縮成 `dist/lets-play.zip`。
- `npm test`：實際用 WordPress Theme_Upgrader 安裝 ZIP，驗證匯入、編輯、修訂、草稿權限、媒體、重啟與獨立備份還原。
- `npm run export`：從新測試站產生匿名靜態版本；輸出路徑與 SHA256 在 `test-results/export.json`。

注意：目前匯出器預設用 starter 版型建立新站。它不是已部署後台的同步器，不能拿來覆蓋未備份的編輯者內容。生產環境持久化架構定案後，需接上該資料來源並重新驗收發布流程。

## 免費 Cloudflare 靜態部署設定

固定帳號 info@dropout.tw；已部署的免費 Pages 專案 `playtt-brand-preview`，預覽 https://playtt-brand-preview.pages.dev 。這是官網恢復階段的靜態發布；免費隔離後台已通過原生編輯、修訂還原、頁尾、重部署與備份還原，正式發布整合仍待。

| 設定 | 值 |
| --- | --- |
| Git repository | dropout-tech/playtt |
| 預覽分支 | codex/playtt-wordpress-cloudflare |
| 根目錄 | cloudflare |
| 建置命令 | node verify-static.mjs |
| 發布方式 | Pages 原生 GitHub 整合，自動部署 |
| 環境變數 | SKIP_DEPENDENCY_INSTALL=1（Production 與 Preview） |
| 靜態目錄 | public |
| 執行邏輯 | 純靜態資產，沒有 Worker 程式或付費綁定 |

本機在 `cloudflare/` 執行 `node verify-static.mjs`。檢查會拒絕 PHP、資料庫、壓縮包、環境設定、本機網址、管理列、草稿標記、失效的站內相對連結及缺漏 SEO 設定。

0.2.3 起也檢查所有圖片有正整數寬高，避免主視覺載入造成版面位移。圖片尺寸由主題讀取原檔或媒體庫 metadata 後在渲染階段補上；不改寫編輯者保存的區塊內容。實際主題更新不需要重新匯入 starter。

使用者已明確授權 GitHub 串接，範圍限定本儲存庫。已沿用既有 Cloudflare GitHub 連線，僅選取 playtt 作為專案來源，沒有擴大其他儲存庫權限。Pages 建置只使用 Node 內建模組；[官方支援 SKIP_DEPENDENCY_INSTALL](https://developers.cloudflare.com/pages/configuration/build-image/#skip-dependency-install)，用來避免根目錄舊 React Yarn lock 影響這次靜態發布。

`wrangler.jsonc` 保留可選 Workers 靜態部署設定；Pages 因其未指定 pages_build_output_dir 而略過，使用儀表板設定。CLI 已登入指定 info 帳號；2026-11-17 已建立本專案獨立設定，包含使用者已授權的 Workers Scripts/Routes Write，以及必要的 Tail Read／Pages Write。以 XDG_CONFIG_HOME 指向本機 playtt 專案登入目錄，避免改動其他工作的共用登入；私有登入檔不可提交。正式官網仍為 Pages；完整動態後台未發布到正式網域。

## DNS 切換與復原

目前正式內容為主題 0.2.3；已驗證的內容快照為commit `55dc518`（後續文件提交可觸發內容相同的新部署），固定快照 https://32e92256.playtt-brand-preview.pages.dev 。主題 ZIP SHA256 `471aaf78e1d4a15d1357ec9500a067bcff27a9a4d803f7f8dcea48a00249a79e`。下方舊版快照仍可用作回滾。

2026-11-16 PageSpeed 行動量測：首頁 94、課程 99，兩頁 CLS 0；無障礙、最佳做法、SEO 自動分數均 100。這是單次實驗室結果，不是完整人工無障礙驗收或真實使用者核心指標。首頁仍有約 3 秒 LCP，後續可用響應式圖片進一步減少傳輸。詳細報告連結及比較在 `docs/verification/pagespeed-after.json`。

公開 HTTP 核對會從 HTML 取得實際資產 query（例如 CSS `?ver=0.2.3`），並把 requestPath 寫入證據。版本更新後，未帶 query 的舊 CSS 可能在原有一小時 TTL 內保留舊版本；不應把它冒充新頁面實際請求。沒有為取得較漂亮分數而使用不安全的永久快取。

Gandi 保留註冊及郵件服務。切換前完整區域檔有 14 筆服務記錄，加上 Gandi SOA；Cloudflare 已補齊自動掃描漏掉的三筆 DKIM，郵件 CNAME 均為 DNS only。DNSSEC 在 Gandi 未啟用。

新 Cloudflare NS：`karl.ns.cloudflare.com`、`mariah.ns.cloudflare.com`。舊 Gandi NS：`ns-60-a.gandi.net`、`ns-12-b.gandi.net`、`ns-90-c.gandi.net`。

2026-11-16 18:52 Gandi 已確認 nameserver 變更完成。Cloudflare zone active 後已完成根網域及 www 的 Pages 綁定，兩筆舊 Zeabur 記錄改成 `playtt-brand-preview.pages.dev` CNAME（proxied）；12 筆 MX、SPF、DKIM、郵件 SRV 和 webmail 完全保留且 DNS only。原本沒有 DMARC，沒有因搬遷新增郵件政策。兩個網域均 Active / SSL enabled，正式瀏覽器可開啟新版；仍須留意舊 DNS 快取。

已啟用 Always Use HTTPS；規則 `playtt www to canonical root` 將 `https://www.playtt.tw/*` 301 至 `https://playtt.tw/${1}`，Preserve query string 開啟。根網域及 www 的 HTTPS 轉址、query 保留已實測。Email Address Obfuscation 關閉，保留直接可讀的公開信箱與原生 mailto。

0.2.2 固定快照：https://97a18f78.playtt-brand-preview.pages.dev （commit 132a9de）。首個固定快照：https://06d099af.playtt-brand-preview.pages.dev （0.2.1，commit 3357a82）。18:42 已實際從 0.2.2 回滾到 0.2.1，讀取公開 CSS 證實，隨後恢復 0.2.2 並通過 46 檔驗證。操作入口：Pages → Deployments → 指定版本 Details → Manage deployment → Rollback to this deployment。這不回復 WordPress 資料庫。

`node cloudflare/verify-http.mjs https://playtt.tw` 檢查 46 個檔案、404 及 /home/ 轉向。若本機解析仍指舊 IP，可暫設 `PLAYTT_EDGE_IP` 為已查證的 Cloudflare 權威 A 記錄再測；報告會明示此覆寫，且仍驗證正式 hostname 的 TLS 憑證。不得把這類結果當成所有 DNS 快取已更新。正式區域若注入 Cloudflare Analytics beacon，報告會明列該轉換，其餘內容仍需完全一致。

正式切換後驗證 NS、A／CNAME、MX、TXT、DKIM 和 HTTPS，記錄傳播中的查詢差異。Cloudflare 預先保存一個可用版本，回滾用 Cloudflare 的前一部署或相同靜態備份重新部署。舊 Zeabur 已經 502，不能把切回舊 IP 當作可用服務回復。

## 資料備份

本機 Playground 關閉後，備份整個 `.runtime/.../wordpress`，包含 SQLite、uploads、主題和設定；測試已驗證複製到獨立目錄後還原內容與媒體。此資料包含登入資訊，不能提交到公開 Git 或放入 `cloudflare/public`。

先前候選的R2完整版本／協調器備份與另一分區還原已實測；最新版另保存295個索引項目的校驗備份，SHA256為85594bc9bd0c478390a892415a9edb3715a2cb8526b262dc0f6bf40c4aa98268。前版曾在386次讀取後記憶體重置；最新a33083f3已通過410次讀取及發布回歸，且這份備份已在私人playtt-wp-free-restore-audit的獨立R2/DO還原通過，頁面、導覽、樣式與15個媒體檔一致。原資料內嵌網址保持原字串；長期營運與改網域的內容網址遷移仍待驗。詳見experiments/cloudflare-wordpress/runtime-retirement/RESTORE-AUDIT.md。使用者已選擇繼續研究全Cloudflare免費後台，正式站暫不切換。生產備份與還原須依最終架構再驗收。

## Zeabur 清除順序

僅處理 LetsPlayWebsite 專案 `6926869de253c26501bdc21a`、playtt 服務 `69268af7e253c26501bdc2e1`、環境 `6926869d9ded7fb3e124e339`。已看到唯一服務、無掛載卷、舊部署已移除；PASSWORD／PORT 變數保持遮蔽，未輸出密碼。

2026-11-17 使用者已在備份、正式站和回滾驗證後完成永久刪除；重新登入專案列表已無 LetsPlayWebsite，正式站一般公開 DNS 的46檔檢查仍通過。此專案的服務與設定隨專案移除，未變更其他專案及帳號共用整合。刪除前模板保存在本機 `outputs/backups/letsplay-zeabur-template.yaml`，未提交；證據 `docs/verification/zeabur-removal.json`。舊專案不可原地還原，可利用Git/模板備份重建，但網站回滾應使用已驗證Cloudflare快照。
