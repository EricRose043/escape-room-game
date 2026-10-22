模型：gpt-6.1-sol
思考度：high

# R008｜計畫討論第 2 次＋共識即施工：STEP 6a「存檔點與回復規則」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。不操作瀏覽器或電腦控制工具。

## 監督者審查你的 d1 計畫
**全部採認**（監督者登記為 D014）。這次你在計畫階段就預先檢查並列出既有測試衝突，做法很好。
- 拆 6a／6b／6c；本則只做 **6a**。
- 存檔點：`lobby.checkpoint`、`power.checkpoint`、`production.checkpoint`（平台安全點，不加無敵）；「最近」＝最後啟用、只前進不倒退；「完整進入」以內縮 `PLAYER_RADIUS` 判斷；恢復供電不提前啟用生產線存檔點。
- 第 5 節保留／重置表全部採認：物品、安裝、已解謎題、電量、模式保留；手電筒關、介面清除、門由進度推導、怪物回 B 並清記憶（只在死亡回復或讀檔時重置）。
- 被抓流程（6b）：1.2 秒、開關總長相同、Canvas 2D 原創近景、被抓期間全部凍結、暫停／失焦／拔除仍可暫停。
- 存檔（6c）：只存必要進度＋存檔點 ID、版本 1、單一 key、嚴格驗證、不默默刪除或覆寫、注入式儲存、寫入時機與節流、開始選單繼續／重新開始。
- S2 介面：`createChapter({jumpScare})`、`updateChapter(state, actions, dt, {jumpScare})`，暫時預設 `false`；不碰組員檔案。`tools/capture-preview.html` 可做（6b），但遊戲本身不連到它。
- **同意第 9 節 `tests/monster-chase.test.js` 第 81～95 行的遷移**，放在 **6b** 的①紅燈 commit，commit 說明寫明「依監督者 R008 裁定遷移」；名稱、保留與改動項目照你第 9 節所列，不得擴大。

## 共識確認
- 同意：回覆**第一行寫 `CONSENSUS`**，然後直接施工 6a。
- 不同意：第一行寫 `NEED_DISCUSSION`，只回理由，**不施工**。

## 施工規則（照 AGENTS.md）
- 白名單：你 d1 第 10 節「6a」八個檔案，加上 `README.md`、`PLANS.md`。
- 兩個 commit：①新測試（紅）②實作（綠）。6a 不改任何既有測試；若有衝突，停下回 `NEED_DISCUSSION`。②不得改任何測試檔。
- 不改 `BRIEF.md`、`VERIFY.md`、`AGENTS.md`、`CLAUDE.md`、`DECISIONS.md`、`TEAM_TASKS.md`、`supervisor/`，不建組員保留路徑的檔案。不新增套件。不 push。
- `PLANS.md`：STEP 6 拆成 6a／6b／6c，勾 6a 並註明瀏覽器未驗（併入 ②）。
- commit 說明用繁體中文，結尾加 `Co-Authored-By: Codex <noreply@openai.com>`。

## 回報格式（短）
1. 第一行 `CONSENSUS` 或 `NEED_DISCUSSION`
2. 兩個 commit 編號與各自 `npm test` 結果
3. 改了哪些檔案
4. 需要監督者登記的選擇
5. 沒做到或不確定的事
