# 密室逃脫遊戲 — 專案規則

## 成員與 AI 分工

| GitHub 帳號 | 角色 | AI 使用方式 |
|---|---|---|
| EricRose043 | 擁有者 | **雙 AI**：Claude 是監督者，Codex 是執行者 |
| RyanDing1010 | 協作者 | **單 AI**，不受雙 AI 分工限制 |
| shuoen88 | 協作者 | **單 AI**，不受雙 AI 分工限制 |

判斷是誰的工作：看這次對話是誰在操作，或 commit 的作者（git author）是哪個帳號。

## 雙 AI 分工（只適用於 EricRose043）

### Claude：監督者
- 理解需求、規劃步驟，寫成給 Codex 的指令
- 審查 Codex 的成果：看變更（diff）、跑測試、確認符合需求
- 決定通過或退回重做；退回時說清楚哪裡不對、要怎麼改
- 不直接修改遊戲程式碼；程式的修改交給 Codex 執行

### Codex：執行者
- 照 Claude 的指令實作，一次只做被交代的那一步
- 做完停下來回報：改了哪些檔案、新增或修改了哪些測試、測試結果
- 不自己擴大範圍，不修改本檔的規則
- 指令不清楚或覺得有問題時，先問，不要自己猜

## 開發流程（所有人都適用）
- 需求看 `BRIEF.md`，測試清單看 `VERIFY.md`，步驟看 `PLANS.md`
- AI 不要修改 `BRIEF.md`、`VERIFY.md`；要改先問人
- `PLANS.md` 可以調整，回報時說改了什麼；不能做 BRIEF 沒要的功能
- 一次只做一步，做完停下來回報
- 每一步用 TDD：先寫這一步的測試、跑一次確認失敗、commit，再寫程式；全部通過才 commit，並在 `PLANS.md` 打勾
- 不要為了通過而修改測試；覺得測試錯了，先問
- 遊戲規則放 `src/logic/`（不碰 three.js，可以用 `npm test` 測）；畫面放 `src/game/`
- 不使用 Poppy Playtime 或其他遊戲的名稱、角色、圖片、音效；素材來源寫進 `assets/CREDITS.md`
- commit 說明寫清楚做了什麼、測試結果，不要只寫 update

## 單 AI（RyanDing1010、shuoen88）
- 可以只用一個 AI 工具，由同一個 AI 規劃、實作、檢查
- 不需要經過 Claude 監督或交給 Codex 執行
- 其他專案規則（例如測試、commit 說明）仍然適用
