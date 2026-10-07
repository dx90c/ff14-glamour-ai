# FF14 幻化外觀 AI 辨識小工具

讀取**附有裝備名稱文字**的 FF14 穿搭圖片，將名稱比對至裝備資料庫，整理取得方式與圖片中的染色資訊，方便查找與保存。

[線上使用](https://dx90c.github.io/ff14-glamour-ai/) · [下載完整檔案](https://github.com/dx90c/ff14-glamour-ai/archive/refs/heads/main.zip) · [下載完整檔案](https://github.com/dx90c/ff14-glamour-ai/archive/refs/heads/main.zip) · [下載 HTML](https://dx90c.github.io/ff14-glamour-ai/FF14%E5%A4%96%E8%A7%80AI%E8%BE%A8%E8%AD%98%E5%B0%8F%E5%B7%A5%E5%85%B7.html) · [下載裝備庫 JSON](https://dx90c.github.io/ff14-glamour-ai/ff14_database.json)

## 功能與限制

- 貼上、拖入或選擇圖片，將辨識結果整理成裝備表格。
- 比對裝備名稱，查詢來源庫收錄的取得方式，提供灰機 Wiki 與 Google 搜尋連結。
- 讀取染劑名稱文字，並依文字位置配對裝備；不能僅憑衣服顏色判斷染劑。
- 依已收錄資料顯示跨職業、種族與性別限制提醒。
- 匯出含原圖的 XLSX，或下載 CSV、TXT。XLSX 保留裝備原名、取得方式、染色、疑似匹配與穿搭提醒，圖片放在 F 欄等比例縮放。
- 對部分未匹配、低信心或小字區域自動裁切放大重讀，維持原有名稱匹配門檻。雙語名稱與染劑可依位置合併；兩個明確色槽使用相同染劑時保留兩槽。

**本工具沒有提供僅憑角色外觀辨認裝備的可靠功能。** 使用 OCR 或 AI API，都建議提供帶有清楚裝備名稱的圖片。

名稱庫支援繁中、簡中、英文、日文、法文與德文。預設 PaddleOCR 模型主要支援中、英、日文；法文、德文尚未完整實測。韓文名稱目前未收錄。

圖片小字、模糊文字、特殊排版可能造成錯字或漏讀。免費 OCR 模式目前只列出成功匹配的裝備，表格可能不完整。

「疑似匹配」表示系統依字形或錯字差異推測候選，請核對名稱；「未辨識染色」不代表沒有染色。染色與裝備的配對也可能出錯。模型信心分數不等於結果正確率。

取得方式與限制資料並非全部收錄，且可能因伺服器或版本而不同。沒有出現穿搭提醒，不代表整套裝備沒有使用限制。

## 使用方式

1. 開啟線上版，貼上、拖入或選擇圖片。
2. 預設使用免費 PaddleOCR，不需 API Key。首次辨識需下載引擎與模型，請保持網路連線。
3. 查看結果，核對疑似匹配與染色，再使用搜尋連結或匯出結果。

如需使用 AI API，可在「辨識模型」設定中選擇 Gemini、ChatGPT（OpenAI API）或其他 OpenAI 相容服務，填入自己的 API Key。費用與額度依服務商規定，程式不會自動由 OCR 切換至 AI。

## 下載版與資料更新

建議下載完整檔案並解壓縮，保留 `FF14外觀AI辨識小工具.html`、`ff14_database.json`、`ocr` 與 `xlsx` 資料夾的相對位置。若只下載 HTML 與 JSON，含圖 XLSX 匯出還需要同層的 `xlsx` 資料夾。雙擊 HTML 開啟後，首次需在裝備庫視窗手動匯入 JSON。

**免費 OCR 需要 HTTP(S) 網址，不能直接從 `file://` 執行。**一般使用者請使用線上版；下載版直接雙擊 HTML 可使用 AI API。若自行架設本機 HTTP 伺服器，也可使用免費 OCR。免安裝的本機啟動器尚未提供。

OCR 首次使用仍需連線載入模型；快取可重用，但不保證完全離線。AI API、搜尋與資料同步需要網路。XLSX 在瀏覽器產生，不會因匯出而上傳圖片。

XLSX 檔名為 `YYYYMMDD標題_HHmmss.xlsx`；沒有可用標題時使用身體裝備名稱，再依序使用第一件裝備名稱、FF14外觀筆記。日期與時間採使用者瀏覽器的本機時間。保留原圖中的署名與水印；匯出檔案不代表取得原作者的公開轉載授權。

遊戲改版後按「一鍵同步庫」，名稱、取得方式、部位與穿搭限制會隨各自來源一起更新。已最新且索引完整的來源會略過下載；失敗時再次按同一按鈕即可重試，已完成的來源會保留。

- **線上版**：資料保存在目前瀏覽器，關閉頁面後仍會保留；清除網站資料或更換瀏覽器後需重新載入。
- **下載版**：資料也保存在目前瀏覽器。若要同步寫回資料夾中的 JSON，請使用支援資料夾寫入的瀏覽器（如 Chrome、Edge），首次選擇資料夾並授權即可。

## 隱私

PaddleOCR 在使用者瀏覽器內處理圖片，不將圖片傳送至 OCR 服務。引擎、模型與資料庫仍需從公開網站下載。

API Key 儲存在本機瀏覽器。使用 AI API 時，圖片與驗證所需的 API Key 會直接傳送至所選服務商或自訂端點，本專案沒有代收圖片與金鑰的後端服務。

## 資料來源

| 來源 | 用途 | 授權 |
| --- | --- | --- |
| [InfSein](https://github.com/InfSein/ffxiv-datamining-mixed) | 五語裝備名稱、裝備描述中明載的種族與性別條件 | 請參閱來源專案 |
| [Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft) | 繁中名稱、取得方式、部位與職業資料 | MIT |
| [LuminaSupplemental](https://github.com/Critical-Impact/LuminaSupplemental) | 補充取得方式 | GPL-3.0 |
| [OpenCC](https://github.com/BYVoid/OpenCC) | 簡繁字形輔助匹配 | Apache-2.0 |
| [ExcelJS](https://github.com/exceljs/exceljs) | 含圖 XLSX 匯出 | MIT |
| [ExcelJS](https://github.com/exceljs/exceljs) | 含圖 XLSX 匯出 | MIT |
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | 圖片文字辨識 | Apache-2.0 |

取得方式優先使用物品 ID 對應的來源記錄，不以 AI 推測內容作為已驗證來源。資料版本可在工具的裝備庫視窗查看。

ExcelJS 授權見 [授權檔](xlsx/ExcelJS-LICENSE.txt)。ExcelJS 授權見 [授權檔](xlsx/ExcelJS-LICENSE.txt)。OCR 第三方授權見 [授權說明](ocr/THIRD_PARTY_NOTICES.md)，版本更新見 [CHANGELOG](CHANGELOG.md)。
