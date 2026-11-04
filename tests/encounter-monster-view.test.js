import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three/three.module.js';
import * as l from '../src/logic/index.js';

test('實際Three.js玩偶群組在裝配線及走廊暫時消失，結束後恢復呈現',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({}, {get:()=>()=>{}})})};
 const url=relative=>new URL(relative,import.meta.url).href;
 try{
  const encode=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
  let materials=await readFile(new URL('../src/game/art-materials.js',import.meta.url),'utf8');
  materials=materials.replace("from 'three'",`from '${url('../vendor/three/three.module.js')}'`).replace("from './visual-design.js'",`from '${url('../src/game/visual-design.js')}'`);
  let source=await readFile(new URL('../src/game/monster-view.js',import.meta.url),'utf8');
  source=source.replace("from 'three'",`from '${url('../vendor/three/three.module.js')}'`).replace("from './art-materials.js'",`from '${encode(materials)}'`)
   .replace("from '../logic/chapter.js'",`from '${url('../src/logic/chapter.js')}'`).replace("from './doll-expression.js'",`from '${url('../src/game/doll-expression.js')}'`).replace("from '../logic/encounter-recovery.js'",`from '${url('../src/logic/encounter-recovery.js')}'`);
  const {createMonsterView}=await import(encode(source)),scene=new THREE.Scene(),view=createMonsterView(scene),s=l.createChapter(),id=l.MONSTERS[0].id;
  s.monsters[id]={...s.monsters[id],mode:'patrol'};view.sync(s,.1);assert.ok(scene.children.some(m=>m.visible));
  view.sync({...s,encounterRecovery:{remaining:5}},.1);assert.ok(scene.children.every(m=>!m.visible));
  const corridor={...s,corridor:{active:true,chaser:{x:27,z:-13,yaw:0},distance:11.5}};
  view.sync({...corridor,encounterRecovery:{remaining:5}},.1);assert.ok(scene.children.every(m=>!m.visible));
  view.sync(corridor,.1);assert.ok(scene.children.some(m=>m.visible));
 }finally{globalThis.document=old;}
});
