const areaAt=(world,player)=>world.areas.find(area=>player.x>=area.bounds.minX&&player.x<=area.bounds.maxX
  &&player.z>=area.bounds.minZ&&player.z<=area.bounds.maxZ)?.id??null;
const hasChasingMonster=state=>Object.values(state.monsters??{}).some(monster=>monster.mode==='chase');

// Return one edge-triggered midgame beat; chase guidance takes priority over area-entry text.
export function storyBeat(previous,next,world) {
  if(!previous||!next) return null;
  if(!previous.trainStarted&&next.trainStarted) return 'train-started';
  if(!hasChasingMonster(previous)&&hasChasingMonster(next)) return 'first-chase';
  if(!previous.puzzles?.['production.sequence']?.restored&&next.puzzles?.['production.sequence']?.restored) return 'loading-door';
  if(!previous.puzzles?.['power.main']?.restored&&next.puzzles?.['power.main']?.restored) return 'power-restored';
  if(areaAt(world,previous.player)!=='production'&&areaAt(world,next.player)==='production') return 'production-entry';
  return null;
}

export const STORY_BEAT_TEXT=Object.freeze({
  'power-restored':'主電力恢復了。配電盤的備用線路也接通了展示區——監視器裡的玩偶位置變了。',
  'production-entry':'裝配線已通電。找出月台檢修碼；走道旁的置物櫃可以躲藏。',
  'first-chase':'腳步聲正朝你逼近！利用機台遮住視線，或躲進置物櫃。',
  'loading-door':'貨運月台門已解鎖。趁玩偶離開時前往出口。',
  'train-started':'列車啟動了！快登車離開工廠。',
});
