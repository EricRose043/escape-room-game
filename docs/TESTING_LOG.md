# 實測與回歸紀錄

統整：shuoen88。各人負責真實操作者與功能自測；Eric 處理主程式串接及審查合併。不得代填別人尚未做的測試。

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
