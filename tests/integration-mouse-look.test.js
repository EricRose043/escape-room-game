import test from 'node:test';
import assert from 'node:assert/strict';
import {createMouseLook,advanceMouseLook,worldVisible} from '../src/logic/mouse-look.js';
test('滑鼠總轉角降低至55%，不同更新率仍保留相同總位移',()=>{
  function trace(dt){let state=createMouseLook(),sum=0;for(let i=0;i<Math.ceil(.3/dt);i++){const next=advanceMouseLook(state,{dYaw:i===0?.1:0,dPitch:0},dt);sum+=next.look.dYaw;state=next.state;}return sum;}
  assert.ok(Math.abs(trace(1/60)-.055)<1e-8);assert.ok(Math.abs(trace(1/144)-trace(1/60))<1e-8);
  const first=advanceMouseLook(createMouseLook(),{dYaw:.1},1/60);assert.ok(first.look.dYaw>0&&first.look.dYaw<.055);
});
test('暫停清掉殘留輸入，長幀與非有限輸入不造成鏡頭跳躍',()=>{
  const pending=advanceMouseLook(createMouseLook(),{dYaw:1,dPitch:NaN},0);
  assert.equal(pending.look.dYaw,0);assert.deepEqual(advanceMouseLook(pending.state,{},.1,false).state,createMouseLook());
  const next=advanceMouseLook(createMouseLook(),{dYaw:Infinity,dPitch:NaN},.1);assert.deepEqual(next.look,{dYaw:0,dPitch:0});
  assert.equal(worldVisible('caught'),false);assert.equal(worldVisible('explore'),true);assert.equal(worldVisible('ending'),true);
});
