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

### Claude 與 Codex 怎麼協作（參考 YUJIN-Workspaces，精簡版；D005）
1. **直接送件**：Claude 用 `supervisor/send-codex.sh` 把指令送給 Codex，EricRose043 不用手動轉貼。指令與回覆存在 `supervisor/rounds/`（`rNNN-plan-dN.md` 是計畫討論第 N 次，`rNNN-build.md` 是施工；回覆檔加 `-resp`）。
2. **每輪先討論計畫**：開工前 Codex 先提計畫，寫清楚：
   - 目標（對到 PLANS.md 哪一步、VERIFY.md 哪幾條）
   - 會新增或修改哪些檔案（白名單）
   - 驗收：哪些測試要先紅後綠、哪些要自己玩一遍確認
   - 停止條件：遇到什麼情況要停下來問
   - 預估要幾回
   Claude 審查後回覆。雙方來回 1～5 次；**同意就開工，第 5 次還沒共識就不開工，交給 EricRose043 決定**。
3. **回覆第一行**：Codex 收到含「共識確認」的指令時，同意就第一行寫 `CONSENSUS`，然後直接施工；不同意就第一行寫 `NEED_DISCUSSION`，只回理由和替代做法，不施工。
4. **Claude 只給目標和邊界**，不寫逐步施工圖；怎麼做由 Codex 規劃。新的技術設計，先請 Codex 提 2～3 個選項，Claude 比較後選定。
5. **施工輪不得改 BRIEF.md、VERIFY.md**（送件腳本會比對，改到就視為越界退回）。
6. **施工回報**（短）：改了哪些檔案、新測試先紅後綠的證據、`npm test` 結果、commit 編號、沒做到的事。
7. **Claude 審查**：看 diff、自己跑 `npm test`、需要時開瀏覽器玩一遍，然後決定通過或退回。通過才在 PLANS.md 打勾（由 Codex 在施工中打勾，Claude 核對）。
8. **repo 就是記憶**：新的決定當輪寫進 `DECISIONS.md`；Claude 每輪收尾覆寫 `supervisor/LATEST.md`（現況、下一步），換 session 先讀它。
9. **不空等**：等 EricRose043 回答時，先做不依賴答案的部分。
10. **模型**：計畫討論用 `gpt-6-luna`、施工用 `gpt-6.1-sol`；思考度 medium，難題才用 high（由 Claude 在請求檔寫明）。

## 開發流程（所有人都適用）
- 需求看 `BRIEF.md`，人類驗收看 `VERIFY.md`，AI 展開的細部案例看 `TESTS.md`，步驟看 `PLANS.md`
- `TESTS.md` 每條要可追溯到 VERIFY／BRIEF；AI 可維護細節，但人審過才開始對應功能實作，不自行改驗收需求
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

## 分工、驗收與作者紀錄（D015）
- 三人主責與允許修改範圍依 `TEAM_TASKS.md`。shuoen88 統整實測與缺陷追蹤；每位開發者仍須自測及修正自己的功能。
- 實測記在 `docs/TESTING_LOG.md`，問題記在 `docs/DEFECTS.md`；自動測試、歷史轉錄、瀏覽器實測及實體設備結果分開，不補造通過紀錄。
- 突變測試先 commit、一次只改壞一條、測完還原；未抓到就補測試並記回 TESTS。故意改壞的版本不得合入 main。
- 各人以真實身分提交；使用保留原始 commit 的 merge commit 合併，避免 squash／rebase 合併與 force push。貢獻證據依 `docs/CONTRIBUTIONS.md`，不冒用他人作者。
- 文件整理不改遊戲行為時，核對文件、來源追溯並跑既有回歸；不為文件更新捏造失敗測試或新增沒有行為意義的測試。
