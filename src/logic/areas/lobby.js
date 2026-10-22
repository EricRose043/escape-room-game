// 純資料；AABB 單位為公尺。共用分隔牆只在大廳定義一次。
const box = (id, kind, minX, maxX, minY, maxY, minZ, maxZ, extra = {}) => ({ id, kind, minX, maxX, minY, maxY, minZ, maxZ, ...extra });
export const LOBBY = {
  id: 'lobby', name: '入口大廳', bounds: { minX: -5, maxX: 5, minZ: 0, maxZ: 8 }, height: 3.5,
  spawn: { x: 0, z: 6, yaw: 0, pitch: 0 },
  checkpoint: {id:'lobby.checkpoint',order:0,spawn:{x:0,z:6,yaw:0,pitch:0},
    floorId:'lobby.floor',requires:{itemIds:[],puzzleIds:[]}},
  boxes: [
    box('lobby.west', 'wall', -5.2,-5,0,3.5,0,8),
    box('lobby.east', 'wall', 5,5.2,0,3.5,0,8),
    box('lobby.south', 'wall', -5.2,5.2,0,3.5,8,8.2),
    box('lobby.divider-west', 'wall', -5,-0.9,0,3.5,-0.2,0),
    box('lobby.divider-east', 'wall', 0.9,5,0,3.5,-0.2,0),
    box('lobby.lintel', 'wall', -0.9,0.9,2.6,3.5,-0.2,0, { blocksMovement: false }),
    box('lobby.service-desk', 'table', -2.4,-0.6,0,0.9,3.7,4.7),
    box('lobby.side-table', 'table', 2.3,3.7,0,0.9,2.4,3.6),
  ],
  extraSurfaces: [
    box('lobby.threshold-floor','floor',-0.9,0.9,-0.2,0,-0.2,0),
    box('lobby.threshold-ceiling','ceiling',-0.9,0.9,3.5,3.7,-0.2,0),
  ],
  doors: [{ id: 'lobby.power-door', name: '電力室門', bounds: {minX:-0.9,maxX:0.9,minY:0,maxY:2.6,minZ:-0.2,maxZ:0},
    openWhen: { type: 'hasItem', itemId: 'lobby.flashlight' }, destination: { type: 'area', areaId: 'power-room' } }],
  items: [
    box('lobby.flashlight','flashlight',-1.7,-1.3,0.9,1.3,4,4.4,{name:'雙光源手電筒',color:0x8eaf79}),
    box('lobby.battery','battery',2.8,3.2,0.9,1.3,2.8,3.2,{name:'備用電池',color:0xe0b960,chargeAmount:25}),
  ],
  devices: [], puzzles: [], clues: [],
  lights: [{id:'lobby.ceiling-light',position:{x:0,y:3.1,z:4},powerPuzzleId:'power.main',offIntensity:14,onIntensity:26,color:0xffd7a0,distance:14}],
  signs: [
    {id:'lobby.welcome',text:'星星糖果樂園｜已閉園',position:{x:0,y:2.7,z:7.98},normal:{x:0,y:0,z:-1},width:3,height:0.5},
    {id:'lobby.torch-sign',text:'雙光源巡檢燈',position:{x:-1.5,y:0.92,z:4.15},normal:{x:0,y:1,z:0},width:0.7,height:0.2},
    {id:'lobby.door-sign',text:'離開前請領取巡檢燈',position:{x:1.9,y:1.8,z:0.02},normal:{x:0,y:0,z:1},width:1.6,height:0.35},
  ],
};
