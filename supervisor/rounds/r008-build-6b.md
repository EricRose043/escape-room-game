模型：gpt-6.1-sol
思考度：high

# R008｜施工：STEP 6b「被抓流程」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。不操作瀏覽器或電腦控制工具。

## 監督者審查 6a
**通過**（commit `ba552d6`、`195dd2e`）。153/153 綠燈；只新增 `tests/checkpoints.test.js`，實作 commit 沒動測試檔。瀏覽器回歸：開場拿手電筒、進電力室正常，主控台無錯誤（6a 的回復規則以 Node 驗收，接觸回復 6b 才能實玩）。

## 本則：施工 6b
範圍照你 R008 d1 計畫第 2 節「6b」、第 3 節被抓流程與時間表、第 7 節怪狀態處理、第 8 節 S2 介面、第 9 節已核准的 `monster-chase.test.js` 遷移、第 10 節「6b」白名單、第 11 節「6b」8 個測試名稱。D014 已採認；需要偏離時先停下回 `NEED_DISCUSSION`。

重點：
- `monster-chase.test.js` 第 81～95 行的遷移放在①紅燈 commit，**範圍只照你 d1 第 9 節所列**；commit 說明寫「依監督者 R008 裁定遷移 monster-chase.test.js 第 81～95 行」。其他既有測試若衝突，停下回報。
- jump scare 關閉時：只有黑畫面，**任何時候都不能出現近景**（含中途關閉）。開啟時：原創 Canvas 2D 近景、單次出現放大，無血、無尖牙、無閃爍、無音效、無震動。
- `jumpScare` 暫時預設 `false`；`main.js` 先固定傳 `false`。為了讓監督者能在遊戲裡驗收開啟分支，`main.js` 可以讀網址參數 `?jumpscare=1` 傳 `true`（只是測試用途，註解寫明「待 S2 設定接上後移除」）。`tools/capture-preview.html` 也照 d1 做。
- 被抓期間全部凍結；暫停／失焦／拔除仍可暫停；本幀接觸只觸發一次；回復當幀清除事件與輸入、不再跑 AI。
- 不建立或修改組員保留路徑的檔案（`settings*`、`audio*` 等）。

## 施工規則（照 AGENTS.md）
- 兩個 commit：①新測試＋核准的遷移（紅）②實作（綠）。②不得改任何測試檔。
- 不改 `BRIEF.md`、`VERIFY.md`、`AGENTS.md`、`CLAUDE.md`、`DECISIONS.md`、`TEAM_TASKS.md`、`supervisor/`。不新增套件。不 push。
- `PLANS.md` 勾 6b，註明瀏覽器未驗（併入 ②）。
- commit 說明用繁體中文，結尾加 `Co-Authored-By: Codex <noreply@openai.com>`。

## 回報格式（短）
1. 第一行 `DONE` 或 `NEED_DISCUSSION`
2. 兩個 commit 編號與各自 `npm test` 結果；`monster-chase.test.js` 的完整 diff
3. 改了哪些檔案
4. 監督者瀏覽器測試資訊：重現被抓的站位與時間、回復後的位置與朝向、`?jumpscare=1` 與預覽頁的用法
5. 需要監督者登記的選擇
6. 沒做到或不確定的事
