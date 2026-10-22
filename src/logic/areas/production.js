const box = (id, kind, minX, maxX, minY, maxY, minZ, maxZ, extra = {}) => ({id,kind,minX,maxX,minY,maxY,minZ,maxZ,...extra});
const node = (name,x,z) => ({id:`production.nav.${name}`,x,z});
const edge = (from,to) => ({from:`production.nav.${from}`,to:`production.nav.${to}`});
export const PRODUCTION = {
  id:'production',name:'糖果生產線',bounds:{minX:7.2,maxX:21.2,minZ:-12.5,maxZ:-0.5},height:3.5,
  checkpoint: {id:'production.checkpoint',order:2,spawn:{x:6.5,z:-6.5,yaw:-Math.PI/2,pitch:0},
    floorId:'power.landing-floor',requires:{itemIds:['lobby.flashlight'],puzzleIds:['power.main']}},
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
  doors:[{id:'production.east-door',name:'下一區門',bounds:{minX:21.2,maxX:21.4,minY:0,maxY:2.6,minZ:-7.4,maxZ:-5.6},
    openWhen:{type:'puzzleSolved',puzzleId:'production.sequence'},destination:{type:'reserved',areaId:'chase-corridor'}}],
  items:[],clues:[],puzzles:[{id:'production.sequence'}],
  // 櫃體碰撞／視線仍用完整外框；畫面薄板的窺視縫對齊眼高。
  devices:[
    {id:'production.locker-l1',kind:'locker',name:'西側置物櫃',bounds:{minX:8,maxX:9,minY:0,maxY:2.2,minZ:-3,maxZ:-2.2},
      doorYaw:Math.PI,inside:{x:8.5,z:-2.6},exitCandidates:[{x:8.5,z:-1.2},{x:8.5,z:-1.5}],
      panelThickness:0.025,peek:{minY:1.54,maxY:1.66,width:0.6}},
    {id:'production.locker-l2',kind:'locker',name:'北側置物櫃',bounds:{minX:19,maxX:20,minY:0,maxY:2.2,minZ:-12.2,maxZ:-11.3},
      doorYaw:Math.PI,inside:{x:19.5,z:-11.75},exitCandidates:[{x:19.5,z:-10.3},{x:19.5,z:-10.6}],
      panelThickness:0.025,peek:{minY:1.54,maxY:1.66,width:0.6}},
  ],
  lights:[{id:'production.ceiling-light',position:{x:14.2,y:3.1,z:-6.5},powerPuzzleId:'power.main',offIntensity:7,onIntensity:26,color:0xc5d6bf,distance:18}],
  signs:[{id:'production.east-sign',text:'生產線待啟動',position:{x:21.18,y:2.9,z:-6.5},normal:{x:-1,y:0,z:0},width:1.5,height:0.3}],
  navigation:{
    nodes:[node('A',10,-10.3),node('B',18.5,-10.3),node('C',18.5,-2),node('D',10,-2),
      node('N',14.2,-10.3),node('S',14.2,-2),node('M',14.2,-6.5),node('W',10,-6.5),
      node('E',18.5,-6.5),node('entry',8.2,-6.5),node('L1',8.5,-1.2),node('L2',19.5,-10.3)],
    edges:[edge('A','N'),edge('N','B'),edge('B','E'),edge('E','C'),edge('C','S'),edge('S','D'),
      edge('D','W'),edge('W','A'),edge('N','M'),edge('M','S'),edge('W','entry'),edge('D','L1'),edge('B','L2')],
  },
  monsters:[{id:'production.marshmallow',areaId:'production',name:'棉花糖先生',
    spawn:{x:18.5,z:-10.3,yaw:Math.PI},height:2.1,radius:0.35,clearance:0.05,
    patrol:['production.nav.B','production.nav.C','production.nav.D','production.nav.A'],
    patrolSpeed:1,turnSpeed:Math.PI,dwellSeconds:1,
    vision:{distance:8,halfAngle:Math.PI/3,eyeHeight:1.5},
    chaseSpeed:2.3,searchSpeed:1,returnSpeed:1.2,
    repathSeconds:0.25,lostSightSeconds:0.75,searchSeconds:4,
    contactDistance:0.8,contactResetDistance:1}],
};
