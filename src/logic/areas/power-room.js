const box = (id, kind, minX, maxX, minY, maxY, minZ, maxZ, extra = {}) => ({ id, kind, minX, maxX, minY, maxY, minZ, maxZ, ...extra });
export const POWER_ROOM = {
  id: 'power-room', name: '電力室', bounds: { minX:-5,maxX:5,minZ:-8.2,maxZ:-0.2 }, height:3.5,
  boxes: [
    box('power.west','wall',-5.2,-5,0,3.5,-8.2,-0.2),
    box('power.north','wall',-5.2,5.2,0,3.5,-8.4,-8.2),
    box('power.east-north','wall',5,5.2,0,3.5,-8.2,-7.4),
    box('power.east-south','wall',5,5.2,0,3.5,-5.6,-0.2),
    box('power.lintel','wall',5,5.2,2.6,3.5,-7.4,-5.6,{blocksMovement:false}),
    box('power.landing-north','wall',5,7.2,0,3.5,-7.6,-7.4),
    box('power.landing-south','wall',5,7.2,0,3.5,-5.6,-5.4),
    box('power.landing-end','wall',7.2,7.4,0,3.5,-7.6,-5.4),
    box('power.workbench','table',-3.8,-2.2,0,0.9,-6.6,-5.4),
    box('power.tool-table','table',-3.8,-2.2,0,0.9,-2.6,-1.4),
  ],
  extraSurfaces: [
    box('power.landing-floor','floor',5,7.2,-0.2,0,-7.4,-5.6),
    box('power.landing-ceiling','ceiling',5,7.2,3.5,3.7,-7.4,-5.6),
  ],
  doors: [{id:'power.production-door',name:'生產線門',bounds:{minX:5,maxX:5.2,minY:0,maxY:2.6,minZ:-7.4,maxZ:-5.6},
    openWhen:{type:'puzzleSolved',puzzleId:'power.main'},destination:{type:'reserved',areaId:'production'}}],
  items: [
    box('power.fuse','fuse',-3.2,-2.8,0.9,1.3,-6.2,-5.8,{name:'保險絲',color:0xa0c8d4}),
    box('power.battery','battery',-3.2,-2.8,0.9,1.3,-2.2,-1.8,{name:'工具桌電池',color:0xe0b960,chargeAmount:25}),
  ],
  // 4a 僅建模型與資料引用；安裝及密碼操作分別在 4b／4c 實作。
  devices: [
    {id:'power.fuse-box',kind:'fuseBox',name:'電箱',puzzleId:'power.main',acceptsItemId:'power.fuse',bounds:{minX:4.25,maxX:4.75,minY:0.8,maxY:2,minZ:-3.3,maxZ:-2.7}},
    {id:'power.keypad',kind:'keypad',name:'密碼鎖',puzzleId:'power.main',bounds:{minX:4.5,maxX:4.8,minY:1.15,maxY:1.65,minZ:-5.4,maxZ:-5}},
  ],
  puzzles: [{id:'power.main'}], clues: [],
  lights: [{id:'power.ceiling-light',position:{x:0,y:3.1,z:-4.2},powerPuzzleId:'power.main',offIntensity:7,onIntensity:26,color:0xb8c5d8,distance:14}],
  signs: [
    {id:'power.room-sign',text:'電力室｜維修中',position:{x:-1.9,y:1.8,z:-0.22},normal:{x:0,y:0,z:-1},width:1.8,height:0.35},
    {id:'power.box-sign',text:'電箱｜未供電',position:{x:4.23,y:2.3,z:-3},normal:{x:-1,y:0,z:0},width:1.4,height:0.3},
    {id:'power.exit-sign',text:'糖果生產線',position:{x:4.98,y:2.9,z:-6.5},normal:{x:-1,y:0,z:0},width:1.5,height:0.3},
    {id:'power.landing-sign',text:'後續區域尚未開放',position:{x:7.18,y:1.8,z:-6.5},normal:{x:-1,y:0,z:0},width:1.5,height:0.3},
  ],
};
