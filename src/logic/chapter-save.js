import { ITEMS } from './world.js';
import { CHECKPOINTS } from './checkpoints.js';
import { createChapter, restoreCheckpoint } from './chapter.js';
import {EXIT_CLUE_IDS} from './puzzles/exit-code.js';
import {finishChapter} from './ending.js';
import {TRAIN_CARD_IDS} from './puzzles/train-code.js';
import {TRAIN_CINEMATIC_SECONDS} from './train-cinematic.js';

const object=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const keys=(value,names)=>object(value) && Object.keys(value).length===names.length
  && names.every(name=>Object.hasOwn(value,name));

// 保持既有 v1 的最小進度形狀；新關卡進度一旦出現即升級為 v2。
export function createChapterSave(state) {
  const power=state.puzzles['power.main'];
  const trainProgress=(state.trainPuzzle?.readCardIds.length??0)>0||state.trainPuzzle?.solved===true||state.trainCinematic?.started===true;
  const integrated=trainProgress||(state.elapsedSeconds??0)>0||(state.foundClueIds?.length??0)>0||state.puzzles['production.color-sequence']?.restored===true||state.corridor?.complete===true||state.completed===true;
  const advanced=state.puzzles['production.sequence']?.restored===true || state.trainStarted===true;
  const data={version:trainProgress?4:integrated?3:advanced?2:1,chapterId:'chapter-1',checkpointId:state.checkpointId,itemIds:[...state.inventory.itemIds],
    puzzles:{'power.main':{installedItemId:power.installedItemId,restored:power.restored}},
    flashlight:{charge:state.flashlight.charge,mode:state.flashlight.mode}};
  if(advanced||integrated) {
    data.puzzles['production.sequence']={installedItemId:null,restored:state.puzzles['production.sequence']?.restored===true};
    data.trainStarted=state.trainStarted===true;
  }
  if(integrated){
    for(const id of ['production.color-sequence','exit.final'])data.puzzles[id]={installedItemId:null,restored:state.puzzles[id]?.restored===true};
    data.foundClueIds=[...(state.foundClueIds??[])];data.elapsedSeconds=state.elapsedSeconds??0;
    data.corridorComplete=state.corridor?.complete===true;data.completed=state.completed===true||state.ui.mode==='complete';
  }
  if(trainProgress){
    data.trainPuzzle={readCardIds:[...(state.trainPuzzle?.readCardIds??[])],solved:state.trainPuzzle?.solved===true};
    data.trainCinematic={started:state.trainCinematic?.started===true,elapsed:state.trainCinematic?.elapsed??0};
    // Only a validated old save can set this marker; new chapters start false.
    data.trainLegacyAuthorized=state.trainLegacyAuthorized===true;
    data.trainLegacySave=state.trainLegacySave?structuredClone(state.trainLegacySave):null;
  }
  return data;
}

