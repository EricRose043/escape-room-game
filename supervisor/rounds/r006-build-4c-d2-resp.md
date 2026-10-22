DONE

1. Commit 與 `npm test`：
   - `caa07f7`：93 通過、13 失敗（新增 12 項＋獲准遷移 1 項）。
   - `9dcd5be`：106/106 通過；實作未改測試。

   `tests/power-room.test.js` 完整 diff：

```diff
diff --git a/tests/power-room.test.js b/tests/power-room.test.js
index 23fbe55..c7ac4d4 100644
--- a/tests/power-room.test.js
+++ b/tests/power-room.test.js
@@ -73,8 +73,8 @@ test('未安裝保險絲時密碼鎖不可輸入或提交',()=>{
   const puzzle=POWER_ROOM.puzzles[0];
   assert.equal(logic.validatePuzzleCode(s,puzzle.id,puzzle.code),false);
   const powered=logic.updateChapter(atKeypad(install()),{interactPressed:true});
-  assert.equal(powered.ui.mode,'explore');
-  assert.equal(powered.ui.message,'控制器已通電');
+  assert.equal(powered.ui.mode,'keypad');
+  assert.equal(powered.ui.message,'');
   assert.equal(powered.puzzles[puzzle.id].restored,false);
 });
 test('正式隱藏碼只在紫外光有效照射時可見',()=>{
```

2. 修改檔案：
   - 測試：新增 `tests/{keypad,keypad-input,chapter-flow}.test.js`；最小調整 `tests/power-room.test.js`。
   - logic：`src/logic/{keypad,chapter,gamepad,index}.js`。
   - game：`src/game/{keypad-view,world-view,main}.js`。
   - 其他：`index.html`、`README.md`、`assets/CREDITS.md`、`PLANS.md`。

3. 監督者瀏覽器測試資訊：
   - 密碼鎖：站 `(3, 1.6, -5.2)`，朝東 `yaw=-π/2`，稍低頭 `pitch≈-0.133`。
   - 面板：`#keypad-screen`
   - 數字：`#keypad-grid [data-key="4"]`（替換數字）
   - 刪除／確認：`[data-key="delete"]`／`[data-key="submit"]`
   - 返回：`#keypad-back`
   - 輸入／訊息：`#keypad-buffer`／`#keypad-message`
   - 生產線門：X＝5～5.2、Z＝−7.4～−5.6；解鎖後到 `(3, 1.6, -6.5)` 朝東穿門，走到平台 `(6.5, 1.6, -6.5)`。末端牆 X＝7.2。

4. 需登記的選擇：無新增決策。供電採 0.6 秒單向亮度插值；正確提交當幀開門，重複互動不重播。

5. 未驗事項：瀏覽器、WebGL、實體手把與舊電腦效能。Node 實際主程式的事件／DOM 替身串接檢查通過。工作樹乾淨，未 push。