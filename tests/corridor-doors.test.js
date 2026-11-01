import test from 'node:test';
import assert from 'node:assert/strict';
import {createCorridorDoors,updateCorridorDoors} from '../src/logic/corridor-doors.js';
const corridor={doors:[{id:'corridor.a',trigger:{axis:'x',value:5,direction:1,minCross:-2,maxCross:0}},
  {id:'corridor.b',trigger:{axis:'z',value:-5,direction:-1,minCross:7,maxCross:9}}]};
test('走廊門需要實際越過正向觸發線，未通過不關閉',()=>{
  const start=createCorridorDoors(),a=updateCorridorDoors(start,4,-1,corridor),b=updateCorridorDoors(a,4.9,-1,corridor);
  assert.deepEqual(b.closedIds,[]);const next=updateCorridorDoors(b,5.1,-1,corridor);
  assert.deepEqual(next.closedIds,['corridor.a']);assert.deepEqual(start,{previous:null,closedIds:[]});assert.deepEqual(b.closedIds,[]);
});
test('逆向與門寬外越線不關；首筆已在另一側不憑空關門',()=>{
  let s=updateCorridorDoors(createCorridorDoors(),6,-1,corridor);s=updateCorridorDoors(s,4,-1,corridor);assert.deepEqual(s.closedIds,[]);
  s=updateCorridorDoors(s,4,2,corridor);s=updateCorridorDoors(s,6,2,corridor);assert.deepEqual(s.closedIds,[]);
});
test('轉彎後負方向門可關閉，已關閉不因回頭重開或重複',()=>{
  let s=updateCorridorDoors(createCorridorDoors(),8,-4,corridor);s=updateCorridorDoors(s,8,-6,corridor);
  assert.deepEqual(s.closedIds,['corridor.b']);s=updateCorridorDoors(s,8,-4,corridor);s=updateCorridorDoors(s,8,-6,corridor);
  assert.deepEqual(s.closedIds,['corridor.b']);
});
test('用移動線段與門寬交點檢查，不能只憑終點位於門另一側',()=>{
  let s=updateCorridorDoors(createCorridorDoors(),4,-1,corridor);s=updateCorridorDoors(s,6,3,corridor);
  assert.deepEqual(s.closedIds,[]);
  s=updateCorridorDoors(createCorridorDoors(),4,-3,corridor);s=updateCorridorDoors(s,6,1,corridor);
  assert.deepEqual(s.closedIds,['corridor.a']);
});
test('無效位置不改狀態也不產生誤觸發',()=>{
  const s=updateCorridorDoors(createCorridorDoors(),4,-1,corridor);
  for(const [x,z] of [[NaN,0],[4,Infinity],['6',-1]])assert.equal(updateCorridorDoors(s,x,z,corridor),s);
});
