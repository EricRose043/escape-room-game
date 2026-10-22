import * as THREE from 'three';
import { MONSTERS } from '../logic/chapter.js';

// 原創糖果工坊值班員：低面數、共用純色材質，建立一次後只更新變換。
export function createMonsterView(scene) {
  const cream=new THREE.MeshLambertMaterial({color:0xeee4cf});
  const mint=new THREE.MeshLambertMaterial({color:0x80bfa6});
  const dark=new THREE.MeshLambertMaterial({color:0x34464b});
  const badge=new THREE.MeshLambertMaterial({color:0xd2b76c});
  const bodyGeometry=new THREE.CylinderGeometry(0.25,0.28,0.95,12);
  const armGeometry=new THREE.CapsuleGeometry(0.065,0.26,2,6);
  const shoeGeometry=new THREE.CapsuleGeometry(0.105,0.08,2,6);
  const eyeGeometry=new THREE.SphereGeometry(0.032,6,4);
  const hatGeometry=new THREE.CylinderGeometry(0.28,0.3,0.13,12);
  const badgeGeometry=new THREE.CylinderGeometry(0.07,0.07,0.012,6);
  const mouthGeometry=new THREE.BoxGeometry(0.105,0.012,0.012);
  // 小型倒角長方體作為糖塊，避免大張嘴或長肢輪廓。
  const shape=new THREE.Shape();
  shape.moveTo(-0.18,-0.13);shape.lineTo(0.18,-0.13);
  shape.lineTo(0.18,0.13);shape.lineTo(-0.18,0.13);shape.closePath();
  const sugarGeometry=new THREE.ExtrudeGeometry(shape,{depth:0.28,steps:1,bevelEnabled:true,
    bevelSegments:1,bevelSize:0.04,bevelThickness:0.04,curveSegments:1});
  sugarGeometry.translate(0,0,-0.14);
  const models=new Map(MONSTERS.map(definition=>{
    const group=new THREE.Group();
    const mesh=(geometry,material,x,y,z)=>{
      const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);group.add(part);return part;
    };
    mesh(bodyGeometry,cream,0,0.735,0);
    mesh(sugarGeometry,cream,0.025,1.36,0);
    mesh(sugarGeometry,cream,-0.025,1.73,0).scale.y=1.5;
    mesh(hatGeometry,mint,-0.025,2.035,0);
    for(const side of [-1,1]) mesh(eyeGeometry,dark,-0.025+side*0.08,1.77,-0.197);
    mesh(mouthGeometry,dark,-0.025,1.63,-0.187);
    const emblem=mesh(badgeGeometry,badge,0,0.94,-0.257);emblem.rotation.x=Math.PI/2;
    const arms=[-1,1].map(side=>mesh(armGeometry,cream,side*0.265,0.89,0));
    const shoes=[-1,1].map(side=>{
      const shoe=mesh(shoeGeometry,mint,side*0.15,0.108,-0.035);
      shoe.rotation.x=Math.PI/2;return shoe;
    });
    group.visible=false;scene.add(group);
    return [definition.id,{group,arms,shoes,scale:definition.height/2.1}];
  }));
  return {
    sync(state) {
      for(const [id,model] of models) {
        const monster=state.monsters[id];
        model.group.visible=monster.mode!=='inactive';
        const phase=monster.walkDistance*5,swing=Math.sin(phase)*0.14;
        model.group.position.set(monster.x,0.008*(1-Math.cos(phase*2)),monster.z);
        // 正面朝 -Z，與 logic 的 yaw=0 完全相同。
        model.group.rotation.y=monster.yaw;model.group.scale.setScalar(model.scale);
        model.arms[0].rotation.x=swing;model.arms[1].rotation.x=-swing;
        model.shoes[0].position.z=-0.035+swing*0.08;
        model.shoes[1].position.z=-0.035-swing*0.08;
      }
    },
  };
}
