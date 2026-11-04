> 2026-11-01 owner 整合：依使用者直接授權採用本新版分工。R1／R2／S1／S2／S3 已由 owner 接入正式路線；原作者與獨立模組保留，細節見 docs/INTEGRATION_STATUS.md、PR #4。下方原始交付狀態是歷史快照，實體設備待驗仍保留，不代表組員已做過真人通關。

# 組員工作清單（可以和 EricRose043 並行）

更新：2026-10-29（D015；此分支為 shuoen88 提案，經 EricRose043 審查合併後生效）

## 三人主責與交付

| 成員 | 課程主責 | 具體交付 | 合作與驗收 |
|---|---|---|---|
| RyanDing1010 | 劇情與素材 | R1 顏色謎題、R2 出口與結局；新增 `docs/STORY.md` 統整開場、五區故事、三條線索與密碼推導；整理場景文字與素材來源 | 檢查線索可理解且互相一致；素材來源加在 `assets/CREDITS.md`；提供可實玩的驗收步驟 |
| EricRose043 | 網站與機關 | 核心程式、怪物與關卡機關、組員模組接入主程式、部署說明與 PR 最終審查合併 | 處理共用程式與測試修改；接入後交 shuoen88 做跨功能驗收 |
| shuoen88 | 測試與整合 | 維護 `TESTS.md`、統整 `docs/TESTING_LOG.md`、`docs/DEFECTS.md` 與 `docs/CONTRIBUTIONS.md`；保留 S1 聲音、S2 設定、S3 走廊場地 | 安排實機與跨功能測試、追蹤缺陷修正後複測、核對真實作者紀錄；不取代各人自測或 Eric 的合併權責 |

每人負責自己功能的測試與修正；shuoen88 統整整體證據，協調整合驗收。原本 R1／R2／S1／S2／S3 的檔案與介面分配保留，S3 不因本次文件更新自動轉交；如時間不足由三人再協調並記錄。上述新增交付目前只是任務，不代表已完成。

依 `supervisor/LATEST.md`（2026-10-23），STEP 0～6 已審查，但 6b／6c 仍有瀏覽器補驗、實體手把及舊電腦效能缺口。保留既有歷史紀錄；最新驗收結果統整到 `docs/TESTING_LOG.md`。組員工作仍可並行，避免改到同一批共用檔案。

## 開工前一定要讀
`AGENTS.md`、`BRIEF.md`、`VERIFY.md`、`PLANS.md`、`DECISIONS.md`，以及 `src/logic/areas/power-room.js`（區域資料的範本，D010）。

## 檔案範圍：功能模組分開，驗收文件共同留下證據

| 誰的檔案 | 檔案 | 組員可以改嗎 |
|---|---|---|
| EricRose043 | `src/logic/chapter.js`、`world.js`、`index.js`、`monster*.js`、`navigation.js`、`movement.js`、`gamepad.js`、`interaction.js`、`flashlight.js`、`areas/lobby.js`、`areas/power-room.js`、`areas/production.js`、`src/game/main.js`、`world-view.js`、`monster-view.js`、`index.html`、所有現有 `tests/*.test.js` | **不要改**。需要接上時，在 PR 說明裡寫「需要 EricRose043 那邊在 X 加一行 Y」，由那邊整合。 |
| 組員 | 下面每個任務列出的**新檔案** | 可以，只改自己任務的檔案 |

新增職責的文件範圍：Ryan 可新增／維護 `docs/STORY.md`；shuoen88 可維護 `TESTS.md`、上述三份追蹤文件，並新增 `tests/integration-*.test.js`。實測者可追加自己的實測與貢獻紀錄，不刪別人的紀錄；共同文件以 PR 協調。此範圍不授權組員直接改既有測試或共用主程式。

其他規則照 `AGENTS.md`：先寫測試再寫程式（TDD）、不改既有測試、規則放 `src/logic/`（不碰 three.js）、畫面放 `src/game/`、素材來源寫 `assets/CREDITS.md`（這個檔可以加自己的段落）。

## 怎麼交
1. 開自己的分支：`git checkout -b ryan/color-puzzle`（名字照任務改）。
2. 做完 `npm test` 全部通過（包含別人的測試）。
3. push 分支、在 GitHub 開 Pull Request，說明寫：做了什麼、測試結果、**需要主程式怎麼接**（例如「在 chapter.js 呼叫 `pressButton`」）。
4. 不要直接推到 `main`。EricRose043 那邊審查後合併，並負責接進主程式；shuoen88 核對接入後的驗收結果與未解缺陷。
5. commit 使用實際工作者自己的 GitHub 身分。合併使用 **Create a merge commit**，保留分支上每筆原始 commit 與作者；不使用 squash／rebase 合併，不 force push、不改寫既有作者。
6. PR 加上對應 `TESTS.md` 案例、實測／缺陷紀錄及原始 commit，依 `docs/CONTRIBUTIONS.md` 核對。不能替別人補造 commit；共同工作只有真正參與且本人確認時才加共同作者。

