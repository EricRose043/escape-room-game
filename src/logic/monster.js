import { MAX_DT } from './movement.js';
import { buildNavigation,findPath,followPath,segmentClear } from './navigation.js';
import { monsterVision,inMonsterArea } from './monster-vision.js';

const EPS=1e-9;
const graphCache=new WeakMap();
// 座標也納入版本，避免相同 ID 的障礙物改動後沿用舊路。
const geometryKey=boxes=>boxes.map(b=>`${b.id??''}:${b.minX},${b.maxX},${b.minZ},${b.maxZ}`).join('|');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const samePoint=(a,b)=>a && b && distance(a,b)<EPS;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function createMonster(definition) {
  return {id:definition.id,areaId:definition.areaId,...definition.spawn,mode:'inactive',
    patrolIndex:0,waitRemaining:definition.dwellSeconds,path:[],pathIndex:1,
    walkDistance:0,navigationBlocked:false,geometryKey:null,
    lastSeen:null,lostSightSeconds:0,searchElapsed:0,returnNodeId:null,
    repathRemaining:0,pathGoal:null,plannedMode:null,pathPlanCount:0,visionRaycasts:0,
    contactLatched:false,contactCount:0,contactFeedbackRemaining:0,events:[]};
}

// 連續線段對圓的首次接觸比例，保留向外逃離的自由；不推出原本的角色。
// 玩家以兩個身體半徑相加檢查；怪物以 0.8 m 接觸距離停止逼近。
export function approachFraction(start,end,center,radius) {
  const dx=end.x-start.x,dz=end.z-start.z,a=dx*dx+dz*dz;
  if(a<EPS*EPS) return 1;
  const x=start.x-center.x,z=start.z-center.z,b=x*dx+z*dz,c=x*x+z*z-radius*radius;
  if(c<=EPS) return b<0 ? 0 : 1;
  const discriminant=b*b-a*c;
  if(discriminant<0) return 1;
  const hit=(-b-Math.sqrt(discriminant))/a;
  return hit>=0 && hit<1 ? hit : 1;
}

function enterSearch(monster) {
  return {...monster,mode:'search',searchElapsed:0,waitRemaining:0};
}
// 進櫃當幀即可失去目標（包括 dt=0），記憶保留櫃外最後位置。
export function loseMonsterTarget(monster) {
  const next=monster.mode==='chase'?enterSearch(monster):{...monster};
  return {...next,contactLatched:false,contactFeedbackRemaining:0,events:[],visionRaycasts:0};
}
function enterReturn(monster,definition,area) {
  const nearest=definition.patrol.map(id=>area.navigation.nodes.find(n=>n.id===id))
    .sort((a,b)=>distance(monster,a)-distance(monster,b))[0];
  return {...monster,mode:'return',returnNodeId:nearest.id,waitRemaining:0};
}

