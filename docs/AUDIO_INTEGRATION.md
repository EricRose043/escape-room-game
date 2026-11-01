# S1 聲音模組交付與接入說明

最新 LOG-07：依使用者修復授權，S1 已在 PR #2 分支接入正式 main。Ryan createFactoryAudio／audioCueFor 保留，adapter 把事件、位移腳步、區域環境與距離心跳交給唯一 S1 引擎；main 的失焦／離頁清理已接上。main 分支仍待 owner 審查合併。下方初版 API 設計保留，實作位置依本段更新。

- S1 引擎現位於 `src/game/procedural-audio.js`；`src/game/audio.js` 仍 re-export createAudio，並提供 createFactoryAudio／audioCueFor。
- 引擎新增 playCue，保留 Ryan 電力、追逐、躲藏、被抓、開門、列車與逃離的原事件旋律，與環境／心跳共用 context、音量及聲部上限。
- 工廠主音量初值 0.32；獨立 createAudio 預設 0.35。S2 主音量介面仍待後續功能。
- S1 原測試移名 `tests/procedural-audio.test.js`，Ryan `tests/audio.test.js` 原斷言保留，新 `tests/audio-integration.test.js` 驗 adapter。200/200 通過；正式頁可開始／切靜音且 error/warn 空。真人聽感仍待驗。

## 已交付

- `src/logic/audio-mix.js`：`heartbeatIntensity(distance)`、`footstepInterval(speed)`、唯讀 `AUDIO_MIX`。
- `src/game/procedural-audio.js`：`createAudio()`，延後到使用者啟用才建立 AudioContext；只用原創 oscillator／noise buffer／gain／filter，不下載音效、不用 three.js。
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

## 初版接入設計（歷史；最新已接入狀態見頁首）

1. 直接 import `createAudio` 與兩個 mix 函式；不必為此修改 logic/index.js。建立一個 audio 實例。
2. 開始／繼續的使用者事件呼叫 unlock，失敗就顯示可重試提示；失敗不應阻擋遊戲。套用 S2 主音量／100。
3. 正常探索每幀用有效怪物距離求心跳；無活動怪物或暫停時為 0。按目前區域設定 ambience；重複傳同區域不重建。
4. 由玩家實際位置變化／dt 求速度，避免貼牆按鍵也出腳步。`footstepInterval(0)` 與無效速度回 Infinity，**不可直接把 Infinity 傳給 setTimeout**；停步或暫停時清除腳步累計。行走時用模擬時間累加，跨過間隔才播一次，不因長幀補播大量音效。
5. R1 謎題按錯時的警報事件呼叫 playAlarm；實際門狀態改變才 playDoor，避免站在門邊每幀觸發。
6. 暫停／失焦／被抓流程是否保留心跳由整合驗收決定；至少暫停與離頁須 stop／dispose，不讓背景持續出聲。恢復時更新環境與心跳。

音效初始參數：近距 2m 為最大心跳、14m 以上為零；步幅參數 1.3m，腳步間隔限制 0.18～1.2 秒。這些只供初版音效調整，不修改怪物發現範圍、玩家速度或驗收要求。

## 如何自行確認

依 README 啟動本機靜態 HTTP，再開 `/tools/audio-test.html`，按啟用後試聽每種聲音及音量／停止。原始 `npm test` 指令仍是 node --test；本環境以 `node --test` 執行 180 項通過。瀏覽器測量見 LOG-20261029-04，音色、舒適度、遊戲中事件同步與實體設備仍待人工／整合驗收。

## LOG-08 S2主音量已接入

createFactoryAudio新增setMasterVolume(0～1)，保存設定值，start／toggle不再把它重設為0.32；靜音旗標仍優先輸出0。main初次讀取與factory-settings-change皆套用volume／100。實體聽感待驗；adapter零音量、靜音往返與重新開始由integration-settings.test.js驗證。
