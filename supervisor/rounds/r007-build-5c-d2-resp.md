DONE

1. **Commit 與 `npm test`**
   - ① `e7ce51e`：137 通過、8 失敗。
   - ①b `1427f22`：136 通過、9 失敗；僅含核准的測試修改，未 amend。
   - ② `f791188`：145/145 通過，未改任何測試檔。Node 主程式替身串接亦通過；工作樹乾淨，未 push。

2. **變更檔案**

   測試：`tests/hiding.test.js`、`tests/hiding-input.test.js`、`tests/monster-flow.test.js`、`tests/production.test.js`。  
   實作：`src/logic/hiding.js`、`chapter.js`、`monster.js`、`index.js`、`areas/production.js`；`src/game/main.js`、`world-view.js`；`index.html`。  
   文件：`PLANS.md`、`README.md`、`assets/CREDITS.md`。已勾選 STEP 5、5c，註明瀏覽器未驗。

3. **監督者瀏覽器測試資訊**

   | 櫃子 | 最終進櫃站位與朝向 |
   |---|---|
   | L1 | `(8.5,1.6,-1.2)`，`yaw=0`、`pitch=0` |
   | L2 | `(19.5,1.6,-10.3)`，`yaw=0`、`pitch=0` |

   首次進區立即走：`(8.2,-6.5)` → `(10,-6.5)` → `(10,-1.2)` → `(8.5,-1.2)`，到 L1 朝北後才等待發現。

   **Node 模擬時間軸**：入口起約 3.5 秒抵達 L1；12.4 秒被發現後立即進櫃，怪物當幀切搜尋；進櫃約 4 秒後開始返回、6.5 秒後恢復巡邏並出櫃。實玩時間容許差異；出口占用時應留櫃提示，安全後重試。

4. **需監督者登記**

   薄板厚 `0.025 m`；窺視縫寬 `0.6 m`、高 `0.12 m`，中心眼高 `1.6 m`。進出同時檢查整段路徑與門口身體間距。

5. **未驗項目**

   瀏覽器／WebGL 外觀、實體手把及舊電腦 FPS 未驗；未操作瀏覽器或電腦控制工具。大幅轉頭繞回問題已修正，原測試保留。

6. **`tests/production.test.js` 相對 `9b5e33c` 的完整 diff**

```diff
diff --git a/tests/production.test.js b/tests/production.test.js
index eb1f042..de764cd 100644
--- a/tests/production.test.js
+++ b/tests/production.test.js
@@ -90,14 +90,16 @@ test('下一區門保持關閉且同時阻擋移動與視線', () => {
   const ray={origin:{x:20,y:1.6,z:-6.5},direction:{x:1,y:0,z:0}};
   assert.ok(logic.rayBoxDistance(ray,door.bounds)<1.3);
 });
-test('5a 不新增物品密碼或櫃子互動，照明沿用兩盞固定池', () => {
+test('5a～5c 不新增物品與密碼；櫃子可進入躲藏，照明沿用兩盞固定池', () => {
   const p=area(); assert.ok(p);
   assert.equal(logic.ITEMS.length,4);
   assert.equal(logic.WORLD.areas.flatMap(a=>a.puzzles).filter(p=>p.code).length,1);
   let s=state(); s.player={...s.player,x:8.5,z:-1.2,yaw:0,pitch:0};
-  assert.equal(logic.selectChapterTarget(s),null);
+  const locker=p.devices.find(d=>d.id==='production.locker-l1');
+  const target=logic.selectChapterTarget(s);
+  assert.equal(target?.id,locker.id); assert.equal(target?.kind,'locker');
   const next=logic.updateChapter(s,{interactPressed:true},0.1);
-  assert.equal(next.ui.mode,'explore'); assert.deepEqual(next.inventory,s.inventory);
+  assert.equal(next.ui.mode,'hiding'); assert.deepEqual(next.inventory,s.inventory);
   const lights=logic.getActiveLights(s.player);
   assert.ok(lights.length<=2); assert.equal(lights[0].id,p.lights[0].id);
 });
```