# 0.3.0 品牌預覽部署

2026-11-25，獨立免費 Pages 預覽已成功發布：

- [固定版本預覽](https://d344e4ab.playtt-brand-preview.pages.dev/)
- [預覽分支網址](https://codex-playtt-brand-manual-pr.playtt-brand-preview.pages.dev/)
- 主題／PDF來源提交：`182751ec09efba0001f86ad07c105499ca7a87ce`
- 預覽靜態提交：`13a8d623c69b06dfa787d52ba9e42feb89cd213b`
- 預覽分支：`codex/playtt-brand-manual-preview`
- Cloudflare 部署：`d344e4ab-f8a8-48b2-899a-4871c0833f44`，Dashboard讀回 `Preview / success`，18秒。

原生匿名匯出只做CSS換行正規化，51個發布檔與[匯出清單](export-normalized.json)相符。Cloudflare建置同樣通過6頁／51檔靜態檢查、解析2條導向與3組header規則，沒有Pages Functions或資料庫綁定。既有可選Workers用wrangler檔被Pages略過的警告仍存在，實際建置使用Dashboard設定。

## 遠端驗證

- [預覽HTTP結果](preview-http.json)：49個可公開下載檔逐一SHA-256一致；自訂404與`/home/`的301皆通過。`_headers`、`_redirects`為平台設定，不當作公開下載檔。
- [正式站HTTP結果](production-http.json)：46個公開檔與原正式靜態內容一致；404與301通過。正式`playtt.tw`仍是0.2.3畫面，沒有套用0.3.0。
- [實際Chrome紀錄](preview-browser.json)：公開預覽於1920×855及375×812無水平溢出、6組品牌圖案存在、已載入圖片無壞圖；手機選單5項均60.75px，Escape返回可見開啟按鈕。這兩個尺寸是遠端驗證，原本18組完整矩陣是本機同內容驗證，兩者不混稱。
- 本次遠端導覽及手機選單觀測的console warn/error為空。實體裝置、螢幕閱讀器與中文IME仍待。

![公開桌機預覽](preview-1920.jpg)

![公開手機預覽](preview-375.jpg)

## 正式環境與後台

Pages production branch仍是`codex/playtt-wordpress-cloudflare`；本輪來源提交觸發既有自動建置，但該分支`cloudflare/public`與`b67c191`完全相同。0.3.0僅在獨立preview分支。原始PDF沒有放進公開發布目錄。

Supabase僅讀取官網查核所需的據點、教練姓名及課程商品描述；沒有資料庫修改。私人WordPress後台沒有新寫入、部署或切換，原單次寫入授權已使用完畢。PR4保持draft，營業內容依[待補清單](../../CONTENT_REVIEW_20261125.md)繼續核對。

本機9427預覽服務已正常停止，owner紀錄確認disposed；最終ZIP隔離整合程序退出0。瀏覽器查核結束恢復視窗設定，保留公開候選分頁供使用者檢視。
