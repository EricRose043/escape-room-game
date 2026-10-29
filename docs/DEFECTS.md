# 缺陷、需求問題與待驗事項

統整：shuoen88；程式作者負責修復，shuoen88 協調複測，Eric 審查合併。狀態依據實際證據更新；不能把未實作或未驗收直接記為已確認的程式 bug。

## DEF-001：Windows CRLF 使既有測試替身無法移除 import

- 類型／優先：測試相容性／中；狀態：**已重現，待修復審查**。
- 回報：2026-10-29，shuoen88 授權的 Codex；版本 `0fab5ef6758b25234c523d6a5a05e5f059ab7cee`。
- 重現：在獨立的乾淨 Windows clone 以 `core.autocrlf=true` checkout，確認 `src/game/main.js` 是 CRLF，再跑 `node --test`。
- 預期：相同程式內容不因 Windows 換行而令測試載入失敗。
- 實際：165 通過、4 失敗，`capture-input.test.js` 一項與 `save-flow.test.js` 三項在替身載入時拋出 import 語法錯誤。
- 對應：T0.01、T6.01、TG.03；證據 LOG-20261029-01。
- 原因：兩個替身的 import 移除正規式只接受 LF。原始 blob 無 CRLF，而 Windows checkout 工作檔有 515 個 CRLF。
- 修復負責：EricRose043（既有測試的修改權責）；回歸／複測統整：shuoen88。
- 本輪 workaround：僅本 clone 使用原始 LF，169/169 通過；工作檔與 HEAD blob hash 相同。沒有修改既有測試與 src，**不將 workaround 當成已修復**。
- 修復 commit／PR：待填。關閉條件：經負責人核准後補相容性測試，LF／CRLF 均可執行，完整套件綠；記錄實際複測版本。

## 需求問題（不是已確認缺陷）

| ID | 問題／來源 | 決策負責 | 狀態 |
|---|---|---|---|
| Q-001 | VERIFY STEP 9 第二條同時寫固定密碼與不能未拿齊線索就猜出；需確認是線索可唯一推導，還是另要收集狀態門檻。TESTS T9.02 暫不擅加門檻 | EricRose043 與 RyanDing1010 | 待澄清 |
| Q-002 | D014 的 jump scare 預設開或關尚待 Eric 決定；S2 接上時須明確 | EricRose043 | 沿用既有待決事項 |
| Q-003 | VERIFY STEP 1b 的未知品牌照樣能玩，現行只支援 standard mapping；非標準映射是否在驗收範圍須確認 | EricRose043 | 待澄清，不在本輪改需求 |

## 待驗與待功能（不是已重現 bug）

| ID | 項目 | 統整／實作者 | 狀態 |
|---|---|---|---|
| QA-001 | 實際被抓、黑畫面、回平台與驚嚇開關觀感 | shuoen88／Eric | LOG-03 的預製存檔＋模擬手把：預設關閉分支已驗；真人鍵鼠、開啟分支觀感待驗 |
| QA-002 | 中途關頁重開、手把開始選單及完整存讀流程 | shuoen88／三人 | LOG-03 關閉分頁重開與取消重開資料保留已驗；完整路線與實體手把選單待驗 |
| QA-003 | 實體 Xbox／PS 整章操作、學校舊電腦 FPS | shuoen88／有設備的成員 | 待設備與完整功能 |
| QA-004 | R1／R2／S1／S2／S3 與主程式整合後的整章故事 | shuoen88／各功能作者及 Eric | 待功能與串接 |
| QA-005 | 關鍵規則逐條突變，確認測試能抓到錯誤 | shuoen88／程式作者 | 待執行 |

## 登錄與關閉規則

新缺陷使用下一個未用編號（目前已到 DEF-005）：記版本、設備、可重現操作、預期／實際、案例 ID、證據、嚴重度、修復負責人。修復後附 PR／commit、先紅後綠的測試證據、相同操作的複測版本及人員；人為體驗問題仍須人測。僅修改文字或尚未複測不能改成已關閉。

## ENV-001：內建瀏覽器無法啟動 Pointer Lock（環境限制）

- 狀態：環境受限，非已確認遊戲缺陷；日期 2026-10-29，版本 3072dfa。
- 步驟：在內建 Chromium 開 `http://127.0.0.1:8788/index.html` → 重新開始並確認，或載入有效存檔後按繼續 → 點「開始（鍵盤滑鼠）」重試。
- 預期／實際：預期滑鼠鎖定後可玩；此環境顯示無法鎖定提示，仍停在開始／暫停畫面。正式頁 console error／warn 清單為空。
- 處理：不改共用主程式，也不偽造 Pointer Lock。測試台用模擬手把驗證實際 main.js；證據 LOG-20261029-03。一般 Chrome 鍵鼠測試仍需補做，若同樣失敗再登錄可重現 DEF。

## DEF-002：S1 心跳歸零仍殘留已排程雙拍（本分支已修復）

- 類型／優先：音訊生命週期／中；回報及修復：shuoen88 授權的 Codex，2026-10-29。
- 重現：建立 createAudio 並 unlock → setHeartbeat(0.6) → 立刻 setHeartbeat(0) → 檢查聲部與計時器。最初版本雖清 timer，已排程的兩個 tone 未標記成心跳，因此 voices 仍為 2。
- 預期：強度為零後 timer 與當次雙拍都停止，voices=0；實際修復前=2。
- 修復：commit `9056b86`，心跳 tone 帶明確標記，歸零只停止心跳聲部，stop／dispose 則清所有聲部；環境音 gain 也一併釋放。
- 複測：`tests/audio.test.js` 同一零強度斷言由紅變綠，完整套件 180/180；瀏覽器全部停止後訊號 0、voices=0、ambientNodes=0。證據 LOG-20261029-04。
- 狀態：**本分支修復、模組複測通過，待 Eric 審查合併**；尚未接入正式遊戲，不能宣稱 main 上已修好。

