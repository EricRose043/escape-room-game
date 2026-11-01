import { WORLD, ITEMS, getGeometry } from './world.js';
import { createPlayer, updatePlayer, MAX_DT, WALK_SPEED, PLAYER_RADIUS, circleOverlapsBox } from './movement.js';
import { createFlashlight, updateEquipment } from './flashlight.js';
import { selectInteractionTarget } from './interaction.js';
import { getPuzzle } from './clues.js';
import { createKeypad, updateKeypad, resolveKeypadCommand } from './keypad.js';
import { createMonster, updateMonster, approachFraction, loseMonsterTarget } from './monster.js';
import { isLockerFront, tryEnterHiding, tryLeaveHiding, updateHidingPlayer } from './hiding.js';
import { CHECKPOINTS, advanceCheckpoint, checkpointReady } from './checkpoints.js';
import { createCapture, updateCapture, CAPTURE_SECONDS } from './capture.js';
import {COLOR_SEQUENCE,createSequenceState,pressButton} from './puzzles/color-sequence.js';
import {validateExitCode,EXIT_CLUE_IDS} from './puzzles/exit-code.js';
import {createCorridor,updateCorridor} from './corridor-chase.js';
import {finishChapter} from './ending.js';

export const DEVICES = WORLD.areas.flatMap(area => area.devices);
export const MONSTERS = WORLD.areas.flatMap(area => area.monsters ?? []);
export function isDevicePowered(state, device) {
  if(device.puzzleId==='exit.final')return state.corridor?.complete===true&&state.puzzles[COLOR_SEQUENCE.id]?.restored===true;
  const puzzle=getPuzzle(device.puzzleId);
  if(puzzle?.requiresInstall===false) return state.puzzles['power.main']?.restored===true;
  return Boolean(state.puzzles[device.puzzleId]?.installedItemId);
}
// 顯示與提交驗證共用唯一謎題資料；提交時仍再次檢查安裝狀態。
export function validatePuzzleCode(state, puzzleId, code) {
  const puzzle = getPuzzle(puzzleId);
  if(puzzleId==='exit.final')return isDevicePowered(state,{puzzleId})&&validateExitCode(code,state.foundClueIds);
  return Boolean(puzzle && (puzzle.requiresInstall===false ? isDevicePowered(state,{puzzleId}) : state.puzzles[puzzleId]?.installedItemId) && code === puzzle.code);
}
export function selectChapterTarget(state) {
  if(state.ui.mode!=='explore') return null;
  return selectInteractionTarget(state.player,state.inventory,ITEMS,
    DEVICES.filter(d=>d.kind!=='locker' || isLockerFront(state.player,d)),getGeometry(state).occluderBoxes);
}
export function deviceMessage(state, device) {
  if(device.kind==='sequenceButton')return state.puzzles[COLOR_SEQUENCE.id]?.restored?'復位完成':`復位 ${state.puzzles[COLOR_SEQUENCE.id]?.progress??0}/4`;
  if(device.kind==='clueNote')return state.foundClueIds?.includes(device.clueId)?'線索已記錄':'閱讀並記錄線索';
  if(device.puzzleId==='exit.final')return `出口線索 ${state.foundClueIds?.length??0}/3｜四位密碼`;
  if(device.kind==='locker') return '躲進置物櫃';
  if(device.kind==='trainConsole') return state.trainStarted?'列車已啟動，快登車':'月台檢修碼已確認，刷員工卡啟動列車';
  if(device.kind==='train') return state.trainStarted?'登上列車逃離工廠':'列車尚未啟動';
  if (state.puzzles[device.puzzleId]?.restored) return device.puzzleId==='power.main'?'主電力已恢復':'貨運月台門已解鎖';
  if (device.kind === 'keypad') return isDevicePowered(state,device) ? '控制器已通電' : '控制器未通電';
  if (isDevicePowered(state,device)) return '備援控制已接通';
  return state.inventory.itemIds.includes(device.acceptsItemId) ? '安裝保險絲' : '缺少保險絲';
}

