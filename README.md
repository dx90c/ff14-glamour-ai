# 👗 FF14 幻化外觀 AI 辨識小工具 (FF14 Glamour AI Recognizer)

> **拖入穿搭圖片 ──► AI辨識 (請自行連接 API，網頁不紀錄) ──► 灰機直連 / 鴨鴨好手氣 / Google**

[![Version](https://img.shields.io/badge/version-v2.1.1版-brightgreen.svg)](https://github.com/dx90c/ff14-glamour-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pure HTML/JS](https://img.shields.io/badge/Architecture-100%25%20Static%20Client-blue.svg)](https://github.com/dx90c/ff14-glamour-ai)

專為《最終幻想14》（Final Fantasy XIV / FF14）光之戰士打造的幻化穿搭 AI 視覺辨識工具。  
無論是來自 **Eorzea Collection** 的英日文卡片、**光之幻化館 (GlamXIV)** 的純繁中卡片、玩家社群截圖或推特穿搭，只需**拖入圖片**或**剪貼簿直接貼上 (Ctrl+V)**，即可秒級提取全套裝備、染色色號、取得途徑與投影限制，並透過獨家「全語系瀑布流」與「鴨鴨好手氣直達」一鍵開啟灰機 wiki 物品條目！

---

## 🔒 隱私與安全性保證（如何驗證網頁不存任何 API Key？）

許多玩家對於在線上網頁填入自己的 API Key 存有疑慮，本專案提供 **100% 可被任何使用者檢驗的安全性**：

1. **GitHub Pages 純靜態架構（物理無法偷存）**：
   - 本專案託管於 GitHub Pages，本質上**只有純前端 HTML/JavaScript**。
   - 伺服器端**沒有任何後端程式**（無 Node.js、PHP、Python 後端或資料庫），因此在技術與物理上**完全沒有任何伺服器能夠接收或儲存您的金鑰**！
2. **開源可稽核・隨時按 F12 檢驗封包**：
   - 在瀏覽器中按下 **`F12` ➔ 切換至 `Network (網路)` 分頁**。
   - 當您辨識圖片時，可以看到請求是**直接由您的瀏覽器發送至 Google 官方端點 (`generativelanguage.googleapis.com`)**，中間沒有任何一個封包發往第三方私人伺服器。
   - 您的金鑰僅暫存在個人電腦瀏覽器的 `localStorage` 中。
3. **支援 100% 離線下載使用**：
   - 若您仍有疑慮，可直接將本倉庫的 `index.html` 下載到本機電腦，**在斷網或純本機狀態下雙擊開啟**，安全性完全由您自己掌握！

---

## ✨ 核心特色與亮點

### 1. 🌊 全語系統一瀑布流（Unified Multi-Language Waterfall）
告別繁瑣的特例字典與不同語系的割裂邏輯，全檔採用統一的優先級瀑布流解析：
- **第 1 順位（英文優先）**：優先提取官方英文原名查詢 4.2 萬筆大庫；若卡片含日文則執行**日文交叉覆核**驗證；大庫未收錄則觸發英文好手氣。
- **第 2 順位（日文）**：卡片無英文時，以日文原名精準匹配大庫；大庫未收錄則觸發日文好手氣。
- **第 3 順位（繁中 / 簡中 / 各國原文）**：無英日文時，**100% 忠實保留卡片原文**（繁中歸繁中、簡中歸簡中，絕不粗暴機械繁轉簡產生 404）；未收錄則以卡片原文秒開好手氣。

### 2. 🦆 鴨鴨好手氣無感直達（DuckDuckGo !ducky）
- 過去 Google 好手氣（`btnI=1`）常會跳出惱人的「重新導向通知」安全確認中介頁。
- 本工具獨家採用 DuckDuckGo `!ducky` 協議，**0.1 秒秒速直接跳轉至灰機 wiki 第一名條目**，免點擊確認、無感秒開！

### 3. 📦 內建官方大數據庫（IndexedDB 脫水減肥引擎）
- 內建 Patch 7.05+ 完整全裝備中英日三語資料庫（4.2 萬筆）。
- 支援一鍵向 GitHub 遠端資料庫靜默檢查版本，前端以「脫水減肥演算法」提取穿戴部位，毫秒級離線查詢。

### 4. 🤖 多品牌主流 AI 自由切換
- **Google Gemini**（預設推薦：`gemini-2.5-flash` / `gemini-2.5-flash-lite`，免費額度大、辨識超精準）。
- **OpenAI**（支援 `gpt-4o`、`gpt-4o-mini`）。
- **OpenRouter / 萬用自訂 API**（可自由掛載任何 OpenAI 相容的視覺模型服務）。

### 5. 📋 完整穿搭管理與匯出
- **一鍵複製至剪貼簿**：表格格式，可直接在 Excel 按 `Ctrl+V` 貼上。
- **下載 CSV**：自動帶入 `UTF-8 BOM`，Windows Excel 開啟保證繁中絕不亂碼。
- **下載 TXT**：精美純文字排版，方便儲存或分享至 Discord / LINE 社群。

---

## 🚀 快速上手教學

### 步驟 1：取得免費 API Key（以 Google Gemini 為例）
1. 前往 [Google AI Studio](https://aistudio.google.com/)。
2. 登入 Google 帳號，點選左上角 **「Get API key」** ➔ **「Create API key」**。
3. 複製產生的金鑰字串（如 `AIzaSy...`）。

> 💡 *Gemini 提供豐厚的每日免費調用額度，一般玩家辨識幻化完全免費！*

### 步驟 2：開啟工具與設定 Key
1. 開啟線上網址 [https://dx90c.github.io/ff14-glamour-ai/](https://dx90c.github.io/ff14-glamour-ai/)（或下載 `index.html` 於本機雙擊開啟）。
2. 初次開啟會自動彈出設定視窗，將剛複製的 API Key 貼入並點選 **「確認儲存」**。

### 步驟 3：開始辨識
- **方法 A（拖曳上傳）**：直接將穿搭卡片圖片拖入畫面虛線框內。
- **方法 B（點擊上傳）**：點擊虛線框選擇本機圖片。
- **方法 C（剪貼簿貼上）**：使用 Windows 截圖工具（`Win + Shift + S`）截圖後，直接在網頁上按下 **`Ctrl + V`** 即可自動觸發辨識！

### 步驟 4：瀏覽與直達
- 辨識完成後，各部位裝備名稱、來源、染色色號一覽無遺。
- 點選裝備名稱或 **`[✨ 灰機好手氣]`** / **`[🔗 灰機wiki]`**，即可秒速開啟該裝備的灰機 wiki 物品攻略頁！

---

## 📁 專案檔案說明

```text
├── index.html                           # 主程式（正規化單一靜態網頁，GitHub Pages 預設入口）
├── FF14外觀AI辨識小工具v2.1.1.html        # v2.1.1 命名保留檔
└── README.md                            # 專案說明、安全指引與使用教學
```

---

## 📜 開源許可證

本專案基於 [MIT License](LICENSE) 條款開源。歡迎自由分享、修改與二創。  
遊戲版權與相關素材商標屬於 SQUARE ENIX CO., LTD. 所有。
