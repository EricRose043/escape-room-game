# 實測與回歸紀錄

## LOG-20261105-LAUNCHER

Eric重新解壓a97400a並雙擊CMD，遇到「server serves another extracted game folder」。Codex核對舊服務的程序／路徑後停止，從Eric新下載的副本實際啟動，再以更新後的啟動器完成原地服務升級。7項初始Python測試先紅，實作後新增啟動器拒絕陌生服務，8/8通過；既有Node288/288通過。真實程序依序測舊服務→原地更新→新版B→新版C→再次C，固定埠不變、再次啟動重用PID，未開瀏覽器；launcher-handover-check.json留存結果。CI加入Python回歸，遠端結果仍需依實際run判定；Linux跳過Windows專屬舊程序案例。詳見LAUNCHER_UPDATES.md。

## LOG-20261105-STARTUP

Eric回報同學開場無法略過，回答開啟方式「不知道」。Codex查核舊事件綁在ESM主程式，新增8項回歸先全紅；獨立HTML開場／診斷實作後，全套288/288通過。真HTML及main免GPU整合：ESM尚未執行即可略過、正常首幀解除等待；Renderer故意拋出WebGL錯誤時留下可見診斷。版本準備涵蓋inline啟動碼，71份HTTP資源一致。錯誤由VM顯式轉送window事件，不把這些自動檢查當成Chrome、同學環境或實體手把驗收。見startup-dom-check.json、test-summary.json及STARTUP_TROUBLESHOOTING.md。

統整：shuoen88。各人負責真實操作者與功能自測；Eric 處理主程式串接及審查合併。不得代填別人尚未做的測試。

## LOG-20261104-INTERACTION：整片門與文件判定

- 操作者：Eric直接指示的Codex；本機無Git歷史快照，沒有補造commit。
- 來源：Eric實玩回報門要瞄左側、2413文件要瞄下方牆面；本次為修正結果，未代填使用者後續試玩。
- `node --test --test-reporter=spec`：280/280通過。新增文件3項、門面7項；全套檢查曾發現未具ID的障礙物被別名略過，已修正為僅在明確指定門ID時略過，原遮擋回歸恢復通過。
- 真HTML/67 ESM/62原生Canvas：開場點擊略過、真main鍵盤E／模擬XboxA門面操作、文件提示與字幕通過；WebGLRenderer為免GPU替身，站位進度採明確fixtures。正式logic另完整走至END。
- Three.js文件1,350條可達視線無遮擋；場景1,200次同步無資源增長。
- 71份HTTP資源、版本importmap、no-cache及啟動器資料夾/版本核對通過；報告`browser-cache-check.json`及`startup-dom-check.json`。
- 結果：自動檢查PASS；Chrome GPU、實體Xbox／PS為未檢查，未繞過本機origin限制。細節見INTERACTION_FIXES.md。

## 填寫與判定

每筆包含日期／操作者、commit、案例、設備與瀏覽器／手把型號、操作、預期、實際、證據、結果及缺陷編號。結果使用「通過／失敗／未檢查／受環境限制／待功能／歷史轉錄」。Node 替身、假手把及程式審查不等於實機通過；測試數不代表全部 VERIFY 已驗收。

## 使用者故事與排程

| 故事 | 以玩家角度的任務 | 案例 | 誰安排／誰執行 | 目前狀態 |
|---|---|---|---|---|
| US-01 | 我第一次進遊戲，能看懂提示、拿燈並恢復電力 | T0～T4 | shuoen88 安排；三人分別實玩 | 待本輪實測，歷史部分結果見下 |
| US-02 | 我被發現後能躲藏，被抓後不用重玩前面 | T5、T6 | shuoen88 安排；Eric 提供路線 | 6b／6c 待補驗 |
| US-03 | 我關頁後能繼續，取消重開不會失去進度 | TG.03、T6 | shuoen88 安排；三人實玩 | 待完整關頁／重開測試 |
| US-04 | 我能解開顏色謎題、跑過走廊並依線索逃出 | T7～T9 | Ryan 檢查劇情線索；shuoen88 統整 | 待 STEP 7～9 |
| US-05 | 我只用 Xbox 或 PS 能玩到底，也能關掉嚇人畫面 | TG.01、T6.04、TB-S01 | 三人有設備者實測；shuoen88 彙整 | 待實體設備與完整功能 |

另排 TG.02 學校舊電腦全螢幕 FPS、TB-A01／02 試聽與突變測試；目前全部未執行。各故事回報時須寫明測的是哪一段，不能用 US 編號宣稱尚未完成的全流程通過。

## 歷史參考（非本輪親測）

來源 `supervisor/LATEST.md`，日期 2026-10-23，版本以該文件關聯提交為準：STEP 0～6 審查通過；STEP 5 曾瀏覽器實玩。6c 部分選單、壞檔不覆寫、有效存檔繼續與取消重開已驗。6b 被抓黑畫面回平台、近景觀感、遊戲中途關頁重開及手把開始選單仍待補驗；實體手把與舊電腦效能亦不能視為已驗。此摘要不替代逐案結果。

## LOG-20261029-01：Windows 基準回歸失敗

- 日期：2026-10-29；操作者：shuoen88 授權的 Codex；環境：Windows、Node v24.22.1。
- 基準版本：`0fab5ef6758b25234c523d6a5a05e5f059ab7cee`，尚未修改遊戲或測試。
- 命令：`node --test --test-reporter=tap`（package.json 的 `test` 指令為 `node --test`；此環境沒有 npm，未直接執行 `npm test`）。
- 結果：169 項中 165 通過、4 失敗。`capture-input.test.js` 一項及 `save-flow.test.js` 三項在 `new Function` 拋出 `Cannot use import statement outside a module`。
- 原因證據：本機 `src/game/main.js` 為 515 個 CRLF；HEAD blob 無 CRLF。替身用只匹配 LF 的 import 移除規則。
- 狀態：失敗；登錄 DEF-001。這是既有 Windows 測試相容性問題，沒有調整斷言來過關。

## LOG-20261029-02：原始 LF 格式回歸與文件核對

- 日期、操作者與版本同上；文件工作於 `shuoen/team-roles-and-test-plan` 分支，報告隨該分支 commit 保存。
- 僅本 clone 設定 `core.autocrlf=false`，將 main.js 工作檔還原成 HEAD blob 原始位元組；Git hash 比對一致，src 與 tests 沒有提交差異。
- 命令：`node --test --test-reporter=tap`。結果 **169 通過、0 失敗、0 跳過**。證明原始 LF 格式下現有斷言通過，不代表 DEF-001 已修復。
- 文件核對：VERIFY 的 53 條條列各有唯一 V／T 對照；對應的現有測試檔與本地文件連結存在；BRIEF、VERIFY、src、tests 與基準版本相同；`git diff --check` 無空白錯誤。以本分支提交前實際檢查結果為準。
- 本輪未檢查：真正瀏覽器實玩、Pointer Lock、WebGL 外觀、聲音、整章、突變測試。
- 受環境限制：沒有實體 Xbox／PS、學校舊電腦測試結果；npm 未安裝，改以相同 Node 測試腳本執行。
- 待功能：STEP 7～10、S1／S2／S3 的完整串接。未因此勾選完成或關閉待驗項目。

