# 從固定上游重建目前候選

`rebuild-candidate.py` 使用 Python 標準函式庫與 Git，把已採用的17段修正及額外來源檔組裝到全新資料夾。它不連網、不安裝依賴、不部署、不帶入網站資料或憑證，且拒絕覆寫既有目錄。第13段修復空白slug，第14段保存完整附件欄位，第15段增加請求body失敗的固定類別診斷，第16段保存新內容完整位元組，第17段減少診斷全檔掃描；`media-repair/` 與 `history-origin/` 另交付有界資料修復與原生驗收工具。下方較早的patch／檔案數屬其當時建置。

## 組裝

下載 [固定 Automattic/wp-codebox 原始碼](https://codeload.github.com/Automattic/wp-codebox/tar.gz/9764022156a61ba7d2b4d8a2196b01ccb33b82b5)。本輪使用的 archive SHA256：`af0cf70a31bb32ec1259a78cd7cf2e9c60a306b91a711026c69aab9e8e6627e7`。若下載值不同，先查明內容及來源差異，不直接略過檢查。

從本目錄執行：

```powershell
python rebuild-candidate.py --archive <已下載的tar.gz> --output <不存在的新資料夾>
```

可選 `--reference <現有runtime-cloudflare資料夾>` 只讀比較全部 TypeScript 來源。工具僅提取指定套件路徑，拒絕路徑跳脫、symlink 與特殊檔案；略過舊 `npm-shrinkwrap.json`，使安全更新候選的 `package-lock.json` 生效。

來源與 patch 統一為 UTF-8／LF，再以 `git apply --check` 檢查後套用，不使用忽略空白、強制套用或 fuzzy matching。原始逐段 patch 檔保留原樣。這也解決 Windows checkout 的 CRLF patch 無法直接套到上游 LF 來源的問題；第一次失敗曾停在 public-reader.ts，沒有略過後冒充成功。

輸出 `assembly.json` 記錄 archive、各 patch 雜湊、來源雜湊及差異。若失敗另留 `failed-step.json`，下次使用另一個全新目錄以保留證據。

## 依賴與資產

切換到輸出的 `packages/runtime-cloudflare`，使用 Node 24.18以上與 npm 11.16以上，依序執行：

```powershell
npm ci --workspaces=false --ignore-scripts --no-audit --no-fund
node scripts/apply-development-patch.mjs
node scripts/playtt-runtime-prepare.mjs
node scripts/playtt-prepare-small-heap-loader.mjs
$env:WORDPRESS_RUNTIME_ARCHIVE_URL='https://downloads.wordpress.org/release/wordpress-7.1.4.zip'
$env:WORDPRESS_RUNTIME_VERSION='7.1.4'
npm run generate:wordpress-runtime-corpus -- --playtt-core-only
npm run build
```

這沿用既有安全更新流程，不包含全空 WordPress 資料初始化或備份還原。固定依賴與核心版本的限制見 [安全更新說明](security-update/README.md)。不要在原有共享 node_modules 中重新安裝或更改版本。

Wrangler 使用本專案登入設定的 `XDG_CONFIG_HOME`。只做打包時：

```powershell
node node_modules/wrangler/bin/wrangler.js deploy --dry-run --config wrangler.playtt-retirement-restore-audit.jsonc
```

## 實際驗證範圍（2026-11-19）

從重新下載的固定上游 archive 組裝成功：12段 patch、57個 TypeScript 來源與目前候選相同，私人 audit 設定及鎖定檔一致。最初使用既有依賴的編譯／打包證據保留在 `docs/verification/cloudflare-clean-rebuild.json`。

後續已在另一個全新輸出目錄完成 Node24.18.0／npm11.16.0 的 npm ci，17秒安裝116個套件；沒有共用 node_modules，vendored core 也解析到該重建目錄內。依序套用明確列出的準備腳本，再從官方來源重新產生 WordPress7.1.4／SQLite資產。三份manifest及實際ZIP／blob與原候選逐位元一致，沒有複製舊產物充當重建。

新依賴下 TypeScript 及 private-audit dry-run 通過，打包20775.66 KiB／gzip7586.28 KiB。五個WASM／ZIP／SQLite模組與前輪完全一致；JavaScript只在已知的共享依賴根路徑名稱不同，僅替換該完整前綴後其餘內容完全一致，未忽略其他差異。證據在 `docs/verification/cloudflare-clean-install.json`。

Wrangler 仍列出固定 PHP loader 既有 direct-eval／重複鍵警告，保留在紀錄。本輪驗證的是來源、依賴及部署打包重建；沒有因此再次部署遠端、初始化新的WordPress資料，或重新做一輪空環境備份還原。正式官網仍維持目前版本。

## 最新獨立部署及第13段修正

全新依賴／核心資產的建置之後，已部署至另一個空DO及新R2桶，還原最新備份。首次重新部署發現MDI把草稿空白slug改為檔名，故新增 `empty-slug/`；修正版已完成私人副本跨部署、編號與清理驗收。更新後重建工具再次從固定archive組裝13段patch，59個來源檔完全一致，見 `docs/verification/cloudflare-empty-slug-reassembly.json`。這是最新來源比對，沒有再次重裝相同依賴；先前binary／JavaScript比對仍屬加此修正之前的建置證據。

新設定及驗收腳本由 `independent-restore/` 一併交付。原始備份／secrets需另外安全交接；重建工具不帶入它們。詳細結果、已修正缺陷與限制見該目錄README；正式官網仍未切換後台。

## 第14段：完整附件欄位保存

原生瀏覽器驗收揭露舊媒體關聯缺漏，新增 `postmeta/` 修正。新版完整表、版本標記及工具由重建流程在獨立還原工具之後套用，60個來源檔與候選完全一致。TypeScript及private dry-run通過；原生上傳、兩次相同程式部署、完整備份欄位編號比對及自有附件清理通過。沒有重新安裝依賴或產生相同核心資產。原品牌附件歷史關聯與內嵌網址仍待處理，詳見 [附件保存](postmeta/README.md)。

## 原附件資料修復與操作工具

後續已完成14個品牌原檔及1個舊探針的附件關聯修復、現有內容30處網址遷移、原生編輯儲存／重開與清理。`media-repair/` 六個工具在postmeta之後加入組裝，包含更新後的備份label清單；14段來源patch不變，60個來源與6個工具再次比對完全一致。這次沒有新runtime部署或依賴重建。歷史修訂網址、request-body-unavailable／取消診斷與其他操作驗收仍開放，詳見 [本輪結果](media-repair/README.md)。

## 第15段：請求中斷原因診斷

`request-diagnostics/` 在上述來源之後套用，記錄body失敗前的狀態與封閉原因，不保留錯誤全文或請求內容。私人rebuild設定明確啟用 `enable_request_signal`，相容日期不變。受控完整heartbeat中斷已重現aborted-before-read，正常原生儲存／清理及完整備份驗證通過；不推論早期未充分觀測事件的確切原因。15段patch／60來源、4工具、1測試及私人設定重新組裝一致，TypeScript及dry-run通過。詳細證據與尚未完成範圍見 [請求診斷](request-diagnostics/README.md)。

## 第16段：內容位元組保存

`history-origin/` 加入歷史修訂搬移及原生還原驗證工具；18筆修訂的28處網址已處理。測試揭露MDI的rtrim會移除末尾字元，因此 `content-bytes/` 新增第16段patch及內容格式policy。新寫入帶長度及SHA，兩種讀取路徑只去掉額外的格式LF，舊資料讀法保持不變。235項PHP／MDI檢查、TypeScript、dry-run、遠端原生還原、新登入、相同程式重新部署及清理／最後備份核對通過。

最終16段patch／61來源及8工具重新組裝一致，沒有重裝依賴或重生核心資產。新格式備份須使用相容程式，不能只回退程式。原始失敗與驗證器修正均保留；目前限制與完整證據見 [內容保存](content-bytes/README.md) 及 [歷史修訂](history-origin/README.md)。

## 第17段：私人診斷取樣（2026-11-19）

62個來源檔與現候選逐位元一致（UTF-8/LF正規化）；另比對9個交付工具與1份測試。完整來源組裝及額外檔對照見 `diagnostic-sampling/reassembly-verification.json`。這次組裝不重做依賴安裝或資產產生；較早的獨立乾淨安裝證據仍另存。runtime新增取樣helper；Python pprof分析器另顯式複製至scripts，不由mjs篩選漏掉。只採用診斷取樣修正，沒有採用OPCache設定。

## 未採用的保存延遲候選（2026-11-19）

`write-latency/` 的並行保存只保留為實驗證據，未加入組裝序列；目前仍是17段patch／62來源。不要將 `not-adopted-canonical-writes.patch` 當成下一段採用修正，也不要自動複製 `.candidate.ts`。詳細比較、原版恢復與備份結果見該目錄README。

## 第9個選用階段：草稿持久讀回（2026-11-21）

在前8個選用階段後，依 `editor-readback/README.md` 套用已檢查雜湊的候選。預設重建器不自動採用；全20個部署設定沒有啟用新旗標。完整來源比對75檔、輔助與前置檔82份，重複套用在修改前拒絕；沒有重新產生核心資產或部署。
