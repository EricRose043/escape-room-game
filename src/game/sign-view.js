import * as THREE from 'three';
import { planMountedSign,wrapSignText } from './sign-design.js';
import { viewRay,rayBoxDistance } from '../logic/interaction.js';

function drawSign(plan){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(180,Math.round(1024*plan.height/plan.width));
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  const paper=['paper','warning','clue'].includes(plan.kind);
  if(paper){
    // Paper silhouette and corner tape, rather than a uniform rectangular UI panel.
    ctx.fillStyle=plan.kind==='warning'?'#c5b47b':'#d1c5a2';ctx.beginPath();
    ctx.moveTo(22,15);ctx.lineTo(w-25,20);ctx.lineTo(w-14,h-36);ctx.lineTo(w-80,h-15);ctx.lineTo(32,h-23);ctx.closePath();ctx.fill();
    ctx.fillStyle='#443e2820';for(let i=0;i<64;i++)ctx.fillRect((i*137)%w,(i*71)%h,2+(i%7),1);
    ctx.fillStyle='#b8a675b8';ctx.fillRect(65,3,146,37);ctx.fillRect(w-220,h-40,146,35);
    ctx.fillStyle='#6d6244';ctx.font='500 26px system-ui';ctx.textAlign='left';ctx.fillText(plan.id==='bay.train-formula'?'列車發車 / 檢修規則':plan.kind==='warning'?'注意 / 維修提醒':plan.kind==='clue'?'檢修紀錄':'工廠內部文件',64,76);
    const lines=wrapSignText(plan.text,12),font=Math.min(63,(h-115)/(lines.length*1.35));
    ctx.font=`500 ${font}px "Microsoft JhengHei",sans-serif`;ctx.fillStyle='#303b33';
    for(const [i,line] of lines.entries())ctx.fillText(line,64,122+i*font*1.35);
  }else if(plan.kind==='diagram'){
    const colors=['#b15845','#d1b34a','#68936f','#5f90a6'],names=['紅','黃','綠','藍'];
    for(let i=0;i<4;i++){
      const x=130+i*255;ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(x,h*.44,h*.2,0,7);ctx.fill();
      ctx.fillStyle='#dcd1ad';ctx.font=`600 ${Math.round(h*.2)}px system-ui`;ctx.textAlign='center';ctx.fillText(names[i],x,h*.87);
      if(i<3){ctx.font=`${Math.round(h*.21)}px system-ui`;ctx.fillText('→',x+125,h*.52);}
    }
  }else{
    const lines=plan.text.split(/\n|｜/),font=Math.min(105,w/(Math.max(...lines.map(s=>Array.from(s).length))+1.5),(h-24)/(lines.length*1.2));
    ctx.fillStyle='#d5c9a2';ctx.font=`700 ${font}px "Microsoft JhengHei",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    lines.forEach((line,i)=>ctx.fillText(line,w/2,h/2+(i-(lines.length-1)/2)*font*1.12));
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return new THREE.Mesh(new THREE.PlaneGeometry(plan.width,plan.height),new THREE.MeshLambertMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
}

export function createSignView(scene,areas,boxes,materials){
  const records=[];
  for(const sign of areas.flatMap(a=>a.signs)){
    const plan=planMountedSign(sign,boxes);if(!plan)continue;
    const mesh=drawSign(plan),p=plan.position,n=plan.normal;
    mesh.position.set(p.x,p.y,p.z);mesh.lookAt(p.x+n.x,p.y+n.y,p.z+n.z);mesh.name=sign.id;scene.add(mesh);
    records.push({...plan,mesh});
  }
  function createClueMesh(clue){
    const p=clue.position,n=clue.normal;
    if(clue.id==='power.uv-code'){
      const plan=planMountedSign(clue,boxes);if(!plan)return null;
      const ink=drawSign({...plan,kind:'stencil'}),a=plan.position;
      ink.material.emissive.setHex(0x72b94a);ink.material.emissiveIntensity=.6;
      ink.position.set(a.x,a.y,a.z);ink.lookAt(a.x+n.x,a.y+n.y,a.z+n.z);scene.add(ink);
      records.push({...plan,kind:'clue',mesh:ink});return ink;
    }
    const mesh=drawSign({...clue,kind:'clue'});
    mesh.position.set(p.x,p.y,p.z);mesh.lookAt(p.x+n.x,p.y+n.y,p.z+n.z);scene.add(mesh);
    const support=new THREE.Group();support.position.copy(mesh.position);support.quaternion.copy(mesh.quaternion);
    const blank=drawSign({...clue,text:'',kind:'clue'});blank.position.z=-.003;support.add(blank);
    const reverse={origin:p,direction:{x:-n.x,y:0,z:-n.z}};
    let distance=Infinity;
    for(const b of boxes.filter(b=>b.kind==='wall')){const hit=rayBoxDistance(reverse,b);if(hit!==null)distance=Math.min(hit,distance);}
    const add=(w,h,d,x,y,z)=>{const part=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.trim);part.position.set(x,y,z);support.add(part);};
    if(distance<.8){
      for(const x of [-clue.width*.35,clue.width*.35])add(.012,.012,Math.max(.008,distance),x,0,-distance/2);
    }else{
      const area=areas.find(a=>p.x>=a.bounds.minX&&p.x<=a.bounds.maxX&&p.z>=a.bounds.minZ&&p.z<=a.bounds.maxZ);
      const length=Math.max(.05,(area?.height??3.5)-p.y-clue.height/2);
      for(const x of [-clue.width*.35,clue.width*.35])add(.009,length,.009,x,clue.height/2+length/2,0);
    }
    scene.add(support);records.push({...clue,kind:'clue',mesh});return mesh;
  }
  function readingTarget(player,blockers){
    const ray=viewRay(player);let nearest=null;
    for(const r of records){
      if(!r.mesh.visible||!['paper','warning','clue','diagram'].includes(r.kind))continue;
      const n=r.normal,p=r.position,o=ray.origin,d=ray.direction;
      const dot=d.x*n.x+d.y*n.y+d.z*n.z;if(dot>=-.05)continue;
      const t=((p.x-o.x)*n.x+(p.y-o.y)*n.y+(p.z-o.z)*n.z)/dot;
      if(t<0||t>3.2||(nearest&&t>=nearest.distance))continue;
      const horizontal=n.x?o.z+d.z*t-p.z:o.x+d.x*t-p.x;
      if(Math.abs(horizontal)>r.width/2||Math.abs(o.y+d.y*t-p.y)>r.height/2)continue;
      if(blockers.some(b=>{const hit=rayBoxDistance(ray,b);return hit!==null&&hit<t-.025;}))continue;
      nearest={text:r.text,id:r.id,distance:t};
    }
    return nearest;
  }
  return {createClueMesh,readingTarget};
}