export function validateChapterSave(data) {
  const errors=[];
  if(!keys(data,['version','chapterId','checkpointId','itemIds','puzzles','flashlight',...(data?.version>=2?['trainStarted']:[]),...(data?.version>=3?['foundClueIds','elapsedSeconds','corridorComplete','completed']:[]),...(data?.version===4?['trainPuzzle','trainCinematic','trainLegacyAuthorized','trainLegacySave']:[])])) return ['存檔欄位或型別無效'];
  if(![1,2,3,4].includes(data.version)) errors.push('不支援的存檔版本');
  if(data.chapterId!=='chapter-1') errors.push('存檔章節無效');
  const checkpoint=CHECKPOINTS.find(c=>c.id===data.checkpointId);
  if(!checkpoint) errors.push('存檔點 ID 無效');
  if(!Array.isArray(data.itemIds) || data.itemIds.some(id=>!ITEMS.some(i=>i.id===id))
    || new Set(data.itemIds).size!==data.itemIds.length) errors.push('物品 ID 無效或重複');
  if(!keys(data.puzzles,['power.main',...(data.version>=2?['production.sequence']:[]),...(data.version>=3?['production.color-sequence','exit.final']:[])]) || !keys(data.puzzles['power.main'],['installedItemId','restored'])) errors.push('謎題欄位無效');
  if(data.version>=2 && (!keys(data.puzzles?.['production.sequence'],['installedItemId','restored'])
    || data.puzzles['production.sequence'].installedItemId!==null
    || typeof data.puzzles['production.sequence'].restored!=='boolean'
    || typeof data.trainStarted!=='boolean')) errors.push('裝配線或列車欄位無效');
  if(!keys(data.flashlight,['charge','mode']) || !Number.isFinite(data.flashlight.charge)
    || data.flashlight.charge<0 || data.flashlight.charge>100 || !['normal','uv'].includes(data.flashlight.mode)) errors.push('手電筒資料無效');
  if(data.version>=3 && (!Number.isFinite(data.elapsedSeconds)||data.elapsedSeconds<0||typeof data.corridorComplete!=='boolean'||typeof data.completed!=='boolean'
    ||!Array.isArray(data.foundClueIds)||data.foundClueIds.some(id=>!EXIT_CLUE_IDS.includes(id))||new Set(data.foundClueIds).size!==data.foundClueIds.length
    ||!['production.color-sequence','exit.final'].every(id=>keys(data.puzzles?.[id],['installedItemId','restored'])&&data.puzzles[id].installedItemId===null&&typeof data.puzzles[id].restored==='boolean')))errors.push('整合版進度欄位無效');
  if(data.version===4 && (!keys(data.trainPuzzle,['readCardIds','solved'])||!Array.isArray(data.trainPuzzle.readCardIds)
    ||data.trainPuzzle.readCardIds.some(id=>!TRAIN_CARD_IDS.includes(id))||new Set(data.trainPuzzle.readCardIds).size!==data.trainPuzzle.readCardIds.length
    ||typeof data.trainPuzzle.solved!=='boolean'||typeof data.trainLegacyAuthorized!=='boolean'
    ||!keys(data.trainCinematic,['started','elapsed'])||typeof data.trainCinematic.started!=='boolean'
    ||!Number.isFinite(data.trainCinematic.elapsed)||data.trainCinematic.elapsed<0||data.trainCinematic.elapsed>TRAIN_CINEMATIC_SECONDS))errors.push('列車檢修或過場欄位無效');
  if(errors.length) return errors;
  const power=data.puzzles['power.main'],has=id=>data.itemIds.includes(id);
  if(typeof power.restored!=='boolean' || ![null,'power.fuse'].includes(power.installedItemId)) errors.push('電力進度型別或 ID 無效');
  if(power.installedItemId!==null && !has('power.fuse')) errors.push('缺少已安裝的保險絲取得紀錄');
  if(power.restored && power.installedItemId!=='power.fuse') errors.push('恢復供電前必須安裝保險絲');
  if(!has('lobby.flashlight') && (data.itemIds.some(id=>id.startsWith('power.')) || power.installedItemId!==null
    || power.restored || data.flashlight.charge!==100 || data.flashlight.mode!=='normal')) errors.push('缺少手電筒前置進度');
  if(data.version>=2) {
    if(data.puzzles['production.sequence'].restored && !power.restored) errors.push('裝配線解題前必須恢復供電');
    if(data.trainStarted && (!data.puzzles['production.sequence'].restored || !has('lobby.employee-card'))) errors.push('列車啟動前必須解開裝配線並取得員工卡');
  }
  if(checkpoint.requires.itemIds.some(id=>!has(id)) || checkpoint.requires.puzzleIds.some(id=>data.puzzles[id]?.restored!==true)) errors.push('存檔點前置進度不足');
  if(data.version>=3){
    const color=data.puzzles['production.color-sequence'].restored,final=data.puzzles['exit.final'].restored,found=id=>data.foundClueIds.includes(id);
    if(color&&!power.restored)errors.push('復位按鈕缺少供電');
    if(found(EXIT_CLUE_IDS[0])&&!color)errors.push('燈序線索缺少復位紀錄');
    if(data.corridorComplete&&(!color||!data.puzzles['production.sequence'].restored||!EXIT_CLUE_IDS.slice(0,2).every(found)))errors.push('追逐完成缺少前置進度');
    if(final&&(!data.corridorComplete||!EXIT_CLUE_IDS.every(found)))errors.push('出口缺少三條線索');
    if(data.completed&&((!final&&data.trainLegacyAuthorized!==true)||!data.trainStarted))errors.push('結局缺少出口或列車進度');
    if(checkpoint.id==='exit.checkpoint'&&!data.corridorComplete)errors.push('出口存檔缺少追逐完成紀錄');
  }else if(checkpoint.id==='exit.checkpoint')errors.push('舊版不能使用新增存檔點');
  if(data.version===4){
    const train=data.trainPuzzle,cinematic=data.trainCinematic,legacy=data.trainLegacyAuthorized;
    // A boolean is not evidence of a prior earned boarding right. Keep the exact
    // validated old save which conferred it, and reject detached migration flags.
    const old=data.trainLegacySave;
    const oldValid=object(old)&&[2,3].includes(old.version)&&old.trainStarted===true&&validateChapterSave(old).length===0;
    if(legacy!==oldValid || (!legacy&&old!==null))errors.push('舊版登車資格缺少有效原始存檔');
    if(oldValid){
      const oldCheckpoint=CHECKPOINTS.find(c=>c.id===old.checkpointId);
      if(old.itemIds.some(id=>!has(id))||checkpoint.order<oldCheckpoint.order||(old.elapsedSeconds??0)>data.elapsedSeconds
        ||Object.entries(old.puzzles).some(([id,p])=>p.restored&&!data.puzzles[id]?.restored)
        ||(old.foundClueIds??[]).some(id=>!data.foundClueIds.includes(id)))errors.push('目前進度與原始登車紀錄矛盾');
    }
    if(legacy&&!data.trainStarted)errors.push('舊版登車資格缺少已啟動紀錄');
    if(train.readCardIds.length&&!data.puzzles['exit.final'].restored&&!legacy)errors.push('列車卡片缺少月台入口進度');
    if(train.solved&&(!TRAIN_CARD_IDS.every(id=>train.readCardIds.includes(id))||!data.trainStarted||!data.puzzles['exit.final'].restored||!data.corridorComplete))errors.push('列車檢修完成缺少卡片、出口或發車進度');
    if(data.trainStarted&&!train.solved&&!legacy)errors.push('發車缺少2123檢修紀錄');
    if(cinematic.started&&!data.trainStarted)errors.push('過場缺少已啟動列車');
    if(!cinematic.started&&cinematic.elapsed!==0)errors.push('未登車不能保存過場時間');
    if(data.completed!==Boolean(cinematic.started&&cinematic.elapsed===TRAIN_CINEMATIC_SECONDS))errors.push('過場時間與結局完成狀態矛盾');
  }
  return errors;
}

