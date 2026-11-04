import {MAX_DT,EYE_HEIGHT,circleOverlapsBox} from './movement.js';
import {createMonster} from './monster.js';
import {inMonsterArea} from './monster-vision.js';
import {rayBoxDistance} from './interaction.js';
import {corridorPoint,corridorDistanceAt} from './corridor-chase.js';

export const ENCOUNTER_ABSENCE_SECONDS=5;
export const encounterAbsent=state=>Boolean(state.encounterRecovery);
export function beginEncounterRecovery(state,definitions){
 return {...state,ui:{mode:'explore'},events:[],flashlight:{...state.flashlight,enabled:false},
  monsters:Object.fromEntries(definitions.map(d=>[d.id,createMonster(d)])),
  corridor:state.corridor?{...state.corridor,caught:false}:state.corridor,
  encounterRecovery:{remaining:ENCOUNTER_ABSENCE_SECONDS}};
}
// 不在玩家正前方或貼身重現；正前方候選必須確實被場景遮住。
function concealedFromPlayer(player,point,occluders){
 const dx=point.x-player.x,dz=point.z-player.z,distance=Math.hypot(dx,dz);
 if(distance<4)return false;
 if(-Math.sin(player.yaw)*dx-Math.cos(player.yaw)*dz<=0)return true;
 const dy=1.5-EYE_HEIGHT,length=Math.hypot(distance,dy);
 const ray={origin:{x:player.x,y:EYE_HEIGHT,z:player.z},direction:{x:dx/length,y:dy/length,z:dz/length}};
 return occluders.some(box=>{const hit=rayBoxDistance(ray,box);return hit!==null&&hit<length-.1;});
}
export function advanceEncounterRecovery(state,actions,dt,{definitions,world,geometry}){
 if(!encounterAbsent(state))return state;
 const stopped=state.player.paused||actions.gameplayActive===false||actions.pausePressed||actions.forcePause||actions.focusLost||!['explore','hiding'].includes(state.ui.mode);
 if(stopped)return state;
 const seconds=Number.isFinite(dt)?Math.max(0,Math.min(MAX_DT,dt)):0;
 if(seconds===0)return state;
 const remaining=Math.max(0,state.encounterRecovery.remaining-seconds);
 if(remaining>1e-9)return {...state,encounterRecovery:{remaining}};
 let corridor=state.corridor;
 if(corridor?.active&&!corridor.complete){
  const distance=Math.max(0,corridorDistanceAt(state.player)-5.5),chaser=corridorPoint(distance);
  if(Math.hypot(chaser.x-state.player.x,chaser.z-state.player.z)<3)return {...state,encounterRecovery:{remaining:0}};
  corridor={...corridor,distance,chaser,caught:false,gates:{...corridor.gates,previous:{x:chaser.x,z:chaser.z}}};
 }
 const monsters={};
 for(const d of definitions){
  const area=world.areas.find(a=>a.id===d.areaId),initial=createMonster(d);
  if(!inMonsterArea(state.player,area)||corridor?.active||corridor?.complete){monsters[d.id]=initial;continue;}
  const candidates=[d.spawn,...d.patrol.map(id=>area.navigation.nodes.find(n=>n.id===id))];
  const point=candidates.find(p=>p&&concealedFromPlayer(state.player,p,geometry.occluderBoxes)
   &&!geometry.collisionBoxes.some(b=>b.minY<d.height&&b.maxY>0&&circleOverlapsBox(p.x,p.z,b,d.radius+d.clearance)));
  // 所有點都正被注視時繼續隱去，等玩家轉身／離開後才恢復。
  if(!point)return {...state,encounterRecovery:{remaining:0}};
  const patrolIndex=Math.max(0,d.patrol.findIndex(id=>{const n=area.navigation.nodes.find(n=>n.id===id);return n.x===point.x&&n.z===point.z;}));
  monsters[d.id]={...initial,x:point.x,z:point.z,yaw:Math.atan2(state.player.x-point.x,state.player.z-point.z),mode:'patrol',patrolIndex};
 }
 return {...state,corridor,monsters,encounterRecovery:null,events:[]};
}
export function hideAbsentMonsters(state){
 if(!encounterAbsent(state)||Object.values(state.monsters).every(m=>m.mode==='inactive'))return state;
 const monsters=Object.fromEntries(Object.entries(state.monsters).map(([id,m])=>[id,m.mode==='inactive'?m:{...m,mode:'inactive',playerVisible:false,events:[]} ]));
 return {...state,monsters};
}
export function monsterPresentation(state,id){
 const base=state.monsters[id];
 if(encounterAbsent(state))return {...base,mode:'inactive'};
 return state.corridor?.active?{...base,...state.corridor.chaser,mode:'chase',walkDistance:state.corridor.distance}:base;
}
