CONSENSUS

2. 修改：新增 `items.js`、`interaction.js`、兩個互動測試檔及 `assets/CREDITS.md`；修改 `gamepad.js`、`level.js`、logic 入口、`main.js`、`index.html`、README、PLANS。既有測試及禁止修改的檔案未動。

3. 紅燈：既有 36 項通過、新增 17 項失敗。實作後 `npm test` **53/53 通過**；另通過主程式 Node 模擬整合驗證。實作 commit 未修改測試。

4. Commit：
   - `dea99fc`：紅燈測試。
   - `e2c97b6`：實作與文件。

5. 需要監督者登記的選擇：
   - 中央射線命中共用 AABB；物品三邊至少 0.25 m。
   - 距離量至首次命中表面，含 2 m；障礙物同距離算遮擋。
   - 開始／繼續當幀消耗互動，不順便撿取。

6. 未完成：內建瀏覽器不可用，Chrome 電腦操作未獲准，故瀏覽器畫面、Pointer Lock 與實體手把仍待驗。PLANS 已勾選並明註待驗，README 附清單。工作樹乾淨，未 push。