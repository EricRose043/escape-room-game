NEED_DISCUSSION

出現另一項既有測試衝突，已依「既有測試衝突就停下」停止，未修改該測試。

1. **commit／測試**
   - ① `e680232`：紅燈，**121 通過／16 失敗**。
   - ② 尚未提交。目前 **136/137 通過**；16 項新測試全部通過。

2. **衝突證據**

   `tests/production.test.js:75` 要玩家走到 `(18.5,-2)`，當時怪物正好停在同一點。玩家停在 `(18.5,-2.65)`，中心距離 **0.65 m**，符合兩者身體半徑之和。讓測試抵達終點會違反「玩家不能穿過怪物」。

   只用 `updatePlayer` 與場地碰撞重播，原本九段路線全部可通行。

3. **請監督者裁定**

   建議讓這項「場地通行」測試改用 `updatePlayer`，隔離怪物 AI，保留全部路線與斷言。最小調整為：`walk` helper 增加更新函式參數、預設仍用 `updateChapter`，只有這項測試傳入純場地移動。

   若同意，請一併允許 **amend ① `e680232`** 納入此例外，以維持兩個 commit，且②不改測試。

4. **已獲准的巡邏測試 diff**

   ```diff
    let s=inside(),visited=[],lastWait=monster(s).waitRemaining;
   +// 5b 起怪物會發現玩家；本測試驗證無干擾巡邏，把玩家移到電力室內（隔整面牆，結構上看不到）。
   +s={...s,player:{...s.player,x:0,z:-4}};
   ```

5. **目前變更與未完成**

   已提交三個測試檔：`monster-vision.test.js`、`monster-chase.test.js`、`monster-patrol.test.js`。

   尚未提交：`production.js`、`monster-vision.js`、`monster.js`、`chapter.js`、`index.js`。畫面狀態、接觸回饋、文件與瀏覽器重現資訊尚未完成；禁止文件未改，未 push。