## 新增紀錄範本

複製後填寫：

- ID／日期／操作者：
- commit／PR：
- 案例／使用者故事：
- 電腦／OS／瀏覽器／手把（沒有就寫無）：
- 前置條件與操作：
- 預期結果／實際結果：
- 證據（輸出、截圖或錄影連結）：
- 結果與限制／DEF 或 Q 編號：
- 修復版本與複測者／複測結果：

## LOG-20261029-03：實際 WebGL 被抓、存讀與取消重開

- 日期／操作者：2026-10-29，shuoen88 授權的 Codex；測試約台灣時間 16:13～16:15，原始文字證據採 UTC。
- 版本：`3072dfae6079f3d16350694bdd90573f0ff81bc7`；新測試台 `tools/save-playtest.html` 載入原始 index.html 與未修改的 main.js，three.js 與 WebGL 真實執行。測試台原始碼隨本輪 commit 保存。
- 環境：Windows、ChatGPT 內建 Chromium 瀏覽器、`http://127.0.0.1:8788`。使用預製有效存檔及模擬 standard Xbox，不是本人鍵鼠走完全程，也不是實體手把驗收。
- 前置存檔：production.checkpoint；手電筒、保險絲、電力室電池已取得；保險絲已安裝、電力已恢復；電量 41%、UV、關燈。此進度是 fixture，不能宣稱本輪從開場取得。

| 測試／案例 | 真正執行的步驟 | 實際結果 | 判定及邊界 |
|---|---|---|---|
| 被抓回復 T6.01／T6.03 | 測試台按「建立測試存檔並啟動模擬手把」，再按「前進進入生產線（1.3 秒）」後停下，等怪物自行巡邏、發現與接觸 | DOM 觀察到 08:14:07.609Z 黑畫面出現，08:14:08.812Z 結束，約 1.203 秒；回復後渲染場景、電量 41%、UV 關燈，存檔點仍為 production.checkpoint | 此 fixture／模擬手把條件通過；實體鍵鼠及開啟驚嚇分支待驗 |
| 進度保留 T6.02 | 比對被抓前後實際 localStorage 存檔摘要與 UI | itemIds 三項、保險絲安裝、restored=true、checkpoint、charge=41、mode=uv 完全相同 | 預製進度的保留通過；未測本輪動態拾物後被抓 |
| 關頁繼續 TG.03 | 真正關閉兩個遊戲分頁，重新建立 index.html 分頁，點「繼續」 | 繼續可用；HUD 還原 41%、UV 關閉；存檔仍是生產線與已供電進度 | 跨分頁關閉／重開與資料還原通過；鍵鼠啟動仍受 Pointer Lock 限制，不能記為完整鍵鼠續玩 |
| 取消重開 US-03 | 重開的 index 選「重新開始」→「取消，保留進度」→「繼續」，再次關頁後讀取摘要 | 回到選單時繼續仍可用；繼續後 41%／UV；再次讀取 raw JSON 與被抓前內容一致 | 真實選單與保存舊進度通過 |

- 證據：[被抓觀察與存檔 JSON](evidence/2026-10-29/save-browser-log.txt)、[回復畫面](evidence/2026-10-29/save-recovered.jpg)、[取消重開畫面](evidence/2026-10-29/cancel-restart.jpg)、[重開後繼續畫面](evidence/2026-10-29/reopen-continued.jpg)、[最終存檔摘要](evidence/2026-10-29/after-close-cancel-log.txt)。以實際畫面／DOM 與 raw JSON 記錄，不以測試台按鈕名稱視為通過。
- 未觀察到這四項中的資料遺失或未處理程式錯誤；正式頁讀到的 console error／warn 清單為空。沒有以環境限制補造 DEF-002。
- ENV-001：正式頁點開始或繼續會顯示「無法鎖定滑鼠」，重試仍不能以鍵鼠開始。本內建瀏覽器不提供可用 Pointer Lock；只確認此環境限制，尚無一般 Chrome 的故障證據。未修改／假造 Pointer Lock；改用測試台模擬手把路徑。
- 未檢查：一般 Chrome 的真實鍵鼠流程、實體 Xbox／PS、從開場拾物到被抓的完整路線、驚嚇開啟的實際觀感、舊電腦 FPS；此處顯示的 FPS 不是學校電腦效能驗收。

## LOG-20261029-04：S1 測試先紅後綠及真實 Web Audio 訊號

- 日期／操作者：2026-10-29，shuoen88 授權的 Codex。Node v24.22.1，Windows；瀏覽器沿用前一筆環境，試聽頁 `/tools/audio-test.html`。
- 先紅 commit `f312257`：新增兩份測試檔，實作前 `node --test --test-reporter=tap` 為 169 通過、2 個新增模組因缺檔 import 失敗。不是宣稱 11 個案例都曾分別執行失敗。
- 實作 commit `9056b86`：心跳距離映射、腳步間隔、Web Audio 合成與生命週期，11 個新案例加原有 169 個，總共 **180 通過、0 失敗**。最後文件提交只另整理換行與文件，不改既有測試／主程式。
- 補充紅綠證據：零強度關心跳時，測試曾發現仍有 2 個已排程聲部；修正聲部標記與停止後同一斷言變 0，詳 DEF-002。沒有放寬斷言。
- 自動案例涵蓋：近／遠距、單調與範圍、無效輸入、停步 Infinity、速度與間隔、安全節奏上限、解鎖前不建 context、不支援／resume 拒絕、重複環境／心跳不疊加、音量範圍、stop／dispose 與不可重啟。
- 真實瀏覽器按「啟用聲音」，context 由 locked 變 running，逐項點試聽按鈕；AnalyserNode 實際量到下列峰值（預設主音量 35%，雜訊數值不保證每次相同）：

| 項目 | 訊號峰值 | 結果 |
|---|---|---|
| 腳步 | 0.008485 | 有輸出 |
| 門聲 | 0.025194 | 有輸出 |
| 警報 | 0.025865 | 有輸出 |
| 生產線環境 | 0.012950 | 有輸出 |
| 較遠心跳 | 0.018841 | 有輸出 |
| 靠近心跳 | 0.040194 | 比較遠分支強 |
| 全部停止 | 0.000000 | 聲部及環境節點歸零 |
| 音量 0 穩定後再次播警報 | 0.000000 | 靜音 |
| 連續步行再停止 | 0.008485，停止後 0 | 有輸出且停止清理 |

