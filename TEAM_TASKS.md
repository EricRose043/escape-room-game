# 組員工作清單（可以和 EricRose043 並行）

更新：2026-10-22（D013）

EricRose043 這邊（Claude 監督、Codex 執行）正在做 **STEP 5～6（棉花糖先生、被抓與存檔點）**。下面的工作都設計成**不用等那邊、也不會改到同一批檔案**，可以馬上開始。

## 開工前一定要讀
`AGENTS.md`、`BRIEF.md`、`VERIFY.md`、`PLANS.md`、`DECISIONS.md`，以及 `src/logic/areas/power-room.js`（區域資料的範本，D010）。

## 最重要的規則：只新增自己的檔案

| 誰的檔案 | 檔案 | 組員可以改嗎 |
|---|---|---|
| EricRose043 | `src/logic/chapter.js`、`world.js`、`index.js`、`monster*.js`、`navigation.js`、`movement.js`、`gamepad.js`、`interaction.js`、`flashlight.js`、`areas/lobby.js`、`areas/power-room.js`、`areas/production.js`、`src/game/main.js`、`world-view.js`、`monster-view.js`、`index.html`、所有現有 `tests/*.test.js` | **不要改**。需要接上時，在 PR 說明裡寫「需要 EricRose043 那邊在 X 加一行 Y」，由那邊整合。 |
| 組員 | 下面每個任務列出的**新檔案** | 可以，只改自己任務的檔案 |

其他規則照 `AGENTS.md`：先寫測試再寫程式（TDD）、不改既有測試、規則放 `src/logic/`（不碰 three.js）、畫面放 `src/game/`、素材來源寫 `assets/CREDITS.md`（這個檔可以加自己的段落）。

## 怎麼交
1. 開自己的分支：`git checkout -b ryan/color-puzzle`（名字照任務改）。
2. 做完 `npm test` 全部通過（包含別人的測試）。
3. push 分支、在 GitHub 開 Pull Request，說明寫：做了什麼、測試結果、**需要主程式怎麼接**（例如「在 chapter.js 呼叫 `pressButton`」）。
4. 不要直接推到 `main`。EricRose043 那邊審查後合併，並負責接進主程式。

---

## RyanDing1010：謎題與結局

### R1　生產線顏色謎題的規則（STEP 7 的 logic 部分）
- **新檔案**：`src/logic/puzzles/color-sequence.js`、`tests/color-sequence.test.js`
- **要做到**（對應 VERIFY STEP 7）：
  - 謎題資料：`{ id, sequence: ['red','yellow','green','blue'], buttons: ['red','yellow','green','blue'] }`（顏色與長度你決定）
  - `createSequenceState(def)` → 初始狀態
  - `pressButton(state, def, color)` → `{ state, result }`，`result` 是 `'progress'`（按對但還沒完）、`'solved'`（全對）、`'wrong'`（按錯，順序重來）
  - 按錯時結果帶一個 `alarm: true`，之後主程式會用它把棉花糖先生引過來（你不用做怪物那段）
  - 已經解開後再按，不會變回未解
- **測試至少要有**：全對會解開、按錯會重來並發出 alarm、亂按不會解開、解開後不會被打亂、不改到傳進來的舊狀態
- **不用做**：按鈕的 3D 模型、放在哪裡（之後放進 `production.js` 時再決定）

### R2　出口大門與結局（STEP 9）
- **新檔案**：`src/logic/areas/exit.js`、`src/logic/ending.js`、`src/game/ending-view.js`、`tests/exit.test.js`、`tests/ending.test.js`
- **要做到**（對應 VERIFY STEP 9）：
  - `areas/exit.js`：照 D010 格式做一個出口大廳（大小、出生點、牆、大門、密碼鎖設備）。座標放在 X＝22～34、Z＝−12～0（東邊，之後追逐走廊會接過來；先不用接）。
  - 最後密碼：由三條線索組成（例如生產線一條、追逐走廊一條、出口一條）。請提出三條線索的內容與玩家怎麼從線索推出密碼，寫在 PR 說明裡；**密碼要推得出來，不能用猜的**。
  - 密碼鎖可以直接重用現有的 `src/logic/keypad.js`（只呼叫，不要改它）。
  - `ending.js`：`finishChapter(startSeconds, endSeconds)` → 結局資料（遊玩時間，格式像「12 分 34 秒」）。
  - `ending-view.js`：結局畫面（標題、遊玩時間、「再玩一次」按鈕），**要能用手把操作**（十字鍵選、A／✕ 確認）。只做元件，用一個函式 `showEnding(container, result, onRestart)` 讓主程式呼叫。
