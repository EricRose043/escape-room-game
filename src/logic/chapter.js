import { WORLD, ITEMS, getGeometry } from './world.js';
import { createPlayer, updatePlayer } from './movement.js';
import { createFlashlight, updateEquipment } from './flashlight.js';

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
  const next=updateEquipment(state,player,equipmentActions,dt,ITEMS,geometry.occluderBoxes);
  return {...next,player};
}