- 調音量到 0 後立刻觸發的第一次警報量到 0.006081；模組有 30ms 音量漸變，穩定後再測為 0。保留原始測量，不把瞬間漸變記成已驗證的立即靜音。
- 全部停止後 getStatus：context=running、volume=0.35、ambience=null、heartbeatIntensity=0、voices=0、ambientNodes=0。console error／warn 清單為空。
- 證據：[原始音訊測量紀錄](evidence/2026-10-29/audio-browser-log.txt)、[瀏覽器畫面](evidence/2026-10-29/audio-browser.jpg)、[Node 紅綠結果摘要](evidence/2026-10-29/audio-node-summary.txt)。
- 未檢查：真人耳機／喇叭音色與舒適度、各瀏覽器差異、遊戲實際腳步／警報／門事件同步、暫停與背景在正式主程式的整合。獨立頁量到訊號不等於已聽到或喜歡音色。
- 整合交付：見 `docs/AUDIO_INTEGRATION.md`；未修改共用 main／logic index／章節／怪物，也未將 STEP 10 整體勾完成。npm 本機仍未安裝，執行的是 package.json 對應的 Node 測試指令。

## LOG-20261029-05：第一快照 aace2e6 的獨立回歸與整合預覽（歷史）

- 本筆是第一快照，測試中又收到新提交；最後鎖定結果見 LOG-06，不能將本筆失敗套用到最新版本。
- 日期／操作者：2026-10-29，shuoen88 授權的 Codex；Windows、Node v24.22.1。GitHub 查核 main=0fab5ef、S1=dafd948，PR #1／#2 仍開啟，Ryan story 分支=aace2e664a19da2559185ea8592a30f6f5d7e7e3（領先 main 34 commits）。
- Ryan 原始內容在獨立 detached worktree 執行，未把它合併到 shuoen 分支，沒有修改其程式與既有測試。此 worktree 採原始 LF，沒有以改斷言掩蓋失敗。
- 命令一：在 Ryan checkout 執行 `node --test --test-reporter=tap` → **174 項，173 通過、1 失敗**。失敗是 factory-ending.test.js 的「啟動列車後登車完成逃脫，沒啟動前不能通關」，第一個 trainStarted 斷言就失敗，還沒驗到完整 ending。
- 命令二：在原 S1 checkout 執行相同命令 → **180/180 通過**。這個結果不能替代 Ryan 新程式的回歸。
- 命令三：`git merge-tree --write-tree dafd948 origin/story/toy-factory-draft` 得到預覽 tree 23862146975a857ae0de26361f03a95d22fd0177，退出碼 0（無文字衝突）。只將 tree archive 解到獨立暫存目錄跑 Node 套件，**185 項，184 通過、1 失敗**，同一列車測試。沒有建立／推送 merge commit，也沒有改 main 或兩人的遊戲程式。
- 額外診斷命令：`node tools/review-factory-branch.mjs <Ryan-checkout目錄> --include-legacy-fixture` → 4 項 probe 中 1 通過、3 失敗，退出碼 1 是預期的問題證據；不是完整套件又新增 4 個正式測試。已重現水平視線選不到低控制台、低頭可啟動、序列化遺失新進度、登車後 elapsed 永遠 0。

### 真實瀏覽器操作（不使用 seed 或模擬手把）

- 環境：內建 Chromium，`http://127.0.0.1:8789/index.html`，單獨 origin，未碰舊 8788 試聽頁或其存檔。
- 開啟新分支 → 按跳過劇情 → 重新開始／確認 → 初次仍顯示 Pointer Lock 限制 → 點開始按鈕：新的備援能進遊戲，沒有偽造 Pointer Lock。
- 原地按方向鍵下七次，真實畫面出現「E 撿起 工廠平面圖」→ 按 E → 出現地圖按鈕 → 按 M → 顯示員工手繪平面圖及四區文字；收起地圖後回到暫停畫面，行為清楚。
- 真正關閉分頁再新開同網址 → 跳過開場 → 繼續 → 地圖按鈕仍出現 → 點按可查看原地圖。此處是本輪真正拾到的地圖，不是預製存檔。
- console error／warn 清單為空。未測完整 60 秒、卡片與修電全路線、列車全章、實體手把、音色舒適度或舊電腦 FPS。結局與列車保存的問題是實際 logic fixture 重現，沒有宣稱瀏覽器已通關。

### 證據與後續

- [Ryan 完整 TAP](evidence/2026-10-29/story-retest/story-suite.tap)、[S1 完整 TAP](evidence/2026-10-29/story-retest/audio-suite.tap)、[整合預覽 TAP](evidence/2026-10-29/story-retest/combined-preview-suite.tap)、[診斷 JSON](evidence/2026-10-29/story-retest/diagnostics.jsonl)。
- [首次開圖畫面](evidence/2026-10-29/story-retest/map-open.jpg)、[首次開圖 DOM](evidence/2026-10-29/story-retest/map-open-dom.txt)、[關頁讀回畫面](evidence/2026-10-29/story-retest/map-after-reopen.jpg)、[讀回 DOM](evidence/2026-10-29/story-retest/reopen-dom.txt)。
- 發現記為 DEF-003（測試 fixture）、DEF-004（結局卡住）、DEF-005（新進度丟失）；文件編號與驗收落差另列 INT-001／Q-004。未順手修改共用主程式或他人測試，等待負責人修正後複測。

## LOG-20261029-06：最後鎖定 8bf3e2f 複測與新增音效衝突

- 日期／操作者、環境同 LOG-05；本輪測試期間 Ryan 又有 11 筆提交，從 aace2e6 到 **8bf3e2ff8fa27c0c24b64cbf4475efded268129d**。相對 main 共 45 筆，作者均為 RyanDing1010。本輪鎖定此 SHA，不把後續提交自動算成已測。
- 在乾淨的 detached checkout 切到此精確 SHA，`node --test --test-reporter=tap` → **176 項全通過**。原列車 fixture 已改為低頭，結局不再自動設 paused，8 秒邊界亦有容差；DEF-003／004 在此版的套件／logic 複測通過，不代表 main 或真人全章已驗。
- 額外 `node tools/review-factory-branch.mjs <Ryan-checkout>` → **3 項檢查，2 通過、1 失敗**：低頭啟動列車成功；登車更新 10 秒達 complete；序列化往返仍丟 production.sequence 與 trainStarted（DEF-005）。舊水平 fixture 現在列為不計分控制組，完整舊快照可用 --include-legacy-fixture 重播，未放寬任何遊戲斷言或修改他人測試。
- 最新 `git merge-tree --write-tree dafd948 8bf3e2f` → **退出 1**：兩邊各新增 `src/game/audio.js` 與 `tests/audio.test.js`，add/add 衝突。你這邊公開 createAudio，Ryan 這邊公開 createFactoryAudio／audioCueFor 且 main 已使用它，不能用任一方檔案直接蓋過另一方。沒有解衝突或執行帶衝突標記的套件，也沒有合併遠端分支（INT-002）。LOG-05 的無衝突預覽不再適用。

