DONE

- ① `28fe782`：`npm test` **152 通過／9 失敗**（8 項新測試＋核准遷移）。
- ② `54d42b1`：`npm test` **161/161 通過**；未修改測試。
- 新增：`src/logic/capture.js`、`src/game/capture-view.js`、`tools/capture-preview.html`、三個 `tests/capture*.test.js`。修改：`chapter.js`、`logic/index.js`、`main.js`、`index.html`、`monster-chase.test.js`、`README.md`、`PLANS.md`、`assets/CREDITS.md`。
- 瀏覽器驗收：解鎖後站在 **`(8.2,1.6,-6.5)`、`yaw≈-2.27`** 等待；Node 正式路線約 **19.02 秒**被抓，再經 **1.20 秒**回到 **`(6.5,1.6,-6.5)`、`yaw=-π/2`、`pitch=0`**。一般網址只有黑畫面；加 `?jumpscare=1` 驗近景。直接開 `/tools/capture-preview.html` 可播放兩分支、暫停及立即關閉近景。
- 待登記選擇：無，依 D014 與本則授權實作。
- 未驗：瀏覽器外觀、實體手把、FPS；6c 尚未施工。工作樹乾淨，未 push。

`monster-chase.test.js` 完整 diff：

```diff
diff --git a/tests/monster-chase.test.js b/tests/monster-chase.test.js
index 90eb210..c7aeaca 100644
--- a/tests/monster-chase.test.js
+++ b/tests/monster-chase.test.js
@@ -78,20 +78,24 @@ test('接觸只發一次事件且不重疊，離開後可再次接觸', () => {
   assert.equal(events.length,2);assert.equal(m.contactCount,2);
   assert.equal(d.contactDistance,0.8);assert.equal(d.contactResetDistance,1);
 });
-test('玩家不能穿過怪物身體，接觸不推人不扣物品不暫停不重生', () => {
+test('玩家不能穿過怪物身體，接觸觸發被抓並保留進度', () => {
   let s=chapter(active(),player(18.5,-9)),events=[];
   const inventory=structuredClone(s.inventory),puzzles=structuredClone(s.puzzles);
   for(let i=0;i<25;i++) {
     s=logic.updateChapter(s,{move:{y:1}},0.1);events.push(...s.events);
     assert.ok(distance(s.player,s.monsters[id])>=logic.PLAYER_RADIUS+d.radius-1e-8);
-    assert.equal(s.player.paused,false);assert.equal(s.ui.mode,'explore');
+    assert.equal(s.player.paused,false);
+    if(s.events.some(event=>event.type==='contact')) {assert.equal(s.ui.mode,'caught');break;}
+    assert.equal(s.ui.mode,'explore');
   }
   assert.equal(events.length,1);assert.deepEqual(s.inventory,inventory);
   assert.equal(s.puzzles['power.main'].restored,puzzles['power.main'].restored);
-  assert.ok(s.player.x>18 && s.player.z<-8,'沒有送回出生點');
+  for(let i=0;i<12;i++) s=logic.updateChapter(s,{},0.1);
+  assert.equal(s.ui.mode,'explore');
+  assert.equal(s.player.x,6.5);assert.equal(s.player.z,-6.5);assert.equal(s.player.yaw,-Math.PI/2);
   const before=structuredClone(s.player);
   s=logic.updateChapter(s,{},0.1);assert.deepEqual(s.player,before,'怪物不能推動玩家');
-  s=logic.updateChapter(s,{move:{y:-1}},0.1);assert.ok(s.player.z>before.z,'仍能自行離開');
+  s=logic.updateChapter(s,{move:{y:-1}},0.1);assert.ok(s.player.x<before.x,'仍能自行離開');
 });
 test('接觸 0.8 m 含邊界，未到 1.0 m 不重置', () => {
   let m=step(active(),player(18.5,-9.5));assert.equal(m.events.length,1);
```