# 決定紀錄

換 session、換人接手時，這份就是記憶。每個仍有效的決定一列；改決定時新增一列，舊的標「已被 Dxxx 取代」。

| 編號 | 日期 | 決定 | 誰決定 | 出處 |
|---|---|---|---|---|
| D001 | 2026-10-22 | EricRose043 用雙 AI：Claude 監督、Codex 執行 | EricRose043 | AGENTS.md「成員與 AI 分工」 |
| D002 | 2026-10-22 | RyanDing1010、shuoen88 用單 AI，不受雙 AI 限制 | EricRose043 | 同上 |
| D003 | 2026-10-22 | 恐怖元素參考 Poppy Playtime 的氣氛，但角色、場景、道具全部原創 | EricRose043 提需求，Claude 規劃 | BRIEF.md |
| D004 | 2026-10-22 | 技術：three.js 靜態網站、第一人稱、規則放 src/logic 用 npm test 測 | Claude 規劃 | BRIEF.md「限制」、PLANS.md |
| D017 | 2026-10-29 | 本章主題改為廢棄玩具工廠；深夜進入辦公室後門鎖上；一分鐘可跳過開場交代公司盛況與異常玩偶；中段意外接通展示區電源觸發首次追逐；早期取得工廠底圖，通關解鎖完整標記收藏地圖；以大型玩具列車逃離作為結尾。角色與素材仍採原創。 | RyanDing1010 | 本對話 2026-10-29 |
| D014 | 2026-10-22 | STEP 6 拆 6a（存檔點與回復）／6b（被抓流程）／6c（瀏覽器存檔與開始選單）。存檔點：大廳、電力室、生產線（回復在平台，不加無敵）；「最近」＝最後啟用、只前進。被抓回復：保留物品、安裝、已解謎題、電量與模式；手電筒關、介面清除、怪物回起點並清記憶。被抓 1.2 秒先黑畫面，jump scare 開啟時才顯示原創近景（無血無尖牙）；`jumpScare` 由外部傳入，暫時預設關，待組員 S2 接上（**預設開或關待 EricRose043 決定**）。存檔只存必要進度＋存檔點 ID、版本 1、壞檔不刪不覆寫。`monster-chase.test.js` 第 81～95 行准許在 6b 遷移 | Claude 從 Codex 提案採認 | supervisor/rounds/r008-plan-d1-resp.md、r008-build-6a.md |
| D013 | 2026-10-22 | **角色與驗收統整已由 D015 取代；原功能檔案與介面分配保留。** 組員工作要和 EricRose043 低相依、可並行：組員只新增自己的檔案、不改共用檔案（chapter／main／world／怪物／既有區域與測試），由 EricRose043 那邊整合。Ryan：R1 顏色謎題規則、R2 出口與結局；shuoen：S1 聲音、S2 設定、S3 追逐走廊場地；兩人：實機測試。詳見 TEAM_TASKS.md | EricRose043（「我的工作和他們的相依性不要那麼高 幫他們找工作寫在repo裡 是可以和我並行的工作」） | TEAM_TASKS.md、PLANS.md「分工」 |
| D012 | 2026-10-22 | STEP 5 拆 5a（生產線場地與巡邏）／5b（發現與追逐）／5c（置物櫃）。先建第三區 `areas/production.js` 空間，STEP 7 再加謎題；怪物走路用路點圖＋最短路徑；視覺 8 m、120°、牆擋、背後不新發現；速度巡邏 1.0、追逐 2.3 m/s（玩家 2.5）；成功進櫃一律失去目標；接觸 0.8 m 只發事件（被抓是 STEP 6）；外觀原創、無尖牙無血。待檢討：怪物限生產線活動，退回平台即可脫離。5a 實作：12 節點／13 邊、停留後原地轉向、無路徑時等待。5b 實作：搜尋原地察看 60°/s、貼牆目標投影到安全位置、接觸提示 0.8 秒。5c 實作：櫃子薄板 0.025 m、窺視縫寬 0.6 m 高 0.12 m（眼高 1.6 m），進出檢查整段路徑與身體間距 | Claude 從 Codex 提案採認 | supervisor/rounds/r007-plan-d1-resp.md、r007-build-5a.md |
| D011 | 2026-10-22 | STEP 5、6（棉花糖先生、被抓與存檔點）也由 EricRose043 這邊（Claude 監督、Codex 執行）繼續做 | EricRose043（「繼續做」） | 本對話 2026-10-22 |
| D010 | 2026-10-22 | STEP 4 拆成 4a（正式場景與大廳門禁）、4b（保險絲與電箱）、4c（密碼鎖與恢復供電）；關卡資料每區一份 `src/logic/areas/*.js`，由 `world.js` 彙整，**之後新增區域照這個格式**；門擋移動與視線；密碼 4726；密碼鎖 3×4、手把十字鍵操作；光源上限 1 SpotLight＋2 PointLight＋Ambient；7 個舊測試可遷移到 fixture，但遷移須單獨 commit 且不改任何期望值；門楣只擋視線不擋移動（4a 補充） | Claude 從 Codex 提案採認 | supervisor/rounds/r006-plan-d1-resp.md、r006-build-4a.md |
| D009 | 2026-10-22 | STEP 4（入口大廳與電力室）先由 EricRose043 這邊（Claude 監督、Codex 執行）做，當作之後關卡的範本；其餘分工仍照 PLANS.md 建議，待三人討論 | EricRose043（選「先做」） | 本對話 2026-10-22 |
| D008 | 2026-10-22 | 手電筒：起始 100%、每秒耗 0.2 個百分點（滿電約 8 分 20 秒）、電池 +25 上限 100；關閉／暫停不耗電；紫外光照到＝隱藏字中心在光錐（半角 25°、8 m）內、在正面、無遮擋；不開陰影（光可能穿過隔板，但隱藏字仍照 logic 判斷）。數值是初始建議，關卡完成後實玩再調 | Claude 從 Codex 提案採認 | supervisor/rounds/r005-plan-d1-resp.md 第 2、3 節 |
| D007 | 2026-10-22 | 互動「看著」＝畫面中央射線打到物品的判定方塊；「2 公尺」＝眼睛到首次打到表面的距離（含 2 公尺）；隔牆、隔板、桌子擋住就撿不到；每個物品判定方塊三邊至少 0.25 m，模型與判定一致 | Claude 從 Codex 提的 3 個選項選定 | supervisor/rounds/r004-plan-d1-resp.md 第 2、3 節、r004-build-d2.md |
| D006 | 2026-10-22 | 要能用手把玩：Xbox、PS 都支援並自動辨識，按鍵提示跟著裝置改變；只用手把要能玩完整章 | EricRose043（「要用手把可以玩」「Xbox 和 ps都要能夠支援 自動識別」） | BRIEF.md「操作」、VERIFY.md STEP 1b |
| D005 | 2026-10-22 | Claude 與 Codex 協作照 YUJIN-Workspaces 精簡版：Claude 用 supervisor/send-codex.sh 直接送指令、每輪先討論計畫 1–5 次再開工、施工輪不得改 BRIEF／VERIFY | EricRose043 | AGENTS.md「Claude 與 Codex 怎麼協作」 |