### 8bf3e2f 真實瀏覽器重新載入

1. 服務 root 已切到精確 8bf3e2f，對原 8789 分頁執行 reload，確認新版「音效：開啟」按鈕存在。
2. 跳過劇情 → 繼續 → 原先親自拾取的地圖仍可用；點開始，M 開地圖，顯示暫停；按收起後暫停畫面消失、返回探索。沒有使用模擬手把或 seed。
3. 音效按鈕由開啟切成靜音；此處只驗證真實 UI 切換及無未處理錯誤，未量測 Ryan 這套音效波形或代替真人聽感。
4. 再開圖保存畫面；console error／warn 清單為空。原生 Pointer Lock 仍受環境限制，但現在有方向鍵備援；未把列車的 logic 結果記成真瀏覽器全章通關。

- 證據：[最新完整 TAP](evidence/2026-10-29/story-retest-8bf/story-suite.tap)、[最新診斷](evidence/2026-10-29/story-retest-8bf/diagnostics.jsonl)、[衝突預覽](evidence/2026-10-29/story-retest-8bf/merge-preview.txt)、[新版地圖／靜音畫面](evidence/2026-10-29/story-retest-8bf/map-muted.jpg)、[DOM](evidence/2026-10-29/story-retest-8bf/browser-dom.txt)、[瀏覽器錯誤清單](evidence/2026-10-29/story-retest-8bf/browser-errors.json)。TAP 為完整文字，僅移除行尾空白以供 diff 檢查，未改數值、案例或錯誤內容。
- 未檢查：後續新 SHA、一般 Chrome 滑鼠鎖定、真人完整列車路線、實體手把、音色／音量舒適度、舊電腦 FPS。最新已知阻擋是 DEF-005 與 INT-002；不再將已修正的 DEF-003／004 列為該 SHA 的現存邏輯故障。

## LOG-20261029-07：修復存檔與整合音效

- 授權與操作者：shuoen88「幫我解決問題並記得把修改後的內容上傳」，Codex 執行；2026-10-29，Windows、Node v24.22.1、內建 Chromium／WebGL。
- 版本：Ryan 最後鎖定 fc603adece9baf554cdbd87d291b9d21ba7e3954（相對 main 67 筆 Ryan 原提交）。b2066d2 合併 Ryan 與原 S1 分支歷史，保留雙方測試。合併基線192/192。d87b510 新增回歸先紅：200項，193通過／7失敗。54ae26f 修復後200/200。原 BRIEF 為 Ryan 匯入版，本輪未改寫 BRIEF／VERIFY。
- 命令：`node --test --test-reporter=tap`；package.json 的 npm test 即 node --test，但本環境無 npm，不能記為有直接跑 npm test。
- DEF-005：進階採v2保存 production.sequence 與 trainStarted，嚴格拒絕缺欄／矛盾前置。無進階進度仍輸出相容v1；v1可讀但不補造舊版未寫入的資料。解題或啟動列車立即flush，失敗保留舊檔可重試；5個新回歸案例通過。
- INT-002：Ryan的audioCueFor與工廠API保留；S1引擎移名procedural-audio.js，原S1測試同時移名而保留斷言。Ryan音效測試僅補WebAudio替身的方法，未刪除／放寬斷言。3個新adapter案例驗單引擎、事件、距離心跳、位移腳步、暫停／靜音／dispose。main增加失焦stop及pagehide清理。

### Windows換行複測

在全新目錄執行 `git -c core.autocrlf=true clone --no-hardlinks --branch shuoen/save-playtest-and-audio <本機repo> <全新目錄>`，clone來源HEAD為54ae26f；再設定該clone的core.autocrlf=true。因.gitattributes腳本eol=lf，src/game/main.js的CRLF數為0；`node --test --test-reporter=tap` 200/200通過。修復正常Windows checkout，不宣稱繞過attributes的手動CRLF也支援。

### 真瀏覽器關頁重開

1. 啟動服務於隔離 `http://127.0.0.1:8788`，根目錄為本修復分支。測試台按「建立已解題及列車啟動的新版存檔」，使用標準Xbox模擬輸入A讓實際未改寫的main繼續。fixture包含裝配線已解、列車已啟動、地圖／員工卡／供電、UV關閉及電量41。
2. 按「檢查現有存檔的還原結果」：v2／production=true／trainStarted=true／charge=41。保存before-close.txt，真正關閉整個分頁。
3. 另開正式index.html → 跳過開場 → 繼續；HUD41及UV關閉，進度已儲存、地圖按鈕存在。按鍵盤開始，暫停層消失，Pointer Lock不可用時顯示方向鍵／拖曳備援提示。按音效，顯示靜音。正式頁error/warn清單為空，保存reopened-game.jpg與game-console.json，再真正關閉分頁。
4. 重新開測試台，只按「檢查現有存檔的還原結果」（不seed）：v2／production=true／trainStarted=true／charge=41。保存after-close.txt與restored-progress.jpg。

這是實際main／localStorage／真分頁生命週期的fixture測試，非真人逐關解題或實體手把通關。未在read-only瀏覽器evaluate中修改隱藏遊戲狀態。

### 額外診斷與未驗項

`node tools/review-factory-branch.mjs <本修復repo>`：3/3通過，控制台低頭命中、正常登車後logic更新達complete、進階存檔往返保留。這不代表真瀏覽器列車全章已走完。

- 已檢查：完整200項、乾淨Windows200項、額外3項、真關頁讀回、正式頁開始／靜音UI、無error/warn。
- 未檢查：鎖定fc603ad後的新提交、真人從開場走到結局、實體Xbox／PS、聲音舒適度、學校舊電腦FPS、逐條突變。
- 環境受限：原生Pointer Lock；已驗備援開始，不宣稱原生鎖定通過。Q-004新BRIEF／原VERIFY驗收差異仍待人類對齊。

