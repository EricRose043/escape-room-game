import { WORLD } from './world.js';
import { PLAYER_RADIUS } from './movement.js';

export const CHECKPOINTS = WORLD.areas.flatMap(area => area.checkpoint
  ? [{...area.checkpoint,areaId:area.id}] : []).sort((a,b)=>a.order-b.order);

export function checkpointReady(state, checkpoint) {
  return checkpoint.requires.itemIds.every(id=>state.inventory.itemIds.includes(id))
    && checkpoint.requires.puzzleIds.every(id=>state.puzzles[id]?.restored===true);
}

// 只在玩家整個身體進區後升級；平台是回復位置，不是生產線的觸發區。
export function advanceCheckpoint(state) {
  const current=CHECKPOINTS.find(c=>c.id===state.checkpointId);
  let selected=current;
  for(const checkpoint of CHECKPOINTS) {
    if(checkpoint.order<=(selected?.order??-1) || !checkpointReady(state,checkpoint)) continue;
    const b=WORLD.areas.find(a=>a.id===checkpoint.areaId).bounds,p=state.player,r=PLAYER_RADIUS;
    if(p.x>=b.minX+r && p.x<=b.maxX-r && p.z>=b.minZ+r && p.z<=b.maxZ-r) selected=checkpoint;
  }
  return selected && selected!==current ? {...state,checkpointId:selected.id} : state;
}
