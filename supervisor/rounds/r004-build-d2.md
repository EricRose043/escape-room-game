模型：gpt-6.1-sol
思考度：medium

# R004｜計畫討論第 2 次＋共識即施工：STEP 2「互動」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。

## 監督者審查你的 d1 計畫
採認：選項 A（中央射線命中物品 AABB，模型與判定共用同一組 AABB）、「2 公尺」＝眼睛到首次命中表面的距離（含 2 公尺）、重疊時選最近、射線對 `LEVEL_BOXES`＋`ROOM_SURFACES` 的遮擋（同距離算擋住）、`kind: 'partition'` 隔板並保留四面外牆、`items.js` 唯一物品資料、背包 `{ itemIds: [] }` 不改原定義、`interactPressed`（E 只認首次按下、A／✕ 按下邊緣、開始／繼續當幀不撿、暫停失焦清除）、提示用 `buttonLabel('interact', …)`、三個示範物品、16 條測試、瀏覽器確認清單、拔除訊息清理、不新增背包選單。計畫很完整。

以下兩點要改：

1. **物品判定範圍至少 0.25 公尺**：每個物品 AABB 的 X、Y、Z 三邊都不小於 0.25 m，並加一條測試 `每個物品的判定方塊三邊都至少 0.25 公尺` 掃過 `items.js` 全部物品。
   安全目的：選項 A 要求準星打到物品，用搖桿瞄太小的東西會很挫折；之後 STEP 4 的保險絲等小道具也要遵守（模型可以小，但判定方塊不小於這個尺寸時，要讓模型和判定一致，就把模型做到這個大小）。

2. **`DECISIONS.md` 不在你的白名單**：決定由監督者登記（本輪的「看著」「2 公尺」「判定最小 0.25 m」監督者會記成 D007）。你只在回報裡列出你做了哪些需要登記的選擇。

白名單其餘照你 d1 的列表（去掉 `DECISIONS.md`）。`assets/CREDITS.md` 可以新建。

## 共識確認
- 同意以上兩點：回覆**第一行寫 `CONSENSUS`**，然後直接施工。
- 有任何一點不同意：第一行寫 `NEED_DISCUSSION`，只回理由與替代做法，**不施工**。

## 施工規則（照 AGENTS.md）
- TDD：先寫測試 → `npm test` 確認失敗 → commit；再寫程式 → 全部通過 → commit；`PLANS.md` 勾 STEP 2（併入第二個 commit）。
- 不改既有測試檔、`BRIEF.md`、`VERIFY.md`、`AGENTS.md`、`CLAUDE.md`、`DECISIONS.md`、`supervisor/`。不新增套件。不 push。
- commit 說明用繁體中文，結尾加 `Co-Authored-By: Codex <noreply@openai.com>`。
- 不做手電筒、謎題、背包選單。

## 回報格式（短）
1. 第一行 `CONSENSUS` 或 `NEED_DISCUSSION`
2. 改了哪些檔案
3. 紅燈證據、綠燈結果（通過數）
4. 兩個 commit 編號
5. 需要監督者登記的選擇（一行一個）
6. 沒做到或不確定的事
