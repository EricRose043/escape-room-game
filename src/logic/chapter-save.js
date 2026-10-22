import { ITEMS } from './world.js';
import { CHECKPOINTS } from './checkpoints.js';
import { createChapter, restoreCheckpoint } from './chapter.js';

const object=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const keys=(value,names)=>object(value) && Object.keys(value).length===names.length
  && names.every(name=>Object.hasOwn(value,name));

export function createChapterSave(state) {
  const power=state.puzzles['power.main'];
  return {version:1,chapterId:'chapter-1',checkpointId:state.checkpointId,itemIds:[...state.inventory.itemIds],
    puzzles:{'power.main':{installedItemId:power.installedItemId,restored:power.restored}},
    flashlight:{charge:state.flashlight.charge,mode:state.flashlight.mode}};
}

export function validateChapterSave(data) {
  const errors=[];
  if(!keys(data,['version','chapterId','checkpointId','itemIds','puzzles','flashlight'])) return ['存檔欄位或型別無效'];
  if(data.version!==1) errors.push('不支援的存檔版本');
  if(data.chapterId!=='chapter-1') errors.push('存檔章節無效');
  const checkpoint=CHECKPOINTS.find(c=>c.id===data.checkpointId);
  if(!checkpoint) errors.push('存檔點 ID 無效');
  if(!Array.isArray(data.itemIds) || data.itemIds.some(id=>!ITEMS.some(i=>i.id===id))
    || new Set(data.itemIds).size!==data.itemIds.length) errors.push('物品 ID 無效或重複');
  if(!keys(data.puzzles,['power.main']) || !keys(data.puzzles['power.main'],['installedItemId','restored'])) errors.push('謎題欄位無效');
  if(!keys(data.flashlight,['charge','mode']) || !Number.isFinite(data.flashlight.charge)
    || data.flashlight.charge<0 || data.flashlight.charge>100 || !['normal','uv'].includes(data.flashlight.mode)) errors.push('手電筒資料無效');
  if(errors.length) return errors;
  const power=data.puzzles['power.main'],has=id=>data.itemIds.includes(id);
  if(typeof power.restored!=='boolean' || ![null,'power.fuse'].includes(power.installedItemId)) errors.push('電力進度型別或 ID 無效');
  if(power.installedItemId!==null && !has('power.fuse')) errors.push('缺少已安裝的保險絲取得紀錄');
  if(power.restored && power.installedItemId!=='power.fuse') errors.push('恢復供電前必須安裝保險絲');
  if(!has('lobby.flashlight') && (data.itemIds.some(id=>id.startsWith('power.')) || power.installedItemId!==null
    || power.restored || data.flashlight.charge!==100 || data.flashlight.mode!=='normal')) errors.push('缺少手電筒前置進度');
  if(checkpoint.requires.itemIds.some(id=>!has(id)) || checkpoint.requires.puzzleIds.some(id=>data.puzzles[id]?.restored!==true)) errors.push('存檔點前置進度不足');
  return errors;
}

export function serializeChapterSave(state) {
  const data=createChapterSave(state),errors=validateChapterSave(data);
  if(errors.length) throw new Error(errors.join('；'));
  return JSON.stringify(data);
}

export function parseChapterSave(raw) {
  if(raw===null) return {status:'empty',data:null,reason:''};
  try {
    if(typeof raw!=='string') return {status:'invalid',data:null,reason:'存檔內容型別無效'};
    const data=JSON.parse(raw),errors=validateChapterSave(data);
    return errors.length?{status:'invalid',data:null,reason:errors.join('；')}:{status:'valid',data,reason:''};
  } catch {return {status:'invalid',data:null,reason:'存檔 JSON 損壞，無法繼續'};}
}

export function restoreChapterSave(data,options={}) {
  if(validateChapterSave(data).length) return null;
  const initial=createChapter(options);
  const state={...initial,checkpointId:data.checkpointId,inventory:{itemIds:[...data.itemIds]},
    flashlight:{...data.flashlight,enabled:false},puzzles:{...initial.puzzles,'power.main':{...data.puzzles['power.main']}}};
  return {...restoreCheckpoint(state),jumpScare:initial.jumpScare};
}