export function serializeChapterSave(state) {
  const data=createChapterSave(state),errors=validateChapterSave(data);
  if(errors.length) throw new Error(errors.join('；'));
  return JSON.stringify(data);
}

// The earlier local chapter used a different v2 shape under the same stable key.
// Validate its exact schema before carrying only shared, actually earned progress forward.
function migrateLocalV2(old){
  if(old?.version!==2||!Object.hasOwn(old.puzzles??{},'exit.code'))return null;
  const allowed=['lobby.flashlight','lobby.battery','power.fuse','power.battery','production.exit-clue','corridor.exit-clue','exit.exit-clue'];
  if(!keys(old,['version','chapterId','checkpointId','itemIds','puzzles','flashlight','elapsedSeconds','corridorComplete'])||old.chapterId!=='chapter-1'
    ||!['lobby.checkpoint','power.checkpoint','production.checkpoint','exit.checkpoint'].includes(old.checkpointId)
    ||!Array.isArray(old.itemIds)||old.itemIds.some(id=>!allowed.includes(id))||new Set(old.itemIds).size!==old.itemIds.length
    ||!keys(old.puzzles,['power.main','production.sequence','exit.code'])||!keys(old.puzzles['power.main'],['installedItemId','restored'])
    ||!['production.sequence','exit.code'].every(id=>keys(old.puzzles[id],['restored'])&&typeof old.puzzles[id].restored==='boolean')
    ||!keys(old.flashlight,['charge','mode'])||!Number.isFinite(old.flashlight.charge)||old.flashlight.charge<0||old.flashlight.charge>100
    ||!['normal','uv'].includes(old.flashlight.mode)||!Number.isFinite(old.elapsedSeconds)||old.elapsedSeconds<0||typeof old.corridorComplete!=='boolean')throw Error('Invalid legacy save');
  const power=old.puzzles['power.main'],has=id=>old.itemIds.includes(id);
  if(typeof power.restored!=='boolean'||![null,'power.fuse'].includes(power.installedItemId)||(power.installedItemId&&!has('power.fuse'))
    ||(power.restored&&(!power.installedItemId||!has('lobby.flashlight')))||(old.puzzles['production.sequence'].restored&&!power.restored)
    ||(old.corridorComplete&&!old.puzzles['production.sequence'].restored)||(old.puzzles['exit.code'].restored&&(!old.corridorComplete||!allowed.slice(4).every(has))))throw Error('Inconsistent legacy save');
  const color=old.puzzles['production.sequence'].restored;
  return {version:3,chapterId:'chapter-1',checkpointId:'lobby.checkpoint',itemIds:old.itemIds.filter(id=>ITEMS.some(i=>i.id===id)),
    puzzles:{'power.main':{...power},'production.sequence':{installedItemId:null,restored:false},'production.color-sequence':{installedItemId:null,restored:color},'exit.final':{installedItemId:null,restored:false}},
    flashlight:{...old.flashlight},trainStarted:false,foundClueIds:color?[EXIT_CLUE_IDS[0]]:[],elapsedSeconds:old.elapsedSeconds,corridorComplete:false,completed:false};
}
export function parseChapterSave(raw) {
  if(raw===null) return {status:'empty',data:null,reason:''};
  try {
    if(typeof raw!=='string') return {status:'invalid',data:null,reason:'存檔內容型別無效'};
    const original=JSON.parse(raw),data=migrateLocalV2(original)??original,errors=validateChapterSave(data);
    return errors.length?{status:'invalid',data:null,reason:errors.join('；')}:{status:'valid',data,reason:data===original?'':'已讀取上一版道具、電力與時間；新版員工卡及不同劇情的出口仍需探索。'};
  } catch {return {status:'invalid',data:null,reason:'存檔 JSON 損壞，無法繼續'};}
}

