import * as THREE from 'three';
import { STATIC_BOXES } from '../logic/world.js';

export function createItemArt(item,p){
  const g=new THREE.Group(),w=item.maxX-item.minX,h=item.maxY-item.minY,d=item.maxZ-item.minZ;
  g.position.set((item.minX+item.maxX)/2,(item.minY+item.maxY)/2,(item.minZ+item.maxZ)/2);
  const mesh=(geometry,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);g.add(m);return m;};
  const box=(a,b,c,x,y,z,mat)=>mesh(new THREE.BoxGeometry(a,b,c),mat,x,y,z);
  if(item.kind==='flashlight'){
    g.position.y=item.minY+w*.27+.008;
    const tube=mesh(new THREE.CylinderGeometry(.085,.09,d*.72,18),p.trim,0,0,.03);tube.rotation.x=Math.PI/2;
    const cone=mesh(new THREE.CylinderGeometry(w*.27,.085,.1,20),p.brass,0,0,-d*.3);cone.rotation.x=Math.PI/2;
    const rim=mesh(new THREE.CylinderGeometry(w*.29,w*.29,.035,20),p.trim,0,0,-d*.45);rim.rotation.x=Math.PI/2;
    const reflector=mesh(new THREE.CylinderGeometry(w*.25,w*.19,.021,20),p.steel,0,0,-d*.48);reflector.rotation.x=Math.PI/2;
    const lens=mesh(new THREE.CylinderGeometry(w*.235,w*.235,.008,20),p.glass,0,0,-d*.516);lens.rotation.x=Math.PI/2;
    const diode=mesh(new THREE.CylinderGeometry(.027,.027,.008,12),p.cream,0,0,-d*.518);diode.rotation.x=Math.PI/2;
    for(let z=-.07;z<.16;z+=.045){const grip=mesh(new THREE.TorusGeometry(.109,.01,4,14),p.rubber,0,0,z);}
    box(.07,.015,.105,0,.091,.035,p.black);box(.045,.018,.055,0,.108,.035,p.red);
    for(const x of [-.025,.025])for(const z of [0,.07]){const screw=mesh(new THREE.CylinderGeometry(.006,.006,.006,8),p.steel,x,.102,z);}
    const end=mesh(new THREE.CylinderGeometry(.092,.092,.026,18),p.brass,0,0,d*.45);end.rotation.x=Math.PI/2;
    const loop=mesh(new THREE.TorusGeometry(.026,.008,5,12),p.trim,0,0,d*.51);loop.rotation.y=Math.PI/2;
  }else if(item.kind==='battery'||item.kind==='fuse'){
    const fuse=item.kind==='fuse';
    mesh(new THREE.CylinderGeometry(w*.38,w*.38,h*.72,14),fuse?p.glass:p.hazard);
    for(const side of [-1,1])mesh(new THREE.CylinderGeometry(w/2,w/2,h*.12,14),p.brass,0,side*h*.44);
    if(fuse){
      box(.023,h*.72,.023,0,0,0,p.copper);
      for(const side of [-1,1])mesh(new THREE.CylinderGeometry(w*.22,w*.22,h*.07,14),p.steel,0,side*h*.515);
      for(const y of [-.07,0,.07]){const spiral=mesh(new THREE.TorusGeometry(.038,.006,5,12),p.copper,0,y,0);spiral.rotation.x=Math.PI/2;}
    }else {
      box(.045,.14,.012,0,0,-d*.39,p.cream);box(.12,.04,.012,0,0,-d*.39,p.cream);
      mesh(new THREE.CylinderGeometry(w*.2,w*.2,.025,14),p.steel,0,h*.53,0);
      for(const y of [-h*.26,h*.26]){const line=mesh(new THREE.TorusGeometry(w*.385,.006,5,16),p.black,0,y,0);line.rotation.x=Math.PI/2;}
      box(.07,.045,.013,0,-h*.23,-d*.39,p.black);
    }
  }else{
    const card=item.kind==='keycard';
    box(w,card?.006:.003,d,0,0,0,p.cream);
    box(w*.96,.001,d*.95,0,card?.0036:.002,0,card?p.train:p.clueNote);
    if(card){
      box(w*.3,.001,d*.4,-w*.25,.0045,0,p.black);
      const head=mesh(new THREE.SphereGeometry(.022,10,6),p.cream,-w*.25,.005,-d*.08);head.scale.y=.04;
      box(w*.19,.001,d*.12,-w*.25,.005,d*.08,p.cream);
      for(let z=-d*.3;z<d*.3;z+=.035)box(w*.4,.001,.009,w*.15,.005,z,p.black);
      box(w*.78,.001,.025,0,.005,d*.29,p.brass);
      for(const x of [-w*.18,w*.18]){const clip=mesh(new THREE.TorusGeometry(.012,.004,4,10),p.steel,x,.006,d*.29);clip.rotation.x=Math.PI/2;}
      box(w*.17,.002,.015,0,.005,d*.39,p.black);
    }else{
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#d4c9a6';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#43564d';ctx.lineWidth=8;ctx.strokeRect(22,22,468,468);ctx.lineWidth=3;
      for(const [x,z,a,b] of [[50,105,130,145],[205,105,120,145],[350,105,110,145],[50,290,180,130],[270,290,190,130]])ctx.strokeRect(x,z,a,b);
      ctx.setLineDash([10,7]);ctx.strokeStyle='#9e543d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(105,175);ctx.lineTo(270,175);ctx.lineTo(270,350);ctx.lineTo(400,350);ctx.stroke();
      ctx.setLineDash([]);ctx.fillStyle='#35493f';ctx.font='bold 28px sans-serif';ctx.fillText('FACTORY / 01',50,70);ctx.font='16px sans-serif';ctx.fillText('EMERGENCY EVACUATION',50,465);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const print=mesh(new THREE.PlaneGeometry(w*.94,d*.94),new THREE.MeshLambertMaterial({map:texture}),0,.0027,0);print.rotation.x=-Math.PI/2;
      // A subtle central fold gives the sheet physical thickness without
      // turning the map into an oversized solid block.
      box(.001,.0005,d*.94,0,.0031,0,p.cream);
    }
  }
  // Place the real mesh bottom on the actual support, instead of using the
  // deliberately generous interaction AABB's centre as its visible height.
  const support=STATIC_BOXES.find(b=>b.kind==='table'&&g.position.x>=b.minX&&g.position.x<=b.maxX&&g.position.z>=b.minZ&&g.position.z<=b.maxZ);
  const bottom=new THREE.Box3().setFromObject(g).min.y;
  g.position.y+=(support?.maxY??item.minY)-bottom+.002;
  return g;
}

