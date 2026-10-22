模型：gpt-6.1-sol
思考度：medium

# R002｜計畫討論第 2 次＋共識即施工：STEP 1「第一人稱移動」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。

## 監督者審查你的 d1 計畫
採認：目標、`move.x/y`（-1～1、斜向正規化）、`pausePressed`、dt 上限、碰撞選項 A（水平圓對 AABB、分軸解析、必要時小步進）、測試清單、停止條件、施工 1 回。

以下四點要改：

1. **轉頭分成兩個欄位，不要把滑鼠換算成速度**
   - `look.dYaw`、`look.dPitch`：這一幀要轉的角度（弧度），給滑鼠用，logic 直接加上，不乘 dt、不夾在 ±1。
   - `look.yawRate`、`look.pitchRate`：-1～1 的類比值，給 STEP 1b 的右搖桿用，logic 乘上轉頭速度與 dt。
   - logic 把兩者相加後再限制仰俯角。
   - 理由：滑鼠送來的是位移不是速度；換成速度再夾 ±1 會讓快速甩動被截斷，也會隨 dt 抖動。分開後手把與滑鼠同時動也不會互相放大（VERIFY STEP 1b「不可以畫面亂跳」）。STEP 1 只有滑鼠，`yawRate/pitchRate` 先恆為 0，但要有測試證明它會照 dt 轉。

2. **暫停用 `pointerlockchange` 判斷，不靠 Esc 的 keydown**
   - 鎖定狀態下按 Esc，瀏覽器會自己解鎖，keydown 不一定收得到。改成：失去 Pointer Lock → 進入暫停、顯示暫停畫面。
   - 恢復：暫停畫面有「繼續」按鈕，按下才重新要求 Pointer Lock。瀏覽器在 Esc 解鎖後約 1 秒內可能拒絕重新鎖定，要接住錯誤並在畫面提示「請再點一次」，不能讓主控台出現未處理的錯誤。
   - 暫停狀態放 logic：暫停時移動與轉頭動作一律不生效（要有測試）。

3. **房間形狀只有一份**：牆、桌子的 AABB 清單放在 `src/logic/level.js`（白名單新增）。game 依這份清單建方塊，logic 依同一份做碰撞。安全目的：畫面和碰撞永遠一致，之後換房間只改一處。

4. **數值先定這些**（寫成 logic 的具名常數，之後好調）：走路 2.5 m/s、玩家半徑 0.3 m、眼睛高度 1.6 m、仰俯角上限 ±85°、搖桿轉頭速度 2.5 rad/s、dt 上限 0.1 秒、滑鼠靈敏度 0.002 rad／像素（在 game 換算）。

測試清單在你 d1 的 8 條之外，再加：
- `暫停時移動與轉頭都不生效`
- `dt 超過上限時只照上限移動`
- `滑鼠角度位移不受 dt 影響`
- `搖桿轉頭量會照 dt 與轉頭速度換算`
- `level 清單裡的每個方塊都能擋住玩家`

## 共識確認
- 同意以上四點：回覆**第一行寫 `CONSENSUS`**，然後直接施工。
- 有任何一點不同意：第一行寫 `NEED_DISCUSSION`，只回理由與替代做法，**不施工**。

## 施工規則（照 AGENTS.md）
- TDD：先寫測試 → `npm test` 確認失敗 → commit；再寫程式 → 全部通過 → commit；`PLANS.md` 勾 STEP 1（併入第二個 commit）。
- 白名單：`src/logic/movement.js`、`src/logic/level.js`、`src/logic/index.js`、`src/game/main.js`、`index.html`（只為暫停畫面的樣式與元素）、`tests/movement.test.js`、`PLANS.md`、`README.md`（只更新「目前完成到哪」與操作說明）。
- 不改 `BRIEF.md`、`VERIFY.md`、`AGENTS.md`、`CLAUDE.md`、`DECISIONS.md`、`supervisor/`。不新增套件。不 push。
- commit 說明用繁體中文，結尾加 `Co-Authored-By: Codex <noreply@openai.com>`。
- 不做手把（STEP 1b）。

## 回報格式（短）
1. 第一行 `CONSENSUS` 或 `NEED_DISCUSSION`
2. 改了哪些檔案
3. 紅燈證據（失敗數與原因摘要）、綠燈結果（通過數）
4. 兩個 commit 編號
5. 沒做到或不確定的事（瀏覽器若無法實開，寫明）
