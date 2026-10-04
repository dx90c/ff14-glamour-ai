# FF14 幻化外觀 AI 辨識小工具 · 2.3.0

[線上使用](https://dx90c.github.io/ff14-glamour-ai/) · [下載 HTML](https://dx90c.github.io/ff14-glamour-ai/FF14%E5%A4%96%E8%A7%80AI%E8%BE%A8%E8%AD%98%E5%B0%8F%E5%B7%A5%E5%85%B7.html) · [下載裝備庫](https://dx90c.github.io/ff14-glamour-ai/ff14_database.json)

讀取附有裝備名稱的穿搭圖片，整理裝備、染色與取得方式，提供灰機與 Google 連結，以及剪貼簿、CSV、TXT 匯出。

## 使用

1. 設定自己的 Gemini、OpenAI 或 OpenAI 相容服務 API Key。服務額度與費用依供應商而定。
2. 貼上、拖入或選擇穿搭圖片。
3. 查看結果；「疑似匹配」表示系統自動猜測的裝備，請留意名稱。

網頁版第一次自動讀取裝備庫並保存於瀏覽器。下載版使用兩個檔案：FF14外觀AI辨識小工具.html 與 ff14_database.json；雙擊 HTML 後在裝備庫視窗首次匯入 JSON。辨識圖片、同步及灰機預查需要網路，名稱比對可離線執行。

遊戲改版後按「一鍵同步庫」。三庫分別檢查，已最新的庫不重新下載，失敗後再次按同一顆按鈕即可重試。下載版首次同步需選擇 HTML 所在資料夾，之後自動保存 JSON；此功能需要瀏覽器支援資料夾寫入與授權。網頁版直接保存瀏覽器，不要求本機資料夾。

## 資料來源

- 主庫：[InfSein](https://github.com/InfSein/ffxiv-datamining-mixed)：五語名稱。
- 來源庫：[Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft)：繁中名稱及取得方式（MIT）。
- 副庫：[LuminaSupplemental](https://github.com/Critical-Impact/LuminaSupplemental)：補充取得方式（GPL-3.0）。
- 字形輔助：[OpenCC](https://github.com/BYVoid/OpenCC)：相关字形表（Apache-2.0，授權全文在 HTML）。

目前隨附 JSON 有 29,338 件裝備、24,971 件支援的來源記錄；不保證全部名稱或來源都齊全。上游版本與授權保存在 JSON。Teamcraft 的「補丁索引至」不代表取得方式完整覆蓋該遊戲版本。

精準匹配優先，其次以簡繁字形、相似字權重與長名稱最多兩字差異自動猜測；候選不明確時查灰機。來源按候選物品 ID 查現成資料，不由名稱前綴或 AI 猜來源。灰機預查可能受 Cloudflare 或跨域限制，失敗保留站內搜尋。

## 隱私與維護

金鑰儲存在本機瀏覽器；圖片送至你選擇的 AI 服務商，資料庫由公開 GitHub 取得。請勿分享含有私人金鑰的瀏覽器資料。

固定更新 index.html、FF14外觀AI辨識小工具.html 與 ff14_database.json，舊版位於 old。[update 2.3.0 改進項目](CHANGELOG.md)。HTML 保留 SECTION 分組，便於定位維護。

## 程式驗證

在專案根目錄執行 Node：

```sh
node tests/regression.cjs
node tests/regression.cjs index.html
```

測試使用本機 JSON 與模擬連線，不呼叫付費 AI；實際服務端可用性與瀏覽器權限仍依環境而定。
