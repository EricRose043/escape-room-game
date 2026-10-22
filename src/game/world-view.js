import * as THREE from 'three';
import { WORLD, STATIC_BOXES, SURFACES, DOORS, isDoorOpen, getActiveLights } from '../logic/world.js';
import { DEVICES, isDevicePowered, powerProgress } from '../logic/chapter.js';

export function createWorldView(scene) {
  const palette = {wall:0x586367,table:0x66504c,floor:0x42434a,ceiling:0x343941,fuseBox:0x46525a,keypad:0x58626a,door:0x5d6964,
    machine:0x577b75,locker:0x4d646d,lockerDoor:0x6d8589,trim:0x273c42};
  const materials = Object.fromEntries(Object.entries(palette).map(([kind,color])=>[kind,new THREE.MeshLambertMaterial({color})]));
  const addBox = (b,kind=b.kind) => {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ),materials[kind]);
    mesh.position.set((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,(b.minZ+b.maxZ)/2);
    scene.add(mesh);return mesh;
  };
  for(const b of [...STATIC_BOXES,...SURFACES]) addBox(b);
  // 裝飾沿同一 AABB 建立，不新增碰撞規則或可操作的生產線謎題。
  for(const machine of STATIC_BOXES.filter(b=>b.kind==='machine')) {
    addBox({...machine,minX:machine.minX+0.1,maxX:machine.maxX-0.1,minY:1.05,maxY:1.2,
      minZ:machine.maxZ,maxZ:machine.maxZ+0.012},'trim');
    addBox({...machine,minX:machine.minX+0.1,maxX:machine.maxX-0.1,minY:machine.maxY-0.01,maxY:machine.maxY+0.006,
      minZ:machine.minZ+0.1,maxZ:machine.maxZ-0.1},'trim');
  }
  for(const locker of DEVICES.filter(d=>d.kind==='locker')) {
    const b=locker.bounds,width=b.maxX-b.minX,height=b.maxY-b.minY;
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(width-0.1,height-0.12),materials.lockerDoor);
    panel.position.set((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,b.maxZ+0.006);scene.add(panel);
    const slot=new THREE.Mesh(new THREE.PlaneGeometry(width*0.6,0.09),materials.trim);
    slot.position.set((b.minX+b.maxX)/2,b.minY+height*0.76,b.maxZ+0.008);scene.add(slot);
    addBox({minX:b.maxX-0.18,maxX:b.maxX-0.12,minY:b.minY+0.92,maxY:b.minY+1.12,
      minZ:b.maxZ,maxZ:b.maxZ+0.025},'trim');
  }
  const doors=new Map(DOORS.map(d=>[d.id,addBox(d.bounds,'door')]));
  for(const area of WORLD.areas) {
    for(const sign of area.signs) {
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#1a242a';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#c2c5b4';ctx.font='bold 78px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(sign.text,canvas.width/2,canvas.height/2,canvas.width-32);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(sign.width,sign.height),new THREE.MeshBasicMaterial({map:texture}));
      const p=sign.position,n=sign.normal;
      mesh.position.set(p.x,p.y,p.z);mesh.lookAt(p.x+n.x,p.y+n.y,p.z+n.z);scene.add(mesh);
    }
    for(const light of area.lights) {
      const p=light.position;
      addBox({minX:p.x-0.35,maxX:p.x+0.35,minY:p.y+0.2,maxY:p.y+0.28,minZ:p.z-0.2,maxZ:p.z+0.2},'ceiling');
    }
  }
  // 指示燈使用獨立發光材質，不新增光源；位置從電箱 bounds 導出。
  const indicators = new Map(DEVICES.filter(device=>device.kind==='fuseBox').map(device=>{
    const b=device.bounds;
    const material=new THREE.MeshLambertMaterial({color:0x28342d,emissive:0x000000,emissiveIntensity:0.45});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.12,0.12),material);
    mesh.position.set(b.minX-0.012,b.maxY-0.18,(b.minZ+b.maxZ)/2);
    scene.add(mesh);
    return [device.id,material];
  }));
  // 場景數字鍵是外觀；實際操作由獨立 DOM 面板提供。
  for(const device of DEVICES.filter(device=>device.kind==='keypad')) {
    const b=device.bounds;
    for(let row=0;row<4;row++) for(let col=0;col<3;col++) {
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.055,0.07),materials.door);
      mesh.position.set(b.minX-0.012,b.maxY-0.1-row*0.09,b.minZ+0.1+col*0.1);
      scene.add(mesh);
    }
  }
  // 固定池：新增區域不會讓啟用 PointLight 隨區域數量成長。
  const lights=Array.from({length:2},()=>{const light=new THREE.PointLight();light.castShadow=false;light.visible=false;scene.add(light);return light;});
  return {
    sync(state) {
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
