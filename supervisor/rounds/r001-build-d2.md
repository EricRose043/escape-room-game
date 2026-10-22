模型：gpt-6.1-sol
思考度：medium

# R001｜計畫討論第 2 次＋共識即施工：STEP 0「專案環境」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。

## 監督者審查你的 d1 計畫
大方向採認：目標對到 VERIFY STEP 0 三條、logic／game 分開、只用 `node --test`、不偷做 STEP 1、施工 1 回。以下五點要改（都是範圍內的釐清，不改 BRIEF／VERIFY）：

1. **three.js 載入方式定案**：用 `index.html` 的 importmap 從 CDN 載入**固定版本** `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`。`package.json` **不放任何 dependencies**。
   理由：組員打開遊戲不必先 `npm install`；之後放上 GitHub Pages 也能直接跑；同一位擁有者的另一個專案（空中之島）就是這樣做，已實測可行。
2. **本機伺服器**：不新增任何套件到 repo。README 要寫 Mac 和 Windows 各怎麼開，至少一種只用電腦上已有的東西（例如 `python3 -m http.server`，Windows 是 `py -m http.server`），並寫「直接點兩下 index.html 會打不開，原因是瀏覽器不讓本機檔案載入模組」。
3. **測試不能只測「載入得到」**，STEP 0 至少要有這兩類：
   - logic 能在 Node 單獨載入（你原本的）
   - **機械守住邊界**：測試掃過 `src/logic/` 底下所有 `.js`，任何檔案出現 `three` 的 import 就失敗。安全目的：之後三個人一起寫，logic 不小心依賴畫面就會被 `npm test` 擋下。
4. **3D 房間的最低標準**：地板、四面牆、天花板、至少一盞燈，相機在房間裡面。整體偏暗、有恐怖感，但看得清楚房間形狀。視窗縮放時畫面跟著調整。
5. **30 fps 先做量測工具，不宣稱達標**：同意你說 STEP 0 無法驗收 30 fps。畫面左上角放一個小小的 fps 數字（之後各批次結尾用它在舊電腦上量）。在回報中寫「30 fps 尚未在舊電腦驗證」，不要寫已達成。

其餘照你的 d1：白名單照你列的 6 個檔案，第 3 點的邊界測試可放在 `tests/` 底下另一個檔案（白名單允許新增 `tests/` 下的測試檔）。

## 共識確認
- 同意以上五點：回覆**第一行寫 `CONSENSUS`**，然後直接施工。
- 有任何一點不同意：第一行寫 `NEED_DISCUSSION`，只回理由與替代做法，**不施工**。

## 施工規則（照 AGENTS.md）
- TDD：先寫測試 → 跑 `npm test` 確認失敗 → commit；再寫程式 → 全部通過 → commit；在 `PLANS.md` 把 STEP 0 打勾（併入第二個 commit）。
- commit 說明用繁體中文，寫清楚做了什麼與測試結果；結尾加一行 `Co-Authored-By: Codex <noreply@openai.com>`。
- 不改 `BRIEF.md`、`VERIFY.md`、`AGENTS.md`、`CLAUDE.md`、`DECISIONS.md`、`supervisor/` 底下任何檔案。
- 不 push（監督者審查通過後才 push）。
- 你無法在瀏覽器實際打開頁面也沒關係，回報裡寫明；監督者會自己開瀏覽器驗。

## 回報格式（短）
1. 第一行 `CONSENSUS` 或 `NEED_DISCUSSION`
2. 改了哪些檔案
3. 紅燈證據（第一次 `npm test` 的失敗摘要）與綠燈結果（通過數）
4. 兩個 commit 的編號
5. 沒做到或不確定的事
