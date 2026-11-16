# WordPress 與 Cloudflare 操作手冊

## 目前界線

`wordpress/lets-play` 是可安裝的 WordPress 區塊主題。`cloudflare/public` 是匿名公開頁面的靜態匯出，不包含 WordPress 後台、PHP 或資料庫。完整免費 Cloudflare WordPress 後台仍未遠端驗收，不能把靜態發布視為全部完成。

## 安裝與編輯

1. 在 WordPress「外觀 → 佈景主題 → 安裝佈景主題」上傳主題 ZIP 並啟用。
2. 開啟「工具 → Let’s Play 網站內容」匯入六個品牌頁面與十四張媒體。需要管理員權限與有效 nonce。匯入器不覆寫同 slug 的既有頁面、不重複新增標記過的媒體。
3. 在「頁面」修改標題、文案、課程價格、教練、據點和圖片。圖片已進入媒體庫，不依賴保留同一個主題資料夾。
4. 在「外觀 → 編輯器」修改共用頁首、導覽與頁尾；在樣式中使用已提供的品牌色票。
5. 儲存草稿、預覽，再發布。需要回復時使用「修訂版本」。新版主題不會自動改寫已編輯頁面，更新內容時須由編輯者套用新區塊版型或手動修改。

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

固定帳號 info@dropout.tw；已部署的免費 Pages 專案 `playtt-brand-preview`，預覽 https://playtt-brand-preview.pages.dev 。這是官網恢復階段的靜態發布，完整 WordPress 後台仍未遠端驗收。

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

使用者已明確授權 GitHub 串接，範圍限定本儲存庫。已沿用既有 Cloudflare GitHub 連線，僅選取 playtt 作為專案來源，沒有擴大其他儲存庫權限。Pages 建置只使用 Node 內建模組；[官方支援 SKIP_DEPENDENCY_INSTALL](https://developers.cloudflare.com/pages/configuration/build-image/#skip-dependency-install)，用來避免根目錄舊 React Yarn lock 影響這次靜態發布。

`wrangler.jsonc` 保留可選 Workers 靜態部署設定；Pages 因其未指定 pages_build_output_dir 而略過，使用儀表板設定。CLI 已登入指定 info 帳號，但動態部署所需 Scripts/Routes 額外權限仍等待明確授權；目前尚未部署動態 Worker。

## DNS 切換與復原

Gandi 保留註冊及郵件服務。切換前完整區域檔有 14 筆服務記錄，加上 Gandi SOA；Cloudflare 已補齊自動掃描漏掉的三筆 DKIM，郵件 CNAME 均為 DNS only。DNSSEC 在 Gandi 未啟用。

新 Cloudflare NS：`karl.ns.cloudflare.com`、`mariah.ns.cloudflare.com`。舊 Gandi NS：`ns-60-a.gandi.net`、`ns-12-b.gandi.net`、`ns-90-c.gandi.net`。

2026-11-16 18:52 Gandi 已確認 nameserver 變更完成。Cloudflare zone active 後已完成根網域及 www 的 Pages 綁定，兩筆舊 Zeabur 記錄改成 `playtt-brand-preview.pages.dev` CNAME（proxied）；12 筆 MX、SPF、DKIM、郵件 SRV 和 webmail 完全保留且 DNS only。原本沒有 DMARC，沒有因搬遷新增郵件政策。兩個網域均 Active / SSL enabled，正式瀏覽器可開啟新版；仍須留意舊 DNS 快取。

已啟用 Always Use HTTPS；規則 `playtt www to canonical root` 將 `https://www.playtt.tw/*` 301 至 `https://playtt.tw/${1}`，Preserve query string 開啟。根網域及 www 的 HTTPS 轉址、query 保留已實測。Email Address Obfuscation 關閉，保留直接可讀的公開信箱與原生 mailto。

0.2.2 固定快照：https://97a18f78.playtt-brand-preview.pages.dev （commit 132a9de）。首個固定快照：https://06d099af.playtt-brand-preview.pages.dev （0.2.1，commit 3357a82）。18:42 已實際從 0.2.2 回滾到 0.2.1，讀取公開 CSS 證實，隨後恢復 0.2.2 並通過 46 檔驗證。操作入口：Pages → Deployments → 指定版本 Details → Manage deployment → Rollback to this deployment。這不回復 WordPress 資料庫。

`node cloudflare/verify-http.mjs https://playtt.tw` 檢查 46 個檔案、404 及 /home/ 轉向。若本機解析仍指舊 IP，可暫設 `PLAYTT_EDGE_IP` 為已查證的 Cloudflare 權威 A 記錄再測；報告會明示此覆寫，且仍驗證正式 hostname 的 TLS 憑證。不得把這類結果當成所有 DNS 快取已更新。正式區域若注入 Cloudflare Analytics beacon，報告會明列該轉換，其餘內容仍需完全一致。

正式切換後驗證 NS、A／CNAME、MX、TXT、DKIM 和 HTTPS，記錄傳播中的查詢差異。Cloudflare 預先保存一個可用版本，回滾用 Cloudflare 的前一部署或相同靜態備份重新部署。舊 Zeabur 已經 502，不能把切回舊 IP 當作可用服務回復。

## 資料備份

本機 Playground 關閉後，備份整個 `.runtime/.../wordpress`，包含 SQLite、uploads、主題和設定；測試已驗證複製到獨立目錄後還原內容與媒體。此資料包含登入資訊，不能提交到公開 Git 或放入 `cloudflare/public`。

遠端 WordPress 採用哪種持久化服務尚未定案；生產備份與還原必須隨架構實測，不能套用本機複製結果冒充遠端結果。

## Zeabur 清除順序

僅處理 LetsPlayWebsite 專案 `6926869de253c26501bdc21a`、playtt 服務 `69268af7e253c26501bdc2e1`、環境 `6926869d9ded7fb3e124e339`。已看到唯一服務、無掛載卷、舊部署已移除；PASSWORD／PORT 變數保持遮蔽，未輸出密碼。

等正式站與回滾都驗證後，確認移除本服務網域、發布掛鉤與資源；介面要求永久刪除當下確認時，提供精確資源清單由使用者完成。其他 Zeabur 專案不屬於本任務。
