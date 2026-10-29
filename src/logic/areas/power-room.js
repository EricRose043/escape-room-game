const box = (id, kind, minX, maxX, minY, maxY, minZ, maxZ, extra = {}) => ({ id, kind, minX, maxX, minY, maxY, minZ, maxZ, ...extra });
export const POWER_ROOM = {
  id: 'power-room', name: '控制室', bounds: { minX:-5,maxX:5,minZ:-8.2,maxZ:-0.2 }, height:3.5,
  checkpoint: {id:'power.checkpoint',order:1,spawn:{x:0,z:-1.2,yaw:0,pitch:0},
    floorId:'power-room.floor',requires:{itemIds:['lobby.flashlight','lobby.employee-card'],puzzleIds:[]}},
  boxes: [
    box('power.west','wall',-5.2,-5,0,3.5,-8.2,-0.2),
    box('power.north','wall',-5.2,5.2,0,3.5,-8.4,-8.2),
    box('power.east-north','wall',5,5.2,0,3.5,-8.2,-7.4),
    box('power.east-south','wall',5,5.2,0,3.5,-5.6,-0.2),
    box('power.lintel','wall',5,5.2,2.6,3.5,-7.4,-5.6,{blocksMovement:false}),
    box('power.landing-north','wall',5,7.2,0,3.5,-7.6,-7.4),
    box('power.landing-south','wall',5,7.2,0,3.5,-5.6,-5.4),
    box('power.workbench','table',-3.8,-2.2,0,0.9,-6.6,-5.4),
    box('power.tool-table','table',-3.8,-2.2,0,0.9,-2.6,-1.4),
  ],
  extraSurfaces: [
    box('power.landing-floor','floor',5,7.2,-0.2,0,-7.4,-5.6),
    box('power.landing-ceiling','ceiling',5,7.2,3.5,3.7,-7.4,-5.6),
  ],
  doors: [{id:'power.production-door',name:'生產線門',bounds:{minX:5,maxX:5.2,minY:0,maxY:2.6,minZ:-7.4,maxZ:-5.6},
    openWhen:{type:'puzzleSolved',puzzleId:'power.main'},destination:{type:'area',areaId:'production'}}],
  items: [
    box('power.fuse','fuse',-3.2,-2.8,0.9,1.3,-6.2,-5.8,{name:'保險絲',color:0xa0c8d4}),
    box('power.battery','battery',-3.2,-2.8,0.9,1.3,-2.2,-1.8,{name:'工具桌電池',color:0xe0b960,chargeAmount:25}),
  ],
  // 設備外觀與互動共用 bounds；密碼輸入介面留待 4c。
  devices: [
    {id:'power.fuse-box',kind:'fuseBox',name:'電箱',puzzleId:'power.main',acceptsItemId:'power.fuse',bounds:{minX:4.25,maxX:4.75,minY:0.8,maxY:2,minZ:-3.3,maxZ:-2.7}},
    {id:'power.keypad',kind:'keypad',name:'密碼鎖',puzzleId:'power.main',bounds:{minX:4.5,maxX:4.8,minY:1.15,maxY:1.65,minZ:-5.4,maxZ:-5}},
  ],
  puzzles: [{id:'power.main',code:'4726',clueId:'power.uv-code'}],
  clues: [{id:'power.uv-code',puzzleId:'power.main',position:{x:4.98,y:1.6,z:-4.5},
    normal:{x:-1,y:0,z:0},width:1.8,height:0.4}],
  lights: [{id:'power.ceiling-light',position:{x:0,y:3.1,z:-4.2},powerPuzzleId:'power.main',offIntensity:7,onIntensity:26,color:0xb8c5d8,distance:14}],
  signs: [
    {id:'power.room-sign',text:'控制室｜員工卡權限',position:{x:-1.9,y:1.8,z:-0.22},normal:{x:0,y:0,z:-1},width:2.1,height:0.35},
    {id:'power.box-sign',text:'電箱｜備援控制',position:{x:4.23,y:2.3,z:-3},normal:{x:-1,y:0,z:0},width:1.4,height:0.3},
    {id:'power.uv-note',text:'檢修墨跡在普通照明下不可見',position:{x:4.98,y:2.3,z:-4.5},normal:{x:-1,y:0,z:0},width:2.2,height:0.3},
    {id:'power.exit-sign',text:'玩具裝配線',position:{x:4.98,y:2.9,z:-6.5},normal:{x:-1,y:0,z:0},width:1.5,height:0.3},
    {id:'power.incident-log',text:'異常紀錄：展示玩偶位置與監視器不符',position:{x:0,y:2.1,z:-8.18},normal:{x:0,y:0,z:1},width:3.8,height:0.5},
    {id:'power.train-log',text:'貨運區保留一列大型玩具展示列車',position:{x:-2.9,y:1.8,z:-5.38},normal:{x:0,y:0,z:-1},width:2.2,height:0.4},
  ],
};