export function createChapter({jumpScare=false}={}) {
  return {player:createPlayer(WORLD.spawn),inventory:{itemIds:[]},flashlight:createFlashlight(),
    jumpScare:jumpScare===true,
    checkpointId:CHECKPOINTS[0].id,foundClueIds:[],corridor:createCorridor(),elapsedSeconds:0,completed:false,
    puzzles:Object.fromEntries(WORLD.areas.flatMap(a=>a.puzzles).map(p=>[p.id,{installedItemId:null,restored:false,...(p.id===COLOR_SEQUENCE.id?createSequenceState(COLOR_SEQUENCE):{})}])),
    monsters:Object.fromEntries(MONSTERS.map(m=>[m.id,createMonster(m)])),
    events:[],trainStarted:false,
    ui:{mode:'explore'}};
}
export function hasFlashlight(state) {
  return ITEMS.some(i=>i.kind==='flashlight' && state.inventory.itemIds.includes(i.id));
}
export const POWER_TRANSITION_SECONDS = 0.6;
export const ENDING_SECONDS = 8;
// 死亡回復及日後讀檔共用；呼叫者負責流程與暫停，不還原危險座標或介面。
export function restoreCheckpoint(state) {
  const checkpoint=CHECKPOINTS.find(c=>c.id===state.checkpointId);
  if(!checkpoint || !checkpointReady(state,checkpoint)) throw new Error('無效存檔點或進度前置條件不足');
  const monsters=Object.fromEntries(MONSTERS.map(definition=>{
    const initial=createMonster(definition);
    const activation=CHECKPOINTS.find(c=>c.areaId===definition.areaId);
    return [definition.id,{...initial,mode:activation && checkpoint.order>=activation.order?'patrol':'inactive'}];
  }));
  return {
    player:createPlayer({...checkpoint.spawn,paused:state.player.paused}),
    checkpointId:checkpoint.id,foundClueIds:[...(state.foundClueIds??[])],elapsedSeconds:state.elapsedSeconds??0,completed:state.completed===true,
    corridor:checkpoint.id==='exit.checkpoint'?{...createCorridor(),complete:true,gates:{previous:null,closedIds:['corridor.door-1','corridor.door-2','corridor.door-3']}}:createCorridor(),
    inventory:{itemIds:[...state.inventory.itemIds]},
    flashlight:{charge:state.flashlight.charge,mode:state.flashlight.mode,enabled:false},
    puzzles:Object.fromEntries(Object.entries(state.puzzles).map(([id,puzzle])=>[id,{
      ...puzzle,restoreElapsed:puzzle.restored?POWER_TRANSITION_SECONDS:0,
    }])),
    monsters,events:[],trainStarted:state.trainStarted===true,ui:{mode:'explore'},
  };
}
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
function updateChapterCore(state,actions={},dt=0,{jumpScare=state.jumpScare??false}={}) {
  const allowed=jumpScare===true;
  if(state.jumpScare!==allowed) state={...state,jumpScare:allowed};
  if(state.ui.mode==='caught') state={...state,ui:updateCapture(state.ui,0,{jumpScare:allowed})};
  // 暫停優先於任何命令；回來保留面板內容，不重播這一幀輸入。
  if (actions.pausePressed || actions.focusLost || actions.forcePause) {
    return {...state,player:{...state.player,paused:true}};
  }
  if(state.ui.mode==='ending') {
    if(state.player.paused || actions.gameplayActive===false) return state;
    const elapsed=Math.min(ENDING_SECONDS,(state.ui.elapsed??0)+(Number.isFinite(dt)?Math.max(0,dt):0));
    return {...state,ui:elapsed>=ENDING_SECONDS-1e-9?{mode:'complete'}:{...state.ui,elapsed}};
  }
  if (state.player.paused || actions.gameplayActive===false) return state;
  if(state.ui.mode==='caught') {
    const ui=updateCapture(state.ui,dt,{jumpScare:allowed});
    if(ui.elapsed>=CAPTURE_SECONDS-1e-9) return {...restoreCheckpoint(state),jumpScare:allowed};
    return ui===state.ui?state:{...state,ui,events:[]};
  }
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
  if(actions.interactPressed&&initialTarget?.kind==='clueNote')return {...state,foundClueIds:[...new Set([...(state.foundClueIds??[]),initialTarget.clueId])],events:[],ui:{mode:'explore',messageTargetId:initialTarget.id,message:initialTarget.name}};
  if(actions.interactPressed&&initialTarget?.kind==='sequenceButton'){
    const old=state.puzzles[COLOR_SEQUENCE.id],pressed=pressButton(old,COLOR_SEQUENCE,initialTarget.color);
    if(old.restored)return {...state,events:[],ui:{mode:'explore',messageTargetId:initialTarget.id,message:'復位已完成'}};
    const monsters=pressed.alarm?Object.fromEntries(MONSTERS.map(d=>[d.id,{...state.monsters[d.id],mode:'search',investigate:true,lastSeen:{x:state.player.x,z:state.player.z},searchElapsed:0,path:[],pathIndex:1,repathRemaining:0,plannedMode:null,contactLatched:false,events:[]}])):state.monsters;
    return {...state,monsters,puzzles:{...state.puzzles,[COLOR_SEQUENCE.id]:{...pressed.state,restored:pressed.state.solved}},
      foundClueIds:pressed.state.solved?[...new Set([...(state.foundClueIds??[]),EXIT_CLUE_IDS[0]])]:state.foundClueIds,
      events:[{type:pressed.alarm?'alarm':pressed.state.solved?'door':'sequence'}],ui:{mode:'explore',messageTargetId:initialTarget.id,message:pressed.alarm?'順序錯誤！警報已引來玩偶':pressed.state.solved?'復位完成，燈序線索已記錄':`復位 ${pressed.state.progress}/4`}};
  }
  if(actions.interactPressed && initialTarget?.kind==='trainConsole') {
    const ready=state.puzzles['production.sequence']?.restored && state.puzzles['exit.final']?.restored && state.corridor?.complete && state.inventory.itemIds.includes('lobby.employee-card');
    return ready?{...state,trainStarted:true,ui:{mode:'explore',message:'列車已啟動，快上車！'}}:{...state,ui:{...state.ui,message:'需要完成裝配線檢修並刷員工卡'}};
  }
  if(actions.interactPressed && initialTarget?.kind==='train') {
    return state.trainStarted&&state.puzzles['exit.final']?.restored?{...state,ui:{mode:'ending',elapsed:0}}:{...state,ui:{...state.ui,message:'列車尚未啟動'}};
  }
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
  const result = advanceCheckpoint(advancePower({...next,player},dt));
  Object.assign(result,advanceMonsters(state,player,dt,geometry));
  if (isDevice && actions.interactPressed) {
    if (target.kind === 'fuseBox' && !isDevicePowered(result,target)
      && result.inventory.itemIds.includes(target.acceptsItemId)
      && !Object.values(result.puzzles).some(puzzle => puzzle.installedItemId === target.acceptsItemId)) {
      result.puzzles = {...result.puzzles,[target.puzzleId]:{...result.puzzles[target.puzzleId],installedItemId:target.acceptsItemId}};
    }
    result.ui={...result.ui,message:deviceMessage(result,target)};
  }
  // 只消費 advanceMonsters 本幀新產生的事件；舊事件、面板及成功進櫃均不走此分支。
  if(result.events.some(event=>event.type==='contact')) {
    return {...result,flashlight:{...result.flashlight,enabled:false},ui:createCapture({jumpScare:allowed})};
  }
  return result;
}

