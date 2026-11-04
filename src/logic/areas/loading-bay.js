import {TRAIN_CARDS,TRAIN_FORMULA} from '../puzzles/train-code.js';
const box=(id,kind,minX,maxX,minY,maxY,minZ,maxZ,extra={})=>({id,kind,minX,maxX,minY,maxY,minZ,maxZ,...extra});
export const LOADING_BAY={
  id:'loading-bay',name:'玩具列車月台',bounds:{minX:21.2,maxX:35.2,minZ:-12.5,maxZ:-0.5},height:4.5,
  boxes:[box('bay.north','wall',21.2,35.2,0,4.5,-12.7,-12.5),box('bay.south','wall',21.2,35.2,0,4.5,-0.5,-0.3),
    box('bay.east-north','wall',35.2,35.4,0,4.5,-12.5,-8.8),box('bay.east-south','wall',35.2,35.4,0,4.5,-4.2,-0.5),
    box('bay.east-lintel','wall',35.2,35.4,3,4.5,-8.8,-4.2),box('bay.crate-a','machine',28.5,30.2,0,1.1,-3.5,-1.8),
    box('bay.train-rear-body','train',27.5,30.1,0,2.4,-7.8,-5.2),
    box('bay.train-front-body','train',33.8,34.5,0,2.5,-7.8,-5.2)],
  doors:[],items:[],clues:[],puzzles:[],monsters:[],
  devices:[
    {id:'bay.train-console',kind:'trainConsole',name:'列車啟動控制台',puzzleId:'production.sequence',bounds:{minX:24.2,maxX:24.8,minY:0,maxY:1.2,minZ:-7.1,maxZ:-5.9}},
    {id:'bay.train',kind:'train',name:'大型玩具列車',bounds:{minX:31.2,maxX:33.8,minY:0,maxY:2.8,minZ:-8.8,maxZ:-4.2}},
    ...TRAIN_CARDS.map((card,i)=>({id:card.id,kind:'trainCard',clueId:card.id,name:card.text,
      bounds:{minX:24.2+i*3,maxX:24.8+i*3,minY:1.25,maxY:1.85,minZ:-12.43,maxZ:-12.37}})),
  ],
  lights:[{id:'bay.platform-light',position:{x:28.2,y:4.1,z:-6.5},offIntensity:8,onIntensity:8,color:0xffd08a,distance:20}],
  signs:[{id:'bay.platform-sign',text:'貨運月台｜01 撤離線／02 停用線',position:{x:27,y:3.7,z:-12.48},normal:{x:0,y:0,z:1},width:4,height:0.4},
    {id:'bay.train-formula',text:TRAIN_FORMULA,position:{x:29,y:2.75,z:-12.48},normal:{x:0,y:0,z:1},width:6.8,height:.75},
    ...TRAIN_CARDS.map((card,i)=>({id:`${card.id}-label`,text:card.text,position:{x:24.5+i*3,y:1.55,z:-12.36},normal:{x:0,y:0,z:1},width:.65,height:.65})),
  ],
};
