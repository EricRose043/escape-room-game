# 啟動與靜態部署

遊戲為純 HTML／CSS／ES module／three.js，沒有後端、帳號、伺服器資料庫或遊戲 npm 依賴。需要網路載入固定版本 three.js 0.160.0 的 jsDelivr 模組。

## 本機

Mac／Linux，在專案根目錄：

```sh
python3 -m http.server 8778 --bind 127.0.0.1
```

Windows PowerShell：

```powershell
py -m http.server 8778 --bind 127.0.0.1
```

瀏覽器開 `http://127.0.0.1:8778/`。不要用 `file://`。遊戲需要 WebGL；Pointer Lock 被瀏覽器限制時可依頁面提示使用鍵盤備援開始與方向鍵轉頭。

## 靜態主機

將以下內容保持相對路徑一起放在同一個網站目錄：

- `index.html`
- `src/` 全目錄（含 settings-entry.js、settings.css 及所有 logic／game 模組）
- `assets/`（素材與來源記錄）

主機要能以正確的 JavaScript MIME type 提供 `.js`，並允許 import map 指向 jsDelivr。建置指令為空；首頁為 `index.html`，不需要 SPA rewrite。公開網路環境使用 HTTPS。部署前在獨立網址完成以下檢查：

1. 開場、略過、開始及設定可操作，主控台無錯誤。
2. 普通瀏覽器可鎖定滑鼠，Esc 能暫停；手把按鍵提示正確。
3. 同一網址重新開啟能繼續；故意損壞存檔時顯示保護提示，不清空其他資料。
4. 用 `tools/browser-verify.mjs` 對部署網址跑鍵鼠／模擬 Xbox／PS；實體硬體另測。

localStorage 依協定、主機、連接埠分開：`127.0.0.1:8778` 的存檔不會自動轉移到部署網址或其他埠。部署時不要因名稱更動改掉既有章節存檔識別。

## CI

`.github/workflows/test.yml` 在 push／PR 執行 Linux、Windows × Node 22、24 的 `npm test`。專案沒有套件依賴，因此不執行 npm install，也不需要 package lock。

可選瀏覽器驗收需環境先具備 Playwright 與 Chrome：

```sh
node tools/browser-verify.mjs
INPUT_DEVICE=xbox node tools/browser-verify.mjs
INPUT_DEVICE=ps node tools/browser-verify.mjs
```

`PLAYWRIGHT_MODULE` 可指向已安裝的 Playwright `index.mjs`，`CHROME_PATH` 指向 Chrome，`GAME_URL` 指向本機或待驗網站。此工具不會替你變更主機／GitHub Pages 的公開設定，也不會部署網站。
