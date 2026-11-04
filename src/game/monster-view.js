import * as THREE from 'three';
import { MONSTERS } from '../logic/chapter.js';
import { createArtMaterials } from './art-materials.js';
import { dollExpression } from './doll-expression.js';
import {monsterPresentation} from '../logic/encounter-recovery.js';

// 原創舊式藍色絨布玩偶：琥珀鈕扣眼、歪斜縫線笑容與長布偶手臂。
export function createMonsterView(scene) {
  const art=createArtMaterials();
  const fur=art.material('fabric',0x91b5e7);
  const highlight=art.material('fabric',0xbcd5d9);
  const patch=art.material('fabric',0xf4d9a3);
  const seam=new THREE.MeshLambertMaterial({color:0xd4ac62});
  const button=new THREE.MeshLambertMaterial({color:0xd59b3b});
  const dark=new THREE.MeshLambertMaterial({color:0x15232c});
  const glass=new THREE.MeshLambertMaterial({color:0xa6d6dc,emissive:0x183038,emissiveIntensity:0.2});
  const bodyGeometry=new THREE.CapsuleGeometry(0.29,0.56,6,14);
  const headGeometry=new THREE.SphereGeometry(0.48,24,18);
  const limbGeometry=new THREE.CapsuleGeometry(0.085,0.62,5,10);
  const legGeometry=new THREE.CapsuleGeometry(0.105,0.38,5,10);
  const handGeometry=new THREE.SphereGeometry(0.16,14,10);
  const eyeGeometry=new THREE.SphereGeometry(0.075,8,6);
  const pupilGeometry=new THREE.SphereGeometry(0.026,6,4);
  const stitchGeometry=new THREE.BoxGeometry(0.045,0.018,0.025);
  const seamGeometry=new THREE.BoxGeometry(0.035,0.48,0.025);
  const models=new Map(MONSTERS.map(definition=>{
    const group=new THREE.Group(),head=new THREE.Group();head.position.y=1.88;group.add(head);
    const mesh=(geometry,material,parent,x,y,z)=>{const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);parent.add(part);return part;};
    const torso=mesh(bodyGeometry,fur,group,0,1.05,0);
    torso.scale.set(1,1.1,0.82);
    mesh(headGeometry,fur,head,0,0,0).scale.set(1,1.04,0.88);
    // 短小不對稱的布耳，讓頭部輪廓更像老舊手縫玩偶。
    mesh(new THREE.SphereGeometry(0.16,14,10),highlight,head,-0.37,0.28,0).scale.set(1,1.5,0.8);
    mesh(new THREE.SphereGeometry(0.12,14,10),highlight,head,0.39,0.22,0).scale.set(1,1.35,0.8);
    mesh(new THREE.SphereGeometry(.1,12,8),patch,head,-.37,.3,-.09).scale.set(1,1.35,.35);
    mesh(new THREE.SphereGeometry(.07,12,8),patch,head,.39,.23,-.09).scale.set(1,1.2,.35);
    mesh(new THREE.SphereGeometry(.22,18,12),patch,head,0,-.15,-.37).scale.set(1,.72,.65);
    mesh(new THREE.SphereGeometry(.065,12,8),dark,head,0,-.09,-.52).scale.set(1,.72,.65);
    mesh(eyeGeometry,button,head,-0.17,0.09,-0.405);
    mesh(pupilGeometry,dark,head,-0.17,0.09,-0.47);
    mesh(eyeGeometry,glass,head,0.16,0.08,-0.41).scale.set(0.78,0.9,0.55);
    mesh(pupilGeometry,dark,head,0.16,0.08,-0.45).scale.set(0.7,0.9,0.7);
    // Raised eye rims, button holes and tiny glints make the face readable in
    // torchlight. These are stitched toy parts, including the damaged glass eye.
    for(const x of [-.17,.16]){
      mesh(new THREE.TorusGeometry(.079,.012,6,18),highlight,head,x,.085,-.417);
      mesh(new THREE.SphereGeometry(.012,7,5),art.palette.cream,head,x-.019,.111,-.478);
    }
    for(const x of [-.184,-.156])for(const y of [.076,.104])mesh(new THREE.SphereGeometry(.007,6,4),dark,head,x,y,-.479);
    mesh(stitchGeometry,seam,head,.16,.08,-.468).rotation.z=.7;
    const mouth=mesh(new THREE.SphereGeometry(.18,16,10),dark,head,0,-.25,-.46);mouth.scale.set(1,.1,.4);
    const jaw=new THREE.Group();jaw.position.set(0,-.22,-.33);head.add(jaw);
    mesh(new THREE.SphereGeometry(.19,16,10),patch,jaw,0,-.08,-.12).scale.set(1,.5,.7);
    const toothGeometry=new THREE.ConeGeometry(.018,.065,5),toothMaterial=new THREE.MeshLambertMaterial({color:0xe9dfbe});
    for(let i=0;i<7;i++){
      const x=(i-3)*.043,z=-.505+Math.abs(i-3)*.009;
      mesh(toothGeometry,toothMaterial,head,x,-.225,z).rotation.z=Math.PI;
      mesh(toothGeometry,toothMaterial,jaw,x,-.045,z+.33);
    }
    for(const side of [-1,1]) {
      mesh(stitchGeometry,seam,head,side*0.18,-0.2,-0.435).rotation.z=side*0.55;
      mesh(stitchGeometry,seam,head,side*0.18,-0.25,-0.435).rotation.z=side*0.55;
    }
    mesh(seamGeometry,seam,group,0,1.04,-0.245);
    mesh(new THREE.TorusGeometry(.18,.036,8,22),patch,group,0,1.53,0).rotation.x=Math.PI/2;
    for(const side of [-1,1]){
      const tie=mesh(new THREE.SphereGeometry(.12,12,8),art.palette.rust,group,side*.105,1.47,-.27);
      tie.scale.set(1,.62,.3);tie.rotation.z=side*.22;
    }
    mesh(new THREE.SphereGeometry(.052,12,8),art.palette.brass,group,0,1.47,-.3);
    mesh(new THREE.SphereGeometry(.22,16,12),patch,group,0,1.03,-.23).scale.set(.86,1.28,.35);
    for(const y of [.92,1.12])mesh(new THREE.SphereGeometry(.025,8,6),button,group,0,y,-.316);
    for(let y=.8;y<1.29;y+=.055){
      for(const side of [-1,1])mesh(stitchGeometry,seam,group,side*.18,y,-.275).scale.set(.55,.65,.5);
    }
    for(let x=-.26;x<.3;x+=.05)mesh(stitchGeometry,seam,head,x,.3-Math.abs(x)*.2,-.34).rotation.z=.85;
    const arms=[-1,1].map(side=>{
      const pivot=new THREE.Group();pivot.position.set(side*0.34,1.38,0);group.add(pivot);
      mesh(limbGeometry,fur,pivot,side*0.13,-0.37,0);
      mesh(handGeometry,highlight,pivot,side*0.15,-0.84,-0.02).scale.set(1,0.92,0.88);
      mesh(new THREE.SphereGeometry(.085,12,8),patch,pivot,side*.15,-.84,-.15).scale.set(.85,1,.2);
      for(let finger=0;finger<3;finger++)mesh(stitchGeometry,seam,pivot,side*.15+(finger-1)*.055,-.91,-.145).scale.set(.25,1.9,.35);
      mesh(new THREE.SphereGeometry(.062,10,8),highlight,pivot,side*.28,-.8,-.06).scale.set(.85,1,1);
      return pivot;
    });
    const legs=[-1,1].map(side=>{
      const pivot=new THREE.Group();pivot.position.set(side*0.16,0.47,0);group.add(pivot);
      mesh(legGeometry,fur,pivot,0,-0.15,0);
      mesh(handGeometry,highlight,pivot,0,-0.42,-0.05).scale.set(0.95,0.62,1.2);
      mesh(new THREE.SphereGeometry(.12,12,8),patch,pivot,0,-.455,-.16).scale.set(.8,.28,.45);
      for(const x of [-.06,0,.06])mesh(stitchGeometry,seam,pivot,x,-.41,-.228).scale.set(.25,1.9,.4);
      return pivot;
    });
    group.visible=false;scene.add(group);
    return [definition.id,{group,head,arms,legs,mouth,jaw,mode:null,elapsed:0,scale:definition.height/2.4}];
  }));
  return {sync(state,dt=0,paused=false){
    for(const [id,model] of models) {
      const monster=monsterPresentation(state,id);model.group.visible=monster.mode!=='inactive';
      const chasing=monster.mode==='chase';
      if(model.mode!==monster.mode){model.mode=monster.mode;model.elapsed=0;}
      if(!paused)model.elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
      const face=dollExpression(monster.mode,model.elapsed);
      model.jaw.rotation.x=-face.jaw*.95;model.mouth.scale.y=.08+face.jaw*.75;
      const phase=monster.walkDistance*5,swing=Math.sin(phase)*(chasing?0.38:0.22);
      model.group.position.set(monster.x,0.008*(1-Math.cos(phase*2)),monster.z);
      model.group.rotation.y=monster.yaw;model.group.scale.setScalar(model.scale);
      model.head.rotation.x=chasing?.12-face.lunge:0;
      model.head.rotation.z=face.tilt;
      model.arms[0].rotation.x=-face.reach*.7+swing;
      model.arms[1].rotation.x=-face.reach*.7-swing;
      model.legs[0].rotation.x=swing*0.65;model.legs[1].rotation.x=-swing*0.65;
    }
  }};
}
