最新：[舊版套件已在私人Cloudflare完成原生回復及冷讀](../old-provider-native/README.md)；雲端181／pin16／餘62,344。

# 舊碼實際部署套件：已建置及本機原生驗證

2026-11-22（台北），從已核對的舊碼67dd308建立真正Wrangler部署輸出，移除「只測過localhost專用套件」這項證據缺口。**這份新套件只完成本機測試，尚未部署到Cloudflare**。目前私人雲端仍178／pin15／餘650,908；正式Pages及原視覺不變。

## 套件來源

隔離目錄work/playtt-old-provider-build含77個精確舊來源、已固定的9個runtime資產、PHP生成loader及package-lock；109個核心vendor檔與既有兩份來源核對。使用已安裝依賴的junction，沒有重新下載／安裝依賴，也不是全新上游重建。資產沿用先前rollback-plan；其中wordpress-runtime-artifact.json原先就與歷史source assembly不同，這點保留在既有plan，未宣稱完整歷史二進位重建。

Wrangler4.127.1以src/worker-playtt-do.ts為真正入口dry-run；沒有localhost限制、local bootstrap或fixture storage adapter進入輸出。65個實際載入來源（含生成loader）逐項核對，不能混入目前相容reader新來源；另外記錄解析到的依賴SHA。6個部署模組總計20896.92KiB／gzip7610.85KiB，主bundle SHA f5e10640024fa5050527b5069a55c619c1780f0652479fc7119653d8720610c1。既有PHP生成碼的duplicate-key等警告保留，沒有把警告描述成零。

唯一候選設定差異為PLAYTT_CONTENT_OVERLAY=content-v1。保留既有私人worker／bucket／DO／partition／probe gate、總容量150,000,000、無cron及正式routes；沒有套用到雲端。現行相容reader來源97a92c8與封存版本8c615f36保留可供回退。

Cloudflare官方限制頁於本次查閱列Workers Free／Paid的Worker size均64MiB；建置大小未因此要求升級。是否能在Free穩定處理PHP，仍須獨立驗收CPU／整體isolate記憶體與用量。[官方Workers限制](https://developers.cloudflare.com/workers/platform/limits/)

## 實際本機原生流程

從雲端178的獨立備份建立新fixture，直接載入上述Wrangler輸出的主bundle與5個二進位模組。fixture wrapper只提供本機bootstrap及Miniflare空storageClass→Standard的既有相容處理；這些不在部署輸出。用真正SQLite Budget及600秒／650,908bytes／96operations窗口約束原生寫入。

登入179 → 保存180 → 完整workerd停止／重啟 → 讀回180 → 原生登出181。第10段繁中內容及revision208精確，先前9段與revision207保留；原5個登入session和所有usermeta一致，這次新增session已由原生登出移除；其他內容／媒體／主題不變。獨立匯入303物件／298檔核對通過。

實際計帳588,515bytes／13puts，窗口餘62,393；最終closed／sealed／pending0、fence釋放、publisher paused。外連嘗試0，所有本機程序結束。此fixture未複製雲端完整歷史、15pins及recovery receipt rows，所以不是雲端餘額或歷史相容性的完整證明。

本機login GET2746ms、login POST1002ms、profile851ms、save911ms、重啟後read2839ms、logout1569ms。這些是localhost HTTP牆鐘時間，不能當Cloudflare／瀏覽器／IME或CPU測量。與之前localhost專用bundle的588,515bytes相同，仍不保證雲端在62,393bytes餘量內完成。

## 使用方式與接續

這個stage接在recovery-provider assembly之後。install-local-tools.py --runtime <runtime> --apply先驗86項SHA，再加一個本機驗證script；來源82／設定20不改，重套在改檔前拒絕。prepare-build.py --workspace <workspace>與verify-build.py --workspace <workspace>供相同目錄結構重建；前者拒覆寫既有build目錄，後者拒覆寫既有report。依賴junction由Windows New-Item -ItemType Junction明確連到已核對runtime/node_modules；Wrangler使用dry-run、config wrangler.playtt-old-provider.jsonc、outdir build、metafile build/metafile.json。私密snapshot／登入資料不在此交付中。

本機script也有owner guard，**已完成的artifacts/playtt-old-provider-native-local-owned-private.json不可重跑**。目前雲端仍178，勿把本機181寫入雲端checkpoint。下一步先刷新雲端178狀態、pins、剩餘額度與Free用量，再備妥受限原生測試及相容reader回退。尚未在provider部署舊碼，不能宣稱已完成舊版雲端回復。

無新增總額度／退款／刪pin或歷史／清unknown pending；不切換正式後台。原生編輯器、繁中初始化、整體記憶體／CPU、持續Free與實機／A01–A20仍未完成，目標active、PR4 draft。

證據：[建置與SHA](../../../docs/verification/cloudflare-old-provider-artifact-build.json)、[原生流程](../../../docs/verification/cloudflare-old-provider-artifact-native.json)、[增量組裝](../../../docs/verification/cloudflare-old-provider-artifact-rebuild.json)、[交付審核](../../../docs/verification/cloudflare-old-provider-artifact-review.json)。
