模型：gpt-6.1-sol
思考度：medium

# R003｜計畫討論第 2 次＋共識即施工：STEP 1b「手把」

一律以繁體中文回覆；程式碼、檔名、指令照原樣。

## 監督者審查你的 d1 計畫
採認：目標、徑向死區 0.18＋重新映射＋`x^1.5` 曲線、標準映射軸／按鈕索引（W3C）、非 standard 採「忽略並提示、鍵鼠照常」、A／✕ 開始、Start／Options 暫停與繼續、拔掉「目前在用的」手把才暫停、手把模式不要 Pointer Lock、切回滑鼠時提示「點一下畫面以啟用滑鼠轉頭」、開始畫面失焦標題修正、檔案白名單、實機清單草稿、施工 1 回。出處列得很好。

以下兩點要改：

1. **廠商編號只認「廠商欄位」，不在整串 id 裡找子字串**
   - 理由：產品編號或名稱裡也可能出現 `045e`／`054c` 這幾個字元，整串比對會誤判。
   - 做法：解析常見格式的廠商欄位，例如 Chrome 系的 `… (STANDARD GAMEPAD Vendor: 054c Product: 09cc)`、Firefox 的 `054c-09cc-…` 開頭；解析不到廠商欄位時才看名稱關鍵字。
   - 測試要用真實格式的字串，至少包含：PS4 在 Chrome 顯示成 `Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)`（名稱裡沒有 Sony，要靠廠商欄位認出來）、Xbox 在 Chrome 與 Firefox 各一種格式、一個「產品編號剛好含 045e 但廠商不是 045e」的反例要認成 unknown。

2. **動作兩邊都收，只有「提示文字」跟著最後的裝置**
   - 你提的「每幀只採用目前來源」在滑鼠和搖桿同時動時，來源會一幀一幀來回切，提示文字閃爍，反而違反 VERIFY STEP 1b「不可以：手把和滑鼠同時動時畫面亂跳」。
   - 改成：`move` 由鍵盤與左搖桿相加後長度夾在 1 以內（同時推不會變快）；`look` 照 R002 的設計，滑鼠 `dYaw/dPitch` 加上右搖桿 `yawRate/pitchRate`（兩者本來就分開計算，不會互相放大）。
   - 「最後使用的裝置」只決定提示文字與拔除時要不要暫停；切換要有至少 **0.5 秒**的停留時間才可再切，避免閃爍。死區內的雜訊照你說的不算輸入。
   - 對應測試改成：`鍵盤與左搖桿同時推時移動速度不超過單一來源`、`提示裝置切換後 0.5 秒內不會再切回`；刪掉 `手把來源作用時不會混入鍵鼠移動與轉頭`。

## 共識確認
- 同意以上兩點：回覆**第一行寫 `CONSENSUS`**，然後直接施工。
- 有任何一點不同意：第一行寫 `NEED_DISCUSSION`，只回理由與替代做法，**不施工**。

## 施工規則（照 AGENTS.md）
- TDD：先寫測試 → `npm test` 確認失敗 → commit；再寫程式 → 全部通過 → commit；`PLANS.md` 勾 STEP 1b（併入第二個 commit）。
- 白名單照你 d1 列的 7 個檔案。STEP 1 的 `tests/movement.test.js` 不得修改（新測試放 `tests/gamepad.test.js`）。
- 不改 `BRIEF.md`、`VERIFY.md`、`AGENTS.md`、`CLAUDE.md`、`DECISIONS.md`、`supervisor/`。不新增套件。不 push。
- commit 說明用繁體中文，結尾加 `Co-Authored-By: Codex <noreply@openai.com>`。
- 不做互動、手電筒（對照表可以先建）。手把震動不做。

## 回報格式（短）
1. 第一行 `CONSENSUS` 或 `NEED_DISCUSSION`
2. 改了哪些檔案
3. 紅燈證據、綠燈結果（通過數）
4. 兩個 commit 編號
5. 沒做到或不確定的事
