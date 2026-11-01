// 原 TEAM_TASKS S3 座標的獨立交付，尚未放進 WORLD。
// 此位置與新版 loading-bay 重疊；正式接入前必須依團隊決定搬移／調整連接，不可直接 append 到 WORLD。
const box=(id,minX,maxX,minZ,maxZ)=>({id:`corridor.${id}`,kind:'wall',minX,maxX,minY:0,maxY:3.5,minZ,maxZ});
const gate=(id,bounds,trigger)=>({id:`corridor.${id}`,name:'單向隔離門',bounds,
  openWhen:{type:'puzzleSolved',puzzleId:'production.sequence'},destination:{type:'reserved'},trigger});
export const CHASE_CORRIDOR={
  id:'chase-corridor',name:'追逐走廊（獨立預覽）',bounds:{minX:21.4,maxX:40,minZ:-20,maxZ:-4},height:3.5,
  entry:{x:22,z:-6.5,yaw:-Math.PI/2,pitch:0},
  route:[{x:22,z:-6.5},{x:27,z:-6.5},{x:27,z:-17.5},{x:39,z:-17.5}],
  boxes:[box('entry-north',21.4,25.8,-7.9,-7.7),box('entry-south',21.4,28.4,-5.3,-5.1),
    box('bend-west',25.6,25.8,-18.7,-7.7),box('bend-east',28.2,28.4,-16.3,-5.3),
    box('exit-north',25.6,40,-18.9,-18.7),box('exit-south',28.4,40,-16.3,-16.1)],
  doors:[
    gate('door-1',{minX:24,maxX:24.2,minY:0,maxY:2.6,minZ:-7.7,maxZ:-5.3},
      {axis:'x',value:24.8,direction:1,minCross:-7.4,maxCross:-5.6}),
    gate('door-2',{minX:25.8,maxX:28.2,minY:0,maxY:2.6,minZ:-12,maxZ:-11.8},
      {axis:'z',value:-12.6,direction:-1,minCross:26.1,maxCross:27.9}),
    gate('door-3',{minX:34,maxX:34.2,minY:0,maxY:2.6,minZ:-18.7,maxZ:-16.3},
      {axis:'x',value:34.8,direction:1,minCross:-18.4,maxCross:-16.6}),
  ],
  items:[],puzzles:[],devices:[],clues:[],monsters:[],
  lights:[{id:'corridor.light',position:{x:27,y:3.1,z:-12},offIntensity:8,onIntensity:8,color:0xc5d6bf,distance:15}],
  signs:[{id:'corridor.sign',text:'隔離門會在通過後關閉，請持續前進',position:{x:22.5,y:1.8,z:-5.31},normal:{x:0,y:0,z:-1},width:2,height:.4}],
};
export function getCorridorGeometry(state,definition=CHASE_CORRIDOR) {
  const closed=definition.doors.filter(d=>state.closedIds.includes(d.id)).map(d=>({...d.bounds,id:d.id,kind:'door'}));
  return {collisionBoxes:[...definition.boxes,...closed],occluderBoxes:[...definition.boxes,...closed]};
}
