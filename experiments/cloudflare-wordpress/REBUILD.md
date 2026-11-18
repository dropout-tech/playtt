# 從固定上游重建目前候選

`rebuild-candidate.py` 使用 Python 標準函式庫與 Git，把已採用的12段修正及額外來源檔組裝到全新資料夾。它不連網、不安裝依賴、不部署、不帶入網站資料或憑證，且拒絕覆寫既有目錄。

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

## 這輪實際驗證範圍

從重新下載的上游 archive 組裝成功：12段 patch、57個 TypeScript 來源與目前候選相同，私人 audit 設定也須與對應 reproduction hash 一致。另一份組裝輸出略過舊 shrinkwrap，所得來源仍一致。

TypeScript 與私人 audit 的 Wrangler dry-run 已通過，打包20776.57 KiB／gzip7586.49 KiB。這兩項使用既有固定依賴與三份已產生的官方核心 artifact manifest，重新產生本機 PHP loader；沒有重新跑 npm ci 或重新下載核心資產。因此這輪證明來源組裝與固定依賴下編譯／打包，不聲稱全新機器從零安裝、全空後台初始化或遠端部署完成。

Wrangler 仍列出固定 PHP loader 既有 direct-eval／重複鍵警告；沒有隱藏它們，也沒有因重建而修改 loader 的執行語意。對照證據見 `docs/verification/cloudflare-clean-rebuild.json`。
