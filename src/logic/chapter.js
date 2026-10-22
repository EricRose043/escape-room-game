import { WORLD, ITEMS, getGeometry } from './world.js';
import { createPlayer, updatePlayer } from './movement.js';
import { createFlashlight, updateEquipment } from './flashlight.js';
import { selectInteractionTarget } from './interaction.js';
import { getPuzzle } from './clues.js';

export const DEVICES = WORLD.areas.flatMap(area => area.devices);
export function isDevicePowered(state, device) {
  return Boolean(state.puzzles[device.puzzleId]?.installedItemId);
}
// 純判定，不提交、不開介面、不恢復主電力；4c 可沿用此入口。
export function validatePuzzleCode(state, puzzleId, code) {
  const puzzle = getPuzzle(puzzleId);
  return Boolean(puzzle && state.puzzles[puzzleId]?.installedItemId && code === puzzle.code);
}
export function selectChapterTarget(state) {
  return selectInteractionTarget(state.player,state.inventory,ITEMS,DEVICES,getGeometry(state).occluderBoxes);
}
export function deviceMessage(state, device) {
  if (device.kind === 'keypad') return isDevicePowered(state,device) ? '控制器已通電' : '控制器未通電';
  if (isDevicePowered(state,device)) return '備援控制已接通';
  return state.inventory.itemIds.includes(device.acceptsItemId) ? '安裝保險絲' : '缺少保險絲';
}

export function createChapter() {
  return {player:createPlayer(WORLD.spawn),inventory:{itemIds:[]},flashlight:createFlashlight(),
    puzzles:Object.fromEntries(WORLD.areas.flatMap(a=>a.puzzles).map(p=>[p.id,{installedItemId:null,restored:false}])),
    ui:{mode:'explore'}};
}
export function hasFlashlight(state) {
  return ITEMS.some(i=>i.kind==='flashlight' && state.inventory.itemIds.includes(i.id));
}
export function updateChapter(state,actions={},dt=0) {
  const geometry=getGeometry(state);
  const player=updatePlayer(state.player,actions,dt,geometry.collisionBoxes);
  // 電量規則維持獨立可測；持有規則只由關卡的取得紀錄推導。
  const equipmentActions=hasFlashlight(state)?actions:{...actions,flashlightPressed:false,uvPressed:false};
  const target = selectChapterTarget({...state,player});
  const isDevice = Boolean(target?.bounds);
  // 設備與物品一次只執行最近的同一個目標；補電繼續沿用既有撿取結果。
  const next=updateEquipment(state,player,{...equipmentActions,interactPressed:actions.interactPressed && !isDevice},dt,ITEMS,geometry.occluderBoxes);
  const result = {...next,player};
  if (!isDevice || !actions.interactPressed || player.paused || actions.gameplayActive === false
    || actions.focusLost || actions.forcePause || actions.pausePressed) return result;
  if (target.kind === 'fuseBox' && !isDevicePowered(result,target)
    && result.inventory.itemIds.includes(target.acceptsItemId)
    && !Object.values(result.puzzles).some(puzzle => puzzle.installedItemId === target.acceptsItemId)) {
    result.puzzles = {...result.puzzles,[target.puzzleId]:{...result.puzzles[target.puzzleId],installedItemId:target.acceptsItemId}};
  }
  return {...result,ui:{...result.ui,message:deviceMessage(result,target)}};
}
