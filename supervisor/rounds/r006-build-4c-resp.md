NEED_DISCUSSION

4b 留下的測試與 4c 需求衝突：[tests/power-room.test.js:75](/Users/linshixuan/Desktop/vibe%20coding%20通識/密室逃脫遊戲/tests/power-room.test.js:75) 對已通電密碼鎖送出 `interactPressed`，第 76 行要求仍為 `explore`；4c 則要求進入 `keypad`。

建議監督者允許在①紅燈 commit 中，僅將這段已通電情境更新為開啟介面的期望；未通電限制與其他既有斷言保持原樣。

依本則「既有測試一律不改」及 d1 停止條件，目前已停下，未修改檔案、未建立 commit。請確認是否允許這項最小測試遷移。