證據目錄：[integration-fix](evidence/2026-10-29/integration-fix)。[基線](evidence/2026-10-29/integration-fix/merge-baseline.tap)、[先紅](evidence/2026-10-29/integration-fix/regression-red.tap)、[修復後](evidence/2026-10-29/integration-fix/regression-green.tap)、[Windows](evidence/2026-10-29/integration-fix/windows-checkout.tap)、[額外診斷](evidence/2026-10-29/integration-fix/diagnostics.jsonl)、[關頁前](evidence/2026-10-29/integration-fix/before-close.txt)、[關頁後](evidence/2026-10-29/integration-fix/after-close.txt)、[正式頁](evidence/2026-10-29/integration-fix/reopened-game.jpg)、[讀回結果](evidence/2026-10-29/integration-fix/restored-progress.jpg)、[console](evidence/2026-10-29/integration-fix/game-console.json)。TAP僅正規化換行／行尾空白，未更改案例、數值或失敗內容。

## LOG-20261029-08：完成S2、S3獨立交付與S0補驗

- 日期／操作者：2026-10-29，shuoen88授權的Codex。使用者要求完成全部分工、需要決定先詢問、完成上傳、以最新版本為基礎。
- 基線：重新以git ls-remote --heads核對所有遠端；main=0fab5ef、Ryan=fc603ad、分工=3072dfa、上輪修復=8dfc46f。explicit fetch main／story／分工refs後確認本分支含Ryan與Eric原歷史。不是將僅fetch當前分支誤當已同步所有分支。開始完整200/200通過。
- 決策：詢問S2預設、S3衝突方向與實體設備。使用者已明確回覆「預設關閉，玩家可自行開啟」；後兩項未取得答覆，不假定同意。
- 最終程式版：122002caebfe9d026e0efc842ea9dc6685b6c1ab。S2已接正式main；S3依原分工僅交獨立資料／關門規則／預覽，未修改Ryan列車場地或加入WORLD。其餘本輪文件不改程式。保留原53條VERIFY與Ryan BRIEF，不重寫需求。

### TDD與回歸

| 階段 | 先紅與實作 | 實際結果 |
|---|---|---|
| 設定規則 | d9aa9f3 → fc38443 | 首先模組不存在的載入紅；實作後5/5 |
| 設定面板 | 08a6933 → e7d2d22 | 首先缺模組載入紅；實作後含規則6/6 |
| 正式接入 | 0980b7f → 6a8fb1d | 3個行為測試0/3 → 全套209/209 |
| 瀏覽器音量量化bug | 9ee94c6 → 2a20f67 | 面板1過1失敗 → 2/2；DEF-006 |
| 焦點圈限 | 2e90c70 → 1ffd574 | 面板2過1失敗 → 全套216/216（含走廊純規則） |
| 走廊規則 | 87dc383 → d538574 | 缺模組載入紅 → 5/5 |
| 走廊場地 | 062e7c7 → 122002c | 缺區域模組載入紅 → 區域3＋規則5全部通過 |

另補正式mousemove倍率與面板開啟時凍結驗證，未改任何舊測試斷言。`node --test --test-reporter=tap` 最終 **220/220**；環境無npm，未聲稱直接跑npm test。乾淨clone 122002c、core.autocrlf=true、main.js CRLF=0，同指令 **220/220**；windows-summary.json及windows-suite.tap為證。

### 真瀏覽器設定與關頁

1. 隔離8788測試台載入實際index及main，預製v2存檔＋標準Xbox模擬輸入A繼續。Y開設定，預設驚嚇關、音量32與倍率1。
2. 模擬十字鍵右 → 音量37；下、A → 驚嚇開；下、右 → 倍率1.25。面板及localStorage皆為37／true／1.25。B關閉後面板hidden、遊戲仍paused，避免確認動作洩漏到場景。
3. 真正關閉整個分頁。另開正式index → 跳過 → 設定，仍37／true／1.25，這次不重設設定或使用模擬手把。
4. 真鍵盤方向鍵右、下、Enter、下、左，改為42／false／1.0；Esc返回原選單。error/warn空。保存DOM與畫面；同一主程式mouse事件倍率由Node main替身驗證，原生Pointer Lock仍環境受限。
5. 最後重載122002c正式頁，Shift+Tab由音量回到返回按鈕，Tab再回音量，焦點留在面板內；settings-final-focus.txt及settings-final.jpg為證。
6. 首次發現滑桿原生步距5把32變30；先紅再改step=1後重載，已驗32、37、42均與文字一致。不是只改測試假物件。

### S3真瀏覽器獨立預覽

開tools/corridor-test.html →「自動走訪三道門」→沿實際updatePlayer碰撞與updateCorridorDoors規則走完兩次轉彎，顯示3/3門已關。error/warn空，畫面與DOM已存。此頁未接正式WORLD、不含怪物、不寫正式存檔；不能當整章追逐通關。

### 選定規則突變（不是全規則覆蓋）

每次從已commit乾淨版另clone，只改一條，測試抓到後finally還原，再跑綠：

- 8dfc46f：心跳距離公式反向，audio-mix測試退出1；還原退出0。
- 6a8fb1d：序列化列車啟動強制false，save-progress-v2退出1；還原退出0。
- 122002c：走廊跨線方向反轉，corridor-doors／chase-corridor退出1；還原退出0。

詳細before／after及退出碼見mutation-summary.json；故意改壞內容不在提交或正式工作檔。第一次執行突變工具遇到Windows文字編碼失敗，已改明確UTF-8重跑；不將工具失敗算測試抓到突變。

### 已驗、未驗及環境限制

已驗：220項、Windows220項、3項選定突變、S2真瀏覽器鍵盤與模擬手把、設定真關頁保留、S3獨立3門、文件53條追溯。未驗：實體Xbox／PS、學校舊電腦、真人完整章節、S3正式整合、完整聽感與未抽樣突變。Pointer Lock受內建環境限制，備援與main輸入已分開驗。原要求／新版玩法差異仍見Q-004。

證據：[完整套件](evidence/2026-10-29/assignment-completion/full-suite.tap)、[Windows](evidence/2026-10-29/assignment-completion/windows-suite.tap)、[突變摘要](evidence/2026-10-29/assignment-completion/mutation-summary.json)、[模擬手把前](evidence/2026-10-29/assignment-completion/settings-gamepad-before-close.txt)、[返回](evidence/2026-10-29/assignment-completion/settings-gamepad-return.txt)、[真關頁讀回](evidence/2026-10-29/assignment-completion/settings-after-reopen.txt)、[鍵盤設定畫面](evidence/2026-10-29/assignment-completion/settings-keyboard.jpg)、[S3完成畫面](evidence/2026-10-29/assignment-completion/corridor-preview.jpg)。同目錄保留各輪紅／綠TAP及console清單，僅正規化換行與行尾空白。

## LOG-20261101-OWNER：新版分工正式接入

