1. **目標**

   完成 `PLANS.md` 的 **STEP 0「專案環境」**，對應 `VERIFY.md` STEP 0 三條：

   - `npm test` 一行指令跑完全部測試。
   - 用本機伺服器打開 `index.html`，看得到 3D 房間且主控台沒有錯誤。
   - README 寫清楚啟動方式，不依賴直接點開 `index.html`。

   `src/logic/` 放純 JavaScript 遊戲規則，`src/game/` 放 three.js 畫面與輸入。測試只用 Node 內建的 `node --test`，測試程式只匯入 `src/logic/`，不載入 three.js。這一步只建立環境與空房間，不加入移動或碰撞。

   three.js 採固定版本，透過瀏覽器 ES module 載入；本機以 HTTP 伺服器提供頁面。為照顧學校舊電腦，初始場景保持簡單、停用即時陰影、限制像素比，並使用 `requestAnimationFrame` 繪圖。30 fps 是 BRIEF 的效能要求，但 VERIFY STEP 0 沒有明確的量測驗收方式。

2. **檔案白名單**

   - `package.json` — 固定 three.js 版本，設定 `npm test` 使用 Node 內建測試。
   - `index.html` — 設定頁面與 three.js 模組入口。
   - `src/game/main.js` — 建立並繪製一個簡單 3D 空房間。
   - `src/logic/index.js` — 建立不依賴 three.js 的 logic 模組入口，不實作 STEP 1 規則。
   - `tests/logic.test.js` — 驗證 Node 測試可執行，並確認 logic 模組可獨立匯入。
   - `README.md` — 寫明安裝依賴及啟動本機伺服器的步驟，讓三位組員照做即可開啟遊戲。

3. **驗收**

   - **先紅後綠**：先新增 STEP 0 的測試並執行 `npm test`，確認測試因預期模組或設定尚未建立而失敗；完成環境後再次執行，確認全數通過。依專案流程，紅燈確認後先 commit，再實作及於綠燈後 commit。
   - 執行 `npm test`，確認一行指令跑完全部測試。
   - 按 README 啟動本機伺服器，在瀏覽器開啟 `index.html`；確認畫面有 3D 房間、主控台沒有錯誤。
   - 確認 STEP 0 沒加入移動、碰撞或其他 STEP 1 功能。

4. **停止條件**

   - 若固定版本的 three.js 載入方式需要新增 BRIEF 未列的工具、框架或打包流程，先停下來提出方案供監督者選擇。
   - 若無法在不加入 STEP 1 功能的前提下，建立有意義的 logic 隔離測試，先回報並討論測試邊界。
   - 若 VERIFY 的驗收與現有專案狀態衝突，先指出衝突，不改 `BRIEF.md` 或 `VERIFY.md`。

5. **預估要幾回**

   施工預估 **1 回**；按流程包含測試先紅、確認後 commit，再實作、測試轉綠及 commit。

6. **STEP 0 清楚度與可行性**

   STEP 0 的三條驗收可執行。兩點尚未明確：

   - BRIEF 要求舊電腦全螢幕 30 fps，但 VERIFY STEP 0 沒有指定量測方法或測試場景；目前只能先採低負載設定，無法據此判定效能要求已驗收。
   - `npm test` 要跑完全部測試，但 STEP 0 尚未定義最小測試內容。計畫暫以測試命令可執行、logic 模組可被 Node 獨立匯入作為環境驗收；若監督者希望 STEP 0 要有其他測試標準，需先確認。