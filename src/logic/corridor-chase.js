import {CHASE_CORRIDOR} from './areas/chase-corridor.js';
import {createCorridorDoors,updateCorridorDoors} from './corridor-doors.js';
const route=[...CHASE_CORRIDOR.route,{x:41.2,z:-17.5}];
export function corridorPoint(distance){let left=Math.max(0,distance);for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(left<=length)return {x:a.x+(b.x-a.x)*left/length,z:a.z+(b.z-a.z)*left/length,yaw:Math.atan2(a.x-b.x,a.z-b.z)};left-=length;}return {...route.at(-1),yaw:-Math.PI/2};}
export function corridorDistanceAt(point){
 let walked=0,closest=Infinity,answer=0;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/(length*length)));
  const distance=Math.hypot(point.x-a.x-dx*t,point.z-a.z-dz*t);
  if(distance<closest){closest=distance;answer=walked+t*length;}walked+=length;
 }return answer;
}
export function createCorridor(){return {active:false,complete:false,distance:0,chaser:corridorPoint(0),gates:createCorridorDoors(),caught:false};}
export function updateCorridor(state,player,dt,{speed=2.1,absent=false}={}){
 if(state.complete||state.caught)return state;let next=state;
 if(!state.active){if(player.x<24.8||player.x>28.2||player.z< -7.7||player.z> -5.3)return state;next={...state,active:true,gates:updateCorridorDoors(state.gates,22,-6.5,CHASE_CORRIDOR)};}
 if(absent){const complete=player.x>=40.6&&player.z>=-18.7&&player.z<=-16.3;return {...next,complete,active:!complete,caught:false,gates:updateCorridorDoors(next.gates,player.x,player.z,CHASE_CORRIDOR)};}
 const distance=next.distance+(Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0)*Math.max(2.1,Math.min(2.28,Number.isFinite(speed)?speed:2.1)),chaser=corridorPoint(distance);
 const complete=player.x>=40.6&&player.z>=-18.7&&player.z<=-16.3;
 return {...next,distance,chaser,complete,active:!complete,caught:!complete&&Math.hypot(player.x-chaser.x,player.z-chaser.z)<=.8,
 gates:updateCorridorDoors(next.gates,chaser.x,chaser.z,CHASE_CORRIDOR)};
}
