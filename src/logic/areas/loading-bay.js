const box=(id,kind,minX,maxX,minY,maxY,minZ,maxZ,extra={})=>({id,kind,minX,maxX,minY,maxY,minZ,maxZ,...extra});
export const LOADING_BAY={
  id:'loading-bay',name:'玩具列車月台',bounds:{minX:21.2,maxX:35.2,minZ:-12.5,maxZ:-0.5},height:4.5,
  boxes:[box('bay.north','wall',21.2,35.2,0,4.5,-12.7,-12.5),box('bay.south','wall',21.2,35.2,0,4.5,-0.5,-0.3),
    box('bay.east-north','wall',35.2,35.4,0,4.5,-12.5,-8.8),box('bay.east-south','wall',35.2,35.4,0,4.5,-4.2,-0.5),
    box('bay.east-lintel','wall',35.2,35.4,3,4.5,-8.8,-4.2),box('bay.crate-a','machine',28.5,30.2,0,1.1,-3.5,-1.8)],
  doors:[],items:[],clues:[],puzzles:[],monsters:[],
  devices:[
    {id:'bay.train-console',kind:'trainConsole',name:'列車啟動控制台',puzzleId:'production.sequence',bounds:{minX:24.2,maxX:24.8,minY:0,maxY:1.2,minZ:-7.1,maxZ:-5.9}},
    {id:'bay.train',kind:'train',name:'大型玩具列車',bounds:{minX:31.2,maxX:33.8,minY:0,maxY:2.8,minZ:-8.8,maxZ:-4.2}},
  ],
  lights:[{id:'bay.platform-light',position:{x:28.2,y:4.1,z:-6.5},offIntensity:8,onIntensity:8,color:0xffd08a,distance:20}],
  signs:[{id:'bay.platform-sign',text:'月台 01｜員工專用',position:{x:27,y:3.2,z:-12.48},normal:{x:0,y:0,z:1},width:2.8,height:0.5}],
};
