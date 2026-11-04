import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three/three.module.js';
import {WORLD,STATIC_BOXES} from '../src/logic/world.js';
import {reasoningAreas} from '../src/logic/reasoning-content.js';
import {planMountedSign} from '../src/game/sign-design.js';
import {planDocumentClearances} from '../src/game/factory-document-clearance.js';

test('新推理文件可從室內用真Three.js掛面與準星選讀，新增UV區也保留裝飾淨空',async()=>{
 const saved=globalThis.document,ctx=new Proxy({}, {get:(target,key)=>target[key]??(()=>{})});
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
 try{
  const engine=new URL('../vendor/three/three.module.js',import.meta.url).href;
  let source=await readFile(new URL('../src/game/sign-view.js',import.meta.url),'utf8');
  source=source.replace("from 'three'",`from '${engine}'`).replace("from './sign-design.js'",`from '${new URL('../src/game/sign-design.js',import.meta.url).href}'`).replace("from '../logic/interaction.js'",`from '${new URL('../src/logic/interaction.js',import.meta.url).href}'`);
  const {createSignView}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const areas=reasoningAreas(WORLD.areas),signs=areas.flatMap(a=>a.signs),scene=new THREE.Scene();
  const view=createSignView(scene,areas,STATIC_BOXES,{trim:new THREE.MeshBasicMaterial()});
  for(const id of ['power.circuit-order-note','production.calibration-record','production.process-note','production.color-order','production.console-guide','bay.train-formula']){
   const plan=planMountedSign(signs.find(s=>s.id===id),STATIC_BOXES),p=plan.position,n=plan.normal;
   const x=p.x+n.x*1.4,z=p.z+n.z*1.4,yaw=Math.atan2(x-p.x,z-p.z),pitch=Math.atan2(p.y-1.6,1.4);
   const read=view.readingTarget({x,z,yaw,pitch},STATIC_BOXES);
   assert.equal(read?.id,id,`${id} must be readable from inside`);assert.equal(read.text,plan.text);
  }
  assert.ok(planDocumentClearances(areas,STATIC_BOXES).some(r=>r.id==='power.uv-code'));
 }finally{globalThis.document=saved;}
});