export function createHeldTorch(camera,p){
  const group=new THREE.Group();group.position.set(.28,-.25,-.46);group.rotation.set(.08,-.12,-.1);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.045,.039,.28,14),p.trim);body.rotation.x=Math.PI/2;group.add(body);
  const head=new THREE.Mesh(new THREE.CylinderGeometry(.07,.052,.11,16),p.brass);head.rotation.x=Math.PI/2;head.position.z=-.18;group.add(head);
  for(const z of [-.142,-.2,-.23]){const bezel=new THREE.Mesh(new THREE.TorusGeometry(z===-.142?.054:.07,.007,5,18),p.trim);bezel.position.z=z;group.add(bezel);}
  const lensMaterial=new THREE.MeshBasicMaterial({color:0xded3ab});
  const lens=new THREE.Mesh(new THREE.CircleGeometry(.057,18),lensMaterial);lens.rotation.y=Math.PI;lens.position.z=-.237;group.add(lens);
  for(let z=-.08;z<.12;z+=.045){const ring=new THREE.Mesh(new THREE.TorusGeometry(.046,.006,4,12),p.rubber);ring.position.z=z;group.add(ring);}
  const switchPlate=new THREE.Mesh(new THREE.BoxGeometry(.042,.012,.075),p.black);switchPlate.position.set(0,.045,-.01);group.add(switchPlate);
  const switchButton=new THREE.Mesh(new THREE.BoxGeometry(.027,.013,.039),p.red);switchButton.position.set(0,.057,-.01);group.add(switchButton);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.044,.044,.025,16),p.brass);cap.rotation.x=Math.PI/2;cap.position.z=.15;group.add(cap);
  group.visible=false;camera.add(group);return {group,lensMaterial};
}
