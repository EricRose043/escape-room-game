import { MAX_DT } from './movement.js';
import { buildNavigation,findPath,followPath } from './navigation.js';

const graphCache=new WeakMap();
// 座標也納入版本，避免相同 ID 的障礙物改動後沿用舊路。
const geometryKey=boxes=>boxes.map(b=>`${b.id??''}:${b.minX},${b.maxX},${b.minZ},${b.maxZ}`).join('|');
const within=(p,b)=>p.x>=b.minX && p.x<=b.maxX && p.z>=b.minZ && p.z<=b.maxZ;
export function createMonster(definition) {
  return {id:definition.id,areaId:definition.areaId,...definition.spawn,mode:'inactive',
    patrolIndex:0,waitRemaining:definition.dwellSeconds,path:[],pathIndex:1,
    walkDistance:0,navigationBlocked:false,geometryKey:null};
}

export function updateMonster(state,definition,area,player,dt,boxes) {
  let time=Number.isFinite(dt)?Math.max(0,Math.min(MAX_DT,dt)):0;
  if(time===0 || player.paused) return state;
  let next={...state};
  if(next.mode==='inactive') {
    if(!within(player,area.bounds)) return state;
    next.mode='patrol';
  }
  if(next.mode!=='patrol') return next;
  const key=geometryKey(boxes),radius=definition.radius+definition.clearance;
  let cached=graphCache.get(area);
  if(!cached || cached.key!==key || cached.radius!==radius) {
    cached={key,radius,graph:buildNavigation(area.navigation,boxes,radius,area.bounds)};
    graphCache.set(area,cached);
  }
  if(next.waitRemaining>0) {
    const used=Math.min(time,next.waitRemaining);
    next.waitRemaining=Math.max(0,next.waitRemaining-used);time-=used;
    if(time<1e-9) return next;
  }
  // 無路可走便等幾何變更，避免逐幀重算同一個失敗路徑。
  if(next.navigationBlocked && next.path.length===0 && next.geometryKey===key) return next;
  if(next.path.length===0 || next.geometryKey!==key) {
    const targetId=definition.patrol[(next.patrolIndex+1)%definition.patrol.length];
    const target=area.navigation.nodes.find(n=>n.id===targetId);
    next.path=findPath(cached.graph,next,target);next.pathIndex=1;next.geometryKey=key;
    next.navigationBlocked=next.path.length===0;
  }
  if(next.path.length===0) return next;
  const followed=followPath(next,next.path,time,{speed:definition.patrolSpeed,turnSpeed:definition.turnSpeed,radius},boxes,area.bounds);
  const {blocked,remainingSeconds,...moved}=followed;
  next={...moved,navigationBlocked:blocked};
  if(!blocked && next.pathIndex>=next.path.length) {
    next.patrolIndex=(next.patrolIndex+1)%definition.patrol.length;
    next.waitRemaining=Math.max(0,definition.dwellSeconds-remainingSeconds);
    next.path=[];next.pathIndex=1;
  }
  return next;
}
