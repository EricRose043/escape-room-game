import { EYE_HEIGHT } from './movement.js';
import { rayBoxDistance } from './interaction.js';

export function inMonsterArea(point,area) {
  const b=area.bounds;
  return point.x>=b.minX && point.x<=b.maxX && point.z>=b.minZ && point.z<=b.maxZ;
}

// 一次判斷只有一條眼睛到玩家眼睛的射線；前置條件不成立便不射線。
// raycasts 是本次射線數，供純邏輯測試與效能診斷，不使用真實時鐘。
export function monsterVision(monster,definition,area,player,occluders,{hidden=false}={}) {
  const noRay={visible:false,raycasts:0};
  if(monster.mode==='inactive' || player.paused || hidden || !inMonsterArea(player,area) || !inMonsterArea(monster,area)) return noRay;
  const vision=definition.vision;
  const dx=player.x-monster.x,dz=player.z-monster.z,dy=EYE_HEIGHT-vision.eyeHeight;
  const horizontal=Math.hypot(dx,dz),distance=Math.hypot(dx,dy,dz);
  if(!Number.isFinite(distance) || distance>vision.distance+1e-9) return noRay;
  const forward=horizontal<1e-9 ? 1 : (-Math.sin(monster.yaw)*dx-Math.cos(monster.yaw)*dz)/horizontal;
  if(forward<Math.cos(vision.halfAngle)-1e-9) return noRay;
  const ray={origin:{x:monster.x,y:vision.eyeHeight,z:monster.z},
    direction:{x:dx/distance,y:dy/distance,z:dz/distance}};
  const blocked=occluders.some(box=>{
    const hit=rayBoxDistance(ray,box);
    return hit!==null && hit<=distance+1e-9;
  });
  return {visible:!blocked,raycasts:1};
}
