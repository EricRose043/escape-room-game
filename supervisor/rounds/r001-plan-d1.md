模型：gpt-6-luna
思考度：medium

# R001｜計畫討論第 1 次：PLANS.md STEP 0「專案環境」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。

## 你的角色
你是這個專案的執行者，Claude 是監督者。協作規則在 `AGENTS.md`「Claude 與 Codex 怎麼協作」，先讀。

## 先讀（不要憑記憶）
`AGENTS.md`、`BRIEF.md`、`VERIFY.md`（STEP 0、STEP 1 兩段）、`PLANS.md`、`DECISIONS.md`。

## 目標
提出 STEP 0「專案環境」的施工計畫。這一回**只提計畫，不寫任何檔案**（你現在是唯讀）。

STEP 0 做完時要成立的是 VERIFY.md 的 STEP 0 三條。STEP 0 是之後所有步驟的地基，所以計畫裡也請說明：
- `src/logic/` 和 `src/game/` 怎麼分，logic 怎麼做到完全不碰 three.js 也能用 `npm test` 測
- three.js 怎麼載入（版本要固定），在學校舊電腦上怎麼顧到 30 fps
- 怎麼在本機開起來（README 要寫給三個組員看得懂）

## 邊界
- 只做 STEP 0，不要偷做 STEP 1 的移動或碰撞
- 不新增 BRIEF 沒要的東西（例如打包工具、框架）；若你認為非用不可，列成選項並說明理由，由監督者決定
- 不改 `BRIEF.md`、`VERIFY.md`

## 請照這個格式回覆
1. 目標（對到 PLANS.md 哪一步、VERIFY.md 哪幾條）
2. 檔案白名單（會新增或修改的每個檔案，一行一個，附用途）
3. 驗收：哪些測試要先紅後綠、哪些要用瀏覽器確認
4. 停止條件：遇到什麼情況會停下來問
5. 預估要幾回
6. 你覺得 VERIFY.md 或 PLANS.md 的 STEP 0 有沒有寫不清楚、做不到的地方（有就指出，不要自己改）
