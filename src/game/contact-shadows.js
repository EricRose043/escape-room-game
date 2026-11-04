import * as THREE from 'three';
// 靜態、柔和的落地遮蔽；不新增即時陰影光源或碰撞體。
export function createContactShadows(scene,boxes){
  const grounded=boxes.filter(b=>['table','machine','locker','train'].includes(b.kind)&&b.minY<=.05);
  if(!grounded.length)return null;
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const c=canvas.getContext('2d'),gradient=c.createRadialGradient(64,64,8,64,64,64);
  if(gradient?.addColorStop){gradient.addColorStop(0,'rgba(0,0,0,.48)');gradient.addColorStop(.55,'rgba(0,0,0,.24)');gradient.addColorStop(1,'rgba(0,0,0,0)');}
  c.fillStyle=gradient??'rgba(0,0,0,.2)';c.fillRect(0,0,128,128);
  const map=new THREE.CanvasTexture(canvas),material=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),material,grounded.length),matrix=new THREE.Matrix4();
  const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  grounded.forEach((b,i)=>{matrix.compose(new THREE.Vector3((b.minX+b.maxX)/2,.012,(b.minZ+b.maxZ)/2),rotation,
    new THREE.Vector3((b.maxX-b.minX)*1.35,(b.maxZ-b.minZ)*1.35,1));mesh.setMatrixAt(i,matrix);});
  mesh.name='floor-contact-shadows';mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);return mesh;
}
