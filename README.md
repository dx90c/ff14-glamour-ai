# FF14 外觀辨識小工具 v2.4.0

[線上使用](https://dx90c.github.io/ff14-glamour-ai/) · [下載 HTML](https://dx90c.github.io/ff14-glamour-ai/FF14%E5%A4%96%E8%A7%80AI%E8%BE%A8%E8%AD%98%E5%B0%8F%E5%B7%A5%E5%85%B7.html) · [下載裝備庫 JSON](https://dx90c.github.io/ff14-glamour-ai/ff14_database.json)

從附有裝備名稱的穿搭圖片讀取文字，整理裝備、取得方式及染色，提供灰機、Google 連結與 Excel 複製、CSV、TXT 匯出。

## 使用方式

1. 開啟線上版，預設使用免費 PaddleOCR，不需 API Key。
2. 貼上、拖入或選擇圖片。第一次辨識需下載 OCR 引擎與模型。
3. 查看表格。「疑似匹配」表示系統依錯字或字形推測，請核對名稱；未讀到染色文字時顯示「未辨識染色」。

目前名稱庫支援繁中、簡中、英文、日文、法文、德文。預設 OCR 以中、英、日文為主要支援範圍，法文與德文尚未完整實測；韓文名稱未收錄。只有角色照片、沒有裝備名稱的圖片，請在「辨識模型」設定中改用 AI。AI 結果也需要核對。

可選擇 Gemini、ChatGPT（OpenAI API）或自訂 OpenAI 相容服務。自行填入 API Key，費用及額度依服務商規定；程式不會自動從 OCR 切換至 AI。

## 下載版

下載 HTML 與 JSON，放在同一資料夾。雙擊 HTML 後，首次在裝備庫視窗匯入 JSON。HTML 不內嵌資料庫或 OCR 引擎；OCR 引擎由本專案線上資源載入，模型由 PaddleOCR 官方資源下載，因此首次使用及資源未快取時需要網路。

遊戲改版後按「一鍵同步庫」。已最新的庫略過下載，失敗可再次按同一按鈕重試。線上版保存於瀏覽器；下載版首次同步需選擇資料夾並授權，之後自動保存 JSON，此功能需要 Chrome 或 Edge 支援。

部位與穿搭限制索引包含於隨附 JSON，取自現成來源資料。這些索引是發行時的快照，目前一鍵同步的三庫流程不會重新建立索引；後續版本更新時請更換隨附 JSON。提醒表示可穿裝備條件，不保證各伺服器當前投影規則相同。

## 資料與辨識來源

- [InfSein](https://github.com/InfSein/ffxiv-datamining-mixed)：五語裝備名稱、裝備描述中的種族與性別條件。
- [Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft)：繁中名稱、取得方式、部位與職業資料（MIT）。
- [LuminaSupplemental](https://github.com/Critical-Impact/LuminaSupplemental)：補充取得方式（GPL-3.0）。
- [OpenCC](https://github.com/BYVoid/OpenCC)：簡繁字形輔助（Apache-2.0）。
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)：PaddleOCR.js 0.4.2、PP-OCRv5 mobile 模型（Apache-2.0）。OCR 部署資源位於 `ocr/`，第三方授權見 `ocr/THIRD_PARTY_NOTICES.md`。

名稱庫目前有 29,338 件裝備；取得方式並非全部收錄。精準匹配優先，模糊匹配依字形與錯字距離找候選，取得方式按物品 ID 查來源庫。圖片小字、模糊文字或特殊排版可能漏讀；未匹配的 OCR 文字目前不會列入表格。

## 隱私

PaddleOCR 在使用者瀏覽器內處理圖片。改用 AI 時，圖片傳送至所選服務商；API Key 儲存在本機瀏覽器。資料庫、OCR 引擎與模型需要從公開網站下載。

## 維護

固定更新 `index.html`、`FF14外觀AI辨識小工具.html`、`ff14_database.json` 與 `ocr/`。HTML 保留 SECTION 分組，舊版位於 `old/`。[修改紀錄](CHANGELOG.md)

在專案根目錄執行 `node tests/regression.cjs` 與 `node tests/regression.cjs index.html`。這些檢查不呼叫付費 AI；OCR 的實際載入與辨識另以瀏覽器測試。
