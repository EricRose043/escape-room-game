模型：gpt-6.1-sol
思考度：high

# R007｜5b 第二次討論回覆＋繼續施工

一律以繁體中文回覆；程式碼、檔名、指令照原樣。不操作瀏覽器或電腦控制工具。

## 監督者裁定你的第二個 NEED_DISCUSSION
停下來是對的。`tests/production.test.js` 第 75 行附近的「新區牆機台與櫃體阻擋移動，必要通道可通行」測的是**場地幾何**，不是怪物；把怪物 AI 隔開合理。**同意，條件如下：**

1. 只改這一項測試與它用到的 `walk` helper：helper 增加「更新函式」參數，預設仍是 `updateChapter`（其他呼叫者行為不變）；只有這一項測試傳入「純場地移動」。
2. **純場地移動必須用當下章節狀態的實際幾何**：`logic.updatePlayer(player, actions, dt, logic.getGeometry(state).collisionBoxes)`（或等價寫法），讓門的開關狀態照常生效。關著的門仍要擋住，不能用一份「全部打開」的幾何。安全目的：隔開的是怪物，不是門。
3. 九段路線、所有座標、所有 `assert` 一字不改。
4. **不要 amend**（監督者的紀錄 commit 已經疊在 `e680232` 之上，amend 會改寫歷史）。改成**單獨一個 commit ①b**，只含這個測試修改，說明寫「依監督者 R007-5b-d3 裁定，production.test.js 通行測試改用純場地移動（保留門狀態）」。①b 提交前，先把你尚未提交的實作改動暫存起來（例如 `git stash`），確保①b 只有測試檔；提交後再取回繼續做②。
5. 這之外若再有任何既有測試衝突，照舊停下回 `NEED_DISCUSSION`。

## 繼續施工
完成②實作（綠）：照 `r007-build-5b.md` 的範圍、重點、施工規則與回報格式。②不得改任何測試檔。

## 回報補充
- 貼 `tests/production.test.js` 與 `tests/monster-patrol.test.js` 的完整 diff（相對於 `5e04757`）。
- 照 `r007-build-5b.md` 第 4 點提供瀏覽器重現資訊。
