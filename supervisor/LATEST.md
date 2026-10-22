# 監督者現況（每輪收尾整檔覆寫）

更新：2026-10-22

## 現況
- **第 1 批（基礎系統，STEP 0、1、1b、2、3）全部完成並審查通過**，已 push。77/77 綠燈。
  - STEP 3：2dcef40 測試、09bf0b4 實作。瀏覽器驗過：F 開關、電量下降、撿電池補電（不超過 100）、R 切紫外光變紫、紫外光照到隔板背面「星光在此」才顯示、一般光不顯示、假 PS 手把 R1／L1 正常、主控台無錯誤。
- D007（互動）、D008（手電筒）已登記。

## 下一步（等 EricRose043 決定）
- 第 2 批從 STEP 4（入口大廳與電力室）開始，是第一個正式關卡。PLANS.md 的分工建議是 RyanDing1010 做區域與謎題（STEP 4、7、9）、shuoen88 做怪物與追逐（STEP 5、6、8）。
- 需要 EricRose043 決定：STEP 4 由誰做——照分工交給 Ryan，還是先在這裡由 Codex 做。
- 不依賴這個決定、可以先做的：STEP 10（聲音與氣氛）的計畫討論（PLANS 建議是 EricRose043 的部分）。

## 小問題（不急）
- 物品離手電筒很近時會過曝成一片白。
- 電量條旁邊有一個重複的「100%」文字（可能是讀螢幕用的標籤），之後順手看。

## 瀏覽器預覽（測試技巧）
- launch.json（在 session 資料夾「vibe coding 通識 」，結尾有空格）設定名 `escape-room`，port 8778。
- 先用 `mcp__ccd_view__show_pane` 打開 preview，否則畫面不更新（rAF 不跑）。
- 改檔後用 `fetch(f,{cache:'reload'})` 逐檔刷新再 `location.reload()`。
- 頁面要有焦點：點一下開始畫面標題（find「星星糖果樂園」）。
- Pointer Lock 被拒：覆寫 `document.pointerLockElement` 再送 `pointerlockchange` 模擬。
- 假手把：覆寫 `navigator.getGamepads`，送 `gamepadconnected`，改 `buttons`／`axes` 並遞增 `timestamp`。
- 起點 (0, 3.8) 面向 -Z；滑鼠 movementX -785 ≈ 左轉 90°、1571 ≈ 轉身。面向 +Z 時 A 是往 +X。
- 隱藏字在隔板背面 (2.5, 1.6, -0.02)，面向 -Z。

## 等 EricRose043 決定或協助的事
- STEP 4 起的分工（見上）。
- 用 Chrome 實測滑鼠鎖定；用 Xbox／PS 手把照 README 清單實測。