- 操作者：EricRose043 授權的 Codex；日期 2026-11-01（Asia/Taipei）。
- 原始來源：shuoen `42d8357`、Ryan `05b290b`，merge `65ed422` 保留原始 SHA 與作者。owner 核心整合 `270de89`，門洞修復 `e6a8a53`，結局跨面板按鍵／焦點修復 `107609f`，CI `0ae1d67`。
- Node：`npm test` **235/235 PASS，0 skipped**；增加的 owner 整合與結局操作回歸均先紅後綠。僅因加入正式走廊／出口而更新四區、三存檔點、獨立未註冊等舊範圍斷言；保留碰撞、遮擋、存檔保護、失焦與輸入斷言。
- 正式瀏覽器：已安裝的 Google Chrome、真 WebGL，分別以鍵鼠事件、模擬 Xbox、模擬 DualSense 驅動實際 main；不是直接灌入完成狀態。每條從正式辦公室走到列車結局，包含故意錯序警報、實際被抓回復、全部謎題及三張線索，並在出口做真正頁面 reload 後繼續。
- 操作整合：三條路線均檢查遊戲中設定、普通地圖、結局收藏地圖與重玩確認；原生 Pointer Lock 在 Chrome 鍵鼠路線確認可用。三次 console **0 errors**。
- 新增可重現整合缺陷：控制器放在門洞會擋住通路；結局元件先讀 A、main 再讀相同 A，曾立即關閉收藏圖或取消重玩確認；鍵盤 Tab 焦點曾與 selected 不同步。皆已修復並以相同路線複測。
- 證據：[owner-integration](evidence/2026-11-01/owner-integration/)，含 node-tests.txt、三份 browser-verification.json 及開始／設定／生產線／走廊／結局截圖。完整來源與邊界見 [INTEGRATION_STATUS](INTEGRATION_STATUS.md)。
- 界線：動畫時鐘可控、手把為模擬 API，不能把截圖 FPS 或模擬通關當成學校硬體或實體 Xbox／PS 結果。真人聽感、實體設備及其他瀏覽器未代填；既有歷史 Windows 220 項結果不等於當前整合版的 Windows 結果，當前以 PR #4 CI 為準。

## GitHub Actions 啟動限制（2026-11-01）