## DEF-003：列車測試 fixture 未瞄準控制台，完整套件紅燈

- 版本：Ryan 分支 aace2e6；類型／優先：測試前置條件／中；狀態：aace2e6 時已重現；8bf3e2f 已由 Ryan 修正 fixture，套件通過，待合併（本輪未修改其測試）。
- 步驟：在該分支跑 `node --test tests/factory-ending.test.js`；或執行 review-factory-branch 診斷。
- 預期／實際：測試預期 trainStarted=true；實際第一個斷言 false。fixture 站在控制台西側 0.5m、眼高 1.6m、pitch=0，控制台頂部只有 1.2m，因此中央射線未命中，target=null。
- 區分：保持相同位置但低頭 pitch=-0.8 可選中 bay.train-console 並啟動；不能據此說控制台完全不可互動。此失敗目前遮住後面的結局檢查。
- 證據 LOG-05、story-suite.tap、diagnostics.jsonl。修正自己的測試前置與行為需負責人審查，不放寬 trainStarted 斷言；完整套件需重新跑。

## DEF-004：登車後暫停旗標讓結局計時永遠停在 0

- 版本：Ryan 分支 aace2e6；類型／優先：阻擋通關／高；狀態：aace2e6 時 logic 已重現；8bf3e2f 已由 Ryan 修正，logic 與套件複測通過，真實全章與 main 合併仍待驗。
- 步驟：準備裝配線已解、員工卡已取得的 fixture；低頭對準啟動控制台互動；走到列車互動 → 每次 dt=0.1 更新 100 次。
- 預期：超過 ENDING_SECONDS=8 秒後 ui.mode=complete。
- 實際：登車將 player.paused 設 true，ui={mode:ending,elapsed:0}；更新 10 秒模擬時間後仍完全相同。updateChapter 的 paused 提前返回在 ending 分支前，阻止其計時。
- 重現命令：`node tools/review-factory-branch.mjs <Ryan-checkout>`；此診斷只操作狀態 fixture，不修改來源。
- 關閉條件：正常登車、暫停／繼續與結局畫面都能依預期完成，補能抓住此情境的測試，並真正瀏覽器走完結局。不得只在測試偷偷解除暫停來當修復。

## DEF-005：存讀未保存裝配線解題與列車啟動進度

- 版本：Ryan 分支 aace2e6；類型／優先：進度遺失／高；狀態：aace2e6 及最後鎖定 8bf3e2f 均重現，待 Ryan／Eric 修復，shuoen88 複測。
- 步驟：fixture 已有員工卡、保險絲、供電，production.sequence.restored=true 且 trainStarted=true；呼叫 serializeChapterSave → parseChapterSave → restoreChapterSave。
- 預期：關頁讀回保留已解裝配線及列車啟動狀態，符合 BRIEF 的已完成謎題保留。
- 實際：兩者都由 true 變 false。存檔仍只寫 power.main，未包含 production.sequence 或 trainStarted；parse 判定有效，卻遺失新增欄位。
- 重現及 raw JSON 見 LOG-05／diagnostics.jsonl；不是測試 origin 儲存被瀏覽器拒絕，也不是地圖丟失（地圖本輪真實讀回正常）。
- 關閉條件：負責人決定版本／相容性策略，完整驗證新增欄位與前置條件，新增往返測試及真實關頁讀回。不要自行吞掉缺失欄位或把進度丟失當預設行為。

## INT-001：Git 預覽可合併，但兩邊 D015 意義重複

- 狀態：整合文件待協調，不是 Git 文字衝突。dafd948 與 aace2e6 的 merge-tree 退出碼 0，但 D015 分別指「三人主責」與「玩具工廠新劇情」。
- 由 Eric 與原決定人協調重新編號／交叉引用，保留兩方決定來源，不擅自覆蓋誰的紀錄。尚未正式合併，不能以乾淨 merge-tree 宣稱需求已對齊。

## Q-004：新工廠 BRIEF 與原 VERIFY／分工的驗收落差

Ryan 已改 BRIEF 與 STEP 7～10 設計，但 VERIFY 仍是糖果生產線、追逐走廊與三條線索出口。新地圖、員工卡、列車、開場及收藏地圖尚無一致的人類驗收依據。由 Eric／Ryan／shuoen 協調，保留原 53 條追溯，不由本輪 AI 直接改 BRIEF／VERIFY。新分支跨到共用程式與既有測試的修改亦由 owner 審查，不能只依提交存在就認定已通過原分工限制。

## INT-002：兩套音效同名檔案與 API 衝突（目前整合阻擋）

- 最新比較 dafd948（shuoen S1）與 8bf3e2f（Ryan 工廠）。merge-tree 退出 1，`src/game/audio.js`、`tests/audio.test.js` 都是 add/add 衝突。
- S1 提供 createAudio／unlock／setHeartbeat／setMasterVolume／stop／dispose；Ryan 新版提供 createFactoryAudio／start／toggle／sync 及 audioCueFor，main 已 import createFactoryAudio。
- 不能直接拿 S1 檔案蓋上 Ryan main，也不能丟掉 S1 測試來消除衝突；那會分別造成缺失 export 或喪失已驗證功能。
- 由 Eric、Ryan、shuoen 決定單一公開介面或明確轉接／拆模組，補上整合測試、保留兩邊作者。這是協作整合待決，不是本輪自行選擇哪一套取代另一套。
- 證據 LOG-06／merge-preview.txt；未建立真正 merge commit、未改任一方共用程式。原本兩個分支各自綠燈不能當成合在一起也能執行。