export function updateChapter(state,actions={},dt=0,options={}) {
 if(state.ui.mode==='complete')return state;
 let next=updateChapterCore(state,actions,dt,options);
 if(!state.player.paused&&!next.player.paused&&actions.gameplayActive!==false&&['explore','hiding'].includes(state.ui.mode)) next={...next,elapsedSeconds:(state.elapsedSeconds??0)+(Number.isFinite(dt)?Math.max(0,Math.min(MAX_DT,dt)):0)};
 if(next.ui.mode==='complete')return {...next,completed:true,endingResult:finishChapter(0,next.elapsedSeconds??0)};
 if(next.player.paused||actions.gameplayActive===false||next.ui.mode!=='explore'||state.ui.mode==='caught'||!next.puzzles[COLOR_SEQUENCE.id]?.restored)return next;
 const corridor=updateCorridor(next.corridor??createCorridor(),next.player,dt);
 if(corridor===next.corridor)return next;
 next=advanceCheckpoint({...next,corridor});
 if(corridor.active||corridor.complete)next.monsters=Object.fromEntries(MONSTERS.map(d=>[d.id,{...next.monsters[d.id],mode:'inactive'}]));
 if(corridor.caught)next={...next,flashlight:{...next.flashlight,enabled:false},ui:createCapture({jumpScare:next.jumpScare})};
 return next;
}