// 玩家半徑較小，能比怪物多貼近牆面 0.1 m；記憶仍保留真實看見的位置，
// 導航終點則投影至膨脹障礙物外最近的安全位置，不能把玩家位置改寫掉。
function safeGoal(target,graph) {
  if(!target) return null;
  const {bounds:b,radius:r,boxes}=graph;
  const inset=p=>({x:clamp(p.x,b.minX+r+EPS,b.maxX-r-EPS),z:clamp(p.z,b.minZ+r+EPS,b.maxZ-r-EPS)});
  let goal=inset(target);
  for(let pass=0;pass<4;pass++) {
    if(segmentClear(goal,goal,boxes,r,b)) return goal;
    const obstacle=boxes.find(box=>goal.x>=box.minX-r && goal.x<=box.maxX+r && goal.z>=box.minZ-r && goal.z<=box.maxZ+r);
    if(!obstacle) break;
    const candidates=[{x:obstacle.minX-r-2*EPS,z:goal.z},{x:obstacle.maxX+r+2*EPS,z:goal.z},
      {x:goal.x,z:obstacle.minZ-r-2*EPS},{x:goal.x,z:obstacle.maxZ+r+2*EPS}].map(inset)
      .filter(p=>segmentClear(p,p,boxes,r,b)).sort((a,c)=>distance(a,target)-distance(c,target));
    if(!candidates.length) break;
    goal=candidates[0];
  }
  return null;
}
function plan(monster,goal,graph,key) {
  const path=goal?findPath(graph,monster,goal):[];
  return {...monster,path,pathIndex:1,pathGoal:goal,plannedMode:monster.mode,geometryKey:key,
    navigationBlocked:path.length===0,pathPlanCount:monster.pathPlanCount+1};
}
function move(monster,dt,speed,definition,area,boxes,player) {
  const followed=followPath(monster,monster.path,dt,{speed,turnSpeed:definition.turnSpeed,
    radius:definition.radius+definition.clearance},boxes,area.bounds);
  const {blocked,remainingSeconds,...moved}=followed;
  const fraction=player.hidden?1:approachFraction(monster,moved,player,definition.contactDistance);
  if(fraction<1) {
    moved.x=monster.x+(moved.x-monster.x)*fraction;moved.z=monster.z+(moved.z-monster.z)*fraction;
    moved.walkDistance=monster.walkDistance+distance(monster,moved);
    moved.pathIndex=monster.pathIndex;
  }
  return {monster:{...moved,navigationBlocked:blocked},remainingSeconds:fraction<1?0:remainingSeconds};
}
function patrol(monster,time,definition,area,player,boxes,graph,key) {
  let next=monster;
  if(next.waitRemaining>0) {
    const used=Math.min(time,next.waitRemaining);
    next={...next,waitRemaining:Math.max(0,next.waitRemaining-used)};time-=used;
    if(time<EPS) return next;
  }
  if(next.navigationBlocked && next.path.length===0 && next.geometryKey===key && next.plannedMode==='patrol') return next;
  if(next.path.length===0 || next.geometryKey!==key || next.plannedMode!=='patrol') {
    const targetId=definition.patrol[(next.patrolIndex+1)%definition.patrol.length];
    next=plan(next,area.navigation.nodes.find(n=>n.id===targetId),graph,key);
  }
  if(next.path.length===0) return next;
  const followed=move(next,time,definition.patrolSpeed,definition,area,boxes,player);
  next=followed.monster;
  if(!next.navigationBlocked && next.pathIndex>=next.path.length) {
    next={...next,patrolIndex:(next.patrolIndex+1)%definition.patrol.length,
      waitRemaining:Math.max(0,definition.dwellSeconds-followed.remainingSeconds),path:[],pathIndex:1};
  }
  return next;
}
function pursue(monster,time,definition,area,player,boxes,graph,key) {
  let next=monster;
  const target=next.mode==='return' ? area.navigation.nodes.find(n=>n.id===next.returnNodeId) : next.lastSeen;
  const goal=safeGoal(target,graph);
  const dirty=next.plannedMode!==next.mode || next.geometryKey!==key || !samePoint(next.pathGoal,goal);
  if(dirty && next.repathRemaining<=EPS) {
    next=plan(next,goal,graph,key);next.repathRemaining=definition.repathSeconds;
    if(next.navigationBlocked && next.mode==='chase') next=enterSearch(next);
  }
  // 模式切換時舊路線可以先停止，等待節流到期；不能沿不相關的舊目標走。
  if(next.plannedMode!==next.mode || next.path.length===0) {
    if(next.mode==='search') next.yaw+=Math.min(definition.turnSpeed,Math.PI/3)*time;
    return next;
  }
  const speed=next.mode==='chase'?definition.chaseSpeed:next.mode==='search'?definition.searchSpeed:definition.returnSpeed;
  const followed=move(next,time,speed,definition,area,boxes,player);next=followed.monster;
  if(next.navigationBlocked && next.mode==='chase') return enterSearch(next);
  if(next.pathIndex>=next.path.length) {
    if(next.mode==='return') {
      next={...next,mode:'patrol',patrolIndex:definition.patrol.indexOf(next.returnNodeId),
        waitRemaining:definition.dwellSeconds,path:[],pathIndex:1,lastSeen:null};
    } else if(next.mode==='search') {
      // 原地察看使用模擬時間，左右擺頭不讀取不可見玩家的位置。
      const direction=Math.floor(next.searchElapsed)%2===0?1:-1;
      next.yaw+=direction*Math.min(definition.turnSpeed,Math.PI/3)*followed.remainingSeconds;
    }
  } else if(next.navigationBlocked && next.mode==='search') {
    next.yaw+=Math.min(definition.turnSpeed,Math.PI/3)*time;
  }
  return next;
}

export function updateMonster(state,definition,area,player,dt,boxes,context={}) {
  const time=Number.isFinite(dt)?Math.max(0,Math.min(MAX_DT,dt)):0;
  if(time===0 || player.paused) return state;
  player={...player,hidden:Boolean(context.hidden)};
  let next={...state,events:[],repathRemaining:Math.max(0,state.repathRemaining-time),
    contactFeedbackRemaining:Math.max(0,state.contactFeedbackRemaining-time)};
  if(next.mode==='inactive') {
    if(!inMonsterArea(player,area)) return state;
    next.mode='patrol';
  }
  const visible=monsterVision(next,definition,area,player,context.occluderBoxes??boxes,context);
  next.visionRaycasts=visible.raycasts;
  if(visible.visible) {
    next.lastSeen={x:player.x,z:player.z};next.lostSightSeconds=0;
    if(next.mode!=='chase') next={...next,mode:'chase',waitRemaining:0,searchElapsed:0,investigate:false};
  } else if(next.mode==='chase') {
    next.lostSightSeconds+=time;
    if(context.hidden || !inMonsterArea(player,area) || next.lostSightSeconds>=definition.lostSightSeconds-EPS) next=enterSearch(next);
  }
  if(next.mode==='search') {
    if(!next.investigate||(next.lastSeen&&distance(next,next.lastSeen)<=.6)||next.navigationBlocked) next.searchElapsed=Math.min(definition.searchSeconds,next.searchElapsed+time);
    if(next.searchElapsed>=definition.searchSeconds-EPS) next=enterReturn(next,definition,area);
  }
  const key=geometryKey(boxes),radius=definition.radius+definition.clearance;
  let cached=graphCache.get(area);
  if(!cached || cached.key!==key || cached.radius!==radius) {
    cached={key,radius,graph:buildNavigation(area.navigation,boxes,radius,area.bounds)};
    graphCache.set(area,cached);
  }
  next=next.mode==='patrol' ? patrol(next,time,definition,area,player,boxes,cached.graph,key)
    : pursue(next,time,definition,area,player,boxes,cached.graph,key);
  // 使用更新前距離重置遲滯，避免同一幀先移回去便漏掉 1.0 m 的離開。
  if(context.hidden) {next.contactLatched=false;next.contactFeedbackRemaining=0;}
  else if(distance(state,player)>=definition.contactResetDistance-EPS) next.contactLatched=false;
  if(!context.hidden && inMonsterArea(player,area) && distance(next,player)<=definition.contactDistance+EPS && !next.contactLatched) {
    next.contactLatched=true;next.contactCount++;next.contactFeedbackRemaining=0.8;
    next.events=[{type:'contact',monsterId:next.id}];
  }
  return next;
}
