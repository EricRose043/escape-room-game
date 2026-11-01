# 細部測試與驗收追溯（TESTS）

更新：2026-10-29。統整：shuoen88；功能作者各自自測，EricRose043 審查整合。此分支為分工與文件提案，尚待 owner 合併；細部案例須人審後再據以開發。

## 文件關係與狀態

- `BRIEF.md` 是需求；`VERIFY.md` 是人類驗收依據，本輪均未修改。
- 下表 V 編號依 VERIFY 各節的條列順序編訂，例如 V2.04 是 STEP 2 第四條；行號僅輔助定位。T 編號是細部案例，需求調整時保留歷史編號，不重新洗號。
- **A/M**：列出的現有測試檔提供自動檢查；外觀、真實瀏覽器與裝置仍須手動驗。**M**：主要靠實測。**D**：文件／執行指令檢查。**P/M**：功能或串接待實作，未驗收。**Q/M**：需求待澄清，不能推定通過。
- A/M 並不表示整條驗收已完成；本輪完整套件結果只證明現有斷言通過。每次執行的版本、命令及限制寫入 `docs/TESTING_LOG.md`。
- 細節新增不是變更需求：涉及玩法或驗收含義，先在 `docs/DEFECTS.md` 記需求問題，由人確認；不得為了通過修改既有測試。
- 來源：老師 [week 8 簡報](https://docs.google.com/presentation/d/1sUp3laBiN8SRGhk6ET6KpdEYCLJr-aW2bww-lJPj28s/edit)第 7～11、17、22～27 頁；repo `VERIFY.md`、`BRIEF.md`、`TEAM_TASKS.md`、`supervisor/LATEST.md`。

## VERIFY 逐條對照

所有 53 條 VERIFY 條目各有一個案例；實際參數及情境展開在「操作與邊界」。新增自動測試時將對應檔案與測試名稱補入原案例，不以測試數量取代驗收證據。


### STEP 0

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T0.01 | [V0.01](VERIFY.md#L9)：執行 `npm test` → 一行指令跑完全部測試 | 使用 package.json 的 test 指令跑完整套件；失敗時保留退出碼與測試名稱。 | D；[`logic.test.js`](tests/logic.test.js)、[`logic-boundary.test.js`](tests/logic-boundary.test.js) |
| T0.02 | [V0.02](VERIFY.md#L10)：用本機伺服器打開 `index.html` → 看得到一個 3D 房間，主控台沒有錯誤 | 依 README 啟動本機 HTTP；開新分頁開始遊戲，檢查房間可見及主控台。 | M |
| T0.03 | [V0.03](VERIFY.md#L11)：不可以：直接點兩下 `index.html` 就假設能跑（要寫清楚怎麼開） | 核對 README 同時有 Mac／Windows 指令、HTTP 網址與 file:// 限制，不把雙擊失敗誤報為遊戲錯誤。 | D |

### STEP 1

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T1.01 | [V1.01](VERIFY.md#L14)：點一下畫面 → 滑鼠被鎖定，移動滑鼠會轉頭看四周 | 真正點畫面，左右與上下移鼠；觀察 Pointer Lock、準星和相機，不以覆寫 DOM 取代此測試。 | M |
| T1.02 | [V1.02](VERIFY.md#L15)：按 W、A、S、D → 往前、左、後、右走 | 分別按四方向及斜向，確認方向、速度與放開停止。 | A/M；[`movement.test.js`](tests/movement.test.js) |
| T1.03 | [V1.03](VERIFY.md#L16)：按 Esc → 滑鼠解鎖，遊戲暫停，出現暫停畫面 | 移動中按 Esc，確認解鎖、暫停畫面及位置凍結；繼續後不洩漏前次輸入。 | A/M；[`movement.test.js`](tests/movement.test.js)、[`gamepad.test.js`](tests/gamepad.test.js) |
| T1.04 | [V1.04](VERIFY.md#L17)：不可以：穿過牆壁或桌子 | 持續走向每面牆、桌子與薄隔板，並貼邊走；長幀仍不能穿越。 | A/M；[`movement.test.js`](tests/movement.test.js)、[`world.test.js`](tests/world.test.js) |
| T1.05 | [V1.05](VERIFY.md#L18)：不可以：抬頭、低頭轉超過 90 度，整個畫面翻過去 | 持續向上／下轉頭，測到視角極限，不翻面；目前實作限制為正負 85 度。 | A/M；[`movement.test.js`](tests/movement.test.js) |

### STEP 1b

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T1b.01 | [V1b.01](VERIFY.md#L21)：接上 Xbox 手把、按任一鍵 → 遊戲認出是 Xbox；左搖桿走路、右搖桿轉頭；按 Start 暫停 | 真實 Xbox 按任一鍵，確認名稱、左右搖桿、Start；自動部分僅驗資料辨識與動作。 | A/M；[`gamepad.test.js`](tests/gamepad.test.js) |
| T1b.02 | [V1b.02](VERIFY.md#L22)：接上 PS 手把、按任一鍵 → 遊戲認出是 PS；操作同上，按 Options 暫停 | 真實 PS 按任一鍵，確認名稱、左右搖桿、Options；自動部分僅驗資料辨識與動作。 | A/M；[`gamepad.test.js`](tests/gamepad.test.js) |
| T1b.03 | [V1b.03](VERIFY.md#L23)：認不出種類的手把 → 照樣能玩，按鍵名稱用 Xbox 的 | 用未知品牌但 standard mapping 的資料測試，按鍵提示回退 Xbox；非標準映射依現行設計顯示不支援，是否符合本條待人審。 | A/M；[`gamepad.test.js`](tests/gamepad.test.js) |
| T1b.04 | [V1b.04](VERIFY.md#L24)：剛用過手把再動滑鼠 → 提示文字換回鍵盤滑鼠的寫法；反過來也一樣 | 鍵鼠切手把再切回，確認提示跟隨有效輸入，死區雜訊不切換，0.5 秒內不抖動。 | A/M；[`gamepad.test.js`](tests/gamepad.test.js) |
| T1b.05 | [V1b.05](VERIFY.md#L25)：遊戲中拔掉手把 → 自動暫停 | 實際拔除目前手把，確認暫停；接回不自動繼續，拔除非使用中的手把不誤暫停。 | A/M；[`gamepad.test.js`](tests/gamepad.test.js)、[`capture-input.test.js`](tests/capture-input.test.js) |
| T1b.06 | [V1b.06](VERIFY.md#L26)：不可以：放開搖桿後（搖桿輕微飄移）角色還在慢慢走或轉頭 | 軸值 0、死區邊界 0.18 與略超界；回中後觀察角色與鏡頭不持續漂移。 | A/M；[`gamepad.test.js`](tests/gamepad.test.js) |
| T1b.07 | [V1b.07](VERIFY.md#L27)：不可以：手把和滑鼠同時動時畫面亂跳 | 鍵鼠與手把同時移動／轉頭／確認，確認不加速、不重複動作且畫面穩定。 | A/M；[`gamepad.test.js`](tests/gamepad.test.js)、[`flashlight-input.test.js`](tests/flashlight-input.test.js)、[`interaction-input.test.js`](tests/interaction-input.test.js) |

### STEP 2

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T2.01 | [V2.01](VERIFY.md#L30)：看著 2 公尺內的物品 → 畫面中間出現「E 撿起」之類的提示 | 中央射線對準、移開、轉身，近距物品提示只在可互動時出現。 | A/M；[`interaction.test.js`](tests/interaction.test.js) |
| T2.02 | [V2.02](VERIFY.md#L31)：按 E → 物品進到背包，場景裡的物品消失 | 取得物品後核對背包與模型；重複按與長按不重複加入，原狀態不受突變。 | A/M；[`interaction.test.js`](tests/interaction.test.js)、[`interaction-input.test.js`](tests/interaction-input.test.js) |
| T2.03 | [V2.03](VERIFY.md#L32)：用手把時 → 提示寫「A 撿起」（Xbox）或「✕ 撿起」（PS），按該鍵效果和 E 一樣 | Xbox A／PS ✕ 與 E 各撿一次；核對提示名稱及相同結果。 | A/M；[`interaction-input.test.js`](tests/interaction-input.test.js)、[`gamepad.test.js`](tests/gamepad.test.js) |
| T2.04 | [V2.04](VERIFY.md#L33)：不可以：看著 2 公尺外的物品也能撿 | 以眼睛到表面距離測 1.999、2、2.001 公尺；2 公尺可選，超過不可選。 | A/M；[`interaction.test.js`](tests/interaction.test.js) |
| T2.05 | [V2.05](VERIFY.md#L34)：不可以：隔著牆撿到另一邊的物品 | 同距障礙、薄牆、桌面、障礙在物品前後與擦邊；前方遮擋不能撿，繞行後可撿。 | A/M；[`interaction.test.js`](tests/interaction.test.js)、[`world.test.js`](tests/world.test.js) |

### STEP 3

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T3.01 | [V3.01](VERIFY.md#L37)：按 F → 手電筒打開或關掉，打開時前方被照亮 | 拿燈後 F 開／關，未拿燈時不作用；同時按來源與長按只切一次；實際照明另驗。 | A/M；[`flashlight.test.js`](tests/flashlight.test.js)、[`flashlight-input.test.js`](tests/flashlight-input.test.js)、[`lobby.test.js`](tests/lobby.test.js) |
| T3.02 | [V3.02](VERIFY.md#L38)：手電筒打開時 → 電池慢慢減少，畫面上看得到電量 | 分幀與一次等時長耗電一致；關燈與暫停不耗電，實測 HUD 和照明同步。 | A/M；[`flashlight.test.js`](tests/flashlight.test.js) |
| T3.03 | [V3.03](VERIFY.md#L39)：撿到電池 → 電量增加，不會超過 100% | 接近滿電時拾電池不超過 100；同一電池只生效一次，隔牆／超距不補電。 | A/M；[`flashlight.test.js`](tests/flashlight.test.js) |
| T3.04 | [V3.04](VERIFY.md#L40)：按 R → 切換一般光／紫外光；只有紫外光照到時，牆上的隱藏字才看得到 | R 切模式，UV 正面照到且無遮擋才顯字；測角度、距離與遮擋邊界。 | A/M；[`illumination.test.js`](tests/illumination.test.js)、[`flashlight-input.test.js`](tests/flashlight-input.test.js)、[`power-room.test.js`](tests/power-room.test.js) |
| T3.05 | [V3.05](VERIFY.md#L41)：手把：RB／R1 開關手電筒，LB／L1 切換紫外光，效果和 F、R 一樣 | Xbox RB／LB、PS R1／L1 逐一與 F／R 比較，暫停與繼續當幀不誤觸。 | A/M；[`flashlight-input.test.js`](tests/flashlight-input.test.js) |
| T3.06 | [V3.06](VERIFY.md#L42)：不可以：電量是 0 還打得開手電筒 | 電量耗盡自動關閉且不小於零；零電量反覆嘗試開燈仍關閉，補電後可再開。 | A/M；[`flashlight.test.js`](tests/flashlight.test.js) |
| T3.07 | [V3.07](VERIFY.md#L43)：不可以：一般光照到隱藏字也看得到 | 同位置比較一般光、關燈、零電與 UV；只有有效 UV 顯字，背面與隔板後仍隱藏。 | A/M；[`illumination.test.js`](tests/illumination.test.js) |

### STEP 4

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T4.01 | [V4.01](VERIFY.md#L48)：在大廳撿到手電筒之後 → 才能離開大廳 | 未拿燈嘗試出大廳，再拿燈通過；檢查門模型、碰撞與視線同時切換。 | A/M；[`lobby.test.js`](tests/lobby.test.js)、[`world.test.js`](tests/world.test.js) |
| T4.02 | [V4.02](VERIFY.md#L49)：找到保險絲，插進電箱 → 電箱亮燈 | 沒有保險絲／取得後／安裝後重複互動；控制指示燈亮，但主電力不提前恢復。 | A/M；[`power-room.test.js`](tests/power-room.test.js) |
| T4.03 | [V4.03](VERIFY.md#L50)：用紫外光找到密碼，輸入正確 → 電力恢復，燈亮起來，往生產線的門打開 | 由出生點拿燈、拾保險絲、安裝、UV 找碼、輸入 4726 並進生產線；燈與門同步。 | A/M；[`chapter-flow.test.js`](tests/chapter-flow.test.js)、[`keypad-input.test.js`](tests/keypad-input.test.js)、[`power-room.test.js`](tests/power-room.test.js) |
| T4.04 | [V4.04](VERIFY.md#L51)：不可以：輸入錯的密碼也開門 | 輸錯碼，確認不開門不供電且可重試；正確後重複互動不重播。 | A/M；[`chapter-flow.test.js`](tests/chapter-flow.test.js) |
| T4.05 | [V4.05](VERIFY.md#L52)：不可以：沒插保險絲就能輸入密碼 | 未安裝即嘗試開面板及直接提交正確碼，皆不能供電／開門。 | A/M；[`power-room.test.js`](tests/power-room.test.js)、[`chapter-flow.test.js`](tests/chapter-flow.test.js) |

### STEP 5

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T5.01 | [V5.01](VERIFY.md#L57)：棉花糖先生沿著固定路線巡邏 | 首次進生產線啟動巡邏，固定 B C D A B 兩圈；碰撞不穿機台，暫停時間不跳進。 | A/M；[`monster-patrol.test.js`](tests/monster-patrol.test.js)、[`navigation.test.js`](tests/navigation.test.js) |
| T5.02 | [V5.02](VERIFY.md#L58)：玩家走進牠前方的視線範圍（距離內、角度內、中間沒有牆）→ 牠開始追 | 測距離與視角剛好在界內／界外、正前方無遮擋，確認由巡邏進入追逐。 | A/M；[`monster-vision.test.js`](tests/monster-vision.test.js)、[`monster-chase.test.js`](tests/monster-chase.test.js) |
| T5.03 | [V5.03](VERIFY.md#L59)：躲進置物櫃 → 牠找不到玩家，過一陣子回去巡邏 | 被看見後進櫃，確認立即失去目標，等待搜尋後返回巡邏，再安全出櫃。 | A/M；[`hiding.test.js`](tests/hiding.test.js)、[`hiding-input.test.js`](tests/hiding-input.test.js)、[`monster-flow.test.js`](tests/monster-flow.test.js) |
| T5.04 | [V5.04](VERIFY.md#L60)：不可以：隔著牆看到玩家 | 牆、機台、櫃體與關門擋住玩家時不發現；後方障礙不誤擋。 | A/M；[`monster-vision.test.js`](tests/monster-vision.test.js) |
| T5.05 | [V5.05](VERIFY.md#L61)：不可以：玩家在牠背後也被發現 | 在怪物背後及視角外移動，不產生新發現；已有追逐記憶情境分開驗。 | A/M；[`monster-vision.test.js`](tests/monster-vision.test.js)、[`monster-chase.test.js`](tests/monster-chase.test.js) |

### STEP 6

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T6.01 | [V6.01](VERIFY.md#L64)：被追到碰到玩家 → 畫面變黑（開了 jump scare 才會有嚇人畫面）→ 回到最近的存檔點 | 實際接觸後先黑畫面，開／關驚嚇分支各試；1.2 秒後回安全平台，清除殘留輸入。 | A/M；[`capture.test.js`](tests/capture.test.js)、[`capture-input.test.js`](tests/capture-input.test.js)、[`checkpoints.test.js`](tests/checkpoints.test.js) |
| T6.02 | [V6.02](VERIFY.md#L65)：回到存檔點後 → 已經撿的東西、已經解開的謎題都還在 | 先拿物品、安裝與解題，再被抓，核對背包、謎題、門、電量及存檔點不回退。 | A/M；[`checkpoints.test.js`](tests/checkpoints.test.js)、[`save-flow.test.js`](tests/save-flow.test.js) |
| T6.03 | [V6.03](VERIFY.md#L66)：不可以：被抓到就整場重來 | 生產線被抓後仍保留前兩區進度；再進區仍可能被抓，不產生永久無敵。 | A/M；[`checkpoints.test.js`](tests/checkpoints.test.js)、[`capture.test.js`](tests/capture.test.js)、[`save-flow.test.js`](tests/save-flow.test.js) |
| T6.04 | [V6.04](VERIFY.md#L67)：不可以：設定關掉 jump scare 之後還出現嚇人畫面 | 關閉驚嚇及中途關閉均不出現殘留近景；目前用 query 參數驗分支，設定面板 S2 尚待接入。 | A/M；[`capture-view.test.js`](tests/capture-view.test.js)、[`capture.test.js`](tests/capture.test.js) |

### STEP 7

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T7.01 | [V7.01](VERIFY.md#L72)：照牆上線索的顏色順序按按鈕 → 生產線啟動，通道打開 | 依可見線索完整按對順序才啟動生產線及開門；已解後再按不反悔。 | P/M |
| T7.02 | [V7.02](VERIFY.md#L73)：按錯 → 順序重來，並發出警報聲（會把棉花糖先生引過來） | 前綴按對後按錯，進度歸零、發警報、怪物實際被引來；只有 alarm 欄位不足以驗收。 | P/M |
| T7.03 | [V7.03](VERIFY.md#L74)：不可以：亂按也能過關 | 按錯、少按、多按、亂序與重複按不得解開；正確重試仍可通過。 | P/M |

### STEP 8

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T8.01 | [V8.01](VERIFY.md#L77)：走進走廊 → 棉花糖先生從後面出現開始追 | 從生產線進走廊，怪物從後方開始追；退出與重入的行為另由整合時確認。 | P/M |
| T8.02 | [V8.02](VERIFY.md#L78)：跑過的門 → 會在身後關上 | 尚未跨觸發線、跨越當幀、回頭、再次更新，各門依序關閉且不重開。 | P/M |
| T8.03 | [V8.03](VERIFY.md#L79)：不可以：追逐中原地不動也不會被抓 | 進入追逐後不動，確認會被追上並走正常被抓回復流程。 | P/M |

### STEP 9

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| T9.01 | [V9.01](VERIFY.md#L82)：輸入由前面三條線索組成的密碼 → 大門打開，出現結局畫面和遊玩時間 | 從三區線索推導密碼、正確輸入開門，結局顯示時間；0 秒、跨 1 小時及再玩一次另驗。 | P/M |
| T9.02 | [V9.02](VERIFY.md#L83)：不可以：沒有拿到全部線索也猜得到密碼（密碼每次遊戲都一樣，但線索要能推出來） | 由未看解答的人僅依三條線索推導，檢查無其他文字直接洩碼；固定碼無法保證不能猜中，是否需要收集門檻須人類澄清（Q-001），暫不新增機制。 | Q/M |

### 一直要成立的事

| 案例 | VERIFY 來源／預期結果 | 操作與邊界 | 方式／現有自動對應 |
|---|---|---|---|
| TG.01 | [VG.01](VERIFY.md#L86)：只用手把（不碰鍵盤滑鼠）→ 能從開始畫面玩到結局，包括密碼鎖、暫停選單、設定 | 分別只用實體 Xbox／PS 從開始到結局，含密碼鎖、暫停、設定、再玩一次；前半段模擬通過不算整章。 | P/M |
| TG.02 | [VG.02](VERIFY.md#L87)：學校舊電腦全螢幕 → 每秒 30 格以上 | 學校舊電腦全螢幕在探索、追逐與結局記錄 FPS、時段、機型、瀏覽器；低於 30 記缺陷。 | M |
| TG.03 | [VG.03](VERIFY.md#L88)：關掉頁面再打開 → 可以從存檔點繼續 | 拿物品／輸半碼／供電／櫃內／被抓中分別關頁重開，回存檔點且進度一致；測壞 JSON、版本、儲存失敗及其他 key 保護。 | A/M；[`chapter-save.test.js`](tests/chapter-save.test.js)、[`save-storage.test.js`](tests/save-storage.test.js)、[`save-flow.test.js`](tests/save-flow.test.js)、[`start-menu.test.js`](tests/start-menu.test.js) |
| TG.04 | [VG.04](VERIFY.md#L89)：不可以：出現血腥畫面 | 檢視怪物、被抓近景、所有場景及素材，不出血腥畫面；原創及來源另依 BRIEF 檢查。 | M |

## BRIEF 與分工補充案例（尚待功能實作／人審）

| 案例 | 來源 | 操作與預期 | 目前證據 |
|---|---|---|---|
| TB-A01 | BRIEF「恐怖程度」；TEAM S1 | 首次按開始後 unlock 才可出聲；腳步、門、警報、環境可分辨，暫停／停走不殘留腳步 | S1 獨立模組及訊號測量已驗（LOG-04）；遊戲串接與真人試聽待驗 |
| TB-A02 | BRIEF「恐怖程度」；TEAM S1 | 怪物距離越近心跳強度越大，值在 0～1；遠距為零；速度為零不出腳步，速度增大腳步間隔縮短 | S1 混音邊界已由新 audio-mix 測試覆蓋（LOG-04）；參數見 AUDIO_INTEGRATION，正式整合待驗 |
| TB-S01 | BRIEF「恐怖程度」及「操作」；TEAM S2 | 音量上下界夾住；設定存讀一致；壞資料回預設；只用手把選取、調整、關閉；關閉驚嚇後實際被抓不出近景 | S2 未交付；驚嚇預設仍依 D014 待 Eric 決定 |
| TB-C01 | BRIEF「參考與原創」「限制」；TEAM Ryan | 五區故事與密碼線索一致；素材各有來源與授權；不混入他作角色、圖片、音效 | 待 Ryan 的故事文件與素材盤點，不將程式產生視為已完成授權審查 |
| TB-D01 | BRIEF「限制」；老師期中提交方式 | 在乾淨靜態 HTTP 環境依 README 啟動，不需遊戲後端／帳號；確認 three.js CDN 網路需求已說明 | 待實際部署／乾淨環境測試；不推定 file:// 能用 |

## 突變測試（計畫，尚未執行）

shuoen88 統整，程式作者確認修改範圍。只在乾淨的獨立分支／副本：

1. 先 commit 正常版本並記 SHA，執行原測試確認全綠。
2. 一次只改壞一條規則，例如把互動距離邊界放寬、讓錯碼開門、或讓關閉驚嚇仍顯近景；先檢查與共用檔案負責人約定的範圍。
3. 記錄案例、改壞內容、執行命令與失敗測試名稱。測試仍綠表示漏網；補能抓到該錯誤的測試並保留需求追溯，不能只把預期改成錯誤行為。
4. 還原那一條修改，確認沒有突變殘留，再跑全套。將結果記入 TESTING_LOG；故意改壞的程式不得進 main。未執行不得填「已抓到」。

## 人為實玩與關閉缺陷

完整流程以 US-01～US-05（見實測紀錄）為導航：拿燈 → 恢復電力 → 發現與躲藏 → 被抓／存讀 → 謎題與走廊 → 三線索逃出。最後幾段尚未實作時標待功能，不把半章測試記成整章成功。

發現問題 → 記錄 DEF 編號與重現 → 對到本文件案例及 VERIFY → 補測試先紅 → 修復後綠 → 相同版本實際複測。只有本人完成的步驟才能簽通過；真實 Xbox、PS、舊電腦與音效觀感均須人測。

## 本輪整理的驗證範圍

本輪僅更新文件，沒有新增遊戲功能或自動測試；已核對 53 條來源完整與現有測試檔路徑。Windows CRLF 環境先出現 4 項既有失敗，原始 LF 內容下 169/169 通過，詳見 LOG-20261029-01／02 及 DEF-001。未執行實玩、突變或實體設備測試，既有監督者結果只作歷史參考。

## 2026-10-29 S0 執行補充

T6.01～03、TG.03 及 US-03 的預製存檔／模擬手把條件結果見 LOG-20261029-03。實際 WebGL 中觀察到約 1.203 秒被抓黑畫面及回復，raw JSON 前後一致；真正關閉分頁重開與取消重開也保留進度。只覆蓋上述條件，不把真人鍵鼠、實體手把、驚嚇開啟或整章實玩改成通過。ENV-001 記錄此內建瀏覽器的 Pointer Lock 限制。

## S1 補充案例與執行結果

- TB-A01／TB-A02：對應 `tests/audio-mix.test.js`、`tests/audio.test.js` 與 LOG-20261029-04。解鎖、訊號、範圍、停步、速度與資源生命週期已驗；真人聽感與遊戲整合不列通過。
- TB-A03（TEAM_TASKS S1 瀏覽器解鎖與 API；BRIEF 聲音）：解鎖前不建 context，反覆 unlock／setAmbience／setHeartbeat 不疊加；主音量 0～1、零強度取消已排程雙拍、stop／dispose 清理。新測試及實際瀏覽器紀錄見 LOG-04／DEF-002。

## 新工廠第一快照 aace2e6 的補充查核（歷史，尚未取代原 VERIFY）

被測版本 aace2e6，依該分支 BRIEF／STORY_DRAFT 的新設計補查；原 53 條保留其原始含義，不因分支新增功能就視為全部驗收完成。詳細命令與證據見 LOG-20261029-05。

| 案例 | 新設計來源 | 本輪方式與結果 |
|---|---|---|
| TF-01 | BRIEF 故事：可跳過開場 | 真瀏覽器按跳過可進選單；完整 60 秒與影片／手把未驗 |
| TF-02 | 最新提交的方向鍵轉頭備援 | 未取得 Pointer Lock 時，開始後按方向鍵可轉頭、E 可撿物；原生滑鼠鎖定仍待環境 |
| TF-03 | BRIEF 地圖取得與查看 | 實際從出生點低頭撿圖、M 開關、真關頁後繼續仍能查看；通關收藏版待驗 |
| TF-04 | BRIEF 列車裝卸區／通關 | 既有完整套件 173/174；低頭可啟動控制台，但原測試水平視線 fixture 未命中（DEF-003） |
| TF-05 | BRIEF 登車逃離 | 真正 updateChapter fixture 登車後跑 10 秒仍 ending/0，失敗（DEF-004） |
| TF-06 | BRIEF 已完成謎題保留 | 真正序列化／解析／還原後，裝配線與 trainStarted 由 true 變 false，失敗（DEF-005） |
| TF-07 | S1 與新工廠相容性 | S1 分支 180/180；只展開合併預覽的套件 184/185，仍同一列車失敗；未接音效、未正式合併 |

TF 表是分支查核證據，玩法及驗收含義變更仍待人確認；Q-004／INT-001 未解前不可把新工廠流程標為已驗收。

## 最新覆測 8bf3e2f（LOG-06，優先於上一張歷史表）

- TF-01～03：重新載入後跳過開場、讀回地圖、M 開圖與收圖恢復均已在真瀏覽器驗；原先拾圖與方向鍵證據保留 LOG-05。
- TF-04：列車 fixture 由 Ryan 修正低頭視線，最新完整套件 **176/176**；不再記為該 SHA 的失敗。
- TF-05：正常登車後以 logic 更新 10 秒達 complete，DEF-004 邏輯複測通過；真人全章未驗。
- TF-06：序列化往返仍遺失裝配線與列車進度，DEF-005 未解；現有套件全綠並未涵蓋此缺口。
- TF-07：S1 自有分支 180/180；最新整合預覽因兩個同名音效檔 add/add 衝突而停止，沒有可宣稱通過的合併套件（INT-002）。
- TF-08（Ryan 最新音效 UI）：真實頁面開啟／靜音按鈕可切換，console 無錯；不同於 S1 先前的 AnalyserNode 訊號測量，不能混用結果。

## LOG-07 整合修復案例（2026-10-29）

來源：BRIEF 的已解謎題保留、D014 存讀保護、TEAM_TASKS S1 與 D018 的修復授權；原 VERIFY 53 條追溯不變。

| 案例 | 新回歸與結果 |
|---|---|
| TF-06a | v2 保存 production.sequence／trainStarted 往返不變且不修改輸入；save-progress-v2.test.js |
| TF-06b | v1 仍可讀，不補造未曾保存的進度；同檔 |
| TF-06c | 裝配線／列車當幀 flush；缺欄、未知版、矛盾前置拒絕；寫入失敗保留舊檔可重試；同檔 |
| TF-07a | 兩方 API 存在且 factory 只建立一個 S1 引擎；audio-integration.test.js |
| TF-07b | 原事件、距離心跳、實際位移腳步交給共享引擎；暫停／靜音停止，dispose 後不再排程；同檔 |
| TF-06d | 真瀏覽器預製 v2、兩次關頁、正式 main 繼續後仍 true／true／41；LOG-07，並非真人逐關解題 |
| TG-03a | .gitattributes 下乾淨 Windows autocrlf=true clone 200/200 通過；不代表任意手改 CRLF 均支援 |

合併基線192/192；先紅200項中193通過／7失敗（d87b510）；修復後200/200（54ae26f）。Ryan audio.test.js 的原斷言保留，只補共享引擎所需 WebAudio 假物件方法；S1 斷言隨模組移名保留。完整章節、聽感與實體設備仍未驗。

## LOG-08：S2、S3與驗收統整（最新）

原53條驗收逐條的最新證據、未驗與環境限制見 [驗收結果表](docs/ACCEPTANCE_STATUS.md)。原TESTS操作方式與VERIFY來源連結保留，不用新版玩法默認取代舊驗收。

| 新案例 | 對應要求 | 本輪結果 |
|---|---|---|
| TS-01 | TEAM_TASKS S2、TG.01／T6.04 | settings.test.js：明確預設選擇、上下界、型別、壞檔、往返、儲存失敗及其他key保護；5項通過 |
| TS-02 | TEAM_TASKS S2、TG.01 | settings-view.test.js：鍵盤／手把控制、焦點、返回、精確音量與Tab圈限；3項通過 |
| TS-03 | S1／S2整合、T1.01／T6.04 | integration-settings.test.js：正式main讀取／更新設定、音量跨開始與靜音保持、Y／△邊緣、實際mousemove倍率及面板凍結；4項通過 |
| TS-04 | S2瀏覽器存讀 | 實際main＋模擬手把完成Y／上下左右／A／B；37%／開／1.25存讀，真關頁到正式頁仍保留；鍵盤改42%／關／1.0，error/warn空；非實體設備 |
| TC-01 | S3、T8.02 | corridor-doors.test.js：正向跨線、反向／門外不觸發、轉彎、不可逆與無效位置；5項通過 |
| TC-02 | S3、D007／D010、T8.02 | chase-corridor.test.js：ID／引用有效、整段轉彎可達、關門不夾身、碰撞與遮擋一致、不能走回；3項通過 |
| TC-03 | S3獨立預覽 | corridor-test.html真瀏覽器自動走訪完成3/3門，error/warn空；不包含正式地圖或怪物 |
| TM-01 | S0突變驗證 | 心跳方向、列車存檔、走廊跨線方向3個獨立突變均被測試抓到；每次還原後綠，非全規則突變覆蓋 |

完整220/220、Windows乾淨autocrlf clone220/220。詳LOG-08。S3正式座標／接入方向尚待使用者答覆，Q-004需求差異及實體設備仍待驗，不把本表視為整章全部驗收。

## LOG-20261101-OWNER：正式整合覆測

- T7.01～03：R1 場景按鈕、錯序重置、實際警報及怪物調查來源已接入；integration-owner-chapter.test.js 與三條正式瀏覽器路線通過。
- T8.01～03：S3 註冊 WORLD，兩次轉彎／三門／背後追逐、停留被抓及回復均已接入；保留 S3 原獨立測試與預覽。
- T9.01／02：三線索推導2413且有收集門檻，開門後啟動及登列車，顯示時間與結局；尚未完成線索不能猜碼跳過。
- TG.01／03：Chrome 鍵鼠事件與模擬 Xbox／PS 從開場到結局，含遊戲中設定、地圖、結局收藏圖、重玩確認、真正頁面重載續玩。物理控制器仍待真人。
- 新回歸：門洞控制器阻擋、結局跨面板確認鍵與 Tab 焦點，均先紅後綠。Node總數235/235。
- 原 T4.01 文本與新版員工卡門禁的差異、實體手把、舊電腦效能與真人聽感仍如實區分；未改 VERIFY，不宣稱53條全部人類驗收通過。

詳細與原始輸出：[INTEGRATION_STATUS](docs/INTEGRATION_STATUS.md)、[LOG](docs/TESTING_LOG.md)、[PR #4](https://github.com/EricRose043/escape-room-game/pull/4)。
