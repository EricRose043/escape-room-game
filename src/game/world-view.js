import * as THREE from 'three';
import { WORLD, STATIC_BOXES, SURFACES, DOORS, isDoorOpen, getActiveLights } from '../logic/world.js';

export function createWorldView(scene) {
  const palette = {wall:0x586367,table:0x66504c,floor:0x42434a,ceiling:0x343941,fuseBox:0x46525a,keypad:0x58626a,door:0x5d6964};
  const materials = Object.fromEntries(Object.entries(palette).map(([kind,color])=>[kind,new THREE.MeshLambertMaterial({color})]));
  const addBox = (b,kind=b.kind) => {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ),materials[kind]);
    mesh.position.set((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,(b.minZ+b.maxZ)/2);
    scene.add(mesh);return mesh;
  };
  for(const b of [...STATIC_BOXES,...SURFACES]) addBox(b);
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
  // 固定池：新增區域不會讓啟用 PointLight 隨區域數量成長。
  const lights=Array.from({length:2},()=>{const light=new THREE.PointLight();light.castShadow=false;light.visible=false;scene.add(light);return light;});
  return {
    sync(state) {
      for(const door of DOORS) doors.get(door.id).visible=!isDoorOpen(door,state);
      const active=getActiveLights(state.player);
      for(const [i,light] of lights.entries()) {
        const data=active[i];light.visible=Boolean(data);
        if(!data) continue;
        light.position.set(data.position.x,data.position.y,data.position.z);
        light.color.setHex(data.color);light.distance=data.distance;
        light.intensity=state.puzzles[data.powerPuzzleId]?.restored?data.onIntensity:data.offIntensity;
      }
    },
  };
}
