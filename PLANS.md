# 密室逃脫遊戲 — PLANS

一次只做一步。每一步都用 TDD：先寫這一步的測試 → 跑一次確認失敗 → commit → 寫程式 → 全部通過 → commit → 在這裡打勾。

## 檔案怎麼放
- `src/logic/`：遊戲規則（移動碰撞、背包、電池、謎題、怪物判斷、存檔），不碰 three.js，用 `npm test` 測
- `src/game/`：three.js 畫面、輸入、聲音，把 logic 的狀態畫出來
- `tests/`：logic 的測試，用 Node 內建的 `node --test`
- `assets/`：材質與音效，來源寫在 `assets/CREDITS.md`

## 步驟

- [x] **STEP 0　專案環境**（VERIFY STEP 0）
  package.json、`npm test`、index.html 載入 three.js、一個空房間、本機伺服器啟動說明（README）
- [x] **STEP 1　第一人稱移動**（VERIFY STEP 1）
  logic：碰撞（玩家當圓柱、牆和家具當方塊）、視角上下限制；game：Pointer Lock、WASD、暫停畫面
- [x] **STEP 1b　手把**（VERIFY STEP 1b）
  logic：把鍵盤、滑鼠、手把都轉成同一組「動作」（走、看、互動、手電筒…）、搖桿死區、從手把名稱與廠商編號辨識 Xbox／PS、依最後使用的裝置決定提示文字；game：Gamepad API 每幀讀取、接上／拔掉事件
- [ ] **STEP 2　互動**（VERIFY STEP 2）
  logic：背包、2 公尺範圍、視線被擋的判斷；game：準星、提示文字、E 鍵
- [ ] **STEP 3　手電筒**（VERIFY STEP 3）
  logic：電量、開關規則、紫外光可見判斷；game：SpotLight、電量條、隱藏字材質
- [ ] **STEP 4　入口大廳與電力室**（VERIFY STEP 4）← 第 2 批，做完整段玩一遍
- [ ] **STEP 5　棉花糖先生：巡邏與發現**（VERIFY STEP 5）
- [ ] **STEP 6　被抓到與存檔點**（VERIFY STEP 6）← 第 3 批，做完整段玩一遍
- [ ] **STEP 7　糖果生產線謎題**（VERIFY STEP 7）
- [ ] **STEP 8　追逐走廊**（VERIFY STEP 8）
- [ ] **STEP 9　出口大門與結局**（VERIFY STEP 9）← 第 4 批，整章從頭玩一遍
- [ ] **STEP 10　聲音與氣氛**
  腳步聲、環境聲、靠近怪物時的心跳聲、設定（音量、jump scare 開關）

## 分工建議（還沒確定，三個人討論後再改）
- STEP 0～3 是大家都會用到的基礎，先由 EricRose043（Claude 監督、Codex 執行）做完
- 基礎完成後可以平行：
  - RyanDing1010：區域與謎題（STEP 4、7、9）
  - shuoen88：棉花糖先生與追逐（STEP 5、6、8）
  - EricRose043：聲音與氣氛（STEP 10）、整合與審查
- 每個人在自己的分支開發，合併到 main 前要 `npm test` 全部通過
