import test from 'node:test';
import assert from 'node:assert/strict';
import {storyBeat} from '../src/logic/story-beats.js';

const world={areas:[{id:'production',bounds:{minX:7,maxX:21,minZ:-12,maxZ:0}}]};
world.areas.push({id:'power-room',bounds:{minX:-5,maxX:5,minZ:-8,maxZ:0}});
const state=({x=0,z=4,power=false,sequence=false,chase=false,train=false}={})=>({
  player:{x,z},ui:{mode:'explore'},trainStarted:train,
  puzzles:{'power.main':{restored:power},'production.sequence':{restored:sequence}},
  monsters:{monster:{mode:chase?'chase':'patrol'}},
});

test('進入裝配線時提示電力線索與可躲藏位置',()=>{
  assert.equal(storyBeat(state({x:6,z:-6}),state({x:8,z:-6}),world),'production-entry');
});
test('進入控制室時說明不復電就無法抵達出口的兩難',()=>{
  assert.equal(storyBeat(state({x:0,z:1}),state({x:0,z:-1}),world),'power-room-entry');
});
test('取得工廠地圖與員工卡時提供符合用途的故事提示',()=>{
  const withItem=(s,id)=>({...s,inventory:{itemIds:[id]}});
  assert.equal(storyBeat(state(),withItem(state(),'lobby.factory-map'),world),'map-found');
  assert.equal(storyBeat(state(),withItem(state(),'lobby.employee-card'),world),'card-found');
});
test('控制室通電、首次追逐、貨運門解鎖及列車啟動各自觸發一次劇情提示',()=>{
  assert.equal(storyBeat(state(),state({power:true}),world),'power-restored');
  assert.equal(storyBeat(state({x:8,z:-6}),state({x:8,z:-6,chase:true}),world),'first-chase');
  assert.equal(storyBeat(state({x:8,z:-6}),state({x:8,z:-6,sequence:true}),world),'loading-door');
  assert.equal(storyBeat(state({x:24,z:-6}),state({x:24,z:-6,train:true}),world),'train-started');
});
test('首次追逐提示優先於同一幀的區域進入提示',()=>{
  assert.equal(storyBeat(state({x:6,z:-6}),state({x:8,z:-6,chase:true}),world),'first-chase');
});
