import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureView} from '../src/game/capture-view.js';
import {captureScarePose} from '../src/game/capture-scare-art.js';

function fixture() {
  let drawings=0;
  const context=new Proxy({}, {get:(target,key)=>target[key]??(()=>{drawings++;})});
  const doc={createElement(tag){return {tagName:tag,hidden:true,style:{},dataset:{},children:[],append(child){this.children.push(child);},getContext:()=>context,ownerDocument:doc};}};
  const canvas=doc.createElement('canvas'),root=doc.createElement('div');root.children.push(canvas);root.querySelector=()=>canvas;
  return {root,canvas,drawings:()=>drawings};
}

test('捕獲以八個獨立透視圖層突進、張顎、收爪，逐幀不重新繪圖',()=>{
  const f=fixture(),view=createCaptureView(f.root),initial=f.drawings();
  const rig=f.root.children.find(child=>'captureRig'in child.dataset);
  const layers=rig.children.filter(child=>'captureLayer'in child.dataset);
  assert.equal(layers.length,8);assert.equal(rig.style.perspective,'680px');
  const ui={mode:'caught',elapsed:.16,jumpScareAllowed:true};view.sync(ui,{jumpScare:true});
  assert.equal(rig.hidden,false);
  const before=Object.fromEntries(layers.map(layer=>[layer.dataset.captureLayer,layer.style.transform]));
  view.sync({...ui,elapsed:.42},{jumpScare:true});
  for(const layer of layers){assert.equal(layer.hidden,false);assert.match(layer.style.transform,/translate3d/);assert.notEqual(layer.style.transform,before[layer.dataset.captureLayer]);}
  const transforms=new Set(layers.map(layer=>layer.style.transform));assert.equal(transforms.size,8,'head/eyes/jaw/hands do not share a single scale transform');
  assert.equal(f.drawings(),initial,'all textures are painted once');
});

test('多層捕獲在近景關閉、暫停、尾黑場時立即隱藏每一層',()=>{
  const f=fixture(),view=createCaptureView(f.root);
  const rig=f.root.children.find(child=>'captureRig'in child.dataset),layers=rig.children.filter(child=>'captureLayer'in child.dataset);
  const ui={mode:'caught',elapsed:.3,jumpScareAllowed:true};
  for(const options of [{jumpScare:false},{jumpScare:true,paused:true}]) {
    view.sync(ui,{jumpScare:true});assert.equal(rig.hidden,false);view.sync(ui,options);
    assert.equal(f.root.hidden,false);assert.equal(rig.hidden,true);assert.ok(layers.every(layer=>layer.hidden));
  }
  view.sync(ui,{jumpScare:true});const held=layers.map(layer=>layer.style.transform);
  view.sync(ui,{jumpScare:true,paused:true});view.sync(ui,{jumpScare:true});
  assert.deepEqual(layers.map(layer=>layer.style.transform),held,'resume uses the frozen capture clock');
  view.sync({...ui,jumpScareAllowed:false},{jumpScare:true});assert.equal(rig.hidden,true);
  view.sync({...ui,elapsed:1.6},{jumpScare:true});assert.equal(f.root.hidden,false);assert.equal(rig.hidden,true);
  view.sync({mode:'explore'},{jumpScare:true});assert.equal(f.root.hidden,true);assert.ok(layers.every(layer=>layer.hidden));
});

test('突進在75ms內完成，張顎與收爪各有延遲，長時間定格也不產生閃爍',()=>{
  const initial=captureScarePose(.15),attack=captureScarePose(.225),grip=captureScarePose(.65);
  assert.equal(initial.attack,0);assert.ok(attack.attack>.999);
  assert.ok(attack.z-initial.z>225,'the head abruptly closes the distance');
  assert.ok(attack.hands<.01);assert.equal(grip.hands,1);assert.equal(grip.jaw,1);
  assert.ok(grip.jawY-initial.jawY>140);assert.ok(initial.handX-grip.handX>185);
  assert.deepEqual(captureScarePose(.65),grip,'all motion depends on the capture clock, not wall time or random noise');
  for(const time of [NaN,Infinity,-1,0,.15,.3,1,2.1])for(const value of Object.values(captureScarePose(time)))assert.ok(Number.isFinite(value));
});
