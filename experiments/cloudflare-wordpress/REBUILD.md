最新本機選用候選：[path-join](path-join/README.md)。先產生原固定PHP loader，再在獨立目錄執行`python path-join/apply-loader-candidate.py --runtime <runtime> --apply`；核對完整SHA，只改1條statement。此候選尚未部署或採用到中央runtime，完整保存／重啟驗證仍待；舊回復建置保持原generator。

# 從固定上游重建目前候選

2026-11-21最新：`markdown-write/` 同一來源新增12個provider／診斷工具與測試，第12階段仍只採同一份runtime patch；25+12階段重建77來源／131輔助檔、20設定不變，重複套用先拒絕。本輪來源仍67dd308，私人最終部署9f5aa2c1已停用暫時旗標。證據 `docs/verification/cloudflare-markdown-provider-reassembly.json`；下方原119輔助檔為前輪紀錄。

最新選用組裝：先按 [content-io](content-io/README.md) 完成前11階段與最新helpers，再按 [markdown-write](markdown-write/README.md) 套第12階段。新目錄逐字比較77來源／119輔助檔、20設定不變，重複套用先拒絕；預設assembler仍不自動加入選用候選。此輪無部署，官方核心資產沿用先前雜湊驗證檔，fresh deployment仍須既有核心產生步驟。證據 `docs/verification/cloudflare-markdown-write-reassembly.json`。

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

第9階段後續增加5個原生負向測試工具（未提交儲存與多分頁暫存保護），完整重建比對仍75來源，輔助／前置檔增至87份。20設定及可部署來源與8612eae相同；本輪不重生核心資產、不部署。見 `docs/verification/cloudflare-readback-negative-reassembly.json`。

第9階段再增加4個有界provider HTTP／備份／pin／離線核對工具，75來源與20設定未改，輔助／前置檔共91份。私人測試以CLI暫時啟用旗標後已重部署停用；實際版本、狀態與重建證據見 `docs/verification/cloudflare-readback-provider-*.json`，不把測試部署當正式後台切換。

## 第10個選用階段：有界內容差異快照（2026-11-21）

完成前九個選用階段後，可另套用 `content-overlay/apply-local-candidate.py`。它修改worker、共用格式分派、bundle與pin client，新增格式、測試及兩個有界工具；驗證所有來源雜湊後才寫入。預設重建仍不包含此候選，20份設定不變且新旗標關閉。新讀取器支援完整包／v1／v2／content-v1，舊讀取器拒絕content-v1；降版需先materialize完整包。詳見 [content-overlay](content-overlay/README.md)；新重建證據見 `cloudflare-content-overlay-reassembly.json`。沒有部署或重新產生核心二進位資產。

### content-overlay 的 provider 工具補充（2026-11-21）

第10選用階段另加入8個下載、一次性驗證、備份／pin、部署後入口與診斷工具／測試；runtime來源仍為223db5e候選，76來源／102輔助檔可逐字重建，20設定未變，重複套用先拒絕後不寫入。`cloudflare-content-provider-reassembly.json`記錄新組裝，舊105項來源測試沿用，3項下載界線測試通過。實際私人部署已保留相容讀取器並停用實驗旗標；參閱更新後content-overlay runbook，不能把組裝成功視為正式後台驗收。

## 第11個選用階段：有界物件讀取（2026-11-21）

前10階段完成後可套用 `content-io/apply-local-candidate.py`，全數來源先驗證並預備patch後才寫入5個變動／新增檔。僅一個runtime來源變更，格式／旗標不變，20設定未改。25+11完整重建逐字比對76來源／106輔助或前置檔通過，重複套用先拒絕、無部分寫入。未部署或重建核心資產；預設組裝不含此選用階段。證據 `cloudflare-content-io-reassembly.json`，runbook見 [content-io](content-io/README.md)。

### content-io 的 provider 工具補充（2026-11-21）

第11選用階段另增6個有界provider／備份／pin／診斷／離線核對工具；沒有再改runtime來源，仍bbe6a4d。25+11重建比對76來源／112輔助或前置檔、20設定未變，重複套用先拒絕不寫入。先前115來源檢查沿用，不因僅新增工具重跑。實際私人部署、130／pin11、觀察排程缺口見 `cloudflare-content-io-provider-*`；最新owner改接content-io-provider-cold，舊126窗口不可重跑。

## 選用本機背景寫入診斷

完成 markdown-write 後，可執行 background-write/install-local-tools.py --runtime <runtime-cloudflare> --apply。此工具只新增九個診斷檔，不是 runtime patch 階段，不修改來源或 20 份設定；詳見 [說明](background-write/README.md)。私人備份與 owner 不隨 Git 交付。

## 選用第 13 階段：原生編輯器心跳

先完成 markdown-write；若需要 background-write 的九個診斷工具，先安裝再套本階段。執行 editor-heartbeat/apply-local-candidate.py --runtime <runtime-cloudflare> --apply。驗證結果為 78 個來源、142 個輔助檔、20 份設定不變，沒有自動啟用旗標或部署。詳見 [說明](editor-heartbeat/README.md)。

## 選用本機容量診斷工具

完成editor-heartbeat與先前background-write工具後，執行heartbeat-budget/install-local-tools.py --runtime <runtime-cloudflare> --apply。新增3個工具，不改runtime或設定，也不部署。完整流程容量失敗的適用範圍見[說明](heartbeat-budget/README.md)。

## 選用未接線的壓縮格式原型

完成既有候選與診斷工具後執行compressed-content/install-local-prototype.py --runtime <runtime-cloudflare> --apply。只新增一個模組、一份測試與兩個本機工具；不改現有來源、設定或啟用旗標。詳見[原型與限制](compressed-content/README.md)。