---

## RyanDing1010：劇情與素材（保留謎題與結局）

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

## shuoen88：測試與整合（保留聲音、設定、追逐走廊場地）

### S0　整體驗收與缺陷追蹤（優先統整）
- `TESTS.md`：由 `VERIFY.md` 展開案例，保留來源編號；AI 維護細節，人審驗收依據，不反向改寫需求。
- `docs/TESTING_LOG.md`：安排鍵鼠、Xbox、PS、存檔、被抓、效能與整章實玩；記錄版本、設備、操作者、實際結果。假手把與 Node 替身不算實體手把驗收。
- `docs/DEFECTS.md`：登錄重現步驟、預期／實際、修復負責人、修復 commit 與複測；只有重現確定才標為缺陷。未實作功能、需求問題及未檢查項目分開記錄。
- `docs/CONTRIBUTIONS.md`：核對各人原始 commit 與 PR，合併後確認原始 SHA 仍可由 main 追溯。
- 突變測試只在乾淨的獨立分支／工作副本進行；先 commit、每次改壞一條規則、確認測試會失敗、還原並跑綠。漏網才補測試，不把故意改壞的程式合進 main。
- 各人先自測；shuoen88 驗跨功能結果；Eric 處理主程式串接並審查合併。尚未實玩不得填通過。

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

## 三人共同實測，由 shuoen88 統整
下面這些需要真的電腦和手把，不能只靠模擬環境。三人都可實測，結果追加到 `docs/TESTING_LOG.md`，由 shuoen88 核對缺漏並登錄缺陷，不代填未做的測試。
- 學校舊電腦：全螢幕玩一遍，記下左上角 FPS（要 30 以上）、電腦型號、瀏覽器
- Xbox 手把、PS 手把：照 `README.md` 的手把測試清單各玩一遍，記下畫面顯示的手把名稱
- Chrome 的滑鼠鎖定：點畫面會鎖、Esc 會暫停、「繼續」能回來

## 後續整合（STEP 6 核心已完成，仍需串接與驗收）
- STEP 7 的按鈕放進生產線、按錯引怪物
- STEP 8 的怪物追逐
- 把出口、走廊接上地圖
由 EricRose043 隨組員 PR 合併逐項串接，再由 shuoen88 統整整段驗收；未接入的功能不標為完成。

## shuoen88 本輪交付狀態（LOG-08）

本段記錄交付，不改動其他成員的工作邊界或既有驗收需求。

| 項目 | 最新交付 | 尚待 |
|---|---|---|
| S0 | TESTS53條結果表、LOG／DEFECTS、3個獨立突變、貢獻核對、HUMAN_TEST_CHECKLIST | 實體設備與真人整章、owner合併後main作者核對 |
| S1 | 單一引擎與工廠事件已接入修復分支；S2音量接入後不被開始／靜音重設 | 真人聽感、Q-004錯誤警報引怪需求對齊 |
| S2 | settings.js／settings-view.js、正式入口O／Y／△、設定存讀及主程式音量／近景／滑鼠接入；預設關已由使用者確認 | 實體手把與原生滑鼠環境 |
| S3 | chase-corridor.js／corridor-doors.js、3門兩次轉彎、獨立可玩預覽與8個測試 | 原座標與新版月台重疊；正式接入方向待使用者答覆，怪物由Eric接 |

最新程式122002c完整220/220、Windows220/220；不等於全部人類驗收完成。詳細接入與試玩說明見docs/SETTINGS_AND_CORRIDOR.md。

## shuoen88 2026-11-04重新核對（最新）

| 工作 | 完成與證據 | 仍需完成 |
|---|---|---|
| 測試規劃 | 原53條逐項結果已依main 6ff1d44更新；追加合法小數設定回歸 | 實機結果追加 |
| S1 | 正式警報、心跳、腳步與列車事件已接入；本輪完整回歸通過 | 真人試聽／音色舒適度 |
| S2 | 正式設定已接入；修復儲存1.1倍卻顯示1.0的精度缺口；D028策略本次經shuoen確認 | 實體手把與瀏覽器最新版視覺覆測 |
| S3 | owner已處理區域位置、怪物與正式關門，原始模組／作者保留 | 真人整章與設備驗收 |
| 缺陷／整合 | 最新282項與Windows282項通過，新增DEF-010紅綠證據 | 最新GPU畫面、實體Xbox／PS、學校舊電腦FPS |
| 貢獻紀錄 | 五個原始來源SHA均確認在main祖先，三人原作者已在main | 本輪新PR由Eric審查合併 |

整體未宣稱人類驗收全部完成；詳docs/SHUOEN_STATUS_20261104.md。
