import { WORLD, ITEMS, getGeometry } from './world.js';
import { createPlayer, updatePlayer } from './movement.js';
import { createFlashlight, updateEquipment } from './flashlight.js';
import { selectInteractionTarget } from './interaction.js';
import { getPuzzle } from './clues.js';
import { createKeypad, updateKeypad, resolveKeypadCommand } from './keypad.js';
import { createMonster, updateMonster } from './monster.js';

export const DEVICES = WORLD.areas.flatMap(area => area.devices);
export const MONSTERS = WORLD.areas.flatMap(area => area.monsters ?? []);
export function isDevicePowered(state, device) {
  return Boolean(state.puzzles[device.puzzleId]?.installedItemId);
}
// 顯示與提交驗證共用唯一謎題資料；提交時仍再次檢查安裝狀態。
export function validatePuzzleCode(state, puzzleId, code) {
  const puzzle = getPuzzle(puzzleId);
  return Boolean(puzzle && state.puzzles[puzzleId]?.installedItemId && code === puzzle.code);
}
export function selectChapterTarget(state) {
  return selectInteractionTarget(state.player,state.inventory,ITEMS,DEVICES.filter(d=>d.kind!=='locker'),getGeometry(state).occluderBoxes);
}
export function deviceMessage(state, device) {
  if (state.puzzles[device.puzzleId]?.restored) return '主電力已恢復';
  if (device.kind === 'keypad') return isDevicePowered(state,device) ? '控制器已通電' : '控制器未通電';
  if (isDevicePowered(state,device)) return '備援控制已接通';
  return state.inventory.itemIds.includes(device.acceptsItemId) ? '安裝保險絲' : '缺少保險絲';
}

export function createChapter() {
  return {player:createPlayer(WORLD.spawn),inventory:{itemIds:[]},flashlight:createFlashlight(),
    puzzles:Object.fromEntries(WORLD.areas.flatMap(a=>a.puzzles).map(p=>[p.id,{installedItemId:null,restored:false}])),
    monsters:Object.fromEntries(MONSTERS.map(m=>[m.id,createMonster(m)])),
    ui:{mode:'explore'}};
}
export function hasFlashlight(state) {
  return ITEMS.some(i=>i.kind==='flashlight' && state.inventory.itemIds.includes(i.id));
}
export const POWER_TRANSITION_SECONDS = 0.6;
export function powerProgress(state, puzzleId) {
  const puzzle=state.puzzles[puzzleId];
  return puzzle?.restored ? Math.min(1,(puzzle.restoreElapsed ?? 0)/POWER_TRANSITION_SECONDS) : 0;
}
function advancePower(state, dt) {
  const seconds=Number.isFinite(dt) && dt>0 ? dt : 0;
  const puzzles=Object.fromEntries(Object.entries(state.puzzles).map(([id,puzzle])=>[id,
    puzzle.restored ? {...puzzle,restoreElapsed:Math.min(POWER_TRANSITION_SECONDS,(puzzle.restoreElapsed ?? 0)+seconds)} : puzzle]));
  return {...state,puzzles};
}
export function submitPuzzleCode(state, deviceId, code) {
  const device=DEVICES.find(candidate=>candidate.id===deviceId && candidate.kind==='keypad');
  if (!device || state.player.paused || state.ui.mode!=='keypad' || state.ui.deviceId!==deviceId
    || !isDevicePowered(state,device) || state.puzzles[device.puzzleId]?.restored) return state;
  if (!validatePuzzleCode(state,device.puzzleId,code)) {
    return {...state,ui:{...state.ui,buffer:'',message:'密碼錯誤，請重試'}};
  }
  return {...state,puzzles:{...state.puzzles,[device.puzzleId]:{
    ...state.puzzles[device.puzzleId],restored:true,restoreElapsed:0,
  }},ui:{mode:'explore',message:'主電力已恢復'}};
}
export function updateChapter(state,actions={},dt=0) {
  // 暫停優先於任何命令；回來保留面板內容，不重播這一幀輸入。
  if (actions.pausePressed || actions.focusLost || actions.forcePause) {
    return {...state,player:{...state.player,paused:true}};
  }
  if (state.player.paused || actions.gameplayActive===false) return state;
  if (state.ui.mode==='keypad') {
    const commands=actions.keypadCommands ?? [];
    // 返回當幀不提交、不移動、不再對場景互動。
    if (commands.some(command=>command?.type==='cancel')) return {...state,ui:{mode:'explore'}};
    let next=state;
    for (const command of commands) {
      const resolved=resolveKeypadCommand(next.ui,command);
      if (resolved?.type==='submit') next=submitPuzzleCode(next,next.ui.deviceId,next.ui.buffer);
      else next={...next,ui:updateKeypad(next.ui,resolved)};
      if (next.ui.mode!=='keypad') break;
    }
    return next;
  }
  if(state.ui.mode!=='explore') return state;
  // 先處理開啟，避免同一個 A／✕ 輸入第一位，或開啟當幀移動／耗電。
  const initialTarget=selectChapterTarget(state);
  if (actions.interactPressed && initialTarget?.kind==='keypad' && isDevicePowered(state,initialTarget)
    && !state.puzzles[initialTarget.puzzleId].restored) {
    return {...state,ui:createKeypad(initialTarget.id)};
  }
  const geometry=getGeometry(state);
  const player=updatePlayer(state.player,actions,dt,geometry.collisionBoxes);
  const equipmentActions=hasFlashlight(state)?actions:{...actions,flashlightPressed:false,uvPressed:false};
  const target = selectChapterTarget({...state,player});
  const isDevice = Boolean(target?.bounds);
  const next=updateEquipment(state,player,{...equipmentActions,interactPressed:actions.interactPressed && !isDevice},dt,ITEMS,geometry.occluderBoxes);
  const result = advancePower({...next,player},dt);
  result.monsters=Object.fromEntries(MONSTERS.map(definition=>[definition.id,
    updateMonster(state.monsters[definition.id],definition,WORLD.areas.find(a=>a.id===definition.areaId),player,dt,geometry.collisionBoxes)]));
  if (!isDevice || !actions.interactPressed) return result;
  if (target.kind === 'fuseBox' && !isDevicePowered(result,target)
    && result.inventory.itemIds.includes(target.acceptsItemId)
    && !Object.values(result.puzzles).some(puzzle => puzzle.installedItemId === target.acceptsItemId)) {
    result.puzzles = {...result.puzzles,[target.puzzleId]:{...result.puzzles[target.puzzleId],installedItemId:target.acceptsItemId}};
  }
  return {...result,ui:{...result.ui,message:deviceMessage(result,target)}};
}