[run 41320466639](https://github.com/EricRose043/escape-room-game/actions/runs/41320466639) 的 GitHub Summary／Annotations 明確顯示帳戶近期付款失敗或支出上限需要調整，沒有啟動任何 job。GitHub API 未提供該註解，已用原生 Chrome 讀取確認；詳 [原始狀態](evidence/2026-11-01/owner-integration/github-ci-startup.json)。

工作流程 YAML 已本機解析；本機235項及三條Chrome路線通過。但 Linux／Windows × Node22／24 的遠端CI **NOT_RUN，不是 PASS**，也不以歷史220項Windows結果代替。沒有更改付款、預算、Actions權限或分支保護；只有帳戶持有人可處理帳務限制，解除後再重跑CI。

## LOG-20261104-SHUOEN：最新版分工覆核與小數設定修復

查核開始2026-11-04、收尾2026-11-05；操作者shuoen88授權的Codex。以git ls-remote --heads及明確fetch所有分支核對，鎖定main **6ff1d44cf5114197d99aeef54eae101a5b2bbe53**，從該版開shuoen/nov04-integration-audit，沒有以舊S1分支覆蓋main。PR #1／#4／#5已合併，#2／#3已關閉但原始來源SHA均在main。

### 先確認分工狀態

S1／S2／S3已由owner接入。S3位置已由D021解決，色序、警報、線索出口及列車均已實作，本輪主要工作為重新驗收、修復S2缺口及統整狀態。D028驚嚇預設／升級與先前shuoen選擇不同，先詢問，使用者明確回覆「保留Eric最新行為，記錄與我原選擇的差異」，記D033；未改其策略。

### 測試與修復

1. 基線`node --test --test-reporter=tap`：280/280、無失敗／略過。
2. 檢查S2接受合法小數，但原生range步距會量化值。新增integration-settings-precision.test.js（Node DOM步距替身）驗37.4音量／1.1倍率，以及手把調成1.35後的面板一致性；b600b38先紅2失敗。
3. 7bd0c55修正：倍率及既存小數音量採step=any；整數音量保留step=1，鍵盤／手把增量沿用純規則。原測試斷言未改。完整282/282。
4. 全新Windows clone同一修復SHA，core.autocrlf=true，main.js CRLF=0，同指令282/282。Node v24.22.1，本環境直接用Node runner，未聲稱直接跑npm test。
5. ancestor核對3072dfa／42d8357／05b290b／80fbb65／c571347對main皆成功；完整SHA在verification.json。Git作者main當時Ryan95、Eric81、shuoen25，不用提交數評量工作量。
6. GitHub最新main run41859330532為startup_failure，API jobs total_count=0。遠端矩陣NOT_RUN；未拿本機通過替代，未更改帳戶付款或Actions設定；最新失敗根因本輪未取得。

### 證據與限制

[基線TAP](evidence/2026-11-04/shuoen-audit/baseline.tap)、[先紅](evidence/2026-11-04/shuoen-audit/settings-red.tap)、[完整套件](evidence/2026-11-04/shuoen-audit/full-suite.tap)、[Windows](evidence/2026-11-04/shuoen-audit/windows-suite.tap)、[版本與作者追溯](evidence/2026-11-04/shuoen-audit/verification.json)、[CI狀態](evidence/2026-11-04/shuoen-audit/ci-runs.json)、[0 jobs](evidence/2026-11-04/shuoen-audit/ci-jobs.json)。TAP僅整理行尾空白及換行。

本輪沒有新瀏覽器／GPU畫面驗證；可用瀏覽器技能檔缺失，沒有使用舊工具或未讀API冒充測試。Node DOM替身與舊11/01通關證據分開。尚缺實體Xbox／PS、學校舊電腦FPS、真人首次解題與音色結果；已詢問設備狀況，未知結果不代填。原53條結果表已按目前功能更新，VERIFY員工卡門禁文字差異仍需人審，本輪不更改BRIEF／VERIFY。


## 2026-11-05 使用者設備回覆

shuoen已確認有Xbox／Xbox配置手把；尚未提供實測結果，不能勾為通過。使用者明確要求舊電腦先跳過，因此學校舊電腦30FPS標為「依使用者要求暫緩／未驗」，不再作本輪交付阻擋；PS實體仍未提供設備結果。

Xbox下一步（正式index.html，先用目前main；PR #6經Eric合併後重測設定）：

1. 連接手把、按任一鍵，核對顯示Xbox；左搖桿移動、右搖桿轉頭，放手不得漂移。
2. Y開設定，十字鍵上下選、左右調，A切換驚嚇、B返回；保持暫停，Start再繼續。
3. RB開關燈、LB換UV、A拾物與操作密碼鎖，View開關地圖；進行中拔除使用中的手把應暫停。
4. 設定音量及靈敏度後關頁重開，核對數字與選擇保留；沒有經過一次升級的舊設定依D028先開啟驚嚇，之後手動關閉需能保存。
5. 只用手把走完色序、3142、走廊、2413、三卡2123與列車結局；記卡關步驟，查看結局地圖與重玩確認是否可操作。

回報請填：測試commit或PR版本、手把型號、瀏覽器、通過／失敗步驟、預期／實際。沒有完成的項目可直接填未做；不需一次完成所有項目。

## LOG-20261105-DEMO：公開站與本機試玩包

依使用者要求同台Xbox／鍵鼠試玩及報告公開網址，保留最新main基線與本分支修復；沒有再改遊戲規則。prepare_escape_room_assets更新index共同版本；完整282/282。本機8778已啟動，72個檔案逐一HTTP200且位元一致；ZIP已通過CRC與解壓後臨時8780服務確認（測完只停止本輪啟動的臨時程序）。公開Sites source05d2a492、version1、deployment succeeded與public存取原生回傳確認；ID及網址見demo-site.json。公開HTTP探測遇Cloudflare403/1010，未繞過，也未代填瀏覽器通關。備份包SHA256及檔案位置見evidence/2026-11-05/demo-release/package.json；完整套件與本機HTTP清單在同目錄。先前Chrome政策停止後，本輪未重試瀏覽器自動操作。

## LOG-20261105-SCARE：依試玩回饋加強被抓音效

使用者要求被抓驚嚇聲音更大、更恐怖；待其確認全部順暢後，才交付最終公開站／備份包／報告講稿。因此本輪只更新本機與GitHub來源，不保存新Sites版本、不重發佈、不重打正式ZIP。既有公開版保留舊快照。

開始核對遠端main已更新a97400a（開場獨立載入診斷）。c5d3e0e以merge納入，保留雙方歷史；採新版HTML獨立啟動，重新產生共同版本。重複編號保留owner D032／DEF-010，shuoen前輪決定改編D033、設定精度缺陷DEF-011，僅消除編號衝突。

音效新回歸d4f12de先紅（2項中1失敗）；實作後完整292/292。被抓六聲部的起始峰值由原最大0.07提高至0.20（程式增益，不聲稱主觀音量倍數），加入下滑頻率、失諧粗糙雙音、短低通噪聲與約1.5秒低頻尾音；不更動主音量設定、其他事件旋律或16聲部限制。停止／靜音／dispose仍由同一引擎管理，回歸檢查保留門聲增益與清理能力。

tools/audio-test.html新增「被抓驚嚇音效（新版）」直接呼叫遊戲同一playCue，便於使用者試聽。index、音效模組與試聽頁皆本機HTTP200且位元相同；程序記錄在scare-audio/local-http.json。這是Node WebAudio替身與HTTP驗證，尚未真人試聽或實體手把整章覆驗；恐怖感等待使用者回覆，不代填通過。

## LOG-20261105-IMMERSION：本機再次試玩候選

shuoen88要求整體／腳步更大聲、靈敏度降低及改善轉頭卡頓、細化近景、加強工廠寫實感與難度遞增；對難度選項明確回覆「我覺得一跟二都很好」，因此採前段教學、中後段推理及有上限的錯誤壓力。發布順序改依S-D034：先本機試玩，確認後才上傳GitHub、更新公開站／正式ZIP及交付講稿；本輪沒有push、PR更新、Sites版本保存／部署或正式ZIP修改。

### 基線與變更

開始已納入main a97400a，工作期間發現main更新為fffe647ae34eb7bb7d34cd417aa31b3f2feb77a8，透過da6f4e6合併啟動器交接修復，未覆蓋或重寫三人提交。遊戲程式完成點e31295aabac83eaa7a536e47a1f9f89cb8b6f7d7；入口雜湊映射再用prepare_escape_room_assets.py生成。BRIEF／VERIFY未改。

1. 輸出增益1.65及原生壓縮限制器保留主音量／靜音；加強腳步與鞋跟，區域增加循環通風／電流底噪，停止可清理。沿用前輪驚嚇低吼與衝擊。
2. 滑鼠總轉角降至同倍率原先55%，指數平滑約12ms；暫停清餘量、手把轉速保留。移除一次重複介面更新，依每秒幀率量測逐步調整3D解析度，穩定十秒才恢復。
3. 八層近景提高為1536px，連續眼球與下顎細微姿態；抓捕期間邏輯／UI繼續，省略遮住的工廠WebGL繪圖。物件不逐幀重建。
4. 實體材質的粗糙度、金屬反應與細微凹凸，單批接地陰影與霧／曝光調整，不增即時陰影光源或改碰撞資料。
5. 四色線索改為唯一排序條件，後段目標少透露直接公式。錯碼警報／復位最高4秒，錯誤壓力最高3級、走廊速度最高2.28m/s仍低於玩家2.5；不遺失物品、已讀線索或已解謎題，壓力不存檔。故事、既有正確答案與存檔版本保留。

### 先紅再綠與執行結果

| 範圍 | 紅燈提交 | 綠燈實作 | 證據 |
|---|---|---|---|
| 滑鼠／遮住世界 | 16036b5 | 38865ce | mouse-red.tap |
| 音效與生命週期 | c1b71ff | 63a222a | audio-red.tap |
| 近景細節 | 18e3232 | fc8c361 | capture-red.tap |
| 材質／接地陰影 | 1dac755 | 3aa032f | material-red.tap |
| 漸進難度 | 5bc99ee | 7e6b15a | progression-red.tap |
| 自動解析度 | eef4a49 | e31295a | frame-budget-red.tap |

難度測試新寫時有一處將字串傳入assert.match，改成更精確的assert.equal文字斷言，沒有改既有測試或降低期望；其餘紅燈為新增行為尚不存在。main整合測試另驗正式讀取滑鼠、暫停及被抓時鐘／繪圖路徑，不只測獨立函式。

- Node v24.22.1：`node --test --test-reporter=tap` **305/305**，0失敗／略過。WebAudio／DOM為替身；材質使用真正隨附Three.js模組建立與查值，並未建立真GPU context。
- 全新Windows clone、core.autocrlf=true：**305/305**，main.js CRLF=0；未用本機結果代替GitHub CI，這輪沒有推送觸發遠端CI。
- Python啟動器：**8/8**。
- 使用既有stealth-route路線，代理updateChapter強制progressive=true並以pressure.level=3開始：**1/1到END**。是最高壓力自動邏輯路線，非真人實玩。
- 本機8778：**77個**執行資源／預覽HTTP200且與磁碟內容相同，預覽內嵌模組Node語法檢查通過。

原始輸出：[完整套件](evidence/2026-11-05/immersion-candidate/full-suite.tap)、[Windows](evidence/2026-11-05/immersion-candidate/windows-suite.tap)、[啟動器](evidence/2026-11-05/immersion-candidate/launcher-tests.txt)、[最高壓力路線](evidence/2026-11-05/immersion-candidate/hardest-progressive-route.tap)、[版本摘要](evidence/2026-11-05/immersion-candidate/verification.json)。同目錄六份red.tap對應上表；僅整理換行及行尾空白。

### 未檢查與環境限制

目前沒有新真瀏覽器GPU／shader、實機FPS、實體Xbox／PS或真人音色／完整首次解題的結果。先前瀏覽器自動操作因無法確定目前網址被安全機制停止，未另換工具繞過。新程式不代表實機已達固定60／120fps，也不代填「寫實／更恐怖」通過。舊電腦效能依使用者要求暫緩。實玩操作在[本機候選說明](IMMERSION_CANDIDATE.md)，用本機8778及Ctrl+F5更新；不要拿舊公開站／備份包評估本批修改。

歷史編號澄清：本紀錄較早段落提及的shuoen決定D033／設定精度DEF-011，現在分別為S-D033／S-DEF-011；owner D033與DEF-011留給啟動器修復。

## LOG-20261105-REASONING：傳統驚嚇音色與整章分散證據

使用者再次實玩回報「驚嚇的聲音不像傳統的那種」及「只要一照紫外線就能破關」，要求上網找恐怖遊戲參考；詢問範圍後，明確選擇整章加深推理。決定S-D035。延續發布暫緩，不推送GitHub、不改PR、不保存Sites版本／部署、不重打正式ZIP。

### 來源查找與版本

查閱EA／Motive的Dead Space Intensity Director開發文章及Xbox Wire的Alien: Isolation主設計師訪談，採緊張／喘息、環境層次與集中爆發的設計思路。只讀設計說明，沒有下載／擷取其素材或聲稱實際聽過遊戲；網址與本專案推論分列在HORROR_AUDIO_AND_REASONING.md。

開始與收尾的git ls-remote都確認main仍為fffe647ae34eb7bb7d34cd417aa31b3f2feb77a8，已在本分支祖先；遠端本分支仍停在3d14735f，符合未上傳。程式完成96ab393，入口資源提交038b9ad；本機build **60ec1eb14a9a8e4b**。main與五個過往組員來源SHA的ancestor核對皆通過，BRIEF／VERIFY未改。

### 實作與先紅後綠

| 項目 | 紅燈提交／證據 | 綠燈提交／結果 |
|---|---|---|
| 原創非旋律驚嚇紋理與預建播放 | 20d8260、audio-red.tap：2失敗 | 9d1ed9c；新2項轉綠，當時完整307/307 |
| 五階段分散證據、畫布與地圖防直接答案 | b0ac7e2、reasoning-red.tap：缺新模組及正式main未開啟 | 33e3474；當時完整313/313 |
| 加高紙面與完整互動邊緣 | 2a218fe、paper-target-red.tap：紙條高度不足 | 96ab393；完整314/314 |

聲音以程序氣流／共振／非諧和擦響及短反射建立1.65秒立體聲紋理，首次unlock預建並重用，配兩層低頻撞擊／下降尾音。共用主音量／限制器與stop／dispose，測試檢查有限值、相對頻帶紋理、峰值、衰減與生命週期；非真人試聽。

控制室由未排序UV讀數配回路圖；裝配線由原始格數配設備單位及接線；四色由設備校正值配燈牌及三項條件，24個排列中只有1解；出口把校正值、燈序、移轉及反向規則跨區整合；列車再取早期照明校驗來源、三張卡、現場排序與軌道。保留原故事／答案／已解進度／存檔版本；已知答案仍可直接輸入，不聲稱有防猜碼或每輪隨機。

查核發現舊color-order即使文字改了，renderer仍畫固定紅黃綠藍箭頭；正式reasoning呈現改文件而保留舊模組API相容。main畫布、閱讀字幕、目標、文件互動、地圖及列車錯碼同步採新內容；地圖只在相應控制器完成後保留紀錄，不自動發給尚未取得的列車卡／整套公式。

### 實際執行

- Node v24.22.1，`node --test --test-reporter=tap` **314/314**，0失敗／略過，完整TAP見full-suite.tap。
- 乾淨Windows clone，以core.autocrlf=true從038b9ad重新取出，**314/314**，main.js CRLF=0；windows-suite.tap。沒有以本機結果冒稱GitHub CI已跑。
- Python啟動器unittest discover **8/8**；launcher-tests.txt。
- route-replay.mjs由既有chapter-flow取物／復電路線與stealth-route後半路線組成，真正從出生點走到裝配線並啟用存檔點，再還原此已取得存檔點，以最高壓力及reasoning=true前進至END，**1/1**。答案由新證據資料推導，沒有直接指定後段已解旗標。這是Node邏輯操作，非瀏覽器或真人全章。
- 真Three.js建立新紙面並以室內視角選讀：6個關鍵文件可讀；兩張加高跨區紙張的上下邊緣可記錄，超距仍不可。裝飾模型使用同一文件淨空資料。
- 使用本機@napi-rs/canvas及系統微軟正黑體執行真正sign-view，輸出並目視檢查10份文件；第一次發現舊窄紙條太擠、標題與本文距離不足，修正後重新渲染。reasoning-papers-before-size-fix.png／reasoning-papers.png；不是GPU場景截圖。
- 本機8778入口與**79個**執行資源／預覽HTTP200且位元一致；local-http.json。build及祖先摘要見verification.json。

新測試的兩項設定修正也保留紀錄：reasoning-first-green-attempt.tap的一個新fixture漏了已取得保險絲及已復位的前置旗標，補齊合法前置後存檔往返通過，未降低斷言；route-first-attempt.tap原將到達6.5m平台視為已進裝配線，實際需走入區域7.5m才啟用存檔點，改測試路線再還原，沒有直接設定checkpoint或改遊戲判定。

### 待使用者與環境限制

本輪未做新的真瀏覽器GPU／FPS或實體Xbox／PS；未重試先前被安全機制停止的瀏覽器操作，也沒有換工具繞過。新音色恐怖感、首次推理解題深度及整章人體操作仍待使用者；舊電腦效能依先前選擇暫緩。孤立WAV只是原創紋理層，實際混音請用immersion-preview或正式index試玩；不要把聲音訊號測試當成聽感通過。

操作與完整來源：[本輪候選說明](HORROR_AUDIO_AND_REASONING.md)。本機與最終公開站／備份不同步是使用者明確要求的試玩流程。
