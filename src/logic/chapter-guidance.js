import {EXIT_CODE_CLUES} from './puzzles/exit-code.js';
export function chapterObjective(s){const has=id=>s.inventory.itemIds.includes(id);
 if(s.ui.mode==='complete')return '已逃出工坊，收藏地圖已解鎖。';
 if(!has('lobby.flashlight')||!has('lobby.employee-card'))return '先在辦公室取得手電筒、地圖與員工卡。';
 if(!s.puzzles['power.main'].installedItemId)return '在控制室找保險絲，安裝到東牆電箱。';
 if(!s.puzzles['power.main'].restored)return '用紫外光讀檢修碼，再輸入電箱旁的密碼鎖。';
 if(!s.puzzles['production.sequence'].restored)return '找到裝配線檢修碼，輸入東側貨運門控制器。';
 if(!s.puzzles['production.color-sequence']?.restored)return '依東牆燈序操作四色復位按鈕；按錯會警報引怪。';
 if(!s.foundClueIds?.includes('corridor.color-key'))return '在追逐走廊入口閱讀金色維修卡，再通過隔離門。';
 if(s.corridor?.active)return '持續前進！先向東，左轉向北，再右轉向東到出口控制廳。';
 if(!s.corridor?.complete)return '已記錄兩條線索，準備通過追逐走廊。';
 if(!s.foundClueIds?.includes('exit.reverse-clue'))return '在出口控制廳閱讀金色提示，記錄最後一條線索。';
 if(!s.puzzles['exit.final']?.restored)return '將燈序、維修對照與出口規則組合成四位密碼；地圖可回看線索。';
 return s.trainStarted?'登上大型玩具列車，離開工坊！':'到月台刷員工卡啟動列車。';
}
export function factoryMapText(s,complete=false){return ['辦公室 → 控制室 → 裝配線 → 追逐走廊 → 出口控制廳 → 列車月台',
 '                          東 → 北 → 東（兩次轉彎）',
 complete?'收藏版：監視紀錄、避難櫃、復位控制台與三條線索已標記。':'底圖：請留意監視紀錄、機台與緊急避難櫃。',
 '', '已記錄的出口線索：',...EXIT_CODE_CLUES.filter(c=>s.foundClueIds?.includes(c.id)).map(c=>`• ${c.text}`)].join('\n');}
