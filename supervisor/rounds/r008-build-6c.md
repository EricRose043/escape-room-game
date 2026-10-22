模型：gpt-6.1-sol
思考度：high

# R008｜施工：STEP 6c「瀏覽器存檔與開始選單」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。不操作瀏覽器或電腦控制工具。

## 監督者審查 6b
**程式與測試通過**（commit `28fe782`、`54d42b1`）。161/161 綠燈；`monster-chase.test.js` 第 81～95 行遷移與 R008 核准範圍一致；實作 commit 沒動測試檔。
近景程式碼審查：只用奶白、米、薄荷綠、深灰藍與金色徽章，無紅色、無牙、嘴是一條線、單次放大無閃爍，符合保護級。
**瀏覽器實玩尚未驗**（監督者這邊的預覽視窗暫時沒有在畫面上，遊戲迴圈不跑）；之後補驗。被抓流程已有 Node 測試覆蓋。

## 本則：施工 6c
範圍照你 R008 d1 計畫第 2 節「6c」、第 6 節瀏覽器存檔設計（全部）、第 7 節關頁相關情境、第 10 節「6c」白名單、第 11 節「6c」8 個測試名稱與監督者再驗清單。D014 已採認；需要偏離時先停下回 `NEED_DISCUSSION`。

重點：
- 只存必要進度＋存檔點 ID、版本 1、key `star-candy-park.chapter-1.save`；不存位置、怪物、介面、輸入、設定。
- 壞 JSON、不支援版本、未知 ID、矛盾進度：不套用、不崩潰、**不刪除不覆寫**，開始選單說明原因；玩家確認「重新開始」才取代。
- 儲存讀寫失敗：遊戲照常、提示尚未儲存。
- logic 不直接碰 `window.localStorage`，用注入的 `{getItem,setItem,removeItem}`。
- 開始選單：有效存檔預選「繼續」；「重新開始」要確認；鍵鼠、Xbox、PS 都能操作，長按不重複確認。重新開始只換章節 key，**不呼叫 `localStorage.clear()`**（組員 S2 之後也會用 localStorage 存設定）。
- 同頁重新開始時物品模型要重新出現（d1 第 7 節最後一列）。
- 既有測試一律不改；有衝突停下回 `NEED_DISCUSSION`。

## 施工規則（照 AGENTS.md）
- 兩個 commit：①新測試（紅）②實作（綠）。②不得改任何測試檔。
- 不改 `BRIEF.md`、`VERIFY.md`、`AGENTS.md`、`CLAUDE.md`、`DECISIONS.md`、`TEAM_TASKS.md`、`supervisor/`，不建組員保留路徑的檔案。不新增套件。不 push。
- `PLANS.md` 勾 6c 與 STEP 6，註明瀏覽器未驗（併入 ②）。
- commit 說明用繁體中文，結尾加 `Co-Authored-By: Codex <noreply@openai.com>`。

## 回報格式（短）
1. 第一行 `DONE` 或 `NEED_DISCUSSION`
2. 兩個 commit 編號與各自 `npm test` 結果
3. 改了哪些檔案
4. 監督者瀏覽器測試資訊：開始選單的元素選擇器（方便用程式點）、怎麼手動放一個壞存檔來測、存檔在 localStorage 的長相
5. 需要監督者登記的選擇
6. 沒做到或不確定的事
