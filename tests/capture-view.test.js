import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

test('近景關閉或中途關閉時不顯示殘留嚇人畫面',async()=>{
  const {createCaptureView}=await import('../src/game/capture-view.js');
  let drawings=0;
  const context=new Proxy({}, {get:(target,key)=>target[key]??(()=>{drawings++;})});
  const canvas={hidden:true,style:{},getContext:()=>context};
  const root={hidden:true,querySelector:()=>canvas};
  const view=createCaptureView(root),initialDrawings=drawings;assert.ok(drawings>0);
  for(const jumpScare of [false,undefined,1,'true']) {
    let ui=logic.createCapture({jumpScare});
    for(let i=0;i<12;i++) {
      ui=logic.updateCapture(ui,0.1,{jumpScare});view.sync(ui,{jumpScare});
      assert.equal(root.hidden,false);assert.equal(canvas.hidden,true);
    }
  }
  let ui=logic.createCapture({jumpScare:true});
  ui=logic.updateCapture(ui,0.1,{jumpScare:true});ui=logic.updateCapture(ui,0.1,{jumpScare:true});
  view.sync(ui,{jumpScare:true});assert.equal(canvas.hidden,false);
  view.sync(ui,{jumpScare:false});assert.equal(canvas.hidden,true,'外部關閉立即隱藏，不等下一幀');
  ui=logic.updateCapture(ui,0,{jumpScare:false});
  ui=logic.updateCapture(ui,0.05,{jumpScare:true});view.sync(ui,{jumpScare:true});
  assert.equal(canvas.hidden,true,'中途關閉後重開不補播');
  let never=logic.createCapture({jumpScare:false});
  never=logic.updateCapture(never,0.1,{jumpScare:true});never=logic.updateCapture(never,0.1,{jumpScare:true});
  view.sync(never,{jumpScare:true});assert.equal(canvas.hidden,true,'途中才開啟不補播');
  const showing={...ui,jumpScareAllowed:true};
  view.sync(showing,{jumpScare:true,paused:true});assert.equal(canvas.hidden,true);assert.equal(root.hidden,false);
  view.sync({mode:'explore'},{jumpScare:true});assert.equal(root.hidden,true);assert.equal(canvas.hidden,true);
  assert.equal(drawings,initialDrawings,'圖像只建立一次，逐幀僅更新顯示與縮放');
  const unavailable={hidden:true,style:{},getContext:()=>null};
  const fallbackRoot={hidden:true,querySelector:()=>unavailable};
  createCaptureView(fallbackRoot).sync(showing,{jumpScare:true});
  assert.equal(fallbackRoot.hidden,false);assert.equal(unavailable.hidden,true,'Canvas 不可用仍保留黑底');
});
