# 啟動與靜態部署

遊戲為純 HTML／CSS／ES module／three.js，沒有後端、帳號、伺服器資料庫或遊戲 npm 依賴。three.js 0.160.0 隨附在`vendor/three`，本機啟動後不需連網。

## 本機

需Python 3。Windows下載GitHub ZIP並解壓後，雙擊遊戲資料夾中的`Play-EscapeRoom.cmd`；完整試玩包則用父資料夾的同名檔。啟動器會辨識遊戲在同層或`escape-room-game/`子資料夾。Mac／Linux在`play_escape_room.py`所在資料夾：

```sh
python3 play_escape_room.py
```

Windows PowerShell：

```powershell
py play_escape_room.py
```

固定使用`http://127.0.0.1:8778/index.html`。啟動器呼叫`prepare_escape_room_assets.py`，以全部程式、樣式、PNG及引擎內容計算共同版本，將所有模組映射到相同版本的網址；再啟動`serve_escape_room.py`，GET／HEAD一律提供目前檔案及禁止快取標頭。這能避免瀏覽器混用不同版本的ES模組，導致開場停在第一段、略過按鈕無反應。

現有服務的資料夾識別與首頁版本必須一致才會重用；其他服務占用8778時明確停止並提示原因，不會終止陌生程序或改埠。加`--serve-only`只啟動伺服器；本機準備版本與靜態HTTP檢查不等同Chrome實際操作驗收。

不要用`file://`。遊戲需要WebGL；Pointer Lock被瀏覽器限制時可依頁面提示使用鍵盤備援開始與方向鍵轉頭。解壓檔請保留四個父資料夾檔案：`Play-EscapeRoom.cmd`、`play_escape_room.py`、`prepare_escape_room_assets.py`、`serve_escape_room.py`。

2026-11-05起，開場與錯誤提示直接在HTML中獨立執行，不依賴ESM或Three.js。若開場卡住，請依[開場問題處理](STARTUP_TROUBLESHOOTING.md)檢查；新版會保留可回報的錯誤資訊。單純公開GitHub專案不等於部署了可直接玩的網站，本機127.0.0.1連結只連到各自電腦。

## 靜態主機

將以下內容保持相對路徑一起放在同一個網站目錄：

- `index.html`
- `src/` 全目錄（含 settings-entry.js、settings.css 及所有 logic／game 模組）
- `assets/`（素材與來源記錄）
- `vendor/`（固定版本three.js及其MIT授權）

上傳前在父資料夾執行`python prepare_escape_room_assets.py`更新版本映射。主機要能以正確的JavaScript MIME type提供`.js`，並允許import map載入同站模組。首頁為`index.html`，不需要SPA rewrite；首頁建議禁用快取，帶版本的模組依完整網址快取。公開網路環境使用HTTPS。部署前在獨立網址完成以下檢查：

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

## GitHub Actions 啟動限制（2026-11-01）

[run 41320466639](https://github.com/EricRose043/escape-room-game/actions/runs/41320466639) 的 GitHub Summary／Annotations 明確顯示帳戶近期付款失敗或支出上限需要調整，沒有啟動任何 job。GitHub API 未提供該註解，已用原生 Chrome 讀取確認；詳 [原始狀態](evidence/2026-11-01/owner-integration/github-ci-startup.json)。

工作流程 YAML 已本機解析；本機235項及三條Chrome路線通過。但 Linux／Windows × Node22／24 的遠端CI **NOT_RUN，不是 PASS**，也不以歷史220項Windows結果代替。沒有更改付款、預算、Actions權限或分支保護；只有帳戶持有人可處理帳務限制，解除後再重跑CI。
