import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three/three.module.js';
const engine=new URL('../vendor/three/three.module.js',import.meta.url).href;
async function load(relative){let source=await readFile(new URL(relative,import.meta.url),'utf8');source=source.replace("from 'three'",`from '${engine}'`).replace("from './visual-design.js'",`from '${new URL('../src/game/visual-design.js',import.meta.url).href}'`);return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
test('工廠牆地與金屬使用受燈光影響的粗糙度與細微凹凸，材質保持共用',async()=>{
 const old=globalThis.document;const ctx=new Proxy({}, {get:()=>()=>{}});globalThis.document={createElement:()=>({getContext:()=>ctx})};
 try{const {createArtMaterials}=await load('../src/game/art-materials.js'),art=createArtMaterials();
  assert.equal(art.palette.wall.isMeshStandardMaterial,true);assert.ok(art.palette.wall.roughness>art.palette.fuseBox.roughness);
  assert.ok(art.palette.fuseBox.metalness>0);assert.ok(art.palette.wall.bumpMap);assert.ok(art.palette.wall.bumpScale>0&&art.palette.wall.bumpScale<.02);
  assert.equal(art.material('plaster',0xffffff,.42),art.palette.wall);
 }finally{globalThis.document=old;}
});
test('落地接觸陰影使用單一批次，不新增阻擋通道的物件',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({}, {get:()=>()=>{}})})};
 try{const {createContactShadows}=await load('../src/game/contact-shadows.js'),scene=new THREE.Scene();
  const boxes=[{id:'table',kind:'table',minX:0,maxX:2,minY:0,maxY:1,minZ:0,maxZ:1},{id:'wall',kind:'wall',minX:0,maxX:3,minY:0,maxY:3,minZ:0,maxZ:.2}];
  const before=structuredClone(boxes),mesh=createContactShadows(scene,boxes);
  assert.equal(mesh.isInstancedMesh,true);assert.equal(mesh.count,1);assert.deepEqual(boxes,before);assert.equal(scene.children.length,1);
 }finally{globalThis.document=old;}
});
