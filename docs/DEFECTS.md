# 缺陷、需求問題與待驗事項

統整：shuoen88；程式作者負責修復，shuoen88 協調複測，Eric 審查合併。最新結果以本檔末尾 LOG-07 複測為準；以下各節保留初次重現背景。狀態依據實際證據更新；不能把未實作或未驗收直接記為已確認的程式 bug。

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

## 2026-10-29 LOG-07 修復複測（優先於上述歷史狀態）

| ID | 本輪狀態 | 修復／複測依據 |
|---|---|---|
| DEF-001 | 修復分支已通過，待 main 合併 | 54ae26f 加入 .gitattributes，固定腳本 LF；全新 core.autocrlf=true Windows clone，main.js CRLF=0、200/200 通過。未放寬舊測試 import 斷言；手動繞過 attributes 產生的 CRLF 不在保證範圍 |
| DEF-002 | 保留原修復，已接入此分支遊戲 | S1 引擎移至 procedural-audio.js，原生命週期斷言保留於 procedural-audio.test.js；200/200 通過 |
| DEF-003／004 | Ryan 原修復已合入此分支 | fc603ad 經 b2066d2 保留歷史；完整套件與額外列車 logic 通過；真人全章仍未驗 |
| DEF-005 | 修復及關頁複測通過，待 main 合併 | d87b510 紅燈；54ae26f v2 新增兩個進度、嚴格前置驗證、立即 flush，保留 v1；新測試含寫入失敗舊檔保護。真瀏覽器載入預製 v2，關閉測試分頁、開正式頁繼續、開始、靜音、再關閉後讀取仍為 true／true／41 |
| INT-001 | 本分支編號衝突已整理 | 劇情決定改編 D017，保留 Ryan 內容、來源及原提交；分工仍 D015，不表示 Q-004 已獲人審 |
| INT-002 | 本分支整合與回歸通過 | b2066d2 保留兩方原始測試；54ae26f adapter 保留工廠 API 與事件旋律，S1 單一 context 播放。新整合測試驗事件、心跳、腳步、暫停／靜音／dispose，正式頁可開始與靜音、error/warn 空 |

DEF-005 複測操作：在隔離 8788 origin 開 tools/save-playtest.html →「建立已解題及列車啟動的新版存檔」→ 模擬手把 A 繼續 → 檢查現有存檔 → 真正關閉整個分頁 → 開 index.html → 跳過 → 繼續 → 鍵盤開始 → 靜音 → 關閉 → 重開測試台，只按「檢查現有存檔的還原結果」。最後一步不 seed 或修改存檔。附 before-close.txt、after-close.txt 及兩張截圖於 evidence/2026-10-29/integration-fix。

仍未關閉：Q-001～004 的人類需求決策、真人完整通關、實體設備與聽感。上述「修復」均指 PR #2 的修復分支，並非 main 已上線。

## DEF-006：原生音量滑桿把32%量化為30%

- 發現：LOG-08，6a8fb1d，內建Chromium。操作：正式main載入 → Y／△開設定；預期滑桿與文字均32%，實際AX滑桿30、文字32%。原因range step=5，但沿用的預設音量32不是5的倍數。
- 修復：9ee94c6新增先紅的數值可表達性測試（1過1失敗）；2a20f67改原生range步距1，保留鍵盤／手把每次調5的操作。
- 複測：新測試轉綠；真瀏覽器重載後32／32、調整後37／37，真關頁正式頁仍37。最終220/220；狀態：本分支已修復待main合併。證據settings-range-red／green.tap、settings-gamepad-before-close.txt與settings-after-reopen.txt。

## LOG-08 更新的待驗與決策

- Q-002：shuoen88已選驚嚇預設關閉，可自行開啟；本分支依D019實作。Eric最終PR審查仍保留。
- QA-005：本輪已做3個選定規則的獨立突變，均被抓到且還原綠；其餘規則未做，不宣稱全覆蓋。
- INT-003：S3原分工座標與新版loading-bay重疊。獨立模組／預覽已完成，但未加入WORLD；正式改位置接入或由Eric安排，已詢問使用者，尚未取得答覆。屬整合決策，不是正式遊戲新增的碰撞bug。
- QA-003／004：實體設備與整章實玩仍待結果；提供HUMAN_TEST_CHECKLIST，未向其他成員擅自發訊息，也未代填測試。

## 2026-11-01 owner 整合覆測（LOG-20261101-OWNER）

- INT-003 場地重疊：owner 依使用者接手授權，在 connected-chapter.js 保留 S3 原位置、將出口廳與列車月台向東排列；六區 AABB 不重疊，正式通關完成。原獨立模組／預覽保留。
- Q-001：三線索採實際 foundClueIds 門檻與 Ryan validateExitCode，缺任一條即使猜對 2413 也不開門；已自動及正式路線驗證。
- Q-004：色序警報及三線索出口已實際接回新版工廠／列車路線；保留新版員工卡門禁。原 VERIFY 文本未改寫，不將舊 53 條全部人類標綠。詳細對照在 INTEGRATION_STATUS。
- QA-001／002／004：Chrome 以鍵鼠事件、模擬 Xbox、模擬 PS 的正式整章、被抓回復、reload 續玩、設定及結局均已驗。實體設備與真人觀感仍分開保留。

### DEF-007：控制器堵住生產線／出口門洞（已修復）

235 項整合前的實走發現：已解開生產線，但沿門中心前進在 x≈20.2 被控制器 AABB 擋住。出口控制器同樣位於出口通路。新增紅燈 fe05698，將兩控制器移到各自門側 e6a8a53；相同門洞碰撞檢查與三條完整瀏覽器路線均通過。

### DEF-008：結局確認鍵跨元件穿透／焦點不一致（已修復）

結局元件與 main 在同一幀讀到 A，收藏圖曾立即關閉、重玩確認曾被取消；鍵盤 Tab 移到收藏圖後 Enter 也可能啟動重玩。瀏覽器紅燈工具 540262a、焦點紅燈 7e5f321；修復 107609f 對跨面板命令等待放開、同步焦點與 selected。三條正式路線通關、查看收藏圖、返回後選重玩確認均通過。長按／隱藏時確認的單元回歸通過。

### DEF-009：文件判定落在字下方、門只可操作左側（2026-11-04已修復，實機重載待確認）

Eric實玩指出2413必須瞄下面牆面，追逐前門要瞄左側才可操作。程式查核確認可見紙面高2.2m，但舊互動盒上緣只有1.9m且平面位置不同。兩文件判定現由紙面資料推導；貨運門及第一隔離門整面共用原本的門邊操作。新增10項回歸、真DOM鍵盤／模擬Xbox操作及正式通關路線通過；詳見INTERACTION_FIXES.md。不把Chrome或實體手把標為已驗。

### DEF-010：主程式載入失敗時開場無法略過（2026-11-05防卡死修正，同學重測待回報）

Eric回報同學也遇到開場卡住，開啟方式未知。舊略過監聽器與換段時鐘均在依賴整套ESM的main內；主程式未執行時，開場只剩CSS動畫，沒有可回報錯誤。本次改為HTML獨立控制，顯示載入與錯誤診斷，不刪存檔；詳見STARTUP_TROUBLESHOOTING.md。8項新增先紅後綠，全套288項及真DOM初始化成功／WebGL失敗通過；沒有聲稱已確認同學的個別原因。
