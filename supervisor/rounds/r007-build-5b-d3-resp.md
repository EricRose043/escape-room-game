DONE

1. **Commit／`npm test`**
   - ① `e680232`：121 通過／16 失敗。
   - ①b `8f597f3`：121 通過／16 失敗；已先暫存實作，只提交通行測試。
   - ② `17407e1`：**137/137 通過**，未修改測試。

2. **變更檔案**
   - `src/logic/`：`areas/production.js`、`monster-vision.js`、`monster.js`、`chapter.js`、`index.js`
   - `src/game/`：`monster-view.js`、`main.js`；另有 `index.html`
   - `tests/`：`monster-vision.test.js`、`monster-chase.test.js`、`monster-patrol.test.js`、`production.test.js`
   - `README.md`、`assets/CREDITS.md`、`PLANS.md`

3. **監督者重現資訊**

   每例重新開始；從首次進場計時，入口為 `(8.2,-6.5)`，以下 Y 均為 `1.6`。時間是 Node 模擬值，實玩容許幾秒差異。

   | 情境 | 做法 |
   |---|---|
   | 前方被發現 | 入口不動、朝東南看。約 **15.7 秒**，怪物沿南側向西至 `(13.5,-2)`，開始低頭抬臂追逐。 |
   | 背後不發現 | 立即走 `(10,-6.5)` → `(10,-10.3)` → `(18.5,-10.3)` → `(18.5,-11)`，朝南。約第 **6～9 秒**，牠沿東側向南巡邏，玩家在背後。 |
   | 機台擋視線 | 立即走 `(10,-6.5)` → `(10,-10.3)` → `(14.2,-10.3)` → `(14.2,-8.5)`。約 **24.3 秒**，牠在 `(10,-5.5)` 朝北；玩家在視角與距離內，但機台 A 遮擋，仍保持巡邏。 |
   | 追丟後搜尋返回 | 第一例等到第 **17 秒**，走 `(10,-6.5)` → `(10,-10.3)` → `(14.2,-10.3)` → `(14.2,-5.5)` 停留。約 **20.7 秒搜尋、24.7 秒返回、27.1 秒恢復巡邏**。朝北看，約 **33 秒**可見正常巡邏姿態橫過北側空隙。 |

4. **請登記的實作選擇**：搜尋原地察看為 60°/s；貼牆目標的導航終點投影到安全位置，`lastSeen` 保留原值；接觸提示顯示 0.8 秒。

5. **驗證與未完成**：Node 主程式串接及上述路線通過。瀏覽器／WebGL、實體手把、舊電腦 FPS 未驗；躲藏與被抓留後續步驟。工作樹乾淨，未 amend、未 push，禁止文件未改。

6. **相對於 `5e04757` 的完整測試 diff**

```diff
diff --git a/tests/monster-patrol.test.js b/tests/monster-patrol.test.js
index fc8e82b..a67cfcc 100644
--- a/tests/monster-patrol.test.js
+++ b/tests/monster-patrol.test.js
@@ -29,6 +29,8 @@ test('首次進入生產線才啟動怪物，離區不重置且活動限區內',
 test('巡邏按 B C D A B 固定順序完成兩圈並每點停一秒', () => {
   assert.ok(area());
   let s=inside(),visited=[],lastWait=monster(s).waitRemaining;
+  // 5b 起怪物會發現玩家；本測試驗證無干擾巡邏，把玩家移到電力室內（隔整面牆，結構上看不到）。
+  s={...s,player:{...s.player,x:0,z:-4}};
   assert.deepEqual(def().patrol,['production.nav.B','production.nav.C','production.nav.D','production.nav.A']);
   assert.equal(def().patrolSpeed,1); assert.equal(def().dwellSeconds,1); assert.equal(def().turnSpeed,Math.PI);
   let elapsed=0,arrivals=[];
diff --git a/tests/production.test.js b/tests/production.test.js
index 20600e0..eb1f042 100644
--- a/tests/production.test.js
+++ b/tests/production.test.js
@@ -8,12 +8,12 @@ function state(power = true) {
   return {...s, player:{...s.player,paused:false}, inventory:{itemIds:['lobby.flashlight']},
     puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:power}}};
 }
-function walk(s, x, z) {
+function walk(s, x, z, update = logic.updateChapter) {
   for (let i=0;i<500;i++) {
     const dx=x-s.player.x,dz=z-s.player.z,distance=Math.hypot(dx,dz);
     if (distance<1e-7) return s;
     const yaw=Math.atan2(-dx,-dz);
-    const next=logic.updateChapter(s,{look:{dYaw:yaw-s.player.yaw},move:{y:1}},Math.min(0.1,distance/logic.WALK_SPEED));
+    const next=update(s,{look:{dYaw:yaw-s.player.yaw},move:{y:1}},Math.min(0.1,distance/logic.WALK_SPEED));
     if (Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)<1e-9) return next;
     s=next;
   }
@@ -72,7 +72,7 @@ test('新區牆機台與櫃體阻擋移動，必要通道可通行', () => {
   }
   let s=state(); s.player={...s.player,x:8.2,z:-6.5};
   for (const [x,z] of [[10,-6.5],[10,-10.3],[18.5,-10.3],[18.5,-2],[14.2,-2],[14.2,-10.3],[10,-10.3],[10,-1.2],[8.5,-1.2]]) {
-    s=walk(s,x,z); assert.ok(Math.hypot(s.player.x-x,s.player.z-z)<1e-7,`${x},${z}`);
+    s=walk(s,x,z,(state,actions,dt)=>({...state,player:logic.updatePlayer(state.player,actions,dt,logic.getGeometry(state).collisionBoxes)})); assert.ok(Math.hypot(s.player.x-x,s.player.z-z)<1e-7,`${x},${z}`);
     assert.ok(!boxes.some(b=>logic.circleOverlapsBox(s.player.x,s.player.z,b,logic.PLAYER_RADIUS)));
   }
 });
```