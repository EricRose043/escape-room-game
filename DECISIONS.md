# 決定紀錄

換 session、換人接手時，這份就是記憶。每個仍有效的決定一列；改決定時新增一列，舊的標「已被 Dxxx 取代」。

| 編號 | 日期 | 決定 | 誰決定 | 出處 |
|---|---|---|---|---|
| D001 | 2026-10-22 | EricRose043 用雙 AI：Claude 監督、Codex 執行 | EricRose043 | AGENTS.md「成員與 AI 分工」 |
| D002 | 2026-10-22 | RyanDing1010、shuoen88 用單 AI，不受雙 AI 限制 | EricRose043 | 同上 |
| D003 | 2026-10-22 | 恐怖元素參考 Poppy Playtime 的氣氛，但角色、場景、道具全部原創 | EricRose043 提需求，Claude 規劃 | BRIEF.md |
| D004 | 2026-10-22 | 技術：three.js 靜態網站、第一人稱、規則放 src/logic 用 npm test 測 | Claude 規劃 | BRIEF.md「限制」、PLANS.md |
| D013 | 2026-10-22 | 組員工作要和 EricRose043 低相依、可並行：組員只新增自己的檔案、不改共用檔案（chapter／main／world／怪物／既有區域與測試），由 EricRose043 那邊整合。Ryan：R1 顏色謎題規則、R2 出口與結局；shuoen：S1 聲音、S2 設定、S3 追逐走廊場地；兩人：實機測試。詳見 TEAM_TASKS.md | EricRose043（「我的工作和他們的相依性不要那麼高 幫他們找工作寫在repo裡 是可以和我並行的工作」） | TEAM_TASKS.md、PLANS.md「分工」 |
| D012 | 2026-10-22 | STEP 5 拆 5a（生產線場地與巡邏）／5b（發現與追逐）／5c（置物櫃）。先建第三區 `areas/production.js` 空間，STEP 7 再加謎題；怪物走路用路點圖＋最短路徑；視覺 8 m、120°、牆擋、背後不新發現；速度巡邏 1.0、追逐 2.3 m/s（玩家 2.5）；成功進櫃一律失去目標；接觸 0.8 m 只發事件（被抓是 STEP 6）；外觀原創、無尖牙無血。待檢討：怪物限生產線活動，退回平台即可脫離。5a 實作：12 節點／13 邊、停留後原地轉向、無路徑時等待 | Claude 從 Codex 提案採認 | supervisor/rounds/r007-plan-d1-resp.md、r007-build-5a.md |
| D011 | 2026-10-22 | STEP 5、6（棉花糖先生、被抓與存檔點）也由 EricRose043 這邊（Claude 監督、Codex 執行）繼續做 | EricRose043（「繼續做」） | 本對話 2026-10-22 |
| D010 | 2026-10-22 | STEP 4 拆成 4a（正式場景與大廳門禁）、4b（保險絲與電箱）、4c（密碼鎖與恢復供電）；關卡資料每區一份 `src/logic/areas/*.js`，由 `world.js` 彙整，**之後新增區域照這個格式**；門擋移動與視線；密碼 4726；密碼鎖 3×4、手把十字鍵操作；光源上限 1 SpotLight＋2 PointLight＋Ambient；7 個舊測試可遷移到 fixture，但遷移須單獨 commit 且不改任何期望值；門楣只擋視線不擋移動（4a 補充） | Claude 從 Codex 提案採認 | supervisor/rounds/r006-plan-d1-resp.md、r006-build-4a.md |
| D009 | 2026-10-22 | STEP 4（入口大廳與電力室）先由 EricRose043 這邊（Claude 監督、Codex 執行）做，當作之後關卡的範本；其餘分工仍照 PLANS.md 建議，待三人討論 | EricRose043（選「先做」） | 本對話 2026-10-22 |
| D008 | 2026-10-22 | 手電筒：起始 100%、每秒耗 0.2 個百分點（滿電約 8 分 20 秒）、電池 +25 上限 100；關閉／暫停不耗電；紫外光照到＝隱藏字中心在光錐（半角 25°、8 m）內、在正面、無遮擋；不開陰影（光可能穿過隔板，但隱藏字仍照 logic 判斷）。數值是初始建議，關卡完成後實玩再調 | Claude 從 Codex 提案採認 | supervisor/rounds/r005-plan-d1-resp.md 第 2、3 節 |
| D007 | 2026-10-22 | 互動「看著」＝畫面中央射線打到物品的判定方塊；「2 公尺」＝眼睛到首次打到表面的距離（含 2 公尺）；隔牆、隔板、桌子擋住就撿不到；每個物品判定方塊三邊至少 0.25 m，模型與判定一致 | Claude 從 Codex 提的 3 個選項選定 | supervisor/rounds/r004-plan-d1-resp.md 第 2、3 節、r004-build-d2.md |
| D006 | 2026-10-22 | 要能用手把玩：Xbox、PS 都支援並自動辨識，按鍵提示跟著裝置改變；只用手把要能玩完整章 | EricRose043（「要用手把可以玩」「Xbox 和 ps都要能夠支援 自動識別」） | BRIEF.md「操作」、VERIFY.md STEP 1b |
| D005 | 2026-10-22 | Claude 與 Codex 協作照 YUJIN-Workspaces 精簡版：Claude 用 supervisor/send-codex.sh 直接送指令、每輪先討論計畫 1–5 次再開工、施工輪不得改 BRIEF／VERIFY | EricRose043 | AGENTS.md「Claude 與 Codex 怎麼協作」 |
