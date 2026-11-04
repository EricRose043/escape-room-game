const areaAt=(world,player)=>world.areas.find(area=>player.x>=area.bounds.minX&&player.x<=area.bounds.maxX
  &&player.z>=area.bounds.minZ&&player.z<=area.bounds.maxZ)?.id??null;
const hasChasingMonster=state=>Object.values(state.monsters??{}).some(monster=>monster.mode==='chase');

// Return one edge-triggered midgame beat; chase guidance takes priority over area-entry text.
export function storyBeat(previous,next,world) {
  if(!previous||!next) return null;
  const had=(state,id)=>state.inventory?.itemIds?.includes(id)===true;
  if(!had(previous,'lobby.factory-map')&&had(next,'lobby.factory-map')) return 'map-found';
  if(!had(previous,'lobby.employee-card')&&had(next,'lobby.employee-card')) return 'card-found';
  if(areaAt(world,previous.player)!=='power-room'&&areaAt(world,next.player)==='power-room') return 'power-room-entry';
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
  'power-room-entry':'匿名訊息警告別重啟主電源。可不恢復電力，通往貨運月台的門就不會開。你只能冒險一試。',
  'power-restored':'主電力恢復了，通往裝配線的門也開了。備援線路同時接向展示區——那張警告是真的。',
  'production-entry':'裝配線重新運轉了。監視器說玩偶不在展示台上；先找月台檢修碼，避開玩偶視線。只能在被發現前躲進「緊急避難」櫃，一旦被看見就會被抓住。',
  'first-chase':'你把電接回來了——展示區的備援電路也跟著啟動。牠看見你了，現在已經來不及逃了。',
  'loading-door':'檢修碼解除貨運門鎖了。月台列車是離開工廠的唯一出口，趁玩偶還沒找到你。',
  'train-started':'員工卡已啟動撤離列車。快登車；這座工廠不會再給你第二次機會。',
});
