import test from 'node:test';
import assert from 'node:assert/strict';
import {COLOR_SEQUENCE,createSequenceState,pressButton} from '../src/logic/puzzles/color-sequence.js';

test('初始化狀態不可變更謎題定義，依紅黃綠藍依序完成',()=>{
  const def=COLOR_SEQUENCE,state=createSequenceState(def);
  assert.deepEqual(state,{progress:0,solved:false});
  assert.deepEqual(def.sequence,['red','yellow','green','blue']);
  let result;
  for(const color of def.sequence) result=pressButton(result?.state??state,def,color);
  assert.equal(result.result,'solved');assert.equal(result.state.solved,true);
});

test('按錯重置進度並只回報一次警報，不修改原狀態',()=>{
  const def=COLOR_SEQUENCE,initial=createSequenceState(def);
  const first=pressButton(initial,def,'red');
  const wrong=pressButton(first.state,def,'blue');
  assert.equal(first.state.progress,1);
  assert.equal(wrong.result,'wrong');assert.equal(wrong.alarm,true);
  assert.deepEqual(wrong.state,{progress:0,solved:false});
  assert.deepEqual(initial,{progress:0,solved:false});
});

test('錯誤顏色不能解鎖；解開後再按不會改變完成狀態',()=>{
  const def=COLOR_SEQUENCE;let state=createSequenceState(def);
  assert.equal(pressButton(state,def,'purple').result,'wrong');
  for(const color of def.sequence) state=pressButton(state,def,color).state;
  const again=pressButton(state,def,'red');
  assert.equal(again.result,'solved');assert.equal(again.state.solved,true);assert.equal(again.alarm,false);
});
