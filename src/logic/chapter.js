import { WORLD, ITEMS, getGeometry } from './world.js';
import { createPlayer, updatePlayer, MAX_DT, WALK_SPEED, PLAYER_RADIUS, circleOverlapsBox } from './movement.js';
import { createFlashlight, updateEquipment } from './flashlight.js';
import { selectInteractionTarget } from './interaction.js';
import { getPuzzle } from './clues.js';
import { createKeypad, updateKeypad, resolveKeypadCommand } from './keypad.js';
import { createMonster, updateMonster, approachFraction, loseMonsterTarget } from './monster.js';
import { isLockerFront, tryEnterHiding, tryLeaveHiding, updateHidingPlayer } from './hiding.js';

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
  if(state.ui.mode!=='explore') return null;
  return selectInteractionTarget(state.player,state.inventory,ITEMS,
    DEVICES.filter(d=>d.kind!=='locker' || isLockerFront(state.player,d)),getGeometry(state).occluderBoxes);
}
export function deviceMessage(state, device) {
  if(device.kind==='locker') return '躲進置物櫃';
  if (state.puzzles[device.puzzleId]?.restored) return '主電力已恢復';
  if (device.kind === 'keypad') return isDevicePowered(state,device) ? '控制器已通電' : '控制器未通電';
  if (isDevicePowered(state,device)) return '備援控制已接通';
  return state.inventory.itemIds.includes(device.acceptsItemId) ? '安裝保險絲' : '缺少保險絲';
}

export function createChapter() {
  return {player:createPlayer(WORLD.spawn),inventory:{itemIds:[]},flashlight:createFlashlight(),
    puzzles:Object.fromEntries(WORLD.areas.flatMap(a=>a.puzzles).map(p=>[p.id,{installedItemId:null,restored:false}])),
    monsters:Object.fromEntries(MONSTERS.map(m=>[m.id,createMonster(m)])),
    events:[],
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
function movePlayerWithMonsters(state,actions,dt,boxes) {
  const time=Number.isFinite(dt)?Math.max(0,Math.min(MAX_DT,dt)):0;
  const bodies=MONSTERS.filter(d=>{
    const m=state.monsters[d.id];
    return m.mode!=='inactive' && Math.hypot(m.x-state.player.x,m.z-state.player.z)<=PLAYER_RADIUS+d.radius+WALK_SPEED*time;
  });
  if(!bodies.length) return updatePlayer(state.player,actions,dt,boxes);
  let player=updatePlayer(state.player,{...actions,move:{}},dt,boxes);
  const steps=Math.max(1,Math.ceil(WALK_SPEED*time/(PLAYER_RADIUS/4)));
  for(let i=0;i<steps;i++) {
    const candidate=updatePlayer(player,{move:actions.move},time/steps,boxes);
    let fraction=1;
    for(const d of bodies) fraction=Math.min(fraction,approachFraction(player,candidate,state.monsters[d.id],PLAYER_RADIUS+d.radius));
    const safe={...candidate,x:player.x+(candidate.x-player.x)*fraction,z:player.z+(candidate.z-player.z)*fraction};
    if(!boxes.some(b=>circleOverlapsBox(safe.x,safe.z,b))) player=safe;
    if(fraction<1) break;
  }
  return player;
}
function monsterBodies(state) {
  return MONSTERS.filter(d=>state.monsters[d.id].mode!=='inactive')
    .map(d=>({...state.monsters[d.id],radius:d.radius}));
}
function advanceMonsters(state,player,dt,geometry,hidden=false) {
  const monsters=Object.fromEntries(MONSTERS.map(definition=>[definition.id,
    updateMonster(state.monsters[definition.id],definition,WORLD.areas.find(a=>a.id===definition.areaId),player,dt,geometry.collisionBoxes,
      {occluderBoxes:geometry.occluderBoxes,hidden})]));
  return {monsters,events:MONSTERS.flatMap(d=>monsters[d.id]===state.monsters[d.id]?[]:monsters[d.id].events)};
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
  if(state.ui.mode==='hiding') {
    const locker=DEVICES.find(d=>d.id===state.ui.lockerId && d.kind==='locker');
    const geometry=getGeometry(state);
    // 進出切換當幀完全消耗輸入；失敗也留在原位，不趁機做裝備動作。
    if(actions.interactPressed) return tryLeaveHiding(state,locker,geometry.collisionBoxes,monsterBodies(state));
    const player=updateHidingPlayer(state.player,actions,dt,locker);
    return advancePower({...state,player,...advanceMonsters(state,player,dt,geometry,true)},dt);
  }
  if(state.ui.mode!=='explore') return state;
  // 先處理開啟，避免同一個 A／✕ 輸入第一位，或開啟當幀移動／耗電。
  const initialTarget=selectChapterTarget(state);
  if(actions.interactPressed && initialTarget?.kind==='locker') {
    const next=tryEnterHiding(state,initialTarget,getGeometry(state).collisionBoxes,monsterBodies(state));
    if(next.ui.mode!=='hiding') return next;
    return {...next,monsters:Object.fromEntries(MONSTERS.map(d=>[d.id,loseMonsterTarget(state.monsters[d.id])]))};
  }
  if (actions.interactPressed && initialTarget?.kind==='keypad' && isDevicePowered(state,initialTarget)
    && !state.puzzles[initialTarget.puzzleId].restored) {
    return {...state,ui:createKeypad(initialTarget.id)};
  }
  const geometry=getGeometry(state);
  const player=movePlayerWithMonsters(state,actions,dt,geometry.collisionBoxes);
  const equipmentActions=hasFlashlight(state)?actions:{...actions,flashlightPressed:false,uvPressed:false};
  const target = selectChapterTarget({...state,player});
  const isDevice = Boolean(target?.bounds);
  const next=updateEquipment(state,player,{...equipmentActions,interactPressed:actions.interactPressed && !isDevice},dt,ITEMS,geometry.occluderBoxes);
  const result = advancePower({...next,player},dt);
  Object.assign(result,advanceMonsters(state,player,dt,geometry));
  if (!isDevice || !actions.interactPressed) return result;
  if (target.kind === 'fuseBox' && !isDevicePowered(result,target)
    && result.inventory.itemIds.includes(target.acceptsItemId)
    && !Object.values(result.puzzles).some(puzzle => puzzle.installedItemId === target.acceptsItemId)) {
    result.puzzles = {...result.puzzles,[target.puzzleId]:{...result.puzzles[target.puzzleId],installedItemId:target.acceptsItemId}};
  }
  return {...result,ui:{...result.ui,message:deviceMessage(result,target)}};
}
