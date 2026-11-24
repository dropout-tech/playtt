# 0.3.2 對比與據點連結修正

2026-11-25：公開的 0.3.0 品牌預覽完成一次首頁與課程頁手機 PageSpeed Insights 量測。依結果修正主題的頁尾小字對比，並讓兩個地圖按鈕清楚標示據點，包裝為 0.3.2。本輪未更新公開預覽或正式官網。

## 公開預覽的量測

| 0.3.0 預覽頁面 | 手機效能 | FCP／LCP | TBT | CLS | 無障礙 |
| --- | --- | --- | --- | --- | --- |
| [首頁報告](https://pagespeed.web.dev/analysis/https-d344e4ab-playtt-brand-preview-pages-dev/rfdfnmdo5rq2knctebhgh3?form_factor=mobile) | 99 | 0.9s／0.9s | 0ms | 0 | 95 |
| [課程報告](https://pagespeed.web.dev/analysis/https-d344e4ab-playtt-brand-preview-pages-dev-class/y0p959t2uusa9tzp5zgmy5?form_factor=mobile) | 100 | 0.9s／0.9s | 0ms | 0 | 96 |

Lighthouse 13.6.0、模擬 Moto G Power、慢速 4G，報告時間 02:10（Asia/Taipei）。這是各一次實驗室結果，沒有真實訪客 CrUX 資料。SEO 69 的失敗項是預覽的索引封鎖，保留此限制；正式站 SEO 不能拿預覽分數代替。報告仍列出 CSS 阻擋、快取及首頁圖片傳送改善建議。

[完整摘要](pagespeed-preview-0.3.0.json)／[首頁原始可見報告](pagespeed-home-030.txt)／[課程原始可見報告](pagespeed-class-030.txt)。這些分數不是修正後 0.3.2 的遠端成績。

## 修正及驗證

- 頁尾藍底的 12px 黃色眉題改為白色；原品牌藍、SVG、主版面不變。[對比](contrast.json)由 3.5926 提升至 4.9373。
- 首頁與據點頁的地圖按鈕改成「蘆洲店地圖 ↗」「林口桌球地圖 ↗」，目的地未變。
- 0.3.1 修正後的原生 SVG 圖片區塊不帶 width／height。靜態檢查現在允許具有有效 viewBox 尺寸的本地 SVG；點陣圖片仍強制檢查兩個尺寸，並新增指定輸出目錄參數，避免為驗證預覽而覆寫正式 public。
- 匿名匯出六頁／51檔通過靜態完整性檢查，既有正式發布目錄六頁／48檔也通過。首次匯出因沙箱禁止 loopback 連線失敗；獲准本機執行後完成，兩個匯出程序均退出。
- [Chrome 針對性檢查](local-browser.json)：首頁、課程、據點各 375／1440px，實際寬度相符，沒有水平溢出；白字／藍底 computed style、地圖文字與目的地正確，已載入圖片無壞圖，console warn/error 為空。前一次內建瀏覽器未套用指定尺寸，已排除在響應式通過結果外。

[主題包清單](package.json)：42檔／897,923bytes，SHA-256 `e7a33a9bf00195dc91b4f3f9f31cf2e6c7d88824c56c627f327d98a9aa346c7d`，由 Git index 包裝。相較 0.3.1 僅 style.css、home.php、locations.php 三個主題文字檔不同。完整原生編輯及冷啟動證據仍屬 [0.3.1](../theme-0.3.1/NATIVE_EDITOR.md)，沒有宣稱重新跑過 0.3.2 全套後台試驗。

更新主題會套用 CSS，但不覆寫現有頁面；既有站點的地圖按鈕可依[編輯手冊](../../EDITOR_GUIDE.md)修改。免費 Cloudflare 完整後台、實體手機／IME、內容確認及長期使用仍未完成。

[交付檢查](review.json)記錄42檔包裝、失敗負例及本機port關閉。本輪工具實際Node為24.13.0，低於專案建議的24.18.0；記錄的檢查通過，但未宣稱用建議Node版本重跑。
