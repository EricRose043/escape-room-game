> 2026-11-04更新：S3已在main正式接入（D021），不再等待位置選擇；正式遊戲採D028預設驚嚇開啟及一次性升級，shuoen本次已確認保留（D033）。原D019關閉預設只保留歷史。S2小數滑桿顯示缺口本輪已修復，詳LOG-20261104-SHUOEN。

> 2026-11-01 更新：owner 已接入正式色序、走廊、三線索出口及列車，235 項與三種輸入通關證據見 [最新整合交付](INTEGRATION_STATUS.md)。本檔下方保留 2026-10-29 的版本界線與歷史待辦，不據此推定當前尚未接入。

# S2／S3交付與整合邊界

2026-10-29，程式122002c、測試220/220。接續PR #2，保留Ryan工廠fc603ad及全體原始提交。

## S2已接入此分支

- settings.js提供createSettings(驚嚇預設布林)、updateSetting、serialize／deserialize、createSettingsStorage。正式入口明確傳false（使用者已確認）；音量0～100、倍率0.25～3。無效／壞檔回預設；儲存失敗保留舊檔、本次記憶體選擇仍套用且顯示提示。
- 使用獨立key `escape-room.settings.v1`，不清空localStorage或章節存檔。新遊戲保留設定。
- settings-view.js提供showSettings(container,settings,onChange,onClose)，回傳command、handleGamepad、close、setStatus。面板有標籤、狀態提示、清楚焦點與Tab圈限。
- settings-entry.js負責正式HTML入口、設定儲存與面板；與main透過factory-settings-open／change／close協作。main暫停並清輸入，接收設定後即時更新chapterOptions、音量及滑鼠倍率；每幀只將手把命令送進已開啟面板。關閉後保持暫停，避免確認按鍵洩漏到場景。
- Y／△新增按下邊緣，長按不重開。鍵盤O開設定，方向鍵／Enter／Esc操作；滑鼠range可直接調整。
- ?jumpscare=1保留原有診斷入口；正常URL預設關。進面板改設定後以玩家選擇為準。不要把診斷URL當一般預設。
- S1 createFactoryAudio.setMasterVolume接收0～1，start／toggle保留設定值，額外靜音旗標仍優先輸出0。

## S3獨立模組已完成，正式位置待決

CHASE_CORRIDOR沿用原分工X21.4～40、Z−20～−4範圍，包含兩次轉彎、3個門、燈及標示，無新增故事解答、道具或怪物。這些座標與Ryan新版列車月台重疊，**不可直接加進WORLD**。

- createCorridorDoors()回傳 `{previous:null,closedIds:[]}`。
- updateCorridorDoors(state,x,z,definition)以實際位移線段與trigger交點判斷正向跨線；首筆位置只記錄，逆向／門寬外不觸發，closedIds不重複、不自行移除，不改傳入狀態。
- trigger線與門板距離大於玩家半徑，確認完整身體通過再關，避免夾身。若搬移場地，牆、門、trigger及route須一起平移／調整，不能只搬視覺模型。
- getCorridorGeometry同步給出已關門的碰撞與遮擋；門的openWhen保留裝配線進入前置，通過後關門的效果由本模組的closedIds覆蓋，不可僅用既有isDoorOpen忽略關門狀態。
- 獨立預覽tools/corridor-test.html沿同一updatePlayer及門規則操作，可WASD／方向鍵或自動走訪。沒有怪物，不能作為T8.01／T8.03通過證據。

待使用者決定：調整配置接入保留列車結局的新版地圖，或保留獨立交付、由Eric決定正式位置。決定前不修改Ryan場地與正式路線。若接入，還需由owner協調怪物、完整回復／存讀策略、世界幾何及舊VERIFY差異，然後重做整章驗收。

## 驗證與待人工

原53條逐項結果見ACCEPTANCE_STATUS；紅綠與瀏覽器證據見LOG-08。已做220項、Windows220項及3個選定突變；實體Xbox／PS、學校舊電腦、原生Pointer Lock、真人整章與音色觀感仍待HUMAN_TEST_CHECKLIST結果。不代填，不自動把Q-004需求落差當成已解。
