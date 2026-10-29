# S1 聲音模組交付與接入說明

本輪僅新增模組與獨立試聽頁，不修改 `src/game/main.js`、`src/logic/index.js`、共用章節／怪物／世界資料。由 EricRose043 整合到正式遊戲後，另做實際遊戲驗收。

## 已交付

- `src/logic/audio-mix.js`：`heartbeatIntensity(distance)`、`footstepInterval(speed)`、唯讀 `AUDIO_MIX`。
- `src/game/audio.js`：`createAudio()`，延後到使用者啟用才建立 AudioContext；只用原創 oscillator／noise buffer／gain／filter，不下載音效、不用 three.js。
- `tools/audio-test.html`：獨立啟用、單次音效、連續步行、環境、遠近心跳、音量及停止；以 AnalyserNode 記錄訊號峰值，不取代人類聽感驗收。
- 新測試：`tests/audio-mix.test.js`、`tests/audio.test.js`。原有測試與主程式未改。

## 公開 API

| 方法 | 輸入與行為 |
|---|---|
| `unlock()` | 在開始／繼續的使用者操作回呼直接呼叫，回傳 Promise<boolean>。不支援或被拒絕回 false，不拋未處理錯誤。重複呼叫共用同一 context |
| `setMasterVolume(v)` | 0～1，超出夾住，無效值靜音；預設 0.35。S2 的 0～100 先除以 100。約 30ms 平滑調音量，穩定的 0 為靜音 |
| `playFootstep()` | 單次低通雜訊腳步；未解鎖或聲部達上限回 false |
| `setAmbience(areaId)` | lobby、power-room、production、chase-corridor、exit；相同區域不重建，null 停止環境聲；未知字串用 lobby 音色 |
| `setHeartbeat(intensity)` | 0～1；越大雙拍越強、間隔越短；0 立即取消計時及已排程雙拍。每幀重送同值不堆疊 |
| `playAlarm()`／`playDoor()` | 單次警報／門聲；只在實際事件發生時呼叫，不能每幀重播 |
| `stop()` | 暫停／失焦／選單時使用；停止全部效果及循環，保留 context 供後續恢復。會清除目標環境與心跳，恢復時須重新指定 |
| `dispose()` | 離頁或銷毀遊戲時清理節點與 timer，關閉 context；之後不可再 unlock |
| `getStatus()` | 僅供試聽／測試診斷：context 狀態、音量、環境、心跳強度及聲部數 |

## Eric 需要接上的位置（說明，並未修改 main）

1. 直接 import `createAudio` 與兩個 mix 函式；不必為此修改 logic/index.js。建立一個 audio 實例。
2. 開始／繼續的使用者事件呼叫 unlock，失敗就顯示可重試提示；失敗不應阻擋遊戲。套用 S2 主音量／100。
3. 正常探索每幀用有效怪物距離求心跳；無活動怪物或暫停時為 0。按目前區域設定 ambience；重複傳同區域不重建。
4. 由玩家實際位置變化／dt 求速度，避免貼牆按鍵也出腳步。`footstepInterval(0)` 與無效速度回 Infinity，**不可直接把 Infinity 傳給 setTimeout**；停步或暫停時清除腳步累計。行走時用模擬時間累加，跨過間隔才播一次，不因長幀補播大量音效。
5. R1 謎題按錯時的警報事件呼叫 playAlarm；實際門狀態改變才 playDoor，避免站在門邊每幀觸發。
6. 暫停／失焦／被抓流程是否保留心跳由整合驗收決定；至少暫停與離頁須 stop／dispose，不讓背景持續出聲。恢復時更新環境與心跳。

音效初始參數：近距 2m 為最大心跳、14m 以上為零；步幅參數 1.3m，腳步間隔限制 0.18～1.2 秒。這些只供初版音效調整，不修改怪物發現範圍、玩家速度或驗收要求。

## 如何自行確認

依 README 啟動本機靜態 HTTP，再開 `/tools/audio-test.html`，按啟用後試聽每種聲音及音量／停止。原始 `npm test` 指令仍是 node --test；本環境以 `node --test` 執行 180 項通過。瀏覽器測量見 LOG-20261029-04，音色、舒適度、遊戲中事件同步與實體設備仍待人工／整合驗收。
