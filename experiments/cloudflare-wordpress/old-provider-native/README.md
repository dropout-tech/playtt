# 真正舊碼已在私人Cloudflare完成原生流程並回到相容reader

2026-11-22（台北），在既有playtt-wp-free-session-audit部署舊source67dd308的固定套件，完成登入、繁中保存、重新部署冷讀、原生登出與獨立備份。**這是實際provider證據；正式Pages／原視覺及後台入口維持現況，完整目標仍active。**

## 最新狀態

2026-11-21 16:52:39.597Z最後GET驗證：canonical181／revision9e732918-4430-4381-8275-fee800f414cb，pin16且原15個逐項保留，剩62,344bytes，closed／sealed／pending0，fence已釋放、publisher paused。最後Worker版本aa595610-cc7c-44b9-89ec-f11f4939902f為原相容reader97a92c8；content／compression／heartbeat／readback／recovery額外旗標全部關閉，recovery status回404。Coordinator、精確commit receipt與API直接下載R2 current.json三者一致。

目前起點已是181，不能再使用178或177的起點，不能重跑已完成owner／window。固定總額度150,000,000沒有增加，也沒有退款、刪歷史／pin或強制清unknown ticket。

## 實測流程

先GET核對178／pin15／餘650,908與相容版本8c615f36，下載manifest核對獨立備份。最初受限執行環境fetch失敗的log保留；依已授權範圍開放網路的唯讀執行通過，沒有新增OAuth權限。

先前已測過的舊版6個模組與相容reader6個模組，這次再以Wrangler --no-bundle --dry-run確認輸出逐檔SHA相同。正式實驗三次部署都使用固定模組，每次前重新核對檔案與設定、後核對provider版本／bindings；不在部署時重新編譯依賴。

| 步驟 | 實際結果 |
|---|---|
| 舊碼部署 |072fd18a-45e1-4f58-a39c-0cd517d573d5，資料仍178 |
| 原生登入 |179；只操作既有驗證使用者及私人draft193 |
| 保存 |180；第10段繁中及revision208正確 |
| 再部署同一舊模組 |b8e0a87d-1b4f-438e-ac8a-d360ccbc5cc6；持有fence及drain，狀態／計帳不變 |
| 冷啟動讀回 |仍180，內容精確；live tail在此版本捕捉到completed cold REST read |
| 原生登出 |181；這次登入session移除，原5個session與全部usermeta逐項一致 |
| 備份與pin |API下載8相依物件／2,805,072bytes，獨立匯入303物件／298檔；新增第16pin |
| 回相容reader |aa595610；關閉所有額外writer／recovery旗標、解除fence |

窗口600秒／650,908bytes／96operations；實際588,564bytes／13puts，餘62,344。比本機多49bytes：獨立比較revision208，只有GUID因雲端origin較長多49bytes，日期欄位等長、內容一致；這解釋本次差值，並非未來成本保證。三次部署、整段備份／回退於16:50:24至16:52:02Z完成。

保存後先驗剩餘額度足以涵蓋本機實測登出物件／清單／pointer合計93,268bytes，且留180秒，再進入重新部署。任一失敗都不重試原生mutation、不清unknown ticket；關自己的窗口、僅pending0才封存，保存失敗證據及相容reader回退。這輪沒有發生unknown或故意provider故障注入。

## 驗證範圍

原9段、revision207及所有原posts列保留；新增revision208內容精確。其他內容／媒體／主題未變；只有預期page、posts表與auto-increment檔案變動。新備份在封存後由Cloudflare API獨立取得，非拿上傳前本機內容冒充。原15pins在每次狀態讀取及最終再次核對。

live observer已終止，共172事件outcome皆ok、exceptions空，包含166個200／4個302／2個404；404仍保留，不宣稱所有HTTP皆200。PHP heap15樣本64–68.25MiB；**這不是整個isolate記憶體或provider CPU測量**。雲端HTTP login頁4065ms／login POST3560ms／save3728ms／冷讀3007ms／logout3544ms，只是這次HTTP樣本，不是瀏覽器／Gutenberg／IME或長期效能驗收。

登入管理頁確認Workers Free/$0；R2本期October25–November25仍$0.00／2.33GB。ClassA7.29k，ClassB由60.26k至60.36k。帳單可能延遲，DO詳細用量未刷新，不代表持續Free已驗收。

82個runtime來源及20設定未改；沿用已驗95項source測試，不為封裝證據重跑。新增3個執行／唯讀工具與固定部署plan，增量組裝核對88前置SHA；不含私人備份、cookie、登入資料、原生HTML或產生的模組。這輪驗證的是已固定歷史來源及既有依賴，不是新下載上游的完整重建。

## 接續

latest owner為artifacts/playtt-old-provider-owned-private.json，phase verified-closed-sealed-compatible-reader，含181獨立備份anchor與最新window／drain；原owner及失敗／本機fixtures都保留。remote helper只允許check或run --remote，已完成guard禁止重跑；preflight與final均GET-only。先前localhost測試181和本次雲端181是不同revision，不能混用anchor。

現有雲端餘62,344bytes，低於已量測登出93,268bytes；不開新的完整原生寫入流程，也不換bucket繞過額度。下一步以最新181獨立備份繼續本機繁中初始化／Gutenberg記憶體與延遲分析，及可做的唯讀provider用量觀測。再以實測結果提出後續受限雲端驗證方式；不得自行加總額度／付費或切換正式後台。

整體isolate／CPU、長期Free、瀏覽器／實體裝置／IME、A01–A20完整驗收仍未完成。目標active、PR4 draft。

證據：[實測](../../../docs/verification/cloudflare-old-provider-native-result.json)、[最後GET](../../../docs/verification/cloudflare-old-provider-native-final.json)、[觀測](../../../docs/verification/cloudflare-old-provider-native-observation-summary.json)、[49bytes差值](../../../docs/verification/cloudflare-old-provider-native-byte-difference.json)、[重建](../../../docs/verification/cloudflare-old-provider-native-rebuild.json)、[審核](../../../docs/verification/cloudflare-old-provider-native-review.json)。
