// 數的是完整軌道組數，每組由兩根鋼軌構成。
export const TRAIN_CARDS=Object.freeze([
  {id:'bay.traction-card',name:'牽引迴路檢修卡',reading:18,text:'牽引迴路｜電流讀數 18 A'},
  {id:'bay.brake-card',name:'制動迴路檢修卡',reading:12,text:'制動迴路｜電流讀數 12 A'},
  {id:'bay.lighting-card',name:'照明迴路檢修卡',reading:6,text:'照明迴路｜電流讀數 6 A'},
]);
export const TRAIN_CARD_IDS=Object.freeze(TRAIN_CARDS.map(card=>card.id));
export const TRAIN_CALIBRATION=6;
export const TRAIN_TRACK_COUNT=2;
export const TRAIN_RAIL_COUNT=TRAIN_TRACK_COUNT; // 保留舊匯入名稱。
export const TRAIN_CODE=String(TRAIN_TRACK_COUNT)+TRAIN_CARDS.map(card=>card.reading/TRAIN_CALIBRATION).sort((a,b)=>a-b).join('');
export const TRAIN_FORMULA='① 記錄牽引、制動、照明三卡\n② 三個讀數各 ÷ 6\n③ 結果由小到大排列\n④ 前面加上完整軌道組數\n（每組都有兩根鋼軌）\n⑤ 輸入四位碼，刷員工卡發車';
export function createTrainPuzzle(){return {readCardIds:[],solved:false};}
export function trainReady(state){return state.puzzles['power.main']?.restored===true
  && state.puzzles['production.sequence']?.restored===true
  && state.puzzles['exit.final']?.restored===true && state.corridor?.complete===true
  && state.inventory.itemIds.includes('lobby.employee-card')
  && TRAIN_CARD_IDS.every(id=>state.trainPuzzle?.readCardIds.includes(id));}
export function validateTrainCode(state,code){return trainReady(state)&&code===TRAIN_CODE;}
