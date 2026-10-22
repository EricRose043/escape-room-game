NEED_DISCUSSION

1. **測試與 commit**
   - ① `e7ce51e`：新增 8 項測試；`npm test`：137 通過、8 失敗。
   - ② 尚未提交。部分實作後：143 通過、2 失敗，已停止。

2. **既有測試衝突**
   [tests/production.test.js:98](/Users/linshixuan/Desktop/vibe%20coding%20通識/密室逃脫遊戲/tests/production.test.js:98) 要求櫃前目標為 `null`；第 100 行要求互動後維持 `explore`，均與 5c 衝突。既有測試未修改。

3. **檔案**
   - 已提交：`tests/{hiding,hiding-input,monster-flow}.test.js`
   - 未提交：`src/logic/{hiding,chapter,monster,index}.js`、`src/logic/areas/production.js`
   - 畫面與 `PLANS.md` 尚未修改。

4. **監督者測試資訊**
   站位維持 d1：L1 `(8.5,1.6,-1.2)`、L2 `(19.5,1.6,-10.3)`，均 `yaw=0`。入口到 L1 路線不變；完整時間軸尚未驗定。

5. **請裁定**
   是否允許最小遷移上述測試，改驗證櫃子目標與 `hiding`，保留物品、密碼、背包及光源斷言，並修訂①測試 commit，以維持兩個 commit？

6. **未完成**
   另一失敗是新測試抓到大幅轉頭時角度繞回的實作問題，尚未修正。瀏覽器未操作、未 push。