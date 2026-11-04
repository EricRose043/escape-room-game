import * as THREE from 'three';
import { WORLD, STATIC_BOXES, SURFACES, DOORS, isDoorOpen, getActiveLights, getGeometry } from '../logic/world.js';
import { DEVICES, isDevicePowered, powerProgress, selectChapterTarget } from '../logic/chapter.js';
import { createArtMaterials } from './art-materials.js';
import { createEnvironmentArt, decorateDoor, createTrainArt } from './environment-art.js';
import { createItemArt, createHeldTorch } from './item-art.js';
import { createPresentationUI } from './presentation-ui.js';
import { createSignView } from './sign-view.js';
import { createTrainCinematicView } from './train-cinematic-view.js';
import {createContactShadows} from './contact-shadows.js';

export function createWorldView(scene) {
  const art=createArtMaterials(),materials=art.palette;
  createContactShadows(scene,STATIC_BOXES);
  let heldTorch=null,cinematic=null;
  const presentationUI=createPresentationUI();
  const signs=createSignView(scene,WORLD.areas,STATIC_BOXES,materials);
  const addBox = (b,kind=b.kind) => {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ),materials[kind]??materials.trim);
    mesh.position.set((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,(b.minZ+b.maxZ)/2);
    scene.add(mesh);return mesh;
  };
  // logic 保留完整櫃體遮擋，畫面改用有厚度的薄板，櫃內也看得到板面。
  // Device/furniture AABBs are invisible interaction/collision proxies. Their
  // actual construction is provided by the detailed environment model below.
  const modeledKinds=new Set(['locker','sequenceButton','train','table','machine','fuseBox','keypad','trainConsole','trainCard','clueNote']);
  for(const b of [...STATIC_BOXES.filter(b=>!modeledKinds.has(b.kind)),...SURFACES]) addBox(b);
  const sequenceMaterials=new Map(DEVICES.filter(d=>d.kind==='sequenceButton').map(d=>{
    const b=d.bounds,colors={red:0xc96161,yellow:0xe7c55d,green:0x6aad88,blue:0x6a9bcd};
    const material=new THREE.MeshLambertMaterial({color:colors[d.color],emissive:0});
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(Math.min(b.maxY-b.minY,b.maxZ-b.minZ)*.24,Math.min(b.maxY-b.minY,b.maxZ-b.minZ)*.24,.071,16),material);
    mesh.rotation.z=Math.PI/2;mesh.position.set(b.minX-.11,(b.minY+b.maxY)/2,(b.minZ+b.maxZ)/2);scene.add(mesh);return [d.id,material];
  }));
  const bay=WORLD.areas.find(a=>a.id==='loading-bay'),train=DEVICES.find(d=>d.kind==='train').bounds;
  const trainX=(train.minX+train.maxX)/2,trainZ=(train.minZ+train.maxZ)/2;
  const trainGroup=createTrainArt(scene,train,materials);
  const railMaterial=new THREE.MeshLambertMaterial({color:0x89909a});
  const sleeperMaterial=new THREE.MeshLambertMaterial({color:0x4b3b32});
  // The puzzle counts complete tracks. Each numbered track has TWO rails and
  // its own bed and sleepers: one departure track and one empty service track.
  // The empty track stops 1.35 m short of the north wall's reading walkway.
  const trackCentres=[trainZ,trainZ-3.5],trackX=(bay.bounds.minX+bay.bounds.maxX)/2;
  const sleeperGeometry=new THREE.BoxGeometry(.17,.065,2.3),sleeperCount=Math.floor((bay.bounds.maxX-bay.bounds.minX-1.3)/.55)+1,tieTransform=new THREE.Object3D();
  for(const [trackIndex,centreZ] of trackCentres.entries()){
    const bed=new THREE.Mesh(new THREE.BoxGeometry(13.8,.025,2.3),materials.rubber);bed.position.set(trackX,.013,centreZ);bed.name=`track-${trackIndex+1}-bed`;scene.add(bed);
    for(const z of [centreZ-.95,centreZ+.95])for(const [w,h,y] of [[.17,.024,.07],[.045,.07,.105],[.085,.027,.153]]){
      const rail=new THREE.Mesh(new THREE.BoxGeometry(14,h,w),railMaterial);rail.name=`track-${trackIndex+1}-rail`;rail.position.set(trackX,y,z);scene.add(rail);
    }
    const sleepers=new THREE.InstancedMesh(sleeperGeometry,sleeperMaterial,sleeperCount);sleepers.name=`track-${trackIndex+1}-sleepers`;
    for(let i=0;i<sleeperCount;i++){tieTransform.position.set(bay.bounds.minX+.65+i*.55,.035,centreZ);tieTransform.updateMatrix();sleepers.setMatrixAt(i,tieTransform.matrix);}sleepers.computeBoundingSphere();scene.add(sleepers);
    // Paint adheres to the platform floor; it is neither an airborne label nor
    // an extra rail which could confuse the number of complete tracks.
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,1024,256);ctx.fillStyle=trackIndex?'#b4b8a4':'#e0d1a1';ctx.font='700 152px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(trackIndex?'02  停用線':'01  撤離線',512,128,940);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const paint=new THREE.Mesh(new THREE.PlaneGeometry(3.15,.79),new THREE.MeshLambertMaterial({map:texture,transparent:true,depthWrite:false}));paint.rotation.x=-Math.PI/2;paint.position.set(bay.bounds.minX+2.6,.009,centreZ+1.55);paint.name=`track-${trackIndex+1}-floor-marking`;scene.add(paint);
  }
  scene.userData.railTracks={count:2,railCount:4,centres:trackCentres,northWallWalkway:trackCentres[1]-1.15-bay.bounds.minZ};
  for(const locker of DEVICES.filter(d=>d.kind==='locker')) {
    const b=locker.bounds,t=locker.panelThickness,peek=locker.peek,cx=(b.minX+b.maxX)/2;
    const left=cx-peek.width/2,right=cx+peek.width/2;
    // 正式兩座櫃門皆朝南。窺視縫是真正開口，不貼實心深色平面。
    for(const panel of [
      {...b,maxX:b.minX+t},{...b,minX:b.maxX-t},
      {...b,maxZ:b.minZ+t},{...b,maxY:b.minY+t},{...b,minY:b.maxY-t},
    ]) addBox(panel,'locker');
    for(const panel of [
      {...b,maxX:left},{...b,minX:right},
      {...b,minX:left,maxX:right,maxY:peek.minY},
      {...b,minX:left,maxX:right,minY:peek.maxY},
    ]) addBox({...panel,minZ:b.maxZ-t},'lockerDoor');
    addBox({minX:b.maxX-0.18,maxX:b.maxX-0.12,minY:b.minY+0.92,maxY:b.minY+1.12,
      minZ:b.maxZ,maxZ:b.maxZ+0.025},'trim');
  }
  const doors=new Map(DOORS.map(d=>{const leaf=addBox(d.bounds,'door');scene.remove(leaf);const group=decorateDoor(leaf,d.bounds,materials);scene.add(group);return [d.id,group];}));
  createEnvironmentArt(scene,art);
  // 指示燈使用獨立發光材質，不新增光源；位置從電箱 bounds 導出。
  const indicators = new Map(DEVICES.filter(device=>device.kind==='fuseBox').map(device=>{
    const b=device.bounds;
    const material=new THREE.MeshLambertMaterial({color:0x28342d,emissive:0x000000,emissiveIntensity:0.45});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.12,0.12),material);
    mesh.position.set(b.minX-0.012,b.maxY-0.18,(b.minZ+b.maxZ)/2);
    scene.add(mesh);
    return [device.id,material];
  }));
  // 固定池：新增區域不會讓啟用 PointLight 隨區域數量成長。
  const lights=Array.from({length:2},()=>{const light=new THREE.PointLight();light.castShadow=false;light.visible=false;scene.add(light);return light;});
  return {
    renderCinematic(renderer,state,settings={},session={}){
      if(state.ui.mode==='ending'&&state.ui.variant==='derailment'){
        cinematic??=createTrainCinematicView(renderer);
        return cinematic.render(state,settings,!session.paused);
      }
      cinematic?.reset();return false;
    },
    syncPresentation(state,session,prompt){presentationUI.sync(state,session,prompt,selectChapterTarget(state),session.hasStarted&&!session.paused?signs.readingTarget(state.player,getGeometry(state).occluderBoxes):null);},
    createClueMesh(clue){return signs.createClueMesh(clue);},
    createItemMesh(item){const model=createItemArt(item,materials);scene.add(model);return model;},
    enhanceScene(renderer,camera){
      scene.fog=new THREE.FogExp2(0x181c20,.012);
      scene.background=new THREE.Color(0x10151b);
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
      heldTorch=createHeldTorch(camera,materials);scene.add(camera);
    },
    sync(state) {
      if(heldTorch){
        heldTorch.group.visible=state.inventory.itemIds.includes('lobby.flashlight')&&state.ui.mode==='explore';
        heldTorch.lensMaterial.color.setHex(!state.flashlight.enabled?0x354c50:state.flashlight.mode==='uv'?0xa088ff:0xe2d7b8);
      }
      trainGroup.position.x=trainX+(state.ui.mode==='ending'?(state.ui.elapsed??0)*1.2:state.completed?9.6:0);
      for(const [id,material] of sequenceMaterials)material.emissive.setHex(state.puzzles['production.color-sequence']?.restored?0x284a32:0);
      for(const door of DOORS) doors.get(door.id).visible=!isDoorOpen(door,state);
      for(const device of DEVICES) {
        const material=indicators.get(device.id);
        if(material) {
          const powered=isDevicePowered(state,device);
          material.color.setHex(powered?0x6ba878:0x28342d);
          material.emissive.setHex(powered?0x62b87b:0x000000);
        }
      }
      const active=getActiveLights(state.player);
      for(const [i,light] of lights.entries()) {
        const data=active[i];light.visible=Boolean(data);
        if(!data) continue;
        light.position.set(data.position.x,data.position.y,data.position.z);
        light.color.setHex(data.color);light.distance=data.distance;
        const progress=powerProgress(state,data.powerPuzzleId);
        light.intensity=data.offIntensity+(data.onIntensity-data.offIntensity)*progress;
      }
    },
  };
}
