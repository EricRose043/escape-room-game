1. **目標**

   完成 `PLANS.md` 的 **STEP 1b「手把」**，讓 `VERIFY.md` STEP 1b 條目成立：支援 Xbox、PS 與未知手把；鍵鼠與手把可切換；拔除目前正在使用的手把會暫停；搖桿死區能擋住輕微飄移；兩種裝置輸入不會疊加造成畫面亂跳。

   STEP 2、3 的手把按鍵提示表會先建好，但本步不實作互動或手電筒功能。

2. **辨識規則**

   以 `Gamepad.id` 小寫文字辨識，先檢查 PS，再檢查 Xbox；不符合者回傳 `unknown`，顯示 Xbox 按鍵名稱。

   - **PS**：名稱含 `DualShock`、`DualSense`、`PlayStation` 或 `Sony`；或 ID 字串含廠商碼 `054c`。
   - **Xbox**：名稱含 `Xbox`、`XInput` 或 `Microsoft`；或 ID 字串含廠商碼 `045e`。
   - **出處與限制**：MDN 說明 `Gamepad.id` 會包含裝置名稱及 USB 廠商、產品識別資訊，但實際格式會依瀏覽器和驅動程式而不同；USB ID 資料庫將 `045e` 列為 Microsoft、`054c` 列為 Sony。[MDN：Gamepad.id](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/id)、[USB ID Repository](https://github.com/george-hopkins/usbip-windows/blob/master/userspace/usb.ids)
   - 這些是廠商碼，並非單一手把型號碼；不依賴特定產品碼。仿冒或透過轉接器回報不同 ID 的手把，可能只能辨識成 `unknown`。辨識依據是瀏覽器實際回報字串，並以實機清單核對。

3. **死區與曲線**

   建議左、右搖桿各自使用**徑向死區 0.18**：向量長度小於或等於 `0.18` 時歸零；超過後先將剩餘範圍重新映射到 `0..1`，再套用 `x^1.5` 曲線，保留方向並在最大推桿時達到完整輸入。這能消除中心附近的輕微飄移，同時讓細微瞄準更平順。

   瀏覽器回報 `mapping === "standard"` 時，依標準軸讀取：左搖桿 `axes[0]`、`axes[1]`，右搖桿 `axes[2]`、`axes[3]`；Y 軸正值朝下，因此轉成遊戲動作時反向。W3C 標準映射定義了標準軸與按鈕索引；MDN 說明軸值範圍為 `-1..1`，並建議依 `mapping` 判斷瀏覽器是否完成標準映射。[W3C Gamepad](https://www.w3.org/TR/gamepad/)、[MDN：Gamepad API 使用方式](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)

   非 `standard` 映射的處理選項：

   - 直接忽略該控制器並顯示「此手把目前不支援，請改用標準模式或鍵盤滑鼠」。
   - 嘗試用 `id` 對每種控制器建立自訂軸位表。

   **建議採第一項**：符合本步明訂範圍，避免依賴未確認的型號映射；鍵盤滑鼠仍可使用。

4. **手把模式的開始、暫停與繼續**

   - **開始畫面**：同時顯示鍵鼠操作與「按手把任一鍵喚醒；按 A／✕ 開始」。連線事件只更新可用裝置；每幀輪詢 `navigator.getGamepads()`，找到標準映射且按下按鈕後，辨識種類。手把開始時直接進入遊戲，不要求 Pointer Lock。
   - **遊戲中**：按標準映射的按鈕索引 `9` 暫停；UI 顯示 Xbox 的 `Start` 或 PS 的 `Options`。按鈕索引 `9` 是標準映射中的右側中間按鈕，實際標籤依辨識種類呈現。相同按鈕在暫停畫面繼續。
   - **裝置切換**：logic 記錄最後一次有意義輸入的來源。鍵鼠事件選擇鍵鼠；超過死區的搖桿輸入或手把按鍵選擇手把。搖桿在死區內的雜訊不算輸入。每一幀只採用目前來源的移動和轉頭，避免把滑鼠角度位移與搖桿角速度相加。
   - **拔除手把**：只有遊戲正由手把操作時，該手把拔除才自動暫停；若玩家目前使用鍵鼠，拔除非作用中的手把不改變遊戲狀態。
   - **開始畫面失焦修正**：失焦事件只有在遊戲開始後才可改成「已暫停」，保留初次載入的開始畫面標題。

   有一項需要在計畫審查時特別注意：Pointer Lock 需要使用者互動；手把模式不應持有或要求 Pointer Lock。[MDN：Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) 因此從手把切回鍵鼠時，滑鼠移動可先立即切換提示與輸入來源；若 Pointer Lock 尚未取得，畫面顯示「點一下畫面以啟用滑鼠轉頭」，使用者點擊後才要求鎖定。瀏覽器若拒絕鎖定，沿用現有錯誤提示方式，不讓 Promise 錯誤未處理。

5. **檔案白名單**

   - `src/logic/gamepad.js` — 純函式處理裝置辨識、標準映射資料轉動作、死區與曲線、按鍵標籤及最後輸入來源。
   - `src/logic/index.js` — 匯出手把 logic。
   - `src/game/main.js` — 每幀讀取 `navigator.getGamepads()`、處理連線／拔除事件、合併目前作用中的輸入來源、更新開始與暫停流程。
   - `index.html` — 更新開始／暫停畫面的手把提示與來源切換提示。
   - `tests/gamepad.test.js` — 以假的 `Gamepad` 資料測試 logic，不依賴實體手把。
   - `README.md` — 更新目前完成進度、手把操作方式，並新增給 EricRose043 的實機測試清單。
   - `PLANS.md` — STEP 1b 通過後打勾。

6. **驗收**

   **建議先紅後綠的測試名稱：**

   - `Xbox 名稱與 Microsoft 廠商碼會辨識為 xbox`
   - `DualShock、DualSense、PlayStation、Sony 名稱與 Sony 廠商碼會辨識為 ps`
   - `未知手把辨識為 unknown 並使用 Xbox 按鍵名稱`
   - `Xbox 與 PS 按鍵對照表涵蓋互動、取消、手電筒、紫外光、暫停、確認與方向鍵`
   - `左搖桿經徑向死區與曲線後產生 move 動作`
   - `右搖桿經徑向死區與曲線後產生 look yawRate 與 pitchRate`
   - `死區內的搖桿雜訊不產生移動、轉頭或來源切換`
   - `只有有意義的鍵鼠或手把輸入會更新最後使用裝置`
   - `手把暫停鍵只在按下邊緣觸發一次`
   - `拔除目前使用的手把會要求暫停`
   - `拔除非目前使用的手把不會暫停`
   - `非 standard mapping 不產生手把動作並回報不支援`
   - `手把來源作用時不會混入鍵鼠移動與轉頭`

   **README 實機測試清單草稿：**

   1. 在目標瀏覽器連接 Xbox 手把，按任一鍵喚醒；確認顯示 Xbox 名稱，按 A 開始，且沒有要求鎖定滑鼠。
   2. 用左搖桿前後左右移動、用右搖桿轉頭；確認方向正確、放手後停止。
   3. 按 Start 暫停，再按 Start 繼續；確認畫面顯示對應標籤。
   4. 連接 PS 手把，確認顯示 PS 標籤、✕ 開始、Options 暫停與繼續。
   5. 測試未知標準映射手把，確認可操作且按鍵提示使用 Xbox 名稱。
   6. 保持右搖桿轉動時移動滑鼠，再保持滑鼠活動時操作右搖桿；確認畫面不因兩種輸入疊加而突然加速。
   7. 遊戲以手把操作時拔除手把，確認自動暫停；以鍵鼠操作時拔除閒置手把，確認不會誤暫停。
   8. 在支援的瀏覽器／手把組合中查看 `mapping`；非 `standard` 時確認出現支援提示，鍵鼠仍可操作。
   9. 留意每項使用的瀏覽器、作業系統、手把型號、連線方式與實際 `Gamepad.id`，供辨識規則回查。

7. **停止條件**

   - 若標準映射按鈕索引無法在目標瀏覽器中同時符合 Xbox／PS 標籤，先回報實際資料與規格差異。
   - 若鍵鼠與手把同時操作時無法穩定保證單一來源，先提出來源切換策略，避免畫面輸入疊加。
   - 若瀏覽器對非標準映射裝置的回報方式使不支援提示無法顯示，先說明限制及替代驗收方式。
   - 若需要新增套件或修改 `BRIEF.md`、`VERIFY.md` 才能完成，停止並回報原因。

8. **預估回數**

   預估 **1 回施工**，包含測試先紅後綠與兩個 commit。實體手把測試由 EricRose043 依 README 清單完成。

9. **VERIFY／PLANS 的 STEP 1b 清楚度**

   驗收方向可做，但有幾處沒有寫定細節：

   - 未指定搖桿死區數值、死區曲線、手把軸／按鈕標準映射的驗收值；本計畫建議徑向死區 `0.18`，對應範圍與按鈕索引依 W3C standard mapping。
   - 「遊戲中拔掉手把」沒有說明同時連著多支手把，或玩家是否正使用鍵鼠；本計畫按「拔除目前輸入來源才暫停」處理。
   - 「兩種裝置隨時切換」與「按手把任一鍵才可偵測」未說明游標未鎖定時怎麼切回鍵鼠。Pointer Lock 需使用者互動，因此建議滑鼠移動先切換提示與輸入來源，再顯示點擊啟用轉頭的提示。
   - `mapping !== "standard"` 的驗收行為未定義；建議顯示不支援提示並忽略該手把輸入。
   - 開始／繼續按鈕與手把的具體按鍵沒有列在 VERIFY；本計畫建議 A／✕ 開始、Start／Options 繼續。
   - BRIEF 提到只用手把要能玩到結局，VERIFY 的一直要成立條目涵蓋密碼鎖與設定選單；本步只實作與驗收移動、開始和暫停所需的輸入底層，完整章節無法在 STEP 1b 驗證。

   `Gamepad.id` 格式與 `mapping` 的用途依 [MDN Gamepad.id](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/id)、[MDN standard mapping 說明](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)；按鈕／軸索引依 [W3C Gamepad 規格](https://www.w3.org/TR/gamepad/)。 vendor code `045e`／`054c` 依 [USB ID Repository](https://github.com/george-hopkins/usbip-windows/blob/master/userspace/usb.ids)。 Pointer Lock 的使用者互動條件依 [MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)；瀏覽器可能拒絕立即重新鎖定時需保留可再點擊的恢復方式。