- **測試至少要有**：區域資料 ID 唯一且三邊、物品尺寸符合 D007；密碼由三條線索組成；遊玩時間格式正確（含 0 秒、超過 1 小時）
- **不用做**：把出口接到地圖上、怪物

---

## shuoen88：聲音、設定、追逐走廊場地

### S1　聲音與氣氛（STEP 10）
- **新檔案**：`src/game/audio.js`、`src/logic/audio-mix.js`、`tests/audio-mix.test.js`
- **要做到**：
  - 用瀏覽器的 Web Audio **直接用程式產生聲音**，不用下載音檔（若一定要用音檔，只能用 CC0，並先問 EricRose043）。
  - `audio.js` 提供：`createAudio()` → `{ unlock(), setMasterVolume(v), playFootstep(), setAmbience(areaId), setHeartbeat(intensity), playAlarm(), playDoor() }`。`intensity` 是 0～1，越大心跳越快越大聲（之後怪物越近就越大）。
  - `audio-mix.js`（logic，可測）：把「距離怪物幾公尺」換算成心跳 `intensity`；把「玩家每秒走幾公尺」換算成腳步間隔。
  - 瀏覽器規定要使用者先按一下才能出聲，`unlock()` 給主程式在開始時呼叫。
- **測試至少要有**：距離越近 intensity 越大且在 0～1、太遠是 0、腳步間隔隨速度變化、停下不出腳步聲
- **可以自己做一個測試頁** `tools/audio-test.html`，按鈕試聽每種聲音（不影響遊戲）

### S2　設定（VERIFY「一直要成立的事」裡的設定）
- **新檔案**：`src/logic/settings.js`、`src/game/settings-view.js`、`tests/settings.test.js`
- **要做到**：
  - 設定項目：主音量（0～100）、jump scare 開關（BRIEF：怕的人可以關）、滑鼠靈敏度。
  - `settings.js`：預設值、`updateSetting(settings, key, value)`（超出範圍會夾住）、`serialize`／`deserialize`（存瀏覽器 localStorage 用；壞掉的資料要回到預設值）。
  - `settings-view.js`：設定面板元件，`showSettings(container, settings, onChange, onClose)`，**要能只用手把操作**（十字鍵上下選、左右調、A／✕ 切換、B／○ 關閉）。
- **測試至少要有**：預設值、範圍夾住、壞資料回預設、存了再讀回來一樣

### S3　追逐走廊場地（STEP 8 的場地部分）
- **新檔案**：`src/logic/areas/chase-corridor.js`、`src/logic/corridor-doors.js`、`tests/chase-corridor.test.js`
- **要做到**（對應 VERIFY STEP 8 的「跑過的門會在身後關上」）：
  - `areas/chase-corridor.js`：照 D010 格式做一條長走廊（有轉彎、幾道門），座標放在 X＝21.4～40、Z＝−20～−4 一帶（接在生產線東門外，先不用接上）。
  - `corridor-doors.js`：`updateCorridorDoors(doorState, playerX, playerZ, corridorDef)` → 玩家通過某道門的觸發線後，那道門關上且不會再開。
- **測試至少要有**：區域資料有效、玩家通過觸發線後門關上、還沒通過不會關、關上的門不會自己再開
- **不用做**：怪物從後面出現與追逐（等 STEP 6 完成後由 EricRose043 那邊接）

---

## 兩人都可以做：實機測試
EricRose043 那邊的 AI 只能在模擬環境測，下面這些需要真的電腦和手把。結果寫進 `docs/TESTING_LOG.md`（新檔案，誰測誰寫一段）。
- 學校舊電腦：全螢幕玩一遍，記下左上角 FPS（要 30 以上）、電腦型號、瀏覽器
- Xbox 手把、PS 手把：照 `README.md` 的手把測試清單各玩一遍，記下畫面顯示的手把名稱
- Chrome 的滑鼠鎖定：點畫面會鎖、Esc 會暫停、「繼續」能回來

## 之後才會開放（依賴 STEP 5～6）
- STEP 7 的按鈕放進生產線、按錯引怪物
- STEP 8 的怪物追逐
- 把出口、走廊接上地圖
這些等 EricRose043 那邊 STEP 6 完成後，由那邊整合或再分派。