export function restoreChapterSave(data,options={}) {
  if(validateChapterSave(data).length) return null;
  const initial=createChapter(options);
  const state={...initial,checkpointId:data.checkpointId,inventory:{itemIds:[...data.itemIds]},
    flashlight:{...data.flashlight,enabled:false},trainStarted:data.version>=2?data.trainStarted:false,
    trainLegacyAuthorized:data.version<4&&data.trainStarted===true,
    trainLegacySave:data.version<4&&data.trainStarted===true?structuredClone(data):null,
    puzzles:{...initial.puzzles,...Object.fromEntries(Object.entries(data.puzzles).map(([id,puzzle])=>[id,{...puzzle}]))}};
  if(data.version>=3){state.elapsedSeconds=data.elapsedSeconds;state.foundClueIds=[...data.foundClueIds];state.corridor={...state.corridor,complete:data.corridorComplete};state.completed=data.completed;}
  if(data.version===4){state.trainPuzzle={readCardIds:[...data.trainPuzzle.readCardIds],solved:data.trainPuzzle.solved};state.trainCinematic={...data.trainCinematic};state.trainLegacyAuthorized=data.trainLegacyAuthorized;state.trainLegacySave=data.trainLegacySave?structuredClone(data.trainLegacySave):null;}
  const restored={...restoreCheckpoint(state),jumpScare:initial.jumpScare};
  if(data.version>=3&&data.corridorComplete)restored.corridor={...restored.corridor,complete:true};
  if(data.version===4&&data.trainCinematic.started&&!data.completed)restored.ui={mode:'ending',variant:'derailment',elapsed:data.trainCinematic.elapsed};
  if(data.version>=3&&data.completed){restored.ui={mode:'complete',...(data.version===4?{variant:'derailment'}:{})};restored.endingResult=finishChapter(0,data.elapsedSeconds);}
  return restored;
}
