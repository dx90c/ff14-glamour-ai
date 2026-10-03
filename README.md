# 👗 FF14 幻化外觀 AI 辨識小工具 (FF14 Glamour AI Recognizer)

> **線上免安裝版**：[https://dx90c.github.io/ff14-glamour-ai/](https://dx90c.github.io/ff14-glamour-ai/)
> **線下單檔使用**：[FF14外觀AI辨識小工具v2.1.1.html](https://github.com/dx90c/ff14-glamour-ai/blob/main/FF14%E5%A4%96%E8%A7%80AI%E8%BE%A8%E8%AD%98%E5%B0%8F%E5%B7%A5%E5%85%B7v2.1.1.html)

本工具專門用來將推特（Twitter / X）、Eorzea Collection、光之幻化館等玩家分享的「帶有裝備名稱的幻化圖片」，透過視覺 AI 自動辨識並整理成結構化表格，列出各部位裝備名稱、染色色號、取得途徑，並提供灰機 wiki 直達連結，方便光之戰士們快速查閱、收集外觀與學習優秀穿搭！
**由Gemini 3.8 flash製作
---

## 📖 使用教學

### 1. 取得免費 API Key（以 Google Gemini 為例）
本工具需連接視覺 AI 模型讀圖，推薦使用 Google 提供的免費額度（日常辨識完全夠用，不需付費）：
1. 前往 [Google AI Studio](https://aistudio.google.com/)。
2. 登入 Google 帳號，點選左上角 **「Get API key」** ➔ **「Create API key」**。
3. 複製產生的金鑰（以 `AIzaSy...` 開頭）。
(亦支援 OpenAI 的 `gpt-4o-mini` 或 OpenRouter / 自訂相容接口，可依個人偏好在網頁中切換)

### 2. 設定金鑰
打開網頁 [https://dx90c.github.io/ff14-glamour-ai/](https://dx90c.github.io/ff14-glamour-ai/) ，在右上角點擊 **「🔑 設定 API Key」**，貼上金鑰並點選儲存。金鑰僅儲存在您的本機瀏覽器中。

### 3. 匯入穿搭圖片
* **在推特或網頁上看到穿搭圖，下載後，貼在網頁畫面上，即可自動觸發辨識。

### 4. 查詢條目與整理
* **灰機 wiki 物品直達**：點選裝備名稱或 **`[✨ 灰機好手氣]`** / **`[🔗 灰機wiki]`**，會自動開啟灰機 wiki 的官方物品攻略頁。卡片上的英文、日文或繁體中文都會自動查詢對應條目。
* **一鍵複製到 Excel**：點選下方的 **「📋 複製到剪貼簿 (Excel格式)」**，可直接在 Excel 表格內按 `Ctrl + V` 貼上整理自己的外觀清單。
* **下載 CSV / TXT**：支援帶 BOM 的繁中 CSV 下載（Windows Excel 打開不亂碼）與純文字穿搭筆記。

---

## 📦 數據庫來源說明
網頁工具已預先收錄 14 萬筆中英日完整裝備字典，數據來源引用自開源社群維護的官方數據挖掘庫：
* GitHub 倉庫：[InfSein/ffxiv-datamining-mixed](https://github.com/InfSein/ffxiv-datamining-mixed)
* 版本號 Unpack 7.56#hf2

平日正常使用無須進行任何設定；當未來遊戲大改版（如新 Patch 推出）時，線下版本亦可隨時一鍵同步最新開源裝備庫。

---

## 🔒 隱私與安全性說明
* **無後端、不存金鑰**：本專案為 GitHub Pages 純靜態網頁，技術上沒有任何後端伺服器或資料庫可以記錄使用者的 API Key。所有的識別請求皆由您的瀏覽器直接連線至官方 API（Google / OpenAI）。
* **隨時可驗證**：隨時可以按 `F12` 查看 `Network` 封包，確認沒有任何封包發送至第三方伺服器。
* **本機離線執行**：如果您對線上網頁仍有疑慮，可以直接下載獨立單檔 [FF14外觀AI辨識小工具v2.1.1.html](https://github.com/dx90c/ff14-glamour-ai/blob/main/FF14%E5%A4%96%E8%A7%80AI%E8%BE%A8%E8%AD%98%E5%B0%8F%E5%B7%A5%E5%85%B7v2.1.1.html) 到您的電腦本機，在完全斷網或離線環境下雙擊開啟使用。

---

## 📜 開源協議
本專案採 [MIT License](LICENSE) 開源。遊戲版權與相關素材商標屬於 SQUARE ENIX CO., LTD. 所有。