| D015 | 2026-10-29 | 依 week 8 簡報調整三人主責：Ryan 劇情與素材、Eric 網站與機關、shuoen 測試與整合；保留 R1／R2／S1／S2／S3 功能分配。新增 TESTS 逐條追溯、實測／缺陷／貢獻紀錄；使用 merge commit 保留真實作者，不補造其他人的 commit。取代 D013 的角色與驗收統整方式，原檔案邊界延續。 | shuoen88 在本次對話提出並授權；本分支提案待 Eric 審查合併生效，不代表三人已共同核准 | TEAM_TASKS.md、TESTS.md、docs/TESTING_LOG.md、docs/DEFECTS.md、docs/CONTRIBUTIONS.md；老師 week 8 簡報第 7～11、17、22～27 頁 |

| D016 | 2026-10-29 | shuoen88 先完成 S0 測試紀錄，再實作獨立 S1：Web Audio 程式合成、主音量 0～1（S2 需除以 100）、心跳近 2m／遠 14m、步幅參數 1.3m 與 0.18～1.2 秒間隔；數值是初版可調音效參數，不改遊戲機制。保留 stop／dispose 與診斷 API，不接入共用 main，由 Eric 整合。 | shuoen88 本次授權；此分支交付待 Eric 審查 | TEAM_TASKS S0／S1、docs/AUDIO_INTEGRATION.md、LOG-20261029-03／04 |

D017 保留 Ryan 原始劇情決定與來源；原工廠分支編號為 D015，本次因與角色分工重號而改編，未更改其決定人。原 commit 由 merge b2066d2 保留。

| D018 | 2026-10-29 | 依 shuoen88「幫我解決問題並記得把修改後的內容上傳」授權，整合 fc603ad 與 S1：保留工廠 createFactoryAudio／audioCueFor，以單一 S1 引擎執行；原 createAudio 可繼續匯入。進階存檔採嚴格 v2、讀取 v1，解題與列車啟動立即寫入；保留雙方測試及作者，採 merge commit。此項更新 D016 的未接入狀態；不改 BRIEF／VERIFY 的人類驗收含義。 | shuoen88 授權，Codex 執行；owner 合併待審 | LOG-20261029-07、PR #2、d87b510／54ae26f |

| D019 | 2026-10-29 | shuoen88確認S2驚嚇近景預設關閉，玩家可自行開啟。本輪依「完成所有分工、測完上傳、以最新版為基礎」授權完成S2並接上main；主音量沿用現有32%，滑鼠倍率初值1、介面範圍0.25～3，僅改滑鼠位移倍率，手把轉速不變。S3先完成原分工的獨立模組／預覽，因原座標與列車區重疊，正式接入方向仍等使用者選擇；不擅改Ryan場地或BRIEF／VERIFY。 | shuoen88明確回覆驚嚇預設，其餘為任務內實作參數；正式S3位置尚未決定 | 本次對話、LOG-20261029-08、docs/SETTINGS_AND_CORRIDOR.md |
