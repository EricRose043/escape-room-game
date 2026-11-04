# 2026-11-05 報告交付版

使用者已同意公開網站、備份包、講稿及上傳所有試玩修改（S-D037）。以下為目前交付狀態，取代前輪本機暫緩通知。

## 立即使用

- 公開網站：[棉花糖工坊：閉館之後](https://shuoen-toy-factory-demo.breathtakingchair.chatgpt.site)。Sites版本2已原生回傳succeeded，維持public與原網址。
- 本機遊戲：http://127.0.0.1:8778/index.html ，更新頁面可按Ctrl+F5。
- 備份ZIP：專案同層的 `escape-room-demo-2026-11-05-final.zip`，約2.6MB，內含遊戲、引擎、啟動器、來源／授權、操作說明與報告講稿。
- 講稿：[3～4分鐘完整版、1分鐘短版及示範順序](PRESENTATION_SCRIPT.md)。ZIP另有可直接用記事本開啟的「報告介紹講稿.txt」。
- 程式與文書：[GitHub PR #6](https://github.com/EricRose043/escape-room-game/pull/6)。已上傳既有分支，仍由Eric審查合併main；公開示範站使用已核對的該分支內容。

## 備份怎麼開

1. 解壓縮整個ZIP，雙擊資料夾內的Play-EscapeRoom.cmd。
2. 需要先安裝Python 3與支援WebGL／ES module／importmap的桌面瀏覽器；此電腦已能找到Python及py。若按鈕啟動有問題，可在資料夾內執行 `py -3 play_escape_room.py`。
3. 勿直接以file://打開index.html。固定使用8778；經核對的舊遊戲服務會自動交接，其他未知服務不停止。

公開站和本機網址的存檔分開，換瀏覽器也不自動帶入。報告前請在要用的同一網址準備進度；備份內容與公開版遊戲相同，但不包含使用者的瀏覽器存檔。

## 本版內容與驗證

- 音量／腳步、原創驚嚇紋理、滑鼠平滑與解析度調節、近景細節及材質調整。
- UV未排序讀數、設備校正與接線、四色條件、出口跨區對照、列車早期校驗來源；原正確答案保留。
- 驚嚇後玩家原位與視角／進度保留，玩偶至少消失5秒有效遊玩時間，之後在合適位置恢復；走廊可繼續且不被已關門卡住。
- runtime c90483f，build **359cf85415ed4b20**；本機Node323/323、乾淨Windows323/323、啟動器Python8/8、出生點至END邏輯路線1/1。
- 最終ZIP CRC、解壓後80個執行資源HTTP200且位元一致、入口版本生成冪等均通過。原始素材來源、三人作者及Three.js MIT授權隨包。

尚未新增真人GPU／FPS與實體手把驗收；舊電腦依使用者要求暫緩。之前自動HTTP公開探測遇Cloudflare403／1010，這輪未重試或繞過；公開部署以Sites原生成功結果為準，不宣稱已替老師的現場網路測試。

GitHub Actions在本輪推送後明確回報「The job was not started because your account is locked due to a billing issue.」，Ubuntu與Windows工作均無執行步驟；本機通過不等於遠端CI通過。帳戶端限制尚未解除，未更改付款或Actions設定。此項已記在PR與測試紀錄。

版本、部署與ZIP雜湊見 [demo-site.json](demo-site.json) 及 [最終交付證據](evidence/2026-11-05/final-delivery/package.json)。
