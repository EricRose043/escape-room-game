import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureView} from '../src/game/capture-view.js';
import {captureScarePose} from '../src/game/capture-scare-art.js';
test('近景高解析圖層只畫一次，120Hz逐幀姿態不量化成固定貼圖',()=>{
 let drawings=0,created=0;const ctx=new Proxy({}, {get:(_t,_k)=>()=>{drawings++;}});
 const doc={createElement(){created++;return {ownerDocument:doc,children:[],style:{},dataset:{},append(c){this.children.push(c);},getContext:()=>ctx};}};
 const canvas=doc.createElement(),root=doc.createElement();root.querySelector=()=>canvas;
 const view=createCaptureView(root),layers=root.children[0].children.filter(c=>c.dataset.captureLayer);
 assert.equal(layers.length,8);assert.ok(layers.every(c=>c.width>=1536));
 const baseline={created,drawings},transforms=new Set();
 for(let i=0;i<120;i++){
  view.sync({mode:'caught',elapsed:.2+i/120,jumpScareAllowed:true},{jumpScare:true});
  transforms.add(layers.find(c=>c.dataset.captureLayer==='jaw').style.transform);
 }
 assert.equal(created,baseline.created);assert.equal(drawings,baseline.drawings);assert.equal(transforms.size,120);
 assert.ok(Number.isFinite(captureScarePose(.7).eyeShift));
});
