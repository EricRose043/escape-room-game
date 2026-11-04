import { parseChapterSave, serializeChapterSave } from './chapter-save.js';

export const CHAPTER_SAVE_KEY='star-candy-park.chapter-1.save';
const sameItems=(a,b)=>a.length===b.length && a.every(id=>b.includes(id));

// 儲存由呼叫者注入；不讀 DOM、真實時鐘或全域 localStorage。
export function createSaveStorage(storage) {
  let protectedSave=true,pending=null,dirty=false,elapsed=0;
  let status={state:'empty',message:''};
  function flush() {
    if(protectedSave) return false;
    if(!dirty) return true;
    elapsed=0;
    try {
      // 先完成驗證與序列化，再單次替換；失敗保留舊檔及待存狀態。
      const text=serializeChapterSave(pending);
      storage.setItem(CHAPTER_SAVE_KEY,text);
      dirty=false;status={state:'saved',message:'進度已儲存'};return true;
    } catch {status={state:'error',message:'尚未儲存：無法寫入章節存檔，遊戲可繼續'};return false;}
  }
  return {
    load() {
      let result;
      try {result=parseChapterSave(storage.getItem(CHAPTER_SAVE_KEY));}
      catch {result={status:'unavailable',data:null,reason:'尚未儲存：無法讀取章節存檔'};}
      protectedSave=!['valid','empty'].includes(result.status);
      if(protectedSave) status={state:'protected',message:result.reason+(dirty?'；尚未儲存的進度仍留在本頁':'')};
      else if(!dirty) status={state:result.status==='valid'?'saved':'empty',message:result.status==='valid'?'進度已儲存':''};
      return result;
    },
    restart(state) {
      // 只在玩家明確確認重新開始後呼叫，不先 removeItem 或 clear。
      protectedSave=false;pending=state;dirty=true;return flush();
    },
    observe(before,after,dt=0) {
      if(protectedSave) return;
      const puzzleChanged=Object.keys(after.puzzles).some(id=>before.puzzles[id]?.installedItemId!==after.puzzles[id]?.installedItemId
        || before.puzzles[id]?.restored!==after.puzzles[id]?.restored);
      const immediate=before.checkpointId!==after.checkpointId || !sameItems(before.inventory.itemIds,after.inventory.itemIds)
        || puzzleChanged || before.trainStarted!==after.trainStarted
        || !sameItems(before.trainPuzzle?.readCardIds??[],after.trainPuzzle?.readCardIds??[]) || before.trainPuzzle?.solved!==after.trainPuzzle?.solved
        || before.trainCinematic?.started!==after.trainCinematic?.started
        || !sameItems(before.foundClueIds??[],after.foundClueIds??[]) || before.corridor?.complete!==after.corridor?.complete || before.completed!==after.completed
        || before.flashlight.mode!==after.flashlight.mode || (before.ui.mode==='caught' && after.ui.mode==='explore');
      const changed=immediate || before.flashlight.charge!==after.flashlight.charge || before.elapsedSeconds!==after.elapsedSeconds || before.trainCinematic?.elapsed!==after.trainCinematic?.elapsed;
      if(!before.player.paused && ['explore','ending'].includes(before.ui.mode) && Number.isFinite(dt) && dt>0) elapsed+=dt;
      if(changed) {pending=after;dirty=true;if(status.state!=='error') status={state:'pending',message:'進度尚未儲存'};}
      else if(dirty) pending=after;
      if(immediate || (dirty && elapsed>=5-1e-9)) flush();
    },
    flush,
    status:()=>({...status}),
  };
}
