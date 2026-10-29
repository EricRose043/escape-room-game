import {EXIT_CODE,EXIT_CLUE_IDS} from '../puzzles/exit-code.js';
const box=(id,kind,minX,maxX,minY,maxY,minZ,maxZ,extra={})=>({id,kind,minX,maxX,minY,maxY,minZ,maxZ,...extra});

// Standalone R2 module. It intentionally remains unregistered until the owner resolves
// its footprint overlap with the existing loading bay.
export const EXIT={
  id:'exit',name:'玩具工廠出口大廳',bounds:{minX:22,maxX:34,minZ:-12,maxZ:0},height:4,
  spawn:{x:23,z:-6,yaw:-Math.PI/2,pitch:0},
  boxes:[
    box('exit.north','wall',22,34,0,4,-12.2,-12),
    box('exit.south','wall',22,34,0,4,0,0.2),
    box('exit.west','wall',21.8,22,0,4,-12,0),
    box('exit.east-north','wall',34,34.2,0,4,-12,-8),
    box('exit.east-south','wall',34,34.2,0,4,-4,0),
    box('exit.east-lintel','wall',34,34.2,3,4,-8,-4,{blocksMovement:false}),
  ],
  doors:[{id:'exit.final-door',name:'工廠出口門',bounds:{minX:34,maxX:34.2,minY:0,maxY:3,minZ:-8,maxZ:-4},
    openWhen:{type:'puzzleSolved',puzzleId:'exit.final'},destination:{type:'reserved'}}],
  items:[],
  devices:[{id:'exit.final-keypad',kind:'keypad',name:'出口密碼控制板',puzzleId:'exit.final',bounds:{minX:33.3,maxX:33.8,minY:1,maxY:2,minZ:-7.1,maxZ:-4.9}}],
  puzzles:[{id:'exit.final',code:EXIT_CODE,clueIds:EXIT_CLUE_IDS,requiresAllClues:true}],
  clues:[{id:'exit.reverse-clue',puzzleId:'exit.final',text:'出口規則：將復位燈序反向輸入。',position:{x:33.92,y:2.3,z:-6},normal:{x:-1,y:0,z:0},width:2.4,height:0.4}],
  signs:[{id:'exit.title',text:'員工緊急出口',position:{x:28,y:3.2,z:-11.98},normal:{x:0,y:0,z:1},width:2.5,height:0.4}],
  lights:[{id:'exit.warning-light',position:{x:33.6,y:3.5,z:-6},offIntensity:1,onIntensity:8,color:0xd69b4b,distance:8}],
};

export const EXIT_CODE_PUZZLE=EXIT.puzzles[0];
