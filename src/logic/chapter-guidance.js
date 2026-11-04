import {EXIT_CODE_CLUES} from './puzzles/exit-code.js';
import {TRAIN_CARDS,TRAIN_CARD_IDS,TRAIN_FORMULA} from './puzzles/train-code.js';
export function chapterObjective(s){const has=id=>s.inventory.itemIds.includes(id);
 if(s.ui.mode==='complete')return '列車在舊線脫軌……第一章完。收藏地圖已解鎖。';
 if(s.ui.mode==='ending')return '員工撤離列車已發車。';
 if(s.ui.mode==='caught')return s.ui.stayInPlace?'牠就在眼前。驚嚇後你仍留在原地；玩偶會暫時消失。':'牠已發現你，無法逃脫。抓捕演出後將回到最近的存檔點。';
 if(!has('lobby.flashlight')||!has('lobby.employee-card'))return '先在辦公室取得手電筒、地圖與員工卡。';
 if(!s.puzzles['power.main'].installedItemId)return '在控制室找保險絲，安裝到東牆電箱。';
 if(!s.puzzles['power.main'].restored)return '用紫外光讀檢修碼，再輸入電箱旁的密碼鎖。';
 if(!s.puzzles['production.sequence'].restored)return '避開玩偶視線，找到裝配線檢修碼並操作東側控制器；被看見就會被抓。';
 if(!s.puzzles['production.color-sequence']?.restored)return '避開玩偶視線，依東牆燈序操作四色按鈕；按錯會警報引怪。';
 if(!s.foundClueIds?.includes('corridor.color-key'))return '在追逐走廊入口閱讀金色維修卡，再通過隔離門。';
 if(s.corridor?.active)return '持續前進！先向東，左轉向北，再右轉向東到出口控制廳。';
 if(!s.corridor?.complete)return '已記錄兩條線索，準備通過追逐走廊。';
 if(!s.foundClueIds?.includes('exit.reverse-clue'))return '在出口控制廳閱讀金色提示，記錄最後一條線索。';
 if(!s.puzzles['exit.final']?.restored)return '將燈序、維修對照與出口規則組合成四位密碼；地圖可回看線索。';
 if(s.trainStarted)return '登上大型玩具列車，離開工坊！';
 if(!TRAIN_CARD_IDS.every(id=>s.trainPuzzle?.readCardIds.includes(id)))return `在月台北牆閱讀三張迴路檢修卡（${s.trainPuzzle?.readCardIds.length??0}/3）；地圖可回看記錄。`;
 return '依月台檢修規則：讀數除以 6、由小到大排列，前面加上完整軌道組數（每組兩根鋼軌）；到控制台輸入四位發車碼。';
}
export function factoryMapText(s,complete=false){return ['辦公室 → 控制室 → 裝配線 → 追逐走廊 → 出口控制廳 → 列車月台',
 '                          東 → 北 → 東（兩次轉彎）',
 complete?'收藏版：監視紀錄、避難櫃、復位控制台與三條線索已標記。':'底圖：請留意監視紀錄、機台與緊急避難櫃。',
 '', '已記錄的出口線索：',...EXIT_CODE_CLUES.filter(c=>s.foundClueIds?.includes(c.id)).map(c=>`• ${c.text}`),
 '',`列車檢修卡 ${s.trainPuzzle?.readCardIds.length??0}/3：`,...TRAIN_CARDS.filter(c=>s.trainPuzzle?.readCardIds.includes(c.id)).map(c=>`• ${c.text}`),
 ...(s.trainPuzzle?.readCardIds.length?[TRAIN_FORMULA]:[])].join('\n');}
