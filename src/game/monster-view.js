import * as THREE from 'three';
import { MONSTERS } from '../logic/chapter.js';

// 原創舊式藍色絨布玩偶：琥珀鈕扣眼、歪斜縫線笑容與長布偶手臂。
export function createMonsterView(scene) {
  const fur=new THREE.MeshLambertMaterial({color:0x276b9c});
  const highlight=new THREE.MeshLambertMaterial({color:0x4a94b1});
  const seam=new THREE.MeshLambertMaterial({color:0xd4ac62});
  const button=new THREE.MeshLambertMaterial({color:0xd59b3b});
  const dark=new THREE.MeshLambertMaterial({color:0x15232c});
  const glass=new THREE.MeshLambertMaterial({color:0xa6d6dc,emissive:0x183038,emissiveIntensity:0.2});
  const bodyGeometry=new THREE.CapsuleGeometry(0.29,0.56,4,8);
  const headGeometry=new THREE.SphereGeometry(0.48,10,8);
  const limbGeometry=new THREE.CapsuleGeometry(0.085,0.62,3,6);
  const legGeometry=new THREE.CapsuleGeometry(0.105,0.38,3,6);
  const handGeometry=new THREE.SphereGeometry(0.16,8,6);
  const eyeGeometry=new THREE.SphereGeometry(0.075,8,6);
  const pupilGeometry=new THREE.SphereGeometry(0.026,6,4);
  const mouthGeometry=new THREE.BoxGeometry(0.34,0.075,0.035);
  const stitchGeometry=new THREE.BoxGeometry(0.045,0.018,0.025);
  const seamGeometry=new THREE.BoxGeometry(0.035,0.48,0.025);
  const models=new Map(MONSTERS.map(definition=>{
    const group=new THREE.Group(),head=new THREE.Group();head.position.y=1.88;group.add(head);
    const mesh=(geometry,material,parent,x,y,z)=>{const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);parent.add(part);return part;};
    const torso=mesh(bodyGeometry,fur,group,0,1.05,0);
    torso.scale.set(1,1.1,0.82);
    mesh(headGeometry,fur,head,0,0,0).scale.set(1,1.04,0.88);
    // 短小不對稱的布耳，讓頭部輪廓更像老舊手縫玩偶。
    mesh(new THREE.SphereGeometry(0.16,7,5),highlight,head,-0.37,0.28,0).scale.set(1,1.5,0.8);
    mesh(new THREE.SphereGeometry(0.12,7,5),highlight,head,0.39,0.22,0).scale.set(1,1.35,0.8);
    mesh(eyeGeometry,button,head,-0.17,0.09,-0.405);
    mesh(pupilGeometry,dark,head,-0.17,0.09,-0.47);
    mesh(eyeGeometry,glass,head,0.16,0.08,-0.41).scale.set(0.78,0.9,0.55);
    mesh(pupilGeometry,dark,head,0.16,0.08,-0.45).scale.set(0.7,0.9,0.7);
    mesh(mouthGeometry,dark,head,0,-0.22,-0.41).rotation.z=-0.08;
    for(const side of [-1,1]) {
      mesh(stitchGeometry,seam,head,side*0.18,-0.2,-0.435).rotation.z=side*0.55;
      mesh(stitchGeometry,seam,head,side*0.18,-0.25,-0.435).rotation.z=side*0.55;
    }
    mesh(seamGeometry,seam,group,0,1.04,-0.245);
    const arms=[-1,1].map(side=>{
      const pivot=new THREE.Group();pivot.position.set(side*0.34,1.38,0);group.add(pivot);
      mesh(limbGeometry,fur,pivot,side*0.13,-0.37,0);
      mesh(handGeometry,highlight,pivot,side*0.15,-0.84,-0.02).scale.set(1,0.92,0.88);
      return pivot;
    });
    const legs=[-1,1].map(side=>{
      const pivot=new THREE.Group();pivot.position.set(side*0.16,0.47,0);group.add(pivot);
      mesh(legGeometry,fur,pivot,0,-0.15,0);
      mesh(handGeometry,highlight,pivot,0,-0.42,-0.05).scale.set(0.95,0.62,1.2);
      return pivot;
    });
    group.visible=false;scene.add(group);
    return [definition.id,{group,head,arms,legs,scale:definition.height/2.4}];
  }));
  return {sync(state){
    for(const [id,model] of models) {
      const monster=state.monsters[id];model.group.visible=monster.mode!=='inactive';
      const chasing=monster.mode==='chase',searching=monster.mode==='search';
      const phase=monster.walkDistance*5,swing=Math.sin(phase)*(chasing?0.38:0.22);
      model.group.position.set(monster.x,0.008*(1-Math.cos(phase*2)),monster.z);
      model.group.rotation.y=monster.yaw;model.group.scale.setScalar(model.scale);
      model.head.rotation.x=chasing?0.12:0;
      model.head.rotation.z=searching?Math.sin(monster.searchElapsed*Math.PI)*0.08:0;
      model.arms[0].rotation.x=(chasing?-0.2:0)+swing;
      model.arms[1].rotation.x=(chasing?-0.2:0)-swing;
      model.legs[0].rotation.x=swing*0.65;model.legs[1].rotation.x=-swing*0.65;
    }
  }};
}
