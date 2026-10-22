import { PLAYER_RADIUS, updatePlayer } from './movement.js';
import { viewRay, rayBoxDistance, INTERACT_DISTANCE } from './interaction.js';
import { segmentClear } from './navigation.js';

export const HIDING_YAW_LIMIT=Math.PI/4;
export const HIDING_PITCH_LIMIT=25*Math.PI/180;
const EPS=1e-9;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

function doorFrame(locker) {
  const b=locker.bounds,n={x:-Math.sin(locker.doorYaw),z:-Math.cos(locker.doorYaw)};
  const t={x:n.z,z:-n.x},center={x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2};
  const depth=(Math.abs(n.x)*(b.maxX-b.minX)+Math.abs(n.z)*(b.maxZ-b.minZ))/2;
  const halfWidth=(Math.abs(t.x)*(b.maxX-b.minX)+Math.abs(t.z)*(b.maxZ-b.minZ))/2;
  return {n,t,center,depth,halfWidth};
}
const project=(point,center,axis)=>(point.x-center.x)*axis.x+(point.z-center.z)*axis.z;

// 必須先打到正面；側板與背板仍遮擋共用射線，但不是入口。
export function isLockerFront(player,locker) {
  const {n,center,depth}=doorFrame(locker),ray=viewRay(player),hit=rayBoxDistance(ray,locker.bounds);
  if(player.paused || hit===null || hit>INTERACT_DISTANCE+EPS || project(player,center,n)<=depth) return false;
  const point={x:ray.origin.x+ray.direction.x*hit,z:ray.origin.z+ray.direction.z*hit};
  return Math.abs(project(point,center,n)-depth)<=EPS;
}

// 只有自己的櫃門是通道。整段圓柱掃掠仍檢查其他牆與怪物，
// 並檢查門口兩側間距，不能靠略過櫃體便斜穿側板。
function passageClear(start,end,locker,boxes,bodies) {
  const {n,t,center,depth,halfWidth}=doorFrame(locker);
  const a=project(start,center,n),b=project(end,center,n);
  if(Math.abs(a-b)<EPS) return false;
  for(const plane of [depth,depth+PLAYER_RADIUS]) {
    const fraction=(plane-a)/(b-a);
    if(fraction>=0 && fraction<=1) {
      const crossing={x:start.x+(end.x-start.x)*fraction,z:start.z+(end.z-start.z)*fraction};
      if(Math.abs(project(crossing,center,t))>halfWidth-PLAYER_RADIUS+EPS) return false;
    }
  }
  if(!segmentClear(start,end,boxes.filter(box=>box.id!==locker.id),PLAYER_RADIUS)) return false;
  return !bodies.some(body=>{
    const dx=end.x-start.x,dz=end.z-start.z,lengthSquared=dx*dx+dz*dz;
    const fraction=lengthSquared>0?clamp(((body.x-start.x)*dx+(body.z-start.z)*dz)/lengthSquared,0,1):0;
    return Math.hypot(start.x+dx*fraction-body.x,start.z+dz*fraction-body.z)<PLAYER_RADIUS+body.radius-EPS;
  });
}

export function tryEnterHiding(state,locker,boxes,bodies=[]) {
  if(state.ui.mode!=='explore' || !isLockerFront(state.player,locker)) return state;
  if(!passageClear(state.player,locker.inside,locker,boxes,bodies)) {
    return {...state,events:[],ui:{...state.ui,message:'櫃門前有阻擋，請靠近正面再試',messageTargetId:locker.id}};
  }
  return {...state,events:[],
    player:{...state.player,...locker.inside,yaw:locker.doorYaw,pitch:0},
    flashlight:{...state.flashlight,enabled:false},ui:{mode:'hiding',lockerId:locker.id,message:''}};
}

export function tryLeaveHiding(state,locker,boxes,bodies=[]) {
  if(state.player.paused || state.ui.mode!=='hiding' || state.ui.lockerId!==locker.id) return state;
  for(const point of locker.exitCandidates) {
    if(!passageClear(state.player,point,locker,boxes,bodies)) continue;
    return {...state,events:[],player:{...state.player,...point},ui:{mode:'explore'}};
  }
  return {...state,events:[],ui:{...state.ui,message:'出口被占用，請稍候再試'}};
}

export function updateHidingPlayer(player,actions,dt,locker) {
  const looked=updatePlayer(player,{look:actions.look},dt,[]);
  return {...looked,...locker.inside,
    // 櫃內角度連續累加再夾限，不能對大幅滑鼠位移取週期而跳到另一側。
    yaw:locker.doorYaw+clamp(looked.yaw-locker.doorYaw,-HIDING_YAW_LIMIT,HIDING_YAW_LIMIT),
    pitch:clamp(looked.pitch,-HIDING_PITCH_LIMIT,HIDING_PITCH_LIMIT)};
}
