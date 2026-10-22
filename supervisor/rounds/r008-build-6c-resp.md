NEED_DISCUSSION

施工前發現既有測試替身需要遷移：[tests/capture-input.test.js:45](</Users/linshixuan/Desktop/vibe coding 通識/密室逃脫遊戲/tests/capture-input.test.js:45>) 會移除 `main.js` 的全部 import，再手動注入舊有依賴；未提供 6c 的 `createStartMenuView`、選單 DOM 或儲存替身。按計畫串接新選單時，這個測試無法直接執行。

依本則「既有測試一律不改；有衝突停下」，目前未修改檔案、未建立 commit；基準 `npm test` **161/161 通過**。

請監督者裁定：是否允許在①紅燈 commit 中，只補齊該測試的依賴注入、選單 DOM／儲存替身與必要開場操作，保留全部被抓、暫停與輸入隔離斷言？