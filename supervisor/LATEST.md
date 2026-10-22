# 監督者現況（每輪收尾整檔覆寫）

更新：2026-10-23

## 現況
- **STEP 0～6 全部完成並審查通過**（第 1～3 批），已 push。169/169 綠燈。
  - STEP 5（5a／5b／5c）：生產線、棉花糖先生巡邏／發現／追逐／搜尋、置物櫃躲藏。瀏覽器實玩驗過。
  - STEP 6a 存檔點與回復、6b 被抓流程（`?jumpscare=1` 開近景）、6c 版本一存檔與開始選單。
- 6b、6c 的瀏覽器驗收**只做了一部分**：監督者預覽視窗不在畫面上時遊戲迴圈不跑。
  - 已驗：6a 回歸；6c 無存檔時「繼續」停用、壞檔顯示「存檔 JSON 損壞，無法繼續」且不覆寫、有效存檔可繼續（電量 83%）、重新開始要確認、取消保留存檔、別的 localStorage key 不受影響。近景程式碼審查（無紅色、無牙、單次放大）。
  - **待補驗**（需要預覽視窗在畫面上）：實際被抓 → 黑畫面 → 回平台；`?jumpscare=1` 的近景實際觀感；遊戲中途關頁再開回到存檔點；手把操作開始選單。
- 每個子步驟都遇到「前一步寫的『還沒有某功能』測試」衝突，Codex 都先停下問，監督者逐次裁定最小修改。

## 組員（D013）
- `TEAM_TASKS.md`：Ryan R1 顏色謎題規則、R2 出口與結局；shuoen S1 聲音、S2 設定、S3 追逐走廊場地；兩人實機測試。
- 2026-10-23 檢查：GitHub 只有 `main`，還沒有組員分支或 PR。

## 下一步
- 補驗 6b／6c（見上）。
- 組員 PR 進來時：審查、合併、接進主程式（顏色謎題放進生產線並接怪物警報、走廊接怪物追逐、出口接地圖、S1 聲音與 S2 設定接 `main.js`）。
- 技術債（Codex 建議）：`tests/capture-input.test.js` 的 `runtime()` 會拿掉 `main.js` 的 import 再注入替身，每次 `main.js` 加 import 都會壞；之後抽成共用 helper。

## 等 EricRose043 決定
- jump scare 預設開或關（D014；BRIEF 寫「可以關掉」暗示預設開）。
- 用 Chrome 實測滑鼠鎖定；用 Xbox／PS 手把照 README 清單實測（也列在 TEAM_TASKS 給組員）。

## 瀏覽器預覽（測試技巧）
- launch.json（在 session 資料夾「vibe coding 通識 」，結尾有空格）設定名 `escape-room`，port 8778。
- 先用 `mcp__ccd_view__show_pane` 打開 preview；若回「session isn't open in any window」，遊戲迴圈不會跑，只能測 DOM。先用 rAF 計數確認畫面有在更新。
- 改檔後逐檔 `fetch(f,{cache:'reload'})` 再 `location.reload()`。
- 頁面要有焦點（開始選單也要）：用 computer 工具真的點一下（find 標題或按鈕）。
- Pointer Lock：覆寫 `document.pointerLockElement` 再送 `pointerlockchange`。
- 假手把：覆寫 `navigator.getGamepads`，送 `gamepadconnected`，改 `buttons`／`axes` 並遞增 `timestamp`。十字鍵 12 上、13 下、14 左、15 右。
- 整段路線（鍵鼠，出生點 (0,6) 朝北）：A 600、W 240、低頭 175、E（手電筒）、抬頭；D 600、W 4000、A 1200、低頭 120、E（保險絲）、抬頭；D 2400、右轉 785、D 640、E（電箱）；A 880、低頭 66、E（密碼鎖）點 4726 確認；重新鎖定、抬頭 66、A 520、W 2080（到生產線入口 8.2）。
- 被發現：入口朝東南（右轉 393）等約 17 秒。L1 櫃：入口 W 720、右轉 785、W 2120、右轉 785、W 600、右轉 785。
- 開始選單：`#start-continue`、`#start-new`、`#start-confirm`、`#start-cancel`、`#start-message`；存檔 key `star-candy-park.chapter-1.save`。
