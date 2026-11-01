import {COLOR_SEQUENCE} from '../puzzles/color-sequence.js';
import {EXIT_CODE_CLUES} from '../puzzles/exit-code.js';
const box = (id, kind, minX, maxX, minY, maxY, minZ, maxZ, extra = {}) => ({id,kind,minX,maxX,minY,maxY,minZ,maxZ,...extra});
const node = (name,x,z) => ({id:`production.nav.${name}`,x,z});
const edge = (from,to) => ({from:`production.nav.${from}`,to:`production.nav.${to}`});
export const PRODUCTION = {
  id:'production',name:'玩具裝配線',bounds:{minX:7.2,maxX:21.2,minZ:-12.5,maxZ:-0.5},height:3.5,
  checkpoint: {id:'production.checkpoint',order:2,spawn:{x:6.5,z:-6.5,yaw:-Math.PI/2,pitch:0},
    floorId:'power.landing-floor',requires:{itemIds:['lobby.flashlight','lobby.employee-card'],puzzleIds:['power.main']}},
  boxes:[
    box('production.west-north','wall',7,7.2,0,3.5,-12.5,-7.4),
    box('production.west-south','wall',7,7.2,0,3.5,-5.6,-0.5),
    box('production.west-lintel','wall',7,7.2,2.6,3.5,-7.4,-5.6,{blocksMovement:false}),
    box('production.north','wall',7,21.4,0,3.5,-12.7,-12.5),
    box('production.south','wall',7,21.4,0,3.5,-0.5,-0.3),
    box('production.east-north','wall',21.2,21.4,0,3.5,-12.5,-7.4),
    box('production.east-south','wall',21.2,21.4,0,3.5,-5.6,-0.5),
    box('production.east-lintel','wall',21.2,21.4,2.6,3.5,-7.4,-5.6,{blocksMovement:false}),
    box('production.machine-a','machine',11.2,13.2,0,2.2,-9,-4),
    box('production.machine-b','machine',15.2,17.2,0,2.2,-8,-3),
  ],
  doors:[{id:'production.east-door',name:'貨運區門',bounds:{minX:21.2,maxX:21.4,minY:0,maxY:2.6,minZ:-7.4,maxZ:-5.6},
    openWhen:{type:'puzzleSolved',puzzleId:'production.sequence'},destination:{type:'area',areaId:'chase-corridor'}}],
  items:[],clues:[{id:'production.sequence-clue',puzzleId:'production.sequence',text:'月台檢修碼：3－1－4－2',position:{x:20.9,y:2.1,z:-6.4},normal:{x:-1,y:0,z:0},width:0.8,height:0.3}],puzzles:[{id:'production.sequence',code:'3142',requiresInstall:false},COLOR_SEQUENCE],
  // 櫃體碰撞／視線仍用完整外框；畫面薄板的窺視縫對齊眼高。
  devices:[
    {id:'production.locker-l1',kind:'locker',name:'西側置物櫃',bounds:{minX:8,maxX:9,minY:0,maxY:2.2,minZ:-3,maxZ:-2.2},
      doorYaw:Math.PI,inside:{x:8.5,z:-2.6},exitCandidates:[{x:8.5,z:-1.2},{x:8.5,z:-1.5}],
      panelThickness:0.025,peek:{minY:1.54,maxY:1.66,width:0.6}},
    {id:'production.locker-l2',kind:'locker',name:'北側置物櫃',bounds:{minX:19,maxX:20,minY:0,maxY:2.2,minZ:-12.2,maxZ:-11.3},
      doorYaw:Math.PI,inside:{x:19.5,z:-11.75},exitCandidates:[{x:19.5,z:-10.3},{x:19.5,z:-10.6}],
      panelThickness:0.025,peek:{minY:1.54,maxY:1.66,width:0.6}},
        ...COLOR_SEQUENCE.buttons.map((color,i)=>({id:`production.button-${color}`,kind:'sequenceButton',puzzleId:COLOR_SEQUENCE.id,color,name:`${['紅1','黃2','綠3','藍4'][i]} 復位按鈕`,bounds:{minX:20.7,maxX:21,minY:1.35,maxY:1.85,minZ:-1.6-i*.9,maxZ:-1.2-i*.9}})),
    {id:'production.sequence-keypad',kind:'keypad',name:'裝配線控制器',puzzleId:'production.sequence',bounds:{minX:20.55,maxX:21.1,minY:1,maxY:1.65,minZ:-8.45,maxZ:-7.55}},
  ],
  lights:[
    {id:'production.ceiling-light',position:{x:14.2,y:3.1,z:-6.5},powerPuzzleId:'power.main',offIntensity:7,onIntensity:26,color:0xc5d6bf,distance:18},
    {id:'production.alert-light',position:{x:14.2,y:2.8,z:-12.25},powerPuzzleId:'power.main',offIntensity:0.4,onIntensity:1.5,color:0xc04a39,distance:11},
  ],
  signs:[
    {id:'production.color-order',text:EXIT_CODE_CLUES[0].text,position:{x:21.18,y:2.8,z:-2.75},normal:{x:-1,y:0,z:0},width:3.5,height:.4},
    {id:'production.east-sign',text:'貨運區｜列車月台',position:{x:21.18,y:2.9,z:-6.5},normal:{x:-1,y:0,z:0},width:1.5,height:0.3},
    {id:'production.monitor-record',text:'監視器最後畫面：展示台空了；封鎖門沒有開啟紀錄',position:{x:14.2,y:2.75,z:-0.32},normal:{x:0,y:0,z:-1},width:3.8,height:0.38},
    {id:'production.console-guide',text:'月台檢修碼輸入後，東側貨運門解鎖',position:{x:14.2,y:2.85,z:-12.48},normal:{x:0,y:0,z:1},width:3.8,height:0.38},
    {id:'production.locker-sign-l1',text:'緊急避難櫃',position:{x:8.5,y:2.42,z:-2.16},normal:{x:0,y:0,z:1},width:1.15,height:0.25},
    {id:'production.locker-sign-l2',text:'緊急避難櫃',position:{x:19.5,y:2.42,z:-11.26},normal:{x:0,y:0,z:1},width:1.15,height:0.25},
  ],
  navigation:{
    nodes:[node('A',10,-10.3),node('B',18.5,-10.3),node('C',18.5,-2),node('D',10,-2),
      node('N',14.2,-10.3),node('S',14.2,-2),node('M',14.2,-6.5),node('W',10,-6.5),
      node('E',18.5,-6.5),node('entry',8.2,-6.5),node('L1',8.5,-1.2),node('L2',19.5,-10.3)],
    edges:[edge('A','N'),edge('N','B'),edge('B','E'),edge('E','C'),edge('C','S'),edge('S','D'),
      edge('D','W'),edge('W','A'),edge('N','M'),edge('M','S'),edge('W','entry'),edge('D','L1'),edge('B','L2')],
  },
  monsters:[{id:'production.marshmallow',areaId:'production',name:'藍色展示玩偶',
    spawn:{x:18.5,z:-10.3,yaw:Math.PI},height:2.1,radius:0.35,clearance:0.05,
    patrol:['production.nav.B','production.nav.C','production.nav.D','production.nav.A'],
    patrolSpeed:1,turnSpeed:Math.PI,dwellSeconds:1,
    vision:{distance:8,halfAngle:Math.PI/3,eyeHeight:1.5},
    chaseSpeed:2.3,searchSpeed:1,returnSpeed:1.2,
    repathSeconds:0.25,lostSightSeconds:0.75,searchSeconds:4,
    contactDistance:0.8,contactResetDistance:1}],
};
