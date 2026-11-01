# 2026-11-01 owner 整合交付

遊戲名稱：**棉花糖工坊：閉館之後**。本輪依使用者「把能做的都做完，根據 GitHub 上新的分工表」授權，由 Eric 的 Codex 完成網站、機關、組員模組接入與交付；Claude 額度不再是開工條件。

整合 PR：[GitHub #4](https://github.com/EricRose043/escape-room-game/pull/4)。是否已進入 main、最新 CI 與最終 merge SHA 以該 PR 的即時狀態為準。

## 原始成果與正式串接

| 來源 | 原始分支 HEAD | 本輪處理 |
|---|---|---|
| 分工與案例追溯 | shuoen/team-roles-and-test-plan `3072dfa` | 保留原始提交，採新版三人主責；不覆寫歷史驗收 |
| S0／S1／S2／S3 | shuoen/save-playtest-and-audio `42d8357` | 保留測試、設定、共享音效、獨立走廊及歷史證據，接上正式遊戲 |
| 劇情與 R1／R2 | ryan/color-puzzle `05b290b` | 透過 merge `65ed422` 保留 Ryan 最新原始提交與作者；接實際色序、線索、出口、時間與結局元件 |
| 上一版本地候選 | codex/finish-chapter-one `cf49d4a` | 保留原分支供追溯；這次以 GitHub 最新工廠／列車劇情為底，不覆蓋組員新成果。相容舊存檔中的共享道具、電力及時間 |

三個 GitHub 來源 HEAD 已用 `git merge-base --is-ancestor <SHA> HEAD` 核對為整合提交祖先。沒有 squash、rebase、force push 或補造他人 commit；原 Ryan／shuoen 作者欄位均保留。

## 已完成

- R1：紅 → 黃 → 綠 → 藍的正式按鈕；錯序重置、實際聲音警報與調查來源；完成後記錄燈序線索。
- S3：沿組員原場地接入兩次轉彎、三道門與從身後追逐；停留會被抓，回復保留已解謎題與線索。門在玩家與怪物都通過後閉鎖，避免怪物穿門。
- R2：維修對照卡與反向規則實際可讀取／記錄；三條線索推導 2413，未齊不能猜碼開門；出口解鎖後才能正式啟動列車、登車、顯示計時結局與收藏地圖。
- owner：六區不重疊；出口廳與月台向東放置，控制器移至門側；列車模型與軌道位置從正式場景資料導出。
- 完整操作：開場可用手把略過；M／View／Share 查看地圖；O／Y／△ 設定；地圖、結局收藏版與重玩均支援鍵鼠及手把。修正結局確認鍵穿透與鍵盤焦點誤重開。
- 版本三存檔：保存色序、三線索、走廊、出口、列車、時間與完成狀態；相容 GitHub v1／v2 及上一版本地 v2，壞檔／寫入失敗保護保留。
- 交付：部署說明、跨平台 Node CI、完整路線工具與原始證據。

## 驗證

本機 `npm test`：**235／235 PASS，0 fail，0 skipped**。

| 正式路線 | 結果 | 原始紀錄 |
|---|---|---|
| 真 Chrome／WebGL 鍵鼠與 Pointer Lock | PASS，console 0 errors | [keyboard](evidence/2026-11-01/owner-integration/browser-verification.json) |
| 模擬 Xbox，只用手把完成遊戲路線 | PASS，console 0 errors | [Xbox](evidence/2026-11-01/owner-integration/xbox-browser-verification.json) |
| 模擬 PS／DualSense，只用手把完成遊戲路線 | PASS，console 0 errors | [PS](evidence/2026-11-01/owner-integration/ps-browser-verification.json) |

路線由實際 main.js 的鍵鼠事件／Gamepad API 操作；只注入唯讀狀態檢查與可控 rAF 時鐘，沒有直接設定進度或傳送玩家座標。包含辦公室拿圖／卡／燈、UV、4726、故意錯序引怪與被抓、正確色序、3142、走廊線索、追逐、實際重載續玩、反向線索、2413、啟動與登車、計時結局、收藏地圖和重玩確認。另測遊戲中設定與地圖開關。

Node 及瀏覽器的測試輸出、截圖在 [owner-integration](evidence/2026-11-01/owner-integration/)。瀏覽器截圖使用受控時鐘，FPS 不能當成效能量測。

## 需求對照與未代填項目

原 `VERIFY.md` 沒有被改寫。按新版 GitHub BRIEF／劇情保留員工卡門禁和列車逃生，同時補回原 STEP 7 的四色警報與 STEP 9 的三線索出口；原 T4.01「只提拿手電筒才離開」與員工卡門禁的文字差異仍保留在驗收追溯，不宣稱舊 53 條全部人類通過。

實體 Xbox／PS、學校舊電腦全螢幕 30 fps、真人音色舒適度、Safari／Firefox 仍需實際設備及操作者。沒有把自動通關、歷史 Windows 結果或內建瀏覽器 FPS 代填成實體設備結果。交接清單沿用 [HUMAN_TEST_CHECKLIST](HUMAN_TEST_CHECKLIST.md)。

## GitHub Actions 啟動限制（2026-11-01）

[run 41320466639](https://github.com/EricRose043/escape-room-game/actions/runs/41320466639) 的 GitHub Summary／Annotations 明確顯示帳戶近期付款失敗或支出上限需要調整，沒有啟動任何 job。GitHub API 未提供該註解，已用原生 Chrome 讀取確認；詳 [原始狀態](evidence/2026-11-01/owner-integration/github-ci-startup.json)。

工作流程 YAML 已本機解析；本機235項及三條Chrome路線通過。但 Linux／Windows × Node22／24 的遠端CI **NOT_RUN，不是 PASS**，也不以歷史220項Windows結果代替。沒有更改付款、預算、Actions權限或分支保護；只有帳戶持有人可處理帳務限制，解除後再重跑CI。
