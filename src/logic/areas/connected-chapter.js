import {CHASE_CORRIDOR} from './chase-corridor.js';
import {EXIT} from './exit.js';
import {LOADING_BAY} from './loading-bay.js';
import {EXIT_CODE_CLUES} from '../puzzles/exit-code.js';
const bounds=(b,dx,dz)=>({...b,minX:b.minX+dx,maxX:b.maxX+dx,minZ:b.minZ+dz,maxZ:b.maxZ+dz});
const point=(p,dx,dz)=>({...p,x:p.x+dx,z:p.z+dz});
// Preserve the collaborators' standalone modules; placement is an owner integration decision.
function place(area,dx,dz){return {...area,bounds:bounds(area.bounds,dx,dz),
 boxes:area.boxes.map(b=>bounds(b,dx,dz)),items:area.items.map(b=>bounds(b,dx,dz)),
 doors:area.doors.map(d=>({...d,bounds:bounds(d.bounds,dx,dz)})),devices:area.devices.map(d=>({...d,bounds:bounds(d.bounds,dx,dz)})),
 clues:area.clues.map(c=>({...c,position:point(c.position,dx,dz)})),signs:area.signs.map(s=>({...s,position:point(s.position,dx,dz)})),lights:area.lights.map(l=>({...l,position:point(l.position,dx,dz)}))};}
const wall=(id,minX,maxX,minZ,maxZ,height=4)=>({id,kind:'wall',minX,maxX,minY:0,maxY:height,minZ,maxZ});
// 文件互動範圍跟著可見紙面，留少許邊緣容錯；薄度避免遮住文件閱讀字幕。
const documentBounds=({position:p,normal:n,width,height})=>{
 const halfX=Math.abs(n.z)*(width/2+.08)+Math.abs(n.x)*.003;
 const halfZ=Math.abs(n.x)*(width/2+.08)+Math.abs(n.z)*.003;
 return {minX:p.x-halfX,maxX:p.x+halfX,minY:p.y-height/2-.08,maxY:p.y+height/2+.08,minZ:p.z-halfZ,maxZ:p.z+halfZ};
};
const corridorClue={...EXIT_CODE_CLUES[1],alwaysVisible:true,position:{x:23.35,y:2.2,z:-7.68},normal:{x:0,y:0,z:1},width:2.3,height:.35};
export const INTEGRATED_CORRIDOR={...CHASE_CORRIDOR,name:'追逐走廊',
 doors:CHASE_CORRIDOR.doors.map(d=>({...d,destination:{type:'area',areaId:'chase-corridor'},openWhen:{type:'corridorGate'}})),
 devices:[{id:'corridor.clue-note',kind:'clueNote',name:EXIT_CODE_CLUES[1].text,clueId:EXIT_CODE_CLUES[1].id,bounds:documentBounds(corridorClue)}],
 clues:[corridorClue],
 extraSurfaces:[{id:'corridor.threshold-floor',kind:'floor',minX:21.2,maxX:21.4,minY:-.2,maxY:0,minZ:-7.4,maxZ:-5.6},
 {id:'corridor.threshold-ceiling',kind:'ceiling',minX:21.2,maxX:21.4,minY:3.5,maxY:3.7,minZ:-7.4,maxZ:-5.6}],
};
const exit=place(EXIT,18,-11);
const exitClues=exit.clues.map(c=>({...c,alwaysVisible:true,position:{x:51.92,y:2.2,z:-13.2}}));
export const INTEGRATED_EXIT={...exit,name:'出口控制廳',
 boxes:[...exit.boxes.filter(b=>b.id!=='exit.west'),wall('exit.west-north',39.8,40,-23,-18.7),wall('exit.west-south',39.8,40,-16.3,-11),
 {...wall('exit.west-lintel',39.8,40,-18.7,-16.3),minY:2.6,blocksMovement:false}],
 doors:[{id:'exit.entry-door',name:'追逐區隔離門',bounds:{minX:39.8,maxX:40,minY:0,maxY:2.6,minZ:-18.7,maxZ:-16.3},openWhen:{type:'corridorExit'},destination:{type:'area',areaId:'chase-corridor'}},
 {...exit.doors[0],destination:{type:'area',areaId:'loading-bay'}}],
 devices:[...exit.devices.map(d=>({...d,bounds:{...d.bounds,minZ:-22.3,maxZ:-20.1}})),{id:'exit.clue-note',kind:'clueNote',name:EXIT_CODE_CLUES[2].text,clueId:EXIT_CODE_CLUES[2].id,bounds:documentBounds(exitClues[0])}],
 extraSurfaces:[{id:'exit.threshold-floor',kind:'floor',minX:52,maxX:52.2,minY:-.2,maxY:0,minZ:-19,maxZ:-15},{id:'exit.threshold-ceiling',kind:'ceiling',minX:52,maxX:52.2,minY:4,maxY:4.2,minZ:-19,maxZ:-15}],
 puzzles:exit.puzzles.map(p=>({...p,requiresInstall:false})),
 clues:exitClues,
 checkpoint:{id:'exit.checkpoint',order:3,spawn:{x:41.2,z:-17.5,yaw:-Math.PI/2,pitch:0},floorId:'exit.floor',requires:{itemIds:['lobby.flashlight','lobby.employee-card'],puzzleIds:['power.main','production.sequence','production.color-sequence'],corridorComplete:true}},
};
const bay=place(LOADING_BAY,31,-11);
export const INTEGRATED_LOADING_BAY={...bay,
 boxes:[...bay.boxes,wall('bay.west-north',52,52.2,-23.5,-19,4.5),wall('bay.west-south',52,52.2,-15,-11.5,4.5)],
};
