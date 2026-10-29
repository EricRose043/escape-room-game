const areaAt=(world,player)=>world.areas.find(area=>player.x>=area.bounds.minX&&player.x<=area.bounds.maxX
  &&player.z>=area.bounds.minZ&&player.z<=area.bounds.maxZ)?.id??null;
const hasChasingMonster=state=>Object.values(state.monsters??{}).some(monster=>monster.mode==='chase');

// Return one edge-triggered midgame beat; chase guidance takes priority over area-entry text.
export function storyBeat(previous,next,world) {
  if(!previous||!next) return null;
  const had=(state,id)=>state.inventory?.itemIds?.includes(id)===true;
  if(!had(previous,'lobby.factory-map')&&had(next,'lobby.factory-map')) return 'map-found';
  if(!had(previous,'lobby.employee-card')&&had(next,'lobby.employee-card')) return 'card-found';
  if(!previous.trainStarted&&next.trainStarted) return 'train-started';
  if(!hasChasingMonster(previous)&&hasChasingMonster(next)) return 'first-chase';
  if(!previous.puzzles?.['production.sequence']?.restored&&next.puzzles?.['production.sequence']?.restored) return 'loading-door';
  if(!previous.puzzles?.['power.main']?.restored&&next.puzzles?.['power.main']?.restored) return 'power-restored';
  if(areaAt(world,previous.player)!=='production'&&areaAt(world,next.player)==='production') return 'production-entry';
  return null;
}

export const STORY_BEAT_TEXT=Object.freeze({
  'map-found':'這張舊地圖標出了控制室、裝配線和貨運月台。出口在工廠最深處。',
  'card-found':'員工卡還能讀取。控制室或許保留著封廠前的值班紀錄。',
  'power-restored':'主電力恢復了。備援線路也接向展示區——那張維修單的警告，恐怕不是例行檢查。',
  'production-entry':'裝配線重新運轉了。監視器說玩偶不在展示台上；先找月台檢修碼，必要時躲進標有「緊急避難」的櫃子。',
  'first-chase':'你把電接回來了——展示區的備援電路也跟著啟動。腳步聲正朝你逼近，躲進置物櫃或繞過機台！',
  'loading-door':'檢修碼解除貨運門鎖了。月台列車是離開工廠的唯一出口，趁玩偶還沒找到你。',
  'train-started':'員工卡已啟動撤離列車。快登車；這座工廠不會再給你第二次機會。',
});
