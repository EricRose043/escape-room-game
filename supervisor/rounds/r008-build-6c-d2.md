模型：gpt-6.1-sol
思考度：high

# R008｜6c 討論回覆＋施工

一律以繁體中文回覆；程式碼、檔名、指令照原樣。不操作瀏覽器或電腦控制工具。

## 監督者裁定你的 NEED_DISCUSSION
停下來是對的。`tests/capture-input.test.js` 的 `runtime()` 是執行 `main.js` 的測試架子，6c 在 `main.js` 加新的 import 後，架子必須補齊替身。**同意，範圍如下：**

1. 只改 `runtime()` 函式內部：
   - 在 `dependencies` 補上 6c 新增的 import（例如 `createStartMenuView`、存檔相關函式）的替身或真實模組（純 logic 可用真的）。
   - 補上新選單需要的 DOM 元素替身。
   - 注入一個**空的**假儲存（沒有既有存檔），讓流程走「新遊戲」，`createChapter` 的覆寫照舊生效。
   - 若新流程需要先在開始選單選「新遊戲」才會進到原本的狀態，可在 `runtime()` 回傳前或測試開頭加最少的操作，**目的只是到達與 6b 時相同的起始狀態**。
2. 這個檔案裡所有 `test(...)` 的 `assert` 一字不改；`ready()`、`pad()` 不改。
3. 其他既有測試檔一律不改。
4. 放在 ①紅燈 commit，說明寫「依監督者 R008-6c-d2 裁定，capture-input.test.js 的 runtime 架子補齊 6c 依賴」。回報時貼這個檔案的完整 diff。
5. 若補完架子後原本的斷言仍因 6c 的行為改變而失敗（不是架子問題），停下回 `NEED_DISCUSSION`。

另外提醒：這種「把 `main.js` 的 import 拿掉再注入」的架子很脆弱，之後每次 `main.js` 加 import 都會壞。本輪**不要**重構它；請在回報第 5 點「需要監督者登記的選擇」寫一句建議（例如之後抽成共用 helper），監督者再決定。

## 其餘照 `r008-build-6c.md`
範圍、重點、施工規則、回報格式全部照上一則。
