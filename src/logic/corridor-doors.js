export function createCorridorDoors(){return {previous:null,closedIds:[]};}

// trigger 放在門後、離門板至少玩家半徑處。以真實位移線段判斷，避免在牆外平行行走也關門。
export function updateCorridorDoors(state,playerX,playerZ,corridorDef) {
  if(!Number.isFinite(playerX)||!Number.isFinite(playerZ))return state;
  const previous=state.previous,next={x:playerX,z:playerZ},closedIds=[...state.closedIds];
  if(previous) for(const door of corridorDef.doors) {
    if(closedIds.includes(door.id))continue;
    const t=door.trigger;
    if(!t||!['x','z'].includes(t.axis)||![-1,1].includes(t.direction))continue;
    const old=(previous[t.axis]-t.value)*t.direction,current=(next[t.axis]-t.value)*t.direction;
    if(!(old<0&&current>=0))continue;
    const fraction=-old/(current-old),crossAxis=t.axis==='x'?'z':'x';
    const cross=previous[crossAxis]+(next[crossAxis]-previous[crossAxis])*fraction;
    if(cross>=t.minCross&&cross<=t.maxCross)closedIds.push(door.id);
  }
  return {previous:next,closedIds};
}
