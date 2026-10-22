NEED_DISCUSSION

發現既有測試與 5b 規則衝突，已依本輪停止條件停下。**尚未修改檔案或新增 commit**；基準 `npm test` 為 **121/121 通過**。

[tests/monster-patrol.test.js:31](</Users/linshixuan/Desktop/vibe coding 通識/密室逃脫遊戲/tests/monster-patrol.test.js:31>) 的兩圈巡邏測試，把玩家固定留在入口 `(8.2,-6.5)`，卻要求怪物持續巡邏兩圈。重播現有巡邏並套用採認的視覺規則：約進場 **16 秒**，怪物沿南側向西走時，玩家距離約 **7 m**、偏角約 **40°**、中間無遮擋，5b 必須立即追逐，因此無法維持原測試的速度與兩圈斷言。

請監督者裁定：僅在這項測試啟動怪物後，把玩家退回平台，保留全部既有斷言：

```diff
 let s=inside(),visited=[],lastWait=monster(s).waitRemaining;
+ s={...s,player:{...s.player,x:6.5,z:-6.5}};
```

若採認，請將此檔與單行例外加入 5b 白名單，併入①紅燈 commit。5b 實作及瀏覽器重現資訊尚未產生；工作樹乾淨，未 push。